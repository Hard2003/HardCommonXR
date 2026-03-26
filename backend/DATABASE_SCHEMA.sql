-- ============================================================
-- TCXR Cares Educational Management System
-- Simplified Professional Database Schema
-- ============================================================

DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS grades;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS institutions;
DROP TABLE IF EXISTS users;

-- ============================================================
-- 1. USERS TABLE
-- ============================================================
CREATE TABLE users (
    id INT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(150),
    password VARCHAR(500) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50),
    status VARCHAR(20),
    created_at DATETIME
);

-- ============================================================
-- 2. INSTITUTIONS TABLE
-- ============================================================
CREATE TABLE institutions (
    id INT PRIMARY KEY,
    institution VARCHAR(100) NOT NULL,
    principal VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(150),
    school_code VARCHAR(50),
    district VARCHAR(100),
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(10),
    status VARCHAR(20),
    created_at DATETIME
);

-- ============================================================
-- 3. STUDENTS TABLE
-- ============================================================
CREATE TABLE students (
    id INT PRIMARY KEY,
    uuid VARCHAR(36),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    gender VARCHAR(20),
    dob VARCHAR(20),
    primary_guardian_name VARCHAR(150),
    primary_guardian_email VARCHAR(150),
    primary_guardian_phone VARCHAR(20),
    institution VARCHAR(100),
    grade VARCHAR(20),
    enrollment_date DATE,
    status VARCHAR(20),
    created_at DATETIME
);

-- ============================================================
-- 4. GRADES TABLE
-- ============================================================
CREATE TABLE grades (
    id INT PRIMARY KEY,
    student_id INT,
    fine_motor VARCHAR(50),
    gross_motor VARCHAR(50),
    social_emotional VARCHAR(50),
    early_literacy VARCHAR(50),
    early_numeracy VARCHAR(50),
    independence VARCHAR(50),
    school_year INT,
    grading_quarter INT,
    teacher_notes TEXT,
    recorded_by INT,
    recorded_at DATETIME
);

-- ============================================================
-- 5. ATTENDANCE TABLE
-- ============================================================
CREATE TABLE attendance (
    id INT PRIMARY KEY,
    student_id INT,
    institution VARCHAR(100),
    date VARCHAR(20),
    status VARCHAR(50),
    marked_by INT,
    marked_at DATETIME
);

-- ============================================================
-- 6. ATTENDANCE STATUS MAPPING
-- ============================================================
CREATE TABLE attendance_mapping (
    id INT PRIMARY KEY,
    status_key VARCHAR(50),
    status_value VARCHAR(50),
    display_label VARCHAR(50),
    color_code VARCHAR(20)
);

-- ============================================================
-- INSERT ATTENDANCE STATUSES
-- ============================================================
INSERT INTO attendance_mapping (id, status_key, status_value, display_label, color_code) VALUES
(1, 'P', 'Present', 'Present', '#28a745'),
(2, 'A', 'Absent', 'Absent', '#dc3545'),
(3, 'L', 'Late', 'Late', '#ffc107'),
(4, 'E', 'Excused', 'Excused Absence', '#17a2b8'),
(5, 'H', 'HalfDay', 'Half Day', '#6c757d');

-- ============================================================
-- INSERT DEFAULT USERS
-- Password: admin123 (hashed with PBKDF2-SHA256)
-- ============================================================
INSERT INTO users (id, username, email, password, first_name, last_name, role, status) VALUES
(1, 'admin', 'admin@tcxrcares.com', 'e5041b69038bd47349a4262fecdf6375788c490e4a9e6446517c88f210ff7199c3c07c0af2fb0e7e868cae325c488bef768b2f2cca1f37502bc73b70391633ff', 'Admin', 'User', 'admin', 'active');

-- Password: teacher123 (hashed with PBKDF2-SHA256)
INSERT INTO users (id, username, email, password, first_name, last_name, role, status) VALUES
(2, 'teacher', 'teacher@tcxrcares.com', 'e5041b69038bd47349a4262fecdf6375788c490e4a9e6446517c88f210ff7199c3c07c0af2fb0e7e868cae325c488bef768b2f2cca1f37502bc73b70391633ff', 'John', 'Teacher', 'teacher', 'active');

-- ============================================================
-- INSERT SAMPLE INSTITUTIONS
-- ============================================================
INSERT INTO institutions (id, institution, principal, phone, email, school_code, district, address, city, state, status) VALUES
(1, 'Green Valley Preschool', 'Dr. Emily Johnson', '555-0101', 'info@greenvalley.edu', 'GV-001', 'Central', '123 Oak Street', 'Springfield', 'IL', 'active'),
(2, 'Red Rose Academy', 'Mr. Robert Smith', '555-0102', 'info@redrose.edu', 'RR-001', 'North', '456 Elm Street', 'Springfield', 'IL', 'active'),
(3, 'Sunny Days Learning Center', 'Mrs. Patricia Brown', '555-0103', 'info@sunnydays.edu', 'SD-001', 'South', '789 Maple Street', 'Springfield', 'IL', 'active');

-- ============================================================
-- INSERT SAMPLE STUDENTS
-- ============================================================
INSERT INTO students (id, uuid, first_name, last_name, gender, dob, primary_guardian_name, primary_guardian_email, institution, grade, status) VALUES
(1, '550e8400-e29b-41d4-a716-446655440000', 'Kesley', 'Howley', 'Female', '2021-09-15', 'Karen Howley', 'khowley@email.com', 'Green Valley Preschool', 'K4', 'active'),
(2, '550e8400-e29b-41d4-a716-446655440001', 'Harriett', 'Halloran', 'Female', '2021-12-08', 'Patricia Halloran', 'phalloran@email.com', 'Green Valley Preschool', 'K4', 'active'),
(3, '550e8400-e29b-41d4-a716-446655440002', 'Elladine', 'Domerque', 'Male', '2022-08-21', 'Michael Domerque', 'mdomerque@email.com', 'Red Rose Academy', 'K3', 'active'),
(4, '550e8400-e29b-41d4-a716-446655440003', 'James', 'Wilson', 'Male', '2022-05-10', 'David Wilson', 'dwilson@email.com', 'Sunny Days Learning Center', 'K4', 'active'),
(5, '550e8400-e29b-41d4-a716-446655440004', 'Emma', 'Davis', 'Female', '2022-03-22', 'Jennifer Davis', 'jdavis@email.com', 'Green Valley Preschool', 'K3', 'active');

-- ============================================================
-- VERIFICATION
-- ============================================================
SELECT 'Database ready!' as status;
