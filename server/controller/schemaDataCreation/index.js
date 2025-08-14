import Department from '../../models/department.js';
import Section from '../../models/section.js';
import AssetCategory from '../../models/assetCategory.js'
import Asset from '../../models/asset.js'
import Inventory from '../../models/inventory.js'

const createDepartment = async (req , res) =>{
    try{
        const { deptName } = req.body;
        const existingDepartment = await Department.findOne({ deptName });
        if (existingDepartment) {   
            return res.status(400).json({ message: 'Department already exists' });
        }
        const newDepartment = new Department({ deptName });
        await newDepartment.save();
        return res.status(201).json({ message: 'Department created successfully', department: newDepartment });
    }catch(err){
        console.error('Error creating department:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

const createSection = async (req, res) => {
    try{
        const { sectionName, deptName} = req.body;
        const existingSection = await Section.findOne({ sectionName});
        if (existingSection) {
            return res.status(400).json({ message: 'Section already exists in this department' });
        }
        const dept = await Department.findOne({ deptName });
        if (!dept) {
            return res.status(404).json({ message: 'Department not found' });
        }
        const newSection = new Section({
            sectionName,
            departmentId: dept._id // Store the department ID
        });
        await newSection.save();
        return res.status(201).json({ message: 'Section created successfully', section: newSection });

    }catch(err){
        console.error('Error creating section:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

const createAssetCategory = async(req , res)=>{
    try{
        const { categoryName } = req.body
        if(!categoryName){
            return res.status(400).json({
                message: "Category name is required."
            })
        }

        const assetCategory = await AssetCategory.create({
            categoryName,
        })
        console.log("🚀 ~ createAssetCategory ~ assetCategory:", assetCategory)
        return res.status(201).json({
            success: true,
            statusCode: 201,
            msg: 'Asset category added successfully.',
            assetCategory,
        })
        
    }catch(err){
        console.log("🚀 ~ createAssetCategory ~ err:", err)
        res.status(500).json({
            success: false,
            statusCode: 500,
            msg: 'Internal server error'
        })
    }
}

const createAsset = async(req , res)=>{
    try{

        const {assetName, categoryName, make, model, unitWeight, isEwaste} = req.body
    
        if(!assetName || !categoryName || !make || !model || !unitWeight || !isEwaste){
            return res.status(400).json({
                message: 'All fields are required.'
            })
    
        }
    
        const category = await AssetCategory.findOne({categoryName});
    
        if(!category){
            return res.status(400).json({
                message: 'Category not found.'
            })
        }
    
        const asset = await Asset.create({
            assetName,
            categoryId: category._id,
            make,
            model,
            unitWeight,
            isEwaste, // Include the isEwaste field
        })
        console.log("🚀 ~ createAsset ~ asset:", asset)
    
        return res.status(201).json({
            success: true,
            statusCode: 201,
            msg: 'Asset added successfully',
            asset,
        })
    }catch(err){
        console.log("🚀 ~ createAsset ~ err:", err)
        return res.status(500).json({
            success: false,
            statusCode: 500,
            msg: 'Internal server error.'
        })
    }


}

const updateInventory = async(req ,res)=>{
    try{
        const {assetName, categoryName, stocks, } = req.body
        const userId = req.user._id

        const category = await AssetCategory.findOne({categoryName});

        if(!category){
            return res.status(400).json({
                message: 'Asset Category not found.'
            })
        }

        const asset = await Asset.findOne({categoryId: category._id, assetName});

        if(!asset){
            return res.status(400).json({
                message: 'Asset of this category is not found.'
            })
        }

        const currentInventory = await Inventory.findOne({ assetId: asset._id });
        const totalStock = currentInventory ? currentInventory.totalStock : 0;
        const availableStock = currentInventory ? currentInventory.availableStock : 0;

        const inventoryEntry = await Inventory.findOneAndUpdate(
            {assetId: asset._id},
            {
                ...{
                    totalStock: parseInt(totalStock) + parseInt(stocks),
                    availableStock: parseInt(availableStock) + parseInt(stocks),
                    assetId: asset._id,
                    updateBy: userId,
                }
            },
            {upsert: true, new: true}
        );
        console.log("🚀 ~ updateInventory ~ inventoryEntry:", inventoryEntry)

        return res.status(201).json({
            success: true,
            statusCode: 201,
            msg: 'Inventory updated successfully.',
            inventoryEntry,
        })
        
    }catch(err){
        console.log("🚀 ~ updateInventory ~ err:", err)
        return res.status(500).json({
            message: 'Internal server error.'
        })
    }
}

export {
    createDepartment,
    createSection,
    createAsset,
    createAssetCategory,
    updateInventory,
}