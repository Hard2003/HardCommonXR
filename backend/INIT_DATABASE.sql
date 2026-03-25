-- TCXR Cares Database Initialization Script
-- Paste this directly into Railway MySQL console

-- Drop existing tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS grades;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS attendance_mapping;
DROP TABLE IF EXISTS institutions;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create institutions table
CREATE TABLE institutions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institution VARCHAR(100) UNIQUE NOT NULL,
    principal VARCHAR(255),
    phone VARCHAR(20),
    school VARCHAR(100),
    district INT,
    address VARCHAR(255),
    city VARCHAR(100)
);

-- Create students table
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    gender VARCHAR(20),
    dob VARCHAR(20),
    primary_guardian_email VARCHAR(255),
    institution VARCHAR(100),
    grade VARCHAR(20),
    FOREIGN KEY (institution) REFERENCES institutions(institution)
);

-- Create grades table
CREATE TABLE grades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    fine_motor VARCHAR(50),
    gross_motor VARCHAR(50),
    social_emotional VARCHAR(50),
    early_literacy VARCHAR(50),
    early_numeracy VARCHAR(50),
    independence VARCHAR(50),
    school_year INT,
    grading_quarter INT,
    FOREIGN KEY (student_id) REFERENCES students(id)
);

-- Create attendance table
CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    institution VARCHAR(100),
    date VARCHAR(20),
    status VARCHAR(50),
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (institution) REFERENCES institutions(institution)
);

-- Create attendance_mapping table
CREATE TABLE attendance_mapping (
    id INT AUTO_INCREMENT PRIMARY KEY,
    status_key VARCHAR(50),
    status_value VARCHAR(50)
);

-- Insert default users with hashed passwords
-- Password: admin123 (hashed with PBKDF2)
INSERT INTO users (username, password, role) VALUES 
('admin', 'e5041b69038bd47349a4262fecdf6375788c490e4a9e6446517c88f210ff7199c3c07c0af2fb0e7e868cae325c488bef768b2f2cca1f37502bc73b70391633ff', 'admin');

-- Password: teacher123 (hashed with PBKDF2)
INSERT INTO users (username, password, role) VALUES 
('teacher', 'e5041b69038bd47349a4262fecdf6375788c490e4a9e6446517c88f210ff7199c3c07c0af2fb0e7e868cae325c488bef768b2f2cca1f37502bc73b70391633ff', 'teacher');

-- Verify tables were created
SELECT 'All tables created successfully!' as status;
SELECT COUNT(*) as user_count FROM users;
