const Attendance = require('../../models/Dias/Attendance');
const Employee = require('../../models/Bandara/Employee');
const LeaveRequest = require('../../models/Dias/LeaveRequest');

class AttendanceController {
  /**
   * Get daily attendance sheet for a specific date
   * GET /api/attendance/sheet?date=YYYY-MM-DD
   */
  static async getAttendanceSheet(req, res) {
    try {
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({
          success: false,
          message: 'Date is required'
        });
      }

      // Get all employees
      const allEmployees = await Employee.getAll();

      // If no employees found, return empty array
      if (allEmployees.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'No employees found for this date',
          date,
          data: [],
          total_employees: 0
        });
      }

      // Build attendance map keyed by the string employee code ("EMP001").
      // Note: SELECT a.*, e.employee_id causes e.employee_id (string) to override
      // a.employee_id (numeric FK) in the result, so we must look up by the same string key.
      const attendanceRecords = await Attendance.getByDate(date);
      const attendanceMap = {};
      attendanceRecords.forEach(record => {
        attendanceMap[record.employee_id] = record;
      });

      // Merge employees with attendance data
      const mergedData = allEmployees.map(emp => {
        const attendance = attendanceMap[emp.employee_id];
        return {
          id: emp.id,
          employee_id: emp.employee_id,
          name: emp.name,
          email: emp.email,
          department: emp.department,
          position: emp.position,
          status: emp.status,
          attendance_id: attendance ? attendance.id : null,
          attendance_status: attendance ? attendance.status : 'Not Marked',
          check_in_time: attendance ? attendance.check_in_time : null,
          check_out_time: attendance ? attendance.check_out_time : null,
          notes: attendance ? attendance.notes : null
        };
      });

      res.status(200).json({
        success: true,
        message: 'Attendance sheet retrieved successfully',
        date,
        data: mergedData,
        total_employees: mergedData.length
      });
    } catch (error) {
      console.error('Get attendance sheet error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve attendance sheet',
        error: error.message
      });
    }
  }

  /**
   * Search employees and get their current attendance status
   * GET /api/attendance/search?query=employee_name_or_id
   */
  static async searchEmployees(req, res) {
    try {
      const { query, date } = req.query;

      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const searchTerm = `%${query}%`;
      const employees = await Employee.searchByNameOrId(searchTerm);

      let results = [];
      if (date) {
        results = await Promise.all(
          employees.map(async (emp) => {
            const attendance = await Attendance.getByEmployeeAndDate(emp.id, date);
            return {
              ...emp,
              attendance_status: attendance ? attendance.status : 'Not Marked'
            };
          })
        );
      } else {
        results = employees;
      }

      res.status(200).json({
        success: true,
        message: 'Employees found',
        data: results
      });
    } catch (error) {
      console.error('Search employees error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search employees',
        error: error.message
      });
    }
  }

  /**
   * Mark attendance for an employee
   * POST /api/attendance/mark
   */
  static async markAttendance(req, res) {
    try {
      let { employee_id, date, status, check_in_time, check_out_time, notes } = req.body;
      const userId = req.user.id;

      if (!employee_id || !date || !status) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID, date, and status are required'
        });
      }

      const validStatuses = ['Present', 'Absent', 'Leave', 'Half Day', 'Work From Home'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
      }

      // Convert employee_id string (EMP001) to database ID if needed
      let empId = employee_id;
      if (isNaN(employee_id)) {
        const employee = await Employee.findByEmployeeId(employee_id);
        if (!employee) {
          return res.status(404).json({
            success: false,
            message: `Employee with ID ${employee_id} not found`
          });
        }
        empId = employee.id;
      }

      const attendanceRecord = await Attendance.markAttendance(
        empId,
        date,
        status,
        userId,
        { check_in_time, check_out_time, notes }
      );

      res.status(201).json({
        success: true,
        message: 'Attendance marked successfully',
        data: attendanceRecord
      });
    } catch (error) {
      console.error('Mark attendance error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark attendance',
        error: error.message
      });
    }
  }

  /**
   * Get attendance history for an employee
   * GET /api/attendance/history/:employeeId?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
   */
  static async getAttendanceHistory(req, res) {
    try {
      let { employeeId } = req.params;
      const { startDate, endDate } = req.query;

      if (!employeeId) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID is required'
        });
      }

      // Convert employee_id string (EMP001) to database ID if needed
      let empId = employeeId;
      if (isNaN(employeeId)) {
        const employee = await Employee.findByEmployeeId(employeeId);
        if (!employee) {
          return res.status(404).json({
            success: false,
            message: `Employee with ID ${employeeId} not found`
          });
        }
        empId = employee.id;
      }

      const start = startDate || new Date(new Date().getFullYear(), 0, 1);
      const end = endDate || new Date();

      const attendanceRecords = await Attendance.getByEmployeeAndDateRange(
        empId,
        start,
        end
      );

      res.status(200).json({
        success: true,
        message: 'Attendance history retrieved successfully',
        employee_id: employeeId,
        period: { start, end },
        data: attendanceRecords,
        total_records: attendanceRecords.length
      });
    } catch (error) {
      console.error('Get attendance history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve attendance history',
        error: error.message
      });
    }
  }

  /**
   * Get monthly attendance report for an employee
   * GET /api/attendance/report/:employeeId?month=1&year=2024
   */
  static async getMonthlyReport(req, res) {
    try {
      let { employeeId } = req.params;
      const { month, year } = req.query;

      if (!employeeId) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID is required'
        });
      }

      // Convert employee_id string (EMP001) to database ID if needed
      let empId = employeeId;
      if (isNaN(employeeId)) {
        const employee = await Employee.findByEmployeeId(employeeId);
        if (!employee) {
          return res.status(404).json({
            success: false,
            message: `Employee with ID ${employeeId} not found`
          });
        }
        empId = employee.id;
      }

      const currentDate = new Date();
      const reportMonth = parseInt(month) || currentDate.getMonth() + 1;
      const reportYear = parseInt(year) || currentDate.getFullYear();

      if (reportMonth < 1 || reportMonth > 12) {
        return res.status(400).json({
          success: false,
          message: 'Invalid month. Must be between 1 and 12'
        });
      }

      const report = await Attendance.getMonthlyReport(empId, reportMonth, reportYear);

      res.status(200).json({
        success: true,
        message: 'Monthly report retrieved successfully',
        employee_id: employeeId,
        period: { month: reportMonth, year: reportYear },
        data: report
      });
    } catch (error) {
      console.error('Get monthly report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve monthly report',
        error: error.message
      });
    }
  }

  /**
   * Get monthly attendance report for all employees
   * GET /api/attendance/report-all?month=1&year=2024
   */
  static async getMonthlyReportAll(req, res) {
    try {
      const { month, year } = req.query;

      const currentDate = new Date();
      const reportMonth = parseInt(month) || currentDate.getMonth() + 1;
      const reportYear = parseInt(year) || currentDate.getFullYear();

      if (reportMonth < 1 || reportMonth > 12) {
        return res.status(400).json({
          success: false,
          message: 'Invalid month. Must be between 1 and 12'
        });
      }

      const reports = await Attendance.getMonthlyReportAll(reportMonth, reportYear);

      res.status(200).json({
        success: true,
        message: 'Monthly reports retrieved successfully',
        period: { month: reportMonth, year: reportYear },
        data: reports,
        total_employees: reports.length
      });
    } catch (error) {
      console.error('Get monthly reports error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve monthly reports',
        error: error.message
      });
    }
  }

  /**
   * Delete an attendance record
   * DELETE /api/attendance/:id
   */
  static async deleteAttendance(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Attendance ID is required'
        });
      }

      const success = await Attendance.delete(id);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Attendance record not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Attendance record deleted successfully'
      });
    } catch (error) {
      console.error('Delete attendance error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete attendance record',
        error: error.message
      });
    }
  }
}

module.exports = AttendanceController;
