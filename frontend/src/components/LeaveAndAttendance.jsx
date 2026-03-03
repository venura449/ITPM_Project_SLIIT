import { useState, useEffect } from "react";
import { toast } from "react-toastify";

const LeaveManagement = () => {
  const [activeTab, setActiveTab] = useState("request");
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    leave_type: "Annual",
    start_date: "",
    end_date: "",
    reason: "",
  });
  const [leaveBalance, setLeaveBalance] = useState([]);

  const leaveTypes = [
    "Annual",
    "Sick",
    "Casual",
    "Maternity",
    "Paternity",
    "Unpaid",
  ];

  useEffect(() => {
    if (activeTab === "request") {
      loadMyLeaveRequests();
      loadLeaveBalance();
    } else if (activeTab === "pending") {
      loadPendingRequests();
    }
  }, [activeTab]);

  const loadMyLeaveRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "http://localhost:5000/api/leave/my-requests",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      const data = await response.json();
      if (data.success) {
        setLeaveRequests(data.data || []);
      }
    } catch (error) {
      toast.error("Failed to load leave requests: " + error.message, {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPendingRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/leave/pending", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setPendingRequests(data.data || []);
      }
    } catch (error) {
      toast.error("Failed to load pending requests: " + error.message, {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadLeaveBalance = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/leave/balance/1`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      const data = await response.json();
      if (data.success) {
        setLeaveBalance(data.data || []);
      }
    } catch (error) {
      console.error("Failed to load leave balance:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const submitLeaveRequest = async (e) => {
    e.preventDefault();

    if (!formData.start_date || !formData.end_date || !formData.reason.trim()) {
      toast.error("Please fill in all required fields", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/leave/request", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Leave request submitted successfully! ✓", {
          position: "top-right",
          autoClose: 2500,
        });
        setFormData({
          leave_type: "Annual",
          start_date: "",
          end_date: "",
          reason: "",
        });
        loadMyLeaveRequests();
        loadLeaveBalance();
      } else {
        toast.error(data.message || "Failed to submit leave request", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      toast.error("Error submitting leave request: " + error.message, {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const approveLeaveRequest = async (requestId) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/leave/request/${requestId}/approve`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ notes: "Approved" }),
        },
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Leave request approved! ✓", {
          position: "top-right",
          autoClose: 2500,
        });
        loadPendingRequests();
      } else {
        toast.error(data.message || "Failed to approve request", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      toast.error("Error approving request: " + error.message, {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const rejectLeaveRequest = async (requestId) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/leave/request/${requestId}/reject`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ notes: "Rejected" }),
        },
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Leave request rejected ✓", {
          position: "top-right",
          autoClose: 2500,
        });
        loadPendingRequests();
      } else {
        toast.error(data.message || "Failed to reject request", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      toast.error("Error rejecting request: " + error.message, {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const deleteLeaveRequest = async (requestId) => {
    if (!window.confirm("Are you sure you want to delete this leave request?"))
      return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/leave/request/${requestId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Leave request deleted ✓", {
          position: "top-right",
          autoClose: 2500,
        });
        loadMyLeaveRequests();
      } else {
        toast.error(data.message || "Failed to delete request", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      toast.error("Error deleting request: " + error.message, {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const statusColors = {
    Pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    Approved: "bg-green-500/20 text-green-300 border-green-500/30",
    Rejected: "bg-red-500/20 text-red-300 border-red-500/30",
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h2
          className="text-3xl font-bold text-white mb-2"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          Leave & Attendance Management
        </h2>
        <p
          className="text-slate-400"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          Manage leave requests and view attendance records
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-700/40 overflow-x-auto">
        <button
          onClick={() => setActiveTab("request")}
          className={`px-6 py-3 text-sm uppercase tracking-wide whitespace-nowrap transition-colors border-b-2 ${
            activeTab === "request"
              ? "text-cyan-300 border-cyan-500/50"
              : "text-slate-400 border-transparent hover:text-cyan-300"
          }`}
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          My Leave Requests
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-6 py-3 text-sm uppercase tracking-wide whitespace-nowrap transition-colors border-b-2 ${
            activeTab === "pending"
              ? "text-cyan-300 border-cyan-500/50"
              : "text-slate-400 border-transparent hover:text-cyan-300"
          }`}
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          Pending Approvals
        </button>
      </div>

      {activeTab === "request" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* New Leave Request Form */}
          <div className="lg:col-span-1 p-6 rounded-lg border border-slate-700/40 bg-slate-800/20 h-fit">
            <h3
              className="text-lg font-bold text-white mb-4"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Submit Leave Request
            </h3>

            <form onSubmit={submitLeaveRequest} className="space-y-4">
              <div>
                <label
                  className="text-xs text-slate-600 uppercase tracking-wider mb-2 block"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  Leave Type
                </label>
                <select
                  name="leave_type"
                  value={formData.leave_type}
                  onChange={handleInputChange}
                  className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-4 py-2 border border-slate-700/40 focus:border-cyan-400/60 outline-none transition-colors text-sm"
                >
                  {leaveTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  className="text-xs text-slate-600 uppercase tracking-wider mb-2 block"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  Start Date
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-4 py-2 border border-slate-700/40 focus:border-cyan-400/60 outline-none transition-colors text-sm"
                />
              </div>

              <div>
                <label
                  className="text-xs text-slate-600 uppercase tracking-wider mb-2 block"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  End Date
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-4 py-2 border border-slate-700/40 focus:border-cyan-400/60 outline-none transition-colors text-sm"
                />
              </div>

              <div>
                <label
                  className="text-xs text-slate-600 uppercase tracking-wider mb-2 block"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  Reason
                </label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  placeholder="Enter reason for leave..."
                  rows="3"
                  className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-4 py-2 border border-slate-700/40 focus:border-cyan-400/60 outline-none transition-colors resize-none text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-950 font-semibold rounded-lg transition-all bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Submit Request"}
              </button>
            </form>

            {/* Leave Balance */}
            {leaveBalance.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-700/40">
                <h4
                  className="text-sm font-bold text-white mb-3 uppercase tracking-wider"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  Leave Balance
                </h4>
                <div className="space-y-2">
                  {leaveBalance.map((balance) => (
                    <div
                      key={balance.leave_type}
                      className="p-2 rounded bg-slate-900/40 border border-slate-700/40"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-slate-400">
                          {balance.leave_type}
                        </span>
                        <span className="text-xs font-semibold text-cyan-300">
                          {balance.balance_days}/{balance.total_days}
                        </span>
                      </div>
                      <div className="w-full bg-slate-800/60 rounded-full h-1.5">
                        <div
                          className="bg-gradient-to-r from-cyan-500 to-indigo-600 h-1.5 rounded-full"
                          style={{
                            width: `${(balance.balance_days / balance.total_days) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Leave Requests List */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {loading ? (
                <div className="p-8 text-center text-slate-400">
                  Loading leave requests...
                </div>
              ) : leaveRequests.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  No leave requests yet
                </div>
              ) : (
                leaveRequests.map((request) => (
                  <div
                    key={request.id}
                    className="p-6 rounded-lg border border-slate-700/40 bg-slate-800/20 hover:border-cyan-500/30 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-lg font-semibold text-white">
                          {request.leave_type} Leave
                        </h4>
                        <p className="text-sm text-slate-400">
                          {new Date(request.start_date).toLocaleDateString()} -{" "}
                          {new Date(request.end_date).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[request.status]}`}
                      >
                        {request.status}
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm mb-3">
                      {request.reason}
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                      <span>{request.days_applied} days applied</span>
                      <span>
                        {new Date(request.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {request.status === "Pending" && (
                      <button
                        onClick={() => deleteLeaveRequest(request.id)}
                        className="px-4 py-1 text-xs text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50 rounded transition-colors"
                      >
                        Delete Request
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="space-y-4">
            {loading ? (
              <div className="p-8 text-center text-slate-400">
                Loading pending requests...
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                No pending leave requests
              </div>
            ) : (
              pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-6 rounded-lg border border-slate-700/40 bg-slate-800/20"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Employee</p>
                      <p className="text-white font-semibold">{request.name}</p>
                      <p className="text-xs text-slate-400">
                        {request.employee_code}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">
                        Leave Type & Duration
                      </p>
                      <p className="text-cyan-300 font-semibold">
                        {request.leave_type}
                      </p>
                      <p className="text-xs text-slate-400">
                        {request.days_applied} days
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Period</p>
                      <p className="text-slate-300 text-sm">
                        {new Date(request.start_date).toLocaleDateString()} -{" "}
                        {new Date(request.end_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Department</p>
                      <p className="text-slate-300">{request.department}</p>
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm mb-4">
                    Reason: {request.reason}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => approveLeaveRequest(request.id)}
                      className="px-4 py-2 text-xs uppercase tracking-wider text-green-300 hover:text-green-200 border border-green-500/30 hover:border-green-500/50 rounded transition-colors bg-green-500/10 hover:bg-green-500/20"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => rejectLeaveRequest(request.id)}
                      className="px-4 py-2 text-xs uppercase tracking-wider text-red-300 hover:text-red-200 border border-red-500/30 hover:border-red-500/50 rounded transition-colors bg-red-500/10 hover:bg-red-500/20"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;
