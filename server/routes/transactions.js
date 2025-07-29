import express from 'express';

import {issueAsset, returnAsset} from '../controller/adminManagerController/assetHandler.js';
import {authMiddleware} from '../middleware/authMiddleware.js';
// import {getAllAssets, getAssetById} from '../controller/userController/assetController.js';

const transactionRouter = express.Router();

transactionRouter.post('/issue', authMiddleware(['manager', 'admin']), issueAsset);
transactionRouter.post('/return', authMiddleware(['manager', 'admin']), returnAsset);
// transactionRouter.get('/all', authMiddleware(['user', 'manager', 'admin']), getAllAssets);
// transactionRouter.get('/:id', authMiddleware(['user', 'manager', 'admin']), getAssetById);