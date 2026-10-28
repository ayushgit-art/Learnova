import React from "react";
import { Link } from "react-router-dom";
import { assets } from "../../assets/assets";

const CallToAction = () => {
  return (
    <div className="flex flex-col items-center gap-4 pt-10 pb-24 px-8 md:px-0">
      <h2 className="text-xl md:text-4xl text-gray-800 font-semibold">
        Learn anything, anytime, anywhere
      </h2>
      <p className="text-gray-500 sm:text-sm text-center max-w-xl">
        Start learning today with access to thousands of high-quality courses taught by industry experts.
      </p>
      <div className="flex items-center font-medium gap-6 mt-4">
        <Link
          to="/course-list"
          onClick={() => window.scrollTo(0, 0)}
          className="px-10 py-3 rounded-md text-white bg-blue-600 hover:bg-blue-700 transition"
        >
          Get started
        </Link>
        <button
          onClick={() => window.scrollTo(0, 0)}
          className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition"
        >
          Learn more <img src={assets.arrow_icon} alt="arrow_icon" />
        </button>
      </div>
    </div>
  );
};

export default CallToAction;
