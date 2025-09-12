// Department.js
import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: true,
  },
}, { timestamps: true });

// Use try-catch to debug
const Department = mongoose.models.Department || mongoose.model('Department', departmentSchema);

export default Department;