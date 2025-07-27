import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
    assetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Asset',
        required: true,
    },
    totalStock: {
        type: Number,
        required: true,
        default: 0,
    },
    availableStock: {
        type: Number,
        required: true,
        default: 0,
    },
    issuedStock: {
        type: Number,
        required: true,
        default: 0,
    },
    minimumThreshold:{
        type: Number,
        required: true,
        default: 0,
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
    },
    updatedBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }
},{timestamps: true});

export default mongoose.model('Inventory', inventorySchema);