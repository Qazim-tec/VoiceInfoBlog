import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useUser } from "../../context/UserContext";
import "./PostDetail.css";

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  userId: string;
  userName: string;
  parentCommentId: number | null;
  replies: Comment[];
}

interface Post {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  featuredImage: string;
  views: number;
  isFeatured: boolean;
  createdAt: string;
  slug: string;
  authorId: string;
  authorName: string;
  categoryId: number;
  categoryName: string;
  tags: string[];
  comments: Comment[];
}

const PostDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editedContent, setEditedContent] = useState("");

  const { user } = useUser();
  const currentUserId = user?.userId || "";
  const isAdmin = user?.role === "Admin";
  const isLoggedIn = !!user;

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const allPostsResponse = await fetch(
          "https://localhost:7094/api/Post/all"
        );
        if (!allPostsResponse.ok) {
          throw new Error("Failed to fetch posts");
        }
        const allPosts: Post[] = await allPostsResponse.json();
        const foundPost = allPosts.find((p) => p.slug === slug);
        if (!foundPost) {
          throw new Error("Post not found");
        }

        const postResponse = await fetch(
          `https://localhost:7094/api/Post/${foundPost.id}`
        );
        if (!postResponse.ok) {
          throw new Error("Failed to fetch post details");
        }
        const postData: Post = await postResponse.json();

        setPost(postData);
        setLoading(false);
      } catch (err) {
        setError((err as Error).message);
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      setError("Please log in to post a comment.");
      return;
    }
    if (!post) return;

    const commentData = {
      content: newComment,
      postId: post.id,
      parentCommentId: 0,
    };

    try {
      console.log("Posting comment with data:", commentData);
      console.log("User ID (header):", currentUserId);
      console.log("Using token:", user?.token);

      const response = await fetch(
        "https://localhost:7094/api/Comment/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.token}`,
            userId: currentUserId,
          },
          body: JSON.stringify(commentData),
        }
      );

      console.log("Response status:", response.status);
      const responseText = await response.text();
      console.log("Response body:", responseText);

      if (!response.ok) {
        throw new Error(
          `Failed to post comment: ${response.status} - ${responseText}`
        );
      }

      const newCommentData: Comment = JSON.parse(responseText);
      setPost({
        ...post,
        comments: [...post.comments, newCommentData],
      });
      setNewComment("");
      setError(null);
    } catch (err) {
      console.error("Error details:", err);
      setError((err as Error).message);
    }
  };

  const handleEditStart = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditedContent(comment.content);
  };

  const handleEditSave = async (commentId: number) => {
    if (!isLoggedIn) {
      setError("Please log in to edit a comment.");
      return;
    }

    const editData = {
      content: editedContent,
      UserId: currentUserId,
    };

    try {
      console.log("Editing comment ID:", commentId);
      console.log("Edit data:", editData);
      console.log("User ID (header):", currentUserId);
      console.log("Using token:", user?.token);

      const response = await fetch(
        `https://localhost:7094/api/Comment/update/${commentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.token}`,
            userId: currentUserId,
          },
          body: JSON.stringify(editData),
        }
      );

      console.log("Response status:", response.status);
      const responseText = await response.text();
      console.log("Response body:", responseText);

      if (!response.ok) {
        throw new Error(
          `Failed to edit comment: ${response.status} - ${responseText}`
        );
      }

      if (post) {
        const updatedComments = post.comments.map((comment) =>
          comment.id === commentId
            ? { ...comment, content: editedContent }
            : comment
        );
        setPost({ ...post, comments: updatedComments });
      }
      setEditingCommentId(null);
      setEditedContent("");
      setError(null);
    } catch (err) {
      console.error("Error details:", err);
      setError((err as Error).message);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!isLoggedIn) {
      setError("Please log in to delete a comment.");
      return;
    }

    try {
      console.log("Deleting comment ID:", commentId);
      console.log("User ID (header):", currentUserId);
      console.log("Using token:", user?.token);

      const response = await fetch(
        `https://localhost:7094/api/Comment/delete/${commentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${user?.token}`,
            userId: currentUserId,
          },
        }
      );

      console.log("Response status:", response.status);
      const responseText = await response.text();
      console.log("Response body:", responseText);

      if (!response.ok) {
        throw new Error(
          `Failed to delete comment: ${response.status} - ${responseText}`
        );
      }

      if (post) {
        const updatedComments = post.comments.filter(
          (comment) => comment.id !== commentId
        );
        setPost({ ...post, comments: updatedComments });
      }
      setError(null);
    } catch (err) {
      console.error("Error details:", err);
      setError((err as Error).message);
    }
  };

  if (loading) return <div className="article-loading">Loading...</div>;
  if (error) return <div className="article-error">Error: {error}</div>;
  if (!post) return <div className="article-not-found">Post not found</div>;

  return (
    <article className="article-page">
      <header className="article-header">
        <h1>{post.title}</h1>
        <p className="article-meta">
          By {post.authorName} | {new Date(post.createdAt).toLocaleDateString()}{" "}
          | {post.categoryName}
        </p>
      </header>

      <img
        src={
          post.featuredImage && /^[A-Za-z0-9+/=]+$/.test(post.featuredImage)
            ? `data:image/png;base64,${post.featuredImage}`
            : post.featuredImage || "https://via.placeholder.com/600x400"
        }
        alt={post.title}
        className="article-image"
      />

      <section className="article-content">
        <p>{post.content}</p>
      </section>

      <section className="comments-section">
        <h2>Comments ({post.comments.length})</h2>

        <div className="comments-list">
          {post.comments.map((comment) => (
            <div key={comment.id} className="comment-card">
              <div className="comment-header">
                <span className="comment-author">{comment.userName}</span>
                <span className="comment-timestamp">
                  {new Date(comment.createdAt).toLocaleString()}
                </span>
              </div>
              {editingCommentId === comment.id ? (
                <div className="edit-form">
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="edit-textarea"
                  />
                  <div className="edit-actions">
                    <button
                      onClick={() => handleEditSave(comment.id)}
                      className="save-btn"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingCommentId(null)}
                      className="cancel-btn"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="comment-body">{comment.content}</p>
                  {(comment.userId === currentUserId || isAdmin) && (
                    <div className="comment-actions">
                      <button
                        onClick={() => handleEditStart(comment)}
                        className="edit-btn"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="delete-btn"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleCommentSubmit} className="comment-form">
          <h3>Leave a Comment</h3>
          {isLoggedIn ? (
            <>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts..."
                required
              />
              <button type="submit" className="submit-btn">
                Post Comment
              </button>
            </>
          ) : (
            <p className="login-message">Please log in to post a comment.</p>
          )}
        </form>
      </section>

      <footer className="article-footer">
        <p>
          <strong>Tags:</strong> {post.tags.join(", ")}
        </p>
        <p>
          <strong>Views:</strong> {post.views}
        </p>
      </footer>
    </article>
  );
};

export default PostDetail;
