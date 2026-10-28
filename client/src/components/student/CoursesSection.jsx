import React from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import CourseCard from "./CourseCard";

const CoursesSection = () => {
  const { allCourses } = useAppContext();

  return (
    <div className="py-16 md:px-40 px-8 w-full">
      <h2 className="text-3xl font-medium text-gray-800 text-center">
        Learn from the best
      </h2>
      <p className="text-sm md:text-base text-gray-500 mt-3 text-center max-w-xl mx-auto">
        Discover our top-rated courses across diverse disciplines, from coding and design
        to business and analytics.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 px-4 md:px-0 md:my-16 my-10 gap-4">
        {allCourses &&
          allCourses.slice(0, 4).map((course, index) => (
            <CourseCard key={course._id || index} course={course} />
          ))}
      </div>

      <div className="text-center">
        <Link
          to="/course-list"
          onClick={() => window.scrollTo(0, 0)}
          className="text-gray-500 border border-gray-500/30 px-10 py-3 rounded hover:bg-gray-50 transition"
        >
          Show all courses
        </Link>
      </div>
    </div>
  );
};

export default CoursesSection;
