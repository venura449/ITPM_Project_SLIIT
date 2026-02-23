import { useState } from 'react';

const EmployeeList = ({
  employees,
  loading,
  filters,
  onFilterChange,
  onSelectEmployee,
  onDeleteEmployee
}) => {
  const [sortBy, setSortBy] = useState('name');

  const departments = [
    'All',
    'Human Resources',
    'Finance',
    'IT',
    'Operations',
    'Marketing',
    'Sales',
    'Legal',
    'Administration'
  ];

  const statusColors = {
    'Probation': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    'Permanent': 'bg-green-500/20 text-green-300 border-green-500/30',
    'Resigned': 'bg-red-500/20 text-red-300 border-red-500/30'
  };

  const handleFilterChange = (key, value) => {
    onFilterChange(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSearch = (e) => {
    handleFilterChange('search', e.target.value);
  };

  const sortedEmployees = [...employees].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.name || '').localeCompare(b.name || '');
      case 'status':
        return (a.status || '').localeCompare(b.status || '');
      case 'department':
        return (a.department || '').localeCompare(b.department || '');
      case 'date':
        return new Date(b.joining_date) - new Date(a.joining_date);
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-cyan-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-slate-400">Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="p-6 rounded-xl border border-slate-700/40 bg-slate-800/20 backdrop-blur-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>
              Search
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={handleSearch}
              placeholder="Name, ID, or email..."
              className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-4 py-2.5 text-sm outline-none placeholder-slate-600 border border-slate-700/40 focus:border-cyan-400/40 transition-colors"
              style={{ fontFamily: "'Space Mono', monospace" }}
            />
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>
              Department
            </label>
            <select
              value={filters.department}
              onChange={(e) => handleFilterChange('department', e.target.value)}
              className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-4 py-2.5 text-sm outline-none border border-slate-700/40 focus:border-cyan-400/40 transition-colors"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              {departments.map(dept => (
                <option key={dept} value={dept === 'All' ? '' : dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-4 py-2.5 text-sm outline-none border border-slate-700/40 focus:border-cyan-400/40 transition-colors"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              <option value="">All Status</option>
              <option value="Probation">Probation</option>
              <option value="Permanent">Permanent</option>
              <option value="Resigned">Resigned</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-4 py-2.5 text-sm outline-none border border-slate-700/40 focus:border-cyan-400/40 transition-colors"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              <option value="name">Name</option>
              <option value="status">Status</option>
              <option value="department">Department</option>
              <option value="date">Joining Date</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employee Table */}
      {sortedEmployees.length === 0 ? (
        <div className="p-8 rounded-xl border border-slate-700/40 bg-slate-800/20 backdrop-blur-sm text-center">
          <p className="text-slate-400">No employees found</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-700/40 bg-slate-800/20 backdrop-blur-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/40 bg-slate-900/50">
                  <th className="px-6 py-4 text-left">
                    <span className="text-xs uppercase tracking-widest text-slate-400" style={{ fontFamily: "'Space Mono', monospace" }}>
                      Employee
                    </span>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <span className="text-xs uppercase tracking-widest text-slate-400" style={{ fontFamily: "'Space Mono', monospace" }}>
                      ID
                    </span>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <span className="text-xs uppercase tracking-widest text-slate-400" style={{ fontFamily: "'Space Mono', monospace" }}>
                      Department
                    </span>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <span className="text-xs uppercase tracking-widest text-slate-400" style={{ fontFamily: "'Space Mono', monospace" }}>
                      Position
                    </span>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <span className="text-xs uppercase tracking-widest text-slate-400" style={{ fontFamily: "'Space Mono', monospace" }}>
                      Status
                    </span>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <span className="text-xs uppercase tracking-widest text-slate-400" style={{ fontFamily: "'Space Mono', monospace" }}>
                      Joining Date
                    </span>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <span className="text-xs uppercase tracking-widest text-slate-400" style={{ fontFamily: "'Space Mono', monospace" }}>
                      Actions
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {sortedEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-slate-800/30 transition-colors cursor-pointer">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-white">{employee.name}</p>
                        <p className="text-xs text-slate-500">{employee.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-cyan-300 font-mono">{employee.employee_id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-300">{employee.department || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-300">{employee.position || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[employee.status] || 'bg-slate-700/50 text-slate-300'}`}>
                        {employee.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-400">
                        {new Date(employee.joining_date).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => onSelectEmployee(employee)}
                          className="px-3 py-1.5 text-xs bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/30 rounded-lg transition-colors"
                          style={{ fontFamily: "'Space Mono', monospace" }}
                        >
                          View
                        </button>
                        <button
                          onClick={() => onDeleteEmployee(employee.id)}
                          className="px-3 py-1.5 text-xs bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 rounded-lg transition-colors"
                          style={{ fontFamily: "'Space Mono', monospace" }}
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
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border border-slate-700/40 bg-slate-800/20 text-center">
          <p className="text-xs text-slate-500 uppercase mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
            Total Employees
          </p>
          <p className="text-2xl font-bold text-cyan-300">{sortedEmployees.length}</p>
        </div>
        <div className="p-4 rounded-lg border border-slate-700/40 bg-slate-800/20 text-center">
          <p className="text-xs text-slate-500 uppercase mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
            On Probation
          </p>
          <p className="text-2xl font-bold text-yellow-300">
            {sortedEmployees.filter(e => e.status === 'Probation').length}
          </p>
        </div>
        <div className="p-4 rounded-lg border border-slate-700/40 bg-slate-800/20 text-center">
          <p className="text-xs text-slate-500 uppercase mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
            Permanent
          </p>
          <p className="text-2xl font-bold text-green-300">
            {sortedEmployees.filter(e => e.status === 'Permanent').length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmployeeList;
