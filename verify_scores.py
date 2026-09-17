import json
import math

def get_actual_stats(scores_dict):
    valid_scores = [v for v in scores_dict.values() if v is not None and isinstance(v, (int, float))]
    if not valid_scores:
        return 0, 0, 0
    actual_sum = sum(valid_scores)
    actual_avg = actual_sum / len(valid_scores)
    return actual_sum, actual_avg, len(valid_scores)

def verify_file(file_path):
    print(f"\n{'='*20} Verifying {file_path} {'='*20}")
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error loading {file_path}: {e}")
        return

    mismatches = 0
    total_entries = 0

    for category_data in data:
        category = category_data.get('category', 'Unknown')
        for entry in category_data.get('scores', []):
            total_entries += 1
            nombres = entry.get('Nombres', 'Unknown').replace('\n', ' ')
            n_comp = entry.get('Nº', '?')
            scores_dict = entry.get('scores', {})
            
            actual_sum, actual_avg, count = get_actual_stats(scores_dict)
            
            provided_puntaje = entry.get('PUNTAJE')
            provided_promedio = entry.get('PROMEDIO')
            
            # Check PUNTAJE
            sum_matches = False
            if isinstance(provided_puntaje, (int, float)):
                sum_matches = math.isclose(actual_sum, provided_puntaje, abs_tol=0.006)
            
            # Check PROMEDIO
            avg_matches = False
            if isinstance(provided_promedio, (int, float)):
                # Checking with 0.001 tolerance to allow for rounding (8.4916 -> 8.492)
                avg_matches = math.isclose(actual_avg, provided_promedio, abs_tol=0.001)
            elif provided_promedio is None and count == 0:
                avg_matches = True
            
            # Special case for Final: PUNTAJE = SUM + PROMEDIO
            is_sum_plus_promedio = False
            if not sum_matches and isinstance(provided_puntaje, (int, float)) and isinstance(provided_promedio, (int, float)):
                if math.isclose(actual_sum + provided_promedio, provided_puntaje, abs_tol=0.01):
                    is_sum_plus_promedio = True

            if not sum_matches or not avg_matches:
                mismatches += 1
                print(f"\n[{category}] Nº {n_comp}: {nombres}")
                
                if not sum_matches:
                    if is_sum_plus_promedio:
                        print(f"  PUNTAJE: Matches SUM({actual_sum:.2f}) + PROMEDIO({provided_promedio}) = {provided_puntaje}")
                    else:
                        print(f"  PUNTAJE MISMATCH: Provided {provided_puntaje}, Calculated Sum {actual_sum:.2f}")
                
                if not avg_matches:
                    if isinstance(provided_promedio, (int, float)):
                        print(f"  PROMEDIO MISMATCH: Provided {provided_promedio}, Calculated Avg {actual_avg:.4f}")
                    else:
                        print(f"  PROMEDIO MISMATCH: Provided '{provided_promedio}', Calculated Avg {actual_avg:.4f}")

    print(f"\nSummary for {file_path}:")
    print(f"  Total Entries: {total_entries}")
    print(f"  Entries with discrepancies: {mismatches}")

if __name__ == "__main__":
    verify_file('metropolitano_final_clean.json')
    verify_file('metropolitano_semifinal_clean.json')
