// src/components/Contact.js
import React from "react";

export default function Contact() {
  return (
    <div className="contact-page glass">
      <style>{`
        .contact-page {
          padding: 30px;
          max-width: 800px;
          margin: 20px auto;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
          color: #fff;
          line-height: 1.6;
          font-family: "Poppins", sans-serif;
        }
        .contact-page h2 {
          color: #ff9800;
          margin-bottom: 15px;
        }
        .contact-page h3 {
          margin-top: 20px;
          color: #ffd54f;
        }
        .contact-page a {
          color: #ff9800;
          text-decoration: none;
        }
        .contact-page a:hover {
          text-decoration: underline;
        }
      `}</style>

      <h2>📩 Contact Us</h2>
      <p>
        We’d love to hear from you! Whether you have a question, feedback, or
        need help with booking, feel free to reach out.
      </p>

      <h3>📞 Get in Touch</h3>
      <p>Email: <a href="mailto:support@moviemart.com">support@moviemart.com</a></p>
      <p>Phone: +91 98765 43210</p>

      <h3>🏢 Our Office</h3>
      <p>
        Movie Mart Pvt. Ltd.<br />
        2nd Floor, Cineplex Tower,<br />
        Mumbai, India.
      </p>

      <h3>🕒 Working Hours</h3>
      <p>Monday – Saturday: 9:00 AM – 9:00 PM</p>
      <p>Sunday: 10:00 AM – 6:00 PM</p>

      <h3>💡 Have Suggestions?</h3>
      <p>
        Your feedback helps us improve! Drop us a message and we’ll get back to
        you within 24 hours.
      </p>
    </div>
  );
}
