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

interface PaginatedResponse {
  items: Post[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

const POSTS_PER_PAGE = 15; // Updated to 15 posts per page

const MyPosts: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0); // Added to track total posts
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  useEffect(() => {
    const fetchPosts = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const response = await fetch(`https://voiceinfo.onrender.com/api/MyPosts?page=${currentPage}`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch your posts");
        }

        const data: PaginatedResponse = await response.json();
        setPosts(data.items);
        setTotalPages(data.totalPages);
        setTotalItems(data.totalItems); // Set the total number of posts
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [user, currentPage]);

  const handleDelete = async (postId: number) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      const response = await fetch(`https://voiceinfo.onrender.com/api/Posts/${postId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete post");
      }

      // Update posts after deletion
      const updatedPosts = posts.filter((post) => post.id !== postId);
      setPosts(updatedPosts);
      const totalPostsAfterDelete = totalItems - 1;
      const totalPagesAfterDelete = Math.ceil(totalPostsAfterDelete / POSTS_PER_PAGE);
      setTotalItems(totalPostsAfterDelete);
      setTotalPages(totalPagesAfterDelete || 1);
      if (currentPage > totalPagesAfterDelete && totalPagesAfterDelete > 0) {
        setCurrentPage(totalPagesAfterDelete);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

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
          <h1>My Posts ({totalItems})</h1> {/* Updated to use totalItems */}
          <Link to="/create-post" className="myposts-create-btn">
            Create New Post
          </Link>
        </header>

        {posts.length === 0 && currentPage === 1 ? (
          <p className="myposts-no-posts">No posts yet. Start writing!</p>
        ) : (
          <>
            <ul className="myposts-list">
              {posts.map((post) => (
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