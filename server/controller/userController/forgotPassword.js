// forgotPasswordController.js
import User from '../../models/users.js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Store OTPs temporarily (in production, use Redis or database)
const otpStore = new Map();

// Configure email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail', // or your email service
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

// Mask email for privacy
const maskEmail = (email) => {
    const [username, domain] = email.split('@');
    const maskedUsername = username.slice(0, 2) + '***';
    return `${maskedUsername}@${domain}`;
};

// Generate 6-digit OTP
const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

// Send OTP email
const sendOTPEmail = async (email, otp, name) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset OTP',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Password Reset Request</h2>
                <p>Hi ${name},</p>
                <p>You have requested to reset your password. Please use the following OTP to verify your identity:</p>
                <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h1 style="color: #2563eb; text-align: center; letter-spacing: 5px;">${otp}</h1>
                </div>
                <p>This OTP is valid for 10 minutes.</p>
                <p>If you did not request this, please ignore this email.</p>
                <br>
                <p>Best regards,<br>Your Team</p>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);
};

// 1. Request OTP - Send OTP to user's email
export const requestOTP = async (req, res) => {
    try {
        const { sapId } = req.body;

        if (!sapId) {
            return res.status(400).json({
                success: false,
                statusCode: 400,
                msg: 'SAP ID is required',
            });
        }

        // Find user by SAP ID
        const user = await User.findOne({ sapId });

        if (!user) {
            return res.status(404).json({
                success: false,
                statusCode: 400,
                msg: 'User not found with this SAP ID',
            });
        }

        // Generate OTP
        const otp = generateOTP();
        const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

        // Store OTP with expiry
        otpStore.set(sapId, {
            otp,
            expiresAt,
            attempts: 0,
            email: user.email,
        });

        // Send OTP via email
        await sendOTPEmail(user.email, otp, user.name);

        res.status(200).json({
            success: true,
            statusCode: 200,
            msg: 'OTP sent successfully',
            maskedEmail: maskEmail(user.email),
        });

    } catch (error) {
        console.error('Request OTP Error:', error);
        res.status(500).json({
            success: false,
            statusCode: 500,
            msg: 'Failed to send OTP',
            error: error.msg,
        });
    }
};

// 2. Verify OTP
export const verifyOTP = async (req, res) => {
    try {
        const { sapId, otp } = req.body;

        if (!sapId || !otp) {
            return res.status(400).json({
                success: false,
                msg: 'SAP ID and OTP are required',
            });
        }

        // Check if OTP exists
        const otpData = otpStore.get(sapId);

        if (!otpData) {
            return res.status(400).json({
                success: false,
                statusCode: 400,
                msg: 'OTP expired or not found. Please request a new one.',
            });
        }

        // Check if OTP is expired
        if (Date.now() > otpData.expiresAt) {
            otpStore.delete(sapId);
            return res.status(400).json({
                success: false,
                statusCode: 400,
                msg: 'OTP has expired. Please request a new one.',
            });
        }

        // Check attempts (max 5 attempts)
        if (otpData.attempts >= 5) {
            otpStore.delete(sapId);
            return res.status(429).json({
                success: false,
                statusCode: 429,
                msg: 'Too many failed attempts. Please request a new OTP.',
            });
        }

        // Verify OTP
        if (otpData.otp !== otp) {
            otpData.attempts += 1;
            return res.status(400).json({
                success: false,
                statusCode: 400,
                msg: 'Invalid OTP',
                attemptsLeft: 5 - otpData.attempts,
            });
        }

        // OTP verified successfully - mark as verified
        otpData.verified = true;
        otpData.verifiedAt = Date.now();

        res.status(200).json({
            success: true,
            msg: 'OTP verified successfully',
        });

    } catch (error) {
        console.error('Verify OTP Error:', error);
        res.status(500).json({
            success: false,
            statusCode: 500,
            msg: 'Failed to verify OTP',
            error: error.msg,
        });
    }
};

// 3. Resend OTP
export const resendOTP = async (req, res) => {
    try {
        const { sapId } = req.body;

        if (!sapId) {
            return res.status(400).json({
                success: false,
                msg: 'SAP ID is required',
            });
        }

        // Find user by SAP ID
        const user = await User.findOne({ sapId });

        if (!user) {
            return res.status(404).json({
                success: false,
                statusCode: 404,
                msg: 'User not found with this SAP ID',
            });
        }

        // Generate new OTP
        const otp = generateOTP();
        const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

        // Store new OTP
        otpStore.set(sapId, {
            otp,
            expiresAt,
            attempts: 0,
            email: user.email,
        });

        // Send OTP via email
        await sendOTPEmail(user.email, otp, user.name);

        res.status(200).json({
            success: true,
            statusCode: 200,
            msg: 'OTP resent successfully',
            maskedEmail: maskEmail(user.email),
        });

    } catch (error) {
        console.error('Resend OTP Error:', error);
        res.status(500).json({
            success: false,
            statusCode: 500,
            msg: 'Failed to resend OTP',
            error: error.msg,
        });
    }
};

// 4. Reset Password
export const resetPassword = async (req, res) => {
    try {
        const { sapId, newPassword } = req.body;

        if (!sapId || !newPassword) {
            return res.status(400).json({
                success: false,
                msg: 'SAP ID and new password are required',
            });
        }

        // Check if OTP was verified
        const otpData = otpStore.get(sapId);

        if (!otpData || !otpData.verified) {
            return res.status(400).json({
                success: false,
                msg: 'OTP not verified. Please verify OTP first.',
            });
        }

        // Check if verification is still valid (within 5 minutes)
        if (Date.now() - otpData.verifiedAt > 5 * 60 * 1000) {
            otpStore.delete(sapId);
            return res.status(400).json({
                success: false,
                msg: 'Verification expired. Please start again.',
            });
        }

        // Validate password strength
        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                msg: 'Password must be at least 8 characters long',
            });
        }

        // Find user and update password
        const user = await User.findOne({ sapId }).select('+password');

        if (!user) {
            return res.status(404).json({
                success: false,
                msg: 'User not found',
            });
        }

        // Update password (will be hashed by pre-save hook)
        user.password = newPassword;
        await user.save();

        // Clean up OTP data
        otpStore.delete(sapId);

        res.status(200).json({
            success: true,
            msg: 'Password reset successfully',
        });

    } catch (error) {
        console.error('Reset Password Error:', error);
        res.status(500).json({
            success: false,
            msg: 'Failed to reset password',
            error: error.msg,
        });
    }
};

// Optional: Clean up expired OTPs periodically
setInterval(() => {
    const now = Date.now();
    for (const [sapId, data] of otpStore.entries()) {
        if (now > data.expiresAt) {
            otpStore.delete(sapId);
        }
    }
}, 5 * 60 * 1000); // Run every 5 minutes