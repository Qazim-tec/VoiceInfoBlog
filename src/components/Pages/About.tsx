import React from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async"; 
import "./AboutPage.css";

const About: React.FC = () => {
  const childVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <>
      <Helmet>
        <title>About Us | VoiceInfo</title>
        <meta
          name="description"
          content="Discover VoiceInfo, your platform for news, user-generated posts, and community engagement through comments and stories."
        />
      </Helmet>
      <div className="about-page">
        <div className="about-page-container">
          <motion.div
            className="about-page-card"
            variants={childVariants}
            initial="initial"
            animate="animate"
          >
            <motion.h2 className="about-page-title" variants={childVariants}>
              About voiceinfos.com
            </motion.h2>
            <motion.div variants={childVariants} className="about-page-content">
              <p>
                Welcome to <strong>VoiceInfo</strong>, the dynamic news and blogging platform where stories come to life. Launched in 2025, VoiceInfo is designed to empower individuals and communities to share their voices, stay informed, and engage with the world’s most pressing stories.
              </p>

              <h3>Our Mission</h3>
              <p>
                At VoiceInfo, our mission is to create a vibrant space where everyone can contribute to the global conversation. Whether you’re a passionate writer, an avid reader, or a curious commenter, we provide the tools to share your perspective, discover breaking news, and connect with others who care about the issues that matter.
              </p>

              <h3>What We Offer</h3>
              <ul>
                <li><strong>Create and Share Posts</strong>: Express yourself by publishing articles, opinions, or stories. Our intuitive post creation tool makes it easy to share your ideas with a global audience.</li>
                <li><strong>Engage Through Comments</strong>: Join the conversation by commenting on posts and news articles. Your insights help build a diverse and inclusive community.</li>
                <li><strong>Stay Informed</strong>: Access the latest news curated from trusted sources, alongside trending user-generated content, all in one place.</li>
                <li><strong>Personalized Experience</strong>: Customize your feed to focus on the topics and creators you care about most.</li>
              </ul>

              <h3>Our Community</h3>
              <p>
                VoiceInfo is more than a platform—it’s a community. From aspiring journalists to everyday storytellers, our users bring unique perspectives that enrich our platform. We’re committed to fostering a respectful, inclusive environment where diverse voices are heard and valued.
              </p>

              <h3>Our Values</h3>
              <ul>
                <li><strong>Authenticity</strong>: We celebrate genuine stories and honest dialogue.</li>
                <li><strong>Inclusivity</strong>: Everyone has a story to tell, and every voice matters.</li>
                <li><strong>Transparency</strong>: We’re open about how we operate and protect your data.</li>
                <li><strong>Innovation</strong>: We continuously improve our platform to serve you better.</li>
              </ul>

              <h3>Join Us</h3>
              <p>
                Whether you’re here to write, read, or connect, VoiceInfo is your home for news and stories that inspire. Sign up today to start creating, commenting, and exploring the world through the lens of our community.
              </p>

              <h3>Contact Us</h3>
              <p>
                Have questions or ideas? Reach out to us at <a href="mailto:voiceinfos01@gmail.com">voiceinfos01@gmail.com</a> or visit our <a href="/contact-us">Contact Us</a> page.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default About;