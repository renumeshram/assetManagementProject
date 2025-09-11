import express from 'express'
import { getEwasteReport, getEwasteChartData } from '../controller/ewasteController/ewasteController.js';

const ewasteRouter = express.Router();

ewasteRouter.get('/reports', getEwasteReport);

export {
    ewasteRouter
}