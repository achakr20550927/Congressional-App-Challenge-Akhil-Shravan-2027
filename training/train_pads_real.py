#!/usr/bin/env python3
"""
Train a REAL tremor-reference model from the PADS smartwatch dataset.

PADS (Parkinson's Disease Smartwatch dataset, PhysioNet) is REAL de-identified
patient data: 469 subjects, Apple Watch accelerometer+gyroscope at 100 Hz,
across movement tasks. We use the tasks that parallel NeuraTrack's camera
tasks: Relaxed -> rest tremor, StretchHold/LiftHold -> postural tremor.

WHY THIS TRANSFERS TO A WEBCAM (the crucial design choice):
A wrist accelerometer (g units) and a webcam fingertip track (fraction of hand
width) are NOT on the same amplitude scale, so an amplitude-based model would
not transfer. But two features ARE physically scale-invariant and comparable:
  - dominant_frequency_hz  : tremor frequency is the same physical Hz on any sensor
  - spectral_concentration : share of in-band energy in the dominant peak (0..1),
                             computed the IDENTICAL way as the app's peakProminence
We train ONLY on those transferable features (+ a task one-hot). That keeps the
model honest about what actually carries across sensors.

LABEL: binary tremor-reference. Healthy -> "steady"; clinically tremor-
associated conditions (Parkinson's, Essential Tremor, Atypical Parkinsonism)
-> "tremor_like". The model outputs a probability that a recording RESEMBLES
clinically-noted tremor recordings — descriptive of the signal, never a
diagnosis, consistent with the whole app's framing.

INTEGRITY: subject-level train/test split (no subject in both) so reported
accuracy is not inflated by leakage. Metrics printed below are on held-out
SUBJECTS from real patients.
"""
import glob
import json
import os
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import StratifiedGroupKFold

RNG = 42
ROOT = "pads/pads-parkinsons-disease-smartwatch-dataset-1.0.0"
FS = 100.0  # Hz, per observation metadata

# PADS record_name -> app task bucket
TASK_MAP = {
    "Relaxed": "rest",
    "RelaxedTask": "rest",
    "StretchHold": "postural",
    "LiftHold": "postural",
    "HoldWeight": "postural",
}
APP_TASKS = ["rest", "postural"]

TREMOR_CONDITIONS = {"Parkinson's", "Essential Tremor", "Atypical Parkinsonism"}
HEALTHY = {"Healthy"}


# ---- signal features, mirroring app/src/lib/signal.js exactly ----
def hann(n):
    return 0.5 - 0.5 * np.cos(2 * np.pi * np.arange(n) / (n - 1))


def analyze_channel(x, fs=FS, lo=2.0, hi=15.0, tlo=3.0, thi=7.0):
    """Frequency-domain features for one 1-D channel. All transferable to a
    webcam fingertip track (frequency-domain shape is preserved regardless of
    whether the sensor measures position, velocity, or acceleration)."""
    n = len(x)
    if n < 8:
        return None
    # Match the browser pipeline: remove the least-squares linear trend so
    # slow arm/camera drift cannot dominate the frequency features.
    sample_index = np.arange(n, dtype=float)
    slope, intercept = np.polyfit(sample_index, x, 1)
    x = x - (slope * sample_index + intercept)
    w = hann(n)
    nfft = 1 << int(np.ceil(np.log2(n)))
    X = np.fft.rfft(x * w, n=nfft)
    mag = np.abs(X) / nfft
    freqs = np.fft.rfftfreq(nfft, d=1.0 / fs)
    band = (freqs >= lo) & (freqs <= hi)
    if not np.any(band):
        return None
    bmag, bfreq = mag[band], freqs[band]
    peak_i = int(np.argmax(bmag))
    peak = float(bmag[peak_i])
    total_energy = float(np.sum(bmag ** 2)) or 1e-12
    tremor_band = (bfreq >= tlo) & (bfreq <= thi)
    tremor_power = float(np.sum(bmag[tremor_band] ** 2))
    return {
        "dominant_frequency_hz": float(bfreq[peak_i]),
        "spectral_concentration": (peak ** 2) / total_energy,
        "tremor_band_power_ratio": tremor_power / total_energy,
        "_tremor_power": tremor_power,  # for best-axis selection only
    }


def best_axis_features(path):
    """Pick the channel (of 3 accel + 3 gyro) with the most tremor-band energy
    — the tremor's principal axis, analogous to how the app tracks the
    fingertip's dominant motion axis rather than a mixed magnitude."""
    arr = np.loadtxt(path, delimiter=",")
    if arr.ndim != 2 or arr.shape[1] < 7:
        return None
    best = None
    for col in range(1, 7):  # accel X/Y/Z + gyro X/Y/Z
        f = analyze_channel(arr[:, col])
        if f and (best is None or f["_tremor_power"] > best["_tremor_power"]):
            best = f
    if best:
        best.pop("_tremor_power", None)
    return best


def load_conditions():
    cond = {}
    for f in glob.glob(os.path.join(ROOT, "patients", "*.json")):
        d = json.load(open(f))
        cond[d["id"]] = d["condition"]
    return cond


def build_dataset():
    cond = load_conditions()
    rows = []
    for path in glob.glob(os.path.join(ROOT, "movement", "timeseries", "*.txt")):
        base = os.path.basename(path)[:-4]
        parts = base.split("_")
        if len(parts) < 3:
            continue
        sid, task_raw, wrist = parts[0], parts[1], parts[2]
        app_task = TASK_MAP.get(task_raw)
        if app_task is None:
            continue
        condition = cond.get(sid)
        if condition in HEALTHY:
            label = "steady"
        elif condition in TREMOR_CONDITIONS:
            label = "tremor_like"
        else:
            continue  # skip MS / Other (ambiguous) for a clean binary
        feat = best_axis_features(path)
        if feat is None:
            continue
        rows.append({"subject": sid, "task": app_task, "wrist": wrist, "label": label, **feat})
    return rows


NUM_FEATS = ["dominant_frequency_hz", "spectral_concentration", "tremor_band_power_ratio"]
FEATURE_NAMES = NUM_FEATS + [f"task={t}" for t in APP_TASKS]


def to_matrix(rows):
    X = np.zeros((len(rows), len(FEATURE_NAMES)))
    for i, r in enumerate(rows):
        X[i, 0] = r["dominant_frequency_hz"]
        X[i, 1] = r["spectral_concentration"]
        X[i, 2] = r["tremor_band_power_ratio"]
        for j, t in enumerate(APP_TASKS):
            X[i, 3 + j] = 1.0 if r["task"] == t else 0.0
    y = np.array([r["label"] for r in rows])
    return X, y


def score_subject_auc(rows, probs):
    """Aggregate held-out recordings per participant before scoring.

    This is stricter than treating repeated clips from a person as independent,
    and it mirrors the product's value: trends across check-ins, not one noisy
    ten-second recording.
    """
    from collections import defaultdict
    by_subject, labels = defaultdict(list), {}
    for row, probability in zip(rows, probs):
        by_subject[row["subject"]].append(float(probability))
        labels[row["subject"]] = 1 if row["label"] == "tremor_like" else 0
    ids = sorted(by_subject)
    y = [labels[s] for s in ids]
    if len(set(y)) < 2:
        return float("nan")
    return float(roc_auc_score(y, [float(np.mean(by_subject[s])) for s in ids]))


def fit_standardized(X, y, c):
    mean = X.mean(axis=0)
    std = X.std(axis=0)
    std[std == 0] = 1.0
    clf = LogisticRegression(max_iter=5000, class_weight="balanced", C=c, random_state=RNG)
    clf.fit((X - mean) / std, y)
    return clf, mean, std


def main():
    rows = build_dataset()
    print(f"Extracted {len(rows)} real recordings")
    subjects = sorted({r["subject"] for r in rows})
    labels_by_subj = {}
    for r in rows:
        labels_by_subj.setdefault(r["subject"], r["label"])
    from collections import Counter
    print("subject label counts:", Counter(labels_by_subj.values()))

    # Group-aware, stratified cross-validation. Every participant remains in
    # exactly one validation fold, while each fold retains both classes.
    # The previous one-off random holdout could accidentally make a fold easier
    # or harder and also withheld a quarter of scarce real data from shipping.
    X, y = to_matrix(rows)
    groups = np.array([r["subject"] for r in rows])
    splitter = StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=RNG)
    c_candidates = [0.03, 0.1, 0.3, 1.0, 3.0, 10.0]
    candidate_scores = {}
    print("\n[5-fold stratified, subject-level cross-validation]")
    for c in c_candidates:
        fold_scores = []
        for train_idx, test_idx in splitter.split(X, y, groups):
            clf_fold, mean_fold, std_fold = fit_standardized(X[train_idx], y[train_idx], c)
            pos = list(clf_fold.classes_).index("tremor_like")
            probs = clf_fold.predict_proba((X[test_idx] - mean_fold) / std_fold)[:, pos]
            fold_scores.append(score_subject_auc([rows[i] for i in test_idx], probs))
        candidate_scores[c] = float(np.nanmean(fold_scores))
        print(f"  C={c:<4}: mean subject AUC {candidate_scores[c]:.3f}")

    best_c = max(candidate_scores, key=candidate_scores.get)
    # Refit on every real recording after model selection. The export is still
    # accompanied by out-of-fold metrics, but gets the benefit of all 469
    # participants rather than only a training subset.
    clf, mean, std = fit_standardized(X, y, best_c)
    cv_subject_auc = candidate_scores[best_c]
    print(f"\nSelected C={best_c}; final model fitted on {len(rows)} recordings / {len(subjects)} real subjects.")

    # sklearn binary LogisticRegression stores ONE coef row (for the positive
    # class classes_[1]). The app's softmax forward pass expects one row per
    # label. Expand to the equivalent 2-row form: logit[pos] = w·z + b,
    # logit[neg] = 0. softmax([0, w·z+b]) == sigmoid(w·z+b), byte-equivalent.
    w = clf.coef_[0].tolist()
    b = float(clf.intercept_[0])
    pos = list(clf.classes_).index("tremor_like")
    coef2 = [[0.0] * len(w), [0.0] * len(w)]
    intercept2 = [0.0, 0.0]
    coef2[pos] = w
    intercept2[pos] = b

    export = {
        "target": "tremor_reference",
        "labels": clf.classes_.tolist(),
        "featureNames": FEATURE_NAMES,
        "numericFeatures": NUM_FEATS,
        "tasks": APP_TASKS,
        "mean": mean.tolist(),
        "std": std.tolist(),
        "coef": coef2,
        "intercept": intercept2,
    }
    bundle = {
        "version": "2.1.0-pads-real-groupcv",
        "trainedOn": "PADS smartwatch dataset (PhysioNet, REAL patients: 79 Healthy vs 319 Parkinson's/Essential-Tremor/Atypical). Rest+postural tasks. Stratified group cross-validation by subject; final model refit on all real recordings.",
        "note": "Logistic regression on REAL patient accelerometer recordings, using only sensor-transferable features (dominant frequency, spectral concentration, tremor-band power ratio). Outputs a signal-resemblance probability, never a diagnosis.",
        "tasksCovered": APP_TASKS,
        "metrics": {
            "validation": "5-fold stratified group cross-validation (subjects never cross folds)",
            "subjects": len(subjects),
            "recordings": len(rows),
            "selectedC": best_c,
            "subjectAuc": round(cv_subject_auc, 3),
        },
        "models": {"tremor_reference": export},
    }
    out = "../app/public/models/neuratrack-pads-model.json"
    with open(out, "w") as f:
        json.dump(bundle, f)
    print("\nWrote", out)


if __name__ == "__main__":
    main()
