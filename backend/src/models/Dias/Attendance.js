const pool = require('../../../config/database');

class Attendance {
    /**
     * Get all attendance records for a specific date
     * @param {Date} date - Attendance date
     * @returns {Promise<Array>} Array of attendance records with employee details
     */
    static async getByDate(date) {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.query(
                `SELECT a.*, e.name, e.employee_id, e.email, e.department, e.position
         FROM attendance a
         JOIN employees e ON a.employee_id = e.id
         WHERE DATE(a.attendance_date) = ?
         ORDER BY e.name ASC`,
                [date]
            );
            return rows;
        } finally {
            connection.release();
        }
    }

    /**
     * Get attendance history for an employee
     * @param {number} employeeId - Employee ID
     * @param {Date} startDate - Start date for range
     * @param {Date} endDate - End date for range
     * @returns {Promise<Array>} Array of attendance records
     */
    static async getByEmployeeAndDateRange(employeeId, startDate, endDate) {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.query(
                `SELECT * FROM attendance
         WHERE employee_id = ? AND attendance_date BETWEEN ? AND ?
         ORDER BY attendance_date DESC`,
                [employeeId, startDate, endDate]
            );
            return rows;
        } finally {
            connection.release();
        }
    }

    /**
     * Get attendance record for specific employee on specific date
     * @param {number} employeeId - Employee ID
     * @param {Date} date - Attendance date
     * @returns {Promise<Object|null>} Attendance record or null
     */
    static async getByEmployeeAndDate(employeeId, date) {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.query(
                `SELECT * FROM attendance
         WHERE employee_id = ? AND DATE(attendance_date) = ?`,
                [employeeId, date]
            );
            return rows.length > 0 ? rows[0] : null;
        } finally {
            connection.release();
        }
    }

    /**
     * Mark attendance for an employee
     * @param {number} employeeId - Employee ID
     * @param {Date} date - Attendance date
     * @param {string} status - Attendance status
     * @param {number} markedBy - User ID who marked attendance
     * @param {Object} additionalData - Check-in time, check-out time, notes
     * @returns {Promise<Object>} Created or updated attendance record
     */
    static async markAttendance(employeeId, date, status, markedBy, additionalData = {}) {
        const connection = await pool.getConnection();
        try {
            const existingRecord = await this.getByEmployeeAndDate(employeeId, date);

            if (existingRecord) {
                // Update existing record
                const updates = ['status = ?'];
                const values = [status];

                if (additionalData.check_in_time) {
                    updates.push('check_in_time = ?');
                    values.push(additionalData.check_in_time);
                }
                if (additionalData.check_out_time) {
                    updates.push('check_out_time = ?');
                    values.push(additionalData.check_out_time);
                }
                if (additionalData.notes !== undefined) {
                    updates.push('notes = ?');
                    values.push(additionalData.notes);
                }

                updates.push('marked_by = ?');
                values.push(markedBy);

                values.push(existingRecord.id);

                const query = `UPDATE attendance SET ${updates.join(', ')} WHERE id = ?`;
                await connection.query(query, values);
            } else {
                // Create new record
                const { check_in_time = null, check_out_time = null, notes = null } = additionalData;
                const [result] = await connection.query(
                    `INSERT INTO attendance 
           (employee_id, attendance_date, status, check_in_time, check_out_time, notes, marked_by)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [employeeId, date, status, check_in_time, check_out_time, notes, markedBy]
                );
                return { id: result.insertId, employee_id: employeeId, attendance_date: date, status, ...additionalData };
            }

            return await this.getByEmployeeAndDate(employeeId, date);
        } finally {
            connection.release();
        }
    }

    /**
     * Get monthly attendance report for employee
     * @param {number} employeeId - Employee ID
     * @param {number} month - Month (1-12)
     * @param {number} year - Year
     * @returns {Promise<Object>} Attendance statistics
     */
    static async getMonthlyReport(employeeId, month, year) {
        const connection = await pool.getConnection();
        try {
            const [records] = await connection.query(
                `SELECT status, COUNT(*) as count FROM attendance
         WHERE employee_id = ? 
         AND MONTH(attendance_date) = ? 
         AND YEAR(attendance_date) = ?
         GROUP BY status`,
                [employeeId, month, year]
            );

            const stats = {
                present: 0,
                absent: 0,
                leave: 0,
                half_day: 0,
                work_from_home: 0,
                total_days: 0
            };

            records.forEach(record => {
                const key = record.status.toLowerCase().replace(' ', '_');
                stats[key] = record.count;
                stats.total_days += record.count;
            });

            return stats;
        } finally {
            connection.release();
        }
    }

    /**
     * Get monthly attendance report for all employees
     * @param {number} month - Month (1-12)
     * @param {number} year - Year
     * @returns {Promise<Array>} Array of employee attendance reports
     */
    static async getMonthlyReportAll(month, year) {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.query(
                `SELECT e.id, e.employee_id, e.name, e.department,
                SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as present,
                SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) as absent,
                SUM(CASE WHEN a.status = 'Leave' THEN 1 ELSE 0 END) as leave,
                SUM(CASE WHEN a.status = 'Half Day' THEN 1 ELSE 0 END) as half_day,
                SUM(CASE WHEN a.status = 'Work From Home' THEN 1 ELSE 0 END) as work_from_home,
                COUNT(a.id) as total_days
         FROM employees e
         LEFT JOIN attendance a ON e.id = a.employee_id 
         AND MONTH(a.attendance_date) = ? 
         AND YEAR(a.attendance_date) = ?
         GROUP BY e.id
         ORDER BY e.name ASC`,
                [month, year]
            );
            return rows;
        } finally {
            connection.release();
        }
    }

    /**
     * Delete attendance record
     * @param {number} id - Attendance record ID
     * @returns {Promise<boolean>} True if successful
     */
    static async delete(id) {
        const connection = await pool.getConnection();
        try {
            const [result] = await connection.query(
                'DELETE FROM attendance WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } finally {
            connection.release();
        }
    }
}

module.exports = Attendance;
