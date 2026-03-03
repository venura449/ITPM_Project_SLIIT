import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  PieChart,
  Pie,
  Cell,
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

const STATUS_COLORS = {
  Present: "#22d3ee",
  Absent: "#f87171",
  Leave: "#a78bfa",
  "Half Day": "#fb923c",
  "Work From Home": "#34d399",
  "Not Marked": "#64748b",
};

const token = () => localStorage.getItem("token");

const api = (path) =>
  fetch(`http://localhost:5000${path}`, {
    headers: { Authorization: `Bearer ${token()}` },
  }).then((r) => r.json());

// ─── Donut chart center label ─────────────────────────────────────────────────
const DonutLabel = ({ cx, cy, value, label }) => (
  <g>
    <text
      x={cx}
      y={cy - 8}
      textAnchor="middle"
      fill="#fff"
      className="text-xl font-bold"
      style={{ fontSize: 24, fontWeight: 700 }}
    >
      {value}
    </text>
    <text
      x={cx}
      y={cy + 14}
      textAnchor="middle"
      fill="#94a3b8"
      style={{ fontSize: 11 }}
    >
      {label}
    </text>
  </g>
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

  // Load all employees once
  useEffect(() => {
    api("/api/employees").then((d) => {
      if (d.success || Array.isArray(d.data)) setEmployees(d.data || []);
    });
  }, []);

  // Load report whenever employee / month / year changes
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
        // Fetch last 6 months for trend
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
      toast.error("Failed to load report: " + err.message, {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoadingReport(false);
    }
  };

  // Derived data
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

  return (
    <div className="flex h-full min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* ── Left Sidebar: Employee List ─────────────────────────────────────── */}
      <div className="w-72 flex-shrink-0 border-r border-slate-700/40 bg-slate-900/60 flex flex-col">
        <div className="p-4 border-b border-slate-700/40">
          <h2
            className="text-white font-bold text-lg mb-3"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            📊 Employee Reports
          </h2>
          <input
            type="text"
            placeholder="Search name or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800/60 text-white placeholder-slate-500 rounded-lg px-3 py-2 border border-slate-700/40 focus:border-cyan-500/50 outline-none text-sm mb-2"
          />
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full bg-slate-800/60 text-slate-300 rounded-lg px-3 py-2 border border-slate-700/40 focus:border-cyan-500/50 outline-none text-sm"
          >
            {departments.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredEmployees.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8 px-4">
              No employees found
            </p>
          ) : (
            filteredEmployees.map((emp) => (
              <button
                key={emp.id}
                onClick={() => setSelectedEmp(emp)}
                className={`w-full text-left px-4 py-3 border-b border-slate-700/20 transition-colors ${
                  selectedEmp?.id === emp.id
                    ? "bg-cyan-500/15 border-l-2 border-l-cyan-500"
                    : "hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {emp.name?.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {emp.name}
                    </p>
                    <p className="text-slate-500 text-xs">
                      {emp.employee_id} · {emp.department}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Right Panel ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {!selectedEmp ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-24">
            <div className="text-6xl mb-4">👈</div>
            <h3
              className="text-white text-xl font-bold mb-2"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Select an Employee
            </h3>
            <p className="text-slate-500 text-sm">
              Choose an employee from the list to view their report
            </p>
          </div>
        ) : (
          <div className="p-6">
            {/* Employee Header + Period Filter */}
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold">
                  {selectedEmp.name?.charAt(0)}
                </div>
                <div>
                  <h2
                    className="text-2xl font-bold text-white"
                    style={{ fontFamily: "'Syne', sans-serif" }}
                  >
                    {selectedEmp.name}
                  </h2>
                  <p className="text-cyan-300 text-sm">
                    {selectedEmp.employee_id} · {selectedEmp.designation} ·{" "}
                    {selectedEmp.department}
                  </p>
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${
                      selectedEmp.status === "Permanent"
                        ? "bg-green-500/20 text-green-300 border-green-500/30"
                        : "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                    }`}
                  >
                    {selectedEmp.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="bg-slate-800/60 text-slate-300 rounded-lg px-3 py-2 border border-slate-700/40 outline-none text-sm"
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
                  className="bg-slate-800/60 text-slate-300 rounded-lg px-3 py-2 border border-slate-700/40 outline-none text-sm"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loadingReport ? (
              <div className="text-center py-20 text-slate-400">
                Loading report…
              </div>
            ) : (
              <>
                {/* ── Stat Cards ─────────────────────────────────────────── */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                  {[
                    { label: "Present", value: report?.present, color: "cyan" },
                    { label: "Absent", value: report?.absent, color: "red" },
                    { label: "Leave", value: report?.leave, color: "violet" },
                    {
                      label: "Half Day",
                      value: report?.half_day,
                      color: "orange",
                    },
                    {
                      label: "WFH",
                      value: report?.work_from_home,
                      color: "emerald",
                    },
                  ].map(({ label, value, color }) => (
                    <div
                      key={label}
                      className={`p-4 rounded-xl border bg-${color}-500/5 border-${color}-500/20 hover:border-${color}-500/40 transition-colors`}
                    >
                      <p
                        className={`text-${color}-400 text-xs font-semibold mb-1`}
                      >
                        {label}
                      </p>
                      <p className="text-white text-2xl font-bold">
                        {Number(value) || 0}
                      </p>
                      <p className="text-slate-500 text-xs">days</p>
                    </div>
                  ))}
                </div>

                {/* ── Charts Row ─────────────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Donut chart */}
                  <div className="p-5 rounded-xl border border-slate-700/40 bg-slate-800/20">
                    <h3
                      className="text-white font-bold mb-4"
                      style={{ fontFamily: "'Syne', sans-serif" }}
                    >
                      Attendance Breakdown · {MONTHS[month - 1]} {year}
                    </h3>
                    {pieData.length === 0 ? (
                      <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
                        No data for this period
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={90}
                            paddingAngle={3}
                            dataKey="value"
                            labelLine={false}
                          >
                            {pieData.map((entry) => (
                              <Cell
                                key={entry.name}
                                fill={STATUS_COLORS[entry.name] || "#64748b"}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            wrapperStyle={{ outline: "none" }}
                            contentStyle={{
                              background: "#1e293b",
                              border: "1px solid #334155",
                              borderRadius: 8,
                              color: "#fff",
                              padding: "8px 12px",
                            }}
                            labelStyle={{
                              color: "#94a3b8",
                              fontSize: 11,
                              marginBottom: 2,
                            }}
                            itemStyle={{ color: "#fff", fontSize: 12 }}
                            formatter={(v, n) => [`${v} days`, n]}
                          />
                          <Legend
                            wrapperStyle={{
                              background: "transparent",
                              paddingTop: 8,
                            }}
                            iconType="circle"
                            iconSize={8}
                            formatter={(v) => (
                              <span style={{ color: "#cbd5e1", fontSize: 12 }}>
                                {v}
                              </span>
                            )}
                          />
                          <DonutLabel
                            cx="50%"
                            cy="50%"
                            value={totalTracked}
                            label="days tracked"
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* 6-month trend bar chart */}
                  <div className="p-5 rounded-xl border border-slate-700/40 bg-slate-800/20">
                    <h3
                      className="text-white font-bold mb-4"
                      style={{ fontFamily: "'Syne', sans-serif" }}
                    >
                      6-Month Attendance Trend
                    </h3>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart
                        data={trend}
                        margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis
                          dataKey="month"
                          tick={{ fill: "#94a3b8", fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: "#94a3b8", fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "#1e293b",
                            border: "1px solid #334155",
                            borderRadius: 8,
                            color: "#fff",
                          }}
                        />
                        <Legend
                          iconType="circle"
                          iconSize={8}
                          formatter={(v) => (
                            <span style={{ color: "#cbd5e1", fontSize: 12 }}>
                              {v}
                            </span>
                          )}
                        />
                        <Bar
                          dataKey="present"
                          name="Present"
                          fill="#22d3ee"
                          radius={[3, 3, 0, 0]}
                        />
                        <Bar
                          dataKey="absent"
                          name="Absent"
                          fill="#f87171"
                          radius={[3, 3, 0, 0]}
                        />
                        <Bar
                          dataKey="leave"
                          name="Leave"
                          fill="#a78bfa"
                          radius={[3, 3, 0, 0]}
                        />
                        <Bar
                          dataKey="wfh"
                          name="WFH"
                          fill="#34d399"
                          radius={[3, 3, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* ── Leave Balance ────────────────────────────────────────── */}
                <div className="p-5 rounded-xl border border-slate-700/40 bg-slate-800/20 mb-6">
                  <h3
                    className="text-white font-bold mb-4"
                    style={{ fontFamily: "'Syne', sans-serif" }}
                  >
                    Leave Balance · {year}
                  </h3>
                  {leaveBalance.length === 0 ? (
                    <p className="text-slate-500 text-sm">
                      No leave balance data for this year
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                      {leaveBalance.map((b) => {
                        const pct =
                          b.total_days > 0
                            ? (b.balance_days / b.total_days) * 100
                            : 0;
                        return (
                          <div
                            key={b.leave_type}
                            className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/30"
                          >
                            <p className="text-slate-400 text-xs font-semibold mb-1 truncate">
                              {b.leave_type}
                            </p>
                            <p className="text-white text-xl font-bold">
                              {Number(b.balance_days) || 0}
                            </p>
                            <p className="text-slate-500 text-xs mb-2">
                              of {Number(b.total_days) || 0} days left
                            </p>
                            <div className="w-full bg-slate-800 rounded-full h-1.5">
                              <div
                                className="h-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500"
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ── Leave History ────────────────────────────────────────── */}
                <div className="p-5 rounded-xl border border-slate-700/40 bg-slate-800/20">
                  <h3
                    className="text-white font-bold mb-4"
                    style={{ fontFamily: "'Syne', sans-serif" }}
                  >
                    Recent Leave Requests
                  </h3>
                  {leaveHistory.length === 0 ? (
                    <p className="text-slate-500 text-sm">
                      No leave requests found
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-700/40">
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
                                className="text-left text-xs text-slate-500 uppercase tracking-wider pb-3 pr-4"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {leaveHistory.map((l) => (
                            <tr
                              key={l.id}
                              className="border-b border-slate-700/20 hover:bg-slate-800/30 transition-colors"
                            >
                              <td className="py-3 pr-4 text-white font-medium">
                                {l.leave_type}
                              </td>
                              <td className="py-3 pr-4 text-slate-300">
                                {new Date(l.start_date).toLocaleDateString(
                                  "en-US",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )}
                              </td>
                              <td className="py-3 pr-4 text-slate-300">
                                {new Date(l.end_date).toLocaleDateString(
                                  "en-US",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )}
                              </td>
                              <td className="py-3 pr-4 text-slate-400">
                                {Number(l.days_applied)}
                              </td>
                              <td className="py-3 pr-4 text-slate-400 max-w-xs truncate">
                                {l.reason}
                              </td>
                              <td className="py-3 pr-4">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border ${
                                    l.status === "Approved"
                                      ? "bg-green-500/20 text-green-300 border-green-500/30"
                                      : l.status === "Rejected"
                                        ? "bg-red-500/20 text-red-300 border-red-500/30"
                                        : "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                                  }`}
                                >
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
