/**
 * createCubeCard(profile, selector)
 *
 * @param {object} profile
 *   @param {string}   profile.name        - Full name
 *   @param {string}   profile.role        - Job title / role
 *   @param {string}   profile.imageUrl    - URL to portrait image (fills portrait area, cover-fit)
 *   @param {string}   profile.bio         - Biography text
 *   @param {Array}    profile.stats       - [{val, label}, ...] up to 4 items
 *   @param {string}   [profile.accent]    - Hex accent color         (default '#c9a84c')
 *   @param {string}   [profile.bg]        - Hex back-face bg color   (default '#1a1612')
 *   @param {number}   [profile.width]     - Card width  in px        (default 220)
 *   @param {number}   [profile.height]    - Card height in px        (default 280)
 *
 * @param {string} selector - CSS selector for the mount element
 */
function createCubeCard(profile, selector) {

  // ── Defaults ─────────────────────────────────────────────
  const cfg = Object.assign({
    accent: '#c9a84c',
    bg:     '#1a1612',
    width:  220,
    height: 280,
  }, profile);

  const CARD_W = cfg.width;
  const CARD_H = cfg.height;

  // ── Mount element ─────────────────────────────────────────
  const wrap = document.querySelector(selector);
  if (!wrap) { console.error(`createCubeCard: selector "${selector}" not found`); return; }
  wrap.style.cssText += `position:relative;width:${CARD_W}px;height:${CARD_H}px;cursor:pointer;display:inline-block;`;

  // ── Renderer ──────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(CARD_W, CARD_H);
  renderer.shadowMap.enabled = true;
  renderer.domElement.style.display = 'block';
  wrap.appendChild(renderer.domElement);

  // ── Scene & camera ────────────────────────────────────────
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, CARD_W / CARD_H, 0.1, 100);
  camera.position.set(0, 0.3, 9);
  camera.lookAt(0, 0, 0);

  // ── Lighting ──────────────────────────────────────────────
  scene.add(new THREE.AmbientLight(0xfff5e0, 0.4));
  const keyLight = new THREE.DirectionalLight(0xfff0d0, 1.5);
  keyLight.position.set(3, 5, 6);
  keyLight.castShadow = true;
  scene.add(keyLight);
  const accentLight = new THREE.PointLight(new THREE.Color(cfg.accent), 0, 12);
  accentLight.position.set(-2, 2, 4);
  scene.add(accentLight);
  const rimLight = new THREE.DirectionalLight(0x3a2a1a, 0.4);
  rimLight.position.set(-3, -2, -4);
  scene.add(rimLight);

  // ── Texture helpers ───────────────────────────────────────
  const MAX_ANISO = renderer.capabilities.getMaxAnisotropy();

  function canvasTexture(canvas) {
    const t = new THREE.CanvasTexture(canvas);
    t.anisotropy = MAX_ANISO;
    return t;
  }

  function makeTexture(drawFn, tw, th) {
    const c = document.createElement('canvas');
    c.width = tw; c.height = th;
    drawFn(c.getContext('2d'), tw, th);
    return canvasTexture(c);
  }

  function grain(ctx, W, H, alpha, light) {
    for (let i = 0; i < 8000; i++) {
      ctx.fillStyle = light
        ? `rgba(0,0,0,${Math.random() * alpha})`
        : `rgba(255,255,255,${Math.random() * alpha})`;
      ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
    }
  }

  // ── Side texture ──────────────────────────────────────────
  function makeSideTexture() {
    return makeTexture((ctx, W, H) => {
      ctx.fillStyle = cfg.bg;
      ctx.fillRect(0, 0, W, H);
      grain(ctx, W, H, 0.05, false);
      ctx.strokeStyle = cfg.accent;
      ctx.globalAlpha = 0.18;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(W/2, 16); ctx.lineTo(W/2, H-16); ctx.stroke();
      ctx.globalAlpha = 1;
    }, 128, 640);
  }

  // ── Top texture ───────────────────────────────────────────
  function makeTopTexture() {
    return makeTexture((ctx, W, H) => {
      ctx.fillStyle = '#1a1612';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = cfg.accent;
      ctx.globalAlpha = 0.1;
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 32) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
      for (let y = 0; y < H; y += 32) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
      ctx.globalAlpha = 1;
    }, 512, 512);
  }

  // ── Front face draw (called with/without image) ───────────
  const TEX_W = 512, TEX_H = 640;

  function drawFront(ctx, TW, TH, img) {
    ctx.clearRect(0, 0, TW, TH);

    // Base
    ctx.fillStyle = '#f5f0e8';
    ctx.fillRect(0, 0, TW, TH);
    grain(ctx, TW, TH, 0.022, true);

    // Portrait area — top 65%
    const portraitH = TH * 0.65;

    if (img) {
      // Cover-fit the image into the portrait rect
      const iW = img.naturalWidth  || img.width  || TW;
      const iH = img.naturalHeight || img.height || portraitH;
      const scale = Math.max(TW / iW, portraitH / iH);
      const dW = iW * scale, dH = iH * scale;
      const dx = (TW - dW) / 2, dy = (portraitH - dH) / 2;
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, TW, portraitH); ctx.clip();
      ctx.drawImage(img, dx, dy, dW, dH);
      ctx.restore();
    } else {
      // Fallback warm gradient
      const grad = ctx.createLinearGradient(0, 0, 0, portraitH);
      grad.addColorStop(0, '#e8e0d2');
      grad.addColorStop(1, '#d5c9b5');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, TW, portraitH);
    }

    // Gold rule
    ctx.strokeStyle = cfg.accent;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(28, TH * 0.66); ctx.lineTo(TW - 28, TH * 0.66); ctx.stroke();

    // Dark nameplate
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, TH * 0.67, TW, TH * 0.33);

    // Name
    ctx.fillStyle    = '#000';
    ctx.font         = `800 ${TW * 0.1}px Georgia, serif`;
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(cfg.name, 24, TH * 0.695);

    // Role
    ctx.fillStyle   = cfg.accent;
    ctx.globalAlpha = 0.75;
    ctx.font        = `600 ${TW * 0.044}px 'Courier New', monospace`;
    ctx.fillText(cfg.role.toUpperCase(), 24, TH * 0.795);
    ctx.globalAlpha = 1;

    // Outer border
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 12;
    ctx.strokeRect(1.5, 1.5, TW - 3, TH - 3);
  }

  // ── Back texture ──────────────────────────────────────────
  function makeBackTexture() {
    return makeTexture((ctx, TW, TH) => {
      ctx.fillStyle = cfg.bg;
      ctx.fillRect(0, 0, TW, TH);
      grain(ctx, TW, TH, 0.016, false);

      // Decorative circle
      ctx.beginPath();
      ctx.arc(TW + 30, -30, 200, 0, Math.PI * 2);
      ctx.strokeStyle = cfg.accent;
      ctx.globalAlpha = 0.06;
      ctx.lineWidth = 36;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Header label
      ctx.font         = `${TW * 0.042}px 'Courier New', monospace`;
      ctx.fillStyle    = cfg.accent;
      ctx.globalAlpha  = 0.7;
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('— BIOGRAPHY', 32, 36);
      ctx.globalAlpha  = 1;

      // Name
      ctx.font      = `italic 300 ${TW * 0.115}px Georgia, serif`;
      ctx.fillStyle = '#f5f0e8';
      const parts   = cfg.name.split(' ');
      ctx.fillText(parts[0], 32, 80);
      ctx.fillText(parts.slice(1).join(' '), 32, 80 + TW * 0.12);

      // Rule
      ctx.strokeStyle = cfg.accent;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(32, 220); ctx.lineTo(80, 220); ctx.stroke();

      // Bio — word wrap
      ctx.font        = `300 ${TW * 0.054}px Georgia, serif`;
      ctx.fillStyle   = '#f5f0e8';
      ctx.globalAlpha = 0.82;
      const words = cfg.bio.split(' ');
      let line = '', y = 255, lineH = TW * 0.062;
      for (const w of words) {
        const test = line + w + ' ';
        if (ctx.measureText(test).width > TW - 64 && line) {
          ctx.fillText(line.trim(), 32, y);
          line = w + ' '; y += lineH;
        } else { line = test; }
      }
      ctx.fillText(line.trim(), 32, y);
      ctx.globalAlpha = 1;

      // Stats grid
      const statY = TH - 175;
      ctx.strokeStyle = 'rgba(245,240,232,0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(32, statY - 14); ctx.lineTo(TW - 32, statY - 14); ctx.stroke();

      (cfg.stats || []).slice(0, 4).forEach((s, i) => {
        const col = i % 2, row = Math.floor(i / 2);
        const sx = 32 + col * (TW / 2 - 8);
        const sy = (statY - 20) + row * 68;
        ctx.font      = `600 ${TW * 0.08}px Georgia, serif`;
        ctx.fillStyle = cfg.accent;
        ctx.textAlign = 'left';
        ctx.fillText(s.val, sx, sy + 40);
        ctx.font        = `${TW * 0.038}px 'Courier New', monospace`;
        ctx.fillStyle   = '#f5f0e8';
        ctx.globalAlpha = 0.38;
        ctx.fillText(s.label.toUpperCase(), sx, sy + 86);
        ctx.globalAlpha = 1;
      });

      // Border
      ctx.strokeStyle = cfg.accent;
      ctx.globalAlpha = 0.18;
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, TW - 2, TH - 2);
      ctx.globalAlpha = 1;
    }, TEX_W, TEX_H);
  }

  // ── Build cube ────────────────────────────────────────────
  const geo = new THREE.BoxGeometry(2.0, 2.55, 2.0);

  // Front canvas — draw placeholder immediately, update when image loads
  const frontCanvas  = document.createElement('canvas');
  frontCanvas.width  = TEX_W;
  frontCanvas.height = TEX_H;
  drawFront(frontCanvas.getContext('2d'), TEX_W, TEX_H, null);
  const frontTex = canvasTexture(frontCanvas);

  const materials = [
    new THREE.MeshStandardMaterial({ map: makeSideTexture(),  roughness: 0.7,  metalness: 0.1  }), // +X right
    new THREE.MeshStandardMaterial({ map: makeSideTexture(),  roughness: 0.7,  metalness: 0.1  }), // -X left
    new THREE.MeshStandardMaterial({ map: makeTopTexture(),   roughness: 0.5,  metalness: 0.15 }), // +Y top
    new THREE.MeshStandardMaterial({ color: 0x100e0c,          roughness: 0.95                 }), // -Y bottom
    new THREE.MeshStandardMaterial({ map: frontTex,            roughness: 0.55, metalness: 0.05 }), // +Z front
    new THREE.MeshStandardMaterial({ map: makeBackTexture(),   roughness: 0.55, metalness: 0.05 }), // -Z back
  ];

  const mesh = new THREE.Mesh(geo, materials);
  mesh.castShadow = true;

  const group = new THREE.Group();
  group.add(mesh);

  const REST_Z   = -1.1;
  const EMERGE_Z =  1.5;
  group.position.z = REST_Z;
  scene.add(group);

  // Load portrait image → redraw front texture
  if (cfg.imageUrl) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      drawFront(frontCanvas.getContext('2d'), TEX_W, TEX_H, img);
      frontTex.needsUpdate = true;
    };
    img.onerror = () => console.warn(`createCubeCard: failed to load image "${cfg.imageUrl}"`);
    img.src = cfg.imageUrl;
  }

  // ── State machine ─────────────────────────────────────────
  let state = 'resting';
  let rotY  = 0;
  let posZ  = REST_Z;
  let posY  = 0;

  const ROT_SPEED         = 0.030;
  const EMERGE_THRESHOLD  = EMERGE_Z - 0.04;
  const RETRACT_THRESHOLD = REST_Z   + 0.05;

  wrap.addEventListener('mouseenter', () => {
    if (state === 'resting' || state === 'retracting') state = 'emerging';
  });
  wrap.addEventListener('mouseleave', () => {
    if (state !== 'resting') state = 'retracting';
  });

  // ── Render loop ───────────────────────────────────────────
  const clock = new THREE.Clock();

  (function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    if (state === 'emerging') {
      posZ += (EMERGE_Z - posZ) * 0.07;
      if (posZ >= EMERGE_THRESHOLD) { posZ = EMERGE_Z; state = 'rotating'; }
    }
    if (state === 'rotating') {
      rotY += ROT_SPEED;
      if (rotY >= Math.PI) { rotY = Math.PI; state = 'showing'; }
    }
    if (state === 'showing') {
      posZ = EMERGE_Z + Math.sin(t * 1.5) * 0.035;
      posY = Math.sin(t * 1.1) * 0.045;
    }
    if (state === 'retracting') {
      if (rotY > 0.015) {
        rotY -= ROT_SPEED * 1.15;
        if (rotY < 0) rotY = 0;
      } else {
        rotY = 0;
        posZ += (REST_Z - posZ) * 0.06;
        posY += (0 - posY) * 0.08;
        if (posZ <= RETRACT_THRESHOLD) { posZ = REST_Z; posY = 0; state = 'resting'; }
      }
    }
    if (state === 'resting') {
      posZ = REST_Z + Math.sin(t * 0.5) * 0.008;
    }

    group.position.z = posZ;
    group.position.y = posY;
    group.rotation.y = rotY;

    accentLight.intensity += ((state === 'resting' ? 0 : 0.65) - accentLight.intensity) * 0.05;

    renderer.render(scene, camera);
  })();

  // ── Respond to container resize ───────────────────────────
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      const nW = wrap.clientWidth, nH = wrap.clientHeight;
      camera.aspect = nW / nH;
      camera.updateProjectionMatrix();
      renderer.setSize(nW, nH);
    }).observe(wrap);
  }
}

// ─────────────────────────────────────────────────────────────
// Example calls
// ─────────────────────────────────────────────────────────────


// createCubeCard({
//   name:     'John Mackey',
//   role:     'Full Stack Developer',
//   imageUrl: 'http://localhost:10008/wp-content/uploads/2026/04/Group-1009.webp',
//   bio:      'Infrastructure engineer turned systems thinker. Builds distributed systems that scale to millions. Previously led platform at Stripe. Writes about resilience patterns.',
//   stats:    [
//     { val: '5 Years',   label: 'PHP'   },
//     { val: '4 Years', label: 'MySQL' },
//     { val: '2 Years',   label: 'WordPress' },
//     { val: '5 Years', label: 'JavaScript'   },
//   ],
//   accent: '#FF00DD',
//   bg:     '#000',
//   width:  600,
//   height: 680,
// }, '#card-b');