import React, { useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  Collapse,
  Chip,
  Menu,
  MenuItem,
} from "@material-ui/core";
import { Cloud, ExpandMore, ExpandLess, MoreVert, Edit, Delete, Add } from "@material-ui/icons";

import EnvironmentItem from "../EnvironmentItem";
import styles from "./style.module.scss";

const CloudAccountCard = ({ cloudAccount, environments = [], onEdit, onDelete, onAddEnvironment, onEditEnvironment, onDeleteEnvironment }) => {
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  // Handle case where cloudAccount might be undefined
  if (!cloudAccount) {
    return null;
  }

  // Ensure environments is always an array
  const safeEnvironments = Array.isArray(environments) ? environments : [];

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    handleMenuClose();
    onEdit(cloudAccount);
  };

  const handleDelete = () => {
    handleMenuClose();
    onDelete(cloudAccount);
  };

  const handleAddEnvironment = () => {
    handleMenuClose();
    onAddEnvironment(cloudAccount);
  };

  const getProviderColor = (provider) => {
    switch (provider?.toLowerCase()) {
      case 'aws': return '#FF9900';
      case 'gcp': return '#4285F4';
      case 'azure': return '#0078D4';
      case 'oracle': return '#FF0000';
      default: return '#6B7280';
    }
  };

  return (
    <Box className={styles["cloud-account-card"]}>
      <Box className={styles["cloud-account-card__header"]}>
        <Box className={styles["cloud-account-card__info"]}>
          <Cloud className={styles["cloud-account-card__icon"]} />
          <Box className={styles["cloud-account-card__details"]}>
            <Typography variant="subtitle1" className={styles["cloud-account-card__name"]}>
              {cloudAccount.account_name || 'Unnamed Account'}
            </Typography>
            <Typography variant="body2" className={styles["cloud-account-card__identifier"]}>
              {cloudAccount.account_identifier}
            </Typography>
            <Typography variant="body2" className={styles["cloud-account-card__id"]}>
              ID: {cloudAccount.id}
            </Typography>
          </Box>
        </Box>
        
        <Box className={styles["cloud-account-card__stats"]}>
          <Chip
            label={cloudAccount.provider?.toUpperCase() || 'UNKNOWN'}
            size="small"
            style={{ 
              backgroundColor: getProviderColor(cloudAccount.provider),
              color: 'white',
              fontWeight: 'bold'
            }}
            className={styles["cloud-account-card__provider"]}
          />
          <Typography variant="body2" className={styles["cloud-account-card__stat"]}>
            {safeEnvironments.length} Environment{safeEnvironments.length !== 1 ? 's' : ''}
          </Typography>
        </Box>

        <Box className={styles["cloud-account-card__actions"]}>
          <IconButton
            onClick={handleMenuOpen}
            className={styles["cloud-account-card__menu"]}
            aria-label="cloud account actions"
          >
            <MoreVert />
          </IconButton>
          <IconButton
            onClick={handleExpand}
            className={styles["cloud-account-card__expand"]}
            aria-label="expand cloud account"
          >
            {isExpanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
      </Box>

      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
        <Box className={styles["cloud-account-card__content"]}>
          {safeEnvironments.length === 0 ? (
            <Box className={styles["cloud-account-card__empty"]}>
              <Typography variant="body2" color="textSecondary" className={styles["cloud-account-card__empty-text"]}>
                No environments yet
              </Typography>
              <Typography variant="caption" color="textSecondary" className={styles["cloud-account-card__empty-subtitle"]}>
                Add your first environment to get started
              </Typography>
            </Box>
          ) : (
            safeEnvironments.map((env) => (
              <EnvironmentItem 
                key={env.id} 
                environment={env} 
                cloudAccount={cloudAccount}
                onEdit={onEditEnvironment}
                onDelete={onDeleteEnvironment}
              />
            ))
          )}
        </Box>
      </Collapse>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleEdit}>
          <Edit fontSize="small" style={{ marginRight: 8 }} />
          Edit Cloud Account
        </MenuItem>
        <MenuItem onClick={handleAddEnvironment}>
          <Add fontSize="small" style={{ marginRight: 8 }} />
          Add Environment
        </MenuItem>
        <MenuItem onClick={handleDelete} style={{ color: '#ef4444' }}>
          <Delete fontSize="small" style={{ marginRight: 8 }} />
          Delete Cloud Account
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default CloudAccountCard;
