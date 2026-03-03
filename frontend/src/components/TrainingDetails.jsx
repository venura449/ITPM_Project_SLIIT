import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const TrainingDetails = ({ program, onUpdate, onClose, onProgramsChange }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [details, setDetails] = useState(program);
  const [assignments, setAssignments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [assignmentEmployeeIds, setAssignmentEmployeeIds] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [employeeSearchInput, setEmployeeSearchInput] = useState('');

  const API_URL = 'http://localhost:5000/api/training';

  useEffect(() => {
    fetchProgramDetails();
    fetchEmployees();
  }, [program.id]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/employees');
      const data = await response.json();
      if (data.success) {
        setEmployees(data.data);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const fetchProgramDetails = async () => {
    try {
      const response = await fetch(`${API_URL}/programs/${program.id}`);
      const data = await response.json();

      if (data.success) {
        setDetails(data.data);
        setAssignments(data.data.assignments || []);
        setSessions(data.data.sessions || []);
      } else {
        toast.error('Failed to fetch program details');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('Failed to fetch program details');
    }
  };

  const handleAssignEmployees = async (e) => {
    e.preventDefault();
    
    if (selectedEmployees.length === 0) {
      toast.warning('Please select at least one employee');
      return;
    }

    setLoading(true);

    try {
      const employeeIds = selectedEmployees.map(emp => emp.id);

      const response = await fetch(`${API_URL}/programs/${program.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeIds })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`${data.count} employees assigned successfully! 🎉`);
        setSelectedEmployees([]);
        setEmployeeSearchInput('');
        fetchProgramDetails();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      console.error('Assignment error:', err);
      toast.error('Failed to assign employees');
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSearchChange = (value) => {
    setEmployeeSearchInput(value);
    
    if (value.trim()) {
      const filtered = employees.filter(emp => {
        const alreadySelected = selectedEmployees.some(s => s.id === emp.id);
        const alreadyAssigned = assignments.some(a => a.employee_id === emp.id);
        return (
          !alreadySelected &&
          !alreadyAssigned &&
          (emp.employee_id.toLowerCase().includes(value.toLowerCase()) ||
           emp.name?.toLowerCase().includes(value.toLowerCase()))
        );
      });
      setFilteredEmployees(filtered);
      setShowEmployeeDropdown(true);
    } else {
      setFilteredEmployees([]);
      setShowEmployeeDropdown(false);
    }
  };

  const handleSelectEmployee = (employee) => {
    setSelectedEmployees([...selectedEmployees, employee]);
    setEmployeeSearchInput('');
    setFilteredEmployees([]);
    setShowEmployeeDropdown(false);
  };

  const handleRemoveSelectedEmployee = (employeeId) => {
    setSelectedEmployees(selectedEmployees.filter(emp => emp.id !== employeeId));
  };

  const handleUpdateProgram = async (e) => {
    e.preventDefault();

    const updateData = {
      title: details.title,
      type: details.type,
      description: details.description,
      status: details.status,
      duration_hours: details.duration_hours,
      budget: details.budget,
      start_date: details.start_date,
      end_date: details.end_date,
      location: details.location,
      max_participants: details.max_participants
    };

    const success = await onUpdate(program.id, updateData);
    if (success) {
      setIsEditing(false);
      fetchProgramDetails();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getAssignmentCompletionColor = (status) => {
    const colors = {
      'Completed': 'bg-green-500/20 text-green-300',
      'In Progress': 'bg-cyan-500/20 text-cyan-300',
      'Not Started': 'bg-slate-500/20 text-slate-300',
      'Pending': 'bg-yellow-500/20 text-yellow-300'
    };
    return colors[status] || 'bg-slate-500/20 text-slate-300';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
            {details.title}
          </h2>
          <p className="text-slate-400" style={{ fontFamily: "'Space Mono', monospace" }}>
            Program ID: {program.id}
          </p>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-sm font-semibold uppercase tracking-widest bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 transition-all"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          Close
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700/40">
        <div className="flex gap-1" style={{ fontFamily: "'Space Mono', monospace" }}>
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 text-xs uppercase tracking-widest font-semibold transition-all border-b-2 ${
              activeTab === 'overview'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-6 py-3 text-xs uppercase tracking-widest font-semibold transition-all border-b-2 ${
              activeTab === 'assignments'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            Assignments ({assignments.length})
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-6 py-3 text-xs uppercase tracking-widest font-semibold transition-all border-b-2 ${
              activeTab === 'sessions'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            Sessions ({sessions.length})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === 'overview' && (
          <div className="p-6 rounded-lg border border-slate-700/40 bg-slate-800/20 backdrop-blur-sm">
            {!isEditing ? (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
                    Program Overview
                  </h3>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-widest bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30 transition-all"
                    style={{ fontFamily: "'Space Mono', monospace" }}
                  >
                    Edit
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
                      Type
                    </p>
                    <p className="text-cyan-300 font-semibold">{details.type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
                      Status
                    </p>
                    <p className="text-cyan-300 font-semibold">{details.status}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
                      Duration
                    </p>
                    <p className="text-cyan-300 font-semibold">{details.duration_hours} hours</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
                      Max Participants
                    </p>
                    <p className="text-cyan-300 font-semibold">{details.max_participants || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
                      Start Date
                    </p>
                    <p className="text-cyan-300 font-semibold">{new Date(details.start_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
                      End Date
                    </p>
                    <p className="text-cyan-300 font-semibold">{new Date(details.end_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
                      Location
                    </p>
                    <p className="text-cyan-300 font-semibold">{details.location || '—'}</p>
                  </div>
                  {details.budget && (
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
                        Budget
                      </p>
                      <p className="text-cyan-300 font-semibold">₨ {parseFloat(details.budget).toLocaleString('en-IN')}</p>
                    </div>
                  )}
                </div>

                {details.description && (
                  <div className="mt-6">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
                      Description
                    </p>
                    <p className="text-cyan-300">{details.description}</p>
                  </div>
                )}
              </>
            ) : (
              <form onSubmit={handleUpdateProgram} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>
                      Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={details.title}
                      onChange={handleInputChange}
                      className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-4 py-3 text-sm outline-none border border-slate-700/40 focus:border-cyan-400/40 transition-colors"
                      style={{ fontFamily: "'Space Mono', monospace" }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>
                      Status
                    </label>
                    <select
                      name="status"
                      value={details.status}
                      onChange={handleInputChange}
                      className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-4 py-3 text-sm outline-none border border-slate-700/40 focus:border-cyan-400/40 transition-colors"
                      style={{ fontFamily: "'Space Mono', monospace" }}
                    >
                      <option value="Planned">Planned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={details.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-4 py-3 text-sm outline-none border border-slate-700/40 focus:border-cyan-400/40 transition-colors resize-none"
                    style={{ fontFamily: "'Space Mono', monospace" }}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-3 rounded-lg font-semibold text-sm uppercase tracking-widest bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 transition-all"
                    style={{ fontFamily: "'Space Mono', monospace" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 rounded-lg font-semibold text-sm uppercase tracking-widest bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-slate-950 transition-all disabled:opacity-50"
                    style={{ fontFamily: "'Space Mono', monospace" }}
                  >
                    {loading ? 'Updating...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="space-y-4">
            {/* Assignment Form */}
            <div className="p-6 rounded-lg border border-slate-700/40 bg-slate-800/20 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
                Assign Employees
              </h3>

              <form onSubmit={handleAssignEmployees} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>
                    Search Employee (by EMP ID or Name)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={employeeSearchInput}
                      onChange={(e) => handleEmployeeSearchChange(e.target.value)}
                      onFocus={() => {
                        if (employeeSearchInput) {
                          setShowEmployeeDropdown(true);
                        }
                      }}
                      placeholder="Search by Employee ID or Name (e.g., EMP001)"
                      disabled={loading}
                      className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-4 py-3 text-sm outline-none placeholder-slate-600 border border-slate-700/40 focus:border-cyan-400/40 transition-colors disabled:opacity-50"
                      style={{ fontFamily: "'Space Mono', monospace" }}
                    />
                    
                    {showEmployeeDropdown && filteredEmployees.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700/40 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                        {filteredEmployees.map(employee => (
                          <button
                            key={employee.id}
                            type="button"
                            onClick={() => handleSelectEmployee(employee)}
                            className="w-full text-left px-4 py-2 hover:bg-slate-700/50 transition-colors border-b border-slate-700/20 last:border-b-0"
                            style={{ fontFamily: "'Space Mono', monospace" }}
                          >
                            <p className="text-sm text-cyan-300 font-semibold">{employee.employee_id} - {employee.name}</p>
                            <p className="text-xs text-slate-500">{employee.position} • {employee.department}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {selectedEmployees.length > 0 && (
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>
                      Selected Employees ({selectedEmployees.length})
                    </label>
                    <div className="space-y-2">
                      {selectedEmployees.map(emp => (
                        <div key={emp.id} className="p-3 rounded-lg bg-slate-900/60 border border-cyan-500/30 flex items-center justify-between">
                          <div>
                            <p className="text-sm text-cyan-300 font-semibold" style={{ fontFamily: "'Space Mono', monospace" }}>
                              {emp.employee_id} - {emp.name}
                            </p>
                            <p className="text-xs text-slate-500" style={{ fontFamily: "'Space Mono', monospace" }}>
                              {emp.position} • {emp.department}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSelectedEmployee(emp.id)}
                            className="px-3 py-1 rounded text-xs font-semibold bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors"
                            style={{ fontFamily: "'Space Mono', monospace" }}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || selectedEmployees.length === 0}
                  className="w-full py-3 rounded-lg font-semibold text-sm uppercase tracking-widest bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-500 hover:to-cyan-500 text-slate-950 transition-all disabled:opacity-50"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  {loading ? 'Assigning...' : `Assign ${selectedEmployees.length} Employee${selectedEmployees.length !== 1 ? 's' : ''}`}
                </button>
              </form>
            </div>

            {/* Assignments List */}
            <div className="p-6 rounded-lg border border-slate-700/40 bg-slate-800/20 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
                Assigned Employees ({assignments.length})
              </h3>

              {assignments.length === 0 ? (
                <p className="text-slate-400" style={{ fontFamily: "'Space Mono', monospace" }}>
                  No employees assigned to this program yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {assignments.map(assignment => (
                    <div key={assignment.id} className="p-3 rounded-lg bg-slate-900/40 border border-slate-700/40 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-cyan-300" style={{ fontFamily: "'Space Mono', monospace" }}>
                          {assignment.employee_name}
                        </p>
                        <p className="text-xs text-slate-500" style={{ fontFamily: "'Space Mono', monospace" }}>
                          Email: {assignment.employee_email}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded text-xs font-semibold ${getAssignmentCompletionColor(assignment.completion_status)}`} style={{ fontFamily: "'Space Mono', monospace" }}>
                        {assignment.completion_status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="p-6 rounded-lg border border-slate-700/40 bg-slate-800/20 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
              Training Sessions ({sessions.length})
            </h3>

            {sessions.length === 0 ? (
              <p className="text-slate-400" style={{ fontFamily: "'Space Mono', monospace" }}>
                No sessions created for this program yet.
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {sessions.map(session => (
                  <div key={session.id} className="p-4 rounded-lg bg-slate-900/40 border border-slate-700/40">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-cyan-300" style={{ fontFamily: "'Syne', sans-serif" }}>
                          {session.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-1" style={{ fontFamily: "'Space Mono', monospace" }}>
                          Session {session.session_number}
                        </p>
                      </div>
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {session.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">{session.description}</p>
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <p className="text-slate-500 mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
                          Date
                        </p>
                        <p className="text-cyan-300" style={{ fontFamily: "'Space Mono', monospace" }}>
                          {new Date(session.scheduled_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
                          Time
                        </p>
                        <p className="text-cyan-300" style={{ fontFamily: "'Space Mono', monospace" }}>
                          {session.start_time} - {session.end_time}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
                          Facilitator
                        </p>
                        <p className="text-cyan-300" style={{ fontFamily: "'Space Mono', monospace" }}>
                          {session.facilitator_name || '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainingDetails;
