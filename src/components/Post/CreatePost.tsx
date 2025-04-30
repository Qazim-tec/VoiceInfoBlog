
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { useCategories } from "../../hooks/useCategories";
import { API_BASE_URL } from "../../config/apiConfig";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "./CreatePost.css";

interface Post {
  id: number;
  title: string;
  content: string;
  excerpt: string | null;
  featuredImageUrl: string;
  additionalImageUrls: string[];
  categoryId: number;
  slug: string;
  createdAt: string;
  views: number;
  isFeatured: boolean;
  isLatestNews: boolean;
  authorId: string;
  authorName: string;
  categoryName: string;
  tags: string[];
  commentsCount: number;
  comments: any[];
}

const CreatePost: React.FC = () => {
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [excerpt, setExcerpt] = useState<string>("");
  const [featuredImage, setFeaturedImage] = useState<File | null>(null);
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string>("");
  const [removeFeaturedImage, setRemoveFeaturedImage] = useState<boolean>(false);
  const [additionalImages, setAdditionalImages] = useState<(File | string | null)[]>([null, null, null]);
  const [additionalImagesToDelete, setAdditionalImagesToDelete] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState<number>(0);
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { user } = useUser();
  const { categories, loading: catLoading, error: catError } = useCategories();
  const navigate = useNavigate();
  const location = useLocation();
  const postToEdit = location.state?.postToEdit as Post | undefined;

  useEffect(() => {
    if (postToEdit) {
      setTitle(postToEdit.title);
      setContent(postToEdit.content);
      setExcerpt(postToEdit.excerpt || "");
      setCategoryId(postToEdit.categoryId);
      setFeaturedImageUrl(postToEdit.featuredImageUrl || "");
      setAdditionalImages([
        ...postToEdit.additionalImageUrls.slice(0, 3),
        ...Array(3 - postToEdit.additionalImageUrls.slice(0, 3).length).fill(null),
      ]);
      setRemoveFeaturedImage(false);
      setAdditionalImagesToDelete([]);
    }
  }, [postToEdit]);

  if (!user) {
    navigate("/SignIn", { replace: true });
    return null;
  }

  const handleFeaturedImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFeaturedImage(e.target.files[0]);
      setFeaturedImageUrl("");
      setRemoveFeaturedImage(false);
    }
  };

  const handleRemoveFeaturedImage = () => {
    setFeaturedImage(null);
    setFeaturedImageUrl("");
    setRemoveFeaturedImage(true);
  };

  const handleAdditionalImageChange = (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const newAdditionalImages = [...additionalImages];
      const existingImage = newAdditionalImages[index];
      if (typeof existingImage === "string" && !additionalImagesToDelete.includes(existingImage)) {
        setAdditionalImagesToDelete([...additionalImagesToDelete, existingImage]);
      }
      newAdditionalImages[index] = e.target.files[0];
      setAdditionalImages(newAdditionalImages);
    }
  };

  const handleRemoveAdditionalImage = (index: number) => {
    const image = additionalImages[index];
    if (typeof image === "string" && !additionalImagesToDelete.includes(image)) {
      setAdditionalImagesToDelete([...additionalImagesToDelete, image]);
    }
    const newAdditionalImages = [...additionalImages];
    newAdditionalImages[index] = null;
    setAdditionalImages(newAdditionalImages);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (!title.trim()) {
      setError("Title is required");
      setIsSubmitting(false);
      return;
    }

    if (!content.trim()) {
      setError("Content is required");
      setIsSubmitting(false);
      return;
    }

    if (categoryId === 0) {
      setError("Please select a category");
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append("Title", title);
    formData.append("Content", content);
    formData.append("Excerpt", excerpt);
    if (featuredImage && !removeFeaturedImage) {
      formData.append("FeaturedImage", featuredImage);
    }
    additionalImages.forEach((image) => {
      if (image instanceof File) {
        formData.append("AdditionalImages", image);
      }
    });
    if (postToEdit && additionalImagesToDelete.length > 0) {
      additionalImagesToDelete.forEach((url, index) => {
        formData.append(`AdditionalImagesToDelete[${index}]`, url);
      });
    }
    formData.append("CategoryId", categoryId.toString());

    // Debug FormData
    const formDataEntries: { [key: string]: any } = {};
    for (const [key, value] of formData.entries()) {
      formDataEntries[key] = value;
    }
    console.log("FormData sent:", formDataEntries);

    const url = postToEdit
      ? `${API_BASE_URL}/api/Post/update/${postToEdit.id}`
      : `${API_BASE_URL}/api/Post/create`;
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
        console.error("API error response:", errorText);
        throw new Error(errorText || `Failed to ${postToEdit ? "update" : "create"} post`);
      }

      const data: { data: Post; message: string } = await response.json();
      const newPost: Post = data.data;

      console.log("API response:", data);

      

      navigate(`/post/${newPost.slug}`, {
        replace: true,
        state: { updatedPost: newPost },
      });
    } catch (err) {
      setError(
        (err as Error).message || `An error occurred while ${postToEdit ? "updating" : "creating"} the post`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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

        <form onSubmit={handleSubmit} encType="multipart/form-data" className="post-form">
          <div className="form-group">
            <label htmlFor="title">Title *</label>
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
            <label htmlFor="content">Content *</label>
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
            <label htmlFor="featuredImage">Featured Image (Optional)</label>
            <input
              type="file"
              id="featuredImage"
              accept="image/*"
              onChange={handleFeaturedImageChange}
            />
            {(featuredImage || featuredImageUrl) && (
              <div className="image-preview">
                {featuredImage ? (
                  <p className="file-preview">{featuredImage.name}</p>
                ) : featuredImageUrl ? (
                  <>
                    <img src={featuredImageUrl} alt="Featured image" />
                    <div className="remove-image-container">
                      <button
                        type="button"
                        className="remove-image"
                        onClick={handleRemoveFeaturedImage}
                      >
                        Remove
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Additional Images (Optional, up to 3)</label>
            {additionalImages.map((image, index) => (
              <div key={index} className="additional-image-input">
                <input
                  type="file"
                  id={`additionalImage${index}`}
                  accept="image/*"
                  onChange={handleAdditionalImageChange(index)}
                />
                {image && (
                  <div className="image-preview">
                    {image instanceof File ? (
                      <p className="file-preview">{image.name}</p>
                    ) : (
                      <>
                        <img src={image as string} alt={`Additional image ${index + 1}`} />
                        <div className="remove-image-container">
                          <button
                            type="button"
                            className="remove-image"
                            onClick={() => handleRemoveAdditionalImage(index)}
                          >
                            Remove
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(parseInt(e.target.value))}
              disabled={catLoading}
              required
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

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(postToEdit ? `/post/${postToEdit.slug}` : "/", { replace: true })}
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
