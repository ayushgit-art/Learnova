import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import { assets } from "../../assets/assets";
import humanizeDuration from "humanize-duration";
import YouTube from "react-youtube";
import Footer from "../../components/student/Footer";
import Rating from "../../components/student/Rating";
import Loading from "../../components/student/Loading";
import { toast } from "react-toastify";
import axios from "axios";

const Player = () => {
  const { courseId } = useParams();
  const { allCourses, calculateChapterTime, backendUrl, getToken, userData } =
    useAppContext();

  const [courseData, setCourseData] = useState(null);
  const [openSections, setOpenSections] = useState({});
  const [playerData, setPlayerData] = useState(null);
  const [progressData, setProgressData] = useState({ lectureCompleted: [] });
  const [initialRating, setInitialRating] = useState(0);

  const getYouTubeVideoId = (url) => {
    if (!url) return "";
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : url.split("/").pop().replace("watch?v=", "");
  };

  const getCourseData = async () => {
    try {
      if (backendUrl) {
        const { data } = await axios.get(`${backendUrl}/api/course/${courseId}`);
        if (data.success && data.courseData) {
          setCourseData(data.courseData);
          if (data.courseData.courseContent?.[0]?.chapterContent?.[0]) {
            const first = data.courseData.courseContent[0].chapterContent[0];
            setPlayerData({
              ...first,
              chapter: 1,
              lecture: 1,
              videoId: getYouTubeVideoId(first.lectureUrl),
            });
          }
          return;
        }
      }
    } catch (e) {
      // Fallback
    }

    const findCourse = allCourses.find((course) => course._id === courseId);
    if (findCourse) {
      setCourseData(findCourse);
      if (findCourse.courseContent?.[0]?.chapterContent?.[0]) {
        const firstLecture = findCourse.courseContent[0].chapterContent[0];
        setPlayerData({
          ...firstLecture,
          chapter: 1,
          lecture: 1,
          videoId: getYouTubeVideoId(firstLecture.lectureUrl),
        });
      }
    }
  };

  const fetchCourseProgress = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const { data } = await axios.post(
        `${backendUrl}/api/user/get-course-progress`,
        { courseId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success && data.progressData) {
        setProgressData(data.progressData);
      }
    } catch (error) {
      console.log("Progress fetch fallback");
    }
  };

  useEffect(() => {
    getCourseData();
    fetchCourseProgress();
  }, [allCourses, courseId]);

  useEffect(() => {
    if (courseData && userData && courseData.courseRatings) {
      const userRating = courseData.courseRatings.find(
        (r) => r.userId === userData._id
      );
      if (userRating) {
        setInitialRating(userRating.rating);
      }
    }
  }, [courseData, userData]);

  const toggleSection = (index) => {
    setOpenSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const markLectureAsCompleted = async (lectureId) => {
    try {
      const token = await getToken();

      if (token) {
        const { data } = await axios.post(
          `${backendUrl}/api/user/update-course-progress`,
          { courseId, lectureId },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (data.success) {
          toast.success(data.message || "Lecture updated");
        }
      }

      if (!progressData.lectureCompleted.includes(lectureId)) {
        setProgressData((prev) => ({
          ...prev,
          lectureCompleted: [...prev.lectureCompleted, lectureId],
        }));
      } else {
        setProgressData((prev) => ({
          ...prev,
          lectureCompleted: prev.lectureCompleted.filter((id) => id !== lectureId),
        }));
      }
    } catch (error) {
      toast.info("Lecture status updated locally");
    }
  };

  const handleRateCourse = async (ratingValue) => {
    setInitialRating(ratingValue);
    try {
      const token = await getToken();
      if (token) {
        const { data } = await axios.post(
          `${backendUrl}/api/user/add-rating`,
          { courseId, rating: ratingValue },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (data.success) {
          toast.success(data.message || "Rating added!");
          return;
        }
      }
    } catch (error) {
      // Local fallback
    }
    toast.success(`You rated this course ${ratingValue} star${ratingValue > 1 ? "s" : ""}!`);
  };

  if (!courseData) {
    return <Loading />;
  }

  const isCurrentCompleted =
    playerData && progressData.lectureCompleted.includes(playerData.lectureId);

  return (
    <>
      <div className="p-4 sm:p-10 flex flex-col-reverse md:grid md:grid-cols-2 gap-10 md:px-36 min-h-screen">
        {/* Left column: Course Structure & Rating */}
        <div className="text-gray-800 text-left">
          <h2 className="text-xl font-semibold">Course Structure</h2>

          <div className="pt-5">
            {courseData.courseContent?.map((chapter, index) => (
              <div
                key={index}
                className="border border-gray-300 bg-white mb-2 rounded"
              >
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                  onClick={() => toggleSection(index)}
                >
                  <div className="flex items-center gap-2">
                    <img
                      className={`transform transition-transform ${
                        openSections[index] ? "rotate-180" : ""
                      }`}
                      src={assets.down_arrow_icon}
                      alt="arrow"
                    />
                    <p className="font-medium md:text-base text-sm">
                      {chapter.chapterTitle}
                    </p>
                  </div>
                  <p className="text-sm md:text-default">
                    {chapter.chapterContent.length} lectures -{" "}
                    {calculateChapterTime(chapter)}
                  </p>
                </div>

                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openSections[index] ? "max-h-96" : "max-h-0"
                  }`}
                >
                  <ul className="list-disc md:pl-10 pl-4 pr-4 py-2 text-gray-600 border-t border-gray-300">
                    {chapter.chapterContent.map((lecture, i) => (
                      <li key={i} className="flex items-start gap-2 py-1">
                        <img
                          src={
                            progressData.lectureCompleted.includes(
                              lecture.lectureId
                            )
                              ? assets.blue_tick_icon
                              : assets.play_icon
                          }
                          alt="icon"
                          className="w-4 h-4 mt-1"
                        />
                        <div className="flex items-center justify-between w-full text-gray-800 text-xs md:text-default">
                          <p>{lecture.lectureTitle}</p>
                          <div className="flex gap-2 items-center">
                            {lecture.lectureUrl && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPlayerData({
                                    ...lecture,
                                    chapter: index + 1,
                                    lecture: i + 1,
                                    videoId: getYouTubeVideoId(lecture.lectureUrl),
                                  })
                                }
                                className="text-blue-600 cursor-pointer hover:underline"
                              >
                                Watch
                              </button>
                            )}
                            <p>
                              {humanizeDuration(
                                lecture.lectureDuration * 60 * 1000,
                                { units: ["h", "m"] }
                              )}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 py-3 mt-10">
            <h3 className="text-xl font-bold">Rate this Course:</h3>
            <Rating initialRating={initialRating} onRate={handleRateCourse} />
          </div>
        </div>

        {/* Right column: Video Player & Mark Complete */}
        <div className="md:mt-10 text-left">
          {playerData ? (
            <div>
              <YouTube
                videoId={playerData.videoId}
                iframeClassName="w-full aspect-video"
              />
              <div className="flex justify-between items-center mt-3">
                <p className="text-xl font-semibold">{playerData.lectureTitle}</p>
                <button
                  onClick={() => markLectureAsCompleted(playerData.lectureId)}
                  className={`px-4 py-2 rounded text-white font-medium cursor-pointer transition ${
                    isCurrentCompleted
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {isCurrentCompleted ? "Completed" : "Mark Complete"}
                </button>
              </div>
            </div>
          ) : (
            <img
              src={courseData ? courseData.courseThumbnail : ""}
              alt=""
              className="w-full aspect-video object-cover rounded"
            />
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Player;
