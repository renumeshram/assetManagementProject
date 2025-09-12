import express from 'express';
import { getAllAssets } from '../controller/assetController/index.js';
// import { addAssetInInventory } from '../controller/adminManagerController/assetHandler.js';
import { createAsset, createProjectLocation } from '../controller/schemaDataCreation/index.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { changeRole, getAllUsers } from '../controller/adminManagerController/userHandler.js';
import { getUserDetails } from '../controller/userController/userRegLogin.js';

const generalRouter = express.Router();

generalRouter.get('/assets', getAllAssets);
generalRouter.post('/inventory/add-asset',authMiddleware(["admin"]), createAsset);
generalRouter.get('/all-users',authMiddleware(['admin']),getAllUsers);
generalRouter.put('/:userId/role', authMiddleware(['admin']), changeRole)
generalRouter.get('/user-details', authMiddleware(['user']), getUserDetails);
generalRouter.post('/create-location', createProjectLocation)


export default generalRouter;