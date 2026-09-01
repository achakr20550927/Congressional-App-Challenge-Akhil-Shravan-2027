export default function SignalLattice({ compact = false, className = "" }) {
  const nodes = compact
    ? [[12, 48], [30, 32], [49, 58], [68, 25], [88, 44]]
    : [[8, 62], [22, 35], [39, 52], [55, 20], [70, 43], [88, 16], [94, 69], [63, 79], [33, 82]];
  return (
    <svg className={`signal-lattice ${className}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="latticeLine" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#91d9fa" stopOpacity=".08" />
          <stop offset=".55" stopColor="#91d9fa" stopOpacity=".7" />
          <stop offset="1" stopColor="#f09e7c" stopOpacity=".25" />
        </linearGradient>
        <filter id="latticeGlow"><feGaussianBlur stdDeviation="1.4" /></filter>
      </defs>
      <polyline points={nodes.map(([x, y]) => `${x},${y}`).join(" ")} fill="none" stroke="url(#latticeLine)" strokeWidth=".55" />
      {nodes.map(([x, y], i) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r={i === 3 ? 4 : 2.3} fill="#72c8ef" opacity=".12" filter="url(#latticeGlow)" />
          <circle cx={x} cy={y} r={i === 3 ? 1.05 : .65} fill={i === nodes.length - 2 ? "#f09e7c" : "#bfeaff"} />
        </g>
      ))}
    </svg>
  );
}
