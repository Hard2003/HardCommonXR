import json
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs

SERVER_PORT = 3080
# Load JSON files at startup
with open("./testdata/studentlist.json") as f:
    student_list = json.load(f)

with open("./testdata/institutionlist.json") as f:
    institution_list = json.load(f)

with open("./testdata/grades.json") as f:
    grades_data = json.load(f)

with open("./testdata/student_attendance.json") as f:
    attendance_data = json.load(f)

with open("./testdata/attendance_enum_mapping.json") as f:
    attendance_mapping = json.load(f)



class SimpleServer(BaseHTTPRequestHandler):

    def _set_headers(self, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "*")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.end_headers()

    # Handle OPTIONS (CORS preflight)
    def do_OPTIONS(self):
        self._set_headers()

    # ---------------------------
    # Handle GET routes
    # ---------------------------
    def do_GET(self):
        path = self.path
        print(path)
        
        # Handle query parameters for institution student roster
        if path.startswith("/api/institution/studentRoster"):
            # Parse query parameters using urlparse
            parsed_url = urlparse(path)
            params = parse_qs(parsed_url.query)
            
            institution_name = params.get("institution", [None])[0]
            if institution_name:
                print(f"Filtering students for institution: {institution_name}")
                # Filter students by institution
                filtered_students = [student for student in student_list if student.get("institution") == institution_name]
                print(f"Found {len(filtered_students)} students for {institution_name}")
                self._set_headers()
                self.wfile.write(json.dumps(filtered_students).encode("utf-8"))
                return
            else:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "Institution parameter required"}).encode("utf-8"))
                return
        
        match(path):
            case "/api/students":
                self._set_headers()
                self.wfile.write(json.dumps(student_list).encode("utf-8"))

            case "/api/institutions":
                self._set_headers()
                self.wfile.write(json.dumps(institution_list).encode("utf-8"))

            case "/api/grades":
                self._set_headers()
                self.wfile.write(json.dumps(grades_data).encode("utf-8"))

            case "/api/attendance":
                self._set_headers()
                self.wfile.write(json.dumps(attendance_data).encode("utf-8"))

            case "/api/attendance-mapping":
                self._set_headers()
                self.wfile.write(json.dumps(attendance_mapping).encode("utf-8"))

            case _:
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "Not Found"}).encode("utf-8"))

    # ---------------------------
    # Handle POST routes
    # ---------------------------
    def do_POST(self):
        path = self.path
        match(path):
            case "/api/students":
                # Read request body (if needed)
                content_length = int(self.headers.get("Content-Length", 0))
                post_body = self.rfile.read(content_length).decode("utf-8")

                # Mimic Express behavior: return empty JSON {}
                self._set_headers()
                self.wfile.write(json.dumps({}).encode("utf-8"))
            case _:
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "Not Found"}).encode("utf-8"))


# Run the server
def run(port=SERVER_PORT):
    server = HTTPServer(("localhost", port), SimpleServer)
    print(f"Mock server running on http://localhost:{port}")
    server.serve_forever()


if __name__ == "__main__":
    run()