import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import "./MyPosts.css";

interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage: string;
  views: number;
  isFeatured: boolean;
  isLatestNews: boolean;
  createdAt: string;
  authorId: string;
  authorName: string;
  categoryId: number;
  categoryName: string;
  tags: string[];
  comments: any[];
}

const POSTS_PER_PAGE = 15;

const MyPosts: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const { user } = useUser();

  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const response = await fetch("https://voiceinfo.onrender.com/api/Post/all", {
          headers: {
            "Authorization": `Bearer ${user.token}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch posts");
        }
        const allPosts = await response.json();
        const userPosts = allPosts
          .filter((post: Post) => post.authorId === user.userId)
          .sort((a: Post, b: Post) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setPosts(userPosts);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchUserPosts();
  }, [user]);

  const handleDelete = async (postId: number) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      const response = await fetch(`https://voiceinfo.onrender.com/api/Post/delete/${postId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${user?.token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete post");
      }

      setPosts(posts.filter((post) => post.id !== postId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while deleting");
    }
  };

  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const endIndex = startIndex + POSTS_PER_PAGE;
  const currentPosts = posts.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!user) {
    return <div className="my-posts-message">Please sign in to view your posts.</div>;
  }

  if (loading) {
    return <div className="my-posts-message">Loading posts...</div>;
  }

  if (error) {
    return <div className="my-posts-message">Error: {error}</div>;
  }

  return (
    <div className="my-posts-wrapper">
      <div className="my-posts-container">
        <header className="my-posts-header">
          <h1>My Posts</h1>
          <Link to="/create-post" className="create-post-btn">
            Create New Post
          </Link>
        </header>
        {posts.length === 0 ? (
          <p className="no-posts">You haven't created any posts yet.</p>
        ) : (
          <>
            <div className="posts-table">
              <div className="table-header">
                <span className="header-title">Title</span>
                <span className="header-date">Date Created</span>
                <span className="header-action">Action</span>
              </div>
              <ul className="posts-list">
                {currentPosts.map((post) => (
                  <li key={post.id} className="post-item">
                    <Link to={`/post/${post.slug}`} className="post-title">
                      {post.title}
                    </Link>
                    <span className="post-date">{formatDate(post.createdAt)}</span>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="delete-button"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            {totalPages > 1 && (
              <nav className="pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="pagination-button"
                >
                  « Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`pagination-button ${currentPage === page ? "active" : ""}`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="pagination-button"
                >
                  Next »
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyPosts;