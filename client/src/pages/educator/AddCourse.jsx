import React, { useEffect, useRef, useState } from "react";
import uniqid from "uniqid";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { assets } from "../../assets/assets";
import { toast } from "react-toastify";
import { useAppContext } from "../../context/AppContext";
import axios from "axios";

const AddCourse = () => {
  const { backendUrl, getToken, navigate } = useAppContext();
  const quillRef = useRef(null);
  const editorRef = useRef(null);

  const [courseTitle, setCourseTitle] = useState("");
  const [coursePrice, setCoursePrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [image, setImage] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [currentChapterId, setCurrentChapterId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [lectureDetails, setLectureDetails] = useState({
    lectureTitle: "",
    lectureDuration: "",
    lectureUrl: "",
    isPreviewFree: false,
  });

  const handleChapter = (action, chapterId) => {
    if (action === "add") {
      const title = prompt("Enter Chapter Name:");
      if (title) {
        const newChapter = {
          chapterId: uniqid(),
          chapterTitle: title,
          chapterContent: [],
          collapsed: false,
          chapterOrder:
            chapters.length > 0 ? chapters.slice(-1)[0].chapterOrder + 1 : 1,
        };
        setChapters([...chapters, newChapter]);
      }
    } else if (action === "remove") {
      setChapters(chapters.filter((chapter) => chapter.chapterId !== chapterId));
    } else if (action === "toggle") {
      setChapters(
        chapters.map((chapter) =>
          chapter.chapterId === chapterId
            ? { ...chapter, collapsed: !chapter.collapsed }
            : chapter
        )
      );
    }
  };

  const handleLecture = (action, chapterId, lectureIndex) => {
    if (action === "add") {
      setCurrentChapterId(chapterId);
      setShowPopup(true);
    } else if (action === "remove") {
      setChapters(
        chapters.map((chapter) => {
          if (chapter.chapterId === chapterId) {
            chapter.chapterContent.splice(lectureIndex, 1);
          }
          return chapter;
        })
      );
    }
  };

  const addLecture = () => {
    if (
      !lectureDetails.lectureTitle ||
      !lectureDetails.lectureDuration ||
      !lectureDetails.lectureUrl
    ) {
      toast.error("Please fill all lecture fields");
      return;
    }

    setChapters(
      chapters.map((chapter) => {
        if (chapter.chapterId === currentChapterId) {
          const newLecture = {
            ...lectureDetails,
            lectureOrder:
              chapter.chapterContent.length > 0
                ? chapter.chapterContent.slice(-1)[0].lectureOrder + 1
                : 1,
            lectureId: uniqid(),
          };
          chapter.chapterContent.push(newLecture);
        }
        return chapter;
      })
    );
    setShowPopup(false);
    setLectureDetails({
      lectureTitle: "",
      lectureDuration: "",
      lectureUrl: "",
      isPreviewFree: false,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) {
      toast.error("Thumbnail not selected");
      return;
    }

    if (chapters.length === 0) {
      toast.error("Please add at least one chapter");
      return;
    }

    const courseData = {
      courseTitle,
      courseDescription: quillRef.current.root.innerHTML,
      coursePrice: Number(coursePrice),
      discount: Number(discount),
      courseContent: chapters,
    };

    setSubmitting(true);

    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("courseData", JSON.stringify(courseData));
      formData.append("image", image);

      const { data } = await axios.post(
        `${backendUrl}/api/educator/add-course`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data.success) {
        toast.success(data.message || "Course added successfully!");
        navigate("/educator/my-courses");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!quillRef.current && editorRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: "snow",
        placeholder: "Write course description here...",
      });
    }
  }, []);

  return (
    <div className="h-screen overflow-scroll flex flex-col items-start justify-between md:p-8 md:pb-0 p-4 pt-8 pb-0 text-left">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 max-w-md w-full text-gray-500 pb-16"
      >
        <div className="flex flex-col gap-1">
          <p>Course Title</p>
          <input
            onChange={(e) => setCourseTitle(e.target.value)}
            value={courseTitle}
            type="text"
            placeholder="Type here"
            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <p>Course Description</p>
          <div ref={editorRef} className="bg-white min-h-[140px]"></div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex flex-col gap-1">
            <p>Course Price</p>
            <input
              onChange={(e) => setCoursePrice(e.target.value)}
              value={coursePrice}
              type="number"
              placeholder="0"
              className="outline-none md:py-2.5 py-2 w-28 px-3 rounded border border-gray-500"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <p>Course Thumbnail</p>
            <label
              htmlFor="thumbnailImage"
              className="flex items-center gap-3 cursor-pointer"
            >
              <img
                src={assets.file_upload_icon}
                alt=""
                className="p-3 bg-blue-500 rounded"
              />
              <input
                type="file"
                id="thumbnailImage"
                onChange={(e) => setImage(e.target.files[0])}
                accept="image/*"
                hidden
              />
              <img
                className="max-h-10"
                src={image ? URL.createObjectURL(image) : ""}
                alt=""
              />
            </label>
          </div>

          <div className="flex flex-col gap-1">
            <p>Discount %</p>
            <input
              onChange={(e) => setDiscount(e.target.value)}
              value={discount}
              type="number"
              placeholder="0"
              min={0}
              max={100}
              className="outline-none md:py-2.5 py-2 w-28 px-3 rounded border border-gray-500"
              required
            />
          </div>
        </div>

        {/* Chapters Section */}
        <div>
          {chapters.map((chapter, chapterIndex) => (
            <div
              key={chapter.chapterId}
              className="bg-white border rounded-lg mb-4"
            >
              <div className="flex justify-between items-center p-4 border-b">
                <div className="flex items-center">
                  <img
                    src={assets.dropdown_icon}
                    width={14}
                    alt=""
                    className={`mr-2 cursor-pointer transition-all ${
                      chapter.collapsed && "-rotate-90"
                    }`}
                    onClick={() => handleChapter("toggle", chapter.chapterId)}
                  />
                  <span className="font-semibold text-gray-800">
                    {chapterIndex + 1} {chapter.chapterTitle}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 text-sm">
                    {chapter.chapterContent.length} Lectures
                  </span>
                  <img
                    src={assets.cross_icon}
                    alt=""
                    className="cursor-pointer w-3"
                    onClick={() => handleChapter("remove", chapter.chapterId)}
                  />
                </div>
              </div>

              {!chapter.collapsed && (
                <div className="p-4">
                  {chapter.chapterContent.map((lecture, lectureIndex) => (
                    <div
                      key={lecture.lectureId || lectureIndex}
                      className="flex justify-between items-center mb-2 text-sm text-gray-700 bg-gray-50 p-2 rounded"
                    >
                      <span>
                        {lectureIndex + 1}. {lecture.lectureTitle} -{" "}
                        {lecture.lectureDuration} mins -{" "}
                        <a
                          href={lecture.lectureUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-500 underline"
                        >
                          Link
                        </a>{" "}
                        - {lecture.isPreviewFree ? "Free Preview" : "Paid"}
                      </span>
                      <img
                        src={assets.cross_icon}
                        alt=""
                        className="cursor-pointer w-2.5"
                        onClick={() =>
                          handleLecture("remove", chapter.chapterId, lectureIndex)
                        }
                      />
                    </div>
                  ))}
                  <div
                    className="flex justify-center items-center bg-blue-100 text-blue-700 p-2 rounded-lg cursor-pointer mt-2 text-sm font-medium hover:bg-blue-200 transition"
                    onClick={() => handleLecture("add", chapter.chapterId)}
                  >
                    + Add Lecture
                  </div>
                </div>
              )}
            </div>
          ))}

          <div
            className="flex justify-center items-center bg-blue-100 text-blue-700 p-2 rounded-lg cursor-pointer mt-2 text-sm font-medium hover:bg-blue-200 transition"
            onClick={() => handleChapter("add")}
          >
            + Add Chapter
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className={`text-white w-max py-2.5 px-8 rounded my-4 transition font-medium cursor-pointer ${
            submitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-black hover:bg-gray-800"
          }`}
        >
          {submitting ? "Uploading Course..." : "ADD COURSE"}
        </button>
      </form>

      {/* Modal Popup for Add Lecture */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800/40 z-50">
          <div className="bg-white text-gray-700 p-6 rounded-lg relative w-full max-w-80 shadow-lg">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Add Lecture</h2>
            <img
              onClick={() => setShowPopup(false)}
              src={assets.cross_icon}
              className="absolute top-4 right-4 w-3 cursor-pointer"
              alt="close"
            />

            <div className="mb-2">
              <p className="text-xs mb-1">Lecture Title</p>
              <input
                type="text"
                className="mt-1 block w-full border rounded py-1 px-2 text-sm outline-none"
                value={lectureDetails.lectureTitle}
                onChange={(e) =>
                  setLectureDetails({
                    ...lectureDetails,
                    lectureTitle: e.target.value,
                  })
                }
                placeholder="Enter title"
              />
            </div>

            <div className="mb-2">
              <p className="text-xs mb-1">Duration (minutes)</p>
              <input
                type="number"
                className="mt-1 block w-full border rounded py-1 px-2 text-sm outline-none"
                value={lectureDetails.lectureDuration}
                onChange={(e) =>
                  setLectureDetails({
                    ...lectureDetails,
                    lectureDuration: e.target.value,
                  })
                }
                placeholder="0"
              />
            </div>

            <div className="mb-2">
              <p className="text-xs mb-1">Lecture URL</p>
              <input
                type="text"
                className="mt-1 block w-full border rounded py-1 px-2 text-sm outline-none"
                value={lectureDetails.lectureUrl}
                onChange={(e) =>
                  setLectureDetails({
                    ...lectureDetails,
                    lectureUrl: e.target.value,
                  })
                }
                placeholder="https://..."
              />
            </div>

            <div className="flex gap-2 my-4 items-center">
              <input
                type="checkbox"
                id="previewFree"
                className="cursor-pointer"
                checked={lectureDetails.isPreviewFree}
                onChange={(e) =>
                  setLectureDetails({
                    ...lectureDetails,
                    isPreviewFree: e.target.checked,
                  })
                }
              />
              <label htmlFor="previewFree" className="text-xs cursor-pointer">
                Is Preview Free?
              </label>
            </div>

            <button
              type="button"
              className="w-full bg-blue-600 text-white px-4 py-2 rounded text-sm cursor-pointer hover:bg-blue-700 transition"
              onClick={addLecture}
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddCourse;
