import React from "react";
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Menu,
  MenuItem,
} from "@material-ui/core";
import { Storage, MoreVert, Edit, Delete } from "@material-ui/icons";

import styles from "./style.module.scss";

const EnvironmentItem = ({ environment, onEdit,cloudAccount, onDelete }) => {
  
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  // Handle case where environment might be null or undefined
  if (!environment) {
    return (
      <Box className={styles["environment-item"]}>
        <Typography variant="body2" color="textSecondary">
          Invalid environment data
        </Typography>
      </Box>
    );
  }

  const { id, name, region, vpc_id, state, metadata } = environment;
  const { access_keys } = cloudAccount;
  
  // Extract AWS region from access_keys
  const awsRegion = access_keys?.find(key => key.key === 'AWS_REGION')?.value || 'Unknown Region';
  
  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    handleMenuClose();
    onEdit(environment);
  };

  const handleDelete = () => {
    handleMenuClose();
    onDelete(environment);
  };

  const getStatusColor = (state) => {
    switch (state?.toLowerCase()) {
      case 'active': return '#10B981';
      case 'creating': return '#F59E0B';
      case 'updating': return '#3B82F6';
      case 'failed': return '#EF4444';
      case 'deleting': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (state) => {
    switch (state?.toLowerCase()) {
      case 'active': return '●';
      case 'creating': return '●';
      case 'updating': return '●';
      case 'failed': return '●';
      case 'deleting': return '●';
      default: return '●';
    }
  };

  const getEnvironmentType = (name) => {
    const lowerName = name?.toLowerCase() || '';
    if (lowerName.includes('prod') || lowerName.includes('production')) {
      return 'Production';
    } else if (lowerName.includes('staging') || lowerName.includes('stage')) {
      return 'Staging';
    } else if (lowerName.includes('dev') || lowerName.includes('development')) {
      return 'Development';
    }
    return 'Unknown';
  };

  const environmentType = getEnvironmentType(name);

  return (
    <Box className={styles["environment-item"]}>
      <Box className={styles["environment-item__header"]}>
        <Box className={styles["environment-item__info"]}>
          <Storage className={styles["environment-item__icon"]} />
          <Box className={styles["environment-item__details"]}>
            <Typography variant="subtitle2" className={styles["environment-item__name"]}>
              {name || 'Unnamed Environment'}
            </Typography>
            <Typography variant="body2" className={styles["environment-item__id"]}>
              Vpc: {vpc_id || 'Unknown'}
            </Typography>
          </Box>
        </Box>
        
        <Box className={styles["environment-item__badges"]}>
          <Chip
            label={awsRegion}
            size="small"
            variant="outlined"
            className={styles["environment-item__type"]}
          />
          {/* <Chip
            label={state || 'Unknown'}
            size="small"
            style={{ 
              backgroundColor: getStatusColor(state),
              color: 'white',
              fontWeight: 'bold'
            }}
            className={styles["environment-item__status"]}
          /> */}
          <IconButton
            onClick={handleMenuOpen}
            className={styles["environment-item__menu"]}
            aria-label="environment actions"
            size="small"
          >
            <MoreVert fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <Box className={styles["environment-item__details"]}>
        {region && (
          <Typography variant="body2" className={styles["environment-item__detail"]}>
            <strong>Region:</strong> {region}
          </Typography>
        )}
        {/* {vpc_id && (
          <Typography variant="body2" className={styles["environment-item__detail"]}>
            <strong>VPC:</strong> {vpc_id}
          </Typography>
        )} */}
        {metadata && metadata.createdBy && (
          <Typography variant="body2" className={styles["environment-item__detail"]}>
            <strong>Created by:</strong> {metadata.createdBy}
          </Typography>
        )}
      </Box>

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
          Edit Environment
        </MenuItem>
        <MenuItem onClick={handleDelete} style={{ color: '#ef4444' }}>
          <Delete fontSize="small" style={{ marginRight: 8 }} />
          Delete Environment
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default EnvironmentItem;
