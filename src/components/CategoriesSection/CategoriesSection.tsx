import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { motion, useInView } from "framer-motion";
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
      if (event.persisted || performance.navigation.type === 1) {
        localStorage.removeItem(CACHE_KEY);
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
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Explore Categories
      </motion.h2>
      
      <div className="categories-list">
        {categoriesWithPosts.map((category, index) => {
          const CategoryItem = () => {
            const ref = React.useRef(null);
            const isInView = useInView(ref, {
              margin: "0px 0px -50px 0px",
              amount: 0.3
            });

            return (
              <motion.div
                ref={ref}
                className="category-item"
                initial={{ y: 50, opacity: 0 }}
                animate={isInView ? { y: 0, opacity: 1 } : {}}
                transition={{
                  type: "spring",
                  stiffness: 100,
                  damping: 10,
                  delay: index * 0.15
                }}
              >
                <h3>{category.name}</h3>
                
                <ul className="category-posts">
                  {category.posts.map((post, postIndex) => (
                    <motion.li
                      key={post.id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={isInView ? { x: 0, opacity: 1 } : {}}
                      transition={{
                        delay: 0.2 + (index * 0.1) + (postIndex * 0.05)
                      }}
                    >
                      <Link to={`/post/${post.slug}`}>{post.title}</Link>
                    </motion.li>
                  ))}
                </ul>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ delay: 0.3 + (index * 0.1) }}
                >
                  <Link
                    to={`/${category.name.toLowerCase().replace(/\s+/g, "-")}`}
                    className="see-more"
                  >
                    See More
                  </Link>
                </motion.div>
              </motion.div>
            );
          };

          return <CategoryItem key={category.id} />;
        })}
      </div>
    </section>
  );
};

export default CategoriesSection;