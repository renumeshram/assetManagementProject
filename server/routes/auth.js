import express from 'express';

const authRouter = express.Router();

import {getUserDetails, loginHandler, registerHandler} from '../controller/userController/userRegLogin.js';
import { resetPassword, resetAllPasswords, changePassword } from '../controller/adminManagerController/managePasswords.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

authRouter.post('/login', loginHandler);
authRouter.post('/register', registerHandler);

authRouter.post('/change-password', authMiddleware(['admin', 'manager', 'user']), changePassword)
authRouter.post('/reset-password', resetPassword); //forgot password functionality
authRouter.post('/reset-all-passwords', authMiddleware(['admin']), resetAllPasswords);



export default authRouter;