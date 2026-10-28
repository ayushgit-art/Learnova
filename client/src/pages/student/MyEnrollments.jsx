import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { Line } from "rc-progress";
import Footer from "../../components/student/Footer";
import { Link } from "react-router-dom";
import axios from "axios";

const MyEnrollments = () => {
  const {
    enrolledCourses,
    calculateCourseDuration,
    calculateNoOfLectures,
    navigate,
    backendUrl,
    getToken,
    fetchUserEnrolledCourses,
  } = useAppContext();

  const [progressMap, setProgressMap] = useState({});

  const fetchProgressData = async () => {
    try {
      const token = await getToken();
      if (!token || !enrolledCourses || enrolledCourses.length === 0) return;

      const progressData = {};

      await Promise.all(
        enrolledCourses.map(async (course) => {
          try {
            const { data } = await axios.post(
              `${backendUrl}/api/user/get-course-progress`,
              { courseId: course._id },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            const total = calculateNoOfLectures(course) || 4;
            const completed = data.progressData?.lectureCompleted?.length || 0;

            progressData[course._id] = {
              lectureCompleted: completed,
              totalLectures: total,
            };
          } catch {
            progressData[course._id] = {
              lectureCompleted: 0,
              totalLectures: calculateNoOfLectures(course) || 4,
            };
          }
        })
      );

      setProgressMap(progressData);
    } catch (error) {
      console.error("Progress fetch error:", error);
    }
  };

  useEffect(() => {
    if (fetchUserEnrolledCourses) {
      fetchUserEnrolledCourses();
    }
  }, []);

  useEffect(() => {
    if (enrolledCourses.length > 0) {
      fetchProgressData();
    }
  }, [enrolledCourses]);

  return (
    <>
      <div className="md:px-36 px-8 pt-10 text-left min-h-screen">
        <h1 className="text-2xl font-semibold text-gray-800">My Enrollments</h1>

        {enrolledCourses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-gray-500 text-lg mb-4">
              You have not enrolled in any courses yet.
            </p>
            <Link
              to="/course-list"
              className="bg-blue-600 text-white px-6 py-2.5 rounded hover:bg-blue-700 transition"
            >
              Explore Courses
            </Link>
          </div>
        ) : (
          <table className="md:table-auto table-fixed w-full overflow-hidden border mt-10 rounded">
            <thead className="text-gray-900 border-b border-gray-500/20 text-sm text-left max-sm:hidden bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-semibold truncate">Course</th>
                <th className="px-4 py-3 font-semibold truncate">Duration</th>
                <th className="px-4 py-3 font-semibold truncate">Completed</th>
                <th className="px-4 py-3 font-semibold truncate">Status</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {enrolledCourses.map((course, index) => {
                const totalLecs =
                  progressMap[course._id]?.totalLectures ??
                  calculateNoOfLectures(course) ??
                  4;
                const completedLecs =
                  progressMap[course._id]?.lectureCompleted ?? 0;
                const percent = Math.min(
                  Math.round((completedLecs * 100) / (totalLecs || 1)),
                  100
                );
                const isCompleted = percent === 100;

                return (
                  <tr
                    key={course._id || index}
                    className="border-b border-gray-500/20"
                  >
                    <td className="md:px-4 pl-2 md:pl-4 py-3 flex items-center space-x-3">
                      <img
                        src={course.courseThumbnail}
                        alt=""
                        className="w-14 sm:w-24 md:w-28 rounded object-cover aspect-video"
                      />
                      <div className="flex-1">
                        <p className="mb-1 max-sm:text-sm font-medium">
                          {course.courseTitle}
                        </p>
                        <Line
                          strokeWidth={2}
                          percent={percent}
                          strokeColor="#2563eb"
                          className="bg-gray-300 rounded-full"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 max-sm:hidden">
                      {calculateCourseDuration(course)}
                    </td>
                    <td className="px-4 py-3 max-sm:hidden">
                      {completedLecs} / {totalLecs} <span>Lectures</span>
                    </td>
                    <td className="px-4 py-3 max-sm:text-right">
                      <button
                        onClick={() => navigate(`/player/${course._id}`)}
                        className={`px-3 sm:px-5 py-1.5 sm:py-2 max-sm:text-xs text-white rounded cursor-pointer transition ${
                          isCompleted
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-blue-600 hover:bg-blue-700"
                        }`}
                      >
                        {isCompleted ? "Completed" : "Ongoing"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <Footer />
    </>
  );
};

export default MyEnrollments;
