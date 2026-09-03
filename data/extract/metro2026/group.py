import json
from collections import defaultdict
from typing import List, Dict, Any

def clean_value(v: Any) -> int | float | str | None:
    """Clean cell values: numbers stay numbers, Abstencion -> null, strings cleaned."""
    if v is None:
        return None
    if isinstance(v, (int, float)):
        return v
    
    s = str(v).strip()
    lower = s.lower()
    if lower in ["abstencion", "abstención", ""]:
        return None
    
    # Try int
    try:
        return int(s)
    except ValueError:
        pass
    
    # Try float (comma as decimal)
    try:
        return float(s.replace(',', '.'))
    except ValueError:
        return s  # keep as string


def post_process_scores(
    input_file: str = "metropolitano_semifinal_scores.json",
    output_file: str = "metropolitano_semifinal_clean.json"
) -> List[Dict[str, Any]]:
    """
    Post-process the flat col_1 / col_2 JSON into the exact grouped structure you requested.
    - Groups by category
    - Real column names (Nº, Nombres, PUNTAJE, PROMEDIO)
    - Judge scores (col_3 to col_8) nested under "scores"
    """
    print(f"📂 Loading flat data from: {input_file}")
    
    with open(input_file, "r", encoding="utf-8") as f:
        flat_data: List[Dict[str, Any]] = json.load(f)
    
    # Group participants by category
    grouped: defaultdict[str, List[Dict]] = defaultdict(list)
    current_judges: List[str] = []
    
    for row in flat_data:
        category = row.get("category")
        if not category or category == "Unknown":
            continue
        
        col1 = row.get("col_1")
        
        # === SKIP HEADER / TITLE ROWS ===
        if isinstance(col1, str):
            col1_clean = col1.strip()
            col2 = str(row.get("col_2", "")).strip()
            
            # Title rows (CAMPEONATO..., PUNTAJE ETAPA...)
            if any(keyword in col1_clean for keyword in ["CAMPEONATO", "PUNTAJE ETAPA"]):
                continue
            
            # Column header row → capture real judge names
            if col1_clean == "Nº" or "Nombres" in col2:
                current_judges = []
                for i in range(3, 10):  # col_3 to col_9 = judges
                    judge = row.get(f"col_{i}")
                    if isinstance(judge, str) and judge.strip():
                        current_judges.append(judge.strip())
                continue  # skip the header row itself
        
        # === DATA ROW (couple) ===
        if isinstance(col1, (int, float)) or (isinstance(col1, str) and col1.strip().isdigit()):
            entry: Dict[str, Any] = {
                "Nº": clean_value(row.get("col_1")),
                "Nombres": clean_value(row.get("col_2")),
                "scores": {},
                "PUNTAJE": clean_value(row.get("col_10")),
                "PROMEDIO": clean_value(row.get("col_11"))
            }
            
            # Add judge scores under "scores" key
            for idx, judge_name in enumerate(current_judges):
                col_key = f"col_{idx + 3}"          # col_3 → first judge
                score = clean_value(row.get(col_key))
                if judge_name:
                    entry["scores"][judge_name] = score
            
            grouped[category].append(entry)
    
    # Build final structure: list of { "category": ..., "scores": [ ... ] }
    result: List[Dict[str, Any]] = []
    for category, couples in grouped.items():
        result.append({
            "category": category,
            "scores": couples
        })
    
    # Save clean JSON
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    total_couples = sum(len(c["scores"]) for c in result)
    print(f"\n✅ Post-processing complete!")
    print(f"📊 Processed {total_couples} couples across {len(result)} categories")
    print(f"💾 Saved to: {output_file}")
    print("Schema is exactly as you requested:")
    print('   { "category": "...", "scores": [ { "Nº": ..., "Nombres": ..., "scores": { ... }, "PUNTAJE": ..., "PROMEDIO": ... }, ... ] }')
    
    return result


if __name__ == "__main__":
    # post_process_scores()
    post_process_scores(
            input_file="metropolitano_final_scores.json",
            output_file="metropolitano_final_clean.json"
            )

