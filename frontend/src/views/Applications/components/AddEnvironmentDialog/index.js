import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@material-ui/core";
import { Alert } from "@material-ui/lab";

import { addEnvironmentToApplication, initializeEnvironmentSecrets } from "services/applications";
import { listEnvironments } from "services/environments";
import styles from "./style.module.scss";

const AddEnvironmentDialog = ({ 
  open, 
  onClose, 
  applicationName, 
  organizationId, 
  existingEnvironmentIds = [],
  onSuccess 
}) => {
  const [availableEnvironments, setAvailableEnvironments] = useState([]);
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingEnvironments, setLoadingEnvironments] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && organizationId) {
      fetchAvailableEnvironments();
    }
  }, [open, organizationId]);

  const fetchAvailableEnvironments = async () => {
    if (!organizationId) return;
    
    setLoadingEnvironments(true);
    setError("");
    
    try {
      const response = await listEnvironments(organizationId);
      if (response && response.data) {
        // Filter out environments that are already attached to this application
        const availableEnvs = response.data.filter(env => 
          !existingEnvironmentIds.includes(env.id)
        );
        setAvailableEnvironments(availableEnvs);
      }
    } catch (err) {
      console.error("Error fetching environments:", err);
      setError("Failed to load available environments");
    } finally {
      setLoadingEnvironments(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedEnvironmentId) {
      setError("Please select an environment");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Add environment to application
      const addResponse = await addEnvironmentToApplication(applicationName, selectedEnvironmentId);
      
      if (addResponse && !addResponse.isError) {
        // Initialize secrets for the new environment
        const selectedEnv = availableEnvironments.find(env => env.id === selectedEnvironmentId);
        if (selectedEnv) {
          try {
            await initializeEnvironmentSecrets(applicationName, selectedEnv.name);
          } catch (secretErr) {
            console.warn("Failed to initialize secrets:", secretErr);
            // Don't fail the entire operation if secrets initialization fails
          }
        }
        
        onSuccess();
        onClose();
        setSelectedEnvironmentId("");
      } else {
        setError(addResponse?.message || "Failed to add environment to application");
      }
    } catch (err) {
      console.error("Error adding environment:", err);
      setError(err.response?.data?.message || "Failed to add environment to application");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedEnvironmentId("");
    setError("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle className={styles.dialog__title}>
        Add Environment to Application
      </DialogTitle>
      
      <DialogContent className={styles.dialog__content}>
        {error && (
          <Alert severity="error" className={styles.dialog__error}>
            {error}
          </Alert>
        )}

        <div className={styles.dialog__form}>
          <p className={styles.dialog__description}>
            Select an environment from your organization to add to this application.
            Environments already attached to this application are not shown.
          </p>

          <FormControl fullWidth className={styles.dialog__input}>
            <InputLabel>Available Environments</InputLabel>
            <Select
              value={selectedEnvironmentId}
              onChange={(e) => setSelectedEnvironmentId(e.target.value)}
              disabled={loading || loadingEnvironments}
            >
              {loadingEnvironments ? (
                <MenuItem disabled>
                  <CircularProgress size={20} /> Loading environments...
                </MenuItem>
              ) : availableEnvironments.length > 0 ? (
                availableEnvironments.map((env) => (
                  <MenuItem key={env.id} value={env.id}>
                    {env.name} {env.vpc_id && `(${env.vpc_id})`}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>
                  No available environments found
                </MenuItem>
              )}
            </Select>
          </FormControl>

          {availableEnvironments.length === 0 && !loadingEnvironments && (
            <Alert severity="info" className={styles.dialog__info}>
              All environments in your organization are already attached to this application.
            </Alert>
          )}
        </div>
      </DialogContent>

      <DialogActions className={styles.dialog__actions}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading || !selectedEnvironmentId || loadingEnvironments}
          color="primary"
          variant="contained"
        >
          {loading ? <CircularProgress size={20} /> : "Add Environment"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddEnvironmentDialog;
