import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: true,
    },
},{ timestamps: true });

export default mongoose.model('Section', sectionSchema);