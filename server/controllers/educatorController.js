import { clerkClient } from "@clerk/express";
import { v2 as cloudinary } from "cloudinary";
import Course from "../models/Course.js";
import Educator from "../models/Educator.js";
import User from "../models/User.js";
import Purchase from "../models/Purchase.js";

// Helper to extract userId supporting both @clerk/express auth formats
const getAuthUserId = (req) => {
  return typeof req.auth === "function" ? req.auth().userId : req.auth?.userId;
};

// Register / Onboard Educator with Detailed Profile
export const registerEducator = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      return res.json({
        success: false,
        message: "Not authenticated. Check CLERK keys in server/.env",
      });
    }

    const { fullName, qualification, expertise, experience, bio, linkedInUrl } =
      req.body;

    if (!fullName || !qualification || !expertise || !experience || !bio) {
      return res.json({
        success: false,
        message: "Please fill all required educator profile fields",
      });
    }

    // Fetch Clerk User to check existing roles and ensure User exists in MongoDB
    const clerkUser = await clerkClient.users.getUser(userId);
    const rawRole = clerkUser?.publicMetadata?.role;
    const roles = Array.isArray(rawRole) ? rawRole : rawRole ? [rawRole] : [];
    const updatedRole = roles.includes("admin")
      ? ["educator", "admin"]
      : "educator";

    // Ensure User exists in MongoDB, upserting from Clerk if needed
    let user = await User.findById(userId);
    if (!user && clerkUser) {
      try {
        const name =
          `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
          fullName ||
          "Educator";
        const email = clerkUser.emailAddresses?.[0]?.emailAddress || "";
        const imageUrl = clerkUser.imageUrl || "";

        user = await User.create({
          _id: userId,
          name,
          email,
          imageUrl,
          enrolledCourses: [],
        });
      } catch (clerkErr) {
        console.log(
          "Clerk fallback fetch error in registerEducator:",
          clerkErr.message
        );
      }
    }

    // Upsert Educator Profile
    const educatorProfile = await Educator.findOneAndUpdate(
      { userId },
      {
        userId,
        fullName,
        qualification,
        expertise,
        experience,
        bio,
        linkedInUrl: linkedInUrl || "",
      },
      { new: true, upsert: true }
    );

    // Update Clerk User publicMetadata role, preserving admin if present
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...clerkUser?.publicMetadata,
        role: updatedRole,
      },
    });

    res.json({
      success: true,
      message: "Educator registered successfully",
      educator: educatorProfile,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Update Role to Educator (Quick / Legacy endpoint)
export const updateRoleToEducator = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      return res.json({
        success: false,
        message: "Not authenticated. Check CLERK keys in server/.env",
      });
    }

    // Fetch Clerk User to check existing roles and ensure User exists in MongoDB
    const clerkUser = await clerkClient.users.getUser(userId);
    const rawRole = clerkUser?.publicMetadata?.role;
    const roles = Array.isArray(rawRole) ? rawRole : rawRole ? [rawRole] : [];
    const updatedRole = roles.includes("admin")
      ? ["educator", "admin"]
      : "educator";

    // Ensure User exists in MongoDB
    let user = await User.findById(userId);
    if (!user && clerkUser) {
      try {
        const name =
          `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
          "User";
        const email = clerkUser.emailAddresses?.[0]?.emailAddress || "";
        const imageUrl = clerkUser.imageUrl || "";

        user = await User.create({
          _id: userId,
          name,
          email,
          imageUrl,
          enrolledCourses: [],
        });
      } catch (clerkErr) {
        console.log(
          "Clerk fallback fetch error in updateRoleToEducator:",
          clerkErr.message
        );
      }
    }

    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...clerkUser?.publicMetadata,
        role: updatedRole,
      },
    });

    res.json({ success: true, message: "You can publish a course now" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Add New Course
export const addCourse = async (req, res) => {
  try {
    const { courseData } = req.body;
    const imageFile = req.file;
    const educatorId = getAuthUserId(req);

    if (!educatorId) {
      return res.json({
        success: false,
        message: "Not authenticated. Check CLERK keys in server/.env",
      });
    }

    if (!imageFile) {
      return res.json({ success: false, message: "Thumbnail Not Attached" });
    }

    // Re-call cloudinary.config right before upload to ensure active, trimmed credentials
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME?.trim(),
      api_key: process.env.CLOUDINARY_API_KEY?.trim(),
      api_secret: (
        process.env.CLOUDINARY_SECRET_KEY || process.env.CLOUDINARY_API_SECRET
      )?.trim(),
    });

    // Upload thumbnail to Cloudinary FIRST before database operations
    let imageUpload;
    try {
      imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        resource_type: "image",
      });
    } catch (err) {
      console.error(
        "Cloudinary Upload Failed. Cloud Name used:",
        process.env.CLOUDINARY_NAME,
        "Error:",
        err
      );
      return res.json({
        success: false,
        message:
          "Cloudinary Error: " +
          (err.message ||
            "Check CLOUDINARY_NAME, API_KEY, and SECRET_KEY in server/.env"),
      });
    }

    const parsedCourseData = JSON.parse(courseData);
    parsedCourseData.educator = educatorId;
    parsedCourseData.status = "pending";
    parsedCourseData.isPublished = false;
    parsedCourseData.courseThumbnail = imageUpload.secure_url;

    const newCourse = await Course.create(parsedCourseData);

    res.json({
      success: true,
      message: "Course Added and Submitted for Approval",
      course: newCourse,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get Educator Courses (all statuses)
export const getEducatorCourses = async (req, res) => {
  try {
    const educator = getAuthUserId(req);
    if (!educator) {
      return res.json({
        success: false,
        message: "Not authenticated. Check CLERK keys in server/.env",
      });
    }
    const courses = await Course.find({ educator });
    res.json({ success: true, courses });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get Educator Dashboard Data (Earnings, Total Courses, Enrolled Students)
export const educatorDashboardData = async (req, res) => {
  try {
    const educator = getAuthUserId(req);
    if (!educator) {
      return res.json({
        success: false,
        message: "Not authenticated. Check CLERK keys in server/.env",
      });
    }
    const courses = await Course.find({ educator });
    const totalCourses = courses.length;

    const courseIds = courses.map((course) => course._id);

    // Sum of completed purchases for educator's courses
    const purchases = await Purchase.find({
      courseId: { $in: courseIds },
      status: "completed",
    });

    const totalEarnings = purchases.reduce(
      (sum, purchase) => sum + purchase.amount,
      0
    );

    // Collect enrolled students data
    const enrolledStudentsData = [];
    for (const course of courses) {
      const students = await User.find(
        { _id: { $in: course.enrolledStudents } },
        "name imageUrl"
      );

      students.forEach((student) => {
        enrolledStudentsData.push({
          courseTitle: course.courseTitle,
          student,
        });
      });
    }

    res.json({
      success: true,
      dashboardData: {
        totalEarnings,
        enrolledStudentsData,
        totalCourses,
      },
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get Enrolled Students with Purchase Details
export const getEnrolledStudentsData = async (req, res) => {
  try {
    const educator = getAuthUserId(req);
    if (!educator) {
      return res.json({
        success: false,
        message: "Not authenticated. Check CLERK keys in server/.env",
      });
    }
    const courses = await Course.find({ educator });
    const courseIds = courses.map((course) => course._id);

    const purchases = await Purchase.find({
      courseId: { $in: courseIds },
      status: "completed",
    })
      .populate("userId", "name imageUrl")
      .populate("courseId", "courseTitle");

    const enrolledStudents = purchases.map((purchase) => ({
      student: purchase.userId,
      courseTitle: purchase.courseId
        ? purchase.courseId.courseTitle
        : "Course Removed",
      purchaseDate: purchase.createdAt,
    }));

    res.json({ success: true, enrolledStudents });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Delete Course (Only if 0 Students Enrolled)
export const deleteCourse = async (req, res) => {
  try {
    const courseId = req.params.courseId || req.body.courseId;
    const userId = getAuthUserId(req);

    if (!userId) {
      return res.json({
        success: false,
        message: "Not authenticated. Check CLERK keys in server/.env",
      });
    }

    if (!courseId) {
      return res.json({ success: false, message: "Course ID is required" });
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return res.json({ success: false, message: "Course not found" });
    }

    // Verify educator ownership or admin privileges
    let isAdmin = false;
    try {
      const clerkUser = await clerkClient.users.getUser(userId);
      const rawRole = clerkUser?.publicMetadata?.role;
      const roles = Array.isArray(rawRole) ? rawRole : rawRole ? [rawRole] : [];
      isAdmin = roles.includes("admin");
    } catch (e) {
      // ignore
    }

    if (course.educator !== userId && !isAdmin) {
      return res.json({
        success: false,
        message: "Unauthorized: You can only delete your own courses",
      });
    }

    // Check if any students are enrolled
    if (course.enrolledStudents && course.enrolledStudents.length > 0) {
      return res.json({
        success: false,
        message: "Cannot delete course with enrolled students",
      });
    }

    await Course.findByIdAndDelete(courseId);

    res.json({ success: true, message: "Course deleted successfully" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};