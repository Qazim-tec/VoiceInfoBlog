import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useUser } from "../../context/UserContext";
import "./PostDetail.css";

const postCache: { [slug: string]: { data: Post; timestamp: number } } = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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
  featuredImageUrl: string;
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
  const [comments, setComments] = useState<Comment[]>([]);
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
  const location = useLocation();
  const updatedPost = location.state?.updatedPost as Post | undefined;

  useEffect(() => {
    const fetchPost = async () => {
      try {
        if (updatedPost && updatedPost.slug === slug) {
          setPost(updatedPost);
          setComments(updatedPost.comments);
          setLoading(false);
          postCache[slug!] = { data: updatedPost, timestamp: Date.now() };
          return;
        }

        const cached = postCache[slug!];
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          setPost(cached.data);
          setComments(cached.data.comments);
          setLoading(false);
          return;
        }

        const response = await fetch(`https://voiceinfo.onrender.com/api/Post/slug/${slug}`, {
          headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
        });
        if (!response.ok) throw new Error("Failed to fetch post details");
        const postData: { data: Post } = await response.json();

        setPost(postData.data);
        setComments(postData.data.comments);
        postCache[slug!] = { data: postData.data, timestamp: Date.now() };
        setLoading(false);
      } catch (err) {
        setError((err as Error).message);
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug, user?.token, updatedPost]);

  const fetchComments = async (postId: number) => {
    try {
      const response = await fetch(`https://voiceinfo.onrender.com/api/Comment/post/${postId}`, {
        headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
      });
      if (!response.ok) throw new Error("Failed to fetch comments");
      const data: { data: Comment[] } = await response.json();
      setComments(data.data);
    } catch (err) {
      setError((err as Error).message);
    }
  };

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
      userId: currentUserId,
      parentCommentId: null,
    };

    const optimisticComment: Comment = {
      id: Date.now(),
      content: newComment,
      createdAt: new Date().toISOString(),
      userId: currentUserId,
      userName: user?.firstName || "Anonymous",
      parentCommentId: null,
      replies: [],
    };

    setComments([...comments, optimisticComment]);
    setNewComment("");

    try {
      const response = await fetch("https://voiceinfo.onrender.com/api/Comment/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(commentData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to post comment: ${errorText}`);
      }

      const responseData: { data: Comment } = await response.json();
      setComments((prevComments) =>
        prevComments.map((c) =>
          c.id === optimisticComment.id ? { ...responseData.data, replies: [] } : c
        )
      );
      setError(null);
    } catch (err) {
      console.log("Post error:", err);
      setError((err as Error).message);
      setComments((prevComments) => prevComments.filter((c) => c.id !== optimisticComment.id));
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
      userId: currentUserId,
      parentCommentId,
    };

    const optimisticReply: Comment = {
      id: Date.now(),
      content: newReply,
      createdAt: new Date().toISOString(),
      userId: currentUserId,
      userName: user?.firstName || "Anonymous",
      parentCommentId,
      replies: [],
    };

    setComments((prevComments) => {
      const updateCommentsWithReply = (comments: Comment[]): Comment[] =>
        comments.map((comment) =>
          comment.id === parentCommentId
            ? { ...comment, replies: [...comment.replies, optimisticReply] }
            : { ...comment, replies: updateCommentsWithReply(comment.replies) }
        );
      return updateCommentsWithReply(prevComments);
    });

    setNewReply("");
    setReplyingToCommentId(null);

    try {
      const response = await fetch("https://voiceinfo.onrender.com/api/Comment/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(replyData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to post reply: ${errorText}`);
      }

      const responseData: { data: Comment } = await response.json();
      setComments((prevComments) => {
        const syncReply = (comments: Comment[]): Comment[] =>
          comments.map((comment) =>
            comment.id === parentCommentId
              ? {
                  ...comment,
                  replies: comment.replies.map((r) =>
                    r.id === optimisticReply.id ? { ...responseData.data, replies: [] } : r
                  ),
                }
              : { ...comment, replies: syncReply(comment.replies) }
          );
        return syncReply(prevComments);
      });
      setError(null);
    } catch (err) {
      console.log("Reply error:", err);
      setError((err as Error).message);
      setComments((prevComments) => {
        const removeReply = (comments: Comment[]): Comment[] =>
          comments.map((comment) =>
            comment.id === parentCommentId
              ? { ...comment, replies: comment.replies.filter((r) => r.id !== optimisticReply.id) }
              : { ...comment, replies: removeReply(comment.replies) }
          );
        return removeReply(prevComments);
      });
    }
  };

  const handleEditSave = async (commentId: number) => {
    if (!isLoggedIn) {
      setError("Please log in to edit a comment.");
      return;
    }
    if (!post) return;

    const editData = {
      content: editedContent,
      userId: currentUserId,
    };

    const updateCommentContent = (comments: Comment[]): Comment[] =>
      comments.map((comment) =>
        comment.id === commentId
          ? { ...comment, content: editedContent }
          : { ...comment, replies: updateCommentContent(comment.replies) }
      );
    const originalComments = [...comments];
    setComments(updateCommentContent(comments));
    setEditingCommentId(null);

    try {
      const response = await fetch(`https://voiceinfo.onrender.com/api/Comment/update/${commentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(editData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to edit comment: ${errorText}`);
      }

      const responseData: { data: Comment; message: string } = await response.json();
      const syncComments = (comments: Comment[]): Comment[] =>
        comments.map((comment) =>
          comment.id === commentId
            ? { ...responseData.data, replies: comment.replies }
            : { ...comment, replies: syncComments(comment.replies) }
        );
      setComments(syncComments(comments));
      setEditedContent("");
      setError(null);
    } catch (err) {
      console.log("Edit error:", err);
      setError((err as Error).message);
      setComments(originalComments);
      setEditingCommentId(commentId);
      setEditedContent(editedContent);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!isLoggedIn) {
      setError("Please log in to delete a comment.");
      return;
    }
    if (!post) return;

    const removeComment = (comments: Comment[]): Comment[] =>
      comments
        .filter((comment) => comment.id !== commentId)
        .map((comment) => ({ ...comment, replies: removeComment(comment.replies) }));

    const originalComments = [...comments];
    setComments(removeComment(comments));

    try {
      const response = await fetch(`https://voiceinfo.onrender.com/api/Comment/delete/${commentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete comment: ${errorText}`);
      }
      setError(null);
    } catch (err) {
      console.log("Delete error:", err);
      setError((err as Error).message);
      setComments(originalComments);
      if (post) await fetchComments(post.id);
    }
  };

  const handleEditStart = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditedContent(comment.content);
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
        flattened.push({ ...comment, replies: [] });
        comment.replies.forEach((reply) => processComment(reply, 1));
      } else if (level === 1) {
        const parentIndex = flattened.findIndex((c) => c.id === comment.parentCommentId);
        if (parentIndex !== -1) {
          flattened[parentIndex].replies.push({ ...comment, replies: [] });
        }
        comment.replies.forEach((deepReply) => processComment(deepReply, 2));
      } else {
        flattened.push({
          ...comment,
          replies: [],
          parentCommentId: comment.parentCommentId,
        });
        comment.replies.forEach((deeperReply) => processComment(deeperReply, level + 1));
      }
    };
    comments.forEach((comment) => processComment(comment, 0));
    return flattened;
  };

  const isLevel1Reply = (comment: Comment): boolean => {
    if (!comment.parentCommentId) return false;
    const parent = comments.find((c) => c.id === comment.parentCommentId);
    return parent?.parentCommentId === null;
  };

  const renderComment = (comment: Comment, isReply: boolean = false) => (
    <div key={comment.id} className={`comment-card ${isReply ? "reply" : ""}`}>
      <div className="comment-header">
        <span className="comment-author">{comment.userName}</span>
        <span className="comment-timestamp">{new Date(comment.createdAt).toLocaleString()}</span>
      </div>
      {comment.parentCommentId && !isLevel1Reply(comment) && isReply && (
        <div className="parent-comment-reference">
          <p className="parent-comment-content">
            Replying to: "{findParentContent(comment.parentCommentId, comments)?.substring(0, 50)}..."
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

  // Share functionality
  const shareUrl = post ? `${window.location.origin}/post/${post.slug}` : "";
  const shareText = post ? `${post.title} - Check out this post!` : "";

  const handleWhatsAppShare = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + shareUrl)}`, "_blank");
  };

  const handleXShare = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, "_blank");
  };

  const handleFacebookShare = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank");
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.log("Share error:", err);
      }
    } else {
      alert("Web Share API is not supported in your browser.");
    }
  };

  if (loading) return <div className="article-loading">Loading...</div>;
  if (error) return <div className="article-error">Error: {error}</div>;
  if (!post) return <div className="article-not-found">Post not found</div>;

  const flattenedComments = flattenRepliesBeyondLevel1(comments);

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
          post.featuredImageUrl && /^[A-Za-z0-9+/=]+$/.test(post.featuredImageUrl)
            ? `data:image/png;base64,${post.featuredImageUrl}`
            : post.featuredImageUrl || "https://via.placeholder.com/600x400"
        }
        alt={post.title}
        className="article-image"
      />

      <section className="article-content">
        <div dangerouslySetInnerHTML={{ __html: post.content }} />
      </section>

      {/* Share Buttons Section */}
      <section className="share-section">
        <h3>Share this post:</h3>
        <div className="share-buttons">
          <button onClick={handleWhatsAppShare} className="share-btn whatsapp">
            WhatsApp
          </button>
          <button onClick={handleXShare} className="share-btn x">
            X
          </button>
          <button onClick={handleFacebookShare} className="share-btn facebook">
            Facebook
          </button>
          <button onClick={handleNativeShare} className="share-btn native">
            Share More
          </button>
        </div>
      </section>

      <section className="comments-section">
        <h2>Comments ({flattenedComments.length})</h2>
        {error && <div className="error-message">{error}</div>}
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