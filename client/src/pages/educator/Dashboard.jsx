import React, { useEffect, useState } from "react";
import { assets, dummyDashboardData } from "../../assets/assets";
import { useAppContext } from "../../context/AppContext";
import Loading from "../../components/student/Loading";
import axios from "axios";

const Dashboard = () => {
  const { currency, backendUrl, getToken } = useAppContext();
  const [dashboardData, setDashboardData] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const token = await getToken();
      if (!token) {
        setDashboardData(dummyDashboardData);
        return;
      }

      const { data } = await axios.get(`${backendUrl}/api/educator/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success && data.dashboardData) {
        setDashboardData(data.dashboardData);
      } else {
        setDashboardData(dummyDashboardData);
      }
    } catch (error) {
      setDashboardData(dummyDashboardData);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (!dashboardData) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen flex flex-col items-start justify-between gap-8 md:p-8 md:pb-0 p-4 pt-8 pb-0 text-left">
      <div className="space-y-5 w-full">
        {/* Metric Cards */}
        <div className="flex flex-wrap gap-5 items-center">
          <div className="flex items-center gap-3 shadow-custom-card border border-blue-500 p-4 w-56 rounded-md bg-white">
            <img src={assets.patients_icon} alt="students" />
            <div>
              <p className="text-2xl font-medium text-gray-600">
                {dashboardData.enrolledStudentsData?.length || 0}
              </p>
              <p className="text-base text-gray-500">Total Enrolments</p>
            </div>
          </div>

          <div className="flex items-center gap-3 shadow-custom-card border border-blue-500 p-4 w-56 rounded-md bg-white">
            <img src={assets.appointments_icon} alt="courses" />
            <div>
              <p className="text-2xl font-medium text-gray-600">
                {dashboardData.totalCourses || 0}
              </p>
              <p className="text-base text-gray-500">Total Courses</p>
            </div>
          </div>

          <div className="flex items-center gap-3 shadow-custom-card border border-blue-500 p-4 w-56 rounded-md bg-white">
            <img src={assets.earning_icon} alt="earnings" />
            <div>
              <p className="text-2xl font-medium text-gray-600">
                {currency}
                {dashboardData.totalEarnings || 0}
              </p>
              <p className="text-base text-gray-500">Total Earnings</p>
            </div>
          </div>
        </div>

        {/* Latest Enrolments Table */}
        <div>
          <h2 className="pb-4 text-lg font-medium text-gray-800">Latest Enrolments</h2>
          <div className="flex flex-col items-center max-w-4xl w-full overflow-hidden rounded-md bg-white border border-gray-500/20">
            <table className="table-fixed md:table-auto w-full overflow-hidden">
              <thead className="text-gray-900 border-b border-gray-500/20 text-sm text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold text-center hidden sm:table-cell">
                    #
                  </th>
                  <th className="px-4 py-3 font-semibold">Student Name</th>
                  <th className="px-4 py-3 font-semibold">Course Title</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-500">
                {dashboardData.enrolledStudentsData &&
                dashboardData.enrolledStudentsData.length > 0 ? (
                  dashboardData.enrolledStudentsData.map((item, index) => (
                    <tr key={index} className="border-b border-gray-500/20">
                      <td className="px-4 py-3 text-center hidden sm:table-cell">
                        {index + 1}
                      </td>
                      <td className="md:px-4 px-2 py-3 flex items-center space-x-3">
                        <img
                          src={item.student?.imageUrl || assets.profile_img_1}
                          alt="Profile"
                          className="w-9 h-9 rounded-full object-cover"
                        />
                        <span className="truncate">
                          {item.student?.name || "Student"}
                        </span>
                      </td>
                      <td className="px-4 py-3 truncate">{item.courseTitle}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="text-center py-8 text-gray-400">
                      No student enrolments yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
