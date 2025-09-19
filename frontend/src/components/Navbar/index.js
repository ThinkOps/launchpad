import React from "react";
import { AppContext } from "config/context";

import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import IconButton from "@material-ui/core/IconButton";
import MenuIcon from "@material-ui/icons/Menu";
import Typography from "@material-ui/core/Typography";

import styles from "./style.module.scss";

import ProboLogo from "assets/img/probo-logo.svg";
import Profile from "components/Profile";

class Navbar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <AppContext.Consumer>
        {({ handleNavbarToggle }) => {
          return (
            <AppBar className={styles["navbar__appbar"]} position="fixed">
              <Toolbar>
                <div className={styles["navbar__branding"]}>
                  <IconButton color="inherit" edge="start" onClick={handleNavbarToggle}>
                    <MenuIcon />
                  </IconButton>

                  {/* <img className={styles["navbar__logo"]} src={ProboLogo} alt="Probo" /> */}

                  <Typography variant="h6" style={{fontWeigh: 'bold'}} noWrap>
                    Launchpad
                  </Typography>
                  <span className={styles["navbar__environment"]}>
                    {process.env.REACT_APP_ENV === "staging"
                      ? "STAGING"
                      : process.env.REACT_APP_ENV === "production"
                        ? "PRODUCTION"
                        : "DEVELOPMENT"}
                  </span>

                  <div className={styles["navbar__search-container"]}>
                    {/* Search component can be added here later */}
                  </div>
                </div>
                <div className={styles["navbar__profile"]}>
                  <Profile />
                </div>
              </Toolbar>
            </AppBar>
          );
        }}
      </AppContext.Consumer>
    );
  }
}

export default Navbar;