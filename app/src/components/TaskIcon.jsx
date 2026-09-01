// Line-art icon set matching the brand mark's language (Design System §7):
// single 1.5-2px stroke, rounded caps, one accent-color dot as the
// consistent "tracked point" motif. No stock photography, no 3D renders.
const ICONS = {
  rest: (
    <>
      <circle cx="18" cy="26" r="3" fill="var(--terra)" stroke="none" />
      <path d="M18 23 Q18 10 10 6" />
      <path d="M18 23 Q18 8 18 4" />
      <path d="M18 23 Q18 10 26 6" />
    </>
  ),
  postural: (
    <>
      <circle cx="18" cy="30" r="3" fill="var(--terra)" stroke="none" />
      <path d="M18 27 L18 6" />
      <path d="M10 12 L18 6 L26 12" />
    </>
  ),
  tap: (
    <>
      <circle cx="12" cy="18" r="3" fill="var(--terra)" stroke="none" />
      <path d="M12 18 L26 10" />
      <path d="M12 18 L26 26" />
    </>
  ),
  pronation: (
    <>
      <path d="M8 18 Q18 6 28 18 Q18 30 8 18" />
      <circle cx="8" cy="18" r="3" fill="var(--terra)" stroke="none" />
    </>
  ),
  spiral: (
    <>
      <path d="M18 18 m0,0 a2,2 0 1,1 0.01,0 M18 18 a4,4 0 1 1 6,3 a8,8 0 1 1 -12,-6 a12,12 0 1 1 18,9" />
      <circle cx="18" cy="18" r="1.5" fill="var(--terra)" stroke="none" />
    </>
  ),
};

export default function TaskIcon({ task, size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" stroke="var(--green)" strokeWidth="2" aria-hidden="true">
      {ICONS[task] || ICONS.rest}
    </svg>
  );
}
