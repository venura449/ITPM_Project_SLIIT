const express = require('express');
const router = express.Router();
const PayrollController = require('../controllers/Perera/PayrollController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Salary structures
router.get('/salary-structures', PayrollController.getAllSalaryStructures);
router.get('/salary-structure/:employeeId', PayrollController.getSalaryStructure);
router.post('/salary-structure', PayrollController.upsertSalaryStructure);

// Payroll generation (must come before /:id)
router.post('/generate', PayrollController.generatePayroll);

// Employee payroll history (must come before /:id)
router.get('/employee/:employeeId', PayrollController.getEmployeePayrollHistory);

// Payroll records CRUD
router.get('/', PayrollController.getPayrollList);
router.post('/', PayrollController.createPayrollRecord);
router.get('/:id', PayrollController.getPayrollRecord);
router.put('/:id', PayrollController.updatePayrollRecord);
router.delete('/:id', PayrollController.deletePayrollRecord);

module.exports = router;
