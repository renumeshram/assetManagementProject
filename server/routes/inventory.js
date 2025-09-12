import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { getInventoryList, getInventoryHistory, updateInventory, createInventory, getLowStockAlerts, getInventoryById } from '../controller/inventoryController/index.js';
import { getAssetInventory } from '../controller/adminManagerController/assetHandler.js';

const inventoryRouter =express.Router();

inventoryRouter.get('/', authMiddleware(["admin", "manager"]), getInventoryList)
inventoryRouter.get('/inventoryHistory',authMiddleware(["admin"]), getInventoryHistory);
inventoryRouter.get('/lowStockAlerts',authMiddleware(["admin"]), getLowStockAlerts);
inventoryRouter.post('/create-inventory',authMiddleware(["admin"]), createInventory);
inventoryRouter.get('/:id',authMiddleware(["admin"]), getInventoryById);
inventoryRouter.put('/update-inventory/:id',authMiddleware(["admin"]), updateInventory);
inventoryRouter.get('/asset/:id', authMiddleware(["admin", "manager"]), getAssetInventory);


export {
    inventoryRouter,
}