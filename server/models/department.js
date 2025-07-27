import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
    deptName: {
        type: String,
        required: true, 
    },
    isActive: {
        type: Boolean,
        default: true,      
    },
}, {timestamps: true});

export default mongoose.model('Department', departmentSchema);