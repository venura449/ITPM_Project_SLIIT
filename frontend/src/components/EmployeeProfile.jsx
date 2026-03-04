import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

const statusCls = {
  Permanent: "bg-green-50 text-green-700 border-green-200",
  Probation: "bg-yellow-50 text-yellow-700 border-yellow-200",
  Resigned: "bg-red-50 text-red-700 border-red-200",
};

const inputCls =
  "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-white outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all placeholder-gray-400 disabled:opacity-50 disabled:bg-gray-50";
const selectCls =
  "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-white outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all disabled:opacity-50 disabled:bg-gray-50";
const labelCls = "block text-xs font-medium text-gray-500 mb-1.5";

const EmployeeProfile = ({ employee, onUpdate, onClose }) => {
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: employee.phone || "",
    address: employee.address || "",
    department: employee.department || "",
    position: employee.position || "",
    status: employee.status || "Probation",
    salary: employee.salary || "",
    designation: employee.designation || "",
    notes: employee.notes || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    try {
      const success = await onUpdate(employee.id, {
        phone: formData.phone,
        address: formData.address,
        department: formData.department,
        position: formData.position,
        status: formData.status,
        salary: formData.salary ? parseFloat(formData.salary) : null,
        designation: formData.designation,
        notes: formData.notes,
      });
      if (success) setEditMode(false);
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditMode(false);
    setFormData({
      phone: employee.phone || "",
      address: employee.address || "",
      department: employee.department || "",
      position: employee.position || "",
      status: employee.status || "Probation",
      salary: employee.salary || "",
      designation: employee.designation || "",
      notes: employee.notes || "",
    });
  };

  const daysEmployed = Math.floor(
    (new Date() - new Date(employee.joining_date)) / 86400000,
  );

  const fmt = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "—";

  const generatePDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    const primary = [37, 99, 235]; // blue-600
    const dark = [31, 41, 55]; // gray-800
    const muted = [107, 114, 128]; // gray-500
    const W = doc.internal.pageSize.getWidth();

    // ── Header band ────────────────────────────────────────────────────────
    doc.setFillColor(...primary);
    doc.rect(0, 0, W, 32, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Employee Report", 14, 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
    doc.text(`Employee ID: ${employee.employee_id || "—"}`, W - 14, 22, {
      align: "right",
    });

    // ── Avatar circle + name block ──────────────────────────────────────────
    const initials = (employee.name || "?").charAt(0).toUpperCase();
    doc.setFillColor(219, 234, 254); // blue-100
    doc.circle(22, 46, 10, "F");
    doc.setTextColor(...primary);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(initials, 22, 50, { align: "center" });

    doc.setTextColor(...dark);
    doc.setFontSize(14);
    doc.text(employee.name || "—", 36, 44);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...muted);
    doc.setFontSize(9);
    doc.text(employee.email || "—", 36, 50);

    // Status pill
    const statusColors = {
      Permanent: [22, 163, 74],
      Probation: [217, 119, 6],
      Resigned: [220, 38, 38],
    };
    const sColor = statusColors[employee.status] || muted;
    doc.setFillColor(...sColor);
    doc.roundedRect(W - 40, 38, 26, 8, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(employee.status || "—", W - 27, 43.5, { align: "center" });

    let y = 62;

    // ── Section helper ──────────────────────────────────────────────────────
    const section = (title) => {
      doc.setFillColor(239, 246, 255); // blue-50
      doc.rect(14, y, W - 28, 7, "F");
      doc.setTextColor(...primary);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(title.toUpperCase(), 16, y + 5);
      y += 10;
    };

    // ── Personal Information ────────────────────────────────────────────────
    section("Personal Information");
    autoTable(doc, {
      startY: y,
      margin: { left: 14, right: 14 },
      theme: "plain",
      styles: {
        fontSize: 9,
        cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
      },
      columnStyles: {
        0: { fontStyle: "bold", textColor: muted, cellWidth: 45 },
        1: { textColor: dark },
      },
      body: [
        ["Full Name", employee.name || "—"],
        ["Email Address", employee.email || "—"],
        ["Phone", employee.phone || "—"],
        ["Home Address", employee.address || "—"],
      ],
      didDrawPage: (d) => {
        y = d.cursor.y + 4;
      },
    });
    y = doc.lastAutoTable.finalY + 6;

    // ── Employment Details ──────────────────────────────────────────────────
    section("Employment Details");
    autoTable(doc, {
      startY: y,
      margin: { left: 14, right: 14 },
      theme: "plain",
      styles: {
        fontSize: 9,
        cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
      },
      columnStyles: {
        0: { fontStyle: "bold", textColor: muted, cellWidth: 45 },
        1: { textColor: dark },
      },
      body: [
        ["Department", employee.department || "—"],
        ["Position", employee.position || "—"],
        ["Designation", employee.designation || "—"],
        ["Employment Status", employee.status || "—"],
        ["Joining Date", fmt(employee.joining_date)],
        ["Days Employed", `${daysEmployed} days`],
        [
          "Monthly Salary",
          employee.salary
            ? `Rs. ${parseFloat(employee.salary).toLocaleString("en-IN")}`
            : "—",
        ],
      ],
    });
    y = doc.lastAutoTable.finalY + 6;

    // ── Lifecycle & Timeline ────────────────────────────────────────────────
    section("Lifecycle & Timeline");
    const lifeCycleRows = [["Joined", fmt(employee.joining_date)]];
    if (employee.probation_end_date)
      lifeCycleRows.push([
        "Probation End Date",
        fmt(employee.probation_end_date),
      ]);
    if (employee.resignation_date)
      lifeCycleRows.push(["Resignation Date", fmt(employee.resignation_date)]);
    if (employee.manager_name)
      lifeCycleRows.push(["Reporting Manager", employee.manager_name]);
    autoTable(doc, {
      startY: y,
      margin: { left: 14, right: 14 },
      theme: "plain",
      styles: {
        fontSize: 9,
        cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
      },
      columnStyles: {
        0: { fontStyle: "bold", textColor: muted, cellWidth: 45 },
        1: { textColor: dark },
      },
      body: lifeCycleRows,
    });
    y = doc.lastAutoTable.finalY + 6;

    // ── Notes ───────────────────────────────────────────────────────────────
    if (employee.notes) {
      section("Notes");
      autoTable(doc, {
        startY: y,
        margin: { left: 14, right: 14 },
        theme: "plain",
        styles: {
          fontSize: 9,
          cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
          textColor: dark,
        },
        body: [[employee.notes]],
      });
      y = doc.lastAutoTable.finalY + 6;
    }

    // ── Footer ──────────────────────────────────────────────────────────────
    const pageH = doc.internal.pageSize.getHeight();
    doc.setDrawColor(229, 231, 235);
    doc.line(14, pageH - 14, W - 14, pageH - 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...muted);
    doc.text("Confidential — HR Department", 14, pageH - 8);
    doc.text(`Page 1`, W - 14, pageH - 8, { align: "right" });

    doc.save(`Employee_Report_${employee.employee_id || employee.name}.pdf`);
  };

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* ── Header ── */}
      <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-bold shrink-0 shadow-md">
          {employee.name?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-lg font-bold text-gray-800 truncate">
              {employee.name}
            </h2>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusCls[employee.status] || "bg-gray-100 text-gray-600 border-gray-200"}`}
            >
              {employee.status}
            </span>
          </div>
          <p className="text-sm text-gray-400 truncate mt-0.5">
            {employee.email}
            <span className="mx-1.5 text-gray-300">·</span>
            <span className="text-blue-500 font-medium">
              {employee.employee_id}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={generatePDF}
            title="Download Employee Report"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
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
                d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"
              />
            </svg>
            Download Report
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Icon d="M6 18L18 6M6 6l12 12" className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="p-6 grid grid-cols-3 gap-6">
        {/* Left: info / edit form */}
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Employee Information
            </h3>
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 transition-colors"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={cancelEdit}
                  disabled={loading}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={loading}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-50 shadow-sm"
                >
                  {loading ? "Saving…" : "Save Changes"}
                </button>
              </div>
            )}
          </div>

          {!editMode ? (
            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
              {[
                ["Department", employee.department || "—"],
                ["Position", employee.position || "—"],
                ["Designation", employee.designation || "—"],
                ["Phone", employee.phone || "—"],
                ["Address", employee.address || "—"],
                [
                  "Joining Date",
                  new Date(employee.joining_date).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  }),
                ],
                ...(employee.salary
                  ? [
                      [
                        "Monthly Salary",
                        `₨ ${parseFloat(employee.salary).toLocaleString("en-IN")}`,
                      ],
                    ]
                  : []),
                ...(employee.notes ? [["Notes", employee.notes]] : []),
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                    {label}
                  </p>
                  <p className="text-sm text-gray-700 font-medium break-words">
                    {val}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="+94 71 234 5678"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Street address"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Department</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  disabled={loading}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Position</label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  disabled={loading}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Designation</label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  disabled={loading}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={loading}
                  className={selectCls}
                >
                  <option value="Probation">Probation</option>
                  <option value="Permanent">Permanent</option>
                  <option value="Resigned">Resigned</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Monthly Salary</label>
                <input
                  type="number"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  disabled={loading}
                  step="0.01"
                  placeholder="50000"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  disabled={loading}
                  rows="2"
                  className={`${inputCls} resize-none`}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right: stats sidebar */}
        <div className="space-y-4">
          {/* Days Employed */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
              Days Employed
            </p>
            <p className="text-4xl font-bold text-blue-600">{daysEmployed}</p>
            <p className="text-xs text-blue-400 mt-1">days on team</p>
          </div>

          {/* Lifecycle */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Lifecycle
            </p>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Joined</span>
                <span className="text-gray-700 font-medium">
                  {new Date(employee.joining_date).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              {employee.probation_end_date && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Probation ends</span>
                  <span className="text-yellow-600 font-medium">
                    {new Date(employee.probation_end_date).toLocaleDateString(
                      "en-US",
                      { day: "numeric", month: "short", year: "numeric" },
                    )}
                  </span>
                </div>
              )}
              {employee.resignation_date && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Resigned</span>
                  <span className="text-red-500 font-medium">
                    {new Date(employee.resignation_date).toLocaleDateString(
                      "en-US",
                      { day: "numeric", month: "short", year: "numeric" },
                    )}
                  </span>
                </div>
              )}
              {employee.manager_name && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Manager</span>
                  <span className="text-gray-700 font-medium">
                    {employee.manager_name}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Employee ID */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Employee ID
            </p>
            <p className="text-sm text-blue-600 font-bold tracking-widest">
              {employee.employee_id}
            </p>
          </div>

          {/* Department & Position pills */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
              Role
            </p>
            <div className="flex flex-wrap gap-1.5">
              {employee.department && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium border border-blue-100">
                  {employee.department}
                </span>
              )}
              {employee.position && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-purple-50 text-purple-600 text-xs font-medium border border-purple-100">
                  {employee.position}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;
