import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import { Business, CheckCircle } from "@material-ui/icons";

import { createEnvironment } from "services/environments";
import { listVpcs } from "services/cloudAccounts";
import { getUserPayload } from "config/helper";
import styles from "./style.module.scss";

const EnvironmentSetup = ({ organizationId, cloudAccountId, onComplete, onBack }) => {
  const [formData, setFormData] = useState({
    name: "",
    vpc_id: "",
  });
  const [loading, setLoading] = useState(false);
  const [loadingVpcs, setLoadingVpcs] = useState(false);
  const [vpcs, setVpcs] = useState([]);
  const [error, setError] = useState("");

  // Load VPCs when cloudAccountId is available
  useEffect(() => {
    if (cloudAccountId) {
      loadVpcs();
    }
  }, [cloudAccountId]);

  const loadVpcs = async () => {
    setLoadingVpcs(true);
    try {
      const response = await listVpcs(cloudAccountId);
      if (response && response.data) {
        setVpcs(response.data);
      }
    } catch (err) {
      console.error("Error loading VPCs:", err);
      setError("Failed to load VPCs");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError("Environment name is required");
      return;
    }

    if (formData.name.includes(' ')) {
      setError("Environment name cannot contain spaces");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Get user email for metadata
      const userPayload = getUserPayload();
      const userEmail = userPayload?.user?.email || userPayload?.email || "unknown@example.com";
      
      // Create metadata automatically
      const metadata = {
        "created_by": userEmail,
        "date_created": new Date().toISOString()
      };
      
      const response = await createEnvironment(organizationId, {
        name: formData.name.trim(),
        vpc_id: formData.vpc_id || null,
        cloud_account_id: cloudAccountId,
        metadata
      });

      if (response && response.data) {
        onComplete();
      } else {
        setError("Failed to create environment");
      }
    } catch (err) {
      console.error("Error creating environment:", err);
      setError(err.response?.data?.message || "Failed to create environment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className={styles["environment-setup"]}>
      <Card className={styles["environment-setup__card"]}>
        <CardContent>
          <Box className={styles["environment-setup__header"]}>
            <Business className={styles["environment-setup__icon"]} />
            <Typography variant="h5" className={styles["environment-setup__title"]}>
              Create Environment
            </Typography>
          </Box>
          
          <Typography variant="body1" className={styles["environment-setup__description"]}>
            Environments are isolated spaces where you can deploy and manage your applications. 
            Each environment is connected to a cloud account and can have its own configuration.
          </Typography>

          <Box className={styles["environment-setup__success"]}>
            <CheckCircle className={styles["environment-setup__success-icon"]} />
            <Typography variant="body2" className={styles["environment-setup__success-text"]}>
              Cloud account connected successfully! Now let's create your first environment.
            </Typography>
          </Box>

          <Box className={styles["environment-setup__form"]}>
            <form onSubmit={handleSubmit}>
              <TextField
                name="name"
                label="Environment Name *"
                value={formData.name}
                onChange={handleInputChange}
                fullWidth
                required
                className={styles["environment-setup__input"]}
                placeholder="e.g., production, staging, development"
              />

              <FormControl fullWidth className={styles["environment-setup__input"]}>
                <InputLabel>VPC *</InputLabel>
                <Select
                  name="vpc_id"
                  value={formData.vpc_id}
                  onChange={handleInputChange}
                  required
                  disabled={loadingVpcs}
                >
                  {loadingVpcs ? (
                    <MenuItem disabled>
                      <CircularProgress size={20} /> Loading VPCs...
                    </MenuItem>
                  ) : vpcs.length > 0 ? (
                    vpcs.map((vpc) => (
                      <MenuItem key={vpc.id || vpc.vpc_id} value={vpc.vpc_id || vpc.id}>
                        {vpc.name || vpc.vpc_id} {vpc.cidr_block && `(${vpc.cidr_block})`}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>
                      No VPCs found
                    </MenuItem>
                  )}
                </Select>
              </FormControl>

              {error && (
                <Alert severity="error" className={styles["environment-setup__error"]}>
                  {error}
                </Alert>
              )}

              <Box className={styles["environment-setup__actions"]}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading || !formData.name.trim() || !formData.vpc_id || loadingVpcs}
                  endIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
                  className={styles["environment-setup__submit"]}
                >
                  {loading ? "Creating..." : "Create Environment & Complete Setup"}
                </Button>
              </Box>
            </form>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EnvironmentSetup;
