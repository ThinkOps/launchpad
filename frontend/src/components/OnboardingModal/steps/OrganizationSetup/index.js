import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CircularProgress,
} from "@material-ui/core";
import { Business, ArrowForward } from "@material-ui/icons";

import { createOrganization } from "services/organizations";
import styles from "./style.module.scss";

const OrganizationSetup = ({ onComplete, onBack }) => {
  const [formData, setFormData] = useState({
    name: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError("Organization name is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await createOrganization({
        name: formData.name.trim()
      });

      if (response && response.data) {
        onComplete(response.data);
      } else {
        setError("Failed to create organization");
      }
    } catch (err) {
      console.error("Error creating organization:", err);
      setError(err.response?.data?.message || "Failed to create organization");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className={styles["organization-setup"]}>
      <Card className={styles["organization-setup__card"]}>
        <CardContent>
          <Box className={styles["organization-setup__header"]}>
            <Business className={styles["organization-setup__icon"]} />
            <Typography variant="h5" className={styles["organization-setup__title"]}>
              Set Up Your Organization
            </Typography>
          </Box>
          
          <Typography variant="body1" className={styles["organization-setup__description"]}>
            Organizations help you manage your cloud resources and environments. 
            Create your first organization to get started with Launchpad.
          </Typography>

          <Box className={styles["organization-setup__form"]}>
            <form onSubmit={handleSubmit}>
              <TextField
                name="name"
                label="Organization Name"
                value={formData.name}
                onChange={handleInputChange}
                fullWidth
                required
                className={styles["organization-setup__input"]}
                placeholder="Enter your organization name"
                error={!!error}
                helperText={error}
              />

              <Box className={styles["organization-setup__actions"]}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading || !formData.name.trim()}
                  endIcon={loading ? <CircularProgress size={20} /> : <ArrowForward />}
                  className={styles["organization-setup__submit"]}
                >
                  {loading ? "Creating..." : "Create Organization"}
                </Button>
              </Box>
            </form>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default OrganizationSetup;
