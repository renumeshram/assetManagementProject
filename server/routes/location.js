import express from "express";
import { addDepartment, addLocation, addSection, getAllLocations, getDepartments, getLocation, getLocationById,getSections,locationTree} from "../controller/superAdminController/locationController/index.js";
import { authMiddleware } from "../middleware/authMiddleware.js"; // you already have this
import { getDepartmentsList, getSectionsList } from "../controller/ewasteController/ewasteController.js";

const locationRouter = express.Router();

// ✅ Only superAdmins can fetch locations for assigning admins
locationRouter.get("/", authMiddleware(["superAdmin"]), getAllLocations);
locationRouter.post("/add-location", authMiddleware(["superAdmin"]), addLocation);
locationRouter.get("/tree", authMiddleware(["superAdmin", "admin", "manager"]), locationTree);
locationRouter.get('/get-locations', authMiddleware(['superAdmin','admin', 'manager', 'user']), getLocation)
locationRouter.get('/:id', authMiddleware(['superAdmin','admin', 'manager', 'user']),getLocationById )
// locationRouter.get('/departments-list',getDepartmentsList)
// locationRouter.get('/sections-list', getSectionsList)
locationRouter.get('/departments/locationid', authMiddleware(['superAdmin','admin', 'manager', 'user']), getDepartments)
locationRouter.get('/sections/locationid', authMiddleware(['superAdmin','admin', 'manager', 'user']), getSections)
locationRouter.post('/add-departments', authMiddleware(['superAdmin']), addDepartment)
locationRouter.post('/add-sections', authMiddleware(['superAdmin']), addSection)


export default locationRouter;
