import React, { useState, useEffect } from "react";
import { useUser } from "../../context/UserContext";
import { Link } from "react-router-dom";
import "./TrendingPosts.css";

interface Post {
  id: number;
  title: string;
  createdAt: string;
  views: number;
  commentsCount: number;
  slug: string;
  featuredImageUrl: string;
  authorName: string;
}

const CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutes in milliseconds
const CACHE_KEY = "trendingPosts";

const TrendingPosts: React.FC = () => {
  const { user } = useUser();
  const [trendingPosts, setTrendingPosts] = useState<Post[]>(() => {
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

  const fetchTrendingPosts = async () => {
    try {
      setLoading(true);
      const headers: Record<string, string> = {};
      if (user?.token) {
        headers["Authorization"] = `Bearer ${user.token}`;
      }

      const response = await fetch(
        "https://voiceinfo.onrender.com/api/TrendingPosts",
        {
          headers,
        }
      );

      if (!response.ok) throw new Error("Failed to fetch trending posts");

      const data: Post[] = await response.json();
      setTrendingPosts(data);
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ data, timestamp: Date.now() })
      );
    } catch (err) {
      console.error("Fetch Error:", err);
      setError("Failed to load trending posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      if (Date.now() - timestamp < CACHE_EXPIRY && data.length > 0) {
        setTrendingPosts(data);
        setLoading(false);
        return;
      }
    }
    fetchTrendingPosts();
  }, [user]); // Re-fetch if user (token) changes

  // Handle browser reload or swipe-down
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted || performance.navigation.type === 1) {
        // Reload or swipe-down
        localStorage.removeItem(CACHE_KEY); // Clear cache on reload
        fetchTrendingPosts();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [user]); // Include user in dependency array to handle token changes on reload

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) return <p>Loading trending posts...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="trending-section">
      <h2>Trending Posts</h2>
      <div className="trending-cards">
        {trendingPosts.map((post) => (
          <Link
            to={`/post/${post.slug}`}
            key={post.id}
            className="trending-card-link"
          >
            <div className="trending-card">
              <img
                src={post.featuredImageUrl}
                alt={post.title}
                className="trending-image"
              />
              <div className="trending-card-content">
                <h3 className="trending-title">{post.title}</h3>
                <p className="trending-meta">
                  By {post.authorName} | {formatDate(post.createdAt)}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default TrendingPosts;
