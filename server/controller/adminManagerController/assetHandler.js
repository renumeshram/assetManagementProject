import Asset from '../../models/asset.js';
import AssetTransaction from '../../models/assetTransaction.js';
import AssetCategory from '../../models/assetCategory.js';
import User from '../../models/users.js';
import Department from '../../models/department.js';
import Section from '../../models/section.js';
import Inventory from '../../models/inventory.js';
import EwasteRecords from '../../models/ewasteRecords.js';

const issueAsset = async(req, res) =>{
    try{
        const { requestId} = req.body;
        const request = await Request.findById(requestId).populate('assetId').populate('assetCategoryId');

        if(!request || request.status !== 'approved') {
            return res.status(404).json({
                success: false,
                statusCode: 404,
                msg: 'Invalid or unapproved request'});
        }

        const inventory = await Inventory.findOne({ assetId: request.assetId._id });

        if(!inventory || inventory.availableStock < request.quantity){
            return res.status(400).json({
                success: false,
                statusCode: 400,
                msg: 'Insufficient stock available for the requested asset'
            });
        }

        const transaction = new AssetTransaction({
            assetId: request.assetId._id,
            categoryId: request.assetCategoryId._id,
            issuedTo: request.requestorId, 
            issuedBy: req.user.id, // Assuming the user ID is stored in req.user.id after authentication
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
            {assetId: request.assetId._id},
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

        return res.status(200).json({
            success: true,
            statusCode: 200,
            msg: 'Asset issued successfully',
            transactionId: transaction._id,
        });

    }catch(err){
        console.log("🚀 ~ issueAsset ~ err:", err)
        return res.status(500).json({
            success: false,
            statusCode: 500,
            msg: 'Internal server error',
        });
    }
}

const returnAsset = async(req, res) =>{
    try{
        const {asset, category, section, department, transactionType, quantity, returnDate, sapId, isEwaste} = req.body;

        const receivedBy = req.user.id; // Assuming the user ID is stored in req.user.id after authentication

        const [categoryDetails, departmentDetails] = await Promise.all([
            AssetCategory.findOne({categoryName: category}),
            Department.findOne({departmentName: department}),
        ]);

        const [assetDetails, sectionDetails] = await Promise.all([
            Asset.findOne({assetName: asset, assetCategoryId: categoryDetails._id}),
            Section.findOne({sectionName: section, departmentId: departmentDetails._id}),
        ]);

        if(!assetDetails || !sectionDetails || !categoryDetails || !departmentDetails) {
            return res.status(404).json({msg: 'Asset, section, asset category or dept is not found'});
        }

        // Check if the asset is issued
        // const assetTransaction = await AssetTransaction.findOne({
        //     assetId: assetDetails._id,
        //     issuedTo: sapId,
        //     transactionType: 'issue',
        //     returnDate: null, // Ensure the asset is not already returned
        // });
        // if(!assetTransaction) {
        //     return res.status(404).json({msg: 'Asset not found or already returned'});
        // }
        // Check if the quantity to return is valid
        // if(quantity <= 0 || quantity > assetTransaction.quantity) { 
        //     return res.status(400).json({msg: 'Invalid quantity to return'});
        // }  
        
        const assetId = assetDetails._id;
        
        // Create a new transaction for the return
        const returnAssetTransaction = new AssetTransaction({
            assetId,
            categoryId : assetDetails.categoryId,
            sectionId: sectionDetails._id,
            departmentId: sectionDetails.departmentId,
            returnedBy: sapId,
            transactionType: 'return',
            quantity,
            returnDate,
            isEwaste,
            receivedBy,
        })

        await returnAssetTransaction.save();
        console.log("🚀 ~ returnAsset ~ returnAssetTransaction:", returnAssetTransaction)

        // Check if the asset is being returned as e-waste
        if(isEwaste) {
            const ewaste = new EwasteRecords({
                transactionId: returnAssetTransaction._id,
                assetId,
                quantity,
                totalWeight: parseInt(assetDetails.unitWeight, 10) * parseInt(quantity, 10), 
                receiveDate: returnDate,
            });

            await ewaste.save();
            console.log("🚀 ~ returnAsset ~ ewaste record created:", ewaste);

        } else {
            // Increase the asset quantity
            await Inventory.findOneAndUpdate(
                { assetId },
                {
                    $inc: { availableStock: quantity, issuedStock: -quantity },
                    lastUpdated: new Date(),
                    updatedBy: req.user.id,
                }
            );

        }

        return res.status(200).json({
            success: true,  
            statusCode: 200,
            msg: 'Asset returned successfully',
            returnAssetTransaction,
        });
    }catch(err){
        console.log("🚀 ~ returnAsset ~ err:", err)
        return res.status(500).json({msg: 'Internal server error'});
        
    }
}

export {
    issueAsset,
    returnAsset,
}