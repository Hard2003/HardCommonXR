#!/usr/bin/env python3
"""
Direct database initialization script
Run this to create all tables and initialize users
"""

import os
import mysql.connector
from mysql.connector import Error
from password_utils import hash_password

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "mysql.railway.internal"),
    "port": int(os.getenv("DB_PORT", "3306")),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", "ZpoYKIqgmCSAXVHuyuEDNshvrVlagCAV"),
    "database": os.getenv("DB_NAME", "railway"),
}

def initialize():
    """Initialize database with all tables"""
    try:
        print("🔌 Connecting to database...")
        print(f"   Host: {DB_CONFIG['host']}")
        print(f"   Database: {DB_CONFIG['database']}")
        
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        print("✅ Connected to database!")

        # Create users table
        print("\n📋 Creating users table...")
        cursor.execute("""
        DROP TABLE IF EXISTS users
        """)
        cursor.execute("""
        CREATE TABLE users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        print("   ✅ users table created")

        # Create institutions table
        print("📋 Creating institutions table...")
        cursor.execute("""
        DROP TABLE IF EXISTS institutions
        """)
        cursor.execute("""
        CREATE TABLE institutions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            institution VARCHAR(100) UNIQUE NOT NULL,
            principal VARCHAR(255),
            phone VARCHAR(20),
            school VARCHAR(100),
            district INT,
            address VARCHAR(255),
            city VARCHAR(100)
        )
        """)
        print("   ✅ institutions table created")

        # Create students table
        print("📋 Creating students table...")
        cursor.execute("""
        DROP TABLE IF EXISTS students
        """)
        cursor.execute("""
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
        )
        """)
        print("   ✅ students table created")

        # Create grades table
        print("📋 Creating grades table...")
        cursor.execute("""
        DROP TABLE IF EXISTS grades
        """)
        cursor.execute("""
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
        )
        """)
        print("   ✅ grades table created")

        # Create attendance table
        print("📋 Creating attendance table...")
        cursor.execute("""
        DROP TABLE IF EXISTS attendance
        """)
        cursor.execute("""
        CREATE TABLE attendance (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT,
            institution VARCHAR(100),
            date VARCHAR(20),
            status VARCHAR(50),
            FOREIGN KEY (student_id) REFERENCES students(id),
            FOREIGN KEY (institution) REFERENCES institutions(institution)
        )
        """)
        print("   ✅ attendance table created")

        # Create attendance_mapping table
        print("📋 Creating attendance_mapping table...")
        cursor.execute("""
        DROP TABLE IF EXISTS attendance_mapping
        """)
        cursor.execute("""
        CREATE TABLE attendance_mapping (
            id INT AUTO_INCREMENT PRIMARY KEY,
            status_key VARCHAR(50),
            status_value VARCHAR(50)
        )
        """)
        print("   ✅ attendance_mapping table created")

        conn.commit()

        # Insert default users
        print("\n🔐 Creating default users...")
        hashed_admin = hash_password("admin123")
        hashed_teacher = hash_password("teacher123")

        cursor.execute(
            "INSERT INTO users (username, password, role) VALUES (%s, %s, %s)",
            ("admin", hashed_admin, "admin")
        )
        print("   ✅ Created admin user")

        cursor.execute(
            "INSERT INTO users (username, password, role) VALUES (%s, %s, %s)",
            ("teacher", hashed_teacher, "teacher")
        )
        print("   ✅ Created teacher user")

        conn.commit()
        cursor.close()
        conn.close()

        print("\n✅ ✅ ✅ DATABASE INITIALIZED SUCCESSFULLY! ✅ ✅ ✅")
        print("\n🎉 You can now login with:")
        print("   Username: admin   Password: admin123")
        print("   Username: teacher Password: teacher123")

    except Error as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    initialize()
