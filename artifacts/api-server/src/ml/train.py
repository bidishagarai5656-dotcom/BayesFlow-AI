import sys
import json
import os
import pickle
import time
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import GaussianNB, MultinomialNB, BernoulliNB
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score


def main():
    data = json.load(sys.stdin)
    session_id = data['sessionId']
    session_dir = f'/tmp/bayesflow_{session_id}'

    if not os.path.exists(session_dir):
        print(json.dumps({'error': 'Session not found'}))
        sys.exit(1)

    model_type = data.get('modelType', 'gaussian')

    with open(os.path.join(session_dir, 'preprocessed.pkl'), 'rb') as f:
        df = pickle.load(f)
    with open(os.path.join(session_dir, 'meta.json')) as f:
        meta = json.load(f)

    target_col = meta.get('targetColumn')
    feature_cols = meta.get('featureColumns', [])
    test_size = meta.get('testSize', 0.2)

    if not target_col or not feature_cols:
        print(json.dumps({'error': 'Feature configuration not set. Please complete stage 4 first.'}))
        sys.exit(1)

    feature_df = df[feature_cols].copy()
    target_series = df[target_col].copy()

    for col in feature_df.select_dtypes(include=['object', 'category']).columns:
        le = LabelEncoder()
        feature_df[col] = le.fit_transform(feature_df[col].astype(str))

    le_target = LabelEncoder()
    y = le_target.fit_transform(target_series.astype(str))
    X = feature_df.values
    class_names = list(le_target.classes_)

    if model_type == 'multinomial':
        X = np.abs(X)
        X = np.round(X).astype(int)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=42, stratify=y if len(set(y)) > 1 else None
    )

    logs = [
        f'Starting {model_type.capitalize()} Naive Bayes training...',
        f'Training set: {len(X_train)} samples | Test set: {len(X_test)} samples',
        f'Features: {len(feature_cols)} | Classes: {len(class_names)} ({", ".join(class_names)})',
    ]

    start = time.time()
    if model_type == 'gaussian':
        model = GaussianNB()
        logs.append('Computing class-conditional Gaussian distributions...')
    elif model_type == 'multinomial':
        model = MultinomialNB(alpha=1.0)
        logs.append('Computing multinomial feature likelihoods with Laplace smoothing...')
    else:
        model = BernoulliNB(alpha=1.0)
        logs.append('Computing Bernoulli feature likelihoods...')

    model.fit(X_train, y_train)
    training_time = round(time.time() - start, 4)

    train_preds = model.predict(X_train)
    test_preds = model.predict(X_test)
    train_accuracy = float(accuracy_score(y_train, train_preds))
    test_accuracy = float(accuracy_score(y_test, test_preds))

    logs.append(f'Training complete in {training_time}s')
    logs.append(f'Train accuracy: {train_accuracy:.4f} ({train_accuracy*100:.2f}%)')
    logs.append(f'Test accuracy: {test_accuracy:.4f} ({test_accuracy*100:.2f}%)')

    class_log_probs = model.class_log_prior_
    class_probs = np.exp(class_log_probs)
    class_probabilities = [
        {'className': class_names[i], 'probability': float(class_probs[i])}
        for i in range(len(class_names))
    ]

    feature_importance = []
    if hasattr(model, 'theta_'):
        variances = np.var(model.theta_, axis=0) if model.theta_.shape[0] > 1 else model.theta_[0]
        if model.theta_.shape[0] > 1:
            diffs = np.std(model.theta_, axis=0)
        else:
            diffs = np.abs(model.theta_[0])
        total = diffs.sum() if diffs.sum() > 0 else 1
        for i, col in enumerate(feature_cols):
            feature_importance.append({'feature': col, 'importance': float(diffs[i] / total)})
    elif hasattr(model, 'feature_log_prob_'):
        log_probs = model.feature_log_prob_
        diffs = np.std(log_probs, axis=0) if log_probs.shape[0] > 1 else np.abs(log_probs[0])
        total = diffs.sum() if diffs.sum() > 0 else 1
        for i, col in enumerate(feature_cols):
            feature_importance.append({'feature': col, 'importance': float(diffs[i] / total)})
    else:
        for col in feature_cols:
            feature_importance.append({'feature': col, 'importance': 1.0 / len(feature_cols)})

    meta['modelType'] = model_type
    meta['classNames'] = class_names
    meta['leTarget'] = list(le_target.classes_)

    with open(os.path.join(session_dir, 'meta.json'), 'w') as f:
        json.dump(meta, f)

    model_data = {'model': model, 'le_target': le_target, 'feature_cols': feature_cols, 'class_names': class_names}
    with open(os.path.join(session_dir, 'model.pkl'), 'wb') as f:
        pickle.dump(model_data, f)

    with open(os.path.join(session_dir, 'test_data.pkl'), 'wb') as f:
        pickle.dump({'X_test': X_test, 'y_test': y_test, 'X_train': X_train, 'y_train': y_train}, f)

    result = {
        'sessionId': session_id,
        'modelType': model_type,
        'accuracy': test_accuracy,
        'trainAccuracy': train_accuracy,
        'testAccuracy': test_accuracy,
        'trainingTime': training_time,
        'classProbabilities': class_probabilities,
        'featureImportance': feature_importance,
        'logs': logs,
    }
    print(json.dumps(result))


if __name__ == '__main__':
    main()
