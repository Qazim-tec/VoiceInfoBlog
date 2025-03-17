import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaSun,
  FaMoon,
  FaUser,
  FaBars,
  FaTimes,
  FaSearch,
} from "react-icons/fa";
import { useUser } from "../../context/UserContext";
import { useCategories } from "../../hooks/useCategories";
import "./Navbar.css";
import Logo from "../../assets/react.svg";

const Navbar: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { user, logout } = useUser();
  const { categories, loading, error } = useCategories();
  const navigate = useNavigate();

  const toggleDarkMode = (): void => {
    setDarkMode((prev) => !prev);
    document.body.classList.toggle("dark-mode", !darkMode);
  };

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    navigate("/");
  };

  return (
    <nav className={`navbar ${darkMode ? "dark-mode" : ""}`}>
      <div className="navbar-top">
        <button
          className="hamburger"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
        <div className="navbar-brand">
          <img src={Logo} alt="Logo" className="navbar-logo" />
          <span className="blog-name">VoiceInfo</span>
        </div>
        <button
          className="search-toggle"
          onClick={() => setIsSearchOpen(!isSearchOpen)}
        >
          <FaSearch />
        </button>
      </div>

      <ul className="navbar-links desktop">
        <li key="home">
          <Link to="/">Home</Link>
        </li>
        {loading ? (
          <li>Loading...</li>
        ) : error ? (
          <li>Error loading categories</li>
        ) : (
          categories.map((category) => (
            <li key={category.id}>
              <Link to={`/${category.name.toLowerCase()}`}>
                {category.name}
              </Link>
            </li>
          ))
        )}
      </ul>

      <div className={`search-bar desktop ${isSearchOpen ? "open" : ""}`}>
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearchQuery(e.target.value)
          }
        />
      </div>

      <div className="navbar-actions">
        <button onClick={toggleDarkMode} className="theme-toggle">
          {darkMode ? <FaSun /> : <FaMoon />}
        </button>
        {user ? (
          <div className="user-menu">
            <div
              className="user-initial"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            >
              {user.firstName.charAt(0).toUpperCase()}
            </div>
            {isUserMenuOpen && (
              <ul className="dropdown-menu">
                <li>
                  <Link to="/profile" onClick={() => setIsUserMenuOpen(false)}>
                    My Profile
                  </Link>
                </li>
                <li>
                  <Link
                    to="/create-post"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    Create a Post
                  </Link>
                </li>
                <li>
                  <Link to="/my-posts" onClick={() => setIsUserMenuOpen(false)}>
                    My Posts
                  </Link>
                </li>
                {/* Only show Settings for Admin */}
                {user.role === "Admin" && (
                  <li>
                    <Link
                      to="/settings"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Settings
                    </Link>
                  </li>
                )}
                <li>
                  <button onClick={handleLogout} className="logout-button">
                    Logout
                  </button>
                </li>
              </ul>
            )}
          </div>
        ) : (
          <Link to="/SignIn" className="sign-in">
            <FaUser /> Sign In
          </Link>
        )}
      </div>

      <div className={`mobile-menu ${isMobileMenuOpen ? "open" : ""}`}>
        <ul className="navbar-links mobile">
          <li key="home">
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
              Home
            </Link>
          </li>
          {loading ? (
            <li>Loading...</li>
          ) : error ? (
            <li>Error loading categories</li>
          ) : (
            categories.map((category) => (
              <li key={category.id}>
                <Link
                  to={`/${category.name.toLowerCase()}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {category.name}
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;