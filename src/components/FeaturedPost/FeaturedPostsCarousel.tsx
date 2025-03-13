import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./FeaturedPostsCarousel.css";

interface Post {
  id: number;
  title: string;
  excerpt: string;
  featuredImage: string;
  slug: string;
  isFeatured: boolean;
}

const FeaturedPostsCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch("https://localhost:7094/api/Post/all");
        if (!response.ok) throw new Error("Failed to fetch posts");

        const data: Post[] = await response.json();
        setFeaturedPosts(data.filter((post) => post.isFeatured));
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  useEffect(() => {
    if (featuredPosts.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % featuredPosts.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [featuredPosts]);

  if (loading) return <div className="carousel-loading">Loading featured posts...</div>;
  if (error) return <div className="carousel-error">Error: {error}</div>;
  if (!featuredPosts.length) return <div className="carousel-empty">No featured posts available.</div>;

  return (
    <section className="carousel-section">
      <div className="carousel-container">
        <div
          className="carousel-track"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {featuredPosts.map((post) => (
            <div className="carousel-item" key={post.id}>
              <img
                src={post.featuredImage.startsWith("data:image") ? post.featuredImage : `data:image/png;base64,${post.featuredImage}`}
                alt={post.title}
                className="carousel-image"
              />
              <div className="carousel-content">
                <h2>{post.title}</h2>
                <p>{post.excerpt}</p>
                <Link to={`/post/${post.slug}`} className="read-more">
                  Read More
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="carousel-controls">
        {featuredPosts.map((_, idx) => (
          <button
            key={idx}
            className={`dot ${idx === currentIndex ? "active" : ""}`}
            onClick={() => setCurrentIndex(idx)}
          ></button>
        ))}
      </div>
    </section>
  );
};

export default FeaturedPostsCarousel;
