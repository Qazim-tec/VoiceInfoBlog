import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  // Placeholder URL for Instagram logo (replace with your asset path or CDN URL)
  // const instagramLogoUrl = "/assets/instagram-logo.png"; // Replace with actual path

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <Link to="/" className="footer-logo">VoiceInfo</Link>
          <p className="footer-tagline">Stay Informed, Stay Inspired.</p>
        </div>
        <div className="footer-links">
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/contact-us">Contact Us</Link>
          <Link to="/about">About voiceinfos.com</Link>
          <Link to="/disclaimer">Disclaimer</Link>
        </div>
        <div className="footer-social">
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">𝕏</a>
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">f</a>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© {currentYear} VoiceInfo. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;