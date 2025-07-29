import express from 'express';

import { authMiddleware } from '../../middleware/authMiddleware.js';
import EwasteRecords from '../../models/ewasteRecords.js';
import Asset from '../../models/asset.js';
import Inventory from '../../models/inventory.js';

const collectEwaste = async(req, res) => {
    try{
        const { assetName, quantity } = req.body;

        if(!assetName|| !quantity) {
            return res.status(400).json({msg: 'Asset ID and quantity are required'});
        }

        const asset = await Asset.findOne(assetName);
        if(!assetName) {
            return res.status(404).json({msg: 'Asset not found'});
        }

        // create an ewaste record
        const ewasteRecord = await EwasteRecords.create({
            assetId: asset._id,
            quantity,
            totalWeight: asset.unitWeight * quantity, // Assuming asset has a weight field
            // transactionId, // Assuming the transaction is linked to return transaction
            receiveDate: new Date(),
            status: 'collected',
            
        });
        console.log("🚀 ~ ewasteHandler ~ ewasteRecord:", ewasteRecord)

        // Update inventory ewasteStock, if there is ewasteStock attribute in the schema
        // await Inventory.findOneAndUpdate(
        //     { assetId },
        //     {
        //         $inc: { ewasteStock: quantity },
        //         lastUpdated: new Date(),
        //         updatedBy: req.user._id,
        //     },
        //     { upsert: true, new: true }
        // );

        return res.status(201).json({
            ewaste,
            msg: 'Ewaste added...'
        })
    }catch(err){
        console.log("🚀 ~ ewasteHandler ~ err:", err)
        res.status(500).json({
            msg: 'Internal Server Error'
        })
    }
}

export {
    collectEwaste,
}