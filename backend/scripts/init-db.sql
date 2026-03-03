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

-- Add sample data (optional)
-- INSERT INTO users (name, email, password) VALUES ('John Doe', 'john@example.com', 'hashed_password_here');
