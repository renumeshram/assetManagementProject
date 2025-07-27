import mongoose from 'mongoose';

const assetCategorySchema = new mongoose.Schema({
    categoryName: {
        type: String,
        required: true,
    },
    isActive:{
        type: Boolean,
        default: true,
    },

}, {timestamps: true});

export default mongoose.model('AssetCategory', assetCategorySchema);