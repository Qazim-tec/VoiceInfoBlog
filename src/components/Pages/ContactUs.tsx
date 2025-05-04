import React, { useState } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { useForm, SubmitHandler } from "react-hook-form";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faEnvelope, faComment } from "@fortawesome/free-solid-svg-icons";
import { API_BASE_URL } from "../../config/apiConfig";
import "./ContactUs.css";

type ContactFormInputs = {
  name: string;
  email: string;
  message: string;
};

const ContactUs: React.FC = () => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactFormInputs>();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const headers = {
    "Content-Type": "application/json-patch+json",
    "Accept": "*/*",
    // Uncomment if authentication is required:
    // "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
  };

  const childVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const onSubmit: SubmitHandler<ContactFormInputs> = async (data) => {
    setIsSubmitting(true);
    setSuccessMessage(null);
    try {
      console.log("Submitting to:", `${API_BASE_URL}/api/Contact`);
      console.log("Request body:", JSON.stringify(data));
      console.log("Headers:", headers);

      const response = await fetch(`${API_BASE_URL}/api/Contact`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });

      console.log("Response status:", response.status);
      const responseData = await response.json();
      console.log("Response data:", responseData);

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status} ${response.statusText}`);
      }

      setSuccessMessage("Thank you for your message! We'll get back to you soon.");
      reset();
    } catch (error: any) {
      console.error("Submission error:", error.message);
      setSuccessMessage(`An error occurred: ${error.message}. Please try again later.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Contact Us | VoiceInfo</title>
        <meta
          name="description"
          content="Get in touch with VoiceInfo. Send us your questions, feedback, or suggestions through our contact form."
        />
      </Helmet>
      <div className="contact-us">
        <div className="page-container">
          <motion.div
            className="page-form"
            variants={childVariants}
            initial="initial"
            animate="animate"
          >
            <motion.h2 variants={childVariants}>Contact Us</motion.h2>
            <motion.form
              onSubmit={handleSubmit(onSubmit)}
              className="contact-form"
              variants={childVariants}
            >
              <motion.div className="form-group" variants={childVariants}>
                <FontAwesomeIcon icon={faUser} className="input-icon" />
                <input
                  id="name"
                  type="text"
                  {...register("name", { required: "Name is required" })}
                  placeholder="Your Name"
                  disabled={isSubmitting}
                />
                {errors.name && <span className="error-message">{errors.name.message}</span>}
              </motion.div>

              <motion.div className="form-group" variants={childVariants}>
                <FontAwesomeIcon icon={faEnvelope} className="input-icon" />
                <input
                  id="email"
                  type="email"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                      message: "Invalid email address",
                    },
                  })}
                  placeholder="Your Email"
                  disabled={isSubmitting}
                />
                {errors.email && <span className="error-message">{errors.email.message}</span>}
              </motion.div>

              <motion.div className="form-group" variants={childVariants}>
                <FontAwesomeIcon icon={faComment} className="input-icon" />
                <textarea
                  id="message"
                  {...register("message", { required: "Message is required" })}
                  placeholder="Your Message"
                  disabled={isSubmitting}
                />
                {errors.message && <span className="error-message">{errors.message.message}</span>}
              </motion.div>

              <motion.button
                type="submit"
                className="page-button"
                variants={childVariants}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="page-loader" />
                ) : (
                  "Send Message"
                )}
              </motion.button>
            </motion.form>
            {successMessage && (
              <motion.p variants={childVariants} className="success-message">
                {successMessage}
              </motion.p>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default ContactUs;