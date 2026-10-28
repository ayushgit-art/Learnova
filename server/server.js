import "dotenv/config";
import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import connectDB from "./configs/mongodb.js";
import connectCloudinary from "./configs/cloudinary.js";
import { clerkWebhooks, stripeWebhooks } from "./controllers/webhooks.js";
import educatorRouter from "./routes/educatorRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import courseRouter from "./routes/courseRoute.js";
import userRouter from "./routes/userRoutes.js";

// Initialize Express
const app = express();

// Connect to Database & Cloudinary
await connectDB().catch((err) =>
  console.log("MongoDB connection notice:", err.message)
);
await connectCloudinary();

// Global CORS Middleware
app.use(cors());

// Webhook Routes (Stripe raw body must be mounted before general express.json())
app.post("/stripe", express.raw({ type: "application/json" }), stripeWebhooks);
app.post("/clerk", express.json(), clerkWebhooks);

// JSON Body Parser & Clerk Middleware for API Routes
app.use(express.json());
app.use(clerkMiddleware());

// Health / Test Route
app.get("/", (req, res) => {
  res.send("Learnova API Working");
});

// Mount Application Routes
app.use("/api/educator", educatorRouter);
app.use("/api/admin", adminRouter);
app.use("/api/course", courseRouter);
app.use("/api/user", userRouter);

// Port configuration
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
