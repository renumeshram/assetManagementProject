import express from 'express';
import { handlePendingRequest, approveRequest, rejectRequest, directRequest} from '../controller/adminManagerController/handleRequest.js';
import {raiseRequestHandler} from '../controller/userController/raiseRequest.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const requestRouter = express.Router();


requestRouter.post('/request', authMiddleware(['user']),raiseRequestHandler);
requestRouter.post('/pending', authMiddleware(['manager', 'admin']), handlePendingRequest);
requestRouter.post('/approve', authMiddleware(['manager', 'admin']), approveRequest);
requestRouter.post('/reject', authMiddleware(['manager', 'admin']), rejectRequest);
requestRouter.post('/direct', authMiddleware(['manager', 'admin']), directRequest);