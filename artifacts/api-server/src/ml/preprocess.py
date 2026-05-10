import sys
import json
import os
import pickle
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler, LabelEncoder


def load_df(session_dir, filename='data.pkl'):
    with open(os.path.join(session_dir, filename), 'rb') as f:
        return pickle.load(f)


def save_preprocessed(session_dir, df):
    with open(os.path.join(session_dir, 'preprocessed.pkl'), 'wb') as f:
        pickle.dump(df, f)


def main():
    data = json.load(sys.stdin)
    session_id = data['sessionId']
    session_dir = f'/tmp/bayesflow_{session_id}'

    if not os.path.exists(session_dir):
        print(json.dumps({'error': 'Session not found'}))
        sys.exit(1)

    df = load_df(session_dir, 'data.pkl')
    logs = []
    rows_before = len(df)
    cols_before = len(df.columns)

    before_stats = {
        'rows': rows_before,
        'columns': cols_before,
        'missing': int(df.isna().sum().sum()),
        'duplicates': int(df.duplicated().sum()),
    }

    handle_missing = data.get('handleMissing', 'none')
    encode_categorical = data.get('encodeCategorical', False)
    remove_duplicates = data.get('removeDuplicates', False)
    feature_scaling = data.get('featureScaling', 'none')

    if remove_duplicates:
        n_dup = df.duplicated().sum()
        df = df.drop_duplicates()
        logs.append(f'Removed {n_dup} duplicate rows. Rows remaining: {len(df)}')

    if handle_missing != 'none':
        n_missing = df.isna().sum().sum()
        if handle_missing == 'drop_rows':
            df = df.dropna()
            logs.append(f'Dropped rows with missing values. Removed {n_missing} missing values. Rows remaining: {len(df)}')
        elif handle_missing == 'fill_mean':
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].mean())
            logs.append(f'Filled {int(df[numeric_cols].isna().sum().sum())} remaining missing values with column mean')
            logs.append(f'Filled numeric missing values with column means')
        elif handle_missing == 'fill_median':
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].median())
            logs.append(f'Filled numeric missing values with column medians')
        elif handle_missing == 'fill_mode':
            for col in df.columns:
                mode_val = df[col].mode()
                if len(mode_val) > 0:
                    df[col] = df[col].fillna(mode_val[0])
            logs.append('Filled missing values with column modes')
    else:
        logs.append('Missing value handling: none applied')

    if encode_categorical:
        cat_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
        with open(os.path.join(session_dir, 'meta.json')) as f:
            meta = json.load(f)
        target_col = meta.get('targetColumn', '')
        cat_to_encode = [c for c in cat_cols if c != target_col]
        encoders = {}
        for col in cat_to_encode:
            le = LabelEncoder()
            df[col] = le.fit_transform(df[col].astype(str))
            encoders[col] = list(le.classes_)
        if cat_to_encode:
            logs.append(f'Label encoded {len(cat_to_encode)} categorical columns: {", ".join(cat_to_encode)}')
        else:
            logs.append('No categorical columns to encode (excluding target)')
        with open(os.path.join(session_dir, 'encoders.json'), 'w') as f:
            json.dump(encoders, f)
    else:
        logs.append('Categorical encoding: skipped')

    if feature_scaling != 'none':
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        with open(os.path.join(session_dir, 'meta.json')) as f:
            meta = json.load(f)
        target_col = meta.get('targetColumn', '')
        cols_to_scale = [c for c in numeric_cols if c != target_col]
        if cols_to_scale:
            if feature_scaling == 'standard':
                scaler = StandardScaler()
                scaler_name = 'StandardScaler (z-score normalization)'
            elif feature_scaling == 'minmax':
                scaler = MinMaxScaler()
                scaler_name = 'MinMaxScaler (0-1 normalization)'
            elif feature_scaling == 'robust':
                scaler = RobustScaler()
                scaler_name = 'RobustScaler (IQR-based, outlier resistant)'
            else:
                scaler = None
                scaler_name = 'None'
            if scaler:
                df[cols_to_scale] = scaler.fit_transform(df[cols_to_scale])
                import pickle as pkl
                with open(os.path.join(session_dir, 'scaler.pkl'), 'wb') as f:
                    pkl.dump(scaler, f)
                logs.append(f'Applied {scaler_name} to {len(cols_to_scale)} numeric feature columns')
        else:
            logs.append('No numeric feature columns to scale')
    else:
        logs.append('Feature scaling: none applied')

    save_preprocessed(session_dir, df)

    after_stats = {
        'rows': len(df),
        'columns': len(df.columns),
        'missing': int(df.isna().sum().sum()),
        'duplicates': int(df.duplicated().sum()),
    }

    result = {
        'sessionId': session_id,
        'logs': logs,
        'beforeStats': before_stats,
        'afterStats': after_stats,
        'rowsBefore': rows_before,
        'rowsAfter': len(df),
        'columnsBefore': cols_before,
        'columnsAfter': len(df.columns),
    }
    print(json.dumps(result))


if __name__ == '__main__':
    main()
