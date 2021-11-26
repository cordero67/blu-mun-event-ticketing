import React from "react";
import { NavLink } from "react-router-dom";

import classes from "./HeaderItems.module.css";

// determines if current menu item, i.e. "<NavLink>" is the active link
// "page" represents the actual active path
// "path" represents the path defined in the respective "<NavLink>"
const isActive = (page, path) => {
  if (page === path) {
    return { color: "#007BFF" };
  } else {
    return { color: "#000" };
  }
};

const NavigationItems = (props) => {
  return (
    <ul className={classes.HeaderItems}>
      <li>
        <NavLink to="/" style={isActive(props.currentPage, "/")}>
          Events
        </NavLink>
      </li>
      <li>
        <NavLink
          to="/myaccount"
          style={isActive(props.currentPage, "/createevent")}
        >
          Create Event
        </NavLink>
      </li>
      <li>
        <NavLink
          to="/myaccount"
          style={isActive(props.currentPage, "/myaccount")}
        >
          My Account
        </NavLink>
      </li>
    </ul>
  );
};

export default NavigationItems;
