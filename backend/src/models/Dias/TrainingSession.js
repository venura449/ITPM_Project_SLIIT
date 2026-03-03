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

class TrainingSession {
  /**
   * Create a new training session
   * @param {Object} sessionData - Session data
   * @returns {Promise<Object>} Created session object
   */
  static async create(sessionData) {
    const connection = await pool.getConnection();
    try {
      const {
        program_id,
        session_number,
        title,
        description,
        scheduled_date,
        start_time,
        end_time,
        location,
        facilitator_id,
        max_capacity,
        status
      } = sessionData;

      const [result] = await connection.query(
        `INSERT INTO training_sessions 
        (program_id, session_number, title, description, scheduled_date, start_time, end_time, location, facilitator_id, max_capacity, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          program_id,
          session_number,
          title,
          description,
          formatDateForSQL(scheduled_date),
          start_time,
          end_time,
          location,
          facilitator_id,
          max_capacity,
          status || 'Scheduled'
        ]
      );

      return await this.findById(result.insertId);
    } finally {
      connection.release();
    }
  }

  /**
   * Find session by ID
   * @param {number} id - Session ID
   * @returns {Promise<Object|null>} Session object or null
   */
  static async findById(id) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT ts.*, e.name as facilitator_name, tp.title as program_title
        FROM training_sessions ts
        LEFT JOIN employees e ON ts.facilitator_id = e.id
        LEFT JOIN training_programs tp ON ts.program_id = tp.id
        WHERE ts.id = ?`,
        [id]
      );

      return rows.length > 0 ? rows[0] : null;
    } finally {
      connection.release();
    }
  }

  /**
   * Get all sessions for a program
   * @param {number} programId - Program ID
   * @returns {Promise<Array>} Array of sessions
   */
  static async getByProgram(programId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT ts.*, e.name as facilitator_name
        FROM training_sessions ts
        LEFT JOIN employees e ON ts.facilitator_id = e.id
        WHERE ts.program_id = ?
        ORDER BY ts.scheduled_date ASC, ts.start_time ASC`,
        [programId]
      );

      return rows;
    } finally {
      connection.release();
    }
  }

  /**
   * Get all sessions with optional filters
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of sessions
   */
  static async getAll(filters = {}) {
    const connection = await pool.getConnection();
    try {
      let query = `SELECT ts.*, e.name as facilitator_name, tp.title as program_title
      FROM training_sessions ts
      LEFT JOIN employees e ON ts.facilitator_id = e.id
      LEFT JOIN training_programs tp ON ts.program_id = tp.id
      WHERE 1=1`;

      const params = [];

      if (filters.program_id) {
        query += ' AND ts.program_id = ?';
        params.push(filters.program_id);
      }

      if (filters.status) {
        query += ' AND ts.status = ?';
        params.push(filters.status);
      }

      if (filters.scheduled_date) {
        query += ' AND DATE(ts.scheduled_date) = ?';
        params.push(filters.scheduled_date);
      }

      query += ' ORDER BY ts.scheduled_date DESC, ts.start_time DESC';

      const [rows] = await connection.query(query, params);
      return rows;
    } finally {
      connection.release();
    }
  }

  /**
   * Update training session
   * @param {number} id - Session ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated session
   */
  static async update(id, updateData) {
    const connection = await pool.getConnection();
    try {
      const updates = [];
      const values = [];

      const allowedFields = [
        'title',
        'description',
        'scheduled_date',
        'start_time',
        'end_time',
        'location',
        'facilitator_id',
        'max_capacity',
        'status'
      ];

      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          updates.push(`${field} = ?`);
          
          // Format date for date fields
          if (field === 'scheduled_date' && updateData[field]) {
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
      const query = `UPDATE training_sessions SET ${updates.join(', ')} WHERE id = ?`;
      await connection.query(query, values);

      return await this.findById(id);
    } finally {
      connection.release();
    }
  }

  /**
   * Delete training session
   * @param {number} id - Session ID
   * @returns {Promise<boolean>} True if deleted
   */
  static async delete(id) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query(
        'DELETE FROM training_sessions WHERE id = ?',
        [id]
      );

      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  /**
   * Get sessions by status
   * @param {string} status - Session status
   * @returns {Promise<Array>} Array of sessions
   */
  static async getByStatus(status) {
    return await this.getAll({ status });
  }
}

module.exports = TrainingSession;
