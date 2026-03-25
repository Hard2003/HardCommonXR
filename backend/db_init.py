import json
import os
import mysql.connector
from mysql.connector import Error
from password_utils import hash_password, is_password_hashed

def init_database():
    """Initialize database with schema and test data"""
    
    db_config = {
        "host": os.getenv("DB_HOST", "localhost"),
        "port": int(os.getenv("DB_PORT", "3307")),
        "user": os.getenv("DB_USER", "admin"),
        "password": os.getenv("DB_PASSWORD", "admin123"),
        "database": os.getenv("DB_NAME", "tcxr_cares"),
    }
    
    print(f"🔌 DB Config: host={db_config['host']}, port={db_config['port']}, user={db_config['user']}, db={db_config['database']}")
    
    try:
        connection = mysql.connector.connect(**db_config)
        print("✅ Database connected!")
        cursor = connection.cursor()
        
        # Check if already initialized
        cursor.execute("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = %s", (db_config['database'],))
        table_count = cursor.fetchone()[0]
        print(f"📊 Tables found: {table_count}")
        
        # Always create tables (CREATE TABLE IF NOT EXISTS is safe)
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
        
        # ALWAYS ensure default users exist - this is critical for login
        print("🔐 Ensuring default users exist...")
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        print(f"   Current users in database: {user_count}")
        
        if user_count == 0:
            print("   Users table is empty, inserting defaults...")
            users_to_create = [("admin", "admin123", "admin"), ("teacher", "teacher123", "teacher")]
            created_count = 0
            for username, password, role in users_to_create:
                try:
                    # Hash password before storing
                    hashed_pwd = hash_password(password)
                    cursor.execute("INSERT INTO users (username, password, role) VALUES (%s, %s, %s)", 
                                  (username, hashed_pwd, role))
                    created_count += 1
                    print(f"   ✅ Created user: {username}")
                except Error as e:
                    print(f"   ❌ Error creating user {username}: {e}")
                    import traceback
                    traceback.print_exc()
            
            connection.commit()
            print(f"✅ Created {created_count} default users")
            
            # Verify they were inserted
            cursor.execute("SELECT COUNT(*) FROM users")
            new_count = cursor.fetchone()[0]
            print(f"   ✅ Verification: Database now has {new_count} users")
        else:
            print(f"   ✓ Users already exist ({user_count}), no need to create defaults")
        
        # Now load test data
        print("📥 Loading test data from JSON files...")
        
        # Load test data from JSON files
        base_path = os.path.join(os.path.dirname(__file__), "testdata")
        
        try:
            # Load institutions
            print("👥 Loading institutions...")
            with open(os.path.join(base_path, "institutionlist.json")) as f:
                institutions = json.load(f)
                loaded = 0
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
                        loaded += 1
                    except Error as e:
                        pass  # Likely duplicate
                print(f"   ✅ Loaded {loaded} institutions")
            
            # Load students
            print("🎓 Loading students...")
            with open(os.path.join(base_path, "studentlist.json")) as f:
                students = json.load(f)
                loaded = 0
                for student in students:
                    try:
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
                        loaded += 1
                    except Error as e:
                        pass  # Likely duplicate
                print(f"   ✅ Loaded {loaded} students")
            
            # Load grades
            print("📊 Loading grades...")
            with open(os.path.join(base_path, "grades.json")) as f:
                grades = json.load(f)
                loaded = 0
                for i, grade in enumerate(grades):
                    try:
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
                        loaded += 1
                    except Error as e:
                        pass  # Likely duplicate
                print(f"   ✅ Loaded {loaded} grades")
            
            # Load attendance
            print("📅 Loading attendance...")
            with open(os.path.join(base_path, "student_attendance.json")) as f:
                attendance = json.load(f)
                loaded = 0
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
                        loaded += 1
                    except Error as e:
                        pass  # Likely duplicate
                print(f"   ✅ Loaded {loaded} attendance records")
            
            # Load attendance mapping
            print("🗺️  Loading attendance mapping...")
            with open(os.path.join(base_path, "attendance_enum_mapping.json")) as f:
                mapping = json.load(f)
                loaded = 0
                for key, value in mapping.items():
                    try:
                        cursor.execute("INSERT INTO attendance_mapping (status_key, status_value) VALUES (%s, %s)",
                                      (key, value))
                        loaded += 1
                    except Error as e:
                        pass  # Likely duplicate
                print(f"   ✅ Loaded {loaded} mappings")
            
            connection.commit()
            print("✅ All test data loaded successfully!")
            
        except FileNotFoundError as e:
            print(f"⚠️  Test data files not found: {e}")
            print("   (This is OK - database is still functional for login)")
            connection.commit()
        except Exception as e:
            print(f"⚠️  Error loading test data: {e}")
            import traceback
            traceback.print_exc()
            connection.commit()
        
        cursor.close()
        connection.close()
        print("✅ Database initialization complete!")
        
    except Error as e:
        print(f"❌ Database initialization ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    init_database()
