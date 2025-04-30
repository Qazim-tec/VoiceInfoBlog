import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { API_BASE_URL } from "../../config/apiConfig"; // Added import
import "./FeaturedPostsCarousel.css";

interface Post {
  id: number;
  title: string;
  excerpt: string;
  featuredImageUrl: string;
  slug: string;
  isFeatured: boolean;
}

const CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutes in milliseconds
const CACHE_KEY = "featuredPosts";

const FeaturedPostsCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>(() => {
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      if (Date.now() - timestamp < CACHE_EXPIRY) {
        return data;
      }
    }
    return [];
  });
  const [loading, setLoading] = useState<boolean>(() => {
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      const { timestamp } = JSON.parse(cachedData);
      return Date.now() - timestamp >= CACHE_EXPIRY;
    }
    return true;
  });
  const [error, setError] = useState<string | null>(null);

  const fetchFeaturedPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/FeaturedPosts?t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        cache: 'no-store',
      });
      if (!response.ok) throw new Error("Failed to fetch featured posts");

      const data: Post[] = await response.json();
      setFeaturedPosts(data);
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      if (Date.now() - timestamp < CACHE_EXPIRY) {
        setFeaturedPosts(data);
        setLoading(false);
        return;
      }
    }
    fetchFeaturedPosts();
  }, []);

  useEffect(() => {
    if (featuredPosts.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % featuredPosts.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [featuredPosts]);

  useEffect(() => {
    const handleRefresh = () => {
      localStorage.removeItem(CACHE_KEY);
      fetchFeaturedPosts();
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted || performance.navigation.type === 1) {
        handleRefresh();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleRefresh();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", () => localStorage.removeItem(CACHE_KEY));

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", () => localStorage.removeItem(CACHE_KEY));
    };
  }, []);

  // Loading animation variants
  const loadingVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.3 } }
  };

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
          Loading Featured Posts...
        </motion.p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        className="fpc-carousel-error"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        Error: {error}
      </motion.div>
    );
  }

  if (!featuredPosts.length) {
    return (
      <motion.div
        className="fpc-carousel-empty"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        No featured posts available.
      </motion.div>
    );
  }

  return (
    <section className="fpc-carousel-section">
      <div className="fpc-carousel-container">
        <div
          className="fpc-carousel-track"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {featuredPosts.map((post) => (
            <div className="fpc-carousel-item" key={post.id}>
              <div className="fpc-image-wrapper">
                <img
                  src={post.featuredImageUrl}
                  alt={post.title}
                  className="fpc-carousel-image"
                />
                <span className="fpc-featured-badge">Featured</span>
              </div>
              <div className="fpc-carousel-content">
                <h2>
                  <Link to={`/post/${post.slug}`} className="fpc-title-link">
                    {post.title}
                  </Link>
                </h2>
                <p>{post.excerpt}</p>
                <Link to={`/post/${post.slug}`} className="fpc-read-more">
                  Read More
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="fpc-carousel-controls">
        {featuredPosts.map((_, idx) => (
          <button
            key={idx}
            className={`fpc-dot ${idx === currentIndex ? "fpc-active" : ""}`}
            onClick={() => setCurrentIndex(idx)}
          ></button>
        ))}
      </div>
    </section>
  );
};

export default FeaturedPostsCarousel;