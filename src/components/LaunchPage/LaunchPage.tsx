import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import "./LaunchPage.css";

const LaunchPage = () => {
  const LAUNCH_DATE = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days from now
  const [timeLeft, setTimeLeft] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  const VALID_TOKEN = "voiceinfos@123";

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const diff = LAUNCH_DATE.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("Launched!");
        clearInterval(interval);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token === VALID_TOKEN) {
      localStorage.setItem("siteAccess", "granted");
      window.location.reload();
    } else {
      setError("Invalid token.");
    }
  };

  return (
    <div className="launch-container">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="launch-content"
      >
        <h1 className="logo">VoiceInfos</h1>
        <p className="tagline">The Voice of Today’s Stories 📢</p>
        <div className="countdown">{timeLeft}</div>

        {/* Hidden token form */}
        <form onSubmit={handleSubmit} className="token-form-hidden">
          <input
            type="password"
            placeholder="🔐 Admin token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <button type="submit">Go</button>
        </form>

        {error && <p className="error">{error}</p>}

        <p className="footer-note">Launching worldwide in 2 days 🚀</p>
      </motion.div>
    </div>
  );
};

export default LaunchPage;
