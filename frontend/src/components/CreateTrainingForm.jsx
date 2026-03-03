import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const CreateTrainingForm = ({ onSubmit }) => {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [showTrainerDropdown, setShowTrainerDropdown] = useState(false);
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    title: '',
    type: 'Internal',
    description: '',
    
    // Step 2: Details
    duration_hours: '',
    budget: '',
    max_participants: '',
    
    // Step 3: Dates & Location
    start_date: '',
    end_date: '',
    location: '',
    trainer_id: '',
    trainer_name: '',
    
    // Step 4: Review
    status: 'Planned'
  });

  const trainingTypes = ['Internal', 'External'];
  const statuses = ['Planned', 'In Progress', 'Completed', 'Cancelled'];

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/employees');
        const data = await response.json();
        if (data.success) {
          setEmployees(data.data);
        }
      } catch (err) {
        console.error('Fetch employees error:', err);
      }
    };
    fetchEmployees();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Filter employees when searching for trainer
    if (name === 'trainer_name') {
      if (value) {
        const filtered = employees.filter(emp =>
          emp.employee_id.toLowerCase().includes(value.toLowerCase()) ||
          emp.name?.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredEmployees(filtered);
        setShowTrainerDropdown(true);
      } else {
        setFilteredEmployees([]);
        setShowTrainerDropdown(false);
      }
    }
  };

  const handleSelectTrainer = (employee) => {
    setFormData(prev => ({
      ...prev,
      trainer_id: employee.id,
      trainer_name: `${employee.employee_id} - ${employee.name}`
    }));
    setShowTrainerDropdown(false);
    setFilteredEmployees([]);
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.title.trim()) {
          toast.warning('Training program title is required');
          return false;
        }
        if (!formData.type) {
          toast.warning('Please select training type');
          return false;
        }
        return true;
      
      case 2:
        if (!formData.duration_hours) {
          toast.warning('Duration in hours is required');
          return false;
        }
        if (isNaN(formData.duration_hours) || parseFloat(formData.duration_hours) <= 0) {
          toast.warning('Duration must be a positive number');
          return false;
        }
        return true;
      
      case 3:
        if (!formData.start_date) {
          toast.warning('Start date is required');
          return false;
        }
        if (!formData.end_date) {
          toast.warning('End date is required');
          return false;
        }
        if (new Date(formData.start_date) >= new Date(formData.end_date)) {
          toast.warning('End date must be after start date');
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
        title: formData.title,
        type: formData.type,
        description: formData.description,
        duration_hours: parseFloat(formData.duration_hours),
        budget: formData.budget ? parseFloat(formData.budget) : null,
        trainer_id: formData.trainer_id ? parseInt(formData.trainer_id) : null,
        status: formData.status,
        start_date: formData.start_date,
        end_date: formData.end_date,
        location: formData.location,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null
      };

      await onSubmit(submitData);

      // Reset form
      setFormData({
        title: '',
        type: 'Internal',
        description: '',
        duration_hours: '',
        budget: '',
        max_participants: '',
        start_date: '',
        end_date: '',
        location: '',
        trainer_id: '',
        status: 'Planned'
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
              Training Program Basics
            </h3>
            
            <div className="space-y-4">
              <div className="form-group">
                <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>
                  Program Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Advanced Leadership Development"
                  disabled={loading}
                  className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-4 py-3 text-sm outline-none placeholder-slate-600 border border-slate-700/40 focus:border-cyan-400/40 transition-colors disabled:opacity-50"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                />
              </div>

              <div className="form-group">
                <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>
                  Training Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-4 py-3 text-sm outline-none border border-slate-700/40 focus:border-cyan-400/40 transition-colors disabled:opacity-50"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  {trainingTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Detailed description of the training program..."
                  disabled={loading}
                  rows="4"
                  className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-4 py-3 text-sm outline-none placeholder-slate-600 border border-slate-700/40 focus:border-cyan-400/40 transition-colors disabled:opacity-50 resize-none"
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
              Program Details
            </h3>
            
            <div className="space-y-4">
              <div className="form-group">
                <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>
                  Duration (Hours) *
                </label>
                <input
                  type="number"
                  name="duration_hours"
                  value={formData.duration_hours}
                  onChange={handleChange}
                  placeholder="40"
                  step="0.5"
                  min="0"
                  disabled={loading}
                  className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-4 py-3 text-sm outline-none placeholder-slate-600 border border-slate-700/40 focus:border-cyan-400/40 transition-colors disabled:opacity-50"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                />
              </div>

              <div className="form-group">
                <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>
                  Budget (Optional)
                </label>
                <input
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  placeholder="500000"
                  step="0.01"
                  min="0"
                  disabled={loading}
                  className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-4 py-3 text-sm outline-none placeholder-slate-600 border border-slate-700/40 focus:border-cyan-400/40 transition-colors disabled:opacity-50"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                />
              </div>

              <div className="form-group">
                <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>
                  Maximum Participants
                </label>
                <input
                  type="number"
                  name="max_participants"
                  value={formData.max_participants}
                  onChange={handleChange}
                  placeholder="50"
                  min="1"
                  disabled={loading}
                  className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-4 py-3 text-sm outline-none placeholder-slate-600 border border-slate-700/40 focus:border-cyan-400/40 transition-colors disabled:opacity-50"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                />
              </div>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
              Schedule & Location
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>
                    Start Date *
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-4 py-3 text-sm outline-none border border-slate-700/40 focus:border-cyan-400/40 transition-colors disabled:opacity-50"
                    style={{ fontFamily: "'Space Mono', monospace" }}
                  />
                </div>

                <div className="form-group">
                  <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>
                    End Date *
                  </label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-4 py-3 text-sm outline-none border border-slate-700/40 focus:border-cyan-400/40 transition-colors disabled:opacity-50"
                    style={{ fontFamily: "'Space Mono', monospace" }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Training venue address"
                  disabled={loading}
                  className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-4 py-3 text-sm outline-none placeholder-slate-600 border border-slate-700/40 focus:border-cyan-400/40 transition-colors disabled:opacity-50"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                />
              </div>

              <div className="form-group">
                <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>
                  Trainer/Facilitator (Search by EMP ID)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="trainer_name"
                    value={formData.trainer_name}
                    onChange={handleChange}
                    onFocus={() => {
                      if (formData.trainer_name) {
                        setShowTrainerDropdown(true);
                      }
                    }}
                    placeholder="Search by Employee ID or Name (e.g., EMP001)"
                    disabled={loading}
                    className="w-full bg-slate-900/60 text-cyan-50 rounded-lg px-4 py-3 text-sm outline-none placeholder-slate-600 border border-slate-700/40 focus:border-cyan-400/40 transition-colors disabled:opacity-50"
                    style={{ fontFamily: "'Space Mono', monospace" }}
                  />
                  
                  {showTrainerDropdown && filteredEmployees.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700/40 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                      {filteredEmployees.map(employee => (
                        <button
                          key={employee.id}
                          type="button"
                          onClick={() => handleSelectTrainer(employee)}
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
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
              Review Training Program
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
                  Program Title
                </p>
                <p className="text-cyan-300">{formData.title}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
                  Type
                </p>
                <p className="text-cyan-300">{formData.type}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
                  Duration
                </p>
                <p className="text-cyan-300">{formData.duration_hours} hours</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
                  Max Participants
                </p>
                <p className="text-cyan-300">{formData.max_participants || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
                  Start Date
                </p>
                <p className="text-cyan-300">{new Date(formData.start_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
                  End Date
                </p>
                <p className="text-cyan-300">{new Date(formData.end_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
                  Status
                </p>
                <p className="text-cyan-300">{formData.status}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
                  Trainer/Facilitator
                </p>
                <p className="text-cyan-300">{formData.trainer_name || '—'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
                  Location
                </p>
                <p className="text-cyan-300">{formData.location || '—'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
                  Budget
                </p>
                <p className="text-cyan-300">${formData.budget || '0'}</p>
              </div>
            </div>

            {formData.description && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
                  Description
                </p>
                <p className="text-cyan-300 text-sm">{formData.description}</p>
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="p-6 rounded-xl border border-slate-700/40 bg-slate-800/20 backdrop-blur-sm">
        <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
          Create Training Program
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
          {renderStep()}

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
                {loading ? 'Creating Program...' : 'Create Program'}
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

export default CreateTrainingForm;
