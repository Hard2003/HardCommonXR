import mysql.connector

railway_config = {
    'host': 'crossover.proxy.rlwy.net',
    'port': 45313,
    'user': 'root',
    'password': 'ZpoYKIqgmCSAXVHuyuEDNshvrVlagCAV',
    'database': 'railway'
}

conn = mysql.connector.connect(**railway_config)
cursor = conn.cursor()

# Check tables
cursor.execute("SHOW TABLES")
tables = [row[0] for row in cursor.fetchall()]

print(f'Tables on Railway: {len(tables)}\n')

for table in tables:
    cursor.execute(f'SELECT COUNT(*) FROM {table}')
    count = cursor.fetchone()[0]
    print(f'  {table:.<40} {count:>8} rows')

cursor.close()
conn.close()
