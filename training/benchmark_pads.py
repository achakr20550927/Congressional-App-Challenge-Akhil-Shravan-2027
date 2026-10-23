#!/usr/bin/env python3
"""Research benchmark, NOT a webcam diagnostic model.

Target: PADS participant condition (Healthy vs selected diagnosed conditions).
Five outer participant folds; all model selection is inside three inner folds.
One row per participant eliminates repeated-recording leakage. Sensor types are
kept separate: acceleration and angular velocity are not interchangeable.
Run: python3 training/benchmark_pads.py
"""
import hashlib
import json
from pathlib import Path
from collections import Counter
import joblib
import numpy as np
import scipy
from scipy.signal import detrend, welch
import sklearn
from sklearn.base import clone
from sklearn.pipeline import make_pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import ExtraTreesClassifier, HistGradientBoostingClassifier
from sklearn.model_selection import StratifiedKFold, GridSearchCV
from sklearn.metrics import roc_auc_score, balanced_accuracy_score, brier_score_loss, confusion_matrix, roc_curve, average_precision_score

BASE = Path(__file__).resolve().parent
DATA = BASE / 'pads/pads-parkinsons-disease-smartwatch-dataset-1.0.0'
CACHE = BASE / '.cache'
TASKS = ['Relaxed', 'RelaxedTask', 'StretchHold', 'LiftHold', 'HoldWeight']
POSITIVE = {"Parkinson's", 'Essential Tremor', 'Atypical Parkinsonism'}
FEATURES = ['peak_hz', 'band_3_7', 'band_7_12', 'peak_share', 'entropy', 'centroid_hz', 'log_rms', 'window_variation']
SEED = 20261022

def extract(sensor, fs):
    sensor = detrend(sensor, axis=0)
    # Sum power within a single sensor type, rather than choosing between
    # accelerometer and gyroscope channels using incompatible raw units.
    freq, powers = welch(sensor, fs=fs, nperseg=min(len(sensor), round(fs*4)), axis=0)
    power = powers.sum(axis=1)
    mask = (freq >= 2) & (freq <= min(15, fs*.45))
    f, p = freq[mask], power[mask]
    p = p / max(p.sum(), 1e-20)
    peak = f[np.argmax(p)]
    segments = np.array_split(sensor, 5)
    rms = np.array([np.sqrt(np.mean(s*s)) for s in segments])
    return [peak, p[(f>=3)&(f<=7)].sum(), p[(f>7)&(f<=12)].sum(),
            p[np.abs(f-peak)<=.5].sum(), -(p*np.log(p+1e-20)).sum()/np.log(len(p)),
            (f*p).sum(), np.log10(max(np.sqrt(np.mean(sensor*sensor)), 1e-12)),
            rms.std()/max(rms.mean(), 1e-12)]

def dataset():
    CACHE.mkdir(exist_ok=True)
    paths = sorted((DATA/'movement/timeseries').glob('*.txt'))
    patients = sorted((DATA/'patients').glob('*.json'))
    if not paths or not patients:
        raise SystemExit('PADS data missing. See training/README.md for the public source.')
    signature = hashlib.sha256((Path(__file__).read_text()+''.join(f'{p.name}:{p.stat().st_size}:{p.stat().st_mtime_ns}' for p in paths+patients)).encode()).hexdigest()
    cache = CACHE/'features-v3.npz'
    if cache.exists():
        c = np.load(cache)
        if str(c['signature']) == signature:
            return c['X'], c['y'], c['conditions'], c['names'].tolist(), int(c['recordings']), signature
    conditions = {str(d['id']): d['condition'] for p in patients for d in [json.loads(p.read_text())]}
    records, count = {}, 0
    for path in paths:
        sid, task, wrist = path.stem.split('_')[:3]
        if task not in TASKS or conditions.get(sid) not in POSITIVE | {'Healthy'}:
            continue
        arr = np.loadtxt(path, delimiter=',')
        # Dataset authors recommend removing the initial watch vibration.
        arr = arr[arr[:,0] >= arr[0,0] + .5]
        if len(arr)<300 or not np.isfinite(arr).all() or (np.diff(arr[:,0])<=0).any():
            continue
        # Respect recording timestamps; resample each channel before Welch.
        fs = 1/np.median(np.diff(arr[:,0]))
        grid = np.arange(arr[0,0], arr[-1,0], 1/fs)
        uniform = np.column_stack([np.interp(grid, arr[:,0], arr[:,i]) for i in range(1,7)])
        feat = extract(uniform[:,:3], fs)+extract(uniform[:,3:], fs)
        records.setdefault(sid, {}).setdefault(task, []).append(feat)
        count += 1
        if count % 500 == 0: print(f'Extracted {count} recordings', flush=True)
    names = [f'{task}/{sensor}/{feat}' for task in TASKS for sensor in ['acceleration','angular_velocity'] for feat in FEATURES]
    X, labels, conds = [], [], []
    for sid, recs in sorted(records.items()):
        # Median of left/right wrists: all data for a person stays in one row.
        X.append(np.concatenate([np.median(recs[t],axis=0) if t in recs else np.full(16,np.nan) for t in TASKS]))
        labels.append(int(conditions[sid] in POSITIVE)); conds.append(conditions[sid])
    X, y, conds = np.asarray(X), np.asarray(labels), np.asarray(conds)
    np.savez_compressed(cache, X=X, y=y, conditions=conds, names=names, recordings=count, signature=signature)
    return X, y, conds, names, count, signature

def search(X, y, expanded, seed):
    pipe = make_pipeline(SimpleImputer(strategy='median'), StandardScaler(), LogisticRegression(max_iter=3000))
    grids = [{'logisticregression':[LogisticRegression(max_iter=3000, class_weight='balanced',random_state=seed)],
              'logisticregression__C':[.01,.1,1,10]}]
    if expanded:
        # The pipeline's final step keeps its name when replacing estimators.
        grids += [{'logisticregression':[ExtraTreesClassifier(n_estimators=160,class_weight='balanced',n_jobs=1,random_state=seed)],
                   'logisticregression__min_samples_leaf':[3,8], 'logisticregression__max_features':[.5,1.]},
                  {'logisticregression':[HistGradientBoostingClassifier(max_iter=100,l2_regularization=5,random_state=seed)],
                   'logisticregression__max_leaf_nodes':[7,15], 'logisticregression__learning_rate':[.03,.08]}]
    cv=StratifiedKFold(n_splits=3,shuffle=True,random_state=seed)
    grid=GridSearchCV(pipe, grids, cv=cv, scoring='roc_auc', n_jobs=2, error_score='raise', refit=True)
    grid.fit(X,y)
    return grid

def metrics(y,p):
    pred=p>=.5
    tn,fp,fn,tp=confusion_matrix(y,pred).ravel()
    fpr,tpr,_=roc_curve(y,p)
    return dict(auc=float(roc_auc_score(y,p)), averagePrecision=float(average_precision_score(y,p)),
                balancedAccuracy=float(balanced_accuracy_score(y,pred)), brier=float(brier_score_loss(y,p)),
                sensitivity=float(tp/(tp+fn)), specificity=float(tn/(tn+fp)),
                confusion=[[int(tn),int(fp)],[int(fn),int(tp)]],
                roc=[dict(fpr=float(a),tpr=float(b)) for a,b in zip(fpr,tpr)])

def main():
    X,y,conditions,names,n_recordings,signature=dataset()
    print(f'{len(y)} participants; {n_recordings} recordings; {X.shape[1]} features; {dict(Counter(conditions))}', flush=True)
    # A deliberately simple spectral baseline with the same split discipline.
    simple_idx=[i for i,n in enumerate(names) if n.endswith(('/peak_hz','/band_3_7'))]
    baseline=X[:,simple_idx]
    outer=StratifiedKFold(n_splits=5,shuffle=True,random_state=SEED)
    p_base=np.zeros(len(y)); p_new=np.zeros(len(y)); folds=[]
    for k,(train,test) in enumerate(outer.split(X,y)):
        b=search(baseline[train],y[train],False,SEED+k)
        m=search(X[train],y[train],True,SEED+k)
        p_base[test]=b.predict_proba(baseline[test])[:,1]
        p_new[test]=m.predict_proba(X[test])[:,1]
        folds.append(dict(fold=k+1,trainParticipants=len(train),testParticipants=len(test),
                          selectedModel=type(m.best_estimator_[-1]).__name__,
                          innerAuc=float(m.best_score_),outerAuc=float(roc_auc_score(y[test],p_new[test]))))
        print(f'Outer fold {k+1}/5: {folds[-1]}',flush=True)
    rng=np.random.default_rng(SEED); aucs=[]; improvements=[]
    for _ in range(2000):
        idx=np.concatenate([rng.choice(np.where(y==c)[0],size=(y==c).sum(),replace=True) for c in [0,1]])
        a=roc_auc_score(y[idx],p_new[idx]); aucs.append(a)
        improvements.append(a-roc_auc_score(y[idx],p_base[idx]))
    final=search(X,y,True,SEED+100)
    joblib.dump(final.best_estimator_,CACHE/'pads-research-model.joblib')
    report=dict(version='3.0.0-research',seed=SEED,dataset='PADS v1.0.0',
                source='https://physionet.org/content/parkinsons-disease-smartwatch/1.0.0/',
                preprocessing='First 0.5 seconds removed per recording to exclude watch vibration; timestamp resampling; separate sensor-type Welch spectra.',
                license='CC BY-NC-SA 4.0. Non-commercial research; obtain appropriate rights before commercial reuse.',
                target='Healthy versus Parkinson’s, Essential Tremor, or Atypical Parkinsonism participant condition',
                deployment='Research only. Not used to classify webcam recordings or diagnose disease.',
                webcamValidated=False, participants=len(y),recordings=n_recordings,features=len(names),
                conditions={str(k):int(v) for k,v in Counter(conditions).items()},
                validation='Nested 5 outer × 3 inner stratified participant folds. Preprocessing and selection fit only on training participants.',
                modelFits=5*3*(4+12)+3*12+5*2+1,
                baseline=metrics(y,p_base),expanded=metrics(y,p_new),
                auc95CI=np.quantile(aucs,[.025,.975]).tolist(),
                aucDelta95CI=np.quantile(improvements,[.025,.975]).tolist(),folds=folds,
                finalModel=type(final.best_estimator_[-1]).__name__,
                libraries=dict(numpy=np.__version__,scipy=scipy.__version__,sklearn=sklearn.__version__),
                datasetFingerprint=signature,
                limitations=['Condition labels are not recording-level tremor labels.',
                  'Smartwatch signals are not validated substitutes for camera landmarks.',
                  'Participant bootstrap intervals do not include retraining uncertainty.',
                  'Single source, selected diagnoses, no external cohort or prospective clinical validation.',
                  'Threshold 0.5 is a research benchmark, not a clinical operating threshold.'])
    destination=BASE.parent/'app/public/models/research-evaluation.json'
    destination.write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({k:report[k] for k in ['finalModel','auc95CI','aucDelta95CI','modelFits']},indent=2),flush=True)
    print(f'Baseline AUC: {report["baseline"]["auc"]:.3f}; expanded nested AUC: {report["expanded"]["auc"]:.3f}',flush=True)
    print(f'Report: {destination}',flush=True)

if __name__=='__main__': main()
