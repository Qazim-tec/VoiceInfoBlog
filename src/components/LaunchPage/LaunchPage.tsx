import { useState } from "react";
import { motion } from "framer-motion";
import "./LaunchPage.css";

const LaunchPage = () => {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  const handleAccess = () => {
    if (token === "letmein") {
      localStorage.setItem("siteAccess", "granted");
      window.location.reload();
    } else {
      setError("Invalid token. Try again.");
    }
  };

  return (
    <div className="launch-page">
      <motion.div
        className="launch-content"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <h1 className="voiceinfos-logo">Voiceinfos.com</h1>
        <p className="launch-date">
          🚀 We're launching on <strong>Friday, May 10, 2025</strong>
        </p>
        <p className="exciting-text">
          Get ready to experience a world of insightful stories, trending topics,<br />
          and powerful voices — all in one beautiful platform. 📚🔥<br />
          We can't wait to show you what we've built!
        </p>
      </motion.div>

      {/* Hidden Admin Token Area */}
      <div className="admin-access">
        <input
          type="password"
          value={token}
          placeholder="Enter access token"
          onChange={(e) => setToken(e.target.value)}
        />
        <button onClick={handleAccess}>Access</button>
        {error && <p className="error-text">{error}</p>}
      </div>
    </div>
  );
};

export default LaunchPage;
