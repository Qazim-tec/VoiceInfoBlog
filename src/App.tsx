import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "./components/Navbar/Navbar";
import FeaturedPostsCarousel from "./components/FeaturedPost/FeaturedPostsCarousel";
import PostDetail from "./components/PostDetail/PostDetail";
import SignIn from "./components/Auth/SignIn";
import SignUp from "./components/Auth/SignUp";
import OtpVerification from "./components/Auth/OtpVerification";
import ForgotPassword from "./components/Auth/ForgotPassword";
import ResetPassword from "./components/Auth/ResetPassword";
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
import PrivacyPolicy from "./components/Pages/PrivacyPolicy";
import ContactUs from "./components/Pages/ContactUs";
import About from "./components/Pages/About";
import Disclaimer from "./components/Pages/Disclaimer";
import { UserProvider } from "./context/UserContext";

import "./App.css";
import LaunchPage from "./components/LaunchPage/LaunchPage";

const App: React.FC = () => {
  const location = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Parent animation variants (for page entry/exit)
  const pageVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        duration: 0.5,
        when: "beforeChildren", // Animate parent before children
        staggerChildren: 0.2,  // Delay between each child animation
      },
    },
    exit: { opacity: 0, transition: { duration: 0.5 } },
  };

  // Child animation variants (for individual elements flowing in)
  const childVariants = {
    initial: { opacity: 0, y: 20 }, // Start below and invisible
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } }, // Flow in
  };

  const accessGranted = localStorage.getItem("siteAccess") === "granted";
  const now = new Date();
  const launchDate = new Date("2025-06-10T00:00:00");
  const hasLaunched = now >= launchDate;

  if (!accessGranted && !hasLaunched) {
    return <LaunchPage />;
  }

  return (
    <div className="App">
      <UserProvider>
        <Navbar />
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route
              path="/"
              element={
                <motion.main
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <motion.h1 variants={childVariants}>
                    Unveil the Stories That Matter
                  </motion.h1>
                  <motion.div variants={childVariants}>
                    <FeaturedPostsCarousel />
                  </motion.div>
                  <motion.div variants={childVariants}>
                    <LatestNews />
                  </motion.div>
                  <motion.div variants={childVariants}>
                    <CategoriesSection />
                  </motion.div>
                  <motion.div variants={childVariants}>
                    <TrendingPosts />
                  </motion.div>
                </motion.main>
              }
            />
            <Route
              path="/post/:slug"
              element={
                <motion.div
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <PostDetail />
                </motion.div>
              }
            />
            <Route
              path="/SignIn"
              element={
                <motion.div
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <SignIn />
                </motion.div>
              }
            />
            <Route
              path="/signup"
              element={
                <motion.div
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <SignUp />
                </motion.div>
              }
            />
            <Route
              path="/otp-verification"
              element={
                <motion.div
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <OtpVerification />
                </motion.div>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <motion.div
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <ForgotPassword />
                </motion.div>
              }
            />
            <Route
              path="/reset-password"
              element={
                <motion.div
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <ResetPassword />
                </motion.div>
              }
            />
            <Route
              path="/create-post"
              element={
                <motion.div
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <CreatePost />
                </motion.div>
              }
            />
            <Route
              path="/my-posts"
              element={
                <motion.div
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <MyPosts />
                </motion.div>
              }
            />
            <Route
              path="/profile"
              element={
                <motion.div
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <ProfilePage />
                </motion.div>
              }
            />
            <Route
              path="/:categoryName"
              element={
                <motion.div
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <CategoryPage />
                </motion.div>
              }
            />
            <Route
              path="/settings"
              element={
                <motion.div
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <Settings />
                </motion.div>
              }
            />
            <Route
              path="/admin/feature-posts"
              element={
                <motion.div
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <FeaturePosts />
                </motion.div>
              }
            />
            <Route
              path="/privacy-policy"
              element={
                <motion.div
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <PrivacyPolicy />
                </motion.div>
              }
            />
            <Route
              path="/contact-us"
              element={
                <motion.div
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <ContactUs />
                </motion.div>
              }
            />
            <Route
              path="/about"
              element={
                <motion.div
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <About />
                </motion.div>
              }
            />
            <Route
              path="/disclaimer"
              element={
                <motion.div
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <Disclaimer />
                </motion.div>
              }
            />
          </Routes>
        </AnimatePresence>
        <Footer />
      </UserProvider>
    </div>
  );
};

export default App;