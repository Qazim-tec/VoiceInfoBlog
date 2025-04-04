import { Routes, Route, useLocation } from "react-router-dom"; // Add useLocation
import { useEffect } from "react"; // Add useEffect
import Navbar from "./components/Navbar/Navbar";
import FeaturedPostsCarousel from "./components/FeaturedPost/FeaturedPostsCarousel";
import PostDetail from "./components/PostDetail/PostDetail";
import SignIn from "./components/Auth/SignIn";
import SignUp from "./components/Auth/SignUp";
import CreatePost from "./components/Post/CreatePost";
import CategoryPage from "./components/Category/CategoryPage";
import Settings from "./components/Settings/Settings";
import FeaturePosts from "./components/Admin/FeaturePosts";
import LatestNews from "./components/LatestNews/LatestNews";
import TrendingPosts from "./components/TrendingPosts/TrendingPosts";
import Footer from "./components/Footer/Footer";
import CategoriesSection from "./components/CategoriesSection/CategoriesSection";
import MyPosts from "./components/MyPosts/MyPosts";
import ProfilePage from "./components/ProfilePage/ProfilePage";

import "./App.css";

const App: React.FC = () => {
  const location = useLocation(); // Hook to track route changes

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]); // Trigger when the pathname changes

  return (
    <div className="App">
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={
            <main>
              <h1>Unveil the Stories That Matter</h1>
              <FeaturedPostsCarousel />
              <LatestNews />
              <CategoriesSection />
              <TrendingPosts />
            </main>
          }
        />
        <Route path="/post/:slug" element={<PostDetail />} />
        <Route path="/SignIn" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/create-post" element={<CreatePost />} />
        <Route path="/my-posts" element={<MyPosts />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/:categoryName" element={<CategoryPage />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/admin/feature-posts" element={<FeaturePosts />} />
      </Routes>
      <Footer />
    </div>
  );
};

export default App;