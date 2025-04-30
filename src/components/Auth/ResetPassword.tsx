import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaLock, FaEnvelope, FaEye, FaEyeSlash } from "react-icons/fa";
import { API_BASE_URL } from "../../config/apiConfig"; // Added import
import "./Auth.css";

const ResetPassword: React.FC = () => {
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(600); // 10 minutes in seconds
  const [passwordValidation, setPasswordValidation] = useState({
    hasUpperCase: false,
    hasSpecialChar: false,
    hasNumber: false,
    minLength: false,
  });
  const navigate = useNavigate();
  const { state } = useLocation();
  const email = state?.email || "";

  useEffect(() => {
    if (!email) {
      setError("No email provided. Please start the password reset process again.");
      setTimeout(() => navigate("/forgot-password"), 3000);
      return;
    }

    // Countdown timer for OTP expiry
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [email, navigate]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handlePasswordChange = (value: string) => {
    setNewPassword(value);
    setPasswordValidation({
      hasUpperCase: /[A-Z]/.test(value),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(value),
      hasNumber: /\d/.test(value),
      minLength: value.length >= 8,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      setError("Please enter a valid 6-digit OTP");
      setLoading(false);
      return;
    }

    const { hasUpperCase, hasSpecialChar, hasNumber, minLength } = passwordValidation;
    if (!hasUpperCase || !hasSpecialChar || !hasNumber || !minLength) {
      setError("Password must include a capital letter, a special character, a number, and be at least 8 characters");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/User/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otpCode: otp, newPassword, confirmNewPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Password reset failed");
      }

      setSuccess("Password reset successful! Redirecting to sign in...");
      setTimeout(() => navigate("/SignIn"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Reset password error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container reset-auth-container">
      <div className="auth-form reset-auth-form">
        <h2>Reset Password</h2>
        <p>
          Enter the 6-digit OTP sent to <strong>{email}</strong>, along with your new password. The OTP will expire in{" "}
          <strong>{formatTime(timer)}</strong>.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group reset-form-group">
            <FaEnvelope className="input-icon reset-input-icon" />
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              required
            />
          </div>
          <div className="form-group reset-form-group">
            <FaLock className="input-icon reset-input-icon" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => handlePasswordChange(e.target.value)}
              required
            />
            <span className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          <div className="password-validation">
            <span className={passwordValidation.hasUpperCase ? "valid" : "invalid"}>UpperCase</span>
            <span className={passwordValidation.hasSpecialChar ? "valid" : "invalid"}>SpecialChar</span>
            <span className={passwordValidation.hasNumber ? "valid" : "invalid"}>Number</span>
            <span className={passwordValidation.minLength ? "valid" : "invalid"}>Length</span>
          </div>
          <div className="form-group reset-form-group">
            <FaLock className="input-icon reset-input-icon" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm New Password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
            />
            <span className="toggle-password" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          {error && <p className="error-message reset-error-message">{error}</p>}
          {success && <p className="success-message reset-success-message">{success}</p>}
          <button type="submit" className="auth-button reset-auth-button" disabled={loading || timer === 0}>
            {loading ? <span className="loader reset-loader"></span> : "Reset Password"}
          </button>
        </form>
        <p className="auth-switch reset-auth-switch">
          Back to <Link to="/SignIn">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;