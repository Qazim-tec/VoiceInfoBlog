import React, { useState, useEffect } from "react";
import { useUser } from "../../context/UserContext"; // Adjust path as needed
import "./FeaturePosts.css";

interface Post {
  id: number;
  title: string;
  isFeatured: boolean;
  isLatestNews: boolean;
  createdAt: string; // Assuming this exists for sorting
}

const FeaturePosts: React.FC = () => {
  const { user } = useUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"featured" | "latest" | "delete">("featured");
  const [currentPage, setCurrentPage] = useState<{ [key: string]: number }>({
    featured: 1,
    latest: 1,
    delete: 1,
  });

  const isAdmin = user?.role === "Admin";
  const postsPerPage = 15;

  // Fetch and sort posts on mount
  useEffect(() => {
    const headers: Record<string, string> = {};
    if (user?.token) {
      headers["Authorization"] = `Bearer ${user.token}`;
    }

    fetch("https://voiceinfo.onrender.com/api/Post/all", { headers })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch posts");
        return res.json();
      })
      .then((data: Post[]) => {
        // Sort posts by createdAt, newest first
        const sortedPosts = data.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setPosts(sortedPosts);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch Error:", err);
        setError("Failed to load posts");
        setLoading(false);
      });
  }, [user]);

  // Toggle Featured or Latest News status
  const togglePostStatus = (
    postId: number,
    type: "isFeatured" | "isLatestNews",
    value: boolean
  ) => {
    if (!isAdmin) return;

    setSaving(true);
    setError(null);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (user?.token) {
      headers["Authorization"] = `Bearer ${user.token}`;
    }

    const endpoint =
      type === "isFeatured"
        ? `https://voiceinfo.onrender.com/api/Post/feature/${postId}?isFeatured=${value}`
        : `https://voiceinfo.onrender.com/api/Post/latest-news/${postId}?isLatestNews=${value}`;

    fetch(endpoint, {
      method: "PUT",
      headers,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to update post (status: ${res.status})`);
        return res.json();
      })
      .then((success) => {
        console.log(`${type} Response:`, success);
        if (success) {
          setPosts((prevPosts) =>
            prevPosts.map((post) =>
              post.id === postId ? { ...post, [type]: value } : post
            )
          );
          if (postId === selectedPostId) setSelectedPostId(null);
        } else {
          setError("Update succeeded but returned false");
        }
      })
      .catch((err) => {
        console.error(`${type} Error:`, err);
        setError(`Failed to ${value ? "set" : "unset"} ${type === "isFeatured" ? "featured" : "latest news"} status`);
      })
      .finally(() => setSaving(false));
  };

  // Delete a post
  const handleDeletePost = (postId: number) => {
    if (!isAdmin) return;

    const confirmDelete = window.confirm("Are you sure you want to permanently delete this post?");
    if (!confirmDelete) return;

    setSaving(true);
    setError(null);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (user?.token) {
      headers["Authorization"] = `Bearer ${user.token}`;
    }

    fetch(`https://voiceinfo.onrender.com/api/Post/delete/${postId}`, {
      method: "DELETE",
      headers,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to delete post (status: ${res.status})`);
        return res.json();
      })
      .then((success) => {
        console.log("Delete Response:", success);
        if (success) {
          setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
        } else {
          setError("Delete succeeded but returned false");
        }
      })
      .catch((err) => {
        console.error("Delete Error:", err);
        setError("Failed to delete post");
      })
      .finally(() => setSaving(false));
  };

  const handleCheckboxChange = (postId: number) => {
    setSelectedPostId((prev) => (prev === postId ? null : postId));
  };

  // Pagination logic
  const getPaginatedPosts = (postList: Post[]) => {
    const page = currentPage[activeTab];
    const startIndex = (page - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    return postList.slice(startIndex, endIndex);
  };

  const getTotalPages = (postList: Post[]) => {
    return Math.ceil(postList.length / postsPerPage);
  };

  const handlePageChange = (direction: "prev" | "next", totalPages: number) => {
    setCurrentPage((prev) => {
      const newPage = direction === "prev" ? prev[activeTab] - 1 : prev[activeTab] + 1;
      if (newPage < 1 || newPage > totalPages) return prev;
      return { ...prev, [activeTab]: newPage };
    });
  };

  if (!isAdmin) {
    return (
      <div className="admin-container">
        <p className="error">Only admins can access this page.</p>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="sidebar">
        <h3>Admin Menu</h3>
        <button
          className={`sidebar-btn ${activeTab === "featured" ? "active" : ""}`}
          onClick={() => setActiveTab("featured")}
        >
          Manage Featured Posts
        </button>
        <button
          className={`sidebar-btn ${activeTab === "latest" ? "active" : ""}`}
          onClick={() => setActiveTab("latest")}
        >
          Manage Latest News
        </button>
        <button
          className={`sidebar-btn ${activeTab === "delete" ? "active" : ""}`}
          onClick={() => setActiveTab("delete")}
        >
          Manage Delete Posts
        </button>
      </div>

      <div className="content-area">
        {loading ? (
          <p>Loading posts...</p>
        ) : error ? (
          <p className="error">{error}</p>
        ) : (
          <>
            {activeTab === "featured" && (
              <>
                <h2>Manage Featured Posts</h2>
                <h3>Unfeatured Posts</h3>
                <ul className="post-list">
                  {getPaginatedPosts(posts.filter((post) => !post.isFeatured)).map((post) => (
                    <li key={post.id} className="post-item">
                      <label>
                        <input
                          type="checkbox"
                          checked={selectedPostId === post.id}
                          onChange={() => handleCheckboxChange(post.id)}
                          disabled={saving}
                        />
                        {post.title}
                      </label>
                    </li>
                  ))}
                </ul>
                <button
                  className="feature-button"
                  onClick={() => selectedPostId && togglePostStatus(selectedPostId, "isFeatured", true)}
                  disabled={saving || selectedPostId === null}
                >
                  {saving ? "Featuring..." : "Feature Selected Post"}
                </button>

                <div className="pagination">
                  <button
                    onClick={() => handlePageChange("prev", getTotalPages(posts.filter((post) => !post.isFeatured)))}
                    disabled={currentPage[activeTab] === 1}
                    className="pagination-btn"
                  >
                    Previous
                  </button>
                  <span className="pagination-info">
                    Page {currentPage[activeTab]} of {getTotalPages(posts.filter((post) => !post.isFeatured))}
                  </span>
                  <button
                    onClick={() => handlePageChange("next", getTotalPages(posts.filter((post) => !post.isFeatured)))}
                    disabled={currentPage[activeTab] === getTotalPages(posts.filter((post) => !post.isFeatured))}
                    className="pagination-btn"
                  >
                    Next
                  </button>
                </div>

                <h3>Featured Posts</h3>
                <ul className="post-list">
                  {getPaginatedPosts(posts.filter((post) => post.isFeatured)).map((post) => (
                    <li key={post.id} className="post-item featured">
                      <span>{post.title}</span>
                      <button
                        className="unfeature-button"
                        onClick={() => togglePostStatus(post.id, "isFeatured", false)}
                        disabled={saving}
                      >
                        Unfeature
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="pagination">
                  <button
                    onClick={() => handlePageChange("prev", getTotalPages(posts.filter((post) => post.isFeatured)))}
                    disabled={currentPage[activeTab] === 1}
                    className="pagination-btn"
                  >
                    Previous
                  </button>
                  <span className="pagination-info">
                    Page {currentPage[activeTab]} of {getTotalPages(posts.filter((post) => post.isFeatured))}
                  </span>
                  <button
                    onClick={() => handlePageChange("next", getTotalPages(posts.filter((post) => post.isFeatured)))}
                    disabled={currentPage[activeTab] === getTotalPages(posts.filter((post) => post.isFeatured))}
                    className="pagination-btn"
                  >
                    Next
                  </button>
                </div>
              </>
            )}

            {activeTab === "latest" && (
              <>
                <h2>Manage Latest News</h2>
                <h3>Non-Latest Posts</h3>
                <ul className="post-list">
                  {getPaginatedPosts(posts.filter((post) => !post.isLatestNews)).map((post) => (
                    <li key={post.id} className="post-item">
                      <label>
                        <input
                          type="checkbox"
                          checked={selectedPostId === post.id}
                          onChange={() => handleCheckboxChange(post.id)}
                          disabled={saving}
                        />
                        {post.title}
                      </label>
                    </li>
                  ))}
                </ul>
                <button
                  className="feature-button"
                  onClick={() => selectedPostId && togglePostStatus(selectedPostId, "isLatestNews", true)}
                  disabled={saving || selectedPostId === null}
                >
                  {saving ? "Marking..." : "Mark as Latest News"}
                </button>

                <div className="pagination">
                  <button
                    onClick={() => handlePageChange("prev", getTotalPages(posts.filter((post) => !post.isLatestNews)))}
                    disabled={currentPage[activeTab] === 1}
                    className="pagination-btn"
                  >
                    Previous
                  </button>
                  <span className="pagination-info">
                    Page {currentPage[activeTab]} of {getTotalPages(posts.filter((post) => !post.isLatestNews))}
                  </span>
                  <button
                    onClick={() => handlePageChange("next", getTotalPages(posts.filter((post) => !post.isLatestNews)))}
                    disabled={currentPage[activeTab] === getTotalPages(posts.filter((post) => !post.isLatestNews))}
                    className="pagination-btn"
                  >
                    Next
                  </button>
                </div>

                <h3>Latest News Posts</h3>
                <ul className="post-list">
                  {getPaginatedPosts(posts.filter((post) => post.isLatestNews)).map((post) => (
                    <li key={post.id} className="post-item featured">
                      <span>{post.title}</span>
                      <button
                        className="unfeature-button"
                        onClick={() => togglePostStatus(post.id, "isLatestNews", false)}
                        disabled={saving}
                      >
                        Unmark
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="pagination">
                  <button
                    onClick={() => handlePageChange("prev", getTotalPages(posts.filter((post) => post.isLatestNews)))}
                    disabled={currentPage[activeTab] === 1}
                    className="pagination-btn"
                  >
                    Previous
                  </button>
                  <span className="pagination-info">
                    Page {currentPage[activeTab]} of {getTotalPages(posts.filter((post) => post.isLatestNews))}
                  </span>
                  <button
                    onClick={() => handlePageChange("next", getTotalPages(posts.filter((post) => post.isLatestNews)))}
                    disabled={currentPage[activeTab] === getTotalPages(posts.filter((post) => post.isLatestNews))}
                    className="pagination-btn"
                  >
                    Next
                  </button>
                </div>
              </>
            )}

            {activeTab === "delete" && (
              <>
                <h2>Manage Delete Posts</h2>
                <h3>All Posts</h3>
                <ul className="post-list">
                  {getPaginatedPosts(posts).map((post) => (
                    <li key={post.id} className="post-item">
                      <span>{post.title}</span>
                      <button
                        className="delete-button"
                        onClick={() => handleDeletePost(post.id)}
                        disabled={saving}
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="pagination">
                  <button
                    onClick={() => handlePageChange("prev", getTotalPages(posts))}
                    disabled={currentPage[activeTab] === 1}
                    className="pagination-btn"
                  >
                    Previous
                  </button>
                  <span className="pagination-info">
                    Page {currentPage[activeTab]} of {getTotalPages(posts)}
                  </span>
                  <button
                    onClick={() => handlePageChange("next", getTotalPages(posts))}
                    disabled={currentPage[activeTab] === getTotalPages(posts)}
                    className="pagination-btn"
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FeaturePosts;