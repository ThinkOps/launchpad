import React, { useState, useEffect } from "react";
import {
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Avatar,
} from "@material-ui/core";
import { AccountCircle, ExitToApp } from "@material-ui/icons";
import { getUserPayload, clearLocalStorage } from "config/helper";
import styles from "./style.module.scss";

const Profile = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    // Get user details from localStorage
    const userPayload = getUserPayload();
    
    if (userPayload) {
      // For testing - you can uncomment this line to test with a sample image
      // userPayload.image = "https://via.placeholder.com/150/1da1f2/ffffff?text=U";
      
      // Convert Google image URL to proxied URL to avoid CORS issues
      setUserDetails(userPayload);
      setImageError(false); // Reset image error state
    } else {
      // Set default user details if no payload exists
      setUserDetails({
        name: "User",
        email: "user@example.com"
      });
    }
  }, []);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    clearLocalStorage();
    window.location.href = "/login";
  };

  const open = Boolean(anchorEl);

  return (
    <div className={styles["profile__container"]}>
      <IconButton
        edge="end"
        aria-label="account of current user"
        aria-controls={open ? "profile-menu" : undefined}
        aria-haspopup="true"
        onClick={handleProfileMenuOpen}
        color="inherit"
        className={styles["profile__avatar-button"]}
      >
        <Avatar 
          className={styles["profile__avatar"]}
          src={userDetails?.image}
          alt={userDetails?.name || "User"}
          onError={(e) => {
            setImageError(true);
            // Hide the broken image and show fallback
            e.target.style.display = 'none';
          }}
          onLoad={() => {
          }}
        >
          {(imageError || !userDetails?.image) && (userDetails?.name?.charAt(0)?.toUpperCase() || <AccountCircle />)}
        </Avatar>
      </IconButton>

      <Menu
        id="profile-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleProfileMenuClose}
        className={styles["profile__menu"]}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <div className={styles["profile__user-info"]}>
          <Typography variant="subtitle1" className={styles["profile__user-name"]}>
            {userDetails?.name || "User Name"}
          </Typography>
          <Typography variant="body2" color="textSecondary" className={styles["profile__user-email"]}>
            {userDetails?.email || "user@example.com"}
          </Typography>
        </div>
        <MenuItem onClick={handleLogout} className={styles["profile__menu-item"]}>
          <ExitToApp fontSize="small" />
          Logout
        </MenuItem>
      </Menu>
    </div>
  );
};

export default Profile;