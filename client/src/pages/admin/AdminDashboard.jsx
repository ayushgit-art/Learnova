import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import Loading from "../../components/student/Loading";
import { assets } from "../../assets/assets";

const AdminDashboard = () => {
  const { backendUrl, getToken, currency, fetchAllCourses } = useAppContext();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [rejectModalCourse, setRejectModalCourse] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;

      const { data } = await axios.get(`${backendUrl}/api/admin/courses`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setCourses(data.courses);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleApprove = async (courseId) => {
    try {
      const token = await getToken();
      const { data } = await axios.post(
        `${backendUrl}/api/admin/approve-course`,
        { courseId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success("Course approved and published!");
        setCourses((prev) =>
          prev.map((c) =>
            c._id === courseId
              ? { ...c, status: "approved", isPublished: true, rejectionReason: "" }
              : c
          )
        );
        if (fetchAllCourses) {
          await fetchAllCourses();
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const handleReject = async () => {
    if (!rejectModalCourse) return;
    try {
      const token = await getToken();
      const { data } = await axios.post(
        `${backendUrl}/api/admin/reject-course`,
        { courseId: rejectModalCourse._id, rejectionReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.info("Course rejected / unpublished.");
        setCourses((prev) =>
          prev.map((c) =>
            c._id === rejectModalCourse._id
              ? {
                  ...c,
                  status: "rejected",
                  isPublished: false,
                  rejectionReason:
                    rejectionReason || "Course does not meet platform guidelines.",
                }
              : c
          )
        );
        if (fetchAllCourses) {
          await fetchAllCourses();
        }
        setRejectModalCourse(null);
        setRejectionReason("");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const pendingCourses = courses.filter((c) => c.status === "pending");
  const approvedCourses = courses.filter((c) => c.status === "approved");
  const rejectedCourses = courses.filter((c) => c.status === "rejected");

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12 text-left">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Admin Course Review</h1>
            <p className="text-gray-500 text-sm mt-1">
              Audit course curriculums, approve quality submissions, and manage live published courses.
            </p>
          </div>

          {/* Clean Segmented Tab Switcher with Badges */}
          <div className="flex bg-white rounded-lg border border-gray-200 p-1 shadow-sm overflow-x-auto">
            <button
              onClick={() => setActiveTab("pending")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition cursor-pointer ${
                activeTab === "pending"
                  ? "bg-yellow-500 text-white shadow"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Pending Review
              <span
                className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                  activeTab === "pending"
                    ? "bg-yellow-600 text-white"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {pendingCourses.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("approved")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition cursor-pointer ${
                activeTab === "approved"
                  ? "bg-green-600 text-white shadow"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Approved & Live
              <span
                className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                  activeTab === "approved"
                    ? "bg-green-700 text-white"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {approvedCourses.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("rejected")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition cursor-pointer ${
                activeTab === "rejected"
                  ? "bg-red-600 text-white shadow"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Rejected
              <span
                className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                  activeTab === "rejected"
                    ? "bg-red-700 text-white"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {rejectedCourses.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("all")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition cursor-pointer ${
                activeTab === "all"
                  ? "bg-blue-600 text-white shadow"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All Sections
              <span
                className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                  activeTab === "all"
                    ? "bg-blue-700 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {courses.length}
              </span>
            </button>
          </div>
        </div>

        {/* Section 1: Pending Courses */}
        {(activeTab === "pending" || activeTab === "all") && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                <h2 className="text-xl font-bold text-gray-800">
                  Pending Courses Awaiting Review
                </h2>
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                  {pendingCourses.length}
                </span>
              </div>
              <p className="text-xs text-gray-500 hidden sm:block">
                Courses submitted by educators awaiting administrative approval
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-custom-card border border-gray-200 overflow-hidden">
              {pendingCourses.length === 0 ? (
                <div className="py-12 text-center text-gray-500 bg-white">
                  <div className="text-3xl mb-2">🎉</div>
                  <p className="text-base font-medium text-gray-700">
                    No pending courses awaiting review
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    All submitted educator courses have been reviewed.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-100/70 border-b text-xs font-semibold uppercase text-gray-600">
                      <tr>
                        <th className="px-6 py-4">Course</th>
                        <th className="px-6 py-4">Educator</th>
                        <th className="px-6 py-4">Price</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-sm">
                      {pendingCourses.map((course) => (
                        <tr key={course._id} className="hover:bg-gray-50/80 transition">
                          <td className="px-6 py-4 flex items-center space-x-4">
                            <img
                              src={course.courseThumbnail || assets.course_1_thumbnail}
                              alt=""
                              className="w-16 h-10 rounded object-cover aspect-video"
                            />
                            <div>
                              <p className="font-semibold text-gray-800 line-clamp-1">
                                {course.courseTitle}
                              </p>
                              <p className="text-xs text-gray-500">
                                {course.courseContent?.length || 0} chapters
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-800">
                              {course.educatorProfile?.fullName ||
                                course.educator?.name ||
                                "Educator"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {course.educatorProfile?.qualification ||
                                course.educator?.email}
                            </p>
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-700">
                            {currency}
                            {course.coursePrice}
                            {course.discount > 0 && (
                              <span className="text-xs text-red-500 ml-1">
                                ({course.discount}% off)
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 capitalize">
                              Pending
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => setSelectedCourse(course)}
                                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded text-xs font-medium transition cursor-pointer"
                              >
                                Preview
                              </button>
                              <button
                                onClick={() => handleApprove(course._id)}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-xs font-medium transition cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setRejectModalCourse(course);
                                  setRejectionReason("");
                                }}
                                className="bg-red-50 hover:bg-red-600 hover:text-white text-red-600 border border-red-200 px-3 py-1.5 rounded text-xs font-medium transition cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 2: Approved Courses */}
        {(activeTab === "approved" || activeTab === "all") && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                <h2 className="text-xl font-bold text-gray-800">
                  Approved & Live Courses
                </h2>
                <span className="bg-green-100 text-green-800 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                  {approvedCourses.length}
                </span>
              </div>
              <p className="text-xs text-gray-500 hidden sm:block">
                Active published courses available for enrollment across the platform
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-custom-card border border-gray-200 overflow-hidden">
              {approvedCourses.length === 0 ? (
                <div className="py-12 text-center text-gray-500 bg-white">
                  <div className="text-3xl mb-2">📚</div>
                  <p className="text-base font-medium text-gray-700">
                    No approved courses yet
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Approve submitted courses to publish them live.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-100/70 border-b text-xs font-semibold uppercase text-gray-600">
                      <tr>
                        <th className="px-6 py-4">Course</th>
                        <th className="px-6 py-4">Educator</th>
                        <th className="px-6 py-4">Price</th>
                        <th className="px-6 py-4">Enrolled Students</th>
                        <th className="px-6 py-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-sm">
                      {approvedCourses.map((course) => (
                        <tr key={course._id} className="hover:bg-gray-50/80 transition">
                          <td className="px-6 py-4 flex items-center space-x-4">
                            <img
                              src={course.courseThumbnail || assets.course_1_thumbnail}
                              alt=""
                              className="w-16 h-10 rounded object-cover aspect-video"
                            />
                            <div>
                              <p className="font-semibold text-gray-800 line-clamp-1">
                                {course.courseTitle}
                              </p>
                              <span className="inline-flex items-center text-xs text-green-600 font-medium">
                                ● Live & Published
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-800">
                              {course.educatorProfile?.fullName ||
                                course.educator?.name ||
                                "Educator"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {course.educatorProfile?.qualification ||
                                course.educator?.email}
                            </p>
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-700">
                            {currency}
                            {course.coursePrice}
                            {course.discount > 0 && (
                              <span className="text-xs text-red-500 ml-1">
                                ({course.discount}% off)
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-800">
                            {course.enrolledStudents?.length || 0} learners
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => setSelectedCourse(course)}
                                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded text-xs font-medium transition cursor-pointer"
                              >
                                Preview
                              </button>
                              <button
                                onClick={() => {
                                  setRejectModalCourse(course);
                                  setRejectionReason("");
                                }}
                                className="bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-700 border border-amber-300 px-3 py-1.5 rounded text-xs font-medium transition cursor-pointer"
                                title="Unpublish this course and provide feedback to educator"
                              >
                                Reject / Unpublish
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 3: Rejected Courses */}
        {(activeTab === "rejected" || activeTab === "all") && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <h2 className="text-xl font-bold text-gray-800">Rejected Courses</h2>
                <span className="bg-red-100 text-red-800 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                  {rejectedCourses.length}
                </span>
              </div>
              <p className="text-xs text-gray-500 hidden sm:block">
                Courses not meeting guidelines with feedback provided to educators
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-custom-card border border-gray-200 overflow-hidden">
              {rejectedCourses.length === 0 ? (
                <div className="py-12 text-center text-gray-500 bg-white">
                  <div className="text-3xl mb-2">✨</div>
                  <p className="text-base font-medium text-gray-700">
                    No rejected courses
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    No courses have been rejected or unpublished.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-100/70 border-b text-xs font-semibold uppercase text-gray-600">
                      <tr>
                        <th className="px-6 py-4">Course</th>
                        <th className="px-6 py-4">Educator</th>
                        <th className="px-6 py-4">Rejection Reason</th>
                        <th className="px-6 py-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-sm">
                      {rejectedCourses.map((course) => (
                        <tr key={course._id} className="hover:bg-gray-50/80 transition">
                          <td className="px-6 py-4 flex items-center space-x-4">
                            <img
                              src={course.courseThumbnail || assets.course_1_thumbnail}
                              alt=""
                              className="w-16 h-10 rounded object-cover aspect-video"
                            />
                            <div>
                              <p className="font-semibold text-gray-800 line-clamp-1">
                                {course.courseTitle}
                              </p>
                              <span className="inline-flex items-center text-xs text-red-600 font-medium">
                                ● Rejected
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-800">
                              {course.educatorProfile?.fullName ||
                                course.educator?.name ||
                                "Educator"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {course.educatorProfile?.qualification ||
                                course.educator?.email}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700 max-w-md">
                              {course.rejectionReason ||
                                "Course does not meet platform guidelines."}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => setSelectedCourse(course)}
                                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded text-xs font-medium transition cursor-pointer"
                              >
                                Preview
                              </button>
                              <button
                                onClick={() => handleApprove(course._id)}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-xs font-medium transition cursor-pointer"
                              >
                                Approve
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Curriculum & Lecture Preview Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  {selectedCourse.courseTitle}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Instructor:{" "}
                  {selectedCourse.educatorProfile?.fullName ||
                    selectedCourse.educator?.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedCourse(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Description</h4>
                <div
                  className="rich-text text-sm border p-3 rounded bg-gray-50 max-h-40 overflow-y-auto"
                  dangerouslySetInnerHTML={{
                    __html: selectedCourse.courseDescription,
                  }}
                ></div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Curriculum</h4>
                <div className="space-y-3">
                  {selectedCourse.courseContent?.map((chapter, cIdx) => (
                    <div
                      key={chapter.chapterId || cIdx}
                      className="border rounded-lg p-3"
                    >
                      <p className="font-medium text-gray-800 text-sm">
                        Chapter {cIdx + 1}: {chapter.chapterTitle}
                      </p>
                      <ul className="mt-2 space-y-1.5 text-xs text-gray-600 pl-4 list-disc">
                        {chapter.chapterContent?.map((lecture, lIdx) => (
                          <li key={lecture.lectureId || lIdx}>
                            <span className="font-medium">
                              {lecture.lectureTitle}
                            </span>{" "}
                            ({lecture.lectureDuration} mins) -{" "}
                            {lecture.lectureUrl && (
                              <a
                                href={lecture.lectureUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 underline"
                              >
                                View Video Link
                              </a>
                            )}
                            {lecture.isPreviewFree && (
                              <span className="ml-2 text-green-600 font-semibold">
                                [Free Preview]
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setSelectedCourse(null)}
                className="px-5 py-2 bg-gray-200 text-gray-800 rounded text-sm hover:bg-gray-300 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject / Unpublish Reason Modal */}
      {rejectModalCourse && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              {rejectModalCourse.status === "approved"
                ? "Unpublish & Reject Course"
                : "Reject Course"}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Provide feedback for educator on{" "}
              <span className="font-semibold">{rejectModalCourse.courseTitle}</span>:
            </p>
            <textarea
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Video audio quality is low, or syllabus needs more practical exercises..."
              className="w-full border rounded-lg p-3 text-sm outline-none focus:border-red-500 mb-4"
            ></textarea>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setRejectModalCourse(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition cursor-pointer font-medium"
              >
                Confirm {rejectModalCourse.status === "approved" ? "Unpublish" : "Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
