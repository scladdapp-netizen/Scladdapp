import React, { Children } from "react";
import "./InnerTabCon.css";

const InnerTabCon = ({ children }) => {
  return (
    <div className="lkk">
      <div className="innerlkk">{children}</div>
    </div>
  );
};

export default InnerTabCon;
