import mongoose from 'mongoose';

const ewasteRecordsSchema = new mongoose.Schema({
    transactionId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AssetTransaction',
        // required: true,
    },
    assetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Asset',
        required: true,
    },
    quantity:{
        type: Number,
        required: true,
        min: 1,
    },
    totalWeight:{
        type: Number,
        required: true,
        min: 0,
    },
    receiveDate: {
        type: Date,
        default: Date.now,
    },
    status:{
        type: String,
        enum: ['generated', 'collected'],
        default: 'generated', // Default status can be set to 'generated'
    }

}, {timestamps: true});

export default mongoose.model('EwasteRecords', ewasteRecordsSchema);