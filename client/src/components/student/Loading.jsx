import React, { useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";

const Loading = () => {
  const { path } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { backendUrl, getToken, fetchUserEnrolledCourses, fetchUserData } =
    useAppContext();

  useEffect(() => {
    let isMounted = true;

    const processLoading = async () => {
      const sessionId = searchParams.get("session_id");
      const purchaseId = searchParams.get("purchase_id");

      if (sessionId && purchaseId && backendUrl) {
        try {
          const token = await getToken();
          const headers = token ? { Authorization: `Bearer ${token}` } : {};

          const { data } = await axios.post(
            `${backendUrl}/api/user/verify-purchase`,
            { sessionId, purchaseId },
            { headers }
          );

          if (data.success) {
            toast.success("Enrollment confirmed!");
          } else {
            console.warn("Payment verification notice:", data.message);
          }

          if (fetchUserEnrolledCourses) {
            await fetchUserEnrolledCourses();
          }
          if (fetchUserData) {
            await fetchUserData();
          }
        } catch (error) {
          console.error("Verification error:", error.message);
        }
      }

      if (isMounted) {
        if (path) {
          navigate(`/${path}`);
        } else {
          navigate("/");
        }
      }
    };

    if (searchParams.get("session_id")) {
      processLoading();
    } else if (path) {
      const timer = setTimeout(() => {
        if (isMounted) {
          navigate(`/${path}`);
        }
      }, 5000);
      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }

    return () => {
      isMounted = false;
    };
  }, [path, searchParams, backendUrl, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="w-16 sm:w-20 aspect-square border-4 border-gray-300 border-t-4 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="text-gray-500 text-sm">
        {searchParams.get("session_id")
          ? "Verifying payment and updating enrollments..."
          : path
          ? "Redirecting, please wait..."
          : "Loading..."}
      </p>
    </div>
  );
};

export default Loading;
