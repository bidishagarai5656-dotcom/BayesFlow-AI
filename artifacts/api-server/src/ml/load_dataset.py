import sys
import json
import os
import base64
import pickle
import uuid
import pandas as pd
import numpy as np
from io import StringIO


def get_builtin_datasets():
    from sklearn.datasets import load_iris, load_breast_cancer
    datasets = {}

    iris = load_iris(as_frame=True)
    df_iris = iris.frame.copy()
    df_iris.columns = [c.replace(' (cm)', '').replace(' ', '_') for c in df_iris.columns]
    df_iris['target'] = [iris.target_names[t] for t in iris.target]
    df_iris = df_iris.drop(columns=['target'] if 'target' in df_iris.columns else [], errors='ignore')
    df_iris['species'] = [iris.target_names[t] for t in iris.target]
    df_iris = df_iris[[c for c in df_iris.columns if c != 'target_encoded']]
    datasets['iris'] = df_iris

    np.random.seed(42)
    n = 1000
    spam_data = {
        'word_freq_make': np.random.exponential(0.1, n),
        'word_freq_address': np.random.exponential(0.2, n),
        'word_freq_all': np.random.exponential(0.3, n),
        'word_freq_3d': np.random.exponential(0.05, n),
        'char_freq_exclaim': np.random.exponential(0.1, n),
        'char_freq_dollar': np.random.exponential(0.05, n),
        'capital_run_length_average': np.random.exponential(5.0, n),
        'capital_run_length_longest': np.random.randint(1, 50, n).astype(float),
        'capital_run_length_total': np.random.randint(1, 500, n).astype(float),
    }
    spam_df = pd.DataFrame(spam_data)
    spam_score = (
        spam_df['word_freq_make'] * 2 +
        spam_df['word_freq_3d'] * 3 +
        spam_df['char_freq_exclaim'] * 2 +
        spam_df['char_freq_dollar'] * 4 +
        np.random.normal(0, 0.1, n)
    )
    spam_df['label'] = (spam_score > spam_score.median()).map({True: 'spam', False: 'not_spam'})
    datasets['spam'] = spam_df

    np.random.seed(123)
    n = 395
    study_hours = np.random.uniform(0, 20, n)
    absences = np.random.randint(0, 30, n)
    failures = np.random.choice([0, 1, 2, 3], n, p=[0.6, 0.2, 0.1, 0.1])
    parental_edu = np.random.choice([0, 1, 2, 3, 4], n)
    internet = np.random.choice([0, 1], n)
    score = (study_hours * 2 + parental_edu * 1.5 - absences * 0.5 - failures * 3 + np.random.normal(0, 2, n))
    grade_score = (score - score.min()) / (score.max() - score.min()) * 20
    student_df = pd.DataFrame({
        'study_hours': np.round(study_hours, 2),
        'absences': absences,
        'failures': failures,
        'parental_education': parental_edu,
        'internet_access': internet,
        'grade': pd.cut(grade_score, bins=[0, 10, 13, 17, 20.01], labels=['F', 'C', 'B', 'A'])
    })
    student_df['grade'] = student_df['grade'].astype(str)
    datasets['student'] = student_df

    bc = load_breast_cancer(as_frame=True)
    df_heart = bc.frame.copy()
    df_heart = df_heart.iloc[:, :10]
    df_heart['target'] = bc.target_names[bc.target]
    datasets['heart'] = df_heart

    return datasets


BUILTIN_META = {
    'iris': {
        'displayName': 'Iris Dataset',
        'description': 'Classic flower classification: sepal/petal measurements to classify 3 iris species',
        'rows': 150, 'columns': 5, 'targetColumn': 'species',
        'tags': ['classification', 'multiclass', 'numeric']
    },
    'spam': {
        'displayName': 'Spam Detection Dataset',
        'description': 'Email spam detection based on word frequencies and character patterns',
        'rows': 1000, 'columns': 10, 'targetColumn': 'label',
        'tags': ['classification', 'binary', 'text', 'NLP']
    },
    'student': {
        'displayName': 'Student Performance Dataset',
        'description': 'Predict student grade (A/B/C/F) from study habits and background features',
        'rows': 395, 'columns': 6, 'targetColumn': 'grade',
        'tags': ['classification', 'multiclass', 'education']
    },
    'heart': {
        'displayName': 'Heart Disease Dataset',
        'description': 'Breast cancer classification using clinical measurements (binary outcome)',
        'rows': 569, 'columns': 11, 'targetColumn': 'target',
        'tags': ['classification', 'binary', 'medical']
    }
}


def save_session(session_dir, df, dataset_name, config=None):
    os.makedirs(session_dir, exist_ok=True)
    with open(os.path.join(session_dir, 'data.pkl'), 'wb') as f:
        pickle.dump(df, f)
    with open(os.path.join(session_dir, 'preprocessed.pkl'), 'wb') as f:
        pickle.dump(df.copy(), f)
    meta = {
        'datasetName': dataset_name,
        'rows': len(df),
        'columns': len(df.columns),
        'columnNames': list(df.columns),
        'columnTypes': {col: str(df[col].dtype) for col in df.columns},
    }
    if config:
        meta.update(config)
    with open(os.path.join(session_dir, 'meta.json'), 'w') as f:
        json.dump(meta, f)
    return meta


def df_preview(df, n=5):
    preview = df.head(n).copy()
    for col in preview.columns:
        if preview[col].dtype == 'object':
            preview[col] = preview[col].astype(str)
        elif hasattr(preview[col], 'cat'):
            preview[col] = preview[col].astype(str)
        else:
            preview[col] = preview[col].where(pd.notnull(preview[col]), None)
    return preview.to_dict(orient='records')


def main():
    data = json.load(sys.stdin)
    load_type = data.get('type', 'builtin')
    session_id = data.get('sessionId') or str(uuid.uuid4())
    session_dir = f'/tmp/bayesflow_{session_id}'

    if load_type == 'builtin':
        dataset_name = data.get('datasetName', 'iris')
        if dataset_name not in BUILTIN_META:
            print(json.dumps({'error': f'Unknown dataset: {dataset_name}'}))
            sys.exit(1)
        datasets = get_builtin_datasets()
        df = datasets[dataset_name]
    else:
        csv_content_b64 = data.get('csvContent', '')
        filename = data.get('filename', 'upload.csv')
        csv_bytes = base64.b64decode(csv_content_b64)
        csv_text = csv_bytes.decode('utf-8', errors='replace')
        df = pd.read_csv(StringIO(csv_text))
        dataset_name = filename.replace('.csv', '')

    meta = save_session(session_dir, df, dataset_name)
    result = {
        'sessionId': session_id,
        'datasetName': dataset_name,
        'rows': meta['rows'],
        'columns': meta['columns'],
        'columnNames': meta['columnNames'],
        'columnTypes': meta['columnTypes'],
        'preview': df_preview(df),
    }
    print(json.dumps(result))


if __name__ == '__main__':
    main()
