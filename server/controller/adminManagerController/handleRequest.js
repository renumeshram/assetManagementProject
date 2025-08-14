import Request from '../../models/request.js';
import Inventory from '../../models/inventory.js';
import Asset from '../../models/asset.js';
import AssetCategory from '../../models/assetCategory.js';
import User from '../../models/users.js';

const handlePendingRequest = async (req, res) => {
    try {
        const requests = await Request.find({ status: 'pending' }).populate('assetId requestorId');
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

const approveRequest = async (req, res) => {
    try {
        console.log("Checking params",req.params)
        const requestId = req.params.id;
        const request = await Request.findById(requestId).populate('assetId requestorId');
        console.log("🚀 ~ approveRequest ~ request:", request)

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

        console.log("🚀 ~ approveRequest ~  request.assetId._id:",  request.assetId._id)
        // Check inventory for available stock
        const inventory = await Inventory.findOne({ assetId: request.assetId._id });
        console.log("🚀 ~ approveRequest ~ inventory:", inventory)
        console.log(inventory, request.quantity)
        if (!inventory || inventory.availableStock < request.quantity) {
            return res.status(400).json({
                success: false,
                statusCode: 400,
                msg: 'Insufficient stock available for the requested asset'
            });
        }

        // Update request status to approved
        request.status = 'approved';
        request.reviewedBy = req.user.id; // Assuming the user ID is stored in req.user.id after authentication
        request.reviewDate = new Date();
        await request.save();
        res.json({
            success: true,
            statusCode: 200,
            msg: 'Request approved successfully',
            request
        });
    } catch (err) {
        console.error("Error approving request:", err);
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

        const category = await AssetCategory.findOne({ categoryName });

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
            status: 'approved', // Direct request is considered approved
            sectionId: requestor.sectionId._id,
            departmentId: requestor.departmentId._id,
            requestDate: new Date(),
            isDirectRequest: true,// Mark as direct request
            reviewedBy: req.user.id, // Assuming the user ID is stored in req.user.id after authentication
            reviewDate: new Date(),
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


export{
    handlePendingRequest,
    approveRequest,
    rejectRequest,
    directRequest,
}