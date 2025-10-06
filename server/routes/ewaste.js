import express from 'express'
import { getEwasteReport} from '../controller/ewasteController/ewasteController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const ewasteRouter = express.Router();

ewasteRouter.get('/reports', authMiddleware(['superAdmin', 'admin', 'manager']), getEwasteReport);

export default ewasteRouter;