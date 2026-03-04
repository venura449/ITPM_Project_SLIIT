USE itpm_db;

-- Salary structures: one row per employee defining their pay components
CREATE TABLE IF NOT EXISTS salary_structures (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  basic_salary DECIMAL(12,2) NOT NULL DEFAULT 0,
  housing_allowance DECIMAL(12,2) DEFAULT 0,
  transport_allowance DECIMAL(12,2) DEFAULT 0,
  medical_allowance DECIMAL(12,2) DEFAULT 0,
  other_allowances DECIMAL(12,2) DEFAULT 0,
  epf_employee_pct DECIMAL(5,2) DEFAULT 8.00,
  epf_employer_pct DECIMAL(5,2) DEFAULT 12.00,
  etf_pct DECIMAL(5,2) DEFAULT 3.00,
  income_tax DECIMAL(12,2) DEFAULT 0,
  other_deductions DECIMAL(12,2) DEFAULT 0,
  effective_from DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  UNIQUE KEY unique_salary_structure (employee_id)
);

-- Monthly payroll records: one row per employee per pay period
CREATE TABLE IF NOT EXISTS payroll_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  pay_period_month TINYINT NOT NULL,
  pay_period_year SMALLINT NOT NULL,
  basic_salary DECIMAL(12,2) NOT NULL DEFAULT 0,
  housing_allowance DECIMAL(12,2) DEFAULT 0,
  transport_allowance DECIMAL(12,2) DEFAULT 0,
  medical_allowance DECIMAL(12,2) DEFAULT 0,
  other_allowances DECIMAL(12,2) DEFAULT 0,
  gross_salary DECIMAL(12,2) NOT NULL DEFAULT 0,
  epf_employee DECIMAL(12,2) DEFAULT 0,
  epf_employer DECIMAL(12,2) DEFAULT 0,
  etf DECIMAL(12,2) DEFAULT 0,
  income_tax DECIMAL(12,2) DEFAULT 0,
  other_deductions DECIMAL(12,2) DEFAULT 0,
  total_deductions DECIMAL(12,2) NOT NULL DEFAULT 0,
  net_salary DECIMAL(12,2) NOT NULL DEFAULT 0,
  working_days INT DEFAULT 0,
  present_days INT DEFAULT 0,
  status ENUM('Draft','Processed','Paid') DEFAULT 'Draft',
  payment_date DATE,
  notes TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_payroll (employee_id, pay_period_month, pay_period_year),
  INDEX idx_pay_period (pay_period_year, pay_period_month),
  INDEX idx_status (status)
);

-- Seed salary structures for existing sample employees
INSERT IGNORE INTO salary_structures
  (employee_id, basic_salary, housing_allowance, transport_allowance, medical_allowance,
   other_allowances, epf_employee_pct, epf_employer_pct, etf_pct, income_tax, other_deductions, effective_from)
SELECT id,
  salary,
  ROUND(salary * 0.10, 2),
  ROUND(salary * 0.05, 2),
  ROUND(salary * 0.03, 2),
  0,
  8.00, 12.00, 3.00,
  0, 0,
  joining_date
FROM employees
WHERE salary IS NOT NULL;
