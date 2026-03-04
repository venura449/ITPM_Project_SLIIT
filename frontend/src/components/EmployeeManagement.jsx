import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import AddEmployeeForm from "./AddEmployeeForm";
import EmployeeList from "./EmployeeList";
import EmployeeProfile from "./EmployeeProfile";

const EmployeeManagement = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    employeeId: null,
    employeeName: null,
  });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    department: "",
    status: "",
    search: "",
  });

  const API_URL = "http://localhost:5000/api/employees";

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.department) params.append("department", filters.department);
      if (filters.status) params.append("status", filters.status);
      if (filters.search) params.append("search", filters.search);
      const response = await fetch(`${API_URL}?${params}`);
      const data = await response.json();
      if (data.success) setEmployees(data.data);
      else toast.error(data.message);
    } catch (err) {
      toast.error("Failed to fetch employees");
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Employee added successfully!");
        setShowAddModal(false);
        fetchEmployees();
      } else toast.error(data.message);
    } catch {
      toast.error("Failed to add employee");
    }
  };

  const handleSelectEmployee = (employee) => {
    setSelectedEmployee(employee);
  };

  const handleUpdateEmployee = async (employeeId, updateData) => {
    try {
      const response = await fetch(`${API_URL}/${employeeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Employee updated successfully!");
        fetchEmployees();
        return true;
      } else {
        toast.error(data.message);
        return false;
      }
    } catch {
      toast.error("Failed to update employee");
      return false;
    }
  };

  const handleDeleteEmployee = (employeeId) => {
    const emp = employees.find((e) => e.id === employeeId);
    setDeleteConfirm({
      show: true,
      employeeId,
      employeeName: emp?.name || "this employee",
    });
  };

  const confirmDelete = async () => {
    const { employeeId } = deleteConfirm;
    setDeleteConfirm({ show: false, employeeId: null, employeeName: null });
    try {
      const response = await fetch(`${API_URL}/${employeeId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Employee deleted");
        fetchEmployees();
      } else toast.error(data.message);
    } catch {
      toast.error("Failed to delete employee");
    }
  };

  const tabs = [{ key: "list", label: "Employee List" }];

  return (
    <div
      className="min-h-full p-6 lg:p-8"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Employee Management
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Onboarding, records, and lifecycle tracking
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className="px-5 py-3 text-sm font-medium transition-all duration-200 border-b-2 -mb-px border-blue-600 text-blue-600 bg-blue-50/60"
          >
            {tab.label}
          </button>
        ))}

        {/* Add Employee CTA on the right */}
        <div className="ml-auto flex items-center">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-sm"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Employee
          </button>
        </div>
      </div>

      {/* Content */}
      <EmployeeList
        employees={employees}
        loading={loading}
        filters={filters}
        onFilterChange={setFilters}
        onSelectEmployee={handleSelectEmployee}
        onDeleteEmployee={handleDeleteEmployee}
      />
      {/* Add Employee Modal Overlay */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: "rgba(15,23,42,0.45)",
            backdropFilter: "blur(4px)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
        >
          <div className="w-full max-w-2xl rounded-2xl shadow-2xl">
            <AddEmployeeForm
              onSubmit={handleAddEmployee}
              onCancel={() => setShowAddModal(false)}
            />
          </div>
        </div>
      )}

      {/* Employee Profile Modal */}
      {selectedEmployee && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: "rgba(15,23,42,0.45)",
            backdropFilter: "blur(4px)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedEmployee(null);
          }}
        >
          <div className="w-full max-w-3xl">
            <EmployeeProfile
              employee={selectedEmployee}
              onUpdate={handleUpdateEmployee}
              onClose={() => setSelectedEmployee(null)}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: "rgba(15,23,42,0.55)",
            backdropFilter: "blur(4px)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget)
              setDeleteConfirm({
                show: false,
                employeeId: null,
                employeeName: null,
              });
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-sm p-7"
            style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
          >
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                <svg
                  className="w-6 h-6 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-800">
                  Delete Employee
                </h3>
                <p className="text-sm text-gray-400 mt-0.5">
                  This action cannot be undone
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-800">
                {deleteConfirm.employeeName}
              </span>
              ? All their data will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() =>
                  setDeleteConfirm({
                    show: false,
                    employeeId: null,
                    employeeName: null,
                  })
                }
                className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;
