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

interface ShareData {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  url: string;
}

interface ApiResponse<T> {
  data: T;
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
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const commentsPerPage = 25;

  const { user } = useUser();
  const currentUserId = user?.userId || "";
  const isAdmin = user?.role === "Admin";
  const isLoggedIn = !!user;
  const navigate = useNavigate();
  const location = useLocation();
  const updatedPost = location.state?.updatedPost as Post | undefined;

  const DEFAULT_IMAGE_URL = "https://www.voiceinfos.com/INFOS_LOGO%5B1%5D.png";

  const capitalizeName = (name: string): string => {
    return name
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  };

  const processContent = (content: string): string => {
  // Updated regex to handle various YouTube URL formats
  const youtubeRegex = /(?:https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/|youtu\.be\/)|youtu\.be\/))([a-zA-Z0-9_-]{11})(?:[?&][^\s>]*)?/gi;

  return content.replace(youtubeRegex, (_match, videoId) => {
    // Validate videoId (must be 11 characters, alphanumeric with possible hyphens/underscores)
    if (!videoId || videoId.length !== 11 || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return `<div class="youtube-error">Invalid YouTube video ID: ${videoId}</div>`;
    }

    // Construct clean embed URL
    const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&showinfo=0`;
    // Use a clean link for the anchor tag
    const linkUrl = `https://www.youtube.com/watch?v=${videoId}`;

    return `
      <div class="youtube-embed">
        <iframe 
          loading="lazy" 
          src="${embedUrl}" 
          title="YouTube video player" 
          frameborder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowfullscreen
        ></iframe>
        <a href="${linkUrl}" target="_blank" class="youtube-link" rel="noopener noreferrer">Watch on YouTube</a>
      </div>
    `;
  });
};

  const getShareDescription = (post: Post): string => {
    if (post.excerpt) return post.excerpt;
    const div = document.createElement("div");
    div.innerHTML = post.content;
    const plainText = div.textContent || div.innerText || "";
    return plainText.substring(0, 220) + "..........";
  };

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

  const getValidImageUrl = async (post: Post | null): Promise<string> => {
    if (!post) return DEFAULT_IMAGE_URL;

    if (await isValidImageUrl(post.featuredImageUrl)) {
      console.log("Using featuredImageUrl:", post.featuredImageUrl);
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
          const validImageUrl = await getValidImageUrl(updatedPost);
          setImageUrl(validImageUrl);
          setLoading(false);
          postCache[slug!] = { data: updatedPost, timestamp: Date.now() };
          return;
        }

        const cached = postCache[slug!];
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          setPost(cached.data);
          setComments(cached.data.comments);
          const validImageUrl = await getValidImageUrl(cached.data);
          setImageUrl(validImageUrl);
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/Post/slug/${slug}`, {
          headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
        });
        if (!response.ok) throw new Error("Failed to fetch post details");
        const postData: ApiResponse<Post> = await response.json();

        console.log("Post featuredImageUrl:", postData.data.featuredImageUrl);
        console.log("Post additionalImageUrls:", postData.data.additionalImageUrls);
        setPost(postData.data);
        setComments(postData.data.comments);
        const validImageUrl = await getValidImageUrl(postData.data);
        setImageUrl(validImageUrl);
        postCache[slug!] = { data: postData.data, timestamp: Date.now() };
        setLoading(false);
      } catch (err) {
        setError((err as Error).message);
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug, user?.token, updatedPost]);

  useEffect(() => {
  const fetchShareData = async () => {
    if (!slug || !post) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/Share/${slug}`, {
        headers: {
          accept: "text/html",
          "User-Agent": "facebookexternalhit/1.1",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch share data");

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const metaTags = doc.querySelectorAll("meta[property^='og:'], meta[name^='twitter:']");

      const ogData: { [key: string]: string } = {};
      metaTags.forEach((tag) => {
        const property = tag.getAttribute("property") || tag.getAttribute("name");
        const content = tag.getAttribute("content");
        if (property && content) {
          ogData[property] = content;
        }
      });

      setShareData({
        title: ogData["og:title"] || post.title,
        description: ogData["og:description"] || getShareDescription(post),
        image: ogData["og:image"] || imageUrl || DEFAULT_IMAGE_URL,
        imageAlt: ogData["og:image:alt"] || `Image for ${post.title}`,
        url: ogData["og:url"] || `${API_BASE_URL}/api/Share/${encodeURIComponent(slug)}`,
      });
    } catch (err) {
      console.warn("Error fetching share data:", err);
      setShareData({
        title: post.title,
        description: getShareDescription(post),
        image: imageUrl || DEFAULT_IMAGE_URL,
        imageAlt: `Image for ${post.title}`,
        url: `${API_BASE_URL}/api/Share/${encodeURIComponent(slug)}`,
      });
    }
  };

  fetchShareData();
}, [slug, post, imageUrl]);

  const fetchComments = async (postId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/Comment/post/${postId}`, {
        headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
      });
      if (!response.ok) throw new Error("Failed to fetch comments");
      const commentData: ApiResponse<Comment[]> = await response.json();
      setComments(commentData.data);
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

      const responseData: ApiResponse<Comment> = await response.json();
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
            : {
                ...comment,
                replies:
                  comment.replies.length > 0
                    ? updateCommentsWithReply(comment.replies)
                    : comment.replies,
              }
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

      const responseData: ApiResponse<Comment> = await response.json();
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

  const countAllComments = (comments: Comment[]): number => {
    let count = 0;
    const countComments = (comments: Comment[]) => {
      comments.forEach((comment) => {
        count++;
        if (comment.replies.length > 0) {
          countComments(comment.replies);
        }
      });
    };
    countComments(comments);
    return count;
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

 const handleWhatsAppShare = () => {
  if (!shareData) return;

  const shareText = `*${shareData.title}*\n\n${shareData.description}\n\nRead more: ${shareData.url}`;
  const encodedShareText = encodeURIComponent(shareText);
  window.open(
    `https://api.whatsapp.com/send?text=${encodedShareText}`,
    "_blank"
  );
};

const handleXShare = () => {
  if (!shareData) return;

  const shareText = `${shareData.title}\n\n${shareData.description}\n\n${shareData.url}`;
  const encodedShareText = encodeURIComponent(shareText);
  window.open(
    `https://twitter.com/intent/tweet?text=${encodedShareText}`,
    "_blank"
  );
};

const handleFacebookShare = () => {
  if (!shareData) return;

  const shareText = `${shareData.title}\n\n${shareData.description}\n\nRead more: ${shareData.url}`;
  const encodedShareText = encodeURIComponent(shareText);
  window.open(
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}&quote=${encodedShareText}`,
    "_blank"
  );
};

const handleTelegramShare = () => {
  if (!shareData) return;

  const shareText = `${shareData.title}\n\n${shareData.description}\n\n${shareData.url}`;
  const encodedShareText = encodeURIComponent(shareText);
  window.open(
    `https://t.me/share/url?url=${encodeURIComponent(shareData.url)}&text=${encodedShareText}`,
    "_blank"
  );
};

const handleNativeShare = async () => {
  if (!shareData) return;

  if (navigator.share) {
    try {
      await navigator.share({
        title: shareData.title,
        text: `${shareData.title}\n\n${shareData.description}\n\n${shareData.url}`,
        url: shareData.url,
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
  const totalComments = countAllComments(comments);
  const indexOfLastComment = currentPage * commentsPerPage;
  const indexOfFirstComment = indexOfLastComment - commentsPerPage;
  const currentComments = flattenedComments.slice(indexOfFirstComment, indexOfLastComment);
  const totalPages = Math.ceil(totalComments / commentsPerPage);

  const paginate = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      const commentsSection = document.querySelector('.comments-section');
      if (commentsSection) {
        window.scrollTo({ top: commentsSection.getBoundingClientRect().top + window.scrollY, behavior: 'smooth' });
      }
    }
  };

  return (
    <>
      <Helmet>
        <title>{shareData?.title || post.title}</title>
        <meta name="description" content={shareData?.description || getShareDescription(post)} />
        <meta property="og:title" content={shareData?.title || post.title} />
        <meta property="og:description" content={shareData?.description || getShareDescription(post)} />
        <meta property="og:image" content={shareData?.image || imageUrl || DEFAULT_IMAGE_URL} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={shareData?.imageAlt || `Image for ${shareData?.title || post.title}`} />
        <meta property="og:url" content={shareData?.url || `${API_BASE_URL}/api/Share/${encodeURIComponent(slug!)}`} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="VoiceInfo" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={shareData?.title || post.title} />
        <meta name="twitter:description" content={shareData?.description || getShareDescription(post)} />
        <meta name="twitter:image" content={shareData?.image || imageUrl || DEFAULT_IMAGE_URL} />
        <meta name="twitter:image:alt" content={shareData?.imageAlt || `Image for ${shareData?.title || post.title}`} />
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

        <img
          src={imageUrl || DEFAULT_IMAGE_URL}
          alt={post.title}
          className={`article-image ${!imageUrl ? "default-image" : ""}`}
        />

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
            <button onClick={handleTelegramShare} className="share-btn telegram">
              Telegram
            </button>
            <button onClick={handleNativeShare} className="share-btn native">
              Share
            </button>
          </div>
        </section>

        <section className="comments-section">
          <h2>Comments ({totalComments})</h2>
          {error && <div className="error-message">{error}</div>}
          {totalComments === 0 ? (
            <p className="no-comments">No comments yet. Be the first to comment!</p>
          ) : (
            <>
              <div className="comments-list">
                {currentComments.map((comment) => renderComment(comment, comment.parentCommentId !== null))}
              </div>
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="pagination-btn"
                  >
                    Previous
                  </button>
                  <span className="pagination-info">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="pagination-btn"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
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