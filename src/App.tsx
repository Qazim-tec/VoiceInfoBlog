// src/App.tsx
import { Routes, Route } from "react-router-dom";
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
import MyPosts from "./components/MyPosts/MyPosts"; // Add this import

import "./App.css";

const App: React.FC = () => {
  return (
    <div className="App">
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={
            <main>
              <h1>Unveil the Stories That Matter</h1>
              <p className="p_title">Dive into trending topics, breaking news, and hidden gems—updated daily.</p>
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
        <Route path="/my-posts" element={<MyPosts />} /> {/* Add this route */}
        <Route path="/:categoryName" element={<CategoryPage />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/admin/feature-posts" element={<FeaturePosts />} />
      </Routes>
      <Footer />
    </div>
  );
};

export default App;