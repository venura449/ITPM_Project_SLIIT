import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const AttendanceReport = () => {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Date range for PDF header labeling
  const getMonthStart = () => `${year}-${String(month).padStart(2, "0")}-01`;
  const getMonthEnd = () => {
    const d = new Date(year, month, 0);
    return `${year}-${String(month).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  useEffect(() => {
    loadMonthlyReport();
  }, [month, year]);

  const loadMonthlyReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/attendance/report-all?month=${month}&year=${year}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      const data = await response.json();
      if (data.success) {
        setReportData(data.data || []);
      } else {
        toast.error("Failed to load report data", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      toast.error("Error loading report: " + error.message, {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReport = () => {
    if (reportData.length === 0) {
      toast.warning("No data to export. Please select a valid period.");
      return;
    }

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 15;

    // ── HEADER BANNER ────────────────────────────────────────────────
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageW, 42, "F");
    doc.setFillColor(6, 182, 212); // cyan accent stripe
    doc.rect(0, 38, pageW, 4, "F");

    // System label (top left)
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.text("ATTENDANCE MANAGEMENT SYSTEM  ·  PERIOD REPORT", margin, 12);

    // Main title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(17);
    doc.setFont("helvetica", "bold");
    doc.text("Attendance Report", margin, 24);

    // Period sub-label
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(6, 182, 212);
    doc.text(
      `Period: ${monthNames[month - 1]} ${year}  (${getMonthStart()} – ${getMonthEnd()})`,
      margin,
      33,
    );

    // Right side — generated date & summary
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Generated: ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`,
      pageW - margin,
      12,
      { align: "right" },
    );
    doc.text(`Total Employees: ${reportData.length}`, pageW - margin, 20, {
      align: "right",
    });
    const workingDays = getTotalWorkingDays(month, year);
    doc.text(`Working Days: ${workingDays}`, pageW - margin, 28, {
      align: "right",
    });

    let y = 52;

    // ── SUMMARY STAT BOXES ────────────────────────────────────────────
    const totalPresent = reportData.reduce((s, e) => s + (e.present || 0), 0);
    const totalAbsent = reportData.reduce((s, e) => s + (e.absent || 0), 0);
    const totalLeave = reportData.reduce((s, e) => s + (e.leave || 0), 0);
    const totalHalfDay = reportData.reduce((s, e) => s + (e.half_day || 0), 0);
    const totalWfh = reportData.reduce(
      (s, e) => s + (e.work_from_home || 0),
      0,
    );
    const avgRate =
      reportData.length > 0
        ? (
            reportData.reduce(
              (s, e) => s + parseFloat(calculateStats(e).attendanceRate),
              0,
            ) / reportData.length
          ).toFixed(1)
        : 0;

    const stats = [
      {
        label: "Total Present",
        value: totalPresent,
        fill: [220, 252, 231],
        txt: [22, 101, 52],
      },
      {
        label: "Total Absent",
        value: totalAbsent,
        fill: [254, 226, 226],
        txt: [185, 28, 28],
      },
      {
        label: "On Leave",
        value: totalLeave,
        fill: [254, 243, 199],
        txt: [146, 64, 14],
      },
      {
        label: "Half Day",
        value: totalHalfDay,
        fill: [219, 234, 254],
        txt: [29, 78, 216],
      },
      {
        label: "Work From Home",
        value: totalWfh,
        fill: [237, 233, 254],
        txt: [109, 40, 217],
      },
      {
        label: "Avg Attendance",
        value: `${avgRate}%`,
        fill: [240, 253, 244],
        txt: [21, 128, 61],
      },
    ];
    const boxW = (pageW - margin * 2 - 5 * 4) / 6;
    stats.forEach((s, i) => {
      const x = margin + i * (boxW + 4);
      doc.setFillColor(...s.fill);
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.2);
      doc.roundedRect(x, y, boxW, 18, 2.5, 2.5, "FD");
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(107, 114, 128);
      doc.text(s.label.toUpperCase(), x + boxW / 2, y + 6, { align: "center" });
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...s.txt);
      doc.text(String(s.value), x + boxW / 2, y + 14, { align: "center" });
    });
    y += 26;

    // ── MAIN TABLE ────────────────────────────────────────────────────
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [
        [
          "#",
          "Employee",
          "Employee ID",
          "Department",
          "Present",
          "Absent",
          "Leave",
          "Half Day",
          "WFH",
          "Attendance %",
        ],
      ],
      body: reportData.map((emp, idx) => {
        const stats = calculateStats(emp);
        return [
          idx + 1,
          emp.name,
          emp.employee_id,
          emp.department || "—",
          emp.present || 0,
          emp.absent || 0,
          emp.leave || 0,
          emp.half_day || 0,
          emp.work_from_home || 0,
          `${stats.attendanceRate}%`,
        ];
      }),
      styles: {
        fontSize: 8.5,
        cellPadding: { top: 4, bottom: 4, left: 5, right: 5 },
        font: "helvetica",
        textColor: [55, 65, 81],
        valign: "middle",
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
        cellPadding: { top: 5, bottom: 5, left: 5, right: 5 },
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 9, halign: "center" },
        1: { cellWidth: 42 },
        2: { cellWidth: 24, halign: "center" },
        3: { cellWidth: 36 },
        4: { cellWidth: 18, halign: "center" },
        5: { cellWidth: 16, halign: "center" },
        6: { cellWidth: 14, halign: "center" },
        7: { cellWidth: 19, halign: "center" },
        8: { cellWidth: 16, halign: "center" },
        9: { cellWidth: 24, halign: "center" },
      },
      tableLineColor: [226, 232, 240],
      tableLineWidth: 0.15,
      theme: "grid",
      didDrawCell: (data) => {
        if (data.section !== "body") return;
        const col = data.column.index;
        const raw = data.cell.raw;
        const { x, y: cy, width, height } = data.cell;
        const cx = x + width / 2;
        const midY = cy + height / 2 + 1;

        // Color-coded count badges
        const badgeCfg = {
          4: [220, 252, 231], // present - green
          5: [254, 226, 226], // absent - red
          6: [254, 243, 199], // leave - yellow
          7: [219, 234, 254], // half day - blue
          8: [237, 233, 254], // wfh - purple
        };
        if (badgeCfg[col] && raw !== 0) {
          doc.setFillColor(...badgeCfg[col]);
          doc.roundedRect(x + 2, cy + 2, width - 4, height - 4, 2, 2, "F");
          doc.setFontSize(8.5);
          doc.setFont("helvetica", "bold");
          const txtCfg = {
            4: [22, 101, 52],
            5: [185, 28, 28],
            6: [146, 64, 14],
            7: [29, 78, 216],
            8: [109, 40, 217],
          };
          doc.setTextColor(...txtCfg[col]);
          doc.text(String(raw), cx, midY, { align: "center" });
        }
        // Attendance % bar
        if (col === 9) {
          const pct = parseFloat(raw) || 0;
          const barW = width - 10;
          const barH = 3.5;
          const barX = x + 5;
          const barY = cy + height - 6;
          doc.setFillColor(226, 232, 240);
          doc.roundedRect(barX, barY, barW, barH, 1, 1, "F");
          const fillColor =
            pct >= 75
              ? [34, 197, 94]
              : pct >= 50
                ? [234, 179, 8]
                : [239, 68, 68];
          doc.setFillColor(...fillColor);
          doc.roundedRect(
            barX,
            barY,
            Math.max(0, (barW * pct) / 100),
            barH,
            1,
            1,
            "F",
          );
          doc.setFontSize(8.5);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(
            pct >= 75 ? 22 : pct >= 50 ? 133 : 185,
            pct >= 75 ? 101 : pct >= 50 ? 77 : 28,
            pct >= 75 ? 52 : pct >= 50 ? 14 : 28,
          );
          doc.text(raw, cx, cy + height / 2 - 0.5, { align: "center" });
        }
      },
    });

    // ── FOOTER on all pages ───────────────────────────────────────────
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(margin, pageH - 10, pageW - margin, pageH - 10);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Attendance Management System  ·  ${monthNames[month - 1]} ${year} Report  ·  Confidential`,
        margin,
        pageH - 5.5,
      );
      doc.text(`Page ${i} of ${totalPages}`, pageW - margin, pageH - 5.5, {
        align: "right",
      });
    }

    const filename = `Attendance_Report_${monthNames[month - 1]}_${year}.pdf`;
    doc.save(filename);
    toast.success(`Report downloaded: ${filename}`);
  };

  const monthNames = [
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

  const getTotalWorkingDays = (m, y) => {
    let count = 0;
    const daysInMonth = new Date(y, m, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(y, m - 1, i);
      const day = date.getDay();
      if (day !== 0 && day !== 6) count++; // Exclude weekends
    }
    return count;
  };

  const calculateStats = (emp) => {
    const workingDays = getTotalWorkingDays(month, year);
    const totalMarked =
      (emp.present || 0) +
      (emp.absent || 0) +
      (emp.leave || 0) +
      (emp.half_day || 0) +
      (emp.work_from_home || 0);
    const attendanceRate =
      workingDays > 0
        ? (((emp.present || 0) / workingDays) * 100).toFixed(1)
        : 0;

    return {
      workingDays,
      totalMarked,
      attendanceRate,
    };
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h2
          className="text-3xl font-bold text-white mb-2"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          Attendance Reports & Statistics
        </h2>
        <p
          className="text-slate-400"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          View detailed attendance statistics and generate monthly reports
        </p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Month Selector */}
        <div className="p-4 rounded-lg border border-slate-700/40 bg-slate-800/20">
          <label
            className="text-xs text-slate-600 uppercase tracking-wider mb-2 block"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            Month
          </label>
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-4 py-2 border border-slate-700/40 focus:border-cyan-400/60 outline-none transition-colors text-sm"
          >
            {monthNames.map((m, idx) => (
              <option key={idx} value={idx + 1}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Year Selector */}
        <div className="p-4 rounded-lg border border-slate-700/40 bg-slate-800/20">
          <label
            className="text-xs text-slate-600 uppercase tracking-wider mb-2 block"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            Year
          </label>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-4 py-2 border border-slate-700/40 focus:border-cyan-400/60 outline-none transition-colors text-sm"
          >
            {[2022, 2023, 2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Download PDF Button */}
        <div className="p-4 rounded-lg border border-slate-700/40 bg-slate-800/20 flex items-end">
          <button
            onClick={generateReport}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-lg transition-all bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <svg
                className="w-4 h-4 animate-spin"
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
            ) : (
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
            )}
            Download PDF Report
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        {reportData.length > 0 &&
          (() => {
            const totalPresent = reportData.reduce(
              (sum, emp) => sum + (emp.present || 0),
              0,
            );
            const totalAbsent = reportData.reduce(
              (sum, emp) => sum + (emp.absent || 0),
              0,
            );
            const totalLeave = reportData.reduce(
              (sum, emp) => sum + (emp.leave || 0),
              0,
            );
            const totalHalfDay = reportData.reduce(
              (sum, emp) => sum + (emp.half_day || 0),
              0,
            );
            const avgAttendance =
              reportData.length > 0
                ? (
                    reportData.reduce(
                      (sum, emp) =>
                        sum + parseFloat(calculateStats(emp).attendanceRate),
                      0,
                    ) / reportData.length
                  ).toFixed(1)
                : 0;

            return (
              <>
                <div className="p-4 rounded-lg border border-slate-700/40 bg-slate-800/20">
                  <p className="text-xs text-slate-500 mb-2">Total Employees</p>
                  <p className="text-3xl font-bold text-cyan-300">
                    {reportData.length}
                  </p>
                </div>
                <div className="p-4 rounded-lg border border-slate-700/40 bg-slate-800/20">
                  <p className="text-xs text-slate-500 mb-2">Total Present</p>
                  <p className="text-3xl font-bold text-green-400">
                    {totalPresent}
                  </p>
                </div>
                <div className="p-4 rounded-lg border border-slate-700/40 bg-slate-800/20">
                  <p className="text-xs text-slate-500 mb-2">Total Absent</p>
                  <p className="text-3xl font-bold text-red-400">
                    {totalAbsent}
                  </p>
                </div>
                <div className="p-4 rounded-lg border border-slate-700/40 bg-slate-800/20">
                  <p className="text-xs text-slate-500 mb-2">On Leave</p>
                  <p className="text-3xl font-bold text-yellow-400">
                    {totalLeave}
                  </p>
                </div>
                <div className="p-4 rounded-lg border border-slate-700/40 bg-slate-800/20">
                  <p className="text-xs text-slate-500 mb-2">Avg. Attendance</p>
                  <p className="text-3xl font-bold text-indigo-400">
                    {avgAttendance}%
                  </p>
                </div>
              </>
            );
          })()}
      </div>

      {/* Detailed Table */}
      <div className="rounded-lg border border-slate-700/40 bg-slate-800/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/40 bg-slate-800/40">
                <th
                  className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-400"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  Employee
                </th>
                <th
                  className="px-6 py-4 text-center text-xs uppercase tracking-wider text-slate-400"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  Department
                </th>
                <th
                  className="px-6 py-4 text-center text-xs uppercase tracking-wider text-slate-400"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  Present
                </th>
                <th
                  className="px-6 py-4 text-center text-xs uppercase tracking-wider text-slate-400"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  Absent
                </th>
                <th
                  className="px-6 py-4 text-center text-xs uppercase tracking-wider text-slate-400"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  Leave
                </th>
                <th
                  className="px-6 py-4 text-center text-xs uppercase tracking-wider text-slate-400"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  Half Day
                </th>
                <th
                  className="px-6 py-4 text-center text-xs uppercase tracking-wider text-slate-400"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  WFH
                </th>
                <th
                  className="px-6 py-4 text-center text-xs uppercase tracking-wider text-slate-400"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  Attendance %
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-6 py-8 text-center text-slate-400"
                  >
                    Loading report data...
                  </td>
                </tr>
              ) : reportData.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-6 py-8 text-center text-slate-400"
                  >
                    No attendance data available for the selected period
                  </td>
                </tr>
              ) : (
                reportData.map((emp) => {
                  const stats = calculateStats(emp);
                  return (
                    <tr
                      key={emp.id}
                      className="border-b border-slate-700/20 hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-cyan-300 font-semibold">
                            {emp.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {emp.employee_id}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-slate-400">
                        {emp.department}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-300">
                          {emp.present || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-300">
                          {emp.absent || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-300">
                          {emp.leave || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300">
                          {emp.half_day || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300">
                          {emp.work_from_home || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-center">
                          <p className="text-lg font-bold text-cyan-300">
                            {stats.attendanceRate}%
                          </p>
                          <div className="w-16 h-1.5 bg-slate-800/60 rounded-full mx-auto mt-1">
                            <div
                              className="h-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600"
                              style={{ width: `${stats.attendanceRate}%` }}
                            />
                          </div>
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

      {/* Footer Info */}
      <div className="mt-6 p-4 rounded-lg border border-slate-700/40 bg-slate-800/20 text-center">
        <p
          className="text-xs text-slate-600"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          Report for {monthNames[month - 1]} {year} · Generated{" "}
          {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

export default AttendanceReport;
