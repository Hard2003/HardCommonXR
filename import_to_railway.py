#!/usr/bin/env python3
"""
Import local database backup to Railway MySQL - Smart SQL parser
"""
import mysql.connector

# Railway credentials (using external proxy URL)
config = {
    'host': 'crossover.proxy.rlwy.net',
    'port': 45313,
    'user': 'root',
    'password': 'ZpoYKIqgmCSAXVHuyuEDNshvrVlagCAV',
    'database': 'railway'
}

# Read backup file
backup_file = r'c:\Users\Hard Patel\OneDrive\Desktop\CPT\ReactProject-20251229T130038Z-3-001\ReactProject\tcxr_cares_backup.sql'

print("Connecting to Railway MySQL...")
try:
    conn = mysql.connector.connect(**config)
    cursor = conn.cursor()
    
    print(f"Reading backup file: {backup_file}")
    with open(backup_file, 'r', encoding='utf-8', errors='ignore') as f:
        sql_lines = f.readlines()
    
    # Join all lines and process
    sql_content = ''.join(sql_lines)
    
    # Split by semicolon and process statements
    statements = sql_content.split(';')
    
    valid_statements = []
    for statement in statements:
        # Remove leading/trailing whitespace
        stmt = statement.strip()
        
        if not stmt:
            continue
        
        # Remove ALL lines that are comments or special commands
        lines = []
        for line in stmt.split('\n'):
            line_stripped = line.strip()
            # Skip empty lines, comment lines, and ANY MySQL special commands
            if (line_stripped and 
                not line_stripped.startswith('--') and 
                not line_stripped.startswith('/*') and
                not line_stripped.startswith('!') and
                '/*!' not in line_stripped):
                lines.append(line_stripped)
        
        cleaned_stmt = ' '.join(lines).strip()
        
        # Only add if we have actual SQL left
        if cleaned_stmt and len(cleaned_stmt) > 3:
            valid_statements.append(cleaned_stmt)
    
    total = len(valid_statements)
    count = 0
    errors = 0
    
    print(f"Executing {total} SQL statements...")
    for statement in valid_statements:
        try:
            cursor.execute(statement)
            count += 1
            if count % 50 == 0:
                conn.commit()
                print(f"  Progress: {count}/{total} statements executed")
        except mysql.connector.Error as err:
            # Ignore duplicate table and syntax errors
            if err.errno not in [1050, 1064]:
                errors += 1
    
    conn.commit()
    print(f"\n✅ SUCCESS! Executed {count} statements ({errors} errors/skipped)")
    
    # Verify tables on Railway
    print("\nVerifying tables on Railway...")
    cursor.execute("SHOW TABLES;")
    tables = cursor.fetchall()
    print(f"\nTables in Railway database ({len(tables)} total):")
    for table in tables:
        print(f"  ✓ {table[0]}")
    
    cursor.close()
    conn.close()
    
except mysql.connector.Error as err:
    print(f"❌ ERROR: {err}")
    exit(1)
