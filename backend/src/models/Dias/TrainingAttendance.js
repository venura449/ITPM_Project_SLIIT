const pool = require('../../../config/database');

class TrainingAttendance {
  /**
   * Create a new attendance record
   * @param {Object} attendanceData - Attendance data
   * @returns {Promise<Object>} Created attendance object
   */
  static async create(attendanceData) {
    const connection = await pool.getConnection();
    try {
      const {
        session_id,
        employee_id,
        attendance_status,
        check_in_time,
        check_out_time,
        notes
      } = attendanceData;

      const [result] = await connection.query(
        `INSERT INTO training_attendance 
        (session_id, employee_id, attendance_status, check_in_time, check_out_time, notes) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          session_id,
          employee_id,
          attendance_status || 'Pending',
          check_in_time,
          check_out_time,
          notes
        ]
      );

      return await this.findById(result.insertId);
    } finally {
      connection.release();
    }
  }

  /**
   * Find attendance record by ID
   * @param {number} id - Attendance ID
   * @returns {Promise<Object|null>} Attendance object or null
   */
  static async findById(id) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT ta.*, emp.name as employee_name, emp.email as employee_email, 
                ts.title as session_title, tp.title as program_title
        FROM training_attendance ta
        LEFT JOIN employees emp ON ta.employee_id = emp.id
        LEFT JOIN training_sessions ts ON ta.session_id = ts.id
        LEFT JOIN training_programs tp ON ts.program_id = tp.id
        WHERE ta.id = ?`,
        [id]
      );

      return rows.length > 0 ? rows[0] : null;
    } finally {
      connection.release();
    }
  }

  /**
   * Get attendance records for a session
   * @param {number} sessionId - Session ID
   * @returns {Promise<Array>} Array of attendance records
   */
  static async getBySession(sessionId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT ta.*, emp.name as employee_name, emp.employee_id
        FROM training_attendance ta
        LEFT JOIN employees emp ON ta.employee_id = emp.id
        WHERE ta.session_id = ?
        ORDER BY ta.check_in_time DESC`,
        [sessionId]
      );

      return rows;
    } finally {
      connection.release();
    }
  }

  /**
   * Get attendance records for an employee
   * @param {number} employeeId - Employee ID
   * @returns {Promise<Array>} Array of attendance records
   */
  static async getByEmployee(employeeId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT ta.*, ts.title as session_title, ts.scheduled_date, 
                tp.title as program_title
        FROM training_attendance ta
        LEFT JOIN training_sessions ts ON ta.session_id = ts.id
        LEFT JOIN training_programs tp ON ts.program_id = tp.id
        WHERE ta.employee_id = ?
        ORDER BY ts.scheduled_date DESC`,
        [employeeId]
      );

      return rows;
    } finally {
      connection.release();
    }
  }

  /**
   * Get all attendance records with optional filters
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of attendance records
   */
  static async getAll(filters = {}) {
    const connection = await pool.getConnection();
    try {
      let query = `SELECT ta.*, emp.name as employee_name, ts.title as session_title,
                          tp.title as program_title
      FROM training_attendance ta
      LEFT JOIN employees emp ON ta.employee_id = emp.id
      LEFT JOIN training_sessions ts ON ta.session_id = ts.id
      LEFT JOIN training_programs tp ON ts.program_id = tp.id
      WHERE 1=1`;

      const params = [];

      if (filters.session_id) {
        query += ' AND ta.session_id = ?';
        params.push(filters.session_id);
      }

      if (filters.employee_id) {
        query += ' AND ta.employee_id = ?';
        params.push(filters.employee_id);
      }

      if (filters.attendance_status) {
        query += ' AND ta.attendance_status = ?';
        params.push(filters.attendance_status);
      }

      if (filters.date) {
        query += ' AND DATE(ta.check_in_time) = ?';
        params.push(filters.date);
      }

      query += ' ORDER BY ta.check_in_time DESC';

      const [rows] = await connection.query(query, params);
      return rows;
    } finally {
      connection.release();
    }
  }

  /**
   * Update attendance record
   * @param {number} id - Attendance ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated attendance
   */
  static async update(id, updateData) {
    const connection = await pool.getConnection();
    try {
      const updates = [];
      const values = [];

      const allowedFields = ['attendance_status', 'check_in_time', 'check_out_time', 'notes'];

      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          updates.push(`${field} = ?`);
          values.push(updateData[field]);
        }
      }

      if (updates.length === 0) {
        return await this.findById(id);
      }

      values.push(id);
      const query = `UPDATE training_attendance SET ${updates.join(', ')} WHERE id = ?`;
      await connection.query(query, values);

      return await this.findById(id);
    } finally {
      connection.release();
    }
  }

  /**
   * Delete attendance record
   * @param {number} id - Attendance ID
   * @returns {Promise<boolean>} True if deleted
   */
  static async delete(id) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query(
        'DELETE FROM training_attendance WHERE id = ?',
        [id]
      );

      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  /**
   * Get attendance statistics for a session
   * @param {number} sessionId - Session ID
   * @returns {Promise<Object>} Attendance statistics
   */
  static async getSessionStats(sessionId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT 
          attendance_status,
          COUNT(*) as count
        FROM training_attendance
        WHERE session_id = ?
        GROUP BY attendance_status`,
        [sessionId]
      );

      const stats = {
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        pending: 0
      };

      rows.forEach(row => {
        stats.total += row.count;
        if (row.attendance_status === 'Present') stats.present = row.count;
        if (row.attendance_status === 'Absent') stats.absent = row.count;
        if (row.attendance_status === 'Late') stats.late = row.count;
        if (row.attendance_status === 'Pending') stats.pending = row.count;
      });

      return stats;
    } finally {
      connection.release();
    }
  }
}

module.exports = TrainingAttendance;
