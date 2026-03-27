import json
import os
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlparse
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

import mysql.connector
import jwt
from password_utils import hash_password, verify_password

SERVER_PORT = int(os.getenv("SERVER_PORT", "3080"))
SERVER_HOST = os.getenv("SERVER_HOST", "localhost")
JWT_SECRET = os.getenv("JWT_SECRET", "your_secret_key_change_in_production")

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "crossover.proxy.rlwy.net"),
    "port": int(os.getenv("DB_PORT", "45313")),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", "ZpoYKIqgmCSAXVHuyuEDNshvrVlagCAV"),
    "database": os.getenv("DB_NAME", "railway"),
}


def create_token(username, role):
    """Generate JWT token valid for 24 hours"""
    payload = {
        'username': username,
        'role': role,
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def verify_token(token):
    """Verify JWT token and return payload"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def fetch_all(query: str, params: Optional[tuple] = None) -> List[Dict[str, Any]]:
    conn = mysql.connector.connect(**DB_CONFIG)
    cur = conn.cursor(dictionary=True)
    cur.execute(query, params or ())
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return rows  # type: ignore


def execute_query(query, params=None):
    """Execute INSERT/UPDATE/DELETE queries"""
    conn = mysql.connector.connect(**DB_CONFIG)
    cur = conn.cursor()
    cur.execute(query, params or ())
    conn.commit()
    result = {"rows_affected": cur.rowcount}
    cur.close()
    conn.close()
    return result


class SimpleServer(BaseHTTPRequestHandler):
    def _set_headers(self, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "*")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers()

    def do_GET(self):
        path = self.path
        print(path)

        # Extract token from Authorization header
        auth_header = self.headers.get('Authorization', '')
        token = auth_header.replace('Bearer ', '') if auth_header.startswith('Bearer ') else None

        # Verify token for protected endpoints
        if not path.startswith('/api/auth/'):
            if not token or not verify_token(token):
                self._set_headers(401)
                self.wfile.write(json.dumps({'error': 'Unauthorized: Invalid or missing token'}).encode())
                return

        if path.startswith("/api/institution/studentRoster"):
            parsed_url = urlparse(path)
            params = parse_qs(parsed_url.query)

            institution_name = params.get("institution", [None])[0]
            if not institution_name:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "Institution parameter required"}).encode("utf-8"))
                return

            roster = fetch_all(
                """
                SELECT
                    id,
                    uuid,
                    first_name,
                    last_name,
                    primary_guardian_email,
                    gender,
                    dob,
                    institution_code,
                    grade
                FROM students
                WHERE institution_code = %s
                ORDER BY id
                """,
                (institution_name,),
            )
            self._set_headers()
            self.wfile.write(json.dumps(roster).encode("utf-8"))
            return

        match path:
            case "/api/students":
                students = fetch_all(
                    """
                    SELECT
                        id,
                        uuid,
                        first_name,
                        last_name,
                        primary_guardian_email,
                        gender,
                        dob,
                        institution_code,
                        grade
                    FROM students
                    ORDER BY id
                    """
                )
                self._set_headers()
                self.wfile.write(json.dumps(students).encode("utf-8"))

            case "/api/institutions":
                institutions = fetch_all(
                    """
                    SELECT
                        id,
                        institution_code,
                        school,
                        principal,
                        phone,
                        district,
                        address,
                        city
                    FROM institutions
                    ORDER BY institution_code
                    """
                )
                self._set_headers()
                self.wfile.write(json.dumps(institutions).encode("utf-8"))

            case "/api/grades":
                grades = fetch_all(
                    """
                    SELECT
                        student_id AS id,
                        fine_motor,
                        gross_motor,
                        social_emotional,
                        early_literacy,
                        early_numeracy,
                        independence,
                        school_year,
                        grading_quarter
                    FROM grades
                    ORDER BY student_id, school_year, grading_quarter
                    """
                )
                self._set_headers()
                self.wfile.write(json.dumps(grades).encode("utf-8"))

            case "/api/attendance":
                attendance = fetch_all(
                    """
                    SELECT
                        student_id AS id,
                        attendence_date AS date,
                        status_code AS status
                    FROM student_attendance
                    ORDER BY attendence_date, student_id
                    """
                )
                self._set_headers()
                self.wfile.write(json.dumps(attendance).encode("utf-8"))

            case "/api/attendance-mapping":
                mapping = fetch_all(
                    """
                    SELECT
                        enum_code,
                        label
                    FROM attendance_status_mapping
                    ORDER BY enum_code
                    """
                )
                self._set_headers()
                self.wfile.write(json.dumps(mapping).encode("utf-8"))

            case "/api/admin/dashboard-stats":
                # Admin dashboard overall statistics
                try:
                    # Get total counts
                    total_students = fetch_all("SELECT COUNT(*) as count FROM students")[0]['count']
                    total_institutions = fetch_all("SELECT COUNT(*) as count FROM institutions")[0]['count']
                    
                    # Get current quarter/year (assume current data)
                    latest_quarter = fetch_all(
                        "SELECT MAX(grading_quarter) as quarter, MAX(school_year) as year FROM grades"
                    )[0]
                    current_quarter = latest_quarter['quarter'] or 1
                    current_year = latest_quarter['year'] or 2024
                    
                    # Calculate average attendance (last 30 days)
                    cutoff_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
                    attendance_data = fetch_all(
                        f"""
                        SELECT 
                            SUM(CASE WHEN status_code = 1 THEN 1 ELSE 0 END) as present,
                            COUNT(*) as total
                        FROM student_attendance
                        WHERE attendence_date >= '{cutoff_date}'
                        """
                    )[0]
                    
                    avg_attendance = round((attendance_data['present'] / max(attendance_data['total'], 1)) * 100, 1)
                    
                    # Get competency distribution (current quarter)
                    competencies = ['fine_motor', 'gross_motor', 'social_emotional', 'early_literacy', 'early_numeracy', 'independence']
                    competency_dist = {}
                    
                    for comp in competencies:
                        comp_data = fetch_all(
                            f"""
                            SELECT 
                                SUM(CASE WHEN {comp} = 'Emerging' THEN 1 ELSE 0 END) as emerging,
                                SUM(CASE WHEN {comp} = 'Developing' THEN 1 ELSE 0 END) as developing,
                                SUM(CASE WHEN {comp} = 'Proficient' THEN 1 ELSE 0 END) as proficient,
                                COUNT(*) as total
                            FROM grades
                            WHERE school_year = %s AND grading_quarter = %s
                            """,
                            (current_year, current_quarter)
                        )[0]
                        
                        competency_dist[comp] = {
                            'emerging': comp_data['emerging'] or 0,
                            'developing': comp_data['developing'] or 0,
                            'proficient': comp_data['proficient'] or 0,
                            'total': comp_data['total'] or 0
                        }
                    
                    # Get institution stats
                    institution_stats = fetch_all(
                        """
                        SELECT 
                            i.id,
                            i.institution_code,
                            i.school,
                            COUNT(DISTINCT s.id) as student_count
                        FROM institutions i
                        LEFT JOIN students s ON i.institution_code = s.institution_code
                        GROUP BY i.id, i.institution_code, i.school
                        ORDER BY i.institution_code
                        """
                    )
                    
                    # Add attendance % for each institution
                    for inst in institution_stats:
                        inst_attendance = fetch_all(
                            f"""
                            SELECT 
                                SUM(CASE WHEN sa.status_code = 1 THEN 1 ELSE 0 END) as present,
                                COUNT(*) as total
                            FROM student_attendance sa
                            JOIN students s ON sa.student_id = s.id
                            WHERE s.institution_code = %s AND sa.attendence_date >= '{cutoff_date}'
                            """,
                            (inst['institution_code'],)
                        )[0]
                        inst['attendance_percent'] = round((inst_attendance['present'] / max(inst_attendance['total'], 1)) * 100, 1) if inst_attendance['total'] > 0 else 0
                    
                    stats = {
                        'totalStudents': total_students,
                        'totalInstitutions': total_institutions,
                        'avgAttendance': avg_attendance,
                        'currentQuarter': current_quarter,
                        'currentYear': current_year,
                        'competencyDistribution': competency_dist,
                        'institutionStats': institution_stats
                    }
                    
                    self._set_headers()
                    self.wfile.write(json.dumps(stats).encode("utf-8"))
                except Exception as e:
                    self._set_headers(500)
                    self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))

            case _:
                # Check if path matches /api/institutions/{id}/detail
                if "/api/institutions/" in path and "/detail" in path:
                    try:
                        institution_id = path.split("/api/institutions/")[1].split("/detail")[0]
                        
                        # Get institution info
                        inst_info = fetch_all(
                            "SELECT * FROM institutions WHERE id = %s",
                            (institution_id,)
                        )
                        
                        if not inst_info:
                            self._set_headers(404)
                            self.wfile.write(json.dumps({"error": "Institution not found"}).encode("utf-8"))
                            return
                        
                        inst = inst_info[0]
                        
                        # Get students in this institution
                        students = fetch_all(
                            "SELECT id, first_name, last_name, grade FROM students WHERE institution_code = %s ORDER BY grade, last_name",
                            (inst['institution_code'],)
                        )
                        
                        # Get attendance for this institution
                        cutoff_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
                        attendance_stats = fetch_all(
                            f"""
                            SELECT 
                                SUM(CASE WHEN sa.status_code = 1 THEN 1 ELSE 0 END) as present,
                                COUNT(*) as total
                            FROM student_attendance sa
                            JOIN students s ON sa.student_id = s.id
                            WHERE s.institution_code = %s AND sa.attendence_date >= '{cutoff_date}'
                            """,
                            (inst['institution_code'],)
                        )[0]
                        
                        inst_attendance = round((attendance_stats['present'] / max(attendance_stats['total'], 1)) * 100, 1) if attendance_stats['total'] > 0 else 0
                        
                        detail = {
                            'institution': inst,
                            'studentCount': len(students),
                            'attendancePercent': inst_attendance,
                            'students': students
                        }
                        
                        self._set_headers()
                        self.wfile.write(json.dumps(detail).encode("utf-8"))
                    except Exception as e:
                        self._set_headers(500)
                        self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
                
                # Check if path matches /api/students/{id}/history
                elif "/api/students/" in path and "/history" in path:
                    try:
                        student_id = path.split("/api/students/")[1].split("/history")[0]
                        
                        # Get student info
                        student_info = fetch_all(
                            "SELECT * FROM students WHERE id = %s",
                            (student_id,)
                        )
                        
                        if not student_info:
                            self._set_headers(404)
                            self.wfile.write(json.dumps({"error": "Student not found"}).encode("utf-8"))
                            return
                        
                        student = student_info[0]
                        
                        # Get attendance history
                        attendance = fetch_all(
                            """
                            SELECT attendence_date as date, status_code as status
                            FROM student_attendance
                            WHERE student_id = %s
                            ORDER BY attendence_date DESC
                            """,
                            (student_id,)
                        )
                        
                        # Get grades history
                        grades = fetch_all(
                            """
                            SELECT 
                                school_year, grading_quarter,
                                fine_motor, gross_motor, social_emotional,
                                early_literacy, early_numeracy, independence
                            FROM grades
                            WHERE student_id = %s
                            ORDER BY school_year DESC, grading_quarter DESC
                            """,
                            (student_id,)
                        )
                        
                        # Calculate attendance percentage
                        if attendance:
                            present_count = sum(1 for att in attendance if att['status'] == 1)
                            attendance_percent = round((present_count / len(attendance)) * 100, 1)
                        else:
                            attendance_percent = 0
                        
                        history = {
                            'student': student,
                            'attendancePercent': attendance_percent,
                            'attendanceHistory': attendance,
                            'gradesHistory': grades
                        }
                        
                        self._set_headers()
                        self.wfile.write(json.dumps(history).encode("utf-8"))
                    except Exception as e:
                        self._set_headers(500)
                        self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
                
                else:
                    self._set_headers(404)
                    self.wfile.write(json.dumps({"error": "Not Found"}).encode("utf-8"))

    def do_POST(self):
        path = self.path
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length).decode("utf-8")

        # Extract token from Authorization header
        auth_header = self.headers.get('Authorization', '')
        token = auth_header.replace('Bearer ', '') if auth_header.startswith('Bearer ') else None

        match path:
            case "/api/auth/login":
                try:
                    data = json.loads(body)
                    username = data.get('username', '')
                    password = data.get('password', '')
                    
                    if not username or not password:
                        self._set_headers(400)
                        self.wfile.write(json.dumps({'error': 'Username and password required'}).encode())
                        return
                    
                    # Get user from database
                    users = fetch_all(
                        "SELECT id, username, password, role FROM users WHERE username = %s",
                        (username,)
                    )
                    
                    if users and len(users) > 0:
                        user = users[0]
                        # Verify password hash
                        if verify_password(user['password'], password):
                            token = create_token(user['username'], user['role'])
                            self._set_headers(200)
                            self.wfile.write(json.dumps({
                                'token': token, 
                                'role': user['role'],
                                'username': user['username']
                            }).encode())
                        else:
                            self._set_headers(401)
                            self.wfile.write(json.dumps({'error': 'Invalid password'}).encode())
                    else:
                        self._set_headers(401)
                        self.wfile.write(json.dumps({'error': 'User not found'}).encode())
                except Exception as e:
                    self._set_headers(400)
                    self.wfile.write(json.dumps({'error': str(e)}).encode())

            case "/api/auth/signup":
                try:
                    data = json.loads(body)
                    username = data.get('username', '').strip()
                    password = data.get('password', '')
                    role = data.get('role', 'teacher')  # Default role is teacher
                    
                    # Validation
                    if not username or len(username) < 3:
                        self._set_headers(400)
                        self.wfile.write(json.dumps({'error': 'Username must be at least 3 characters'}).encode())
                        return
                    
                    if not password or len(password) < 6:
                        self._set_headers(400)
                        self.wfile.write(json.dumps({'error': 'Password must be at least 6 characters'}).encode())
                        return
                    
                    # Check if user already exists
                    existing = fetch_all(
                        "SELECT id FROM users WHERE username = %s",
                        (username,)
                    )
                    
                    if existing:
                        self._set_headers(409)
                        self.wfile.write(json.dumps({'error': 'Username already taken'}).encode())
                        return
                    
                    # Hash password
                    hashed_password = hash_password(password)
                    
                    # Create user in database
                    execute_query(
                        "INSERT INTO users (username, password, role) VALUES (%s, %s, %s)",
                        (username, hashed_password, role)
                    )
                    
                    # Create token and return
                    token = create_token(username, role)
                    self._set_headers(201)
                    self.wfile.write(json.dumps({
                        'token': token,
                        'role': role,
                        'username': username,
                        'message': 'Account created successfully'
                    }).encode())
                    
                except Exception as e:
                    self._set_headers(400)
                    self.wfile.write(json.dumps({'error': str(e)}).encode())

            case "/api/attendance/record":
                # Verify token for protected endpoint
                if not token or not verify_token(token):
                    self._set_headers(401)
                    self.wfile.write(json.dumps({'error': 'Unauthorized'}).encode())
                    return
                
                try:
                    data = json.loads(body)
                    student_id = data.get('student_id')
                    attendance_date = data.get('date')
                    status_code = data.get('status')
                    
                    execute_query(
                        """
                        INSERT INTO student_attendance (student_id, attendence_date, status_code)
                        VALUES (%s, %s, %s)
                        ON DUPLICATE KEY UPDATE status_code = %s
                        """,
                        (student_id, attendance_date, status_code, status_code)
                    )
                    
                    self._set_headers(201)
                    self.wfile.write(json.dumps({'success': True, 'message': 'Attendance recorded'}).encode())
                except Exception as e:
                    self._set_headers(400)
                    self.wfile.write(json.dumps({'error': str(e)}).encode())

            case "/api/grades/record":
                # Verify token for protected endpoint
                if not token or not verify_token(token):
                    self._set_headers(401)
                    self.wfile.write(json.dumps({'error': 'Unauthorized'}).encode())
                    return
                
                try:
                    data = json.loads(body)
                    student_id = int(data.get('student_id', 0))
                    school_year = int(data.get('school_year', 0))
                    grading_quarter_str = data.get('grading_quarter', 'Q1')
                    
                    # Convert Q1/Q2/Q3/Q4 to 1/2/3/4
                    quarter_map = {'Q1': 1, 'Q2': 2, 'Q3': 3, 'Q4': 4}
                    grading_quarter = quarter_map.get(grading_quarter_str, 1)
                    
                    # Convert numerical grades to text descriptors
                    def grade_to_text(score):
                        if score == '' or score is None:
                            return None
                        try:
                            score = int(score)
                            if score >= 80:
                                return 'Proficient'
                            elif score >= 60:
                                return 'Developing'
                            else:
                                return 'Emerging'
                        except:
                            return None
                    
                    fine_motor = grade_to_text(data.get('fine_motor'))
                    gross_motor = grade_to_text(data.get('gross_motor'))
                    social_emotional = grade_to_text(data.get('social_emotional'))
                    early_literacy = grade_to_text(data.get('early_literacy'))
                    early_numeracy = grade_to_text(data.get('early_numeracy'))
                    independence = grade_to_text(data.get('independence'))
                    
                    execute_query(
                        """
                        INSERT INTO grades (student_id, fine_motor, gross_motor, social_emotional, 
                                          early_literacy, early_numeracy, independence, 
                                          school_year, grading_quarter)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON DUPLICATE KEY UPDATE
                            fine_motor = %s, gross_motor = %s, social_emotional = %s,
                            early_literacy = %s, early_numeracy = %s, independence = %s
                        """,
                        (student_id, fine_motor, gross_motor, social_emotional,
                         early_literacy, early_numeracy, independence,
                         school_year, grading_quarter,
                         fine_motor, gross_motor, social_emotional,
                         early_literacy, early_numeracy, independence)
                    )
                    
                    self._set_headers(201)
                    self.wfile.write(json.dumps({'success': True, 'message': 'Grades recorded'}).encode())
                except Exception as e:
                    self._set_headers(400)
                    self.wfile.write(json.dumps({'error': str(e)}).encode())

            case _:
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "Not Found"}).encode("utf-8"))


def run(host=SERVER_HOST, port=SERVER_PORT):
    server = HTTPServer((host, port), SimpleServer)
    print(f"Mock server running on http://{host}:{port}")
    server.serve_forever()


if __name__ == "__main__":
    print("🚀 Starting TCXR Cares Backend...")
    print("📊 Database: Using external MySQL with phpMyAdmin access")
    print("✅ Ready to accept connections")
    run()
