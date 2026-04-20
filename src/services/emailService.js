import nodemailer from 'nodemailer';


const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendApprovalEmail = async (agentEmail, agentName) => {
  const mailOptions = {
    from: '"Real Estate Team" <no-reply@betconnect.com>',
    to: agentEmail,
    subject: "Your Account has been Approved!",
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>Congratulations, ${agentName}!</h2>
        <p>Your agent account has been reviewed and <strong>approved</strong> by our admin team.</p>
        <p>You can now start listing properties and connecting with potential buyers.</p>
        <br />
        <a href="${process.env.FRONTEND_URL}/login" style="background: #0C447C; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login to your Dashboard</a>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
};