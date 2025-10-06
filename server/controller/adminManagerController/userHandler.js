import { trusted } from 'mongoose';
import User from '../../models/users.js';

const getAllUsers = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    const skip = (page - 1) * limit;

    let query = {};

    // Apply location-based filtering based on user role
    if (req.user.role === 'admin' && req.user.assignedLocationId) {
      // Admin can only see users from their assigned location, excluding other admins/superAdmins
      query = {
        locationId: req.user.assignedLocationId,
        role: { $nin: ['admin', 'superAdmin'] }
      };
    } else if (req.user.role === 'manager') {
      // Manager can only see users from their location, excluding admins/superAdmins
      query = {
        locationId: req.user.locationId,
        role: { $nin: ['admin', 'superAdmin'] }
      };
    }
    // superAdmin can see all users (no additional filtering)

    const users = await User.find(query)
      .populate("sectionId departmentId locationId assignedLocationId")
      .skip(skip)
      .limit(limit)
      // 👇 stable sort: avoids duplicate user appearing on next page
      .sort({ createdAt: -1, _id: -1 });

    const total = await User.countDocuments(query);

    // Debug info (remove in production if not needed)
    console.log({
      query,
      page,
      limit,
      skip,
      returnedUsers: users.length,
      total
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });

  } catch (error) {
    console.error("🚀 ~ getAllUsers ~ error:", error);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      msg: 'Internal server error',
    });
  }
};



const changeRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newRole, assignedLocationId } = req.body;
    console.log("🚀 ~ changeRole ~ assignedLocationId:", assignedLocationId)

    if (!userId) {
      return res.status(400).json({ success: false, msg: 'User ID is required' });
    }

    const validRoles = ['user', 'manager', 'admin', 'superAdmin'];
    if (!validRoles.includes(newRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be one of: user, manager, admin, superAdmin'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, msg: 'User not found' });
    }

    // Only superAdmin or admin can assign admin role
    if (newRole === 'admin' && !['admin', 'superAdmin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only admins or superAdmins can assign admin role' });
    }

    // Only superAdmin can assign superAdmin role
    if (newRole === 'superAdmin' && req.user.role !== 'superAdmin') {
      return res.status(403).json({ success: false, message: 'Only superAdmins can assign superAdmin role' });
    }

    // Prepare update object
    const updateData = { role: newRole };

    // If promoting to admin, assign location (superAdmin must provide assignedLocationId)
    if (newRole === 'admin') {
      if (assignedLocationId) {
        updateData.assignedLocationId = assignedLocationId;
      } else {
        // fallback: assign null if no location provided (optional)
        updateData.assignedLocationId = undefined;
      }
    } else {
      // For all other roles, remove assignedLocationId
      updateData.assignedLocationId = undefined;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');
    console.log("🚀 ~ changeRole ~ updatedUser:", updatedUser)

    return res.status(200).json({
      success: true,
      msg: 'User role updated successfully',
      data: updatedUser,
    });

  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


export {
  getAllUsers,
  changeRole,
}