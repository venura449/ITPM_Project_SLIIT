import { useState } from "react";

const inputCls =
  "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 bg-white outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all placeholder-gray-400";
const selectCls =
  "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 bg-white outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all";

const statusBadge = {
  Planned: "bg-blue-50 text-blue-700 border border-blue-200",
  "In Progress": "bg-yellow-50 text-yellow-700 border border-yellow-200",
  Completed: "bg-green-50 text-green-700 border border-green-200",
  Cancelled: "bg-red-50 text-red-700 border border-red-200",
};

const typeBadge = {
  Internal: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  External: "bg-purple-50 text-purple-700 border border-purple-200",
};

const PAGE_SIZE = 6;

const TrainingList = ({
  programs,
  loading,
  filters,
  onFilterChange,
  onSelectProgram,
  onDeleteProgram,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  const handleFilterChange = (key, value) => {
    onFilterChange((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(programs.length / PAGE_SIZE));
  const paged = programs.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const counts = programs.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

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
          <p className="text-sm text-gray-400">Loading programs…</p>
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
            value: programs.length,
            color: "text-blue-600",
            bg: "bg-blue-50",
            border: "border-blue-100",
          },
          {
            label: "Planned",
            value: counts["Planned"] || 0,
            color: "text-blue-600",
            bg: "bg-blue-50",
            border: "border-blue-100",
          },
          {
            label: "In Progress",
            value: counts["In Progress"] || 0,
            color: "text-yellow-600",
            bg: "bg-yellow-50",
            border: "border-yellow-100",
          },
          {
            label: "Completed",
            value: counts["Completed"] || 0,
            color: "text-green-600",
            bg: "bg-green-50",
            border: "border-green-100",
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Search
            </label>
            <input
              type="text"
              value={filters.search || ""}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              placeholder="Search programs…"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Type
            </label>
            <select
              value={filters.type || ""}
              onChange={(e) => handleFilterChange("type", e.target.value)}
              className={selectCls}
            >
              <option value="">All Types</option>
              <option value="Internal">Internal</option>
              <option value="External">External</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Status
            </label>
            <select
              value={filters.status || ""}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className={selectCls}
            >
              <option value="">All Status</option>
              <option value="Planned">Planned</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Program Cards */}
      {programs.length === 0 ? (
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
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          <p className="text-gray-400 font-medium">
            No training programs found
          </p>
          <p className="text-sm text-gray-300 mt-1">
            Create a new program to get started
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {paged.map((program) => (
              <div
                key={program.id}
                className="p-5 hover:bg-blue-50/30 transition-colors cursor-pointer"
                onClick={() => onSelectProgram(program)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shrink-0">
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
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                          />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {program.title}
                      </p>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${typeBadge[program.type] || "bg-gray-100 text-gray-600"}`}
                      >
                        {program.type}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusBadge[program.status] || "bg-gray-100 text-gray-600"}`}
                      >
                        {program.status}
                      </span>
                    </div>
                    {program.description && (
                      <p className="text-xs text-gray-400 mb-3 line-clamp-1">
                        {program.description}
                      </p>
                    )}
                    <div className="flex items-center gap-5 text-xs text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <svg
                          className="w-3.5 h-3.5 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {program.duration_hours} hrs
                      </span>
                      <span className="flex items-center gap-1">
                        <svg
                          className="w-3.5 h-3.5 text-gray-400"
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
                        {new Date(program.start_date).toLocaleDateString()} –{" "}
                        {new Date(program.end_date).toLocaleDateString()}
                      </span>
                      {program.location && (
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-3.5 h-3.5 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          {program.location}
                        </span>
                      )}
                      {program.max_participants && (
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-3.5 h-3.5 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          Max {program.max_participants}
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    className="flex items-center gap-2 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onSelectProgram(program)}
                      className="px-3 py-1.5 text-xs font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => onDeleteProgram(program.id, program.title)}
                      className="px-3 py-1.5 text-xs font-medium bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-500">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, programs.length)} of{" "}
                {programs.length} programs
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
                        key={`e${i}`}
                        className="px-2 text-xs text-gray-400"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${p === currentPage ? "bg-blue-600 border-blue-600 text-white font-semibold" : "border-gray-200 text-gray-600 hover:bg-white"}`}
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
    </div>
  );
};

export default TrainingList;
