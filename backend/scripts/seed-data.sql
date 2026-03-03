-- Seed sample data for testing
USE itpm_db;

-- Insert sample users
INSERT INTO users (name, email, password, phone, address, created_at) VALUES
('John Doe', 'john.doe@company.com', '$2b$10$example_hash', '0771234567', '123 Main St', NOW()),
('Jane Smith', 'jane.smith@company.com', '$2b$10$example_hash', '0772345678', '456 Oak Ave', NOW()),
('Michael Johnson', 'michael.johnson@company.com', '$2b$10$example_hash', '0773456789', '789 Pine Rd', NOW()),
('Sarah Williams', 'sarah.williams@company.com', '$2b$10$example_hash', '0774567890', '321 Elm St', NOW()),
('Robert Brown', 'robert.brown@company.com', '$2b$10$example_hash', '0775678901', '654 Maple Dr', NOW()),
('Emily Davis', 'emily.davis@company.com', '$2b$10$example_hash', '0776789012', '987 Cedar Ln', NOW())
ON DUPLICATE KEY UPDATE email=VALUES(email);

-- Insert sample employees
INSERT INTO employees (user_id, employee_id, name, email, phone, address, department, position, status, joining_date, probation_end_date, salary, designation) VALUES
(1, 'EMP001', 'John Doe', 'john.doe@company.com', '0771234567', '123 Main St', 'IT', 'Software Engineer', 'Permanent', '2024-01-15', '2024-04-15', 75000.00, 'Senior Developer'),
(2, 'EMP002', 'Jane Smith', 'jane.smith@company.com', '0772345678', '456 Oak Ave', 'HR', 'HR Manager', 'Permanent', '2023-06-01', '2023-09-01', 65000.00, 'Manager'),
(3, 'EMP003', 'Michael Johnson', 'michael.johnson@company.com', '0773456789', '789 Pine Rd', 'Finance', 'Accountant', 'Probation', '2025-11-01', '2026-02-01', 45000.00, 'Accountant'),
(4, 'EMP004', 'Sarah Williams', 'sarah.williams@company.com', '0774567890', '321 Elm St', 'IT', 'QA Engineer', 'Permanent', '2024-03-15', '2024-06-15', 55000.00, 'QA Lead'),
(5, 'EMP005', 'Robert Brown', 'robert.brown@company.com', '0775678901', '654 Maple Dr', 'Operations', 'Operations Officer', 'Permanent', '2023-09-01', '2023-12-01', 52000.00, 'Officer'),
(6, 'EMP006', 'Emily Davis', 'emily.davis@company.com', '0776789012', '987 Cedar Ln', 'IT', 'Frontend Developer', 'Probation', '2025-12-01', '2026-03-01', 48000.00, 'Developer')
ON DUPLICATE KEY UPDATE name=VALUES(name), email=VALUES(email);

-- Insert sample training programs
INSERT INTO training_programs (title, type, description, duration_hours, budget, status, start_date, end_date, location, max_participants) VALUES
('React.js Advanced', 'Internal', 'Advanced React patterns and hooks', 20.00, 5000.00, 'Planned', '2026-03-10', '2026-04-10', 'Training Room A', 15),
('Database Design', 'Internal', 'MySQL and Database optimization', 16.00, 4000.00, 'Planned', '2026-03-15', '2026-04-05', 'Training Room B', 12),
('Soft Skills Workshop', 'External', 'Communication and teamwork', 8.00, 3000.00, 'Planned', '2026-03-20', '2026-03-22', 'Hotel Conference Hall', 20)
ON DUPLICATE KEY UPDATE title=VALUES(title);
