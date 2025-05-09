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
          <Link to="/" className="footer-logo">VoiceInfos</Link>
          <p className="footer-tagline">Stay Informed, Stay Inspired.</p>
        </div>
        <div className="footer-links">
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/contact-us">Contact Us</Link>
          <Link to="/about">About voiceinfos.com</Link>
          <Link to="/disclaimer">Disclaimer</Link>
        </div>
        <div className="footer-social">
          <a href="https://x.com/The_Voiceinfos" target="_blank" aria-label="Twitter">𝕏</a>
          <a href="https://www.facebook.com/profile.php?id=61575719507357" target="_blank" aria-label="Facebook">f</a>
          <a href="https://chat.whatsapp.com/IXYNSdo9pSuC8RSTWyhDk4" target="_blank" aria-label="WhatsApp">
            <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp Logo" className="social-icon" style={{ width: '24px', height: '24px' }} />
          </a>
          
        </div>
      </div>
      <div className="footer-bottom">
        <p>© {currentYear} VoiceInfos. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;