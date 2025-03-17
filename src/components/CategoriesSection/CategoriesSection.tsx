import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../../context/UserContext"; // Adjust path as needed
import "./CategoriesSection.css";

interface Post {
  id: number;
  title: string;
  slug: string;
  createdAt: string;
  categoryId: number; // Assuming categoryId is in the post data
  categoryName?: string; // Optional, if API includes it
}

interface Category {
  id: number;
  name: string;
}

const CategoriesSection: React.FC = () => {
  const { user } = useUser();
  const [categoriesWithPosts, setCategoriesWithPosts] = useState<
    { id: number; name: string; posts: Post[] }[]
  >([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers: Record<string, string> = {};
        if (user?.token) {
          headers["Authorization"] = `Bearer ${user.token}`;
        }

        // Fetch all categories from the Render endpoint
        const categoriesResponse = await fetch("https://voiceinfo.onrender.com/api/Category/all", { headers });
        if (!categoriesResponse.ok) throw new Error("Failed to fetch categories");
        const categories: Category[] = await categoriesResponse.json();

        // Fetch all posts from the Render endpoint
        const postsResponse = await fetch("https://voiceinfo.onrender.com/api/Post/all", { headers });
        if (!postsResponse.ok) throw new Error("Failed to fetch posts");
        const posts: Post[] = await postsResponse.json();

        // Group posts by category and limit to 3
        const categoriesWithPosts = categories.map(category => {
          const categoryPosts = posts
            .filter(post => post.categoryId === category.id)
            .slice(0, 3); // Limit to 3 posts
          return {
            id: category.id,
            name: category.name,
            posts: categoryPosts,
          };
        }).filter(category => category.posts.length > 0); // Only show categories with posts

        setCategoriesWithPosts(categoriesWithPosts);
        setLoading(false);
      } catch (err) {
        console.error("Fetch Error:", err);
        setError("Failed to load categories or posts");
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) return <p>Loading categories...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <section className="categories-section">
      <h2>Explore Categories</h2>
      <div className="categories-list">
        {categoriesWithPosts.map(category => (
          <div key={category.id} className="category-item">
            <h3>{category.name}</h3>
            <ul className="category-posts">
              {category.posts.map(post => (
                <li key={post.id}>
                  <Link to={`/post/${post.slug}`}>{post.title}</Link>
                </li>
              ))}
            </ul>
            <Link to={`/${category.name.toLowerCase().replace(/\s+/g, "-")}`} className="see-more">
              See More
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CategoriesSection;