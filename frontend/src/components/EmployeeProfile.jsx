import { useState } from 'react';
import { toast } from 'react-toastify';

const EmployeeProfile = ({ employee, onUpdate, onClose }) => {
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: employee.phone || '',
    address: employee.address || '',
    department: employee.department || '',
    position: employee.position || '',
    status: employee.status || 'Probation',
    salary: employee.salary || '',
    designation: employee.designation || '',
    notes: employee.notes || ''
  });

  const statusColors = {
    'Probation': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    'Permanent': 'bg-green-500/20 text-green-300 border-green-500/30',
    'Resigned': 'bg-red-500/20 text-red-300 border-red-500/30'
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    try {
      const success = await onUpdate(employee.id, {
        phone: formData.phone,
        address: formData.address,
        department: formData.department,
        position: formData.position,
        status: formData.status,
        salary: formData.salary ? parseFloat(formData.salary) : null,
        designation: formData.designation,
        notes: formData.notes
      });

      if (success) {
        setEditMode(false);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="p-6 rounded-xl border border-slate-700/40 bg-slate-800/20 backdrop-blur-sm">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
              {employee.name}
            </h2>
            <p className="text-slate-400 text-sm" style={{ fontFamily: "'Space Mono', monospace" }}>
              ID: {employee.employee_id}
            </p>
            <p className="text-slate-400 text-sm" style={{ fontFamily: "'Space Mono', monospace" }}>
              {employee.email}
            </p>
          </div>
          <div className="flex gap-2">
            {editMode ? (
              <>
                <button
                  onClick={handleSaveChanges}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600/20 hover:bg-green-600/40 text-green-300 border border-green-500/30 rounded-lg text-xs uppercase tracking-widest font-semibold transition-colors disabled:opacity-50"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setEditMode(false);
                    setFormData({
                      phone: employee.phone || '',
                      address: employee.address || '',
                      department: employee.department || '',
                      position: employee.position || '',
                      status: employee.status || 'Probation',
                      salary: employee.salary || '',
                      designation: employee.designation || '',
                      notes: employee.notes || ''
                    });
                  }}
                  className="px-4 py-2 bg-slate-700/20 hover:bg-slate-700/40 text-slate-300 border border-slate-500/30 rounded-lg text-xs uppercase tracking-widest font-semibold transition-colors"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditMode(true)}
                  className="px-4 py-2 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs uppercase tracking-widest font-semibold transition-colors"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  Edit Profile
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-700/20 hover:bg-slate-700/40 text-slate-300 border border-slate-500/30 rounded-lg text-xs uppercase tracking-widest font-semibold transition-colors"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-4">
          <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold border ${statusColors[employee.status]}`}>
            {employee.status}
          </span>
          {employee.probation_end_date && (
            <div className="text-sm text-slate-400">
              <span className="text-slate-500">Probation ends:</span> {new Date(employee.probation_end_date).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      {/* Employee Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 p-6 rounded-xl border border-slate-700/40 bg-slate-800/20 backdrop-blur-sm">
          <h3 className="text-lg font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
            Employee Information
          </h3>

          {!editMode ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-600 uppercase tracking-wider mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
                    Department
                  </p>
                  <p className="text-cyan-300">{employee.department || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 uppercase tracking-wider mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
                    Position
                  </p>
                  <p className="text-cyan-300">{employee.position || '—'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-600 uppercase tracking-wider mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
                    Joining Date
                  </p>
                  <p className="text-cyan-300">{new Date(employee.joining_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 uppercase tracking-wider mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
                    Designation
                  </p>
                  <p className="text-cyan-300">{employee.designation || '—'}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-600 uppercase tracking-wider mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
                  Contact Information
                </p>
                <p className="text-cyan-300">{employee.phone || '—'}</p>
                <p className="text-cyan-300">{employee.address || '—'}</p>
              </div>

              {employee.salary && (
                <div>
                  <p className="text-xs text-slate-600 uppercase tracking-wider mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
                    Monthly Salary
                  </p>
                  <p className="text-cyan-300">₨ {parseFloat(employee.salary).toLocaleString('en-IN')}</p>
                </div>
              )}

              {employee.notes && (
                <div>
                  <p className="text-xs text-slate-600 uppercase tracking-wider mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
                    Notes
                  </p>
                  <p className="text-slate-300">{employee.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-600 uppercase tracking-wider mb-2 block" style={{ fontFamily: "'Space Mono', monospace" }}>
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="+94 71 234 5678"
                    className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-4 py-2.5 text-sm outline-none border border-slate-700/40 focus:border-cyan-400/40 transition-colors disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 uppercase tracking-wider mb-2 block" style={{ fontFamily: "'Space Mono', monospace" }}>
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Street address, city, postal code"
                    className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-4 py-2.5 text-sm outline-none border border-slate-700/40 focus:border-cyan-400/40 transition-colors disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-600 uppercase tracking-wider mb-2 block" style={{ fontFamily: "'Space Mono', monospace" }}>
                    Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-4 py-2.5 text-sm outline-none border border-slate-700/40 focus:border-cyan-400/40 transition-colors disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 uppercase tracking-wider mb-2 block" style={{ fontFamily: "'Space Mono', monospace" }}>
                    Position
                  </label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-4 py-2.5 text-sm outline-none border border-slate-700/40 focus:border-cyan-400/40 transition-colors disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-600 uppercase tracking-wider mb-2 block" style={{ fontFamily: "'Space Mono', monospace" }}>
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-4 py-2.5 text-sm outline-none border border-slate-700/40 focus:border-cyan-400/40 transition-colors disabled:opacity-50"
                  >
                    <option value="Probation">Probation</option>
                    <option value="Permanent">Permanent</option>
                    <option value="Resigned">Resigned</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-600 uppercase tracking-wider mb-2 block" style={{ fontFamily: "'Space Mono', monospace" }}>
                    Designation
                  </label>
                  <input
                    type="text"
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-4 py-2.5 text-sm outline-none border border-slate-700/40 focus:border-cyan-400/40 transition-colors disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-600 uppercase tracking-wider mb-2 block" style={{ fontFamily: "'Space Mono', monospace" }}>
                  Salary
                </label>
                <input
                  type="number"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  disabled={loading}
                  step="0.01"
                  className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-4 py-2.5 text-sm outline-none border border-slate-700/40 focus:border-cyan-400/40 transition-colors disabled:opacity-50"
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 uppercase tracking-wider mb-2 block" style={{ fontFamily: "'Space Mono', monospace" }}>
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  disabled={loading}
                  rows="3"
                  className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-4 py-2.5 text-sm outline-none border border-slate-700/40 focus:border-cyan-400/40 transition-colors resize-none disabled:opacity-50"
                />
              </div>
            </form>
          )}
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <div className="p-6 rounded-xl border border-slate-700/40 bg-slate-800/20 backdrop-blur-sm">
            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-widest" style={{ fontFamily: "'Space Mono', monospace" }}>
              Quick Stats
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
                  Days Employed
                </p>
                <p className="text-lg font-bold text-cyan-300">
                  {Math.floor((new Date() - new Date(employee.joining_date)) / (1000 * 60 * 60 * 24))}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
                  Current Status
                </p>
                <p className="text-sm text-slate-300">{employee.status}</p>
              </div>
              {employee.manager_name && (
                <div>
                  <p className="text-xs text-slate-500 mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
                    Manager
                  </p>
                  <p className="text-sm text-slate-300">{employee.manager_name}</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 rounded-xl border border-slate-700/40 bg-slate-800/20 backdrop-blur-sm">
            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-widest" style={{ fontFamily: "'Space Mono', monospace" }}>
              Lifecycle
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-slate-700/40">
                <span className="text-slate-500">Joined</span>
                <span className="text-cyan-300">{new Date(employee.joining_date).toLocaleDateString()}</span>
              </div>
              {employee.probation_end_date && (
                <div className="flex items-center justify-between py-2 border-b border-slate-700/40">
                  <span className="text-slate-500">Probation Ends</span>
                  <span className="text-yellow-300">{new Date(employee.probation_end_date).toLocaleDateString()}</span>
                </div>
              )}
              {employee.resignation_date && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-500">Resigned</span>
                  <span className="text-red-300">{new Date(employee.resignation_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;
