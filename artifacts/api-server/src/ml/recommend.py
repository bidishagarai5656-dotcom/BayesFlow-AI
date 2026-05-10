import sys
import json
import os
import pickle
import pandas as pd
import numpy as np


MODELS = [
    {
        'type': 'gaussian',
        'displayName': 'Gaussian Naive Bayes',
        'description': 'Assumes features follow a Gaussian (normal) distribution. Best for continuous numeric features.',
        'suitableFor': 'Continuous numeric data like measurements, temperatures, or sensor readings',
        'pros': [
            'Handles continuous features naturally',
            'No need for feature discretization',
            'Works well with real-valued measurements',
            'Robust to outliers in many cases'
        ],
        'cons': [
            'Assumes Gaussian distribution (may not always hold)',
            'Less effective with sparse or binary data',
            'Sensitive to features with skewed distributions'
        ]
    },
    {
        'type': 'multinomial',
        'displayName': 'Multinomial Naive Bayes',
        'description': 'Works with discrete frequency counts. Ideal for text classification with word frequencies.',
        'suitableFor': 'Text data, word counts, or discrete feature counts (must be non-negative integers)',
        'pros': [
            'Excellent for text and NLP tasks',
            'Works naturally with word frequencies',
            'Handles high-dimensional sparse data well',
            'Fast and memory efficient'
        ],
        'cons': [
            'Requires non-negative integer features',
            'Cannot handle continuous features directly',
            'Assumes feature independence'
        ]
    },
    {
        'type': 'bernoulli',
        'displayName': 'Bernoulli Naive Bayes',
        'description': 'Designed for binary/boolean features. Each feature is either present or absent.',
        'suitableFor': 'Binary feature data: yes/no, present/absent, 0/1 values',
        'pros': [
            'Explicit handling of feature absence',
            'Great for document classification',
            'Works well with binary encoded features',
            'Simple and interpretable'
        ],
        'cons': [
            'Only suitable for binary features',
            'Loses magnitude information',
            'Not suitable for continuous data'
        ]
    }
]


def main():
    data = json.load(sys.stdin)
    session_id = data['sessionId']
    session_dir = f'/tmp/bayesflow_{session_id}'

    if not os.path.exists(session_dir):
        print(json.dumps({'error': 'Session not found'}))
        sys.exit(1)

    try:
        with open(os.path.join(session_dir, 'preprocessed.pkl'), 'rb') as f:
            df = pickle.load(f)
        with open(os.path.join(session_dir, 'meta.json')) as f:
            meta = json.load(f)
    except Exception as e:
        print(json.dumps({'error': str(e)}))
        sys.exit(1)

    feature_cols = meta.get('featureColumns', [c for c in df.columns if c != meta.get('targetColumn')])
    if not feature_cols:
        feature_cols = [c for c in df.columns[:-1]]

    feature_df = df[feature_cols]
    numeric_cols = feature_df.select_dtypes(include=[np.number]).columns
    object_cols = feature_df.select_dtypes(include=['object', 'category']).columns

    n_numeric = len(numeric_cols)
    n_binary = sum(1 for c in numeric_cols if feature_df[c].nunique() <= 2)
    n_object = len(object_cols)
    n_total = len(feature_cols)

    has_negative = any((feature_df[c] < 0).any() for c in numeric_cols)
    all_non_negative_int = all(
        (feature_df[c] >= 0).all() and
        (feature_df[c] == feature_df[c].round()).all()
        for c in numeric_cols
    ) if len(numeric_cols) > 0 else False

    if n_binary / max(n_numeric, 1) > 0.7:
        recommended = 'bernoulli'
        reason = f'{n_binary} out of {n_numeric} numeric features are binary (0/1). Bernoulli NB is optimized for binary feature data.'
    elif all_non_negative_int and not has_negative and n_object == 0:
        recommended = 'multinomial'
        reason = 'All features are non-negative integers — typical of count/frequency data. Multinomial NB excels here.'
    else:
        recommended = 'gaussian'
        reason = f'{n_numeric} continuous numeric features detected. Gaussian NB models their distributions naturally.'

    result = {
        'recommended': recommended,
        'reason': reason,
        'models': MODELS,
    }
    print(json.dumps(result))


if __name__ == '__main__':
    main()
