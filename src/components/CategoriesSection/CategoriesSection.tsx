import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import "./CategoriesSection.css";

interface Post {
  id: number;
  title: string;
  slug: string;
  createdAt: string;
  categoryId: number;
  categoryName?: string;
}

interface CategoryWithPosts {
  id: number;
  name: string;
  posts: Post[];
}

const CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutes in milliseconds
const CACHE_KEY = "categoriesWithPosts";

const CategoriesSection: React.FC = () => {
  const { user } = useUser();
  const [categoriesWithPosts, setCategoriesWithPosts] = useState<CategoryWithPosts[]>(() => {
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

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers: Record<string, string> = {};
      if (user?.token) {
        headers["Authorization"] = `Bearer ${user.token}`;
      }

      const response = await fetch("https://voiceinfo.onrender.com/api/Category/top-posts?postsPerCategory=3", { headers });
      if (!response.ok) {
        throw new Error("Failed to fetch categories with posts");
      }

      const data: CategoryWithPosts[] = await response.json();
      setCategoriesWithPosts(data);
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
    } catch (err) {
      console.error("Fetch Error:", err);
      setError("Failed to load categories or posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      if (Date.now() - timestamp < CACHE_EXPIRY) {
        setCategoriesWithPosts(data);
        setLoading(false);
        return;
      }
    }
    fetchData();
  }, [user?.token]);

  // Handle browser reload or swipe-down
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted || performance.navigation.type === 1) { // Reload or swipe-down
        localStorage.removeItem(CACHE_KEY); // Clear cache on reload
        fetchData();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [user?.token]);

  if (loading) return <p>Loading categories...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <section className="categories-section">
      <h2>Explore Categories</h2>
      <div className="categories-list">
        {categoriesWithPosts.map(category => (
          <div key={category.id} className="category-item">
            <h3>{category.name}</h3>
            <ul className="category-posts">
              {category.posts.map(post => (
                <li key={post.id}>
                  <Link to={`/post/${post.slug}`}>{post.title}</Link>
                </li>
              ))}
            </ul>
            <Link to={`/${category.name.toLowerCase().replace(/\s+/g, "-")}`} className="see-more">
              See More
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CategoriesSection;