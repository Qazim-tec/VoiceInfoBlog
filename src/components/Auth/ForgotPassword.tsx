import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEnvelope } from "react-icons/fa";
import { API_BASE_URL } from "../../config/apiConfig"; // Added import
import "./Auth.css";

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/User/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send OTP");
      }

      setSuccess("If the email exists, an OTP has been sent. Redirecting to reset password...");
      setTimeout(() => {
        navigate("/reset-password", { state: { email } });
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Forgot password error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container forgot-auth-container">
      <div className="auth-form forgot-auth-form">
        <h2>Forgot Password</h2>
        <p>Enter your email to receive a password reset OTP.</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group forgot-form-group">
            <FaEnvelope className="input-icon forgot-input-icon" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {error && <p className="error-message forgot-error-message">{error}</p>}
          {success && <p className="success-message forgot-success-message">{success}</p>}
          <button type="submit" className="auth-button forgot-auth-button" disabled={loading}>
            {loading ? <span className="loader forgot-loader"></span> : "Send OTP"}
          </button>
        </form>
        <p className="auth-switch forgot-auth-switch">
          Back to <Link to="/SignIn">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;