import "dotenv/config";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (email, otp) => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: [email],
      subject: "RepairMithra - Email Verification Code",

      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: 0 auto;
          padding: 30px;
        ">
          <h2 style="color: #123B63;">
            RepairMithra Email Verification
          </h2>

          <p>Hello,</p>

          <p>
            Use the verification code below to complete
            your RepairMithra registration.
          </p>

          <div style="
            background: #f1f7ff;
            padding: 20px;
            text-align: center;
            border-radius: 10px;
            margin: 20px 0;
          ">
            <span style="
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
              color: #123B63;
            ">
              ${otp}
            </span>
          </div>

          <p>
            This code will expire in <strong>10 minutes</strong>.
          </p>

          <p>
            If you did not request this code,
            you can safely ignore this email.
          </p>

          <hr />

          <p style="font-size: 12px; color: #777;">
            This is an automated email from RepairMithra.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend API error:", error);
      throw new Error(error.message || "Failed to send email");
    }

    console.log("Verification email sent:", data?.id);

    return data;
  } catch (error) {
    console.error("Email service error:", error);
    throw error;
  }
};