import express from 'express';

import {getAllTransactions, issueAsset} from '../controller/adminManagerController/assetHandler.js';
import {authMiddleware} from '../middleware/authMiddleware.js';
// import {getAllAssets, getAssetById} from '../controller/userController/assetController.js';

const transactionRouter = express.Router();

transactionRouter.post('/issue/:id', authMiddleware(['superAdmin','manager', 'admin']), issueAsset);
// transactionRouter.post('/return', authMiddleware(['manager', 'admin']), returnAsset);
transactionRouter.get('/all', authMiddleware([ 'superAdmin','manager', 'admin']), getAllTransactions);
// transactionRouter.get('/:id', authMiddleware(['user', 'manager', 'admin']), getAssetById);

export {
    transactionRouter
}