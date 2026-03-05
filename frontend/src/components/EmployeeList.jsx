import { useState } from "react";
import { toast } from "react-toastify";

const inputCls =
  "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 bg-white outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all placeholder-gray-400";

const selectCls =
  "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 bg-white outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all";

const statusBadge = {
  Probation: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  Permanent: "bg-green-50 text-green-700 border border-green-200",
  Resigned: "bg-red-50  text-red-700  border border-red-200",
};

const EmployeeList = ({
  employees,
  loading,
  filters,
  onFilterChange,
  onSelectEmployee,
  onDeleteEmployee,
}) => {
  const [sortBy, setSortBy] = useState("name");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 8;
  const [passwordModal, setPasswordModal] = useState({
    isOpen: false,
    employeeId: null,
    employeeName: null,
    password: null,
    generatedAt: null,
    loading: false,
  });

  const departments = [
    "All",
    "Human Resources",
    "Finance",
    "IT",
    "Operations",
    "Marketing",
    "Sales",
    "Legal",
    "Administration",
  ];

  const generatePassword = async (employeeId, employeeName) => {
    setPasswordModal((prev) => ({ ...prev, loading: true }));
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/employee-auth/generate-password`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ employee_id: employeeId }),
        },
      );
      const data = await response.json();
      if (data.success) {
        setPasswordModal({
          isOpen: true,
          employeeId,
          employeeName,
          password: data.data.password,
          generatedAt: new Date().toLocaleTimeString(),
          loading: false,
        });
        toast.success("Password generated successfully!");
      } else {
        toast.error(data.message || "Failed to generate password");
        setPasswordModal((prev) => ({ ...prev, loading: false }));
      }
    } catch (error) {
      toast.error("Error: " + error.message);
      setPasswordModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Password copied!");
  };

  const closePasswordModal = () =>
    setPasswordModal({
      isOpen: false,
      employeeId: null,
      employeeName: null,
      password: null,
      generatedAt: null,
      loading: false,
    });

  const handleFilterChange = (key, value) => {
    onFilterChange((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const sortedEmployees = [...employees].sort((a, b) => {
    if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
    if (sortBy === "status")
      return (a.status || "").localeCompare(b.status || "");
    if (sortBy === "department")
      return (a.department || "").localeCompare(b.department || "");
    if (sortBy === "date")
      return new Date(b.joining_date) - new Date(a.joining_date);
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sortedEmployees.length / PAGE_SIZE));
  const pagedEmployees = sortedEmployees.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <svg
            className="animate-spin h-10 w-10 text-blue-500 mx-auto mb-3"
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
          <p className="text-sm text-gray-400">Loading employees…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total",
            value: sortedEmployees.length,
            color: "text-blue-600",
            bg: "bg-blue-50",
            border: "border-blue-100",
          },
          {
            label: "Permanent",
            value: sortedEmployees.filter((e) => e.status === "Permanent")
              .length,
            color: "text-green-600",
            bg: "bg-green-50",
            border: "border-green-100",
          },
          {
            label: "Probation",
            value: sortedEmployees.filter((e) => e.status === "Probation")
              .length,
            color: "text-yellow-600",
            bg: "bg-yellow-50",
            border: "border-yellow-100",
          },
          {
            label: "Resigned",
            value: sortedEmployees.filter((e) => e.status === "Resigned")
              .length,
            color: "text-red-600",
            bg: "bg-red-50",
            border: "border-red-100",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`p-4 rounded-2xl border ${s.border} ${s.bg}`}
          >
            <p className="text-xs font-medium text-gray-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Search
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              placeholder="Name, ID, or email…"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Department
            </label>
            <select
              value={filters.department}
              onChange={(e) => handleFilterChange("department", e.target.value)}
              className={selectCls}
            >
              {departments.map((d) => (
                <option key={d} value={d === "All" ? "" : d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className={selectCls}
            >
              <option value="">All Status</option>
              <option value="Probation">Probation</option>
              <option value="Permanent">Permanent</option>
              <option value="Resigned">Resigned</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={selectCls}
            >
              <option value="name">Name</option>
              <option value="status">Status</option>
              <option value="department">Department</option>
              <option value="date">Joining Date</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      {sortedEmployees.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 shadow-sm text-center">
          <svg
            className="w-12 h-12 text-gray-300 mx-auto mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <p className="text-gray-400 font-medium">No employees found</p>
          <p className="text-sm text-gray-300 mt-1">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {[
                    "Employee",
                    "ID",
                    "Department",
                    "Position",
                    "Status",
                    "Joining Date",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pagedEmployees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-blue-50/30 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {emp.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {emp.name}
                          </p>
                          <p className="text-xs text-gray-400">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-mono text-blue-600 font-medium">
                        {emp.employee_id}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-600">
                        {emp.department || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-600">
                        {emp.position || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadge[emp.status] || "bg-gray-100 text-gray-600"}`}
                      >
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-500">
                        {new Date(emp.joining_date).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => generatePassword(emp.id, emp.name)}
                          disabled={passwordModal.loading}
                          className="px-3 py-1.5 text-xs font-medium bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg transition-colors"
                          title="Generate login password"
                        >
                          Password
                        </button>
                        <button
                          onClick={() => onSelectEmployee(emp)}
                          className="px-3 py-1.5 text-xs font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => onDeleteEmployee(emp.id)}
                          className="px-3 py-1.5 text-xs font-medium bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-500">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, sortedEmployees.length)} of{" "}
                {sortedEmployees.length} employees
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  &laquo;
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  &lsaquo;
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === totalPages ||
                      Math.abs(p - currentPage) <= 1,
                  )
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push("…");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "…" ? (
                      <span
                        key={`ellipsis-${i}`}
                        className="px-2 text-xs text-gray-400"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                          p === currentPage
                            ? "bg-blue-600 border-blue-600 text-white font-semibold"
                            : "border-gray-200 text-gray-600 hover:bg-white"
                        }`}
                      >
                        {p}
                      </button>
                    ),
                  )}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  &rsaquo;
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  &raquo;
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Password Modal */}
      {passwordModal.isOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-7 border border-gray-100">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-800">
                  Password Generated
                </h3>
                <p className="text-xs text-gray-400">
                  For:{" "}
                  <span className="font-semibold text-gray-600">
                    {passwordModal.employeeName}
                  </span>
                </p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
              <p className="text-xs font-medium text-gray-400 mb-2">
                Generated Password
              </p>
              <div className="flex items-center gap-2">
                <code className="text-base font-mono text-green-700 flex-1 break-all">
                  {passwordModal.password}
                </code>
                <button
                  onClick={() => copyToClipboard(passwordModal.password)}
                  className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shrink-0"
                  title="Copy"
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
                      d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5">
              <p className="text-xs text-amber-700 font-medium">
                Share this password with the employee securely. They can change
                it after their first login.
              </p>
            </div>

            <button
              onClick={closePasswordModal}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-all duration-200"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;
