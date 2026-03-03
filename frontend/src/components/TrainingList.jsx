import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const TrainingList = ({ programs, loading, filters, onFilterChange, onSelectProgram, onDeleteProgram }) => {
  const [statusCounts, setStatusCounts] = useState({});

  useEffect(() => {
    const counts = {};
    programs.forEach(program => {
      counts[program.status] = (counts[program.status] || 0) + 1;
    });
    setStatusCounts(counts);
  }, [programs]);

  const getStatusColor = (status) => {
    const colors = {
      'Planned': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'In Progress': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      'Completed': 'bg-green-500/20 text-green-300 border-green-500/30',
      'Cancelled': 'bg-red-500/20 text-red-300 border-red-500/30'
    };
    return colors[status] || 'bg-slate-500/20 text-slate-300 border-slate-500/30';
  };

  const getTypeColor = (type) => {
    return type === 'Internal' 
      ? 'bg-indigo-500/20 text-indigo-300' 
      : 'bg-purple-500/20 text-purple-300';
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="p-4 rounded-lg border border-slate-700/40 bg-slate-800/20 backdrop-blur-sm">
        <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-widest" style={{ fontFamily: "'Space Mono', monospace" }}>
          Filters
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>
              Type
            </label>
            <select
              value={filters.type || ''}
              onChange={(e) => onFilterChange({ ...filters, type: e.target.value })}
              className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-3 py-2 text-xs outline-none border border-slate-700/40 focus:border-cyan-400/40 transition-colors"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              <option value="">All Types</option>
              <option value="Internal">Internal</option>
              <option value="External">External</option>
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>
              Status
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
              className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-3 py-2 text-xs outline-none border border-slate-700/40 focus:border-cyan-400/40 transition-colors"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              <option value="">All Status</option>
              <option value="Planned">Planned</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>
              Search
            </label>
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
              placeholder="Search programs..."
              className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-3 py-2 text-xs outline-none placeholder-slate-600 border border-slate-700/40 focus:border-cyan-400/40 transition-colors"
              style={{ fontFamily: "'Space Mono', monospace" }}
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border border-slate-700/40 bg-slate-800/20 backdrop-blur-sm">
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
            Total Programs
          </p>
          <p className="text-2xl font-bold text-cyan-300">{programs.length}</p>
        </div>
        <div className="p-4 rounded-lg border border-slate-700/40 bg-slate-800/20 backdrop-blur-sm">
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
            In Progress
          </p>
          <p className="text-2xl font-bold text-indigo-300">{statusCounts['In Progress'] || 0}</p>
        </div>
        <div className="p-4 rounded-lg border border-slate-700/40 bg-slate-800/20 backdrop-blur-sm">
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
            Completed
          </p>
          <p className="text-2xl font-bold text-green-300">{statusCounts['Completed'] || 0}</p>
        </div>
        <div className="p-4 rounded-lg border border-slate-700/40 bg-slate-800/20 backdrop-blur-sm">
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
            Planned
          </p>
          <p className="text-2xl font-bold text-blue-300">{statusCounts['Planned'] || 0}</p>
        </div>
      </div>

      {/* Programs List */}
      {loading ? (
        <div className="p-8 text-center">
          <p className="text-slate-400" style={{ fontFamily: "'Space Mono', monospace" }}>
            Loading training programs...
          </p>
        </div>
      ) : programs.length === 0 ? (
        <div className="p-8 text-center rounded-lg border border-slate-700/40 bg-slate-800/20">
          <p className="text-slate-400" style={{ fontFamily: "'Space Mono', monospace" }}>
            No training programs found. Create one to get started!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {programs.map(program => (
            <div
              key={program.id}
              className="p-5 rounded-lg border border-slate-700/40 bg-slate-800/20 backdrop-blur-sm hover:border-cyan-400/40 transition-all duration-200 cursor-pointer hover:bg-slate-800/30"
              onClick={() => onSelectProgram(program)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-cyan-300" style={{ fontFamily: "'Syne', sans-serif" }}>
                      {program.title}
                    </h3>
                    <span className={`px-2 py-1 rounded text-xs font-semibold border ${getTypeColor(program.type)}`} style={{ fontFamily: "'Space Mono', monospace" }}>
                      {program.type}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold border ${getStatusColor(program.status)}`} style={{ fontFamily: "'Space Mono', monospace" }}>
                      {program.status}
                    </span>
                  </div>
                  
                  <p className="text-sm text-slate-400 mb-3" style={{ fontFamily: "'Space Mono', monospace" }}>
                    {program.description || 'No description provided'}
                  </p>

                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
                        Duration
                      </p>
                      <p className="text-cyan-300">{program.duration_hours} hrs</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
                        Dates
                      </p>
                      <p className="text-cyan-300">{new Date(program.start_date).toLocaleDateString()} - {new Date(program.end_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
                        Max Participants
                      </p>
                      <p className="text-cyan-300">{program.max_participants || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
                        Location
                      </p>
                      <p className="text-cyan-300">{program.location || 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectProgram(program);
                    }}
                    className="px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-widest bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30 transition-all"
                    style={{ fontFamily: "'Space Mono', monospace" }}
                  >
                    View
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteProgram(program.id);
                    }}
                    className="px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-widest bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30 transition-all"
                    style={{ fontFamily: "'Space Mono', monospace" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrainingList;
