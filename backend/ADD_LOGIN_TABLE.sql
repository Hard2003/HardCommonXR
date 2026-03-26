-- ============================================================
-- Add Users Table for Login System
-- This file adds authentication to your existing database
-- NO EXISTING DATA IS AFFECTED
-- ============================================================

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(150),
    password VARCHAR(500) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'teacher',
    status VARCHAR(20) DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample login accounts
-- Password for both: admin123 (hashed with PBKDF2-SHA256)
INSERT INTO users (username, email, password, first_name, last_name, role, status) 
VALUES ('admin', 'admin@company.com', 'e5041b69038bd47349a4262fecdf6375788c490e4a9e6446517c88f210ff7199c3c07c0af2fb0e7e868cae325c488bef768b2f2cca1f37502bc73b70391633ff', 'Admin', 'User', 'admin', 'active');

INSERT INTO users (username, email, password, first_name, last_name, role, status) 
VALUES ('teacher', 'teacher@company.com', 'e5041b69038bd47349a4262fecdf6375788c490e4a9e6446517c88f210ff7199c3c07c0af2fb0e7e868cae325c488bef768b2f2cca1f37502bc73b70391633ff', 'John', 'Teacher', 'teacher', 'active');

-- Verify users created
SELECT 'Users table created successfully!' as status;
SELECT COUNT(*) as total_users FROM users;
