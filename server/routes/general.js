import express from 'express';
import { getAllAssets } from '../controller/assetController/index.js';
// import { addAssetInInventory } from '../controller/adminManagerController/assetHandler.js';
import { createAsset, createProjectLocation } from '../controller/schemaDataCreation/index.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { changeRole, getAllUsers } from '../controller/adminManagerController/userHandler.js';
import { getUserDetails } from '../controller/userController/userRegLogin.js';
import { getAllLocations, getDepartmentsList, getSectionsList } from '../controller/superAdminController/locationController/index.js';

const generalRouter = express.Router();

generalRouter.get('/assets', getAllAssets);
generalRouter.post('/inventory/add-asset',authMiddleware(['superAdmin',"admin"]), createAsset);
generalRouter.get('/all-users',authMiddleware(['superAdmin','admin','manager']),getAllUsers);
generalRouter.put('/:userId/role', authMiddleware(['superAdmin','admin']), changeRole)
generalRouter.get('/user-details', authMiddleware(['user']), getUserDetails);
generalRouter.post('/create-location', createProjectLocation)
generalRouter.get('/locations', authMiddleware(['user']), getAllLocations);
generalRouter.get('/departments-list', authMiddleware(['user']), getDepartmentsList);
generalRouter.get('/sections-list', authMiddleware(['user']), getSectionsList);


export default generalRouter;