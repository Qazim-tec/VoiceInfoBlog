import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import './LatestNews.css';

interface Post {
  id: number;
  title: string;
  excerpt: string;
  featuredImageUrl: string;
  slug: string;
  isFeatured: boolean;
  content: string;
  views: number;
  isLatestNews: boolean;
  createdAt: string;
  authorId: string;
  authorName: string;
  categoryId: number | null;
  categoryName: string;
  tags: string[];
  comments: { id: number; content: string; createdAt: string; userId: string }[];
}

interface PaginatedResponse {
  items: Post[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

const CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutes in milliseconds
const CACHE_VERSION_KEY = 'latestNews_cache_version';

const LatestNews: React.FC = () => {
  const [latestPosts, setLatestPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const topRef = useRef<HTMLDivElement>(null);

  const getCacheKey = (page: number) => `latestNews_page_${page}`;

  const clearAllCaches = () => {
    const newVersion = Date.now().toString();
    localStorage.setItem(CACHE_VERSION_KEY, newVersion);
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith('latestNews_page_')) {
        localStorage.removeItem(key);
      }
    });
  };

  const getCurrentCacheVersion = () => {
    return localStorage.getItem(CACHE_VERSION_KEY) || '0';
  };

  const fetchLatestNews = async (page: number) => {
    const cacheKey = getCacheKey(page);
    const cachedData = localStorage.getItem(cacheKey);
    const currentVersion = getCurrentCacheVersion();

    if (cachedData) {
      const { data, timestamp, version } = JSON.parse(cachedData);
      if (Date.now() - timestamp < CACHE_EXPIRY && version === currentVersion) {
        setLatestPosts(data.items);
        setTotalPages(data.totalPages);
        setLoading(false);
        return;
      }
    }

    try {
      setLoading(true);
      const response = await fetch(`https://voiceinfo.onrender.com/api/LatestNews?page=${page}&t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        cache: 'no-store',
      });

      if (!response.ok) throw new Error('Failed to fetch latest news');

      const data: PaginatedResponse = await response.json();
      setLatestPosts(data.items);
      setTotalPages(data.totalPages);
      localStorage.setItem(cacheKey, JSON.stringify({
        data: { items: data.items, totalPages: data.totalPages },
        timestamp: Date.now(),
        version: currentVersion,
      }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestNews(currentPage);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  useEffect(() => {
    if (!localStorage.getItem(CACHE_VERSION_KEY)) {
      localStorage.setItem(CACHE_VERSION_KEY, '0');
    }

    const handleRefresh = () => {
      clearAllCaches();
      fetchLatestNews(currentPage);
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

    window.addEventListener('pageshow', handlePageShow);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', clearAllCaches);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', clearAllCaches);
    };
  }, [currentPage]);

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Alternative scroll method using ref
      topRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) return <div className="latest-news-loading">Loading latest news...</div>;
  if (error) return <div className="latest-news-error">Error: {error}</div>;
  if (!latestPosts.length) return <div className="latest-news-empty">No latest news available.</div>;

  return (
    <section className="latest-news-section" ref={topRef}>
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Latest News
      </motion.h2>
      
      <ul className="latest-news-list">
        {latestPosts.map((post, index) => (
          <NewsItem 
            key={post.id} 
            post={post} 
            index={index}
            formatDateTime={formatDateTime}
          />
        ))}
      </ul>
      
      <motion.div 
        className="pagination"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="pagination-btn"
        >
          Previous
        </button>
        <span className="pagination-info">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="pagination-btn"
        >
          Next
        </button>
      </motion.div>
    </section>
  );
};

const NewsItem: React.FC<{
  post: Post;
  index: number;
  formatDateTime: (dateString: string) => string;
}> = ({ post, index, formatDateTime }) => {
  const ref = useRef<HTMLLIElement>(null);
  const isInView = useInView(ref, {
    margin: "0px 0px -100px 0px",
    amount: 0.2
  });

  const variants = {
    hidden: { 
      y: 50, 
      opacity: 0,
      transition: { duration: 0.3 }
    },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10,
        delay: index * 0.1
      }
    }
  };

  return (
    <motion.li
      ref={ref}
      className="latest-news-item"
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
    >
      <motion.div
        className="image-container"
        whileHover={{ scale: 1.03 }}
        transition={{ duration: 0.3 }}
      >
        <img src={post.featuredImageUrl} alt={post.title} className="latest-news-image" />
      </motion.div>
      
      <div className="latest-news-content">
        <Link to={`/post/${post.slug}`} className="latest-news-link">
          <motion.h3 
            whileHover={{ color: "#0077cc" }}
            transition={{ duration: 0.2 }}
          >
            {post.title}
          </motion.h3>
        </Link>
        
        <motion.p 
          className="latest-news-meta"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: index * 0.1 + 0.2 }}
        >
          By {post.authorName} | {formatDateTime(post.createdAt)}
        </motion.p>
      </div>
    </motion.li>
  );
};

export default LatestNews;