import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { motion } from "framer-motion";
import { API_BASE_URL } from "../../config/apiConfig";
import "./CategoryPage.css";

interface Post {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  featuredImageUrl: string | null;
  views: number;
  isFeatured: boolean;
  createdAt: string;
  slug: string;
  authorId: string;
  authorName: string | null;
  categoryId: number;
  categoryName: string | null;
  tags: string[];
  commentsCount: number;
}
//
interface PaginatedResponse {
  items: Post[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

const POSTS_PER_PAGE = 15;
const CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutes in milliseconds
const CACHE_VERSION_KEY = "categoryPosts_cache_version";

const CategoryPage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const { user } = useUser();
  const { categoryName } = useParams<{ categoryName: string }>();
  const navigate = useNavigate();

  // Utility function to capitalize first letter of each name
  const capitalizeName = (name: string | null): string => {
    if (!name) return "Unknown";
    return name
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  };

  const getCacheKey = (page: number) => `category_${categoryName?.toLowerCase()}_page_${page}`;

  const clearAllCaches = () => {
    const newVersion = Date.now().toString();
    localStorage.setItem(CACHE_VERSION_KEY, newVersion);
    if (!categoryName) return;
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(`category_${categoryName.toLowerCase()}_page_`)) {
        localStorage.removeItem(key);
      }
    });
  };

  const getCurrentCacheVersion = () => {
    return localStorage.getItem(CACHE_VERSION_KEY) || "0";
  };

  const fetchPosts = async (page: number) => {
    if (!categoryName) {
      setError("Category name is missing.");
      setLoading(false);
      return;
    }

    const cacheKey = getCacheKey(page);
    const cachedData = localStorage.getItem(cacheKey);
    const currentVersion = getCurrentCacheVersion();

    if (cachedData) {
      const { data, timestamp, version } = JSON.parse(cachedData);
      if (Date.now() - timestamp < CACHE_EXPIRY && version === currentVersion) {
        setPosts(data.items);
        setTotalPages(data.totalPages);
        setLoading(false);
        return;
      }
    }

    try {
      setLoading(true);
      const headers: HeadersInit = {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      };
      if (user?.token) {
        headers["Authorization"] = `Bearer ${user.token}`;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/Category/${encodeURIComponent(categoryName)}/posts?page=${page}&pageSize=${POSTS_PER_PAGE}&t=${Date.now()}`,
        {
          headers,
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.statusText}`);
      }

      const data: PaginatedResponse = await response.json();
      setPosts(data.items);
      setTotalPages(data.totalPages);

      localStorage.setItem(cacheKey, JSON.stringify({
        data: { items: data.items, totalPages: data.totalPages },
        timestamp: Date.now(),
        version: currentVersion,
      }));
    } catch (err) {
      setError((err as Error).message || "An error occurred while fetching posts");
      setPosts([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(currentPage);
  }, [categoryName, currentPage, user?.token]);

  useEffect(() => {
    if (!localStorage.getItem(CACHE_VERSION_KEY)) {
      localStorage.setItem(CACHE_VERSION_KEY, "0");
    }

    const handleRefresh = () => {
      clearAllCaches();
      fetchPosts(currentPage);
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted || performance.navigation.type === 1) {
        handleRefresh();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        handleRefresh();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", clearAllCaches);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", clearAllCaches);
    };
  }, [categoryName, currentPage]);

  // Handle Create Post button click
  const handleCreatePost = () => {
    if (user) {
      navigate("/create-post");
    } else {
      navigate("/SignIn");
    }
  };

  // Loading animation variants
  const loadingVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.3 } }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const defaultImageUrl = "/INFOS_LOGO%5B1%5D.png"; // Default image URL

  if (loading) {
    return (
      <motion.div
        className="loading-container"
        variants={loadingVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <div className="loader" />
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          Loading Posts...
        </motion.p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        className="category-page error"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {error}
      </motion.div>
    );
  }

  return (
    <div className="category-page">
      <h1>{categoryName}</h1>
      <button
        className="category-create-post-btn"
        onClick={handleCreatePost}
      >
        Create Post
      </button>
      {posts.length === 0 ? (
        <p className="no-posts">No posts found in this category.</p>
      ) : (
        <>
          <div className="posts-list">
            {posts.map((post) => (
              <div key={post.id} className="post-item">
                <div className="post-image-container">
                  <img
                    src={post.featuredImageUrl || defaultImageUrl}
                    alt={post.title}
                    className="post-image"
                  />
                </div>
                <div className="post-content">
                  <Link to={`/post/${post.slug}`} className="post-title-link">
                    <h2 className="post-title">{post.title}</h2>
                  </Link>
                  <p className="post-meta">
                    By {capitalizeName(post.authorName)} • {formatDate(post.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`pagination-btn ${currentPage === page ? "active" : ""}`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CategoryPage;