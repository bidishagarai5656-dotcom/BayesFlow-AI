import sys
import json
import os
import pickle
import numpy as np
from sklearn.preprocessing import LabelEncoder


def prepare_features(X, model_type, X_train_ref=None):
    """
    Apply the same feature transformation used during training.
    - gaussian    → no change
    - multinomial → abs + round to non-negative integers
    - bernoulli   → binarise; without training data we threshold at 0
    """
    if model_type == 'multinomial':
        X = np.abs(X)
        X = np.round(X).astype(float)
    elif model_type == 'bernoulli':
        # Single-sample prediction: threshold at 0 (positive = present)
        X = (X > 0).astype(float)
    return X


def main():
    data = json.load(sys.stdin)
    session_id = data['sessionId']
    session_dir = f'/tmp/bayesflow_{session_id}'

    if not os.path.exists(session_dir):
        print(json.dumps({'error': 'Session not found'}))
        sys.exit(1)

    features_input = data.get('features', {})

    model_path = os.path.join(session_dir, 'model.pkl')
    if not os.path.exists(model_path):
        print(json.dumps({'error': 'Model not trained yet. Please complete stage 6 first.'}))
        sys.exit(1)

    with open(model_path, 'rb') as f:
        model_data = pickle.load(f)

    model = model_data['model']
    le_target = model_data['le_target']
    feature_cols = model_data['feature_cols']
    class_names = model_data['class_names']
    # model_type stored by updated train.py; fall back gracefully for old sessions
    model_type = model_data.get('model_type', 'gaussian')

    with open(os.path.join(session_dir, 'meta.json')) as f:
        meta = json.load(f)

    # Build raw feature vector
    input_values = []
    for col in feature_cols:
        val = features_input.get(col, 0)
        try:
            input_values.append(float(val))
        except (ValueError, TypeError):
            input_values.append(0.0)

    X = np.array([input_values], dtype=float)
    X = prepare_features(X, model_type)

    proba = model.predict_proba(X)[0]
    pred_class_idx = int(np.argmax(proba))
    predicted_class = class_names[pred_class_idx]
    confidence = float(proba[pred_class_idx])

    class_probabilities = [
        {'className': class_names[i], 'probability': float(proba[i])}
        for i in range(len(class_names))
    ]

    explanation = []
    explanation.append(
        f'Predicted "{predicted_class}" with {confidence * 100:.1f}% confidence '
        f'using {model_type.capitalize()} Naive Bayes'
    )
    explanation.append('Naive Bayes applies Bayes\' theorem: P(class|features) ∝ P(class) × P(features|class)')

    sorted_probs = sorted(class_probabilities, key=lambda x: x['probability'], reverse=True)
    if len(sorted_probs) >= 2:
        second_prob = max(sorted_probs[1]['probability'], 0.001)
        ratio = sorted_probs[0]['probability'] / second_prob
        explanation.append(
            f'The model is {ratio:.1f}x more confident in '
            f'"{sorted_probs[0]["className"]}" than "{sorted_probs[1]["className"]}"'
        )

    for i, col in enumerate(feature_cols[:3]):
        val = input_values[i]
        explanation.append(f'Feature "{col}" = {val:.3f} contributed to this classification')

    result = {
        'sessionId': session_id,
        'predictedClass': predicted_class,
        'confidence': confidence,
        'classProbabilities': class_probabilities,
        'explanation': explanation,
    }
    print(json.dumps(result))


if __name__ == '__main__':
    main()
