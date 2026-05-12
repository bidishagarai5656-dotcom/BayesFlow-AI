import sys
import json
import os
import pickle
import pandas as pd
import numpy as np


def load_df(session_dir):
    with open(os.path.join(session_dir, 'data.pkl'), 'rb') as f:
        return pickle.load(f)


def safe_float(val):
    if val is None or (isinstance(val, float) and np.isnan(val)):
        return None
    try:
        return float(val)
    except Exception:
        return None


def main():
    data = json.load(sys.stdin)
    session_id = data['sessionId']
    session_dir = f'/tmp/bayesflow_{session_id}'

    if not os.path.exists(session_dir):
        print(json.dumps({'error': 'Session not found'}))
        sys.exit(1)

    df = load_df(session_dir)

    missing_values = {col: int(df[col].isna().sum()) for col in df.columns}

    column_stats = []
    for col in df.columns:
        stat = {
            'name': col,
            'dtype': str(df[col].dtype),
            'nonNull': int(df[col].notna().sum()),
            'unique': int(df[col].nunique()),
            'mean': None,
            'std': None,
            'min': None,
            'max': None,
            'median': None,
        }
        if pd.api.types.is_numeric_dtype(df[col]):
            stat['mean'] = safe_float(df[col].mean())
            stat['std'] = safe_float(df[col].std())
            stat['min'] = safe_float(df[col].min())
            stat['max'] = safe_float(df[col].max())
            stat['median'] = safe_float(df[col].median())
        column_stats.append(stat)

    target_col = None
    with open(os.path.join(session_dir, 'meta.json')) as f:
        meta = json.load(f)
    target_col = meta.get('targetColumn')

    class_counts = {}
    if target_col and target_col in df.columns:
        class_counts = {str(k): int(v) for k, v in df[target_col].value_counts().items()}

    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    correlation_matrix = []
    if len(numeric_cols) >= 2:
        corr = df[numeric_cols].corr()
        for col in numeric_cols:
            row = {'column': col}
            for col2 in numeric_cols:
                val = corr.loc[col, col2]
                row[col2] = safe_float(val) if not np.isnan(val) else 0.0
            correlation_matrix.append(row)

    histograms = []
    for col in numeric_cols[:8]:
        series = df[col].dropna()
        if len(series) == 0:
            continue
        counts, bin_edges = np.histogram(series, bins=10)
        bins = []
        for i in range(len(counts)):
            bins.append({
                'range': f'{bin_edges[i]:.2f}-{bin_edges[i+1]:.2f}',
                'count': int(counts[i])
            })
        histograms.append({'column': col, 'bins': bins})

    result = {
        'sessionId': session_id,
        'rowCount': len(df),
        'columnCount': len(df.columns),
        'missingValues': missing_values,
        'columnStats': column_stats,
        'classCounts': class_counts,
        'correlationMatrix': correlation_matrix,
        'histograms': histograms,
    }
    print(json.dumps(result))


if __name__ == '__main__':
    main()
