import mongoose from "mongoose";

const educatorSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, ref: "User" },
    fullName: { type: String, required: true },
    qualification: { type: String, required: true },
    expertise: { type: String, required: true },
    experience: { type: String, required: true },
    bio: { type: String, required: true },
    linkedInUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

const Educator = mongoose.model("Educator", educatorSchema);

export default Educator;
