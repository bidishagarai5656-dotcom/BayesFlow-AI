import sys
import json
import os
import pickle
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, roc_curve, auc, classification_report
)
from sklearn.preprocessing import label_binarize


def safe_float(val):
    try:
        return float(val)
    except Exception:
        return 0.0


def main():
    data = json.load(sys.stdin)
    session_id = data['sessionId']
    session_dir = f'/tmp/bayesflow_{session_id}'

    if not os.path.exists(session_dir):
        print(json.dumps({'error': 'Session not found'}))
        sys.exit(1)

    model_path = os.path.join(session_dir, 'model.pkl')
    test_path = os.path.join(session_dir, 'test_data.pkl')

    if not os.path.exists(model_path) or not os.path.exists(test_path):
        print(json.dumps({'error': 'Model not trained yet. Please complete stage 6 first.'}))
        sys.exit(1)

    with open(model_path, 'rb') as f:
        model_data = pickle.load(f)
    with open(test_path, 'rb') as f:
        test_data = pickle.load(f)

    model = model_data['model']
    class_names = model_data['class_names']
    X_test = test_data['X_test']
    y_test = test_data['y_test']

    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)

    accuracy = safe_float(accuracy_score(y_test, y_pred))

    avg = 'binary' if len(class_names) == 2 else 'macro'
    precision = safe_float(precision_score(y_test, y_pred, average=avg, zero_division=0))
    recall = safe_float(recall_score(y_test, y_pred, average=avg, zero_division=0))
    f1 = safe_float(f1_score(y_test, y_pred, average=avg, zero_division=0))

    cm = confusion_matrix(y_test, y_pred)
    confusion_matrix_list = [[int(v) for v in row] for row in cm.tolist()]

    class_report = []
    report = classification_report(y_test, y_pred, target_names=class_names, output_dict=True, zero_division=0)
    for cls_name in class_names:
        if cls_name in report:
            r = report[cls_name]
            class_report.append({
                'className': cls_name,
                'precision': safe_float(r['precision']),
                'recall': safe_float(r['recall']),
                'f1Score': safe_float(r['f1-score']),
                'support': int(r['support']),
            })

    roc_data = []
    if len(class_names) == 2:
        fpr, tpr, _ = roc_curve(y_test, y_proba[:, 1])
        for fp, tp in zip(fpr.tolist(), tpr.tolist()):
            roc_data.append({'fpr': safe_float(fp), 'tpr': safe_float(tp), 'label': None})
    else:
        y_bin = label_binarize(y_test, classes=list(range(len(class_names))))
        for i, cls_name in enumerate(class_names):
            if y_bin.shape[1] > i:
                fpr, tpr, _ = roc_curve(y_bin[:, i], y_proba[:, i])
                for fp, tp in zip(fpr.tolist()[:20], tpr.tolist()[:20]):
                    roc_data.append({'fpr': safe_float(fp), 'tpr': safe_float(tp), 'label': cls_name})

    result = {
        'sessionId': session_id,
        'accuracy': accuracy,
        'precision': precision,
        'recall': recall,
        'f1Score': f1,
        'confusionMatrix': confusion_matrix_list,
        'rocData': roc_data,
        'classReport': class_report,
        'labels': class_names,
    }
    print(json.dumps(result))


if __name__ == '__main__':
    main()
