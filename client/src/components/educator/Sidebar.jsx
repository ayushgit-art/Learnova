import React from "react";
import { NavLink } from "react-router-dom";
import { assets } from "../../assets/assets";
import { useAppContext } from "../../context/AppContext";
import { useUser } from "@clerk/clerk-react";

const Sidebar = () => {
  const { user } = useUser();
  const { isAdmin, userData } = useAppContext();

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

  const menuItems = [
    { name: "Dashboard", path: "/educator", icon: assets.home_icon },
    { name: "Add Course", path: "/educator/add-course", icon: assets.add_icon },
    { name: "My Courses", path: "/educator/my-courses", icon: assets.my_course_icon },
    { name: "Student Enrolled", path: "/educator/student-enrolled", icon: assets.person_tick_icon },
  ];

  return (
    <div className="md:w-64 w-16 border-r min-h-screen text-base border-gray-500/20 py-2 flex flex-col justify-between">
      <div>
        {menuItems.map((item) => (
          <NavLink
            to={item.path}
            key={item.name}
            end={item.path === "/educator"}
            className={({ isActive }) =>
              `flex items-center md:flex-row flex-col md:justify-start justify-center py-3.5 md:px-10 gap-3 ${
                isActive
                  ? "bg-indigo-50 border-r-[6px] border-indigo-500/90 text-indigo-700 font-medium"
                  : "hover:bg-gray-100/90 border-r-[6px] border-white text-gray-700"
              }`
            }
          >
            <img src={item.icon} alt={item.name} className="w-6 h-6" />
            <p className="md:block hidden text-center">{item.name}</p>
          </NavLink>
        ))}
      </div>

      {hasAdmin && (
        <div className="border-t border-gray-200 pt-2 mb-4">
          <NavLink
            to="/admin"
            className="flex items-center md:flex-row flex-col md:justify-start justify-center py-3.5 md:px-10 gap-3 border-r-[6px] border-white text-purple-700 hover:bg-purple-50 font-medium"
          >
            <span className="text-xl">🛡️</span>
            <p className="md:block hidden text-center">Admin Panel</p>
          </NavLink>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
