-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS itpm_db;
USE itpm_db;

-- Create users table with authentication fields
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address VARCHAR(255),
  profile_picture VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create index for email lookups
CREATE INDEX idx_email ON users(email);

-- Create employees table for Digital Onboarding and Lifecycle Tracking
CREATE TABLE IF NOT EXISTS employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNIQUE,
  employee_id VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(20),
  address VARCHAR(255),
  department VARCHAR(100),
  position VARCHAR(100),
  status ENUM('Probation', 'Permanent', 'Resigned') DEFAULT 'Probation',
  joining_date DATE NOT NULL,
  probation_end_date DATE,
  resignation_date DATE,
  salary DECIMAL(12, 2),
  designation VARCHAR(100),
  manager_id INT,
  notes TEXT,
  password VARCHAR(255),
  password_generated_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL,
  INDEX idx_employee_id (employee_id),
  INDEX idx_department (department),
  INDEX idx_status (status),
  INDEX idx_email (email)
);

-- Create employee_documents table for contract and record storage
CREATE TABLE IF NOT EXISTS employee_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  document_type VARCHAR(50) NOT NULL, -- 'contract', 'offer_letter', 'id_proof', etc.
  document_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  uploaded_by INT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_employee_documents (employee_id)
);

-- Create employee_roles table for role transitions
CREATE TABLE IF NOT EXISTS employee_roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  role VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  INDEX idx_employee_roles (employee_id)
);

-- Create training_programs table for Training & Workforce Development (Dias)
CREATE TABLE IF NOT EXISTS training_programs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  type ENUM('Internal', 'External') NOT NULL,
  description TEXT,
  duration_hours DECIMAL(8, 2),
  budget DECIMAL(12, 2),
  trainer_id INT,
  status ENUM('Planned', 'In Progress', 'Completed', 'Cancelled') DEFAULT 'Planned',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  location VARCHAR(255),
  max_participants INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (trainer_id) REFERENCES employees(id) ON DELETE SET NULL,
  INDEX idx_type (type),
  INDEX idx_status (status),
  INDEX idx_start_date (start_date),
  INDEX idx_end_date (end_date)
);

-- Create training_sessions table for workshop and session scheduling
CREATE TABLE IF NOT EXISTS training_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  program_id INT NOT NULL,
  session_number INT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scheduled_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location VARCHAR(255),
  facilitator_id INT,
  max_capacity INT,
  status ENUM('Scheduled', 'In Progress', 'Completed', 'Cancelled') DEFAULT 'Scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (program_id) REFERENCES training_programs(id) ON DELETE CASCADE,
  FOREIGN KEY (facilitator_id) REFERENCES employees(id) ON DELETE SET NULL,
  INDEX idx_program_id (program_id),
  INDEX idx_scheduled_date (scheduled_date),
  INDEX idx_status (status)
);

-- Create training_assignments table for assigning employees to programs
CREATE TABLE IF NOT EXISTS training_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  program_id INT NOT NULL,
  employee_id INT NOT NULL,
  assigned_by INT,
  assignment_date DATE,
  status ENUM('Assigned', 'In Progress', 'Dropped', 'Completed') DEFAULT 'Assigned',
  completion_status ENUM('Pending', 'In Progress', 'Completed', 'Not Started') DEFAULT 'Pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (program_id) REFERENCES training_programs(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_assignment (program_id, employee_id),
  INDEX idx_program_id (program_id),
  INDEX idx_employee_id (employee_id),
  INDEX idx_completion_status (completion_status)
);

-- Create training_attendance table for tracking attendance
CREATE TABLE IF NOT EXISTS training_attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  employee_id INT NOT NULL,
  attendance_status ENUM('Present', 'Absent', 'Late', 'Pending') DEFAULT 'Pending',
  check_in_time DATETIME,
  check_out_time DATETIME,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES training_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  UNIQUE KEY unique_attendance (session_id, employee_id),
  INDEX idx_session_id (session_id),
  INDEX idx_employee_id (employee_id),
  INDEX idx_attendance_status (attendance_status)
);

-- Create attendance table for daily attendance tracking
CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  attendance_date DATE NOT NULL,
  status ENUM('Present', 'Absent', 'Leave', 'Half Day', 'Work From Home') DEFAULT 'Absent',
  check_in_time TIME,
  check_out_time TIME,
  notes TEXT,
  marked_by INT,
  marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_attendance (employee_id, attendance_date),
  INDEX idx_employee_id (employee_id),
  INDEX idx_attendance_date (attendance_date),
  INDEX idx_status (status)
);

-- Create leave_requests table for leave management
CREATE TABLE IF NOT EXISTS leave_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  leave_type VARCHAR(50) NOT NULL, -- 'Annual', 'Sick', 'Casual', 'Maternity', 'Unpaid', etc.
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_applied DECIMAL(5, 2),
  reason TEXT NOT NULL,
  status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
  approved_by INT,
  approval_notes TEXT,
  approved_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_employee_id (employee_id),
  INDEX idx_start_date (start_date),
  INDEX idx_end_date (end_date),
  INDEX idx_status (status)
);

-- Create leave_balance table for tracking leave entitlements
CREATE TABLE IF NOT EXISTS leave_balance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  leave_type VARCHAR(50) NOT NULL, -- 'Annual', 'Sick', 'Casual', 'Maternity', 'Unpaid', etc.
  total_days DECIMAL(5, 2) NOT NULL,
  used_days DECIMAL(5, 2) DEFAULT 0,
  balance_days DECIMAL(5, 2) DEFAULT 0,
  fiscal_year INT NOT NULL,
  carry_forward_days DECIMAL(5, 2) DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  UNIQUE KEY unique_leave_balance (employee_id, leave_type, fiscal_year),
  INDEX idx_employee_id (employee_id),
  INDEX idx_fiscal_year (fiscal_year)
);

-- Add sample data
INSERT INTO users (name, email, password, phone, address, created_at) VALUES
('John Doe', 'john.doe@company.com', '$2b$10$example_hash', '0771234567', '123 Main St', NOW()),
('Jane Smith', 'jane.smith@company.com', '$2b$10$example_hash', '0772345678', '456 Oak Ave', NOW()),
('Michael Johnson', 'michael.johnson@company.com', '$2b$10$example_hash', '0773456789', '789 Pine Rd', NOW()),
('Sarah Williams', 'sarah.williams@company.com', '$2b$10$example_hash', '0774567890', '321 Elm St', NOW()),
('Robert Brown', 'robert.brown@company.com', '$2b$10$example_hash', '0775678901', '654 Maple Dr', NOW()),
('Emily Davis', 'emily.davis@company.com', '$2b$10$example_hash', '0776789012', '987 Cedar Ln', NOW());

-- Insert sample employees
INSERT INTO employees (user_id, employee_id, name, email, phone, address, department, position, status, joining_date, probation_end_date, salary, designation) VALUES
(1, 'EMP001', 'John Doe', 'john.doe@company.com', '0771234567', '123 Main St', 'IT', 'Software Engineer', 'Permanent', '2024-01-15', '2024-04-15', 75000.00, 'Senior Developer'),
(2, 'EMP002', 'Jane Smith', 'jane.smith@company.com', '0772345678', '456 Oak Ave', 'HR', 'HR Manager', 'Permanent', '2023-06-01', '2023-09-01', 65000.00, 'Manager'),
(3, 'EMP003', 'Michael Johnson', 'michael.johnson@company.com', '0773456789', '789 Pine Rd', 'Finance', 'Accountant', 'Probation', '2025-11-01', '2026-02-01', 45000.00, 'Accountant'),
(4, 'EMP004', 'Sarah Williams', 'sarah.williams@company.com', '0774567890', '321 Elm St', 'IT', 'QA Engineer', 'Permanent', '2024-03-15', '2024-06-15', 55000.00, 'QA Lead'),
(5, 'EMP005', 'Robert Brown', 'robert.brown@company.com', '0775678901', '654 Maple Dr', 'Operations', 'Operations Officer', 'Permanent', '2023-09-01', '2023-12-01', 52000.00, 'Officer'),
(6, 'EMP006', 'Emily Davis', 'emily.davis@company.com', '0776789012', '987 Cedar Ln', 'IT', 'Frontend Developer', 'Probation', '2025-12-01', '2026-03-01', 48000.00, 'Developer');

-- Insert sample training programs
INSERT INTO training_programs (title, type, description, duration_hours, budget, status, start_date, end_date, location, max_participants) VALUES
('React.js Advanced', 'Internal', 'Advanced React patterns and hooks', 20.00, 5000.00, 'Planned', '2026-03-10', '2026-04-10', 'Training Room A', 15),
('Database Design', 'Internal', 'MySQL and Database optimization', 16.00, 4000.00, 'Planned', '2026-03-15', '2026-04-05', 'Training Room B', 12),
('Soft Skills Workshop', 'External', 'Communication and teamwork', 8.00, 3000.00, 'Planned', '2026-03-20', '2026-03-22', 'Hotel Conference Hall', 20);
