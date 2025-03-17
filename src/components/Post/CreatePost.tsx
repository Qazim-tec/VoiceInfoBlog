import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { useCategories } from "../../hooks/useCategories";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "./CreatePost.css";

interface Post {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  featuredImage: string;
  categoryId: number;
  tags: string[];
  slug: string;
}

const CreatePost: React.FC = () => {
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [excerpt, setExcerpt] = useState<string>("");
  const [featuredImage, setFeaturedImage] = useState<File | null>(null);
  const [categoryId, setCategoryId] = useState<number>(0);
  const [tags, setTags] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { user } = useUser();
  const { categories, loading: catLoading, error: catError } = useCategories();
  const navigate = useNavigate();
  const location = useLocation();
  const postToEdit = location.state?.postToEdit as Post | undefined;

  // Pre-fill form if editing an existing post
  useEffect(() => {
    if (postToEdit) {
      setTitle(postToEdit.title);
      setContent(postToEdit.content);
      setExcerpt(postToEdit.excerpt || "");
      setCategoryId(postToEdit.categoryId);
      setTags(postToEdit.tags.join(", "));
      // Note: featuredImage is not pre-filled as a File; it’s handled separately if needed
    }
  }, [postToEdit]);

  if (!user) {
    navigate("/SignIn");
    return null;
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFeaturedImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (!title.trim() || !content.trim()) {
      setError("Title and Content are required");
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append("Title", title);
    formData.append("Content", content);
    if (excerpt) formData.append("Excerpt", excerpt);
    if (featuredImage) formData.append("FeaturedImage", featuredImage);
    formData.append("CategoryId", categoryId.toString());
    if (tags) {
      const tagsArray = tags.split(",").map((tag) => tag.trim());
      tagsArray.forEach((tag) => formData.append("Tags", tag));
    }

    const url = postToEdit
      ? `https://localhost:7094/api/Post/update/${postToEdit.id}`
      : "https://localhost:7094/api/Post/create";
    const method = postToEdit ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to ${postToEdit ? "update" : "create"} post`);
      }

      const data = await response.json();
      navigate(`/post/${data.slug || postToEdit?.slug}`);
    } catch (err) {
      setError(
        (err as Error).message || `An error occurred while ${postToEdit ? "updating" : "creating"} the post`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quill toolbar modules
  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["blockquote", "code-block"],
      [{ align: [] }],
      ["link"],
      [{ color: [] }, { background: [] }],
      ["clean"],
    ],
  };

  return (
    <div className="create-post-page">
      <div className="create-post-container">
        <h1>{postToEdit ? "Edit Post" : "Create a New Post"}</h1>
        {error && <div className="error-message">{error}</div>}
        {catError && <div className="error-message">{catError}</div>}

        <form
          onSubmit={handleSubmit}
          encType="multipart/form-data"
          className="post-form"
        >
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Enter a captivating title"
            />
          </div>

          <div className="form-group">
            <label htmlFor="content">Content</label>
            <ReactQuill
              value={content}
              onChange={setContent}
              modules={quillModules}
              placeholder="Share your thoughts with formatting..."
              className="quill-editor"
            />
          </div>

          <div className="form-group">
            <label htmlFor="excerpt">Excerpt</label>
            <textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="A brief teaser (optional)"
              rows={4}
            />
          </div>

          <div className="form-group">
            <label htmlFor="featuredImage">Featured Image</label>
            <input
              type="file"
              id="featuredImage"
              accept="image/*"
              onChange={handleImageChange}
            />
            {featuredImage ? (
              <p className="file-preview">{featuredImage.name}</p>
            ) : postToEdit?.featuredImage ? (
              <p className="file-preview">Current image: (Previously uploaded)</p>
            ) : null}
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(parseInt(e.target.value))}
              disabled={catLoading}
            >
              <option value={0}>Select a category</option>
              {catLoading ? (
                <option>Loading...</option>
              ) : (
                categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tags</label>
            <input
              type="text"
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., health, tips, news (comma-separated)"
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(postToEdit ? `/post/${postToEdit.slug}` : "/")}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || catLoading}
            >
              {isSubmitting
                ? postToEdit
                  ? "Updating..."
                  : "Publishing..."
                : postToEdit
                ? "Update Post"
                : "Publish Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;