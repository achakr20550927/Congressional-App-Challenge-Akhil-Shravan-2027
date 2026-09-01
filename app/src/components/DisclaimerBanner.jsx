import { useAppState } from "../context/AppStateContext.jsx";

/**
 * Non-dismissible disclaimer — required on every results/classifier screen,
 * same size as body text, never smaller or lower-contrast (PRD §11.2,
 * Design System "Do's and Don'ts"). Do not add a close button here.
 */
export default function DisclaimerBanner({ compact = false }) {
  const { t } = useAppState();
  return (
    <div className="disclaimer" role="note" aria-label={t("disclaimerShort")}>
      <span className="dot" aria-hidden="true" />
      <p>
        <strong>{t("disclaimerShort")}</strong>{" "}
        {compact ? t("disclaimerOnDevice") : `${t("disclaimerLong")} ${t("disclaimerOnDevice")}`}
      </p>
    </div>
  );
}
