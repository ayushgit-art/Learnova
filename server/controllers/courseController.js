import Course from "../models/Course.js";
import Educator from "../models/Educator.js";
import User from "../models/User.js";
import { initialCourses } from "../configs/initialCourses.js";

// Helper logic to seed initial courses into MongoDB
export const seedCoursesLogic = async (force = false) => {
  // Determine educator ID for seeded courses
  let educatorProfile = await Educator.findOne();
  let educatorId = educatorProfile ? educatorProfile.userId : null;

  if (!educatorId) {
    const anyUser = await User.findOne();
    if (anyUser) {
      educatorId = anyUser._id;
    }
  }

  // If no user/educator exists in MongoDB, create a default Learnova Academy profile
  if (!educatorId) {
    educatorId = "educator_learnova_default";
    await User.create({
      _id: educatorId,
      name: "Learnova Academy",
      email: "educator@learnova.com",
      imageUrl:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
      enrolledCourses: [],
    });
    await Educator.create({
      userId: educatorId,
      fullName: "Learnova Academy",
      qualification: "Senior Technical Instructors",
      expertise: "Full-Stack Development, AI & Cloud Computing",
      experience: "10+ years in Tech & Education",
      bio: "Official Learnova Academy curriculum created by senior industry software engineers and educators.",
      linkedInUrl: "https://linkedin.com/company/learnova",
    });
  } else {
    // Ensure Educator document exists for this educatorId
    const existingEducator = await Educator.findOne({ userId: educatorId });
    if (!existingEducator) {
      const userDoc = await User.findById(educatorId);
      await Educator.create({
        userId: educatorId,
        fullName: userDoc ? userDoc.name : "Learnova Instructor",
        qualification: "Senior Technical Instructor",
        expertise: "Full-Stack Development & Computer Science",
        experience: "8+ years in Industry",
        bio: "Passionate educator focused on hands-on practical skills.",
        linkedInUrl: "https://linkedin.com",
      });
    }
  }

  const seededCourses = [];

  for (const courseData of initialCourses) {
    let existingCourse = await Course.findOne({
      courseTitle: courseData.courseTitle,
    });

    if (!existingCourse) {
      const newCourse = await Course.create({
        ...courseData,
        educator: educatorId,
        status: "approved",
        isPublished: true,
      });
      seededCourses.push(newCourse);
    } else {
      let needsSave = false;
      if (existingCourse.status !== "approved" || !existingCourse.isPublished) {
        existingCourse.status = "approved";
        existingCourse.isPublished = true;
        needsSave = true;
      }
      // Automatically synchronize with original dummyCourses thumbnail
      if (existingCourse.courseThumbnail !== courseData.courseThumbnail) {
        existingCourse.courseThumbnail = courseData.courseThumbnail;
        needsSave = true;
      }
      if (needsSave) {
        await existingCourse.save();
        seededCourses.push(existingCourse);
      }
    }
  }

  return seededCourses;
};

// Seed Endpoint (POST /api/course/seed or GET /api/course/seed)
export const seedInitialCourses = async (req, res) => {
  try {
    const seeded = await seedCoursesLogic(true);
    res.json({
      success: true,
      message: "Initial courses seeded and updated successfully in MongoDB",
      count: seeded.length,
      courses: seeded,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get All Approved & Published Courses
export const getAllCourses = async (req, res) => {
  try {
    // Auto-seed missing courses and keep initial course thumbnails synchronized
    await seedCoursesLogic(false);

    const courses = await Course.find({ isPublished: true, status: "approved" })
      .select(["-courseContent", "-enrolledStudents"])
      .populate({ path: "educator" })
      .sort({ createdAt: -1 });

    res.json({ success: true, courses });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get Course Details by ID (masking private lecture URLs)
export const getCourseId = async (req, res) => {
  const { id } = req.params;

  try {
    const courseData = await Course.findById(id).populate({ path: "educator" });

    if (!courseData) {
      return res.json({ success: false, message: "Course not found" });
    }

    // Mask lecture URLs if preview is not free
    courseData.courseContent.forEach((chapter) => {
      chapter.chapterContent.forEach((lecture) => {
        if (!lecture.isPreviewFree) {
          lecture.lectureUrl = "";
        }
      });
    });

    const courseObj = courseData.toObject();
    const educatorId = courseData.educator?._id || courseData.educator;
    const educatorProfile = await Educator.findOne({ userId: educatorId });
    courseObj.educatorProfile = educatorProfile;

    res.json({ success: true, courseData: courseObj });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
