import jwt from 'jsonwebtoken';
import User from '../models/users.js';

const authMiddleware = (roles = []) => async(req, res, next) =>{
    try{
        const token = req.headers.authorization?.split(' ')[1];
        if(!token) {
            return res.status(401).json({msg: 'Unauthorized, token missing'});
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if(!user){
            return res.status(404).json({msg: 'User not found'});
        }
        if(roles && !roles.includes(user.role)) {
            return res.status(403).json({msg: 'Unauthorized'});
        }

        req.user = user; // Attach user to request object
        next();
    }catch(err){
        console.error("Auth Middleware Error:", err);

        //handle specific JWT errors
        if(err.name === "TokenExpiredError"){
            return res.status(401).json({
                msg: "Session expired. Please log in again."
            })
        }
        if(err.name === "JsonWebTokenError"){
            return res.status(401).json({
                msg: "Invalid token."
            })
        }
        return res.status(500).json({msg: 'Internal server error'});
    }
}

export { authMiddleware };