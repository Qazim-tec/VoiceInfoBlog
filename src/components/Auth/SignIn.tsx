import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { useUser } from "../../context/UserContext";
import { API_BASE_URL } from "../../config/apiConfig"; // Added import
import "./Auth.css";

const SignIn: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const navigate = useNavigate();
  const { setUser } = useUser();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/User/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
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
      setSuccess("Login successful! Redirecting to home page...");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        navigate("/");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  return (
    <div className="auth-container signin-auth-container">
      <div className="auth-form signin-auth-form">
        <h2>Welcome Back</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group signin-form-group">
            <FaEnvelope className="input-icon signin-input-icon" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group signin-form-group">
            <FaLock className="input-icon signin-input-icon" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          {error && <p className="error-message signin-error-message">{error}</p>}
          {success && <p className="success-message signin-success-message">{success}</p>}
          <button type="submit" className="auth-button signin-auth-button" disabled={loading}>
            {loading ? <span className="loader signin-loader"></span> : "Sign In"}
          </button>
        </form>
        <p className="auth-switch signin-auth-switch">
          Not a member? <Link to="/signup">Sign Up</Link>
        </p>
        <p className="auth-switch signin-auth-switch">
          <Link to="/forgot-password">Forgot Password?</Link>
        </p>
      </div>
    </div>
  );
};

export default SignIn;