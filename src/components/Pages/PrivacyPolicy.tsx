import React from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async"; 
import "./Pages.css";

const PrivacyPolicy: React.FC = () => {
  const childVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <>
      <Helmet>
        <title>Privacy Policy | VoiceInfo</title>
        <meta
          name="description"
          content="Learn how VoiceInfo collects, uses, and protects your personal information when you use our news and blogging platform."
        />
      </Helmet>
      <div className="page-container">
        <motion.div
          className="page-form"
          variants={childVariants}
          initial="initial"
          animate="animate"
        >
          <motion.h2 variants={childVariants}>Privacy Policy</motion.h2>
          <motion.div variants={childVariants} className="page-content">
            <p><strong>Last Updated: May 2, 2025</strong></p>
            <p>
              At VoiceInfo, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our website, voiceinfos.com, and its services, including creating posts, commenting, and reading news. By using VoiceInfo, you agree to the terms outlined in this policy.
            </p>

            <h3>1. Information We Collect</h3>
            <p>We collect information to provide and improve our services. The types of information we collect include:</p>
            <ul>
              <li><strong>Personal Information</strong>: When you register an account, you provide details such as your name and email address only. Voiceinfos will never request for any other details, so pls aware of fraud</li>
              <li><strong>User-Generated Content</strong>: Posts, comments, and other content you submit to VoiceInfo are stored and will be publicly visible.</li>
              
            </ul>

        

          
            <h3>2. Data Security</h3>
            <p>
              We implement industry-standard security measures, such as encryption and secure servers, to protect your data. However, no system is completely secure, and we cannot guarantee absolute security. You are responsible for keeping your account credentials confidential.
            </p>

            

            <h3>3. Third-Party Links</h3>
            <p>
              VoiceInfo may contain links to third-party websites. We are not responsible for their privacy practices. Please review their policies before sharing information.
            </p>

            <h3>4. Children’s Privacy</h3>
            <p>
              VoiceInfo is not intended for users under 13. We do not knowingly collect data from children under 13. If we learn such data has been collected, we will delete it promptly.
            </p>

            <h3>5. Changes to This Policy</h3>
            <p>
              We may update this Privacy Policy to reflect changes in our practices or legal requirements. We will notify you of significant changes via email or a notice on our website. The updated policy will be effective upon posting.
            </p>

            <h3>6. Contact Us</h3>
            <p>
              For questions about this Privacy Policy, contact us at:
              <br />
              Email: <a href="voiceinfos01@gmail.com">voiceinfos01@gmail.com</a>
              <br />
           
            </p>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
};

export default PrivacyPolicy;