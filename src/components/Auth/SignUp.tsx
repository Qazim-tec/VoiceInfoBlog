import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaEnvelope, FaEye, FaEyeSlash } from "react-icons/fa";
import "./Auth.css";

interface SignUpData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const SignUp: React.FC = () => {
  const [formData, setFormData] = useState<SignUpData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [passwordValidation, setPasswordValidation] = useState({
    hasUpperCase: false,
    hasSpecialChar: false,
    hasNumber: false,
    minLength: false,
  });
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "password") {
      setPasswordValidation({
        hasUpperCase: /[A-Z]/.test(value),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(value),
        hasNumber: /\d/.test(value),
        minLength: value.length >= 8,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const { hasUpperCase, hasSpecialChar, hasNumber, minLength } = passwordValidation;
    if (!hasUpperCase || !hasSpecialChar || !hasNumber || !minLength) {
      setError("Password must include a capital letter, a special character, a number, and be at least 8 characters");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("https://voiceinfo.onrender.com/api/User/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }

      await response.json();
      setSuccess("Registration successful! Redirecting to sign-in...");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        navigate("/signin");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  return (
    <div className="auth-container signup-auth-container">
      <div className="auth-form signup-auth-form">
        <h2>Join VoiceInfo</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group signup-form-group">
            <FaUser className="input-icon signup-input-icon" />
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group signup-form-group">
            <FaUser className="input-icon signup-input-icon" />
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group signup-form-group">
            <FaEnvelope className="input-icon signup-input-icon" />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group signup-form-group">
            <FaLock className="input-icon signup-input-icon" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
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
          <div className="form-group signup-form-group">
            <FaLock className="input-icon signup-input-icon" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
            <span className="toggle-password" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          {error && <p className="error-message signup-error-message">{error}</p>}
          {success && <p className="success-message signup-success-message">{success}</p>}
          <button type="submit" className="auth-button signup-auth-button" disabled={loading}>
            {loading ? <span className="loader signup-loader"></span> : "Sign Up"}
          </button>
        </form>
        <p className="auth-switch signup-auth-switch">
          Already a member? <Link to="/signin">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;