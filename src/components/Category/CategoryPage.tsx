import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useUser } from "../../context/UserContext";
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

interface PaginatedResponse {
  items: Post[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

const POSTS_PER_PAGE = 15;
const CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutes in milliseconds

const CategoryPage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const { user } = useUser();
  const { categoryName } = useParams<{ categoryName: string }>();

  useEffect(() => {
    const fetchPosts = async () => {
      if (!categoryName) {
        setError("Category name is missing.");
        setLoading(false);
        return;
      }

      const cacheKey = `category_${categoryName.toLowerCase()}_page_${currentPage}`;
      const cachedData = localStorage.getItem(cacheKey);
      const now = Date.now();

      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        if (now - timestamp < CACHE_EXPIRY) {
          setPosts(data.items);
          setTotalPages(data.totalPages);
          setLoading(false);
          return;
        }
      }

      try {
        setLoading(true);
        const headers: HeadersInit = {};
        if (user?.token) {
          headers["Authorization"] = `Bearer ${user.token}`;
        }

        const response = await fetch(
          `https://voiceinfo.onrender.com/api/Category/${encodeURIComponent(categoryName)}/posts?page=${currentPage}&pageSize=${POSTS_PER_PAGE}`,
          { headers }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch posts: ${response.statusText}`);
        }

        const data: PaginatedResponse = await response.json();
        setPosts(data.items);
        setTotalPages(data.totalPages);

        // Cache the response
        localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: now }));
      } catch (err) {
        setError((err as Error).message || "An error occurred while fetching posts");
        setPosts([]);
        setTotalPages(0);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [categoryName, currentPage, user?.token]);

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

  if (loading) return <div className="category-page loading">Loading posts...</div>;
  if (error) return <div className="category-page error">{error}</div>;

  return (
    <div className="category-page">
      <h1>{categoryName} News</h1>
      {posts.length === 0 ? (
        <p className="no-posts">No posts found in this category.</p>
      ) : (
        <>
          <div className="posts-list">
            {posts.map((post) => (
              <div key={post.id} className="post-item">
                <div className="post-image-container">
                  {post.featuredImageUrl ? (
                    <img
                      src={post.featuredImageUrl}
                      alt={post.title}
                      className="post-image"
                    />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                </div>
                <div className="post-content">
                  <Link to={`/post/${post.slug}`} className="post-title-link">
                    <h2 className="post-title">{post.title}</h2>
                  </Link>
                  <p className="post-meta">
                    By {post.authorName || "Unknown"} • {formatDate(post.createdAt)}
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