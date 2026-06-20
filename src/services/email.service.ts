// import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();
//
// const transporter = nodemailer.createTransport({
//     host: process.env.MAIL_HOST,
//     port: Number(process.env.MAIL_PORT),
//     secure: false,
//     auth: {
//         user: process.env.MAIL_USER,
//         pass: process.env.MAIL_PASS,
//     },
// });
//
// export async function sendEmail(to: string, subject: string, text: string) {
//     try {
//         const info = await transporter.sendMail({
//             from: `"Monitor Bot" <${process.env.MAIL_FROM}>`,
//             to,
//             subject,
//             text,
//         });
//
//         console.log("📧 EMAIL SENT:", info.response);
//         return info;
//     } catch (err) {
//         console.error("❌ EMAIL FAILED:", err);
//         throw err;
//     }
// }

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(
    to: string,
    subject: string,
    text: string
) {
    try {
        const result = await resend.emails.send({
            from: "Website Monitor <onboarding@resend.dev>",
            to,
            subject,
            html: `<p>${text}</p>`,
        });

        console.log("📧 Email sent:", result);
    } catch (err) {
        console.error("❌ Email failed:", err);
    }
}