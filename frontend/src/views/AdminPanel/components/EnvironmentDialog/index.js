import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@material-ui/core";
import { Alert } from "@material-ui/lab";

import { createEnvironment, updateEnvironment, deleteEnvironment } from "services/environments";
import { listVpcs } from "services/cloudAccounts";
import { getUserPayload } from "config/helper";
import styles from "./style.module.scss";

const EnvironmentDialog = ({ open, onClose, environment, organization, cloudAccount, mode, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    vpcId: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [vpcs, setVpcs] = useState([]);
  const [loadingVpcs, setLoadingVpcs] = useState(false);

  useEffect(() => {
    if (environment && mode === "edit") {
      setFormData({
        name: environment.name || "",
        vpcId: environment.vpcId || ""
      });
    } else {
      setFormData({
        name: "",
        vpcId: ""
      });
    }
    setError("");
    
    // Fetch VPCs when dialog opens and we have a cloud account
    if (open && cloudAccount) {
      fetchVpcs();
    }
  }, [environment, mode, open, cloudAccount]);

  const fetchVpcs = async () => {
    if (!cloudAccount) return;
    
    setLoadingVpcs(true);
    try {
      const response = await listVpcs(cloudAccount.id);
      setVpcs(response?.data || []);
    } catch (err) {
      console.error("Error fetching VPCs:", err);
      setError("Failed to load VPCs. Please try again.");
    } finally {
      setLoadingVpcs(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Prevent spaces in environment name
    if (name === 'name' && value.includes(' ')) {
      setError("Environment name cannot contain spaces");
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError("");
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError("Environment name is required");
      return;
    }

    if (formData.name.includes(' ')) {
      setError("Environment name cannot contain spaces");
      return;
    }

    if (!cloudAccount) {
      setError("Cloud account is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Get user information for metadata
      const userPayload = getUserPayload();
      const userEmail = userPayload?.user?.email || userPayload?.email || "unknown@example.com";
      
      // Create metadata automatically
      const metadata = {
        "created_by": userEmail,
        "date_created": new Date().toISOString()
      };

      // For edit mode, preserve existing metadata and add updated info
      if (mode === "edit" && environment?.metadata) {
        metadata.updated_by = userEmail;
        metadata.date_updated = new Date().toISOString();
        // Merge with existing metadata
        Object.assign(metadata, environment.metadata);
      }

      const data = {
        name: formData.name.trim(),
        cloud_account_id: cloudAccount.id,
        vpc_id: formData.vpcId || null,
        metadata
      };

      let response;
      if (mode === "create") {
        response = await createEnvironment(organization.id, data);
      } else if (mode === "edit") {
        response = await updateEnvironment(environment.id, data);
      }

      if (response && response.data) {
        onSuccess();
        onClose();
      } else {
        setError("Operation failed. Please try again.");
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err.response?.data?.message || "Operation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete the environment "${environment.name}"? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      await deleteEnvironment(environment.id);
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error:", err);
      setError(err.response?.data?.message || "Failed to delete environment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "create": return "Create Environment";
      case "edit": return "Edit Environment";
      case "delete": return "Delete Environment";
      default: return "Environment";
    }
  };

  const isDeleteMode = mode === "delete";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle className={styles["dialog__title"]}>
        {getTitle()}
      </DialogTitle>
      
      <DialogContent className={styles["dialog__content"]}>
        {error && (
          <Alert severity="error" className={styles["dialog__error"]}>
            {error}
          </Alert>
        )}

        {isDeleteMode ? (
          <div className={styles["dialog__delete-content"]}>
            <p>Are you sure you want to delete the environment <strong>"{environment?.name}"</strong>?</p>
            <p>This action cannot be undone.</p>
          </div>
        ) : (
          <div className={styles["dialog__form"]}>
            <TextField
              name="name"
              label="Environment Name"
              value={formData.name}
              onChange={handleInputChange}
              fullWidth
              required
              className={styles["dialog__input"]}
              placeholder="Enter environment name"
              disabled={loading}
            />

        <FormControl fullWidth className={styles["dialog__input"]}>
          <InputLabel>VPC</InputLabel>
          <Select
            name="vpcId"
            value={formData.vpcId}
            onChange={handleInputChange}
            label="VPC"
            disabled={loading || loadingVpcs}
          >
            {vpcs.map((vpc) => (
              <MenuItem key={vpc.id} value={vpc.id}>
                {vpc.name} ({vpc.id})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
    )}
      </DialogContent>

      <DialogActions className={styles["dialog__actions"]}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        {isDeleteMode ? (
          <Button
            onClick={handleDelete}
            disabled={loading}
            color="secondary"
            variant="contained"
          >
            {loading ? <CircularProgress size={20} /> : "Delete"}
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={loading || !formData.name.trim()}
            color="primary"
            variant="contained"
          >
            {loading ? <CircularProgress size={20} /> : (mode === "create" ? "Create" : "Update")}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default EnvironmentDialog;
