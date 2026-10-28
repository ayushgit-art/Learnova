import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useClerk, useUser } from "@clerk/clerk-react";
import { useAppContext } from "../../context/AppContext";
import Loading from "../../components/student/Loading";
import Footer from "../../components/student/Footer";
import { assets, dummyCourses } from "../../assets/assets";
import YouTube from "react-youtube";
import humanizeDuration from "humanize-duration";
import { toast } from "react-toastify";
import axios from "axios";

const CourseDetails = () => {
  const { id } = useParams();
  const {
    allCourses,
    calculateRating,
    calculateChapterTime,
    calculateCourseDuration,
    calculateNoOfLectures,
    currency,
    enrolledCourses,
    navigate,
    backendUrl,
    getToken,
  } = useAppContext();

  const { openSignIn } = useClerk();
  const { user } = useUser();

  const [courseData, setCourseData] = useState(null);
  const [openSections, setOpenSections] = useState({});
  const [isAlreadyEnrolled, setIsAlreadyEnrolled] = useState(false);
  const [playerData, setPlayerData] = useState(null);
  const [purchasing, setPurchasing] = useState(false);

  const getYouTubeVideoId = (url) => {
    if (!url) return "";
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : url.split("/").pop().replace("watch?v=", "");
  };

  const fetchCourseData = async () => {
    try {
      if (backendUrl) {
        const { data } = await axios.get(`${backendUrl}/api/course/${id}`);
        if (data.success && data.courseData) {
          setCourseData(data.courseData);
          return;
        }
      }
    } catch (error) {
      // Fallback below
    }

    const findCourse =
      allCourses.find((course) => String(course._id) === String(id)) ||
      dummyCourses.find((course) => String(course._id) === String(id));
    setCourseData(findCourse);
  };

  useEffect(() => {
    fetchCourseData();
  }, [allCourses, id]);

  useEffect(() => {
    if (courseData && enrolledCourses.length > 0) {
      setIsAlreadyEnrolled(
        enrolledCourses.some((item) => item._id === courseData._id)
      );
    }
  }, [courseData, enrolledCourses]);

  const toggleSection = (index) => {
    setOpenSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const enrollCourse = async () => {
    if (!user) {
      return openSignIn();
    }
    if (isAlreadyEnrolled) {
      return navigate(`/player/${courseData._id}`);
    }

    setPurchasing(true);

    try {
      const token = await getToken();
      const { data } = await axios.post(
        `${backendUrl}/api/user/purchase`,
        { courseId: courseData._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success && data.session_url) {
        window.location.replace(data.session_url);
      } else {
        toast.info(data.message || "Simulating enrollment...");
        navigate(`/player/${courseData._id}`);
      }
    } catch (error) {
      // Local fallback for offline mode
      toast.info("Entering course player...");
      navigate(`/player/${courseData._id}`);
    } finally {
      setPurchasing(false);
    }
  };

  if (!courseData) {
    return <Loading />;
  }

  const rating = calculateRating(courseData);
  const discountedPrice = (
    courseData.coursePrice -
    (courseData.discount * courseData.coursePrice) / 100
  ).toFixed(2);

  return (
    <>
      <div className="flex md:flex-row flex-col-reverse gap-10 relative items-start justify-between md:px-36 px-8 md:pt-20 pt-10 text-left">
        <div className="absolute top-0 left-0 w-full h-section-height -z-1 bg-gradient-to-b from-cyan-100/70"></div>

        {/* Left Column */}
        <div className="max-w-xl z-10 text-gray-500">
          <h1 className="md:text-course-details-heading-large text-course-details-heading-small font-semibold text-gray-800">
            {courseData.courseTitle}
          </h1>
          <p
            className="pt-4 md:text-base text-sm"
            dangerouslySetInnerHTML={{
              __html: courseData.courseDescription.slice(0, 200),
            }}
          ></p>

          {/* Review and Ratings */}
          <div className="flex items-center space-x-2 pt-3 pb-1 text-sm">
            <p className="text-gray-800 font-semibold">{rating}</p>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <img
                  key={i}
                  src={i < Math.floor(rating) ? assets.star : assets.star_blank}
                  alt="star"
                  className="w-3.5 h-3.5"
                />
              ))}
            </div>
            <span className="text-blue-600">
              ({courseData.courseRatings ? courseData.courseRatings.length : 0} ratings)
            </span>
            <p>
              {courseData.enrolledStudents ? courseData.enrolledStudents.length : 0} students
            </p>
          </div>

          <div className="text-sm mt-1">
            <p>
              Course by{" "}
              <span className="text-blue-600 font-medium underline">
                {courseData.educatorProfile?.fullName ||
                  courseData.educator?.name ||
                  "Learnova Educator"}
              </span>
              {courseData.educatorProfile?.qualification && (
                <span className="text-gray-500 text-xs ml-1">
                  ({courseData.educatorProfile.qualification})
                </span>
              )}
            </p>
            {courseData.educatorProfile?.bio && (
              <p className="text-xs text-gray-500 mt-1 italic">
                "{courseData.educatorProfile.bio}"
              </p>
            )}
          </div>

          <div className="pt-8 text-gray-800">
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
                            src={assets.play_icon}
                            alt="play icon"
                            className="w-4 h-4 mt-1"
                          />
                          <div className="flex items-center justify-between w-full text-gray-800 text-xs md:text-default">
                            <p>{lecture.lectureTitle}</p>
                            <div className="flex gap-2">
                              {lecture.isPreviewFree && (
                                <p
                                  onClick={() =>
                                    setPlayerData({
                                      videoId: getYouTubeVideoId(lecture.lectureUrl),
                                    })
                                  }
                                  className="text-blue-600 cursor-pointer hover:underline"
                                >
                                  Preview
                                </p>
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
          </div>

          <div className="py-20 text-sm md:text-default">
            <h3 className="text-xl font-semibold text-gray-800">Course Description</h3>
            <div
              className="pt-3 rich-text"
              dangerouslySetInnerHTML={{ __html: courseData.courseDescription }}
            ></div>
          </div>
        </div>

        {/* Right Column Sticky Card */}
        <div className="max-w-course-card z-10 shadow-custom-card rounded-t md:rounded-none overflow-hidden bg-white min-w-[300px] sm:min-w-[420px] md:sticky md:top-8">
          {playerData ? (
            <YouTube
              videoId={playerData.videoId}
              opts={{ playerVars: { autoplay: 1 } }}
              iframeClassName="w-full aspect-video"
            />
          ) : (
            <img
              src={courseData.courseThumbnail || assets.course_1_thumbnail}
              alt=""
              className="w-full aspect-video object-cover"
            />
          )}

          <div className="p-5">
            <div className="flex items-center gap-2">
              <img className="w-3.5" src={assets.time_left_clock_icon} alt="time left" />
              <p className="text-red-500">
                <span className="font-medium">5 days</span> left at this price!
              </p>
            </div>

            <div className="flex gap-3 items-center pt-2">
              <p className="text-gray-800 md:text-4xl text-2xl font-semibold">
                {currency}
                {discountedPrice}
              </p>
              <p className="md:text-lg text-gray-500 line-through">
                {currency}
                {courseData.coursePrice}
              </p>
              <p className="md:text-lg text-red-500">{courseData.discount}% off</p>
            </div>

            <div className="flex items-center text-sm md:text-default gap-4 pt-2 md:pt-4 text-gray-500">
              <div className="flex items-center gap-1">
                <img src={assets.star} alt="star icon" />
                <p>{rating}</p>
              </div>
              <div className="h-4 w-px bg-gray-500/40"></div>
              <div className="flex items-center gap-1">
                <img src={assets.time_clock_icon} alt="clock icon" />
                <p>{calculateCourseDuration(courseData)}</p>
              </div>
              <div className="h-4 w-px bg-gray-500/40"></div>
              <div className="flex items-center gap-1">
                <img src={assets.lesson_icon} alt="lesson icon" />
                <p>{calculateNoOfLectures(courseData)} lessons</p>
              </div>
            </div>

            <button
              onClick={enrollCourse}
              disabled={purchasing}
              className={`md:mt-6 mt-4 w-full py-3 rounded text-white font-medium transition cursor-pointer ${
                purchasing ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {purchasing
                ? "Redirecting to Checkout..."
                : isAlreadyEnrolled
                ? "Already Enrolled"
                : "Enroll Now"}
            </button>

            <div className="pt-6">
              <p className="md:text-xl text-lg font-medium text-gray-800">
                What's in the course?
              </p>
              <ul className="ml-4 pt-2 text-sm md:text-default list-disc text-gray-500 space-y-1">
                <li>Lifetime access with free future updates.</li>
                <li>Step-by-step, hands-on project guidance.</li>
                <li>Downloadable resources and source code.</li>
                <li>Quizzes and assignments to test your knowledge.</li>
                <li>Certificate of completion.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CourseDetails;
