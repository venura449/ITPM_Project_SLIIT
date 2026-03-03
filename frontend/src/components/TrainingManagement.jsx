import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import TrainingList from './TrainingList';
import CreateTrainingForm from './CreateTrainingForm';
import TrainingDetails from './TrainingDetails';
import './TrainingManagement.css';

const TrainingManagement = () => {
  const [activeTab, setActiveTab] = useState('programs');
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    search: ''
  });

  const API_URL = 'http://localhost:5000/api/training';

  // Fetch training programs
  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`${API_URL}/programs?${params}`);
      const data = await response.json();

      if (data.success) {
        setPrograms(data.data);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('Failed to fetch training programs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, [filters]);

  const handleCreateProgram = async (formData) => {
    try {
      const response = await fetch(`${API_URL}/programs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Training program created successfully! 🎉');
        setActiveTab('programs');
        fetchPrograms();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      console.error('Create program error:', err);
      toast.error('Failed to create training program');
    }
  };

  const handleSelectProgram = (program) => {
    setSelectedProgram(program);
    setActiveTab('details');
  };

  const handleUpdateProgram = async (programId, updateData) => {
    try {
      const response = await fetch(`${API_URL}/programs/${programId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Training program updated successfully! ✨');
        fetchPrograms();
        return true;
      } else {
        toast.error(data.message);
        return false;
      }
    } catch (err) {
      console.error('Update error:', err);
      toast.error('Failed to update training program');
      return false;
    }
  };

  const handleDeleteProgram = async (programId) => {
    if (!window.confirm('Are you sure you want to delete this training program?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/programs/${programId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Training program deleted successfully');
        fetchPrograms();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete training program');
    }
  };

  return (
    <div className="training-management min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
            Training & Workforce Development
          </h1>
          <p className="text-slate-400 text-sm" style={{ fontFamily: "'Space Mono', monospace" }}>
            Program Management · Session Scheduling · Employee Assignment · Attendance Tracking
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1" style={{ fontFamily: "'Space Mono', monospace" }}>
            <button
              onClick={() => setActiveTab('programs')}
              className={`px-6 py-4 text-xs uppercase tracking-widest font-semibold transition-all duration-200 border-b-2 ${
                activeTab === 'programs'
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              Programs
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`px-6 py-4 text-xs uppercase tracking-widest font-semibold transition-all duration-200 border-b-2 ${
                activeTab === 'create'
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              Create Program
            </button>
            {selectedProgram && (
              <button
                onClick={() => setActiveTab('details')}
                className={`px-6 py-4 text-xs uppercase tracking-widest font-semibold transition-all duration-200 border-b-2 ${
                  activeTab === 'details'
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                Program Details
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'programs' && (
          <TrainingList
            programs={programs}
            loading={loading}
            filters={filters}
            onFilterChange={setFilters}
            onSelectProgram={handleSelectProgram}
            onDeleteProgram={handleDeleteProgram}
          />
        )}

        {activeTab === 'create' && (
          <CreateTrainingForm onSubmit={handleCreateProgram} />
        )}

        {activeTab === 'details' && selectedProgram && (
          <TrainingDetails
            program={selectedProgram}
            onUpdate={handleUpdateProgram}
            onClose={() => {
              setSelectedProgram(null);
              setActiveTab('programs');
            }}
            onProgramsChange={fetchPrograms}
          />
        )}
      </div>
    </div>
  );
};

export default TrainingManagement;
