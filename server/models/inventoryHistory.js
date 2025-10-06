import mongoose from 'mongoose';

const inventoryHistorySchema = new mongoose.Schema({
    inventoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inventory',
        required: true,
    },
    assetId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Asset',
        required: true,
        
    },
    locationId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProjectLocation',
        required: true,
        
    },
        action:{
            type: String,
            // enum: ['added', 'removed', 'updated', 'moved'],
            required: true,
        },
    reason:{
        type: String,
        required: true,
    },
    adjustmentQuantity:{
        type: Number,
        default:0,
    },
    description:{
        type: String,
        trim: true,
        maxLength: 500,
        default: '',
    },
    previousValues:{
        totalStock: Number,
        availableStock: Number,
        issuedStock: Number,
        minimumThreshold: Number,
    },
    newValues:{
        totalStock: Number,
        availableStock: Number,
        issuedStock: Number,
        minimumThreshold: Number,
    },
    updatedBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    notes:{
        type: String,
    },
    
},{
    timestamps: true,
})

export default mongoose.model('InventoryHistory', inventoryHistorySchema);