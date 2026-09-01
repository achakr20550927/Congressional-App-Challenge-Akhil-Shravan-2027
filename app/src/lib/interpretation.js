// interpretation.js — turns a classifyPattern() result into a genuinely
// useful, honest explanation: what we measured, what that kind of pattern is
// (and isn't) discussed as in the literature, and concrete next steps.
// Never a diagnosis, never a disease name — see classifier.js's HONESTY NOTE.
//
// This is deliberately a separate module from classifier.js: classifier.js
// owns the PRD's "model" contract (feature vector in, label+confidence out);
// this module owns user-facing narrative copy, which is bilingual (EN/ES)
// like the rest of the product's UI chrome, unlike classifier.js's internal
// `rationale` field (a short clinician-mode debug string, English-only,
// same as before this change).

function fmt(n, digits = 1) {
  return Number.isFinite(n) ? n.toFixed(digits) : "—";
}

const en = {
  "no-significant-rest-tremor": {
    headline: () => "No significant tremor detected at rest.",
    meaning: () => [
      "Your hand's movement during this recording didn't show a clear, repeating oscillation — no dominant rhythm stood out from ordinary small movements.",
      "That's a reassuring finding on its own: no evidence of a resting tremor pattern in this recording.",
    ],
    nextSteps: () => [
      "Nothing here suggests concern by itself. If you're tracking a known condition, keep checking in periodically so you build a real trend.",
      "If you or someone close to you notices new tremor-like symptoms between check-ins, that's worth mentioning to a clinician regardless of what any single reading shows.",
    ],
  },
  "rest-dominant-4-6hz": {
    headline: (f) => `A rhythmic oscillation was detected at rest, around ${fmt(f.frequency)} Hz.`,
    meaning: (f) => [
      `Your hand showed a repeating oscillation around ${fmt(f.frequency)} Hz while at rest (amplitude ${fmt(f.rmsAmplitude, 3)}).`,
      "Movement-disorder literature discusses this frequency band in connection with rest tremor. That doesn't mean this reading is one — a single recording can't establish that.",
    ],
    nextSteps: () => [
      "One reading isn't a pattern. Repeat this task every week or two, at a similar time of day, to see whether it's consistent.",
      "If this is new, one-sided, or getting more noticeable across sessions, it's reasonable to mention to a licensed clinician — export a PDF report so they see real numbers, not just a description.",
    ],
  },
  "rest-oscillation-atypical-band": {
    headline: (f) => `An oscillation was detected at ${fmt(f.frequency)} Hz — outside the range most discussed for rest tremor.`,
    meaning: (f) => [
      `The dominant rhythm in this recording was about ${fmt(f.frequency)} Hz, outside the ~4-6 Hz range most often discussed for tremor at rest.`,
      "This could reflect ordinary small movements, camera or lighting noise, or a genuine oscillation at an atypical rate.",
    ],
    nextSteps: () => [
      "Try recording again in good, even lighting with your hand fully supported — this reading is more likely to reflect setup than a symptom.",
      "If it repeats consistently at this same frequency across sessions, mention it at your next check-in.",
    ],
  },
  "slow-movement-not-tremor": {
    headline: () => "Slow hand movement was picked up — not a tremor rhythm.",
    meaning: (f) => [
      `The main movement in this recording repeated about ${fmt(f.frequency)} times per second — slower than the rhythms doctors call tremor (which start around 3-4 per second).`,
      "Slow movement like this is usually just your hand settling, shifting, or drifting — the kind of motion every hand makes. It is not the fast, rhythmic shaking that tremor refers to.",
    ],
    nextSteps: () => [
      "Nothing here suggests concern. For an even cleaner reading next time, rest your hand fully on a table or your lap and let it go completely relaxed before recording starts.",
      "Keep doing occasional check-ins — a steady pattern over weeks is what makes these readings meaningful.",
    ],
  },
  "no-significant-postural-tremor": {
    headline: () => "No significant tremor detected while your arm was extended.",
    meaning: () => [
      "Holding your arm out against gravity didn't produce a clear, repeating oscillation in this recording.",
      "That's a reassuring finding on its own for this task.",
    ],
    nextSteps: () => [
      "Nothing here suggests concern by itself — keep checking in periodically if you're tracking symptoms over time.",
      "New or worsening symptoms noticed outside of testing are worth mentioning to a clinician regardless of a single reading.",
    ],
  },
  "postural-dominant-6-12hz": {
    headline: (f) => `A rhythmic oscillation was detected with your arm extended, around ${fmt(f.frequency)} Hz.`,
    meaning: (f) => [
      `Your hand oscillated at about ${fmt(f.frequency)} Hz while held against gravity (amplitude ${fmt(f.rmsAmplitude, 3)}).`,
      "This higher-frequency band is more often discussed in connection with postural/kinetic tremor than the slower rest-tremor band — again, this describes the signal, not a diagnosis.",
    ],
    nextSteps: () => [
      "Repeat this task across a few sessions — a single reading can be affected by fatigue, caffeine, or how tired your arm was that day.",
      "If it's consistent, new, or worsening, bring your exported report to a clinician.",
    ],
  },
  "rest-band-pattern-during-posture": {
    headline: (f) => `The oscillation detected with your arm extended (${fmt(f.frequency)} Hz) matched the slower rest-tremor band, not the postural band.`,
    meaning: (f) => [
      `At about ${fmt(f.frequency)} Hz, this is slower than the range typically discussed for postural tremor.`,
      "A rest-frequency pattern that persists once a limb is held up is a more specific pattern sometimes discussed in the movement-disorder literature.",
    ],
    nextSteps: () => [
      "This is a more specific, less common pattern than a simple postural-tremor reading — worth tracking over a few more sessions.",
      "If it repeats, it's a good, specific detail to bring to a clinician alongside your rest-tremor results.",
    ],
  },
  "postural-oscillation-atypical-band": {
    headline: (f) => `An oscillation was detected at ${fmt(f.frequency)} Hz — outside the range most discussed for postural tremor.`,
    meaning: (f) => [`The dominant rhythm was about ${fmt(f.frequency)} Hz.`, "This could reflect arm fatigue, camera noise, or a genuine oscillation outside the typical band."],
    nextSteps: () => [
      "Try resting your elbow lightly and repeating the task — fatigue during a fully unsupported hold can affect this reading.",
      "Track it over a few sessions before drawing any conclusions.",
    ],
  },
  "tap-insufficient-data": {
    headline: () => "Not enough clear taps were detected to assess this recording.",
    meaning: () => ["We need a steady, clearly visible thumb-to-index tapping motion for the full 10 seconds to measure rate and amplitude decrement."],
    nextSteps: () => ["Try again with your hand fully in frame and good lighting, tapping as big and as fast as feels comfortable."],
  },
  "tap-amplitude-decrement": {
    headline: (f) => `Tapping amplitude decreased by about ${fmt(f.tapDecrementPct, 0)}% over the recording.`,
    meaning: (f) => [
      `Your tap size shrank by about ${fmt(f.tapDecrementPct, 0)}% from the first half of the recording to the second half, at a rate of about ${fmt(f.tapRateHz)} taps/sec.`,
      "A decrease in repetitive-movement amplitude over time is a pattern discussed in the literature in connection with slowed movement — a single recording can't establish that on its own.",
    ],
    nextSteps: () => [
      "Fatigue alone can cause this — try the task again after resting your hand for a minute.",
      "If this decrement shows up consistently across multiple sessions, especially on one side more than the other, it's a specific, useful detail to bring to a clinician.",
    ],
  },
  "tap-rate-reduced": {
    headline: (f) => `Tapping speed (${fmt(f.tapRateHz)} taps/sec) was slower than a typical brisk pace.`,
    meaning: (f) => [`You tapped at about ${fmt(f.tapRateHz)} taps/sec, without a strong decrease in size across the recording.`],
    nextSteps: () => [
      "Try again tapping as quickly and as big as comfortably possible — effort and comfort affect this reading a lot.",
      "If your pace stays consistently slow across sessions, mention it at your next check-in.",
    ],
  },
  "tap-rhythm-regular": {
    headline: (f) => `Tapping stayed fast and steady (${fmt(f.tapRateHz)} taps/sec) throughout the recording.`,
    meaning: (f) => [`You tapped at about ${fmt(f.tapRateHz)} taps/sec with no notable decrease in size over the 10 seconds — a steady, regular pattern.`],
    nextSteps: () => ["Nothing here suggests concern by itself. Keep this as a baseline to compare future sessions against."],
  },
  "no-consistent-rotation-rhythm": {
    headline: () => "No consistent rotation rhythm was detected.",
    meaning: () => ["Your palm-up/palm-down rotations didn't settle into a clear, repeating pace during this recording."],
    nextSteps: () => [
      "Try again keeping your elbow steady and rotating at a single, comfortable, repeating pace.",
      "This finding alone isn't concerning — irregular pacing is common when people are still getting used to the motion.",
    ],
  },
  "slow-rotation-pace": {
    headline: (f) => `A steady but slow rotation rhythm was detected (${fmt(f.frequency)} Hz).`,
    meaning: (f) => [`Your rotations settled into a consistent pace of about ${fmt(f.frequency)} Hz.`],
    nextSteps: () => ["Try rotating a bit faster and see if the rhythm stays just as steady — pace and steadiness together, tracked over a few sessions, is more informative than either alone."],
  },
  "rotation-rhythm-regular": {
    headline: (f) => `A steady rotation rhythm was detected (${fmt(f.frequency)} Hz).`,
    meaning: (f) => [`Your palm-up/palm-down rotations settled into a consistent pace of about ${fmt(f.frequency)} Hz.`],
    nextSteps: () => ["Nothing here suggests concern by itself. Keep this as a baseline to compare future sessions against."],
  },
  "fine-motor-path-controlled": {
    headline: (f) => `Your traced path closely followed the spiral guide (${fmt(f.spiralDeviationScore * 100, 0)}% deviation).`,
    meaning: (f) => [`Your drawn path deviated from the ideal spiral by about ${fmt(f.spiralDeviationScore * 100, 0)}% on average — a close, controlled trace.`],
    nextSteps: () => ["Nothing here suggests concern by itself. Keep this as a baseline to compare future sessions against."],
  },
  "fine-motor-mild-deviation": {
    headline: (f) => `Your traced path showed a mild drift from the spiral guide (${fmt(f.spiralDeviationScore * 100, 0)}% deviation).`,
    meaning: (f) => [`Your drawn path deviated from the ideal spiral by about ${fmt(f.spiralDeviationScore * 100, 0)}% on average.`],
    nextSteps: () => [
      "Input device matters a lot here — a mouse, trackpad, and touchscreen all feel different. Try repeating with the same device each time.",
      "Track this over a few sessions before drawing conclusions from a single trace.",
    ],
  },
  "fine-motor-notable-deviation": {
    headline: (f) => `Your traced path showed a notable drift from the spiral guide (${fmt(f.spiralDeviationScore * 100, 0)}% deviation).`,
    meaning: (f) => [`Your drawn path deviated from the ideal spiral by about ${fmt(f.spiralDeviationScore * 100, 0)}% on average — a larger drift than a close trace.`],
    nextSteps: () => [
      "Try again with the same input device, seated comfortably, without rushing — grip and device matter as much as the trace itself.",
      "If this stays elevated across repeated sessions, it's a useful, specific detail to bring to a clinician.",
    ],
  },
};

const es = {
  "no-significant-rest-tremor": {
    headline: () => "No se detectó temblor significativo en reposo.",
    meaning: () => [
      "El movimiento de tu mano durante esta grabación no mostró una oscilación clara y repetitiva — ningún ritmo dominante se distinguió de los pequeños movimientos normales.",
      "Este es un resultado tranquilizador por sí solo: no hay evidencia de un patrón de temblor en reposo en esta grabación.",
    ],
    nextSteps: () => [
      "Nada aquí sugiere motivo de preocupación por sí solo. Si estás monitoreando una condición conocida, sigue haciendo chequeos periódicos para construir una tendencia real.",
      "Si tú o alguien cercano nota síntomas nuevos de temblor entre chequeos, vale la pena mencionarlo a un profesional médico sin importar lo que muestre una sola lectura.",
    ],
  },
  "rest-dominant-4-6hz": {
    headline: (f) => `Se detectó una oscilación rítmica en reposo, alrededor de ${fmt(f.frequency)} Hz.`,
    meaning: (f) => [
      `Tu mano mostró una oscilación repetitiva alrededor de ${fmt(f.frequency)} Hz en reposo (amplitud ${fmt(f.rmsAmplitude, 3)}).`,
      "La literatura sobre trastornos del movimiento discute esta banda de frecuencia en relación con el temblor en reposo. Eso no significa que esta lectura lo sea — una sola grabación no puede establecer eso.",
    ],
    nextSteps: () => [
      "Una sola lectura no es un patrón. Repite esta tarea cada una o dos semanas, a una hora similar del día, para ver si es consistente.",
      "Si esto es nuevo, unilateral, o cada vez más notable entre sesiones, es razonable mencionarlo a un profesional médico con licencia — exporta un informe PDF para que vean números reales, no solo una descripción.",
    ],
  },
  "rest-oscillation-atypical-band": {
    headline: (f) => `Se detectó una oscilación a ${fmt(f.frequency)} Hz — fuera del rango más discutido para el temblor en reposo.`,
    meaning: (f) => [
      `El ritmo dominante en esta grabación fue de aproximadamente ${fmt(f.frequency)} Hz, fuera del rango de ~4-6 Hz más discutido para el temblor en reposo.`,
      "Esto podría reflejar movimientos pequeños normales, ruido de cámara o iluminación, o una oscilación genuina a una frecuencia atípica.",
    ],
    nextSteps: () => [
      "Intenta grabar de nuevo con buena iluminación uniforme y la mano completamente apoyada — es más probable que esta lectura refleje la configuración que un síntoma.",
      "Si se repite consistentemente a esta misma frecuencia entre sesiones, menciónalo en tu próximo chequeo.",
    ],
  },
  "slow-movement-not-tremor": {
    headline: () => "Se captó movimiento lento de la mano — no un ritmo de temblor.",
    meaning: (f) => [
      `El movimiento principal en esta grabación se repitió aproximadamente ${fmt(f.frequency)} veces por segundo — más lento que los ritmos que los médicos llaman temblor (que comienzan alrededor de 3-4 por segundo).`,
      "Un movimiento lento como este suele ser solo tu mano acomodándose, cambiando de posición o desplazándose — el tipo de movimiento que toda mano hace. No es el temblor rápido y rítmico al que se refiere la palabra temblor.",
    ],
    nextSteps: () => [
      "Nada aquí sugiere preocupación. Para una lectura aún más limpia la próxima vez, apoya tu mano completamente sobre una mesa o tu regazo y déjala totalmente relajada antes de que comience la grabación.",
      "Sigue haciendo chequeos ocasionales — un patrón estable a lo largo de semanas es lo que hace significativas estas lecturas.",
    ],
  },
  "no-significant-postural-tremor": {
    headline: () => "No se detectó temblor significativo con el brazo extendido.",
    meaning: () => [
      "Mantener el brazo extendido contra la gravedad no produjo una oscilación clara y repetitiva en esta grabación.",
      "Este es un resultado tranquilizador por sí solo para esta tarea.",
    ],
    nextSteps: () => [
      "Nada aquí sugiere motivo de preocupación por sí solo — sigue haciendo chequeos periódicos si estás monitoreando síntomas con el tiempo.",
      "Los síntomas nuevos o que empeoran notados fuera de las pruebas vale la pena mencionarlos a un profesional médico sin importar una sola lectura.",
    ],
  },
  "postural-dominant-6-12hz": {
    headline: (f) => `Se detectó una oscilación rítmica con el brazo extendido, alrededor de ${fmt(f.frequency)} Hz.`,
    meaning: (f) => [
      `Tu mano osciló a aproximadamente ${fmt(f.frequency)} Hz mientras se mantenía contra la gravedad (amplitud ${fmt(f.rmsAmplitude, 3)}).`,
      "Esta banda de frecuencia más alta se discute más a menudo en relación con el temblor postural/cinético que la banda más lenta del temblor en reposo — de nuevo, esto describe la señal, no un diagnóstico.",
    ],
    nextSteps: () => [
      "Repite esta tarea en varias sesiones — una sola lectura puede verse afectada por la fatiga, la cafeína, o qué tan cansado estaba tu brazo ese día.",
      "Si es consistente, nuevo, o empeora, lleva tu informe exportado a un profesional médico.",
    ],
  },
  "rest-band-pattern-during-posture": {
    headline: (f) => `La oscilación detectada con el brazo extendido (${fmt(f.frequency)} Hz) coincidió con la banda más lenta del temblor en reposo, no con la banda postural.`,
    meaning: (f) => [
      `A aproximadamente ${fmt(f.frequency)} Hz, esto es más lento que el rango típicamente discutido para el temblor postural.`,
      "Un patrón de frecuencia de reposo que persiste una vez que se levanta una extremidad es un patrón más específico, discutido a veces en la literatura sobre trastornos del movimiento.",
    ],
    nextSteps: () => [
      "Este es un patrón más específico y menos común que una simple lectura de temblor postural — vale la pena seguirlo en algunas sesiones más.",
      "Si se repite, es un detalle específico y útil para llevar a un profesional médico junto con tus resultados de temblor en reposo.",
    ],
  },
  "postural-oscillation-atypical-band": {
    headline: (f) => `Se detectó una oscilación a ${fmt(f.frequency)} Hz — fuera del rango más discutido para el temblor postural.`,
    meaning: (f) => [`El ritmo dominante fue de aproximadamente ${fmt(f.frequency)} Hz.`, "Esto podría reflejar fatiga del brazo, ruido de cámara, o una oscilación genuina fuera de la banda típica."],
    nextSteps: () => [
      "Intenta apoyar ligeramente el codo y repetir la tarea — la fatiga durante una sostenida completamente sin apoyo puede afectar esta lectura.",
      "Síguelo en algunas sesiones antes de sacar conclusiones.",
    ],
  },
  "tap-insufficient-data": {
    headline: () => "No se detectaron suficientes golpes claros para evaluar esta grabación.",
    meaning: () => ["Necesitamos un movimiento de golpeteo pulgar-índice constante y claramente visible durante los 10 segundos completos para medir la tasa y la disminución de amplitud."],
    nextSteps: () => ["Intenta de nuevo con tu mano completamente en cuadro y buena iluminación, golpeando tan grande y rápido como te resulte cómodo."],
  },
  "tap-amplitude-decrement": {
    headline: (f) => `La amplitud del golpeteo disminuyó aproximadamente ${fmt(f.tapDecrementPct, 0)}% durante la grabación.`,
    meaning: (f) => [
      `El tamaño de tu golpeteo se redujo aproximadamente ${fmt(f.tapDecrementPct, 0)}% de la primera mitad de la grabación a la segunda mitad, a una tasa de aproximadamente ${fmt(f.tapRateHz)} golpes/seg.`,
      "Una disminución en la amplitud del movimiento repetitivo con el tiempo es un patrón discutido en la literatura en relación con el movimiento lento — una sola grabación no puede establecer eso por sí sola.",
    ],
    nextSteps: () => [
      "La fatiga por sí sola puede causar esto — intenta la tarea de nuevo después de descansar tu mano un minuto.",
      "Si esta disminución aparece consistentemente en varias sesiones, especialmente más en un lado que en otro, es un detalle específico y útil para llevar a un profesional médico.",
    ],
  },
  "tap-rate-reduced": {
    headline: (f) => `La velocidad de golpeteo (${fmt(f.tapRateHz)} golpes/seg) fue más lenta que un ritmo típicamente ágil.`,
    meaning: (f) => [`Golpeaste a aproximadamente ${fmt(f.tapRateHz)} golpes/seg, sin una fuerte disminución de tamaño durante la grabación.`],
    nextSteps: () => [
      "Intenta de nuevo golpeando tan rápido y grande como te resulte cómodo — el esfuerzo y la comodidad afectan mucho esta lectura.",
      "Si tu ritmo se mantiene consistentemente lento entre sesiones, menciónalo en tu próximo chequeo.",
    ],
  },
  "tap-rhythm-regular": {
    headline: (f) => `El golpeteo se mantuvo rápido y constante (${fmt(f.tapRateHz)} golpes/seg) durante toda la grabación.`,
    meaning: (f) => [`Golpeaste a aproximadamente ${fmt(f.tapRateHz)} golpes/seg sin una disminución notable de tamaño en los 10 segundos — un patrón constante y regular.`],
    nextSteps: () => ["Nada aquí sugiere motivo de preocupación por sí solo. Usa esto como referencia para comparar futuras sesiones."],
  },
  "no-consistent-rotation-rhythm": {
    headline: () => "No se detectó un ritmo de rotación consistente.",
    meaning: () => ["Tus rotaciones palma-arriba/palma-abajo no se asentaron en un ritmo claro y repetitivo durante esta grabación."],
    nextSteps: () => [
      "Intenta de nuevo manteniendo el codo firme y rotando a un ritmo único, cómodo y repetitivo.",
      "Este hallazgo por sí solo no es preocupante — el ritmo irregular es común cuando las personas todavía se acostumbran al movimiento.",
    ],
  },
  "slow-rotation-pace": {
    headline: (f) => `Se detectó un ritmo de rotación constante pero lento (${fmt(f.frequency)} Hz).`,
    meaning: (f) => [`Tus rotaciones se asentaron en un ritmo constante de aproximadamente ${fmt(f.frequency)} Hz.`],
    nextSteps: () => ["Intenta rotar un poco más rápido y observa si el ritmo se mantiene igual de constante — el ritmo y la constancia juntos, seguidos en varias sesiones, son más informativos que cualquiera por separado."],
  },
  "rotation-rhythm-regular": {
    headline: (f) => `Se detectó un ritmo de rotación constante (${fmt(f.frequency)} Hz).`,
    meaning: (f) => [`Tus rotaciones palma-arriba/palma-abajo se asentaron en un ritmo constante de aproximadamente ${fmt(f.frequency)} Hz.`],
    nextSteps: () => ["Nada aquí sugiere motivo de preocupación por sí solo. Usa esto como referencia para comparar futuras sesiones."],
  },
  "fine-motor-path-controlled": {
    headline: (f) => `Tu trazo siguió de cerca la guía en espiral (${fmt(f.spiralDeviationScore * 100, 0)}% de desviación).`,
    meaning: (f) => [`Tu trazo se desvió de la espiral ideal en aproximadamente ${fmt(f.spiralDeviationScore * 100, 0)}% en promedio — un trazo cercano y controlado.`],
    nextSteps: () => ["Nada aquí sugiere motivo de preocupación por sí solo. Usa esto como referencia para comparar futuras sesiones."],
  },
  "fine-motor-mild-deviation": {
    headline: (f) => `Tu trazo mostró una desviación leve de la guía en espiral (${fmt(f.spiralDeviationScore * 100, 0)}% de desviación).`,
    meaning: (f) => [`Tu trazo se desvió de la espiral ideal en aproximadamente ${fmt(f.spiralDeviationScore * 100, 0)}% en promedio.`],
    nextSteps: () => [
      "El dispositivo de entrada importa mucho aquí — un mouse, trackpad y pantalla táctil se sienten distintos. Intenta repetir con el mismo dispositivo cada vez.",
      "Sigue esto en varias sesiones antes de sacar conclusiones de un solo trazo.",
    ],
  },
  "fine-motor-notable-deviation": {
    headline: (f) => `Tu trazo mostró una desviación notable de la guía en espiral (${fmt(f.spiralDeviationScore * 100, 0)}% de desviación).`,
    meaning: (f) => [`Tu trazo se desvió de la espiral ideal en aproximadamente ${fmt(f.spiralDeviationScore * 100, 0)}% en promedio — una desviación mayor que un trazo cercano.`],
    nextSteps: () => [
      "Intenta de nuevo con el mismo dispositivo de entrada, sentado cómodamente, sin apresurarte — el agarre y el dispositivo importan tanto como el trazo en sí.",
      "Si esto se mantiene elevado en sesiones repetidas, es un detalle específico y útil para llevar a un profesional médico.",
    ],
  },
};

const COPY = { en, es };

// ---------------------------------------------------------------------------
// Check-in rating: a single traffic-light-style tier a non-technical user can
// act on without reading anything else. Wording is deliberately careful:
// "discuss" means "worth a conversation", never "you have X" — and it always
// says this is not an emergency signal and not a diagnosis.
// ---------------------------------------------------------------------------

const STEADY_LABELS = new Set([
  "no-significant-rest-tremor",
  "no-significant-postural-tremor",
  "slow-movement-not-tremor",
  "tap-rhythm-regular",
  "rotation-rhythm-regular",
  "slow-rotation-pace",
  "fine-motor-path-controlled",
]);

const WATCH_LABELS = new Set([
  "rest-oscillation-atypical-band",
  "postural-oscillation-atypical-band",
  "tap-rate-reduced",
  "no-consistent-rotation-rhythm",
  "fine-motor-mild-deviation",
]);

const DISCUSS_LABELS = new Set([
  "rest-dominant-4-6hz",
  "postural-dominant-6-12hz",
  "rest-band-pattern-during-posture",
  "tap-amplitude-decrement",
  "fine-motor-notable-deviation",
]);

export function computeRatingTier(patternLabel, asymmetryIndex, quality) {
  if (quality && quality.lowCoverage) return "retry";
  if (patternLabel === "tap-insufficient-data") return "retry";
  let tier = "watch";
  if (STEADY_LABELS.has(patternLabel)) tier = "steady";
  if (DISCUSS_LABELS.has(patternLabel)) tier = "discuss";
  // A strong left/right difference escalates one tier: it's one of the more
  // specific patterns discussed in the literature, and it's easy to miss.
  if (asymmetryIndex != null && asymmetryIndex >= 0.4) {
    if (tier === "steady") tier = "watch";
    else if (tier === "watch") tier = "discuss";
  }
  return tier;
}

const RATING_COPY = {
  en: {
    steady: {
      title: "Steady",
      body: "Nothing in this recording stood out as unusual. No action needed — an occasional check-in is all this takes.",
    },
    watch: {
      title: "Keep an eye on it",
      body: "Something in this recording is worth re-checking. Repeat this task a few times over the next couple of weeks — a pattern across sessions matters far more than any single reading.",
    },
    discuss: {
      title: "Worth a conversation",
      body: "This recording shows a pattern worth mentioning to a doctor or nurse, especially if it's new or you've noticed it in daily life. Export your PDF report and bring it to your next visit. This is not an emergency signal, and it is not a diagnosis.",
    },
    retry: {
      title: "Try again",
      body: "This recording wasn't clear enough to rate. Move to brighter, more even lighting, keep your hand fully in view, and run the task again.",
    },
  },
  es: {
    steady: {
      title: "Estable",
      body: "Nada en esta grabación resaltó como inusual. No se necesita ninguna acción — un chequeo ocasional es todo lo que esto requiere.",
    },
    watch: {
      title: "Mantenlo en observación",
      body: "Algo en esta grabación merece volver a revisarse. Repite esta tarea varias veces durante las próximas dos semanas — un patrón entre sesiones importa mucho más que cualquier lectura individual.",
    },
    discuss: {
      title: "Vale la pena una conversación",
      body: "Esta grabación muestra un patrón que vale la pena mencionar a un médico o enfermera, especialmente si es nuevo o lo has notado en la vida diaria. Exporta tu informe PDF y llévalo a tu próxima visita. Esto no es una señal de emergencia, y no es un diagnóstico.",
    },
    retry: {
      title: "Intenta de nuevo",
      body: "Esta grabación no fue lo suficientemente clara para calificar. Muévete a una luz más brillante y uniforme, mantén tu mano completamente a la vista, y ejecuta la tarea de nuevo.",
    },
  },
};

// ---------------------------------------------------------------------------
// Plain-language education: what tremor/slowness/drawing tests can mean, in
// terms a non-technical user can absorb. General literature-informed context
// only — benign causes get equal billing with the patterns doctors watch for.
// ---------------------------------------------------------------------------

const EDUCATION = {
  en: {
    tremor: {
      title: "What can hand tremor mean?",
      bullets: [
        "Everyone's hands shake a tiny amount — it's called physiologic tremor, and it's completely normal.",
        "Common, harmless things that make hands shakier: caffeine, stress, cold, tiredness, hunger, and some medicines (like asthma inhalers).",
        "Doctors pay more attention when shaking is new, stays mostly on one side, gets steadily worse over months, or starts interfering with eating, writing, or dressing.",
        "A tremor that shows up while the hand is resting is a different pattern from one that shows up while holding the arms out — that's why this app tests both separately.",
        "Only a clinician can say what a tremor means. This app's job is to give them better information than memory alone.",
      ],
    },
    tap: {
      title: "What does finger tapping show?",
      bullets: [
        "This task measures how quickly and how big you can tap, and whether taps shrink over the 10 seconds.",
        "Tired hands, sore fingers, or simply easing off can shrink taps too — one shrinking recording means very little on its own.",
        "Doctors look for consistent shrinking, session after session, especially on one side more than the other, alongside other signs.",
      ],
    },
    spiral: {
      title: "What does spiral drawing show?",
      bullets: [
        "Tracing a spiral has been used in clinics for decades as a simple test of fine-motor steadiness.",
        "Your input device matters a lot: a mouse, a trackpad, and a finger on a screen all behave differently. Compare like with like.",
        "One shaky spiral means little. A consistent change across weeks of the same setup is what's actually informative.",
      ],
    },
  },
  es: {
    tremor: {
      title: "¿Qué puede significar el temblor de manos?",
      bullets: [
        "Las manos de todos tiemblan una pequeña cantidad — se llama temblor fisiológico, y es completamente normal.",
        "Cosas comunes e inofensivas que hacen temblar más las manos: cafeína, estrés, frío, cansancio, hambre, y algunos medicamentos (como los inhaladores para el asma).",
        "Los médicos prestan más atención cuando el temblor es nuevo, se mantiene principalmente en un lado, empeora constantemente durante meses, o comienza a interferir con comer, escribir o vestirse.",
        "Un temblor que aparece con la mano en reposo es un patrón diferente al que aparece al extender los brazos — por eso esta aplicación prueba ambos por separado.",
        "Solo un profesional médico puede decir qué significa un temblor. El trabajo de esta aplicación es darle mejor información que la memoria sola.",
      ],
    },
    tap: {
      title: "¿Qué muestra el golpeteo de dedos?",
      bullets: [
        "Esta tarea mide qué tan rápido y qué tan grande puedes golpetear, y si los golpes se encogen durante los 10 segundos.",
        "Las manos cansadas, los dedos adoloridos, o simplemente bajar el esfuerzo también pueden encoger los golpes — una sola grabación con disminución significa muy poco por sí sola.",
        "Los médicos buscan una disminución consistente, sesión tras sesión, especialmente más en un lado que en el otro, junto con otros signos.",
      ],
    },
    spiral: {
      title: "¿Qué muestra el dibujo en espiral?",
      bullets: [
        "Trazar una espiral se ha usado en clínicas durante décadas como una prueba simple de estabilidad motora fina.",
        "Tu dispositivo de entrada importa mucho: un mouse, un trackpad y un dedo en la pantalla se comportan de manera diferente. Compara lo comparable.",
        "Una sola espiral temblorosa significa poco. Un cambio consistente a lo largo de semanas con la misma configuración es lo realmente informativo.",
      ],
    },
  },
};

const EDUCATION_GROUP = { rest: "tremor", postural: "tremor", pronation: "tremor", tap: "tap", spiral: "spiral" };

const QUALITY_COPY = {
  en: "Recording quality was low — the camera dropped frames or your hand left the view for part of the recording. Treat these numbers cautiously and try again in brighter, more even lighting.",
  es: "La calidad de la grabación fue baja — la cámara perdió cuadros o tu mano salió de la vista durante parte de la grabación. Toma estos números con cautela e intenta de nuevo con una luz más brillante y uniforme.",
};

const ASYMMETRY_COPY = {
  en: {
    high: (pct) => `A notable difference between your left and right hand showed up this session (about ${pct}% asymmetry). Unilateral (one-sided) differences are commonly discussed as an early feature in the movement-disorder literature — worth tracking over multiple sessions and mentioning to a clinician if it's consistent.`,
    mild: (pct) => `A mild difference between your left and right hand showed up this session (about ${pct}% asymmetry) — small differences between hands are common and not unusual on their own.`,
    low: () => "Your left and right hand were similar this session.",
  },
  es: {
    high: (pct) => `Se mostró una diferencia notable entre tu mano izquierda y derecha en esta sesión (aproximadamente ${pct}% de asimetría). Las diferencias unilaterales se discuten comúnmente como una característica temprana en la literatura sobre trastornos del movimiento — vale la pena seguirlo en varias sesiones y mencionarlo a un profesional médico si es consistente.`,
    mild: (pct) => `Se mostró una diferencia leve entre tu mano izquierda y derecha en esta sesión (aproximadamente ${pct}% de asimetría) — las pequeñas diferencias entre manos son comunes y no inusuales por sí solas.`,
    low: () => "Tu mano izquierda y derecha fueron similares en esta sesión.",
  },
};

const TREND_METRIC = {
  rest: { field: "frequencyHz", unit: "Hz", digits: 1, label: { en: "dominant frequency", es: "frecuencia dominante" }, validate: (v) => v > 0 },
  postural: { field: "frequencyHz", unit: "Hz", digits: 1, label: { en: "dominant frequency", es: "frecuencia dominante" }, validate: (v) => v > 0 },
  pronation: { field: "frequencyHz", unit: "Hz", digits: 1, label: { en: "rotation rate", es: "ritmo de rotación" }, validate: (v) => v > 0 },
  tap: { field: "tapDecrementPct", unit: "%", digits: 0, label: { en: "amplitude decrement", es: "disminución de amplitud" }, validate: (v) => v != null },
  spiral: { field: "spiralDeviationScore", unit: "%", digits: 0, label: { en: "path deviation", es: "desviación del trazo" }, scale: 100, validate: (v) => v != null },
};

const TASK_LABEL = {
  rest: { en: "rest-tremor", es: "temblor en reposo" },
  postural: { en: "postural-tremor", es: "temblor postural" },
  tap: { en: "finger-tap", es: "golpeteo de dedos" },
  pronation: { en: "pronation-supination", es: "pronación-supinación" },
  spiral: { en: "spiral-drawing", es: "dibujo en espiral" },
};

function computeTrend(task, currentResult, history, language) {
  const spec = TREND_METRIC[task];
  if (!spec || !history || history.length === 0) return null;

  const scale = spec.scale || 1;
  const values = history.map((r) => r[spec.field] * scale).filter((v) => spec.validate(v));
  if (values.length === 0) return null;

  const recent = values.slice(-5);
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const current = (currentResult[spec.field] ?? 0) * scale;
  if (!spec.validate(current) || avg === 0) return null;

  const pctChange = ((current - avg) / avg) * 100;
  const direction = pctChange >= 0 ? (language === "es" ? "más alta" : "higher") : (language === "es" ? "más baja" : "lower");
  const metricLabel = spec.label[language] || spec.label.en;
  const taskLabel = TASK_LABEL[task]?.[language] || task;

  const n = recent.length;
  const message =
    language === "es"
      ? n === 1
        ? `Tu ${metricLabel} esta sesión fue aproximadamente ${fmt(Math.abs(pctChange), 0)}% ${direction} que tu sesión anterior de ${taskLabel} (${fmt(avg, spec.digits)} ${spec.unit}).`
        : `Tu ${metricLabel} esta sesión fue aproximadamente ${fmt(Math.abs(pctChange), 0)}% ${direction} que tu promedio de tus últimas ${n} sesiones de ${taskLabel} (${fmt(avg, spec.digits)} ${spec.unit}).`
      : n === 1
        ? `This session's ${metricLabel} was about ${fmt(Math.abs(pctChange), 0)}% ${direction} than your previous ${taskLabel} session (${fmt(avg, spec.digits)} ${spec.unit}).`
        : `This session's ${metricLabel} was about ${fmt(Math.abs(pctChange), 0)}% ${direction} than your average over your last ${n} ${taskLabel} sessions (${fmt(avg, spec.digits)} ${spec.unit}).`;

  return { message, pctChange, sampleCount: recent.length };
}

function asymmetryNote(asymmetryIndex, language) {
  if (asymmetryIndex == null) return null;
  const copy = ASYMMETRY_COPY[language] || ASYMMETRY_COPY.en;
  const pct = (asymmetryIndex * 100).toFixed(0);
  if (asymmetryIndex >= 0.4) return copy.high(pct);
  if (asymmetryIndex >= 0.15) return copy.mild(pct);
  return copy.low();
}

/**
 * Builds the full user-facing explanation for a session result.
 * @param {{task:string, result:object, classification:object, history?:object[], language?:'en'|'es', quality?:{fps:number, coverage:number, qualityOk:boolean, lowCoverage:boolean}|null}} args
 */
export function buildInterpretation({ task, result, classification, history = [], language = "en", quality = null }) {
  const copy = (COPY[language] || COPY.en)[classification.patternLabel] || COPY.en["no-significant-rest-tremor"];
  const f = {
    frequency: result.frequencyHz ?? 0,
    rmsAmplitude: result.rmsAmplitude ?? 0,
    tapRateHz: result.tapRateHz ?? 0,
    tapDecrementPct: result.tapDecrementPct ?? 0,
    spiralDeviationScore: result.spiralDeviationScore ?? 0,
  };

  // The rule engine (calibrated to real webcam feature scales) sets the tier.
  const tier = computeRatingTier(classification.patternLabel, result.asymmetryIndex, quality);
  const ratingCopy = (RATING_COPY[language] || RATING_COPY.en)[tier];
  const eduGroup = EDUCATION_GROUP[task] || "tremor";
  const education = (EDUCATION[language] || EDUCATION.en)[eduGroup];

  return {
    headline: copy.headline(f),
    whatWeSaw: copy.meaning(f),
    suggestedNextSteps: copy.nextSteps(f),
    asymmetryNote: asymmetryNote(result.asymmetryIndex, language),
    trend: computeTrend(task, result, history, language),
    rating: { tier, title: ratingCopy.title, body: ratingCopy.body },
    education,
    qualityNote: quality && !quality.qualityOk ? (QUALITY_COPY[language] || QUALITY_COPY.en) : null,
  };
}
