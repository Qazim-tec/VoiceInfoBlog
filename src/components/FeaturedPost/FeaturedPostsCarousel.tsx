import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
      const response = await fetch(`https://voiceinfo.onrender.com/api/FeaturedPosts?t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        cache: 'no-store', // Disable browser fetch cache
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

  // Initial fetch or load from cache
  useEffect(() => {
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      if (Date.now() - timestamp < CACHE_EXPIRY) {
        // console.log('Loaded from cache');
        setFeaturedPosts(data);
        setLoading(false);
        return;
      }
    }
    fetchFeaturedPosts();
  }, []);

  // Auto-scroll carousel
  useEffect(() => {
    if (featuredPosts.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % featuredPosts.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [featuredPosts]);

  // Handle reloads and swipe-down refreshes
  useEffect(() => {
    const handleRefresh = () => {
      // console.log('Refresh triggered');
      localStorage.removeItem(CACHE_KEY); // Clear cache
      fetchFeaturedPosts();
    };

    // Handle page show (reload or back-forward cache)
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted || performance.navigation.type === 1) {
        handleRefresh();
      }
    };

    // Handle visibility change (mobile swipe-down or tab switch)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleRefresh();
      }
    };

    // Add event listeners
    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", () => localStorage.removeItem(CACHE_KEY)); // Clear cache before leaving

    // Cleanup
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", () => localStorage.removeItem(CACHE_KEY));
    };
  }, []);

  if (loading) return <div className="fpc-carousel-loading">Loading featured posts...</div>;
  if (error) return <div className="fpc-carousel-error">Error: {error}</div>;
  if (!featuredPosts.length) return <div className="fpc-carousel-empty">No featured posts available.</div>;

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