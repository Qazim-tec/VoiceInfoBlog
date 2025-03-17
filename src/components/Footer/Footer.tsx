import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <Link to="/" className="footer-logo">VoiceInfo</Link>
          <p className="footer-tagline">Stay Informed, Stay Inspired.</p>
        </div>
        <div className="footer-links">
          <Link to="/">Home</Link>
          <Link to="/create-post">Create Post</Link>

        </div>
        <div className="footer-social">
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">𝕏</a>
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">f</a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">📷</a>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© {currentYear} VoiceInfo. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;