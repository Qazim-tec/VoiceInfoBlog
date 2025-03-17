// components/LatestNews/LatestNews.tsx (unchanged)
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './LatestNews.css';

interface Post {
  id: number;
  title: string;
  excerpt: string;
  featuredImage: string;
  slug: string;
  isFeatured: boolean;
  content: string;
  views: number;
  isLatestNews: boolean;
  createdAt: string;
  authorId: string;
  authorName: string;
  categoryId: number;
  categoryName: string;
  tags: string[];
  comments: { id: number; content: string; createdAt: string; userId: string }[];
}

const LatestNews: React.FC = () => {
  const [latestPosts, setLatestPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 15;

  useEffect(() => {
    const fetchLatestNews = async () => {
      try {
        const response = await fetch('https://localhost:7094/api/Post/all');
        if (!response.ok) throw new Error('Failed to fetch posts');

        const data: Post[] = await response.json();
        const filteredPosts = data
          .filter((post) => post.isLatestNews === true)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setLatestPosts(filteredPosts);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestNews();
  }, []);

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) return <div className="latest-news-loading">Loading latest news...</div>;
  if (error) return <div className="latest-news-error">Error: {error}</div>;
  if (!latestPosts.length) return <div className="latest-news-empty">No latest news available.</div>;

  const totalPosts = latestPosts.length;
  const totalPages = Math.ceil(totalPosts / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const endIndex = startIndex + postsPerPage;
  const currentPosts = latestPosts.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <section className="latest-news-section">
      <h2>Latest News</h2>
      <ul className="latest-news-list">
        {currentPosts.map((post) => (
          <li key={post.id} className="latest-news-item">
            <img
              src={post.featuredImage.startsWith('data:image') ? post.featuredImage : `data:image/png;base64,${post.featuredImage}`}
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