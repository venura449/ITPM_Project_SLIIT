const pool = require('../../../config/database');

class Employee {
  /**
   * Create a new employee record
   * @param {Object} employeeData - Employee data
   * @returns {Promise<Object>} Created employee object with id
   */
  static async create(employeeData) {
    const connection = await pool.getConnection();
    try {
      const {
        user_id,
        employee_id,
        name,
        email,
        phone,
        address,
        department,
        position,
        status = 'Probation',
        joining_date,
        probation_end_date,
        salary,
        designation,
        manager_id,
        notes
      } = employeeData;

      const [result] = await connection.query(
        `INSERT INTO employees 
        (user_id, employee_id, name, email, phone, address, department, position, status, joining_date, probation_end_date, salary, designation, manager_id, notes) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user_id || null,
          employee_id,
          name,
          email,
          phone,
          address,
          department,
          position,
          status,
          joining_date,
          probation_end_date,
          salary,
          designation,
          manager_id,
          notes
        ]
      );

      return await this.findById(result.insertId);
    } finally {
      connection.release();
    }
  }

  /**
   * Find employee by ID
   * @param {number} id - Employee ID
   * @returns {Promise<Object|null>} Employee object or null if not found
   */
  static async findById(id) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT 
          e.*,
          mu.name as manager_name
        FROM employees e
        LEFT JOIN employees m ON e.manager_id = m.id
        LEFT JOIN users mu ON m.user_id = mu.id
        WHERE e.id = ?`,
        [id]
      );

      return rows.length > 0 ? rows[0] : null;
    } finally {
      connection.release();
    }
  }

  /**
   * Find employee by employee ID
   * @param {string} employeeId - Employee ID
   * @returns {Promise<Object|null>} Employee object or null if not found
   */
  static async findByEmployeeId(employeeId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT 
          e.*,
          mu.name as manager_name
        FROM employees e
        LEFT JOIN employees m ON e.manager_id = m.id
        LEFT JOIN users mu ON m.user_id = mu.id
        WHERE e.employee_id = ?`,
        [employeeId]
      );

      return rows.length > 0 ? rows[0] : null;
    } finally {
      connection.release();
    }
  }

  /**
   * Find employee by user ID
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} Employee object or null if not found
   */
  static async findByUserId(userId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT 
          e.*,
          mu.name as manager_name
        FROM employees e
        LEFT JOIN employees m ON e.manager_id = m.id
        LEFT JOIN users mu ON m.user_id = mu.id
        WHERE e.user_id = ?`,
        [userId]
      );

      return rows.length > 0 ? rows[0] : null;
    } finally {
      connection.release();
    }
  }

  /**
   * Get all employees with optional filters
   * @param {Object} filters - Filter options {department, status, search}
   * @returns {Promise<Array>} Array of employees
   */
  static async getAll(filters = {}) {
    const connection = await pool.getConnection();
    try {
      let query = `SELECT 
        e.*,
        mu.name as manager_name
      FROM employees e
      LEFT JOIN employees m ON e.manager_id = m.id
      LEFT JOIN users mu ON m.user_id = mu.id
      WHERE 1=1`;

      const params = [];

      if (filters.department) {
        query += ' AND e.department = ?';
        params.push(filters.department);
      }

      if (filters.status) {
        query += ' AND e.status = ?';
        params.push(filters.status);
      }

      if (filters.search) {
        query += ' AND (e.name LIKE ? OR e.employee_id LIKE ? OR e.email LIKE ?)';
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      query += ' ORDER BY e.created_at DESC';

      const [rows] = await connection.query(query, params);
      return rows;
    } finally {
      connection.release();
    }
  }

  /**
   * Update employee information
   * @param {number} id - Employee ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated employee object
   */
  static async update(id, updateData) {
    const connection = await pool.getConnection();
    try {
      const updates = [];
      const values = [];

      const allowedFields = [
        'name',
        'email',
        'phone',
        'address',
        'department',
        'position',
        'status',
        'probation_end_date',
        'resignation_date',
        'salary',
        'designation',
        'manager_id',
        'notes'
      ];

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
      const query = `UPDATE employees SET ${updates.join(', ')} WHERE id = ?`;
      await connection.query(query, values);

      return await this.findById(id);
    } finally {
      connection.release();
    }
  }

  /**
   * Update employee status (Probation, Permanent, Resigned)
   * @param {number} id - Employee ID
   * @param {string} status - New status
   * @param {Date} transitionDate - Date of transition
   * @returns {Promise<Object>} Updated employee object
   */
  static async updateStatus(id, status, transitionDate = null) {
    const connection = await pool.getConnection();
    try {
      const updateData = { status };

      if (status === 'Resigned' && transitionDate) {
        updateData.resignation_date = transitionDate;
      } else if (status === 'Permanent' && transitionDate) {
        // If moving from probation to permanent, set the end of probation
        const employee = await this.findById(id);
        if (employee && !employee.probation_end_date) {
          updateData.probation_end_date = transitionDate;
        }
      }

      return await this.update(id, updateData);
    } finally {
      connection.release();
    }
  }

  /**
   * Delete employee record
   * @param {number} id - Employee ID
   * @returns {Promise<boolean>} True if deletion was successful
   */
  static async delete(id) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query(
        'DELETE FROM employees WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  /**
   * Check if employee ID already exists
   * @param {string} employeeId - Employee ID
   * @returns {Promise<boolean>} True if exists
   */
  static async employeeIdExists(employeeId) {
    const employee = await this.findByEmployeeId(employeeId);
    return employee !== null;
  }

  /**
   * Get employees by department
   * @param {string} department - Department name
   * @returns {Promise<Array>} Array of employees in the department
   */
  static async getByDepartment(department) {
    return await this.getAll({ department });
  }

  /**
   * Get employees by status
   * @param {string} status - Employee status
   * @returns {Promise<Array>} Array of employees with the status
   */
  static async getByStatus(status) {
    return await this.getAll({ status });
  }
}

module.exports = Employee;
