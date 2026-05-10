import sys
import json
import os
import pickle
import pandas as pd
import numpy as np


def main():
    data = json.load(sys.stdin)
    session_id = data['sessionId']
    session_dir = f'/tmp/bayesflow_{session_id}'

    if not os.path.exists(session_dir):
        print(json.dumps({'error': 'Session not found'}))
        sys.exit(1)

    target_column = data['targetColumn']
    feature_columns = data['featureColumns']
    test_size = data['testSize']

    with open(os.path.join(session_dir, 'preprocessed.pkl'), 'rb') as f:
        df = pickle.load(f)

    if target_column not in df.columns:
        print(json.dumps({'error': f'Target column {target_column} not found'}))
        sys.exit(1)

    for fc in feature_columns:
        if fc not in df.columns:
            print(json.dumps({'error': f'Feature column {fc} not found'}))
            sys.exit(1)

    total_rows = len(df)
    test_rows = int(total_rows * test_size)
    train_rows = total_rows - test_rows

    classes = [str(c) for c in df[target_column].unique().tolist()]

    with open(os.path.join(session_dir, 'meta.json')) as f:
        meta = json.load(f)

    meta['targetColumn'] = target_column
    meta['featureColumns'] = feature_columns
    meta['testSize'] = test_size
    meta['trainSize'] = round(1 - test_size, 2)
    meta['classes'] = classes

    with open(os.path.join(session_dir, 'meta.json'), 'w') as f:
        json.dump(meta, f)

    result = {
        'sessionId': session_id,
        'targetColumn': target_column,
        'featureColumns': feature_columns,
        'trainSize': round(1 - test_size, 2),
        'testSize': test_size,
        'trainRows': train_rows,
        'testRows': test_rows,
        'classes': classes,
    }
    print(json.dumps(result))


if __name__ == '__main__':
    main()
