import React, { useState } from "react";
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
import { Cloud, CheckCircle, Error } from "@material-ui/icons";

import { createCloudAccount, testCloudAccountConnection } from "services/cloudAccounts";
import { getUserPayload } from "config/helper";
import styles from "./style.module.scss";

const CloudAccountSetup = ({ organizationId, onComplete, onBack }) => {
  const [formData, setFormData] = useState({
    provider: "aws",
    account_name: "",
    account_identifier: "",
    access_keys: [
      { key: 'AWS_ACCESS_KEY_ID', value: '' },
      { key: 'AWS_SECRET_ACCESS_KEY', value: '' },
      { key: 'AWS_REGION', value: '' }
    ],
  });
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionTested, setConnectionTested] = useState(false);
  const [connectionSuccess, setConnectionSuccess] = useState(false);
  const [error, setError] = useState("");

  const providers = [
    { value: "aws", label: "Amazon Web Services (AWS)" },
    { value: "gcp", label: "Google Cloud Platform (GCP)" },
    { value: "azure", label: "Microsoft Azure" },
    { value: "oracle", label: "Oracle Cloud" },
  ];

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
    // Reset connection test when access keys change
    setConnectionTested(false);
    setConnectionSuccess(false);
    setError("");
  };

  const handleTestConnection = async () => {
    // Validate required fields first
    if (!formData.provider || !formData.account_name || !formData.account_identifier) {
      setError("Please fill in all required fields before testing connection");
      return;
    }

    const hasEmptyKeys = formData.access_keys.some(key => !key.key.trim() || !key.value.trim());
    if (hasEmptyKeys) {
      setError("All access key fields must be filled before testing connection");
      return;
    }

    setTestingConnection(true);
    setError("");

    try {
      const response = await testCloudAccountConnection({
        provider: formData.provider,
        access_keys: formData.access_keys
      });

      if (response && response.data) {
        setConnectionTested(true);
        setConnectionSuccess(true);
        setError("");
      } else {
        setConnectionTested(true);
        setConnectionSuccess(false);
        setError("Connection test failed");
      }
    } catch (err) {
      console.error("Error testing connection:", err);
      setConnectionTested(true);
      setConnectionSuccess(false);
      setError(err.response?.data?.message || "Connection test failed");
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.provider || !formData.account_name || !formData.account_identifier) {
      setError("Please fill in all required fields");
      return;
    }

    // Validate access keys
    const hasEmptyKeys = formData.access_keys.some(key => !key.key.trim() || !key.value.trim());
    if (hasEmptyKeys) {
      setError("All access key fields must be filled");
      return;
    }

    // Require successful connection test
    // if (!connectionTested || !connectionSuccess) {
    //   setError("Please test the connection successfully before adding the cloud account");
    //   return;
    // }

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

      const response = await createCloudAccount(organizationId, {
        ...formData,
        metadata
      });

      if (response && response.data) {
        onComplete(response.data);
      } else {
        setError("Failed to create cloud account");
      }
    } catch (err) {
      console.error("Error creating cloud account:", err);
      setError(err.response?.data?.message || "Failed to create cloud account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className={styles["cloud-account-setup"]}>
      <Card className={styles["cloud-account-setup__card"]}>
        <CardContent>
          <Box className={styles["cloud-account-setup__header"]}>
            <Cloud className={styles["cloud-account-setup__icon"]} />
            <Typography variant="h5" className={styles["cloud-account-setup__title"]}>
              Add Cloud Account
            </Typography>
          </Box>
          
          <Typography variant="body1" className={styles["cloud-account-setup__description"]}>
            Cloud accounts allow you to connect your cloud provider accounts to Launchpad. 
            This enables you to manage and deploy environments across different cloud platforms.
          </Typography>

          <Box className={styles["cloud-account-setup__form"]}>
            <form onSubmit={handleSubmit}>
              <FormControl fullWidth className={styles["cloud-account-setup__input"]}>
                <InputLabel>Cloud Provider *</InputLabel>
                <Select
                  name="provider"
                  value={formData.provider}
                  onChange={handleInputChange}
                  required
                >
                  {providers.map((provider) => (
                    <MenuItem key={provider.value} value={provider.value}>
                      {provider.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                name="account_name"
                label="Account Name *"
                value={formData.account_name}
                onChange={handleInputChange}
                fullWidth
                required
                className={styles["cloud-account-setup__input"]}
                placeholder="e.g., Production AWS Account"
              />

              <TextField
                name="account_identifier"
                label="Account Identifier *"
                value={formData.account_identifier}
                onChange={handleInputChange}
                fullWidth
                required
                className={styles["cloud-account-setup__input"]}
                placeholder="e.g., AWS Account ID, GCP Project ID"
              />

              {/* Access Keys Section */}
              <Box className={styles["cloud-account-setup__access-keys"]}>
                <Typography variant="subtitle2" className={styles["cloud-account-setup__access-keys-title"]}>
                  Access Keys *
                </Typography>
                {formData.access_keys.map((key, index) => (
                  <Box key={index} className={styles["cloud-account-setup__access-key-row"]}>
                    <TextField
                      label="Key"
                      value={key.key}
                      className={styles["cloud-account-setup__access-key-field"]}
                      InputProps={{
                        readOnly: true,
                        style: { backgroundColor: '#f5f5f5' }
                      }}
                    />
                    <TextField
                      label="Value"
                      value={key.value}
                      onChange={(e) => handleAccessKeyChange(index, 'value', e.target.value)}
                      className={styles["cloud-account-setup__access-key-field"]}
                      placeholder={`Enter ${key.key}`}
                      type={key.key.includes('SECRET') || key.key.includes('KEY') ? 'password' : 'text'}
                    />
                  </Box>
                ))}
              </Box>

              {/* Test Connection Section */}
              <Box className={styles["cloud-account-setup__test-connection"]}>
                <Button
                  type="button"
                  variant="outlined"
                  color="primary"
                  onClick={handleTestConnection}
                  disabled={testingConnection || !formData.provider || !formData.account_name || !formData.account_identifier || formData.access_keys.some(key => !key.key.trim() || !key.value.trim())}
                  startIcon={testingConnection ? <CircularProgress size={20} /> : <Cloud />}
                  className={styles["cloud-account-setup__test-button"]}
                >
                  {testingConnection ? "Testing..." : "Test Connection"}
                </Button>

                {connectionTested && (
                  <Box className={styles["cloud-account-setup__connection-result"]}>
                    {connectionSuccess ? (
                      <Box className={styles["cloud-account-setup__success"]}>
                        <CheckCircle className={styles["cloud-account-setup__success-icon"]} />
                        <Typography variant="body2" className={styles["cloud-account-setup__success-text"]}>
                          Connection successful!
                        </Typography>
                      </Box>
                    ) : (
                      <Box className={styles["cloud-account-setup__error"]}>
                        <Error className={styles["cloud-account-setup__error-icon"]} />
                        <Typography variant="body2" className={styles["cloud-account-setup__error-text"]}>
                          Connection failed
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>

              {error && (
                <Alert severity="error" className={styles["cloud-account-setup__error"]}>
                  {error}
                </Alert>
              )}

              <Box className={styles["cloud-account-setup__actions"]}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  // disabled={loading || !connectionTested || !connectionSuccess}
                  endIcon={loading ? <CircularProgress size={20} /> : <Cloud />}
                  className={styles["cloud-account-setup__submit"]}
                >
                  {loading ? "Adding..." : "Add Cloud Account"}
                </Button>
              </Box>
            </form>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CloudAccountSetup;
