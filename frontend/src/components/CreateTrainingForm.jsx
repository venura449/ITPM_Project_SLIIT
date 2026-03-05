import { useState, useEffect } from "react";
import { toast } from "react-toastify";

const inputCls =
  "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all placeholder-gray-400 disabled:opacity-50 disabled:bg-gray-50";
const selectCls =
  "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all disabled:opacity-50 disabled:bg-gray-50";
const labelCls = "block text-xs font-medium text-gray-500 mb-1";

const STEPS = ["Basic Info", "Details", "Schedule", "Review"];

const CreateTrainingForm = ({ onSubmit, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [showTrainerDropdown, setShowTrainerDropdown] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    type: "Internal",
    description: "",
    duration_hours: "",
    budget: "",
    max_participants: "",
    start_date: "",
    end_date: "",
    location: "",
    trainer_id: "",
    trainer_name: "",
    status: "Planned",
  });

  useEffect(() => {
    fetch(
      `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/employees`,
    )
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setEmployees(d.data);
      })
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "trainer_name") {
      if (value) {
        setFilteredEmployees(
          employees.filter(
            (emp) =>
              emp.employee_id.toLowerCase().includes(value.toLowerCase()) ||
              emp.name?.toLowerCase().includes(value.toLowerCase()),
          ),
        );
        setShowTrainerDropdown(true);
      } else {
        setFilteredEmployees([]);
        setShowTrainerDropdown(false);
        setFormData((prev) => ({ ...prev, trainer_id: "" }));
      }
    }
  };

  const handleSelectTrainer = (employee) => {
    setFormData((prev) => ({
      ...prev,
      trainer_id: employee.id,
      trainer_name: `${employee.employee_id} - ${employee.name}`,
    }));
    setShowTrainerDropdown(false);
    setFilteredEmployees([]);
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.title.trim()) {
          toast.warning("Title is required");
          return false;
        }
        return true;
      case 2:
        if (
          !formData.duration_hours ||
          parseFloat(formData.duration_hours) <= 0
        ) {
          toast.warning("Valid duration is required");
          return false;
        }
        return true;
      case 3:
        if (!formData.start_date) {
          toast.warning("Start date is required");
          return false;
        }
        if (!formData.end_date) {
          toast.warning("End date is required");
          return false;
        }
        if (new Date(formData.start_date) >= new Date(formData.end_date)) {
          toast.warning("End date must be after start date");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) setCurrentStep((p) => p + 1);
  };
  const handlePrev = () => setCurrentStep((p) => p - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
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
        max_participants: formData.max_participants
          ? parseInt(formData.max_participants)
          : null,
      });
      setFormData({
        title: "",
        type: "Internal",
        description: "",
        duration_hours: "",
        budget: "",
        max_participants: "",
        start_date: "",
        end_date: "",
        location: "",
        trainer_id: "",
        trainer_name: "",
        status: "Planned",
      });
      setCurrentStep(1);
    } catch {
      /* error toasted by parent */
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <h3 className="text-base font-bold text-gray-800 mb-4">
              Basic Information
            </h3>
            <div className="space-y-3">
              <div>
                <label className={labelCls}>
                  Program Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Advanced Leadership Development"
                  disabled={loading}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>
                  Training Type <span className="text-red-400">*</span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  disabled={loading}
                  className={selectCls}
                >
                  <option value="Internal">Internal</option>
                  <option value="External">External</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the training program…"
                  rows={3}
                  disabled={loading}
                  className={`${inputCls} resize-none`}
                />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div>
            <h3 className="text-base font-bold text-gray-800 mb-4">
              Program Details
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={labelCls}>
                  Duration (Hours) <span className="text-red-400">*</span>
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
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Budget (optional)</label>
                <input
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  placeholder="500000"
                  step="0.01"
                  min="0"
                  disabled={loading}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Max Participants</label>
                <input
                  type="number"
                  name="max_participants"
                  value={formData.max_participants}
                  onChange={handleChange}
                  placeholder="50"
                  min="1"
                  disabled={loading}
                  className={inputCls}
                />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Initial Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={loading}
                  className={selectCls}
                >
                  <option value="Planned">Planned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div>
            <h3 className="text-base font-bold text-gray-800 mb-4">
              Schedule & Location
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>
                  Start Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  disabled={loading}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>
                  End Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  disabled={loading}
                  className={inputCls}
                />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Training venue or room"
                  disabled={loading}
                  className={inputCls}
                />
              </div>
              <div className="col-span-2 relative">
                <label className={labelCls}>Trainer / Facilitator</label>
                <input
                  type="text"
                  name="trainer_name"
                  value={formData.trainer_name}
                  onChange={handleChange}
                  onFocus={() => {
                    if (formData.trainer_name) setShowTrainerDropdown(true);
                  }}
                  placeholder="Search by EMP ID or name…"
                  disabled={loading}
                  className={inputCls}
                />
                {showTrainerDropdown && filteredEmployees.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-44 overflow-y-auto">
                    {filteredEmployees.map((emp) => (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => handleSelectTrainer(emp)}
                        className="w-full text-left px-4 py-2.5 hover:bg-blue-50 border-b border-gray-50 last:border-0 transition-colors"
                      >
                        <p className="text-sm font-semibold text-gray-800">
                          {emp.employee_id} — {emp.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {emp.position} · {emp.department}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div>
            <h3 className="text-base font-bold text-gray-800 mb-4">Review</h3>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 grid grid-cols-2 gap-x-6 gap-y-4">
              {[
                ["Title", formData.title],
                ["Type", formData.type],
                ["Duration", `${formData.duration_hours} hours`],
                ["Status", formData.status],
                [
                  "Start Date",
                  formData.start_date
                    ? new Date(formData.start_date).toLocaleDateString()
                    : "—",
                ],
                [
                  "End Date",
                  formData.end_date
                    ? new Date(formData.end_date).toLocaleDateString()
                    : "—",
                ],
                ["Location", formData.location || "—"],
                ["Trainer", formData.trainer_name || "—"],
                ["Max Participants", formData.max_participants || "—"],
                [
                  "Budget",
                  formData.budget
                    ? `₨ ${parseFloat(formData.budget).toLocaleString("en-IN")}`
                    : "—",
                ],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-xs font-medium text-gray-400 mb-0.5">
                    {label}
                  </p>
                  <p className="text-sm font-semibold text-gray-700 break-words">
                    {val}
                  </p>
                </div>
              ))}
              {formData.description && (
                <div className="col-span-2">
                  <p className="text-xs font-medium text-gray-400 mb-0.5">
                    Description
                  </p>
                  <p className="text-sm text-gray-600">
                    {formData.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-xl max-h-[90vh] overflow-y-auto"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Create Training Program
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Step {currentStep} of 4 — {STEPS[currentStep - 1]}
            </p>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="flex gap-1.5 mb-5">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${i + 1 <= currentStep ? "bg-blue-600" : "bg-gray-200"}`}
              />
              <p
                className={`text-xs mt-1.5 font-medium ${i + 1 === currentStep ? "text-blue-600" : i + 1 < currentStep ? "text-gray-400" : "text-gray-300"}`}
              >
                {label}
              </p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {renderStep()}
          <div className="flex gap-3 pt-1">
            {onCancel && currentStep === 1 && (
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="px-5 py-3 text-sm font-semibold rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
            )}
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                disabled={loading}
                className="px-5 py-3 text-sm font-semibold rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all disabled:opacity-50"
              >
                Back
              </button>
            )}
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="flex-1 py-3 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-50"
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 text-sm font-semibold rounded-xl bg-green-600 hover:bg-green-700 text-white transition-all disabled:opacity-50"
              >
                {loading ? "Creating…" : "Create Program"}
              </button>
            )}
          </div>
        </form>
        <p className="text-xs text-gray-400 mt-3">
          <span className="text-red-400">*</span> Required fields
        </p>
      </div>
    </div>
  );
};

export default CreateTrainingForm;
