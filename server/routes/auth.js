import express from 'express';

const authRouter = express.Router();

import {login, register} from '../controller/userController.js';
import { resetPassword, resetAllManagerPasswords } from '../controller/adminManagerController/managePasswords.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

authRouter.post('/login', login);
authRouter.post('/register', register);
authRouter.post('/reset-password', authMiddleware(['admin']), resetPassword);
authRouter.post('/reset-manager-passwords', authMiddleware(['admin']), resetAllManagerPasswords);
//reset-user-password yet to be implemented