import json
import mysql.connector
from datetime import datetime

DB_CONFIG = {
    "host": "localhost",
    "port": 3307,  # host port from docker-compose
    "user": "admin",
    "password": "admin123",
    "database": "tcxr_cares",
}

def parse_dob(dob_str):
    # JSON uses M/D/YYYY
    return datetime.strptime(dob_str, "%m/%d/%Y").date()

def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def main():
    conn = mysql.connector.connect(**DB_CONFIG)
    cur = conn.cursor()

    institutions = load_json("./backend/testdata/institutionlist.json")
    students = load_json("./backend/testdata/studentlist.json")
    grades = load_json("./backend/testdata/grades.json")
    attendance = load_json("./backend/testdata/student_attendance.json")

    # 1) institutions first (parent table)
    for row in institutions:
        cur.execute(
            """
            INSERT INTO institutions
            (institution_code, school, principal, phone, district, address, city)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
              school = VALUES(school),
              principal = VALUES(principal),
              phone = VALUES(phone),
              district = VALUES(district),
              address = VALUES(address),
              city = VALUES(city)
            """,
            (
                row.get("institution"),
                row.get("school"),
                row.get("principal"),
                row.get("phone"),
                row.get("district"),
                row.get("address"),
                row.get("city"),
            ),
        )

    # 2) students next (depends on institutions)
    for row in students:
        cur.execute(
            """
            INSERT INTO students
            (id, uuid, first_name, last_name, primary_guardian_email, gender, dob, institution_code, grade)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
              uuid = VALUES(uuid),
              first_name = VALUES(first_name),
              last_name = VALUES(last_name),
              primary_guardian_email = VALUES(primary_guardian_email),
              gender = VALUES(gender),
              dob = VALUES(dob),
              institution_code = VALUES(institution_code),
              grade = VALUES(grade)
            """,
            (
                row.get("id"),
                row.get("uuid"),
                row.get("first_name"),
                row.get("last_name"),
                row.get("primary_guardian_email"),
                row.get("gender"),
                parse_dob(row.get("dob")),
                row.get("institution"),
                row.get("grade"),
            ),
        )

    # 3) grades (depends on students)
    for row in grades:
        cur.execute(
            """
            INSERT INTO grades
            (student_id, school_year, grading_quarter, fine_motor, gross_motor, social_emotional,
             early_literacy, early_numeracy, independence)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                row.get("id"),
                row.get("school_year"),
                row.get("grading_quarter"),
                row.get("fine_motor"),
                row.get("gross_motor"),
                row.get("social_emotional"),
                row.get("early_literacy"),
                row.get("early_numeracy"),
                row.get("independence"),
            ),
        )

    # 4) attendance last (depends on students + status mapping)
    for row in attendance:
        cur.execute(
            """
            INSERT INTO student_attendance
            (student_id, attendance_date, status_code)
            VALUES (%s, %s, %s)
            """,
            (
                row.get("id"),
                row.get("date"),
                row.get("status"),
            ),
        )

    conn.commit()

    # quick verification
    for table in ["institutions", "students", "grades", "student_attendance"]:
        cur.execute(f"SELECT COUNT(*) FROM {table}")
        print(f"{table}: {cur.fetchone()[0]} rows") # type: ignore

    cur.close()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    main()