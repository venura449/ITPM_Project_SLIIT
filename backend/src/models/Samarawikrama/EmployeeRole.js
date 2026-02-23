const pool = require('../../../config/database');

class EmployeeRole {
  /**
   * Create a new role transition record
   * @param {Object} roleData - Role data
   * @returns {Promise<Object>} Created role object
   */
  static async create(roleData) {
    const connection = await pool.getConnection();
    try {
      const {
        employee_id,
        role,
        start_date,
        end_date,
        notes
      } = roleData;

      const [result] = await connection.query(
        `INSERT INTO employee_roles 
        (employee_id, role, start_date, end_date, notes) 
        VALUES (?, ?, ?, ?, ?)`,
        [employee_id, role, start_date, end_date, notes]
      );

      return await this.findById(result.insertId);
    } finally {
      connection.release();
    }
  }

  /**
   * Find role by ID
   * @param {number} id - Role ID
   * @returns {Promise<Object|null>} Role object or null
   */
  static async findById(id) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        'SELECT * FROM employee_roles WHERE id = ?',
        [id]
      );

      return rows.length > 0 ? rows[0] : null;
    } finally {
      connection.release();
    }
  }

  /**
   * Get all roles for an employee
   * @param {number} employeeId - Employee ID
   * @returns {Promise<Array>} Array of role transitions
   */
  static async getByEmployee(employeeId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT * FROM employee_roles 
        WHERE employee_id = ? 
        ORDER BY start_date DESC`,
        [employeeId]
      );

      return rows;
    } finally {
      connection.release();
    }
  }

  /**
   * Get current role for an employee
   * @param {number} employeeId - Employee ID
   * @returns {Promise<Object|null>} Current role object or null
   */
  static async getCurrentRole(employeeId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT * FROM employee_roles 
        WHERE employee_id = ? AND end_date IS NULL
        ORDER BY start_date DESC
        LIMIT 1`,
        [employeeId]
      );

      return rows.length > 0 ? rows[0] : null;
    } finally {
      connection.release();
    }
  }

  /**
   * Update role record
   * @param {number} id - Role ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated role object
   */
  static async update(id, updateData) {
    const connection = await pool.getConnection();
    try {
      const updates = [];
      const values = [];

      const allowedFields = ['role', 'start_date', 'end_date', 'notes'];

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
      const query = `UPDATE employee_roles SET ${updates.join(', ')} WHERE id = ?`;
      await connection.query(query, values);

      return await this.findById(id);
    } finally {
      connection.release();
    }
  }

  /**
   * End a current role (set end_date)
   * @param {number} id - Role ID
   * @param {Date} endDate - Date role ended
   * @returns {Promise<Object>} Updated role object
   */
  static async endRole(id, endDate) {
    return await this.update(id, { end_date: endDate });
  }

  /**
   * Delete a role record
   * @param {number} id - Role ID
   * @returns {Promise<boolean>} True if deletion successful
   */
  static async delete(id) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query(
        'DELETE FROM employee_roles WHERE id = ?',
        [id]
      );

      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }
}

module.exports = EmployeeRole;
