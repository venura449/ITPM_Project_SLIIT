import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const EmployeeDashboard = () => {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    phone: "",
    address: "",
  });
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    leave_type: "Annual",
    start_date: "",
    end_date: "",
    reason: "",
  });

  const leaveTypes = [
    "Annual",
    "Sick",
    "Casual",
    "Maternity",
    "Paternity",
    "Unpaid",
  ];
  const navigate = useNavigate();

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userType = localStorage.getItem("userType");

    if (!token || userType !== "employee") {
      navigate("/employee-login");
      return;
    }

    loadEmployeeProfile();
  }, [navigate]);

  const loadEmployeeProfile = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/employee-auth/profile",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      const data = await response.json();
      if (data.success) {
        setEmployee(data.user);
        setFormData({
          phone: data.user.phone || "",
          address: data.user.address || "",
        });
      } else {
        toast.error("Failed to load profile", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      toast.error("Error loading profile: " + error.message, {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const updateProfile = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/employee-auth/profile",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        },
      );

      const data = await response.json();
      if (data.success) {
        setEmployee(data.user);
        setEditMode(false);
        toast.success("Profile updated successfully! ✓", {
          position: "top-right",
          autoClose: 2000,
        });
      } else {
        toast.error(data.message || "Failed to update profile", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      toast.error("Error updating profile: " + error.message, {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const changePassword = async () => {
    if (
      !passwordData.oldPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      toast.error("All password fields are required", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/employee-auth/change-password",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            oldPassword: passwordData.oldPassword,
            newPassword: passwordData.newPassword,
          }),
        },
      );

      const data = await response.json();
      if (data.success) {
        setPasswordData({
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        toast.success("Password changed successfully! ✓", {
          position: "top-right",
          autoClose: 2000,
        });
      } else {
        toast.error(data.message || "Failed to change password", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      toast.error("Error changing password: " + error.message, {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const loadLeaveRequests = async () => {
    setLeaveLoading(true);
    try {
      const response = await fetch(
        "http://localhost:5000/api/leave/my-requests",
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      const data = await response.json();
      if (data.success) setLeaveRequests(data.data || []);
    } catch (error) {
      toast.error("Failed to load leave requests: " + error.message, {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLeaveLoading(false);
    }
  };

  const submitLeaveRequest = async (e) => {
    e.preventDefault();
    if (
      !leaveForm.start_date ||
      !leaveForm.end_date ||
      !leaveForm.reason.trim()
    ) {
      toast.error("Please fill in all required fields", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
    setLeaveLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/leave/request", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(leaveForm),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Leave request submitted! ✓", {
          position: "top-right",
          autoClose: 2500,
        });
        setLeaveForm({
          leave_type: "Annual",
          start_date: "",
          end_date: "",
          reason: "",
        });
        loadLeaveRequests();
      } else {
        toast.error(data.message || "Failed to submit", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      toast.error("Error: " + error.message, {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLeaveLoading(false);
    }
  };

  const cancelLeaveRequest = async (requestId) => {
    if (!window.confirm("Delete this leave request?")) return;
    try {
      const response = await fetch(
        `http://localhost:5000/api/leave/request/${requestId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      const data = await response.json();
      if (data.success) {
        toast.success("Leave request deleted ✓", {
          position: "top-right",
          autoClose: 2500,
        });
        loadLeaveRequests();
      } else {
        toast.error(data.message || "Failed to delete", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      toast.error("Error: " + error.message, {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userType");
    localStorage.removeItem("user");
    toast.success("Logged out successfully!", {
      position: "top-right",
      autoClose: 2000,
    });
    navigate("/employee-login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 text-cyan-400 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p className="text-cyan-300 text-lg">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "leave", label: "Leave Requests", icon: "📋" },
    { id: "profile", label: "Edit Profile", icon: "👤" },
    { id: "password", label: "Security", icon: "🔒" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950">
      {/* Header Section with Gradient */}
      <div className="bg-gradient-to-r from-cyan-600/20 to-indigo-600/20 border-b border-slate-700/40 backdrop-blur-sm sticky top-0 z-40">
        <div className="w-full px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {employee?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1
                  className="text-3xl font-bold text-white"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  {employee?.name}
                </h1>
                <p className="text-cyan-300 text-sm font-medium">
                  {employee?.designation} • {employee?.department}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-2.5 text-sm uppercase tracking-wider font-semibold text-red-300 hover:text-red-200 border border-red-500/30 hover:border-red-500/60 rounded-lg transition-all bg-red-500/10 hover:bg-red-500/20"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3 4.5a1.5 1.5 0 011.5-1.5h10A1.5 1.5 0 0116 4.5v2a.75.75 0 01-1.5 0v-2a.25.25 0 00-.25-.25h-10a.25.25 0 00-.25.25v11a.25.25 0 00.25.25h10a.25.25 0 00.25-.25v-2a.75.75 0 011.5 0v2A1.5 1.5 0 0114.5 17h-10A1.5 1.5 0 013 15.5v-11z"
                  clipRule="evenodd"
                />
                <path
                  fillRule="evenodd"
                  d="M6.28 5.22a.75.75 0 00-1.06 1.06l2.97 2.97H6.75a.75.75 0 000 1.5h4.69l-2.97 2.97a.75.75 0 101.06 1.06l4.25-4.25a.75.75 0 000-1.06L6.28 5.22z"
                  clipRule="evenodd"
                />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-6 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-lg bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 hover:border-cyan-500/40 transition-colors">
            <p className="text-cyan-400 text-sm font-semibold mb-1">
              Employee ID
            </p>
            <p className="text-white text-xl font-bold font-mono">
              {employee?.employee_id}
            </p>
          </div>
          <div className="p-5 rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 hover:border-green-500/40 transition-colors">
            <p className="text-green-400 text-sm font-semibold mb-1">Status</p>
            <p className="text-white text-xl font-bold">{employee?.status}</p>
          </div>
          <div className="p-5 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 hover:border-purple-500/40 transition-colors">
            <p className="text-purple-400 text-sm font-semibold mb-1">
              Position
            </p>
            <p className="text-white text-xl font-bold">{employee?.position}</p>
          </div>
          <div className="p-5 rounded-lg bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20 hover:border-orange-500/40 transition-colors">
            <p className="text-orange-400 text-sm font-semibold mb-1">Joined</p>
            <p className="text-white text-xl font-bold">
              {new Date(employee?.joining_date).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-6 flex gap-1 bg-slate-800/40 p-1 rounded-lg border border-slate-700/40 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setEditMode(false);
                if (tab.id === "leave") loadLeaveRequests();
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-md text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="p-6 rounded-lg border border-slate-700/40 bg-slate-800/30 backdrop-blur-sm hover:border-slate-700/60 transition-colors">
                <h3
                  className="text-lg font-bold text-white mb-5 flex items-center gap-2"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  <span className="text-cyan-400">👤</span> Personal Information
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-start pb-4 border-b border-slate-700/40">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                        Full Name
                      </p>
                      <p className="text-white font-semibold">
                        {employee?.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-start pb-4 border-b border-slate-700/40">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                        Email Address
                      </p>
                      <p className="text-cyan-300 font-mono text-sm">
                        {employee?.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-start pb-4 border-b border-slate-700/40">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                        Phone Number
                      </p>
                      <p className="text-white font-semibold">
                        {employee?.phone || "—"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                      Address
                    </p>
                    <p className="text-white text-sm">
                      {employee?.address || "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Employment Information */}
              <div className="p-6 rounded-lg border border-slate-700/40 bg-slate-800/30 backdrop-blur-sm hover:border-slate-700/60 transition-colors">
                <h3
                  className="text-lg font-bold text-white mb-5 flex items-center gap-2"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  <span className="text-purple-400">💼</span> Employment Details
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-start pb-4 border-b border-slate-700/40">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                        Department
                      </p>
                      <p className="text-white font-semibold">
                        {employee?.department}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-start pb-4 border-b border-slate-700/40">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                        Position
                      </p>
                      <p className="text-white font-semibold">
                        {employee?.position}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-start pb-4 border-b border-slate-700/40">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                        Designation
                      </p>
                      <p className="text-white font-semibold">
                        {employee?.designation}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                      Employment Status
                    </p>
                    <span
                      className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold border font-mono ${
                        employee?.status === "Permanent"
                          ? "bg-green-500/20 text-green-300 border-green-500/30"
                          : employee?.status === "Probation"
                            ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                            : "bg-slate-600/20 text-slate-300 border-slate-600/30"
                      }`}
                    >
                      {employee?.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Leave Tab */}
          {activeTab === "leave" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Submit Form */}
              <div className="lg:col-span-1 p-6 rounded-lg border border-slate-700/40 bg-slate-800/30 backdrop-blur-sm h-fit">
                <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                  <span className="text-green-400">📝</span> New Leave Request
                </h3>
                <form onSubmit={submitLeaveRequest} className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 block">
                      Leave Type
                    </label>
                    <select
                      name="leave_type"
                      value={leaveForm.leave_type}
                      onChange={(e) =>
                        setLeaveForm((p) => ({
                          ...p,
                          leave_type: e.target.value,
                        }))
                      }
                      className="w-full bg-slate-900/60 text-white rounded-lg px-4 py-3 border border-slate-700/40 focus:border-cyan-500/60 outline-none transition-all text-sm"
                    >
                      {leaveTypes.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 block">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={leaveForm.start_date}
                      onChange={(e) =>
                        setLeaveForm((p) => ({
                          ...p,
                          start_date: e.target.value,
                        }))
                      }
                      className="w-full bg-slate-900/60 text-white rounded-lg px-4 py-3 border border-slate-700/40 focus:border-cyan-500/60 outline-none transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 block">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={leaveForm.end_date}
                      onChange={(e) =>
                        setLeaveForm((p) => ({
                          ...p,
                          end_date: e.target.value,
                        }))
                      }
                      className="w-full bg-slate-900/60 text-white rounded-lg px-4 py-3 border border-slate-700/40 focus:border-cyan-500/60 outline-none transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 block">
                      Reason
                    </label>
                    <textarea
                      value={leaveForm.reason}
                      onChange={(e) =>
                        setLeaveForm((p) => ({ ...p, reason: e.target.value }))
                      }
                      placeholder="Describe the reason for your leave..."
                      rows="4"
                      className="w-full bg-slate-900/60 text-white placeholder-slate-600 rounded-lg px-4 py-3 border border-slate-700/40 focus:border-cyan-500/60 outline-none transition-all text-sm resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={leaveLoading}
                    className="w-full px-6 py-3 text-sm uppercase tracking-wider font-semibold text-white rounded-lg transition-all bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 disabled:opacity-50 shadow-lg"
                  >
                    {leaveLoading ? "Submitting..." : "Submit Request"}
                  </button>
                </form>
              </div>

              {/* My Leave Requests */}
              <div className="lg:col-span-2">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-cyan-400">📋</span> My Leave History
                </h3>
                {leaveLoading ? (
                  <div className="p-8 text-center text-slate-400">
                    Loading...
                  </div>
                ) : leaveRequests.length === 0 ? (
                  <div className="p-12 text-center rounded-lg border border-slate-700/40 bg-slate-800/30">
                    <p className="text-slate-400 text-lg">
                      No leave requests yet
                    </p>
                    <p className="text-slate-600 text-sm mt-1">
                      Submit your first leave request using the form
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaveRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-5 rounded-lg border border-slate-700/40 bg-slate-800/30 hover:border-slate-700/60 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="text-white font-semibold">
                              {req.leave_type} Leave
                            </h4>
                            <p className="text-slate-400 text-sm">
                              {new Date(req.start_date).toLocaleDateString(
                                "en-US",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}{" "}
                              —{" "}
                              {new Date(req.end_date).toLocaleDateString(
                                "en-US",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </p>
                          </div>
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${
                              req.status === "Approved"
                                ? "bg-green-500/20 text-green-300 border-green-500/30"
                                : req.status === "Rejected"
                                  ? "bg-red-500/20 text-red-300 border-red-500/30"
                                  : "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                            }`}
                          >
                            {req.status}
                          </span>
                        </div>
                        <p className="text-slate-300 text-sm mb-3">
                          {req.reason}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">
                            {req.days_applied} day
                            {req.days_applied !== 1 ? "s" : ""}
                          </span>
                          {req.status === "Pending" && (
                            <button
                              onClick={() => cancelLeaveRequest(req.id)}
                              className="px-3 py-1 text-xs text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50 rounded transition-colors"
                            >
                              Cancel Request
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="max-w-2xl">
              <div className="p-8 rounded-lg border border-slate-700/40 bg-slate-800/30 backdrop-blur-sm">
                <h3
                  className="text-2xl font-bold text-white mb-6"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  {editMode
                    ? "✏️ Edit Your Profile"
                    : "📝 Your Contact Information"}
                </h3>

                <div className="space-y-6">
                  <div>
                    <label className="text-sm text-slate-400 uppercase tracking-wider font-semibold mb-2 block">
                      Phone Number
                    </label>
                    {editMode ? (
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+94 77 123 4567"
                        className="w-full bg-slate-900/60 text-white placeholder-slate-600 rounded-lg px-4 py-3 border border-slate-700/40 focus:border-cyan-500/60 focus:bg-slate-900/80 outline-none transition-all"
                      />
                    ) : (
                      <p className="text-white text-lg">
                        {employee?.phone || "Not provided"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm text-slate-400 uppercase tracking-wider font-semibold mb-2 block">
                      Home Address
                    </label>
                    {editMode ? (
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Enter your home address..."
                        rows="4"
                        className="w-full bg-slate-900/60 text-white placeholder-slate-600 rounded-lg px-4 py-3 border border-slate-700/40 focus:border-cyan-500/60 focus:bg-slate-900/80 outline-none transition-all resize-none"
                      />
                    ) : (
                      <p className="text-white text-lg">
                        {employee?.address || "Not provided"}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    {editMode ? (
                      <>
                        <button
                          onClick={updateProfile}
                          className="flex-1 px-6 py-3 text-sm uppercase tracking-wider font-semibold text-white rounded-lg transition-all bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 shadow-lg hover:shadow-xl"
                        >
                          ✓ Save Changes
                        </button>
                        <button
                          onClick={() => {
                            setEditMode(false);
                            setFormData({
                              phone: employee?.phone || "",
                              address: employee?.address || "",
                            });
                          }}
                          className="flex-1 px-6 py-3 text-sm uppercase tracking-wider font-semibold text-slate-300 rounded-lg transition-all border border-slate-700/40 hover:border-slate-600 hover:text-slate-200 hover:bg-slate-700/20"
                        >
                          ✕ Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setEditMode(true)}
                        className="w-full px-6 py-3 text-sm uppercase tracking-wider font-semibold text-white rounded-lg transition-all bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-lg hover:shadow-xl"
                      >
                        ✏️ Edit Profile
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === "password" && (
            <div className="max-w-2xl">
              <div className="p-8 rounded-lg border border-slate-700/40 bg-slate-800/30 backdrop-blur-sm">
                <h3
                  className="text-2xl font-bold text-white mb-6"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  🔐 Change Your Password
                </h3>

                <div className="space-y-6">
                  <div>
                    <label className="text-sm text-slate-400 uppercase tracking-wider font-semibold mb-2 block">
                      Current Password
                    </label>
                    <input
                      type="password"
                      name="oldPassword"
                      value={passwordData.oldPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter your current password"
                      className="w-full bg-slate-900/60 text-white placeholder-slate-600 rounded-lg px-4 py-3 border border-slate-700/40 focus:border-cyan-500/60 focus:bg-slate-900/80 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-slate-400 uppercase tracking-wider font-semibold mb-2 block">
                      New Password
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter your new password"
                      className="w-full bg-slate-900/60 text-white placeholder-slate-600 rounded-lg px-4 py-3 border border-slate-700/40 focus:border-cyan-500/60 focus:bg-slate-900/80 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-slate-400 uppercase tracking-wider font-semibold mb-2 block">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Confirm your new password"
                      className="w-full bg-slate-900/60 text-white placeholder-slate-600 rounded-lg px-4 py-3 border border-slate-700/40 focus:border-cyan-500/60 focus:bg-slate-900/80 outline-none transition-all"
                    />
                  </div>

                  <button
                    onClick={changePassword}
                    className="w-full px-6 py-3 text-sm uppercase tracking-wider font-semibold text-white rounded-lg transition-all bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-lg hover:shadow-xl"
                  >
                    🔄 Update Password
                  </button>
                </div>

                <div className="mt-8 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <p className="text-sm text-amber-200 leading-relaxed">
                    <span className="font-semibold block mb-2">
                      🛡️ Password Requirements:
                    </span>
                    • Minimum 6 characters long
                    <br />
                    • Use a mix of uppercase and lowercase letters
                    <br />
                    • Include numbers and special characters for better security
                    <br />• Avoid using easily guessable information
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
