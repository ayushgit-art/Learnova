import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import SearchBar from "../../components/student/SearchBar";
import CourseCard from "../../components/student/CourseCard";
import Footer from "../../components/student/Footer";
import { assets } from "../../assets/assets";

const CoursesList = () => {
  const { input } = useParams();
  const { allCourses, navigate } = useAppContext();
  const [filteredCourse, setFilteredCourse] = useState([]);

  useEffect(() => {
    if (allCourses && allCourses.length > 0) {
      const tempCourses = allCourses.slice();

      if (input) {
        setFilteredCourse(
          tempCourses.filter((item) =>
            item.courseTitle.toLowerCase().includes(input.toLowerCase())
          )
        );
      } else {
        setFilteredCourse(tempCourses);
      }
    }
  }, [allCourses, input]);

  return (
    <>
      <div className="relative md:px-36 px-8 pt-20 text-left min-h-screen">
        <div className="flex md:flex-row flex-col gap-6 items-start justify-between w-full">
          <div>
            <h1 className="text-4xl font-semibold text-gray-800">Course List</h1>
            <p className="text-gray-500">
              <span
                onClick={() => navigate("/")}
                className="text-blue-600 cursor-pointer hover:underline"
              >
                Home
              </span>{" "}
              / <span>Course List</span>
            </p>
          </div>
          <SearchBar data={input} />
        </div>

        {input && (
          <div className="inline-flex items-center gap-4 px-4 py-2 border mt-8 -mb-8 text-gray-600 bg-gray-50 rounded">
            <p>{input}</p>
            <img
              src={assets.cross_icon}
              alt="clear filter"
              className="cursor-pointer w-3"
              onClick={() => navigate("/course-list")}
            />
          </div>
        )}

        {filteredCourse.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 my-16 gap-3 px-2 md:p-0">
            {filteredCourse.map((course, index) => (
              <CourseCard key={course._id || index} course={course} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-gray-500">
            <p className="text-lg">No courses found matching "{input}".</p>
            <button
              onClick={() => navigate("/course-list")}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition cursor-pointer"
            >
              View All Courses
            </button>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default CoursesList;
