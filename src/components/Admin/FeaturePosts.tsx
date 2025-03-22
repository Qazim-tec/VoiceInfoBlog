import React, { useState, useEffect } from "react";
import { useUser } from "../../context/UserContext";
import "./FeaturePosts.css";

interface Post {
  id: number;
  title: string;
  createdAt: string;
  authorName: string;
  isFeatured: boolean;
  isLatestNews: boolean;
}

interface PaginatedResponse {
  items: Post[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

const POSTS_PER_PAGE = 15;
const CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutes

const FeaturePosts: React.FC = () => {
  const { user } = useUser();
  const [posts, setPosts] = useState<PaginatedResponse | null>(null);
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

  useEffect(() => {
    const fetchPosts = async (forceFetch = false) => {
      const cacheKey = `featurePosts_all_page_${currentPage[activeTab]}`;
      const cachedData = localStorage.getItem(cacheKey);
      const now = Date.now();

      // Skip cache if forceFetch is true (e.g., on page refresh)
      if (!forceFetch && cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        if (now - timestamp < CACHE_EXPIRY) {
          setPosts(data);
          setLoading(false);
          return;
        }
      }

      try {
        setLoading(true);
        const headers: Record<string, string> = {};
        if (user?.token) {
          headers["Authorization"] = `Bearer ${user.token}`;
        }

        const response = await fetch(
          `https://voiceinfo.onrender.com/api/Post/all-posts-light?page=${currentPage[activeTab]}&pageSize=${POSTS_PER_PAGE}`,
          { headers }
        );
        if (!response.ok) throw new Error("Failed to fetch posts");

        const data: PaginatedResponse = await response.json();
        setPosts(data);
        localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: now }));
      } catch (err) {
        setError((err as Error).message || "Failed to load posts");
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      // Check if this is a page refresh
      const isPageRefresh = performance.navigation.type === 1; // 1 = Reload
      fetchPosts(isPageRefresh); // Force fetch on refresh
    } else {
      setLoading(false);
    }
  }, [user?.token, currentPage, activeTab, isAdmin]);

  // Add event listener to detect pull-to-refresh or manual refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Optionally clear cache on unload to ensure next load is fresh
      for (let i = 1; i <= 100; i++) {
        localStorage.removeItem(`featurePosts_all_page_${i}`);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

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
        if (success) {
          setPosts((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              items: prev.items.map((post) =>
                post.id === postId ? { ...post, [type]: value } : post
              ),
            };
          });
          for (let i = 1; i <= 100; i++) {
            const cacheKey = `featurePosts_all_page_${i}`;
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
              const { data, timestamp } = JSON.parse(cached);
              localStorage.setItem(cacheKey, JSON.stringify({
                data: {
                  ...data,
                  items: data.items.map((post: Post) =>
                    post.id === postId ? { ...post, [type]: value } : post
                  ),
                },
                timestamp,
              }));
            }
          }
          if (postId === selectedPostId) setSelectedPostId(null);
        } else {
          setError("Update succeeded but returned false");
        }
      })
      .catch(() => {
        setError(`Failed to ${value ? "set" : "unset"} ${type === "isFeatured" ? "featured" : "latest news"} status`);
      })
      .finally(() => setSaving(false));
  };

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
        if (success) {
          setPosts((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              items: prev.items.filter((post) => post.id !== postId),
              totalItems: prev.totalItems - 1,
              totalPages: Math.ceil((prev.totalItems - 1) / prev.itemsPerPage),
            };
          });
          for (let i = 1; i <= 100; i++) {
            const cacheKey = `featurePosts_all_page_${i}`;
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
              const { data, timestamp } = JSON.parse(cached);
              localStorage.setItem(cacheKey, JSON.stringify({
                data: {
                  ...data,
                  items: data.items.filter((post: Post) => post.id !== postId),
                  totalItems: data.totalItems - 1,
                  totalPages: Math.ceil((data.totalItems - 1) / data.itemsPerPage),
                },
                timestamp,
              }));
            }
          }
        } else {
          setError("Delete succeeded but returned false");
        }
      })
      .catch(() => {
        setError("Failed to delete post");
      })
      .finally(() => setSaving(false));
  };

  const handleCheckboxChange = (postId: number) => {
    setSelectedPostId((prev) => (prev === postId ? null : postId));
  };

  const handlePageChange = (direction: "prev" | "next") => {
    setCurrentPage((prev) => {
      const totalPages = posts?.totalPages || 1;
      const newPage = direction === "prev" ? prev[activeTab] - 1 : prev[activeTab] + 1;
      if (newPage < 1 || newPage > totalPages) return prev;
      return { ...prev, [activeTab]: newPage };
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isAdmin) {
    return (
      <div className="featureposts-container">
        <p className="featureposts-error">Only admins can access this page.</p>
      </div>
    );
  }

  return (
    <div className="featureposts-container">
      <div className="featureposts-sidebar">
        <h3>Admin Menu</h3>
        <button
          className={`featureposts-sidebar-btn ${activeTab === "featured" ? "featureposts-active" : ""}`}
          onClick={() => setActiveTab("featured")}
        >
          Manage Featured Posts
        </button>
        <button
          className={`featureposts-sidebar-btn ${activeTab === "latest" ? "featureposts-active" : ""}`}
          onClick={() => setActiveTab("latest")}
        >
          Manage Latest News
        </button>
        <button
          className={`featureposts-sidebar-btn ${activeTab === "delete" ? "featureposts-active" : ""}`}
          onClick={() => setActiveTab("delete")}
        >
          Manage Delete Posts
        </button>
      </div>

      <div className="featureposts-content">
        {loading ? (
          <p>Loading posts...</p>
        ) : error ? (
          <p className="featureposts-error">{error}</p>
        ) : !posts ? (
          <p>No posts available</p>
        ) : (
          <>
            {activeTab === "featured" && (
              <>
                <h2>Manage Featured Posts</h2>
                <h3>Unfeatured Posts</h3>
                <ul className="featureposts-list">
                  {posts.items.filter((post) => !post.isFeatured).map((post) => (
                    <li key={post.id} className="featureposts-item">
                      <label>
                        <input
                          type="checkbox"
                          checked={selectedPostId === post.id}
                          onChange={() => handleCheckboxChange(post.id)}
                          disabled={saving}
                        />
                        {post.title} - {post.authorName} - {formatDateTime(post.createdAt)}
                      </label>
                    </li>
                  ))}
                </ul>
                <button
                  className="featureposts-feature-btn"
                  onClick={() => selectedPostId && togglePostStatus(selectedPostId, "isFeatured", true)}
                  disabled={saving || selectedPostId === null}
                >
                  {saving ? "Featuring..." : "Feature Selected Post"}
                </button>

                <div className="featureposts-pagination">
                  <button
                    onClick={() => handlePageChange("prev")}
                    disabled={currentPage[activeTab] === 1}
                    className="featureposts-pagination-btn"
                  >
                    Previous
                  </button>
                  <span className="featureposts-pagination-info">
                    Page {currentPage[activeTab]} of {posts.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange("next")}
                    disabled={currentPage[activeTab] === posts.totalPages}
                    className="featureposts-pagination-btn"
                  >
                    Next
                  </button>
                </div>

                <h3>Featured Posts</h3>
                <ul className="featureposts-list">
                  {posts.items.filter((post) => post.isFeatured).map((post) => (
                    <li key={post.id} className="featureposts-item featureposts-featured">
                      <span>{post.title} - {post.authorName} - {formatDateTime(post.createdAt)}</span>
                      <button
                        className="featureposts-unfeature-btn"
                        onClick={() => togglePostStatus(post.id, "isFeatured", false)}
                        disabled={saving}
                      >
                        Unfeature
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {activeTab === "latest" && (
              <>
                <h2>Manage Latest News</h2>
                <h3>Non-Latest Posts</h3>
                <ul className="featureposts-list">
                  {posts.items.filter((post) => !post.isLatestNews).map((post) => (
                    <li key={post.id} className="featureposts-item">
                      <label>
                        <input
                          type="checkbox"
                          checked={selectedPostId === post.id}
                          onChange={() => handleCheckboxChange(post.id)}
                          disabled={saving}
                        />
                        {post.title} - {post.authorName} - {formatDateTime(post.createdAt)}
                      </label>
                    </li>
                  ))}
                </ul>
                <button
                  className="featureposts-feature-btn"
                  onClick={() => selectedPostId && togglePostStatus(selectedPostId, "isLatestNews", true)}
                  disabled={saving || selectedPostId === null}
                >
                  {saving ? "Marking..." : "Mark as Latest News"}
                </button>

                <div className="featureposts-pagination">
                  <button
                    onClick={() => handlePageChange("prev")}
                    disabled={currentPage[activeTab] === 1}
                    className="featureposts-pagination-btn"
                  >
                    Previous
                  </button>
                  <span className="featureposts-pagination-info">
                    Page {currentPage[activeTab]} of {posts.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange("next")}
                    disabled={currentPage[activeTab] === posts.totalPages}
                    className="featureposts-pagination-btn"
                  >
                    Next
                  </button>
                </div>

                <h3>Latest News Posts</h3>
                <ul className="featureposts-list">
                  {posts.items.filter((post) => post.isLatestNews).map((post) => (
                    <li key={post.id} className="featureposts-item featureposts-featured">
                      <span>{post.title} - {post.authorName} - {formatDateTime(post.createdAt)}</span>
                      <button
                        className="featureposts-unfeature-btn"
                        onClick={() => togglePostStatus(post.id, "isLatestNews", false)}
                        disabled={saving}
                      >
                        Unmark
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {activeTab === "delete" && (
              <>
                <h2>Manage Delete Posts</h2>
                <h3>All Posts</h3>
                <ul className="featureposts-list">
                  {posts.items.map((post) => (
                    <li key={post.id} className="featureposts-item">
                      <span>{post.title} - {post.authorName} - {formatDateTime(post.createdAt)}</span>
                      <button
                        className="featureposts-delete-btn"
                        onClick={() => handleDeletePost(post.id)}
                        disabled={saving}
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="featureposts-pagination">
                  <button
                    onClick={() => handlePageChange("prev")}
                    disabled={currentPage[activeTab] === 1}
                    className="featureposts-pagination-btn"
                  >
                    Previous
                  </button>
                  <span className="featureposts-pagination-info">
                    Page {currentPage[activeTab]} of {posts.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange("next")}
                    disabled={currentPage[activeTab] === posts.totalPages}
                    className="featureposts-pagination-btn"
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