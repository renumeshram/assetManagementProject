import Asset from '../../models/asset.js';
import AssetTransaction from '../../models/assetTransaction.js';
import AssetCategory from '../../models/assetCategory.js';
import User from '../../models/users.js';
import Department from '../../models/department.js';
import Section from '../../models/section.js';
import Inventory from '../../models/inventory.js';
import EwasteRecords from '../../models/ewasteRecords.js';
import Request from '../../models/request.js';

// Updated issueAsset controller
const issueAsset = async (req, res) => {
    try {
        const requestId = req.params.id;
        const { ewasteReceived = false, ewasteQuantity = 0 } = req.body; // Get e-waste status from request body

        const request = await Request.findById(requestId).populate('assetId').populate('categoryId');

        if (!request || request.status !== 'pending') {
            return res.status(404).json({
                success: false,
                statusCode: 404,
                msg: 'Invalid or non-pending request'
            });
        }

        const inventory = await Inventory.findOne({ assetId: request.assetId._id });
        console.log("🚀 ~ issueAsset ~ inventory:", inventory)

        if (!inventory || inventory.availableStock < request.quantity) {
            return res.status(400).json({
                success: false,
                statusCode: 400,
                msg: 'Insufficient stock available for the requested asset'
            });
        }

        const transaction = new AssetTransaction({
            assetId: request.assetId._id,
            categoryId: request.categoryId._id,
            issuedTo: request.requestorId,
            issuedBy: req.user.id,
            transactionType: 'issue',
            quantity: request.quantity,
            issueDate: new Date(),
            sectionId: request.sectionId,
            departmentId: request.departmentId,
        });
        await transaction.save();

        console.log("🚀 ~ issueAsset ~ transaction:", transaction);

        // Update inventory
        await Inventory.findOneAndUpdate(
            { assetId: request.assetId._id },
            {
                $inc: {
                    availableStock: -request.quantity,
                    issuedStock: request.quantity
                },
                lastUpdated: new Date(),
                updatedBy: req.user.id,
            }
        );

        request.status = 'issued';
        request.reviewedBy = req.user.id;
        request.reviewDate = new Date();
        await request.save();
        console.log("🚀 ~ issueAsset ~ request updated:", request);

        // Handle e-waste creation based on workflow
        if (request.assetId.isEwaste) {
            let status = 'generated';
            let returnedQty = 0;

            if (ewasteReceived) {
                //validate ewaste quantity
                if (ewasteQuantity > request.quantity) {
                    return res.status(400).json({
                        success: false,
                        msg: 'Returned e-waste quantity cannot exceed issued quantity'
                    });
                }
                returnedQty = ewasteQuantity;
                status = ewasteQuantity > 0 ? 'collected' : 'generated';
            }
            //Debugging logs
            console.log("Unit weight:", request.assetId.unitWeight, "Parsed:", Number(request.assetId.unitWeight));
            console.log("Returned Qty:", returnedQty);


            const ewasteRecord = await EwasteRecords.create({
                transactionId: transaction.id,
                assetId: request.assetId._id,
                quantity: returnedQty,
                totalWeight:  Number(request.assetId.unitWeight) * returnedQty,
                receiveDate: new Date(),
                status // 'collected' if old cartridge received, 'generated' if not
            });

            console.log(`🚀 ~ issueAsset ~ ewasteRecord created with status: ${status}:`, ewasteRecord);
        }

        return res.status(200).json({
            success: true,
            statusCode: 200,
            msg: 'Asset issued successfully',
            transactionId: transaction._id,
            ewasteStatus: request.assetId.isEwaste ? (ewasteReceived ? 'collected' : 'generated') : null
        });

    } catch (err) {
        console.log("🚀 ~ issueAsset ~ err:", err);
        return res.status(500).json({
            success: false,
            statusCode: 500,
            msg: 'Internal server error',
        });
    }
};

// New reject request controller
const rejectRequest = async (req, res) => {
    try {
        const requestId = req.params.id;
        const { rejectionReason } = req.body;

        if (!rejectionReason || !rejectionReason.trim()) {
            return res.status(400).json({
                success: false,
                statusCode: 400,
                msg: 'Rejection reason is required'
            });
        }

        const request = await Request.findById(requestId);

        if (!request || request.status !== 'pending') {
            return res.status(404).json({
                success: false,
                statusCode: 404,
                msg: 'Invalid or non-pending request'
            });
        }

        request.status = 'rejected';
        request.reviewedBy = req.user.id;
        request.reviewDate = new Date();
        request.rejectionReason = rejectionReason.trim();
        request.comments = rejectionReason.trim();
        await request.save();

        return res.status(200).json({
            success: true,
            statusCode: 200,
            msg: 'Request rejected successfully',
            requestId: request._id
        });

    } catch (err) {
        console.log("🚀 ~ rejectRequest ~ err:", err);
        return res.status(500).json({
            success: false,
            statusCode: 500,
            msg: 'Internal server error',
        });
    }
};

// Get inventory information for a specific asset
const getAssetInventory = async (req, res) => {
    try {
        const assetId = req.params.id;
        console.log("🚀 ~ getAssetInventory ~ req.params:", req.params)
        console.log("🚀 ~ getAssetInventory ~ assetId:", assetId)

        const inventory = await Inventory.findOne({ assetId }).populate('assetId', 'assetName');
        console.log("🚀 ~ getAssetInventory ~ inventory:", inventory)

        if (!inventory) {
            return res.status(404).json({
                success: false,
                statusCode: 404,
                msg: 'Inventory not found for this asset'
            });
        }

        return res.status(200).json({
            success: true,
            statusCode: 200,
            inventory: {
                totalStock: inventory.totalStock,
                availableStock: inventory.availableStock,
                issuedStock: inventory.issuedStock,
                assetName: inventory.assetId.assetName,
                lastUpdated: inventory.lastUpdated
            }
        });

    } catch (err) {
        console.log("🚀 ~ getAssetInventory ~ err:", err);
        return res.status(500).json({
            success: false,
            statusCode: 500,
            msg: 'Internal server error',
        });
    }
};


// const issueAsset = async (req, res) => {
//     try {

//         const requestId = req.params.id;
//         const request = await Request.findById(requestId).populate('assetId').populate('categoryId');

//         if (!request || request.status !== 'pending') {
//             return res.status(404).json({
//                 success: false,
//                 statusCode: 404,
//                 msg: 'Invalid or non-pending request'
//             });
//         }

//         const inventory = await Inventory.findOne({ assetId: request.assetId._id });

//         if (!inventory || inventory.availableStock < request.quantity) {
//             return res.status(400).json({
//                 success: false,
//                 statusCode: 400,
//                 msg: 'Insufficient stock available for the requested asset'
//             });
//         }

//         const transaction = new AssetTransaction({
//             assetId: request.assetId._id,
//             categoryId: request.categoryId._id,
//             issuedTo: request.requestorId,
//             issuedBy: req.user.id, // Assuming the user ID is stored in req.user.id after authentication
//             transactionType: 'issue',
//             quantity: request.quantity,
//             issueDate: new Date(),
//             sectionId: request.sectionId,
//             departmentId: request.departmentId,
//         });
//         await transaction.save();

//         console.log("🚀 ~ issueAsset ~ transaction:", transaction);

//         // Update inventory
//         await Inventory.findOneAndUpdate(
//             { assetId: request.assetId._id },
//             {
//                 $inc: {
//                     availableStock: -request.quantity,
//                     issuedStock: request.quantity
//                 },
//                 lastUpdated: new Date(),
//                 updatedBy: req.user.id,
//             }
//         );

//         request.status = 'issued';
//         request.reviewedBy = req.user.id;
//         request.reviewDate = new Date();
//         await request.save();
//         console.log("🚀 ~ issueAsset ~ request updated:", request);

//         //Update the ewaste status to generated and add further attributes PENDING
//         if (request.assetId.isEwaste) {

//             const ewasteRecord = await EwasteRecords.create({
//                 transactionId: transaction.id,
//                 assetId: request.assetId._id,
//                 quantity: request.quantity,
//                 totalWeight: parseInt(request.assetId.unitWeight, 10) * parseInt(request.quantity, 10),
//                 receiveDate: new Date(),
//                 status: 'generated', // Set the initial status to 'generated'
//             })
//             console.log("🚀 ~ issueAsset ~ ewasteRecord created:", ewasteRecord);
//         }

//         return res.status(200).json({
//             success: true,
//             statusCode: 200,
//             msg: 'Asset issued successfully',
//             transactionId: transaction._id,

//         });

//     } catch (err) {
//         console.log("🚀 ~ issueAsset ~ err:", err)
//         return res.status(500).json({
//             success: false,
//             statusCode: 500,
//             msg: 'Internal server error',
//         });
//     }
// }

// const returnAsset = async (req, res) => {
//     try {
//         const { asset, category, section, department, transactionType, quantity, returnDate, sapId, isEwaste } = req.body;

//         const receivedBy = req.user.id; // Assuming the user ID is stored in req.user.id after authentication

//         const [categoryDetails, departmentDetails] = await Promise.all([
//             AssetCategory.findOne({ categoryName: category }),
//             Department.findOne({ name: department }),
//         ]);
//         console.log("🚀 ~ returnAsset ~ categoryDetails:", categoryDetails)
//         console.log("🚀 ~ returnAsset ~ departmentDetails:", departmentDetails)

//         const [assetDetails, sectionDetails] = await Promise.all([
//             Asset.findOne({ assetName: asset, categoryId: categoryDetails._id }),
//             Section.findOne({ name: section, departmentId: departmentDetails._id }),
//         ]);

//         if (!assetDetails || !sectionDetails || !categoryDetails || !departmentDetails) {
//             return res.status(404).json({ msg: 'Asset, section, asset category or dept is not found' });
//         }

//         // Check if the asset is issued
//         // const assetTransaction = await AssetTransaction.findOne({
//         //     assetId: assetDetails._id,
//         //     issuedTo: sapId,
//         //     transactionType: 'issue',
//         //     returnDate: null, // Ensure the asset is not already returned
//         // });
//         // if(!assetTransaction) {
//         //     return res.status(404).json({msg: 'Asset not found or already returned'});
//         // }
//         // Check if the quantity to return is valid
//         // if(quantity <= 0 || quantity > assetTransaction.quantity) { 
//         //     return res.status(400).json({msg: 'Invalid quantity to return'});
//         // }  

//         const assetId = assetDetails._id;

//         // Create a new transaction for the return
//         const returnAssetTransaction = new AssetTransaction({
//             assetId,
//             categoryId: assetDetails.categoryId,
//             sectionId: sectionDetails._id,
//             departmentId: sectionDetails.departmentId,
//             returnedBy: sapId,
//             transactionType: 'return',
//             quantity,
//             returnDate,
//             isEwaste,
//             receivedBy,
//         })

//         await returnAssetTransaction.save();
//         console.log("🚀 ~ returnAsset ~ returnAssetTransaction:", returnAssetTransaction)

//         // Check if the asset is being returned as e-waste
//         if (isEwaste) {
//             const ewaste = new EwasteRecords({
//                 transactionId: returnAssetTransaction._id,
//                 assetId,
//                 quantity,
//                 totalWeight: parseInt(assetDetails.unitWeight, 10) * parseInt(quantity, 10),
//                 receiveDate: returnDate,
//                 status: 'collected', // Set the status to 'collected' for e-waste
//             });

//             await ewaste.save();
//             console.log("🚀 ~ returnAsset ~ ewaste record created:", ewaste);

//         } else {
//             // Increase the asset quantity
//             await Inventory.findOneAndUpdate(
//                 { assetId },
//                 {
//                     $inc: { availableStock: quantity, issuedStock: -quantity },
//                     lastUpdated: new Date(),
//                     updatedBy: req.user.id,
//                 }
//             );

//         }

//         return res.status(200).json({
//             success: true,
//             statusCode: 200,
//             msg: 'Asset returned successfully',
//             returnAssetTransaction,
//         });
//     } catch (err) {
//         console.log("🚀 ~ returnAsset ~ err:", err)
//         return res.status(500).json({ msg: 'Internal server error' });

//     }
// }

const addAssetInInventory = async (req, res) => {
    try {
        const { assetName, categoryName, quantity, minimumThreshold } = req.body;
        const addedBy = req.user.id; // Assuming the user ID is stored in req.user.id after authentication

        const category = await AssetCategory.findOne({ categoryName });
        if (!category) {
            return res.status(404).json({ msg: 'Asset category not found' });
        }

        let asset = await Asset.findOne({ assetName, categoryId: category._id });
        if (!asset) {
            // asset = new Asset({
            //     assetName,
            //     categoryId: category._id,
            //     createdBy: addedBy,
            //     isActive: true,
            // });
            // await asset.save();
            return res.status(404).json({ msg: 'Asset not found in the specified category. Please create the asset first.' });
        }

        let inventory = await Inventory.findOne({ assetId: asset._id });
        if (inventory) {
            inventory.availableStock += quantity;
            inventory.totalStock += quantity;
            inventory.lastUpdated = new Date();
            inventory.updatedBy = addedBy;
            await inventory.save();
        } else {
            inventory = new Inventory({
                assetId: asset._id,
                availableStock: quantity,
                issuedStock: 0,
                totalStock: quantity,
                minimumThreshold: minimumThreshold || 0,
                createdBy: addedBy,
                lastUpdated: new Date(),
                updatedBy: addedBy,
            });
            await inventory.save();
        }

        return res.status(200).json({
            success: true,
            statusCode: 200,
            msg: 'Asset added to inventory successfully',
            inventory,
        });

    } catch (error) {
        console.error('Error adding asset to inventory:', error);
        return res.status(500).json({ msg: 'Internal server error' });
    }
}

const getAllTransactions = async (req, res) => {
    try {
        let { page = 1, limit = 10 } = req.query;
        page = parseInt(page, 10);
        limit = parseInt(limit, 10);

        //calculate skip value
        const skip = (page - 1) * limit;

        // Fetch transactions with pagination and populate references
        const transactions = await AssetTransaction.find({})
            .populate("assetId")
            .populate("issuedTo")
            .populate("issuedBy")
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 }) //latest first

        // get total count (for frontend pagination)
        const total = await AssetTransaction.countDocuments();

        return res.status(200).json({
            success: true,
            statusCode: 200,
            transactions,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return res.status(500).json({
            success: false,
            statusCode: 500,
            msg: 'Internal server error',
        })
    }
}

export {
    issueAsset,
    // returnAsset,
    addAssetInInventory,
    getAllTransactions,
    getAssetInventory,
    rejectRequest,
}