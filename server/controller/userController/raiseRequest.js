import Request from '../../models/request.js';

import Asset from '../../models/asset.js';
import AssetCategory from '../../models/assetCategory.js';  
import Department from '../../models/department.js';
import Section from '../../models/section.js';

const raiseRequestHandler = async (req , res)=>{
    try{
        const{department, section, category, asset,  quantity, requestDate} = req.body;
    
        const requestorId = req.user.id; // Assuming the user ID is stored in req.user.id after authentication from token

        const [assetDetails, categoryDetails, deptDetails, sectionDetails] = await Promise.all([
            Asset.findOne({assetName: asset}),
            AssetCategory.findOne({categoryName: category}),    
            Department.findOne({departmentName: department}),
            Section.findOne({sectionName: section}),
        ]);

        if(!assetDetails || !categoryDetails || !deptDetails || !sectionDetails) {
            return res.status(404).json({msg: 'Asset or category or section or department not found'});
        }
        if(quantity <= 0) {
            return res.status(400).json({msg: 'Quantity must be greater than zero'});
        }

        const request = await Request.create({
            requestorId,
            departmentId: deptDetails._id,
            sectionId: sectionDetails._id,
            assetCategoryId: categoryDetails._id,
            assetId: assetDetails._id,
            quantity,
            requestDate,
            status: 'pending', // Default status
        })
        console.log("🚀 ~ raiseRequestHandler ~ request:", request)

        return res.status(201).json({
            success: true,
            statusCode: 201,
            msg: 'Request raised successfully',
            requestId: request._id,
        });

    }catch(err){
        console.log("🚀 ~ raiseRequestHandler ~ err:", err)
        return res.status(500).json({
            success: false,
            statusCode: 500,
            msg: 'Internal server error',
        });
        
    }

}

export {
    raiseRequestHandler,
}