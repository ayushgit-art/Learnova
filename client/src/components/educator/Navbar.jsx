import React from "react";
import { assets } from "../../assets/assets";
import { UserButton, useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";

const Navbar = () => {
  const { user } = useUser();
  const { isAdmin, userData } = useAppContext();

  // Check admin role from BOTH Clerk user and backend userData
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

  const hasAdmin =
    isAdmin || clerkRoles.includes("admin") || backendRoles.includes("admin");

  return (
    <div className="flex items-center justify-between px-4 md:px-8 border-b border-gray-500 py-3 bg-white">
      <Link to="/">
        <img src={assets.logo} alt="Logo" className="w-28 lg:w-32" />
      </Link>
      <div className="flex items-center gap-4 sm:gap-5 text-gray-500 relative">
        <p className="max-sm:hidden">Hi! {user ? user.fullName : "Developers"}</p>
        {hasAdmin && (
          <Link
            to="/admin"
            className="text-purple-600 font-medium hover:text-purple-700 transition px-3 py-1 bg-purple-50 rounded border border-purple-200 text-sm"
          >
            Admin Panel
          </Link>
        )}
        {user ? (
          <UserButton />
        ) : (
          <img className="max-w-8" src={assets.profile_img} alt="profile" />
        )}
      </div>
    </div>
  );
};

export default Navbar;
