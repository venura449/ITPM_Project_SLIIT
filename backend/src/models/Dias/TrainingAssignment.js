const pool = require('../../../config/database');

class TrainingAssignment {
  /**
   * Create a new training assignment
   * @param {Object} assignmentData - Assignment data
   * @returns {Promise<Object>} Created assignment object
   */
  static async create(assignmentData) {
    const connection = await pool.getConnection();
    try {
      const {
        program_id,
        employee_id,
        assigned_by,
        assignment_date,
        status,
        completion_status,
        notes
      } = assignmentData;

      const [result] = await connection.query(
        `INSERT INTO training_assignments 
        (program_id, employee_id, assigned_by, assignment_date, status, completion_status, notes) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          program_id,
          employee_id,
          assigned_by,
          assignment_date,
          status || 'Assigned',
          completion_status || 'Pending',
          notes
        ]
      );

      return await this.findById(result.insertId);
    } finally {
      connection.release();
    }
  }

  /**
   * Find assignment by ID
   * @param {number} id - Assignment ID
   * @returns {Promise<Object|null>} Assignment object or null
   */
  static async findById(id) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT ta.*, emp.name as employee_name, emp.email as employee_email, 
                tp.title as program_title, assigner.name as assigned_by_name
        FROM training_assignments ta
        LEFT JOIN employees emp ON ta.employee_id = emp.id
        LEFT JOIN training_programs tp ON ta.program_id = tp.id
        LEFT JOIN employees assigner ON ta.assigned_by = assigner.id
        WHERE ta.id = ?`,
        [id]
      );

      return rows.length > 0 ? rows[0] : null;
    } finally {
      connection.release();
    }
  }

  /**
   * Get assignments for a program
   * @param {number} programId - Program ID
   * @returns {Promise<Array>} Array of assignments
   */
  static async getByProgram(programId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT ta.*, emp.name as employee_name, emp.email as employee_email, ta.completion_status
        FROM training_assignments ta
        LEFT JOIN employees emp ON ta.employee_id = emp.id
        WHERE ta.program_id = ?
        ORDER BY ta.assignment_date DESC`,
        [programId]
      );

      return rows;
    } finally {
      connection.release();
    }
  }

  /**
   * Get assignments for an employee
   * @param {number} employeeId - Employee ID
   * @returns {Promise<Array>} Array of assignments
   */
  static async getByEmployee(employeeId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT ta.*, tp.title as program_title, tp.type, tp.start_date
        FROM training_assignments ta
        LEFT JOIN training_programs tp ON ta.program_id = tp.id
        WHERE ta.employee_id = ?
        ORDER BY tp.start_date DESC`,
        [employeeId]
      );

      return rows;
    } finally {
      connection.release();
    }
  }

  /**
   * Get all assignments with optional filters
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of assignments
   */
  static async getAll(filters = {}) {
    const connection = await pool.getConnection();
    try {
      let query = `SELECT ta.*, emp.name as employee_name, tp.title as program_title
      FROM training_assignments ta
      LEFT JOIN employees emp ON ta.employee_id = emp.id
      LEFT JOIN training_programs tp ON ta.program_id = tp.id
      WHERE 1=1`;

      const params = [];

      if (filters.program_id) {
        query += ' AND ta.program_id = ?';
        params.push(filters.program_id);
      }

      if (filters.employee_id) {
        query += ' AND ta.employee_id = ?';
        params.push(filters.employee_id);
      }

      if (filters.status) {
        query += ' AND ta.status = ?';
        params.push(filters.status);
      }

      if (filters.completion_status) {
        query += ' AND ta.completion_status = ?';
        params.push(filters.completion_status);
      }

      query += ' ORDER BY ta.assignment_date DESC';

      const [rows] = await connection.query(query, params);
      return rows;
    } finally {
      connection.release();
    }
  }

  /**
   * Update assignment
   * @param {number} id - Assignment ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated assignment
   */
  static async update(id, updateData) {
    const connection = await pool.getConnection();
    try {
      const updates = [];
      const values = [];

      const allowedFields = ['status', 'completion_status', 'notes'];

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
      const query = `UPDATE training_assignments SET ${updates.join(', ')} WHERE id = ?`;
      await connection.query(query, values);

      return await this.findById(id);
    } finally {
      connection.release();
    }
  }

  /**
   * Delete assignment
   * @param {number} id - Assignment ID
   * @returns {Promise<boolean>} True if deleted
   */
  static async delete(id) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query(
        'DELETE FROM training_assignments WHERE id = ?',
        [id]
      );

      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  /**
   * Check if employee is assigned to program
   * @param {number} employeeId - Employee ID
   * @param {number} programId - Program ID
   * @returns {Promise<boolean>} True if assigned
   */
  static async isAssigned(employeeId, programId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        'SELECT id FROM training_assignments WHERE employee_id = ? AND program_id = ?',
        [employeeId, programId]
      );

      return rows.length > 0;
    } finally {
      connection.release();
    }
  }
}

module.exports = TrainingAssignment;
