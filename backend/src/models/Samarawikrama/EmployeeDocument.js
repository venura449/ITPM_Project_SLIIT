const pool = require('../../../config/database');

class EmployeeDocument {
  /**
   * Create a new employee document record
   * @param {Object} docData - Document data
   * @returns {Promise<Object>} Created document object
   */
  static async create(docData) {
    const connection = await pool.getConnection();
    try {
      const {
        employee_id,
        document_type,
        document_name,
        file_path,
        uploaded_by
      } = docData;

      const [result] = await connection.query(
        `INSERT INTO employee_documents 
        (employee_id, document_type, document_name, file_path, uploaded_by) 
        VALUES (?, ?, ?, ?, ?)`,
        [employee_id, document_type, document_name, file_path, uploaded_by]
      );

      return await this.findById(result.insertId);
    } finally {
      connection.release();
    }
  }

  /**
   * Find document by ID
   * @param {number} id - Document ID
   * @returns {Promise<Object|null>} Document object or null
   */
  static async findById(id) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT d.*, u.name as uploaded_by_name 
        FROM employee_documents d
        LEFT JOIN users u ON d.uploaded_by = u.id
        WHERE d.id = ?`,
        [id]
      );

      return rows.length > 0 ? rows[0] : null;
    } finally {
      connection.release();
    }
  }

  /**
   * Get all documents for an employee
   * @param {number} employeeId - Employee ID
   * @returns {Promise<Array>} Array of documents
   */
  static async getByEmployee(employeeId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT d.*, u.name as uploaded_by_name 
        FROM employee_documents d
        LEFT JOIN users u ON d.uploaded_by = u.id
        WHERE d.employee_id = ?
        ORDER BY d.uploaded_at DESC`,
        [employeeId]
      );

      return rows;
    } finally {
      connection.release();
    }
  }

  /**
   * Get documents by type for an employee
   * @param {number} employeeId - Employee ID
   * @param {string} documentType - Type of document
   * @returns {Promise<Array>} Array of matching documents
   */
  static async getByType(employeeId, documentType) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT d.*, u.name as uploaded_by_name 
        FROM employee_documents d
        LEFT JOIN users u ON d.uploaded_by = u.id
        WHERE d.employee_id = ? AND d.document_type = ?
        ORDER BY d.uploaded_at DESC`,
        [employeeId, documentType]
      );

      return rows;
    } finally {
      connection.release();
    }
  }

  /**
   * Delete document
   * @param {number} id - Document ID
   * @returns {Promise<boolean>} True if deletion successful
   */
  static async delete(id) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query(
        'DELETE FROM employee_documents WHERE id = ?',
        [id]
      );

      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  /**
   * Update document info
   * @param {number} id - Document ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated document
   */
  static async update(id, updateData) {
    const connection = await pool.getConnection();
    try {
      const updates = [];
      const values = [];

      const allowedFields = ['document_name'];

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
      const query = `UPDATE employee_documents SET ${updates.join(', ')} WHERE id = ?`;
      await connection.query(query, values);

      return await this.findById(id);
    } finally {
      connection.release();
    }
  }
}

module.exports = EmployeeDocument;
