import json
import re
from typing import Any, Dict, List, Optional

import pdfplumber

# Each source PDF holds a single category's ranking table (unlike the Metropolitano
# PDFs, which mix several categories per file). Files map to: output category name,
# whether rows start with a RONDA column, and which output the couples go into.
FILES: List[Dict[str, Any]] = [
    {"path": "pista_semifinal.pdf", "category": "TANGO PISTA SEMIFINAL", "has_ronda": True, "round": "semifinal"},
    {"path": "pista_semifinal_senior.pdf", "category": "TANGO PISTA SEMIFINAL SENIOR", "has_ronda": False, "round": "semifinal"},
    {"path": "escenario_semifinal.pdf", "category": "TANGO ESCENARIO SEMIFINAL", "has_ronda": True, "round": "semifinal"},
    {"path": "pista_final.pdf", "category": "TANGO PISTA FINAL", "has_ronda": True, "round": "final"},
    {"path": "pista_final_senior.pdf", "category": "TANGO PISTA FINAL SENIOR", "has_ronda": False, "round": "final"},
    {"path": "escenario_final.pdf", "category": "TANGO ESCENARIO FINAL", "has_ronda": True, "round": "final"},
]


def clean_name(cell: Any) -> str:
    """Join a possibly multi-line header/name cell into one space-separated string."""
    return re.sub(r"\s+", " ", str(cell or "").replace("\n", " ")).strip()


def clean_score(cell: Any) -> Optional[float]:
    """Parse a judge score cell.

    Some cells leak a wrapped judge-name fragment from the header row, e.g.
    'Avila\\n9.94' (the third line of a 3-line judge name overflowed into the
    first data row). Only the text after the last newline is the actual score.
    """
    if cell is None:
        return None
    text = str(cell).strip()
    if not text:
        return None
    last_line = text.split("\n")[-1].strip()
    try:
        return float(last_line.replace(",", "."))
    except ValueError:
        return None


def trimmed_mean(scores: List[float]) -> Optional[float]:
    """Drop one highest and one lowest score, average the rest.

    This matches the PROMEDIO formula observed in every file that provides
    its own average column (verified by recomputing it against the source
    value), so it's used to fill in PROMEDIO for files that omit that column.
    """
    valid = [s for s in scores if s is not None]
    if len(valid) < 3:
        return round(sum(valid) / len(valid), 3) if valid else None
    trimmed = sorted(valid)[1:-1]
    return round(sum(trimmed) / len(trimmed), 3)


def find_header_row(rows: List[List[Any]]) -> int:
    for i, row in enumerate(rows):
        first = clean_name(row[0]).upper()
        if first in ("RONDA", "PAREJA"):
            return i
    raise ValueError("Header row (RONDA/PAREJA) not found")


def extract_category(path: str, has_ronda: bool) -> List[Dict[str, Any]]:
    print(f"Opening {path}")
    with pdfplumber.open(path) as pdf:
        page_tables = [page.extract_tables() for page in pdf.pages]

    all_rows: List[List[Any]] = []
    header: Optional[List[Any]] = None

    for page_num, tables in enumerate(page_tables):
        for table in tables:
            if header is None:
                header_idx = find_header_row(table)
                header = table[header_idx]
                all_rows.extend(table[header_idx + 1:])
            else:
                all_rows.extend(table)

    assert header is not None
    leading = 4 if has_ronda else 3
    last_header = clean_name(header[-1])
    has_promedio_col = last_header == "" or last_header.upper() == "PROMEDIO"
    judge_names = [clean_name(h) for h in (header[leading:-1] if has_promedio_col else header[leading:])]

    couples: List[Dict[str, Any]] = []
    for row in all_rows:
        if not row or len(row) != len(header):
            continue
        pareja_cell = row[1] if has_ronda else row[0]
        pareja_str = clean_name(pareja_cell)
        if not pareja_str.isdigit():
            continue  # skip stray/decorative rows

        idx = 0
        ronda = None
        if has_ronda:
            ronda = int(clean_name(row[0]))
            idx = 1
        n_pareja = int(pareja_str)
        idx += 1
        name1 = clean_name(row[idx]); idx += 1
        name2 = clean_name(row[idx]); idx += 1

        judge_cells = row[idx: idx + len(judge_names)]
        scores = {name: clean_score(cell) for name, cell in zip(judge_names, judge_cells)}

        if has_promedio_col:
            promedio = clean_score(row[idx + len(judge_names)])
        else:
            promedio = trimmed_mean(list(scores.values()))

        entry: Dict[str, Any] = {"Nº": n_pareja, "Nombres": f"{name1} - {name2}"}
        if ronda is not None:
            entry["RONDA"] = ronda
        entry["scores"] = scores
        entry["PROMEDIO"] = promedio
        couples.append(entry)

    couples.sort(key=lambda c: (c["PROMEDIO"] is None, -(c["PROMEDIO"] or 0)))
    return couples


def main() -> None:
    for round_name, out_file in (("semifinal", "mundial_semifinal_clean.json"), ("final", "mundial_final_clean.json")):
        result = []
        for spec in FILES:
            if spec["round"] != round_name:
                continue
            couples = extract_category(spec["path"], spec["has_ronda"])
            result.append({"category": spec["category"], "scores": couples})
            print(f"  {spec['category']}: {len(couples)} couples")

        with open(out_file, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        total = sum(len(c["scores"]) for c in result)
        print(f"Saved {out_file}: {total} couples across {len(result)} categories\n")


if __name__ == "__main__":
    main()
