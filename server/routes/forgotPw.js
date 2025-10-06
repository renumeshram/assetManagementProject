import express from 'express';
import { requestOTP, resendOTP, resetPassword, verifyOTP } from '../controller/userController/forgotPassword.js';


const forgotPwRouter = express.Router();

forgotPwRouter.post('request-otp', requestOTP);

forgotPwRouter.post('/verify-otp', verifyOTP);

forgotPwRouter.post('/reset', resetPassword);

forgotPwRouter.post('resend-otp', resendOTP);

export default forgotPwRouter;