"""
Database initialization module for TCXR Cares
Automatically creates tables and loads test data on first startup
"""

import json
import os
import mysql.connector
from mysql.connector import Error

def init_database():
    """Initialize database with schema and test data"""
    
    db_config = {
        "host": os.getenv("DB_HOST", "localhost"),
        "port": int(os.getenv("DB_PORT", "3307")),
        "user": os.getenv("DB_USER", "admin"),
        "password": os.getenv("DB_PASSWORD", "admin123"),
        "database": os.getenv("DB_NAME", "tcxr_cares"),
    }
    
    try:
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor()
        
        # Check if already initialized
        cursor.execute("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = %s", (db_config['database'],))
        if cursor.fetchone()[0] > 0:
            print("✓ Database already initialized, skipping...")
            cursor.close()
            connection.close()
            return
        
        print("📋 Creating database tables...")
        
        # Create users table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        
        # Create institutions table
        cursor.execute("""
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
        """)
        
        # Create students table
        cursor.execute("""
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
        """)
        
        # Create grades table
        cursor.execute("""
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
        """)
        
        # Create attendance table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS attendance (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT,
            institution VARCHAR(100),
            date VARCHAR(20),
            status VARCHAR(50),
            FOREIGN KEY (student_id) REFERENCES students(id),
            FOREIGN KEY (institution) REFERENCES institutions(institution)
        )
        """)
        
        # Create attendance mapping table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS attendance_mapping (
            id INT AUTO_INCREMENT PRIMARY KEY,
            status_key VARCHAR(50),
            status_value VARCHAR(50)
        )
        """)
        
        connection.commit()
        print("✅ Tables created successfully")
        
        # Load default users
        print("🔐 Creating default users...")
        users = [("admin", "admin123", "admin"), ("teacher", "teacher123", "teacher")]
        for username, password, role in users:
            try:
                cursor.execute("INSERT INTO users (username, password, role) VALUES (%s, %s, %s)", 
                              (username, password, role))
            except:
                pass  # User might already exist
        
        connection.commit()
        print("✅ Default users created")
        
        # Load test data from JSON files
        base_path = os.path.join(os.path.dirname(__file__), "testdata")
        
        try:
            # Load institutions
            print("👥 Loading institutions...")
            with open(os.path.join(base_path, "institutionlist.json")) as f:
                institutions = json.load(f)
                for inst in institutions:
                    try:
                        cursor.execute("""
                        INSERT INTO institutions 
                        (institution, principal, phone, school, district, address, city)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                        """, (
                            inst.get("institution"),
                            inst.get("principal"),
                            inst.get("phone"),
                            inst.get("school"),
                            inst.get("district"),
                            inst.get("address"),
                            inst.get("city")
                        ))
                    except:
                        pass
            
            # Load students
            print("🎓 Loading students...")
            with open(os.path.join(base_path, "studentlist.json")) as f:
                students = json.load(f)
                for student in students:
                    cursor.execute("""
                    INSERT INTO students 
                    (uuid, first_name, last_name, gender, dob, primary_guardian_email, institution, grade)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        student.get("uuid"),
                        student.get("first_name"),
                        student.get("last_name"),
                        student.get("gender"),
                        student.get("dob"),
                        student.get("primary_guardian_email"),
                        student.get("institution"),
                        student.get("grade")
                    ))
            
            # Load grades
            print("📊 Loading grades...")
            with open(os.path.join(base_path, "grades.json")) as f:
                grades = json.load(f)
                for i, grade in enumerate(grades):
                    cursor.execute("""
                    INSERT INTO grades 
                    (student_id, fine_motor, gross_motor, social_emotional, early_literacy, 
                     early_numeracy, independence, school_year, grading_quarter)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        i + 1,
                        grade.get("fine_motor"),
                        grade.get("gross_motor"),
                        grade.get("social_emotional"),
                        grade.get("early_literacy"),
                        grade.get("early_numeracy"),
                        grade.get("independence"),
                        grade.get("school_year"),
                        grade.get("grading_quarter")
                    ))
            
            # Load attendance
            print("✅ Loading attendance...")
            with open(os.path.join(base_path, "student_attendance.json")) as f:
                attendance = json.load(f)
                for att in attendance:
                    try:
                        cursor.execute("""
                        INSERT INTO attendance 
                        (student_id, institution, date, status)
                        VALUES (%s, %s, %s, %s)
                        """, (
                            att.get("id", 1),
                            att.get("institution"),
                            att.get("date"),
                            att.get("status")
                        ))
                    except:
                        pass
            
            # Load attendance mapping
            print("🗺️  Loading attendance mapping...")
            with open(os.path.join(base_path, "attendance_enum_mapping.json")) as f:
                mapping = json.load(f)
                for key, value in mapping.items():
                    try:
                        cursor.execute("INSERT INTO attendance_mapping (status_key, status_value) VALUES (%s, %s)",
                                      (key, value))
                    except:
                        pass
            
            connection.commit()
            print("✅ All test data loaded successfully!")
            
        except FileNotFoundError as e:
            print(f"⚠️  Test data files not found (this is OK for production): {e}")
            connection.commit()
        
        cursor.close()
        connection.close()
        
    except Error as e:
        print(f"⚠️  Database initialization skipped (will retry on next restart): {e}")

if __name__ == "__main__":
    init_database()
