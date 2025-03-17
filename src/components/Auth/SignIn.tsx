import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaLock } from "react-icons/fa";
import { useUser } from "../../context/UserContext";
import "./Auth.css";

interface LoginData {
  email: string;
  password: string;
}

interface LoginResponse {
  userId: string;
  email: string;
  token: string;
  role: string;
  firstName: string;
}

const SignIn: React.FC = () => {
  const [formData, setFormData] = useState<LoginData>({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const { setUser } = useUser();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await fetch("https://localhost:7094/api/User/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }

      const result: LoginResponse = await response.json();
      setUser(result);
      setSuccess("Login successful!");
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container signin-auth-container">
      <div className="auth-form signin-auth-form">
        <h2>Sign In to VoiceInfo</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group signin-form-group">
            <FaUser className="input-icon signin-input-icon" />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group signin-form-group">
            <FaLock className="input-icon signin-input-icon" />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          {error && <p className="error-message signin-error-message">{error}</p>}
          {success && <p className="success-message signin-success-message">{success}</p>}
          <button type="submit" className="auth-button signin-auth-button" disabled={loading}>
            {loading ? <span className="loader signin-loader"></span> : "Sign In"}
          </button>
        </form>
        <p className="auth-switch signin-auth-switch">
          New to VoiceInfo? <Link to="/signup">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default SignIn;