import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
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

const STATUS_CONFIG = {
  Present: {
    abbr: "P",
    color: "bg-green-100 text-green-700 border-green-200",
    dot: "bg-green-500",
    btn: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100",
    selected: "bg-green-500 text-white border-green-500",
  },
  Absent: {
    abbr: "A",
    color: "bg-red-100 text-red-700 border-red-200",
    dot: "bg-red-500",
    btn: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
    selected: "bg-red-500 text-white border-red-500",
  },
  Leave: {
    abbr: "L",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
    btn: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
    selected: "bg-amber-500 text-white border-amber-500",
  },
  "Half Day": {
    abbr: "H",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
    btn: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
    selected: "bg-blue-500 text-white border-blue-500",
  },
  "Work From Home": {
    abbr: "WFH",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    dot: "bg-purple-500",
    btn: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100",
    selected: "bg-purple-500 text-white border-purple-500",
  },
};

const STATUSES = Object.keys(STATUS_CONFIG);

const DailyAttendance = () => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [attendanceData, setAttendanceData] = useState([]);
  const [markedAttendance, setMarkedAttendance] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const searchRef = useRef(null);

  useEffect(() => {
    loadAttendanceSheet();
  }, [selectedDate]);

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const loadAttendanceSheet = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/attendance/sheet?date=${selectedDate}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      const data = await res.json();
      if (data.success) {
        setAttendanceData(data.data || []);
        const marked = {};
        (data.data || []).forEach((r) => {
          if (r.attendance_status && r.attendance_status !== "Not Marked") {
            marked[r.employee_id] = r.attendance_status;
          }
        });
        setMarkedAttendance(marked);
      }
    } catch (err) {
      toast.error("Failed to load attendance sheet");
    } finally {
      setLoading(false);
    }
  };

  const searchEmployees = async (q) => {
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await fetch(
        `http://localhost:5000/api/attendance/search?query=${encodeURIComponent(q)}&date=${selectedDate}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      const data = await res.json();
      if (data.success) setSearchResults(data.data || []);
    } catch {
      // silently ignore search errors
    }
  };

  const markAttendance = async (employeeId, status) => {
    setSaving((prev) => ({ ...prev, [employeeId]: true }));
    try {
      const res = await fetch("http://localhost:5000/api/attendance/mark", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employee_id: employeeId,
          date: selectedDate,
          status,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMarkedAttendance((prev) => ({ ...prev, [employeeId]: status }));
        toast.success(`Marked as ${status}`, { autoClose: 1500 });
      } else {
        toast.error(data.message || "Failed to mark attendance");
      }
    } catch {
      toast.error("Error marking attendance");
    } finally {
      setSaving((prev) => ({ ...prev, [employeeId]: false }));
    }
  };

  const departments = [
    ...new Set(attendanceData.map((e) => e.department).filter(Boolean)),
  ].sort();

  const filtered = attendanceData.filter((emp) => {
    if (departmentFilter && emp.department !== departmentFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        emp.name?.toLowerCase().includes(q) ||
        emp.employee_id?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Reset to page 1 when filters change
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  const stats = {
    total: attendanceData.length,
    marked: Object.keys(markedAttendance).length,
    present: Object.values(markedAttendance).filter((s) => s === "Present")
      .length,
    absent: Object.values(markedAttendance).filter((s) => s === "Absent")
      .length,
    leave: Object.values(markedAttendance).filter((s) => s === "Leave").length,
    halfDay: Object.values(markedAttendance).filter((s) => s === "Half Day")
      .length,
    wfh: Object.values(markedAttendance).filter((s) => s === "Work From Home")
      .length,
    unmarked: attendanceData.length - Object.keys(markedAttendance).length,
  };

  const attendanceRate =
    stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

  const formattedDate = new Date(selectedDate + "T12:00:00").toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  const generatePDF = () => {
    const doc = new jsPDF();

    // Header background
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 36, "F");

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Daily Attendance Report", 14, 15);

    // Date
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(formattedDate, 14, 26);

    // Generated timestamp
    doc.setFontSize(8);
    doc.text(`Generated: ${new Date().toLocaleString("en-US")}`, 14, 32);

    // Department filter info
    if (departmentFilter) {
      doc.text(`Department: ${departmentFilter}`, 140, 26);
    }

    doc.setTextColor(0, 0, 0);

    // Summary section title
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Attendance Summary", 14, 48);

    // Summary box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 52, 182, 32, 2, 2, "FD");

    const summaryItems = [
      { label: "Total Employees", value: `${stats.total}`, col: 0 },
      { label: "Present", value: `${stats.present}`, col: 0 },
      { label: "Absent", value: `${stats.absent}`, col: 1 },
      { label: "Leave", value: `${stats.leave}`, col: 1 },
      { label: "Half Day", value: `${stats.halfDay}`, col: 2 },
      { label: "Work From Home", value: `${stats.wfh}`, col: 2 },
      { label: "Attendance Rate", value: `${attendanceRate}%`, col: 3 },
      { label: "Not Marked", value: `${stats.unmarked}`, col: 3 },
    ];

    const colX = [20, 65, 110, 158];
    summaryItems.forEach((item, i) => {
      const x = colX[item.col];
      const y = i % 2 === 0 ? 61 : 76;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(item.label, x, y);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text(item.value, x, y + 7);
    });

    doc.setTextColor(0, 0, 0);

    // Table
    const tableData = attendanceData
      .filter((emp) => {
        if (departmentFilter && emp.department !== departmentFilter)
          return false;
        return true;
      })
      .map((emp, idx) => [
        idx + 1,
        emp.employee_id,
        emp.name,
        emp.department || "—",
        markedAttendance[emp.employee_id] || "Not Marked",
      ]);

    const statusColors = {
      Present: [220, 252, 231],
      Absent: [254, 226, 226],
      Leave: [254, 243, 199],
      "Half Day": [219, 234, 254],
      "Work From Home": [243, 232, 255],
      "Not Marked": [243, 244, 246],
    };

    autoTable(doc, {
      head: [["#", "Employee ID", "Name", "Department", "Status"]],
      body: tableData,
      startY: 92,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 9,
      },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 30 },
        2: { cellWidth: 55 },
        3: { cellWidth: 45 },
        4: { cellWidth: 35 },
      },
      didParseCell(data) {
        if (data.section === "body" && data.column.index === 4) {
          const status = data.cell.raw;
          const color = statusColors[status];
          if (color) data.cell.styles.fillColor = color;
        }
      },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      margin: { left: 14, right: 14 },
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Page ${i} of ${pageCount}`,
        105,
        doc.internal.pageSize.height - 8,
        { align: "center" },
      );
    }

    doc.save(`Attendance_Report_${selectedDate}.pdf`);
  };

  return (
    <div
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      className="h-full flex flex-col px-6 py-6"
    >
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6 shrink-0 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Daily Attendance</h1>
          <p className="text-sm text-gray-400 mt-0.5">{formattedDate}</p>
        </div>

        {/* Actions: PDF + Date Picker */}
        <div className="flex items-center gap-3">
          <button
            onClick={generatePDF}
            disabled={attendanceData.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
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
            Export PDF
          </button>

          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
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
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-sm text-gray-700 font-medium bg-transparent outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* ── Summary Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-3 mb-6 shrink-0">
        {[
          {
            label: "Total",
            value: stats.total,
            color: "text-gray-800",
            bg: "bg-white",
            border: "border-gray-200",
          },
          {
            label: "Marked",
            value: stats.marked,
            color: "text-blue-600",
            bg: "bg-blue-50",
            border: "border-blue-100",
          },
          {
            label: "Present",
            value: stats.present,
            color: "text-green-600",
            bg: "bg-green-50",
            border: "border-green-100",
          },
          {
            label: "Absent",
            value: stats.absent,
            color: "text-red-600",
            bg: "bg-red-50",
            border: "border-red-100",
          },
          {
            label: "Leave",
            value: stats.leave,
            color: "text-amber-600",
            bg: "bg-amber-50",
            border: "border-amber-100",
          },
          {
            label: "Half Day",
            value: stats.halfDay,
            color: "text-blue-500",
            bg: "bg-sky-50",
            border: "border-sky-100",
          },
          {
            label: "WFH",
            value: stats.wfh,
            color: "text-purple-600",
            bg: "bg-purple-50",
            border: "border-purple-100",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`${s.bg} border ${s.border} rounded-xl p-3 shadow-sm flex flex-col items-center justify-center`}
          >
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Attendance Progress Bar ───────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-6 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">
            Marking Progress
          </span>
          <span className="text-sm font-bold text-blue-600">
            {stats.marked}/{stats.total} marked
            {stats.unmarked > 0 && (
              <span className="ml-2 text-xs font-medium text-gray-400">
                ({stats.unmarked} pending)
              </span>
            )}
          </span>
        </div>
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
          {stats.total > 0 && (
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(stats.marked / stats.total) * 100}%`,
                background: "linear-gradient(90deg, #2563eb, #3b82f6)",
              }}
            />
          )}
        </div>
        <div className="flex items-center gap-4 mt-3">
          {[
            {
              label: "Present Rate",
              value: `${attendanceRate}%`,
              color: "text-green-600",
            },
            {
              label: "Half Day + WFH",
              value: stats.halfDay + stats.wfh,
              color: "text-blue-600",
            },
            { label: "Absent", value: stats.absent, color: "text-red-500" },
          ].map((item) => (
            <div key={item.label} className="text-xs">
              <span className="text-gray-400">{item.label}: </span>
              <span className={`font-semibold ${item.color}`}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Filters Row ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-5 shrink-0">
        {/* Search */}
        <div ref={searchRef} className="relative flex-1 min-w-48">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              searchEmployees(e.target.value);
              setShowDropdown(true);
              setPage(1);
            }}
            onFocus={() => setShowDropdown(true)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
          />
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
              {searchResults.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => {
                    setSearchQuery(emp.name);
                    setShowDropdown(false);
                    setSearchResults([]);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-0"
                >
                  <p className="text-sm font-semibold text-gray-800">
                    {emp.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {emp.employee_id} · {emp.department}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Rows per page */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 whitespace-nowrap">
            Rows per page
          </span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="px-2.5 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm cursor-pointer"
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        {/* Department Filter */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <select
            value={departmentFilter}
            onChange={(e) => {
              setDepartmentFilter(e.target.value);
              setPage(1);
            }}
            className="pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm appearance-none cursor-pointer"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 ml-auto">
          {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
            <div key={status} className="hidden lg:flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              <span className="text-xs text-gray-500">{cfg.abbr}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Attendance Table ─────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-hidden bg-white border border-gray-200 rounded-2xl shadow-sm">
        <div className="h-full overflow-y-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-8">
                  #
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Department
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Status
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Mark Attendance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-gray-400">
                        Loading employees…
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg
                        className="w-10 h-10 text-gray-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      <p className="text-sm font-medium text-gray-500">
                        No employees found
                      </p>
                      <p className="text-xs text-gray-400">
                        Try adjusting your filters
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((emp, idx) => {
                  const currentStatus = markedAttendance[emp.employee_id];
                  const isMarked = !!currentStatus;
                  const isSaving = saving[emp.employee_id];
                  const cfg = currentStatus
                    ? STATUS_CONFIG[currentStatus]
                    : null;

                  return (
                    <tr
                      key={emp.id ?? emp.employee_id}
                      className="hover:bg-blue-50/40 transition-colors group"
                    >
                      {/* Row number */}
                      <td className="px-5 py-3.5 text-sm text-gray-400 font-mono">
                        {(safePage - 1) * pageSize + idx + 1}
                      </td>

                      {/* Employee info */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {emp.name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800 leading-tight">
                              {emp.name}
                            </p>
                            <p className="text-xs text-gray-400 font-mono">
                              {emp.employee_id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="text-sm text-gray-600">
                          {emp.department || "—"}
                        </span>
                      </td>

                      {/* Current status badge */}
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        {isSaving ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                            <span className="w-3 h-3 border border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                            Saving…
                          </span>
                        ) : cfg ? (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}
                            />
                            {currentStatus}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-400 border border-gray-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                            Not Marked
                          </span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {STATUSES.map((status) => {
                            const s = STATUS_CONFIG[status];
                            const isSelected = currentStatus === status;
                            const isDisabled = isMarked && !isSelected;
                            return (
                              <button
                                key={status}
                                onClick={() =>
                                  !isDisabled &&
                                  markAttendance(emp.employee_id, status)
                                }
                                disabled={isDisabled || isSaving}
                                title={status}
                                className={`
                                  px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all duration-150
                                  ${
                                    isSelected
                                      ? s.selected + " shadow-sm"
                                      : isDisabled
                                        ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                                        : s.btn + " cursor-pointer"
                                  }
                                `}
                              >
                                {s.abbr}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ────────────────────────────────────────────────────── */}
      <div className="mt-4 shrink-0 flex flex-wrap items-center justify-between gap-3">
        {/* Left: count info */}
        <p className="text-xs text-gray-400">
          Showing{" "}
          <span className="font-semibold text-gray-600">
            {filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1}
          </span>
          {"–"}
          <span className="font-semibold text-gray-600">
            {Math.min(safePage * pageSize, filtered.length)}
          </span>
          {" of "}
          <span className="font-semibold text-gray-600">{filtered.length}</span>
          {" employees"}
        </p>

        {/* Center: page buttons */}
        <div className="flex items-center gap-1">
          {/* First */}
          <button
            onClick={() => setPage(1)}
            disabled={safePage === 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs"
            title="First page"
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
                d="M11 19l-7-7 7-7M18 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Prev */}
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Previous page"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Page number pills */}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(
              (p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1,
            )
            .reduce((acc, p, i, arr) => {
              if (i > 0 && p - arr[i - 1] > 1) acc.push("...");
              acc.push(p);
              return acc;
            }, [])
            .map((item, i) =>
              item === "..." ? (
                <span
                  key={`ellipsis-${i}`}
                  className="w-8 h-8 flex items-center justify-center text-xs text-gray-400"
                >
                  …
                </span>
              ) : (
                <button
                  key={item}
                  onClick={() => setPage(item)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg border text-xs font-semibold transition-all ${
                    safePage === item
                      ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"
                  }`}
                >
                  {item}
                </button>
              ),
            )}

          {/* Next */}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Next page"
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          {/* Last */}
          <button
            onClick={() => setPage(totalPages)}
            disabled={safePage === totalPages}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs"
            title="Last page"
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
                d="M13 5l7 7-7 7M6 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        {/* Right: page X of Y */}
        <p className="text-xs text-gray-400">
          Page <span className="font-semibold text-gray-600">{safePage}</span>{" "}
          of <span className="font-semibold text-gray-600">{totalPages}</span>
        </p>
      </div>
    </div>
  );
};

export default DailyAttendance;
