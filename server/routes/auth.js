import express from 'express';

const authRouter = express.Router();

import {login, register} from '../controller/userController.js';

authRouter.post('/login', login);
authRouter.post('/register', register);
