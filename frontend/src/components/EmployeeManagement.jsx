import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import AddEmployeeForm from './AddEmployeeForm';
import EmployeeList from './EmployeeList';
import EmployeeProfile from './EmployeeProfile';
import './EmployeeManagement.css';

const EmployeeManagement = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    department: '',
    status: '',
    search: ''
  });

  const API_URL = 'http://localhost:5000/api/employees';

  // Fetch employees
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.department) params.append('department', filters.department);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`${API_URL}?${params}`);
      const data = await response.json();

      if (data.success) {
        setEmployees(data.data);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [filters]);

  const handleAddEmployee = async (formData) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Employee added successfully! 🎉');
        setActiveTab('list');
        fetchEmployees();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      console.error('Add employee error:', err);
      toast.error('Failed to add employee');
    }
  };

  const handleSelectEmployee = (employee) => {
    setSelectedEmployee(employee);
    setActiveTab('profile');
  };

  const handleUpdateEmployee = async (employeeId, updateData) => {
    try {
      const response = await fetch(`${API_URL}/${employeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Employee updated successfully! ✨');
        fetchEmployees();
        return true;
      } else {
        toast.error(data.message);
        return false;
      }
    } catch (err) {
      console.error('Update error:', err);
      toast.error('Failed to update employee');
      return false;
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${employeeId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Employee deleted successfully');
        fetchEmployees();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete employee');
    }
  };

  return (
    <div className="employee-management min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
            Employee Management
          </h1>
          <p className="text-slate-400 text-sm" style={{ fontFamily: "'Space Mono', monospace" }}>
            Digital Onboarding · Lifecycle Tracking · Document Repository
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1" style={{ fontFamily: "'Space Mono', monospace" }}>
            <button
              onClick={() => setActiveTab('list')}
              className={`px-6 py-4 text-xs uppercase tracking-widest font-semibold transition-all duration-200 border-b-2 ${
                activeTab === 'list'
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              Employee List
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={`px-6 py-4 text-xs uppercase tracking-widest font-semibold transition-all duration-200 border-b-2 ${
                activeTab === 'add'
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              Add Employee
            </button>
            {selectedEmployee && (
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-4 text-xs uppercase tracking-widest font-semibold transition-all duration-200 border-b-2 ${
                  activeTab === 'profile'
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                Employee Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'list' && (
          <EmployeeList
            employees={employees}
            loading={loading}
            filters={filters}
            onFilterChange={setFilters}
            onSelectEmployee={handleSelectEmployee}
            onDeleteEmployee={handleDeleteEmployee}
          />
        )}

        {activeTab === 'add' && (
          <AddEmployeeForm onSubmit={handleAddEmployee} />
        )}

        {activeTab === 'profile' && selectedEmployee && (
          <EmployeeProfile
            employee={selectedEmployee}
            onUpdate={handleUpdateEmployee}
            onClose={() => {
              setSelectedEmployee(null);
              setActiveTab('list');
            }}
          />
        )}
      </div>
    </div>
  );
};

export default EmployeeManagement;
