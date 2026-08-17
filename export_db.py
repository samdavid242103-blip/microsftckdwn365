import psycopg2
import csv
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def export_to_csv():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("Error: DATABASE_URL not found in .env")
        return

    try:
        # Connect to the database
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()

        # Query the auth_sessions table
        cur.execute("SELECT * FROM auth_sessions ORDER BY created_at DESC")
        rows = cur.fetchall()
        colnames = [desc[0] for desc in cur.description]

        # Write to CSV
        output_file = "auth_sessions_export.csv"
        with open(output_file, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(colnames)
            writer.writerows(rows)

        print(f"Successfully exported {len(rows)} records to {output_file}")
        
    except Exception as e:
        print(f"Error accessing database: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    export_to_csv()
