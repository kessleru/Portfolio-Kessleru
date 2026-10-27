/*!
 * Kess — mascote 3D do KesslerU (cor chapada, sem pernas)
 * Web Component sem dependências de build. Carrega o Three.js sozinho (CDN) se ele ainda não estiver na página.
 *
 * Uso:
 *   <script src="kess.min.js" defer></script>
 *   <kess-mascot mood="feliz" size="96"></kess-mascot>
 *
 * Atributos:
 *   mood       normal | feliz | animado | curioso | pensativo | surpreso | triste | confuso |
 *              bravo | sono | apaixonado | concentrado | inspiracao | tonto | timido | bocejo
 *              (padrão: normal)
 *   size       tamanho: número em px (120), qualquer medida CSS (5rem, 20vw, clamp(...))
 *              ou atalho: xs (48) | sm (64) | md (96, padrão) | lg (140) | xl (200)
 *
 * CSS:
 *   kess-mascot { --kess-size: 120px; }   // muda todos de uma vez (aceita media queries)
 *   color      cor da bolinha (qualquer cor CSS ou var(--minha-cor)); sem ele, usa a cor da emoção
 *   no-hop     desliga o pulinho ao clicar
 *   no-follow  desliga o olhar seguindo o cursor
 *   grounded   o Kess está apoiado em algo da página: sem sombra própria e sem flutuar
 *   pixels     limite de pixels do canvas (ex.: quando ele aparece reduzido por CSS)
 *   outline    cor do contorno fino (qualquer cor CSS ou var(--x)); sem ele, sem contorno
 *
 * JavaScript:
 *   const k = document.querySelector('kess-mascot');
 *   k.mood = 'animado';          // troca a expressão (com animação)
 *   k.size = 'lg';               // muda o tamanho
 *   k.hop();                     // faz o Kess pular
 *   k.gaze = { x: 1, y: 0 };     // olha para uma direção (-1..1); null volta a seguir o cursor
 *   k.crouch = -.2;              // postura: negativo agacha, positivo estica (-.3..3)
 *   k.squash(-4);                // impulso na mola do corpo (ex.: impacto ao pousar)
 *   k.wave();                    // balança o corpo, como um aceno
 *   k.walking = true;            // o corpo ginga e quica a cada passo (quem move o Kess é quem chama)
 *   KessMascot.MOODS             // lista de emoções e cores
 *   k.addEventListener('kess-poke', () => { ... })   // disparado quando clicam no Kess
 *   k.addEventListener('kess-lift', (e) => e.detail)  // altura do pulo dentro do canvas (0 no chão, 1 no alto)
 */
(function () {
  'use strict';
  if (typeof window === 'undefined' || !window.customElements) return;   // SSR (Next, Astro…) ou navegador sem Web Components
  if (customElements.get('kess-mascot')) return;

  var THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js';
  var threeP = null;
  function loadThree() {
    if (window.THREE) return Promise.resolve(window.THREE);
    if (!threeP) {
      threeP = new Promise(function (res, rej) {
        var s = document.createElement('script');
        s.src = THREE_URL; s.async = true;
        s.onload = function () { window.THREE ? res(window.THREE) : rej(new Error('three')); };
        s.onerror = rej;
        document.head.appendChild(s);
      });
    }
    return threeP;
  }

  /* ---------- emoções: cor da bolinha, olhos, boca e bochechas (em unidades de desenho) e comportamento ---------- */
  // E = olho oval cheio · L = traço (sorriso/fechado) · C = recorte de pálpebra · S = brilho no olho
  // H = olho de coração · K = olho de estrela · SP = olho de espiral (tonto) · F = forma cheia (boca aberta, língua)
  function E(x, y, rx, ry, r) { return { t: 'e', x: x, y: y, rx: rx, ry: ry, r: r || 0 }; }
  function L(d, w) { return { t: 'l', d: d, w: w || 8 }; }
  function C(pts) { return { t: 'c', pts: pts }; }
  function S(x, y, r) { return { t: 's', x: x, y: y, r: r }; }
  function H(x, y, r) { return { t: 'h', x: x, y: y, r: r }; }
  function K(x, y, r) { return { t: 'k', x: x, y: y, r: r }; }
  function SP(x, y, r) { return { t: 'sp', x: x, y: y, r: r }; }
  function F(d, c) { return { t: 'f', d: d, c: c }; }
  var PINK = '#f5c2e7', MOUTH = '#f38ba8';
  var OPEN = [E(52, 50, 6.8, 8.8), E(74, 50, 6.8, 8.8), S(54.6, 46, 1.9), S(76.6, 46, 1.9)];
  var HAPPY = [L('M46.5 53 Q52 45 57.5 53', 7), L('M68.5 53 Q74 45 79.5 53', 7)];
  // bocas: pequenas, entre os olhos e um pouco abaixo
  var M = {
    smile: [L('M60.4 60.6 Q63 63.2 65.6 60.6', 2.6)],
    cat:   [L('M58.6 60.4 Q60.8 63.6 63 60.8 Q65.2 63.6 67.4 60.4', 2.5)],
    open:  [F('M58.4 59.6 L67.6 59.6 Q67.4 66.6 63 66.6 Q58.6 66.6 58.4 59.6 Z', MOUTH)],
    o:     [F('M63 59.6 a2.3 2.7 0 1 0 0.01 0 Z', MOUTH)],
    big:   [F('M63 58.6 a3.4 4.2 0 1 0 0.01 0 Z', MOUTH)],
    yawn:  [F('M63 57.8 a4.6 5.8 0 1 0 0.01 0 Z', MOUTH)],
    frown: [L('M60 62.8 Q63 59.8 66 62.8', 2.6)],
    flat:  [L('M60.2 61.4 L65.8 61.4', 2.6)],
    blep:  [F('M63.4 61 Q63.6 65.2 65.6 65.2 Q67.6 65.2 67.4 61 Z', MOUTH), L('M59.4 61 L67.6 61', 2.6)],
    wavy:  [L('M58.6 61.6 Q60.8 59.6 63 61.6 Q65.2 63.6 67.4 61.6', 2.4)],
    side:  [L('M63.6 61.6 Q66 61.4 68.2 60', 2.4)]
  };
  var MOODS = {
    normal:      { color: '#b4befe', eyes: OPEN, mouth: M.smile },
    feliz:       { color: '#f5c2e7', eyes: HAPPY, mouth: M.cat, blush: .8 },
    animado:     { color: '#f9e2af', eyes: [E(52, 49, 7.6, 10), E(74, 49, 7.6, 10), S(55, 44.6, 1.9), S(77, 44.6, 1.9), S(50.2, 53.4, 1)], mouth: M.open, blush: .7, hops: 1 },
    curioso:     { color: '#a6e3a1', eyes: [E(52, 52, 5.6, 7), E(74, 49, 7.6, 10), S(54, 49, 1.5), S(76.6, 45, 1.9)], mouth: M.o, tilt: .14 },
    pensativo:   { color: '#cba6f7', eyes: [E(56, 46, 6.2, 8.2, -.15), E(78, 46, 6.2, 8.2, -.15)], mouth: M.side, tilt: -.08, lookUp: 1 },
    surpreso:    { color: '#f9e2af', eyes: [E(52, 50, 8.2, 8.2), E(74, 50, 8.2, 8.2), S(54.8, 46.6, 1.9), S(76.8, 46.6, 1.9)], mouth: M.big },
    triste:      { color: '#89b4fa', eyes: [E(52, 52, 7, 8), E(74, 52, 7, 8), C([[41, 36], [63, 36], [63, 45], [41, 51]]), C([[63, 36], [85, 36], [85, 51], [63, 45]]), S(54, 52.6, 1.6), S(76, 52.6, 1.6)], mouth: M.frown, droop: 1 },
    confuso:     { color: '#f5c2e7', eyes: [E(53, 52, 4.8, 4.8), E(74, 49, 7, 9.5), S(76.4, 45.6, 1.8)], mouth: M.wavy, tilt: -.12 },
    bravo:       { color: '#f38ba8', eyes: [E(52, 52, 7, 8), E(74, 52, 7, 8), C([[41, 36], [63, 36], [63, 51], [41, 45]]), C([[63, 36], [85, 36], [85, 45], [63, 51]])], mouth: M.frown, shake: 1 },
    sono:        { color: '#94e2d5', eyes: [L('M46.5 51 Q52 56 57.5 51', 6.5), L('M68.5 51 Q74 56 79.5 51', 6.5)], mouth: M.o, sleepy: 1 },
    apaixonado:  { color: '#f5c2e7', eyes: [H(52, 50, 9), H(74, 50, 9)], mouth: M.cat, blush: 1 },
    concentrado: { color: '#cba6f7', eyes: [E(52, 51, 6.8, 8.4), E(74, 51, 6.8, 8.4), C([[41, 36], [85, 36], [85, 48], [41, 48]])], mouth: M.blep },
    inspiracao:  { color: '#94e2d5', eyes: [K(52, 49, 10), K(74, 49, 10)], mouth: M.open, blush: .6 },
    tonto:       { color: '#fab387', eyes: [SP(52, 50, 8), SP(74, 50, 8)], mouth: M.wavy, wobble: 1 },
    timido:      { color: '#f5c2e7', eyes: [L('M47 54 Q52 48.5 57 54', 6), L('M69 54 Q74 48.5 79 54', 6)], mouth: M.smile, blush: 1.25, shy: 1 },
    bocejo:      { color: '#94e2d5', eyes: [L('M46.5 50 Q52 53 57.5 50', 6), L('M68.5 50 Q74 53 79.5 50', 6)], mouth: M.yawn, sleepy: 1 }
  };
  function moodKey(m) {
    m = String(m || 'normal').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return MOODS[m] ? m : 'normal';
  }
  function pathOf(e) { return e.p || (e.p = new Path2D(e.d)); }
  // coração com a ponta para baixo, centrado em (x, y)
  function heartPath(x, y, r) {
    var p = new Path2D();
    p.moveTo(x, y + r * .9);
    p.bezierCurveTo(x - r * 1.25, y + r * .05, x - r * 1.05, y - r * 1.05, x, y - r * .45);
    p.bezierCurveTo(x + r * 1.05, y - r * 1.05, x + r * 1.25, y + r * .05, x, y + r * .9);
    return p;
  }
  // brilho de 4 pontas (olho de estrela)
  function starPath(x, y, r) {
    var p = new Path2D(), k = r * .26;
    p.moveTo(x, y - r);
    p.quadraticCurveTo(x + k, y - k, x + r * .8, y);
    p.quadraticCurveTo(x + k, y + k, x, y + r);
    p.quadraticCurveTo(x - k, y + k, x - r * .8, y);
    p.quadraticCurveTo(x - k, y - k, x, y - r);
    return p;
  }

  var SIZES = { xs: '48px', sm: '64px', md: '96px', lg: '140px', xl: '200px' };

  var STYLE =
    ':host{display:inline-block;position:relative;width:var(--kess-size,96px);aspect-ratio:1/1;vertical-align:middle;' +
    '-webkit-tap-highlight-color:transparent;user-select:none}' +
    ':host(:not([no-hop])){cursor:pointer}' +
    ':host([hidden]){display:none}' +
    'canvas,svg{position:absolute;inset:0;width:100%;height:100%;display:block}';

  /* desenho 2D simples usado se o navegador não tiver WebGL */
  function fallbackSVG(color) {
    return '<svg viewBox="0 0 120 110" aria-hidden="true">' +
      '<ellipse cx="60" cy="103" rx="34" ry="3.6" fill="#000" opacity=".25"/>' +
      '<rect x="11" y="15" width="98" height="81" rx="40" fill="#3b3d4f"/>' +
      '<ellipse cx="0" cy="0" rx="10.6" ry="5.2" fill="' + color + '" transform="translate(88.4 22.4) rotate(27)"/>' +
      '<path d="M49 56 V71 M71 56 V71" stroke="#fff" stroke-width="9.5" stroke-linecap="round"/></svg>';
  }

  var REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  class KessMascot extends HTMLElement {
    static get observedAttributes() { return ['mood', 'size', 'color', 'grounded', 'pixels', 'outline']; }

    constructor() {
      super();
      this._root = this.attachShadow({ mode: 'open' });
      this._root.innerHTML = '<style>' + STYLE + '</style>';
      this._mood = moodKey(this.getAttribute('mood'));
      this._ready = false;
      this._gaze = null;
      this._crouch = 0;
    }

    get mood() { return this._mood; }
    set mood(v) { this.setAttribute('mood', moodKey(v)); }
    get size() { return this.getAttribute('size'); }
    set size(v) { if (v == null || v === '') this.removeAttribute('size'); else this.setAttribute('size', v); }

    connectedCallback() {
      if (!this.hasAttribute('role')) this.setAttribute('role', 'img');
      if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', 'Kess, mascote do KesslerU');
      if (!this.hasAttribute('no-hop') && !this.hasAttribute('tabindex')) this.tabIndex = 0;
      this._applySize();
      if (this._ready) { this._start(); return; }
      var self = this;
      loadThree().then(function (T) { if (self.isConnected) self._build(T); })
        .catch(function () { self._fallback(); });
    }

    disconnectedCallback() { this._stop(); }

    attributeChangedCallback(name, oldV, newV) {
      if (name === 'size') { this._applySize(); return; }
      if (name === 'grounded') return;
      if (name === 'pixels') { if (this._resize) this._resize(); return; }
      if (name === 'outline') { if (this._recolorOutline) this._recolorOutline(); return; }
      if (name === 'color') { if (this._ready) this._recolor(); else if (this._fb) this._fallback(); return; }
      var m = moodKey(newV);
      if (m === this._mood && this._ready) return;
      this._mood = m;
      if (this._ready) this._onMood(m);
      else if (this._fb) this._fallback();
    }

    hop(power) { if (this._hop) this._hop(power || 3.6); }

    // Controle de fora (ex.: um mascote que anda pela página)
    get gaze() { return this._gaze; }
    set gaze(v) { this._gaze = v && isFinite(v.x) && isFinite(v.y) ? { x: Math.max(-1, Math.min(1, v.x)), y: Math.max(-1, Math.min(1, v.y)) } : null; }
    get crouch() { return this._crouch; }
    set crouch(v) { this._crouch = Math.max(-.3, Math.min(.3, Number(v) || 0)); }
    squash(v) { if (this._kick) this._kick(Number(v) || 0); }
    wave() { if (this._wave) this._wave(); }          // balança o corpo, como um aceno
    get walking() { return !!this._walking; }
    set walking(v) { this._walking = !!v; }            // o corpo ginga e quica a cada passo

    // size="120" | "120px" | "5rem" | "20vw" | "clamp(64px, 10vw, 140px)" | xs | sm | md | lg | xl
    _applySize() {
      var v = this.getAttribute('size');
      if (v == null || !String(v).trim()) { this.style.removeProperty('--kess-size'); return; }
      v = String(v).trim().toLowerCase();
      v = SIZES[v] || (/^\d+(\.\d+)?$/.test(v) ? v + 'px' : v);
      this.style.setProperty('--kess-size', v);
    }

    // cor da bolinha: atributo color (qualquer cor CSS ou var(--x)) ou a cor da emoção
    _colorOf(m) {
      var c = (this.getAttribute('color') || '').trim();
      var v = /^var\(\s*(--[\w-]+)/.exec(c);
      if (v) c = getComputedStyle(this).getPropertyValue(v[1]).trim();
      return c || MOODS[m].color;
    }

    _fallback() {
      this._fb = true;
      var old = this._root.querySelector('svg'); if (old) old.remove();
      this._root.insertAdjacentHTML('beforeend', fallbackSVG(this._colorOf(this._mood)));
    }

    _build(T) {
      var self = this, renderer;
      try { renderer = new T.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { this._fallback(); return; }
            renderer.outputEncoding = T.LinearEncoding;   // cores exatas, sem conversão
            this._root.appendChild(renderer.domElement);
      this._renderer = renderer;

      var scene = new T.Scene();
      // lente mais fechada e de mais longe: pouca perspectiva, cara de ilustração e não de "filme 3D"
      var camera = new T.PerspectiveCamera(16, 1, .1, 50);
      camera.position.set(0, .88, 10.9); camera.lookAt(0, .06, 0);

      var mood = new T.Color(this._colorOf(this._mood)), moodTarget = mood.clone();


      // forma: superelipsoide 1,2 × 1, topo cheio e base achatada; rasa de frente para trás (menos volume)
      function sgn(v, p) { return Math.sign(v) * Math.pow(Math.abs(v), p); }
      function shape(v) {
        var top = v.y >= 0;
        return v.set(1.2 * sgn(v.x, .8), (top ? 1 : .92) * sgn(v.y, 2 / (top ? 2.4 : 3.4)), .74 * sgn(v.z, .8));
      }
      function deform(geo, k) {
        var p = geo.attributes.position, v = new T.Vector3();
        for (var i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).normalize(); shape(v).multiplyScalar(k || 1); p.setXYZ(i, v.x, v.y, v.z); }
        geo.computeVertexNormals(); return geo;
      }

      // corpo em cor sólida (sem luz, sem brilho), cinza-grafite: o volume aparece só no contorno e no movimento
      var mat = new T.MeshBasicMaterial({ color: 0x3b3d4f, toneMapped: false });

      var kess = new T.Group(); scene.add(kess);           // altura (pulo)
      var squash = new T.Group(); kess.add(squash);        // amassa e estica, pivô na base
      var tiltG = new T.Group(); squash.add(tiltG);        // olhar e inclinação
      squash.position.y = -.78; tiltG.position.y = .78;
      var bodyG = new T.Group(); bodyG.scale.setScalar(.84); tiltG.add(bodyG);

      bodyG.add(new T.Mesh(deform(new T.SphereGeometry(1, 96, 72)), mat));

      // rosto: olhos, boca e bochechas em cor sólida, flutuando um pouco à frente do corpo (a casca segue a curva,
      // com projeção plana, então o desenho não deforma). Uma sombra suave no corpo, logo abaixo, mostra o vão.
      var FW = 512, FK = FW / 1024, FR = 1.25, faceCv = document.createElement('canvas'); faceCv.width = faceCv.height = FW;
      var fctx = faceCv.getContext('2d');
      var faceTex = new T.CanvasTexture(faceCv); faceTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      function faceShell(k) {
        var g = deform(new T.SphereGeometry(1, 80, 60, Math.PI / 2 - 1.15, 2.3, .4, 2.3), k);
        var fp = g.attributes.position, fuv = g.attributes.uv;
        for (var i = 0; i < fp.count; i++) fuv.setXY(i, .5 + fp.getX(i) / (2 * FR * k), .5 + fp.getY(i) / (2 * FR * k));
        fuv.needsUpdate = true; return g;
      }
      // sombra do rosto: silhueta do desenho, borrada (reduz e amplia, funciona em qualquer navegador)
      var SW = 128, silCv = document.createElement('canvas'), blurCv = document.createElement('canvas');
      silCv.width = silCv.height = SW; blurCv.width = blurCv.height = 32;
      var sctx = silCv.getContext('2d'), bctx = blurCv.getContext('2d');
      var shadowTex = new T.CanvasTexture(silCv);
      shadowTex.offset.set(-.008, .028);                   // um pouco para baixo e para a direita
      function drawShadow() {
        bctx.clearRect(0, 0, 32, 32); bctx.drawImage(faceCv, 0, 0, 32, 32);
        sctx.globalCompositeOperation = 'copy'; sctx.imageSmoothingQuality = 'high';
        sctx.drawImage(blurCv, 0, 0, SW, SW);
        sctx.globalCompositeOperation = 'source-in'; sctx.fillStyle = '#fff'; sctx.fillRect(0, 0, SW, SW);
        sctx.globalCompositeOperation = 'source-over';
        shadowTex.needsUpdate = true;
      }
      var faceShadow = new T.Mesh(faceShell(1.003), new T.MeshBasicMaterial({ color: 0x0b0b12, alphaMap: shadowTex, transparent: true, opacity: .22, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
      faceShadow.renderOrder = 1; bodyG.add(faceShadow);
      var face = new T.Mesh(faceShell(1.045), new T.MeshBasicMaterial({ map: faceTex, transparent: true, depthWrite: false, toneMapped: false }));
      face.renderOrder = 2;
      bodyG.add(face);

      // bolinha: deitada sobre a curva do topo, rente ao corpo
      var dir = new T.Vector3(.46, .84, .4).normalize();
      function surf(d) { return shape(d.clone().normalize()); }
      var P = surf(dir);
      var t1 = new T.Vector3(0, 0, 1).cross(dir).normalize(), t2 = dir.clone().cross(t1).normalize();
      var N = surf(dir.clone().addScaledVector(t1, .002)).sub(surf(dir.clone().addScaledVector(t1, -.002)))
        .cross(surf(dir.clone().addScaledVector(t2, .002)).sub(surf(dir.clone().addScaledVector(t2, -.002)))).normalize();
      if (N.dot(dir) < 0) N.negate();
      var ballMat = new T.MeshBasicMaterial({ color: mood, toneMapped: false });
      var ballPivot = new T.Group(); ballPivot.position.copy(P).addScaledVector(N, .015);
      ballPivot.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), N);
      var ballSpin = new T.Group(); ballPivot.add(ballSpin);
      var ball = new T.Mesh(new T.SphereGeometry(1, 64, 40), ballMat); ball.scale.set(.38, .1, .22); ball.rotation.y = .5;
      ballSpin.add(ball); bodyG.add(ballPivot);

      // contorno fino (casco invertido): separa o corpo preto de fundos escuros
      var outlineMat = new T.MeshBasicMaterial({ color: 0x313244, side: T.BackSide, toneMapped: false });
      var hull = new T.Mesh(bodyG.children[0].geometry, outlineMat); hull.scale.setScalar(1.045); bodyG.add(hull);
      function outlineColor() {
        var c = (self.getAttribute('outline') || '').trim();
        var v = /^var\(\s*(--[\w-]+)/.exec(c);
        if (v) c = getComputedStyle(self).getPropertyValue(v[1]).trim();
        hull.visible = !!c;
        if (c) outlineMat.color.set(c);
      }
      outlineColor();
      this._recolorOutline = outlineColor;

      // sombra no chão e brilho atrás
      function radialTex(inner, outer) {
        var c = document.createElement('canvas'); c.width = c.height = 128; var x = c.getContext('2d');
        var g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, inner); g.addColorStop(1, outer);
        x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new T.CanvasTexture(c);
      }
      var shadow = new T.Mesh(new T.PlaneGeometry(2.4, .66), new T.MeshBasicMaterial({ map: radialTex('rgba(0,0,0,.35)', 'rgba(0,0,0,0)'), transparent: true, depthWrite: false }));
      shadow.rotation.x = -Math.PI / 2; shadow.position.y = -.8; scene.add(shadow);

      // olhos grandes, baixos e próximos (proporção "bebê")
      var eyeOpen = 1, look = { x: 0, y: 0 }, lastFace = '', frameNo = 0, spin = 0;
      // olhos com vida própria: chegam antes do corpo no alvo e, parados, dão espiadinhas rápidas (sacadas)
      var eye = { x: 0, y: 0 }, dart = { x: 0, y: 0 }, nextDart = 1.2, lastTx = 0;
      function drawFace(d, colCss) {
        fctx.clearRect(0, 0, FW, FW);
        // paralaxe: cada camada do rosto anda um tanto para o lado do olhar (olhos mais, bochechas menos),
        // em vez de o corpo girar muito e o desenho entortar na curva
        function layer(px, py, src) {
          src = src || look;
          fctx.setTransform(1, 0, 0, 1, 0, 0);
          fctx.translate(FW / 2 + src.x * px * FK, (560 + src.y * py) * FK);   // um pouco abaixo do meio do corpo
          fctx.scale(16.5 * FK, 16.5 * FK);                                // olhos, boca e bochechas maiores
          fctx.translate(-63, -50);
        }
        fctx.save();
        layer(12, 8);
        // bochechas sempre rosadas (não na cor da emoção): é o que deixa o rosto fofo
        if (d.blush) {
          fctx.save(); fctx.globalAlpha = .9; fctx.fillStyle = PINK;
          var bw = 3.4 + 1.6 * d.blush, bh = 1.9 + .9 * d.blush;
          [[43.5, 59.5], [82.5, 59.5]].forEach(function (c) { fctx.beginPath(); fctx.ellipse(c[0], c[1], bw, bh, 0, 0, Math.PI * 2); fctx.fill(); });
          fctx.restore();
        }
        // boca (não pisca)
        layer(22, 14);
        fctx.lineCap = 'round'; fctx.lineJoin = 'round';
        (d.mouth || []).forEach(function (e) {
          if (e.t === 'f') { fctx.fillStyle = e.c; fctx.fill(pathOf(e)); }
          else { fctx.strokeStyle = '#ffffff'; fctx.lineWidth = e.w; fctx.stroke(pathOf(e)); }
        });
        layer(34, 22, eye);                                            // os olhos andam sozinhos (olhar + espiadinhas)
        fctx.translate(63, 50); fctx.scale(1, Math.max(.08, eyeOpen)); fctx.translate(-63, -50);   // piscar
        fctx.fillStyle = fctx.strokeStyle = '#ffffff';
        d.eyes.forEach(function (e) {
          if (e.t === 'e') { fctx.beginPath(); fctx.ellipse(e.x, e.y, e.rx, e.ry, e.r, 0, Math.PI * 2); fctx.fill(); }
          else if (e.t === 'l') { fctx.lineWidth = e.w; fctx.stroke(pathOf(e)); }
          else if (e.t === 'h') { fctx.save(); fctx.fillStyle = MOUTH; fctx.fill(e.p || (e.p = heartPath(e.x, e.y, e.r))); fctx.restore(); }
          else if (e.t === 'k') { fctx.fill(e.p || (e.p = starPath(e.x, e.y, e.r))); }
          else if (e.t === 'sp') {
            fctx.save(); fctx.lineWidth = 2.4; fctx.translate(e.x, e.y); fctx.rotate(spin * (e.x < 63 ? 1 : -1));
            fctx.beginPath();
            for (var a = 0; a < Math.PI * 5; a += .2) { var rr = e.r * a / (Math.PI * 5); a ? fctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : fctx.moveTo(0, 0); }
            fctx.stroke(); fctx.restore();
          }
        });
        fctx.globalCompositeOperation = 'destination-out';            // pálpebras e brilho recortam o olho
        d.eyes.forEach(function (e) {
          if (e.t === 'c') { fctx.beginPath(); e.pts.forEach(function (q, j) { j ? fctx.lineTo(q[0], q[1]) : fctx.moveTo(q[0], q[1]); }); fctx.closePath(); fctx.fill(); }
          else if (e.t === 's') { fctx.beginPath(); fctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); fctx.fill(); }
        });
        fctx.restore();
        faceTex.needsUpdate = true;
        drawShadow();
      }

      /* ---------- animação ---------- */
      var y = 0, vy = 0, sq = 0, sqV = 0, wob = 0, wobV = 0, pending = 0, nextBlink = 2, blinkT = -1;
      var rotY = 0, rotX = 0, rotZ = 0, ptr = { x: 0, y: 0, has: false }, hopTimer = 0, shakeT = 0, tm = 0;
      var walkPh = 0, waddle = 0, lastLift = 0, pendingT = 0;
      this._hop = function (power) {
        if (REDUCE || y > .01 || pending) return;
        sqV -= 3.2; pending = power; pendingT = 0;       // antecipação: amassa antes de pular
      };
      this._recolor = function () { moodTarget.set(self._colorOf(self._mood)); };
      this._kick = function (v) { if (REDUCE) return; sqV += v; wobV += Math.abs(v) * 2.5; };
      this._wave = function () { if (!REDUCE) { wobV += 16; sqV += 2; } };
      this._onMood = function (m) {
        var d = MOODS[m];
        moodTarget.set(self._colorOf(m));
        wobV += 9; sqV += 2.5;
        if (d.shake) shakeT = .5;
        if (!d.sleepy && !d.droop) self._hop(2.2);
      };

      this._onClick = function () {
        if (self.hasAttribute('no-hop')) return;
        self._hop(3.8); wobV += 14;
        self.dispatchEvent(new CustomEvent('kess-poke', { bubbles: true, composed: true }));
      };
      this._onKey = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); self._onClick(); } };
      this._onPtr = function (e) {
        if (self.hasAttribute('no-follow')) return;
        var r = self.getBoundingClientRect();
        ptr.x = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / 420));
        ptr.y = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / 320));
        ptr.has = true;
      };

      var clock = new T.Clock();
      this._frame = function () {
        self._raf = requestAnimationFrame(self._frame);
        var dt = Math.min(clock.getDelta(), 1 / 30); tm += dt;
        var d = MOODS[self._mood];

        mood.lerp(moodTarget, 1 - Math.pow(.001, dt));
        ballMat.color.copy(mood);

        if (!REDUCE) {
          // decola no fundo da agachada; se ela não vier (corpo já amassado, quadro perdido), decola logo depois
          if (pending) { pendingT += dt; if (sq < -.06 || pendingT > .25) { vy = pending; pending = 0; sqV += 4; } }
          if (y > 0 || vy > 0) { vy -= 13 * dt; y += vy * dt; if (y <= 0) { y = 0; sqV -= Math.min(5, Math.abs(vy) * 1.2); vy = 0; wobV += 6; } }
          if (d.hops) { hopTimer -= dt; if (hopTimer <= 0 && y === 0) { self._hop(2.1); hopTimer = .75; } }
          sqV += (-120 * (sq - self._crouch) - 9 * sqV) * dt; sq += sqV * dt;
          wobV += (-160 * wob - 7 * wobV) * dt; wob += wobV * dt;
        }

        // andando: o corpo ginga de um lado para o outro e quica a cada passo
        var walking = self._walking && !REDUCE;
        if (walking) walkPh += dt * 11;
        var step = walking ? Math.abs(Math.sin(walkPh)) : 0;

        var breath = REDUCE ? 0 : Math.sin(tm * (d.sleepy ? 1.4 : 2.4)) * (d.sleepy ? .035 : .022);
        var air = y > 0 ? Math.min(.12, vy * .03) : 0;
        var s = Math.max(-.3, Math.min(.3, sq + breath - air + (walking ? .04 - step * .08 : 0)));
        squash.scale.set(1 - s * .9, 1 + s, 1 - s * .9);
        var grounded = self.hasAttribute('grounded');
        kess.position.y = y + step * .07 + (REDUCE || grounded ? 0 : Math.sin(tm * 2.4 + 1) * .03);
        // avisa a altura do pulo (para uma sombra de fora do canvas acompanhar)
        var lift = Math.min(1, y / .5);
        if (Math.abs(lift - lastLift) > .02 || (lift === 0 && lastLift !== 0)) {
          lastLift = lift;
          self.dispatchEvent(new CustomEvent('kess-lift', { detail: lift, bubbles: true }));
        }

        var gz = self._gaze;
        var tx = gz ? gz.x : ptr.has ? ptr.x : (REDUCE ? 0 : Math.sin(tm * .5) * .25), ty = gz ? gz.y : ptr.has ? ptr.y : 0;
        if (d.sleepy) { tx *= .2; ty = .35; }
        if (d.lookUp) { tx = .55; ty = -.6; }
        if (d.shy) { tx *= .4; ty = .55; }                  // tímido olha para baixo
        var k = 1 - Math.pow(.004, dt);
        rotY += (tx * .1 - rotY) * k; rotX += (ty * .05 - rotX) * k;   // o corpo gira pouco; quem olha é o rosto
        var tz = (d.tilt || 0) + (d.sleepy ? .1 : 0) + (d.droop ? .05 : 0);
        if (shakeT > 0) { shakeT -= dt; tz += Math.sin(tm * 60) * .05 * (shakeT / .5); }
        if (d.wobble && !REDUCE) tz += Math.sin(tm * 6) * .1;   // tonto: cambaleia
        rotZ += (tz - rotZ) * k;
        waddle += ((walking ? Math.sin(walkPh) * .07 : 0) - waddle) * Math.min(1, dt * 12);
        tiltG.rotation.set(rotX, rotY, -rotZ - wob * .015 + waddle);
        look.x += (tx - look.x) * k; look.y += (ty - look.y) * k;
        // sacadas: de tempos em tempos os olhos pulam para um ponto perto do alvo e ficam lá (mais longe quando ninguém mexe o mouse)
        if (!REDUCE && !d.sleepy && !d.lookUp) {
          nextDart -= dt;
          if (nextDart <= 0) {
            var amp = gz || ptr.has ? .12 : .32;
            dart.x = (Math.random() * 2 - 1) * amp; dart.y = (Math.random() * 2 - 1) * amp * .5;
            if (Math.random() < .35) dart.x = dart.y = 0;               // às vezes volta para o centro
            nextDart = .6 + Math.random() * 2.4;
          }
        } else dart.x = dart.y = 0;
        // os olhos chegam bem antes do corpo (o olhar lidera); virada grande pede uma piscada
        var ek = 1 - Math.pow(1e-7, dt);
        eye.x += (Math.max(-1.2, Math.min(1.2, tx + dart.x)) - eye.x) * ek;
        eye.y += (Math.max(-1, Math.min(1, ty + dart.y)) - eye.y) * ek;
        if (Math.abs(tx - lastTx) > .7 && blinkT < 0 && !REDUCE) blinkT = 0;
        lastTx = tx;
        ballSpin.rotation.set(wob * .06, 0, wob * .09);   // a bolinha fica sempre rente ao corpo

        if (!d.sleepy && !REDUCE) {
          nextBlink -= dt;
          if (nextBlink <= 0 && blinkT < 0) blinkT = 0;
          if (blinkT >= 0) { blinkT += dt; eyeOpen = Math.abs(1 - blinkT / .07); if (blinkT > .14) { blinkT = -1; eyeOpen = 1; nextBlink = 2.5 + Math.random() * 3; } }
        } else eyeOpen = 1;


        var sh = Math.max(.45, 1 - y * .5);
        shadow.visible = !grounded;
        shadow.scale.set(sh * (1 - s * .6), sh, 1); shadow.material.opacity = sh;

        // o rosto só é redesenhado (e reenviado para a GPU) quando muda de verdade
        if (d.wobble) spin += dt * 7;
        var faceKey = self._mood + '|' + mood.getHexString() + '|' + Math.round(look.x * 200) + '|' + Math.round(look.y * 200) + '|' + Math.round(eye.x * 200) + '|' + Math.round(eye.y * 200) + '|' + Math.round(eyeOpen * 40) + (d.wobble ? '|' + Math.round(spin * 8) : '');
        // parado (só respirando e piscando), 30 quadros por segundo bastam
        var calm = !pending && y === 0 && Math.abs(sqV) < .2 && Math.abs(wobV) < .2 && !walking && faceKey === lastFace;
        frameNo += 1;
        if (calm && frameNo % 2) return;
        if (faceKey !== lastFace) { lastFace = faceKey; drawFace(d, '#' + mood.getHexString()); }
        renderer.render(scene, camera);
      };

      // resolução ajustada ao tamanho: nítido quando pequeno (superamostragem) e leve quando grande
      this._resize = function () {
        var w = self.clientWidth || 96;
        var cap = Number(self.getAttribute('pixels')) || Infinity;
        renderer.setPixelRatio(Math.max(.5, Math.min((window.devicePixelRatio || 1) * 2, 4, 1600 / w, cap / w)));
        renderer.setSize(w, w, false);
      };
      this._ro = window.ResizeObserver ? new ResizeObserver(this._resize) : null;
      this._io = window.IntersectionObserver ? new IntersectionObserver(function (en) {
        self._visible = en[0].isIntersecting; if (self._visible) self._start(); else self._pause();
      }) : null;
      this._ready = true;
      this._start();
    }

    _start() {
      if (!this._ready) return;
      this.addEventListener('click', this._onClick);
      this.addEventListener('keydown', this._onKey);
      window.addEventListener('pointermove', this._onPtr, { passive: true });
      if (this._ro) this._ro.observe(this); else window.addEventListener('resize', this._resize);
      if (this._io && !this._observing) { this._io.observe(this); this._observing = true; }
      this._resize();
      if (!this._raf && this._visible !== false) this._raf = requestAnimationFrame(this._frame);
    }
    _pause() { if (this._raf) { cancelAnimationFrame(this._raf); this._raf = 0; } }
    _stop() {
      this._pause();
      if (!this._ready) return;
      this.removeEventListener('click', this._onClick);
      this.removeEventListener('keydown', this._onKey);
      window.removeEventListener('pointermove', this._onPtr);
      window.removeEventListener('resize', this._resize);
      if (this._ro) this._ro.disconnect();
      if (this._io) { this._io.disconnect(); this._observing = false; }
    }
  }

  KessMascot.MOODS = Object.keys(MOODS).reduce(function (o, k) { o[k] = MOODS[k].color; return o; }, {});
  window.KessMascot = KessMascot;
  customElements.define('kess-mascot', KessMascot);
})();
