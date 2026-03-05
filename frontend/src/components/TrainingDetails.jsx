import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const inputCls =
  "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all placeholder-gray-400";
const selectCls =
  "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all";
const labelCls = "block text-xs font-medium text-gray-500 mb-1";

const statusBadge = {
  Planned: "bg-blue-50 text-blue-700 border border-blue-200",
  "In Progress": "bg-yellow-50 text-yellow-700 border border-yellow-200",
  Completed: "bg-green-50 text-green-700 border border-green-200",
  Cancelled: "bg-red-50 text-red-700 border border-red-200",
};

const completionBadge = {
  Completed: "bg-green-50 text-green-700 border border-green-200",
  "In Progress": "bg-yellow-50 text-yellow-700 border border-yellow-200",
  "Not Started": "bg-gray-100 text-gray-600 border border-gray-200",
  Pending: "bg-blue-50 text-blue-700 border border-blue-200",
};

const TrainingDetails = ({ program, onUpdate, onClose, onProgramsChange }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [details, setDetails] = useState(program);
  const [assignments, setAssignments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [employeeSearchInput, setEmployeeSearchInput] = useState("");

  const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/training`;

  useEffect(() => {
    fetchProgramDetails();
    fetchEmployees();
  }, [program.id]);

  const fetchEmployees = async () => {
    try {
      const r = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/employees`,
      );
      const d = await r.json();
      if (d.success) setEmployees(d.data);
    } catch {}
  };

  const fetchProgramDetails = async () => {
    try {
      const r = await fetch(`${API_URL}/programs/${program.id}`);
      const d = await r.json();
      if (d.success) {
        setDetails(d.data);
        setAssignments(d.data.assignments || []);
        setSessions(d.data.sessions || []);
      } else toast.error("Failed to fetch program details");
    } catch {
      toast.error("Failed to fetch program details");
    }
  };

  const handleAssignEmployees = async (e) => {
    e.preventDefault();
    if (selectedEmployees.length === 0) {
      toast.warning("Select at least one employee");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/programs/${program.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeIds: selectedEmployees.map((e) => e.id),
        }),
      });
      const d = await r.json();
      if (d.success) {
        toast.success(`${d.count} employees assigned!`);
        setSelectedEmployees([]);
        setEmployeeSearchInput("");
        fetchProgramDetails();
      } else toast.error(d.message);
    } catch {
      toast.error("Failed to assign employees");
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSearchChange = (value) => {
    setEmployeeSearchInput(value);
    if (value.trim()) {
      setFilteredEmployees(
        employees.filter(
          (emp) =>
            !selectedEmployees.some((s) => s.id === emp.id) &&
            !assignments.some((a) => a.employee_id === emp.id) &&
            (emp.employee_id.toLowerCase().includes(value.toLowerCase()) ||
              emp.name?.toLowerCase().includes(value.toLowerCase())),
        ),
      );
      setShowEmployeeDropdown(true);
    } else {
      setFilteredEmployees([]);
      setShowEmployeeDropdown(false);
    }
  };

  const handleUpdateProgram = async (e) => {
    e.preventDefault();
    const success = await onUpdate(program.id, {
      title: details.title,
      type: details.type,
      description: details.description,
      status: details.status,
      duration_hours: details.duration_hours,
      budget: details.budget,
      start_date: details.start_date,
      end_date: details.end_date,
      location: details.location,
      max_participants: details.max_participants,
    });
    if (success) {
      setIsEditing(false);
      fetchProgramDetails();
    }
  };
  const handleDownloadReport = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 18;

    // ── HEADER BANNER ──────────────────────────────────────────────
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageW, 52, "F");

    // Subtle lighter stripe at bottom of header
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 44, pageW, 8, "F");

    // System label
    doc.setTextColor(199, 210, 254);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("TRAINING MANAGEMENT SYSTEM  ·  DETAILED REPORT", margin, 13);

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    const titleLines = doc.splitTextToSize(
      details.title,
      pageW - margin * 2 - 50,
    );
    doc.text(titleLines, margin, 24);

    // Program ID + generated date (right side)
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(199, 210, 254);
    doc.text(`Program ID: #${program.id}`, pageW - margin, 13, {
      align: "right",
    });
    doc.text(
      `Generated: ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`,
      pageW - margin,
      20,
      { align: "right" },
    );

    // Status pill
    const statusBgMap = {
      Planned: [219, 234, 254],
      "In Progress": [254, 243, 199],
      Completed: [220, 252, 231],
      Cancelled: [254, 226, 226],
    };
    const statusTxtMap = {
      Planned: [29, 78, 216],
      "In Progress": [146, 64, 14],
      Completed: [22, 101, 52],
      Cancelled: [185, 28, 28],
    };
    const sBg = statusBgMap[details.status] || [243, 244, 246];
    const sTxt = statusTxtMap[details.status] || [75, 85, 99];
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    const pillW = doc.getTextWidth(details.status) + 9;
    doc.setFillColor(...sBg);
    doc.roundedRect(margin, 34, pillW, 7, 2, 2, "F");
    doc.setTextColor(...sTxt);
    doc.text(details.status, margin + 4.5, 39);

    let y = 62;

    // ── HELPER: section heading ─────────────────────────────────────
    const sectionHeading = (title, iconColor = [37, 99, 235]) => {
      doc.setFillColor(239, 246, 255);
      doc.roundedRect(margin, y, pageW - margin * 2, 8, 3, 3, "F");
      doc.setDrawColor(...iconColor);
      doc.setLineWidth(0.8);
      doc.line(margin, y + 1, margin, y + 7);
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.1);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(37, 99, 235);
      doc.text(title, margin + 4, y + 5.7);
      y += 13;
    };

    // ── OVERVIEW ────────────────────────────────────────────────────
    sectionHeading("PROGRAM OVERVIEW");

    const overviewItems = [
      ["Type", details.type || "—"],
      ["Duration", `${details.duration_hours} hrs`],
      [
        "Start Date",
        details.start_date
          ? new Date(details.start_date).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "—",
      ],
      [
        "End Date",
        details.end_date
          ? new Date(details.end_date).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "—",
      ],
      ["Location", details.location || "—"],
      ["Max Participants", details.max_participants?.toString() || "—"],
      [
        "Budget",
        details.budget
          ? `Rs. ${parseFloat(details.budget).toLocaleString("en-IN")}`
          : "—",
      ],
      ["Assigned Employees", assignments.length.toString()],
    ];

    const colW = (pageW - margin * 2 - 6) / 2;
    overviewItems.forEach(([label, val], i) => {
      const col = i % 2;
      const x = margin + col * (colW + 6);
      if (col === 0 && i > 0) y += 13;
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(156, 163, 175);
      doc.text(label.toUpperCase(), x, y);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(31, 41, 55);
      doc.text(val, x, y + 5.5);
    });
    y += 17;

    if (details.description) {
      doc.setFillColor(249, 250, 251);
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.2);
      const descLines = doc.splitTextToSize(
        details.description,
        pageW - margin * 2 - 8,
      );
      const boxH = 8 + descLines.length * 4.8;
      doc.roundedRect(margin, y, pageW - margin * 2, boxH, 3, 3, "FD");
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(156, 163, 175);
      doc.text("DESCRIPTION", margin + 4, y + 5);
      doc.setFontSize(9);
      doc.setTextColor(75, 85, 99);
      doc.text(descLines, margin + 4, y + 10);
      y += boxH + 8;
    }

    // ── ASSIGNED EMPLOYEES ──────────────────────────────────────────
    if (assignments.length > 0) {
      if (y > pageH - 70) {
        doc.addPage();
        y = 20;
      }
      sectionHeading(`ASSIGNED EMPLOYEES  (${assignments.length})`);
      autoTable(doc, {
        startY: y - 5,
        margin: { left: margin, right: margin },
        head: [["Employee Name", "Email", "Completion Status"]],
        body: assignments.map((a) => [
          a.employee_name || "—",
          a.employee_email || "—",
          a.completion_status || "—",
        ]),
        styles: {
          fontSize: 9,
          cellPadding: { top: 4, bottom: 4, left: 5, right: 5 },
          font: "helvetica",
          textColor: [55, 65, 81],
        },
        headStyles: {
          fillColor: [37, 99, 235],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 8.5,
          cellPadding: { top: 5, bottom: 5, left: 5, right: 5 },
        },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles: { 2: { halign: "center", cellWidth: 38 } },
        tableLineColor: [229, 231, 235],
        tableLineWidth: 0.15,
        theme: "grid",
        didDrawCell: (data) => {
          if (data.section === "body" && data.column.index === 2) {
            const statusVal = data.cell.raw;
            const bgMap = {
              Completed: [220, 252, 231],
              "In Progress": [254, 243, 199],
              "Not Started": [243, 244, 246],
              Pending: [219, 234, 254],
            };
            const txtMap = {
              Completed: [22, 101, 52],
              "In Progress": [146, 64, 14],
              "Not Started": [107, 114, 128],
              Pending: [29, 78, 216],
            };
            const bg = bgMap[statusVal] || [243, 244, 246];
            const txt = txtMap[statusVal] || [107, 114, 128];
            const { x, y: cy, width, height } = data.cell;
            doc.setFillColor(...bg);
            doc.roundedRect(x + 3, cy + 2, width - 6, height - 4, 2, 2, "F");
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...txt);
            doc.text(statusVal, x + width / 2, cy + height / 2 + 1, {
              align: "center",
            });
          }
        },
      });
      y = doc.lastAutoTable.finalY + 10;
    }

    // ── SESSIONS ────────────────────────────────────────────────────
    if (sessions.length > 0) {
      if (y > pageH - 70) {
        doc.addPage();
        y = 20;
      }
      sectionHeading(`TRAINING SESSIONS  (${sessions.length})`);
      autoTable(doc, {
        startY: y - 5,
        margin: { left: margin, right: margin },
        head: [["#", "Session Title", "Date", "Time", "Facilitator", "Status"]],
        body: sessions.map((s) => [
          s.session_number,
          s.title,
          s.scheduled_date
            ? new Date(s.scheduled_date).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "—",
          s.start_time && s.end_time ? `${s.start_time} – ${s.end_time}` : "—",
          s.facilitator_name || "—",
          s.status || "—",
        ]),
        styles: {
          fontSize: 9,
          cellPadding: { top: 4, bottom: 4, left: 5, right: 5 },
          font: "helvetica",
          textColor: [55, 65, 81],
        },
        headStyles: {
          fillColor: [37, 99, 235],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 8.5,
          cellPadding: { top: 5, bottom: 5, left: 5, right: 5 },
        },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        tableLineColor: [229, 231, 235],
        tableLineWidth: 0.15,
        theme: "grid",
        columnStyles: {
          0: { cellWidth: 10, halign: "center" },
          2: { cellWidth: 28 },
          3: { cellWidth: 28 },
          5: { cellWidth: 24, halign: "center" },
        },
      });
      y = doc.lastAutoTable.finalY + 10;
    }

    // ── FOOTER on all pages ─────────────────────────────────────────
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.3);
      doc.line(margin, pageH - 12, pageW - margin, pageH - 12);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(156, 163, 175);
      doc.text(
        "Training Management System  ·  Confidential",
        margin,
        pageH - 6.5,
      );
      doc.text(`Page ${i} of ${totalPages}`, pageW - margin, pageH - 6.5, {
        align: "right",
      });
    }

    doc.save(
      `Training_Report_${details.title.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`,
    );
    toast.success("Report downloaded successfully!");
  };
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "assignments", label: `Assignments (${assignments.length})` },
    { id: "sessions", label: `Sessions (${sessions.length})` },
  ];

  return (
    <div
      className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-3xl max-h-[90vh] flex flex-col"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Modal Header */}
      <div className="flex items-start justify-between p-6 border-b border-gray-100 shrink-0">
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-gray-800 truncate">
              {details.title}
            </h2>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusBadge[details.status] || "bg-gray-100 text-gray-600"}`}
            >
              {details.status}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Program ID: #{program.id}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-all duration-150"
            title="Download detailed PDF report"
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
                d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16"
              />
            </svg>
            Download Report
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-5 h-5"
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
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 px-6 shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3.5 text-xs font-semibold border-b-2 transition-all -mb-px ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Overview */}
        {activeTab === "overview" &&
          (isEditing ? (
            <form onSubmit={handleUpdateProgram} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className={labelCls}>Title</label>
                  <input
                    type="text"
                    value={details.title}
                    onChange={(e) =>
                      setDetails((p) => ({ ...p, title: e.target.value }))
                    }
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <select
                    value={details.status}
                    onChange={(e) =>
                      setDetails((p) => ({ ...p, status: e.target.value }))
                    }
                    className={selectCls}
                  >
                    <option value="Planned">Planned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Type</label>
                  <select
                    value={details.type}
                    onChange={(e) =>
                      setDetails((p) => ({ ...p, type: e.target.value }))
                    }
                    className={selectCls}
                  >
                    <option value="Internal">Internal</option>
                    <option value="External">External</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Start Date</label>
                  <input
                    type="date"
                    value={details.start_date?.slice(0, 10) || ""}
                    onChange={(e) =>
                      setDetails((p) => ({ ...p, start_date: e.target.value }))
                    }
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>End Date</label>
                  <input
                    type="date"
                    value={details.end_date?.slice(0, 10) || ""}
                    onChange={(e) =>
                      setDetails((p) => ({ ...p, end_date: e.target.value }))
                    }
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Duration (hours)</label>
                  <input
                    type="number"
                    value={details.duration_hours}
                    onChange={(e) =>
                      setDetails((p) => ({
                        ...p,
                        duration_hours: e.target.value,
                      }))
                    }
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Max Participants</label>
                  <input
                    type="number"
                    value={details.max_participants || ""}
                    onChange={(e) =>
                      setDetails((p) => ({
                        ...p,
                        max_participants: e.target.value,
                      }))
                    }
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Location</label>
                  <input
                    type="text"
                    value={details.location || ""}
                    onChange={(e) =>
                      setDetails((p) => ({ ...p, location: e.target.value }))
                    }
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Budget</label>
                  <input
                    type="number"
                    value={details.budget || ""}
                    onChange={(e) =>
                      setDetails((p) => ({ ...p, budget: e.target.value }))
                    }
                    className={inputCls}
                  />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Description</label>
                  <textarea
                    rows={3}
                    value={details.description || ""}
                    onChange={(e) =>
                      setDetails((p) => ({ ...p, description: e.target.value }))
                    }
                    className={`${inputCls} resize-none`}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-3 text-sm font-semibold rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-50"
                >
                  {loading ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          ) : (
            <div>
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors"
                >
                  Edit
                </button>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                {[
                  ["Type", details.type],
                  ["Duration", `${details.duration_hours} hours`],
                  [
                    "Start Date",
                    details.start_date
                      ? new Date(details.start_date).toLocaleDateString()
                      : "—",
                  ],
                  [
                    "End Date",
                    details.end_date
                      ? new Date(details.end_date).toLocaleDateString()
                      : "—",
                  ],
                  ["Location", details.location || "—"],
                  ["Max Participants", details.max_participants || "—"],
                  [
                    "Budget",
                    details.budget
                      ? `₨ ${parseFloat(details.budget).toLocaleString("en-IN")}`
                      : "—",
                  ],
                  ["Assigned Employees", assignments.length],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-xs font-medium text-gray-400 mb-0.5">
                      {label}
                    </p>
                    <p className="text-sm font-semibold text-gray-700">{val}</p>
                  </div>
                ))}
                {details.description && (
                  <div className="col-span-2">
                    <p className="text-xs font-medium text-gray-400 mb-0.5">
                      Description
                    </p>
                    <p className="text-sm text-gray-600">
                      {details.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}

        {/* Assignments */}
        {activeTab === "assignments" && (
          <div className="space-y-5">
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-gray-700 mb-3">
                Assign Employees
              </h3>
              <form onSubmit={handleAssignEmployees} className="space-y-3">
                <div className="relative">
                  <label className={labelCls}>
                    Search by Employee ID or Name
                  </label>
                  <input
                    type="text"
                    value={employeeSearchInput}
                    onChange={(e) => handleEmployeeSearchChange(e.target.value)}
                    onFocus={() => {
                      if (employeeSearchInput) setShowEmployeeDropdown(true);
                    }}
                    placeholder="e.g., EMP001 or John…"
                    disabled={loading}
                    className={inputCls}
                  />
                  {showEmployeeDropdown && filteredEmployees.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-40 overflow-y-auto">
                      {filteredEmployees.map((emp) => (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => {
                            setSelectedEmployees((prev) => [...prev, emp]);
                            setEmployeeSearchInput("");
                            setFilteredEmployees([]);
                            setShowEmployeeDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-blue-50 border-b border-gray-50 last:border-0 transition-colors"
                        >
                          <p className="text-sm font-semibold text-gray-800">
                            {emp.employee_id} — {emp.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {emp.position} · {emp.department}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {selectedEmployees.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-500">
                      Selected ({selectedEmployees.length})
                    </p>
                    {selectedEmployees.map((emp) => (
                      <div
                        key={emp.id}
                        className="flex items-center justify-between bg-white border border-blue-100 rounded-xl px-4 py-2.5"
                      >
                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {emp.employee_id} — {emp.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {emp.position} · {emp.department}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedEmployees((prev) =>
                              prev.filter((e) => e.id !== emp.id),
                            )
                          }
                          className="px-2.5 py-1 text-xs font-medium bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading || selectedEmployees.length === 0}
                  className="w-full py-3 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-50"
                >
                  {loading
                    ? "Assigning…"
                    : `Assign ${selectedEmployees.length || ""} Employee${selectedEmployees.length !== 1 ? "s" : ""}`}
                </button>
              </form>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-3">
                Assigned Employees ({assignments.length})
              </h3>
              {assignments.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No employees assigned yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {assignments.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {a.employee_name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {a.employee_email}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${completionBadge[a.completion_status] || "bg-gray-100 text-gray-600"}`}
                      >
                        {a.completion_status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sessions */}
        {activeTab === "sessions" && (
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3">
              Training Sessions ({sessions.length})
            </h3>
            {sessions.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                No sessions created for this program.
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {session.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Session {session.session_number}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadge[session.status] || "bg-gray-100 text-gray-600"}`}
                      >
                        {session.status}
                      </span>
                    </div>
                    {session.description && (
                      <p className="text-xs text-gray-500 mb-3">
                        {session.description}
                      </p>
                    )}
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <p className="text-gray-400 mb-0.5">Date</p>
                        <p className="font-medium text-gray-700">
                          {new Date(
                            session.scheduled_date,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 mb-0.5">Time</p>
                        <p className="font-medium text-gray-700">
                          {session.start_time} – {session.end_time}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 mb-0.5">Facilitator</p>
                        <p className="font-medium text-gray-700">
                          {session.facilitator_name || "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainingDetails;
