import express from "express";
import {
  getAllCourses,
  getCourseId,
  seedInitialCourses,
} from "../controllers/courseController.js";

const courseRouter = express.Router();

courseRouter.get("/all", getAllCourses);
courseRouter.post("/seed", seedInitialCourses);
courseRouter.get("/seed", seedInitialCourses);
courseRouter.get("/:id", getCourseId);

export default courseRouter;
