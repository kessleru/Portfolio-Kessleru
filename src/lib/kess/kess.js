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
 *              bravo | sono | apaixonado | concentrado | inspiracao   (padrão: normal)
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
 *
 * JavaScript:
 *   const k = document.querySelector('kess-mascot');
 *   k.mood = 'animado';          // troca a expressão (com animação)
 *   k.size = 'lg';               // muda o tamanho
 *   k.hop();                     // faz o Kess pular
 *   k.gaze = { x: 1, y: 0 };     // olha para uma direção (-1..1); null volta a seguir o cursor
 *   k.crouch = -.2;              // postura: negativo agacha, positivo estica (-.3..3)
 *   k.squash(-4);                // impulso na mola do corpo (ex.: impacto ao pousar)
 *   KessMascot.MOODS             // lista de emoções e cores
 *   k.addEventListener('kess-poke', () => { ... })   // disparado quando clicam no Kess
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

  /* ---------- emoções: cor da bolinha/borda, olhos (em unidades de desenho), acessório e comportamento ---------- */
  // E = olho oval cheio · L = traço (sorriso/fechado) · C = recorte de pálpebra · S = brilho no olho
  function E(x, y, rx, ry, r) { return { t: 'e', x: x, y: y, rx: rx, ry: ry, r: r || 0 }; }
  function L(d, w) { return { t: 'l', d: d, w: w || 8 }; }
  function C(pts) { return { t: 'c', pts: pts }; }
  function S(x, y, r) { return { t: 's', x: x, y: y, r: r }; }
  var OPEN = [E(52, 50, 6.8, 8.8), E(74, 50, 6.8, 8.8)];
  var HAPPY = [L('M46.5 53 Q52 45 57.5 53', 7), L('M68.5 53 Q74 45 79.5 53', 7)];
  var MOODS = {
    normal:      { color: '#b4befe', eyes: OPEN },
    feliz:       { color: '#f5c2e7', eyes: HAPPY, blush: 1 },
    animado:     { color: '#f9e2af', eyes: [E(52, 49, 7.6, 10), E(74, 49, 7.6, 10), S(55, 44.6, 1.7), S(77, 44.6, 1.7)], blush: 1, hops: 1 },
    curioso:     { color: '#a6e3a1', eyes: [E(52, 52, 5.6, 7), E(74, 49, 7.6, 10)], tilt: .14 },
    pensativo:   { color: '#cba6f7', eyes: [E(56, 46, 6.2, 8.2, -.15), E(78, 46, 6.2, 8.2, -.15)], tilt: -.08, lookUp: 1 },
    surpreso:    { color: '#f9e2af', eyes: [E(52, 50, 8.2, 8.2), E(74, 50, 8.2, 8.2)] },
    triste:      { color: '#89b4fa', eyes: [E(52, 52, 7, 8), E(74, 52, 7, 8), C([[41, 36], [63, 36], [63, 45], [41, 51]]), C([[63, 36], [85, 36], [85, 51], [63, 45]])], droop: 1 },
    confuso:     { color: '#f5c2e7', eyes: [E(53, 52, 4.8, 4.8), E(74, 49, 7, 9.5)], tilt: -.12 },
    bravo:       { color: '#f38ba8', eyes: [E(52, 52, 7, 8), E(74, 52, 7, 8), C([[41, 36], [63, 36], [63, 51], [41, 45]]), C([[63, 36], [85, 36], [85, 45], [63, 51]])], shake: 1 },
    sono:        { color: '#94e2d5', eyes: [L('M46.5 51 Q52 56 57.5 51', 6.5), L('M68.5 51 Q74 56 79.5 51', 6.5)], sleepy: 1 },
    apaixonado:  { color: '#f5c2e7', eyes: HAPPY, blush: 1 },
    concentrado: { color: '#cba6f7', eyes: [E(52, 51, 6.8, 8.4), E(74, 51, 6.8, 8.4), C([[41, 36], [85, 36], [85, 48], [41, 48]])] },
    inspiracao:  { color: '#94e2d5', eyes: [E(52, 49, 7.4, 9.6), E(74, 49, 7.4, 9.6), S(54.8, 44.6, 1.7), S(76.8, 44.6, 1.7)], blush: 1 }
  };
  function moodKey(m) {
    m = String(m || 'normal').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return MOODS[m] ? m : 'normal';
  }
  function pathOf(e) { return e.p || (e.p = new Path2D(e.d)); }

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
            '<rect x="11" y="15" width="98" height="81" rx="40" fill="#0c0c14"/>' +
      '<ellipse cx="0" cy="0" rx="10.6" ry="5.2" fill="' + color + '" transform="translate(88.4 22.4) rotate(27)"/>' +
      '<path d="M49 56 V71 M71 56 V71" stroke="#fff" stroke-width="9.5" stroke-linecap="round"/></svg>';
  }

  var REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  class KessMascot extends HTMLElement {
    static get observedAttributes() { return ['mood', 'size', 'color', 'grounded', 'pixels']; }

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
      var camera = new T.PerspectiveCamera(28, 1, .1, 50);
      camera.position.set(0, .5, 6.2); camera.lookAt(0, .06, 0);

      var mood = new T.Color(this._colorOf(this._mood)), moodTarget = mood.clone();


      // forma: superelipsoide 1,2 × 1, topo cheio e base achatada
      function sgn(v, p) { return Math.sign(v) * Math.pow(Math.abs(v), p); }
      function shape(v) {
        var top = v.y >= 0;
        return v.set(1.2 * sgn(v.x, .8), (top ? 1 : .92) * sgn(v.y, 2 / (top ? 2.4 : 3.4)), 1.02 * sgn(v.z, .8));
      }
      function deform(geo, k) {
        var p = geo.attributes.position, v = new T.Vector3();
        for (var i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).normalize(); shape(v).multiplyScalar(k || 1); p.setXYZ(i, v.x, v.y, v.z); }
        geo.computeVertexNormals(); return geo;
      }

      // corpo em cor chapada (sem luz, sem brilho)
      var mat = new T.MeshBasicMaterial({ color: 0x0c0c14, toneMapped: false });

      var kess = new T.Group(); scene.add(kess);           // altura (pulo)
      var squash = new T.Group(); kess.add(squash);        // amassa e estica, pivô na base
      var tiltG = new T.Group(); squash.add(tiltG);        // olhar e inclinação
      squash.position.y = -.78; tiltG.position.y = .78;
      var bodyG = new T.Group(); bodyG.scale.setScalar(.84); tiltG.add(bodyG);

      bodyG.add(new T.Mesh(deform(new T.SphereGeometry(1, 96, 72)), mat));

      // rosto: casca frontal do corpo com projeção plana (o desenho dos olhos não deforma na curva)
      var FW = 512, FK = FW / 1024, FR = 1.25, faceCv = document.createElement('canvas'); faceCv.width = faceCv.height = FW;
      var fctx = faceCv.getContext('2d');
      var faceTex = new T.CanvasTexture(faceCv); faceTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      var faceGeo = deform(new T.SphereGeometry(1, 80, 60, Math.PI / 2 - 1.15, 2.3, .4, 2.3), 1.006);
      var fp = faceGeo.attributes.position, fuv = faceGeo.attributes.uv;
      for (var i = 0; i < fp.count; i++) fuv.setXY(i, .5 + fp.getX(i) / (2 * FR), .5 + fp.getY(i) / (2 * FR));
      fuv.needsUpdate = true;
      var face = new T.Mesh(faceGeo, new T.MeshBasicMaterial({ map: faceTex, transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
      face.renderOrder = 1;
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

      // sombra no chão e brilho atrás
      function radialTex(inner, outer) {
        var c = document.createElement('canvas'); c.width = c.height = 128; var x = c.getContext('2d');
        var g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, inner); g.addColorStop(1, outer);
        x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new T.CanvasTexture(c);
      }
      var shadow = new T.Mesh(new T.PlaneGeometry(2.4, .66), new T.MeshBasicMaterial({ map: radialTex('rgba(0,0,0,.35)', 'rgba(0,0,0,0)'), transparent: true, depthWrite: false }));
      shadow.rotation.x = -Math.PI / 2; shadow.position.y = -.8; scene.add(shadow);

      // olhos grandes, baixos e próximos (proporção "bebê")
      var eyeOpen = 1, look = { x: 0, y: 0 }, lastFace = '', frameNo = 0;
      function drawFace(d, colCss) {
        fctx.clearRect(0, 0, FW, FW);
        fctx.save();
        fctx.translate(FW / 2 + look.x * 16 * FK, (560 + look.y * 12) * FK);   // centro dos olhos, um pouco abaixo do meio do corpo
        fctx.scale(14 * FK, 14 * FK);
        fctx.translate(-63, -50);
        if (d.blush) {
          fctx.save(); fctx.globalAlpha = .85; fctx.fillStyle = colCss;
          [[40, 60], [86, 60]].forEach(function (c) { fctx.beginPath(); fctx.ellipse(c[0], c[1], 4.6, 2.6, 0, 0, Math.PI * 2); fctx.fill(); });
          fctx.restore();
        }
        fctx.translate(63, 50); fctx.scale(1, Math.max(.08, eyeOpen)); fctx.translate(-63, -50);   // piscar
        fctx.fillStyle = fctx.strokeStyle = '#ffffff'; fctx.lineCap = 'round'; fctx.lineJoin = 'round';
        d.eyes.forEach(function (e) {
          if (e.t === 'e') { fctx.beginPath(); fctx.ellipse(e.x, e.y, e.rx, e.ry, e.r, 0, Math.PI * 2); fctx.fill(); }
          else if (e.t === 'l') { fctx.lineWidth = e.w; fctx.stroke(pathOf(e)); }
        });
        fctx.globalCompositeOperation = 'destination-out';            // pálpebras e brilho recortam o olho
        d.eyes.forEach(function (e) {
          if (e.t === 'c') { fctx.beginPath(); e.pts.forEach(function (q, j) { j ? fctx.lineTo(q[0], q[1]) : fctx.moveTo(q[0], q[1]); }); fctx.closePath(); fctx.fill(); }
          else if (e.t === 's') { fctx.beginPath(); fctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); fctx.fill(); }
        });
        fctx.restore();
        faceTex.needsUpdate = true;
      }

      /* ---------- animação ---------- */
      var y = 0, vy = 0, sq = 0, sqV = 0, wob = 0, wobV = 0, pending = 0, nextBlink = 2, blinkT = -1;
      var rotY = 0, rotX = 0, rotZ = 0, ptr = { x: 0, y: 0, has: false }, hopTimer = 0, shakeT = 0, tm = 0;
      this._hop = function (power) {
        if (REDUCE || y > .01 || pending) return;
        sqV -= 3.2; pending = power;                     // antecipação: amassa antes de pular
      };
      this._recolor = function () { moodTarget.set(self._colorOf(self._mood)); };
      this._kick = function (v) { if (REDUCE) return; sqV += v; wobV += Math.abs(v) * 2.5; };
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
          if (pending && sq < -.06) { vy = pending; pending = 0; sqV += 4; }
          if (y > 0 || vy > 0) { vy -= 13 * dt; y += vy * dt; if (y <= 0) { y = 0; sqV -= Math.min(5, Math.abs(vy) * 1.2); vy = 0; wobV += 6; } }
          if (d.hops) { hopTimer -= dt; if (hopTimer <= 0 && y === 0) { self._hop(2.1); hopTimer = .75; } }
          sqV += (-120 * (sq - self._crouch) - 9 * sqV) * dt; sq += sqV * dt;
          wobV += (-160 * wob - 7 * wobV) * dt; wob += wobV * dt;
        }

        var breath = REDUCE ? 0 : Math.sin(tm * (d.sleepy ? 1.4 : 2.4)) * (d.sleepy ? .035 : .022);
        var air = y > 0 ? Math.min(.12, vy * .03) : 0;
        var s = Math.max(-.3, Math.min(.3, sq + breath - air));
        squash.scale.set(1 - s * .9, 1 + s, 1 - s * .9);
        var grounded = self.hasAttribute('grounded');
        kess.position.y = y + (REDUCE || grounded ? 0 : Math.sin(tm * 2.4 + 1) * .03);

        var gz = self._gaze;
        var tx = gz ? gz.x : ptr.has ? ptr.x : (REDUCE ? 0 : Math.sin(tm * .5) * .25), ty = gz ? gz.y : ptr.has ? ptr.y : 0;
        if (d.sleepy) { tx *= .2; ty = .35; }
        if (d.lookUp) { tx = .55; ty = -.6; }
        var k = 1 - Math.pow(.004, dt);
        rotY += (tx * .42 - rotY) * k; rotX += (ty * .22 - rotX) * k;
        var tz = (d.tilt || 0) + (d.sleepy ? .1 : 0) + (d.droop ? .05 : 0);
        if (shakeT > 0) { shakeT -= dt; tz += Math.sin(tm * 60) * .05 * (shakeT / .5); }
        rotZ += (tz - rotZ) * k;
        tiltG.rotation.set(rotX, rotY, -rotZ - wob * .015);
        look.x += (tx - look.x) * k; look.y += (ty - look.y) * k;
        ballSpin.rotation.set(wob * .06, 0, wob * .09);

        if (!d.sleepy && !REDUCE) {
          nextBlink -= dt;
          if (nextBlink <= 0 && blinkT < 0) blinkT = 0;
          if (blinkT >= 0) { blinkT += dt; eyeOpen = Math.abs(1 - blinkT / .07); if (blinkT > .14) { blinkT = -1; eyeOpen = 1; nextBlink = 2.5 + Math.random() * 3; } }
        } else eyeOpen = 1;


        var sh = Math.max(.45, 1 - y * .5);
        shadow.visible = !grounded;
        shadow.scale.set(sh * (1 - s * .6), sh, 1); shadow.material.opacity = sh;

        // o rosto só é redesenhado (e reenviado para a GPU) quando muda de verdade
        var faceKey = self._mood + '|' + mood.getHexString() + '|' + Math.round(look.x * 200) + '|' + Math.round(look.y * 200) + '|' + Math.round(eyeOpen * 40);
        // parado (só respirando e piscando), 30 quadros por segundo bastam
        var calm = !pending && y === 0 && Math.abs(sqV) < .2 && Math.abs(wobV) < .2 && faceKey === lastFace;
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
