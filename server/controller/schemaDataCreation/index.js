import Department from '../../models/department.js';
import Section from '../../models/section.js';
import AssetCategory from '../../models/assetCategory.js'
import Asset from '../../models/asset.js'
import Inventory from '../../models/inventory.js'
import ProjectLocation from '../../models/projectLocation.js'

const createDepartment = async (req , res) =>{
    try{
        const { deptName } = req.body;
        const existingDepartment = await Department.findOne({ name: deptName });
        if (existingDepartment) {   
            return res.status(400).json({ message: 'Department already exists' });
        }
        const newDepartment = new Department({ name: deptName });
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
        const existingSection = await Section.findOne({ name: sectionName});
        if (existingSection) {
            return res.status(400).json({ message: 'Section already exists in this department' });
        }
        const dept = await Department.findOne({ name: deptName });
        if (!dept) {
            return res.status(404).json({ message: 'Department not found' });
        }
        const newSection = new Section({
            sectioname,
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

        const {assetName, categoryName, make, model, unitWeight, isEwaste, description} = req.body
    
        if(!assetName || !categoryName || !make || !model || unitWeight=== null || isEwaste===null){
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
        
        const checkAsset = await Asset.findOne({assetName, categoryId: category._id});
        console.log("🚀 ~ createAsset ~ checkAsset:", checkAsset)
        if(checkAsset){
            return res.status(400).json({
                message: 'Asset with this name already exists in this category.'
            })
        }
    
        const asset = await Asset.create({
            assetName,
            categoryId: category._id,
            make,
            model,
            unitWeight,
            isEwaste, // Include the isEwaste field
            description,
        })
        console.log("🚀 ~ createAsset ~ asset successfully created:", asset)

        const inventoryEntry = await Inventory.create({
            assetId: asset._id,
            totalStock: 0,
            availableStock: 0,
            updatedBy: req.user.id,
        })
        console.log("🚀 ~ createAsset ~ asset has made inventoryEntry:", inventoryEntry)
    
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
const createProjectLocation = async (req, res) => {
    try{
        const { location } = req.body;
        if(!location){
            return res.status(400).json({
                success: false,
                statusCode: 400,
                msg: 'Location name is required.'
            })
        }
        const existingLocation = await ProjectLocation.find({location});
        if(existingLocation.length > 0){
            return res.status(400).json({
                success: false,
                statusCode: 400,
                msg: 'Location already exists.'
            })
        }
        const newLocation = await ProjectLocation.create({
            location: location,
        })
        console.log("🚀 ~ createProjectLocation ~ newLocation:", newLocation)
        return res.status(201).json({
            success: true,
            statusCode: 201,
            msg: 'Location created successfully,',
            newLocation,
        })
        
    }catch(err){
        console.log("🚀 ~ createProjectLocation ~ err:", err)
        return res.status(500).json({
            success: false,
            statusCode: 500,
            msg: 'Internal server error.'
        })
    }
}

export {
    createDepartment,
    createSection,
    createAsset,
    createAssetCategory,
    updateInventory,
    createProjectLocation,
}