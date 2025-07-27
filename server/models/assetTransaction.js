import mongoose from 'mongoose';

const assetTransactionSchema = new mongoose.Schema({
    assetId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Asset',
        required: true,
    },
    categoryId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    },
    departmentId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: true,
    },
    sectionId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section',
        required: true,
    },
    issuedTo: {
        type: String,
        // required: true,
    },
    issuedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        // required: true,
    }, 
    receivedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        // required: true,
    },
    returnedBy:{
        type: String
        //storing sapId of the user who returned the asset
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    transactionType: {
        type: String,
        required: true,
        enum: ['issue', 'return'],
    },
    issueDate:{
        type: Date,
        default: Date.now,
    },
    returnDate:{
        type: Date,
        default: null, // Can be null if not returned yet
    },
    isEwaste: {
        type: Boolean,
        default: false, // Indicates if the asset is marked as e-waste
    },
}, {timestamps: true});

export default mongoose.model('AssetTransaction', assetTransactionSchema);