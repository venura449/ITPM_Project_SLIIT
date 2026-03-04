const pool = require('../../../config/database');

class PayrollModel {
    // ─── Salary Structures ────────────────────────────────────────────────────

    static async getSalaryStructure(employeeId) {
        const [rows] = await pool.query(
            `SELECT ss.*, e.name AS employee_name, e.employee_id AS emp_code,
              e.department, e.designation
       FROM salary_structures ss
       JOIN employees e ON e.id = ss.employee_id
       WHERE ss.employee_id = ?`,
            [employeeId]
        );
        return rows[0] || null;
    }

    static async getAllSalaryStructures() {
        const [rows] = await pool.query(
            `SELECT ss.*, e.name AS employee_name, e.employee_id AS emp_code,
              e.department, e.designation
       FROM salary_structures ss
       JOIN employees e ON e.id = ss.employee_id
       ORDER BY e.name`
        );
        return rows;
    }

    static async upsertSalaryStructure(data) {
        const {
            employee_id, basic_salary, housing_allowance, transport_allowance,
            medical_allowance, other_allowances, epf_employee_pct, epf_employer_pct,
            etf_pct, income_tax, other_deductions, effective_from
        } = data;

        const [result] = await pool.query(
            `INSERT INTO salary_structures
         (employee_id, basic_salary, housing_allowance, transport_allowance,
          medical_allowance, other_allowances, epf_employee_pct, epf_employer_pct,
          etf_pct, income_tax, other_deductions, effective_from)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         basic_salary       = VALUES(basic_salary),
         housing_allowance  = VALUES(housing_allowance),
         transport_allowance= VALUES(transport_allowance),
         medical_allowance  = VALUES(medical_allowance),
         other_allowances   = VALUES(other_allowances),
         epf_employee_pct   = VALUES(epf_employee_pct),
         epf_employer_pct   = VALUES(epf_employer_pct),
         etf_pct            = VALUES(etf_pct),
         income_tax         = VALUES(income_tax),
         other_deductions   = VALUES(other_deductions),
         effective_from     = VALUES(effective_from),
         updated_at         = CURRENT_TIMESTAMP`,
            [
                employee_id,
                basic_salary || 0,
                housing_allowance || 0,
                transport_allowance || 0,
                medical_allowance || 0,
                other_allowances || 0,
                epf_employee_pct != null ? epf_employee_pct : 8.00,
                epf_employer_pct != null ? epf_employer_pct : 12.00,
                etf_pct != null ? etf_pct : 3.00,
                income_tax || 0,
                other_deductions || 0,
                effective_from || new Date().toISOString().split('T')[0]
            ]
        );
        return result;
    }

    // ─── Payroll Records ──────────────────────────────────────────────────────

    static async getPayrollList(month, year, status = null) {
        let query = `
      SELECT pr.*, e.name AS employee_name, e.employee_id AS emp_code,
             e.department, e.designation
      FROM payroll_records pr
      JOIN employees e ON e.id = pr.employee_id
      WHERE pr.pay_period_month = ? AND pr.pay_period_year = ?`;
        const params = [month, year];
        if (status) {
            query += ` AND pr.status = ?`;
            params.push(status);
        }
        query += ` ORDER BY e.name`;
        const [rows] = await pool.query(query, params);
        return rows;
    }

    static async getPayrollRecord(id) {
        const [rows] = await pool.query(
            `SELECT pr.*, e.name AS employee_name, e.employee_id AS emp_code,
              e.department, e.designation, e.email
       FROM payroll_records pr
       JOIN employees e ON e.id = pr.employee_id
       WHERE pr.id = ?`,
            [id]
        );
        return rows[0] || null;
    }

    static async getEmployeePayrollHistory(employeeId) {
        const [rows] = await pool.query(
            `SELECT pr.*, e.name AS employee_name, e.employee_id AS emp_code
       FROM payroll_records pr
       JOIN employees e ON e.id = pr.employee_id
       WHERE pr.employee_id = ?
       ORDER BY pr.pay_period_year DESC, pr.pay_period_month DESC
       LIMIT 24`,
            [employeeId]
        );
        return rows;
    }

    static async getPayrollSummary(month, year) {
        const [rows] = await pool.query(
            `SELECT
         COUNT(*) AS total_records,
         COALESCE(SUM(gross_salary), 0)      AS total_gross,
         COALESCE(SUM(net_salary), 0)        AS total_net,
         COALESCE(SUM(total_deductions), 0)  AS total_deductions,
         COALESCE(SUM(epf_employee), 0)      AS total_epf_employee,
         COALESCE(SUM(epf_employer), 0)      AS total_epf_employer,
         COALESCE(SUM(etf), 0)               AS total_etf,
         SUM(CASE WHEN status = 'Draft'     THEN 1 ELSE 0 END) AS draft_count,
         SUM(CASE WHEN status = 'Processed' THEN 1 ELSE 0 END) AS processed_count,
         SUM(CASE WHEN status = 'Paid'      THEN 1 ELSE 0 END) AS paid_count
       FROM payroll_records
       WHERE pay_period_month = ? AND pay_period_year = ?`,
            [month, year]
        );
        return rows[0];
    }

    static _compute(data) {
        const basic = parseFloat(data.basic_salary || 0);
        const housing = parseFloat(data.housing_allowance || 0);
        const transport = parseFloat(data.transport_allowance || 0);
        const medical = parseFloat(data.medical_allowance || 0);
        const other = parseFloat(data.other_allowances || 0);
        const epf_ee_pct = parseFloat(data.epf_employee_pct != null ? data.epf_employee_pct : 8);
        const epf_er_pct = parseFloat(data.epf_employer_pct != null ? data.epf_employer_pct : 12);
        const etf_pct = parseFloat(data.etf_pct != null ? data.etf_pct : 3);
        const income_tax = parseFloat(data.income_tax || 0);
        const other_ded = parseFloat(data.other_deductions || 0);

        const gross = basic + housing + transport + medical + other;
        const epf_employee = basic * epf_ee_pct / 100;
        const epf_employer = basic * epf_er_pct / 100;
        const etf = basic * etf_pct / 100;
        const total_deductions = epf_employee + income_tax + other_ded;
        const net_salary = gross - total_deductions;

        return { gross, epf_employee, epf_employer, etf, total_deductions, net_salary };
    }

    static async createPayrollRecord(data) {
        const c = this._compute(data);
        const [result] = await pool.query(
            `INSERT INTO payroll_records
         (employee_id, pay_period_month, pay_period_year,
          basic_salary, housing_allowance, transport_allowance,
          medical_allowance, other_allowances, gross_salary,
          epf_employee, epf_employer, etf, income_tax, other_deductions,
          total_deductions, net_salary, working_days, present_days,
          status, payment_date, notes, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                data.employee_id, data.pay_period_month, data.pay_period_year,
                data.basic_salary || 0, data.housing_allowance || 0,
                data.transport_allowance || 0, data.medical_allowance || 0,
                data.other_allowances || 0, c.gross,
                c.epf_employee, c.epf_employer, c.etf,
                data.income_tax || 0, data.other_deductions || 0,
                c.total_deductions, c.net_salary,
                data.working_days || 0, data.present_days || 0,
                data.status || 'Draft',
                data.payment_date || null, data.notes || null, data.created_by || null
            ]
        );
        return result.insertId;
    }

    static async updatePayrollRecord(id, data) {
        const c = this._compute(data);
        const [result] = await pool.query(
            `UPDATE payroll_records SET
         basic_salary       = ?, housing_allowance  = ?, transport_allowance = ?,
         medical_allowance  = ?, other_allowances   = ?, gross_salary        = ?,
         epf_employee       = ?, epf_employer       = ?, etf                 = ?,
         income_tax         = ?, other_deductions   = ?, total_deductions    = ?,
         net_salary         = ?, working_days       = ?, present_days        = ?,
         status             = ?, payment_date       = ?, notes               = ?
       WHERE id = ?`,
            [
                data.basic_salary || 0, data.housing_allowance || 0,
                data.transport_allowance || 0, data.medical_allowance || 0,
                data.other_allowances || 0, c.gross,
                c.epf_employee, c.epf_employer, c.etf,
                data.income_tax || 0, data.other_deductions || 0,
                c.total_deductions, c.net_salary,
                data.working_days || 0, data.present_days || 0,
                data.status, data.payment_date || null, data.notes || null,
                id
            ]
        );
        return result.affectedRows;
    }

    static async deletePayrollRecord(id) {
        const [result] = await pool.query(
            `DELETE FROM payroll_records WHERE id = ? AND status = 'Draft'`,
            [id]
        );
        return result.affectedRows;
    }

    static async generateBulkPayroll(month, year, createdBy) {
        const [employees] = await pool.query(
            `SELECT ss.*, e.id AS emp_id, e.name
       FROM salary_structures ss
       JOIN employees e ON e.id = ss.employee_id`
        );

        let generated = 0;
        let skipped = 0;
        const errors = [];

        for (const emp of employees) {
            try {
                const [existing] = await pool.query(
                    `SELECT id FROM payroll_records
           WHERE employee_id = ? AND pay_period_month = ? AND pay_period_year = ?`,
                    [emp.emp_id, month, year]
                );
                if (existing.length > 0) { skipped++; continue; }

                // Pull attendance for the period
                const [att] = await pool.query(
                    `SELECT
             COUNT(*) AS total_days,
             SUM(CASE WHEN status = 'Present'  THEN 1   ELSE 0 END) AS present_days,
             SUM(CASE WHEN status = 'Half Day' THEN 0.5 ELSE 0 END) AS half_days
           FROM attendance
           WHERE employee_id = ? AND MONTH(date) = ? AND YEAR(date) = ?`,
                    [emp.emp_id, month, year]
                );

                const present_days = parseFloat(att[0]?.present_days || 0) + parseFloat(att[0]?.half_days || 0);
                const working_days = parseInt(att[0]?.total_days || 0) || 22;

                const c = this._compute({
                    basic_salary: emp.basic_salary,
                    housing_allowance: emp.housing_allowance,
                    transport_allowance: emp.transport_allowance,
                    medical_allowance: emp.medical_allowance,
                    other_allowances: emp.other_allowances,
                    epf_employee_pct: emp.epf_employee_pct,
                    epf_employer_pct: emp.epf_employer_pct,
                    etf_pct: emp.etf_pct,
                    income_tax: emp.income_tax,
                    other_deductions: emp.other_deductions
                });

                await pool.query(
                    `INSERT INTO payroll_records
             (employee_id, pay_period_month, pay_period_year,
              basic_salary, housing_allowance, transport_allowance,
              medical_allowance, other_allowances, gross_salary,
              epf_employee, epf_employer, etf, income_tax, other_deductions,
              total_deductions, net_salary, working_days, present_days,
              status, created_by)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                    [
                        emp.emp_id, month, year,
                        emp.basic_salary, emp.housing_allowance || 0,
                        emp.transport_allowance || 0, emp.medical_allowance || 0,
                        emp.other_allowances || 0, c.gross,
                        c.epf_employee, c.epf_employer, c.etf,
                        emp.income_tax || 0, emp.other_deductions || 0,
                        c.total_deductions, c.net_salary,
                        working_days, present_days, 'Draft', createdBy || null
                    ]
                );
                generated++;
            } catch (err) {
                errors.push({ employee: emp.name, error: err.message });
            }
        }
        return { generated, skipped, errors };
    }
}

module.exports = PayrollModel;
