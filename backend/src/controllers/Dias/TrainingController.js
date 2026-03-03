const TrainingService = require('../../services/Dias/TrainingService');
const TrainingAssignment = require('../../models/Dias/TrainingAssignment');
const TrainingAttendance = require('../../models/Dias/TrainingAttendance');

class TrainingController {
  /**
   * Create a new training program
   * POST /api/training/programs
   */
  static async createProgram(req, res) {
    try {
      const programData = req.body;

      const result = await TrainingService.createProgram(programData);

      return res.status(201).json(result);
    } catch (err) {
      console.error('Create program error:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to create training program'
      });
    }
  }

  /**
   * Get all training programs
   * GET /api/training/programs?type=&status=&search=
   */
  static async getAllPrograms(req, res) {
    try {
      const { type, status, search } = req.query;

      const filters = {};
      if (type) filters.type = type;
      if (status) filters.status = status;
      if (search) filters.search = search;

      const result = await TrainingService.getAllPrograms(filters);

      return res.status(200).json(result);
    } catch (err) {
      console.error('Get programs error:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to retrieve programs'
      });
    }
  }

  /**
   * Get program details with sessions and assignments
   * GET /api/training/programs/:programId
   */
  static async getProgramDetails(req, res) {
    try {
      const { programId } = req.params;

      const result = await TrainingService.getProgramDetails(programId);

      return res.status(200).json(result);
    } catch (err) {
      console.error('Get program details error:', err);
      return res.status(404).json({
        success: false,
        message: err.message || 'Program details not found'
      });
    }
  }

  /**
   * Update training program
   * PUT /api/training/programs/:programId
   */
  static async updateProgram(req, res) {
    try {
      const { programId } = req.params;
      const updateData = req.body;

      const result = await TrainingService.updateProgram(programId, updateData);

      return res.status(200).json(result);
    } catch (err) {
      console.error('Update program error:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to update program'
      });
    }
  }

  /**
   * Delete training program
   * DELETE /api/training/programs/:programId
   */
  static async deleteProgram(req, res) {
    try {
      const { programId } = req.params;

      const result = await TrainingService.deleteProgram(programId);

      return res.status(200).json(result);
    } catch (err) {
      console.error('Delete program error:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to delete program'
      });
    }
  }

  /**
   * Create training session
   * POST /api/training/sessions
   */
  static async createSession(req, res) {
    try {
      const sessionData = req.body;

      const result = await TrainingService.createSession(sessionData);

      return res.status(201).json(result);
    } catch (err) {
      console.error('Create session error:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to create session'
      });
    }
  }

  /**
   * Get session details with attendance
   * GET /api/training/sessions/:sessionId
   */
  static async getSessionDetails(req, res) {
    try {
      const { sessionId } = req.params;

      const result = await TrainingService.getSessionDetails(sessionId);

      return res.status(200).json(result);
    } catch (err) {
      console.error('Get session details error:', err);
      return res.status(404).json({
        success: false,
        message: err.message || 'Session details not found'
      });
    }
  }

  /**
   * Assign employees to training program
   * POST /api/training/programs/:programId/assign
   */
  static async assignEmployees(req, res) {
    try {
      const { programId } = req.params;
      const { employeeIds } = req.body;
      const assignedBy = req.user?.id;

      if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'employeeIds array is required'
        });
      }

      const result = await TrainingService.assignEmployees(
        programId,
        employeeIds,
        assignedBy
      );

      return res.status(201).json(result);
    } catch (err) {
      console.error('Assign employees error:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to assign employees'
      });
    }
  }

  /**
   * Mark attendance for session
   * POST /api/training/sessions/:sessionId/attendance
   */
  static async markAttendance(req, res) {
    try {
      const { sessionId } = req.params;
      const { attendanceData } = req.body;

      if (!attendanceData || !Array.isArray(attendanceData) || attendanceData.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'attendanceData array is required'
        });
      }

      const result = await TrainingService.markAttendance(sessionId, attendanceData);

      return res.status(201).json(result);
    } catch (err) {
      console.error('Mark attendance error:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to mark attendance'
      });
    }
  }

  /**
   * Update attendance record
   * PUT /api/training/attendance/:attendanceId
   */
  static async updateAttendance(req, res) {
    try {
      const { attendanceId } = req.params;
      const updateData = req.body;

      const result = await TrainingAttendance.update(attendanceId, updateData);

      return res.status(200).json({
        success: true,
        data: result,
        message: 'Attendance updated successfully'
      });
    } catch (err) {
      console.error('Update attendance error:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to update attendance'
      });
    }
  }

  /**
   * Get employee training history
   * GET /api/training/employees/:employeeId/history
   */
  static async getEmployeeTrainingHistory(req, res) {
    try {
      const { employeeId } = req.params;

      const result = await TrainingService.getEmployeeTrainingHistory(employeeId);

      return res.status(200).json(result);
    } catch (err) {
      console.error('Get training history error:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to retrieve training history'
      });
    }
  }

  /**
   * Update assignment completion status
   * PATCH /api/training/assignments/:assignmentId/status
   */
  static async updateAssignmentStatus(req, res) {
    try {
      const { assignmentId } = req.params;
      const { completionStatus } = req.body;

      if (!completionStatus) {
        return res.status(400).json({
          success: false,
          message: 'completionStatus is required'
        });
      }

      const result = await TrainingService.updateAssignmentStatus(
        assignmentId,
        completionStatus
      );

      return res.status(200).json(result);
    } catch (err) {
      console.error('Update assignment status error:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to update assignment status'
      });
    }
  }

  /**
   * Get all assignments with filters
   * GET /api/training/assignments?program_id=&employee_id=&status=&completion_status=
   */
  static async getAllAssignments(req, res) {
    try {
      const { program_id, employee_id, status, completion_status } = req.query;

      const filters = {};
      if (program_id) filters.program_id = program_id;
      if (employee_id) filters.employee_id = employee_id;
      if (status) filters.status = status;
      if (completion_status) filters.completion_status = completion_status;

      const assignments = await TrainingAssignment.getAll(filters);

      return res.status(200).json({
        success: true,
        data: assignments,
        count: assignments.length,
        message: 'Assignments retrieved successfully'
      });
    } catch (err) {
      console.error('Get assignments error:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to retrieve assignments'
      });
    }
  }

  /**
   * Delete assignment
   * DELETE /api/training/assignments/:assignmentId
   */
  static async deleteAssignment(req, res) {
    try {
      const { assignmentId } = req.params;

      const deleted = await TrainingAssignment.delete(assignmentId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Assignment not found'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Assignment deleted successfully'
      });
    } catch (err) {
      console.error('Delete assignment error:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to delete assignment'
      });
    }
  }
}

module.exports = TrainingController;
