import express from 'express';
import { handlePendingRequest, rejectRequest, directRequest, getAllRequests} from '../controller/adminManagerController/handleRequest.js';
import {raiseRequestHandler} from '../controller/userController/raiseRequest.js';
import { getUserRequests } from '../controller/userController/getUserRequest.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const requestRouter = express.Router();

requestRouter.get('/my-requests', authMiddleware(['user']), getUserRequests);
requestRouter.post('/raise-request', authMiddleware(['user']),raiseRequestHandler);
// Optional locationId for superAdmin to filter by location
requestRouter.get('/pending', authMiddleware(['superAdmin','manager', 'admin']), handlePendingRequest);
requestRouter.get('/pending/location/:locationId', authMiddleware(['superAdmin','manager', 'admin']), handlePendingRequest);
requestRouter.post('/reject/:id', authMiddleware(['superAdmin','manager', 'admin']), rejectRequest);
requestRouter.post('/direct', authMiddleware(['superAdmin','manager', 'admin']), directRequest);
// Optional locationId for superAdmin to filter by location
requestRouter.get('/all-request', authMiddleware(['superAdmin','manager', 'admin']), getAllRequests);
requestRouter.get('/all-request/location/:locationId', authMiddleware(['superAdmin','manager', 'admin']), getAllRequests);

export {
    requestRouter,
}