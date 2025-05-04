import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useUser } from "../../context/UserContext";
import { Helmet } from "react-helmet-async";
import { API_BASE_URL } from "../../config/apiConfig";
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
  additionalImageUrls: string[];
  views: number;
  isFeatured: boolean;
  isLatestNews: boolean;
  createdAt: string;
  slug: string;
  authorId: string;
  authorName: string;
  categoryId: number;
  categoryName: string;
  tags: string[];
  comments: Comment[];
  commentsCount: number;
  likesCount: number;
  isLikedByUser: boolean;
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
  const [isLiking, setIsLiking] = useState(false);

  const { user } = useUser();
  const currentUserId = user?.userId || "";
  const isAdmin = user?.role === "Admin";
  const isLoggedIn = !!user;
  const navigate = useNavigate();
  const location = useLocation();
  const updatedPost = location.state?.updatedPost as Post | undefined;

  const BASE_URL = "https://www.voiceinfos.com";
  const DEFAULT_IMAGE_URL = "https://www.voiceinfos.com/INFOS_LOGO%5B1%5D.png";

  // Utility function to capitalize first letter of each name
  const capitalizeName = (name: string): string => {
    return name
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  };

  // Function to process content and embed YouTube videos
  const processContent = (content: string): string => {
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/g;
    return content.replace(youtubeRegex, (_, videoId) => {
      return `<div class="youtube-embed"><iframe loading="lazy" src="https://www.youtube.com/embed/${videoId}" title="YouTube video player" frameborder="0" allowfullscreen></iframe></div>`;
    });
  };

  // Function to get share description (excerpt or truncated content)
  const getShareDescription = (post: Post): string => {
    return post.excerpt || post.content.substring(0, 160);
  };

  // Function to validate image URL and check accessibility
  const isValidImageUrl = async (url: string | null | undefined): Promise<boolean> => {
    if (!url || typeof url !== "string") {
      console.warn("Invalid image URL: URL is null, undefined, or not a string", url);
      return false;
    }

    const regex = /^https?:\/\/.+(?:\/[^\/?#]+)?(?:\?.*)?(?:#.*)?$/i;
    if (!regex.test(url)) {
      console.warn("Invalid image URL: Does not match expected format", url);
      return false;
    }

    try {
      const response = await fetch(url, { method: "HEAD" });
      const contentType = response.headers.get("content-type");
      if (!response.ok) {
        console.warn("Image URL inaccessible: HTTP status", response.status, url);
        return false;
      }
      if (!contentType?.startsWith("image/")) {
        console.warn("Image URL does not point to an image: Content-Type", contentType, url);
        return false;
      }
      console.log("Valid and accessible image URL:", url);
      return true;
    } catch (err) {
      console.warn("Error checking image URL accessibility:", err, url);
      return false;
    }
  };

  // Function to get valid image URL
  const getValidImageUrl = async (post: Post | null): Promise<string> => {
    if (!post) return DEFAULT_IMAGE_URL;

    if (await isValidImageUrl(post.featuredImageUrl)) {
      return post.featuredImageUrl;
    }

    if (post.additionalImageUrls && post.additionalImageUrls.length > 0) {
      for (const url of post.additionalImageUrls) {
        if (await isValidImageUrl(url)) {
          console.log("Using additionalImageUrl as fallback:", url);
          return url;
        }
      }
    }

    console.warn("No valid image found, using default:", DEFAULT_IMAGE_URL);
    return DEFAULT_IMAGE_URL;
  };

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

        const response = await fetch(`${API_BASE_URL}/api/Post/slug/${slug}`, {
          headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
        });
        if (!response.ok) throw new Error("Failed to fetch post details");
        const postData: { data: Post } = await response.json();

        console.log("Post featuredImageUrl:", postData.data.featuredImageUrl);
        console.log("Post additionalImageUrls:", postData.data.additionalImageUrls);
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
      const response = await fetch(`${API_BASE_URL}/api/Comment/post/${postId}`, {
        headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
      });
      if (!response.ok) throw new Error("Failed to fetch comments");
      const data: { data: Comment[] } = await response.json();
      setComments(data.data);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleLikeToggle = async () => {
    if (!isLoggedIn) {
      setError("Please log in to interact with this post.");
      setTimeout(() => setError(null), 3000);
      return;
    }
    if (!post || isLiking) return;

    setIsLiking(true);
    const originalPost = { ...post };
    const wasLiked = post.isLikedByUser;

    setPost({
      ...post,
      likesCount: wasLiked ? post.likesCount - 1 : post.likesCount + 1,
      isLikedByUser: !wasLiked,
    });

    try {
      const endpoint = wasLiked ? "unlike" : "like";
      const response = await fetch(`${API_BASE_URL}/api/Post/${endpoint}/${post.id}`, {
        method: "POST",
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to ${endpoint} post: ${errorText}`);
      }

      setError(null);
    } catch (err) {
      setError((err as Error).message);
      setTimeout(() => setError(null), 3000);
      setPost(originalPost);
    } finally {
      setIsLiking(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      setError("Please log in to post a comment.");
      setTimeout(() => setError(null), 3000);
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
      const response = await fetch(`${API_BASE_URL}/api/Comment/create`, {
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
      setTimeout(() => setError(null), 3000);
      setComments((prevComments) => prevComments.filter((c) => c.id !== optimisticComment.id));
    }
  };

  const handleReplySubmit = async (e: React.FormEvent, parentCommentId: number) => {
    e.preventDefault();
    if (!isLoggedIn) {
      setError("Please log in to reply.");
      setTimeout(() => setError(null), 3000);
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
      const response = await fetch(`${API_BASE_URL}/api/Comment/create`, {
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
      setTimeout(() => setError(null), 3000);
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
      setTimeout(() => setError(null), 3000);
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
      const response = await fetch(`${API_BASE_URL}/api/Comment/update/${commentId}`, {
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

      setEditedContent("");
      setError(null);
    } catch (err) {
      console.log("Edit error:", err);
      setError((err as Error).message);
      setTimeout(() => setError(null), 3000);
      setComments(originalComments);
      setEditingCommentId(commentId);
      setEditedContent(editedContent);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!isLoggedIn) {
      setError("Please log in to delete a comment.");
      setTimeout(() => setError(null), 3000);
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
      const response = await fetch(`${API_BASE_URL}/api/Comment/delete/${commentId}`, {
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
      setTimeout(() => setError(null), 3000);
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
        <span className="comment-author">{capitalizeName(comment.userName)}</span>
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

  const shareUrl = post ? `${BASE_URL}/post/${post.slug}` : "";
  const [imageUrl, setImageUrl] = useState(DEFAULT_IMAGE_URL);
  const shareDescription = post ? getShareDescription(post) : "";

  useEffect(() => {
    const updateImageUrl = async () => {
      if (post) {
        const validImageUrl = await getValidImageUrl(post);
        setImageUrl(validImageUrl);
      }
    };
    updateImageUrl();
  }, [post]);

  const handleWhatsAppShare = () => {
    if (!post) return;

    // Format the share text with title, description, and URL
    const shareText = `${post.title}\n\n${shareDescription}\n\nRead more: ${shareUrl}`;
    
    // Encode the share text for the WhatsApp URL
    const encodedShareText = encodeURIComponent(shareText);

    // Open WhatsApp with the formatted share text
    window.open(
      `https://api.whatsapp.com/send?text=${encodedShareText}`,
      "_blank"
    );
  };

  const handleXShare = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        `${post?.title}\n${shareDescription}`
      )}&url=${encodeURIComponent(shareUrl)}`,
      "_blank"
    );
  };

  const handleFacebookShare = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      "_blank"
    );
  };

  const handleLinkedInShare = () => {
    window.open(
      `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(
        shareUrl
      )}&title=${encodeURIComponent(post?.title || "")}&summary=${encodeURIComponent(
        shareDescription
      )}`,
      "_blank"
    );
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: `${post?.title}\n${shareDescription}`,
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
    <>
      <Helmet>
        <title>{post.title}</title>
        <meta name="description" content={shareDescription} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={shareDescription} />
        <meta property="og:image" content={imageUrl} />
        <meta property="og:url" content={shareUrl} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={shareDescription} />
        <meta name="twitter:image" content={imageUrl} />
      </Helmet>

      <article className="article-page">
        <header className="article-header">
          <h1>{post.title}</h1>
          <p className="article-meta">
            By {capitalizeName(post.authorName)} | {new Date(post.createdAt).toLocaleDateString()} |{" "}
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

        <img src={imageUrl} alt={post.title} className="article-image" />

        <section className="article-content">
          <div dangerouslySetInnerHTML={{ __html: processContent(post.content) }} />
        </section>

        {post.additionalImageUrls && post.additionalImageUrls.length > 0 && (
          <section className="additional-images-section">
            <h3>Additional Images</h3>
            <div className="additional-images">
              {post.additionalImageUrls.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`Additional image ${index + 1}`}
                  className="additional-image"
                />
              ))}
            </div>
          </section>
        )}

        <section className="interaction-section">
          <div className="like-section">
            <button
              onClick={handleLikeToggle}
              disabled={isLiking || !isLoggedIn}
              className={`like-btn ${post.isLikedByUser ? "liked" : ""}`}
              aria-label={post.isLikedByUser ? "Unlike this post" : "Like this post"}
              aria-pressed={post.isLikedByUser}
            >
              {isLiking ? (
                <span className="like-spinner"></span>
              ) : (
                <>{post.isLikedByUser ? "Unlike" : "Like"}</>
              )}
            </button>
            <span className="like-count">Likes: {post.likesCount}</span>
            {!isLoggedIn && <span className="login-prompt">Log in to like this post</span>}
          </div>
        </section>

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
            <button onClick={handleLinkedInShare} className="share-btn linkedin">
              LinkedIn
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
      </article>
    </>
  );
};

export default PostDetail;