import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { motion, useInView } from "framer-motion";
import { API_BASE_URL } from "../../config/apiConfig"; // Added import
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

      const response = await fetch(`${API_BASE_URL}/api/Category/top-posts?postsPerCategory=3`, { headers });
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

  // Loading animation variants for container
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
          Loading Categories...
        </motion.p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.p
        className="error"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {error}
      </motion.p>
    );
  }

  return (
    <section className="categories-section">
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        Explore Categories
      </motion.h2>
      
      <div className="categories-list">
        {categoriesWithPosts.map((category) => {
          const CategoryItem = () => {
            const ref = React.useRef(null);
            const isInView = useInView(ref, {
              margin: "0px 0px -20px 0px",
              amount: 0.08
            });

            return (
              <motion.div
                ref={ref}
                className="category-item"
                initial={{ opacity: 0, y: 15 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ 
                  duration: 0.22,
                  ease: "easeOut"
                }}
              >
                <h3>{category.name}</h3>
                
                <ul className="category-posts">
                  {category.posts.map((post) => (
                    <motion.li
                      key={post.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{
                        duration: 0.18,
                        ease: "easeOut"
                      }}
                    >
                      <Link to={`/post/${post.slug}`}>{post.title}</Link>
                    </motion.li>
                  ))}
                </ul>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.2 }}
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