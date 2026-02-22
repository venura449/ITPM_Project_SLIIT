-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS itpm_db;
USE itpm_db;

-- Create users table example
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add sample data (optional)
-- INSERT INTO users (name, email) VALUES ('John Doe', 'john@example.com');
