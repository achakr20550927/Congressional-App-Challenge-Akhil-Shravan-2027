#!/usr/bin/env python3
"""
NeuraTrack model trainer.

Trains two small multinomial logistic-regression models from the labeled
feature workbook:
  1. signal_label  (steady | tremor_like | bradykinesia_like | irregular_motion | poor_quality)
  2. safety_rating (steady | keep_an_eye | worth_conversation | try_again)

DELIBERATE CONSTRAINT: we train ONLY on features the browser app can actually
compute at runtime (see FEATURES below), plus a task one-hot. Training on
richer workbook columns the app can't reproduce would produce a model that
can't run in production. Logistic regression is chosen over a deeper net
because it exports to a tiny weights matrix, runs as a trivial JS forward
pass (no TensorFlow.js in the bundle), and its coefficients double as an
honest per-feature importance signal.

HONESTY: the workbook is labeled is_synthetic=True. This model has learned the
synthetic data generator's rules, not verified patient physiology. Metrics
below are on a held-out split of that same synthetic distribution. Treat as a
pipeline + smoothing layer over the hand-written rules, not clinical proof.
"""
import json
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score

RNG = 42

# App-computable numeric features (must match runtime TaskCapture output).
FEATURES = [
    "dominant_frequency_hz",
    "spectral_concentration",
    "amplitude_pct_hand_width",
    "tap_rate_hz",
    "tap_decrement_pct",
    "spiral_rmse_norm",
    "left_right_asymmetry_pct",
    "quality_score",
    "visibility_pct",
]
TASKS = ["rest_tremor", "postural_tremor", "finger_tapping", "pronation_supination", "spiral_drawing"]


def build_matrix(df):
    num = df[FEATURES].apply(pd.to_numeric, errors="coerce").fillna(0.0).to_numpy(dtype=float)
    onehot = np.zeros((len(df), len(TASKS)), dtype=float)
    for i, task in enumerate(TASKS):
        onehot[:, i] = (df["task"] == task).astype(float)
    return np.hstack([num, onehot])


FEATURE_NAMES = FEATURES + [f"task={t}" for t in TASKS]


def train_target(df_tr, df_va, df_te, target):
    Xtr, Xva, Xte = build_matrix(df_tr), build_matrix(df_va), build_matrix(df_te)
    ytr = df_tr[target].to_numpy()

    # Standardize using TRAIN stats only, store for the JS forward pass.
    mean = Xtr.mean(axis=0)
    std = Xtr.std(axis=0)
    std[std == 0] = 1.0
    Ztr = (Xtr - mean) / std
    Zva = (Xva - mean) / std
    Zte = (Xte - mean) / std

    clf = LogisticRegression(max_iter=2000, C=1.0, random_state=RNG)
    clf.fit(Ztr, ytr)

    print(f"\n===== target: {target} =====")
    for name, X, y in [("validation", Zva, df_va[target]), ("test", Zte, df_te[target])]:
        pred = clf.predict(X)
        acc = accuracy_score(y, pred)
        print(f"\n[{name}] accuracy = {acc:.3f}")
        print(classification_report(y, pred, zero_division=0))
        print("confusion (rows=true):")
        labels = sorted(pd.unique(df_tr[target]))
        cm = confusion_matrix(y, pred, labels=labels)
        print("labels:", labels)
        print(cm)

    export = {
        "target": target,
        "labels": clf.classes_.tolist(),
        "featureNames": FEATURE_NAMES,
        "numericFeatures": FEATURES,
        "tasks": TASKS,
        "mean": mean.tolist(),
        "std": std.tolist(),
        "coef": clf.coef_.tolist(),      # shape [n_classes, n_features]
        "intercept": clf.intercept_.tolist(),  # shape [n_classes]
    }
    return export


def main():
    df = pd.read_csv("clean_labeled.csv")
    df_tr = df[df["split"] == "train"]
    df_va = df[df["split"] == "validation"]
    df_te = df[df["split"] == "test"]
    print(f"train={len(df_tr)} validation={len(df_va)} test={len(df_te)}")

    models = {
        "signal_label": train_target(df_tr, df_va, df_te, "signal_label"),
        "safety_rating": train_target(df_tr, df_va, df_te, "safety_rating"),
    }

    bundle = {
        "version": "1.0.0-synthetic",
        "trainedOn": "neuratrack_training_data_workbook.xlsx (is_synthetic=True, 3000 labeled records)",
        "note": "Multinomial logistic regression trained on SYNTHETIC feature data. Learned the data generator's rules, not verified patient physiology. Outputs remain descriptive-of-signal, never a diagnosis.",
        "models": models,
    }
    out = "../app/public/models/neuratrack-model.json"
    with open(out, "w") as f:
        json.dump(bundle, f)
    print(f"\nWrote {out}")


if __name__ == "__main__":
    main()
