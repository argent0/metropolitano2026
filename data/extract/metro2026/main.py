import pdfplumber
import json
from typing import List, Dict, Any

def clean_value(cell: Any) -> int | float | str | None:
    """Try to convert cell to number (int/float), else keep as clean string."""
    if cell is None:
        return None
    cell_str = str(cell).strip()
    if not cell_str:
        return None
    
    # Try int first
    try:
        return int(cell_str)
    except ValueError:
        pass
    
    # Try float (handles commas as decimal separator too)
    try:
        num_str = cell_str.replace(',', '.')
        return float(num_str)
    except ValueError:
        return cell_str  # keep as string


def extract_dance_scores(pdf_path: str = "") -> List[Dict[str, Any]]:
    """
    Extract EVERY table row as a flat dict with generic columns: col_1, col_2, col_3...
    Exactly as requested: {'category': 'SEMIFINAL VALS', 'col_1': 131, 'col_2': 'xxx', ...}
    """
    print(f"📂 Opening local PDF: {pdf_path}")
    
    all_data: List[Dict[str, Any]] = []
    current_category = "Unknown"
    
    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, 1):
            text = page.extract_text() or ""
            upper_text = text.upper()
            
            # Category detection (uppercase as requested)
            if "VALS" in upper_text:
                current_category = "SEMIFINAL VALS"
            elif "MILONG" in upper_text:
                current_category = "SEMIFINAL MILONGA"
            elif "TANGO DE PISTA" in upper_text:
                if "SENIOR" in upper_text:
                    current_category = "TANGO DE PISTA SENIOR"
                else:
                    current_category = "TANGO DE PISTA ADULT"
            elif "MILONGUEROS DEL MUNDO" in upper_text:
                if "SENIOR" in upper_text:
                    current_category = "MILONGUEROS DEL MUNDO SENIOR"
                else:
                    current_category = "MILONGUEROS DEL MUNDO ADULT"
            
            # Extract all tables on this page
            tables = page.extract_tables()
            for table in tables:
                if len(table) < 2:  # need at least header + data
                    continue
                
                # Process every data row
                for row in table[1:]:  # skip header row
                    if not row or not row[0]:  # skip empty rows
                        continue
                    
                    entry: Dict[str, Any] = {"category": current_category}
                    
                    # Add every column as col_1, col_2, col_3...
                    for col_idx, cell in enumerate(row, start=1):
                        key = f"col_{col_idx}"
                        entry[key] = clean_value(cell)
                    
                    all_data.append(entry)
    
    # Remove exact duplicate rows (in case tables repeat across pages)
    seen = set()
    unique_data = []
    for item in all_data:
        key = tuple(sorted(item.items()))  # simple way to deduplicate
        if key not in seen:
            seen.add(key)
            unique_data.append(item)
    
    return unique_data


if __name__ == "__main__":
    PDF_PATH = "metrosemi.pdf"   # ← change only if your filename is different
    
    data_list = extract_dance_scores(PDF_PATH)
    
    output_file = "metropolitano_semifinal_scores.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(data_list, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Done! Extracted {len(data_list)} rows.")
    print(f"💾 Saved to: {output_file}")
    print("Schema is exactly as requested: {'category': '...', 'col_1': ..., 'col_2': ..., ...}")

