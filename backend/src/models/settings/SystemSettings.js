const pool = require('../../../config/database');

class SystemSettings {
    static async ensureTable() {
        const connection = await pool.getConnection();
        try {
            await connection.query(`
                CREATE TABLE IF NOT EXISTS system_settings (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    setting_key VARCHAR(100) NOT NULL UNIQUE,
                    setting_value VARCHAR(500) NOT NULL,
                    category VARCHAR(50) DEFAULT 'general',
                    description VARCHAR(255),
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            `);

            const defaults = [
                ['leave_annual_days',      '20',  'leave',      'Annual leave days per year'],
                ['leave_sick_days',        '8',   'leave',      'Sick leave days per year'],
                ['leave_casual_days',      '5',   'leave',      'Casual leave days per year'],
                ['leave_maternity_days',   '90',  'leave',      'Maternity leave days per year'],
                ['leave_paternity_days',   '5',   'leave',      'Paternity leave days per year'],
                ['leave_unpaid_days',      '365', 'leave',      'Unpaid leave max days (soft limit)'],
                ['max_public_holidays',    '14',  'attendance', 'Maximum public holidays per year'],
                ['working_hours_per_day',  '8',   'attendance', 'Standard working hours per day'],
                ['working_days_per_week',  '5',   'attendance', 'Standard working days per week'],
            ];

            for (const [key, value, category, description] of defaults) {
                await connection.query(
                    `INSERT IGNORE INTO system_settings (setting_key, setting_value, category, description)
                     VALUES (?, ?, ?, ?)`,
                    [key, value, category, description]
                );
            }
        } finally {
            connection.release();
        }
    }

    static async getAll() {
        await this.ensureTable();
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.query(
                'SELECT * FROM system_settings ORDER BY category, setting_key'
            );
            return rows;
        } finally {
            connection.release();
        }
    }

    static async getByCategory(category) {
        await this.ensureTable();
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.query(
                'SELECT * FROM system_settings WHERE category = ? ORDER BY setting_key',
                [category]
            );
            return rows;
        } finally {
            connection.release();
        }
    }

    static async get(key) {
        await this.ensureTable();
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.query(
                'SELECT setting_value FROM system_settings WHERE setting_key = ?',
                [key]
            );
            return rows.length > 0 ? rows[0].setting_value : null;
        } finally {
            connection.release();
        }
    }

    static async bulkUpdate(settings) {
        await this.ensureTable();
        const connection = await pool.getConnection();
        try {
            for (const { key, value } of settings) {
                await connection.query(
                    'UPDATE system_settings SET setting_value = ? WHERE setting_key = ?',
                    [String(value), key]
                );
            }
        } finally {
            connection.release();
        }
    }

    static async getLeaveDefaults() {
        const settings = await this.getByCategory('leave');
        const map = {};
        for (const s of settings) {
            map[s.setting_key] = parseInt(s.setting_value) || 0;
        }
        return {
            Annual:    map['leave_annual_days']    || 20,
            Sick:      map['leave_sick_days']      || 8,
            Casual:    map['leave_casual_days']    || 5,
            Maternity: map['leave_maternity_days'] || 90,
            Paternity: map['leave_paternity_days'] || 5,
            Unpaid:    map['leave_unpaid_days']    || 365,
        };
    }
}

module.exports = SystemSettings;
