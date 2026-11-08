/*
 * Mes appareils — carte Lovelace personnalisée, animations SVG
 * Type : custom:mes-appareils-card
 *
 * Pour ajouter un appareil : ajoute une entrée dans APPLIANCES (plus bas)
 * avec son SVG, son CSS éventuel et ses textes.
 * Les éléments qui portent la classe "anim" ne s'animent que quand
 * l'appareil est en marche ; les groupes "fx" n'apparaissent qu'à ce moment.
 */

const ACTIVE_STATES = [
  'on', 'running', 'printing', 'washing', 'drying', 'heating', 'cooling',
  'active', 'in_progress', 'prepare', 'cleaning', 'charging', 'opening', 'closing',
];

/* ------------------------------------------------------------------ */
/*  Petits outils pour écrire les SVG                                  */
/* ------------------------------------------------------------------ */
// Élément qui tourne autour du point (x, y)
const SP = (x, y, c = '') =>
  `class="anim spin ${c}" style="transform-origin:${x}px ${y}px"`;
// Élément animé (avec un point d'origine facultatif pour les échelles/rotations)
const AN = (c, x, y) =>
  x === undefined
    ? `class="anim ${c}"`
    : `class="anim ${c}" style="transform-origin:${x}px ${y}px"`;
// Pales d'hélice : n pales de rayon r autour de (cx, cy)
const blades = (cx, cy, r, n = 4, fill = '#9aa5b3') => {
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (i * 2 * Math.PI) / n;
    const p = (k, o) =>
      `${(cx + k * Math.cos(a + o)).toFixed(1)} ${(cy + k * Math.sin(a + o)).toFixed(1)}`;
    d += `M${cx} ${cy}Q${p(r * 0.8, -0.55)} ${p(r, 0.05)}Q${p(r * 0.7, 0.5)} ${cx} ${cy}Z`;
  }
  return `<path fill="${fill}" d="${d}"/>`;
};

// Textes affichés sur les petits écrans
const lcdPower = (v) => (v.on && v.power !== null ? `${Math.round(v.power)}W` : '--');
const lcdTemp = (v) => (v.temp !== null ? `${v.fmt(v.temp)}°` : lcdPower(v));
const lcdPct = (v) => (v.prog !== null ? `${Math.round(v.prog)}%` : lcdPower(v));

// Couleur Tempo à partir d'un texte (bleu/blanc/rouge, blue/white/red, ou codes HCJB, HPJW…)
const tempoColor = (txt) => {
  const t = String(txt || '').toLowerCase();
  if (/bleu|blue|j_?b$/.test(t)) return ['#2f7bff', 'Bleu'];
  if (/blanc|white|j_?w$/.test(t)) return ['#f5f5f5', 'Blanc'];
  if (/rouge|red|j_?r$/.test(t)) return ['#ff3b30', 'Rouge'];
  return ['#9aa5b3', '—'];
};

// Façade commune lave-linge / sèche-linge
const FRONT_LOADER = `
    <rect class="body" x="14" y="6" width="72" height="88" rx="7"/>
    <rect class="panel" x="14" y="6" width="72" height="18" rx="7"/>
    <rect class="panel" x="14" y="16" width="72" height="8"/>
    <circle class="mid" cx="27" cy="15" r="4.5"/>
    <rect class="screen" x="50" y="10" width="28" height="10" rx="2"/>
    <text class="lcd" x="64" y="17.6" font-size="6.5" data-lcd>--</text>`;

/* ------------------------------------------------------------------ */
/*  Définition des appareils                                           */
/* ------------------------------------------------------------------ */
const APPLIANCES = {
  /* ---------------- Générique, prises, lumières ---------------- */
  generic: {
    label: 'Appareil générique', on: 'En marche', off: 'À l’arrêt', threshold: 5, lcd: lcdPower,
    svg: `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect class="body" x="14" y="14" width="72" height="72" rx="14"/>
  <rect class="screen" x="26" y="22" width="48" height="16" rx="3"/>
  <text class="lcd" x="50" y="34" font-size="10" data-lcd>--</text>
  <circle class="ring genring" cx="50" cy="62" r="16"/>
  <path class="gpower" d="M57.78 55.45a11 11 0 1 1-15.56 0M50 51v11"/>
  <g class="fx"><circle ${AN('ripple', 50, 62)} cx="50" cy="62" r="18" fill="none" stroke="#4cd964" stroke-width="1.6"/></g>
  <circle class="led" cx="74" cy="76" r="2.2"/>
</svg>`,
    css: `.genring{fill:#e9edf2}
.gpower{fill:none;stroke:#8a94a3;stroke-width:3;stroke-linecap:round;transition:stroke .4s}
.on .gpower{stroke:#4cd964}`,
  },

  smartplug: {
    label: 'Prise connectée', on: 'Alimente un appareil', off: 'Au repos', threshold: 2, lcd: lcdPower,
    svg: `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect class="body" x="18" y="10" width="64" height="80" rx="16"/>
  <circle class="ring plugring" cx="50" cy="40" r="24"/>
  <circle cx="50" cy="40" r="19" fill="#e9edf2" stroke="#c9d0da"/>
  <circle class="dark" cx="42" cy="40" r="3.2"/><circle class="dark" cx="58" cy="40" r="3.2"/>
  <rect class="mid" x="48.5" y="25" width="3" height="7" rx="1.5"/>
  <g class="fx"><circle ${AN('ripple', 50, 40)} cx="50" cy="40" r="24" fill="none" stroke="#4cd964" stroke-width="1.6"/></g>
  <rect class="screen" x="30" y="70" width="40" height="13" rx="3"/>
  <text class="lcd" x="50" y="79.6" font-size="8" data-lcd>--</text>
  <circle class="led" cx="72" cy="20" r="2.4"/><circle class="mid" cx="28" cy="20" r="3"/>
</svg>`,
    css: `.plugring{fill:#dfe4ea;transition:stroke .4s}.on .plugring{stroke:#4cd964;stroke-width:2.4}`,
  },

  bulb: {
    label: 'Ampoule', on: 'Allumée', off: 'Éteinte', threshold: 0.5,
    lcd: (v) =>
      v.st?.attributes?.brightness != null
        ? `${Math.round(v.st.attributes.brightness / 2.55)}%`
        : lcdPower(v),
    // Reprend la couleur et la luminosité de l'ampoule si l'entité (light.*) les fournit
    update: (svg, v) => {
      const a = v.st?.attributes || {};
      const rgb = a.rgb_color;
      svg.style.setProperty('--bulb', Array.isArray(rgb) ? `rgb(${rgb.join(',')})` : '#ffd98a');
      svg.style.setProperty('--lvl', a.brightness != null ? Math.max(0.25, a.brightness / 255) : 1);
    },
    svg: `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <g class="fx">
    <circle class="glow" cx="50" cy="38" r="40"/>
    <path ${AN('pulse rays')} d="M50 2v6M14 16l4 4M86 16l-4 4M4 40h6M96 40h-6"/>
  </g>
  <rect class="bulbglass" x="40" y="56" width="20" height="12"/>
  <circle class="bulbglass" cx="50" cy="38" r="24"/>
  <path class="fil" d="M44 66V52l3-6 3 6 3-6 3 6v14"/>
  <rect class="dark" x="39" y="68" width="22" height="20" rx="3"/>
  <path d="M39 73h22M39 78h22" stroke="#8a94a3" stroke-width="1.5"/>
  <text class="lcd" x="50" y="86" font-size="5.5" data-lcd>--</text>
  <path class="mid" d="M44 88h12l-2 6h-8z"/>
</svg>`,
    css: `.bulbglass{fill:#e8ecf1;stroke:#aab3bf;stroke-width:1.2;transition:fill .4s}
.on .bulbglass{fill:var(--bulb,#ffe28a)}
.glow{fill:var(--bulb,#ffd98a);opacity:calc(var(--lvl,1)*.4)}
.rays{fill:none;stroke:var(--bulb,#ffd98a);stroke-width:2.2;stroke-linecap:round}
.fil{fill:none;stroke:#aab3bf;stroke-width:1.6;stroke-linejoin:round}.on .fil{stroke:#fff}`,
  },

  colorbulb: {
    label: 'Ampoule colorée', on: 'Allumée', off: 'Éteinte', threshold: 0.5, entityLabel: 'Ampoule (light.…)',
    lcd: (v) =>
      v.st?.attributes?.brightness != null
        ? `${Math.round(v.st.attributes.brightness / 2.55)}%`
        : lcdPower(v),
    // Couleur réelle si l'entité la fournit, sinon cycle d'arc-en-ciel quand elle est allumée
    update: (svg, v) => {
      const a = v.st?.attributes || {};
      const rgb = a.rgb_color;
      const fixed = Array.isArray(rgb);
      svg.classList.toggle('fixed', fixed);
      svg.style.setProperty('--bulb', fixed ? `rgb(${rgb.join(',')})` : '#ffd98a');
      svg.style.setProperty('--lvl', a.brightness != null ? Math.max(0.25, a.brightness / 255) : 1);
    },
    svg: `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <g class="fx">
    <circle ${AN('rbf glow')} cx="50" cy="38" r="40"/>
    <g ${AN('rbs')}><path ${AN('pulse crays')} d="M50 2v6M14 16l4 4M86 16l-4 4M4 40h6M96 40h-6"/></g>
  </g>
  <rect ${AN('rbf bulbglass')} x="40" y="56" width="20" height="12"/>
  <circle ${AN('rbf bulbglass')} cx="50" cy="38" r="24"/>
  <path class="fil" d="M44 66V52l3-6 3 6 3-6 3 6v14"/>
  <rect class="dark" x="39" y="68" width="22" height="20" rx="3"/>
  <path d="M39 72h22" stroke="#ff4d4d" stroke-width="1.6"/>
  <path d="M39 77h22" stroke="#5ee07a" stroke-width="1.6"/>
  <path d="M39 82h22" stroke="#4dc3ff" stroke-width="1.6"/>
  <text class="lcd" x="50" y="87.4" font-size="5" data-lcd>--</text>
  <path class="mid" d="M44 88h12l-2 6h-8z"/>
</svg>`,
    css: `.bulbglass{fill:#e8ecf1;stroke:#aab3bf;stroke-width:1.2;transition:fill .4s}
.on .bulbglass{fill:var(--bulb,#ffe28a)}
.glow{fill:var(--bulb,#ffd98a);opacity:calc(var(--lvl,1)*.4)}
.crays{fill:none;stroke:inherit;stroke-width:2.2;stroke-linecap:round}
.fil{fill:none;stroke:#aab3bf;stroke-width:1.6;stroke-linejoin:round}.on .fil{stroke:#fff}`,
  },

  shutter: {
    label: 'Volet électrique', on: 'En mouvement', off: 'À l’arrêt', threshold: 0, entityLabel: 'Volet (cover.…)',
    status: (v) => {
      const s = v.st?.state;
      const pct = v.pos != null ? ` ${Math.round(v.pos)} %` : '';
      if (s === 'opening') return `Ouverture…${pct}`;
      if (s === 'closing') return `Fermeture…${pct}`;
      if (s === 'closed') return 'Fermé';
      if (s === 'open') return v.pos != null && v.pos < 100 ? `Ouvert à ${Math.round(v.pos)} %` : 'Ouvert';
      return null;
    },
    // 100 % = volet ouvert (lames remontées), 0 % = fermé
    update: (svg, v) => {
      let pos = v.pos;
      if (pos == null) pos = v.st?.state === 'closed' ? 0 : v.st?.state === 'open' ? 100 : 50;
      pos = Math.max(0, Math.min(100, pos));
      svg.style.setProperty('--sy', `${-(pos / 100) * 64}px`);
    },
    svg: `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="slat" width="10" height="7" patternUnits="userSpaceOnUse">
      <rect width="10" height="7" fill="#d9dee6"/><rect y="5.2" width="10" height="1.8" fill="#aab3bf"/>
    </pattern>
    <clipPath id="shc"><rect x="18" y="22" width="64" height="62"/></clipPath>
  </defs>
  <rect x="18" y="22" width="64" height="62" fill="#bfe3f7"/>
  <circle cx="66" cy="38" r="7" fill="#ffd54a"/>
  <path d="M18 84V68q16-10 32 0t32-4V84z" fill="#7fc067"/>
  <g clip-path="url(#shc)">
    <g class="slats">
      <rect x="18" y="22" width="64" height="58" fill="url(#slat)"/>
      <rect class="mid" x="18" y="80" width="64" height="4"/>
    </g>
  </g>
  <rect x="18" y="22" width="64" height="62" fill="none" stroke="#8a94a3" stroke-width="2"/>
  <rect class="body" x="10" y="8" width="80" height="16" rx="3"/>
  <circle class="led" cx="80" cy="16" r="2.2"/>
  <rect class="mid" x="12" y="84" width="76" height="5" rx="2"/>
</svg>`,
    css: `svg{--sy:-32px}.slats{transform:translateY(var(--sy));transition:transform 1s linear}`,
  },

  /* ---------------- Linge & vaisselle ---------------- */
  washer: {
    label: 'Lave-linge', on: 'En cycle', off: 'À l’arrêt', threshold: 10, lcd: lcdPower,
    svg: `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <g class="anim shake">${FRONT_LOADER}
    <circle class="ring" cx="50" cy="60" r="28"/>
    <circle class="glassbg" cx="50" cy="60" r="23"/>
    <clipPath id="wm-clip"><circle cx="50" cy="60" r="23"/></clipPath>
    <g clip-path="url(#wm-clip)">
      <g ${SP(50, 60)}>
        <circle cx="40" cy="55" r="7" fill="#ff7b7b"/><circle cx="58" cy="66" r="8" fill="#ffd166"/>
        <circle cx="53" cy="47" r="6" fill="#6ec1ff"/><circle cx="45" cy="70" r="5" fill="#9be36b"/>
      </g>
      <path class="anim wave" d="M-20 70 q5 -5 10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t10 0 V100 H-20 Z"/>
    </g>
    <path class="shine" d="M33 50 A19 19 0 0 1 48 39"/>
  </g>
</svg>`,
    css: `.wave{fill:rgba(70,160,235,.55);animation:wave 1.6s linear infinite}
.glassbg{fill:#cfe9f8}`,
  },

  dryer: {
    label: 'Sèche-linge', on: 'Séchage en cours', off: 'À l’arrêt', threshold: 50, lcd: lcdPower,
    svg: `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <g class="anim shake">${FRONT_LOADER}
    <circle class="ring heatring" cx="50" cy="60" r="28"/>
    <circle class="dglass" cx="50" cy="60" r="23"/>
    <clipPath id="dr-clip"><circle cx="50" cy="60" r="23"/></clipPath>
    <g clip-path="url(#dr-clip)">
      <g ${SP(50, 60, 'spin-m')}>
        <circle cx="41" cy="54" r="7" fill="#f4a6c0"/><circle cx="58" cy="64" r="8" fill="#ffd166"/>
        <circle cx="54" cy="46" r="6" fill="#8fd3c7"/><circle cx="44" cy="70" r="5" fill="#b9a6f4"/>
      </g>
    </g>
    <path class="shine" d="M33 50 A19 19 0 0 1 48 39"/>
  </g>
</svg>`,
    css: `.heatring{transition:stroke .4s}.on .heatring{stroke:#ff8a3d;stroke-width:2.5}`,
  },

  dishwasher: {
    label: 'Lave-vaisselle', on: 'Lavage en cours', off: 'À l’arrêt', threshold: 10, lcd: lcdPower,
    svg: `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect class="body" x="14" y="6" width="72" height="88" rx="6"/>
  <rect class="panel" x="14" y="6" width="72" height="18" rx="6"/>
  <rect class="panel" x="14" y="15" width="72" height="9"/>
  <rect class="screen" x="22" y="10" width="28" height="9" rx="2"/>
  <text class="lcd" x="36" y="16.6" font-size="6" data-lcd>--</text>
  <circle class="led" cx="62" cy="14.5" r="2.5"/><circle class="led" cx="72" cy="14.5" r="2.5"/>
  <rect class="dglass" x="22" y="30" width="56" height="50" rx="4"/>
  <path d="M26 72H74" stroke="#8a94a3" stroke-width="1.5"/>
  ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${29 + i * 8}" y="57" width="3" height="15" rx="1.5" fill="#e8ecf1"/>`).join('')}
  <rect ${AN('arm', 50, 47)} x="30" y="45.5" width="40" height="3.5" rx="1.7" fill="#9aa5b3"/>
  <g class="fx">
    <circle ${AN('fall water')} cx="38" cy="50" r="1.6"/>
    <circle ${AN('fall water d1')} cx="50" cy="50" r="1.6"/>
    <circle ${AN('fall water d2')} cx="62" cy="50" r="1.6"/>
  </g>
  <rect class="mid" x="38" y="85" width="24" height="4" rx="2"/>
</svg>`,
  },

  /* ---------------- Froid ---------------- */
  fridge: {
    label: 'Réfrigérateur', on: 'Compresseur en marche', off: 'Au repos', threshold: 20,
    openLabel: 'Porte ouverte', lcd: lcdTemp,
    svg: `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect class="body" x="24" y="5" width="52" height="90" rx="6"/>
  <rect class="inside" x="28" y="9" width="44" height="82" rx="3"/>
  <path class="shelf" d="M28 38H72M28 58H72M28 76H72"/>
  <rect x="34" y="44" width="8" height="14" rx="2" fill="#7fd1ae"/>
  <rect x="46" y="48" width="9" height="10" rx="2" fill="#ffb74d"/>
  <rect x="58" y="62" width="9" height="14" rx="2" fill="#ef7b7b"/>
  <g class="door">
    <rect class="body" x="24" y="5" width="52" height="30" rx="6"/>
    <rect class="body" x="24" y="37" width="52" height="58" rx="6"/>
    <rect class="screen" x="37" y="12" width="26" height="11" rx="2"/>
    <text class="lcd" x="50" y="20.4" font-size="7" data-lcd>--</text>
    <rect class="mid" x="68" y="16" width="2.6" height="12" rx="1.3"/>
    <rect class="mid" x="68" y="44" width="2.6" height="22" rx="1.3"/>
    <g ${SP(50, 73, 'spin-s flake')}><path d="M50 62v22M40.5 67.5l19 11M40.5 78.5l19-11"/></g>
  </g>
</svg>`,
    css: `.inside{fill:#fff4d3}.shelf{stroke:#d9c98e;stroke-width:1;fill:none}
.door{transform-box:view-box;transform-origin:24px 50px;transition:transform .45s ease}
.open .door{transform:scaleX(.28) skewY(-6deg)}
.flake{opacity:.25;fill:none;stroke:var(--ac-accent);stroke-width:2.4;stroke-linecap:round;transition:opacity .4s}
.on .flake{opacity:1}`,
  },

  freezer: {
    label: 'Congélateur', on: 'Compresseur en marche', off: 'Au repos', threshold: 20,
    openLabel: 'Tiroir ouvert', lcd: lcdTemp,
    svg: `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect class="body" x="24" y="5" width="52" height="90" rx="6"/>
  <rect class="dglass" x="27" y="8" width="46" height="26" rx="3"/>
  <rect class="body" x="27" y="36" width="46" height="26" rx="3"/>
  <rect class="mid" x="38" y="54" width="24" height="3" rx="1.5"/>
  <g ${SP(50, 49, 'spin-s flake')}><path d="M50 40v18M42.2 44.5l15.6 9M42.2 53.5l15.6-9"/></g>
  <rect class="body" x="27" y="64" width="46" height="26" rx="3"/>
  <rect class="mid" x="38" y="82" width="24" height="3" rx="1.5"/>
  <g class="drawer1">
    <rect class="body" x="27" y="8" width="46" height="26" rx="3"/>
    <rect class="screen" x="37" y="12" width="26" height="10" rx="2"/>
    <text class="lcd" x="50" y="19.6" font-size="6.5" data-lcd>--</text>
    <rect class="mid" x="38" y="26" width="24" height="3" rx="1.5"/>
  </g>
</svg>`,
    css: `.drawer1{transition:transform .4s ease}.open .drawer1{transform:translateY(8px)}
.flake{opacity:.25;fill:none;stroke:var(--ac-accent);stroke-width:2.2;stroke-linecap:round;transition:opacity .4s}
.on .flake{opacity:1}`,
  },

  /* ---------------- Eau chaude, cuisine ---------------- */
  waterheater: {
    label: 'Ballon thermodynamique', on: 'Chauffe', off: 'En veille', threshold: 30, lcd: lcdTemp,
    svg: `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect class="body" x="26" y="26" width="48" height="66" rx="8"/>
  <rect class="water" x="30" y="48" width="40" height="40" rx="5" opacity=".35"/>
  <rect class="heat" x="30" y="30" width="40" height="18" rx="5" opacity=".5"/>
  <rect class="screen" x="38" y="34" width="24" height="9" rx="2"/>
  <text class="lcd" x="50" y="41" font-size="6.5" data-lcd>--</text>
  <g class="fx">
    <circle ${AN('rise')} cx="40" cy="80" r="1.6" fill="#fff"/>
    <circle ${AN('rise d1')} cx="52" cy="82" r="1.3" fill="#fff"/>
    <circle ${AN('rise d2')} cx="62" cy="78" r="1.8" fill="#fff"/>
  </g>
  <rect class="body" x="30" y="6" width="40" height="22" rx="4"/>
  <circle class="dglass" cx="50" cy="17" r="8.5"/>
  <g ${SP(50, 17, 'spin-f')}>${blades(50, 17, 7.5, 4)}</g>
  <circle class="mid" cx="50" cy="17" r="1.8"/>
  <rect class="mid" x="34" y="92" width="6" height="5" rx="1"/><rect class="mid" x="60" y="92" width="6" height="5" rx="1"/>
</svg>`,
  },

  oven: {
    label: 'Four', on: 'En chauffe', off: 'Éteint', threshold: 100, lcd: lcdTemp,
    svg: `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect class="body" x="10" y="12" width="80" height="80" rx="6"/>
  <rect class="panel" x="10" y="12" width="80" height="16" rx="6"/>
  <rect class="panel" x="10" y="20" width="80" height="8"/>
  <circle class="mid" cx="20" cy="20" r="4"/><circle class="mid" cx="32" cy="20" r="4"/><circle class="mid" cx="80" cy="20" r="4"/>
  <rect class="screen" x="42" y="15" width="26" height="10" rx="2"/>
  <text class="lcd" x="55" y="22.4" font-size="6.5" data-lcd>--</text>
  <rect class="dglass" x="18" y="34" width="64" height="44" rx="4"/>
  <g class="fx"><rect ${AN('pulse')} x="18" y="34" width="64" height="44" rx="4" fill="#ff7a2e" fill-opacity=".35"/></g>
  <rect class="heat" x="24" y="38" width="52" height="2.5" rx="1.2"/>
  <rect class="heat" x="24" y="73" width="52" height="2.5" rx="1.2"/>
  <path d="M22 62H78" stroke="#8a94a3" stroke-width="1.5"/>
  <rect x="40" y="52" width="20" height="10" rx="4.5" fill="#d9a066"/>
  <rect class="mid" x="30" y="81" width="40" height="4" rx="2"/>
</svg>`,
  },

  microwave: {
    label: 'Micro-ondes', on: 'En marche', off: 'Éteint', threshold: 100, lcd: lcdPower,
    svg: `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect class="body" x="8" y="22" width="84" height="56" rx="6"/>
  <rect class="dglass" x="14" y="28" width="54" height="44" rx="4"/>
  <ellipse class="mid" cx="41" cy="65" rx="22" ry="3.5"/>
  <g ${AN('slide')}>
    <path d="M31 61a10 5 0 0 0 20 0z" fill="#e8ecf1"/>
    <ellipse cx="41" cy="60" rx="8" ry="3" fill="#e9a35f"/>
  </g>
  <g class="fx"><rect ${AN('pulse')} x="14" y="28" width="54" height="44" rx="4" fill="#ffd54a" fill-opacity=".3"/></g>
  <rect class="panel" x="72" y="28" width="14" height="44" rx="3"/>
  <rect class="screen" x="74" y="31" width="10" height="7" rx="1.5"/>
  <text class="lcd" x="79" y="36.3" font-size="4.4" data-lcd>--</text>
  <circle class="mid" cx="79" cy="46" r="2.3"/><circle class="mid" cx="79" cy="53" r="2.3"/>
  <circle class="mid" cx="79" cy="60" r="2.3"/><circle class="led" cx="79" cy="67" r="2"/>
</svg>`,
  },

  hob: {
    label: 'Plaque à induction', on: 'En cuisson', off: 'Éteinte', threshold: 50, lcd: lcdPower,
    svg: `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect class="dark" x="8" y="14" width="84" height="72" rx="6"/>
  ${[[30, 36], [70, 36], [30, 64], [70, 64]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="12" fill="none" stroke="#5a6472" stroke-width="1.2"/>`).join('')}
  <g class="fx">
    <circle ${AN('pulse')} cx="30" cy="36" r="11" fill="#ff4d3a" fill-opacity=".55"/>
    <circle ${AN('ripple', 30, 36)} cx="30" cy="36" r="12" fill="none" stroke="#ff7a5a" stroke-width="1.5"/>
    <circle ${AN('pulse d1')} cx="70" cy="64" r="11" fill="#ff4d3a" fill-opacity=".55"/>
    <circle ${AN('ripple', 70, 64)} cx="70" cy="64" r="12" fill="none" stroke="#ff7a5a" stroke-width="1.5"/>
  </g>
  <circle cx="30" cy="36" r="9" fill="#c9d0da" stroke="#8a94a3"/>
  <rect x="39" y="35" width="8" height="2.6" rx="1.3" fill="#8a94a3"/>
  <g class="fx">
    <path ${AN('rise steam')} d="M27 27q-2-3 0-6"/><path ${AN('rise steam d1')} d="M33 27q2-3 0-6"/>
  </g>
  <rect class="screen" x="40" y="77" width="20" height="7" rx="2"/>
  <text class="lcd" x="50" y="82.3" font-size="5" data-lcd>--</text>
</svg>`,
  },

  coffee: {
    label: 'Cafetière', on: 'Préparation du café', off: 'En veille', threshold: 100, lcd: lcdPower,
    svg: `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect class="body" x="22" y="8" width="56" height="84" rx="7"/>
  <rect class="glass" x="26" y="12" width="26" height="30" rx="4"/>
  <rect class="water" x="27.5" y="22" width="23" height="18" rx="3" opacity=".6"/>
  <rect class="screen" x="57" y="14" width="16" height="9" rx="2"/>
  <text class="lcd" x="65" y="20.6" font-size="5" data-lcd>--</text>
  <circle class="led" cx="65" cy="32" r="2.5"/>
  <rect class="mid" x="30" y="46" width="40" height="8" rx="3"/>
  <rect class="mid" x="47" y="54" width="6" height="5"/>
  <g class="fx">
    <rect x="49.2" y="59" width="1.6" height="11" fill="#5a3a22"/>
    <circle ${AN('fall')} cx="50" cy="60" r="1.5" fill="#5a3a22"/>
    <path ${AN('rise steam')} d="M43 68q-2-3 0-6"/><path ${AN('rise steam d1')} d="M57 68q2-3 0-6"/>
  </g>
  <path d="M38 70h24v12q0 6-6 6h-12q-6 0-6-6z" fill="#fff" stroke="#aab3bf"/>
  <path d="M62 74h3q4 0 4 4t-4 4h-3" fill="none" stroke="#aab3bf" stroke-width="2"/>
  <rect ${AN('fillup', 50, 86)} x="40" y="72" width="20" height="14" rx="3" fill="#5a3a22"/>
</svg>`,
  },

  hood: {
    label: 'Hotte aspirante', on: 'Aspiration', off: 'Éteinte', threshold: 20,
    svg: `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect class="body" x="38" y="4" width="24" height="34" rx="2"/>
  <path class="body" d="M10 62L32 36H68L90 62Z"/>
  <rect class="panel" x="10" y="62" width="80" height="6" rx="2"/>
  <circle class="led" cx="24" cy="65" r="2"/><circle class="led" cx="32" cy="65" r="2"/>
  <g class="fx">
    <path ${AN('pulse')} d="M16 68L10 94H90L84 68Z" fill="#ffe28a" fill-opacity=".35"/>
    <path ${AN('flow air')} d="M30 92V72"/><path ${AN('flow air')} d="M50 92V72"/><path ${AN('flow air')} d="M70 92V72"/>
  </g>
</svg>`,
  },

  /* ---------------- Maison : chauffage, air, eau ---------------- */
  radiator: {
    label: 'Radiateur', on: 'Chauffe', off: 'Éteint', threshold: 50,
    svg: `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  ${[0, 1, 2, 3, 4, 5].map((i) => `<rect class="heat" x="${14 + i * 13}" y="30" width="9" height="54" rx="4"/>`).join('')}
  <rect class="mid" x="12" y="26" width="76" height="6" rx="3"/>
  <rect class="mid" x="12" y="80" width="76" height="6" rx="3"/>
  <rect class="mid" x="20" y="86" width="4" height="8"/><rect class="mid" x="76" y="86" width="4" height="8"/>
  <g class="fx">
    <path ${AN('rise hotair')} d="M26 20q-3-3 0-6"/><path ${AN('rise hotair d1')} d="M50 20q-3-3 0-6"/>
    <path ${AN('rise hotair d2')} d="M74 20q-3-3 0-6"/>
  </g>
</svg>`,
  },

  towelrail: {
    label: 'Sèche-serviettes', on: 'Chauffe', off: 'Éteint', threshold: 30,
    svg: `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  ${[14, 26, 38, 50, 62, 74].map((y) => `<rect class="heat" x="12" y="${y}" width="63" height="5" rx="2.5"/>`).join('')}
  <rect class="mid" x="12" y="8" width="5" height="84" rx="2.5"/><rect class="mid" x="70" y="8" width="5" height="84" rx="2.5"/>
  <rect x="24" y="35" width="40" height="30" rx="3" fill="#e8b4c8"/>
  <path d="M24 44h40M24 54h40" stroke="#fff" stroke-opacity=".6" stroke-width="2"/>
  <g class="fx">
    <path ${AN('rise hotair')} d="M84 70q-3-4 0-8q3-4 0-8"/><path ${AN('rise hotair d2')} d="M92 66q-3-4 0-8q3-4 0-8"/>
  </g>
</svg>`,
  },

  ac: {
    label: 'Climatisation', on: 'Climatisation active', off: 'Éteinte', threshold: 50, lcd: lcdTemp,
    svg: `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect class="body" x="6" y="14" width="88" height="34" rx="8"/>
  <rect class="panel" x="12" y="20" width="76" height="6" rx="3"/>
  <rect class="dglass" x="12" y="39" width="76" height="6" rx="3"/>
  <rect class="screen" x="68" y="28" width="18" height="8" rx="2"/>
  <text class="lcd" x="77" y="34" font-size="5.5" data-lcd>--</text>
  <circle class="led" cx="16" cy="32" r="2"/>
  <g class="fx">
    <path ${AN('fall air')} d="M20 48q-2 8 2 16"/><path ${AN('fall air d1')} d="M34 48q-2 8 2 16"/>
    <path ${AN('fall air d2')} d="M48 48q-2 8 2 16"/><path ${AN('fall air d1')} d="M62 48q-2 8 2 16"/>
    <path ${AN('fall air')} d="M76 48q-2 8 2 16"/>
  </g>
</svg>`,
  },

  vmc: {
    label: 'VMC', on: 'Ventilation active', off: 'Arrêtée', threshold: 10,
    svg: `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect class="mid" x="30" y="10" width="14" height="10" rx="2"/><rect class="mid" x="56" y="10" width="14" height="10" rx="2"/>
  <rect class="body" x="12" y="20" width="76" height="60" rx="8"/>
  <circle class="ring" cx="38" cy="50" r="20"/><circle class="dglass" cx="38" cy="50" r="16"/>
  <g ${SP(38, 50, 'spin-f')}>${blades(38, 50, 14, 5, '#9aa5b3')}</g>
  <circle class="mid" cx="38" cy="50" r="3"/>
  <path d="M66 36h16M66 44h16M66 52h16M66 60h16" stroke="#aab3bf" stroke-width="2.5" stroke-linecap="round"/>
  <circle class="led" cx="80" cy="28" r="2.5"/>
  <g class="fx"><path ${AN('flow air')} d="M14 90H86"/></g>
</svg>`,
  },

  poolpump: {
    label: 'Pompe de piscine', on: 'Filtration en cours', off: 'À l’arrêt', threshold: 50,
    svg: `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect class="mid" x="2" y="72" width="96" height="9" rx="4"/>
  <g class="fx"><path ${AN('flow')} d="M4 76.5H96" fill="none" stroke="#5fb4ff" stroke-width="3"/></g>
  <rect class="body" x="58" y="38" width="36" height="32" rx="6"/>
  <path d="M66 40v28M74 40v28M82 40v28M88 40v28" stroke="#c9d0da" stroke-width="2"/>
  <circle class="body" cx="50" cy="58" r="14"/>
  <circle class="dglass" cx="50" cy="58" r="10"/>
  <g ${SP(50, 58, 'spin-f')}>${blades(50, 58, 9, 5, '#6fb7ec')}</g>
  <rect class="glass" x="10" y="44" width="26" height="30" rx="5"/>
  <rect class="water" x="12" y="58" width="22" height="14" rx="3" opacity=".5"/>
  <path d="M16 50h14M16 56h14M16 62h14M16 68h14" stroke="#9fc6e6" stroke-width="1.2"/>
  <rect class="mid" x="8" y="40" width="30" height="6" rx="3"/>
</svg>`,
  },

  /* ---------------- Multimédia & informatique ---------------- */
  tv: {
    label: 'Téléviseur', on: 'Allumé', off: 'Éteint', threshold: 20, lcd: lcdPower,
    svg: `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="tvg" x1="0" y1="0" x2=".5" y2="0" spreadMethod="repeat">
      <stop offset="0" stop-color="#ff5ea8"/><stop offset=".33" stop-color="#5eb8ff"/>
      <stop offset=".66" stop-color="#7cffb0"/><stop offset="1" stop-color="#ff5ea8"/>
    </linearGradient>
    <clipPath id="tvc"><rect x="9" y="21" width="82" height="48" rx="2"/></clipPath>
  </defs>
  <rect class="dark" x="6" y="18" width="88" height="54" rx="4"/>
  <rect x="9" y="21" width="82" height="48" rx="2" fill="#10151c"/>
  <g class="fx" clip-path="url(#tvc)">
    <rect ${AN('pan')} x="9" y="21" width="164" height="48" fill="url(#tvg)"/>
    <circle ${AN('slide')} cx="50" cy="45" r="11" fill="#fff" fill-opacity=".3"/>
  </g>
  <text class="lcd" x="50" y="48.5" font-size="9" style="fill:#fff" data-lcd>--</text>
  <path class="mid" d="M40 72h20l4 11H36z"/><rect class="mid" x="28" y="83" width="44" height="4" rx="2"/>
  <circle class="led" cx="50" cy="70" r="1.3"/>
</svg>`,
  },

  homelab: {
    label: 'Baie homelab', on: 'Sous tension', off: 'Hors tension', threshold: 20, lcd: lcdPower,
    svg: `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect class="dark" x="16" y="4" width="68" height="92" rx="4"/>
  <rect class="unit" x="21" y="9" width="58" height="17" rx="2"/>
  <rect class="screen" x="45" y="13" width="28" height="9" rx="1.5"/>
  <text class="lcd" x="59" y="19.6" font-size="6" data-lcd>--</text>
  <circle class="led" cx="27" cy="17.5" r="1.8"/><circle ${AN('blink led')} cx="33" cy="17.5" r="1.8"/>
  <rect class="unit" x="21" y="30" width="58" height="17" rx="2"/>
  <circle cx="35" cy="38.5" r="6.5" fill="#1b2733"/><g ${SP(35, 38.5, 'spin-f')}>${blades(35, 38.5, 6, 5, '#8a94a3')}</g>
  <circle cx="63" cy="38.5" r="6.5" fill="#1b2733"/><g ${SP(63, 38.5, 'spin-f')}>${blades(63, 38.5, 6, 5, '#8a94a3')}</g>
  <rect class="unit" x="21" y="51" width="58" height="17" rx="2"/>
  ${[0, 1, 2, 3].map((i) => `<rect x="${25 + i * 13.5}" y="55" width="11" height="9" rx="1.5" fill="#1b2733"/><circle ${AN('blink led d' + (i % 3 + 1))} cx="${27.5 + i * 13.5}" cy="60" r="1.2"/>`).join('')}
  <rect class="unit" x="21" y="72" width="58" height="17" rx="2"/>
  ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${26 + i * 8.5}" y="77" width="6" height="6" rx="1" fill="#1b2733"/><circle ${AN('blink led d' + (i % 3 + 1))} cx="${29 + i * 8.5}" cy="86" r="1"/>`).join('')}
</svg>`,
    css: `.unit{fill:#2d3642;stroke:#4b5666}`,
  },

  pc: {
    label: 'PC fixe', on: 'Allumé', off: 'Éteint', threshold: 30, lcd: lcdPower,
    svg: `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect class="dark" x="26" y="6" width="48" height="88" rx="5"/>
  <rect x="31" y="11" width="38" height="78" rx="3" fill="#10151c"/>
  ${[[23, '#ff4fd8'], [44, '#4fd8ff'], [65, '#7cff7c']].map(([y, c], i) => `
  <circle cx="50" cy="${y}" r="10" fill="#1b2733" stroke="#4b5666"/>
  <g ${SP(50, y, 'spin-f')}>${blades(50, y, 9, 7, '#6b7685')}</g>
  <g class="fx"><circle ${AN('pulse d' + i)} cx="50" cy="${y}" r="10" fill="none" stroke="${c}" stroke-width="1.8"/></g>`).join('')}
  <rect x="31" y="77" width="38" height="12" fill="#1b2733"/>
  <text class="lcd" x="50" y="85" font-size="6" data-lcd>--</text>
  <circle class="led" cx="50" cy="8.5" r="1.5"/>
</svg>`,
  },

  /* ---------------- Énergie & mobilité ---------------- */
  linky: {
    label: 'Compteur Linky', on: 'Consommation en cours', off: 'Aucune consommation', threshold: 1,
    lcd: (v) => (v.power !== null ? `${Math.round(v.power)}W` : '--'),
    svg: `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect class="body" x="22" y="8" width="56" height="84" rx="6"/>
  <rect x="22" y="8" width="56" height="14" rx="6" fill="#8bc34a"/><rect x="22" y="16" width="56" height="6" fill="#8bc34a"/>
  <text x="50" y="18.5" text-anchor="middle" font-size="7" font-weight="700" fill="#fff" font-family="sans-serif">linky</text>
  <rect class="screen" x="28" y="28" width="44" height="20" rx="2"/>
  <text class="lcd" x="50" y="42" font-size="11" data-lcd>--</text>
  <circle class="led" cx="34" cy="58" r="2.5"/>
  <circle ${AN('blink led2')} cx="46" cy="58" r="2.5"/>
  <circle class="mid" cx="66" cy="58" r="3"/>
  <rect class="dark" x="30" y="72" width="40" height="14" rx="2"/>
  <path d="M38 76v6M50 76v6M62 76v6" stroke="#8a94a3" stroke-width="2"/>
  <g class="fx"><path ${AN('flow')} d="M50 98V88" fill="none" stroke="#ffb300" stroke-width="2.4"/></g>
</svg>`,
    css: `.led2{fill:#9aa5b3}.on .led2{fill:#ffb300}`,
  },

  linkytempo: {
    label: 'Linky offre Tempo', on: 'Consommation en cours', off: 'Aucune consommation', threshold: 1,
    extra: ['tempo_today', 'tempo_tomorrow', 'hc'],
    lcd: (v) => (v.power !== null ? `${Math.round(v.power)}W` : '--'),
    status: (v) =>
      `Aujourd’hui : ${tempoColor(v.get(v.cfg.tempo_today))[1]} · Demain : ${tempoColor(v.get(v.cfg.tempo_tomorrow))[1]}`,
    update: (svg, v) => {
      svg.style.setProperty('--t1', tempoColor(v.get(v.cfg.tempo_today))[0]);
      svg.style.setProperty('--t2', tempoColor(v.get(v.cfg.tempo_tomorrow))[0]);
      const hs = String(v.get(v.cfg.hc) || '').toLowerCase();
      const isHC = hs === 'on' || /creuse|^hc/.test(hs);
      const isHP = hs === 'off' || /pleine|^hp/.test(hs);
      const txt = svg.querySelector('[data-hphc]');
      if (txt) txt.textContent = isHC ? 'HC' : isHP ? 'HP' : '--';
      svg.style.setProperty('--hpc', isHC ? '#9be3a8' : isHP ? '#ffd9a0' : '#dde2e9');
    },
    svg: `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect class="body" x="22" y="6" width="56" height="88" rx="6"/>
  <rect x="22" y="6" width="56" height="14" rx="6" fill="#8bc34a"/><rect x="22" y="14" width="56" height="6" fill="#8bc34a"/>
  <text x="50" y="16.5" text-anchor="middle" font-size="7" font-weight="700" fill="#fff" font-family="sans-serif">linky</text>
  <rect class="screen" x="28" y="25" width="44" height="17" rx="2"/>
  <text class="lcd" x="50" y="37.5" font-size="10" data-lcd>--</text>
  <text class="tlabel" x="38" y="51">AUJ.</text><text class="tlabel" x="62" y="51">DEM.</text>
  <circle class="tday" cx="38" cy="62" r="9"/><circle class="tday2" cx="62" cy="62" r="9"/>
  <rect class="hpc" x="34" y="76" width="32" height="12" rx="6"/>
  <text class="hpctxt" x="50" y="85" data-hphc>--</text>
</svg>`,
    css: `.tlabel{font:600 5px sans-serif;text-anchor:middle;fill:#6b7685}
.tday{fill:var(--t1,#9aa5b3);stroke:#8a94a3;stroke-width:1.2}
.tday2{fill:var(--t2,#9aa5b3);stroke:#8a94a3;stroke-width:1.2}
.hpc{fill:var(--hpc,#dde2e9);stroke:#aab3bf}
.hpctxt{font:700 7px sans-serif;text-anchor:middle;fill:#3b4350}`,
  },

  solarbattery: {
    label: 'Batterie solaire', battery: true, on: 'Charge / décharge', off: 'Au repos', threshold: 20, lcd: lcdPct,
    update: (svg, v) =>
      svg.style.setProperty('--p', Math.max(0, Math.min(1, (v.prog ?? 50) / 100))),
    svg: `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect class="mid" x="28" y="16" width="12" height="8" rx="2"/><rect class="mid" x="60" y="16" width="12" height="8" rx="2"/>
  <rect class="body" x="14" y="24" width="72" height="68" rx="8"/>
  <rect class="dglass" x="20" y="32" width="60" height="46" rx="4"/>
  <rect class="lvl" x="22" y="34" width="56" height="42" rx="3"/>
  <path d="M22 44.5h56M22 55h56M22 65.5h56" stroke="#26313d" stroke-width="1.5"/>
  <g class="fx"><path ${AN('pulse')} d="M52 38L42 56H50L47 72L60 50H52Z" fill="#fff"/></g>
  <rect class="screen" x="36" y="81" width="28" height="8" rx="2"/>
  <text class="lcd" x="50" y="87.2" font-size="6" data-lcd>--</text>
</svg>`,
    css: `svg{--p:.5}.lvl{fill:#4cd964;transform-box:view-box;transform-origin:50px 76px;
  transform:scaleY(var(--p));transition:transform 1s ease}`,
  },

  evcharger: {
    label: 'Borne de recharge', on: 'Recharge en cours', off: 'Disponible', threshold: 100,
    lcd: (v) => (v.on && v.power !== null ? `${v.fmt(v.power / 1000)}kW` : '--'),
    svg: `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect class="body" x="8" y="14" width="26" height="58" rx="6"/>
  <circle ${AN('pulse ledring')} cx="21" cy="30" r="7" fill="none" stroke-width="3"/>
  <rect class="screen" x="12" y="44" width="18" height="9" rx="2"/>
  <text class="lcd" x="21" y="50.6" font-size="5.5" data-lcd>--</text>
  <path d="M34 62C48 62 44 77 58 77" fill="none" stroke="#3b4350" stroke-width="3" stroke-linecap="round"/>
  <g class="fx"><path ${AN('flow')} d="M34 62C48 62 44 77 58 77" fill="none" stroke="#4cd964" stroke-width="1.6"/></g>
  <path d="M58 84V76Q58 71 63 70L70 62Q71 60 74 60H86Q89 60 91 63L95 70Q98 71 98 76V84Z" fill="#6aa5e8"/>
  <path class="glass" d="M72 63H86L90 69H68Z"/>
  <circle cx="68" cy="85" r="5" fill="#3b4350"/><circle cx="90" cy="85" r="5" fill="#3b4350"/>
</svg>`,
    css: `.ledring{stroke:#9aa5b3}.on .ledring{stroke:#4cd964}`,
  },

  /* ---------------- Robots, outils, ventilation ---------------- */
  vacuum: {
    label: 'Robot aspirateur', battery: true, on: 'Nettoyage en cours', off: 'À la base', threshold: 5, lcd: lcdPct,
    svg: `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect class="body" x="6" y="6" width="88" height="88" rx="8"/>
  <g ${AN('roam')}>
    <circle cx="50" cy="50" r="16" fill="#3b4350" stroke="#8a94a3"/>
    <circle cx="50" cy="50" r="10.5" fill="#4b5666"/>
    <circle cx="50" cy="44" r="4.5" fill="#cfd5dd"/>
    <text class="lcd" x="50" y="57" font-size="5.5" style="fill:#fff" data-lcd>--</text>
    <g ${SP(37, 40, 'spin-f')}><path d="M37 40l-5-3M37 40l4-5M37 40l3 5" stroke="#ff8a3d" stroke-width="1.6" stroke-linecap="round"/></g>
    <circle class="led" cx="60" cy="42" r="2"/>
  </g>
</svg>`,
  },

  mower: {
    label: 'Robot tondeuse', battery: true, on: 'Tonte en cours', off: 'À la base', threshold: 5,
    svg: `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" fill="#dff1ff"/>
  <g ${AN('slide')}>
    <path d="M22 70Q22 54 40 52H66Q80 52 80 66V72H22Z" fill="#ff8a3d"/>
    <rect x="30" y="56" width="22" height="6" rx="3" fill="#ffd9b8"/>
    <rect x="56" y="49" width="10" height="4" rx="2" fill="#e04b3a"/>
    <circle class="led" cx="72" cy="60" r="2.5"/>
    <rect x="40" y="76" width="22" height="2" fill="#8a94a3"/>
    <circle cx="34" cy="72" r="9" fill="#3b4350"/>
    <g ${SP(34, 72)}><path d="M34 63v18M25 72h18" stroke="#8a94a3" stroke-width="2"/></g>
    <circle cx="70" cy="74" r="6" fill="#3b4350"/>
  </g>
  <path d="M0 76${'l4-7 4 7'.repeat(12)}L100 76V100H0Z" fill="#6dbb4a"/>
</svg>`,
  },

  fan: {
    label: 'Ventilateur', on: 'En marche', off: 'Arrêté', threshold: 5,
    svg: `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect class="mid" x="47" y="68" width="6" height="20" rx="2"/>
  <ellipse class="mid" cx="50" cy="91" rx="22" ry="5"/>
  <circle class="led" cx="50" cy="91" r="2"/>
  <circle cx="50" cy="38" r="30" fill="#f2f4f7" fill-opacity=".5" stroke="#aab3bf" stroke-width="2.5"/>
  <g ${SP(50, 38, 'spin-f')}>${blades(50, 38, 24, 3, '#7aa7d8')}</g>
  <circle cx="50" cy="38" r="20" fill="none" stroke="#c9d0da" stroke-width="1.2"/>
  <circle cx="50" cy="38" r="10" fill="none" stroke="#c9d0da" stroke-width="1.2"/>
  <path d="M50 8v60M20 38h60" stroke="#c9d0da" stroke-width="1.2"/>
  <circle class="mid" cx="50" cy="38" r="5"/>
</svg>`,
  },

  toolcharger: {
    label: 'Chargeur d’outils', battery: true, on: 'En charge', off: 'Libre', threshold: 5, lcd: lcdPower,
    svg: `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect class="body" x="10" y="64" width="80" height="26" rx="6"/>
  <rect class="dglass" x="22" y="58" width="42" height="12" rx="3"/>
  <rect x="26" y="24" width="44" height="36" rx="4" fill="#f5c518" stroke="#b58a00" stroke-width="1.5"/>
  <rect x="26" y="50" width="44" height="10" rx="3" fill="#3b4350"/>
  <rect ${AN('blink bar')} x="33" y="30" width="8" height="12" rx="1.5"/>
  <rect ${AN('blink bar d1')} x="45" y="30" width="8" height="12" rx="1.5"/>
  <rect ${AN('blink bar d2')} x="57" y="30" width="8" height="12" rx="1.5"/>
  <circle class="led" cx="78" cy="70" r="3"/>
  <rect class="screen" x="66" y="76" width="20" height="9" rx="2"/>
  <text class="lcd" x="76" y="82.6" font-size="6" data-lcd>--</text>
  <path d="M90 78h6" stroke="#3b4350" stroke-width="3" stroke-linecap="round"/>
</svg>`,
    css: `.bar{fill:#3b4350}.on .bar{fill:#4cd964}`,
  },

  printer: {
    label: 'Imprimante 3D', on: 'Impression en cours', off: 'Au repos', threshold: 30,
    lcd: (v) => (v.prog !== null ? `${Math.round(v.prog)}%` : v.on ? '...' : '--'),
    // Règle la hauteur de la pièce et du portique selon la progression
    update: (svg, v) => {
      const p = Math.max(0, Math.min(1, (v.prog !== null ? v.prog : v.on ? 50 : 0) / 100));
      svg.style.setProperty('--p', p);
      svg.style.setProperty('--gy', `${39 - 44 * p}px`);
    },
    svg: `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect class="frame" x="16" y="10" width="4" height="74" rx="2"/>
  <rect class="frame" x="80" y="10" width="4" height="74" rx="2"/>
  <rect class="frame" x="16" y="8" width="68" height="5" rx="2"/>
  <rect class="obj" x="40" y="34" width="20" height="44" rx="2"/>
  <g class="gantry">
    <rect class="frame" x="18" y="26" width="64" height="4" rx="2"/>
    <g class="anim head">
      <rect class="headbody" x="44" y="24" width="12" height="10" rx="2"/>
      <path class="nozzle" d="M48 34h4l-2 5z"/>
    </g>
  </g>
  <rect class="dark" x="22" y="78" width="56" height="6" rx="1.5"/>
  <rect class="body" x="12" y="84" width="76" height="11" rx="3"/>
  <rect class="screen" x="34" y="86.5" width="32" height="6.5" rx="1.5"/>
  <text class="lcd" x="50" y="91.6" font-size="5" data-lcd>--</text>
</svg>`,
    css: `svg{--p:.5;--gy:17px}
.frame{fill:#6b7685}
.obj{fill:#ff8a3d;transform-box:view-box;transform-origin:50px 78px;
  transform:scaleY(var(--p));transition:transform 1s linear}
.gantry{transform:translateY(var(--gy));transition:transform 1s linear}
.headbody{fill:#e9edf2;stroke:#9aa5b3;stroke-width:1}
.nozzle{fill:#9aa5b3}.on .nozzle{fill:#ff6b35}
.head{animation:head 2.2s ease-in-out infinite}
@keyframes head{0%,100%{transform:translateX(-14px)}50%{transform:translateX(14px)}}`,
  },
};

/* ------------------------------------------------------------------ */
/*  Styles communs                                                     */
/* ------------------------------------------------------------------ */
const BASE_CSS = `
:host{display:block}
ha-card{--ac-accent:var(--primary-color);overflow:hidden;cursor:pointer}
.wrap{display:flex;align-items:center;gap:16px;padding:16px}
.art{width:110px;flex:none}
.art svg{width:100%;height:auto;display:block}
.info{min-width:0;flex:1}
.name{font-size:1.05rem;font-weight:500;color:var(--primary-text-color)}
.status{font-size:.9rem;margin-top:2px;color:var(--secondary-text-color)}
.on .status{color:var(--ac-accent)}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.chip{background:var(--secondary-background-color);border-radius:12px;
  padding:3px 10px;font-size:.8rem;color:var(--primary-text-color)}

/* Palette des illustrations */
.body{fill:#f2f4f7;stroke:#aab3bf;stroke-width:1.2}
.panel{fill:#dde2e9}
.ring{fill:#c9d0da;stroke:#aab3bf;stroke-width:1.2}
.screen{fill:#1b2733}
.dark{fill:#3b4350}
.mid{fill:#8a94a3}
.glass{fill:#cfe9f8;stroke:#aab3bf;stroke-width:1}
.dglass{fill:#26313d}
.lcd{fill:#7fe3ff;font-family:monospace;font-weight:700;text-anchor:middle}
.heat{fill:#cfd5dd;transition:fill .4s}
.on .heat{fill:#ff5a36}
.led{fill:#9aa5b3;transition:fill .4s}
.on .led{fill:#4cd964}
.air{fill:none;stroke:#7cc4ff;stroke-width:1.6;stroke-linecap:round}
.hotair{fill:none;stroke:#ff9a5a;stroke-width:1.8;stroke-linecap:round}
.steam{fill:none;stroke:#b8c0cc;stroke-width:1.8;stroke-linecap:round}
.water{fill:#5fb4ff}
.shine{fill:none;stroke:#fff;stroke-width:2.5;stroke-linecap:round;opacity:.6}
.fx{opacity:0;transition:opacity .4s}
.on .fx{opacity:1}

/* Animations (jouées seulement quand l'appareil est en marche) */
.spin{transform-box:view-box;animation:spin 1.2s linear infinite}
.spin-m{animation-duration:2.2s}
.spin-s{animation-duration:5s}
.spin-f{animation-duration:.45s}
.rise{animation:rise 2s ease-out infinite}
.fall{animation:fall 1.2s ease-in infinite}
.pulse{animation:pulse 1.6s ease-in-out infinite}
.blink{animation:blink 1s steps(2,jump-none) infinite}
.flow{stroke-dasharray:3 3;animation:flow .7s linear infinite}
.shake{animation:vib .14s linear infinite}
.roam{animation:roam 8s ease-in-out infinite}
.slide{animation:slide 3s ease-in-out infinite alternate}
.pan{animation:pan 4s linear infinite}
.arm{transform-box:view-box;animation:arm 1.6s ease-in-out infinite}
.fillup{transform-box:view-box;animation:fillup 6s ease-in-out infinite}
.ripple{transform-box:view-box;animation:ripple 1.8s ease-out infinite}
.d1{animation-delay:.3s}.d2{animation-delay:.6s}.d3{animation-delay:.9s}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes rise{0%{transform:translateY(4px);opacity:0}30%{opacity:.9}100%{transform:translateY(-8px);opacity:0}}
@keyframes fall{0%{transform:translateY(-3px);opacity:0}30%{opacity:1}100%{transform:translateY(8px);opacity:0}}
@keyframes pulse{0%,100%{opacity:.35}50%{opacity:1}}
@keyframes blink{0%{opacity:1}50%{opacity:.15}}
@keyframes flow{to{stroke-dashoffset:-12}}
@keyframes vib{0%{transform:translate(0,0)}25%{transform:translate(.4px,.3px)}50%{transform:translate(0,-.3px)}75%{transform:translate(-.4px,.2px)}100%{transform:translate(0,0)}}
@keyframes roam{0%,100%{transform:translate(-10px,-6px)}25%{transform:translate(10px,-6px)}50%{transform:translate(10px,8px)}75%{transform:translate(-10px,8px)}}
@keyframes slide{from{transform:translateX(-8px)}to{transform:translateX(8px)}}
@keyframes pan{to{transform:translateX(-82px)}}
@keyframes arm{0%,100%{transform:scaleX(1)}50%{transform:scaleX(.15)}}
@keyframes fillup{0%{transform:scaleY(.05)}85%,100%{transform:scaleY(1)}}
@keyframes ripple{0%{transform:scale(.45);opacity:.9}100%{transform:scale(1.2);opacity:0}}
@keyframes wave{to{transform:translateX(20px)}}

.rbf{animation:rbfill 6s linear infinite}
.rbs{animation:rbstroke 6s linear infinite}
svg.fixed .rbf,svg.fixed .rbs{animation:none}
svg.fixed .rbs{stroke:var(--bulb)}
@keyframes rbfill{0%,100%{fill:#ff4d4d}17%{fill:#ffb84d}33%{fill:#f5e050}50%{fill:#5ee07a}67%{fill:#4dc3ff}83%{fill:#b06bff}}
@keyframes rbstroke{0%,100%{stroke:#ff4d4d}17%{stroke:#ffb84d}33%{stroke:#f5e050}50%{stroke:#5ee07a}67%{stroke:#4dc3ff}83%{stroke:#b06bff}}

/* Pause quand l'appareil est à l'arrêt (prioritaire sur les raccourcis "animation") */
.anim{animation-play-state:paused!important}
.on .anim{animation-play-state:running!important}
@media (prefers-reduced-motion:reduce){.anim{animation:none!important}}
`;

/* ------------------------------------------------------------------ */
/*  La carte                                                           */
/* ------------------------------------------------------------------ */
class MesAppareilsCard extends HTMLElement {
  static getStubConfig() {
    return { appliance: 'washer' };
  }

  // Formulaire de l'éditeur visuel. appliance = null -> carte "à liste déroulante"
  static buildForm(appliance) {
    const def = appliance ? APPLIANCES[appliance] : null;
    const labels = {
      appliance: 'Appareil',
      name: 'Nom (facultatif)',
      entity: def?.entityLabel || 'Entité principale (état / prise)',
      power: 'Capteur de puissance (W)',
      energy: 'Capteur d’énergie (kWh)',
      cost: 'Capteur de coût (€)',
      temperature: 'Capteur de température',
      door: 'Capteur de porte (binary_sensor)',
      progress: 'Progression / batterie (%)',
      remaining: 'Temps restant',
      tempo_today: 'Couleur Tempo aujourd’hui (capteur)',
      tempo_tomorrow: 'Couleur Tempo demain (capteur)',
      hc: 'Heures creuses (capteur HC/HP)',
      threshold: 'Seuil « en marche » (W)',
    };
    const sensor = (name) => ({ name, selector: { entity: { domain: 'sensor' } } });
    const schema = [];
    if (!appliance) {
      schema.push({
        name: 'appliance',
        required: true,
        selector: {
          select: {
            mode: 'dropdown',
            options: Object.entries(APPLIANCES).map(([value, d]) => ({ value, label: d.label })),
          },
        },
      });
    }
    schema.push(
      { name: 'name', selector: { text: {} } },
      { name: 'entity', selector: { entity: {} } },
      sensor('power'), sensor('energy'), sensor('cost'), sensor('temperature'),
      { name: 'door', selector: { entity: { domain: 'binary_sensor' } } },
      sensor('progress'), sensor('remaining')
    );
    ['tempo_today', 'tempo_tomorrow', 'hc'].forEach((n) => {
      if (!def || (def.extra || []).includes(n)) {
        schema.push({ name: n, selector: { entity: { domain: ['sensor', 'binary_sensor'] } } });
      }
    });
    schema.push({ name: 'threshold', selector: { number: { min: 0, max: 5000, mode: 'box' } } });
    return { schema, computeLabel: (sc) => labels[sc.name] || sc.name };
  }

  static getConfigForm() {
    return MesAppareilsCard.buildForm(null);
  }

  setConfig(config) {
    if (!config || !APPLIANCES[config.appliance]) {
      throw new Error(`appliance doit être : ${Object.keys(APPLIANCES).join(', ')}`);
    }
    this._config = { ...config };
    this._built = false;
    if (this._hass) {
      this._build();
      this._update();
    }
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config) return;
    if (!this._built) this._build();
    this._update();
  }

  getCardSize() {
    return 3;
  }

  getGridOptions() {
    return { columns: 6, rows: 3, min_columns: 3, min_rows: 2 };
  }

  /* ---------- construction du DOM (une seule fois) ---------- */
  _build() {
    const c = this._config;
    const def = APPLIANCES[c.appliance];
    const root = this.shadowRoot || this.attachShadow({ mode: 'open' });
    root.innerHTML = `
      <style>${BASE_CSS}${def.css || ''}</style>
      <ha-card>
        <div class="wrap">
          <div class="art">${def.svg}</div>
          <div class="info">
            <div class="name"></div>
            <div class="status"></div>
            <div class="chips"></div>
          </div>
        </div>
      </ha-card>`;
    const card = root.querySelector('ha-card');
    if (c.color) card.style.setProperty('--ac-accent', c.color);
    card.addEventListener('click', () => {
      const entityId = c.entity || c.power;
      if (!entityId) return;
      const ev = new Event('hass-more-info', { bubbles: true, composed: true });
      ev.detail = { entityId };
      this.dispatchEvent(ev);
    });
    this._built = true;
  }

  /* ---------- helpers ---------- */
  _num(id) {
    if (!id) return null;
    const s = this._hass.states[id];
    if (!s) return null;
    const v = parseFloat(s.state);
    return Number.isNaN(v) ? null : v;
  }

  _fmt(v) {
    return Number(v).toLocaleString(this._hass.locale?.language || 'fr', {
      maximumFractionDigits: 1,
    });
  }

  /* ---------- mise à jour à chaque changement d'état ---------- */
  _update() {
    const c = this._config;
    const h = this._hass;
    const def = APPLIANCES[c.appliance];
    const root = this.shadowRoot;
    const card = root.querySelector('ha-card');

    const power = this._num(c.power);
    const temp = this._num(c.temperature);
    const prog = this._num(c.progress);
    const threshold = c.threshold ?? def.threshold;
    const st = c.entity ? h.states[c.entity] : undefined;
    const unavailable = !!st && ['unavailable', 'unknown'].includes(st.state);

    // Capteur de puissance prioritaire (cas d'une simple prise connectée)
    let on = false;
    if (power !== null) on = power > threshold;
    else if (st) on = ACTIVE_STATES.includes(st.state);

    const open = c.door ? h.states[c.door]?.state === 'on' : false;
    card.classList.toggle('on', on && !unavailable);
    card.classList.toggle('open', open);

    const attrs = st?.attributes || {};
    const pos = attrs.current_position != null ? Number(attrs.current_position) : prog;
    const ctx = {
      on, power, temp, prog, pos, st, cfg: c,
      get: (id) => (id ? h.states[id]?.state : undefined),
      fmt: this._fmt.bind(this),
    };
    root.querySelector('.name').textContent = c.name || def.label;
    root.querySelector('.status').textContent = unavailable
      ? 'Indisponible'
      : open && def.openLabel
        ? def.openLabel
        : (def.status && def.status(ctx)) || (on ? def.on : def.off);

    const lcd = root.querySelector('[data-lcd]');
    if (lcd && def.lcd) lcd.textContent = def.lcd(ctx);
    const svg = root.querySelector('.art svg');
    if (def.update) def.update(svg, ctx);

    // Pastilles d'information
    const chips = [];
    if (power !== null) chips.push(`${this._fmt(power)} W`);
    if (c.energy) {
      const e = h.states[c.energy];
      const ev = this._num(c.energy);
      if (e && ev !== null) {
        chips.push(`${this._fmt(ev)} ${e.attributes.unit_of_measurement || 'kWh'}`);
      }
    }
    if (temp !== null) chips.push(`${this._fmt(temp)} °C`);
    const costVal = this._num(c.cost);
    if (costVal !== null) {
      const cu = h.states[c.cost].attributes.unit_of_measurement;
      chips.push(`Coût ${this._fmt(costVal)} ${!cu || cu === 'EUR' ? '€' : cu}`);
    }
    if (prog !== null) chips.push(`${def.battery ? 'Batterie' : 'Progression'} ${this._fmt(prog)} %`);
    if (c.remaining) {
      const r = h.states[c.remaining];
      if (r && !['unavailable', 'unknown'].includes(r.state)) {
        chips.push(`${r.state} ${r.attributes.unit_of_measurement || ''}`.trim());
      }
    }
    const box = root.querySelector('.chips');
    box.replaceChildren(
      ...chips.map((t) => {
        const d = document.createElement('div');
        d.className = 'chip';
        d.textContent = t;
        return d;
      })
    );
  }
}

if (!customElements.get('mes-appareils-card')) {
  customElements.define('mes-appareils-card', MesAppareilsCard);
}

window.customCards = window.customCards || [];

// Une carte « Mes appareils (liste déroulante) » pour les anciennes configs...
window.customCards.push({
  type: 'mes-appareils-card',
  name: 'Mes appareils (liste déroulante)',
  description: 'Choisis l’appareil dans une liste (appliance: …).',
  preview: false,
});

// ...et une carte distincte par appareil, trouvable dans la recherche du sélecteur de cartes
for (const [key, def] of Object.entries(APPLIANCES)) {
  const tag = `mes-appareil-${key}`;
  if (!customElements.get(tag)) {
    customElements.define(
      tag,
      class extends MesAppareilsCard {
        setConfig(config) {
          super.setConfig({ ...config, appliance: key });
        }
        static getStubConfig() {
          return {};
        }
        static getConfigForm() {
          return MesAppareilsCard.buildForm(key);
        }
      }
    );
  }
  window.customCards.push({
    type: tag,
    name: def.label,
    description: `Carte animée : ${def.label.toLowerCase()}`,
    preview: false,
  });
}
