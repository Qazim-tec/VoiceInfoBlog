import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaEnvelope } from "react-icons/fa";
import { useUser } from "../../context/UserContext";
import { API_BASE_URL } from "../../config/apiConfig"; // Added import
import "./Auth.css";

const OtpVerification: React.FC = () => {
  const [otp, setOtp] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [resendLoading, setResendLoading] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(600); // 10 minutes in seconds
  const navigate = useNavigate();
  const { state } = useLocation();
  const { setUser } = useUser();
  const email = state?.email || "";

  useEffect(() => {
    if (!email) {
      setError("No email provided. Please register again.");
      setTimeout(() => navigate("/signup"), 3000);
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

    try {
      const response = await fetch(`${API_BASE_URL}/api/User/confirm-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otpCode: otp }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "OTP verification failed");
      }

      const data = await response.json();
      const userData = {
        userId: data.userId,
        email: data.email,
        token: data.token,
        role: data.role,
        firstName: data.firstName,
      };
      setUser(userData);
      setSuccess("OTP verified! Redirecting to home page...");
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("OTP verification error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async (): Promise<void> => {
    setError(null);
    setSuccess(null);
    setResendLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/User/resend-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to resend OTP");
      }

      setSuccess("A new OTP has been sent to your email.");
      setTimer(600); // Reset timer to 10 minutes
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Resend OTP error:", err);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="auth-container otp-auth-container">
      <div className="auth-form otp-auth-form">
        <h2>Verify Your Email</h2>
        <p>
          An OTP has been sent to <strong>{email}</strong>. Please enter the 6-digit code below. The OTP will expire in{" "}
          <strong>{formatTime(timer)}</strong>.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group otp-form-group">
            <FaEnvelope className="input-icon otp-input-icon" />
            <input
              type="text"
              name="otp"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              required
            />
          </div>
          {error && <p className="error-message otp-error-message">{error}</p>}
          {success && <p className="success-message otp-success-message">{success}</p>}
          <button type="submit" className="auth-button otp-auth-button" disabled={loading || timer === 0}>
            {loading ? <span className="loader otp-loader"></span> : "Verify OTP"}
          </button>
        </form>
        <p className="resend-otp">
          Didn't receive the OTP?{" "}
          <button
            onClick={handleResendOtp}
            className="resend-otp-button"
            disabled={resendLoading || timer === 0}
          >
            {resendLoading ? <span className="loader otp-loader"></span> : "Resend OTP"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default OtpVerification;