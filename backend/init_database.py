#!/usr/bin/env python3
"""
Initialize Railway MySQL database with schema and test data
Run this script to populate the database with all necessary tables and data
"""

import json
import os
import mysql.connector
from mysql.connector import Error

# Get database credentials from environment variables or use defaults
db_config = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", "3306")),
    "user": os.getenv("DB_USER", "admin"),
    "password": os.getenv("DB_PASSWORD", "admin123"),
    "database": os.getenv("DB_NAME", "tcxr_cares"),
}

def execute_query(connection, query, data=None):
    """Execute a single query"""
    cursor = connection.cursor()
    try:
        if data:
            cursor.execute(query, data)
        else:
            cursor.execute(query)
        connection.commit()
        print(f"✓ Executed: {query[:80]}...")
        return cursor.rowcount
    except Error as e:
        print(f"✗ Error: {e}")
        connection.rollback()
        return 0
    finally:
        cursor.close()

def create_tables(connection):
    """Create database tables"""
    print("\n📋 Creating tables...")
    
    # Users table
    users_table = """
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """
    execute_query(connection, users_table)
    
    # Institutions table
    institutions_table = """
    CREATE TABLE IF NOT EXISTS institutions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        institution VARCHAR(100) UNIQUE NOT NULL,
        principal VARCHAR(255),
        phone VARCHAR(20),
        school VARCHAR(100),
        district INT,
        address VARCHAR(255),
        city VARCHAR(100)
    )
    """
    execute_query(connection, institutions_table)
    
    # Students table
    students_table = """
    CREATE TABLE IF NOT EXISTS students (
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
    )
    """
    execute_query(connection, students_table)
    
    # Grades table
    grades_table = """
    CREATE TABLE IF NOT EXISTS grades (
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
    )
    """
    execute_query(connection, grades_table)
    
    # Attendance table
    attendance_table = """
    CREATE TABLE IF NOT EXISTS attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT,
        institution VARCHAR(100),
        date VARCHAR(20),
        status VARCHAR(50),
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (institution) REFERENCES institutions(institution)
    )
    """
    execute_query(connection, attendance_table)
    
    # Attendance mapping table
    mapping_table = """
    CREATE TABLE IF NOT EXISTS attendance_mapping (
        id INT AUTO_INCREMENT PRIMARY KEY,
        status_key VARCHAR(50),
        status_value VARCHAR(50)
    )
    """
    execute_query(connection, mapping_table)

def load_data(connection):
    """Load test data from JSON files"""
    base_path = os.path.join(os.path.dirname(__file__), "testdata")
    
    # Load institutions
    print("\n👥 Loading institutions...")
    with open(os.path.join(base_path, "institutionlist.json")) as f:
        institutions = json.load(f)
        for inst in institutions:
            query = """
            INSERT IGNORE INTO institutions 
            (institution, principal, phone, school, district, address, city)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            data = (
                inst.get("institution"),
                inst.get("principal"),
                inst.get("phone"),
                inst.get("school"),
                inst.get("district"),
                inst.get("address"),
                inst.get("city")
            )
            execute_query(connection, query, data)
    
    # Load students
    print("\n🎓 Loading students...")
    with open(os.path.join(base_path, "studentlist.json")) as f:
        students = json.load(f)
        for student in students:
            query = """
            INSERT INTO students 
            (uuid, first_name, last_name, gender, dob, primary_guardian_email, institution, grade)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            data = (
                student.get("uuid"),
                student.get("first_name"),
                student.get("last_name"),
                student.get("gender"),
                student.get("dob"),
                student.get("primary_guardian_email"),
                student.get("institution"),
                student.get("grade")
            )
            execute_query(connection, query, data)
    
    # Load grades
    print("\n📊 Loading grades...")
    with open(os.path.join(base_path, "grades.json")) as f:
        grades = json.load(f)
        for i, grade in enumerate(grades):
            query = """
            INSERT INTO grades 
            (student_id, fine_motor, gross_motor, social_emotional, early_literacy, 
             early_numeracy, independence, school_year, grading_quarter)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            data = (
                i + 1,
                grade.get("fine_motor"),
                grade.get("gross_motor"),
                grade.get("social_emotional"),
                grade.get("early_literacy"),
                grade.get("early_numeracy"),
                grade.get("independence"),
                grade.get("school_year"),
                grade.get("grading_quarter")
            )
            execute_query(connection, query, data)
    
    # Load attendance
    print("\n✅ Loading attendance...")
    with open(os.path.join(base_path, "student_attendance.json")) as f:
        attendance = json.load(f)
        for att in attendance:
            query = """
            INSERT INTO attendance 
            (student_id, institution, date, status)
            VALUES (%s, %s, %s, %s)
            """
            data = (
                att.get("id", 1),
                att.get("institution"),
                att.get("date"),
                att.get("status")
            )
            execute_query(connection, query, data)
    
    # Load attendance mapping
    print("\n🗺️  Loading attendance mapping...")
    with open(os.path.join(base_path, "attendance_enum_mapping.json")) as f:
        mapping = json.load(f)
        for key, value in mapping.items():
            query = "INSERT INTO attendance_mapping (status_key, status_value) VALUES (%s, %s)"
            data = (key, value)
            execute_query(connection, query, data)

def load_users(connection):
    """Load default admin and teacher users"""
    print("\n🔐 Creating default users...")
    
    users = [
        ("admin", "admin123", "admin"),
        ("teacher", "teacher123", "teacher"),
    ]
    
    for username, password, role in users:
        query = "INSERT IGNORE INTO users (username, password, role) VALUES (%s, %s, %s)"
        data = (username, password, role)
        execute_query(connection, query, data)

def main():
    """Main function"""
    print("🚀 TCXR Cares Database Initialization")
    print("=" * 50)
    
    try:
        # Connect to database
        print(f"\n📡 Connecting to {db_config['host']}:{db_config['port']}...")
        connection = mysql.connector.connect(**db_config)
        print("✓ Connected!")
        
        # Create tables
        create_tables(connection)
        
        # Load users
        load_users(connection)
        
        # Load data
        load_data(connection)
        
        # Verify
        cursor = connection.cursor()
        cursor.execute("SELECT COUNT(*) FROM students")
        student_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        cursor.close()
        
        print("\n" + "=" * 50)
        print(f"✅ Database initialized successfully!")
        print(f"   📚 {student_count} students loaded")
        print(f"   👤 {user_count} users created")
        print("\nTest Credentials:")
        print("   Admin: username=admin, password=admin123")
        print("   Teacher: username=teacher, password=teacher123")
        print("=" * 50)
        
        connection.close()
        
    except Error as e:
        print(f"\n❌ Connection failed: {e}")
        exit(1)

if __name__ == "__main__":
    main()
