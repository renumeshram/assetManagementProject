import mongoose, { model } from "mongoose";

const assetSchema = new mongoose.Schema({
    assetName: {
        type:String,
        required: true,
    },
    categoryId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AssetCategory',
        required: true,
    },
    make:{
        type: String,
        required: true,
    },
    model: {
        type: String,
        required: true,
    },
    unitWeight: {
        type: Number,
        required: true, 
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    isEwaste:{
        type: Boolean,
        default: false, // Default value for isEwaste
    },
    description:{
        type: String,
        default: "", // Default value for description
    },

}, {timestamps: true});

export default mongoose.model('Asset', assetSchema);