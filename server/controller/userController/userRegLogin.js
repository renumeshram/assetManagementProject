import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../../models/users.js';
import Department from '../../models/department.js';
import Section from '../../models/section.js';
import ProjectLocation from '../../models/projectLocation.js';

dotenv.config();

const registerHandler =async(req, res)=>{
    try{
        const {name, email, sapId, location, department, section, password} = req.body;
        console.log("🚀 ~ registerHandler ~ location:", location)
        if(!name || !email || !sapId || !location || !department || !section || !password){
            return res.status(400).json({msg: 'Please provide all required fields'});
        }
        const existingUser = await User.findOne({sapId});

        if(existingUser){
            return res.status(400).json({
                success: false,
                statusCode: 400,
                msg: 'User with this SAP ID already exists'
            });
        }
        
        const locationFound = await ProjectLocation.findOne({_id: location});
        console.log("🚀 ~ registerHandler ~ locationFound:", locationFound)
        const departmentFound = await Department.findOne({_id: department});
        console.log("🚀 ~ registerHandler ~ departmentFound:", departmentFound)
        const sectionFound = await Section.findOne({_id: section});
        console.log("🚀 ~ registerHandler ~ sectionFound:", sectionFound)
        if(!locationFound || !departmentFound || !sectionFound){  
            return res.status(400).json({
                success: false,
                statusCode: 400,    
                msg: 'Department or Section not found'
            });
        }
        const newUser = await User.create({
            name,
            email,
            sapId,
            locationId: locationFound._id,
            departmentId: departmentFound._id, 
            sectionId: sectionFound._id,
            password, // Password will be hashed in the pre-save hook
        });
        // await newUser.save();
        console.log("🚀 ~ registerHandler ~ newUser:", newUser)

        return res.status(201).json({
            success: true,
            statusCode: 201,
            msg: 'User registered successfully',
            userId: newUser._id,
        });
    }catch(err){
        console.log("🚀 ~ registerHandler ~ err:", err)
        return res.status(500).json({
            success: false,
            statusCode: 500,
            msg: 'Internal server error',
            error: err.message
        })
        
    }
}

const loginHandler = async (req, res) => {
    try {
        const { sapId, password } = req.body;
        
        // Input validation
        if (!sapId || !password) {
            return res.status(400).json({
                success: false,
                msg: 'Please provide both SAP ID and password',
                statusCode: 400
            });
        }

        // Find user and include password field
        const user = await User.findOne({ sapId }).select('+password');
        console.log("🚀 ~ loginHandler ~ user found:", user);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                msg: 'Invalid credentials',
                statusCode: 401
            });
        }

        let isPasswordValid = false;
        
        // Special handling for superAdmin - check against environment variable
        if (user.role === 'superAdmin') {
            isPasswordValid = password === process.env.SUPER_ADMIN_PASSWORD;
        } else {
            // For all other roles (admin, manager, user) - check against database using bcrypt
            if (!user.password) {
                console.error('No password found in database for user:', sapId);
                return res.status(500).json({
                    success: false,
                    msg: 'Internal server error',
                    statusCode: 500
                });
            }
            isPasswordValid = await bcrypt.compare(password, user.password);
        }

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                msg: 'Invalid credentials',
                statusCode: 401
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
                sapId: user.sapId
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Set session for regular users (optional)
        if (user.role === 'user') {
            req.session.userId = user._id;
            console.log("🚀 ~ loginHandler ~ req.session.userId:", req.session.userId);
        }

        // Success response
        const roleMessages = {
            superAdmin: 'SuperAdmin login successful',
            admin: 'Admin login successful', 
            manager: 'Manager login successful',
            user: 'User login successful'
        };

        console.log(`${user.role} login successful for SAP ID: ${sapId}`);

        return res.status(200).json({
            success: true,
            msg: roleMessages[user.role] || 'Login successful',
            token,
            sapId: user.sapId,
            name: user.name,
            role: user.role,
            statusCode: 200
        });

    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({
            success: false, // Fixed typo: was "sucess"
            msg: 'Internal server error',
            statusCode: 500
        });
    }
};

const getUserDetails = async(req, res)=>{
    try{
        const userId = req.user.id;
        const user = await User.findById(userId)
            .select('-password -role')
            .populate('departmentId', 'name')
            .populate('sectionId', 'name')
            .populate('locationId', 'location');
        console.log(user)
        if(!user){
            return res.status(404).json({msg: 'User not found'});
        }
        const userDetails ={
            location: user.locationId? user.locationId.location : null,
            department: user.departmentId ? user.departmentId.name : null,
            section: user.sectionId? user.sectionId.name : null,
        }
        return res.status(200).json({
            success: true,
            statusCode: 200,
            msg: 'User details fetched successfully',
            userDetails
        });
    }catch(error){
        console.log("🚀 ~ getUserDetails ~ error:", error)
        return res.status(500).json({
            success: false,
            statusCode: 500,
            msg: 'Internal server error',
            error: error.message
        });
    }
}

export {
    registerHandler,
    loginHandler,
    getUserDetails
}