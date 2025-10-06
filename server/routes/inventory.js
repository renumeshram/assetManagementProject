import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { getInventoryList, getInventoryHistory, updateInventory, createInventory, getLowStockAlerts, getInventoryById } from '../controller/inventoryController/index.js';
import { getAssetInventory } from '../controller/adminManagerController/assetHandler.js';

const inventoryRouter =express.Router();

inventoryRouter.get('/', authMiddleware(['superAdmin',"admin", "manager"]), getInventoryList)
inventoryRouter.get('/inventoryHistory',authMiddleware(['superAdmin',"admin"]), getInventoryHistory);
inventoryRouter.get('/lowStockAlerts',authMiddleware(['superAdmin',"admin"]), getLowStockAlerts);
inventoryRouter.post('/create-inventory',authMiddleware(['superAdmin',"admin"]), createInventory);
inventoryRouter.get('/:id',authMiddleware(['superAdmin',"admin"]), getInventoryById);
inventoryRouter.put('/update-inventory/:id',authMiddleware(['superAdmin',"admin"]), updateInventory);
inventoryRouter.get('/asset/:id', authMiddleware(['superAdmin',"admin", "manager"]), getAssetInventory);


export {
    inventoryRouter,
}