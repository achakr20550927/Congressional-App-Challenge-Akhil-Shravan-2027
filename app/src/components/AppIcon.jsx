const paths={
  home:'M3 10 12 3l9 7v11h-6v-7H9v7H3Z',
  activity:'M2 12h5l3-8 4 16 3-8h5',
  history:'M3 11a9 9 0 1 1 2 7M3 4v7h7M12 7v5l3 2',
  report:'M6 3h8l4 4v14H6ZM14 3v5h4M9 12h6M9 16h6',
  science:'M9 3h6M10 3v6L4 19a1 1 0 0 0 1 2h14a1 1 0 0 0 1-2L14 9V3M8 14h8',
  settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2',
  arrow:'M5 12h14M13 6l6 6-6 6', check:'m5 12 4 4L19 6',
  shield:'M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6ZM9 12l2 2 4-4',
  camera:'M3 7h4l2-3h6l2 3h4v13H3ZM12 10a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
  download:'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5', plus:'M12 4v16M4 12h16',
  hand:'M8 12V6a1.5 1.5 0 0 1 3 0v5-7a1.5 1.5 0 0 1 3 0v7-5a1.5 1.5 0 0 1 3 0v6-3a1.5 1.5 0 0 1 3 0v6c0 5-3 7-7 7-3 0-5-2-7-5l-3-4c-1-2 1-3 3-1l2 2Z',
};
export default function AppIcon({name='activity',size=20,...props}) {return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name]||paths.activity}/></svg>;}
