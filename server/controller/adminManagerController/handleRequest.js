import Request from '../../models/request.js';
import Inventory from '../../models/inventory.js';
import Asset from '../../models/asset.js';
import AssetCategory from '../../models/assetCategory.js';
import User from '../../models/users.js';

const handlePendingRequest = async (req, res) => {
    try {
        let query = { status: 'pending' };
        const requestedLocationId = req.params.locationId || req.query.locationId || req.body.locationId;
        
        // Apply location-based filtering based on user role
        if (req.user.role === 'admin' && req.user.assignedLocationId) {
            // If a location filter is passed, enforce it matches assigned location
            if (requestedLocationId && req.user.assignedLocationId?.toString() !== requestedLocationId) {
                return res.status(403).json({
                    success: false,
                    statusCode: 403,
                    msg: 'Access denied: Not authorized for this location'
                });
            }
            // Admin can only see requests from their assigned location
            query = {
                ...query,
                requestorId: {
                    $in: await User.find({ locationId: req.user.assignedLocationId }).select('_id')
                }
            };
        } else if (req.user.role === 'manager') {
            // If a location filter is passed, enforce it matches user's location
            if (requestedLocationId && req.user.locationId?.toString() !== requestedLocationId) {
                return res.status(403).json({
                    success: false,
                    statusCode: 403,
                    msg: 'Access denied: Not authorized for this location'
                });
            }
            // Manager can only see requests from their location
            query = {
                ...query,
                requestorId: {
                    $in: await User.find({ locationId: req.user.locationId }).select('_id')
                }
            };
        } else if (req.user.role === 'superAdmin' && requestedLocationId) {
            // superAdmin can optionally filter by locationId
            query = {
                ...query,
                requestorId: {
                    $in: await User.find({ locationId: requestedLocationId }).select('_id')
                }
            };
        }
        // superAdmin with no filter can see all requests

        const requests = await Request.find(query).populate('assetId requestorId');
        if(requests.length === 0) {
            return res.json({
                success: true,
                statusCode: 200,
                total: 0,
                requests: [],
                msg: 'No pending requests found'
            });
        }
        return res.json({
            success: true,
            statusCode: 200,
            msg: 'Pending requests fetched successfully',
            total: requests.length,
            requests
        })
    } catch (err) {
        console.error("Error fetching pending requests:", err);
        res.status(500).json({
            success: false,
            statusCode: 500,
            msg: 'Internal server error'
        });
    }
}


const rejectRequest = async (req, res) => {
    try {
        const requestId = req.params.id;
        const request = await Request.findById(requestId).populate('assetId requestorId');
        const reason = req.body.rejectionReason || 'No reason provided';
        console.log("🚀 ~ rejectRequest ~ reason:", reason)
        
        if (!request) {
            return res.status(404).json({
                success: false,
                statusCode: 404,
                msg: 'Request not found'
            });
        }
        if (request.status !== 'pending') {
            return res.status(400).json({
                success: false,
                statusCode: 400,
                msg: 'Request is not in pending state'
            });
        }
        // Update request status to rejected
        request.status = 'rejected';
        request.reviewedBy = req.user.id;
        request.reviewDate = new Date();
        request.rejectionReason = reason;
        await request.save();

        res.json({
            success: true,
            statusCode: 200,
            msg: 'Request rejected successfully',
            request
        });
    } catch (err) {
        console.error("Error rejecting request:", err);
        res.status(500).json({
            success: false,
            statusCode: 500,
            msg: 'Internal server error'
        });
    }
}

//here after the approval of direct request, it should be redirected to the issueAsset function
const directRequest = async (req, res) => {
    try {
        const { sapId, userName, assetName, categoryName, quantity } = req.body;
        const requestor = await User.findOne({ sapId }).populate('sectionId departmentId');
        if (!requestor) {
            //if requestor not found, redirect to register(frontend can handle this)
            return res.status(404).json({
                success: false,
                statusCode: 404,
                msg: 'User not found',
                details: [sapId, userName],
                redirect: '/register' // Optional: frontend can use this
            });
        }

        // Check if user has required department and section information
        if (!requestor.sectionId || !requestor.departmentId) {
            return res.status(400).json({
                success: false,
                statusCode: 400,
                msg: 'User profile incomplete - missing department or section information',
                details: {
                    sapId,
                    hasSection: !!requestor.sectionId,
                    hasDepartment: !!requestor.departmentId
                }
            });
        }

        const category = await AssetCategory.findOne({ categoryName });
        if (!category) {
            return res.status(404).json({
                success: false,
                statusCode: 404,
                msg: 'Asset category not found'
            });
        }

        const asset = await Asset.findOne({ assetName, categoryId: category._id });
        if (!asset) {
            return res.status(404).json({
                success: false,
                statusCode: 404,
                msg: 'Asset not found'
            });
        }
        console.log("🚀 ~ directRequest ~ asset:", asset)
        const inventory = await Inventory.findOne({ assetId: asset._id });
        console.log("🚀 ~ directRequest ~ inventory:", inventory)
        if (!inventory || inventory.availableStock < quantity) {
            return res.status(400).json({
                success: false,
                statusCode: 400,
                msg: 'Insufficient stock available for the requested asset'
            });
        }
        const request = new Request({
            requestorId: requestor._id,
            assetId: asset._id,
            categoryId: category._id,
            quantity,
            status: 'pending', // Direct request starts as pending, ready for immediate issue
            sectionId: requestor.sectionId._id,
            departmentId: requestor.departmentId._id,
            requestDate: new Date(),
            isDirectRequest: true,// Mark as direct request
        });
        await request.save();
        console.log("🚀 ~ directRequest ~ request:", request)

        return res.status(200).json({
            success: true,
            statusCode: 200,
            msg: 'Direct request created successfully',
            request
        })

    } catch (err) {
        console.error("Error creating direct request:", err);
        res.status(500).json({
            success: false,
            statusCode: 500,
            msg: 'Internal server error'
        });
    }
}

const getAllRequests = async (req, res) => {
    try{
        let query = {};
        let requestedLocationId = undefined;
        // Only check req.params.locationId if route is /all-request/location/:locationId
        if (req.params && typeof req.params.locationId !== 'undefined') {
            requestedLocationId = req.params.locationId;
        } else if (req.query && typeof req.query.locationId !== 'undefined') {
            requestedLocationId = req.query.locationId;
        } else if (req.body && typeof req.body.locationId !== 'undefined') {
            requestedLocationId = req.body.locationId;
        }
        
        // Apply location-based filtering based on user role
        if (req.user.role === 'admin' && req.user.assignedLocationId) {
            // If a location filter is passed, enforce it matches assigned location
            if (requestedLocationId && req.user.assignedLocationId?.toString() !== requestedLocationId) {
                return res.status(403).json({
                    success: false,
                    statusCode: 403,
                    msg: 'Access denied: Not authorized for this location'
                });
            }
            // Admin can only see requests from their assigned location
            query = {
                requestorId: {
                    $in: await User.find({ locationId: req.user.assignedLocationId }).select('_id')
                }
            };
        } else if (req.user.role === 'manager') {
            // If a location filter is passed, enforce it matches user's location
            if (requestedLocationId && req.user.locationId?.toString() !== requestedLocationId) {
                return res.status(403).json({
                    success: false,
                    statusCode: 403,
                    msg: 'Access denied: Not authorized for this location'
                });
            }
            // Manager can only see requests from their location
            query = {
                requestorId: {
                    $in: await User.find({ locationId: req.user.locationId }).select('_id')
                }
            };
        } else if (req.user.role === 'superAdmin' && requestedLocationId) {
            // superAdmin can optionally filter by locationId
            query = {
                requestorId: {
                    $in: await User.find({ locationId: requestedLocationId }).select('_id')
                }
            };
        }
        // superAdmin with no filter can see all requests

        const requests = await Request.find(query).populate('assetId requestorId categoryId departmentId sectionId reviewedBy').sort({ createdAt: -1 });
        if(requests.length === 0){
            return res.json({
                success: true,
                statusCode: 200,
                total: 0,
                requests: [],
                msg: 'No requests found'
            });
        }
        return res.json({
            success: true,
            statusCode: 200,
            msg: 'All requests fetched successfully',
            total: requests.length,
            requests
        })

    }catch(err){
        console.error("Error fetching all requests:", err);
        res.status(500).json({
            success: false,
            statusCode: 500,
            msg: 'Internal server error'
        });
    }
}

export{
    handlePendingRequest,
    rejectRequest,
    directRequest,
    getAllRequests,
}