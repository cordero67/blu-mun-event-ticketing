import React, { useState } from "react";

//import { withRouter } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { Nav } from "react-bootstrap";

import Logo from "../../blu_mun.jpeg";
import LogoAlt from "../../blu_mun_alt.jpg";

//import Logo from "../Logo/Logo";
import classes from "./Header.module.css";

const Header = ({ history }) => {
  let headerDisplay;

  const isActive = (page, path) => {
    if (page === path) {
      return { color: "#007BFF" };
    } else {
      return { color: "#000" };
    }
  };

  headerDisplay = (
    <header className={classes.Header} style={{ position: "fixed" }}>
      <div style={{ paddingLeft: "10px" }}>
        <Nav>
          <Logo source={Logo} placement="header" />
        </Nav>
      </div>
      <div className={classes.Navigation}>
        <Nav>
          <ul className={classes.HeaderItems}>
            <li>
              <NavLink
                to="/myaccount"
                //style={isActive(history.location.pathname, "/")}
              >
                All Events
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/myaccount"
                //style={isActive(history.location.pathname, "/myevents")}
              >
                My Events
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/"
                //style={isActive(history.location.pathname, "/createevent")}
              >
                Create Event
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/myaccount"
                //style={isActive(history.location.pathname, "/mywallet")}
              >
                My Ticket Wallet
              </NavLink>
            </li>
          </ul>
        </Nav>
      </div>
    </header>
  );

  return <div>{headerDisplay}</div>;
};

//export default withRouter(Header);
export default Header;
