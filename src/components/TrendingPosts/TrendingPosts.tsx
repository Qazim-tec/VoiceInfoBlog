import React, { useState, useEffect } from "react";
import { useUser } from "../../context/UserContext"; // Adjust path
import { Link } from "react-router-dom";
import "./TrendingPosts.css";

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
  createdAt: string;
  views: number;
  comments: Comment[];
  slug: string;
  featuredImage: string; // Base64 or URL for the image
  authorName: string;    // Author of the post
}

const TrendingPosts: React.FC = () => {
  const { user } = useUser();
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const headers: Record<string, string> = {};
    if (user?.token) {
      headers["Authorization"] = `Bearer ${user.token}`;
    }

    fetch("https://localhost:7094/api/Post/all", { headers })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch posts");
        return res.json();
      })
      .then((data: Post[]) => {
        const sortedPosts = data
          .sort((a, b) => {
            const scoreA = (a.comments.length * 2) + a.views;
            const scoreB = (b.comments.length * 2) + b.views;
            if (scoreB === scoreA) {
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
            return scoreB - scoreA;
          })
          .slice(0, 4); // Top 4 trending posts
        setTrendingPosts(sortedPosts);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch Error:", err);
        setError("Failed to load trending posts");
        setLoading(false);
      });
  }, [user]);

  // Format createdAt to a readable date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="trending-section">
      <h2>Trending Posts</h2>
      {loading ? (
        <p>Loading trending posts...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <div className="trending-cards">
          {trendingPosts.map((post) => (
            <Link to={`/post/${post.slug}`} key={post.id} className="trending-card-link">
              <div className="trending-card">
                <img
                  src={`data:image/png;base64,${post.featuredImage}`} // Assuming base64
                  alt={post.title}
                  className="trending-image"
                />
                <div className="trending-card-content">
                  <h3 className="trending-title">{post.title}</h3>
                  <p className="trending-meta">
                    By {post.authorName} | {formatDate(post.createdAt)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrendingPosts;