import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Icon = ({ d, className = "w-5 h-5" }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

const NAV = [
  {
    id: "overview",
    label: "Overview",
    d: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
  {
    id: "leave",
    label: "Leave Requests",
    d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  },
  {
    id: "profile",
    label: "Edit Profile",
    d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  },
  {
    id: "password",
    label: "Security",
    d: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  },
];

const inputCls =
  "flex items-center gap-3 border border-gray-200 rounded-xl px-4 transition-all duration-200 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50 hover:border-gray-300";
const textInputCls =
  "w-full py-3 text-sm text-gray-700 bg-transparent outline-none placeholder-gray-400 disabled:opacity-50";

const ValidationIcon = ({ valid }) =>
  valid ? (
    <svg
      className="w-4 h-4 text-green-500 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ) : (
    <svg
      className="w-4 h-4 text-red-500 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );

const getFieldCls = (touched, valid) => {
  const base =
    "flex items-center gap-3 border rounded-xl px-4 transition-all duration-200 hover:border-gray-300";
  if (!touched)
    return `${base} border-gray-200 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50`;
  if (valid)
    return `${base} border-green-400 focus-within:border-green-400 focus-within:ring-4 focus-within:ring-green-50`;
  return `${base} border-red-400 focus-within:border-red-400 focus-within:ring-4 focus-within:ring-red-50`;
};

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

  const [leaveTouched, setLeaveTouched] = useState({});
  const [profileTouched, setProfileTouched] = useState({});
  const [passwordTouched, setPasswordTouched] = useState({});

  const getTomorrowDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  };

  const validateLeaveField = (name, val) => {
    const tomorrow = getTomorrowDate();
    if (name === "start_date") return !!val && val >= tomorrow;
    if (name === "end_date")
      return (
        !!val &&
        val >= tomorrow &&
        (!leaveForm.start_date || val >= leaveForm.start_date)
      );
    if (name === "reason") return val.trim().length >= 5;
    return true;
  };

  const validateProfileField = (name, val) => {
    if (name === "phone")
      return val.trim() === "" || /^[+]?[\d\s\-(). ]{7,15}$/.test(val.trim());
    if (name === "address") return val.trim() === "" || val.trim().length >= 5;
    return true;
  };

  const validatePasswordField = (name, val) => {
    if (name === "oldPassword") return val.length > 0;
    if (name === "newPassword") return val.length >= 6;
    if (name === "confirmPassword")
      return val.length >= 6 && val === passwordData.newPassword;
    return true;
  };

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userType = localStorage.getItem("userType");

    if (!token || userType !== "employee") {
      navigate("/employee-login");
      return;
    }

    loadEmployeeProfile();
    loadLeaveRequests();
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
        toast.success("Profile updated successfully! âœ“", {
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
        toast.success("Password changed successfully! âœ“", {
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
        toast.success("Leave request submitted! âœ“", {
          position: "top-right",
          autoClose: 2500,
        });
        setLeaveForm({
          leave_type: "Annual",
          start_date: "",
          end_date: "",
          reason: "",
        });
        setLeaveTouched({});
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
        toast.success("Leave request deleted âœ“", {
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg
            className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-4"
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
          <p className="text-gray-500 text-sm">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const now = new Date();
  const greeting =
    now.getHours() < 12
      ? "Good morning"
      : now.getHours() < 17
        ? "Good afternoon"
        : "Good evening";
  const pageLabel = NAV.find((n) => n.id === activeTab)?.label || "Overview";

  return (
    <div
      className="flex h-screen bg-gray-50 overflow-hidden"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* â”€â”€ SIDEBAR â”€â”€ */}
      <aside
        className="relative flex flex-col h-full text-white shrink-0 transition-all duration-300"
        style={{
          width: "240px",
          background:
            "linear-gradient(160deg, #1e40af 0%, #2563eb 45%, #3b82f6 100%)",
          borderRadius: "0 2rem 2rem 0",
          boxShadow: "4px 0 24px rgba(37,99,235,0.18)",
        }}
      >
        <div className="pointer-events-none absolute top-[-60px] right-[-40px] w-48 h-48 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute bottom-[-30px] left-[-20px] w-32 h-32 rounded-full bg-white/8" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3 px-5 py-6">
          <div className="w-9 h-9 shrink-0 bg-white/20 rounded-xl flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
              <path
                d="M12 2L2 7l10 5 10-5-10-5z"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 17l10 5 10-5"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 12l10 5 10-5"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight">
              iris<span className="text-blue-200">HR</span>
            </span>
            <div className="text-xs text-blue-200/70 font-light leading-none mt-0.5">
              Employee Portal
            </div>
          </div>
        </div>

        <div className="mx-4 h-px bg-white/15 mb-3" />

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-1 px-3 relative z-10">
          {NAV.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setEditMode(false);
                  setProfileTouched({});
                  if (item.id === "leave") loadLeaveRequests();
                }}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 ${active ? "bg-white/20 text-white shadow-sm" : "text-blue-100/80 hover:bg-white/12 hover:text-white"}`}
              >
                <Icon d={item.d} className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="mx-4 h-px bg-white/15 mt-3" />

        {/* User + logout */}
        <div className="relative z-10 p-3 flex flex-col gap-2">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-white/10">
            <div className="w-8 h-8 shrink-0 rounded-full bg-white/30 flex items-center justify-center text-sm font-bold text-white">
              {employee?.name?.charAt(0)?.toUpperCase() || "E"}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-white truncate leading-tight">
                {employee?.name}
              </p>
              <p className="text-xs text-blue-200/70 truncate">
                {employee?.employee_id}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-blue-100/70 hover:bg-white/12 hover:text-white transition-all duration-200"
          >
            <Icon
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              className="w-4 h-4 shrink-0"
            />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* â”€â”€ MAIN â”€â”€ */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-100 shrink-0">
          <div>
            <h1 className="text-base font-bold text-gray-800">{pageLabel}</h1>
            <p className="text-xs text-gray-400">
              {greeting}, {employee?.name?.split(" ")[0] || "there"} ðŸ‘‹
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-medium px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Online
            </div>
            <div className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-xl border border-gray-200">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {employee?.name?.charAt(0)?.toUpperCase() || "E"}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-gray-800 leading-tight">
                  {employee?.name}
                </p>
                <p className="text-[10px] text-gray-400 leading-tight">
                  {employee?.designation} Â· {employee?.department}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* â”€â”€ OVERVIEW â”€â”€ */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* ── Personal Summary Banner ── */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 pt-6 pb-6">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-bold shrink-0">
                      {employee?.name?.charAt(0)?.toUpperCase() || "E"}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg font-bold text-gray-800 leading-tight">
                        {employee?.name}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {employee?.designation} &middot; {employee?.department}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border
                      ${
                        employee?.status === "Permanent"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : employee?.status === "Probation"
                            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                            : "bg-gray-100 text-gray-600 border-gray-200"
                      }`}
                    >
                      {employee?.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                    {[
                      { label: "Employee ID", value: employee?.employee_id },
                      { label: "Email", value: employee?.email },
                      { label: "Phone", value: employee?.phone || "—" },
                      {
                        label: "Joined",
                        value: employee?.joining_date
                          ? new Date(employee.joining_date).toLocaleDateString(
                              "en-US",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : "—",
                      },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex flex-col">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">
                          {label}
                        </span>
                        <span className="text-xs text-gray-700 font-semibold truncate">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Leave Summary ── */}
              {(() => {
                const total = leaveRequests.length;
                const approved = leaveRequests.filter(
                  (r) => r.status === "Approved",
                ).length;
                const pending = leaveRequests.filter(
                  (r) => r.status === "Pending",
                ).length;
                const rejected = leaveRequests.filter(
                  (r) => r.status === "Rejected",
                ).length;
                const daysTaken = leaveRequests
                  .filter((r) => r.status === "Approved")
                  .reduce((s, r) => s + (Number(r.days_applied) || 0), 0);
                const recentLeave = leaveRequests.slice(0, 3);
                const leaveTypeColors = {
                  Annual: {
                    bg: "bg-blue-50",
                    text: "text-blue-700",
                    border: "border-blue-200",
                  },
                  Sick: {
                    bg: "bg-red-50",
                    text: "text-red-700",
                    border: "border-red-200",
                  },
                  Casual: {
                    bg: "bg-purple-50",
                    text: "text-purple-700",
                    border: "border-purple-200",
                  },
                  Maternity: {
                    bg: "bg-pink-50",
                    text: "text-pink-700",
                    border: "border-pink-200",
                  },
                  Paternity: {
                    bg: "bg-cyan-50",
                    text: "text-cyan-700",
                    border: "border-cyan-200",
                  },
                  Unpaid: {
                    bg: "bg-orange-50",
                    text: "text-orange-700",
                    border: "border-orange-200",
                  },
                };
                const byType = leaveTypes
                  .map((type) => ({
                    type,
                    count: leaveRequests.filter((r) => r.leave_type === type)
                      .length,
                    days: leaveRequests
                      .filter(
                        (r) => r.leave_type === type && r.status === "Approved",
                      )
                      .reduce((s, r) => s + (Number(r.days_applied) || 0), 0),
                    ...(leaveTypeColors[type] || {
                      bg: "bg-gray-50",
                      text: "text-gray-700",
                      border: "border-gray-200",
                    }),
                  }))
                  .filter((t) => t.count > 0);
                return (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                        <Icon
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          className="w-4 h-4 text-blue-600"
                        />
                      </div>
                      <h3 className="text-sm font-bold text-gray-800">
                        Leave Summary
                      </h3>
                      <button
                        onClick={() => {
                          setActiveTab("leave");
                          loadLeaveRequests();
                        }}
                        className="ml-auto text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View all →
                      </button>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                        {[
                          {
                            label: "Total",
                            value: total,
                            bg: "bg-gray-50",
                            text: "text-gray-700",
                            border: "border-gray-200",
                          },
                          {
                            label: "Approved",
                            value: approved,
                            bg: "bg-green-50",
                            text: "text-green-700",
                            border: "border-green-200",
                          },
                          {
                            label: "Pending",
                            value: pending,
                            bg: "bg-yellow-50",
                            text: "text-yellow-700",
                            border: "border-yellow-200",
                          },
                          {
                            label: "Rejected",
                            value: rejected,
                            bg: "bg-red-50",
                            text: "text-red-700",
                            border: "border-red-200",
                          },
                          {
                            label: "Days Taken",
                            value: daysTaken,
                            bg: "bg-blue-50",
                            text: "text-blue-700",
                            border: "border-blue-200",
                          },
                        ].map(({ label, value, bg, text, border }) => (
                          <div
                            key={label}
                            className={`${bg} border ${border} rounded-xl p-3 text-center`}
                          >
                            <p className={`text-2xl font-bold ${text}`}>
                              {value}
                            </p>
                            <p
                              className={`text-xs font-medium ${text} opacity-80 mt-0.5`}
                            >
                              {label}
                            </p>
                          </div>
                        ))}
                      </div>
                      {recentLeave.length > 0 ? (
                        <div>
                          {byType.length > 0 && (
                            <div className="mb-5">
                              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-3">
                                By Leave Type
                              </p>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {byType.map(
                                  ({ type, count, days, bg, text, border }) => (
                                    <div
                                      key={type}
                                      className={`${bg} border ${border} rounded-xl px-4 py-3 flex items-center justify-between`}
                                    >
                                      <div>
                                        <p
                                          className={`text-xs font-semibold ${text}`}
                                        >
                                          {type}
                                        </p>
                                        <p
                                          className={`text-[10px] ${text} opacity-70 mt-0.5`}
                                        >
                                          {days} day{days !== 1 ? "s" : ""}{" "}
                                          approved
                                        </p>
                                      </div>
                                      <p
                                        className={`text-2xl font-bold ${text}`}
                                      >
                                        {count}
                                      </p>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                          <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-3">
                            Recent Requests
                          </p>
                          <div className="space-y-0">
                            {recentLeave.map((req) => (
                              <div
                                key={req.id}
                                className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0"
                              >
                                <div className="min-w-0">
                                  <span className="text-sm font-medium text-gray-700">
                                    {req.leave_type} Leave
                                  </span>
                                  <span className="text-xs text-gray-400 ml-2 hidden sm:inline">
                                    {new Date(
                                      req.start_date,
                                    ).toLocaleDateString("en-US", {
                                      day: "numeric",
                                      month: "short",
                                    })}{" "}
                                    –{" "}
                                    {new Date(req.end_date).toLocaleDateString(
                                      "en-US",
                                      {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                      },
                                    )}
                                    {req.days_applied
                                      ? ` · ${req.days_applied} day${req.days_applied !== 1 ? "s" : ""}`
                                      : ""}
                                  </span>
                                </div>
                                <span
                                  className={`ml-3 shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border
                                  ${
                                    req.status === "Approved"
                                      ? "bg-green-50 text-green-700 border-green-200"
                                      : req.status === "Rejected"
                                        ? "bg-red-50 text-red-700 border-red-200"
                                        : "bg-yellow-50 text-yellow-700 border-yellow-200"
                                  }`}
                                >
                                  {req.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 text-center py-4">
                          No leave requests yet
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: "Employee ID",
                    value: employee?.employee_id,
                    color: "blue",
                  },
                  {
                    label: "Status",
                    value: employee?.status,
                    color:
                      employee?.status === "Permanent" ? "green" : "yellow",
                  },
                  {
                    label: "Department",
                    value: employee?.department,
                    color: "purple",
                  },
                  {
                    label: "Joined",
                    value: new Date(employee?.joining_date).toLocaleDateString(
                      "en-US",
                      { month: "short", year: "numeric" },
                    ),
                    color: "orange",
                  },
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm"
                  >
                    <p
                      className={`text-xs font-semibold text-${color}-500 mb-1`}
                    >
                      {label}
                    </p>
                    <p className="text-gray-800 font-bold text-sm truncate">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Personal */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Icon
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        className="w-4 h-4 text-blue-600"
                      />
                    </div>
                    <h3 className="text-sm font-bold text-gray-800">
                      Personal Information
                    </h3>
                  </div>
                  <div className="p-6 space-y-4">
                    {[
                      ["Full Name", employee?.name],
                      ["Email", employee?.email],
                      ["Phone", employee?.phone || "â€”"],
                      ["Address", employee?.address || "â€”"],
                    ].map(([label, val]) => (
                      <div key={label} className="flex flex-col">
                        <span className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">
                          {label}
                        </span>
                        <span className="text-sm text-gray-700 font-medium">
                          {val}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Employment */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Icon
                        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        className="w-4 h-4 text-blue-600"
                      />
                    </div>
                    <h3 className="text-sm font-bold text-gray-800">
                      Employment Details
                    </h3>
                  </div>
                  <div className="p-6 space-y-4">
                    {[
                      ["Department", employee?.department],
                      ["Position", employee?.position],
                      ["Designation", employee?.designation],
                      [
                        "Joining Date",
                        new Date(employee?.joining_date).toLocaleDateString(),
                      ],
                    ].map(([label, val]) => (
                      <div key={label} className="flex flex-col">
                        <span className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">
                          {label}
                        </span>
                        <span className="text-sm text-gray-700 font-medium">
                          {val}
                        </span>
                      </div>
                    ))}
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                        Status
                      </span>
                      <span
                        className={`inline-flex w-fit items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border
                        ${
                          employee?.status === "Permanent"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : employee?.status === "Probation"
                              ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                              : "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                      >
                        {employee?.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* â”€â”€ LEAVE â”€â”€ */}
          {activeTab === "leave" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Submit form */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-fit">
                <h3 className="text-sm font-bold text-gray-800 mb-5 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Icon
                      d="M12 4v16m8-8H4"
                      className="w-4 h-4 text-blue-600"
                    />
                  </div>
                  New Leave Request
                </h3>
                <form onSubmit={submitLeaveRequest} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Leave Type
                    </label>
                    <select
                      value={leaveForm.leave_type}
                      onChange={(e) =>
                        setLeaveForm((p) => ({
                          ...p,
                          leave_type: e.target.value,
                        }))
                      }
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all hover:border-gray-300 bg-white"
                    >
                      {leaveTypes.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Start Date
                    </label>
                    <div
                      className={getFieldCls(
                        leaveTouched.start_date,
                        validateLeaveField("start_date", leaveForm.start_date),
                      )}
                    >
                      {leaveTouched.start_date && (
                        <ValidationIcon
                          valid={validateLeaveField(
                            "start_date",
                            leaveForm.start_date,
                          )}
                        />
                      )}
                      <input
                        type="date"
                        value={leaveForm.start_date}
                        min={getTomorrowDate()}
                        onChange={(e) => {
                          setLeaveForm((p) => ({
                            ...p,
                            start_date: e.target.value,
                          }));
                          setLeaveTouched((p) => ({
                            ...p,
                            start_date: true,
                          }));
                        }}
                        onBlur={() =>
                          setLeaveTouched((p) => ({
                            ...p,
                            start_date: true,
                          }))
                        }
                        className={textInputCls}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      End Date
                    </label>
                    <div
                      className={getFieldCls(
                        leaveTouched.end_date,
                        validateLeaveField("end_date", leaveForm.end_date),
                      )}
                    >
                      {leaveTouched.end_date && (
                        <ValidationIcon
                          valid={validateLeaveField(
                            "end_date",
                            leaveForm.end_date,
                          )}
                        />
                      )}
                      <input
                        type="date"
                        value={leaveForm.end_date}
                        min={leaveForm.start_date || getTomorrowDate()}
                        onChange={(e) => {
                          setLeaveForm((p) => ({
                            ...p,
                            end_date: e.target.value,
                          }));
                          setLeaveTouched((p) => ({
                            ...p,
                            end_date: true,
                          }));
                        }}
                        onBlur={() =>
                          setLeaveTouched((p) => ({
                            ...p,
                            end_date: true,
                          }))
                        }
                        className={textInputCls}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Reason
                    </label>
                    <div className="relative">
                      <textarea
                        value={leaveForm.reason}
                        onChange={(e) => {
                          setLeaveForm((p) => ({
                            ...p,
                            reason: e.target.value,
                          }));
                          setLeaveTouched((p) => ({
                            ...p,
                            reason: true,
                          }));
                        }}
                        onBlur={() =>
                          setLeaveTouched((p) => ({ ...p, reason: true }))
                        }
                        placeholder="Describe the reason for your leave..."
                        rows={4}
                        className={`w-full border rounded-xl px-4 py-3 pr-9 text-sm text-gray-700 bg-white outline-none transition-all hover:border-gray-300 resize-none placeholder-gray-400 ${
                          !leaveTouched.reason
                            ? "border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                            : validateLeaveField("reason", leaveForm.reason)
                              ? "border-green-400 focus:border-green-400 focus:ring-4 focus:ring-green-50"
                              : "border-red-400 focus:border-red-400 focus:ring-4 focus:ring-red-50"
                        }`}
                      />
                      {leaveTouched.reason && (
                        <span className="absolute top-3 right-3 pointer-events-none">
                          <ValidationIcon
                            valid={validateLeaveField(
                              "reason",
                              leaveForm.reason,
                            )}
                          />
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={leaveLoading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow-md hover:shadow-blue-200 active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {leaveLoading ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4"
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
                        Submitting...
                      </>
                    ) : (
                      "Submit Request"
                    )}
                  </button>
                </form>
              </div>

              {/* Leave history */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-sm font-bold text-gray-800">
                  My Leave History
                </h3>
                {leaveLoading ? (
                  <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
                    Loading...
                  </div>
                ) : leaveRequests.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                    <p className="text-gray-500">No leave requests yet</p>
                    <p className="text-gray-400 text-sm mt-1">
                      Submit your first request using the form
                    </p>
                  </div>
                ) : (
                  leaveRequests.map((req) => (
                    <div
                      key={req.id}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-sm font-bold text-gray-800">
                            {req.leave_type} Leave
                          </h4>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(req.start_date).toLocaleDateString(
                              "en-US",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}{" "}
                            â€”{" "}
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
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border
                          ${
                            req.status === "Approved"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : req.status === "Rejected"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-yellow-50 text-yellow-700 border-yellow-200"
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{req.reason}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {req.days_applied} day
                          {req.days_applied !== 1 ? "s" : ""}
                        </span>
                        {req.status === "Pending" && (
                          <button
                            onClick={() => cancelLeaveRequest(req.id)}
                            className="px-3 py-1 text-xs font-medium text-red-600 border border-red-200 hover:border-red-400 hover:bg-red-50 rounded-lg transition-all"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* â”€â”€ PROFILE â”€â”€ */}
          {activeTab === "profile" && (
            <div className="max-w-xl">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Icon
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        className="w-4 h-4 text-blue-600"
                      />
                    </div>
                    <h3 className="text-sm font-bold text-gray-800">
                      Contact Information
                    </h3>
                  </div>
                  {!editMode && (
                    <button
                      onClick={() => setEditMode(true)}
                      className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Phone Number
                    </label>
                    {editMode ? (
                      <div
                        className={getFieldCls(
                          profileTouched.phone,
                          validateProfileField("phone", formData.phone),
                        )}
                      >
                        <Icon
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          className="w-4 h-4 text-gray-400 shrink-0"
                        />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={(e) => {
                            handleInputChange(e);
                            setProfileTouched((p) => ({ ...p, phone: true }));
                          }}
                          onBlur={() =>
                            setProfileTouched((p) => ({ ...p, phone: true }))
                          }
                          placeholder="+94 77 123 4567"
                          className={textInputCls}
                        />
                        {profileTouched.phone && (
                          <ValidationIcon
                            valid={validateProfileField(
                              "phone",
                              formData.phone,
                            )}
                          />
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700">
                        {employee?.phone || (
                          <span className="text-gray-400">Not provided</span>
                        )}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Home Address
                    </label>
                    {editMode ? (
                      <div className="relative">
                        <textarea
                          name="address"
                          value={formData.address}
                          onChange={(e) => {
                            handleInputChange(e);
                            setProfileTouched((p) => ({ ...p, address: true }));
                          }}
                          onBlur={() =>
                            setProfileTouched((p) => ({ ...p, address: true }))
                          }
                          placeholder="Enter your home address..."
                          rows={3}
                          className={`w-full border rounded-xl px-4 py-3 pr-9 text-sm text-gray-700 bg-white outline-none transition-all resize-none placeholder-gray-400 hover:border-gray-300 ${
                            !profileTouched.address
                              ? "border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                              : validateProfileField(
                                    "address",
                                    formData.address,
                                  )
                                ? "border-green-400 focus:border-green-400 focus:ring-4 focus:ring-green-50"
                                : "border-red-400 focus:border-red-400 focus:ring-4 focus:ring-red-50"
                          }`}
                        />
                        {profileTouched.address && (
                          <span className="absolute top-3 right-3 pointer-events-none">
                            <ValidationIcon
                              valid={validateProfileField(
                                "address",
                                formData.address,
                              )}
                            />
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700">
                        {employee?.address || (
                          <span className="text-gray-400">Not provided</span>
                        )}
                      </p>
                    )}
                  </div>
                  {editMode && (
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={updateProfile}
                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-blue-200"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={() => {
                          setEditMode(false);
                          setProfileTouched({});
                          setFormData({
                            phone: employee?.phone || "",
                            address: employee?.address || "",
                          });
                        }}
                        className="flex-1 py-2.5 border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-800 text-sm font-medium rounded-xl transition-all bg-white hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* â”€â”€ SECURITY â”€â”€ */}
          {activeTab === "password" && (
            <div className="max-w-xl">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Icon
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      className="w-4 h-4 text-blue-600"
                    />
                  </div>
                  <h3 className="text-sm font-bold text-gray-800">
                    Change Password
                  </h3>
                </div>
                <div className="p-6 space-y-5">
                  {[
                    {
                      label: "Current Password",
                      name: "oldPassword",
                      placeholder: "Enter your current password",
                    },
                    {
                      label: "New Password",
                      name: "newPassword",
                      placeholder: "Enter your new password",
                    },
                    {
                      label: "Confirm New Password",
                      name: "confirmPassword",
                      placeholder: "Confirm your new password",
                    },
                  ].map(({ label, name, placeholder }) => (
                    <div key={name}>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {label}
                      </label>
                      <div
                        className={getFieldCls(
                          passwordTouched[name],
                          validatePasswordField(name, passwordData[name]),
                        )}
                      >
                        <Icon
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          className="w-4 h-4 text-gray-400 shrink-0"
                        />
                        <input
                          type="password"
                          name={name}
                          value={passwordData[name]}
                          onChange={(e) => {
                            handlePasswordChange(e);
                            setPasswordTouched((p) => ({
                              ...p,
                              [name]: true,
                            }));
                          }}
                          onBlur={() =>
                            setPasswordTouched((p) => ({ ...p, [name]: true }))
                          }
                          placeholder={placeholder}
                          className={textInputCls}
                        />
                        {passwordTouched[name] && (
                          <ValidationIcon
                            valid={validatePasswordField(
                              name,
                              passwordData[name],
                            )}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={changePassword}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md hover:shadow-blue-200 active:scale-[0.99]"
                  >
                    Update Password
                  </button>
                  <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-blue-50 border border-blue-100">
                    <Icon
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      className="w-4 h-4 text-blue-500 shrink-0 mt-0.5"
                    />
                    <p className="text-xs text-blue-600 leading-relaxed">
                      Minimum 6 characters. Use a mix of letters, numbers, and
                      special characters for better security.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
export default EmployeeDashboard;
