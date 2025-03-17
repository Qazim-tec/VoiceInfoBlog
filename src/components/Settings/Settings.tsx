import React from "react";
import { useNavigate } from "react-router-dom";
import "./Settings.css";

const Settings: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="settings-container">
      <h1>Admin Dashboard</h1>
      <button onClick={() => navigate("/admin/feature-posts")} className="settings-btn">
        Manage Featured Posts
      </button>
    </div>
  );
};

export default Settings;
