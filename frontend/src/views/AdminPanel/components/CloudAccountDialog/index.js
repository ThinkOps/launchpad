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
  Typography,
} from "@material-ui/core";
import { Alert } from "@material-ui/lab";

import { createCloudAccount, updateCloudAccount, deleteCloudAccount, testCloudAccountConnection } from "services/cloudAccounts";
import { getUserPayload } from "config/helper";
import styles from "./style.module.scss";

const CloudAccountDialog = ({ open, onClose, cloudAccount, organization, mode, onSuccess }) => {
  const [formData, setFormData] = useState({
    provider: "aws",
    account_name: "",
    account_identifier: "",
    access_keys: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState(null);

  const getDefaultAccessKeys = (provider) => {
    switch (provider) {
      case 'aws':
        return [
          { key: 'AWS_ACCESS_KEY_ID', value: '' },
          { key: 'AWS_SECRET_ACCESS_KEY', value: '' },
          { key: 'AWS_REGION', value: '' }
        ];
      case 'gcp':
        return [
          { key: 'GOOGLE_APPLICATION_CREDENTIALS', value: '' },
          { key: 'GCP_PROJECT_ID', value: '' },
          { key: 'GCP_REGION', value: '' }
        ];
      case 'azure':
        return [
          { key: 'AZURE_CLIENT_ID', value: '' },
          { key: 'AZURE_CLIENT_SECRET', value: '' },
          { key: 'AZURE_TENANT_ID', value: '' },
          { key: 'AZURE_SUBSCRIPTION_ID', value: '' }
        ];
      case 'oracle':
        return [
          { key: 'OCI_USER_ID', value: '' },
          { key: 'OCI_TENANCY_ID', value: '' },
          { key: 'OCI_REGION', value: '' },
          { key: 'OCI_KEY_FILE', value: '' }
        ];
      default:
        return [];
    }
  };

  useEffect(() => {
    if (cloudAccount && mode === "edit") {
      setFormData({
        provider: cloudAccount.provider || "aws",
        account_name: cloudAccount.account_name || "",
        account_identifier: cloudAccount.account_identifier || "",
        access_keys: cloudAccount.access_keys || []
      });
    } else {
      setFormData({
        provider: "aws",
        account_name: "",
        account_identifier: "",
        access_keys: getDefaultAccessKeys("aws")
      });
    }
    setError("");
  }, [cloudAccount, mode, open]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'provider') {
      setFormData(prev => ({
        ...prev,
        provider: value,
        access_keys: getDefaultAccessKeys(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    setError("");
  };

  const handleAccessKeyChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      access_keys: prev.access_keys.map((key, i) => 
        i === index ? { ...key, [field]: value } : key
      )
    }));
  };

  const handleTestConnection = async () => {
    // Validate access keys
    const hasEmptyKeys = formData.access_keys.some(key => !key.key.trim() || !key.value.trim());
    if (hasEmptyKeys) {
      setError("All access key fields must be filled to test connection");
      return;
    }

    setTestingConnection(true);
    setError("");
    setConnectionTestResult(null);

    try {
      const response = await testCloudAccountConnection({
        provider: formData.provider,
        access_keys: formData.access_keys
      });

      if (response && response.data) {
        setConnectionTestResult(response.data);
        if (response.data.success) {
          setError("");
        } else {
          setError(`Connection test failed: ${response.data.message}`);
        }
      } else {
        setError("Connection test failed. Please try again.");
      }
    } catch (err) {
      console.error("Error testing connection:", err);
      setError(err.response?.data?.message || "Connection test failed. Please try again.");
      setConnectionTestResult({
        success: false,
        message: err.response?.data?.message || "Connection test failed. Please try again."
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.account_name.trim() || !formData.account_identifier.trim()) {
      setError("Account Name and Account Identifier are required");
      return;
    }

    // Validate access keys
    const hasEmptyKeys = formData.access_keys.some(key => !key.key.trim() || !key.value.trim());
    if (hasEmptyKeys) {
      setError("All access key fields must be filled");
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

      // For edit mode, preserve existing metadata and add updated info
      if (mode === "edit" && cloudAccount?.metadata) {
        metadata.updated_by = userEmail;
        metadata.date_updated = new Date().toISOString();
        // Merge with existing metadata
        Object.assign(metadata, cloudAccount.metadata);
      }

      const data = {
        provider: formData.provider,
        account_name: formData.account_name.trim(),
        account_identifier: formData.account_identifier.trim(),
        access_keys: formData.access_keys,
        metadata
      };

      let response;
      if (mode === "create") {
        response = await createCloudAccount(organization.id, data);
      } else if (mode === "edit") {
        response = await updateCloudAccount(cloudAccount.id, data);
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
    if (!window.confirm(`Are you sure you want to delete this cloud account? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      await deleteCloudAccount(cloudAccount.id);
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error:", err);
      setError(err.response?.data?.message || "Failed to delete cloud account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "create": return "Add Cloud Account";
      case "edit": return "Edit Cloud Account";
      case "delete": return "Delete Cloud Account";
      default: return "Cloud Account";
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
            <p>Are you sure you want to delete this cloud account?</p>
            <p>This action will also delete all associated environments. This cannot be undone.</p>
          </div>
        ) : (
          <div className={styles["dialog__form"]}>
            <FormControl fullWidth className={styles["dialog__input"]}>
              <InputLabel>Provider</InputLabel>
              <Select
                name="provider"
                value={formData.provider}
                onChange={handleInputChange}
                label="Provider"
                disabled={loading}
              >
                <MenuItem value="aws">AWS</MenuItem>
                <MenuItem value="gcp">GCP</MenuItem>
                <MenuItem value="azure">Azure</MenuItem>
                <MenuItem value="oracle">Oracle</MenuItem>
              </Select>
            </FormControl>

            <TextField
              name="account_name"
              label="Account Name"
              value={formData.account_name}
              onChange={handleInputChange}
              fullWidth
              required
              className={styles["dialog__input"]}
              placeholder="Enter account name"
              disabled={loading}
            />

            <TextField
              name="account_identifier"
              label="Account Identifier"
              value={formData.account_identifier}
              onChange={handleInputChange}
              fullWidth
              required
              className={styles["dialog__input"]}
              placeholder="Enter account identifier"
              disabled={loading}
            />

            {/* Access Keys Section */}
            <div className={styles["dialog__access-keys-section"]}>
              <Typography variant="subtitle2" className={styles["dialog__access-keys-title"]}>
                Access Keys
              </Typography>
              {formData.access_keys.map((key, index) => (
                <div key={index} className={styles["dialog__access-key-row"]}>
                  <TextField
                    label="Key"
                    value={key.key}
                    onChange={(e) => handleAccessKeyChange(index, 'key', e.target.value)}
                    className={styles["dialog__access-key-field"]}
                    disabled={loading}
                    InputProps={{
                      readOnly: true,
                      style: { backgroundColor: '#f5f5f5' }
                    }}
                  />
                  <TextField
                    label="Value"
                    value={key.value}
                    onChange={(e) => handleAccessKeyChange(index, 'value', e.target.value)}
                    className={styles["dialog__access-key-field"]}
                    placeholder={`Enter ${key.key}`}
                    disabled={loading}
                    type={key.key.includes('SECRET') || key.key.includes('KEY') ? 'password' : 'text'}
                  />
                </div>
              ))}
            </div>

            {/* Test Connection Button */}
            <div className={styles["dialog__test-connection-section"]}>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleTestConnection}
                disabled={testingConnection || loading}
                startIcon={testingConnection ? <CircularProgress size={20} /> : null}
                className={styles["dialog__test-connection-button"]}
              >
                {testingConnection ? "Testing..." : "Test Connection"}
              </Button>
              
              {connectionTestResult && (
                <Alert 
                  severity={connectionTestResult.success ? "success" : "error"}
                  className={styles["dialog__connection-result"]}
                >
                  {connectionTestResult.message}
                </Alert>
              )}
            </div>

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
            disabled={loading || !formData.account_name.trim() || !formData.account_identifier.trim()}
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

export default CloudAccountDialog;
