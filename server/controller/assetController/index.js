import express from 'express';
import AssetCatergory from '../../models/assetCategory.js';
import Asset from '../../models/asset.js';

//fetch all assets with categories
const getAllAssets = async(req , res)=>{
    try{
        const categories = await AssetCatergory.find({isActive: true});

        const result = await Promise.all(categories.map(async(cat)=>{
            const assets = await Asset.find({ categoryId: cat._id, isActive: true });
            return {
                _id: cat._id,
                categoryName: cat.categoryName,
                assets: assets.map((a)=>({
                    _id: a._id,
                    assetName: a.assetName,
                })),
            }
        }))
        res.json(result);
    }catch(error){
        console.error('Error fetching assets:', error);
        res.status(500).json({ message: 'Failed to fetch assets with categories' });
    }
}

export { getAllAssets };