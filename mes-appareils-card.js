/*
 * Mes appareils — carte Lovelace personnalisée, animations SVG
 * Type : custom:mes-appareils-card
 *
 * Pour ajouter un appareil : ajoute une entrée dans APPLIANCES (plus bas)
 * avec son SVG, son CSS d'animation (classe .anim = animée seulement quand
 * l'appareil est en marche) et, si besoin, un hook update().
 */

const ACTIVE_STATES = [
  'on', 'running', 'printing', 'washing', 'drying', 'heating', 'cooling',
  'active', 'in_progress', 'prepare', 'cleaning',
];

/* ------------------------------------------------------------------ */
/*  Définition des appareils                                           */
/* ------------------------------------------------------------------ */
const APPLIANCES = {
  washer: {
    label: 'Lave-linge',
    on: 'En cycle',
    off: 'À l’arrêt',
    threshold: 10, // W
    lcd: (v) => (v.on && v.power !== null ? `${Math.round(v.power)}W` : '--'),
    svg: `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <g class="anim vib">
    <rect class="body" x="14" y="6" width="72" height="88" rx="7"/>
    <rect class="panel" x="14" y="6" width="72" height="18" rx="7"/>
    <rect class="panel" x="14" y="16" width="72" height="8"/>
    <circle class="knob" cx="27" cy="15" r="4.5"/>
    <rect class="screen" x="50" y="10" width="28" height="10" rx="2"/>
    <text class="lcd" x="64" y="17.6" font-size="6.5" data-lcd>--</text>
    <circle class="ring" cx="50" cy="60" r="28"/>
    <circle class="glassbg" cx="50" cy="60" r="23"/>
    <clipPath id="wm-clip"><circle cx="50" cy="60" r="23"/></clipPath>
    <g clip-path="url(#wm-clip)">
      <g class="anim drum">
        <circle cx="40" cy="55" r="7" fill="#ff7b7b"/>
        <circle cx="58" cy="66" r="8" fill="#ffd166"/>
        <circle cx="53" cy="47" r="6" fill="#6ec1ff"/>
        <circle cx="45" cy="70" r="5" fill="#9be36b"/>
      </g>
      <path class="anim wave" d="M-20 70 q5 -5 10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t10 0 V100 H-20 Z"/>
    </g>
    <path class="shine" d="M33 50 A19 19 0 0 1 48 39" />
  </g>
</svg>`,
    css: `
.drum{transform-box:view-box;transform-origin:50px 60px;animation:spin 1.4s linear infinite}
.wave{fill:rgba(70,160,235,.55);animation:wave 1.6s linear infinite}
.vib{animation:vib .14s linear infinite}
.glassbg{fill:#cfe9f8}
.shine{fill:none;stroke:#fff;stroke-width:2.5;stroke-linecap:round;opacity:.7}
.knob{fill:#aab3bf}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes wave{to{transform:translateX(20px)}}
@keyframes vib{
  0%{transform:translate(0,0)}25%{transform:translate(.4px,.3px)}
  50%{transform:translate(0,-.3px)}75%{transform:translate(-.4px,.2px)}
  100%{transform:translate(0,0)}
}`,
  },

  fridge: {
    label: 'Réfrigérateur',
    on: 'Compresseur en marche',
    off: 'Au repos',
    threshold: 20, // W
    lcd: (v) => (v.temp !== null ? `${v.fmt(v.temp)}°` : '--'),
    svg: `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect class="body" x="24" y="5" width="52" height="90" rx="6"/>
  <rect class="inside" x="28" y="9" width="44" height="82" rx="3"/>
  <line class="shelf" x1="28" y1="38" x2="72" y2="38"/>
  <line class="shelf" x1="28" y1="58" x2="72" y2="58"/>
  <line class="shelf" x1="28" y1="76" x2="72" y2="76"/>
  <rect x="34" y="44" width="8" height="14" rx="2" fill="#7fd1ae"/>
  <rect x="46" y="48" width="9" height="10" rx="2" fill="#ffb74d"/>
  <rect x="58" y="62" width="9" height="14" rx="2" fill="#ef7b7b"/>
  <g class="door">
    <rect class="body" x="24" y="5" width="52" height="30" rx="6"/>
    <rect class="body" x="24" y="37" width="52" height="58" rx="6"/>
    <rect class="screen" x="37" y="12" width="26" height="11" rx="2"/>
    <text class="lcd" x="50" y="20.4" font-size="7" data-lcd>--</text>
    <rect class="handle" x="68" y="16" width="2.6" height="12" rx="1.3"/>
    <rect class="handle" x="68" y="44" width="2.6" height="22" rx="1.3"/>
    <g class="flake">
      <path d="M50 62v22M40.5 67.5l19 11M40.5 78.5l19-11"/>
    </g>
  </g>
</svg>`,
    css: `
.inside{fill:#fff4d3}
.shelf{stroke:#d9c98e;stroke-width:1}
.handle{fill:#8a94a3}
.door{transform-box:view-box;transform-origin:24px 50px;transition:transform .45s ease}
.open .door{transform:scaleX(.28) skewY(-6deg)}
.flake{transform-box:view-box;transform-origin:50px 73px;opacity:.25;
  fill:none;stroke:var(--ac-accent);stroke-width:2.4;stroke-linecap:round;
  animation:spin 6s linear infinite;animation-play-state:paused;transition:opacity .4s}
.on .flake{opacity:1;animation-play-state:running}
@keyframes spin{to{transform:rotate(360deg)}}`,
  },

  printer: {
    label: 'Imprimante 3D',
    on: 'Impression en cours',
    off: 'Au repos',
    threshold: 30, // W
    lcd: (v) => (v.prog !== null ? `${Math.round(v.prog)}%` : v.on ? '...' : '--'),
    // Hook appelé à chaque mise à jour : règle la hauteur de la pièce et du portique
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
  <rect class="bed" x="22" y="78" width="56" height="6" rx="1.5"/>
  <rect class="body" x="12" y="84" width="76" height="11" rx="3"/>
  <rect class="screen" x="34" y="86.5" width="32" height="6.5" rx="1.5"/>
  <text class="lcd" x="50" y="91.6" font-size="5" data-lcd>--</text>
</svg>`,
    css: `
svg{--p:.5;--gy:17px}
.frame{fill:#6b7685}
.bed{fill:#3b4350}
.obj{fill:#ff8a3d;transform-box:view-box;transform-origin:50px 78px;
  transform:scaleY(var(--p));transition:transform 1s linear}
.gantry{transform:translateY(var(--gy));transition:transform 1s linear}
.headbody{fill:#e9edf2;stroke:#9aa5b3;stroke-width:1}
.nozzle{fill:#9aa5b3}
.on .nozzle{fill:#ff6b35}
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
.body{fill:#f2f4f7;stroke:#aab3bf;stroke-width:1.2}
.panel{fill:#dde2e9}
.ring{fill:#c9d0da;stroke:#aab3bf;stroke-width:1.2}
.screen{fill:#1b2733}
.lcd{fill:#7fe3ff;font-family:monospace;font-weight:700;text-anchor:middle}
.anim{animation-play-state:paused}
.on .anim{animation-play-state:running}
@media (prefers-reduced-motion:reduce){.anim,.flake{animation:none!important}}
`;

/* ------------------------------------------------------------------ */
/*  La carte                                                           */
/* ------------------------------------------------------------------ */
class MesAppareilsCard extends HTMLElement {
  static getStubConfig() {
    return { appliance: 'washer' };
  }

  static getConfigForm() {
    const labels = {
      appliance: 'Appareil',
      name: 'Nom (facultatif)',
      entity: 'Entité principale (état / prise)',
      power: 'Capteur de puissance (W)',
      energy: 'Capteur d’énergie (kWh)',
      temperature: 'Capteur de température',
      door: 'Capteur de porte (binary_sensor)',
      progress: 'Progression % (imprimante)',
      remaining: 'Temps restant',
      threshold: 'Seuil « en marche » (W)',
    };
    return {
      schema: [
        {
          name: 'appliance',
          required: true,
          selector: {
            select: {
              mode: 'dropdown',
              options: Object.entries(APPLIANCES).map(([value, d]) => ({ value, label: d.label })),
            },
          },
        },
        { name: 'name', selector: { text: {} } },
        { name: 'entity', selector: { entity: {} } },
        { name: 'power', selector: { entity: { domain: 'sensor' } } },
        { name: 'energy', selector: { entity: { domain: 'sensor' } } },
        { name: 'temperature', selector: { entity: { domain: 'sensor' } } },
        { name: 'door', selector: { entity: { domain: 'binary_sensor' } } },
        { name: 'progress', selector: { entity: { domain: 'sensor' } } },
        { name: 'remaining', selector: { entity: { domain: 'sensor' } } },
        { name: 'threshold', selector: { number: { min: 0, max: 5000, mode: 'box' } } },
      ],
      computeLabel: (s) => labels[s.name] || s.name,
    };
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

    root.querySelector('.name').textContent = c.name || def.label;
    root.querySelector('.status').textContent = unavailable
      ? 'Indisponible'
      : open && c.appliance === 'fridge'
        ? 'Porte ouverte'
        : on ? def.on : def.off;

    const ctx = { on, power, temp, prog, fmt: this._fmt.bind(this) };
    const lcd = root.querySelector('[data-lcd]');
    if (lcd) lcd.textContent = def.lcd(ctx);
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
    if (prog !== null) chips.push(`${this._fmt(prog)} %`);
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
window.customCards.push({
  type: 'mes-appareils-card',
  name: 'Mes appareils',
  description: 'Carte animée pour lave-linge, frigo, imprimante 3D…',
  preview: false,
});
