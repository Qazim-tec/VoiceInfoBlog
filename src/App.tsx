import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import FeaturedPostsCarousel from "./components/FeaturedPost/FeaturedPostsCarousel";
import PostDetail from "./components/PostDetail/PostDetail";
import SignIn from "./components/Auth/SignIn"; // Updated path
import SignUp from "./components/Auth/SignUp"; // Updated path
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
              <h1>Welcome to VoiceInfo</h1>
              <p>Explore the latest articles and stories.</p>
              <FeaturedPostsCarousel />
            </main>
          }
        />
        <Route path="/post/:slug" element={<PostDetail />} />
        <Route path="/SignIn" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        
      </Routes>
    </div>
  );
};

export default App;