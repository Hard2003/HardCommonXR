#!/usr/bin/env python3
"""
Export from local Docker MySQL and import to Railway MySQL
"""
import mysql.connector
import subprocess

print("=" * 60)
print("STEP 1: Connecting to LOCAL Docker MySQL...")
print("=" * 60)

local_config = {
    'host': 'localhost',
    'port': 3307,
    'user': 'admin',
    'password': 'admin123',
    'database': 'tcxr_cares'
}

try:
    local_conn = mysql.connector.connect(**local_config)
    local_cursor = local_conn.cursor()
    
    # Get all tables
    local_cursor.execute("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='tcxr_cares'")
    tables = [row[0] for row in local_cursor.fetchall()]
    print(f"\n✓ Found {len(tables)} tables: {', '.join(tables)}")
    
    # Get row counts
    print("\nTable row counts:")
    for table in tables:
        local_cursor.execute(f"SELECT COUNT(*) FROM {table}")
        count = local_cursor.fetchone()[0]
        print(f"  {table}: {count} rows")
    
    local_cursor.close()
    local_conn.close()
    
except Exception as e:
    print(f"❌ Error connecting to local MySQL: {e}")
    exit(1)

print("\n" + "=" * 60)
print("STEP 2: Connecting to RAILWAY MySQL...")
print("=" * 60)

railway_config = {
    'host': 'crossover.proxy.rlwy.net',
    'port': 45313,
    'user': 'root',
    'password': 'ZpoYKIqgmCSAXVHuyuEDNshvrVlagCAV',
    'database': 'railway'
}

try:
    railway_conn = mysql.connector.connect(**railway_config)
    railway_cursor = railway_conn.cursor()
    print("✓ Connected to Railway MySQL!")
    
except Exception as e:
    print(f"❌ Error connecting to Railway MySQL: {e}")
    exit(1)

print("\n" + "=" * 60)
print("STEP 3: Recreating tables on Railway...")
print("=" * 60)

# Reconnect to local and get CREATE TABLE statements
local_conn = mysql.connector.connect(**local_config)
local_cursor = local_conn.cursor()

# Create tables in dependency order (students before grades and attendance)
table_order = ['attendance_status_mapping', 'institutions', 'students', 'grades', 'student_attendance', 'users']

for table in table_order:
    if table not in tables:
        continue
    try:
        local_cursor.execute(f"SHOW CREATE TABLE {table}")
        result = local_cursor.fetchone()
        create_statement = result[1]
        
        # Try to create on Railway
        try:
            railway_cursor.execute(f"DROP TABLE IF EXISTS {table};")
            railway_cursor.execute(create_statement)
            railway_conn.commit()
            print(f"  ✓ Created table: {table}")
        except Exception as e:
            print(f"  ⚠ Error creating {table}: {e}")
    except Exception as e:
        print(f"  ❌ Error reading {table} structure: {e}")

local_cursor.close()

print("\n" + "=" * 60)
print("STEP 4: Copying data from local to Railway...")
print("=" * 60)

# Get data from local and insert to Railway - use a separate cursor for SELECT
local_select_cursor = local_conn.cursor()

for table in table_order:
    if table not in tables:
        continue
    try:
        # Get all data
        local_select_cursor.execute(f"SELECT * FROM {table}")
        rows = local_select_cursor.fetchall()
        
        if rows:
            # Get column count
            col_count = len(local_select_cursor.description)
            placeholders = ', '.join(['%s'] * col_count)
            
            # Insert data in batches
            batch_size = 100
            for i in range(0, len(rows), batch_size):
                batch = rows[i:i+batch_size]
                try:
                    railway_cursor.executemany(
                        f"INSERT INTO {table} VALUES ({placeholders})",
                        batch
                    )
                    railway_conn.commit()
                except Exception as e:
                    print(f"  ⚠ Error inserting batch into {table}: {e}")
            
            print(f"  ✓ Copied {len(rows)} rows to {table}")
        else:
            print(f"  ✓ Table {table} is empty")
    except Exception as e:
        print(f"  ❌ Error copying {table}: {e}")

local_select_cursor.close()
local_conn.close()

print("\n" + "=" * 60)
print("STEP 5: Verifying Railway database...")
print("=" * 60)

railway_cursor.execute("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='railway'")
railway_tables = [row[0] for row in railway_cursor.fetchall()]
print(f"\n✓ Found {len(railway_tables)} tables on Railway: {', '.join(railway_tables)}")

print("\nRailway table row counts:")
for table in railway_tables:
    railway_cursor.execute(f"SELECT COUNT(*) FROM {table}")
    count = railway_cursor.fetchone()[0]
    print(f"  {table}: {count} rows")

railway_cursor.close()
railway_conn.close()

print("\n" + "=" * 60)
print("✅ SUCCESS! Database synced to Railway!")
print("=" * 60)
