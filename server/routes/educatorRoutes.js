import express from "express";
import {
  registerEducator,
  updateRoleToEducator,
  addCourse,
  getEducatorCourses,
  educatorDashboardData,
  getEnrolledStudentsData,
  deleteCourse,
} from "../controllers/educatorController.js";
import upload from "../configs/multer.js";
import { protectEducator } from "../middlewares/authMiddleware.js";

const educatorRouter = express.Router();

// Educator Onboarding & Role Updates
educatorRouter.post("/register", registerEducator);
educatorRouter.get("/update-role", updateRoleToEducator);

// Course Management
educatorRouter.post(
  "/add-course",
  upload.single("image"),
  protectEducator,
  addCourse
);
educatorRouter.get("/courses", protectEducator, getEducatorCourses);
educatorRouter.delete("/delete-course/:courseId", protectEducator, deleteCourse);
educatorRouter.post("/delete-course", protectEducator, deleteCourse);

// Dashboard & Analytics
educatorRouter.get("/dashboard", protectEducator, educatorDashboardData);
educatorRouter.get(
  "/enrolled-students",
  protectEducator,
  getEnrolledStudentsData
);

export default educatorRouter;
