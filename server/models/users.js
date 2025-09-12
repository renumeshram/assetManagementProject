import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    sapId:{
        type: String,
        required: true,
        unique: true,
    },
    locationId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProjectLocation',
        // required: true,
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: true,
    },
    sectionId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section',
        required: true,
    },
    role: {
        type: String,
        required: true,
        enum: ['admin', 'manager', 'user'],
        default: 'user', // Default role can be set to 'user'
    },
    password: {
        type: String,
        // required: true,
        select: false, // Do not return password in queries
    },

}, {timestamps: true});

userSchema.pre("save", async function(next) {
    try{
        if(this.password && this.isModified('password')){
            this.password = await bcrypt.hash(this.password, 10);
        }
        next();
    } catch(error){
        return next(error);
    }
})

userSchema.methods.checkpw = function(password, cb){
    bcrypt.compare(password, this.password, (err, result)=>{
        return cb(err, result);
    })
}

export default mongoose.model('User', userSchema);