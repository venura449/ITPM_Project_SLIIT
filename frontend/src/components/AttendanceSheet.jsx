import { useState, useEffect } from "react";
import { toast } from "react-toastify";

const AttendanceSheet = () => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [attendanceData, setAttendanceData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [markedAttendance, setMarkedAttendance] = useState({});
  const [showLegend, setShowLegend] = useState(false);

  const statusColors = {
    Present: "bg-green-500/20 text-green-300 border-green-500/30",
    Absent: "bg-red-500/20 text-red-300 border-red-500/30",
    Leave: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    "Half Day": "bg-blue-500/20 text-blue-300 border-blue-500/30",
    "Work From Home": "bg-purple-500/20 text-purple-300 border-purple-500/30",
  };

  const attendanceKeyMap = {
    P: { full: "Present", color: "text-green-300" },
    A: { full: "Absent", color: "text-red-300" },
    L: { full: "Leave", color: "text-yellow-300" },
    H: { full: "Half Day", color: "text-blue-300" },
    WFH: { full: "Work From Home", color: "text-purple-300" },
  };

  // Load attendance sheet for selected date
  useEffect(() => {
    loadAttendanceSheet();
  }, [selectedDate]);

  const loadAttendanceSheet = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/attendance/sheet?date=${selectedDate}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      const data = await response.json();
      if (data.success) {
        setAttendanceData(data.data || []);
        // Pre-populate marked attendance from saved records for this date
        const marked = {};
        data.data.forEach((record) => {
          if (
            record.attendance_status &&
            record.attendance_status !== "Not Marked"
          ) {
            marked[record.employee_id] = record.attendance_status;
          }
        });
        setMarkedAttendance(marked);
      }
    } catch (error) {
      toast.error("Failed to load attendance sheet: " + error.message, {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const searchEmployees = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/attendance/search?query=${encodeURIComponent(query)}&date=${selectedDate}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      const data = await response.json();
      if (data.success) {
        setSearchResults(data.data || []);
      }
    } catch (error) {
      toast.error("Search failed: " + error.message, {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const markAttendance = async (employeeId, status) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/attendance/mark`,
        {
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
        },
      );

      const data = await response.json();
      if (data.success) {
        setMarkedAttendance((prev) => ({
          ...prev,
          [employeeId]: status,
        }));
        toast.success("Attendance marked successfully! ✓", {
          position: "top-right",
          autoClose: 2000,
        });
      } else {
        toast.error(data.message || "Failed to mark attendance", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      toast.error("Error marking attendance: " + error.message, {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h2
          className="text-3xl font-bold text-white mb-2"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          Daily Attendance Sheet
        </h2>
        <p
          className="text-slate-400"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          Mark employee attendance and manage daily records
        </p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Date Picker */}
        <div className="p-4 rounded-lg border border-slate-700/40 bg-slate-800/20">
          <label
            className="text-xs text-slate-600 uppercase tracking-wider mb-2 block"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            Select Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-4 py-2 border border-slate-700/40 focus:border-cyan-400/60 outline-none transition-colors"
          />
        </div>

        {/* Search Box */}
        <div className="p-4 rounded-lg border border-slate-700/40 bg-slate-800/20">
          <label
            className="text-xs text-slate-600 uppercase tracking-wider mb-2 block"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            Search Employee
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchEmployees(e.target.value);
              }}
              onFocus={() => setShowSearch(true)}
              className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-4 py-2 border border-slate-700/40 focus:border-cyan-400/60 outline-none transition-colors"
            />
            {showSearch && searchResults.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-slate-800 rounded-lg border border-slate-700/40 z-10 max-h-48 overflow-y-auto">
                {searchResults.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => {
                      setSearchQuery("");
                      setShowSearch(false);
                      setSearchResults([]);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-700/50 text-slate-300 hover:text-cyan-300 text-sm border-b border-slate-700/40 last:border-0"
                  >
                    <div className="font-semibold">{emp.name}</div>
                    <div className="text-xs text-slate-500">
                      {emp.employee_id} • {emp.department}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend Info Box */}
      <div className="mb-6 p-4 rounded-lg border border-slate-700/40 bg-slate-800/20">
        <button
          onClick={() => setShowLegend(!showLegend)}
          className="flex items-center gap-2 text-cyan-300 hover:text-cyan-200 transition-colors font-semibold"
        >
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          Attendance Status Legend
        </button>

        {showLegend && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
            {[
              {
                abbr: "P",
                full: "Present",
                color: "bg-green-500/20 text-green-300 border-green-500/30",
              },
              {
                abbr: "A",
                full: "Absent",
                color: "bg-red-500/20 text-red-300 border-red-500/30",
              },
              {
                abbr: "L",
                full: "Leave",
                color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
              },
              {
                abbr: "H",
                full: "Half Day",
                color: "bg-blue-500/20 text-blue-300 border-blue-500/30",
              },
              {
                abbr: "WFH",
                full: "Work From Home",
                color: "bg-purple-500/20 text-purple-300 border-purple-500/30",
              },
            ].map((item) => (
              <div
                key={item.abbr}
                className="flex items-center gap-2 p-3 rounded-lg bg-slate-900/40 border border-slate-700/30"
              >
                <span
                  className={`inline-block px-2 py-1 rounded text-xs font-bold border ${item.color}`}
                >
                  {item.abbr}
                </span>
                <span className="text-sm text-slate-300">{item.full}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Attendance Table */}
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
                  className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-400"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  ID
                </th>
                <th
                  className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-400"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  Department
                </th>
                <th
                  className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-400"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  Status
                </th>
                <th
                  className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-400"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-8 text-center text-slate-400"
                  >
                    Loading attendance data...
                  </td>
                </tr>
              ) : attendanceData.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-8 text-center text-slate-400"
                  >
                    No employees found for this date
                  </td>
                </tr>
              ) : (
                attendanceData.map((emp) => (
                  <tr
                    key={emp.id}
                    className="border-b border-slate-700/20 hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-cyan-300">
                      {emp.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {emp.employee_id}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {emp.department}
                    </td>
                    <td className="px-6 py-4">
                      {markedAttendance[emp.employee_id] ? (
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[markedAttendance[emp.employee_id]]}`}
                        >
                          {markedAttendance[emp.employee_id]}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs">
                          Not Marked
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2 flex-wrap">
                        {[
                          "Present",
                          "Absent",
                          "Leave",
                          "Half Day",
                          "Work From Home",
                        ].map((status) => {
                          const isMarked = !!markedAttendance[emp.employee_id];
                          const isSelected =
                            markedAttendance[emp.employee_id] === status;
                          return (
                            <button
                              key={status}
                              onClick={() =>
                                !isMarked &&
                                markAttendance(emp.employee_id, status)
                              }
                              disabled={isMarked && !isSelected}
                              title={
                                isMarked && !isSelected
                                  ? "Attendance already marked for this day"
                                  : status
                              }
                              className={`px-2 py-1 text-xs rounded transition-all border ${
                                isSelected
                                  ? "bg-cyan-600/40 text-cyan-300 border-cyan-500/50"
                                  : isMarked
                                    ? "bg-slate-800/20 text-slate-600 border-slate-800/20 cursor-not-allowed opacity-40"
                                    : "bg-slate-700/20 text-slate-400 hover:bg-slate-700/40 border-slate-700/30 cursor-pointer"
                              }`}
                            >
                              {status === "Present"
                                ? "P"
                                : status === "Absent"
                                  ? "A"
                                  : status === "Leave"
                                    ? "L"
                                    : status === "Half Day"
                                      ? "H"
                                      : "WFH"}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 rounded-lg border border-slate-700/40 bg-slate-800/20">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            {
              label: "Total Employees",
              value: attendanceData.length,
              color: "text-cyan-300",
            },
            {
              label: "Marked",
              value: Object.keys(markedAttendance).length,
              color: "text-green-400",
            },
            {
              label: "Present",
              value: Object.values(markedAttendance).filter(
                (s) => s === "Present",
              ).length,
              color: "text-green-400",
            },
            {
              label: "Absent",
              value: Object.values(markedAttendance).filter(
                (s) => s === "Absent",
              ).length,
              color: "text-red-400",
            },
            {
              label: "Leave",
              value: Object.values(markedAttendance).filter(
                (s) => s === "Leave",
              ).length,
              color: "text-yellow-400",
            },
          ].map((stat, idx) => (
            <div key={idx} className="text-center">
              <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AttendanceSheet;
