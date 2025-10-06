import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    sapId: {
        type: String,
        required: true,
        unique: true,
    },
    locationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProjectLocation',
        // required: true,
    },
    assignedLocationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProjectLocation',
        required: function () {
            return this.role === 'admin' && this.role !== 'superAdmin';
        },
        // Only required for location-specific admins, not superAdmins
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: function () {
            return this.role !== 'superAdmin';
        },
    },
    sectionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section',
        required: function () {
            return this.role !== 'superAdmin';
        },
    },
    role: {
        type: String,
        required: true,
        enum: ['superAdmin', 'admin', 'manager', 'user'],
        default: 'user', // Default role can be set to 'user'
    },
    password: {
        type: String,
        // required: true,
        select: false, // Do not return password in queries
    },

}, { timestamps: true });

userSchema.pre("save", async function (next) {
    try {
        if (this.password && this.isModified('password')) {
            this.password = await bcrypt.hash(this.password, 10);
        }
        next();
    } catch (error) {
        return next(error);
    }
})

userSchema.methods.checkpw = function (password, cb) {
    bcrypt.compare(password, this.password, (err, result) => {
        return cb(err, result);
    })
}

export default mongoose.model('User', userSchema);