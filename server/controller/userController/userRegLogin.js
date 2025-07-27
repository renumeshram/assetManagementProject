import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import User from '../../models/users.js';

dotenv.config();

const registerHandler =async(req, res)=>{
    try{
        const {name, email, sapId, department, section, password} = req.body;
        if(!name || !email || !sapId || !department || !section || !password){
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
        
        const departmentFound = await department.findOne({deptName: department});
        const sectionFound = await section.findOne({sectionName: section});
        if(!departmentFound || !sectionFound){  
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

const loginHandler = async(req, res)=>{
    try{
        const {sapId, password} = req.body;
        if(!sapId || !password){
            return res.status(400).json({msg: 'Please provide both SAP ID and password'});
        }
        const user= await User.findOne({sapId}).select('+password'); // Ensure password is included in the query
        if(!user){  
            return res.status(404).json({msg: 'User not found'});
        }

        if(user.role === 'admin' && password === process.env.ADMIN_PASSWORD){
            const token = jwt.sign({
                id: user._id,
                role: 'admin'
            },
            process.env.ADMIN_JWT_SECRET,
            {expiresIn: '1h'});
            
            return res.status(200).json({
                success: true,
                msg: 'Admin login successful', token,
                sapId: sapId,
                statusCode: 200,
            });

        }
        else if(user.role === 'manager' && password === process.env.MANAGER_PASSWORD){
            const token = jwt.sign({
                    id: user._id,
                    role: 'manager'
                },
                process.env.MANAGER_JWT_SECRET,
                {expiresIn: '1h'}
            );
            
            return res.status(200).json({
                success: true,
                msg: 'Manager login successful', token,
                sapId: sapId,
                statusCode: 200,
            });
        }
        else{
            user.checkpw(password, async(err, result)=>{
                if(err) return next(err);
                if(!result){
                    return res.status(400).json({
                        success: false,
                        statusCode: 400,
                        msg: 'Invalid Password'
                    })
                }
            })
            req.session.userId = user._id; 
            console.log("🚀 ~ loginHandler ~ req.session.userId:", req.session.userId)

            const token = jwt.sign({
                    id: user._id,
                    role: 'user'
                },
            process.env.USER_JWT_SECRET,
            {expiresIn: '1h'});

            return res.status(200).json({
                success: true,
                msg: 'User login successful', token,
                sapId: sapId,
                statusCode: 200,
            });
        }
        
    }catch(err){
        console.error('Login error:', err);
        return res.status(500).json({
            sucess: false,
            statusCode: 500,
            msg: 'Internal server error'
        });
    }
}

export {
    registerHandler,
    loginHandler,
}