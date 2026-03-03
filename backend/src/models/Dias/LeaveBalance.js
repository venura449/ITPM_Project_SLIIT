const pool = require('../../../config/database');

class LeaveBalance {
    /**
     * Initialize leave balance for a new employee
     * @param {number} employeeId - Employee ID
     * @param {number} year - Fiscal year
     * @returns {Promise<Array>} Array of initialized leave balances
     */
    static async initializeForEmployee(employeeId, year) {
        const connection = await pool.getConnection();
        try {
            let defaults = { Annual: 20, Sick: 8, Casual: 5, Maternity: 90, Paternity: 5, Unpaid: 365 };
            try {
                const SystemSettings = require('../settings/SystemSettings');
                defaults = await SystemSettings.getLeaveDefaults();
            } catch (_) { /* use hardcoded defaults if settings table unavailable */ }

            const leaveTypes = [
                { type: 'Annual', days: defaults.Annual },
                { type: 'Sick', days: defaults.Sick },
                { type: 'Casual', days: defaults.Casual },
                { type: 'Maternity', days: defaults.Maternity },
                { type: 'Paternity', days: defaults.Paternity },
                { type: 'Unpaid', days: defaults.Unpaid },
            ];

            const results = [];
            for (const leave of leaveTypes) {
                await connection.query(
                    `INSERT IGNORE INTO leave_balance
                     (employee_id, leave_type, total_days, used_days, balance_days, fiscal_year)
                     VALUES (?, ?, ?, 0, ?, ?)`,
                    [employeeId, leave.type, leave.days, leave.days, year]
                );
                results.push({ leave_type: leave.type, total_days: leave.days });
            }
            return results;
        } finally {
            connection.release();
        }
    }

    /**
     * Get leave balance for an employee
     * @param {number} employeeId - Employee ID
     * @param {number} year - Fiscal year
     * @returns {Promise<Array>} Array of leave balances
     */
    static async getByEmployee(employeeId, year) {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.query(
                `SELECT * FROM leave_balance
         WHERE employee_id = ? AND fiscal_year = ?
         ORDER BY leave_type ASC`,
                [employeeId, year]
            );
            return rows;
        } finally {
            connection.release();
        }
    }

    /**
     * Get specific leave balance
     * @param {number} employeeId - Employee ID
     * @param {string} leaveType - Leave type
     * @param {number} year - Fiscal year
     * @returns {Promise<Object|null>} Leave balance or null
     */
    static async getBalance(employeeId, leaveType, year) {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.query(
                `SELECT * FROM leave_balance
         WHERE employee_id = ? AND leave_type = ? AND fiscal_year = ?`,
                [employeeId, leaveType, year]
            );
            return rows.length > 0 ? rows[0] : null;
        } finally {
            connection.release();
        }
    }

    /**
     * Update used and balance days when leave is approved
     * @param {number} employeeId - Employee ID
     * @param {string} leaveType - Leave type
     * @param {number} daysUsed - Number of days used
     * @param {number} year - Fiscal year
     * @returns {Promise<Object>} Updated leave balance
     */
    static async updateUsedDays(employeeId, leaveType, daysUsed, year) {
        const connection = await pool.getConnection();
        try {
            let balance = await this.getBalance(employeeId, leaveType, year);

            if (!balance) {
                // Auto-initialize leave balances if missing (e.g. employee existed before new leave system)
                await this.initializeForEmployee(employeeId, year);
                balance = await this.getBalance(employeeId, leaveType, year);
                // If still missing (unsupported custom type), create a default entry
                if (!balance) {
                    await connection.query(
                        `INSERT IGNORE INTO leave_balance
                         (employee_id, leave_type, total_days, used_days, balance_days, fiscal_year)
                         VALUES (?, ?, 365, 0, 365, ?)`,
                        [employeeId, leaveType, year]
                    );
                    balance = await this.getBalance(employeeId, leaveType, year);
                }
            }

            const newUsedDays = parseFloat(balance.used_days) + parseFloat(daysUsed);
            const newBalanceDays = parseFloat(balance.total_days) - newUsedDays;

            await connection.query(
                `UPDATE leave_balance
                 SET used_days = ?, balance_days = ?
                 WHERE employee_id = ? AND leave_type = ? AND fiscal_year = ?`,
                [newUsedDays, newBalanceDays, employeeId, leaveType, year]
            );

            return await this.getBalance(employeeId, leaveType, year);
        } finally {
            connection.release();
        }
    }

    /**
     * Revert used days when leave is rejected/cancelled
     * @param {number} employeeId - Employee ID
     * @param {string} leaveType - Leave type
     * @param {number} daysUsed - Number of days to revert
     * @param {number} year - Fiscal year
     * @returns {Promise<Object>} Updated leave balance
     */
    static async revertUsedDays(employeeId, leaveType, daysUsed, year) {
        const connection = await pool.getConnection();
        try {
            let balance = await this.getBalance(employeeId, leaveType, year);

            if (!balance) {
                await this.initializeForEmployee(employeeId, year);
                balance = await this.getBalance(employeeId, leaveType, year);
                if (!balance) return null; // Nothing to revert if no record
            }

            const newUsedDays = Math.max(0, parseFloat(balance.used_days) - parseFloat(daysUsed));
            const newBalanceDays = parseFloat(balance.total_days) - newUsedDays;

            await connection.query(
                `UPDATE leave_balance
                 SET used_days = ?, balance_days = ?
                 WHERE employee_id = ? AND leave_type = ? AND fiscal_year = ?`,
                [newUsedDays, newBalanceDays, employeeId, leaveType, year]
            );

            return await this.getBalance(employeeId, leaveType, year);
        } finally {
            connection.release();
        }
    }

    /**
     * Add carry forward days to next year
     * @param {number} employeeId - Employee ID
     * @param {string} leaveType - Leave type
     * @param {number} carryForwardDays - Days to carry forward
     * @param {number} nextYear - Next fiscal year
     * @returns {Promise<Object>} Updated leave balance for next year
     */
    static async carryForward(employeeId, leaveType, carryForwardDays, nextYear) {
        const connection = await pool.getConnection();
        try {
            // Check if balance exists for next year, if not initialize
            let nextYearBalance = await this.getBalance(employeeId, leaveType, nextYear);

            if (!nextYearBalance) {
                await this.initializeForEmployee(employeeId, nextYear);
                nextYearBalance = await this.getBalance(employeeId, leaveType, nextYear);
            }

            const newTotalDays = nextYearBalance.total_days + carryForwardDays;
            const newBalanceDays = nextYearBalance.balance_days + carryForwardDays;

            const [result] = await connection.query(
                `UPDATE leave_balance
         SET total_days = ?, balance_days = ?, carry_forward_days = ?
         WHERE employee_id = ? AND leave_type = ? AND fiscal_year = ?`,
                [newTotalDays, newBalanceDays, carryForwardDays, employeeId, leaveType, nextYear]
            );

            return await this.getBalance(employeeId, leaveType, nextYear);
        } finally {
            connection.release();
        }
    }

    /**
     * Get all employees' leave balances for a specific year
     * @param {number} year - Fiscal year
     * @returns {Promise<Array>} Array of leave balances grouped by employee
     */
    static async getAllByYear(year) {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.query(
                `SELECT lb.*, e.name, e.employee_id, e.department
         FROM leave_balance lb
         JOIN employees e ON lb.employee_id = e.id
         WHERE lb.fiscal_year = ?
         ORDER BY e.name ASC, lb.leave_type ASC`,
                [year]
            );
            return rows;
        } finally {
            connection.release();
        }
    }
}

module.exports = LeaveBalance;
