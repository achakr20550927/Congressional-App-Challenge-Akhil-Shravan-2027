# NeuraTrack model training

Trains the small on-device classifier the app ships in
`app/public/models/neuratrack-model.json`.

## What's here

- `train_classifier.py` — the trainer. Multinomial logistic regression, two
  heads: `signal_label` and `safety_rating`.
- `clean_labeled.csv` — the 3,000 labeled feature records extracted from the
  workbook (the sheet also contained ~10k unlabeled raw-sample rows, which are
  not used for classification).
- `training_data.csv` — full raw export of the workbook sheet.

## Retrain (e.g. with real data)

1. Put labeled feature records in `clean_labeled.csv` with the same columns.
   Required: the features in `train_classifier.py`'s `FEATURES` list, a `task`
   column, a `split` column (`train`/`validation`/`test`), and the label
   columns `signal_label` and `safety_rating`.
2. `pip install scikit-learn numpy pandas openpyxl`
3. `python3 train_classifier.py`
4. It writes `../app/public/models/neuratrack-model.json` and prints honest
   held-out validation + test metrics.
5. Rebuild the app (`cd ../app && npm run build`). No app code changes needed —
   `model.js` loads whatever is at that path.

## Honesty

The shipped v1.0.0 model was trained on the workbook's **synthetic** feature
data (`is_synthetic=True`). Held-out test accuracy: signal_label ≈ 0.91,
safety_rating ≈ 0.86 — but that's accuracy against the synthetic generator's
own labels, so it measures "did the model learn the generator," not clinical
validity. The app discloses this in clinician-mode detail on every result.
To make this a real clinical tool, retrain on a labeled real dataset (e.g.
PADS on PhysioNet, or mPower via a Synapse data-use agreement) using the same
feature pipeline, and re-validate.

## Why logistic regression (not a deep net or TF.js)

- Exports to a ~6 KB weights matrix; runs as a trivial JS forward pass in
  `app/src/lib/model.js` with zero runtime ML dependencies (no TensorFlow.js
  in the bundle).
- Coefficients double as an honest, model-derived per-feature importance
  signal shown in clinician detail.
- The JS forward pass is verified to reproduce sklearn's `predict_proba` to
  the decimal.
