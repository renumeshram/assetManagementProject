import { trusted } from 'mongoose';
import User from '../../models/users.js';

const getAllUsers = async (req, res) => {
    try {
        let { page = 1, limit = 10 } = req.query;
        page = parseInt(page, 10);
        limit = parseInt(limit, 10);

        //calculate skip value
        const skip = (page - 1) * limit;

        const users = await User.find({})
            .populate("sectionId departmentId")
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
        console.log("🚀 ~ getAllUsers ~ users:", users)

        const total = await User.countDocuments();

        return res.status(200).json({
            success: true,
            statusCode: 200,
            users,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        })

    } catch (error) {
        console.log("🚀 ~ getAllUsers ~ error:", error)
        return res.status(500).json({
            success: false,
            statusCode: 500,
            msg: 'Internal server error',
        })

    }
}

const changeRole = async (req, res) => {
    try {
        console.log("🚀 ~ changeRole ~ req.params:", req.params)
        console.log("🚀 ~ changeRole ~ req.body:", req.body)
        const { userId } = req.params;
        console.log("🚀 ~ changeRole ~ userId:", userId)
        const { newRole } = req.body;

        // Validate userId
        if (!userId) {
            return res.status(400).json({
                success: false,
                msg: 'User ID is required'
            });
        }

        const validRoles = ['user', 'manager', 'admin'];

        if (!validRoles.includes(newRole)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Must be one of: user, manager, admin'
            });
        }

        const user = await User.findById( userId ).populate('departmentId sectionId')
        console.log("🚀 ~ changeRole ~ user:", user)

        if (!user) {
            return res.status(404).json({
                success: false,
                statusCode: 404,
                msg: 'User not found'
            });
        }

        if (newRole === 'admin' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admins can assign admin role'
            });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { role: newRole },
            { new: true, runValidators: true }
        ).select('-password');
        console.log("🚀 ~ changeRole ~ updatedUser:", updatedUser)

        res.status(200).json({
            success: true,
            msg: 'User role updated successfully',
            statusCode: 200,
            data: {
                userId: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,

            }
        })


    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            // error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

export {
    getAllUsers,
    changeRole,
}