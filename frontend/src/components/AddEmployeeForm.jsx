import { useState } from 'react';
import { toast } from 'react-toastify';

const AddEmployeeForm = ({ onSubmit }) => {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    employee_id: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    
    // Step 2: Employment Details
    department: '',
    position: '',
    designation: '',
    status: 'Probation',
    
    // Step 3: Dates & Compensation
    joining_date: '',
    probation_end_date: '',
    salary: '',
    
    // Step 4: Additional Info
    manager_id: '',
    notes: ''
  });

  const departments = [
    'Human Resources',
    'Finance',
    'IT',
    'Operations',
    'Marketing',
    'Sales',
    'Legal',
    'Administration'
  ];

  const positions = [
    'Junior Associate',
    'Senior Associate',
    'Team Lead',
    'Manager',
    'Senior Manager',
    'Director',
    'Executive'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.employee_id.trim()) {
          toast.warning('Employee ID is required');
          return false;
        }
        if (!formData.name.trim()) {
          toast.warning('Employee name is required');
          return false;
        }
        if (!formData.email.trim()) {
          toast.warning('Email address is required');
          return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          toast.warning('Please enter a valid email address');
          return false;
        }
        return true;
      
      case 2:
        if (!formData.department) {
          toast.warning('Please select a department');
          return false;
        }
        if (!formData.position) {
          toast.warning('Please select a position');
          return false;
        }
        return true;
      
      case 3:
        if (!formData.joining_date) {
          toast.warning('Joining date is required');
          return false;
        }
        return true;
      
      case 4:
        return true;
      
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep(4)) {
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        user_id: null, // Admin is adding employee, not tied to user account yet
        employee_id: formData.employee_id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address || null,
        department: formData.department,
        position: formData.position,
        status: formData.status,
        joining_date: formData.joining_date,
        probation_end_date: formData.probation_end_date,
        salary: formData.salary ? parseFloat(formData.salary) : null,
        designation: formData.designation,
        manager_id: formData.manager_id ? parseInt(formData.manager_id) : null,
        notes: formData.notes,
        role: {
          role: formData.position || 'Employee'
        }
      };

      await onSubmit(submitData);

      // Reset form
      setFormData({
        employee_id: '',
        name: '',
        email: '',
        phone: '',
        address: '',
        department: '',
        position: '',
        designation: '',
        status: 'Probation',
        joining_date: '',
        probation_end_date: '',
        salary: '',
        manager_id: '',
        notes: ''
      });
      setCurrentStep(1);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
              Basic Information
            </h3>
            
            <div className="space-y-4">
              <div className="form-group">
                <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>
                  Employee ID *
                </label>
                <input
                  type="text"
                  name="employee_id"
                  value={formData.employee_id}
                  onChange={handleChange}
                  placeholder="EMP001"
                  disabled={loading}
                  className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-4 py-3 text-sm outline-none placeholder-slate-600 border border-slate-700/40 focus:border-cyan-400/40 transition-colors disabled:opacity-50"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                />
              </div>

              <div className="form-group">
                <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  disabled={loading}
                  className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-4 py-3 text-sm outline-none placeholder-slate-600 border border-slate-700/40 focus:border-cyan-400/40 transition-colors disabled:opacity-50"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                />
              </div>

              <div className="form-group">
                <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@company.com"
                  disabled={loading}
                  className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-4 py-3 text-sm outline-none placeholder-slate-600 border border-slate-700/40 focus:border-cyan-400/40 transition-colors disabled:opacity-50"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                />
              </div>

              <div className="form-group">
                <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+94 71 234 5678"
                  disabled={loading}
                  className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-4 py-3 text-sm outline-none placeholder-slate-600 border border-slate-700/40 focus:border-cyan-400/40 transition-colors disabled:opacity-50"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                />
              </div>

              <div className="form-group">
                <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street address, city, postal code"
                  disabled={loading}
                  className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-4 py-3 text-sm outline-none placeholder-slate-600 border border-slate-700/40 focus:border-cyan-400/40 transition-colors disabled:opacity-50"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                />
              </div>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
              Employment Details
            </h3>
            
            <div className="space-y-4">
              <div className="form-group">
                <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>
                  Department *
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-4 py-3 text-sm outline-none border border-slate-700/40 focus:border-cyan-400/40 transition-colors disabled:opacity-50"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>
                  Position *
                </label>
                <select
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-4 py-3 text-sm outline-none border border-slate-700/40 focus:border-cyan-400/40 transition-colors disabled:opacity-50"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  <option value="">Select Position</option>
                  {positions.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>
                  Designation
                </label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  placeholder="Job Title (optional)"
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-4 py-3 text-sm outline-none placeholder-slate-600 border border-slate-700/40 focus:border-cyan-400/40 transition-colors disabled:opacity-50"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                />
              </div>

              <div className="form-group">
                <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>
                  Employment Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-4 py-3 text-sm outline-none border border-slate-700/40 focus:border-cyan-400/40 transition-colors disabled:opacity-50"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  <option value="Probation">Probation</option>
                  <option value="Permanent">Permanent</option>
                  <option value="Resigned">Resigned</option>
                </select>
              </div>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
              Dates & Compensation
            </h3>
            
            <div className="space-y-4">
              <div className="form-group">
                <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>
                  Joining Date *
                </label>
                <input
                  type="date"
                  name="joining_date"
                  value={formData.joining_date}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-4 py-3 text-sm outline-none border border-slate-700/40 focus:border-cyan-400/40 transition-colors disabled:opacity-50"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                />
              </div>

              <div className="form-group">
                <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>
                  Probation End Date
                </label>
                <input
                  type="date"
                  name="probation_end_date"
                  value={formData.probation_end_date}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-4 py-3 text-sm outline-none border border-slate-700/40 focus:border-cyan-400/40 transition-colors disabled:opacity-50"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                />
              </div>

              <div className="form-group">
                <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>
                  Monthly Salary
                </label>
                <input
                  type="number"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  placeholder="50000"
                  step="0.01"
                  disabled={loading}
                  className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-4 py-3 text-sm outline-none placeholder-slate-600 border border-slate-700/40 focus:border-cyan-400/40 transition-colors disabled:opacity-50"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                />
              </div>
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
              Additional Information
            </h3>
            
            <div className="space-y-4">
              <div className="form-group">
                <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>
                  Manager ID
                </label>
                <input
                  type="number"
                  name="manager_id"
                  value={formData.manager_id}
                  onChange={handleChange}
                  placeholder="Employee ID of manager (optional)"
                  disabled={loading}
                  className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-4 py-3 text-sm outline-none placeholder-slate-600 border border-slate-700/40 focus:border-cyan-400/40 transition-colors disabled:opacity-50"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                />
              </div>

              <div className="form-group">
                <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any additional information about the employee..."
                  disabled={loading}
                  rows="4"
                  className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-4 py-3 text-sm outline-none placeholder-slate-600 border border-slate-700/40 focus:border-cyan-400/40 transition-colors disabled:opacity-50 resize-none"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                />
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const renderSummary = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
          Review Employee Details
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
              Employee ID
            </p>
            <p className="text-cyan-300 font-mono">{formData.employee_id}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
              Name
            </p>
            <p className="text-cyan-300">{formData.name}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
              Email
            </p>
            <p className="text-cyan-300">{formData.email}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
              Phone
            </p>
            <p className="text-cyan-300">{formData.phone || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
              Address
            </p>
            <p className="text-cyan-300">{formData.address || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
              Department
            </p>
            <p className="text-cyan-300">{formData.department}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
              Position
            </p>
            <p className="text-cyan-300">{formData.position}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
              Status
            </p>
            <p className="text-cyan-300">{formData.status}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
              Joining Date
            </p>
            <p className="text-cyan-300">{new Date(formData.joining_date).toLocaleDateString()}</p>
          </div>
        </div>

        {formData.salary && (
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
              Monthly Salary
            </p>
            <p className="text-cyan-300">₨ {parseFloat(formData.salary).toLocaleString('en-IN')}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="p-6 rounded-xl border border-slate-700/40 bg-slate-800/20 backdrop-blur-sm">
        <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
          Add New Employee
        </h2>
        <p className="text-sm text-slate-400 mb-6" style={{ fontFamily: "'Space Mono', monospace" }}>
          Step {currentStep} of 4
        </p>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(step => (
              <div key={step} className={`flex-1 h-1 rounded-full transition-all ${
                step <= currentStep ? 'bg-cyan-400' : 'bg-slate-700'
              }`} />
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {currentStep <= 4 ? renderStep() : renderSummary()}

          {/* Navigation Buttons */}
          <div className="flex gap-3 pt-4">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                disabled={loading}
                className="px-6 py-3 rounded-lg font-semibold text-sm uppercase tracking-widest bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 border border-slate-600 transition-all duration-200 disabled:opacity-50"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                Previous
              </button>
            )}
            
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="flex-1 py-3 rounded-lg font-semibold text-sm uppercase tracking-widest bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-slate-950 transition-all duration-200 disabled:opacity-50"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 rounded-lg font-semibold text-sm uppercase tracking-widest bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-500 hover:to-cyan-500 text-slate-950 transition-all duration-200 disabled:opacity-50"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                {loading ? 'Creating Employee...' : 'Create Employee'}
              </button>
            )}
          </div>
        </form>

        <p className="text-xs text-slate-600 mt-4" style={{ fontFamily: "'Space Mono', monospace" }}>
          * Required fields
        </p>
      </div>
    </div>
  );
};

export default AddEmployeeForm;
