import express from "express";

import { authMiddleware} from "../middleware/authMiddleware.js";
import dashboardStats, { getRecentRequests } from "../controller/dashboardController/index.js";

const dashboardRouter = express.Router();

dashboardRouter.get("/stats", authMiddleware(['superAdmin', 'admin', 'manager', 'user']), dashboardStats);
dashboardRouter.get("/recent", authMiddleware(['superAdmin', 'admin', 'manager', 'user']), getRecentRequests);

export default dashboardRouter;