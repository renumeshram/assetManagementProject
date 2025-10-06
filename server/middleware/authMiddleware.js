import jwt from 'jsonwebtoken';
import User from '../models/users.js';

const authMiddleware = (roles = [], requireLocation = false) => async(req, res, next) =>{
    try{
        const token = req.headers.authorization?.split(' ')[1];
        if(!token) {
            return res.status(401).json({msg: 'Unauthorized, token missing'});
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Remove the .populate() if you only need the ObjectIds
        const user = await User.findById(decoded.id).select('-password');
            // console.log("🚀 ~ authMiddleware ~ user:", user)
            
        if(!user){
            return res.status(404).json({msg: 'User not found'});
        }
        
        // Check role authorization
        if(roles && !roles.includes(user.role)) {
            return res.status(403).json({msg: 'Unauthorized'});
        }

        // Check location-based access for non-superAdmin users
        if(requireLocation && user.role !== 'superAdmin') {
            const requestedLocationId = req.params.locationId || req.body.locationId || req.query.locationId;
            
            if(requestedLocationId) {
                // For admins, check if they're assigned to this location
                if(user.role === 'admin' && user.assignedLocationId?.toString() !== requestedLocationId) {
                    return res.status(403).json({msg: 'Access denied: Not authorized for this location'});
                }
                
                // For managers and users, check if their location matches
                if(['manager', 'user'].includes(user.role) && user.locationId?.toString() !== requestedLocationId) {
                    return res.status(403).json({msg: 'Access denied: Not authorized for this location'});
                }
            }
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