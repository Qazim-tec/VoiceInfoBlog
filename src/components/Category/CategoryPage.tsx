import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import "./CategoryPage.css";

interface Post {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  featuredImage: string | null;
  views: number;
  isFeatured: boolean;
  createdAt: string;
  slug: string;
  authorId: string;
  authorName: string | null;
  categoryId: number | null;
  categoryName: string | null;
  tags: string[];
  comments: any[];
}

const POSTS_PER_PAGE = 15;

const CategoryPage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const { user } = useUser();
  const { categoryName } = useParams<{ categoryName: string }>();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const headers: HeadersInit = {};
        if (user?.token) {
          headers["Authorization"] = `Bearer ${user.token}`;
        }

        const response = await fetch("https://voiceinfo.onrender.com/api/Post/all", {
          headers,
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch posts");
        }
        
        const allPosts: Post[] = await response.json();
        const filteredPosts = allPosts.filter(
          (post) =>
            post.categoryName?.toLowerCase() === categoryName?.toLowerCase()
        );
        setPosts(filteredPosts);
      } catch (err) {
        setError((err as Error).message || "An error occurred while fetching posts");
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts(); // Fetch posts regardless of user authentication
  }, [categoryName, user?.token]); // Refetch when categoryName or token changes

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const endIndex = startIndex + POSTS_PER_PAGE;
  const currentPosts = posts.slice(startIndex, endIndex);

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
            {currentPosts.map((post) => (
              <div key={post.id} className="post-item">
                <div className="post-image-container">
                  {post.featuredImage ? (
                    <img
                      src={`data:image/jpeg;base64,${post.featuredImage}`}
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