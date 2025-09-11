import express from 'express';
import { handlePendingRequest, rejectRequest, directRequest, getAllRequests} from '../controller/adminManagerController/handleRequest.js';
import {raiseRequestHandler} from '../controller/userController/raiseRequest.js';
import { getUserRequests } from '../controller/userController/getUserRequest.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const requestRouter = express.Router();

// requestRouter.get('/all', authMiddleware(['user', 'manager', 'admin']), getAllRequests);
requestRouter.get('/my-requests', authMiddleware(['user']), getUserRequests);
requestRouter.post('/raise-request', authMiddleware(['user']),raiseRequestHandler);
requestRouter.get('/pending', authMiddleware(['manager', 'admin']), handlePendingRequest);
requestRouter.post('/reject/:id', authMiddleware(['manager', 'admin']), rejectRequest);
requestRouter.post('/direct', authMiddleware(['manager', 'admin']), directRequest);
requestRouter.get('/all-request', authMiddleware(['manager', 'admin']), getAllRequests);

export {
    requestRouter,
}