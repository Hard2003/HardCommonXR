-- ============================================================
-- TCXR Cares Educational Management System
-- Complete Database Schema with Authorization & User Management
-- ============================================================

-- Drop existing tables (reverse order of dependencies)
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS grades;
DROP TABLE IF EXISTS student_institution;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS institutions;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS users;

-- ============================================================
-- 1. USERS TABLE - Core authentication & authorization
-- ============================================================
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(500) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) NOT NULL DEFAULT 'teacher',
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_status (status)
);

-- ============================================================
-- 2. USER ROLES TABLE - Role-based access control
-- ============================================================
CREATE TABLE user_roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255),
    permissions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_role_name (role_name)
);

-- Insert default roles
INSERT INTO user_roles (role_name, description, permissions) VALUES
('admin', 'Administrator - Full system access', JSON_ARRAY('view_all', 'edit_all', 'delete_all', 'manage_users', 'view_reports')),
('teacher', 'Teacher - Manage own students and grades', JSON_ARRAY('view_own_students', 'edit_grades', 'view_attendance', 'manage_own_classes')),
('principal', 'Principal - Institution-level oversight', JSON_ARRAY('view_institution', 'edit_institution', 'view_all_teachers', 'view_reports')),
('parent', 'Parent - View own child information', JSON_ARRAY('view_own_child', 'view_grades', 'view_attendance'));

-- ============================================================
-- 3. INSTITUTIONS TABLE - Schools and learning centers
-- ============================================================
CREATE TABLE institutions (
    institution_id INT AUTO_INCREMENT PRIMARY KEY,
    institution_name VARCHAR(150) NOT NULL UNIQUE,
    principal_name VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(150),
    school_code VARCHAR(50) UNIQUE,
    district VARCHAR(100),
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(10),
    established_year INT,
    total_capacity INT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_institution_name (institution_name),
    INDEX idx_school_code (school_code),
    INDEX idx_city (city),
    INDEX idx_status (status)
);

-- ============================================================
-- 4. STUDENTS TABLE - Student information
-- ============================================================
CREATE TABLE students (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    student_uuid VARCHAR(36) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    gender ENUM('Male', 'Female', 'Other'),
    student_email VARCHAR(150),
    phone_number VARCHAR(20),
    primary_guardian_name VARCHAR(150),
    primary_guardian_email VARCHAR(150),
    primary_guardian_phone VARCHAR(20),
    secondary_guardian_name VARCHAR(150),
    secondary_guardian_email VARCHAR(150),
    enrollment_date DATE,
    current_grade VARCHAR(20),
    status ENUM('active', 'inactive', 'graduated') DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_first_name (first_name),
    INDEX idx_last_name (last_name),
    INDEX idx_student_uuid (student_uuid),
    INDEX idx_status (status)
);

-- ============================================================
-- 5. STUDENT_INSTITUTION TABLE - Many-to-many relationship
-- ============================================================
CREATE TABLE student_institution (
    student_institution_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    institution_id INT NOT NULL,
    enrollment_date DATE,
    grade_level VARCHAR(20),
    enrollment_status ENUM('active', 'transferred', 'graduated', 'withdrawn') DEFAULT 'active',
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (institution_id) REFERENCES institutions(institution_id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_institution (student_id, institution_id),
    INDEX idx_student_id (student_id),
    INDEX idx_institution_id (institution_id)
);

-- ============================================================
-- 6. GRADES TABLE - Student performance
-- ============================================================
CREATE TABLE grades (
    grade_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    institution_id INT NOT NULL,
    school_year INT NOT NULL,
    quarter INT NOT NULL,
    fine_motor VARCHAR(50),
    gross_motor VARCHAR(50),
    social_emotional VARCHAR(50),
    early_literacy VARCHAR(50),
    early_numeracy VARCHAR(50),
    independence VARCHAR(50),
    teacher_comments TEXT,
    parent_comments TEXT,
    recorded_by INT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (institution_id) REFERENCES institutions(institution_id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(user_id),
    UNIQUE KEY unique_grade_period (student_id, school_year, quarter),
    INDEX idx_student_id (student_id),
    INDEX idx_institution_id (institution_id),
    INDEX idx_school_year (school_year),
    INDEX idx_quarter (quarter)
);

-- ============================================================
-- 7. ATTENDANCE TABLE - Daily attendance tracking
-- ============================================================
CREATE TABLE attendance (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    institution_id INT NOT NULL,
    attendance_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL,
    notes TEXT,
    marked_by INT,
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (institution_id) REFERENCES institutions(institution_id) ON DELETE CASCADE,
    FOREIGN KEY (marked_by) REFERENCES users(user_id),
    UNIQUE KEY unique_attendance (student_id, attendance_date),
    INDEX idx_student_id (student_id),
    INDEX idx_attendance_date (attendance_date),
    INDEX idx_institution_id (institution_id),
    INDEX idx_status (status)
);

-- ============================================================
-- 8. ATTENDANCE STATUS MAPPING TABLE
-- ============================================================
CREATE TABLE attendance_status_mapping (
    status_id INT AUTO_INCREMENT PRIMARY KEY,
    status_code VARCHAR(50) UNIQUE NOT NULL,
    status_label VARCHAR(50) NOT NULL,
    display_color VARCHAR(20),
    description TEXT,
    is_present BOOLEAN DEFAULT FALSE
);

-- Insert standard attendance statuses
INSERT INTO attendance_status_mapping (status_code, status_label, display_color, description, is_present) VALUES
('P', 'Present', '#28a745', 'Student was present', TRUE),
('A', 'Absent', '#dc3545', 'Student was absent', FALSE),
('L', 'Late', '#ffc107', 'Student arrived late', TRUE),
('E', 'Excused Absence', '#17a2b8', 'Absence was excused', FALSE),
('H', 'Half Day', '#6c757d', 'Student left early', TRUE),
('S', 'Sick', '#ff6b6b', 'Student was sick', FALSE);

-- ============================================================
-- INSERT TEST DATA
-- ============================================================

-- Insert admin and teacher users (with real password hashes)
INSERT INTO users (username, email, password_hash, first_name, last_name, role, status) VALUES
('admin', 'admin@tcxrcares.com', 'e5041b69038bd47349a4262fecdf6375788c490e4a9e6446517c88f210ff7199c3c07c0af2fb0e7e868cae325c488bef768b2f2cca1f37502bc73b70391633ff', 'Admin', 'User', 'admin', 'active'),
('teacher', 'teacher@tcxrcares.com', 'e5041b69038bd47349a4262fecdf6375788c490e4a9e6446517c88f210ff7199c3c07c0af2fb0e7e868cae325c488bef768b2f2cca1f37502bc73b70391633ff', 'John', 'Teacher', 'teacher', 'active'),
('principal', 'principal@tcxrcares.com', 'e5041b69038bd47349a4262fecdf6375788c490e4a9e6446517c88f210ff7199c3c07c0af2fb0e7e868cae325c488bef768b2f2cca1f37502bc73b70391633ff', 'Sarah', 'Principal', 'principal', 'active');

-- Insert sample institutions
INSERT INTO institutions (institution_name, principal_name, phone, email, school_code, district, address, city, state, zip_code, total_capacity, status) VALUES
('Green Valley Preschool', 'Dr. Emily Johnson', '555-0101', 'info@greenvalley.edu', 'GV-001', 'Central', '123 Oak Street', 'Springfield', 'IL', '62701', 150, 'active'),
('Red Rose Academy', 'Mr. Robert Smith', '555-0102', 'info@redrose.edu', 'RR-001', 'North', '456 Elm Street', 'Springfield', 'IL', '62702', 120, 'active'),
('Sunny Days Learning Center', 'Mrs. Patricia Brown', '555-0103', 'info@sunnydays.edu', 'SD-001', 'South', '789 Maple Street', 'Springfield', 'IL', '62703', 100, 'active');

-- Insert sample students
INSERT INTO students (student_uuid, first_name, last_name, date_of_birth, gender, primary_guardian_name, primary_guardian_email, enrollment_date, current_grade, status) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Kesley', 'Howley', '2021-09-15', 'Female', 'Karen Howley', 'khowley@email.com', '2023-01-15', 'K4', 'active'),
('550e8400-e29b-41d4-a716-446655440001', 'Harriett', 'Halloran', '2021-12-08', 'Female', 'Patricia Halloran', 'phalloran@email.com', '2023-01-20', 'K4', 'active'),
('550e8400-e29b-41d4-a716-446655440002', 'Elladine', 'Domerque', '2022-08-21', 'Male', 'Michael Domerque', 'mdomerque@email.com', '2023-02-01', 'K3', 'active'),
('550e8400-e29b-41d4-a716-446655440003', 'James', 'Wilson', '2022-05-10', 'Male', 'David Wilson', 'dwilson@email.com', '2023-01-10', 'K4', 'active'),
('550e8400-e29b-41d4-a716-446655440004', 'Emma', 'Davis', '2022-03-22', 'Female', 'Jennifer Davis', 'jdavis@email.com', '2023-02-15', 'K3', 'active');

-- ============================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX idx_grades_student ON grades(student_id);
CREATE INDEX idx_grades_institution ON grades(institution_id);
CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_date_range ON attendance(attendance_date);

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
SELECT '✅ All tables created successfully!' as status;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_institutions FROM institutions;
SELECT COUNT(*) as total_students FROM students;
SELECT COUNT(*) as total_attendance_statuses FROM attendance_status_mapping;
