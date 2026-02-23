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

-- Add sample data (optional)
-- INSERT INTO users (name, email, password) VALUES ('John Doe', 'john@example.com', 'hashed_password_here');
