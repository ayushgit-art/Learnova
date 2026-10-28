import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useClerk, UserButton, useUser } from "@clerk/clerk-react";
import { assets } from "../../assets/assets";
import { useAppContext } from "../../context/AppContext";

const Navbar = () => {
  const location = useLocation();
  const isCoursesListPage = location.pathname.includes("/course-list");
  const { openSignIn } = useClerk();
  const { user } = useUser();
  const { navigate, isEducator, isAdmin, userData } = useAppContext();

  // Check roles directly from BOTH Clerk user and backend userData
  const clerkRaw = user?.publicMetadata?.role;
  const clerkRoles = Array.isArray(clerkRaw)
    ? clerkRaw
    : clerkRaw
    ? [clerkRaw]
    : [];

  const backendRaw = userData?.role;
  const backendRoles = Array.isArray(backendRaw)
    ? backendRaw
    : backendRaw
    ? [backendRaw]
    : [];

  const allRoles = [...new Set([...clerkRoles, ...backendRoles])];
  const hasAdmin = isAdmin || allRoles.includes("admin");
  const hasEducator = isEducator || allRoles.includes("educator") || hasAdmin;

  return (
    <div
      className={`flex items-center justify-between px-4 sm:px-10 md:px-14 lg:px-36 border-b border-gray-500 py-4 ${
        isCoursesListPage ? "bg-white" : "bg-cyan-100/70"
      }`}
    >
      <img
        onClick={() => navigate("/")}
        src={assets.logo}
        alt="Learnova Logo"
        className="w-28 lg:w-32 cursor-pointer"
      />
      <div className="hidden md:flex items-center gap-5 text-gray-500">
        <div className="flex items-center gap-5">
          {user && (
            <>
              {hasAdmin && (
                <>
                  <Link
                    to="/admin"
                    className="cursor-pointer text-purple-600 font-medium hover:text-purple-700 transition"
                  >
                    Admin Panel
                  </Link>
                  |
                </>
              )}
              <button
                onClick={() =>
                  navigate(hasEducator ? "/educator" : "/become-educator")
                }
                className="cursor-pointer hover:text-gray-800 transition"
              >
                {hasEducator ? "Educator Dashboard" : "Become Educator"}
              </button>
              |
              <Link to="/my-enrollments" className="hover:text-gray-800 transition">
                My Enrollments
              </Link>
            </>
          )}
        </div>
        {user ? (
          <UserButton />
        ) : (
          <button
            onClick={() => openSignIn()}
            className="bg-blue-600 text-white px-5 py-2 rounded-full cursor-pointer hover:bg-blue-700 transition"
          >
            Create Account
          </button>
        )}
      </div>

      {/* Mobile view */}
      <div className="md:hidden flex items-center gap-2 sm:gap-5 text-gray-500">
        <div className="flex items-center gap-1 sm:gap-2 max-sm:text-xs">
          {user && (
            <>
              {hasAdmin && (
                <>
                  <Link
                    to="/admin"
                    className="cursor-pointer text-purple-600 font-medium"
                  >
                    Admin Panel
                  </Link>
                  |
                </>
              )}
              <button
                onClick={() =>
                  navigate(hasEducator ? "/educator" : "/become-educator")
                }
                className="cursor-pointer"
              >
                {hasEducator ? "Educator" : "Become Educator"}
              </button>
              |
              <Link to="/my-enrollments">My Enrollments</Link>
            </>
          )}
        </div>
        {user ? (
          <UserButton />
        ) : (
          <button
            onClick={() => openSignIn()}
            className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs cursor-pointer hover:bg-blue-700 transition"
          >
            Sign In
          </button>
        )}
      </div>
    </div>
  );
};

export default Navbar;
