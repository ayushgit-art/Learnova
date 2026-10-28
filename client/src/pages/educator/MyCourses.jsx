import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import Loading from "../../components/student/Loading";
import axios from "axios";
import { toast } from "react-toastify";

const MyCourses = () => {
  const { currency, allCourses, backendUrl, getToken, fetchAllCourses } =
    useAppContext();
  const [courses, setCourses] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchEducatorCourses = async () => {
    try {
      const token = await getToken();
      if (!token) {
        setCourses(allCourses);
        return;
      }

      const { data } = await axios.get(`${backendUrl}/api/educator/courses`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setCourses(data.courses);
      } else {
        setCourses(allCourses);
      }
    } catch (error) {
      setCourses(allCourses);
    }
  };

  const handleDeleteCourse = async (course) => {
    const hasEnrolled =
      course.enrolledStudents && course.enrolledStudents.length > 0;
    if (hasEnrolled) {
      toast.error("Cannot delete a course that has enrolled students.");
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete "${course.courseTitle}"? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      setDeletingId(course._id);
      const token = await getToken();
      if (!token) {
        toast.error("Authentication required. Please sign in again.");
        return;
      }

      const { data } = await axios.delete(
        `${backendUrl}/api/educator/delete-course/${course._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data.success) {
        toast.success(data.message || "Course deleted successfully");
        await fetchEducatorCourses();
        if (fetchAllCourses) {
          await fetchAllCourses();
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    fetchEducatorCourses();
  }, [allCourses]);

  if (!courses) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen flex flex-col items-start justify-between md:p-8 md:pb-0 p-4 pt-8 pb-0 text-left">
      <div className="w-full">
        <h2 className="pb-4 text-lg font-medium text-gray-800">My Courses</h2>
        <div className="flex flex-col items-center max-w-5xl w-full overflow-hidden rounded-md bg-white border border-gray-500/20">
          <table className="md:table-auto table-fixed w-full overflow-hidden">
            <thead className="text-gray-900 border-b border-gray-500/20 text-sm text-left">
              <tr>
                <th className="px-4 py-3 font-semibold truncate">All Courses</th>
                <th className="px-4 py-3 font-semibold truncate">Earnings</th>
                <th className="px-4 py-3 font-semibold truncate">Students</th>
                <th className="px-4 py-3 font-semibold truncate">Status</th>
                <th className="px-4 py-3 font-semibold truncate">Published On</th>
                <th className="px-4 py-3 font-semibold truncate text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-500">
              {courses.map((course) => {
                const hasEnrolled =
                  course.enrolledStudents && course.enrolledStudents.length > 0;

                return (
                  <tr key={course._id} className="border-b border-gray-500/20">
                    <td className="md:px-4 pl-2 md:pl-4 py-3 flex items-center space-x-3 truncate">
                      <img
                        src={course.courseThumbnail}
                        alt="Course Thumbnail"
                        className="w-16 rounded object-cover aspect-video"
                      />
                      <span className="truncate hidden md:block font-medium text-gray-800">
                        {course.courseTitle}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {currency}
                      {Math.floor(
                        (course.enrolledStudents?.length || 0) *
                          (course.coursePrice -
                            (course.discount * course.coursePrice) / 100)
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {course.enrolledStudents ? course.enrolledStudents.length : 0}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                          course.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : course.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {course.status || "approved"}
                      </span>
                      {course.rejectionReason && (
                        <p
                          className="text-xs text-red-500 mt-1 line-clamp-1"
                          title={course.rejectionReason}
                        >
                          {course.rejectionReason}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {new Date(
                        course.createdAt || Date.now()
                      ).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDeleteCourse(course)}
                        disabled={hasEnrolled || deletingId === course._id}
                        title={
                          hasEnrolled
                            ? "Cannot delete course with enrolled students"
                            : "Delete this course"
                        }
                        className={`px-3 py-1.5 rounded text-xs font-medium transition cursor-pointer inline-flex items-center gap-1 ${
                          hasEnrolled
                            ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                            : "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200"
                        }`}
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        {deletingId === course._id ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MyCourses;
