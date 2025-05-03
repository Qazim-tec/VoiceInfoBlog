import React from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async"; 
import "./Pages.css";

const Disclaimer: React.FC = () => {
  const childVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <>
      <Helmet>
        <title>Disclaimer | VoiceInfo</title>
        <meta
          name="description"
          content="Understand the limitations and responsibilities of content on VoiceInfo, including user-generated posts and news articles."
        />
      </Helmet>
      <div className="page-container">
        <motion.div
          className="page-form"
          variants={childVariants}
          initial="initial"
          animate="animate"
        >
          <motion.h2 variants={childVariants}>Disclaimer</motion.h2>
          <motion.div variants={childVariants} className="page-content">
            <p><strong>Last Updated: May 2, 2025</strong></p>
            <p>
              The information provided on voiceinfos.com, including news articles, user-generated posts, and comments, is for general informational purposes only. While we strive to deliver accurate and timely content, VoiceInfo makes no warranties or representations regarding the accuracy, completeness, or reliability of the information presented.
            </p>

            <h3>1. General Information</h3>
            <p>
              The content on VoiceInfo is not intended to be professional advice (e.g., legal, financial, medical). You should consult qualified professionals for specific advice tailored to your situation. Reliance on any information provided on our platform is at your own risk.
            </p>

            <h3>2. User-Generated Content</h3>
            <p>
              VoiceInfo allows users to create posts and comments. These contributions reflect the opinions of individual users, not VoiceInfo. We do not endorse or verify the accuracy of user-generated content. We reserve the right to moderate, edit, or remove content that violates our Terms of Service, including content that is offensive, misleading, or illegal.
            </p>

            <h3>3. Third-Party Links</h3>
            <p>
              Our platform may include links to third-party websites or services. These links are provided for convenience, and VoiceInfo is not responsible for the content, accuracy, or practices of these third parties. Accessing third-party sites is at your own risk, and we encourage you to review their terms and policies.
            </p>

            <h3>4. Limitation of Liability</h3>
            <p>
              To the fullest extent permitted by law, VoiceInfo, its affiliates, and its service providers are not liable for any direct, indirect, incidental, or consequential damages arising from your use of the platform, including but not limited to errors in content, loss of data, or service interruptions.
            </p>

            <h3>5. News and Timeliness</h3>
            <p>
              We aim to provide up-to-date news, but the dynamic nature of news means information may change rapidly. We do not guarantee that news articles or updates are always current or error-free. User comments may also contain outdated or inaccurate information.
            </p>

            <h3>6. Availability of Services</h3>
            <p>
              VoiceInfo strives to maintain continuous access to our platform but does not guarantee uninterrupted service. We may perform maintenance, updates, or face technical issues that affect availability, and we are not liable for any resulting inconvenience or loss.
            </p>

            <h3>7. Changes to This Disclaimer</h3>
            <p>
              We may update this Disclaimer to reflect changes in our practices or legal requirements. Updates will be posted on this page, and significant changes will be communicated via email or a website notice.
            </p>

            <h3>8. Contact Us</h3>
            <p>
              For questions about this Disclaimer, contact us at:
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

export default Disclaimer;