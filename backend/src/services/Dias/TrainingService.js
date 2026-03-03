const TrainingProgram = require('../../models/Dias/TrainingProgram');
const TrainingSession = require('../../models/Dias/TrainingSession');
const TrainingAssignment = require('../../models/Dias/TrainingAssignment');
const TrainingAttendance = require('../../models/Dias/TrainingAttendance');

class TrainingService {
  /**
   * Create a new training program
   * @param {Object} programData - Program data
   * @returns {Promise<Object>} Created program
   */
  static async createProgram(programData) {
    try {
      const program = await TrainingProgram.create(programData);

      return {
        success: true,
        data: program,
        message: 'Training program created successfully'
      };
    } catch (err) {
      throw {
        success: false,
        message: 'Failed to create training program: ' + err.message
      };
    }
  }

  /**
   * Get program with all related sessions and assignments
   * @param {number} programId - Program ID
   * @returns {Promise<Object>} Program with sessions and assignments
   */
  static async getProgramDetails(programId) {
    try {
      const program = await TrainingProgram.findById(programId);

      if (!program) {
        throw new Error('Training program not found');
      }

      const sessions = await TrainingSession.getByProgram(programId);
      const assignments = await TrainingAssignment.getByProgram(programId);

      return {
        success: true,
        data: {
          ...program,
          sessions,
          assignments,
          assignment_count: assignments.length
        },
        message: 'Program details retrieved'
      };
    } catch (err) {
      throw {
        success: false,
        message: err.message
      };
    }
  }

  /**
   * Get all programs with filters
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Array of programs
   */
  static async getAllPrograms(filters = {}) {
    try {
      const programs = await TrainingProgram.getAll(filters);

      return {
        success: true,
        data: programs,
        count: programs.length,
        message: 'Training programs retrieved'
      };
    } catch (err) {
      throw {
        success: false,
        message: 'Failed to retrieve programs: ' + err.message
      };
    }
  }

  /**
   * Update training program
   * @param {number} programId - Program ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated program
   */
  static async updateProgram(programId, updateData) {
    try {
      const program = await TrainingProgram.update(programId, updateData);

      return {
        success: true,
        data: program,
        message: 'Training program updated successfully'
      };
    } catch (err) {
      throw {
        success: false,
        message: 'Failed to update program: ' + err.message
      };
    }
  }

  /**
   * Create a training session
   * @param {Object} sessionData - Session data
   * @returns {Promise<Object>} Created session
   */
  static async createSession(sessionData) {
    try {
      const session = await TrainingSession.create(sessionData);

      return {
        success: true,
        data: session,
        message: 'Training session created successfully'
      };
    } catch (err) {
      throw {
        success: false,
        message: 'Failed to create session: ' + err.message
      };
    }
  }

  /**
   * Get session with attendance details
   * @param {number} sessionId - Session ID
   * @returns {Promise<Object>} Session with attendance
   */
  static async getSessionDetails(sessionId) {
    try {
      const session = await TrainingSession.findById(sessionId);

      if (!session) {
        throw new Error('Training session not found');
      }

      const attendance = await TrainingAttendance.getBySession(sessionId);
      const stats = await TrainingAttendance.getSessionStats(sessionId);

      return {
        success: true,
        data: {
          ...session,
          attendance,
          stats
        },
        message: 'Session details retrieved'
      };
    } catch (err) {
      throw {
        success: false,
        message: err.message
      };
    }
  }

  /**
   * Assign employees to a program
   * @param {number} programId - Program ID
   * @param {Array} employeeIds - Array of employee IDs
   * @param {number} assignedBy - User ID assigning the training
   * @returns {Promise<Object>} Assignment result
   */
  static async assignEmployees(programId, employeeIds, assignedBy) {
    try {
      const assignments = [];
      const program = await TrainingProgram.findById(programId);

      if (!program) {
        throw new Error('Training program not found');
      }

      for (const employeeId of employeeIds) {
        const isAssigned = await TrainingAssignment.isAssigned(employeeId, programId);

        if (!isAssigned) {
          const assignment = await TrainingAssignment.create({
            program_id: programId,
            employee_id: employeeId,
            assigned_by: assignedBy,
            assignment_date: new Date(),
            status: 'Assigned'
          });

          assignments.push(assignment);
        }
      }

      return {
        success: true,
        data: assignments,
        count: assignments.length,
        message: `${assignments.length} employees assigned to program`
      };
    } catch (err) {
      throw {
        success: false,
        message: 'Failed to assign employees: ' + err.message
      };
    }
  }

  /**
   * Mark attendance for a session
   * @param {number} sessionId - Session ID
   * @param {Array} attendanceData - Attendance records
   * @returns {Promise<Object>} Attendance result
   */
  static async markAttendance(sessionId, attendanceData) {
    try {
      const session = await TrainingSession.findById(sessionId);

      if (!session) {
        throw new Error('Training session not found');
      }

      const attendanceRecords = [];

      for (const record of attendanceData) {
        const attendance = await TrainingAttendance.create({
          session_id: sessionId,
          employee_id: record.employee_id,
          attendance_status: record.attendance_status || 'Present',
          check_in_time: record.check_in_time,
          check_out_time: record.check_out_time,
          notes: record.notes
        });

        attendanceRecords.push(attendance);
      }

      return {
        success: true,
        data: attendanceRecords,
        count: attendanceRecords.length,
        message: 'Attendance marked successfully'
      };
    } catch (err) {
      throw {
        success: false,
        message: 'Failed to mark attendance: ' + err.message
      };
    }
  }

  /**
   * Get employee training history
   * @param {number} employeeId - Employee ID
   * @returns {Promise<Object>} Employee training records
   */
  static async getEmployeeTrainingHistory(employeeId) {
    try {
      const assignments = await TrainingAssignment.getByEmployee(employeeId);
      const attendance = await TrainingAttendance.getByEmployee(employeeId);

      return {
        success: true,
        data: {
          assignments,
          attendance,
          total_programs: assignments.length,
          total_sessions_attended: attendance.filter(a => a.attendance_status === 'Present').length
        },
        message: 'Employee training history retrieved'
      };
    } catch (err) {
      throw {
        success: false,
        message: 'Failed to retrieve training history: ' + err.message
      };
    }
  }

  /**
   * Update assignment completion status
   * @param {number} assignmentId - Assignment ID
   * @param {string} completionStatus - Completion status
   * @returns {Promise<Object>} Updated assignment
   */
  static async updateAssignmentStatus(assignmentId, completionStatus) {
    try {
      const assignment = await TrainingAssignment.update(assignmentId, {
        completion_status: completionStatus
      });

      return {
        success: true,
        data: assignment,
        message: 'Assignment status updated'
      };
    } catch (err) {
      throw {
        success: false,
        message: 'Failed to update assignment: ' + err.message
      };
    }
  }

  /**
   * Delete training program
   * @param {number} programId - Program ID
   * @returns {Promise<Object>} Deletion result
   */
  static async deleteProgram(programId) {
    try {
      const deleted = await TrainingProgram.delete(programId);

      if (!deleted) {
        throw new Error('Training program not found');
      }

      return {
        success: true,
        message: 'Training program deleted successfully'
      };
    } catch (err) {
      throw {
        success: false,
        message: 'Failed to delete program: ' + err.message
      };
    }
  }
}

module.exports = TrainingService;
