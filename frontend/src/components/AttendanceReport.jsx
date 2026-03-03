import { useState, useEffect } from "react";
import { toast } from "react-toastify";

const AttendanceReport = () => {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState("pdf");

  useEffect(() => {
    loadMonthlyReport();
  }, [month, year]);

  const loadMonthlyReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/attendance/report-all?month=${month}&year=${year}`,
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
    // Mock implementation - would call backend to generate PDF/Excel
    toast.info("Report generation coming soon!", {
      position: "top-right",
      autoClose: 3000,
    });
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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

        {/* Format Selector */}
        <div className="p-4 rounded-lg border border-slate-700/40 bg-slate-800/20">
          <label
            className="text-xs text-slate-600 uppercase tracking-wider mb-2 block"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            Export Format
          </label>
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
            className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-4 py-2 border border-slate-700/40 focus:border-cyan-400/60 outline-none transition-colors text-sm"
          >
            <option value="pdf">PDF</option>
            <option value="excel">Excel</option>
            <option value="csv">CSV</option>
          </select>
        </div>

        {/* Generate Button */}
        <div className="p-4 rounded-lg border border-slate-700/40 bg-slate-800/20 flex items-end">
          <button
            onClick={generateReport}
            className="w-full px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-950 font-semibold rounded-lg transition-all bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500"
          >
            Generate Report
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
