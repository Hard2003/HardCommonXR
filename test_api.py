import urllib.request, json, urllib.error

data = json.dumps({'username': 'testuser2025', 'password': 'password123', 'role': 'teacher'}).encode()
req = urllib.request.Request('http://localhost:3080/api/auth/signup', data=data, headers={'Content-Type': 'application/json'})

try:
    resp = urllib.request.urlopen(req)
    print("SUCCESS:", resp.read().decode())
except urllib.error.HTTPError as e:
    print(f"HTTP {e.code}:", e.read().decode())
except Exception as e:
    print(f"Error: {e}")
