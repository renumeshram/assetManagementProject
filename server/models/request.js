import mongoose from "mongoose";

const requestSchema = new mongoose.Schema({
    requestorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: true,
    },
    sectionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section',
        required: true,
    },  
    categoryId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AssetCategory',
        required: true,
    },
    assetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Asset',
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1, // Ensure quantity is at least 1
    },
    status: {
        type: String,
        enum: ['pending', 'issued', 'rejected'],
        default: 'pending',
    },
    requestDate: {
        type: Date,
        default: Date.now,
    },
    reviewedBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    reviewDate:{
        type: Date,
    },
    rejectionReason:{
        type: String,
        trim: true,
    },
    comments: {
        type: String,
        trim: true,
    },
    isDirectRequest: {
        type: Boolean,
        default: false, // Indicates if the request is a direct request
    },
    
}, { timestamps: true });

export default mongoose.model('Request', requestSchema);