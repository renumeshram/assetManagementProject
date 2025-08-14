import Request from '../../models/request.js';

import Asset from '../../models/asset.js';
import AssetCategory from '../../models/assetCategory.js';  
import Department from '../../models/department.js';
import Section from '../../models/section.js';

const raiseRequestHandler = async (req , res)=>{
    try{
        const{department, section, category, asset,  quantity, requestDate} = req.body;
    
        const requestorId = req.user.id; // Assuming the user ID is stored in req.user.id after authentication from token


        const [categoryDetails, departmentDetails] = await Promise.all([
            AssetCategory.findOne({categoryName: category}),
            Department.findOne({deptName: department}),
        ]);

        if(!categoryDetails || !departmentDetails){
            return res.status(404).json({msg: 'Asset category or department not found'});
        }


        const [assetDetails, sectionDetails] = await Promise.all([
            Asset.findOne({assetName: asset}, {categoryId: categoryDetails._id}),
            Section.findOne({sectionName: section}, {departmentId: departmentDetails._id}),
        ]);

        if(!assetDetails || !sectionDetails) {
            return res.status(404).json({msg: 'Asset or section not found'});
        }
        if(quantity <= 0) {
            return res.status(400).json({msg: 'Quantity must be greater than zero'});
        }

        const request = await Request.create({
            requestorId,
            departmentId: departmentDetails._id,
            sectionId: sectionDetails._id,
            categoryId: categoryDetails._id,
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