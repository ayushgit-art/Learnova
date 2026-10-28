import { clerkClient } from "@clerk/express";

// Middleware to protect educator routes
export const protectEducator = async (req, res, next) => {
  try {
    const userId =
      typeof req.auth === "function" ? req.auth().userId : req.auth?.userId;
    if (!userId) {
      return res.json({
        success: false,
        message: "Not authenticated. Check CLERK keys in server/.env",
      });
    }

    const response = await clerkClient.users.getUser(userId);
    const rawRole = response.publicMetadata?.role;
    const roles = Array.isArray(rawRole) ? rawRole : rawRole ? [rawRole] : [];

    if (!roles.includes("educator") && !roles.includes("admin")) {
      return res.json({ success: false, message: "Unauthorized Access" });
    }

    next();
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// Middleware to protect admin routes
export const protectAdmin = async (req, res, next) => {
  try {
    const userId =
      typeof req.auth === "function" ? req.auth().userId : req.auth?.userId;
    if (!userId) {
      return res.json({
        success: false,
        message: "Not authenticated. Check CLERK keys in server/.env",
      });
    }

    const response = await clerkClient.users.getUser(userId);
    const rawRole = response.publicMetadata?.role;
    const roles = Array.isArray(rawRole) ? rawRole : rawRole ? [rawRole] : [];

    if (!roles.includes("admin")) {
      return res.json({ success: false, message: "Admin Access Required" });
    }

    next();
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};
