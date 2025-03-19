import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import "./MyPosts.css";

interface Post {
  id: number;
  title: string;
  slug: string;
  createdAt: string;
  authorId: string;
  authorName: string;
}

const POSTS_PER_PAGE = 3; // Small value for testing pagination visibility

const MyPosts: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  useEffect(() => {
    const fetchPosts = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const response = await fetch("https://voiceinfo.onrender.com/api/Post/all", {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch posts");
        }

        const allPosts: Post[] = await response.json();
        const userPosts = allPosts
          .filter((post) => post.authorId === user.userId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setPosts(userPosts);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [user]);

  const handleDelete = async (postId: number) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      const response = await fetch(`https://voiceinfo.onrender.com/api/Post/delete/${postId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete post");
      }

      const updatedPosts = posts.filter((post) => post.id !== postId);
      setPosts(updatedPosts);
      const totalPagesAfterDelete = Math.ceil(updatedPosts.length / POSTS_PER_PAGE);
      if (currentPage > totalPagesAfterDelete && totalPagesAfterDelete > 0) {
        setCurrentPage(totalPagesAfterDelete);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const totalPosts = posts.length;
  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const endIndex = Math.min(startIndex + POSTS_PER_PAGE, totalPosts);
  const currentPosts = posts.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!user) {
    return <div className="myposts-message">Please sign in to view your posts.</div>;
  }

  if (loading) {
    return <div className="myposts-message">Loading your posts...</div>;
  }

  if (error) {
    return <div className="myposts-message">Error: {error}</div>;
  }

  return (
    <section className="myposts-wrapper">
      <div className="myposts-container">
        <header className="myposts-header">
          <h1>My Posts ({totalPosts})</h1>
          <Link to="/create-post" className="myposts-create-btn">
            Create New Post
          </Link>
        </header>

        {posts.length === 0 ? (
          <p className="myposts-no-posts">No posts yet. Start writing!</p>
        ) : (
          <>
            <ul className="myposts-list">
              {currentPosts.map((post) => (
                <li key={post.id} className="myposts-item">
                  <div className="myposts-details">
                    <Link to={`/post/${post.slug}`} className="myposts-title">
                      {post.title}
                    </Link>
                    <span className="myposts-date">{formatDate(post.createdAt)}</span>
                  </div>
                  <button
                    className="myposts-delete-btn"
                    onClick={() => handleDelete(post.id)}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>

            <nav className="myposts-pagination">
              <button
                className="myposts-pagination-btn myposts-prev"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`myposts-pagination-btn myposts-page ${currentPage === page ? "myposts-active" : ""}`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              ))}
              <button
                className="myposts-pagination-btn myposts-next"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </nav>
          </>
        )}
      </div>
    </section>
  );
};

export default MyPosts;