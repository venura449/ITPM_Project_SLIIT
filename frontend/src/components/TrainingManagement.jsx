import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import TrainingList from "./TrainingList";
import CreateTrainingForm from "./CreateTrainingForm";
import TrainingDetails from "./TrainingDetails";

const TrainingManagement = () => {
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    programId: null,
    programTitle: "",
  });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ type: "", status: "", search: "" });

  const API_URL = "http://localhost:5000/api/training";

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append("type", filters.type);
      if (filters.status) params.append("status", filters.status);
      if (filters.search) params.append("search", filters.search);
      const response = await fetch(`${API_URL}/programs?${params}`);
      const data = await response.json();
      if (data.success) setPrograms(data.data);
      else toast.error(data.message);
    } catch {
      toast.error("Failed to fetch training programs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, [filters]);

  const handleCreateProgram = async (formData) => {
    const response = await fetch(`${API_URL}/programs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const data = await response.json();
    if (data.success) {
      toast.success("Training program created successfully!");
      setShowCreateModal(false);
      fetchPrograms();
    } else {
      toast.error(data.message);
      throw new Error(data.message);
    }
  };

  const handleUpdateProgram = async (programId, updateData) => {
    try {
      const response = await fetch(`${API_URL}/programs/${programId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Program updated!");
        fetchPrograms();
        return true;
      } else {
        toast.error(data.message);
        return false;
      }
    } catch {
      toast.error("Failed to update program");
      return false;
    }
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(
        `${API_URL}/programs/${deleteModal.programId}`,
        { method: "DELETE" },
      );
      const data = await response.json();
      if (data.success) {
        toast.success("Program deleted");
        fetchPrograms();
      } else toast.error(data.message);
    } catch {
      toast.error("Failed to delete program");
    } finally {
      setDeleteModal({ isOpen: false, programId: null, programTitle: "" });
    }
  };

  return (
    <div
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      className="h-full flex flex-col px-6 py-6"
    >
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Training Management
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Manage programs, sessions, and employee assignments
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-sm"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Program
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-1 pb-6">
        <TrainingList
          programs={programs}
          loading={loading}
          filters={filters}
          onFilterChange={setFilters}
          onSelectProgram={setSelectedProgram}
          onDeleteProgram={(id, title) =>
            setDeleteModal({ isOpen: true, programId: id, programTitle: title })
          }
        />
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <CreateTrainingForm
            onSubmit={handleCreateProgram}
            onCancel={() => setShowCreateModal(false)}
          />
        </div>
      )}

      {/* Details Modal */}
      {selectedProgram && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <TrainingDetails
            program={selectedProgram}
            onUpdate={handleUpdateProgram}
            onClose={() => setSelectedProgram(null)}
            onProgramsChange={fetchPrograms}
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md p-8">
            <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
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
                  d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-800 text-center mb-2">
              Delete Program
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-700">
                "{deleteModal.programTitle}"
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() =>
                  setDeleteModal({
                    isOpen: false,
                    programId: null,
                    programTitle: "",
                  })
                }
                className="flex-1 py-3 text-sm font-semibold rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 text-sm font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all"
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

export default TrainingManagement;
