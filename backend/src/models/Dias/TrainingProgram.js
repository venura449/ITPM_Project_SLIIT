const pool = require('../../../config/database');

/**
 * Format date from ISO string to MySQL DATE format (YYYY-MM-DD)
 * @param {string|Date} dateValue - Date value to format
 * @returns {string|null} Formatted date or null
 */
function formatDateForSQL(dateValue) {
  if (!dateValue) return null;
  
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return null;
    
    return date.toISOString().split('T')[0];
  } catch (e) {
    return null;
  }
}

class TrainingProgram {
  /**
   * Create a new training program
   * @param {Object} programData - Program data
   * @returns {Promise<Object>} Created program object
   */
  static async create(programData) {
    const connection = await pool.getConnection();
    try {
      const {
        title,
        type,
        description,
        duration_hours,
        budget,
        trainer_id,
        status,
        start_date,
        end_date,
        location,
        max_participants
      } = programData;

      const [result] = await connection.query(
        `INSERT INTO training_programs 
        (title, type, description, duration_hours, budget, trainer_id, status, start_date, end_date, location, max_participants) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          title,
          type,
          description,
          duration_hours,
          budget,
          trainer_id,
          status || 'Planned',
          formatDateForSQL(start_date),
          formatDateForSQL(end_date),
          location,
          max_participants
        ]
      );

      return await this.findById(result.insertId);
    } finally {
      connection.release();
    }
  }

  /**
   * Find program by ID
   * @param {number} id - Program ID
   * @returns {Promise<Object|null>} Program object or null
   */
  static async findById(id) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT tp.*, e.name as trainer_name 
        FROM training_programs tp
        LEFT JOIN employees e ON tp.trainer_id = e.id
        WHERE tp.id = ?`,
        [id]
      );

      return rows.length > 0 ? rows[0] : null;
    } finally {
      connection.release();
    }
  }

  /**
   * Get all training programs with optional filters
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of programs
   */
  static async getAll(filters = {}) {
    const connection = await pool.getConnection();
    try {
      let query = `SELECT tp.*, e.name as trainer_name 
      FROM training_programs tp
      LEFT JOIN employees e ON tp.trainer_id = e.id
      WHERE 1=1`;

      const params = [];

      if (filters.type) {
        query += ' AND tp.type = ?';
        params.push(filters.type);
      }

      if (filters.status) {
        query += ' AND tp.status = ?';
        params.push(filters.status);
      }

      if (filters.search) {
        query += ' AND tp.title LIKE ?';
        params.push(`%${filters.search}%`);
      }

      query += ' ORDER BY tp.start_date DESC';

      const [rows] = await connection.query(query, params);
      return rows;
    } finally {
      connection.release();
    }
  }

  /**
   * Update training program
   * @param {number} id - Program ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated program
   */
  static async update(id, updateData) {
    const connection = await pool.getConnection();
    try {
      const updates = [];
      const values = [];

      const allowedFields = [
        'title',
        'type',
        'description',
        'duration_hours',
        'budget',
        'trainer_id',
        'status',
        'start_date',
        'end_date',
        'location',
        'max_participants'
      ];

      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          updates.push(`${field} = ?`);
          
          // Format dates for date fields
          if ((field === 'start_date' || field === 'end_date') && updateData[field]) {
            values.push(formatDateForSQL(updateData[field]));
          } else {
            values.push(updateData[field]);
          }
        }
      }

      if (updates.length === 0) {
        return await this.findById(id);
      }

      values.push(id);
      const query = `UPDATE training_programs SET ${updates.join(', ')} WHERE id = ?`;
      await connection.query(query, values);

      return await this.findById(id);
    } finally {
      connection.release();
    }
  }

  /**
   * Delete training program
   * @param {number} id - Program ID
   * @returns {Promise<boolean>} True if deleted
   */
  static async delete(id) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query(
        'DELETE FROM training_programs WHERE id = ?',
        [id]
      );

      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  /**
   * Get programs by type
   * @param {string} type - Program type (Internal/External)
   * @returns {Promise<Array>} Array of programs
   */
  static async getByType(type) {
    return await this.getAll({ type });
  }

  /**
   * Get programs by status
   * @param {string} status - Program status
   * @returns {Promise<Array>} Array of programs
   */
  static async getByStatus(status) {
    return await this.getAll({ status });
  }
}

module.exports = TrainingProgram;
