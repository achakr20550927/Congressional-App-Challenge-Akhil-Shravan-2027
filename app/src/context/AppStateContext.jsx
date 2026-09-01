import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { strings } from "../i18n/strings.js";
import { clearAllLocalData } from "../lib/storage.js";

const STORAGE_KEYS = {
  consent: "neuratrack.consent.v1",
  profile: "neuratrack.profile.v1",
  device: "neuratrack.device.v1",
  settings: "neuratrack.settings.v1",
  mode: "neuratrack.mode.v1",
};

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage unavailable (private mode, quota) — app still works in-memory for the session.
  }
}

const defaultSettings = { largeText: false, reducedMotion: false };

const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  const [consent, setConsentState] = useState(() => readJson(STORAGE_KEYS.consent, null));
  const [profile, setProfileState] = useState(() => readJson(STORAGE_KEYS.profile, null));
  const [device, setDeviceState] = useState(() => readJson(STORAGE_KEYS.device, null));
  const [settings, setSettingsState] = useState(() => readJson(STORAGE_KEYS.settings, defaultSettings));
  const [mode, setModeState] = useState(() => readJson(STORAGE_KEYS.mode, "patient"));

  const language = profile?.language || "en";

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    document.documentElement.classList.toggle("text-lg", !!settings.largeText);
  }, [settings.largeText]);

  useEffect(() => {
    document.documentElement.classList.toggle("reduced-motion", !!settings.reducedMotion);
  }, [settings.reducedMotion]);

  const acceptConsent = useCallback(() => {
    const value = { acceptedAt: new Date().toISOString() };
    writeJson(STORAGE_KEYS.consent, value);
    setConsentState(value);
  }, []);

  const saveProfile = useCallback((next) => {
    writeJson(STORAGE_KEYS.profile, next);
    setProfileState(next);
  }, []);

  const setLanguage = useCallback(
    (code) => {
      const next = { ...(profile || { name: "", condition: "" }), language: code };
      writeJson(STORAGE_KEYS.profile, next);
      setProfileState(next);
    },
    [profile]
  );

  const saveCalibration = useCallback((handScale) => {
    const value = { handScale, calibratedAt: new Date().toISOString() };
    writeJson(STORAGE_KEYS.device, value);
    setDeviceState(value);
  }, []);

  const updateSettings = useCallback((patch) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...patch };
      writeJson(STORAGE_KEYS.settings, next);
      return next;
    });
  }, []);

  const setMode = useCallback((next) => {
    writeJson(STORAGE_KEYS.mode, next);
    setModeState(next);
  }, []);

  const clearAllData = useCallback(async () => {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    await clearAllLocalData();
    setConsentState(null);
    setProfileState(null);
    setDeviceState(null);
    setSettingsState(defaultSettings);
    setModeState("patient");
  }, []);

  const t = useMemo(() => {
    const dict = strings[language] || strings.en;
    return (key) => dict[key] ?? strings.en[key] ?? key;
  }, [language]);

  const value = useMemo(
    () => ({
      consent,
      profile,
      device,
      settings,
      mode,
      language,
      t,
      hasConsent: !!consent,
      hasProfile: !!profile?.name,
      hasCalibration: !!device?.handScale,
      acceptConsent,
      saveProfile,
      setLanguage,
      saveCalibration,
      updateSettings,
      setMode,
      clearAllData,
    }),
    [consent, profile, device, settings, mode, language, t, acceptConsent, saveProfile, setLanguage, saveCalibration, updateSettings, setMode, clearAllData]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
