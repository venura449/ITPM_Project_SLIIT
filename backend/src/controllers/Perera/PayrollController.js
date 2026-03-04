const PayrollModel = require('../../models/Perera/PayrollModel');

class PayrollController {
  // GET /api/payroll?month=&year=&status=
  static async getPayrollList(req, res) {
    try {
      const { month, year, status } = req.query;
      const m = parseInt(month) || new Date().getMonth() + 1;
      const y = parseInt(year)  || new Date().getFullYear();
      const [records, summary] = await Promise.all([
        PayrollModel.getPayrollList(m, y, status || null),
        PayrollModel.getPayrollSummary(m, y)
      ]);
      res.json({ success: true, data: records, summary });
    } catch (err) {
      console.error('getPayrollList error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // GET /api/payroll/salary-structures
  static async getAllSalaryStructures(req, res) {
    try {
      const data = await PayrollModel.getAllSalaryStructures();
      res.json({ success: true, data });
    } catch (err) {
      console.error('getAllSalaryStructures error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // GET /api/payroll/salary-structure/:employeeId
  static async getSalaryStructure(req, res) {
    try {
      const data = await PayrollModel.getSalaryStructure(req.params.employeeId);
      res.json({ success: true, data });
    } catch (err) {
      console.error('getSalaryStructure error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // POST /api/payroll/salary-structure
  static async upsertSalaryStructure(req, res) {
    try {
      const data = req.body;
      if (!data.employee_id || data.basic_salary == null) {
        return res.status(400).json({
          success: false,
          message: 'employee_id and basic_salary are required'
        });
      }
      await PayrollModel.upsertSalaryStructure(data);
      res.json({ success: true, message: 'Salary structure saved successfully' });
    } catch (err) {
      console.error('upsertSalaryStructure error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // GET /api/payroll/employee/:employeeId
  static async getEmployeePayrollHistory(req, res) {
    try {
      const data = await PayrollModel.getEmployeePayrollHistory(req.params.employeeId);
      res.json({ success: true, data });
    } catch (err) {
      console.error('getEmployeePayrollHistory error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // GET /api/payroll/:id
  static async getPayrollRecord(req, res) {
    try {
      const record = await PayrollModel.getPayrollRecord(req.params.id);
      if (!record) {
        return res.status(404).json({ success: false, message: 'Payroll record not found' });
      }
      res.json({ success: true, data: record });
    } catch (err) {
      console.error('getPayrollRecord error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // POST /api/payroll/generate
  static async generatePayroll(req, res) {
    try {
      const { month, year } = req.body;
      if (!month || !year) {
        return res.status(400).json({
          success: false,
          message: 'month and year are required'
        });
      }
      const result = await PayrollModel.generateBulkPayroll(
        parseInt(month), parseInt(year), req.user?.id
      );
      res.json({ success: true, data: result });
    } catch (err) {
      console.error('generatePayroll error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // POST /api/payroll
  static async createPayrollRecord(req, res) {
    try {
      const data = { ...req.body, created_by: req.user?.id };
      if (!data.employee_id || !data.pay_period_month || !data.pay_period_year) {
        return res.status(400).json({
          success: false,
          message: 'employee_id, pay_period_month and pay_period_year are required'
        });
      }
      const id = await PayrollModel.createPayrollRecord(data);
      res.status(201).json({ success: true, data: { id }, message: 'Payroll record created' });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          success: false,
          message: 'A payroll record already exists for this employee and period'
        });
      }
      console.error('createPayrollRecord error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // PUT /api/payroll/:id
  static async updatePayrollRecord(req, res) {
    try {
      const affected = await PayrollModel.updatePayrollRecord(req.params.id, req.body);
      if (!affected) {
        return res.status(404).json({ success: false, message: 'Payroll record not found' });
      }
      res.json({ success: true, message: 'Payroll record updated successfully' });
    } catch (err) {
      console.error('updatePayrollRecord error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // DELETE /api/payroll/:id
  static async deletePayrollRecord(req, res) {
    try {
      const affected = await PayrollModel.deletePayrollRecord(req.params.id);
      if (!affected) {
        return res.status(400).json({
          success: false,
          message: 'Record not found or cannot be deleted (only Draft records can be deleted)'
        });
      }
      res.json({ success: true, message: 'Payroll record deleted successfully' });
    } catch (err) {
      console.error('deletePayrollRecord error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = PayrollController;
