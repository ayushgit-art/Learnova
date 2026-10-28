import Course from "../models/Course.js";
import Educator from "../models/Educator.js";

// Get All Courses with Educator Profile for Admin Review
export const getAllCoursesAdmin = async (req, res) => {
  try {
    const courses = await Course.find({}).populate("educator");

    // Enrich courses with the Educator model profile
    const enrichedCourses = await Promise.all(
      courses.map(async (course) => {
        const educatorId = course.educator?._id || course.educator;
        const educatorProfile = await Educator.findOne({ userId: educatorId });
        const courseObj = course.toObject();
        courseObj.educatorProfile = educatorProfile;
        return courseObj;
      })
    );

    res.json({ success: true, courses: enrichedCourses });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Approve Course & Publish
export const approveCourse = async (req, res) => {
  try {
    const { courseId } = req.body;

    if (!courseId) {
      return res.json({ success: false, message: "Course ID is required" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.json({ success: false, message: "Course not found" });
    }

    course.status = "approved";
    course.isPublished = true;
    course.rejectionReason = "";
    await course.save();

    res.json({
      success: true,
      message: "Course approved successfully",
      course,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Reject Course with Reason
export const rejectCourse = async (req, res) => {
  try {
    const { courseId, rejectionReason } = req.body;

    if (!courseId) {
      return res.json({ success: false, message: "Course ID is required" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.json({ success: false, message: "Course not found" });
    }

    course.status = "rejected";
    course.isPublished = false;
    course.rejectionReason =
      rejectionReason || "Course does not meet platform guidelines.";
    await course.save();

    res.json({
      success: true,
      message: "Course rejected",
      course,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
