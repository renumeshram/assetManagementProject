import ProjectLocation from "../../../models/projectLocation.js";
import User from "../../../models/users.js";
import Department from "../../../models/department.js";
import Section from "../../../models/section.js";
import mongoose from "mongoose";

export const getAllLocations = async (req, res) => {
  try {
    // Step 1: Get all locations (sorted alphabetically)
    const locations = await ProjectLocation.find().sort({ location: 1 });

    // Step 2: Aggregate user counts by location
    const userStats = await User.aggregate([
      {
        $group: {
          _id: "$locationId",
          userCount: { $sum: 1 },
          managerCount: {
            $sum: { $cond: [{ $eq: ["$role", "manager"] }, 1, 0] },
          },
          adminCount: {
            $sum: { $cond: [{ $eq: ["$role", "admin"] }, 1, 0] },
          },
        },
      },
    ]);

    // Step 3: Convert stats into a lookup object
    const statsMap = {};
    userStats.forEach((stat) => {
      statsMap[stat._id?.toString()] = {
        userCount: stat.userCount,
        managerCount: stat.managerCount,
        adminCount: stat.adminCount,
      };
    });

    // Step 4: Attach stats to each location
    const enrichedLocations = locations.map((loc) => {
      const counts = statsMap[loc._id.toString()] || {
        userCount: 0,
        managerCount: 0,
        adminCount: 0,
      };
      return {
        ...loc.toObject(),
        ...counts,
      };
    });

    res.status(200).json({
      success: true,
      total: enrichedLocations.length,
      locations: enrichedLocations,
    });
  } catch (error) {
    console.error("Error fetching locations:", error);
    res.status(500).json({
      success: false,
      msg: "Failed to fetch locations",
    });
  }
};

export const addLocation = async(req, res) =>{
  try{
    const {location} = req.body;
    if(!location){
      return res.status(400).json({msg: 'Please provide location name'});
    }
    const existing = await ProjectLocation.find({location});
    if(existing.length > 0){
      return res.status(400).json({msg: 'Location already exists'});
    }
    const newLocation = await ProjectLocation.create({location});
    return res.status(201).json({
      success: true,
      statusCode: 201,
      msg: 'Location added successfully',
      location: newLocation
    })
  }catch(err){
    console.log("🚀 ~ addLocation ~ err:", err)
    return res.status(500).json({
      success: false,
      statusCode: 500,
      msg: 'Internal server error',
      error: err.message
    })
  }
}

export const adminPasswordReset = async (req, res)=>{
    try {
      const { sapId, password } = req.body;
  
      if (!sapId || !password) {
        return res.status(400).json({ msg: "Please provide SAP ID and new password" });
      }
  
      const user = await User.findOne({ sapId, role: { $in: ['admin'] } });
      if (!user) {
        return res.status(404).json({ msg: "Admin not found" });
      }
  
      user.password = password;
  
      console.log(`Password for user with SAP ID ${sapId} has been reset successfully`);
  
      res.status(200).json({
        success: true,
        statusCode: 200,
        msg: `Password reset successfully for admin with SAP ID ${sapId}`,
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
  
}

export const getLocation = async(req, res) =>{
   try {
    const locations = await ProjectLocation.find().sort({ location: 1 });
    res.json({ success: true, data: locations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export const getLocationById = async(req, res) =>{
  try {
    const location = await ProjectLocation.findById(req.params.id);
    if (!location) return res.status(404).json({ success: false, message: 'Location not found' });
    res.json({ success: true, data: location });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Get active departments
 */
export const getDepartmentsList = async (req, res) => {
  try {
    const { locationId } = req.query;
    let query = { isActive: true };
    
    // If locationId is provided and not 'all', filter by location
    if (locationId && locationId !== 'all' && locationId !== '') {
      query.locationId = new mongoose.Types.ObjectId(locationId);
    }
    
    const departments = await Department.find(query)
      .select('name _id locationId')
      .sort({ name: 1 });
    
    res.json({ success: true, data: departments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching departments', error: error.message });
  }
};

/**
 * Get active sections for a department
 */
export const getSectionsList = async (req, res) => {
  try {
    const { departmentId } = req.query;
    let query = {};
    
    // If departmentId is provided and not 'all', filter by department
    if (departmentId && departmentId !== 'all' && departmentId !== '') {
      query.departmentId = new mongoose.Types.ObjectId(departmentId);
    }
    
    const sections = await Section.find(query)
      .select('name _id departmentId')
      .sort({ name: 1 });
    
    res.json({ success: true, data: sections });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching sections', error: error.message });
  }
};

export const locationTree = async (req, res) => {
  try {
    const user = req.user; // comes from auth middleware (decoded JWT)

    let locationsQuery = {};
    
    // Role-based location filtering
    if (user.role === "superAdmin") {
      // SuperAdmin can see all locations - no filter needed
    } else if (user.role === "admin") {
      locationsQuery._id = user.assignedLocationId;
    } else if (user.role === "manager" || user.role === "user") {
      locationsQuery._id = user.locationId;
    }

    // Fetch locations based on role
    const locations = await ProjectLocation.find(locationsQuery);

    const locationData = [];
    for (const loc of locations) {
      // Departments for this location
      const departments = await Department.find({
        locationId: loc._id,
        isActive: true,
      });

      const departmentData = [];
      for (const dept of departments) {
        // Sections for this department
        const sections = await Section.find({ departmentId: dept._id });

        departmentData.push({
          _id: dept._id,
          name: dept.name,
          children: sections.map((sec) => ({
            _id: sec._id,
            name: sec.name,
          })),
        });
      }

      locationData.push({
        _id: loc._id,
        name: loc.location,
        children: departmentData,
      });
    }

    return res.json({ success: true, data: locationData });
  } catch (err) {
    console.error("Error fetching locations tree:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ==================== NEW FUNCTIONS FOR DEPARTMENT MANAGEMENT ====================

/**
 * Get all departments with optional location filter
 * Used by the frontend to fetch departments when expanding a location row
 */
export const getDepartments = async (req, res) => {
  try {
    const { locationId } = req.query;
    
    if (!locationId) {
      return res.status(400).json({
        success: false,
        msg: 'Location ID is required',
      });
    }

    const departments = await Department.find({ locationId })
      .populate('locationId', 'location')
      .sort({ name: 1 });

    res.json({
      success: true,
      departments,
      total: departments.length,
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({
      success: false,
      msg: 'Failed to fetch departments',
      error: error.message,
    });
  }
};

/**
 * Add new department
 * If hasNoSections is true, automatically creates a section with the same name
 */
export const addDepartment = async (req, res) => {
  try {
    const { name, locationId, hasNoSections } = req.body;

    // Validation
    if (!name || !locationId) {
      return res.status(400).json({
        success: false,
        msg: 'Please provide department name and location',
      });
    }

    // Check if location exists
    const location = await ProjectLocation.findById(locationId);
    if (!location) {
      return res.status(404).json({
        success: false,
        msg: 'Location not found',
      });
    }

    // Check if department already exists in this location
    const existingDepartment = await Department.findOne({
      name: name.trim(),
      locationId,
    });

    if (existingDepartment) {
      return res.status(400).json({
        success: false,
        msg: 'Department already exists in this location',
      });
    }

    // Create department
    const department = await Department.create({
      name: name.trim(),
      locationId,
      isActive: true,
    });

    // If department has no sections, create a section with the same name
    if (hasNoSections) {
      await Section.create({
        name: name.trim(),
        departmentId: department._id,
      });
    }

    const populatedDepartment = await Department.findById(department._id)
      .populate('locationId', 'location');

    res.status(201).json({
      success: true,
      msg: 'Department added successfully',
      department: populatedDepartment,
    });
  } catch (error) {
    console.error('Error adding department:', error);
    res.status(500).json({
      success: false,
      msg: 'Failed to add department',
      error: error.message,
    });
  }
};

/**
 * Update department
 */
export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, isActive } = req.body;

    const department = await Department.findById(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        msg: 'Department not found',
      });
    }

    // Update fields
    if (name) department.name = name.trim();
    if (typeof isActive !== 'undefined') department.isActive = isActive;

    await department.save();

    const updatedDepartment = await Department.findById(department._id)
      .populate('locationId', 'location');

    res.json({
      success: true,
      msg: 'Department updated successfully',
      department: updatedDepartment,
    });
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({
      success: false,
      msg: 'Failed to update department',
      error: error.message,
    });
  }
};

/**
 * Delete department
 */
export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await Department.findById(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        msg: 'Department not found',
      });
    }

    // Check if department has sections
    const sectionsCount = await Section.countDocuments({ departmentId: id });

    if (sectionsCount > 0) {
      return res.status(400).json({
        success: false,
        msg: `Cannot delete department. It has ${sectionsCount} section(s) assigned.`,
      });
    }

    // Check if department has users (if your User model has departmentId field)
    // const usersCount = await User.countDocuments({ departmentId: id });
    // if (usersCount > 0) {
    //   return res.status(400).json({
    //     success: false,
    //     msg: `Cannot delete department. It has ${usersCount} user(s) assigned.`,
    //   });
    // }

    await department.deleteOne();

    res.json({
      success: true,
      msg: 'Department deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({
      success: false,
      msg: 'Failed to delete department',
      error: error.message,
    });
  }
};

// ==================== NEW FUNCTIONS FOR SECTION MANAGEMENT ====================

/**
 * Get all sections with optional department filter
 * Used by the frontend to fetch sections when expanding a department
 */
export const getSections = async (req, res) => {
  try {
    const { departmentId } = req.query;

    if (!departmentId) {
      return res.status(400).json({
        success: false,
        msg: 'Department ID is required',
      });
    }

    const sections = await Section.find({ departmentId })
      .populate({
        path: 'departmentId',
        select: 'name locationId',
        populate: {
          path: 'locationId',
          select: 'location',
        },
      })
      .sort({ name: 1 });

    res.json({
      success: true,
      sections,
      total: sections.length,
    });
  } catch (error) {
    console.error('Error fetching sections:', error);
    res.status(500).json({
      success: false,
      msg: 'Failed to fetch sections',
      error: error.message,
    });
  }
};

/**
 * Add new section
 */
export const addSection = async (req, res) => {
  try {
    const { name, departmentId } = req.body;

    // Validation
    if (!name || !departmentId) {
      return res.status(400).json({
        success: false,
        msg: 'Please provide section name and department',
      });
    }

    // Check if department exists
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({
        success: false,
        msg: 'Department not found',
      });
    }

    // Check if section already exists in this department
    const existingSection = await Section.findOne({
      name: name.trim(),
      departmentId,
    });

    if (existingSection) {
      return res.status(400).json({
        success: false,
        msg: 'Section already exists in this department',
      });
    }

    // Create section
    const section = await Section.create({
      name: name.trim(),
      departmentId,
    });

    const populatedSection = await Section.findById(section._id)
      .populate({
        path: 'departmentId',
        select: 'name locationId',
        populate: {
          path: 'locationId',
          select: 'location',
        },
      });

    res.status(201).json({
      success: true,
      msg: 'Section added successfully',
      section: populatedSection,
    });
  } catch (error) {
    console.error('Error adding section:', error);
    res.status(500).json({
      success: false,
      msg: 'Failed to add section',
      error: error.message,
    });
  }
};

/**
 * Update section
 */
export const updateSection = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const section = await Section.findById(id);

    if (!section) {
      return res.status(404).json({
        success: false,
        msg: 'Section not found',
      });
    }

    // Update name
    if (name) section.name = name.trim();

    await section.save();

    const updatedSection = await Section.findById(section._id)
      .populate({
        path: 'departmentId',
        select: 'name locationId',
        populate: {
          path: 'locationId',
          select: 'location',
        },
      });

    res.json({
      success: true,
      msg: 'Section updated successfully',
      section: updatedSection,
    });
  } catch (error) {
    console.error('Error updating section:', error);
    res.status(500).json({
      success: false,
      msg: 'Failed to update section',
      error: error.message,
    });
  }
};

/**
 * Delete section
 */
export const deleteSection = async (req, res) => {
  try {
    const { id } = req.params;

    const section = await Section.findById(id);

    if (!section) {
      return res.status(404).json({
        success: false,
        msg: 'Section not found',
      });
    }

    // Check if section has users assigned (if your User model has sectionId field)
    // const usersCount = await User.countDocuments({ sectionId: id });
    // if (usersCount > 0) {
    //   return res.status(400).json({
    //     success: false,
    //     msg: `Cannot delete section. It has ${usersCount} user(s) assigned.`,
    //   });
    // }

    await section.deleteOne();

    res.json({
      success: true,
      msg: 'Section deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting section:', error);
    res.status(500).json({
      success: false,
      msg: 'Failed to delete section',
      error: error.message,
    });
  }
};