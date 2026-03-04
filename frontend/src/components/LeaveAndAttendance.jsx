import { useState, useEffect } from "react";
import { toast } from "react-toastify";

// â”€â”€ helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "â€”";

const STATUS_CFG = {
  Pending: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  Approved: {
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-200",
    dot: "bg-green-500",
  },
  Rejected: {
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
  },
};

const TYPE_COLORS = {
  Annual: "bg-blue-100 text-blue-700",
  Sick: "bg-red-100 text-red-700",
  Casual: "bg-purple-100 text-purple-700",
  Maternity: "bg-pink-100 text-pink-700",
  Paternity: "bg-indigo-100 text-indigo-700",
  Unpaid: "bg-gray-100 text-gray-600",
};

const LEAVE_TYPES = [
  "Annual",
  "Sick",
  "Casual",
  "Maternity",
  "Paternity",
  "Unpaid",
];

const FIELD = ({ label, children }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
      {label}
    </label>
    {children}
  </div>
);

const inputCls =
  "w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all";

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

const getInputCls = (touched, valid) => {
  const base =
    "w-full bg-white rounded-xl px-4 py-2.5 text-sm text-gray-700 outline-none transition-all border";
  if (!touched)
    return `${base} border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100`;
  if (valid)
    return `${base} border-green-400 focus:border-green-400 focus:ring-2 focus:ring-green-100`;
  return `${base} border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-100`;
};

// â”€â”€ New Request Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const NewRequestModal = ({ onSubmit, onCancel, loading }) => {
  const [form, setForm] = useState({
    leave_type: "Annual",
    start_date: "",
    end_date: "",
    reason: "",
  });
  const [touched, setTouched] = useState({});

  const getTomorrowDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  };

  const isValidField = (name) => {
    const tomorrow = getTomorrowDate();
    if (name === "start_date")
      return !!form.start_date && form.start_date >= tomorrow;
    if (name === "end_date")
      return (
        !!form.end_date &&
        form.end_date >= tomorrow &&
        (!form.start_date || form.end_date >= form.start_date)
      );
    if (name === "reason") return form.reason.trim().length >= 5;
    return true;
  };

  const touch = (name) => setTouched((p) => ({ ...p, [name]: true }));

  const days =
    form.start_date && form.end_date
      ? Math.max(
          0,
          Math.round(
            (new Date(form.end_date) - new Date(form.start_date)) /
              (1000 * 60 * 60 * 24),
          ) + 1,
        )
      : 0;

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setTouched((p) => ({ ...p, [e.target.name]: true }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched({ start_date: true, end_date: true, reason: true });
    const tomorrow = getTomorrowDate();
    if (!form.start_date || !form.end_date || !form.reason.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (form.start_date < tomorrow) {
      toast.error("Start date cannot be today or in the past");
      return;
    }
    if (form.end_date < tomorrow) {
      toast.error("End date cannot be today or in the past");
      return;
    }
    if (form.end_date < form.start_date) {
      toast.error("End date cannot be before start date");
      return;
    }
    onSubmit(form);
  };

  return (
    <div
      className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800">New Leave Request</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Fill out the form to submit your request
          </p>
        </div>
        <button
          onClick={onCancel}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all"
        >
          <svg
            className="w-4 h-4"
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
        </button>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <FIELD label="Leave Type">
          <select
            name="leave_type"
            value={form.leave_type}
            onChange={handleChange}
            className={inputCls}
          >
            {LEAVE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </FIELD>
        <div className="grid grid-cols-2 gap-4">
          <FIELD label="Start Date">
            <div className="flex items-center gap-2">
              <input
                type="date"
                name="start_date"
                value={form.start_date}
                min={getTomorrowDate()}
                onChange={handleChange}
                onBlur={() => touch("start_date")}
                className={`${getInputCls(touched.start_date, isValidField("start_date"))} flex-1`}
              />
              {touched.start_date && (
                <ValidationIcon valid={isValidField("start_date")} />
              )}
            </div>
          </FIELD>
          <FIELD label="End Date">
            <div className="flex items-center gap-2">
              <input
                type="date"
                name="end_date"
                value={form.end_date}
                min={form.start_date || getTomorrowDate()}
                onChange={handleChange}
                onBlur={() => touch("end_date")}
                className={`${getInputCls(touched.end_date, isValidField("end_date"))} flex-1`}
              />
              {touched.end_date && (
                <ValidationIcon valid={isValidField("end_date")} />
              )}
            </div>
          </FIELD>
        </div>
        {days > 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-xl">
            <svg
              className="w-4 h-4 text-blue-500 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-sm text-blue-700 font-medium">
              {days} {days === 1 ? "day" : "days"} requested
            </span>
          </div>
        )}
        <FIELD label="Reason">
          <div className="relative">
            <textarea
              name="reason"
              value={form.reason}
              onChange={handleChange}
              onBlur={() => touch("reason")}
              rows={3}
              placeholder="Describe the reason for your leave…"
              className={`${getInputCls(touched.reason, isValidField("reason"))} resize-none pr-8`}
            />
            {touched.reason && (
              <span className="absolute top-2.5 right-2.5 pointer-events-none">
                <ValidationIcon valid={isValidField("reason")} />
              </span>
            )}
          </div>
        </FIELD>
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm disabled:opacity-50"
          >
            {loading ? "Submittingâ€¦" : "Submit Request"}
          </button>
        </div>
      </form>
    </div>
  );
};

// â”€â”€ Delete Confirmation Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const DeleteModal = ({ onConfirm, onCancel }) => (
  <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-sm p-8">
    <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
      <svg
        className="w-6 h-6 text-red-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        />
      </svg>
    </div>
    <h3 className="text-lg font-bold text-gray-800 text-center mb-2">
      Withdraw Request
    </h3>
    <p className="text-sm text-gray-500 text-center mb-6">
      Are you sure you want to withdraw this leave request? This cannot be
      undone.
    </p>
    <div className="flex gap-3">
      <button
        onClick={onCancel}
        className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all"
      >
        Cancel
      </button>
      <button
        onClick={onConfirm}
        className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all"
      >
        Withdraw
      </button>
    </div>
  </div>
);

// â”€â”€ Status Badge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const StatusBadge = ({ status }) => {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.Pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
};

// â”€â”€ Leave Management (main) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const LeaveManagement = () => {
  const [activeTab, setActiveTab] = useState("my");
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null });
  const [statusFilter, setStatusFilter] = useState("");

  const API = "http://localhost:5000/api/leave";
  const token = () => localStorage.getItem("token");

  useEffect(() => {
    if (activeTab === "my") {
      loadMyRequests();
      loadBalance();
    } else {
      loadPending();
    }
  }, [activeTab]);

  const loadMyRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/my-requests`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.success) setLeaveRequests(data.data || []);
    } catch {
      toast.error("Failed to load leave requests");
    } finally {
      setLoading(false);
    }
  };

  const loadPending = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/pending`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.success) setPendingRequests(data.data || []);
    } catch {
      toast.error("Failed to load pending requests");
    } finally {
      setLoading(false);
    }
  };

  const loadBalance = async () => {
    try {
      const res = await fetch(`${API}/balance/1`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.success) setLeaveBalance(data.data || []);
    } catch {
      /* silent */
    }
  };

  const handleSubmitRequest = async (formData) => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/request`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Leave request submitted!");
        setShowNewModal(false);
        loadMyRequests();
        loadBalance();
      } else {
        toast.error(data.message || "Failed to submit");
      }
    } catch {
      toast.error("Error submitting leave request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      const res = await fetch(`${API}/request/${id}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes: "Approved" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Request approved!");
        loadPending();
      } else toast.error(data.message || "Failed to approve");
    } catch {
      toast.error("Error approving request");
    }
  };

  const handleReject = async (id) => {
    try {
      const res = await fetch(`${API}/request/${id}/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes: "Rejected" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Request rejected");
        loadPending();
      } else toast.error(data.message || "Failed to reject");
    } catch {
      toast.error("Error rejecting request");
    }
  };

  const confirmDelete = async () => {
    try {
      const res = await fetch(`${API}/request/${deleteModal.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Request withdrawn");
        loadMyRequests();
      } else toast.error(data.message || "Failed to withdraw");
    } catch {
      toast.error("Error withdrawing request");
    } finally {
      setDeleteModal({ open: false, id: null });
    }
  };

  const filteredRequests = statusFilter
    ? leaveRequests.filter((r) => r.status === statusFilter)
    : leaveRequests;

  const myStats = {
    total: leaveRequests.length,
    pending: leaveRequests.filter((r) => r.status === "Pending").length,
    approved: leaveRequests.filter((r) => r.status === "Approved").length,
    rejected: leaveRequests.filter((r) => r.status === "Rejected").length,
  };

  return (
    <div
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      className="h-full flex flex-col px-6 py-6"
    >
      {/* â”€â”€ Page Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Leave Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Submit, track and manage employee leave requests
          </p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-sm"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Request
        </button>
      </div>

      {/* â”€â”€ Tabs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex border-b border-gray-200 mb-6 shrink-0">
        {[
          { key: "my", label: "My Requests" },
          {
            key: "pending",
            label: "Pending Approvals",
            badge: pendingRequests.length,
          },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all duration-150 -mb-px ${
              activeTab === tab.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {tab.label}
            {tab.badge > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-blue-600 text-white">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* â”€â”€ MY REQUESTS TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {activeTab === "my" && (
        <div className="flex-1 min-h-0 flex flex-col gap-5 overflow-y-auto pb-4">
          {/* Leave balance cards */}
          {leaveBalance.length > 0 && (
            <div className="shrink-0">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Leave Balance
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {leaveBalance.map((b) => {
                  const pct =
                    b.total_days > 0
                      ? Math.round((b.balance_days / b.total_days) * 100)
                      : 0;
                  return (
                    <div
                      key={b.leave_type}
                      className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${TYPE_COLORS[b.leave_type] ?? "bg-gray-100 text-gray-600"}`}
                        >
                          {b.leave_type}
                        </span>
                        <span className="text-xs font-bold text-gray-800">
                          {b.balance_days}
                          <span className="text-gray-400 font-normal">
                            /{b.total_days}
                          </span>
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            background:
                              "linear-gradient(90deg, #2563eb, #3b82f6)",
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1.5 text-right">
                        {b.balance_days} days left
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            {[
              {
                label: "Total",
                value: myStats.total,
                color: "text-gray-800",
                bg: "bg-white",
                border: "border-gray-200",
              },
              {
                label: "Pending",
                value: myStats.pending,
                color: "text-amber-600",
                bg: "bg-amber-50",
                border: "border-amber-100",
              },
              {
                label: "Approved",
                value: myStats.approved,
                color: "text-green-600",
                bg: "bg-green-50",
                border: "border-green-100",
              },
              {
                label: "Rejected",
                value: myStats.rejected,
                color: "text-red-600",
                bg: "bg-red-50",
                border: "border-red-100",
              },
            ].map((s) => (
              <div
                key={s.label}
                className={`${s.bg} border ${s.border} rounded-xl p-4 shadow-sm`}
              >
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {s.label} Requests
                </p>
              </div>
            ))}
          </div>

          {/* Filter + list */}
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex items-center gap-3 mb-4 shrink-0">
              <span className="text-sm font-semibold text-gray-700">
                {filteredRequests.length} request
                {filteredRequests.length !== 1 ? "s" : ""}
              </span>
              <div className="flex gap-1.5 ml-auto">
                {["", "Pending", "Approved", "Rejected"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      statusFilter === s
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600"
                    }`}
                  >
                    {s || "All"}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 overflow-y-auto pr-1 flex-1 min-h-0">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <svg
                    className="w-12 h-12 text-gray-300 mb-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm font-medium text-gray-500">
                    No requests found
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Submit a new request using the button above
                  </p>
                </div>
              ) : (
                filteredRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:border-blue-200 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${TYPE_COLORS[req.leave_type] ?? "bg-gray-100 text-gray-600"}`}
                        >
                          {req.leave_type?.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">
                            {req.leave_type} Leave
                          </p>
                          <p className="text-xs text-gray-400">
                            {fmt(req.start_date)} â€“ {fmt(req.end_date)}
                            {req.days_applied && (
                              <span className="ml-2 font-semibold text-gray-600">
                                Â· {req.days_applied}{" "}
                                {req.days_applied === 1 ? "day" : "days"}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={req.status} />
                    </div>
                    {req.reason && (
                      <p className="text-sm text-gray-600 mb-3 leading-relaxed line-clamp-2">
                        {req.reason}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        Submitted {fmt(req.created_at)}
                      </span>
                      {req.status === "Pending" && (
                        <button
                          onClick={() =>
                            setDeleteModal({ open: true, id: req.id })
                          }
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-500 hover:text-red-600 border border-red-200 hover:border-red-300 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          Withdraw
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ PENDING APPROVALS TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {activeTab === "pending" && (
        <div className="flex-1 min-h-0 overflow-hidden bg-white border border-gray-200 rounded-2xl shadow-sm">
          <div className="h-full overflow-y-auto">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Department
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Leave Type
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Period
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Reason
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-gray-400">
                          Loading pending requestsâ€¦
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : pendingRequests.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <svg
                          className="w-12 h-12 text-gray-300"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <p className="text-sm font-medium text-gray-500">
                          All caught up!
                        </p>
                        <p className="text-xs text-gray-400">
                          No pending leave requests to review
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pendingRequests.map((req) => (
                    <tr
                      key={req.id}
                      className="hover:bg-blue-50/40 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {req.name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800 leading-tight">
                              {req.name}
                            </p>
                            <p className="text-xs text-gray-400 font-mono">
                              {req.employee_code}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className="text-sm text-gray-600">
                          {req.department || "â€”"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold ${TYPE_COLORS[req.leave_type] ?? "bg-gray-100 text-gray-600"}`}
                        >
                          {req.leave_type}
                        </span>
                        {req.days_applied && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {req.days_applied}{" "}
                            {req.days_applied === 1 ? "day" : "days"}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 hidden sm:table-cell">
                        <p className="text-sm text-gray-700">
                          {fmt(req.start_date)}
                        </p>
                        <p className="text-xs text-gray-400">
                          to {fmt(req.end_date)}
                        </p>
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell max-w-xs">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {req.reason || "â€”"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApprove(req.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 hover:border-green-300 transition-all"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2.5}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(req.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 hover:border-red-300 transition-all"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2.5}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* â”€â”€ New Request Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {showNewModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowNewModal(false)}
        >
          <NewRequestModal
            onSubmit={handleSubmitRequest}
            onCancel={() => setShowNewModal(false)}
            loading={submitting}
          />
        </div>
      )}

      {/* â”€â”€ Delete Confirmation Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <DeleteModal
            onConfirm={confirmDelete}
            onCancel={() => setDeleteModal({ open: false, id: null })}
          />
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;
