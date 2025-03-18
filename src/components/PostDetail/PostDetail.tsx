import { useParams, Link, useNavigate } from "react-router-dom";
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
  const [replyingToCommentId, setReplyingToCommentId] = useState<number | null>(null);
  const [newReply, setNewReply] = useState("");

  const { user } = useUser();
  const currentUserId = user?.userId || "";
  const isAdmin = user?.role === "Admin";
  const isLoggedIn = !!user;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const allPostsResponse = await fetch("https://voiceinfo.onrender.com/api/Post/all");
        if (!allPostsResponse.ok) throw new Error("Failed to fetch posts");
        const allPosts: Post[] = await allPostsResponse.json();
        const foundPost = allPosts.find((p) => p.slug === slug);
        if (!foundPost) throw new Error("Post not found");

        const postResponse = await fetch(`https://voiceinfo.onrender.com/api/Post/${foundPost.id}`);
        if (!postResponse.ok) throw new Error("Failed to fetch post details");
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
      parentCommentId: null,
    };

    try {
      const response = await fetch("https://voiceinfo.onrender.com/api/Comment/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
          userId: currentUserId,
        },
        body: JSON.stringify(commentData),
      });

      if (!response.ok) throw new Error("Failed to post comment");
      const newCommentData: Comment = await response.json();
      setPost({
        ...post,
        comments: [...post.comments, { ...newCommentData, replies: [] }],
      });
      setNewComment("");
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent, parentCommentId: number) => {
    e.preventDefault();
    if (!isLoggedIn) {
      setError("Please log in to reply.");
      return;
    }
    if (!post) return;

    const replyData = {
      content: newReply,
      postId: post.id,
      parentCommentId,
    };

    try {
      const response = await fetch("https://voiceinfo.onrender.com/api/Comment/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
          userId: currentUserId,
        },
        body: JSON.stringify(replyData),
      });

      if (!response.ok) throw new Error("Failed to post reply");
      const newReplyData: Comment = await response.json();

      const updateCommentsWithReply = (comments: Comment[]): Comment[] => {
        return comments.map((comment) => {
          if (comment.id === parentCommentId) {
            return { ...comment, replies: [...comment.replies, { ...newReplyData, replies: [] }] };
          }
          if (comment.replies.length > 0) {
            return { ...comment, replies: updateCommentsWithReply(comment.replies) };
          }
          return comment;
        });
      };

      setPost({
        ...post,
        comments: updateCommentsWithReply(post.comments),
      });
      setNewReply("");
      setReplyingToCommentId(null);
      setError(null);

      // Re-fetch to sync with backend
      const postResponse = await fetch(`https://voiceinfo.onrender.com/api/Post/${post.id}`);
      if (postResponse.ok) {
        const updatedPostData: Post = await postResponse.json();
        setPost(updatedPostData);
      }
    } catch (err) {
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
      const response = await fetch(`https://voiceinfo.onrender.com/api/Comment/update/${commentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
          userId: currentUserId,
        },
        body: JSON.stringify(editData),
      });

      if (!response.ok) throw new Error("Failed to edit comment");

      const updateCommentContent = (comments: Comment[]): Comment[] => {
        return comments.map((comment) => {
          if (comment.id === commentId) {
            return { ...comment, content: editedContent };
          }
          if (comment.replies.length > 0) {
            return { ...comment, replies: updateCommentContent(comment.replies) };
          }
          return comment;
        });
      };

      if (post) {
        setPost({ ...post, comments: updateCommentContent(post.comments) });
      }
      setEditingCommentId(null);
      setEditedContent("");
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!isLoggedIn) {
      setError("Please log in to delete a comment.");
      return;
    }

    try {
      const response = await fetch(`https://voiceinfo.onrender.com/api/Comment/delete/${commentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user?.token}`,
          userId: currentUserId,
        },
      });

      if (!response.ok) throw new Error("Failed to delete comment");

      const removeComment = (comments: Comment[]): Comment[] => {
        return comments
          .filter((comment) => comment.id !== commentId)
          .map((comment) => ({
            ...comment,
            replies: removeComment(comment.replies),
          }));
      };

      if (post) {
        setPost({ ...post, comments: removeComment(post.comments) });
      }
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleEditPost = () => {
    if (post) {
      navigate("/create-post", { state: { postToEdit: post } });
    }
  };

  const flattenRepliesBeyondLevel1 = (comments: Comment[]): Comment[] => {
    const flattened: Comment[] = [];
    
    const processComment = (comment: Comment, level: number) => {
      if (level === 0) {
        // Root comment, add it and process its direct replies
        flattened.push({ ...comment, replies: [] });
        comment.replies.forEach((reply) => processComment(reply, 1));
      } else if (level === 1) {
        // Direct reply, nest it under its parent in the original structure
        const parentIndex = flattened.findIndex(c => c.id === comment.parentCommentId);
        if (parentIndex !== -1) {
          flattened[parentIndex].replies.push({ ...comment, replies: [] });
        }
        // Process any deeper replies as new top-level comments
        comment.replies.forEach((deepReply) => processComment(deepReply, 2));
      } else {
        // Level 2+, add as a new top-level comment with parent reference
        flattened.push({
          ...comment,
          replies: [], // No further nesting
          parentCommentId: comment.parentCommentId // Keep reference for display
        });
        comment.replies.forEach((deeperReply) => processComment(deeperReply, level + 1));
      }
    };

    comments.forEach((comment) => processComment(comment, 0));
    return flattened;
  };

  const renderComment = (comment: Comment, isReply: boolean = false) => (
    <div key={comment.id} className={`comment-card ${isReply ? "reply" : ""}`}>
      <div className="comment-header">
        <span className="comment-author">{comment.userName}</span>
        <span className="comment-timestamp">{new Date(comment.createdAt).toLocaleString()}</span>
      </div>
      {comment.parentCommentId && isReply && (
        <div className="parent-comment-reference">
          <p className="parent-comment-content">
            Replying to: "{findParentContent(comment.parentCommentId, post?.comments || [])?.substring(0, 50)}..."
          </p>
        </div>
      )}
      {editingCommentId === comment.id ? (
        <div className="edit-form">
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="edit-textarea"
          />
          <div className="edit-actions">
            <button onClick={() => handleEditSave(comment.id)} className="save-btn">
              Save
            </button>
            <button onClick={() => setEditingCommentId(null)} className="cancel-btn">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="comment-body">{comment.content}</p>
          <div className="comment-actions">
            {isLoggedIn && (
              <button
                onClick={() => setReplyingToCommentId(comment.id)}
                className="reply-btn"
              >
                Reply
              </button>
            )}
            {(comment.userId === currentUserId || isAdmin) && (
              <>
                <button onClick={() => handleEditStart(comment)} className="edit-btn">
                  Edit
                </button>
                <button onClick={() => handleDelete(comment.id)} className="delete-btn">
                  Delete
                </button>
              </>
            )}
          </div>
          {replyingToCommentId === comment.id && (
            <form
              onSubmit={(e) => handleReplySubmit(e, comment.id)}
              className="reply-form"
            >
              <textarea
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
                placeholder="Write your reply..."
                required
              />
              <div className="reply-actions">
                <button type="submit" className="submit-btn">
                  Post Reply
                </button>
                <button
                  onClick={() => setReplyingToCommentId(null)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
          {comment.replies.length > 0 && (
            <div className="replies">
              {comment.replies.map((reply) => renderComment(reply, true))}
            </div>
          )}
        </>
      )}
    </div>
  );

  const findParentContent = (parentId: number, comments: Comment[]): string | undefined => {
    for (const comment of comments) {
      if (comment.id === parentId) return comment.content;
      if (comment.replies.length > 0) {
        const found = findParentContent(parentId, comment.replies);
        if (found) return found;
      }
    }
    return undefined;
  };

  if (loading) return <div className="article-loading">Loading...</div>;
  if (error) return <div className="article-error">Error: {error}</div>;
  if (!post) return <div className="article-not-found">Post not found</div>;

  const flattenedComments = flattenRepliesBeyondLevel1(post.comments);

  return (
    <article className="article-page">
      <header className="article-header">
        <h1>{post.title}</h1>
        <p className="article-meta">
          By {post.authorName} | {new Date(post.createdAt).toLocaleDateString()} |{" "}
          <Link to={`/${post.categoryName}`} className="category-link">
            {post.categoryName}
          </Link>
          {currentUserId === post.authorId && (
            <button onClick={handleEditPost} className="edit-post-btn">
              Edit Post
            </button>
          )}
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
        <div dangerouslySetInnerHTML={{ __html: post.content }} />
      </section>

      <section className="comments-section">
        <h2>Comments ({flattenedComments.length})</h2>
        <div className="comments-list">
          {flattenedComments.map((comment) => renderComment(comment, comment.parentCommentId !== null))}
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