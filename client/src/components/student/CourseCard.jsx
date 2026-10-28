import React from "react";
import { Link } from "react-router-dom";
import { assets } from "../../assets/assets";
import { useAppContext } from "../../context/AppContext";

const CourseCard = ({ course }) => {
  const { currency, calculateRating } = useAppContext();

  const rating = calculateRating(course);
  const discountedPrice = (
    course.coursePrice -
    (course.discount * course.coursePrice) / 100
  ).toFixed(2);

  return (
    <Link
      to={`/course/${course._id}`}
      onClick={() => window.scrollTo(0, 0)}
      className="border border-gray-500/30 pb-6 overflow-hidden rounded-lg"
    >
      <img
        className="w-full aspect-video object-cover object-center"
        src={course.courseThumbnail || assets.course_1_thumbnail}
        alt={course.courseTitle}
      />
      <div className="p-3 text-left">
        <h3 className="text-base font-semibold text-gray-800 line-clamp-2">
          {course.courseTitle}
        </h3>
        <p className="text-gray-500 text-sm mt-1">
          {course.educator?.name || "Learnova Educator"}
        </p>

        <div className="flex items-center space-x-2 mt-2">
          <p className="text-sm font-semibold text-gray-700">{rating}</p>
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
          <p className="text-gray-500 text-xs">
            ({course.courseRatings ? course.courseRatings.length : 0})
          </p>
        </div>

        <p className="text-base font-semibold text-gray-800 mt-2">
          {currency}
          {discountedPrice}{" "}
          {course.discount > 0 && (
            <span className="line-through text-gray-500 text-sm font-normal ml-2">
              {currency}
              {course.coursePrice}
            </span>
          )}
        </p>
      </div>
    </Link>
  );
};

export default CourseCard;
