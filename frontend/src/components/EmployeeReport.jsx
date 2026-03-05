import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  PieChart,
  Pie,
  Cell,
  Label,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const MONTH_FULL = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const STATUS_COLORS = {
  Present: "#2563eb",
  Absent: "#ef4444",
  Leave: "#a855f7",
  "Half Day": "#f59e0b",
  "Work From Home": "#10b981",
};

const LEAVE_TYPE_COLORS = {
  Annual: "bg-blue-100 text-blue-700",
  Sick: "bg-red-100 text-red-700",
  Casual: "bg-purple-100 text-purple-700",
  Maternity: "bg-pink-100 text-pink-700",
  Paternity: "bg-indigo-100 text-indigo-700",
  Unpaid: "bg-gray-100 text-gray-600",
};

const token = () => localStorage.getItem("token");

const api = (path) =>
  fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${path}`, {
    headers: { Authorization: `Bearer ${token()}` },
  }).then((r) => r.json());

const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

// ── Donut centre label ────────────────────────────────────────────────────────
const DonutLabel = ({ viewBox, value, label }) => {
  const { cx, cy } = viewBox;
  return (
    <g>
      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        fill="#1f2937"
        style={{ fontSize: 22, fontWeight: 700 }}
      >
        {value}
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        fill="#9ca3af"
        style={{ fontSize: 11 }}
      >
        {label}
      </text>
    </g>
  );
};

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, bg, text, border }) => (
  <div className={`${bg} border ${border} rounded-xl p-4 shadow-sm`}>
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
      {label}
    </p>
    <p className={`text-3xl font-bold ${text}`}>{value ?? 0}</p>
    <p className="text-xs text-gray-400 mt-0.5">days</p>
  </div>
);

export default function EmployeeReport() {
  const now = new Date();
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [report, setReport] = useState(null);
  const [leaveBalance, setLeaveBalance] = useState([]);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [trend, setTrend] = useState([]);
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    api("/api/employees").then((d) => {
      if (d.success || Array.isArray(d.data)) setEmployees(d.data || []);
    });
  }, []);

  useEffect(() => {
    if (!selectedEmp) return;
    loadEmployeeReport(selectedEmp, month, year);
  }, [selectedEmp, month, year]);

  const loadEmployeeReport = async (emp, m, y) => {
    setLoadingReport(true);
    try {
      const [rpt, bal, hist, trendData] = await Promise.all([
        api(`/api/attendance/report/${emp.id}?month=${m}&year=${y}`),
        api(`/api/leave/balance/${emp.id}?year=${y}`),
        api(`/api/leave/employee/${emp.id}`),
        Promise.all(
          Array.from({ length: 6 }, (_, i) => {
            const d = new Date(y, m - 1 - i, 1);
            return api(
              `/api/attendance/report/${emp.id}?month=${d.getMonth() + 1}&year=${d.getFullYear()}`,
            ).then((r) => ({
              month: MONTHS[d.getMonth()],
              present: Number(r.data?.present) || 0,
              absent: Number(r.data?.absent) || 0,
              leave: Number(r.data?.leave) || 0,
              wfh: Number(r.data?.work_from_home) || 0,
            }));
          }),
        ),
      ]);
      setReport(rpt.data || null);
      setLeaveBalance(bal.data || []);
      setLeaveHistory((hist.data || []).slice(0, 8));
      setTrend([...trendData].reverse());
    } catch (err) {
      toast.error("Failed to load report: " + err.message);
    } finally {
      setLoadingReport(false);
    }
  };

  const departments = [
    "All",
    ...new Set(employees.map((e) => e.department).filter(Boolean)),
  ];

  const filteredEmployees = employees.filter((e) => {
    const matchSearch =
      e.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.employee_id?.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === "All" || e.department === deptFilter;
    return matchSearch && matchDept;
  });

  const pieData = report
    ? [
        { name: "Present", value: Number(report.present) || 0 },
        { name: "Absent", value: Number(report.absent) || 0 },
        { name: "Leave", value: Number(report.leave) || 0 },
        { name: "Half Day", value: Number(report.half_day) || 0 },
        { name: "Work From Home", value: Number(report.work_from_home) || 0 },
      ].filter((d) => d.value > 0)
    : [];

  const totalTracked = pieData.reduce((s, d) => s + d.value, 0);
  const years = Array.from({ length: 4 }, (_, i) => now.getFullYear() - i);

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.width;

    // ── Blue header ────────────────────────────────────────────────────────
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageW, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Employee Report", 14, 16);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${MONTH_FULL[month - 1]} ${year}  ·  Generated: ${new Date().toLocaleString("en-US")}`,
      14,
      26,
    );

    // ── Employee profile card ──────────────────────────────────────────────
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 48, pageW - 28, 34, 3, 3, "FD");

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(selectedEmp.name || "", 20, 60);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    const profileLine = [
      selectedEmp.employee_id,
      selectedEmp.designation,
      selectedEmp.department,
    ]
      .filter(Boolean)
      .join("  ·  ");
    doc.text(profileLine, 20, 69);

    doc.setFontSize(8);
    const statusLabel = selectedEmp.status || "";
    doc.setTextColor(
      selectedEmp.status === "Permanent" ? 21 : 180,
      selectedEmp.status === "Permanent" ? 128 : 120,
      selectedEmp.status === "Permanent" ? 61 : 20,
    );
    doc.text(`Status: ${statusLabel}`, 20, 77);

    // ── Attendance summary ────────────────────────────────────────────────
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Attendance Summary", 14, 95);

    const summaryRows = [
      ["Present", report?.present ?? 0],
      ["Absent", report?.absent ?? 0],
      ["Leave", report?.leave ?? 0],
      ["Half Day", report?.half_day ?? 0],
      ["Work From Home", report?.work_from_home ?? 0],
    ];

    const colW = (pageW - 28) / summaryRows.length;
    const boxY = 99;
    const boxH = 24;
    const statusBg = {
      Present: [239, 246, 255],
      Absent: [254, 242, 242],
      Leave: [250, 245, 255],
      "Half Day": [255, 251, 235],
      "Work From Home": [240, 253, 244],
    };
    summaryRows.forEach(([label, value], i) => {
      const x = 14 + i * colW;
      const bg = statusBg[label] || [249, 250, 251];
      doc.setFillColor(...bg);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, boxY, colW - 2, boxH, 2, 2, "FD");
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text(String(value), x + colW / 2 - 1, boxY + 12, { align: "center" });
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(label, x + colW / 2 - 1, boxY + 20, { align: "center" });
    });

    // ── 6-month trend table ───────────────────────────────────────────────
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("6-Month Attendance Trend", 14, 136);

    autoTable(doc, {
      head: [["Month", "Present", "Absent", "Leave", "WFH"]],
      body: trend.map((t) => [t.month, t.present, t.absent, t.leave, t.wfh]),
      startY: 139,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: "bold",
      },
      columnStyles: {
        0: { fontStyle: "bold" },
        1: { textColor: [37, 99, 235] },
        2: { textColor: [239, 68, 68] },
        3: { textColor: [168, 85, 247] },
        4: { textColor: [16, 185, 129] },
      },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      margin: { left: 14, right: 14 },
    });

    // ── Leave balance table ───────────────────────────────────────────────
    const afterTrend = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(`Leave Balance  (Year ${year})`, 14, afterTrend);

    autoTable(doc, {
      head: [["Leave Type", "Total Days", "Used Days", "Balance Days"]],
      body: leaveBalance.map((b) => [
        b.leave_type,
        Number(b.total_days) || 0,
        Number(b.used_days) || 0,
        Number(b.balance_days) || 0,
      ]),
      startY: afterTrend + 3,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      margin: { left: 14, right: 14 },
    });

    // ── Recent leave requests table ───────────────────────────────────────
    const afterBalance = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("Recent Leave Requests", 14, afterBalance);

    autoTable(doc, {
      head: [["Type", "From", "To", "Days", "Reason", "Status"]],
      body: leaveHistory.map((l) => [
        l.leave_type,
        fmt(l.start_date),
        fmt(l.end_date),
        Number(l.days_applied),
        l.reason || "—",
        l.status,
      ]),
      startY: afterBalance + 3,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: "bold",
      },
      columnStyles: { 4: { cellWidth: 50 } },
      didParseCell(data) {
        if (data.section === "body" && data.column.index === 5) {
          const s = data.cell.raw;
          if (s === "Approved") data.cell.styles.textColor = [21, 128, 61];
          else if (s === "Rejected") data.cell.styles.textColor = [220, 38, 38];
          else data.cell.styles.textColor = [180, 120, 20];
        }
      },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      margin: { left: 14, right: 14 },
    });

    // ── Page footer ───────────────────────────────────────────────────────
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageW / 2,
        doc.internal.pageSize.height - 8,
        { align: "center" },
      );
    }

    doc.save(
      `Report_${selectedEmp.employee_id}_${MONTH_FULL[month - 1]}_${year}.pdf`,
    );
  };

  const inputCls =
    "w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all";

  return (
    <div
      className="flex h-full"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* ── Left Sidebar ─────────────────────────────────────────────────── */}
      <div className="w-72 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col h-full overflow-hidden">
        {/* Sidebar header */}
        <div className="px-5 py-5 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            Employee Reports
          </h2>
          <input
            type="text"
            placeholder="Search name or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={inputCls + " mb-3"}
          />
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className={inputCls}
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Employee list */}
        <div className="flex-1 overflow-y-auto">
          {filteredEmployees.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-10 px-4">
              No employees found
            </p>
          ) : (
            filteredEmployees.map((emp) => (
              <button
                key={emp.id}
                onClick={() => setSelectedEmp(emp)}
                className={`w-full text-left px-4 py-3.5 border-b border-gray-100 transition-all ${
                  selectedEmp?.id === emp.id
                    ? "bg-blue-50 border-l-2 border-l-blue-600"
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {emp.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-semibold truncate ${selectedEmp?.id === emp.id ? "text-blue-700" : "text-gray-800"}`}
                    >
                      {emp.name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {emp.employee_id} · {emp.department}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Right Panel ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {!selectedEmp ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-5">
              <svg
                className="w-8 h-8 text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-1">
              Select an Employee
            </h3>
            <p className="text-sm text-gray-400">
              Choose an employee from the list to view their report
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* ── Employee Header ─────────────────────────────────────── */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xl font-bold shrink-0">
                    {selectedEmp.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 leading-tight">
                      {selectedEmp.name}
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {selectedEmp.employee_id}
                      {selectedEmp.designation &&
                        ` · ${selectedEmp.designation}`}
                      {selectedEmp.department && ` · ${selectedEmp.department}`}
                    </p>
                    <span
                      className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        selectedEmp.status === "Permanent"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {selectedEmp.status}
                    </span>
                  </div>
                </div>

                {/* Period selectors + Download */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <select
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                  >
                    {MONTHS.map((m, i) => (
                      <option key={m} value={i + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={generatePDF}
                    disabled={!report}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
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
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Download PDF
                  </button>
                </div>
              </div>
            </div>

            {loadingReport ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-400">Loading report…</p>
              </div>
            ) : (
              <>
                {/* ── Stat Cards ──────────────────────────────────────── */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <StatCard
                    label="Present"
                    value={report?.present}
                    bg="bg-white"
                    text="text-blue-600"
                    border="border-gray-200"
                  />
                  <StatCard
                    label="Absent"
                    value={report?.absent}
                    bg="bg-red-50"
                    text="text-red-600"
                    border="border-red-100"
                  />
                  <StatCard
                    label="Leave"
                    value={report?.leave}
                    bg="bg-purple-50"
                    text="text-purple-600"
                    border="border-purple-100"
                  />
                  <StatCard
                    label="Half Day"
                    value={report?.half_day}
                    bg="bg-amber-50"
                    text="text-amber-600"
                    border="border-amber-100"
                  />
                  <StatCard
                    label="WFH"
                    value={report?.work_from_home}
                    bg="bg-green-50"
                    text="text-green-600"
                    border="border-green-100"
                  />
                </div>

                {/* ── Charts ──────────────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Donut — attendance breakdown */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-700 mb-1">
                      Attendance Breakdown
                    </h3>
                    <p className="text-xs text-gray-400 mb-4">
                      {MONTH_FULL[month - 1]} {year}
                    </p>
                    {pieData.length === 0 ? (
                      <div className="flex items-center justify-center h-52 text-sm text-gray-400">
                        No data for this period
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={85}
                            paddingAngle={3}
                            dataKey="value"
                            labelLine={false}
                          >
                            {pieData.map((entry) => (
                              <Cell
                                key={entry.name}
                                fill={STATUS_COLORS[entry.name] || "#9ca3af"}
                              />
                            ))}
                            <Label
                              content={
                                <DonutLabel value={totalTracked} label="days" />
                              }
                              position="center"
                            />
                          </Pie>
                          <Tooltip
                            wrapperStyle={{ outline: "none" }}
                            contentStyle={{
                              background: "#fff",
                              border: "1px solid #e5e7eb",
                              borderRadius: 10,
                              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                              padding: "8px 12px",
                            }}
                            itemStyle={{ color: "#374151", fontSize: 12 }}
                            formatter={(v, n) => [`${v} days`, n]}
                          />
                          <Legend
                            iconType="circle"
                            iconSize={8}
                            formatter={(v) => (
                              <span style={{ color: "#6b7280", fontSize: 12 }}>
                                {v}
                              </span>
                            )}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* Bar — 6-month trend */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-700 mb-1">
                      6-Month Attendance Trend
                    </h3>
                    <p className="text-xs text-gray-400 mb-4">
                      Last 6 months overview
                    </p>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart
                        data={trend}
                        margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis
                          dataKey="month"
                          tick={{ fill: "#9ca3af", fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: "#9ca3af", fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "#fff",
                            border: "1px solid #e5e7eb",
                            borderRadius: 10,
                            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                          }}
                          itemStyle={{ color: "#374151", fontSize: 12 }}
                        />
                        <Legend
                          iconType="circle"
                          iconSize={8}
                          formatter={(v) => (
                            <span style={{ color: "#6b7280", fontSize: 12 }}>
                              {v}
                            </span>
                          )}
                        />
                        <Bar
                          dataKey="present"
                          name="Present"
                          fill="#2563eb"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="absent"
                          name="Absent"
                          fill="#ef4444"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="leave"
                          name="Leave"
                          fill="#a855f7"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="wfh"
                          name="WFH"
                          fill="#10b981"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* ── Leave Balance ────────────────────────────────────── */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-gray-700">
                        Leave Balance
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Year {year}
                      </p>
                    </div>
                  </div>
                  {leaveBalance.length === 0 ? (
                    <p className="text-sm text-gray-400 py-4 text-center">
                      No leave balance data for this year
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      {leaveBalance.map((b) => {
                        const pct =
                          b.total_days > 0
                            ? (b.balance_days / b.total_days) * 100
                            : 0;
                        return (
                          <div
                            key={b.leave_type}
                            className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span
                                className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${LEAVE_TYPE_COLORS[b.leave_type] ?? "bg-gray-100 text-gray-600"}`}
                              >
                                {b.leave_type}
                              </span>
                              <span className="text-xs font-bold text-gray-800">
                                {Number(b.balance_days) || 0}
                                <span className="text-gray-400 font-normal">
                                  /{Number(b.total_days) || 0}
                                </span>
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${Math.min(100, pct)}%`,
                                  background:
                                    "linear-gradient(90deg,#2563eb,#3b82f6)",
                                }}
                              />
                            </div>
                            <p className="text-xs text-gray-400 mt-1.5 text-right">
                              {Number(b.balance_days) || 0} left
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ── Recent Leave Requests ────────────────────────────── */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h3 className="text-sm font-bold text-gray-700">
                      Recent Leave Requests
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Last 8 requests
                    </p>
                  </div>
                  {leaveHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <svg
                        className="w-10 h-10 text-gray-300 mb-3"
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
                      <p className="text-sm text-gray-500">
                        No leave requests found
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            {[
                              "Type",
                              "From",
                              "To",
                              "Days",
                              "Reason",
                              "Status",
                            ].map((h) => (
                              <th
                                key={h}
                                className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {leaveHistory.map((l) => (
                            <tr
                              key={l.id}
                              className="hover:bg-blue-50/40 transition-colors"
                            >
                              <td className="px-5 py-4">
                                <span
                                  className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold ${LEAVE_TYPE_COLORS[l.leave_type] ?? "bg-gray-100 text-gray-600"}`}
                                >
                                  {l.leave_type}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-sm text-gray-700">
                                {fmt(l.start_date)}
                              </td>
                              <td className="px-5 py-4 text-sm text-gray-700">
                                {fmt(l.end_date)}
                              </td>
                              <td className="px-5 py-4 text-sm text-gray-600">
                                {Number(l.days_applied)}
                              </td>
                              <td className="px-5 py-4 text-sm text-gray-500 max-w-xs truncate">
                                {l.reason || "—"}
                              </td>
                              <td className="px-5 py-4">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                    l.status === "Approved"
                                      ? "bg-green-100 text-green-700 border-green-200"
                                      : l.status === "Rejected"
                                        ? "bg-red-100 text-red-700 border-red-200"
                                        : "bg-amber-100 text-amber-700 border-amber-200"
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      l.status === "Approved"
                                        ? "bg-green-500"
                                        : l.status === "Rejected"
                                          ? "bg-red-500"
                                          : "bg-amber-500"
                                    }`}
                                  />
                                  {l.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
