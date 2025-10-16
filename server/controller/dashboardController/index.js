import User from "../../models/users.js";
import Assets from "../../models/asset.js";
import Request from "../../models/request.js";
import Inventory from "../../models/inventory.js";
import Department from "../../models/department.js";

/**
 * Recent requests API
 */
export const getRecentRequests = async (req, res) => {
  try {
    const { role } = req.user;
    const query = {};

    if (role === "superAdmin") {
      // no location filter (all requests)
    } else if (role === "admin" || role === "manager") {
      // Get the appropriate locationId based on role
      const locationId = role === "admin" ? req.user.assignedLocationId : req.user.locationId;
      
      // Find departments under this location
      const departments = await Department.find({ locationId }).select("_id");
      const deptIds = departments.map(d => d._id);
      
      // Filter requests by these department IDs
      query.departmentId = { $in: deptIds };
    } else {
      // user → only own requests
      query.requestorId = req.user._id;
    }

    const requests = await Request.find(query)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("assetId", "assetName")
      .populate("departmentId", "name locationId")
      .lean();
    console.log("🚀 ~ getRecentRequests ~ requests:", requests)

    return res.status(200).json({
      success: true,
      statusCode: 200,
      msg: "Recent requests fetched successfully",
      data: requests,
    });
  } catch (err) {
    console.error("Error fetching recent requests:", err);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      msg: "Internal server error",
      error: err.message,
    });
  }
};

const dashboardStats = async (req, res) => {
  try {
    const { role } = req.user;

    // SuperAdmin → all locations
    if (role === "superAdmin") {
      const [totalUsers, totalAssets, totalRequests, totalLowStockItems] =
        await Promise.all([
          User.countDocuments({}),
          Assets.countDocuments({ isActive: true }),
          Request.countDocuments({ status: "pending" }),
          Inventory.countDocuments({
            $expr: { $lt: ["$availableStock", "$minimumThreshold"] },
          }),
        ]);

      return res.status(200).json({
        success: true,
        statusCode: 200,
        msg: "SuperAdmin dashboard stats delivered successfully",
        data: {
          totalUsers,
          totalAssets,
          totalRequests,
          totalLowStockItems,
        },
      });
    }

    // Admin → filter by assignedLocationId
    if (role === "admin") {
      const locationId = req.user.assignedLocationId;

      // find departments under this location
      const departments = await Department.find({ locationId }).select("_id");
      const deptIds = departments.map((d) => d._id);

      const [totalUsers, totalAssets, totalRequests, totalLowStockItems] =
        await Promise.all([
          User.countDocuments({ locationId }),
          Assets.countDocuments({ isActive: true }), // assets not tied to location
          Request.countDocuments({ status: "pending", departmentId: { $in: deptIds } }),
          Inventory.countDocuments({
            locationId,
            $expr: { $lt: ["$availableStock", "$minimumThreshold"] },
          }),
        ]);

      return res.status(200).json({
        success: true,
        statusCode: 200,
        msg: "Admin dashboard stats delivered successfully",
        data: {
          totalUsers,
          totalAssets,
          totalRequests,
          totalLowStockItems,
        },
      });
    }

    // Manager → filter by their locationId
    if (role === "manager") {
      const locationId = req.user.locationId;

      const departments = await Department.find({ locationId }).select("_id");
      console.log("🚀 ~ dashboardStats ~ departments:", departments)
      const deptIds = departments.map((d) => d._id);

      const [allRequests, pendingReview, assetsIssued, returnsDue] =
        await Promise.all([
          Request.countDocuments({ departmentId: { $in: deptIds } }),
          Request.countDocuments({ status: "pending", departmentId: { $in: deptIds } }),
          Request.countDocuments({ status: "issued", departmentId: { $in: deptIds } }),
          Request.countDocuments({ status: "return_due", departmentId: { $in: deptIds } }), // adjust if needed
        ]);

      return res.status(200).json({
        success: true,
        statusCode: 200,
        msg: "Manager dashboard stats delivered successfully",
        data: {
          allRequests,
          pendingReview,
          assetsIssued,
          returnsDue,
        },
      });
    }

    // User → only their requests
    if (role === "user") {
      const userId = req.user._id;

      const [myRequests, pending, approved, issued] = await Promise.all([
        Request.countDocuments({ requestorId: userId }),
        Request.countDocuments({ requestorId: userId, status: "pending" }),
        Request.countDocuments({ requestorId: userId, status: "approved" }), // double-check if you use "approved"
        Request.countDocuments({ requestorId: userId, status: "issued" }),
      ]);

      return res.status(200).json({
        success: true,
        statusCode: 200,
        msg: "User dashboard stats delivered successfully",
        data: {
          myRequests,
          pending,
          approved,
          issued,
        },
      });
    }

    // Fallback
    return res.status(403).json({
      success: false,
      statusCode: 403,
      msg: "Unauthorized role",
    });
  } catch (err) {
    console.error("Error fetching dashboard stats:", err);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      msg: "Internal server error",
      error: err.message,
    });
  }
};

export default dashboardStats;


