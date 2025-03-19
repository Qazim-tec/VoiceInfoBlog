// components/ProfilePage/ProfilePage.tsx
import React, { useEffect, useState } from "react";
import { useUser } from "../../context/UserContext";
import "./ProfilePage.css";

interface UserStats {
  postsCount: number;
  commentsCount: number;
}

interface PostSummary {
  id: number;
  authorId: string;
  authorName: string;
  slug: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  featuredImage: string;
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
}

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  userId: string;
  userName: string;
  parentCommentId: number | null;
  replies: Comment[];
}

const ProfilePage: React.FC = () => {
  const { user } = useUser();
  const [stats, setStats] = useState<UserStats>({ postsCount: 0, commentsCount: 0 });
  const [fullName, setFullName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserStats = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Step 1: Fetch all posts to get user's post IDs and full name
        const allPostsResponse = await fetch("https://voiceinfo.onrender.com/api/Post/all", {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        if (!allPostsResponse.ok) {
          throw new Error("Failed to fetch all posts");
        }

        const postsSummary: PostSummary[] = await allPostsResponse.json();
        const userPosts = postsSummary.filter((post) => post.authorId === user.userId);

        if (userPosts.length > 0) {
          setFullName(userPosts[0].authorName); // Set full name from first post
        }

        const postsCount = userPosts.length;

        // Step 2: Fetch each user post individually to get comments
        let commentsCount = 0;
        const postFetches = userPosts.map(async (post) => {
          const response = await fetch(`https://voiceinfo.onrender.com/api/Post/${post.id}`, {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch post ${post.id}`);
          }

          const postData: Post = await response.json();
          const countComments = (comments: Comment[]) => {
            comments.forEach((comment) => {
              if (comment.userId === user.userId) commentsCount++;
              if (comment.replies.length > 0) countComments(comment.replies);
            });
          };
          countComments(postData.comments);
        });

        await Promise.all(postFetches);

        setStats({
          postsCount,
          commentsCount,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, [user]);

  if (!user) {
    return <div className="profile-page">Please sign in to view your profile</div>;
  }

  if (loading) {
    return <div className="profile-page">Loading profile...</div>;
  }

  if (error) {
    return <div className="profile-page">Error: {error}</div>;
  }

  const initials = fullName
    ? fullName
        .split(" ")
        .map((n) => n.charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : user.firstName.slice(0, 2).toUpperCase();

  const totalActivity = stats.postsCount + stats.commentsCount;
  let status = "Newbie";
  let statusColor = "#cd7f32";
  if (totalActivity > 200) {
    status = "Legend";
    statusColor = "#ffd700";
  } else if (totalActivity > 100) {
    status = "Veteran";
    statusColor = "#c0c0c0";
  } else if (totalActivity > 50) {
    status = "Active";
    statusColor = "#cd7f32";
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="avatar" style={{ backgroundColor: statusColor }}>
            {initials}
          </div>
          <div className="user-info">
            <h1>{fullName || user.firstName}</h1>
            <p className="email">{user.email}</p>
            <span className="role-badge" data-role={user.role}>
              {user.role}
            </span>
          </div>
        </div>

        <div className="profile-stats">
          <div className="stat-card">
            <span className="stat-number">{stats.postsCount}</span>
            <span className="stat-label">Posts</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{stats.commentsCount}</span>
            <span className="stat-label">Comments</span>
          </div>
          <div className="stat-card status">
            <span className="stat-number" style={{ color: statusColor }}>
              {status}
            </span>
            <span className="stat-label">Status</span>
          </div>
        </div>

        <div className="profile-activity">
          <h2>Your Activity</h2>
          <div className="activity-bar">
            <div
              className="posts-bar"
              style={{ width: totalActivity ? `${(stats.postsCount / totalActivity) * 100}%` : "0%" }}
            ></div>
            <div
              className="comments-bar"
              style={{ width: totalActivity ? `${(stats.commentsCount / totalActivity) * 100}%` : "0%" }}
            ></div>
          </div>
          <div className="activity-legend">
            <span className="legend-item posts">Posts</span>
            <span className="legend-item comments">Comments</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;