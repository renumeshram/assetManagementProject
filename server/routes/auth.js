import express from 'express';

const authRouter = express.Router();

import {getUserDetails, loginHandler, registerHandler} from '../controller/userController/userRegLogin.js';
import { resetPassword, resetAllPasswords, changePassword } from '../controller/adminManagerController/managePasswords.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminPasswordReset, getAllLocations, getDepartmentsList, getSectionsList } from '../controller/superAdminController/locationController/index.js';

authRouter.post('/login', loginHandler);
authRouter.post('/register', registerHandler);

authRouter.post('/change-password', authMiddleware(['superAdmin','admin', 'manager', 'user']), changePassword)
authRouter.post('/reset-password', resetPassword); //single reset
authRouter.post('/reset-all-passwords', authMiddleware(['superAdmin','admin']), resetAllPasswords); //bulk reset
authRouter.post('/reset-admin-password', authMiddleware(['superAdmin']), adminPasswordReset); //admin reset by superAdmin
authRouter.get('/locations', getAllLocations)
authRouter.get('/departments-list', getDepartmentsList)
authRouter.get('/sections-list', getSectionsList)

export default authRouter;