const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, text, attachments = [], html = null) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_ID,
        pass: process.env.GMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"City General Hospital" <${process.env.GMAIL_ID}>`,
      to,
      subject,
      text,
      html: html || text, // Fallback to text if html is not provided
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
  } catch (error) {
    console.error("Email error:", error);
  }
};

module.exports = sendEmail;
