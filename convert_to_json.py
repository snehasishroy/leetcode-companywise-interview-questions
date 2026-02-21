import csv
import json
from pathlib import Path
from collections import defaultdict

BASE_DIR = Path(__file__).parent

# Main aggregation dict keyed by question ID
questions = {}

for company_dir in BASE_DIR.iterdir():
    if not company_dir.is_dir():
        continue

    company_name = company_dir.name

    for csv_file in company_dir.glob("*.csv"):
        timeframe = csv_file.stem  # e.g. "all", "thirty-days"

        with open(csv_file, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)

            for row in reader:
                qid = int(row["ID"])

                if qid not in questions:
                    questions[qid] = {
                        "ID": qid,
                        "URL": row["URL"],
                        "Title": row["Title"],
                        "Difficulty": row["Difficulty"],
                        "Acceptance %": float(row["Acceptance %"].strip().replace("%", "")),
                        "Frequency %": float(row["Frequency %"].strip().replace("%", "")),
                        "Companies": defaultdict(list),
                    }

                # Add timeframe for this company if not already present
                if timeframe not in questions[qid]["Companies"][company_name]:
                    questions[qid]["Companies"][company_name].append(timeframe)

# Final formatting
result = []

for q in questions.values():
    companies = q["Companies"]

    q["Occurrence"] = len(companies)

    # Convert defaultdict → normal dict
    q["Companies"] = dict(companies)

    result.append(q)

# Sort by ID
result.sort(key=lambda x: x["ID"])

# Write to JSON
with open("aggregated_questions.json", "w", encoding="utf-8") as f:
    json.dump(result, f, indent=2)

print(f"Generated {len(result)} unique questions.")
