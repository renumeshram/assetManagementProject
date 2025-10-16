import express from 'express';
import User from '../../models/users.js';
// import bcrypt from 'bcrypt';

const resetPassword = async (req, res) => {
    try {
        const { sapId, password } = req.body;

        if (!sapId || !password) {
            return res.status(400).json({ msg: "Please provide SAP ID and new password" });

        }
        const adminLocation = req.user?.assignedLocationId;
        console.log("🚀 ~ resetPassword ~ req.user:", req.user)
        console.log("🚀 ~ resetPassword ~ adminLocation:", adminLocation)
        if (!adminLocation) {
            return res.status(404).json({ msg: "Admin's location not found" })
        }

        const user = await User.findOne({ 
            sapId,
            locationId: adminLocation 
        });
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        // Hash the new password
        // const hashedPassword = await bcrypt.hash(password, 10);
        user.password = password;

        // Skip validation for assignedLocationId if not updating it
        await user.save({ validateBeforeSave: false });

        console.log(`Password for user with SAP ID ${sapId} has been reset successfully`);

        res.status(200).json({
            success: true,
            statusCode: 200,
            msg: `Password reset successfully for user with SAP ID ${sapId}`,
        });
    } catch (err) {
        console.log("🚀 ~ resetPassword ~ err:", err);
        return res.status(500).json({
            success: false,
            statusCode: 500,
            msg: "Internal server error",
            error: err.message,
        });
    }
};


const resetAllPasswords = async (req, res) => {
    try {
        const { password } = req.body;
        if (!password) {
            return res.status(400).json({ msg: 'Please provide new password for all users' });
        }

        const adminLocation = req.user.assignedLocationId;
        if (!adminLocation) {
            return res.status(404).json({ msg: "Admin's location not found" })
        }

        const users = await User.find({ 
            role: { $in: ['user', 'manager'] },
            locationId: adminLocation 
        });
        // console.log("🚀 ~ resetAllPasswords ~ users:", users)
        if (users.length === 0) {
            return res.status(404).json({ msg: 'No users found' });
        }

        const updatePromises = users.map(user => {
            user.password = password; // Assuming password is hashed in the User model
            return user.save();
        })

        await Promise.all(updatePromises);

        console.log(`Password reset for ${users.length} users`);

        return res.status(200).json({
            success: true,
            statusCode: 200,
            msg: `Password reset for ${users.length} users`,
        });
    } catch (err) {
        console.log("🚀 ~ resetAllPasswords ~ err:", err)
        return res.status(500).json({
            success: false,
            statusCode: 500,
            msg: 'Internal server error',
            error: err.message
        });
    }
}

const changePassword = async (req, res) => {
    try {
        const { sapId, oldPassword, newPassword } = req.body;
        if (!sapId || !oldPassword || !newPassword) {
            return res.status(400).json({ msg: 'Please provide SAP ID, old password and new password' });
        }
        const user = await User.findOne({ sapId }).select('+password'); // Ensure password is included in the query
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        user.checkpw(oldPassword, async (err, isMatch) => {
            if (err) {
                return res.status(500).json({ msg: 'Error checking password' });
            }
            if (!isMatch) {
                return res.status(401).json({ msg: 'Old password is incorrect' });
            }

            user.password = newPassword; // Assuming password is hashed in the User model
            await user.save();

            console.log(`Password for user with SAP ID ${sapId} has been changed successfully`);

            return res.status(200).json({
                success: true,
                statusCode: 200,
                msg: `Password changed successfully for user with SAP ID ${sapId}`,
            });
        });
    } catch (err) {
        console.log("🚀 ~ changePassword ~ err:", err)
        return res.status(500).json({
            success: false,
            statusCode: 500,
            msg: 'Internal server error',
            error: err.message
        });
    }
}

export {
    resetPassword,
    resetAllPasswords,
    changePassword,
}