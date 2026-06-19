import { useState, useEffect } from 'react';

/* Intro overlay — a thin contour traces the wordmark, then it fills in. */
export default function Intro({ onDone }) {
  const [leaving, setLeaving] = useState(false);

  const finish = () => {
    setLeaving((was) => {
      if (was) return was;
      setTimeout(onDone, 900);
      return true;
    });
  };

  useEffect(() => {
    const t = setTimeout(finish, 4800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={'intro' + (leaving ? ' done' : '')} onClick={finish}>
      {/* fork wound with a golden spaghetti strand */}
      <svg width="118" height="186" viewBox="0 0 120 190" aria-hidden="true">
        {/* spaghetti — behind the fork (left bulges tuck behind the stem) */}
        <path
          className="sp sp-behind"
          pathLength="100"
          d="M60 162 C33 158 33 149 60 145 C87 141 87 132 60 128
             C33 124 33 115 60 111 C87 107 87 98 60 94
             C33 90 33 81 60 77 C87 73 87 64 60 60"
        />

        {/* fork — thin cream contour */}
        <path className="fork-stroke" pathLength="100" d="M44 22 L44 60 Q44 75 60 77 Q76 75 76 60 L76 22" />
        <path className="fork-stroke" pathLength="100" d="M53 22 L53 60" />
        <path className="fork-stroke" pathLength="100" d="M67 22 L67 60" />
        <path className="fork-stroke" pathLength="100" d="M60 77 L60 172" />

        {/* spaghetti — front (right bulges + a curl over the tines) */}
        <path
          className="sp sp-front"
          pathLength="100"
          d="M60 145 C87 141 87 132 60 128 M60 111 C87 107 87 98 60 94 M60 77 C87 73 87 64 60 60"
        />
        <path className="sp sp-front" pathLength="100" d="M60 60 C85 57 83 42 60 44 C41 45 43 33 60 34" />
      </svg>

      {/* wordmark — stroke draws, then fill fades in (& in gold) */}
      <svg width="min(560px, 84vw)" height="92" viewBox="0 0 560 92" aria-label="Dolce&Salato">
        <text
          className="wordmark-stroke"
          x="280"
          y="64"
          textAnchor="middle"
          fontFamily="'Cormorant Garamond', serif"
          fontSize="72"
          fontWeight="500"
        >
          Dolce&amp;Salato
        </text>
        <text
          className="wordmark-fill"
          x="280"
          y="64"
          textAnchor="middle"
          fontFamily="'Cormorant Garamond', serif"
          fontSize="72"
          fontWeight="500"
        >
          Dolce<tspan className="wordmark-amp">&amp;</tspan>Salato
        </text>
      </svg>

      <div className="intro-sub">Food Solution</div>
      <button className="skip" onClick={finish}>Войти&nbsp;·&nbsp;Entra</button>
    </div>
  );
}
