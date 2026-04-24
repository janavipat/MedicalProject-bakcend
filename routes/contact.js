import { Router } from 'express';
import nodemailer from 'nodemailer';
import ContactMessage from '../models/ContactMessage.js';

const router = Router();

// POST /api/contact  — public (no auth required, anyone can submit)
router.post('/', async (req, res) => {
  try {
    const { from_name, from_email, message } = req.body;

    if (!from_name?.trim() || !from_email?.trim() || !message?.trim()) {
      return res.status(400).json({ error: 'Name, email and message are required.' });
    }

    // 1. Always save to DB
    const saved = await ContactMessage.create({ from_name, from_email, message });

    // 2. Try to send email notification (optional — requires EMAIL_USER + EMAIL_PASS in .env)
    let emailSent = false;
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,   // Gmail App Password (16-char)
          },
        });

        await transporter.sendMail({
          from:    `"MediCore Support" <${process.env.EMAIL_USER}>`,
          to:      'janavipatel2002@gmail.com',
          subject: `New Support Request from ${from_name}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
              <div style="background:linear-gradient(90deg,#15803d,#16a34a);padding:20px 28px;">
                <h2 style="color:white;margin:0;font-size:1.1rem;">New Support Request — MediCore</h2>
              </div>
              <div style="padding:24px 28px;background:#fff;">
                <table style="width:100%;border-collapse:collapse;font-size:0.92rem;">
                  <tr><td style="padding:8px 0;color:#64748b;width:110px;">From</td><td style="font-weight:600;color:#0f172a;">${from_name}</td></tr>
                  <tr><td style="padding:8px 0;color:#64748b;">Email</td><td><a href="mailto:${from_email}" style="color:#16a34a;">${from_email}</a></td></tr>
                </table>
                <hr style="border:none;border-top:1px solid #f1f5f9;margin:16px 0;">
                <p style="color:#64748b;margin:0 0 8px;font-size:0.85rem;">MESSAGE</p>
                <p style="background:#f8fafc;border-left:3px solid #16a34a;padding:12px 16px;border-radius:6px;color:#1e293b;line-height:1.7;margin:0;">${message.replace(/\n/g, '<br>')}</p>
              </div>
              <div style="padding:14px 28px;background:#f8fafc;font-size:0.78rem;color:#94a3b8;">
                Sent via MediCore Help & Support page
              </div>
            </div>
          `,
        });
        emailSent = true;
      } catch (emailErr) {
        console.error('Email send error:', emailErr.message);
        // Message is already saved — don't fail the whole request
      }
    }

    res.status(201).json({
      success: true,
      message: 'Your message has been received.',
      emailSent,
      id: saved._id,
    });
  } catch (err) {
    console.error('Contact route error:', err);
    res.status(500).json({ error: 'Failed to send message. Please try again.' });
  }
});

export default router;
