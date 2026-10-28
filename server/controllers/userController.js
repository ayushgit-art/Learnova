import Stripe from "stripe";
import { clerkClient } from "@clerk/express";
import User from "../models/User.js";
import Course from "../models/Course.js";
import Purchase from "../models/Purchase.js";
import CourseProgress from "../models/CourseProgress.js";

// Helper to extract userId supporting both @clerk/express auth formats
const getAuthUserId = (req) => {
  return typeof req.auth === "function" ? req.auth().userId : req.auth?.userId;
};

// Get Current User Data with local fallback for non-webhook environments
export const getUserData = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      return res.json({
        success: false,
        message: "Not authenticated. Check CLERK keys in server/.env",
      });
    }

    let user = await User.findById(userId);

    // Local fallback: Automatically create user in MongoDB if webhook hasn't run
    if (!user) {
      try {
        const clerkUser = await clerkClient.users.getUser(userId);
        if (clerkUser) {
          const name =
            `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
            "User";
          const email =
            clerkUser.emailAddresses?.[0]?.emailAddress || "";
          const imageUrl = clerkUser.imageUrl || "";

          user = await User.create({
            _id: userId,
            name,
            email,
            imageUrl,
            enrolledCourses: [],
          });
        }
      } catch (clerkErr) {
        console.log("Clerk fallback fetch error in getUserData:", clerkErr.message);
      }
    }

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const userObj = user.toObject ? user.toObject() : { ...user };
    try {
      const clerkUser = await clerkClient.users.getUser(userId);
      if (clerkUser) {
        userObj.role = clerkUser.publicMetadata?.role;
      }
    } catch (clerkErr) {
      // ignore
    }

    res.json({ success: true, user: userObj });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get User Enrolled Courses
export const userEnrolledCourses = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      return res.json({
        success: false,
        message: "Not authenticated. Check CLERK keys in server/.env",
      });
    }

    const userData = await User.findById(userId).populate("enrolledCourses");

    if (!userData) {
      return res.json({
        success: false,
        message: "User not found",
        enrolledCourses: [],
      });
    }

    res.json({ success: true, enrolledCourses: userData.enrolledCourses });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Purchase Course via Stripe Checkout
export const purchaseCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const { origin } = req.headers;
    const userId = getAuthUserId(req);

    if (!userId) {
      return res.json({ success: false, message: "Please login to purchase" });
    }

    const courseData = await Course.findById(courseId);
    let userData = await User.findById(userId);

    // Fallback if user doesn't exist yet in MongoDB
    if (!userData) {
      const clerkUser = await clerkClient.users.getUser(userId);
      if (clerkUser) {
        const name =
          `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
          "User";
        userData = await User.create({
          _id: userId,
          name,
          email: clerkUser.emailAddresses?.[0]?.emailAddress || "",
          imageUrl: clerkUser.imageUrl || "",
          enrolledCourses: [],
        });
      }
    }

    if (!userData || !courseData) {
      return res.json({ success: false, message: "Data Not Found" });
    }

    const discountedPrice = (
      courseData.coursePrice -
      (courseData.discount * courseData.coursePrice) / 100
    ).toFixed(2);

    const purchaseData = {
      courseId: courseData._id,
      userId,
      amount: Number(discountedPrice),
      status: "pending",
    };

    const newPurchase = await Purchase.create(purchaseData);

    // Initialize Stripe Gateway
    const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
    const currency = (process.env.CURRENCY || "usd").toLowerCase();

    const line_items = [
      {
        price_data: {
          currency,
          product_data: {
            name: courseData.courseTitle,
          },
          unit_amount: Math.round(Number(discountedPrice) * 100),
        },
        quantity: 1,
      },
    ];

    const session = await stripeInstance.checkout.sessions.create({
      success_url: `${origin}/loading/my-enrollments?session_id={CHECKOUT_SESSION_ID}&purchase_id=${newPurchase._id}`,
      cancel_url: `${origin}/`,
      line_items,
      mode: "payment",
      metadata: {
        purchaseId: newPurchase._id.toString(),
      },
    });

    res.json({ success: true, session_url: session.url });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Verify Stripe Purchase after Checkout Redirect
export const verifyPurchase = async (req, res) => {
  try {
    const { sessionId, purchaseId } = req.body;

    if (!sessionId || !purchaseId) {
      return res.json({
        success: false,
        message: "Session ID and Purchase ID are required",
      });
    }

    const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripeInstance.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return res.json({ success: false, message: "Stripe session not found" });
    }

    if (session.payment_status === "paid") {
      const purchase = await Purchase.findById(purchaseId);

      if (!purchase) {
        return res.json({
          success: false,
          message: "Purchase record not found",
        });
      }

      if (purchase.status !== "completed") {
        purchase.status = "completed";
        await purchase.save();

        await Course.findByIdAndUpdate(purchase.courseId, {
          $addToSet: { enrolledStudents: purchase.userId },
        });

        await User.findByIdAndUpdate(purchase.userId, {
          $addToSet: { enrolledCourses: purchase.courseId },
        });
      }

      return res.json({
        success: true,
        message: "Purchase verified successfully",
        courseId: purchase.courseId,
      });
    } else {
      return res.json({
        success: false,
        message: `Payment status is ${session.payment_status}`,
      });
    }
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Update Course Progress
export const updateUserCourseProgress = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const { courseId, lectureId } = req.body;

    if (!userId) {
      return res.json({
        success: false,
        message: "Not authenticated. Check CLERK keys in server/.env",
      });
    }

    const progressData = await CourseProgress.findOne({ courseId, userId });

    if (progressData) {
      if (progressData.lectureCompleted.includes(lectureId)) {
        return res.json({ success: true, message: "Lecture already completed" });
      }

      progressData.lectureCompleted.push(lectureId);
      await progressData.save();
    } else {
      await CourseProgress.create({
        userId,
        courseId,
        lectureCompleted: [lectureId],
      });
    }

    res.json({ success: true, message: "Progress Updated" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get Course Progress
export const getUserCourseProgress = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const { courseId } = req.body;

    if (!userId) {
      return res.json({
        success: false,
        message: "Not authenticated. Check CLERK keys in server/.env",
      });
    }

    const progressData = await CourseProgress.findOne({ courseId, userId });
    res.json({ success: true, progressData });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Add / Update User Rating for a Course
export const addUserRating = async (req, res) => {
  const userId = getAuthUserId(req);
  const { courseId, rating } = req.body;

  if (!userId) {
    return res.json({
      success: false,
      message: "Not authenticated. Check CLERK keys in server/.env",
    });
  }

  if (!courseId || !rating || rating < 1 || rating > 5) {
    return res.json({ success: false, message: "Invalid Rating Details" });
  }

  try {
    const course = await Course.findById(courseId);
    if (!course) {
      return res.json({ success: false, message: "Course not found" });
    }

    const user = await User.findById(userId);
    if (!user || !user.enrolledCourses.includes(courseId)) {
      return res.json({
        success: false,
        message: "User has not purchased this course",
      });
    }

    const existingRatingIndex = course.courseRatings.findIndex(
      (r) => r.userId === userId
    );

    if (existingRatingIndex > -1) {
      course.courseRatings[existingRatingIndex].rating = rating;
    } else {
      course.courseRatings.push({ userId, rating });
    }

    await course.save();

    return res.json({ success: true, message: "Rating added successfully" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};