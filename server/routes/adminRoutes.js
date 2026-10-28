import express from "express";
import {
  getAllCoursesAdmin,
  approveCourse,
  rejectCourse,
} from "../controllers/adminController.js";
import { protectAdmin } from "../middlewares/authMiddleware.js";

const adminRouter = express.Router();

adminRouter.get("/courses", protectAdmin, getAllCoursesAdmin);
adminRouter.post("/approve-course", protectAdmin, approveCourse);
adminRouter.post("/reject-course", protectAdmin, rejectCourse);

export default adminRouter;
