import React, { createContext, useContext, useEffect, useState } from "react";
import humanizeDuration from "humanize-duration";
import { useNavigate } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "react-toastify";
import { dummyCourses } from "../assets/assets";

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const currency = import.meta.env.VITE_CURRENCY || "$";
  const navigate = useNavigate();

  const { getToken } = useAuth();
  const { user } = useUser();

  const [allCourses, setAllCourses] = useState(dummyCourses);
  const [isEducator, setIsEducator] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [userData, setUserData] = useState(null);

  // Calculate Average Rating of a course
  const calculateRating = (course) => {
    if (!course || !course.courseRatings || course.courseRatings.length === 0) {
      return 0;
    }
    let totalRating = 0;
    course.courseRatings.forEach((item) => {
      totalRating += item.rating;
    });
    return Math.floor(totalRating / course.courseRatings.length);
  };

  // Calculate Chapter Total Duration
  const calculateChapterTime = (chapter) => {
    let time = 0;
    if (chapter && Array.isArray(chapter.chapterContent)) {
      chapter.chapterContent.forEach((lecture) => {
        time += Number(lecture.lectureDuration) || 0;
      });
    }
    return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] });
  };

  // Calculate Course Total Duration
  const calculateCourseDuration = (course) => {
    let time = 0;
    if (course && Array.isArray(course.courseContent)) {
      course.courseContent.forEach((chapter) => {
        if (Array.isArray(chapter.chapterContent)) {
          chapter.chapterContent.forEach((lecture) => {
            time += Number(lecture.lectureDuration) || 0;
          });
        }
      });
    }
    return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] });
  };

  // Calculate Total Number of Lectures in a course
  const calculateNoOfLectures = (course) => {
    let totalLectures = 0;
    if (course && Array.isArray(course.courseContent)) {
      course.courseContent.forEach((chapter) => {
        if (Array.isArray(chapter.chapterContent)) {
          totalLectures += chapter.chapterContent.length;
        }
      });
    }
    return totalLectures;
  };

  // Fetch All Approved Courses directly from Backend
  const fetchAllCourses = async () => {
    try {
      if (backendUrl) {
        const { data } = await axios.get(`${backendUrl}/api/course/all`);
        if (data.success && Array.isArray(data.courses) && data.courses.length > 0) {
          setAllCourses(data.courses);
          return;
        }
      }
      setAllCourses(dummyCourses);
    } catch (error) {
      setAllCourses(dummyCourses);
    }
  };

  // Helper to determine roles from both Clerk and Backend
  const checkRoles = (clerkUser, backendUser) => {
    const clerkRaw = clerkUser?.publicMetadata?.role;
    const clerkRoles = Array.isArray(clerkRaw)
      ? clerkRaw
      : clerkRaw
      ? [clerkRaw]
      : [];

    const backendRaw = backendUser?.role;
    const backendRoles = Array.isArray(backendRaw)
      ? backendRaw
      : backendRaw
      ? [backendRaw]
      : [];

    const allRoles = [...new Set([...clerkRoles, ...backendRoles])];
    const hasAdmin = allRoles.includes("admin");
    const hasEducator = allRoles.includes("educator") || hasAdmin;

    return { hasAdmin, hasEducator };
  };

  // Fetch Current User Data
  const fetchUserData = async () => {
    const { hasAdmin: clerkAdmin, hasEducator: clerkEducator } = checkRoles(
      user,
      userData
    );
    setIsAdmin((prev) => prev || clerkAdmin);
    setIsEducator((prev) => prev || clerkEducator);

    try {
      const token = await getToken();
      if (!token) return;

      const { data } = await axios.get(`${backendUrl}/api/user/data`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setUserData(data.user);
        const { hasAdmin, hasEducator } = checkRoles(user, data.user);
        setIsAdmin((prev) => prev || hasAdmin);
        setIsEducator((prev) => prev || hasEducator);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      // Graceful fallback for local development
    }
  };

  // Fetch User Enrolled Courses
  const fetchUserEnrolledCourses = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const { data } = await axios.get(`${backendUrl}/api/user/enrolled-courses`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success && data.enrolledCourses) {
        setEnrolledCourses(data.enrolledCourses.slice().reverse());
      } else if (dummyCourses) {
        setEnrolledCourses(dummyCourses.slice(0, 2));
      }
    } catch (error) {
      setEnrolledCourses(dummyCourses.slice(0, 2));
    }
  };

  useEffect(() => {
    fetchAllCourses();
  }, []);

  useEffect(() => {
    if (user) {
      const { hasAdmin, hasEducator } = checkRoles(user, userData);
      setIsAdmin((prev) => prev || hasAdmin);
      setIsEducator((prev) => prev || hasEducator);

      fetchUserData();
      fetchUserEnrolledCourses();
    } else {
      setIsEducator(false);
      setIsAdmin(false);
      setUserData(null);
      setEnrolledCourses([]);
    }
  }, [user]);

  useEffect(() => {
    if (user || userData) {
      const { hasAdmin, hasEducator } = checkRoles(user, userData);
      setIsAdmin((prev) => prev || hasAdmin);
      setIsEducator((prev) => prev || hasEducator);
    }
  }, [userData]);

  const value = {
    currency,
    backendUrl,
    navigate,
    getToken,
    allCourses,
    setAllCourses,
    isEducator,
    setIsEducator,
    isAdmin,
    setIsAdmin,
    enrolledCourses,
    setEnrolledCourses,
    userData,
    setUserData,
    calculateRating,
    calculateChapterTime,
    calculateCourseDuration,
    calculateNoOfLectures,
    fetchAllCourses,
    fetchUserData,
    fetchUserEnrolledCourses,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
