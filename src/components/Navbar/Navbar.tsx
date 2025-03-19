import { useState, useEffect } from "react";
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

interface Post {
  id: number;
  title: string;
  slug: string;
  createdAt: string;
}

const Navbar: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const { user, logout } = useUser();
  const { categories, loading, error } = useCategories();
  const navigate = useNavigate();

  // Fetch posts on mount
  useEffect(() => {
    const headers: Record<string, string> = {};
    if (user?.token) {
      headers["Authorization"] = `Bearer ${user.token}`;
    }

    fetch("https://voiceinfo.onrender.com/api/Post/all", { headers })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch posts");
        return res.json();
      })
      .then((data: Post[]) => {
        setPosts(data);
      })
      .catch((err) => {
        console.error("Fetch Posts Error:", err);
      });
  }, [user]);

  // Filter posts based on search query (multiple words, any order)
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredPosts([]);
      return;
    }

    // Split search query into individual words, remove empty strings
    const searchWords = searchQuery
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 0);

    if (searchWords.length === 0) {
      setFilteredPosts([]);
      return;
    }

    // Filter posts where all search words are present in the title (any order)
    const filtered = posts.filter((post) => {
      const titleLower = post.title.toLowerCase();
      return searchWords.every((word) => titleLower.includes(word));
    });

    setFilteredPosts(filtered);
  }, [searchQuery, posts]);

  const toggleDarkMode = (): void => {
    setDarkMode((prev) => !prev);
    document.body.classList.toggle("dark-mode", !darkMode);
  };

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    navigate("/");
  };

  const handleSearchSelect = (slug: string) => {
    setSearchQuery("");
    setIsSearchOpen(false);
    navigate(`/post/${slug}`);
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
        <Link to="/" className="navbar-brand">
          <img src={Logo} alt="Logo" className="navbar-logo" />
          <span className="blog-name">VoiceInfo</span>
        </Link>
        <button
          className="search-toggle"
          onClick={() => setIsSearchOpen(!isSearchOpen)}
        >
          <FaSearch />
        </button>
      </div>

      <ul className="navbar-links desktop">
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
          placeholder="Search posts..."
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearchQuery(e.target.value)
          }
        />
        {filteredPosts.length > 0 && searchQuery.trim() !== "" && (
          <ul className="search-results">
            {filteredPosts.slice(0, 5).map((post) => (
              <li
                key={post.id}
                className="search-result-item"
                onClick={() => handleSearchSelect(post.slug)}
              >
                {post.title}
              </li>
            ))}
          </ul>
        )}
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