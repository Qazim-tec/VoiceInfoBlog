import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

    // Check cache first
    if (cachedData) {
      const { data, timestamp, version } = JSON.parse(cachedData);
      if (Date.now() - timestamp < CACHE_EXPIRY && version === currentVersion) {
        // console.log('Loaded from cache');
        setLatestPosts(data.items);
        setTotalPages(data.totalPages);
        setLoading(false);
        return;
      }
    }

    try {
      setLoading(true);
      // Add timestamp to URL to bust server-side cache
      const response = await fetch(`https://voiceinfo.onrender.com/api/LatestNews?page=${page}&t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        cache: 'no-store', // Disable browser fetch cache
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

  // Fetch data when page changes
  useEffect(() => {
    fetchLatestNews(currentPage);
  }, [currentPage]);

  // Handle reloads and swipe-down refreshes
  useEffect(() => {
    // Initialize cache version if missing
    if (!localStorage.getItem(CACHE_VERSION_KEY)) {
      localStorage.setItem(CACHE_VERSION_KEY, '0');
    }

    const handleRefresh = () => {
      // console.log('Refresh triggered');
      clearAllCaches();
      fetchLatestNews(currentPage);
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
    window.addEventListener('pageshow', handlePageShow);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', clearAllCaches); // Clear cache before leaving

    // Cleanup
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
    }
  };

  if (loading) return <div className="latest-news-loading">Loading latest news...</div>;
  if (error) return <div className="latest-news-error">Error: {error}</div>;
  if (!latestPosts.length) return <div className="latest-news-empty">No latest news available.</div>;

  return (
    <section className="latest-news-section">
      <h2>Latest News</h2>
      <ul className="latest-news-list">
        {latestPosts.map((post) => (
          <li key={post.id} className="latest-news-item">
            <img
              src={post.featuredImageUrl}
              alt={post.title}
              className="latest-news-image"
            />
            <div className="latest-news-content">
              <Link to={`/post/${post.slug}`} className="latest-news-link">
                <h3>{post.title}</h3>
              </Link>
              <p className="latest-news-meta">
                By {post.authorName} | {formatDateTime(post.createdAt)}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <div className="pagination">
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
      </div>
    </section>
  );
};

export default LatestNews;