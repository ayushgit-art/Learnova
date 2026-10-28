import React, { useEffect, useState } from "react";
import { useClerk, useUser, useAuth } from "@clerk/clerk-react";
import { useAppContext } from "../../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import Footer from "../../components/student/Footer";

const BecomeEducator = () => {
  const { backendUrl, setIsEducator, navigate, isEducator, fetchUserData } =
    useAppContext();
  const { openSignIn } = useClerk();
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();

  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    qualification: "",
    expertise: "",
    experience: "",
    bio: "",
    linkedInUrl: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.fullName && !formData.fullName) {
      setFormData((prev) => ({ ...prev, fullName: user.fullName }));
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isLoaded) {
      return;
    }

    if (!isSignedIn || !user) {
      toast.info("Please sign in to register as an educator");
      return openSignIn();
    }

    setLoading(true);

    try {
      const token = await getToken();

      if (!token) {
        toast.error("Authentication token not available. Please try signing in again.");
        return;
      }

      const { data } = await axios.post(
        `${backendUrl}/api/educator/register`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data.success) {
        if (user.reload) {
          await user.reload();
        }
        setIsEducator(true);
        if (fetchUserData) {
          await fetchUserData();
        }
        toast.success(data.message || "Registered as Educator successfully!");
        navigate("/educator");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-cyan-100/50 to-white flex items-center justify-center">
        <div className="max-w-2xl w-full bg-white p-8 sm:p-10 rounded-xl shadow-custom-card border border-gray-100 text-left">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">
              Apply as a <span className="text-blue-600">Learnova Educator</span>
            </h1>
            <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
              Share your skills, inspire learners across the globe, and earn revenue
              teaching what you love.
            </p>
          </div>

          {isEducator ? (
            <div className="text-center py-8">
              <p className="text-green-600 font-medium text-lg mb-4">
                You are already registered as an Educator!
              </p>
              <button
                onClick={() => navigate("/educator")}
                className="bg-blue-600 text-white px-6 py-2.5 rounded hover:bg-blue-700 transition cursor-pointer"
              >
                Go to Educator Dashboard
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g. Dr. Jane Doe"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Highest Qualification *
                  </label>
                  <input
                    type="text"
                    name="qualification"
                    value={formData.qualification}
                    onChange={handleChange}
                    placeholder="e.g. M.S. in Computer Science"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Expertise *
                  </label>
                  <input
                    type="text"
                    name="expertise"
                    value={formData.expertise}
                    onChange={handleChange}
                    placeholder="e.g. Full-Stack Development"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teaching / Industry Experience *
                  </label>
                  <input
                    type="text"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    placeholder="e.g. 5+ years at tech companies"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LinkedIn / Portfolio URL
                  </label>
                  <input
                    type="url"
                    name="linkedInUrl"
                    value={formData.linkedInUrl}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Professional Bio & Teaching Philosophy *
                </label>
                <textarea
                  name="bio"
                  rows={4}
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell your future students about your background, career achievements, and teaching style..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-600"
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-lg text-white font-medium transition cursor-pointer ${
                  loading
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading ? "Submitting Application..." : "Submit Educator Application"}
              </button>
            </form>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default BecomeEducator;