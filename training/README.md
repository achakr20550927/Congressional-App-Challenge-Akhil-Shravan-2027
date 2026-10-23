# NeuraTrack research benchmark

## Active pipeline

`benchmark_pads.py` is the current reproducible benchmark. It predicts **participant condition** (healthy versus selected diagnosed groups) from smartwatch measurements. It is not a tremor detector trained on recording-level labels and is not a webcam diagnostic model.

Completed run: 398 participants, 3,980 recordings, 80 features, 287 model fits. Simple nested-validation ROC-AUC **0.797**; expanded **0.874** (participant-bootstrap 95% interval **0.834–0.910**). ROC-AUC is not percent diagnostic accuracy. Full metrics, folds, libraries, seed, and limitations are in `app/public/models/research-evaluation.json`.

## Reproduce

1. Download [PADS v1.0.0](https://physionet.org/content/parkinsons-disease-smartwatch/1.0.0/) and review its license.
2. Place the unpacked data at `training/pads/pads-parkinsons-disease-smartwatch-dataset-1.0.0/`, including `patients/` and `movement/timeseries/`.
3. Create a Python environment, install `training/requirements.txt`, and run from the repository root:

```sh
python3 -m venv training/.venv
source training/.venv/bin/activate
pip install -r training/requirements.txt
python3 training/benchmark_pads.py
```

Raw data, cache, and fitted joblib artifact are local/ignored, not public app downloads. The script writes a fitted research estimator to `training/.cache/pads-research-model.joblib` and the aggregate evaluation JSON to the app. Do not load untrusted joblib files.

## Evaluation design

- First 0.5 seconds removed: dataset authors identify watch vibration at recording start.
- Timestamp resampling; acceleration and angular velocity features remain separate.
- Five selected tasks; both wrists aggregated into one row per participant.
- Five outer stratified participant folds, with three-fold inner model selection.
- Imputation and scaling learned only inside training folds.
- Simple 20-feature logistic baseline versus expanded 80-feature logistic/ExtraTrees/histogram-gradient-boosting search.
- Final selected estimator: logistic regression. The final all-data refit is not an independent test.
- Paired bootstrap of out-of-fold participant predictions; intervals do not include retraining uncertainty.

## Critical limitations

PADS condition labels do not say whether a particular recording contains tremor. The source is smartwatch sensors, not camera landmarks. This single-source selected cohort does not establish performance across devices, population groups, clinical settings, or unseen disease categories. No medical threshold was selected or validated. Clinical webcam validation requires new appropriately consented, clinician-labeled data and independent testing.

**License:** PADS uses CC BY-NC-SA 4.0. This is a non-commercial research benchmark. Obtain appropriate rights before commercial reuse; do not assume this research asset is ready for a startup’s commercial deployment.

## Legacy experiments

`train_classifier.py`, `train_pads_real.py`, the workbook exports, and old `neuratrack-model.json` / `neuratrack-pads-model.json` remain historical artifacts. The earlier workbook labels are synthetic; their test scores are not clinical evidence. Prior sensor-transfer/resemblance claims are superseded by this document. Do not use these scripts for the current product or infer webcam performance from their outputs. The app’s current capture/results path does not use them, and the old classifier entry point rejects models without explicit webcam validation.
