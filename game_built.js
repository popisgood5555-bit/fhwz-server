{
'use strict';
// ================= art kit v2: procedural textures + detailed low-poly models =================
const GC = new Map();
function geo(k, f) { let g = GC.get(k); if (!g) { g = f(); GC.set(k, g); } return g; }
const B = (w, h, d) => geo(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d));
const CY = (a, b, h, s = 10) => geo(`c${a},${b},${h},${s}`, () => new THREE.CylinderGeometry(a, b, h, s));
const CO = (r, h, s = 10) => geo(`o${r},${h},${s}`, () => new THREE.ConeGeometry(r, h, s));
const SP = (r, w = 10, h = 8) => geo(`s${r},${w},${h}`, () => new THREE.SphereGeometry(r, w, h));
const HS = (r, w = 10) => geo(`h${r},${w}`, () => new THREE.SphereGeometry(r, w, 6, 0, Math.PI*2, 0, Math.PI/2));
const OC = r => geo(`x${r}`, () => new THREE.OctahedronGeometry(r));
const IC = (r, d = 0) => geo(`i${r},${d}`, () => new THREE.IcosahedronGeometry(r, d));
const DO = (r, d = 0) => geo(`d${r},${d}`, () => new THREE.DodecahedronGeometry(r, d));
const TO = (r, t, arc = Math.PI*2, s = 16) => geo(`t${r},${t},${arc},${s}`, () => new THREE.TorusGeometry(r, t, 6, s, arc));
const PL = (w, h, sw = 1, sh = 1) => geo(`p${w},${h},${sw},${sh}`, () => new THREE.PlaneGeometry(w, h, sw, sh));
const LA = (k, pts, seg = 14) => geo('l' + k, () => new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), seg));
function EX(k, draw, depth, bevel = 0.02) { return geo('e' + k, () => { const s = new THREE.Shape(); draw(s); const g = new THREE.ExtrudeGeometry(s, {depth, bevelEnabled:bevel > 0, bevelThickness:bevel, bevelSize:bevel, bevelSegments:1, steps:1}); g.translate(0, 0, -depth/2); return g; }); }
function SH(k, draw) { return geo('sh' + k, () => { const s = new THREE.Shape(); draw(s); return new THREE.ShapeGeometry(s); }); }
function TU(k, pts, r, seg = 12) { return geo('tu' + k, () => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], p[2]))), seg, r, 6, false)); }

// ---------- procedural textures ----------
const TXC = new Map();
function cvTex(key, w, h, draw, rep) {
  if (TXC.has(key)) return TXC.get(key);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'); draw(x, w, h);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  if (rep) t.repeat.set(rep[0], rep[1]);
  TXC.set(key, t); return t;
}
let seedR = 1234;
const rr = () => (seedR = (seedR * 16807) % 2147483647) / 2147483647;
function speckle(x, w, h, n, cols, rmin, rmax, a = 1) { x.globalAlpha = a; for (let i = 0; i < n; i++) { x.fillStyle = cols[Math.floor(rr()*cols.length)]; const r = rmin + rr()*(rmax - rmin); x.beginPath(); x.arc(rr()*w, rr()*h, r, 0, 7); x.fill(); } x.globalAlpha = 1; }
const TX = {
  grass: () => cvTex('grass', 512, 512, (x, w, h) => {
    x.fillStyle = '#3D5631'; x.fillRect(0, 0, w, h);
    speckle(x, w, h, 260, ['#46623A', '#344B2A', '#4C6B3D', '#3A5230'], 10, 40, 0.35);
    x.lineWidth = 1.2;
    for (let i = 0; i < 4200; i++) { const px = rr()*w, py = rr()*h, l = 3 + rr()*6; x.strokeStyle = ['#5C7E45', '#2E4325', '#6B8C4E', '#456238'][i % 4]; x.globalAlpha = 0.55; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (rr() - 0.5)*3, py - l); x.stroke(); }
    x.globalAlpha = 1; speckle(x, w, h, 60, ['#8A7A4A', '#6E6A3A'], 1, 2.5, 0.6);
  }, [22, 22]),
  dirt: () => cvTex('dirt', 256, 256, (x, w, h) => {
    x.fillStyle = '#7B6849'; x.fillRect(0, 0, w, h);
    speckle(x, w, h, 120, ['#86744F', '#6E5C40', '#8E7C58'], 6, 22, 0.4);
    speckle(x, w, h, 900, ['#5E4E36', '#9A8865', '#A89874', '#4E4130'], 0.8, 2.6, 0.8);
    x.strokeStyle = 'rgba(70,56,38,.45)'; x.lineWidth = 7; for (const cx of [w*0.32, w*0.68]) { x.beginPath(); x.moveTo(cx, 0); for (let y = 0; y <= h; y += 16) x.lineTo(cx + Math.sin(y*0.05)*3, y); x.stroke(); }
    const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(62,86,49,.85)'); g.addColorStop(0.1, 'rgba(62,86,49,0)'); g.addColorStop(0.9, 'rgba(62,86,49,0)'); g.addColorStop(1, 'rgba(62,86,49,.85)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
  }),
  stone: () => cvTex('stone', 256, 256, (x, w, h) => {
    x.fillStyle = '#5A564F'; x.fillRect(0, 0, w, h);
    const rows = 6;
    for (let r = 0; r < rows; r++) { let px = -(r % 2)*24; const y = r*h/rows; while (px < w) { const bw = 34 + rr()*30; const v = 120 + Math.floor(rr()*40); x.fillStyle = `rgb(${v},${v - 6},${v - 14})`; x.fillRect(px + 2, y + 2, bw - 4, h/rows - 4); px += bw; } }
    speckle(x, w, h, 500, ['#6A665E', '#8E897F', '#4A4740'], 0.6, 2, 0.5);
    speckle(x, w, h, 30, ['#4F6B3A'], 3, 8, 0.25);
  }),
  plaza: () => cvTex('plaza', 512, 512, (x, w, h) => {
    x.fillStyle = '#4C4943'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) { const v = 110 + Math.floor(rr()*35); x.fillStyle = `rgb(${v},${v - 4},${v - 10})`; x.fillRect(i*32 + 2, j*32 + 2, 28, 28); }
    speckle(x, w, h, 700, ['#5E5B54', '#8A867C'], 0.6, 2, 0.5);
  }, [6, 6]),
  wood: () => cvTex('wood', 128, 256, (x, w, h) => {
    for (let i = 0; i < 4; i++) { const v = 0.85 + rr()*0.25; x.fillStyle = `rgb(${Math.floor(138*v)},${Math.floor(100*v)},${Math.floor(64*v)})`; x.fillRect(i*32, 0, 31, h); }
    x.strokeStyle = 'rgba(60,40,22,.55)'; x.lineWidth = 1;
    for (let i = 0; i < 40; i++) { const px = rr()*w; x.beginPath(); x.moveTo(px, 0); x.bezierCurveTo(px + 4, h*0.3, px - 4, h*0.6, px + 2, h); x.stroke(); }
    x.fillStyle = 'rgba(40,26,14,.7)'; for (let i = 0; i < 4; i++) x.fillRect(i*32 + 31, 0, 1.5, h);
  }),
  brick: () => cvTex('brick', 256, 256, (x, w, h) => {
    x.fillStyle = '#4A463F'; x.fillRect(0, 0, w, h);
    for (let r = 0; r < 12; r++) for (let c = -1; c < 6; c++) { const v = 135 + Math.floor(rr()*40); x.fillStyle = `rgb(${v},${v - 8},${v - 18})`; x.fillRect(c*48 + (r % 2)*24 + 2, r*21.3 + 2, 44, 17.3); }
    speckle(x, w, h, 400, ['#5E5A52', '#9A958A'], 0.6, 1.8, 0.5);
  }),
  roof: t => cvTex('roof' + t, 128, 128, (x, w, h) => {
    const base = t ? [150, 52, 38] : [48, 92, 160];
    for (let r = 0; r < 8; r++) for (let c = 0; c < 9; c++) { const v = 0.75 + rr()*0.35; x.fillStyle = `rgb(${Math.floor(base[0]*v)},${Math.floor(base[1]*v)},${Math.floor(base[2]*v)})`; x.beginPath(); x.arc(c*16 + (r % 2)*8, r*16 + 16, 9, Math.PI, 0); x.fill(); }
    x.strokeStyle = 'rgba(0,0,0,.25)'; for (let r = 0; r < 8; r++) { x.beginPath(); x.moveTo(0, r*16 + 16); x.lineTo(w, r*16 + 16); x.stroke(); }
  }),
  cloth: t => cvTex('cloth' + t, 256, 384, (x, w, h) => {
    x.fillStyle = t ? '#8E2E22' : '#24508F'; x.fillRect(0, 0, w, h);
    x.globalAlpha = 0.12; x.fillStyle = '#000'; for (let i = 0; i < h; i += 3) x.fillRect(0, i, w, 1); x.globalAlpha = 0.08; for (let i = 0; i < w; i += 3) x.fillRect(i, 0, 1, h); x.globalAlpha = 1;
    x.fillStyle = '#C9A24A'; x.fillRect(0, 0, w, 10); x.fillRect(0, h - 26, w, 14); x.fillRect(10, 10, 4, h - 36); x.fillRect(w - 14, 10, 4, h - 36);
    drawEmblem(x, w/2, h*0.45, 2.1, t);
  }),
  emblem: t => cvTex('emb' + t, 256, 256, (x, w, h) => { x.clearRect(0, 0, w, h); drawEmblem(x, w/2, h/2, 2.4, t); }),
  leather: () => cvTex('leather', 128, 128, (x, w, h) => { x.fillStyle = '#7A5536'; x.fillRect(0, 0, w, h); speckle(x, w, h, 300, ['#6A4730', '#86603E', '#5C3E28'], 1, 4, 0.5); }),
  rock: () => cvTex('rock', 128, 128, (x, w, h) => { x.fillStyle = '#6E6A62'; x.fillRect(0, 0, w, h); speckle(x, w, h, 200, ['#5A5750', '#837E74', '#4A4842'], 2, 9, 0.6); speckle(x, w, h, 40, ['#56703F'], 3, 10, 0.4); }),
  fur: () => cvTex('fur', 128, 128, (x, w, h) => { x.fillStyle = '#6B4E36'; x.fillRect(0, 0, w, h); x.lineWidth = 1.5; for (let i = 0; i < 900; i++) { x.strokeStyle = ['#7E5E42', '#5A3F2A', '#9A7B58'][i % 3]; const px = rr()*w, py = rr()*h; x.beginPath(); x.moveTo(px, py); x.lineTo(px + 2, py + 6); x.stroke(); } }),
  wing: () => cvTex('wing', 256, 128, (x, w, h) => { const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#5A1E1A'); g.addColorStop(1, '#2A0E10'); x.fillStyle = g; x.fillRect(0, 0, w, h); x.strokeStyle = '#E06A3A'; x.globalAlpha = 0.5; x.lineWidth = 1.5; for (let i = 0; i < 9; i++) { x.beginPath(); x.moveTo(0, h*0.1); x.quadraticCurveTo(w*0.4, h*(0.1 + i*0.1), w, h*(i/8)); x.stroke(); } })
};
function drawEmblem(x, cx, cy, s, team) {
  x.save(); x.translate(cx, cy); x.scale(s, s);
  if (team === 0) {
    x.fillStyle = '#E8C060';
    for (let i = 0; i < 12; i++) { x.save(); x.rotate(i*Math.PI/6); x.beginPath(); x.moveTo(-5, -27); x.lineTo(0, i % 2 ? -38 : -46); x.lineTo(5, -27); x.fill(); x.restore(); }
    x.beginPath(); x.arc(0, 0, 24, 0, 7); x.fill();
    x.fillStyle = '#1E4A86'; x.beginPath(); x.moveTo(0, -18); x.lineTo(15, -12); x.lineTo(15, 2); x.quadraticCurveTo(14, 14, 0, 20); x.quadraticCurveTo(-14, 14, -15, 2); x.lineTo(-15, -12); x.closePath(); x.fill();
    x.fillStyle = '#E8C060'; x.beginPath(); x.moveTo(0, -11); x.lineTo(7, 0); x.lineTo(0, 12); x.lineTo(-7, 0); x.closePath(); x.fill();
  } else {
    x.fillStyle = '#E8763E'; x.beginPath(); x.moveTo(0, -46); x.quadraticCurveTo(16, -22, 9, -2); x.quadraticCurveTo(26, -12, 22, 14); x.quadraticCurveTo(15, 40, 0, 44); x.quadraticCurveTo(-15, 40, -22, 14); x.quadraticCurveTo(-26, -12, -9, -2); x.quadraticCurveTo(-16, -22, 0, -46); x.fill();
    x.fillStyle = '#161216'; x.beginPath(); x.moveTo(0, -24); x.lineTo(13, 4); x.lineTo(0, 32); x.lineTo(-13, 4); x.closePath(); x.fill();
    x.strokeStyle = '#B48AE0'; x.lineWidth = 2.2; x.stroke(); x.beginPath(); x.moveTo(0, -24); x.lineTo(0, 32); x.moveTo(-13, 4); x.lineTo(13, 4); x.globalAlpha = 0.6; x.stroke(); x.globalAlpha = 1;
  }
  x.restore();
}

// ---------- materials ----------
const MC = new Map();
function MT(c, o = {}) {
  const k = [c, o.r ?? '', o.m ?? '', o.e || '', o.ei ?? '', o.op ?? '', o.map ? o.map.uuid : '', o.side || '', o.flat === false ? 's' : ''].join('|');
  let m = MC.get(k);
  if (!m) {
    m = new THREE.MeshStandardMaterial({color:c, flatShading:o.flat !== false, roughness:o.r ?? 0.8, metalness:o.m ?? 0.04, emissive:o.e || '#000000', emissiveIntensity:o.ei ?? 1, transparent:!!o.op || !!o.alpha, opacity:o.op ?? 1});
    if (o.map) m.map = o.map;
    if (o.side) m.side = THREE.DoubleSide;
    if (o.alpha) { m.alphaTest = 0.4; m.transparent = false; }
    MC.set(k, m);
  }
  return m;
}
function add(par, g, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sh = false) {
  const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz);
  if (sh) o.castShadow = true; o.receiveShadow = sh; par.add(o); return o;
}
function piv(par, x = 0, y = 0, z = 0) { const p = new THREE.Group(); p.position.set(x, y, z); par.add(p); return p; }
const P = {steel:'#B4BCC6', steelD:'#6E7782', gold:'#D9A54A', brass:'#B98A3E', leather:'#7A5536', leatherD:'#4A3422', cloth:'#C9B48A', skin:'#D9AE86', skinD:'#B98A62',
  wood:'#8A6440', woodD:'#5A4028', fur:'#6B4E36', furL:'#9A7B58', black:'#23252B', white:'#EEE8DC', green:'#56653A', greenD:'#3E4A2A', purple:'#5D3F96',
  stone:'#9A938A', stoneD:'#6A655E', rope:'#B59A6A', horse:'#6A4A33', horseD:'#33241A', gray:'#7D7F86', grayL:'#A3A5AC', grif:'#B8925A', beak:'#E2B23C', sand:'#A68D62', hair:'#3A2A1E'};
const TEAM = ['#3C76C4', '#B6432F'], TEAML = ['#7FB4F2', '#EF8A6E'];
const metal = (c, r = 0.38) => MT(c, {m:0.65, r});
const glow = (c, i = 1) => MT(c, {e:c, ei:i, r:0.4});
const clothM = t => MT('#ffffff', {map:TX.cloth(t), side:1, r:0.9});
const embM = t => MT('#ffffff', {map:TX.emblem(t), alpha:1, side:1, r:0.6});
const woodM = () => MT('#ffffff', {map:TX.wood(), r:0.9});
const brickM = () => MT('#ffffff', {map:TX.brick(), r:0.95});
const roofM = t => MT('#ffffff', {map:TX.roof(t), r:0.85});
const rockM = () => MT('#ffffff', {map:TX.rock(), r:0.95});
const furM = () => MT('#ffffff', {map:TX.fur(), r:1});
const leatherM = () => MT('#ffffff', {map:TX.leather(), r:0.9});

// ---------- shapes ----------
const TORSO = [[0.26,0],[0.3,0.1],[0.35,0.38],[0.42,0.68],[0.45,0.84],[0.36,0.97],[0.13,1.02]];
const ROBE = [[0.62,0],[0.56,0.4],[0.46,0.9],[0.38,1.3],[0.34,1.6],[0.3,1.95],[0.12,2.0]];
const bladeG = (len, w) => EX(`blade${len},${w}`, s => { s.moveTo(-w/2, 0); s.lineTo(-w/2, len*0.82); s.lineTo(0, len); s.lineTo(w/2, len*0.82); s.lineTo(w/2, 0); s.lineTo(-w/2, 0); }, 0.035, 0.012);
const kiteG = () => EX('kite', s => { s.moveTo(0, 0.85); s.quadraticCurveTo(0.52, 0.8, 0.5, 0.3); s.quadraticCurveTo(0.42, -0.45, 0, -0.85); s.quadraticCurveTo(-0.42, -0.45, -0.5, 0.3); s.quadraticCurveTo(-0.52, 0.8, 0, 0.85); }, 0.1, 0.03);
const towerShieldG = () => EX('tshield', s => { s.moveTo(-0.48, 0.8); s.lineTo(0.48, 0.8); s.lineTo(0.48, -0.6); s.quadraticCurveTo(0.45, -0.85, 0, -0.9); s.quadraticCurveTo(-0.45, -0.85, -0.48, -0.6); s.lineTo(-0.48, 0.8); }, 0.1, 0.03);
const axeG = () => EX('axe', s => { s.moveTo(0, 0.25); s.quadraticCurveTo(0.35, 0.42, 0.55, 0.55); s.quadraticCurveTo(0.7, 0, 0.55, -0.55); s.quadraticCurveTo(0.35, -0.42, 0, -0.25); s.lineTo(0, 0.25); }, 0.05, 0.015);
const daggerG = () => EX('dagger', s => { s.moveTo(-0.045, 0); s.quadraticCurveTo(-0.07, 0.3, 0.06, 0.62); s.quadraticCurveTo(0.03, 0.3, 0.045, 0); s.lineTo(-0.045, 0); }, 0.025, 0.008);
const featherG = (w, l) => SH(`fe${w},${l}`, s => { s.moveTo(0, 0); s.quadraticCurveTo(w, l*0.3, w*0.8, l); s.quadraticCurveTo(0, l*1.05, -w*0.2, l*0.5); s.lineTo(0, 0); });

// ---------- humanoid ----------
function human(o = {}) {
  const g = new THREE.Group();
  const skin = MT(o.skin || P.skin), body = o.bodyM || MT(o.body || P.cloth), legM = o.legM || MT(o.leg || P.leatherD), armM = o.armM || MT(o.arm || o.body || P.cloth), bootM = MT(o.boot || P.leatherD), glove = MT(o.glove || o.skin || P.skin);
  const lL = piv(g, -0.19, 1.0, 0), lR = piv(g, 0.19, 1.0, 0);
  for (const l of [lL, lR]) {
    add(l, CY(0.15, 0.12, 0.5, 8), legM, 0, -0.25, 0, 0, 0, 0, true);
    add(l, SP(0.115, 8, 6), legM, 0, -0.5, 0.01);
    add(l, CY(0.12, 0.1, 0.4, 8), legM, 0, -0.7, 0);
    add(l, CY(0.13, 0.12, 0.2, 8), bootM, 0, -0.82, 0);
    add(l, B(0.21, 0.13, 0.34), bootM, 0, -0.935, 0.07);
  }
  add(g, CY(0.3, 0.27, 0.24, 12), MT(o.belt || P.leatherD), 0, 1.02, 0);
  add(g, B(0.12, 0.1, 0.06), MT(P.gold, {m:0.6}), 0, 1.02, 0.29);
  const torso = add(g, LA('torso', TORSO), body, 0, 1.1, 0, 0, 0, 0, true); torso.scale.set(o.slim ? 0.9 : 1, 1, 0.72);
  add(g, CY(0.1, 0.12, 0.14, 8), skin, 0, 2.1, 0);
  const head = add(g, SP(0.25, 12, 10), skin, 0, 2.34, 0.01, 0, 0, 0, true); head.scale.set(0.92, 1.06, 1);
  if (!o.noFace) {
    for (const s of [-1, 1]) { add(g, SP(0.034, 6, 4), MT('#1A1410'), s*0.085, 2.37, 0.225); add(g, B(0.08, 0.018, 0.02), MT(o.brow || '#3A2A1E'), s*0.085, 2.42, 0.235, 0, 0, s*-0.15); }
    add(g, CO(0.035, 0.1, 4), MT(P.skinD), 0, 2.31, 0.255, Math.PI/2);
    add(g, B(0.09, 0.015, 0.02), MT('#7A4A3A'), 0, 2.22, 0.235);
  }
  if (o.hair) { const hh = add(g, HS(0.27, 12), MT(o.hair), 0, 2.36, -0.03, -0.3); hh.scale.set(1, 1.05, 1.05); }
  if (o.long) add(g, B(0.44, 0.6, 0.12), MT(o.hair), 0, 2.08, -0.2, 0.15);
  if (o.beard) { const bd = add(g, CO(0.19, o.bigBeard ? 0.55 : 0.32, 8), MT(o.beard), 0, o.bigBeard ? 2.0 : 2.12, 0.13, Math.PI + 0.22); bd.scale.set(1, 1, 0.75); }
  const aL = piv(g, -0.5, 1.9, 0), aR = piv(g, 0.5, 1.9, 0);
  for (const a of [aL, aR]) {
    add(a, SP(0.14, 8, 6), armM, 0, -0.02, 0);
    add(a, CY(0.115, 0.1, 0.42, 8), armM, 0, -0.25, 0, 0, 0, 0, true);
    add(a, SP(0.095, 8, 6), armM, 0, -0.47, 0);
    add(a, CY(0.1, 0.085, 0.36, 8), MT(o.fore || o.arm || o.body || P.cloth), 0, -0.65, 0);
    add(a, SP(0.095, 8, 6), glove, 0, -0.86, 0.01);
  }
  aL.rotation.x = -0.15; aR.rotation.x = -0.25;
  const hL = piv(aL, 0, -0.86, 0), hR = piv(aR, 0, -0.86, 0);
  g.userData.legs = [lL, lR]; g.userData.arms = [aL, aR]; g.userData.armR = aR;
  return {g, aL, aR, hL, hR, head, torso, lL, lR};
}
function robe(h, m, len = 1.95) { const r = add(h.g, LA('robe' + len, ROBE.map(p => [p[0], p[1]*len/2])), m, 0, 0.02, 0, 0, 0, 0, true); r.scale.z = 0.85; return r; }
function cape(h, m, w = 0.95, len = 1.55) { const p = piv(h.g, 0, 2.0, -0.32); const c = add(p, PL(w, len, 1, 4), m, 0, -len/2, -0.02); c.rotation.y = Math.PI; p.rotation.x = 0.12; h.g.userData.cape = p; return p; }
function tabard(h, t, len = 1.15) { add(h.g, PL(0.56, len), clothM(t), 0, 1.26, 0.34); const b = add(h.g, PL(0.56, len), clothM(t), 0, 1.26, -0.34); b.rotation.y = Math.PI; }
function pauldrons(h, m) { for (const s of [-1, 1]) { const p = add(h.g, HS(0.25, 10), m, s*0.53, 1.92, 0, 0, 0, s*-0.35); p.scale.set(1, 0.8, 1.05); add(h.g, HS(0.2, 10), m, s*0.6, 1.8, 0, 0, 0, s*-0.6).scale.set(1, 0.6, 1); } }
function sword(hand, len = 1.2, c = '#DDE3EA') { const p = piv(hand, 0, 0, 0.05); p.rotation.x = Math.PI/2 - 0.4; add(p, bladeG(len, 0.11), metal(c, 0.25), 0, 0.14, 0); add(p, B(0.44, 0.07, 0.1), metal(P.gold), 0, 0.12, 0); add(p, CY(0.04, 0.045, 0.24, 6), MT(P.leatherD), 0, -0.03, 0); add(p, SP(0.06, 6, 5), metal(P.gold), 0, -0.17, 0); return p; }
function bowOn(hand) { const p = piv(hand, 0, 0, 0.1); add(p, TU('bow', [[0, -0.85, -0.05], [0, -0.45, 0.12], [0, 0, 0.18], [0, 0.45, 0.12], [0, 0.85, -0.05]], 0.035, 16), MT(P.wood, {flat:false}), 0, 0, 0); add(p, B(0.012, 1.66, 0.012), MT(P.white), 0, 0, -0.05); add(p, CY(0.045, 0.045, 0.22, 6), MT(P.leatherD), 0, 0, 0.18); return p; }
function quiver(g) { const q = piv(g, 0.22, 1.55, -0.34); q.rotation.set(0.25, 0, 0.3); add(q, CY(0.13, 0.11, 0.8, 8), leatherM(), 0, 0, 0); add(q, CY(0.14, 0.14, 0.06, 8), metal(P.brass), 0, 0.38, 0); for (let i = 0; i < 5; i++) { add(q, B(0.02, 0.5, 0.02), MT(P.wood), -0.07 + i*0.035, 0.55, 0.02*(i % 2)); add(q, B(0.05, 0.12, 0.008), MT(i % 2 ? P.white : '#A83A2A'), -0.07 + i*0.035, 0.78, 0.02*(i % 2)); } }
const HELM = {
  great: [[0.29,0],[0.3,0.3],[0.29,0.45],[0.24,0.55],[0.12,0.6],[0,0.61]],
  kettle: [[0.5,0],[0.5,0.03],[0.3,0.05],[0.29,0.2],[0.22,0.32],[0,0.36]],
  nasal: [[0.28,0],[0.28,0.12],[0.25,0.3],[0.15,0.42],[0,0.48]],
  sallet: [[0.36,-0.05],[0.3,0.05],[0.28,0.25],[0.2,0.38],[0,0.42]],
  hood: [[0.31,-0.2],[0.33,0.05],[0.3,0.3],[0.2,0.48],[0.05,0.58],[0,0.6]],
  wiz: [[0.6,0],[0.6,0.04],[0.3,0.06],[0.25,0.4],[0.16,0.8],[0.06,1.15],[0,1.25]]
};
function helm(h, kind, m) {
  const y = {great:2.08, kettle:2.4, nasal:2.3, sallet:2.32, hood:2.25, wiz:2.5}[kind];
  const o = add(h.g, LA('helm' + kind, HELM[kind], 14), m, 0, y, 0, 0, 0, 0, true);
  if (kind === 'great') { add(h.g, B(0.42, 0.045, 0.06), MT(P.black), 0, 2.4, 0.27); add(h.g, B(0.045, 0.2, 0.06), MT(P.black), 0, 2.3, 0.28); for (let i = -2; i <= 2; i++) add(h.g, SP(0.02, 4, 3), MT(P.black), i*0.06, 2.24, 0.28); }
  if (kind === 'nasal') add(h.g, B(0.05, 0.24, 0.05), m, 0, 2.32, 0.27);
  if (kind === 'hood') { o.position.z = -0.04; o.rotation.x = -0.15; }
  if (kind === 'wiz') { o.rotation.x = -0.1; }
  return o;
}

// ---------- commanders ----------
function mkCommander(key, team) {
  const T = TEAM[team], TL = TEAML[team];
  let h;
  if (key === 'valen') {
    const st = metal(P.steel);
    h = human({bodyM:st, armM:st, legM:metal(P.steelD), boot:P.steelD, glove:P.steelD, belt:P.leatherD, hair:'#6A6A6A', beard:'#8A8A8A'});
    tabard(h, team); pauldrons(h, st);
    helm(h, 'great', st);
    for (let i = 0; i < 6; i++) add(h.g, B(0.06, 0.32 - i*0.03, 0.12), MT(TL), 0, 2.78 - i*0.02, 0.15 - i*0.1, -0.4 - i*0.15);
    add(h.g, TO(0.3, 0.025, Math.PI*2, 16), metal(P.gold), 0, 2.12, 0, Math.PI/2);
    const sh = piv(h.aL, 0.02, -0.5, 0.3); add(sh, kiteG(), MT(T, {m:0.2, r:0.6}), 0, 0, 0); add(sh, kiteG(), metal(P.gold), 0, 0, -0.03).scale.set(1.07, 1.05, 0.6); add(sh, PL(0.75, 0.75), embM(team), 0, 0.15, 0.08);
    sword(h.hR, 1.4);
    cape(h, clothM(team), 1.0, 1.65);
  } else if (key === 'sylvie') {
    h = human({body:'#55663C', arm:'#4A5934', fore:P.leather, leg:'#3E3326', belt:P.leather, slim:true, hair:'#C98A3A', long:true});
    helm(h, 'hood', MT('#3A4A2A'));
    add(h.g, B(0.84, 0.13, 0.54), MT(T), 0, 1.66, 0, 0, 0, 0.55);
    add(h.g, LA('corset', [[0.3,0],[0.33,0.2],[0.36,0.42],[0.3,0.48]]), leatherM(), 0, 1.12, 0).scale.z = 0.75;
    cape(h, MT('#3A4A2A', {side:1}), 0.95, 1.8); bowOn(h.hL); quiver(h.g);
    add(h.g, OC(0.06), glow('#9FE07A', 0.6), 0, 2.02, 0.28);
    h.aL.rotation.x = -0.9;
  } else if (key === 'orion') {
    const rb = MT('#4A3480');
    h = human({bodyM:rb, armM:rb, legM:rb, hair:'#E8E4DA', beard:'#ECE8DE', bigBeard:true, brow:'#E8E4DA'});
    robe(h, rb, 2.0);
    add(h.g, LA('robetrim', [[0.63,0],[0.64,0.1],[0.62,0.12]]), metal(P.gold), 0, 0.02, 0).scale.z = 0.85;
    add(h.g, PL(0.22, 1.6), MT(P.gold, {side:1}), 0, 1.0, 0.45, -0.18);
    for (const a of [h.aL, h.aR]) add(a, CO(0.24, 0.6, 10), rb, 0, -0.62, 0);
    helm(h, 'wiz', MT('#2E2058'));
    add(h.g, TO(0.27, 0.03, Math.PI*2, 16), metal(P.gold), 0, 2.58, 0, Math.PI/2 - 0.1);
    add(h.g, OC(0.07), glow('#F1D29A'), 0, 3.55, -0.18);
    const stf = piv(h.hR, 0, 0, 0.06); add(stf, CY(0.04, 0.05, 3.0, 6), MT(P.woodD), 0, 0.55, 0); add(stf, TO(0.18, 0.025, Math.PI*2, 12), metal(P.gold), 0, 2.0, 0); add(stf, OC(0.24), glow('#F1D29A', 0.9), 0, 2.25, 0); add(stf, TO(0.32, 0.02, Math.PI*2, 16), glow('#C9A0FF', 0.8), 0, 2.25, 0, Math.PI/2);
    h.aR.rotation.x = -0.35;
    const runes = piv(h.g, 0, 1.25, 0); add(runes, TO(1.05, 0.022, Math.PI*2, 32), glow('#B892E0', 0.9), 0, 0, 0, Math.PI/2 + 0.2); add(runes, TO(0.85, 0.018, Math.PI*2, 32), glow('#C9A0FF', 0.8), 0, 0.5, 0, Math.PI/2 - 0.3);
    for (let i = 0; i < 4; i++) add(runes, OC(0.07), glow('#E6D2FF'), Math.cos(i*1.57)*1.05, 0.05, Math.sin(i*1.57)*1.05);
    h.g.userData.spin = runes;
  } else if (key === 'gru') {
    h = human({body:P.skin, arm:P.skin, fore:P.skin, legM:furM(), belt:P.leatherD, hair:'#3A2416', beard:'#4A2C18', bigBeard:true, glove:P.leatherD});
    add(h.g, LA('furvest', [[0.47,0],[0.5,0.3],[0.48,0.55],[0.36,0.7]]), furM(), 0, 1.3, 0).scale.z = 0.8;
    for (const s of [-1, 1]) { add(h.g, SP(0.32, 8, 6), furM(), s*0.45, 1.98, -0.04); add(h.aL === null ? h.g : (s < 0 ? h.aL : h.aR), CY(0.12, 0.12, 0.2, 8), furM(), 0, -0.62, 0); }
    const hm = helm(h, 'nasal', metal(P.steelD)); hm.scale.set(1.05, 1, 1.05);
    for (const s of [-1, 1]) add(h.g, TU('horn' + s, [[s*0.25, 2.48, 0], [s*0.48, 2.62, 0], [s*0.6, 2.9, 0.05], [s*0.55, 3.1, 0.15]], 0.06, 8), MT('#E8DCC0'), 0, 0, 0);
    add(h.g, B(0.12, 0.03, 0.02), MT(T), -0.09, 2.3, 0.24); add(h.g, B(0.12, 0.03, 0.02), MT(T), 0.09, 2.3, 0.24);
    add(h.g, B(0.86, 0.15, 0.56), MT(T), 0, 1.16, 0);
    const ax = piv(h.hR, 0, 0, 0.05); ax.rotation.x = Math.PI/2 - 0.5; add(ax, CY(0.045, 0.05, 1.9, 6), MT(P.woodD), 0, 0.65, 0); add(ax, axeG(), metal(P.steel, 0.3), 0.05, 1.45, 0, 0, Math.PI/2, 0); add(ax, axeG(), metal(P.steel, 0.3), -0.05, 1.45, 0, 0, -Math.PI/2, 0); add(ax, CY(0.07, 0.07, 0.14, 6), metal(P.brass), 0, 1.45, 0);
    cape(h, furM(), 1.05, 1.4);
    h.g.scale.set(1.14, 1.08, 1.14);
  } else if (key === 'brand') {
    h = human({body:P.leather, arm:'#8A6A4A', fore:P.leather, leg:P.leatherD, belt:P.brass, glove:P.leatherD, beard:'#C2652A', bigBeard:true, hair:'#C2652A', brow:'#C2652A'});
    add(h.g, PL(0.66, 1.0), leatherM(), 0, 1.25, 0.335);
    add(h.g, LA('brandhelm', [[0.3,0],[0.3,0.12],[0.27,0.24],[0.16,0.32],[0,0.35]]), metal(P.brass), 0, 2.38, 0);
    for (const x of [-0.11, 0.11]) { add(h.g, CY(0.09, 0.09, 0.1, 10), metal(P.brass), x, 2.44, 0.22, Math.PI/2); add(h.g, CY(0.07, 0.07, 0.11, 10), glow('#F2A33A', 0.6), x, 2.44, 0.23, Math.PI/2); }
    add(h.g, B(0.86, 0.14, 0.56), MT(T), 0, 1.6, 0, 0, 0, -0.5);
    for (const x of [-0.22, 0.22]) { add(h.g, CY(0.21, 0.21, 0.6, 12), woodM(), x, 1.6, -0.44); for (const y of [1.4, 1.8]) add(h.g, CY(0.22, 0.22, 0.05, 12), metal(P.brass), x, y, -0.44); }
    add(h.g, CY(0.05, 0.05, 0.9, 6), metal(P.brass), 0, 2.15, -0.5, 0.3); add(h.g, SP(0.08, 6, 5), glow('#F29A3A', 0.8), 0, 2.6, -0.62);
    const gear = add(h.g, TO(0.16, 0.05, Math.PI*2, 8), metal(P.brass), -0.36, 1.25, 0.26, 0, 0, 0); h.g.userData.spin = gear;
    const hm = piv(h.hR, 0, 0, 0.05); hm.rotation.x = Math.PI/2 - 0.6; add(hm, CY(0.05, 0.055, 1.9, 6), MT(P.woodD), 0, 0.6, 0); add(hm, B(0.7, 0.44, 0.44), metal(P.steelD, 0.3), 0, 1.5, 0); for (const x of [-0.3, 0.3]) add(hm, B(0.06, 0.48, 0.48), metal(P.brass), x, 1.5, 0); add(hm, CO(0.14, 0.3, 4), metal(P.steelD), 0.47, 1.5, 0, 0, 0, -Math.PI/2);
    h.g.scale.set(1.24, 0.92, 1.24);
  } else {
    h = human({body:'#24262C', arm:'#24262C', fore:'#2E2A36', leg:'#1A1B20', belt:'#3A2B4A', glove:'#1A1B20', slim:true, hair:'#14141A'});
    helm(h, 'hood', MT('#202228'));
    add(h.g, LA('mask', [[0.255,0],[0.26,0.12],[0.22,0.2]], 12), metal('#C8CCD4', 0.3), 0, 2.2, 0.02).scale.z = 1.05;
    add(h.g, B(0.86, 0.17, 0.56), MT('#6B4AA0'), 0, 1.9, 0);
    for (const s of [-1, 1]) add(h.g, PL(0.14, 0.7), MT('#6B4AA0', {side:1}), s*0.15, 1.6, -0.36, 0.2, 0, s*0.1);
    add(h.g, B(0.86, 0.15, 0.56), MT(T), 0, 1.02, 0);
    for (const hd of [h.hL, h.hR]) { const d = piv(hd, 0, 0, 0.05); d.rotation.x = Math.PI/2 - 0.2; add(d, daggerG(), metal('#DDE3EA', 0.2), 0, 0.08, 0); add(d, B(0.18, 0.04, 0.06), MT(P.black), 0, 0.06, 0); }
    h.aL.rotation.x = -0.6;
    const crow = piv(h.g, -0.56, 2.15, 0); const bm = MT('#121317');
    add(crow, SP(0.15, 8, 6), bm, 0, 0, 0).scale.set(0.9, 0.9, 1.3); add(crow, SP(0.1, 8, 6), bm, 0, 0.13, 0.13); add(crow, CO(0.035, 0.17, 4), MT(P.beak), 0, 0.12, 0.27, Math.PI/2);
    add(crow, SP(0.02, 4, 3), glow('#C9A0FF'), -0.05, 0.16, 0.2); add(crow, SP(0.02, 4, 3), glow('#C9A0FF'), 0.05, 0.16, 0.2);
    for (const s of [-1, 1]) add(crow, featherG(0.12, 0.34), MT('#121317', {side:1}), s*0.12, 0.02, -0.05, -Math.PI/2 + 0.3, s*0.4, 0);
    add(crow, B(0.08, 0.02, 0.24), bm, 0, -0.04, -0.22, 0.3);
    const cl = cape(h, MT('#202228', {side:1}), 0.95, 1.75);
    for (let i = 0; i < 4; i++) add(cl, CO(0.12, 0.28, 3), MT('#202228'), -0.36 + i*0.24, -1.85, -0.02, Math.PI);
  }
  h.g.userData.base = {aL:h.aL.rotation.x, aR:h.aR.rotation.x};
  h.g.scale.multiplyScalar(1.22);
  const root = new THREE.Group(); root.add(h.g);
  root.add(ring(1.9, 2.35, TEAML[team], 0.85));
  root.userData = h.g.userData; root.userData.body = h.g;
  return root;
}

// ---------- creatures ----------
function quad(par, o) {
  const g = piv(par, 0, 0, 0), c = o.cm || MT(o.c), d = MT(o.d || o.c);
  const L = o.len, Hh = o.h, W = o.w;
  const bd = add(g, LA('quadbody' + L, [[0, -L/2], [W*0.42, -L*0.42], [W*0.55, -L*0.15], [W*0.56, L*0.15], [W*0.5, L*0.4], [0, L/2]], 12), c, 0, Hh, 0, Math.PI/2, 0, 0, true);
  bd.scale.set(1, 1, 1.05);
  const legs = [];
  for (const [x, z] of [[-W*0.3, L*0.34], [W*0.3, L*0.34], [-W*0.3, -L*0.34], [W*0.3, -L*0.34]]) {
    const l = piv(g, x, Hh - 0.05, z);
    add(l, CY(W*0.15, W*0.11, Hh*0.55, 8), c, 0, -Hh*0.27, 0); add(l, SP(W*0.1, 6, 5), d, 0, -Hh*0.55, 0); add(l, CY(W*0.09, W*0.08, Hh*0.42, 6), d, 0, -Hh*0.76, 0); add(l, CY(W*0.11, W*0.12, 0.12, 8), MT(o.hoof || P.horseD), 0, -Hh + 0.07, 0.02);
    legs.push(l);
  }
  g.userData.legs = legs; return g;
}
function horse(par, team) {
  const g = quad(par, {c:P.horse, d:'#5A3C28', len:2.1, h:1.2, w:1.0});
  const nk = add(g, CY(0.2, 0.3, 1.0, 8), MT(P.horse), 0, 1.85, 0.95, -0.6, 0, 0, true);
  const hd = add(g, LA('horsehead', [[0, 0], [0.16, 0.05], [0.2, 0.3], [0.17, 0.6], [0.12, 0.8], [0, 0.82]], 8), MT(P.horse), 0, 2.3, 1.18, 2.0); hd.scale.set(0.85, 1, 1);
  for (const s of [-1, 1]) { add(g, CO(0.06, 0.2, 4), MT(P.horseD), s*0.09, 2.52, 1.12, -0.2); add(g, SP(0.035, 4, 3), MT(P.black), s*0.14, 2.32, 1.38); }
  for (let i = 0; i < 6; i++) add(g, B(0.08, 0.22, 0.16), MT(P.horseD), 0, 2.3 - i*0.13, 1.08 - i*0.09, -0.6);
  add(g, TU('htail', [[0, 1.45, -1.05], [0, 1.3, -1.3], [0, 0.95, -1.4], [0, 0.6, -1.35]], 0.08, 10), MT(P.horseD), 0, 0, 0);
  add(g, LA('bard', [[0.62, 0], [0.62, 0.55], [0.5, 0.62]], 12), clothM(team), 0, 0.72, 0).scale.set(1, 1, 1.55);
  add(g, B(0.66, 0.16, 0.66), leatherM(), 0, 1.82, -0.05);
  add(g, B(0.7, 0.04, 0.4), metal(P.gold), 0, 1.92, -0.05);
  add(g, B(0.3, 0.32, 0.35), metal(P.steel), 0, 2.4, 1.32, 0.45);
  return g;
}
function wolfBody(par) {
  const g = quad(par, {c:P.gray, d:'#5E6066', len:1.4, h:0.72, w:0.62, hoof:'#3A3B40'});
  add(g, SP(0.3, 8, 6), MT(P.grayL), 0, 0.95, 0.72).scale.set(1, 1, 1.2);
  add(g, LA('snout', [[0.16, 0], [0.13, 0.2], [0.08, 0.34], [0, 0.36]], 8), MT(P.grayL), 0, 0.92, 0.95, Math.PI/2);
  add(g, SP(0.03, 4, 3), MT(P.black), 0, 0.94, 1.32);
  for (const s of [-1, 1]) { add(g, CO(0.07, 0.2, 4), MT(P.gray), s*0.12, 1.22, 0.7); add(g, SP(0.03, 4, 3), glow('#F2D27A', 0.6), s*0.1, 1.02, 0.95); }
  add(g, TU('wtail', [[0, 0.9, -0.7], [0, 1.05, -1.0], [0, 0.95, -1.3]], 0.09, 8), MT(P.gray), 0, 0, 0);
  return g;
}

// ---------- soldiers ----------
function mkSoldier(type, team) {
  const root = new THREE.Group(), T = TEAM[team], TL = TEAML[team];
  let h;
  switch (type) {
    case 'pike':
      h = human({body:'#A99C80', arm:'#A99C80', leg:P.leatherD, hair:P.hair}); tabard(h, team, 0.95); helm(h, 'kettle', metal(P.steel));
      add(h.g, LA('brig', [[0.43,0],[0.46,0.2],[0.4,0.32]]), metal(P.steelD), 0, 1.72, 0).scale.z = 0.75;
      { const pk = piv(h.hR, 0, 0, 0.05); pk.rotation.x = 0.05; add(pk, CY(0.035, 0.035, 4.6, 6), MT(P.wood), 0, 1.4, 0); add(pk, bladeG(0.45, 0.1), metal(P.steel, 0.25), 0, 3.7, 0); add(pk, PL(0.32, 0.22), MT(TL, {side:1}), 0.17, 3.4, 0); }
      { const b = piv(h.hL, 0, 0.15, 0.2); add(b, CY(0.34, 0.34, 0.06, 14), MT(T), 0, 0, 0, Math.PI/2); add(b, TO(0.34, 0.03, Math.PI*2, 14), metal(P.steel), 0, 0, 0.02); add(b, SP(0.08, 6, 5), metal(P.steel), 0, 0, 0.05); }
      root.add(h.g); break;
    case 'shield': {
      const st = metal(P.steel);
      h = human({bodyM:st, armM:st, legM:metal(P.steelD), glove:P.steelD, beard:'#5A3A26'}); tabard(h, team); pauldrons(h, st); helm(h, 'nasal', st);
      const s = piv(h.aL, 0.05, -0.55, 0.32); add(s, towerShieldG(), MT(T, {m:0.2, r:0.6}), 0, 0, 0); add(s, towerShieldG(), metal(P.steelD), 0, 0, -0.03).scale.set(1.06, 1.04, 0.6); add(s, PL(0.8, 0.8), embM(team), 0, 0.1, 0.08); add(s, B(0.96, 0.08, 0.04), metal(P.gold), 0, 0.62, 0.07);
      sword(h.hR, 0.95); root.add(h.g); break;
    }
    case 'archer':
      h = human({body:P.leather, bodyM:leatherM(), arm:'#5A6640', leg:'#3E3326', hair:'#8A5A2A', slim:true}); helm(h, 'hood', MT(TL));
      tabard(h, team, 0.8); bowOn(h.hL); quiver(h.g); h.aL.rotation.x = -0.9; root.add(h.g); break;
    case 'mage': {
      const rb = MT('#4A3480');
      h = human({bodyM:rb, armM:rb, legM:rb, beard:'#9A9A9A'}); robe(h, rb, 1.9);
      for (const a of [h.aL, h.aR]) add(a, CO(0.22, 0.55, 10), rb, 0, -0.6, 0);
      helm(h, 'wiz', MT('#2E2058')).scale.set(0.82, 0.75, 0.82);
      add(h.g, B(0.86, 0.13, 0.56), MT(T), 0, 1.4, 0);
      const o = piv(h.hR, 0, 0.25, 0.25); add(o, SP(0.2, 10, 8), glow('#B892E0', 0.9), 0, 0, 0); add(o, TO(0.28, 0.02, Math.PI*2, 16), glow('#E6D2FF', 0.7), 0, 0, 0, Math.PI/2); h.g.userData.orb = o;
      h.aR.rotation.x = -0.9; root.add(h.g); break;
    }
    case 'scout':
      h = human({body:'#2E3036', arm:'#2E3036', leg:'#1E1F24', slim:true}); helm(h, 'hood', MT('#22242A'));
      add(h.g, B(0.44, 0.18, 0.06), MT(T), 0, 2.2, 0.25);
      add(h.g, B(0.86, 0.12, 0.56), MT(T), 0, 1.02, 0);
      { const d = piv(h.hR, 0, 0, 0.05); d.rotation.x = Math.PI/2 - 0.1; add(d, daggerG(), metal('#DDE3EA', 0.2), 0, 0.05, 0); }
      { const d = piv(h.hL, 0, 0, 0.05); d.rotation.x = -Math.PI/2 + 0.3; add(d, daggerG(), metal('#DDE3EA', 0.2), 0, 0.05, 0); }
      cape(h, MT('#22242A', {side:1}), 0.8, 1.1); h.g.scale.set(0.95, 0.9, 0.95); root.add(h.g); break;
    case 'priest': {
      const wm = MT(P.white);
      h = human({bodyM:wm, armM:wm, legM:wm, hair:'#C9A86A', slim:true}); robe(h, wm, 1.95); helm(h, 'hood', wm);
      add(h.g, LA('ptrim', [[0.63,0],[0.64,0.1],[0.62,0.12]]), metal(P.gold), 0, 0.02, 0).scale.z = 0.85;
      add(h.g, PL(0.26, 1.5), clothM(team), 0, 1.15, 0.46, -0.15);
      for (const a of [h.aL, h.aR]) add(a, CO(0.2, 0.5, 10), wm, 0, -0.6, 0);
      { const ha = add(h.g, TO(0.3, 0.03, Math.PI*2, 20), glow('#FFE6A0', 1), 0, 2.82, -0.05, Math.PI/2); h.g.userData.halo = ha; }
      { const st = piv(h.hR, 0, 0, 0.05); add(st, CY(0.035, 0.04, 2.4, 6), MT(P.wood), 0, 0.5, 0); add(st, CY(0.24, 0.24, 0.04, 16), glow('#FFE6A0', 0.8), 0, 1.75, 0, Math.PI/2); for (let i = 0; i < 8; i++) add(st, B(0.04, 0.16, 0.03), glow('#FFE6A0', 0.8), Math.sin(i*0.785)*0.32, 1.75 + Math.cos(i*0.785)*0.32, 0, 0, 0, -i*0.785); }
      { const bk = piv(h.hL, 0, 0.05, 0.15); add(bk, B(0.36, 0.48, 0.1), MT('#7A2E2E'), 0, 0, 0); add(bk, B(0.3, 0.44, 0.11), MT(P.white), 0.02, 0, 0); add(bk, B(0.12, 0.12, 0.02), metal(P.gold), -0.02, 0.05, 0.06); }
      h.aL.rotation.x = -0.8; root.add(h.g); break;
    }
    case 'cav': {
      const hs = horse(root, team);
      const st = metal(P.steel);
      h = human({bodyM:st, armM:st, legM:metal(P.steelD)}); helm(h, 'great', st); tabard(h, team, 0.9);
      add(h.g, CO(0.1, 0.5, 6), MT(TL), 0, 2.85, 0);
      h.lL.rotation.set(-1.35, 0, -0.35); h.lR.rotation.set(-1.35, 0, 0.35);
      h.g.position.set(0, 0.95, -0.15);
      { const ln = piv(h.hR, 0, 0, 0.05); ln.rotation.x = Math.PI/2 - 0.25; add(ln, CO(0.11, 3.6, 8), MT(P.white), 0, 1.5, 0); add(ln, CY(0.17, 0.17, 0.1, 8), metal(P.steel), 0, 0, 0); add(ln, PL(0.04, 0.45), MT(TL, {side:1}), 0, 2.7, 0.22, 0, Math.PI/2, 0); }
      hs.add(h.g); h.g.userData.legs = []; h.g.userData.base = {aL:h.aL.rotation.x, aR:h.aR.rotation.x};
      root.userData.legs = hs.userData.legs; root.userData.armR = h.aR; root.userData.base = h.g.userData.base;
      root.scale.setScalar(1.08); return root;
    }
    case 'griffin': {
      const bd = piv(root, 0, 3.6, 0);
      add(bd, LA('grbody', [[0, -0.9], [0.4, -0.7], [0.5, -0.2], [0.52, 0.3], [0.45, 0.65], [0, 0.85]], 12), MT(P.grif), 0, 0, -0.1, Math.PI/2, 0, 0, true);
      add(bd, SP(0.55, 12, 10), MT(P.white), 0, 0.18, 0.72).scale.set(1, 1, 0.9);
      add(bd, SP(0.33, 10, 8), MT(P.white), 0, 0.65, 1.15);
      add(bd, LA('beak', [[0.13, 0], [0.1, 0.18], [0.04, 0.32], [0, 0.38]], 8), MT(P.beak), 0, 0.6, 1.4, Math.PI/2 + 0.35);
      for (const s of [-1, 1]) { add(bd, SP(0.045, 4, 3), MT(P.black), s*0.16, 0.72, 1.36); add(bd, featherG(0.1, 0.35), MT(P.white, {side:1}), s*0.12, 0.9, 1.0, -0.6, s*0.3, 0); }
      const legs = [];
      for (const [x, z, c] of [[-0.25, 0.6, P.beak], [0.25, 0.6, P.beak], [-0.25, -0.6, P.grif], [0.25, -0.6, P.grif]]) { const l = piv(bd, x, -0.25, z); add(l, CY(0.09, 0.07, 0.75, 6), MT(c), 0, -0.35, 0); add(l, CO(0.1, 0.15, 4), MT(P.black), 0, -0.75, 0.06, Math.PI/2); legs.push(l); }
      add(bd, TU('gtail', [[0, 0.1, -0.9], [0, 0.3, -1.4], [0, 0.6, -1.75]], 0.06, 8), MT(P.grif), 0, 0, 0); add(bd, SP(0.14, 6, 5), MT(P.horseD), 0, 0.62, -1.8);
      const wings = [];
      for (const s of [-1, 1]) {
        const w = piv(bd, 0.35*s, 0.4, 0.15);
        for (let i = 0; i < 7; i++) { const f = add(w, featherG(0.22, 1.2 + (i < 4 ? i*0.2 : (7 - i)*0.2)), MT(i % 2 ? P.grif : '#C9A66E', {side:1}), s*(0.3 + i*0.34), 0, 0.05 - i*0.05, -Math.PI/2, 0, s*0.1); f.rotation.z = s*(0.05 + i*0.05); }
        add(w, B(2.4, 0.08, 0.3), MT('#9A7A48'), s*1.2, 0.02, 0.18);
        wings.push(w);
      }
      h = human({body:T, arm:T, leg:P.leatherD}); helm(h, 'nasal', metal(P.steel)); h.lL.rotation.set(-1.2, 0, -0.5); h.lR.rotation.set(-1.2, 0, 0.5); h.g.position.set(0, -0.05, -0.15); h.g.scale.setScalar(0.85);
      { const sp = piv(h.hR, 0, 0, 0.05); sp.rotation.x = Math.PI/2 - 0.3; add(sp, CY(0.03, 0.03, 2.4, 6), MT(P.wood), 0, 0.9, 0); add(sp, bladeG(0.35, 0.09), metal(P.steel, 0.25), 0, 2.05, 0); }
      bd.add(h.g); h.g.userData.base = {aL:h.aL.rotation.x, aR:h.aR.rotation.x};
      add(root, CY(1.2, 1.2, 0.02, 16), MT('#000000', {op:0.35}), 0, 0.05, 0);
      root.userData.legs = legs; root.userData.wings = wings; root.userData.hover = bd; root.userData.armR = h.aR; root.userData.base = h.g.userData.base;
      root.scale.setScalar(1.05); return root;
    }
    case 'siege': {
      const wd = woodM();
      for (const x of [-0.7, 0.7]) add(root, B(0.16, 0.22, 2.8), wd, x, 0.8, 0, 0, 0, 0, true);
      for (const z of [-1.2, 0, 1.2]) add(root, B(1.55, 0.15, 0.16), wd, 0, 0.8, z);
      const wheels = [];
      for (const [x, z] of [[-0.88, -0.95], [0.88, -0.95], [-0.88, 0.95], [0.88, 0.95]]) { const w = add(root, CY(0.5, 0.5, 0.14, 14), MT(P.woodD), x, 0.5, z, 0, 0, Math.PI/2); add(w, TO(0.5, 0.04, Math.PI*2, 14), metal(P.steelD), 0, 0, 0, Math.PI/2); for (let i = 0; i < 4; i++) add(w, B(0.06, 0.9, 0.06), MT(P.wood), 0, 0, 0, i*0.785, 0, 0); wheels.push(w); }
      for (const x of [-0.55, 0.55]) { add(root, B(0.14, 1.5, 0.14), wd, x, 1.5, 0.45, 0.25); add(root, B(0.14, 1.5, 0.14), wd, x, 1.5, -0.05, -0.25); }
      add(root, CY(0.08, 0.08, 1.3, 6), metal(P.steelD), 0, 2.15, 0.2, 0, 0, Math.PI/2);
      const arm = piv(root, 0, 2.15, 0.2); arm.rotation.x = 0.75;
      add(arm, B(0.14, 0.14, 2.8), MT(P.woodD), 0, 0, -0.4); add(arm, CY(0.26, 0.18, 0.22, 8), leatherM(), 0, 0.12, -1.75); add(arm, IC(0.22, 0), glow('#6FE0E8', 0.9), 0, 0.32, -1.75); add(arm, B(0.65, 0.6, 0.6), metal(P.steelD), 0, -0.1, 0.95);
      for (let i = 0; i < 3; i++) add(root, B(0.42, 0.03, 0.03), glow('#6FE0E8', 0.6), 0, 0.92, -0.6 + i*0.6);
      add(root, CY(0.03, 0.03, 1.8, 6), MT(P.woodD), 0.75, 1.7, -1.25); add(root, PL(0.55, 0.75), clothM(team), 1.04, 2.2, -1.25, 0, Math.PI/2, 0);
      root.userData.wheels = wheels; root.userData.arm = arm; return root;
    }
    case 'wolf': { const w = wolfBody(root); root.userData.legs = w.userData.legs; root.scale.setScalar(1.05); return root; }
  }
  h.g.userData.base = {aL:h.aL.rotation.x, aR:h.aR.rotation.x};
  root.userData = h.g.userData;
  root.scale.setScalar(1.22);
  return root;
}
function mkMinion(team, ranged, sup, guard) {
  const root = new THREE.Group();
  const h = human({body:guard ? '#C9A24A' : TEAM[team], arm:'#A99C80', leg:P.leatherD, noFace:true}); helm(h, ranged ? 'sallet' : 'kettle', metal(guard ? P.gold : P.steel));
  if (ranged) { const c = piv(h.hR, 0, 0, 0.1); c.rotation.x = Math.PI/2; add(c, B(0.1, 0.7, 0.1), MT(P.wood), 0, 0.25, 0); add(c, B(0.7, 0.05, 0.05), MT(P.woodD), 0, 0.5, 0); h.aR.rotation.x = -1.1; }
  else { const s = piv(h.hR, 0, 0, 0.05); s.rotation.x = 0.1; add(s, CY(0.03, 0.03, 2.6, 6), MT(P.wood), 0, 0.7, 0); add(s, bladeG(0.3, 0.08), metal(P.steel), 0, 1.95, 0); }
  if (sup || guard) { add(h.g, LA('brig', [[0.43,0],[0.46,0.2],[0.4,0.32]]), metal(P.steel), 0, 1.72, 0).scale.z = 0.75; pauldrons(h, metal(guard ? P.gold : P.steel)); tabard(h, team, 0.9); }
  h.g.userData.base = {aL:h.aL.rotation.x, aR:h.aR.rotation.x};
  root.add(h.g); root.userData = h.g.userData;
  root.scale.setScalar(guard ? 1.4 : sup ? 1.32 : 1.22);
  return root;
}

// ---------- structures ----------
function mkTower(team, tier) {
  const g = new THREE.Group(), s = 1 + tier*0.08, T = TEAM[team];
  const bk = brickM();
  add(g, CY(3.1*s, 3.5*s, 1.3, 12), rockM(), 0, 0.65, 0, 0, 0, 0, true);
  add(g, CY(2.25*s, 2.75*s, 8*s, 12), bk, 0, 4.9*s, 0, 0, 0, 0, true);
  for (const y of [2.6*s, 5.6*s]) add(g, CY(2.55*s, 2.62*s, 0.35, 12), MT(P.stoneD), 0, y, 0);
  for (let i = 0; i < 4; i++) { const a = i/4*Math.PI*2 + 0.4; add(g, B(0.42, 1.1, 0.3), MT('#141518'), Math.sin(a)*2.33*s, 7*s, Math.cos(a)*2.33*s, 0, a); add(g, B(0.6, 0.12, 0.34), MT(P.stoneD), Math.sin(a)*2.36*s, 7.6*s, Math.cos(a)*2.36*s, 0, a); }
  add(g, CY(3.0*s, 2.6*s, 0.9, 12), MT(P.stone), 0, 9.3*s, 0);
  for (let i = 0; i < 10; i++) { const a = i/10*Math.PI*2; add(g, B(0.75, 1.0, 0.55), bk, Math.sin(a)*2.65*s, 10.15*s, Math.cos(a)*2.65*s, 0, a); }
  for (let i = 0; i < 6; i++) { const a = i/6*Math.PI*2; add(g, CY(0.09, 0.09, 2.6*s, 6), woodM(), Math.sin(a)*2.3*s, 11.4*s, Math.cos(a)*2.3*s); }
  add(g, CO(3.1*s, 3.6*s, 12), roofM(team), 0, 14.4*s, 0, 0, 0, 0, true);
  add(g, CY(0.05, 0.05, 2.6, 6), MT(P.woodD), 0, 17.2*s, 0); add(g, PL(1.3, 0.8), clothM(team), 0.66, 17.8*s, 0, 0, 0, 0);
  add(g, PL(1.3, 2.6), clothM(team), 0, 5.2*s, 2.7*s - 0.02);
  const br = add(g, CY(0.35, 0.25, 0.4, 8), metal(P.steelD), 0, 10.0*s, 0); add(g, CO(0.3, 0.8, 6), glow('#F2A33A', 1), 0, 10.6*s, 0);
  const cr = add(g, OC(0.55), glow(TEAML[team], 0.7), 0, 12.0*s, 0); g.userData.spin = cr;
  return g;
}
function mkCore(team) {
  const g = new THREE.Group(), T = TEAM[team], TL = TEAML[team], bk = brickM();
  add(g, B(13, 1, 13), rockM(), 0, 0.5, 0, 0, 0, 0, true);
  for (const [x, z, w, d] of [[0, -5.6, 11, 1.2], [0, 5.6, 11, 1.2], [-5.6, 0, 1.2, 11], [5.6, 0, 1.2, 11]]) { if (z === 5.6) { add(g, B(3.8, 3.4, 1.2), bk, -3.6, 2.7, z, 0, 0, 0, true); add(g, B(3.8, 3.4, 1.2), bk, 3.6, 2.7, z, 0, 0, 0, true); add(g, B(3.4, 1.2, 1.3), bk, 0, 4.0, z); } else add(g, B(w, 3.4, d), bk, x, 2.7, z, 0, 0, 0, true); }
  for (let i = -5; i <= 5; i += 2) for (const [x, z] of [[i, -5.6], [i, 5.6], [-5.6, i], [5.6, i]]) add(g, B(0.7, 0.7, 1.3), bk, x, 4.7, z);
  for (const [x, z] of [[-5.8, -5.8], [5.8, -5.8], [-5.8, 5.8], [5.8, 5.8]]) { add(g, CY(1.5, 1.7, 7, 12), bk, x, 4.0, z, 0, 0, 0, true); add(g, CO(2.0, 3.2, 12), roofM(team), x, 9.1, z); add(g, CY(0.04, 0.04, 1.8, 6), MT(P.woodD), x, 11.3, z); add(g, PL(1.0, 0.6), clothM(team), x + 0.5, 11.8, z); }
  add(g, B(3.2, 3.2, 0.3), woodM(), 0, 2.1, 5.65);
  for (let i = -1; i <= 1; i++) add(g, B(0.1, 3.2, 0.08), metal(P.steelD), i*0.8, 2.1, 5.85);
  add(g, B(6.5, 9, 6.5), bk, 0, 5.5, 0, 0, 0, 0, true);
  for (let i = 0; i < 8; i++) { const a = i/8*Math.PI*2; add(g, B(1.0, 0.9, 0.7), bk, Math.sin(a)*3.0, 10.4, Math.cos(a)*3.0, 0, a); }
  add(g, CO(4.6, 4.2, 4), roofM(team), 0, 12.4, 0, 0, Math.PI/4, 0, true);
  for (const s of [-1, 1]) { add(g, PL(1.8, 4.2), clothM(team), s*1.6, 6.6, 3.27); }
  add(g, PL(3, 3), embM(team), 0, 8.4, 3.28);
  for (const [x, z] of [[-2, 6.6], [2, 6.6]]) { add(g, CY(0.35, 0.25, 0.8, 8), metal(P.steelD), x, 1.4, z); add(g, CO(0.3, 0.9, 6), glow('#F2A33A', 1), x, 2.2, z); }
  const cr = add(g, OC(2.2), glow(TL, 0.6), 0, 17.5, 0, 0, 0, 0, true);
  add(g, TO(3.0, 0.08, Math.PI*2, 32), glow(TL, 0.9), 0, 17.5, 0, Math.PI/2);
  add(g, TO(3.6, 0.05, Math.PI*2, 32), glow('#F1D29A', 0.8), 0, 17.5, 0, Math.PI/2 + 0.4);
  g.userData.spin = cr;
  return g;
}
function mkBuilding(type, team) {
  const g = new THREE.Group(), T = TEAM[team], TL = TEAML[team], wd = woodM();
  switch (type) {
    case 'trench':
      add(g, CY(4.2, 4.0, 0.12, 24), MT('#2F2418'), 0, 0.05, 0);
      for (let l = 0; l < 2; l++) for (let i = 0; i < 16; i++) { const a = (i + l*0.5)/16*Math.PI*2; const sb = add(g, SP(0.55, 8, 6), MT(l ? '#B39A6E' : P.sand), Math.sin(a)*4.55, 0.25 + l*0.36, Math.cos(a)*4.55, 0, a, 0, true); sb.scale.set(1.15, 0.45, 0.7); }
      for (const z of [-1.2, 0.6]) add(g, B(6.6, 0.1, 0.4), wd, 0, 0.15, z, 0, 0.3);
      for (let i = 0; i < 6; i++) { const a = i/6*Math.PI*2 + 0.3; add(g, CY(0.08, 0.1, 1.2, 6), wd, Math.sin(a)*3.9, 0.6, Math.cos(a)*3.9); }
      add(g, CY(0.04, 0.04, 2.2, 6), MT(P.woodD), 3.6, 1.1, -2.6); add(g, PL(0.8, 0.55), clothM(team), 4.0, 1.95, -2.6);
      break;
    case 'arrowtower':
      for (const [x, z] of [[-1.1, -1.1], [1.1, -1.1], [-1.1, 1.1], [1.1, 1.1]]) add(g, B(0.3, 5.6, 0.3), wd, x, 2.8, z, z*0.03, 0, -x*0.03, true);
      for (const y of [1.6, 3.4]) { add(g, B(2.4, 0.12, 0.12), wd, 0, y, 1.1, 0, 0, 0.5); add(g, B(2.4, 0.12, 0.12), wd, 0, y, -1.1, 0, 0, -0.5); }
      add(g, B(3.4, 0.3, 3.4), wd, 0, 5.6, 0, 0, 0, 0, true);
      for (const [x, z, r] of [[0, 1.6, 0], [0, -1.6, 0], [1.6, 0, 1], [-1.6, 0, 1]]) add(g, B(r ? 0.1 : 3.4, 0.8, r ? 3.4 : 0.1), wd, x, 6.15, z);
      add(g, CO(2.7, 2.0, 4), roofM(team), 0, 7.9, 0, 0, Math.PI/4, 0, true);
      add(g, PL(1.4, 0.9), clothM(team), 0, 6.25, 1.66);
      { const bl = piv(g, 0, 6.3, 0); add(bl, B(0.3, 0.3, 1.5), MT(P.woodD), 0, 0, 0.2); add(bl, TU('ballista', [[-0.9, 0, 0.55], [0, 0, 0.85], [0.9, 0, 0.55]], 0.05, 10), MT(P.wood), 0, 0, 0); add(bl, CO(0.05, 0.5, 4), metal(P.steel), 0, 0, 1.15, Math.PI/2); g.userData.aim = bl; }
      break;
    case 'cheval':
      for (const off of [-1.4, 1.4]) {
        const s = piv(g, off, 0, 0); s.rotation.y = off*0.1;
        add(s, CY(0.22, 0.22, 2.6, 8), MT(P.woodD), 0, 0.85, 0, 0, 0, Math.PI/2, true);
        for (let i = -1; i <= 1; i++) { for (const a of [0.8, -0.8]) { add(s, CY(0.03, 0.1, 2.6, 5), wd, i*0.8, 0.85, 0, a); } add(s, CY(0.1, 0.02, 2.6, 5), wd, i*0.8 + 0.4, 0.85, 0, 0, 0, 0.8); }
      }
      add(g, B(5.6, 0.04, 2.2), MT('#3B2E1E'), 0, 0.02, 0);
      break;
    case 'barracks':
      add(g, CO(3.4, 4.2, 4), clothM(team), 0, 2.1, 0, 0, Math.PI/4, 0, true);
      add(g, B(1.1, 1.8, 0.05), MT('#1A1C20'), 0, 0.9, 2.38);
      add(g, CO(1.7, 2.3, 4), MT(P.cloth), 3.3, 1.15, -1.0, 0, Math.PI/4); add(g, CO(1.5, 2.0, 4), MT(P.cloth), -3.2, 1.0, -1.2, 0, Math.PI/4);
      add(g, CY(0.05, 0.05, 6.4, 6), MT(P.woodD), 0, 3.2, 0); add(g, PL(1.6, 1.1), clothM(team), 0.8, 5.9, 0);
      add(g, B(2.2, 0.1, 0.1), wd, -2.4, 1.2, 2.6); for (let i = 0; i < 4; i++) { add(g, CY(0.025, 0.025, 2.2, 5), wd, -3.2 + i*0.5, 1.1, 2.55, 0.12); add(g, CO(0.05, 0.22, 4), metal(P.steel), -3.2 + i*0.5, 2.25, 2.68, 0.12); }
      for (let i = 0; i < 4; i++) add(g, CY(0.08, 0.08, 0.9, 5), MT(P.woodD), 2.4, 0.1, 2.6, 0, i*0.8, Math.PI/2);
      { const f = add(g, CO(0.35, 0.9, 6), glow('#F29A3A', 1), 2.4, 0.55, 2.6); g.userData.flame = f; }
      break;
    case 'obelisk':
      add(g, CY(2.2, 2.4, 0.4, 4), rockM(), 0, 0.2, 0, 0, Math.PI/4, 0, true); add(g, CY(1.6, 1.8, 0.4, 4), MT(P.stone), 0, 0.6, 0, 0, Math.PI/4);
      add(g, CY(0.45, 0.85, 6.4, 4), MT('#3B3052', {m:0.2, r:0.4}), 0, 4.0, 0, 0, Math.PI/4, 0, true);
      for (let i = 0; i < 4; i++) { const a = i/4*Math.PI*2; for (let k = 0; k < 3; k++) add(g, B(0.18, 0.4, 0.04), glow('#C9A0FF', 0.9), Math.sin(a)*(0.62 - k*0.07), 2.4 + k*1.4, Math.cos(a)*(0.62 - k*0.07), 0, a); }
      { const c = add(g, OC(0.65), glow('#D9C2FF', 0.9), 0, 8.2, 0); add(g, TO(1.1, 0.04, Math.PI*2, 20), glow('#B892E0', 0.8), 0, 8.2, 0, Math.PI/2); g.userData.spin = c; }
      break;
    case 'banner':
      add(g, CY(0.09, 0.12, 7.6, 8), MT(P.woodD), 0, 3.8, 0, 0, 0, 0, true); add(g, B(2.6, 0.1, 0.1), MT(P.woodD), 1.2, 7.0, 0); add(g, OC(0.18), metal(P.gold), 0, 7.75, 0);
      { const fl = piv(g, 0.05, 7.0, 0); add(fl, PL(2.4, 3.6, 1, 4), clothM(team), 1.2, -1.8, 0); g.userData.flag = fl; }
      add(g, CY(0.8, 0.8, 1.0, 14), wd, -1.6, 0.9, 0.6, 0, 0, 0, true); add(g, CY(0.82, 0.82, 0.2, 14), MT(T), -1.6, 0.9, 0.6); add(g, CY(0.78, 0.78, 0.04, 14), MT(P.white), -1.6, 1.42, 0.6);
      for (const [x, z] of [[-2.2, 0.1], [-1.0, 0.1], [-1.6, 1.3]]) add(g, B(0.08, 0.5, 0.08), MT(P.woodD), x, 0.25, z);
      break;
    case 'watch':
      for (const [x, z] of [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]]) add(g, CY(0.14, 0.2, 10.4, 6), wd, x*0.85, 5.2, z*0.85, z*0.03, 0, -x*0.03, true);
      for (const y of [2.5, 5.5, 8.2]) { add(g, B(2.3, 0.1, 0.1), MT(P.woodD), 0, y, 1.0, 0, 0, 0.6); add(g, B(2.3, 0.1, 0.1), MT(P.woodD), 0, y, -1.0, 0, 0, -0.6); }
      add(g, B(3.2, 0.3, 3.2), wd, 0, 10.4, 0, 0, 0, 0, true);
      for (const [x, z, r] of [[0, 1.5, 0], [0, -1.5, 0], [1.5, 0, 1], [-1.5, 0, 1]]) add(g, B(r ? 0.1 : 3.2, 0.6, r ? 3.2 : 0.1), wd, x, 10.85, z);
      add(g, CO(2.5, 1.9, 4), roofM(team), 0, 12.6, 0, 0, Math.PI/4, 0, true);
      add(g, SP(0.28, 8, 6), glow('#FFD27A', 1), 1.3, 11.3, 1.3);
      for (const x of [-0.3, 0.3]) add(g, B(0.08, 10.4, 0.08), wd, x, 5.2, 1.35);
      for (let y = 0.8; y < 10; y += 0.9) add(g, B(0.65, 0.06, 0.06), wd, 0, y, 1.35);
      break;
    case 'trap':
      add(g, TO(2.1, 0.07, Math.PI*2, 28), glow('#C9A0FF', 0.9), 0, 0.08, 0, Math.PI/2); add(g, TO(1.35, 0.05, Math.PI*2, 24), glow('#B892E0', 0.8), 0, 0.08, 0, Math.PI/2);
      for (let i = 0; i < 3; i++) add(g, B(2.6, 0.03, 0.09), glow('#C9A0FF', 0.8), 0, 0.08, 0, 0, i*Math.PI/3);
      add(g, CY(2.1, 2.1, 0.04, 28), MT('#241A36', {op:0.75}), 0, 0.03, 0);
      for (let i = 0; i < 8; i++) { const a = i/8*Math.PI*2; add(g, CO(0.1, 0.5, 4), metal(P.steelD), Math.sin(a)*1.7, 0.2, Math.cos(a)*1.7); }
      break;
    case 'supply':
      add(g, B(1.3, 1.3, 1.3), wd, -1.3, 0.65, 0, 0, 0.2, 0, true); add(g, B(1.1, 1.1, 1.1), wd, -0.1, 0.55, 0.9, 0, -0.3); add(g, B(1.0, 1.0, 1.0), wd, -1.2, 1.8, 0.1, 0, 0.6);
      for (const [x, z] of [[1.3, -0.8], [1.9, 0.3], [0.9, 0.4]]) { add(g, LA('barrel', [[0.4, 0], [0.47, 0.25], [0.5, 0.5], [0.47, 0.75], [0.4, 1.0]], 12), wd, x, 0, z, 0, 0, 0, true); for (const y of [0.2, 0.8]) add(g, CY(0.48, 0.48, 0.05, 12), metal(P.steelD), x, y, z); }
      for (const [x, z] of [[0.2, -1.2], [0.9, -1.6]]) add(g, SP(0.5, 8, 6), MT(P.cloth), x, 0.35, z).scale.set(1, 0.7, 0.9);
      for (const [x, z] of [[-2.2, -1.8], [2.2, -1.8], [-2.2, 1.8], [2.2, 1.8]]) add(g, CY(0.06, 0.07, 2.8, 6), MT(P.woodD), x, 1.4, z);
      add(g, PL(4.8, 4.0), clothM(team), 0, 2.85, 0, -Math.PI/2 + 0.08, 0, 0);
      break;
  }
  g.traverse(o => { if (o.material) { o.material = o.material.clone(); o.material.transparent = true; } });
  return g;
}
// ---------- strongpoints, objectives ----------
function mkGranary() {
  const g = new THREE.Group(), wd = woodM();
  add(g, CY(6.5, 6.8, 0.3, 24), MT('#5A4A34'), 0, 0.15, 0);
  add(g, B(4.6, 3.0, 3.4), wd, -0.8, 1.5, 0, 0, 0, 0, true);
  const roof = add(g, CY(0.01, 2.6, 4.9, 4), MT('#7A3A2A'), -0.8, 3.6, 0, 0, 0, Math.PI/2, true); roof.rotation.y = Math.PI/4; roof.scale.set(1, 1, 0.9);
  add(g, B(1.4, 2.0, 0.1), MT(P.woodD), -0.8, 1.0, 1.72);
  for (const [x, z] of [[2.6, 1.2], [2.9, -1.0]]) { add(g, CO(1.0, 1.8, 10), MT('#C9A24A'), x, 0.9, z, 0, 0, 0, true); }
  for (let i = 0; i < 4; i++) add(g, SP(0.4, 8, 6), MT(P.cloth), 1.2 + i*0.35, 0.3, 2.2 - (i % 2)*0.4).scale.set(1, 0.7, 0.9);
  const flag = piv(g, -3.6, 0, 2.2); add(flag, CY(0.06, 0.06, 5, 6), MT(P.woodD), 0, 2.5, 0); const fm = add(flag, PL(1.6, 1.0), MT('#CFC6B2', {side:1}), 0.8, 4.4, 0); fm.material = fm.material.clone();
  g.userData.ownerMats = [fm.material];
  return g;
}
function mkBeacon() {
  const g = new THREE.Group();
  add(g, CY(6.5, 8.5, 2.2, 20), MT('#4E6B3A'), 0, 1.1, 0, 0, 0, 0, true);
  add(g, CY(4.2, 4.6, 0.6, 8), rockM(), 0, 2.5, 0, 0, 0, 0, true);
  for (let i = 0; i < 8; i++) { const a = i/8*Math.PI*2; add(g, B(0.8, 1.6, 0.8), rockM(), Math.sin(a)*3.9, 3.4, Math.cos(a)*3.9, 0, a); }
  add(g, CY(1.0, 0.7, 1.2, 10), metal(P.steelD), 0, 3.4, 0);
  const fl = add(g, CO(0.85, 2.2, 8), glow('#CFC6B2', 1), 0, 5.0, 0); fl.material = fl.material.clone();
  g.userData.flame = fl; g.userData.ownerMats = [fl.material];
  return g;
}
function mkTitan() {
  const g = new THREE.Group(), rk = rockM(), rune = glow('#6FE0E8', 0.9);
  const bd = piv(g, 0, 0, 0);
  add(bd, DO(2.4, 0), rk, 0, 5.2, 0, 0.3, 0.2, 0, true).scale.set(1.2, 1, 0.9);
  add(bd, DO(1.6, 0), rk, 0, 3.0, 0, 0.5, 0.1, 0.2, true);
  add(bd, DO(1.1, 0), rk, 0, 7.6, 0.4, 0.2, 0.6, 0, true);
  for (const s of [-1, 1]) { add(bd, SP(0.18, 6, 5), rune, s*0.4, 7.7, 1.3); }
  for (let i = 0; i < 5; i++) add(bd, B(0.12, 0.6, 0.06), rune, -0.8 + i*0.4, 5.3 + (i % 2)*0.3, 2.05, 0, 0, i*0.3);
  const arms = [];
  for (const s of [-1, 1]) { const a = piv(bd, s*2.8, 6.0, 0); add(a, DO(1.0, 0), rk, 0, -0.6, 0, 0, 0, 0, true); add(a, DO(0.9, 0), rk, 0, -2.0, 0.2, 0.4, 0, 0, true); add(a, DO(1.2, 0), rk, 0, -3.4, 0.4, 0.2, 0.3, 0, true); add(a, B(0.1, 0.7, 0.06), rune, 0, -2.0, 1.0); arms.push(a); }
  for (const s of [-1, 1]) { add(g, DO(1.0, 0), rk, s*1.2, 1.2, 0, 0, 0, 0, true); }
  for (let i = 0; i < 6; i++) add(bd, SP(0.5, 6, 4), MT('#4F6B3A'), Math.sin(i)*2, 6.6 + Math.cos(i)*0.8, -0.8).scale.set(1, 0.4, 1);
  g.userData.arms = arms; g.userData.base = {aL:0, aR:0}; g.userData.armR = arms[1];
  return g;
}
function mkDragon() {
  const g = new THREE.Group(), sc = MT('#3A1418', {m:0.2, r:0.5}), belly = MT('#8A4A2A'), horn = MT('#E8DCC0'), eye = glow('#FFB040', 1);
  const bd = piv(g, 0, 0, 0);
  add(bd, LA('dbody', [[0, -3], [1.2, -2.4], [1.7, -0.8], [1.8, 0.6], [1.4, 2.0], [0, 2.8]], 14), sc, 0, 3.4, 0, Math.PI/2, 0, 0, true);
  add(bd, LA('dbelly', [[0, -2.2], [1.2, -1.2], [1.3, 0.6], [0.9, 1.8], [0, 2.2]], 12), belly, 0, 2.6, 0.2, Math.PI/2, 0, 0).scale.set(1, 1, 0.6);
  add(bd, TU('dneck', [[0, 4.2, 2.2], [0, 5.4, 3.4], [0, 6.6, 4.0], [0, 7.2, 4.8]], 0.75, 12), sc, 0, 0, 0);
  const head = piv(bd, 0, 7.3, 5.2);
  add(head, LA('dhead', [[0.7, 0], [0.75, 0.6], [0.55, 1.4], [0.3, 2.0], [0, 2.1]], 10), sc, 0, 0, 0, Math.PI/2, 0, 0, true);
  add(head, B(0.9, 0.25, 1.6), belly, 0, -0.45, 0.9, 0.15);
  for (const s of [-1, 1]) { add(head, SP(0.14, 6, 5), eye, s*0.42, 0.3, 0.9); add(head, TU('dhorn' + s, [[s*0.4, 0.4, 0], [s*0.7, 0.9, -0.6], [s*0.8, 1.2, -1.4]], 0.11, 8), horn, 0, 0, 0); }
  for (let i = 0; i < 4; i++) add(head, CO(0.07, 0.25, 4), horn, -0.3 + i*0.2, -0.45, 1.6, Math.PI);
  for (let i = 0; i < 9; i++) add(bd, CO(0.25, 0.7, 4), horn, 0, 5.0 - Math.abs(i - 3)*0.15, 2.0 - i*0.6, -0.4);
  add(bd, TU('dtail', [[0, 3.2, -2.8], [0.6, 2.4, -4.5], [-0.4, 1.4, -6.2], [0.3, 0.8, -8.0]], 0.55, 16), sc, 0, 0, 0);
  add(bd, CO(0.6, 1.4, 4), horn, 0.3, 0.8, -8.6, -Math.PI/2);
  const legs = [];
  for (const [x, z] of [[-1.3, 1.4], [1.3, 1.4], [-1.3, -1.4], [1.3, -1.4]]) { const l = piv(bd, x, 2.6, z); add(l, CY(0.55, 0.4, 2.0, 8), sc, 0, -1.0, 0, 0, 0, 0, true); add(l, CO(0.5, 0.6, 5), horn, 0, -2.2, 0.35, Math.PI/2); legs.push(l); }
  const wings = [];
  for (const s of [-1, 1]) {
    const w = piv(bd, s*1.4, 5.0, 0.6);
    add(w, TU('dwarm' + s, [[0, 0, 0], [s*2.6, 1.6, -0.4], [s*5.6, 2.2, -1.2]], 0.16, 8), sc, 0, 0, 0);
    const mem = add(w, SH('dwing', s2 => { s2.moveTo(0, 0); s2.lineTo(5.6, 2.2); s2.quadraticCurveTo(5.2, -0.6, 4.6, -2.6); s2.quadraticCurveTo(3.4, -1.4, 2.4, -3.0); s2.quadraticCurveTo(1.4, -1.8, 0.2, -2.6); s2.lineTo(0, 0); }), MT('#ffffff', {map:TX.wing(), side:1, r:0.7}), 0, 0, -0.4, Math.PI/2, 0, 0);
    mem.scale.set(s, 1, 1); wings.push(w);
  }
  g.userData.legs = legs; g.userData.wings = wings; g.userData.head = head;
  return g;
}
function setOpacity(g, v) { g.traverse(o => { if (o.material && o.material.transparent) o.material.opacity = v; }); }
function ring(r1, r2, color, op = 0.6) {
  const o = new THREE.Mesh(new THREE.RingGeometry(r1, r2, 48), new THREE.MeshBasicMaterial({color, transparent:true, opacity:op, depthWrite:false, side:THREE.DoubleSide}));
  o.rotation.x = -Math.PI/2; o.position.y = 0.12; return o;
}
function disc(r, color, op = 0.25) {
  const o = new THREE.Mesh(new THREE.CircleGeometry(r, 48), new THREE.MeshBasicMaterial({color, transparent:true, opacity:op, depthWrite:false}));
  o.rotation.x = -Math.PI/2; o.position.y = 0.1; return o;
}

// ---------- animation ----------
function animModel(m, moving, t, atk, cmd) {
  const u = m.userData; if (!u) return;
  const sw = moving ? Math.sin(t*9) : 0;
  if (u.legs) u.legs.forEach((l, i) => { l.rotation.x = (u.legs.length === 4 ? ((i === 0 || i === 3) ? sw : -sw) : (i ? sw : -sw)) * 0.55; });
  if (u.arms && u.base) { u.arms[0].rotation.x = u.base.aL + (moving ? -sw*0.3 : 0); }
  if (u.armR && u.base) u.armR.rotation.x = cmd > 0 ? -2.6 : atk > 0 ? u.base.aR - Math.sin((1 - atk/0.35)*Math.PI)*1.3 : u.base.aR + (moving ? sw*0.3 : 0);
  if (u.wings) { const f = Math.sin(t*(u.legs && u.legs.length === 4 && u.head ? 3 : 7))*0.5; u.wings[0].rotation.z = f; u.wings[1].rotation.z = -f; }
  if (u.hover) u.hover.position.y = 3.6 + Math.sin(t*2.2)*0.25;
  if (u.head) u.head.rotation.x = Math.sin(t*1.3)*0.1 - (atk > 0 ? 0.3 : 0);
  if (u.wheels && moving) u.wheels.forEach(w => w.rotation.x += 0.12);
  if (u.arm) u.arm.rotation.x = atk > 0 ? 0.75 - Math.sin((1 - atk/0.35)*Math.PI)*1.6 : 0.75;
  if (u.spin) u.spin.rotation.y += 0.02;
  if (u.halo) u.halo.rotation.z += 0.03;
  if (u.orb) u.orb.position.y = 0.25 + Math.sin(t*3)*0.08;
  if (u.cape) u.cape.rotation.x = 0.12 + (moving ? 0.35 : 0.05*Math.sin(t*2));
  if (u.flag) u.flag.rotation.y = Math.sin(t*2.5)*0.25;
  if (u.flame) u.flame.scale.set(1 + Math.sin(t*17)*0.08, 0.85 + Math.sin(t*13)*0.15, 1 + Math.cos(t*15)*0.08);
}

// ---------- draw-call reduction: merge static leaf meshes that share a parent and material ----------
const BAKE = new Map();
function mergeGeo(list) {
  try {
    const pos = [], nor = [], uv = [];
    for (const ch of list) {
      const g = ch.geometry, P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv;
      if (!P || !N) return null;
      const idx = g.index ? g.index.array : null, cnt = idx ? idx.length : P.count;
      const e = ch.matrix.elements;
      const a00 = e[0], a01 = e[4], a02 = e[8], a10 = e[1], a11 = e[5], a12 = e[9], a20 = e[2], a21 = e[6], a22 = e[10];
      const c00 = a11*a22 - a12*a21, c01 = -(a10*a22 - a12*a20), c02 = a10*a21 - a11*a20;
      const c10 = -(a01*a22 - a02*a21), c11 = a00*a22 - a02*a20, c12 = -(a00*a21 - a01*a20);
      const c20 = a01*a12 - a02*a11, c21 = -(a00*a12 - a02*a10), c22 = a00*a11 - a01*a10;
      const det = a00*c00 + a01*c01 + a02*c02; if (!det) return null;
      const flip = det < 0;
      for (let i = 0; i + 2 < cnt; i += 3) {
        const tri = idx ? [idx[i], idx[i + 1], idx[i + 2]] : [i, i + 1, i + 2];
        if (flip) { const t = tri[1]; tri[1] = tri[2]; tri[2] = t; }
        for (const v of tri) {
          const x = P.getX(v), y = P.getY(v), z = P.getZ(v);
          pos.push(a00*x + a01*y + a02*z + e[12], a10*x + a11*y + a12*z + e[13], a20*x + a21*y + a22*z + e[14]);
          const nx = N.getX(v), ny = N.getY(v), nz = N.getZ(v);
          let X = (c00*nx + c01*ny + c02*nz)/det, Y = (c10*nx + c11*ny + c12*nz)/det, Z = (c20*nx + c21*ny + c22*nz)/det;
          const L = Math.hypot(X, Y, Z) || 1; nor.push(X/L, Y/L, Z/L);
          if (U) uv.push(U.getX(v), U.getY(v)); else uv.push(0, 0);
        }
      }
    }
    if (!pos.length) return null;
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    return out;
  } catch (err) { return null; }
}
function bake(root) {
  try {
    const refs = new Set();
    root.traverse(o => { const u = o.userData; if (!u) return; for (const k in u) { const v = u[k]; if (v && v.isObject3D) refs.add(v); else if (Array.isArray(v)) for (const x of v) if (x && x.isObject3D) refs.add(x); } });
    const nodes = []; root.traverse(o => nodes.push(o));
    for (const par of nodes) {
      const groups = new Map();
      for (const ch of par.children) {
        if (!ch.isMesh || ch.isInstancedMesh || ch.isSkinnedMesh || ch.children.length || refs.has(ch) || !ch.visible || Array.isArray(ch.material) || !ch.geometry || !ch.geometry.attributes || !ch.geometry.attributes.position) continue;
        const key = ch.material.uuid + (ch.castShadow ? 's' : '') + (ch.receiveShadow ? 'r' : '');
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(ch);
      }
      for (const list of groups.values()) {
        if (list.length < 2) continue;
        for (const ch of list) ch.updateMatrix();
        const sig = list.map(ch => ch.geometry.uuid + ':' + Array.from(ch.matrix.elements, v => v.toFixed(4)).join(',')).join('|');
        let geo = BAKE.get(sig);
        if (!geo) { geo = mergeGeo(list); if (!geo) continue; BAKE.set(sig, geo); }
        const m = new THREE.Mesh(geo, list[0].material); m.castShadow = list[0].castShadow; m.receiveShadow = list[0].receiveShadow;
        for (const ch of list) par.remove(ch);
        par.add(m);
      }
    }
  } catch (err) { if (typeof console !== 'undefined') console.warn('bake', err); }
  return root;
}

// ===================== imported art (glTF) with procedural fallback =====================
const ART = {ready:false, failed:false, progress:0, units:{}, clips:{}, world:{}, unitMat:[null, null], worldMat:{}, waiters:[], sitPelvis:[0.003, 0.542, -0.331]};
const ART_BASE = 'assets/';
const CMD_VAR = {valen:'C_valen', sylvie:'C_sylvie', orion:'C_orion', gru:'C_gru', brand:'C_brand', raven:'C_raven'};
const UNIT_VAR = {pike:'S_pike', shield:'S_shield', archer:'S_archer', mage:'S_mage', scout:'S_scout', priest:'S_priest'};
// faction squads and mercenaries reuse the imported bodies with their own tint, size and trimmings
const UNIT_SKIN = {
  templar:{v:'S_shield', tint:'#FFE9B8', em:'#1A1408', sc:1.1, halo:true},
  longbow:{v:'S_archer', tint:'#D4ECC4', sc:1.06},
  revenant:{v:'M_melee', tint:'#B8C8DC', em:'#2A1846', op:0.84, sc:0.98},
  necro:{v:'S_mage', tint:'#8A72A8', em:'#22083A'},
  dwarf:{v:'S_shield', tint:'#D8B088', sx:1.2, sy:0.8},
  berserk:{v:'C_gru', tint:'#F0B0A0', sc:0.95, solo:true},
  xbow:{v:'S_archer', tint:'#B8C098', sc:1.02}
};
const TINT = {};
function tintMat(team, key) {
  const k = team + key; if (TINT[k]) return TINT[k];
  const S = UNIT_SKIN[key], b = ART.unitMat[team];
  return (TINT[k] = new THREE.MeshLambertMaterial({map:b.map, skinning:true, side:THREE.DoubleSide, color:S.tint, emissive:S.em || '#000000', transparent:!!S.op, opacity:S.op || 1, depthWrite:!S.op}));
}
const HALO_GEO = new THREE.TorusGeometry(0.22, 0.035, 6, 20), HALO_MAT = new THREE.MeshBasicMaterial({color:'#FFE6A0'});
function skinned(type, team) {
  const S = UNIT_SKIN[type], c = artChar(S.v, team, ART_SC*(S.sc || 1), true); if (!c) return null;
  c.art.role = ROLE[S.v] === 'cmd' ? 'melee' : (ROLE[S.v] || 'melee');
  const mat = tintMat(team, type);
  c.obj.traverse(o => { if (o.isSkinnedMesh) o.material = mat; });
  if (S.sx) c.obj.scale.set(ART_SC*S.sx, ART_SC*S.sy, ART_SC*S.sx);
  if (S.halo) { const h = new THREE.Mesh(HALO_GEO, HALO_MAT); h.rotation.x = Math.PI/2; h.position.y = 2.08; c.obj.add(h); }
  return c;
}
const ART_SC = 1.75;   // imported characters are ~1.87 m tall; game commanders stand ~3.2 units
const ROLE = {C_valen:'cmd', C_sylvie:'cmd', C_orion:'cmd', C_gru:'cmd', C_brand:'cmd', C_raven:'cmd', S_pike:'spear', S_shield:'melee', S_scout:'melee', M_melee:'melee', S_archer:'bow', M_ranged:'bow', S_mage:'caster', S_priest:'caster', S_rider:'rider'};
function loadArt() {
  if (!(THREE.GLTFLoader && THREE.SkeletonUtils) || typeof fetch === 'undefined') { ART.failed = true; return Promise.resolve(false); }
  const files = ['units.json', 'anims.json', 'world.json', 'units_blue.jpg', 'units_red.jpg'], prog = files.map(() => 0), total = [9.0, 0.84, 5.9, 0.51, 0.5];
  const tick = () => { ART.progress = prog.reduce((s, p, i) => s + p*total[i], 0)/total.reduce((a, b) => a + b, 0); };
  // single-file builds (itch.io) carry the art inside the page as <script type="text/plain" id="art:FILE">
  const emb = f => { try { const el = document.getElementById('art:' + f), t = el && el.textContent; return typeof t === 'string' && t.length > 16 ? t : null; } catch (e) { return null; } };
  const gl = (f, i) => new Promise((res, rej) => { const E = emb(f); if (E) { setTimeout(() => { try { new THREE.GLTFLoader().parse(E, '', g => { prog[i] = 1; tick(); res(g); }, rej); } catch (e) { rej(e); } }, 30*i); return; } new THREE.GLTFLoader().load(ART_BASE + f, g => { prog[i] = 1; tick(); res(g); }, e => { if (e && e.total) { prog[i] = e.loaded/e.total; tick(); } }, rej); });
  const tx = (f, i) => new Promise((res, rej) => new THREE.TextureLoader().load(emb(f) || ART_BASE + f, t => { t.flipY = false; t.anisotropy = 4; prog[i] = 1; tick(); res(t); }, undefined, rej));
  const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('art timeout')), 45000));
  return Promise.race([Promise.all([gl(files[0], 0), gl(files[1], 1), gl(files[2], 2), tx(files[3], 3), tx(files[4], 4)]), timeout]).then(([u, a, w, tb, tr]) => {
    ART.unitMat = [tb, tr].map(t => new THREE.MeshLambertMaterial({map:t, skinning:true, side:THREE.DoubleSide}));   // double-sided: cloth layers and collars have no inner faces
    // GLTFLoader de-duplicates node names (pelvis -> pelvis_1 ...); restore them so clips bind to every skeleton
    const BONES = new Set(); a.scene.traverse(o => { if (o.isBone || o.type === 'Bone' || o.name) BONES.add(o.name); });
    for (const c of u.scene.children) {
      c.traverse(o => { const m = /^(.*)_(\d+)$/.exec(o.name); if (m && !BONES.has(o.name) && BONES.has(m[1])) o.name = m[1]; });
      c.traverse(o => { if (o.isSkinnedMesh) { const g = o.geometry; g.computeBoundingSphere(); g.boundingSphere.radius *= 1.6; } });
      ART.units[c.name] = c;
    }
    for (const c of a.animations) ART.clips[c.name] = c;
    for (const c of w.scene.children) {
      c.traverse(o => {
        if (!o.isMesh) return;
        const k = o.material.name || 'm';
        if (!ART.worldMat[k]) { const map = o.material.map; if (map) map.encoding = THREE.LinearEncoding; ART.worldMat[k] = new THREE.MeshLambertMaterial({map, color:0xb8b8b8}); }
        o.material = ART.worldMat[k]; o.castShadow = true; o.receiveShadow = true;
      });
      ART.world[c.name] = c;
    }
    ART.ready = true; ART.progress = 1;
    const ws = ART.waiters; ART.waiters = []; ws.forEach(f => f());
    return true;
  }).catch(err => { console.warn('art load failed, using procedural models', err); ART.failed = true; const ws = ART.waiters; ART.waiters = []; ws.forEach(f => f()); return false; });
}
function whenArt(f) { if (ART.ready || ART.failed) f(); else ART.waiters.push(f); }
// --- instancing ---
function artChar(variant, team, scale = ART_SC, troop) {
  const src = ART.units[variant]; if (!src) return null;
  const obj = THREE.SkeletonUtils.clone(src);
  const cmdr = variant[0] === 'C' && !troop;
  obj.traverse(o => { if (o.isSkinnedMesh) { o.material = ART.unitMat[team]; o.castShadow = cmdr; o.frustumCulled = false; } });
  obj.scale.setScalar(scale);
  if (!cmdr) { const b = new THREE.Mesh(BLOB_GEO, BLOB_MAT); b.rotation.x = -Math.PI/2; b.position.y = 0.04/scale; b.scale.setScalar(0.42); b.renderOrder = 1; obj.add(b); }   // soft contact shadow instead of a shadow-map pass for every soldier
  const mixer = new THREE.AnimationMixer(obj);
  return {obj, art:{mixer, role:ROLE[variant] || 'melee', cur:null, curName:'', lastT:null, lastAtk:0, lastCmd:0, oneShot:null}};
}
const BLOB_GEO = new THREE.CircleGeometry(1, 20), BLOB_MAT = new THREE.MeshBasicMaterial({color:0x000000, transparent:true, opacity:0.32, depthWrite:false});
const LIFT = {};
function artWorld(key, scale = 1) {
  const src = ART.world[key]; if (!src) return null;
  const o = src.clone(); o.scale.setScalar(scale);
  // some models dip below their origin (the catapult's wheels): stand them on the ground
  if (LIFT[key] === undefined) { o.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(o); LIFT[key] = isFinite(bb.min.y) && bb.min.y < -0.005*scale ? -bb.min.y/scale : 0; }
  if (!LIFT[key]) return o;
  const g = new THREE.Group(); o.position.y = LIFT[key]*scale; g.add(o); return g;
}
// --- animation: locomotion blend (idle / walk / run / sprint) + one-shot layer ---
// ground speed (game units/s) at which each loop's feet stop sliding, for ART_SC-scaled characters
const LOCO_REF = {walk:1.9, run:5.4, sprint:8.5};
function artPlay(A, name, fade = 0.18, once = false) {   // used for riders only (single looping clip)
  const clip = ART.clips[name]; if (!clip) return;
  if (A.curName === name) return;
  const act = A.mixer.clipAction(clip); act.reset(); act.setLoop(THREE.LoopRepeat, Infinity); act.time = Math.random()*clip.duration; act.play();
  if (A.cur && A.cur !== act) act.crossFadeFrom(A.cur, fade, false);
  A.cur = act; A.curName = name;
}
function locoInit(A) {
  const L = {};
  for (const n of ['idle', 'swordIdle', 'walk', 'run', 'sprint']) {
    const c = ART.clips[n]; if (!c) continue;
    const a = A.mixer.clipAction(c); a.setLoop(THREE.LoopRepeat, Infinity); a.time = Math.random()*c.duration; a.enabled = true; a.setEffectiveWeight(0); a.play();
    L[n] = {a, w:0};
  }
  A.loco = L; A.idleName = A.role === 'melee' && L.swordIdle ? 'swordIdle' : 'idle';
  if (L[A.idleName]) { L[A.idleName].w = 1; L[A.idleName].a.setEffectiveWeight(1); }
  A.os = null; A.mvOn = false;
}
function artShot(A, name) {
  const clip = ART.clips[name]; if (!clip) return;
  const a = A.mixer.clipAction(clip);
  if (A.os && A.os.a !== a) A.os.a.stop();
  a.reset(); a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; a.enabled = true; a.setEffectiveWeight(0); a.play();
  A.os = {a, t:0, dur:clip.duration*0.85};
}
function artAnim(A, moving, t, atk, cmd, spd) {
  const dt = A.lastT === null ? 0 : Math.max(0, Math.min(0.1, t - A.lastT)); A.lastT = t;
  if (A.dead) { A.mixer.update(dt); return; }
  if (A.role === 'rider') { artPlay(A, 'sit'); A.mixer.update(dt); return; }
  if (!A.loco) locoInit(A);
  const r = A.role, L = A.loco;
  const newAtk = atk > A.lastAtk + 0.02; A.lastAtk = atk;
  const newCmd = cmd > A.lastCmd + 0.02; A.lastCmd = cmd;
  if (newCmd) artShot(A, 'cast');
  else if (newAtk) artShot(A, r === 'bow' ? 'shoot' : r === 'caster' || r === 'cmd' ? 'cast' : 'attack');
  // speed with hysteresis so a squad settling into formation does not flicker between run and idle
  const sp = spd === undefined ? (moving ? 6 : 0) : spd;
  A.mvOn = A.mvOn ? sp > 0.55 : sp > 1.3;
  const tn = !A.mvOn ? A.idleName : sp < 3.2 ? 'walk' : sp < 7.5 ? 'run' : 'sprint';
  if (L.walk) L.walk.a.timeScale = Math.min(1.5, Math.max(0.7, sp/LOCO_REF.walk));
  if (L.run) L.run.a.timeScale = Math.min(1.45, Math.max(0.75, sp/LOCO_REF.run));
  if (L.sprint) L.sprint.a.timeScale = Math.min(1.3, Math.max(0.8, sp/LOCO_REF.sprint));
  let osW = 0;
  if (A.os) {
    const o = A.os; o.t += dt;
    if (o.t >= o.dur) { o.a.stop(); A.os = null; }
    else { osW = Math.max(0, Math.min(1, o.t/0.08, (o.dur - o.t)/0.15)); o.a.setEffectiveWeight(osW); }
  }
  const k = Math.min(1, dt*7);
  for (const n in L) { const e = L[n]; e.w += ((n === tn ? 1 : 0) - e.w)*k; e.a.setEffectiveWeight(e.w*(1 - osW)); }
  A.mixer.update(dt);
}
// --- builders (same signatures as the procedural ones) ---
const PROC = {mkCommander, mkSoldier, mkMinion, mkTower, mkCore, mkBuilding, animModel};
function wrapChar(c) { const g = new THREE.Group(); g.add(c.obj); g.userData.art = c.art; return g; }
function artRider(root, scaleRel) {
  // swap the procedural rider for an imported one sitting in the saddle
  let h = root.userData.armR; while (h && h.parent && h.parent !== root && !(h.userData && h.userData.base)) h = h.parent;
  if (!h || !h.parent || h === root || !(h.userData && h.userData.base)) return root;
  const par = h.parent, sc = 1.39*scaleRel*h.scale.x, c = artChar('S_rider', root.userData.team || 0, sc); if (!c) return root;
  const tgt = h.position.clone(); tgt.y += 1.2*h.scale.y; tgt.z += 0.05;
  c.obj.position.set(tgt.x - ART.sitPelvis[0]*sc, tgt.y - ART.sitPelvis[1]*sc, tgt.z - ART.sitPelvis[2]*sc);
  par.remove(h); par.add(c.obj); root.userData.artRider = c.art; root.userData.armR = null;
  return root;
}
mkCommander = function (key, team) {
  if (!ART.ready) return PROC.mkCommander(key, team);
  const c = artChar(CMD_VAR[key], team, ART_SC*1.04); if (!c) return PROC.mkCommander(key, team);
  return wrapChar(c);
};
mkSoldier = function (type, team) {
  const mdl = (typeof UNITS !== 'undefined' && UNITS[type] && UNITS[type].mdl) || type;
  if (!ART.ready) return PROC.mkSoldier(mdl, team);
  if (UNIT_SKIN[type]) { const c = skinned(type, team); if (c) return wrapChar(c); return PROC.mkSoldier(mdl, team); }
  if (UNIT_VAR[type]) { const c = artChar(UNIT_VAR[type], team); if (c) return wrapChar(c); }
  if (type === 'cav' || type === 'griffin') { const r = PROC.mkSoldier(type, team); r.userData.team = team; return artRider(r, 1); }
  if (type === 'siege') {
    const g = new THREE.Group(), m = artWorld('catapult', 2.3); if (!m) return PROC.mkSoldier(type, team);
    m.rotation.y = -Math.PI/2; g.add(m);
    const fl = artWorld(team ? 'flag_r' : 'flag_b', 5); if (fl) { fl.position.set(0.6, 1.6, -1.2); g.add(fl); }
    return g;
  }
  return PROC.mkSoldier(mdl, team);
};
mkMinion = function (team, ranged, sup, guard) {
  if (!ART.ready) return PROC.mkMinion(team, ranged, sup, guard);
  const v = guard || sup ? 'S_shield' : ranged ? 'M_ranged' : 'M_melee';
  const c = artChar(v, team, ART_SC*(guard ? 1.25 : sup ? 1.15 : 1)); if (!c) return PROC.mkMinion(team, ranged, sup, guard);
  return wrapChar(c);
};
mkTower = function (team, tier) {
  if (!ART.ready) return PROC.mkTower(team, tier);
  const k = ['towerA', 'towerB', 'towerCat'][Math.min(2, tier)] + (team ? '_r' : '_b'), m = artWorld(k, 4.6 + tier*0.35);
  if (!m) return PROC.mkTower(team, tier);
  const g = new THREE.Group(); m.rotation.y = team ? Math.PI*0.75 : -Math.PI*0.25; g.add(m);
  const rg = ring(2.9, 3.3, team ? TEAM[1] : TEAM[0], 0.45); g.add(rg);
  return g;
};
mkCore = function (team) {
  if (!ART.ready) return PROC.mkCore(team);
  const m = artWorld('castle' + (team ? '_r' : '_b'), 4.6); if (!m) return PROC.mkCore(team);
  const g = new THREE.Group(); m.rotation.y = team ? Math.PI*0.75 : -Math.PI*0.25; g.add(m);
  g.add(ring(6.2, 6.9, team ? TEAM[1] : TEAM[0], 0.5));
  for (const [x, z] of [[-6.5, -6.5], [6.5, -6.5], [-6.5, 6.5], [6.5, 6.5]]) { const f = artWorld(team ? 'flag_r' : 'flag_b', 9); if (f) { f.position.set(x, 0, z); g.add(f); } }
  return g;
};
const BLD_ART = {arrowtower:['towerA', 2.1], barracks:['barracks', 2.9], watch:['towerB', 1.9], supply:['market', 2.7]};
mkBuilding = function (type, team) {
  if (!ART.ready || !BLD_ART[type]) return PROC.mkBuilding(type, team);
  const [k, s] = BLD_ART[type], m = artWorld(k + (team ? '_r' : '_b'), s); if (!m) return PROC.mkBuilding(type, team);
  const g = new THREE.Group(); g.add(m);
  if (type === 'supply') { const t1 = artWorld('tent', 4); if (t1) { t1.position.set(2.2, 0, -1.6); g.add(t1); } for (let i = 0; i < 3; i++) { const b = artWorld(i % 2 ? 'barrel' : 'crate', 4.2); if (b) { b.position.set(-2.2 + i*0.7, 0, 1.9); g.add(b); } } }
  if (type === 'barracks') { const w = artWorld('weaponrack', 5); if (w) { w.position.set(2.4, 0, 1.2); g.add(w); } }
  // per-building material copies so construction transparency does not leak to other buildings
  g.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; } });
  return g;
};
animModel = function (m, moving, t, atk, cmd, spd) {
  const u = m.userData;
  if (u && u.art) { artAnim(u.art, moving, t, atk, cmd, spd); return; }
  PROC.animModel(m, moving, t, atk, cmd);
  if (u && u.artRider) artAnim(u.artRider, moving, t, atk, cmd);
};
// --- death animation: keep the body on the field for a moment ---
const CORPSES = [];
function artCorpse(e) {
  const A = e.mesh && e.mesh.userData.art;
  if (!A) {   // procedural models (riders, siege, fallback art): topple over, then sink
    if (!e.mesh || !e.mesh.visible || !(e.kind === 'sol' || e.kind === 'min') || CORPSES.length > 80) return false;
    CORPSES.push({m:e.mesh, proc:true, t:0, y0:e.mesh.position.y, side:Math.random() < 0.5 ? -1 : 1});
    return true;
  }
  if (!e.mesh.visible) return false;
  A.dead = true;
  if (A.loco) for (const n in A.loco) A.loco[n].a.fadeOut(0.12);
  if (A.os) { A.os.a.fadeOut(0.12); A.os = null; }
  if (A.cur) A.cur.fadeOut(0.12);
  const clip = ART.clips.death;
  if (clip) { const d = A.mixer.clipAction(clip); d.reset(); d.setLoop(THREE.LoopOnce, 1); d.clampWhenFinished = true; d.setEffectiveWeight(1); d.fadeIn(0.12); d.play(); }
  CORPSES.push({m:e.mesh, A, t:0, y0:e.mesh.position.y});
  return true;
}
function artTick(dt) {
  for (let i = CORPSES.length - 1; i >= 0; i--) {
    const c = CORPSES[i]; c.t += dt;
    if (c.proc) { const k = Math.min(1, c.t/0.4); c.m.rotation.z = c.side*k*k*Math.PI*0.5; c.m.position.y = c.y0 + Math.sin(k*Math.PI)*0.3; }
    else c.A.mixer.update(dt);
    if (c.t > 2.2) c.m.position.y = c.y0 - (c.t - 2.2)*0.9;
    if (c.t > 3.6) { c.m.parent && c.m.parent.remove(c.m); CORPSES.splice(i, 1); }
  }
}
// --- scenery from the packs: hamlets behind each base and a mountain rim ---
function artScenery(scene) {
  if (!ART.ready) return;
  // the camera sits south (+z) of what it looks at, so anything south of the arena must stay low enough
  // not to hide the battlefield; nothing may stand inside the arena itself
  const bb = new THREE.Box3();
  const put = (k, x, z, s, ry = 0) => {
    const o = artWorld(k, s); if (!o) return null;
    o.position.set(x, 0, z); o.rotation.y = ry; o.updateMatrixWorld(true); bb.setFromObject(o);
    if (bb.min.x < 99 && bb.max.x > -99 && bb.min.z < 99 && bb.max.z > -99) return null;
    if (bb.max.z > 92) {
      const lim = 1.25*(bb.min.z - 99);
      if (bb.max.y > lim) { if (lim < 1.5) return null; o.scale.multiplyScalar(lim/bb.max.y); }
    }
    o.traverse(m => { if (m.isMesh) m.castShadow = false; });
    scene.add(o); return o;
  };
  for (const t of [0, 1]) {
    const sx = t ? 1 : -1, sz = t ? -1 : 1, c = t ? '_r' : '_b', face = t ? Math.PI*0.75 : -Math.PI*0.25;
    // village outside the corner of the play area, facing the battlefield
    const spots = [['tavern', 108, 112, 6.5], ['church', 122, 100, 6.5], ['smith', 100, 124, 6.5], ['archery', 132, 118, 5.5], ['home', 116, 132, 6], ['home', 136, 104, 6], ['windmill', 128, 136, 6.5], ['well', 114, 118, 5]];
    for (const [k, x, z, s] of spots) put(k + c, sx*x, sz*z, s, face + (x - z)*0.01);
    for (let i = 0; i < 6; i++) put('tent', sx*(104 + i*5.5), sz*(104 - (i % 2)*3), 6, face + i*0.4);
    for (let i = 0; i < 8; i++) put(i % 3 ? 'barrel' : 'crate', sx*(103 + (i*7) % 22), sz*(108 + (i*5) % 16), 6, i);
    put('weaponrack', sx*106, sz*103, 7, face); put('target', sx*112, sz*103, 7, face); put('target', sx*117, sz*104, 7, face);
    for (let i = 0; i < 4; i++) put(t ? 'flag_r' : 'flag_b', sx*(102 + i*9), sz*101, 9, face);
  }
  // mountain rim around the arena
  for (let i = 0; i < 40; i++) {
    const a = i/40*Math.PI*2, R = 150 + (i % 3)*9, x = Math.cos(a)*R, z = Math.sin(a)*R;
    if (Math.abs(Math.abs(x) - Math.abs(z)) < 30 && Math.abs(x) > 95) continue;   // leave the village corners open
    put(i % 4 === 0 ? 'mountainB' : 'mountainA', x, z, 22 + (i % 5)*3, a*3);
  }
  for (let i = 0; i < 26; i++) {
    const a = i/26*Math.PI*2 + 0.1, R = 122 + (i % 4)*4, x = Math.cos(a)*R, z = Math.sin(a)*R;
    if (Math.abs(Math.abs(x) - Math.abs(z)) < 34 && Math.abs(x) > 85) continue;
    put(i % 2 ? 'hills' : 'treesBL', x, z, 12 + (i % 3)*2, a*2);
  }
}

const GD = {"G": {"valen": "<path d=\"M24 5 L39 10 V22 C39 32 32.5 38.5 24 43 C15.5 38.5 9 32 9 22 V10 Z\"></path><path d=\"M16.5 31 V18 H19.5 V21 H22.5 V18 H25.5 V21 H28.5 V18 H31.5 V31 Z\"></path><path d=\"M22 31 V27.5 A2 2 0 0 1 26 27.5 V31\"></path>", "sylvie": "<path d=\"M15 6 Q36 24 15 42\"></path><path class=\"t\" d=\"M15 6 L15 42\"></path><path d=\"M7 24 H41\"></path><path d=\"M35 18.5 L41 24 L35 29.5\"></path><path d=\"M7 24 L4 20.5 M7 24 L4 27.5 M11 24 L8 20.5 M11 24 L8 27.5\"></path>", "orion": "<path d=\"M12 43 L28.5 17.5\"></path><circle cx=\"32\" cy=\"12\" r=\"6.5\"></circle><path class=\"t\" d=\"M32 8.5 V15.5 M28.5 12 H35.5\"></path><path class=\"f\" d=\"M40 25 L41.6 28.4 L45 30 L41.6 31.6 L40 35 L38.4 31.6 L35 30 L38.4 28.4 Z\"></path><path class=\"f\" d=\"M10 9 L11.1 11.9 L14 13 L11.1 14.1 L10 17 L8.9 14.1 L6 13 L8.9 11.9 Z\"></path>", "gru": "<path d=\"M12 8 Q22 22 14 41\"></path><path d=\"M22 5 Q32 22 23.5 43\"></path><path d=\"M32 8 Q42 22 33 41\"></path>", "brand": "<path d=\"M11 8 H37 V19 H11 Z\"></path><path d=\"M24 19 V43\"></path><path class=\"t\" d=\"M20.5 34.5 H27.5 M20.5 38.5 H27.5 M16 8 V19 M32 8 V19\"></path>", "raven": "<path d=\"M5 25 Q24 8 43 25 Q24 42 5 25 Z\"></path><circle cx=\"24\" cy=\"25\" r=\"6.5\"></circle><circle class=\"f\" cx=\"24\" cy=\"25\" r=\"2.8\"></circle><path class=\"t\" d=\"M12 15 L9 10.5 M24 10.5 V5 M36 15 L39 10.5\"></path>", "pike": "<path d=\"M17 43 V15 M31 43 V15\"></path><path d=\"M17 5 L20.5 15 H13.5 Z M31 5 L34.5 15 H27.5 Z\"></path><path class=\"t\" d=\"M12 30 H36\"></path>", "shield": "<circle cx=\"24\" cy=\"24\" r=\"16.5\"></circle><circle class=\"t\" cx=\"24\" cy=\"24\" r=\"10.5\"></circle><circle class=\"f\" cx=\"24\" cy=\"24\" r=\"4.5\"></circle><circle class=\"f\" cx=\"24\" cy=\"10.8\" r=\"1.4\"></circle><circle class=\"f\" cx=\"37.2\" cy=\"24\" r=\"1.4\"></circle><circle class=\"f\" cx=\"24\" cy=\"37.2\" r=\"1.4\"></circle><circle class=\"f\" cx=\"10.8\" cy=\"24\" r=\"1.4\"></circle>", "cav": "<path d=\"M13 7 V23 A11 11 0 0 0 35 23 V7\"></path><path d=\"M9.5 7 H16.5 M31.5 7 H38.5\"></path><path class=\"t\" d=\"M5 39 H14 M9 44 H22 M30 41 H43\"></path>", "archer": "<path d=\"M9 39 L39 9 M9 9 L39 39\"></path><path d=\"M39 9 L31.5 10 M39 9 L38 16.5 M9 9 L16.5 10 M9 9 L10 16.5\"></path><path class=\"t\" d=\"M9 39 L5.5 35.5 M9 39 L12.5 42.5 M39 39 L42.5 35.5 M39 39 L35.5 42.5\"></path>", "mage": "<circle class=\"t dash\" cx=\"24\" cy=\"24\" r=\"18.5\"></circle><path d=\"M24 8 L36 24 L24 40 L12 24 Z\"></path><path class=\"t\" d=\"M24 15 V33 M17 24 H31\"></path><circle class=\"f\" cx=\"24\" cy=\"24\" r=\"3.4\"></circle>", "scout": "<path d=\"M24 4 L28.5 27 H19.5 Z\"></path><path d=\"M14.5 27 H33.5\"></path><path d=\"M24 27 V36.5\"></path><circle cx=\"24\" cy=\"40.5\" r=\"3\"></circle><path class=\"t\" d=\"M24 10 V23\"></path>", "griffin": "<path d=\"M5 35 C9 19 23 8 43 6 C39 11 38 14 39 17 C34 18 32 21 33 24.5 C28 25.5 26 28.5 27 32.5 C19 32.5 12 33.5 5 35 Z\"></path><path class=\"t\" d=\"M13 30 C20 22 29 15.5 39 11.5 M20 31.5 C24 27 28 23.5 33 21\"></path><path class=\"t\" d=\"M12 41 L16 37 M18 44 L21 39\"></path>", "siege": "<path d=\"M5 37 H43\"></path><circle cx=\"13\" cy=\"38\" r=\"4.5\"></circle><circle cx=\"35\" cy=\"38\" r=\"4.5\"></circle><path d=\"M15 31 L36.5 12\"></path><circle class=\"f\" cx=\"39\" cy=\"9.8\" r=\"3.6\"></circle><path d=\"M17 37 L25 22 L33 37\"></path>", "priest": "<path d=\"M14 15 H34 Q34 28 24 30 Q14 28 14 15 Z\"></path><path d=\"M24 30 V38\"></path><path d=\"M16 41 Q24 36 32 41\"></path><path class=\"t\" d=\"M24 3 V8 M13.5 6 L16.5 10 M34.5 6 L31.5 10 M8 13 L11.5 14.5 M40 13 L36.5 14.5\"></path><circle class=\"f\" cx=\"24\" cy=\"21\" r=\"2.6\"></circle>", "trench": "<path d=\"M3 22 H12 L16.5 34 H31.5 L36 22 H45\"></path><path d=\"M5 22 Q5 16.5 9.5 16.5 Q14 16.5 14 22 M34 22 Q34 16.5 38.5 16.5 Q43 16.5 43 22\"></path><path d=\"M19.5 34 Q19.5 27 24 27 Q28.5 27 28.5 34\"></path><path class=\"t\" d=\"M7 42 L11 38 M17 42 L21 38 M27 42 L31 38 M37 42 L41 38\"></path>", "arrowtower": "<path d=\"M16 43 L18.5 19 H29.5 L32 43 Z\"></path><path d=\"M14 19 V8.5 H18 V12.5 H22 V8.5 H26 V12.5 H30 V8.5 H34 V19 Z\"></path><path d=\"M24 24.5 V33\"></path><path class=\"t\" d=\"M21 28.5 H27\"></path>", "cheval": "<path d=\"M4 26 H44\"></path><path d=\"M9 12 L17 40 M17 12 L9 40 M20 12 L28 40 M28 12 L20 40 M31 12 L39 40 M39 12 L31 40\"></path>", "barracks": "<path d=\"M5 40 L24 11 L43 40 Z\"></path><path d=\"M24 40 V26 L17.5 40\"></path><path d=\"M24 11 V3.5\"></path><path class=\"f\" d=\"M24 3.5 L33 6.2 L24 9 Z\"></path>", "obelisk": "<path d=\"M19.5 41 L21.5 13 L24 5.5 L26.5 13 L28.5 41 Z\"></path><path class=\"f\" d=\"M24 19 L26.2 24 L24 29 L21.8 24 Z\"></path><path d=\"M14 42 H34\"></path><path class=\"t\" d=\"M10 16 L14.5 18.5 M38 16 L33.5 18.5 M7 27 H13 M41 27 H35\"></path>", "banner": "<path d=\"M13 44 V5\"></path><path d=\"M13 8 H38 L32.5 15.5 L38 23 H13\"></path><circle class=\"f\" cx=\"22.5\" cy=\"15.5\" r=\"3.2\"></circle><path d=\"M8.5 44 H17.5\"></path>", "watch": "<path d=\"M15 43 L19 20 M33 43 L29 20\"></path><path d=\"M12.5 20 H35.5\"></path><path d=\"M12.5 20 L24 9 L35.5 20\"></path><path class=\"t\" d=\"M17.5 33 H30.5 M18.3 27 L30 33 M29.7 27 L18 33\"></path><path class=\"t\" d=\"M39 7 Q42.5 11 39 15 M42 4 Q47.5 11 42 18\"></path>", "trap": "<circle class=\"t dash\" cx=\"24\" cy=\"24\" r=\"19\"></circle><path d=\"M9.5 29 H38.5\"></path><path d=\"M9.5 29 L13 20 L16.5 29 L20 20 L23.5 29 L27 20 L30.5 29 L34 20 L38.5 29\"></path><circle class=\"f\" cx=\"24\" cy=\"35.5\" r=\"2\"></circle>", "supply": "<path d=\"M8 20 H40 V41 H8 Z\"></path><path d=\"M8 20 L13 12 H35 L40 20\"></path><path d=\"M24 25 V36 M18.5 30.5 H29.5\"></path>", "t1": "<path d=\"M15.5 43 L18 19 H30 L32.5 43 Z\"></path><path d=\"M14 19 V9 H18 V12.5 H22 V9 H26 V12.5 H30 V9 H34 V19 Z\"></path><path d=\"M21 31 H27\"></path>", "t2": "<path d=\"M15.5 43 L18 19 H30 L32.5 43 Z\"></path><path d=\"M14 19 V9 H18 V12.5 H22 V9 H26 V12.5 H30 V9 H34 V19 Z\"></path><path d=\"M21 27 H27 M21 34 H27\"></path>", "t3": "<path d=\"M15.5 43 L18 19 H30 L32.5 43 Z\"></path><path d=\"M14 19 V9 H18 V12.5 H22 V9 H26 V12.5 H30 V9 H34 V19 Z\"></path><path d=\"M21 25 H27 M21 30.5 H27 M21 36 H27\"></path>", "core": "<path class=\"f\" d=\"M13 15 L16.5 5.5 L20.5 11 L24 3.5 L27.5 11 L31.5 5.5 L35 15 Z\"></path><path d=\"M11 43 V19 H37 V43\"></path><path d=\"M7 43 H41\"></path><path d=\"M20 43 V35 A4 4 0 0 1 28 35 V43\"></path><path class=\"t\" d=\"M16 25 V29 M32 25 V29\"></path>", "dragon": "<path d=\"M24 4 C31 12 37 18 37 28.5 C37 37 31 43.5 24 43.5 C17 43.5 11 37 11 28.5 C11 22.5 14.5 18 17.5 14 C18.5 19.5 21 22 23.5 22 C21.5 16 21.5 10 24 4 Z\"></path><path class=\"f\" d=\"M24 23.5 Q27.5 29 24 35 Q20.5 29 24 23.5 Z\"></path>", "titan": "<path d=\"M10 14 L18 6 H30 L38 14 L40.5 34 L30.5 43 H17.5 L7.5 34 Z\"></path><path d=\"M16.5 22.5 H21.5 M26.5 22.5 H31.5\"></path><path d=\"M18.5 33 H29.5\"></path><path class=\"t\" d=\"M24 6 L21.5 12.5 L25.5 16\"></path>", "advance": "<path d=\"M12 27 L24 15 L36 27\"></path><path d=\"M12 37 L24 25 L36 37\"></path>", "hold": "<path d=\"M18 38 V7\"></path><path d=\"M18 9 H35 L30.5 15.5 L35 22 H18\"></path><path d=\"M7 41 Q24 32 41 41\"></path>", "rally": "<circle class=\"f\" cx=\"24\" cy=\"24\" r=\"4.2\"></circle><path d=\"M6 6 L16.5 16.5 M16.5 9.5 V16.5 H9.5 M42 6 L31.5 16.5 M38.5 16.5 H31.5 V9.5 M6 42 L16.5 31.5 M9.5 31.5 H16.5 V38.5 M42 42 L31.5 31.5 M31.5 38.5 V31.5 H38.5\"></path>", "retreat": "<path d=\"M34 41 V20 A10 10 0 0 0 14 20 V31\"></path><path d=\"M7.5 25 L14 32 L20.5 25\"></path>", "charge": "<path d=\"M7 24 H33\"></path><path class=\"f\" d=\"M29 15.5 L43 24 L29 32.5 Z\"></path><path class=\"t\" d=\"M5 14 H19 M5 34 H19\"></path>", "spread": "<circle class=\"f\" cx=\"24\" cy=\"24\" r=\"3.2\"></circle><path d=\"M18.5 18.5 L7 7 M7 14.5 V7 H14.5 M29.5 18.5 L41 7 M33.5 7 H41 V14.5 M18.5 29.5 L7 41 M7 33.5 V41 H14.5 M29.5 29.5 L41 41 M41 33.5 V41 H33.5\"></path>", "focus": "<circle cx=\"24\" cy=\"24\" r=\"13\"></circle><path d=\"M24 4 V14 M24 34 V44 M4 24 H14 M34 24 H44\"></path><circle class=\"f\" cx=\"24\" cy=\"24\" r=\"2.8\"></circle>", "ambush": "<path d=\"M5 39 Q4 31 11 30 Q10 22 18 22 Q20 14 27.5 15.5 Q34.5 15 35 23 Q42 23.5 41.5 30.5 Q45 33 43 39 Z\"></path><path d=\"M16 31 Q24 25.5 32 31 Q24 36 16 31 Z\"></path><circle class=\"f\" cx=\"24\" cy=\"31\" r=\"2\"></circle>", "move": "<path class=\"t dash\" d=\"M7 41 Q10 27 24 26\"></path><path d=\"M21 21.5 L26 26 L21 30.5\"></path><path d=\"M31 41 V8\"></path><path d=\"M31 9.5 H43 L39.5 15 L43 20.5 H31\"></path><path d=\"M26 41 H36\"></path>", "deploy": "<path d=\"M5 12 L17 7.5 L31 12 L43 7.5 V36 L31 40.5 L17 36 L5 40.5 Z\"></path><path class=\"t\" d=\"M17 7.5 V36 M31 12 V40.5\"></path><path class=\"f\" d=\"M24 16 L28.5 22 L24 28 L19.5 22 Z\"></path><path class=\"t dash\" d=\"M10 33 Q14 26 20 24\"></path>", "f_square": "<circle class=\"f\" cx=\"14\" cy=\"14\" r=\"3\"></circle><circle class=\"f\" cx=\"24\" cy=\"14\" r=\"3\"></circle><circle class=\"f\" cx=\"34\" cy=\"14\" r=\"3\"></circle><circle class=\"f\" cx=\"14\" cy=\"24\" r=\"3\"></circle><circle class=\"f\" cx=\"24\" cy=\"24\" r=\"3\"></circle><circle class=\"f\" cx=\"34\" cy=\"24\" r=\"3\"></circle><circle class=\"f\" cx=\"14\" cy=\"34\" r=\"3\"></circle><circle class=\"f\" cx=\"24\" cy=\"34\" r=\"3\"></circle><circle class=\"f\" cx=\"34\" cy=\"34\" r=\"3\"></circle><path class=\"t\" d=\"M8 6 H40\"></path>", "f_line": "<circle class=\"f\" cx=\"8\" cy=\"22\" r=\"2.7\"></circle><circle class=\"f\" cx=\"16\" cy=\"22\" r=\"2.7\"></circle><circle class=\"f\" cx=\"24\" cy=\"22\" r=\"2.7\"></circle><circle class=\"f\" cx=\"32\" cy=\"22\" r=\"2.7\"></circle><circle class=\"f\" cx=\"40\" cy=\"22\" r=\"2.7\"></circle><circle class=\"f\" cx=\"8\" cy=\"31\" r=\"2.7\"></circle><circle class=\"f\" cx=\"16\" cy=\"31\" r=\"2.7\"></circle><circle class=\"f\" cx=\"24\" cy=\"31\" r=\"2.7\"></circle><circle class=\"f\" cx=\"32\" cy=\"31\" r=\"2.7\"></circle><circle class=\"f\" cx=\"40\" cy=\"31\" r=\"2.7\"></circle><path d=\"M17 13 L24 8 L31 13\"></path>", "f_wedge": "<circle class=\"f\" cx=\"24\" cy=\"10\" r=\"2.8\"></circle><circle class=\"f\" cx=\"18\" cy=\"20\" r=\"2.8\"></circle><circle class=\"f\" cx=\"30\" cy=\"20\" r=\"2.8\"></circle><circle class=\"f\" cx=\"12\" cy=\"30\" r=\"2.8\"></circle><circle class=\"f\" cx=\"24\" cy=\"30\" r=\"2.8\"></circle><circle class=\"f\" cx=\"36\" cy=\"30\" r=\"2.8\"></circle><circle class=\"f\" cx=\"6\" cy=\"40\" r=\"2.8\"></circle><circle class=\"f\" cx=\"18\" cy=\"40\" r=\"2.8\"></circle><circle class=\"f\" cx=\"30\" cy=\"40\" r=\"2.8\"></circle><circle class=\"f\" cx=\"42\" cy=\"40\" r=\"2.8\"></circle>", "f_circle": "<circle class=\"f\" cx=\"24.0\" cy=\"9.0\" r=\"2.8\"></circle><circle class=\"f\" cx=\"34.6\" cy=\"13.4\" r=\"2.8\"></circle><circle class=\"f\" cx=\"39.0\" cy=\"24.0\" r=\"2.8\"></circle><circle class=\"f\" cx=\"34.6\" cy=\"34.6\" r=\"2.8\"></circle><circle class=\"f\" cx=\"24.0\" cy=\"39.0\" r=\"2.8\"></circle><circle class=\"f\" cx=\"13.4\" cy=\"34.6\" r=\"2.8\"></circle><circle class=\"f\" cx=\"9.0\" cy=\"24.0\" r=\"2.8\"></circle><circle class=\"f\" cx=\"13.4\" cy=\"13.4\" r=\"2.8\"></circle><circle class=\"t\" cx=\"24\" cy=\"24\" r=\"5\"></circle>", "f_loose": "<circle class=\"f\" cx=\"9\" cy=\"10\" r=\"2.6\"></circle><circle class=\"f\" cx=\"27\" cy=\"7\" r=\"2.6\"></circle><circle class=\"f\" cx=\"41\" cy=\"15\" r=\"2.6\"></circle><circle class=\"f\" cx=\"17\" cy=\"23\" r=\"2.6\"></circle><circle class=\"f\" cx=\"35\" cy=\"28\" r=\"2.6\"></circle><circle class=\"f\" cx=\"8\" cy=\"34\" r=\"2.6\"></circle><circle class=\"f\" cx=\"24\" cy=\"39\" r=\"2.6\"></circle><circle class=\"f\" cx=\"41\" cy=\"41\" r=\"2.6\"></circle>", "gold": "<ellipse cx=\"24\" cy=\"13\" rx=\"13\" ry=\"5\"></ellipse><path d=\"M11 13 V21 A13 5 0 0 0 37 21 V13\"></path><path d=\"M11 21 V29 A13 5 0 0 0 37 29 V21\"></path><path d=\"M11 29 V37 A13 5 0 0 0 37 37 V29\"></path>", "spyglass": "<path d=\"M6 32 L26 12 L33 19 L13 39 Z\"></path><path d=\"M26 12 L30.5 7.5 L37.5 14.5 L33 19\"></path><path class=\"t\" d=\"M15.5 37 L12 45 M20 32.5 L25 45\"></path>", "unknown": "<path class=\"t dash\" d=\"M24 4 L40 9.5 V22 C40 32.5 33 39 24 44 C15 39 8 32.5 8 22 V9.5 Z\"></path><path d=\"M19 18 Q19 12.5 24 12.5 Q29 12.5 29 18 Q29 22.5 24 24.5 V28.5\"></path><circle class=\"f\" cx=\"24\" cy=\"34\" r=\"2\"></circle>", "build": "<path d=\"M5 30 H24 V41 H5 Z\"></path><path class=\"t\" d=\"M14.5 30 V35.5 M5 35.5 H24 M9.5 35.5 V41 M19.5 35.5 V41\"></path><path d=\"M28 39 L38 21\"></path><path d=\"M32.5 13 L44 19.5 L41 24.5 L29.5 18 Z\"></path>", "reform": "<path d=\"M9 21 A15.5 15.5 0 0 1 37 14\"></path><path d=\"M38 6.5 V14.5 H30\"></path><path d=\"M39 27 A15.5 15.5 0 0 1 11 34\"></path><path d=\"M10 41.5 V33.5 H18\"></path><path class=\"f\" d=\"M24 17 L30 19.5 V24 C30 28 27.5 30.5 24 32 C20.5 30.5 18 28 18 24 V19.5 Z\"></path>", "voice": "<path d=\"M7 19 H14 L24 11 V37 L14 29 H7 Z\"></path><path d=\"M30 18 Q34.5 24 30 30 M35.5 13 Q43 24 35.5 35\"></path>", "menu": "<path d=\"M10 14 H38 M10 24 H38 M10 34 H38\"></path>", "exit": "<path d=\"M27 8 H11 V40 H27\"></path><path d=\"M21 24 H42\"></path><path d=\"M35 17 L42 24 L35 31\"></path>", "demolish": "<path d=\"M5 30 H25 V42 H5 Z\"></path><path class=\"t\" d=\"M14 30 L17.5 35 L13 38 L15.5 42\"></path><path d=\"M30 41 L39.5 23\"></path><path d=\"M33.5 15 L45 21.5 L42 26.5 L30.5 20 Z\"></path><path class=\"t\" d=\"M26.5 26 L23 22.5 M29 21.5 L27.5 17\"></path>", "troops": "<path d=\"M12 41 V21 Q12 8 24 8 Q36 8 36 21 V41 Z\"></path><path d=\"M16 23 H32\"></path><path class=\"t\" d=\"M24 8 V19 M24 27 V41 M19.5 31 V35 M28.5 31 V35\"></path>", "armory": "<path d=\"M8 22 H34 Q34 28 28 30 V34 H14 V30 Q8 28 8 22 Z\"></path><path d=\"M12 34 H30 V40 H12 Z\"></path><path d=\"M34 22 H42 Q42 26 37 27\"></path><path d=\"M30 6 L40 16\"></path><path d=\"M26 10 L34 2 L38 6 L30 14 Z\"></path>", "upgrade": "<path d=\"M10 40 H38\"></path><path d=\"M14 30 L24 20 L34 30\"></path><path d=\"M14 20 L24 10 L34 20\"></path>", "lvl": "<path d=\"M24 5 L29 17 L42 18 L32 27 L35 40 L24 33 L13 40 L16 27 L6 18 L19 17 Z\"></path>", "e_valen": "<path d=\"M24 10 L36 14 V24 C36 32 31 37 24 40 C17 37 12 32 12 24 V14 Z\"></path><path class=\"t\" d=\"M24 2 V6 M9 7 L12 10 M39 7 L36 10 M3 21 H7 M41 21 H45\"></path><path d=\"M19 25 L23 29 L30 20\"></path>", "e_sylvie": "<path d=\"M4 34 L42 12\"></path><path d=\"M35 10 L42 12 L39 18\"></path><path class=\"t\" d=\"M14 18 V36 M22 14 V32 M30 10 V28\"></path><path d=\"M4 34 L1 30 M4 34 L8 37\"></path>", "e_orion": "<circle cx=\"30\" cy=\"31\" r=\"9\"></circle><path d=\"M24 24 L8 8 M30 22 L20 5 M22 30 L5 20\"></path><path class=\"t\" d=\"M27 29 A3 3 0 0 1 32 27\"></path><path d=\"M10 43 H44\"></path>", "e_gru": "<path d=\"M12 22 Q12 10 24 10 Q36 10 36 22 Q36 34 24 40 Q12 34 12 22 Z\"></path><path d=\"M12 14 L8 6 L16 10 M36 14 L40 6 L32 10\"></path><path class=\"t\" d=\"M18 22 H21 M27 22 H30\"></path><path d=\"M20 31 L24 34 L28 31\"></path>", "e_brand": "<path d=\"M8 30 L30 16 L35 24 L13 38 Z\"></path><circle cx=\"15\" cy=\"38\" r=\"5\"></circle><circle cx=\"30\" cy=\"34\" r=\"5\"></circle><path class=\"t\" d=\"M36 13 L41 9 M38 19 L44 18 M33 10 L34 4\"></path>", "e_raven": "<path d=\"M30 6 A16 16 0 1 0 42 30 A12 12 0 1 1 30 6 Z\"></path><path d=\"M10 42 L20 32 M16 44 L24 36\"></path><path class=\"t\" d=\"M8 36 L12 40 M14 30 L18 34\"></path>", "recruit": "<path d=\"M10 8 H34 Q38 8 38 12 V36 Q38 40 34 40 H14\"></path><path d=\"M10 8 Q6 8 6 12 V14 H14 V12 Q14 8 10 8\"></path><path class=\"t\" d=\"M16 16 H32 M16 22 H32 M16 28 H26\"></path><circle cx=\"31\" cy=\"34\" r=\"6\"></circle><path d=\"M29 34 L31 36 L34 32\"></path>", "rep": "<path d=\"M24 40 C12 36 8 26 10 14\"></path><path d=\"M24 40 C36 36 40 26 38 14\"></path><path class=\"t\" d=\"M10 20 L15 18 M10 27 L16 26 M13 33 L18 31 M38 20 L33 18 M38 27 L32 26 M35 33 L30 31\"></path><path d=\"M24 10 L27 17 L34 17 L28.5 21.5 L30.5 29 L24 24.5 L17.5 29 L19.5 21.5 L14 17 L21 17 Z\"></path>", "ping": "<path d=\"M24 42 L14 24 A11 11 0 1 1 34 24 Z\"></path><circle cx=\"24\" cy=\"18\" r=\"4\"></circle><path class=\"t\" d=\"M6 42 H42\"></path>", "talent": "<path d=\"M24 42 V20\"></path><path d=\"M24 26 L14 18 M24 22 L34 14 M24 32 L33 26\"></path><circle cx=\"14\" cy=\"16\" r=\"4\"></circle><circle cx=\"34\" cy=\"12\" r=\"4\"></circle><circle cx=\"35\" cy=\"25\" r=\"3.5\"></circle><circle cx=\"24\" cy=\"16\" r=\"4.5\"></circle>", "wx_clear": "<circle cx=\"24\" cy=\"24\" r=\"8\"></circle><path class=\"t\" d=\"M24 6 V11 M24 37 V42 M6 24 H11 M37 24 H42 M11 11 L14.5 14.5 M33.5 33.5 L37 37 M11 37 L14.5 33.5 M33.5 14.5 L37 11\"></path>", "wx_rain": "<path d=\"M12 28 A8 8 0 0 1 14 12 A10 10 0 0 1 33 12 A7 7 0 0 1 36 28 Z\"></path><path class=\"t\" d=\"M15 33 L12 40 M23 33 L20 40 M31 33 L28 40\"></path>", "wx_fog": "<path d=\"M8 16 H40 M5 24 H35 M12 32 H43 M8 40 H30\"></path>", "wx_night": "<path d=\"M30 8 A16 16 0 1 0 40 30 A12 12 0 1 1 30 8 Z\"></path><path class=\"t\" d=\"M12 10 L12 14 M10 12 L14 12 M40 12 L40 15 M38.5 13.5 L41.5 13.5\"></path>", "camp": "<path d=\"M6 40 L24 10 L42 40 Z\"></path><path d=\"M24 10 V40\"></path><path d=\"M18 40 L24 30 L30 40\"></path><path class=\"t\" d=\"M24 10 L30 5\"></path>", "templar": "<path d=\"M24 6 L35 10 V22 C35 31 30 37 24 41 C18 37 13 31 13 22 V10 Z\"></path><path d=\"M24 13 V33 M17 20 H31\"></path><circle class=\"t\" cx=\"24\" cy=\"4\" r=\"0.1\"></circle><path class=\"t\" d=\"M16 4 Q24 0 32 4\"></path>", "longbow": "<path d=\"M14 4 Q36 24 14 44\"></path><path class=\"t\" d=\"M14 4 V44\"></path><path d=\"M10 24 H42\"></path><path d=\"M42 24 L36 20 M42 24 L36 28\"></path><path class=\"t\" d=\"M10 24 L6 20 M10 24 L6 28\"></path>", "revenant": "<path d=\"M15 20 Q15 7 24 7 Q33 7 33 20 V26 H29 V31 H19 V26 H15 Z\"></path><circle class=\"f\" cx=\"20\" cy=\"18\" r=\"2.6\"></circle><circle class=\"f\" cx=\"28\" cy=\"18\" r=\"2.6\"></circle><path class=\"t\" d=\"M22 31 V35 M26 31 V35\"></path><path d=\"M12 41 L36 41 M16 37 L32 45 M32 37 L16 45\"></path>", "necro": "<path d=\"M12 42 L36 6\"></path><circle cx=\"36\" cy=\"8\" r=\"4\"></circle><path d=\"M20 28 Q14 22 18 14 Q22 20 28 18\"></path><circle class=\"f\" cx=\"22\" cy=\"21\" r=\"1.6\"></circle><path class=\"t\" d=\"M26 30 Q34 30 36 38 M30 26 Q38 24 42 30\"></path>", "dwarf": "<path d=\"M14 24 Q14 12 24 12 Q34 12 34 24\"></path><path d=\"M10 24 H38\"></path><path d=\"M16 24 Q16 38 24 42 Q32 38 32 24\"></path><path class=\"t\" d=\"M19 30 L24 36 L29 30\"></path><path d=\"M24 4 V12\"></path>", "berserk": "<path d=\"M10 42 L30 12\"></path><path d=\"M26 6 Q40 6 40 20 Q34 14 30 16 Z\"></path><path d=\"M38 42 L18 12\"></path><path d=\"M22 6 Q8 6 8 20 Q14 14 18 16 Z\"></path><path class=\"t\" d=\"M22 34 L26 34\"></path>", "xbow": "<path d=\"M8 18 Q24 8 40 18\"></path><path class=\"t\" d=\"M8 18 L24 24 L40 18\"></path><path d=\"M24 10 V42\"></path><path d=\"M20 36 H28 V42 H20 Z\"></path><path d=\"M24 4 L21 10 H27 Z\"></path>", "camp_wolf": "<path d=\"M8 40 Q8 18 24 14 Q40 18 40 40 Z\"></path><path d=\"M18 40 Q18 30 24 28 Q30 30 30 40\"></path><path class=\"t\" d=\"M14 12 L18 6 L21 12 M27 12 L30 6 L34 12\"></path>", "camp_golem": "<path d=\"M10 42 V20 H16 V42 M32 42 V14 H38 V42\"></path><path d=\"M8 20 H18 M30 14 H40\"></path><path class=\"t\" d=\"M20 42 L24 32 L28 42\"></path><path d=\"M6 42 H42\"></path>", "camp_merc": "<path d=\"M6 40 L20 12 L34 40 Z\"></path><path d=\"M20 12 V40\"></path><path class=\"t\" d=\"M34 40 L40 28 L44 40\"></path><path d=\"M20 12 V6 L28 9 L20 12\"></path>", "mercs": "<circle cx=\"16\" cy=\"14\" r=\"5\"></circle><circle cx=\"32\" cy=\"14\" r=\"5\"></circle><path d=\"M8 34 Q8 22 16 22 Q24 22 24 34\"></path><path d=\"M24 34 Q24 22 32 22 Q40 22 40 34\"></path><path class=\"t\" d=\"M14 42 H34\"></path><circle class=\"f\" cx=\"24\" cy=\"42\" r=\"3\"></circle>"}, "K": {"valen": "commander", "sylvie": "commander", "orion": "commander", "gru": "commander", "brand": "commander", "raven": "commander", "pike": "unit", "shield": "unit", "cav": "unit", "archer": "unit", "mage": "unit", "scout": "unit", "griffin": "unit", "siege": "unit", "priest": "unit", "trench": "building", "arrowtower": "building", "cheval": "building", "barracks": "building", "obelisk": "building", "banner": "building", "watch": "building", "trap": "building", "supply": "building", "t1": "structure", "t2": "structure", "t3": "structure", "core": "structure", "dragon": "structure", "titan": "structure", "advance": "command", "hold": "command", "rally": "command", "retreat": "command", "charge": "command", "spread": "command", "focus": "command", "ambush": "command", "move": "command", "deploy": "command", "f_square": "command", "f_line": "command", "f_wedge": "command", "f_circle": "command", "f_loose": "command", "gold": "ui", "spyglass": "ui", "unknown": "ui", "build": "ui", "reform": "ui", "voice": "ui", "menu": "ui", "exit": "ui", "demolish": "ui", "troops": "ui", "armory": "ui", "upgrade": "ui", "lvl": "ui", "e_valen": "command", "e_sylvie": "command", "e_orion": "command", "e_gru": "command", "e_brand": "command", "e_raven": "command", "recruit": "ui", "rep": "ui", "ping": "ui", "talent": "ui", "wx_clear": "ui", "wx_rain": "ui", "wx_fog": "ui", "wx_night": "ui", "camp": "ui", "templar": "unit", "longbow": "unit", "revenant": "unit", "necro": "unit", "dwarf": "unit", "berserk": "unit", "xbow": "unit", "camp_wolf": "structure", "camp_golem": "structure", "camp_merc": "structure", "mercs": "ui"}, "N": {"valen": "鐵壁公爵 瓦倫", "sylvie": "遊俠女王 希爾薇", "orion": "星咒賢者 歐瑞恩", "gru": "獸語者 格魯", "brand": "攻城大師 布蘭德", "raven": "影刃 夜鴉", "pike": "長槍兵", "shield": "盾衛", "cav": "騎兵", "archer": "弓兵", "mage": "戰鬥法師", "scout": "暗影斥候", "griffin": "獅鷲騎士", "siege": "符文投石車", "priest": "聖光祭司", "trench": "戰壕", "arrowtower": "箭塔", "cheval": "拒馬", "barracks": "前線兵營", "obelisk": "秘法方尖碑", "banner": "戰旗", "watch": "瞭望塔", "trap": "符文陷阱", "supply": "補給站", "t1": "外塔 (一階)", "t2": "中塔 (二階)", "t3": "內塔 (三階)", "core": "主塔", "dragon": "深淵巨龍", "titan": "遠古泰坦", "advance": "前進", "hold": "駐守", "rally": "集結", "retreat": "撤退", "charge": "衝鋒", "spread": "散開", "focus": "集火", "ambush": "埋伏", "move": "移動", "deploy": "戰術部署", "f_square": "方陣", "f_line": "橫列", "f_wedge": "楔形", "f_circle": "圓陣", "f_loose": "散兵", "gold": "軍資", "spyglass": "偵察", "unknown": "未知兵種", "build": "建造", "reform": "整編", "voice": "語音", "menu": "選單", "exit": "退出", "demolish": "拆除", "troops": "部隊編制", "armory": "軍械庫", "upgrade": "升級", "lvl": "等級", "e_valen": "聖輝壁壘", "e_sylvie": "破曉神射", "e_orion": "星隕天降", "e_gru": "萬獸之王", "e_brand": "攻城巨砲", "e_raven": "萬影突襲", "recruit": "招募", "rep": "聲望", "ping": "信號", "talent": "天賦", "wx_clear": "晴朗", "wx_rain": "大雨", "wx_fog": "濃霧", "wx_night": "夜戰", "camp": "營地", "templar": "聖殿騎士", "longbow": "皇家長弓手", "revenant": "亡魂戰士", "necro": "死靈術士", "dwarf": "山地矮人", "berserk": "蠻族狂戰士", "xbow": "傭兵弩手", "camp_wolf": "狼窩", "camp_golem": "石像遺跡", "camp_merc": "傭兵營地", "mercs": "僱用傭兵"}};
const GL = GD.G, KIND = GD.K;
const C = {ink:'#ECE5D5', muted:'#A8A090', gold:'#D9A54A', blue:'#6FAEF0', red:'#D9604F', panel2:'#1F2631', line:'#2E3846', neutral:'#B892E0', g1:'#7FB4F2', g2:'#F1D29A'};
const TC = [C.blue, C.red], GCOL = [C.g1, C.g2], GNUM = ['I', 'II'];
const $ = id => document.getElementById(id);
const FINE = () => matchMedia('(pointer:fine)').matches;

// ================= icons =================
const FR = {
  commander: ['<circle class="fr" cx="32" cy="32" r="30"></circle><circle class="fr2" cx="32" cy="32" r="25.5"></circle>', 'translate(10 10) scale(0.8333)', C.gold],
  unit: ['<path class="fr" d="M32 2.5 L58 10.5 V30 C58 45 47 55 32 61.5 C17 55 6 45 6 30 V10.5 Z"></path>', 'translate(12 10) scale(0.8333)', '#8FB2D6'],
  building: ['<path class="fr" d="M14 3 H50 L61 14 V50 L50 61 H14 L3 50 V14 Z"></path>', 'translate(10 10) scale(0.8333)', '#C98B5A'],
  command: ['<rect class="fr" x="3" y="3" width="58" height="58" rx="14"></rect>', 'translate(10 10) scale(0.8333)', '#CFC6B2'],
  ui: ['<rect class="fr" x="3" y="3" width="58" height="58" rx="14"></rect>', 'translate(10 10) scale(0.8333)', '#CFC6B2'],
  structure: ['<path class="fr" d="M32 1.5 L62.5 32 L32 62.5 L1.5 32 Z"></path>', 'translate(16.4 16.4) scale(0.65)', C.neutral]
};
function icon(key, size, team) {
  const f = FR[KIND[key]];
  let st = f[2], fill = C.panel2;
  if (team === 0) { st = C.blue; fill = '#14263A'; } else if (team === 1) { st = C.red; fill = '#341A17'; }
  const fr = f[0].replace('class="fr"', `class="fr" fill="${fill}" stroke="${st}"`).replace('class="fr2"', `class="fr2" stroke="${st}"`);
  return `<svg class="ic" viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true" style="color:${C.ink}">${fr}<g class="g" transform="${f[1]}">${GL[key]}</g></svg>`;
}
function glyph(key, size, color) { return `<svg class="ic" viewBox="0 0 48 48" width="${size}" height="${size}" aria-hidden="true" style="color:${color || C.ink}"><g class="g">${GL[key]}</g></svg>`; }
const imgCache = {};
function glyphImg(key, color) {
  const id = key + color;
  if (imgCache[id]) return imgCache[id];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="96" height="96"><style>.t{stroke-width:1.5}.f{fill:${color};stroke:none}.dash{stroke-dasharray:3 3}</style><g fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${GL[key]}</g></svg>`;
  const im = new Image(); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  return (imgCache[id] = im);
}

// ================= data =================
const UNITS = {
  pike:   {n:'長槍兵', cls:'近戰', hp:220, atk:13, rng:2.6, spd:6.5, cd:1.0, sq:6, inf:1, form:'square', trait:'槍陣：駐守時傷害 +30%，對騎兵反擊'},
  shield: {n:'盾衛', cls:'近戰', hp:320, atk:10, rng:2.2, spd:6, cd:1.0, sq:5, inf:1, form:'square', trait:'盾牆：受到遠程傷害減半'},
  cav:    {n:'騎兵', cls:'近戰', hp:250, atk:18, rng:2.6, spd:10.5, cd:1.1, sq:4, mounted:1, form:'wedge', trait:'衝鋒：持續移動 3 秒後首擊雙倍並擊退'},
  archer: {n:'弓兵', cls:'遠程', hp:120, atk:12, rng:14, spd:6.5, cd:1.15, sq:6, inf:1, ranged:1, form:'line', trait:'拋射：對飛行單位傷害 +50%'},
  mage:   {n:'戰鬥法師', cls:'魔法', hp:115, atk:15, rng:12, spd:6, cd:1.7, sq:4, ranged:1, aoe:3, magic:1, form:'line', trait:'元素爆裂：範圍 3 的魔法傷害'},
  scout:  {n:'暗影斥候', cls:'近戰', hp:150, atk:17, rng:2.2, spd:8.5, cd:0.9, sq:4, stealth:1, form:'loose', trait:'潛行：靜止 2 秒隱身；可辨識附近敵軍兵種'},
  griffin:{n:'獅鷲騎士', cls:'飛行', hp:210, atk:17, rng:2.8, spd:10, cd:1.1, sq:3, fly:1, form:'wedge', trait:'俯衝：無視戰壕、拒馬與陷阱'},
  siege:  {n:'符文投石車', cls:'攻城', hp:280, atk:22, rng:18, spd:4.5, cd:3, sq:2, ranged:1, aoe:2.5, form:'line', trait:'重擊：對建築與防禦塔 2.5 倍傷害'},
  priest: {n:'聖光祭司', cls:'支援', hp:140, atk:7, rng:11, spd:6, cd:1.4, sq:4, ranged:1, magic:1, heal:24, form:'circle', trait:'聖療：優先治療血量最低的友軍'},
  wolf:   {n:'戰狼', cls:'近戰', hp:160, atk:14, rng:2, spd:10, cd:0.9, sq:0}
};
// squad sizes: ~12 per squad, fewer for high-HP bodies, more for fragile ones.
// Per-soldier stats are rescaled so a full squad is ~1.2x the old squad's total HP/damage.
const OLD_SQ = {pike:6, shield:5, cav:4, archer:6, mage:4, scout:4, griffin:3, siege:2, priest:4};
const NEW_SQ = {pike:12, shield:10, cav:8, archer:14, mage:13, scout:13, griffin:6, siege:4, priest:13};
for (const u in NEW_SQ) {
  const U = UNITS[u], bk = OLD_SQ[u]/NEW_SQ[u], f = 1.2*bk;
  U.bk = bk; U.hp = Math.round(U.hp*f); U.atk = Math.round(U.atk*f*10)/10; if (U.heal) U.heal = Math.round(U.heal*f*10)/10;
  U.sq = NEW_SQ[u]; U.rf = Math.max(1, Math.round(1/bk));
}
UNITS.wolf.bk = 1;
const UKEYS = ['pike','shield','cav','archer','mage','scout','griffin','siege','priest'];
// faction-exclusive squads (by the commander's homeland) and hireable mercenary bands
Object.assign(UNITS, {
  templar: {n:'聖殿騎士', cls:'近戰', hp:230, atk:9.5, rng:2.4, spd:6, cd:1.1, sq:8, inf:1, form:'square', fac:0, mdl:'shield', bk:0.65, rf:2, trait:'聖光庇佑：周圍 7 範圍內的友軍士兵受傷 -12%；聖光對亡魂戰士與死靈術士傷害 +50%'},
  longbow: {n:'皇家長弓手', cls:'遠程', hp:58, atk:8.5, rng:21, spd:6, cd:1.7, sq:12, inf:1, ranged:1, form:'line', fac:0, mdl:'archer', bk:0.5, rf:2, trait:'穿甲長弓：射程 21（弓兵 14），無視盾牆減傷，對重裝單位傷害 +50%'},
  revenant:{n:'亡魂戰士', cls:'近戰', hp:48, atk:5.2, rng:2.2, spd:7, cd:0.9, sq:16, inf:1, form:'loose', fac:1, mdl:'scout', bk:0.33, rf:3, trait:'不死：每名第一次倒下後 2.5 秒以半血重新站起；怕聖光（聖光祭司、聖殿騎士傷害 +50%）'},
  necro:   {n:'死靈術士', cls:'魔法', hp:46, atk:6, rng:12, spd:6, cd:1.6, sq:10, ranged:1, magic:1, form:'line', fac:1, mdl:'mage', bk:0.4, rf:2, trait:'招魂：附近 12 範圍有敵方士兵陣亡時，召起一名亡魂戰士跟隨這隊作戰 25 秒（每隊最多 6 名）'},
  dwarf:   {n:'山地矮人', cls:'傭兵', hp:260, atk:9, rng:2.2, spd:5.6, cd:1.1, sq:6, inf:1, merc:1, mdl:'shield', bk:0.7, rf:1, cost:180, form:'square', trait:'重盔：受到遠程傷害 -30%，對騎兵與狂戰士傷害 +50%'},
  berserk: {n:'蠻族狂戰士', cls:'傭兵', hp:170, atk:12, rng:2.2, spd:8, cd:0.85, sq:6, inf:1, merc:1, mdl:'scout', bk:0.6, rf:1, cost:160, form:'loose', trait:'狂暴：生命越低攻速越快（最多 +60%），擅長衝進遠程部隊'},
  xbow:    {n:'傭兵弩手', cls:'傭兵', hp:90, atk:16, rng:15, spd:6, cd:2.2, sq:6, inf:1, ranged:1, merc:1, mdl:'archer', bk:0.55, rf:1, cost:170, form:'line', trait:'重弩：對騎兵、獅鷲與重裝單位傷害 +50%'}
});
const FUNITS = [['templar', 'longbow'], ['revenant', 'necro']], MERCS = ['dwarf', 'berserk', 'xbow'];
const ALLU = UKEYS.concat(FUNITS[0], FUNITS[1]);
const facOf = c => { const f = CMDS[typeof c === 'string' ? c : c.key].fac; return f === '聖輝王國' ? 0 : f === '黑曜帝國' ? 1 : -1; };
const unitsFor = c => UKEYS.concat(facOf(c) >= 0 ? FUNITS[facOf(c)] : []).filter(u => unitOk(u));
const isComp = e => e.utype === 'wolf' || !!e.comp;
const STRONG = {pike:['cav','shield'], shield:['archer','scout'], cav:['archer','mage','siege'], archer:['pike','griffin'], mage:['shield','pike'],
  scout:['mage','siege','priest'], griffin:['siege','scout','priest'], siege:['shield'], priest:['mage'], wolf:[]};
Object.assign(STRONG, {templar:['revenant','necro','scout'], longbow:['shield','templar','cav','pike','dwarf'], revenant:['archer','longbow','siege','xbow'], necro:['pike','shield','templar','dwarf'],
  dwarf:['cav','berserk'], berserk:['archer','mage','necro','longbow'], xbow:['cav','griffin','shield','templar']});
STRONG.priest.push('revenant'); STRONG.mage.push('revenant'); STRONG.cav.push('longbow', 'necro'); STRONG.scout.push('necro', 'longbow');
const weakOf = u => ALLU.filter(v => STRONG[v].includes(u));
// unit active skills: t = dir (sector), line, circle
const USK = {
  pike:   {n:'槍林', cd:20, t:'dir', r:6.5, d:'朝指定方向架起槍林 6 秒：正面衝來的敵人受傷並暈眩，自身正面受傷 -40%、原地不動'},
  shield: {n:'盾牆推進', cd:18, t:'line', len:12, w:6, d:'朝指定方向推進 12，擊退沿途敵軍並造成傷害'},
  cav:    {n:'奔襲', cd:16, t:'line', len:22, w:4, d:'沿直線衝鋒到指定處，撞擊並擊退沿途敵軍'},
  archer: {n:'火箭齊射', cd:18, t:'circle', range:20, r:6, d:'對指定區域連續射擊 3 秒'},
  mage:   {n:'冰霜新星', cd:20, t:'circle', range:16, r:6, d:'指定區域爆發寒冰，傷害並減速 60% 3 秒'},
  scout:  {n:'影遁', cd:18, t:'circle', range:16, r:4, d:'整隊瞬間轉移到指定處並隱身，下一擊傷害加倍'},
  griffin:{n:'俯衝打擊', cd:18, t:'circle', range:20, r:5, d:'俯衝至指定區域，傷害並暈眩 1.5 秒'},
  siege:  {n:'符文巨石', cd:22, t:'circle', range:32, r:5, d:'超遠程投擲，對建築與防禦塔造成巨額傷害'},
  priest: {n:'聖光庇護', cd:22, t:'circle', range:16, r:8, d:'指定區域 5 秒持續治療友軍，並使其受傷 -30%'},
  templar:{n:'聖光審判', cd:20, t:'circle', range:14, r:6, d:'指定區域降下聖光：敵軍受 100 傷害（亡魂與死靈術士加倍），範圍內友軍回復 20% 生命'},
  longbow:{n:'破陣長箭', cd:18, t:'line', len:32, w:4, d:'朝指定方向齊射穿透長箭，沿途敵軍受 90 傷害並被擊退'},
  revenant:{n:'亡者狂潮', cd:20, t:'circle', range:0, r:7, d:'整隊 6 秒內移速 +30%、攻速 +40%（以隊伍為中心）'},
  necro:  {n:'屍爆', cd:20, t:'circle', range:16, r:5, d:'指定區域爆裂屍氣：敵軍受 90 傷害並減速 40% 3 秒'}
};
const FORMS = {
  square:{n:'方陣', k:'4', ic:'f_square', d:'近戰傷害 +10%，受遠程傷害 -10%'},
  line:  {n:'橫列', k:'5', ic:'f_line', d:'遠程射程 +15%，正面寬'},
  wedge: {n:'楔形', k:'6', ic:'f_wedge', d:'移速 +15%，衝鋒後首擊 +30%'},
  circle:{n:'圓陣', k:'7', ic:'f_circle', d:'受到傷害 -25%，移速 -20%'},
  loose: {n:'散兵', k:'8', ic:'f_loose', d:'受到範圍傷害 -40%'}
};
const FKEYS = Object.keys(FORMS);
const ORDERS = [
  ['advance','前進','z','沿最近的路線推進'], ['hold','駐守','x','右鍵設定駐守位置（拖曳決定朝向）'], ['rally','集結','c','回到指揮官身邊'], ['retreat','撤退','v','退回出生點'],
  ['charge','衝鋒','b','右鍵設定衝鋒位置（或 Shift+右鍵）'], ['focus','集火','n','右鍵指定集火目標'], ['ambush','埋伏','m','右鍵設定埋伏位置'], ['move','移動','右鍵','右鍵設定位置，強行軍到該處後固守']
];
const ONAME = Object.fromEntries(ORDERS.map(o => [o[0], o[1]]));

const CMDS = {
  valen:  {n:'瓦倫', t:'鐵壁公爵', fac:'聖輝王國', hp:1250, atk:30, rng:3, spd:9, p:'堅城：建築生命 +25%，建造加快',
           q:{n:'築壘號令', cd:12, d:'在指定處立起石牆 4 秒，牆內敵軍減速 75%'}, r:{n:'不落之城', cd:55, d:'自身周圍 15 範圍友軍 6 秒受傷 -40%'}, e:{n:'聖輝壁壘', cd:90, d:'在指定處立起金色壁壘 8 秒：範圍內友軍受傷 -50%，敵軍減速 40%'}},
  sylvie: {n:'希爾薇', t:'遊俠女王', fac:'聖輝王國', hp:880, atk:34, rng:11, spd:9, ranged:1, p:'鷹眼：遠程部隊射程 +15%',
           q:{n:'箭雨', cd:11, d:'指定區域箭雨 2 秒，緩速 20%'}, r:{n:'萬箭穿雲', cd:50, d:'大範圍箭雨 3 秒，對飛行加倍'}, e:{n:'破曉神射', cd:80, d:'射出貫穿 40 距離的光箭，路徑上每個敵人受 150 傷害並被擊退'}},
  orion:  {n:'歐瑞恩', t:'星咒賢者', fac:'黑曜帝國', hp:820, atk:36, rng:10, spd:9, ranged:1, magic:1, p:'星界共鳴：方尖碑範圍與加成加倍',
           q:{n:'流星墜擊', cd:12, d:'1.2 秒後隕石落在指定處：110 傷害並暈眩 0.8 秒'}, r:{n:'時滯結界', cd:50, d:'指定區域敵軍移速 -60%，4 秒'}, e:{n:'星隕天降', cd:90, d:'1.8 秒後巨型隕星砸落範圍 9：170 傷害（含建築）並暈眩 1 秒'}},
  gru:    {n:'格魯', t:'獸語者', fac:'黑曜帝國', hp:1050, atk:38, rng:3, spd:9, p:'狂野血脈：騎兵與獅鷲移速 +10%',
           q:{n:'狼群召喚', cd:16, d:'在身邊召喚 3 頭戰狼 12 秒'}, r:{n:'萬獸奔騰', cd:50, d:'兩隊朝指定方向衝鋒 22，攻擊加倍並擊退'}, e:{n:'萬獸之王', cd:90, d:'召喚 6 頭戰狼 15 秒，兩隊攻速 +40%，持續 8 秒'}},
  brand:  {n:'布蘭德', t:'攻城大師', fac:'黑曜帝國', hp:1050, atk:32, rng:3, spd:8.5, p:'工兵：對建築與塔傷害 +20%',
           q:{n:'爆破火藥', cd:11, d:'對指定處的建築與塔 320 傷害，對部隊 80'}, r:{n:'巨像覺醒', cd:55, d:'全部隊回復一半生命，10 秒內攻城傷害加倍'}, e:{n:'攻城巨砲', cd:85, d:'對遠方區域連續砲擊 5 發：每發對建築與塔 300、部隊 110'}},
  raven:  {n:'夜鴉', t:'影刃', fac:'中立傭兵', hp:880, atk:40, rng:3, spd:10, p:'暗影情報：每 60 秒得知敵方各隊大類',
           q:{n:'烏鴉斥候', cd:14, d:'指定區域 8 秒視野，揭露隱身與兵種'}, r:{n:'影襲', cd:50, d:'瞬移至選定敵人身後：目標受 140 傷害並暈眩 2 秒，周圍敵軍受輕傷並暈眩 0.8 秒'}, e:{n:'萬影突襲', cd:85, d:'夜鴉與兩隊瞬移到指定處並隱身 3 秒，落點敵軍受 60 傷害並暈眩 0.8 秒'}}
};
const CSK = {
  valen:{q:{t:'circle', range:14, r:5}, r:{t:'self', r:15}, e:{t:'circle', range:16, r:10}}, sylvie:{q:{t:'circle', range:18, r:6}, r:{t:'circle', range:24, r:13}, e:{t:'line', len:40, w:5}},
  orion:{q:{t:'circle', range:16, r:6}, r:{t:'circle', range:18, r:12}, e:{t:'circle', range:22, r:9}}, gru:{q:{t:'self', r:4}, r:{t:'line', len:22, w:8}, e:{t:'self', r:10}},
  brand:{q:{t:'circle', range:12, r:5}, r:{t:'self', r:16}, e:{t:'circle', range:30, r:9}}, raven:{q:{t:'circle', range:40, r:18}, r:{t:'unit', range:16, r:5.5}, e:{t:'circle', range:22, r:8}}
};
const CKEYS = Object.keys(CMDS);
const BUILDS = {
  trench:     {n:'戰壕', cost:120, hp:850, r:7, t:3, s:'步兵減傷35%・騎兵減速', d:'範圍內我方步兵受遠程傷害 -35%，敵騎兵減速 30%'},
  arrowtower: {n:'箭塔', cost:200, hp:1100, r:13, t:4, s:'自動射擊・對空×2', d:'自動射擊 13 範圍內敵軍（每發 30），對飛行加倍'},
  cheval:     {n:'拒馬', cost:80, hp:500, r:3.5, t:2, s:'減速・撞擊騎兵暈眩', d:'減速地面敵軍，騎兵或衝鋒者撞上受傷並暈眩 1 秒'},
  barracks:   {n:'前線兵營', cost:300, hp:1400, r:0, t:5, s:'部隊補員從此出發', d:'部隊補員改從這裡出發（每隊 1 座）'},
  obelisk:    {n:'秘法方尖碑', cost:220, hp:750, r:11, t:4, s:'法師射程+20%・攻速+15%', d:'範圍內法師射程 +20%、攻速 +15%'},
  banner:     {n:'戰旗', cost:100, hp:600, r:10, t:2, s:'範圍攻速+15%', d:'範圍內友軍攻速 +15%'},
  watch:      {n:'瞭望塔', cost:90, hp:450, r:30, t:3, s:'視野30・反隱・辨識兵種', d:'大範圍視野，揭露隱身並辨識兵種'},
  trap:       {n:'符文陷阱', cost:60, hp:100, r:2.5, t:1, s:'隱形・踏入定身2秒', d:'隱形放置；踏入的敵軍定身 2 秒'},
  supply:     {n:'補給站', cost:150, hp:850, r:9, t:3, s:'部隊與指揮官回血・可整編', d:'範圍內的部隊與指揮官每秒回復 3% 生命，可在此整編兵種'}
};
const BKEYS = Object.keys(BUILDS);
const BPREF = {pike:['cheval','trench','banner'], shield:['banner','supply','trench'], cav:['banner','barracks','watch'], archer:['trench','arrowtower','watch'],
  mage:['obelisk','watch','banner'], scout:['trap','watch','banner'], griffin:['banner','watch','arrowtower'], siege:['supply','arrowtower','banner'], priest:['supply','banner','watch']};
Object.assign(BPREF, {templar:['banner','supply','cheval'], longbow:['trench','arrowtower','watch'], revenant:['banner','barracks','trap'], necro:['obelisk','trench','watch']});

// ================= voice =================
const VO = {
  valen:{select:'以盾為城，以身為牆！', start:'聖輝的將士們，隨我出征！', move:'全軍聽令，向此處列陣！', hold:'就地固守！一步不退！', advance:'盾牌在前，推進！', rally:'回到我身邊，結陣！', retreat:'穩住陣腳，有序後撤！', charge:'舉盾，衝鋒！', focus:'集中攻勢，擊潰他們！', ambush:'伏下！等我號令！', form:'變陣！', skill:'兵團，展現你們的本事！', q:'築牆！擋住他們！', r:'此城，永不陷落！', kill:'敵將已斬！', death:'防線，交給你們了……', tower:'敵塔已破，繼續推進！', low:'重整旗鼓，暫且後撤！'},
  sylvie:{select:'風在我這邊，獵物就在前方。', start:'弓已上弦，讓他們見識遊俠的厲害！', move:'換位！搶下最好的射界！', hold:'就在這裡，拉滿弓等著！', advance:'跟著箭雨，壓上去！', rally:'別走散了，回到我身邊！', retreat:'拉開距離，撤！', charge:'全速突進，一個都別放過！', focus:'所有箭，射穿它！', ambush:'藏進林子，屏住呼吸。', form:'散成射擊陣列！', skill:'讓他們嚐嚐我們的箭！', q:'箭雨，落下！', r:'萬箭，穿雲！', kill:'一箭封喉！', death:'這次，是我失手了……', tower:'塔倒了，下一座！', low:'我得退一步……'},
  orion:{select:'星辰，已為我們指明道路。', start:'星象昭示，此戰必勝！', move:'循星圖而行，至彼處結陣。', hold:'在此立陣，靜候星辰之時！', advance:'向前！讓法術為我們開路！', rally:'歸位，回到我身旁。', retreat:'退！保存法力！', charge:'以星火之勢，突擊！', focus:'萬般法術，集中於此！', ambush:'隱於暗影，待其入陣。', form:'重組法陣！', skill:'釋放你們的力量！', q:'星辰，墜落吧！', r:'時間，為我停止！', kill:'命運，已然注定。', death:'星光，黯淡了……', tower:'屏障，已碎！', low:'吾需冥想片刻……'},
  gru:{select:'吼！狩獵開始了！', start:'狼群們！撕碎他們！', move:'去那邊！快！快！', hold:'守住這塊地盤！誰都別想過！', advance:'往前衝！撕開他們的陣線！', rally:'狼群！回來！', retreat:'退！先退！', charge:'衝啊！踩爛他們！', focus:'咬住那一個！別鬆口！', ambush:'趴下，等獵物送上門！', form:'換陣！', skill:'給我上！', q:'兄弟們，出來吃肉了！', r:'萬獸，奔騰！', kill:'獵物到手！哈！', death:'狼群，會替我報仇……', tower:'石頭堆倒了！哈哈！', low:'可惡，先撤！'},
  brand:{select:'火藥裝填完畢，開工！', start:'攻城隊，給我轟開他們的大門！', move:'把傢伙推到那邊去！', hold:'架好砲位，原地待命！', advance:'推進！拆了它！', rally:'都回來，別亂跑！', retreat:'撤！別炸到自己人！', charge:'全速前進，撞上去！', focus:'集中火力，轟那個！', ambush:'先藏好，等他們靠近再炸！', form:'調整陣形！', skill:'讓他們見識工程的力量！', q:'點火，閃開！', r:'巨像，給我醒來！', kill:'拆除完畢！', death:'計算，失誤……', tower:'轟！又倒一座！', low:'機件受損，回去修理！'},
  raven:{select:'影子，從不缺席。', start:'夜色降臨，獵殺開始。', move:'換個位置，別讓他們看見。', hold:'在這裡等。', advance:'無聲推進。', rally:'回到影子裡來。', retreat:'撤，不留痕跡。', charge:'就是現在，出手！', focus:'目標，就是他。', ambush:'埋伏。讓他們自己走進來。', form:'換陣。', skill:'動手。', q:'烏鴉，替我盯著。', r:'影襲！', kill:'無聲無息。', death:'影子，散了……', tower:'防線，已有破口。', low:'先隱入黑暗。'}
};
const VP = {valen:{g:'m', p:0.78, r:0.9, c:'#B9D7F7'}, sylvie:{g:'f', p:1.12, r:1.08, c:'#CFE3A6'}, orion:{g:'m', p:0.62, r:0.8, c:'#DCC8FA'},
  gru:{g:'m', p:0.42, r:0.92, c:'#EBC08E'}, brand:{g:'m', p:0.98, r:1.15, c:'#F4C27E'}, raven:{g:'f', p:0.82, r:1.02, c:'#D4D4E2'}};
const BIG = new Set(['select','start','charge','r','kill','tower','skill']);
const SET = {voice:true, sfx:true, music:true, amb:true, shadow:true, bloom:true, quick:false, hardAI:false, eliteAlly:true, vol:0.9, vmap:{}};
try { const s = JSON.parse(localStorage.getItem('fhwz-set') || '{}'); Object.assign(SET, s); if (!SET.vmap) SET.vmap = {}; } catch (e) {}
delete SET.cmdAtk;
const saveSet = () => { try { localStorage.setItem('fhwz-set', JSON.stringify(SET)); } catch (e) {} };
let voices = [], zhVoices = [], AUTOV = {};
const MALE = /(男|male|yunjhe|zhiwei|kangkang|yunxi|yunyang|yunjian|yunfeng|yunhao|yunze|yunye|wan ?lung|li-?mu|liang|danny|guy)/i;
const FEMALE = /(女|female|hsiao|mei-?jia|ting-?ting|yating|hanhan|xiaoxiao|xiaoyi|huihui|yaoyao|sin-?ji|tracy|hiugaai|hiumaan|shan-?shan|lili|yu-?shu|google)/i;
function loadVoices() {
  try { voices = speechSynthesis.getVoices() || []; } catch (e) { voices = []; }
  zhVoices = voices.filter(v => /^(zh|cmn|yue)/i.test(v.lang));
  zhVoices.sort((a, b) => (/TW|Hant/i.test(b.lang) ? 1 : 0) - (/TW|Hant/i.test(a.lang) ? 1 : 0));
  AUTOV = {}; const used = new Set();
  const gender = v => MALE.test(v.name) ? 'm' : FEMALE.test(v.name) ? 'f' : 'u';
  for (const k of ['valen','sylvie','gru','raven','orion','brand']) {
    const want = VP[k].g;
    const v = zhVoices.find(x => !used.has(x.voiceURI) && gender(x) === want) || zhVoices.find(x => !used.has(x.voiceURI) && gender(x) === 'u') || zhVoices.find(x => !used.has(x.voiceURI)) || zhVoices.find(x => gender(x) === want) || zhVoices[0] || null;
    if (v) { AUTOV[k] = v; used.add(v.voiceURI); }
  }
  if (phase === 'lobby' && ltab === 'cmd') drawLobbyPanel();
}
const voiceFor = k => (SET.vmap[k] && voices.find(v => v.voiceURI === SET.vmap[k])) || AUTOV[k] || null;
let lastSay = 0, bubble = null;
function speak(key, line) {
  if (!SET.voice || !line) return;
  try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(line); const v = voiceFor(key); if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'zh-TW'; u.pitch = VP[key].p; u.rate = VP[key].r; u.volume = Math.min(1, SET.vol + 0.1); speechSynthesis.speak(u); } catch (e) {}
}
function say(c, kind, force) {
  if (!c || c !== player) return;
  const line = VO[c.key][kind]; if (!line) return;
  const now = performance.now(); if (!force && now - lastSay < 1100) return;
  lastSay = now; bubble = {c, text:line, t:2.8}; sig(c.key, BIG.has(kind)); speak(c.key, line);
}
let AC = null;
function ac() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; } } if (AC && AC.state === 'suspended') AC.resume().catch(() => {}); return AC; }
function nbuf(a) { if (!a._nb) { const b = a.createBuffer(1, a.sampleRate, a.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random()*2 - 1; a._nb = b; } return a._nb; }
function env(a, t, peak, att, dec) { const g = a.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak*SET.vol), t + att); g.gain.exponentialRampToValueAtTime(0.0001, t + att + dec); g.connect(a.destination); return g; }
function osc(a, type, f0, f1, t, dur, dest) { const o = a.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur); o.connect(dest); o.start(t); o.stop(t + dur + 0.05); return o; }
function noise(a, t, dur, ft, fr, q, dest) { const s = a.createBufferSource(); s.buffer = nbuf(a); const f = a.createBiquadFilter(); f.type = ft; f.frequency.setValueAtTime(fr, t); f.Q.value = q || 1; s.connect(f); f.connect(dest); s.start(t); s.stop(t + dur); return f; }
function lp(a, fr, dest) { const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = fr; f.connect(dest); return f; }
const SIG = {
  valen:(a, t, big) => { const g = env(a, t, 0.16, 0.05, big ? 1.1 : 0.6), l = lp(a, 900, g); [110, 165, 220].forEach(f => osc(a, 'sawtooth', f*0.95, f, t, big ? 1.1 : 0.6, l)); const g2 = env(a, t, 0.12, 0.005, 0.35); noise(a, t, 0.35, 'highpass', 3000, 0.7, g2); osc(a, 'triangle', 1250, 1180, t, 0.35, g2); },
  sylvie:(a, t, big) => { const g = env(a, t, 0.18, 0.005, 0.3); osc(a, 'triangle', 220, 90, t, 0.3, g); if (big) { const g2 = env(a, t + 0.12, 0.07, 0.03, 0.5); osc(a, 'sine', 2100, 1300, t + 0.12, 0.5, g2); } const g3 = env(a, t, 0.05, 0.01, 0.2); noise(a, t, 0.2, 'bandpass', 4000, 3, g3); },
  orion:(a, t, big) => { [880, 1320, 1760, 2640].slice(0, big ? 4 : 2).forEach((f, i) => { const g = env(a, t + i*0.07, 0.06, 0.01, 0.9); osc(a, 'sine', f, f, t + i*0.07, 0.9, g); }); const g = env(a, t, 0.07, 0.2, 0.8); noise(a, t, 1, 'bandpass', 2500, 6, g); },
  gru:(a, t, big) => { const g = env(a, t, 0.24, 0.05, 0.7), l = lp(a, 520, g); osc(a, 'sawtooth', 78, 58, t, 0.7, l); noise(a, t, 0.7, 'lowpass', 380, 1, g); if (big) { const g2 = env(a, t + 0.3, 0.09, 0.2, 1.0); const o = a.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(380, t + 0.3); o.frequency.linearRampToValueAtTime(720, t + 0.7); o.frequency.linearRampToValueAtTime(520, t + 1.4); o.connect(g2); o.start(t + 0.3); o.stop(t + 1.5); } },
  brand:(a, t, big) => { const g = env(a, t, big ? 0.42 : 0.24, 0.005, big ? 0.9 : 0.5); noise(a, t, big ? 0.9 : 0.5, 'lowpass', big ? 500 : 900, 0.8, g); osc(a, 'sine', 90, 40, t, 0.5, g); const g2 = env(a, t, 0.06, 0.003, 0.12); osc(a, 'square', 600, 500, t, 0.12, g2); },
  raven:(a, t, big) => { for (let i = 0; i < (big ? 2 : 1); i++) { const g = env(a, t + i*0.22, 0.1, 0.01, 0.18); const bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 3; bp.connect(g); osc(a, 'sawtooth', 950, 700, t + i*0.22, 0.18, bp); } const g2 = env(a, t, 0.08, 0.1, 0.4); const f = noise(a, t, 0.5, 'bandpass', 600, 2, g2); f.frequency.exponentialRampToValueAtTime(3000, t + 0.45); }
};
function sig(key, big) { if (!SET.sfx) return; const a = ac(); if (!a) return; try { SIG[key](a, a.currentTime + 0.01, big); if (big) { const g = env(a, a.currentTime, 0.3, 0.005, 0.4); osc(a, 'sine', 70, 45, a.currentTime, 0.4, g); } } catch (e) {} }
function tone(freqs, type, dur, vol, filt) {
  if (!SET.sfx) return; const a = ac(); if (!a) return;
  try { const t = a.currentTime, g = env(a, t, vol, 0.04, dur); const out = filt ? lp(a, filt, g) : g; freqs.forEach(fr => osc(a, type, fr*0.96, fr, t, dur, out)); } catch (e) {}
}
const horn = () => tone([146.8, 220, 293.6], 'sawtooth', 0.7, 0.1, 1100);
const chime = () => tone([660, 990], 'sine', 0.5, 0.08);
const drum = () => tone([70, 55], 'triangle', 0.45, 0.3);

// ================= map =================
const LANES = {top:[[-80,80],[-80,-80],[80,-80]], mid:[[-80,80],[80,-80]], bot:[[-80,80],[80,80],[80,-80]]};
const LKEYS = ['top','mid','bot'];
const LNAME = {top:'上路', mid:'中路', bot:'下路'};
const POLY = [{}, {}];
for (const l of LKEYS) for (const t of [0,1]) {
  const pts = LANES[l].map(a => ({x:a[0], z:a[1]})); if (t) pts.reverse();
  let acc = 0; const segs = [];
  for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i+1]; const L = Math.hypot(b.x-a.x, b.z-a.z); segs.push({a, b, L, s:acc}); acc += L; }
  POLY[t][l] = {segs, len:acc};
}
function lproj(Pl, x, z) {
  let best = 1e9, bs = 0;
  for (const g of Pl.segs) { const dx = g.b.x-g.a.x, dz = g.b.z-g.a.z; let t = ((x-g.a.x)*dx + (z-g.a.z)*dz) / (g.L*g.L); t = t < 0 ? 0 : t > 1 ? 1 : t; const px = g.a.x + dx*t, pz = g.a.z + dz*t, dd = (px-x)**2 + (pz-z)**2; if (dd < best) { best = dd; bs = g.s + t*g.L; } }
  return {s:bs, d:Math.sqrt(best)};
}
function lpoint(Pl, s) {
  s = Math.max(0, Math.min(Pl.len, s));
  for (const g of Pl.segs) if (s <= g.s + g.L + 1e-6) { const t = (s - g.s) / g.L; return {x:g.a.x + (g.b.x-g.a.x)*t, z:g.a.z + (g.b.z-g.a.z)*t}; }
  const g = Pl.segs[Pl.segs.length-1]; return {x:g.b.x, z:g.b.z};
}
function nearestLane(x, z) { let b = 'mid', bd = 1e9; for (const l of LKEYS) { const d = lproj(POLY[0][l], x, z).d; if (d < bd) { bd = d; b = l; } } return b; }
const TW0 = {top:[[-80,-20.8],[-80,11.5],[-80,43.75]], mid:[[-16,16],[-33.7,33.7],[-51.3,51.3]], bot:[[20.8,80],[-11.5,80],[-43.75,80]]};
const TW1 = {top:TW0.bot.map(p => [-p[0],-p[1]]), mid:TW0.mid.map(p => [-p[0],-p[1]]), bot:TW0.top.map(p => [-p[0],-p[1]])};
const CORE = [{x:-84, z:84}, {x:84, z:-84}];
const SPAWN = [{x:-94, z:94}, {x:94, z:-94}];
const SPTS = [{k:'granary', x:-55, z:25, n:'青麥糧倉'}, {k:'granary', x:55, z:-25, n:'赤岩糧倉'}, {k:'beacon', x:-35, z:-5, n:'蒼崖烽火台'}, {k:'beacon', x:35, z:5, n:'焰丘烽火台'}];
const BUSH0 = [[-70, 10, 5], [-10, 70, 5], [-38, 22, 5], [-22, 38, 5], [-22, -6, 4], [-6, 22, 4], [-60, -34, 5], [34, 60, 5]];
const BUSHES = BUSH0.concat(BUSH0.map(b => [-b[0], -b[1], b[2]]));
function bushAt(x, z) { for (let i = 0; i < BUSHES.length; i++) { const b = BUSHES[i]; if ((x - b[0])**2 + (z - b[1])**2 < b[2]*b[2]) return i; } return -1; }
function inRiver(x, z) { if (Math.abs(x - z)/Math.SQRT2 < 7.5) { if (x*x + z*z < 64 || (x + 80)**2 + (z + 80)**2 < 81 || (x - 80)**2 + (z - 80)**2 < 81) return false; return true; } return (x + 48)**2 + (z + 48)**2 < 144 || (x - 48)**2 + (z - 48)**2 < 144; }
// ---- river walls: deep water is impassable; cross only on the mid bridge, the two corner fords or the two lair shallows ----
const SQ2 = Math.SQRT2;
const CROSS = [{v:0, hw:3.2}, {v:-48*SQ2, hw:7.5}, {v:48*SQ2, hw:7.5}, {v:-80*SQ2, hw:4.6}, {v:80*SQ2, hw:4.6}];
function deepWater(x, z) {
  const u = (x - z)/SQ2; if (Math.abs(u) >= 8.4) return false;
  const v = Math.abs((x + z)/SQ2);
  // straight crossing strips (no rounded corners to snag on): bridge deck, lair shallows, corner fords
  return !(v < 4.3 || Math.abs(v - 48*SQ2) < 9 || Math.abs(v - 80*SQ2) < 6);
}
const walksOnGround = e => (e.kind === 'cmd' || e.kind === 'min' || (e.kind === 'sol' && !UNITS[e.utype].fly));
function riverWay(e, tx, tz) {
  const eu = (e.x - e.z)/SQ2, ev = (e.x + e.z)/SQ2, tu = (tx - tz)/SQ2, tv = (tx + tz)/SQ2;
  if (Math.sign(eu) === Math.sign(tu)) return null;
  let best = null, bd = 1e9;
  if (Math.abs(eu) < 8.4) best = CROSS.find(c => Math.abs(ev - c.v) <= c.hw + 1.5) || null;   // already wading a crossing: finish it
  if (!best) for (const c of CROSS) { const d = Math.abs(ev - c.v) + Math.abs(tv - c.v); if (d < bd) { bd = d; best = c; } }
  if (Math.abs(eu) < 8.4 && Math.abs(ev - best.v) <= best.hw + 1.5) { const u = Math.sign(tu || 1)*10, v = Math.max(best.v - best.hw, Math.min(best.v + best.hw, ev)); return {x:(u + v)/SQ2, z:(v - u)/SQ2}; }
  const inLane = Math.abs(ev - best.v) <= best.hw;
  const u = inLane ? Math.sign(tu || 1)*10 : Math.sign(eu || -tu || 1)*10, v = best.v;
  return {x:(u + v)/SQ2, z:(v - u)/SQ2};
}
function riverWall() {
  for (const e of ents) {
    if (e.dead || !walksOnGround(e) || (e.kind === 'cmd' && e.respawn > 0)) continue;
    if (!deepWater(e.x, e.z)) { e.okx = e.x; e.okz = e.z; continue; }
    if (e.okx !== undefined && !deepWater(e.okx, e.okz)) {
      // slide along the wall: keep the part of the move that stays on walkable ground
      const dx = e.x - e.okx, dz = e.z - e.okz, L = Math.hypot(dx, dz), pa = (dx + dz)/SQ2, pb = (dx - dz)/SQ2;
      const ax = [[pa, 1, 1], [pb, 1, -1]].sort((p, q) => Math.abs(q[0]) - Math.abs(p[0]));
      let c = {x:e.okx, z:e.okz};
      for (const [p, ux, uz] of ax) {
        if (Math.abs(p) < 1e-6) continue;
        const k = Math.sign(p)*L/SQ2, t = {x:e.okx + ux*k, z:e.okz + uz*k};
        if (!deepWater(t.x, t.z)) { c = t; break; }
      }
      e.x = c.x; e.z = c.z;
    } else {   // dropped into deep water (blink, knock-back, spawn): step out onto the nearest bank
      const u = (e.x - e.z)/SQ2, v = (e.x + e.z)/SQ2, nu = (u >= 0 ? 1 : -1)*8.6;
      e.x = (nu + v)/SQ2; e.z = (v - nu)/SQ2;
    }
    e.okx = e.x; e.okz = e.z;
  }
}
const d2 = (a, b) => (a.x-b.x)**2 + (a.z-b.z)**2;
const dist = (a, b) => Math.sqrt(d2(a, b));
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const rnd = (a, b) => a + Math.random()*(b-a);
const pick = a => a[Math.floor(Math.random()*a.length)];
const fmt = s => String(Math.floor(s/60)).padStart(2,'0') + ':' + String(Math.floor(s%60)).padStart(2,'0');
const rot = (o, f) => ({x:o.x*Math.cos(f) + o.z*Math.sin(f), z:-o.x*Math.sin(f) + o.z*Math.cos(f)});
function clampPt(o, p, range) { const dx = p.x - o.x, dz = p.z - o.z, L = Math.hypot(dx, dz); const q = L > range ? {x:o.x + dx/L*range, z:o.z + dz/L*range} : {x:p.x, z:p.z}; q.x = clamp(q.x, -97, 97); q.z = clamp(q.z, -97, 97); return q; }

// ================= three setup =================
const canvas = $('gl');
const renderer = new THREE.WebGLRenderer({canvas, antialias:true});
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#0B0E12');
scene.fog = new THREE.Fog('#0B0E12', 130, 240);
const camera = new THREE.PerspectiveCamera(40, 1, 1, 600);
scene.add(new THREE.HemisphereLight('#d6e0ff', '#3a3020', 0.85));
const sun = new THREE.DirectionalLight('#ffe9c4', 1.1);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, {left:-55, right:55, top:55, bottom:-55, near:10, far:220});
scene.add(sun); scene.add(sun.target);
const world = new THREE.Group(); scene.add(world);
scene.fog = new THREE.Fog('#1A2018', 140, 260); scene.background = new THREE.Color('#1A2018');
const lmat = (c, o = {}) => new THREE.MeshLambertMaterial(Object.assign({color:c}, o));
// ---------- post-processing & water ----------
let composer = null, rPass = null, bloomPass = null;
function setupComposer() {
  try {
    if (!THREE.EffectComposer || !THREE.RenderPass || !THREE.UnrealBloomPass) return;
    composer = new THREE.EffectComposer(renderer); rPass = new THREE.RenderPass(scene, camera); composer.addPass(rPass);
    bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(512, 512), 0.5, 0.45, 0.9); composer.addPass(bloomPass);
  } catch (e) { composer = null; }
}
function draw3d(sc, cam) { if (composer && SET.bloom) { try { rPass.scene = sc; rPass.camera = cam; composer.render(); return; } catch (e) { composer = null; } } renderer.render(sc, cam); }
const waterU = {t:{value:0}};
function waterMat(circ) {
  return new THREE.ShaderMaterial({uniforms:{t:waterU.t, circ:{value:circ ? 1 : 0}}, transparent:true, depthWrite:false,
    vertexShader:'varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }',
    fragmentShader:'uniform float t; uniform float circ; varying vec2 vUv; varying vec3 vW; void main(){ float e = circ > 0.5 ? 1.0 - length(vUv - 0.5)*2.0 : 1.0 - abs(vUv.x - 0.5)*2.0; float w1 = sin(vW.x*0.35 + vW.z*0.22 + t*1.3)*0.5 + 0.5; float w2 = sin(-vW.x*0.27 + vW.z*0.41 - t*0.9)*0.5 + 0.5; float w3 = sin(vW.x*0.9 - vW.z*0.7 + t*2.1)*0.5 + 0.5; float c = pow(w1*w2, 3.0) + pow(w3, 12.0)*0.35; vec3 deep = vec3(0.07, 0.2, 0.33); vec3 shal = vec3(0.2, 0.45, 0.55); vec3 col = mix(shal, deep, smoothstep(0.0, 0.7, e)) + c*0.22; col += smoothstep(0.12, 0.0, e)*vec3(0.35, 0.4, 0.38); gl_FragColor = vec4(col, smoothstep(0.0, 0.12, e)*0.93); }'});
}
// ---------- battlefield ----------
(function buildMap() {
  const tg = TX.grass();
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshStandardMaterial({map:tg, roughness:1, metalness:0}));
  tg.repeat.set(30, 30);
  ground.rotation.x = -Math.PI/2; ground.receiveShadow = true; scene.add(ground);
  // outer cliffs
  const cliffM = new THREE.MeshStandardMaterial({map:TX.rock(), color:'#8A8478', flatShading:true, roughness:1});
  const cliffs = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), cliffM, 220);
  const dm = new THREE.Object3D(); let ci = 0;
  for (let i = 0; i < 220; i++) {
    const side = i % 4, tpos = (Math.floor(i/4)/55)*220 - 110, off = 104 + rr()*10;
    const x = side === 0 ? tpos : side === 1 ? tpos : side === 2 ? -off : off, z = side === 0 ? -off : side === 1 ? off : tpos;
    const s = 4 + rr()*6;
    dm.position.set(x, s*0.35, z); dm.scale.set(s, s*(0.7 + rr()*0.8), s); dm.rotation.set(rr()*3, rr()*3, rr()*3); dm.updateMatrix(); cliffs.setMatrixAt(ci++, dm.matrix);
  }
  cliffs.castShadow = true; cliffs.receiveShadow = true; scene.add(cliffs);
  // river
  const bank = new THREE.Mesh(new THREE.PlaneGeometry(22, 300), new THREE.MeshStandardMaterial({color:'#4A3E2C', roughness:1}));
  bank.rotation.x = -Math.PI/2; bank.rotation.z = Math.PI/4; bank.position.y = 0.02; bank.receiveShadow = true; scene.add(bank);
  const river = new THREE.Mesh(new THREE.PlaneGeometry(17, 300, 1, 1), waterMat(false));
  river.rotation.x = -Math.PI/2; river.rotation.z = Math.PI/4; river.position.y = 0.12; river.renderOrder = 1; scene.add(river);   // above the lane dirt (0.05–0.06) so they never z-fight
  for (const p of [[-48,-48],[48,48]]) {
    const pb = new THREE.Mesh(new THREE.CircleGeometry(15, 40), bank.material); pb.rotation.x = -Math.PI/2; pb.position.set(p[0], 0.025, p[1]); scene.add(pb);
    const pit = new THREE.Mesh(new THREE.CircleGeometry(13, 40), waterMat(true)); pit.rotation.x = -Math.PI/2; pit.position.set(p[0], 0.125, p[1]); pit.renderOrder = 1; scene.add(pit);
    for (let i = 0; i < 12; i++) { const a = i/12*Math.PI*2, broken = i % 3 === 0; const h = broken ? 1.5 + rr()*1.5 : 5 + rr()*2; const col = add(scene, CY(0.7, 0.85, h, 10), MT('#ffffff', {map:TX.stone()}), p[0] + Math.sin(a)*16.5, h/2, p[1] + Math.cos(a)*16.5, 0, 0, 0, true); if (!broken) add(scene, B(1.9, 0.5, 1.9), MT(P.stoneD), p[0] + Math.sin(a)*16.5, h + 0.25, p[1] + Math.cos(a)*16.5); }
  }
  // lanes
  const td = TX.dirt();
  for (const l of LKEYS) for (const g of POLY[0][l].segs) {
    const tex = td.clone(); tex.needsUpdate = true; tex.repeat.set(1, (g.L + 12)/12);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(13, g.L + 12), new THREE.MeshStandardMaterial({map:tex, roughness:1}));
    m.rotation.x = -Math.PI/2; m.rotation.z = -Math.atan2(g.b.x - g.a.x, -(g.b.z - g.a.z));
    m.position.set((g.a.x + g.b.x)/2, 0.05 + (l === 'mid' ? 0.01 : 0), (g.a.z + g.b.z)/2); m.receiveShadow = true; scene.add(m);
  }
  // mid bridge + corner fords
  { const br = new THREE.Group(); const wd = woodM(); const ang = Math.atan2(160, -160);
    add(br, B(9, 0.5, 24), wd, 0, 0.6, 0, 0, 0, 0, true);
    for (const s of [-1, 1]) { for (let i = -5; i <= 5; i++) add(br, CY(0.18, 0.2, 1.6, 6), wd, s*4.4, 1.3, i*2.2); add(br, B(0.25, 0.25, 24), wd, s*4.4, 2.0, 0); }
    for (const s of [-1, 1]) add(br, B(9.6, 1.2, 1.4), MT('#ffffff', {map:TX.stone()}), 0, 0.4, s*12.4);
    br.rotation.y = ang; br.position.set(0, 0, 0); scene.add(br); }
  for (const p of [[-80, -80], [80, 80]]) for (let i = 0; i < 14; i++) { const a = rr()*6.28, r = rr()*8; const st = add(scene, DO(1.2 + rr()*0.8, 0), MT('#ffffff', {map:TX.stone()}), p[0] + Math.sin(a)*r, 0.15, p[1] + Math.cos(a)*r, rr(), rr(), rr()); st.scale.y = 0.25; st.receiveShadow = true; }
  // bases
  for (const t of [0, 1]) {
    const pz = new THREE.Mesh(new THREE.CircleGeometry(21, 48), new THREE.MeshStandardMaterial({map:TX.plaza(), roughness:0.95}));
    pz.rotation.x = -Math.PI/2; pz.position.set(CORE[t].x, 0.07, CORE[t].z); pz.receiveShadow = true; scene.add(pz);
    const rr2 = ring(19.6, 20.4, TC[t], 0.7); rr2.position.set(CORE[t].x, 0.09, CORE[t].z); scene.add(rr2);
    const sp = ring(8.4, 9, '#F1D29A', 0.7); sp.position.set(SPAWN[t].x, 0.1, SPAWN[t].z); scene.add(sp);
    const sd = disc(8.4, TC[t], 0.2); sd.position.set(SPAWN[t].x, 0.09, SPAWN[t].z); scene.add(sd);
    const sg = add(scene, PL(9, 9), MT('#ffffff', {map:TX.emblem(t), alpha:1}), SPAWN[t].x, 0.12, SPAWN[t].z, -Math.PI/2, 0, 0);
    const exits = LKEYS.map(l => { const q = lpoint(POLY[t][l], 26); return Math.atan2(q.x - CORE[t].x, q.z - CORE[t].z); });
    const bk = brickM();
    for (let i = 0; i < 40; i++) {
      const a = i/40*Math.PI*2; if (exits.some(e => Math.abs(Math.atan2(Math.sin(a - e), Math.cos(a - e))) < 0.32)) continue;
      add(scene, B(3.3, 2.6, 1.2), bk, CORE[t].x + Math.sin(a)*22, 1.3, CORE[t].z + Math.cos(a)*22, 0, a, 0, true);
      if (i % 2 === 0) add(scene, B(1.0, 0.8, 1.3), bk, CORE[t].x + Math.sin(a)*22, 3.0, CORE[t].z + Math.cos(a)*22, 0, a, 0);
    }
    for (const e of exits) for (const s of [-1, 1]) { const a = e + s*0.38; const x = CORE[t].x + Math.sin(a)*22, z = CORE[t].z + Math.cos(a)*22; add(scene, CY(1.2, 1.4, 4.5, 10), bk, x, 2.25, z, 0, 0, 0, true); add(scene, CY(0.5, 0.35, 0.6, 8), metal(P.steelD), x, 4.8, z); add(scene, CO(0.4, 1.0, 6), glow('#F2A33A', 1), x, 5.5, z); add(scene, PL(1.4, 2.6), clothM(t), x, 2.6, z, 0, a, 0); }
  }
  // vegetation
  const blocked = (x, z, pad = 0) => {
    if (Math.abs(x) > 99 || Math.abs(z) > 99) return true;
    if (Math.abs(x - z)/Math.SQRT2 < 12 + pad) return true;
    if (Math.hypot(x + 48, z + 48) < 19 || Math.hypot(x - 48, z - 48) < 19) return true;
    if (Math.hypot(x - CORE[0].x, z - CORE[0].z) < 28 || Math.hypot(x - CORE[1].x, z - CORE[1].z) < 28) return true;
    for (const l of LKEYS) if (lproj(POLY[0][l], x, z).d < 10 + pad) return true;
    for (const s of SPTS) if (Math.hypot(x - s.x, z - s.z) < 12) return true;
    for (const b of BUSHES) if (Math.hypot(x - b[0], z - b[1]) < b[2] + 2) return true;
    return false;
  };
  const pick2 = (n, pad, tries = 9000) => { const out = []; let k = 0; while (out.length < n && k++ < tries) { const x = rr()*200 - 100, z = rr()*200 - 100; if (!blocked(x, z, pad)) out.push([x, z]); } return out; };
  const inst = (geo2, mat, list, f, shadow = true) => { const im = new THREE.InstancedMesh(geo2, mat, Math.max(1, list.length)); list.forEach((p, i) => { f(dm, p, i); dm.updateMatrix(); im.setMatrixAt(i, dm.matrix); }); im.count = list.length; im.castShadow = shadow; im.receiveShadow = true; scene.add(im); return im; };
  const trunkM = new THREE.MeshStandardMaterial({color:'#5A4028', flatShading:true, roughness:1});
  const pineM = [new THREE.MeshStandardMaterial({color:'#2F5A3A', flatShading:true, roughness:0.95}), new THREE.MeshStandardMaterial({color:'#3A6B42', flatShading:true, roughness:0.95}), new THREE.MeshStandardMaterial({color:'#4A7E4C', flatShading:true, roughness:0.95})];
  const pines = pick2(230, 0);
  const ps = pines.map(() => 0.75 + rr()*0.7);
  inst(new THREE.CylinderGeometry(0.3, 0.45, 2.4, 6), trunkM, pines, (o, p, i) => { o.position.set(p[0], 1.2*ps[i], p[1]); o.scale.setScalar(ps[i]); o.rotation.set(0, 0, 0); });
  [[2.6, 3.4, 2.6], [2.0, 3.0, 4.4], [1.3, 2.6, 6.0]].forEach((c, k) => inst(new THREE.ConeGeometry(c[0], c[1], 8), pineM[k], pines, (o, p, i) => { o.position.set(p[0], c[2]*ps[i], p[1]); o.scale.setScalar(ps[i]); o.rotation.set(0, i, 0); }));
  const oaks = pick2(120, 0), os = oaks.map(() => 0.8 + rr()*0.6);
  inst(new THREE.CylinderGeometry(0.35, 0.55, 3, 7), trunkM, oaks, (o, p, i) => { o.position.set(p[0], 1.5*os[i], p[1]); o.scale.setScalar(os[i]); o.rotation.set(0, 0, 0); });
  const oakM = new THREE.MeshStandardMaterial({color:'#4E7A3A', flatShading:true, roughness:0.95});
  const blobs = []; oaks.forEach((p, i) => { for (let k = 0; k < 3; k++) blobs.push([p[0] + Math.sin(k*2.1 + i)*1.2*os[i], p[1] + Math.cos(k*2.1 + i)*1.2*os[i], os[i], 3.6 + k*0.5]); });
  const oakI = inst(new THREE.IcosahedronGeometry(1.9, 0), oakM, blobs, (o, p) => { o.position.set(p[0], p[3]*p[2], p[1]); o.scale.set(p[2], p[2]*0.85, p[2]); o.rotation.set(p[0], p[1], 0); });
  const bushM = new THREE.MeshStandardMaterial({color:'#2E4A2A', flatShading:true, roughness:1});
  const bb = []; BUSHES.forEach(b => { for (let k = 0; k < 14; k++) { const a = k/14*Math.PI*2 + rr(), r = rr()*b[2]*0.85; bb.push([b[0] + Math.sin(a)*r, b[1] + Math.cos(a)*r, 0.9 + rr()*0.6]); } });
  inst(new THREE.IcosahedronGeometry(1.3, 0), bushM, bb, (o, p) => { o.position.set(p[0], 0.7*p[2], p[1]); o.scale.set(p[2]*1.2, p[2]*0.9, p[2]*1.2); o.rotation.set(p[0], p[1], 0); });
  const grass = []; let gk = 0; while (grass.length < 2600 && gk++ < 20000) { const x = rr()*196 - 98, z = rr()*196 - 98; if (Math.abs(x - z)/Math.SQRT2 < 10) continue; let onLane = false; for (const l of LKEYS) if (lproj(POLY[0][l], x, z).d < 6.8) onLane = true; if (onLane || Math.hypot(x - CORE[0].x, z - CORE[0].z) < 22 || Math.hypot(x - CORE[1].x, z - CORE[1].z) < 22) continue; grass.push([x, z]); }
  const gi = inst(new THREE.ConeGeometry(0.14, 0.75, 3), new THREE.MeshStandardMaterial({color:'#ffffff', roughness:1}), grass, (o, p, i) => { o.position.set(p[0], 0.35, p[1]); o.rotation.set((rr() - 0.5)*0.4, rr()*3, (rr() - 0.5)*0.4); o.scale.setScalar(0.7 + rr()*0.8); }, false);
  const gc = new THREE.Color(); grass.forEach((p, i) => { gc.set(['#5C7E45', '#4A6B38', '#6E8E4E', '#7A8A44', '#3E5A30'][i % 5]); gi.setColorAt(i, gc); }); if (gi.instanceColor) gi.instanceColor.needsUpdate = true;
  const flowers = grass.filter((p, i) => i % 7 === 0);
  const fi = inst(new THREE.SphereGeometry(0.16, 5, 4), new THREE.MeshStandardMaterial({color:'#ffffff', roughness:0.8}), flowers, (o, p) => { o.position.set(p[0] + 0.3, 0.55, p[1]); o.scale.setScalar(1); o.rotation.set(0, 0, 0); }, false);
  flowers.forEach((p, i) => { gc.set(['#E8D27A', '#D98AA8', '#F2F0E6', '#B0A0E8'][i % 4]); fi.setColorAt(i, gc); }); if (fi.instanceColor) fi.instanceColor.needsUpdate = true;
  const rocks = pick2(90, -3);
  inst(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshStandardMaterial({map:TX.rock(), flatShading:true, roughness:1}), rocks, (o, p) => { const s = 0.5 + rr()*1.4; o.position.set(p[0], s*0.35, p[1]); o.scale.set(s, s*0.7, s); o.rotation.set(rr(), rr(), rr()); });
  const edge = []; for (const l of LKEYS) for (const g of POLY[0][l].segs) for (let s = 0; s < g.L; s += 5.5) for (const sd of [-1, 1]) { const t = s/g.L, x = g.a.x + (g.b.x - g.a.x)*t, z = g.a.z + (g.b.z - g.a.z)*t, nx = -(g.b.z - g.a.z)/g.L, nz = (g.b.x - g.a.x)/g.L; const ex = x + nx*7*sd, ez = z + nz*7*sd; if (Math.abs(ex - ez)/Math.SQRT2 < 10 || Math.hypot(ex - CORE[0].x, ez - CORE[0].z) < 24 || Math.hypot(ex - CORE[1].x, ez - CORE[1].z) < 24) continue; edge.push([ex, ez]); }
  inst(new THREE.DodecahedronGeometry(0.5, 0), new THREE.MeshStandardMaterial({map:TX.rock(), flatShading:true, roughness:1}), edge, (o, p) => { const s = 0.6 + rr()*0.8; o.position.set(p[0], 0.15, p[1]); o.scale.set(s, s*0.5, s); o.rotation.set(rr(), rr(), rr()); }, false);
})();

const fogCv = document.createElement('canvas'); fogCv.width = fogCv.height = 128;
const fogCtx = fogCv.getContext('2d');
const fogTex = new THREE.CanvasTexture(fogCv);
const fogMesh = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshBasicMaterial({map:fogTex, transparent:true, depthWrite:false}));
fogMesh.rotation.x = -Math.PI/2; fogMesh.position.y = 0.2; fogMesh.renderOrder = 2; scene.add(fogMesh);

// ================= lobby scene =================
const lobby = new THREE.Scene();
lobby.background = new THREE.Color('#0A0C10');
lobby.fog = new THREE.Fog('#0A0C10', 26, 60);
const lcam = new THREE.PerspectiveCamera(32, 1, 0.5, 200);
const holder = new THREE.Group();
const lights = [];
(function buildLobby() {
  lobby.add(new THREE.HemisphereLight('#bfcaf0', '#2a2018', 0.55));
  const key = new THREE.SpotLight('#fff1d6', 1.5, 60, 0.5, 0.5); key.position.set(4, 16, 12); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); lobby.add(key); key.target = holder;
  const rim = new THREE.DirectionalLight('#7FB4F2', 0.5); rim.position.set(-8, 6, -8); lobby.add(rim);
  add(lobby, CY(16, 16, 0.4, 48), MT('#3A3630'), 0, -0.2, 0).receiveShadow = true;
  for (let i = 0; i < 24; i++) { const a = i/24*Math.PI*2; add(lobby, B(2.2, 0.06, 0.08), MT('#2C2924'), Math.sin(a)*9, 0.01, Math.cos(a)*9, 0, a); }
  add(lobby, CY(3.4, 3.8, 0.7, 32), MT('#5A554C'), 0, 0.35, 0).receiveShadow = true;
  add(lobby, TO(3.45, 0.06, Math.PI*2, 48), MT(P.gold, {m:0.6, r:0.3}), 0, 0.72, 0, Math.PI/2);
  add(lobby, B(40, 18, 1), MT('#1C1E22'), 0, 8.5, -11);
  for (const [x, c] of [[-6.5, TEAM[0]], [6.5, TEAM[1]]]) { add(lobby, B(3, 7.5, 0.1), MT(c), x, 8, -10.4); add(lobby, B(3.1, 0.3, 0.15), MT(P.gold), x, 11.8, -10.35); add(lobby, CY(0.6, 0.6, 0.08, 12), MT(P.gold, {m:0.6}), x, 8.6, -10.32, Math.PI/2); }
  for (const x of [-11, 11]) {
    add(lobby, CY(0.9, 1.0, 14, 10), MT('#4A463F'), x, 7, -8);
    add(lobby, CY(0.25, 0.15, 1.0, 8), MT(P.woodD), x*0.82, 5, -7); const f = add(lobby, CO(0.35, 0.9, 6), MT('#F29A3A', {e:'#F29A3A', ei:1}), x*0.82, 5.8, -7);
    const L = new THREE.PointLight('#FF9C4A', 1.2, 22, 2); L.position.set(x*0.82, 6.2, -6.6); lobby.add(L); lights.push({L, f});
  }
  lobby.add(holder); holder.position.y = 0.72;
})();
let lobbyModel = null, lobbyRotV = 0.35, lobbyDrag = null;
let lastShow = null;
function refreshLobbyModel() { if (lastShow && phase === 'lobby') showModel(lastShow[0], lastShow[1], lastShow[2]); }
function showModel(kind, key, skin) {
  lastShow = [kind, key, skin];
  while (holder.children.length) holder.remove(holder.children[0]);
  let m;
  if (kind === 'cmd') m = mkCommander(key, 0); else if (kind === 'unit') m = mkSoldier(key, 0); else if (kind === 'bld') { m = mkBuilding(key, 0); setOpacity(m, 1); } else m = mkCore(0);
  if (skin === undefined) skin = kind === 'cmd' ? mySkins(key).c : kind === 'unit' ? mySkins(key).u[key] || '' : '';
  if (skin) applySkin(m, skin);
  m.traverse(o => { if (o.isMesh) o.castShadow = true; });
  holder.add(m); lobbyModel = m;
  const box = new THREE.Box3().setFromObject(m), sz = new THREE.Vector3(), ct = new THREE.Vector3();
  box.getSize(sz); box.getCenter(ct);
  const fitH = Math.max(sz.y, Math.max(sz.x, sz.z)*0.75);
  const dd = fitH / (2*Math.tan(lcam.fov*Math.PI/360)) * 1.55 + 2;
  lcam.position.set(0, ct.y + fitH*0.22, dd); lcam.lookAt(0, ct.y, 0);
}

// ================= state =================
let ents = [], zones = [], fx = [], floaters = [], uid = 0;
let G = null, player = null, phase = 'lobby';
const PLAYER = () => player;
const intel = [{}, {}];
const visSrc = [[], []];
const ik = (c, k) => c.id + ':' + k;
function addEnt(o) { o.id = ++uid; o.dead = false; o.vis = [o.team === 0, o.team === 1]; o.slowF = 0; o.slowT = 0; o.stunT = 0; o.rootT = 0; o.atkT = rnd(0, 0.5); o.atkA = 0; o.px = o.x; o.pz = o.z; o.mv = 0; ents.push(o); if (o.mesh) { o.mesh.position.set(o.x, 0, o.z); world.add(o.mesh); } return o; }
const cmds = () => ents.filter(e => e.kind === 'cmd');
function newGrp() { return {utype:null, order:'rally', pt:null, face:0, form:'square', focus:null, t:0, arrived:false, mem:[], cent:{x:0, z:0}, skT:0, reformT:0, braceT:0, mor:100, routT:0, xp:0, rank:0, lastHitT:-9, msgT:-9}; }

function newGame(playerKey, lineup) {
  while (world.children.length) world.remove(world.children[0]);
  CORPSES.length = 0;
  ents = []; zones = []; fx = []; floaters = []; intel[0] = {}; intel[1] = {}; bubble = null;
  G = {time:0, waveT:4, visT:0, hudT:0, mmT:0, ravenT:[60, 60], over:false, muster:30, placing:null, aim:null, mouseT:-9, sel:'all', deploy:false, lastTap:null, tapT:-9, aiming:null, freeCam:null, mslot:0, mpick:[null, null], stats:{kills:0, deaths:0, towers:0, orders:0, skills:0, caps:0, objs:0}, lost:[0, 0], behind:-1, buff:[{}, {}], lastStand:[false, false], coreShield:[0, 0], obj:{titan:{t:240, ent:null}, dragon:{t:240, ent:null}}};
  G.flv = lineup === 'net' ? RMAX : lineup && lineup.flv ? lineup.flv : myRank();
  if (lineup !== 'net') for (const t of [0,1]) {
    const TW = t ? TW1 : TW0;
    for (const l of LKEYS) TW[l].forEach((p, i) => addEnt({kind:'tow', team:t, lane:l, tier:i+1, x:p[0], z:p[1], r:2.8, hp:1500 + i*300, maxHp:1500 + i*300, rng:14, mesh:mkTower(t, i)}));
    addEnt({kind:'core', team:t, x:CORE[t].x, z:CORE[t].z, r:5.5, hp:3600, maxHp:3600, rng:17, mesh:mkCore(t)});
  }
  const allies = CKEYS.filter(k => k !== playerKey).sort(() => Math.random() - 0.5).slice(0, 2);
  const foes = CKEYS.slice().sort(() => Math.random() - 0.5).slice(0, 3);
  const mk = (key, team, lane, isP) => {
    const d = CMDS[key];
    return addEnt({kind:'cmd', key, team, lane, isP, x:SPAWN[team].x + rnd(-3,3), z:SPAWN[team].z + rnd(-3,3), r:1.4, hp:d.hp, maxHp:d.hp,
      atk:d.atk, rng:d.rng, spd:d.spd, qT:0, rT:0, eT:0, lvl:1, xp:0, arm:{}, spent:0, st:{kills:0, deaths:0, solK:0, solL:0, towers:0, dmg:0, earned:300}, frenzyT:0, gold:300, builds:0, respawn:0, aiT:0, buildT:rnd(20, 40),
      facing:team ? Math.PI*0.75 : -Math.PI*0.25, faceS:team ? Math.PI*0.75 : -Math.PI*0.25, grp:[newGrp(), newGrp()], golemT:0, chargeAll:0, cmdA:0, streak:0, mesh:bake(mkCommander(key, team))});
  };
  if (lineup === 'net') player = null;
  else if (lineup) {   // online match on the server: humans and AI fill the six slots
    player = netDummy();
    for (const L of lineup) { const c = mk(L.key, L.team, LKEYS[L.slot], false); if (L.cid) { c.net = true; c.cid = L.cid; c.name = L.name; c.sk = L.sk || ''; c.skU = L.skU || {}; } else { c.smart = true; aiPickUnits(c); } }
  } else {
  player = mk(playerKey, 0, 'mid', true);
  const ac2 = [mk(allies[0], 0, 'top'), mk(allies[1], 0, 'bot')];
  const fc = [mk(foes[0], 1, 'top'), mk(foes[1], 1, 'mid'), mk(foes[2], 1, 'bot')];
  for (const c of ac2) rankAI(c, true);
  for (const c of fc) rankAI(c, false);
  for (const c of [...ac2, ...fc]) aiPickUnits(c);
  }
  for (const c of cmds()) skinCmd(c);
  for (const c of cmds()) for (const k of [0, 1]) intel[1 - c.team][ik(c, k)] = {st:0, hint:''};
  G.markers = [mkMarker(0), mkMarker(1)];
  G.aura = ring(15.5, 16, C.gold, 0.25); world.add(G.aura);
  G.ind = mkInd(); G.sps = SPTS.map(s => mkSP(s));
  refreshProt();
  phase = 'muster';
  $('lobby').classList.add('hidden');
  if (lineup === 'net') return;
  buildHud();
  showMuster();
}
function spawnSquad(c, k, half) {
  const g = c.grp[k], U = UNITS[g.utype];
  g.form = U.form;
  for (let i = 0; i < U.sq; i++) spawnSoldier(c, g.utype, c.x + rnd(-3,3), c.z + rnd(-3,3), half ? 0.5 : 1, 0, k);
}
function spawnSoldier(c, type, x, z, hpf = 1, temp = 0, grp = 0) {
  const U = UNITS[type];
  return armorUp(c, type, addEnt({kind:'sol', team:c.team, owner:c, utype:type, grp, x, z, r:type === 'cav' || type === 'siege' ? 1.1 : type === 'griffin' ? 1.0 : 0.7, hp:U.hp*(c.elite || 1)*hpf*(1 + 0.08*(c.grp[grp] ? c.grp[grp].rank : 0)), maxHp:U.hp*(c.elite || 1)*(1 + 0.08*(c.grp[grp] ? c.grp[grp].rank : 0)), temp,
    moveT:0, stillT:0, stealth:false, slotI:0, mesh:applySkin(bake(mkSoldier(type, c.team)), soldierSkin(c, type))}));
}
function squad(c, k) { return ents.filter(e => e.kind === 'sol' && e.owner === c && !e.dead && !isComp(e) && (k === undefined || e.grp === k)); }

// ---------- order markers ----------
function mkMarker(k) {
  const col = GCOL[k], m = {k};
  m.flag = new THREE.Group();
  add(m.flag, CY(0.07, 0.07, 3.2, 6), MT(P.woodD), 0, 1.6, 0);
  add(m.flag, B(1.3, 0.85, 0.05), MT(col, {e:col, ei:0.35}), 0.66, 2.75, 0);
  m.flag.add(ring(1.0, 1.35, col, 0.95));
  m.lg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(1, 0, 1)]);
  m.line = new THREE.Line(m.lg, new THREE.LineDashedMaterial({color:col, dashSize:1.2, gapSize:0.8, transparent:true, opacity:0.95}));
  m.slots = [];
  for (let i = 0; i < 16; i++) { const d = disc(0.42, col, 0.55); d.position.y = 0.16; world.add(d); m.slots.push(d); }
  m.arrow = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.6, 3), new THREE.MeshBasicMaterial({color:col, transparent:true, opacity:0.9, depthWrite:false}));
  m.arrow.rotation.x = Math.PI/2;
  m.arrowG = new THREE.Group(); m.arrowG.add(m.arrow); world.add(m.arrowG);
  world.add(m.flag); world.add(m.line);
  return m;
}
function updateMarkers() {
  if (!G || !G.markers || !player) return;
  for (const k of [0, 1]) {
    const m = G.markers[k], g = player.grp[k];
    const show = phase !== 'muster' && g.mem.length > 0 && ['move','hold','charge','ambush','advance','focus'].includes(g.order) && player.respawn <= 0;
    m.flag.visible = m.line.visible = m.arrowG.visible = show;
    for (const s of m.slots) s.visible = false;
    if (!show) continue;
    let pt = g.pt;
    if (g.order === 'advance') pt = g.adv || g.cent;
    if (g.order === 'focus' && g.focus) pt = {x:g.focus.x, z:g.focus.z};
    if (!pt) continue;
    m.flag.position.set(pt.x, 0, pt.z);
    const p = m.lg.attributes.position; p.setXYZ(0, g.cent.x, 0.4, g.cent.z); p.setXYZ(1, pt.x, 0.4, pt.z); p.needsUpdate = true; m.line.computeLineDistances();
    const f = g.face, sel = G.sel === 'all' || G.sel === k;
    m.arrowG.position.set(pt.x + Math.sin(f)*2.6, 0.5, pt.z + Math.cos(f)*2.6); m.arrowG.rotation.y = f;
    m.line.material.opacity = sel ? 0.95 : 0.45;
    if (g.order !== 'focus' && g.order !== 'advance') {
      const n = Math.min(8, g.mem.length);
      for (let i = 0; i < Math.min(n, m.slots.length); i++) { const o = rot(slotOff(g.form, i, n), f); m.slots[i].visible = true; m.slots[i].position.set(pt.x + o.x, 0.16, pt.z + o.z); m.slots[i].material.opacity = sel ? 0.55 : 0.25; }
    }
  }
}

// ---------- aim indicators ----------
function mkInd() {
  const mb = (op) => new THREE.MeshBasicMaterial({color:'#F1D29A', transparent:true, opacity:op, depthWrite:false, side:THREE.DoubleSide});
  const I = {};
  I.range = new THREE.Mesh(new THREE.RingGeometry(0.985, 1, 96), mb(0.75)); I.range.rotation.x = -Math.PI/2;
  I.rangeG = new THREE.Group(); I.rangeG.add(I.range); I.rangeG.position.y = 0.23;
  I.area = new THREE.Group(); I.a1 = new THREE.Mesh(new THREE.CircleGeometry(1, 48), mb(0.2)); I.a2 = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 48), mb(0.95));
  for (const m of [I.a1, I.a2]) { m.rotation.x = -Math.PI/2; I.area.add(m); } I.area.position.y = 0.25;
  I.cross = new THREE.Mesh(new THREE.RingGeometry(0.15, 0.32, 16), mb(0.95)); I.cross.rotation.x = -Math.PI/2; I.area.add(I.cross);
  I.line = new THREE.Group(); I.lp = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mb(0.22)); I.lp.rotation.x = -Math.PI/2; I.lp.position.z = 0.5; I.line.add(I.lp);
  I.le1 = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 1), mb(0.9)); I.le1.rotation.x = -Math.PI/2; I.le1.position.set(-0.5, 0.01, 0.5); I.line.add(I.le1);
  I.le2 = I.le1.clone(); I.le2.position.x = 0.5; I.line.add(I.le2); I.line.position.y = 0.24;
  I.head = new THREE.Group(); const hm = new THREE.Mesh(new THREE.ConeGeometry(1, 1.8, 3), mb(0.9)); hm.rotation.x = Math.PI/2; I.head.add(hm); I.head.position.y = 0.5; I.hm = hm;
  I.sector = new THREE.Group(); I.sm = new THREE.Mesh(new THREE.CircleGeometry(1, 24, -Math.PI/2 - 0.87, 1.74), mb(0.28)); I.sm.rotation.x = -Math.PI/2; I.sector.add(I.sm); I.sector.position.y = 0.24;
  I.mark = new THREE.Mesh(new THREE.RingGeometry(1.4, 1.9, 32), new THREE.MeshBasicMaterial({color:'#F0978A', transparent:true, opacity:0.95, depthWrite:false})); I.mark.rotation.x = -Math.PI/2; I.markG = new THREE.Group(); I.markG.add(I.mark); I.markG.position.y = 0.3;
  I.all = [I.rangeG, I.area, I.line, I.head, I.sector, I.markG];
  for (const o of I.all) { o.visible = false; world.add(o); }
  I.mats = [I.range.material, I.a1.material, I.a2.material, I.cross.material, I.lp.material, I.le1.material, I.hm.material, I.sm.material];
  return I;
}
function aimSpec(slot) {
  if (slot === 'q' || slot === 'r' || slot === 'e') return CSK[player.key][slot];
  const g = player.grp[+slot[1]]; return USK[g.utype];
}
function aimOrigin(slot) { if (slot === 'q' || slot === 'r' || slot === 'e') return {x:player.x, z:player.z}; return player.grp[+slot[1]].cent; }
function aimSlotName(slot) { if (slot === 'q' || slot === 'r' || slot === 'e') return CMDS[player.key][slot].n; const k = +slot[1]; return `第${GNUM[k]}隊・${USK[player.grp[k].utype].n}`; }
function rawAim(o, range) {
  if (FINE() && G.aim && G.time - G.mouseT < 6) return {x:G.aim.x, z:G.aim.z};
  if (G.lastTap && G.time - G.tapT < 1) return {x:G.lastTap.x, z:G.lastTap.z};
  const e = findTarget(player, o.x, o.z, range + 6, {noStruct:true, preferCmd:true}) || findTarget(player, o.x, o.z, range + 6);
  return e ? {x:e.x, z:e.z} : {x:o.x + Math.sin(player.facing)*8, z:o.z + Math.cos(player.facing)*8};
}
function computeAim() {
  const A = G.aiming; if (!A) return;
  const sp = aimSpec(A.slot), o = aimOrigin(A.slot), raw = rawAim(o, sp.range || sp.len || sp.r || 10);
  A.o = o; A.sp = sp; A.tgt = null;
  A.f = Math.hypot(raw.x - o.x, raw.z - o.z) > 0.5 ? Math.atan2(raw.x - o.x, raw.z - o.z) : player.facing;
  if (sp.t === 'circle') A.p = clampPt(o, raw, sp.range);
  else if (sp.t === 'line') A.p = clampPt(o, {x:o.x + Math.sin(A.f)*sp.len, z:o.z + Math.cos(A.f)*sp.len}, 999);
  else if (sp.t === 'dir') A.p = {x:o.x + Math.sin(A.f)*sp.r, z:o.z + Math.cos(A.f)*sp.r};
  else if (sp.t === 'unit') { const p = clampPt(o, raw, sp.range); A.tgt = findTarget(player, p.x, p.z, 6, {noStruct:true, preferCmd:true}); if (A.tgt && dist(A.tgt, o) > sp.range + 2) A.tgt = null; A.p = A.tgt ? {x:A.tgt.x, z:A.tgt.z} : p; }
  else A.p = {x:o.x, z:o.z};
}
function updateInd() {
  const I = G && G.ind; if (!I) return;
  for (const o of I.all) o.visible = false;
  const A = G.aiming; if (!A || phase !== 'play') return;
  computeAim();
  const col = A.slot[0] === 'u' ? GCOL[+A.slot[1]] : '#F1D29A';
  for (const m of I.mats) m.color.set(col);
  const {sp, o, p, f} = A;
  if (sp.range) { I.rangeG.visible = true; I.rangeG.position.set(o.x, 0.23, o.z); I.rangeG.scale.set(sp.range, 1, sp.range); }
  if (sp.t === 'circle' || sp.t === 'self' || sp.t === 'unit') { I.area.visible = true; I.area.position.set(p.x, 0.25, p.z); I.area.scale.set(sp.r, 1, sp.r); I.cross.scale.set(1/sp.r*3, 1/sp.r*3, 1); }
  if (sp.t === 'line') { I.line.visible = true; I.line.position.set(o.x, 0.24, o.z); I.line.rotation.y = f; I.line.scale.set(sp.w, 1, sp.len); I.head.visible = true; I.head.position.set(p.x, 0.5, p.z); I.head.rotation.y = f; I.rangeG.visible = true; I.rangeG.position.set(o.x, 0.23, o.z); I.rangeG.scale.set(sp.len, 1, sp.len); }
  if (sp.t === 'dir') { I.sector.visible = true; I.sector.position.set(o.x, 0.24, o.z); I.sector.rotation.y = f; I.sector.scale.set(sp.r, 1, sp.r); I.head.visible = true; I.head.position.set(o.x + Math.sin(f)*(sp.r + 1.2), 0.5, o.z + Math.cos(f)*(sp.r + 1.2)); I.head.rotation.y = f; }
  if (A.tgt) { I.markG.visible = true; I.markG.position.set(A.tgt.x, 0.3, A.tgt.z); }
}
function startAim(slot) {
  if (phase !== 'play') return;
  if (lockedMsg(slot[0] === 'u' ? 'uskill' : slot)) return;
  if (G.aiming && G.aiming.slot === slot) { if (FINE()) cancelAim(); else fireAim(); return; }
  cancelPlace(); cancelOAim(); cancelDemo(); cancelUpg();
  if (slot === 'q' || slot === 'r' || slot === 'e') {
    if (player.respawn > 0) { toast('指揮官陣亡中', 'r'); return; }
    if (slot === 'e' && player.lvl < 6) { toast(`${CMDS[player.key].e.n}：指揮官 6 級解鎖（目前 ${player.lvl} 級）`, ''); return; }
    if (player[slot + 'T'] > 0) { toast(`${CMDS[player.key][slot].n} 冷卻中（${Math.ceil(player[slot + 'T'])} 秒）`, ''); return; }
    if (CSK[player.key][slot].t === 'self') { castSkill(player, slot); return; }
  } else {
    const g = player.grp[+slot[1]];
    if (!g.mem.length) { toast(`第${GNUM[+slot[1]]}隊目前沒有士兵`, ''); return; }
    if (g.skT > 0) { toast(`${USK[g.utype].n} 冷卻中（${Math.ceil(g.skT)} 秒）`, ''); return; }
  }
  G.aiming = {slot};
  if (SET.quick && FINE()) { fireAim(); return; }
  updateAimHud();
}
function fireAim() {
  const A = G.aiming; if (!A) return;
  computeAim();
  let ok;
  if (A.slot === 'q' || A.slot === 'r' || A.slot === 'e') ok = castSkill(player, A.slot, A.p, A.tgt);
  else ok = castU(player, +A.slot[1], A.p);
  G.aiming = null; updateAimHud();
  return ok;
}
function cancelAim() { if (G && G.aiming) { G.aiming = null; updateAimHud(); } }
function updateAimHud() {
  const lab = $('aimlab'); if (!lab) return;
  const A = G && G.aiming;
  const OA = G && !A && G.oaim, DM = G && !A && !OA && G.demo, UP = G && !A && !OA && !DM && G.upg;
  lab.classList.toggle('hidden', !A && !OA && !DM && !UP);
  const ub = document.querySelector('[data-act="upgrade"]'); if (ub) ub.classList.toggle('on', !!UP);
  if (UP) lab.textContent = FINE() ? '升級：右鍵點你已完工的建築（費用見建築說明）・左鍵／Esc 取消' : '升級：點你已完工的建築';
  const db = document.querySelector('[data-act="demolish"]'); if (db) db.classList.toggle('on', !!DM);
  if (DM) lab.textContent = FINE() ? '拆除：右鍵點你的建築（完工返還 50%、建造中全額退還）・左鍵／Esc 取消' : '拆除：點你的建築';
  for (const b of document.querySelectorAll('[data-o]')) b.classList.toggle('aim', !!OA && OA.type === b.dataset.o);
  if (OA) lab.textContent = `${grpLabel(G.sel)}・${ONAME[OA.type]}：${FINE() ? (OA.type === 'focus' ? '右鍵指定目標・左鍵／Esc 取消' : '右鍵設定位置（按住拖曳決定朝向）・左鍵／Esc 取消') : '點地面設定位置'}`;
  if (A) lab.textContent = `瞄準：${aimSlotName(A.slot)}　${FINE() ? '右鍵設定位置施放・左鍵／Esc 取消' : '點地面施放・再點按鈕自動瞄準'}`;
  for (const b of document.querySelectorAll('[data-sk]')) b.classList.toggle('aim', !!A && A.slot === 'u' + b.dataset.sk);
  for (const id of ['q', 'r', 'e']) { const b = $('sk' + id.toUpperCase()); if (b) b.classList.toggle('aim', !!A && A.slot === id); }
}

// ================= formations & orders =================
function slotOff(form, i, n) {
  if (form === 'line') { const cols = n <= 6 ? n : Math.ceil(n/2); const r = Math.floor(i/cols), c = i % cols, rowN = Math.min(cols, n - r*cols); return {x:(c - (rowN-1)/2)*2.2, z:-r*2.1}; }
  if (form === 'wedge') { let r = 0, cnt = 0; while (cnt + r + 1 <= i) { cnt += r + 1; r++; } const c = i - cnt, rowN = Math.min(r + 1, n - cnt); return {x:(c - (rowN-1)/2)*2.1, z:-r*1.9}; }
  if (form === 'circle') { if (n === 1) return {x:0, z:0}; const R = Math.max(2.4, n*2.0/(2*Math.PI)); const a = i/n*Math.PI*2; return {x:Math.sin(a)*R, z:Math.cos(a)*R - R}; }
  if (form === 'loose') { const cols = Math.ceil(Math.sqrt(n)); const r = Math.floor(i/cols), c = i % cols; return {x:(c - (cols-1)/2)*3.9 + ((i*37)%7 - 3)*0.25, z:-r*3.7 + ((i*53)%5 - 2)*0.3}; }
  const cols = Math.ceil(Math.sqrt(n)); const r = Math.floor(i/cols), c = i % cols, rowN = Math.min(cols, n - r*cols); return {x:(c - (rowN-1)/2)*2.0, z:-r*2.0};
}
function formWidth(form, n) { let mx = 0; for (let i = 0; i < n; i++) mx = Math.max(mx, Math.abs(slotOff(form, i, n).x)); return mx*2 + 2; }
function grpKeys(sel) { return sel === 'all' ? [0, 1] : [sel]; }
function order(c, sel, type, pt, face, silent, target) {
  if (c.respawn > 0) return false;
  if (!unl('o:' + type)) { if (!pt && target) pt = {x:target.x, z:target.z}; type = pt ? 'move' : 'advance'; target = null; }   // locked orders fall back to a plain move
  const ks = grpKeys(sel).filter(k => c.grp[k].mem.length || type === 'rally' || type === 'retreat');
  if (!ks.length) { if (c === player && !silent) toast('這支隊伍目前沒有士兵', ''); return false; }
  let tgt = target || null;
  if (type === 'focus' && !tgt) { const p = pt || c; tgt = findTarget(c, p.x, p.z, 14, {preferCmd:true}) || findTarget(c, c.x, c.z, 24); }
  if (type === 'focus' && !tgt) { if (c === player && !silent) toast('附近沒有可集火的目標', ''); return false; }
  if (['move','hold','charge','ambush'].includes(type) && !pt) pt = {x:c.x + Math.sin(c.facing)*8, z:c.z + Math.cos(c.facing)*8};
  if (pt) pt = {x:clamp(pt.x, -97, 97), z:clamp(pt.z, -97, 97)};
  ks.forEach((k, i) => {
    const g = c.grp[k];
    let p = pt ? {x:pt.x, z:pt.z} : null, f = face;
    if (p && f === undefined) { const dx = p.x - g.cent.x, dz = p.z - g.cent.z; f = Math.hypot(dx, dz) > 3 ? Math.atan2(dx, dz) : Math.atan2(CORE[1 - c.team].x - p.x, CORE[1 - c.team].z - p.z); }
    if (p && ks.length === 2) { const w = (formWidth(g.form, Math.max(1, g.mem.length)) + formWidth(c.grp[1-k].form, Math.max(1, c.grp[1-k].mem.length)))/4 + 1.2; const o = rot({x:i ? w : -w, z:0}, f); p.x += o.x; p.z += o.z; }
    g.order = type; g.pt = p; g.face = f ?? g.face; g.t = 0; g.arrived = false; g.focus = tgt; g.braceT = 0;
    for (const s of g.mem) if (s.rootT > 0 && type !== 'hold') s.rootT = 0;
    if (type === 'advance') g.lane = nearestLane(g.cent.x, g.cent.z);
    if (type === 'ambush') for (const s of g.mem) s.ambushHit = true;
  });
  if (c === player && !silent) { say(c, type); horn(); c.cmdA = 0.8; G.stats.orders++; updateCmdHud(); }
  return true;
}
function setForm(c, sel, form, silent) {
  if (!unl('form')) { if (c === player && !silent) lockedMsg('form'); return; }
  for (const k of grpKeys(sel)) c.grp[k].form = form;
  if (c === player && !silent) { say(c, 'form'); tone([392, 523], 'square', 0.25, 0.05, 1800); updateCmdHud(); toast(`${grpLabel(sel)}改為${FORMS[form].n}：${FORMS[form].d}`, 'b'); }
}
const grpLabel = s => s === 'all' ? '全軍' : `第${GNUM[s]}隊`;
function aimPt() {
  if (G.aim && G.time - G.mouseT < 6 && FINE()) return {x:G.aim.x, z:G.aim.z};
  if (G.lastTap && G.time - G.tapT < 8) return {x:G.lastTap.x, z:G.lastTap.z};
  return null;
}
const POS_ORD = new Set(['hold', 'charge', 'focus', 'ambush', 'move']);
function issue(type) {
  if (phase !== 'play' || lockedMsg('o:' + type)) return;
  cancelAim(); cancelPlace(); cancelDemo(); cancelUpg();
  if (POS_ORD.has(type)) {
    if (G.oaim && G.oaim.type === type) { cancelOAim(); return; }
    if (SET.quick && FINE() && G.aim) { cancelOAim(); orderAt(type, aimPt() || G.aim, undefined); return; }
    G.oaim = {type}; updateAimHud(); return;
  }
  cancelOAim(); order(player, G.sel, type, aimPt());
}
function orderAt(type, p, face) {
  if (type === 'focus') { const en = enemyAt(p); return order(player, G.sel, 'focus', p, undefined, false, en || undefined); }
  return order(player, G.sel, type, {x:p.x, z:p.z}, face);
}
function cancelOAim() { if (G && G.oaim) { G.oaim = null; updateAimHud(); } }
function cancelDemo() { if (G && G.demo) { G.demo = false; updateAimHud(); } }
function toggleDemo() {
  if (phase !== 'play') return;
  if (!BKEYS.some(b => unl('b:' + b))) { lockedMsg('b:trench'); return; }
  if (G.demo) { cancelDemo(); return; }
  cancelAim(); cancelOAim(); cancelPlace(); cancelUpg();
  if (!ents.some(e => e.kind === 'bld' && !e.dead && e.owner === player)) { toast('你目前沒有建築可以拆除', 'r'); return; }
  G.demo = true; updateAimHud();
}
function ownBldAt(p) {
  let best = null, bd = 1e9;
  for (const e of ents) if (e.kind === 'bld' && !e.dead && e.owner === player) { const d = (e.x - p.x)**2 + (e.z - p.z)**2; if (d < (e.r + 2.2)**2 && d < bd) { bd = d; best = e; } }
  return best;
}
function demolish(b) {
  if (!b || b.dead || b.kind !== 'bld') return 0;
  const Bd = BUILDS[b.type], refund = b.built ? Math.round(Bd.cost*0.5) : Bd.cost;
  b.dead = true; b.hp = 0; if (b.mesh) world.remove(b.mesh);
  b.owner.builds = Math.max(0, b.owner.builds - 1); b.owner.gold += refund;
  floaters.push({x:b.x, y:4, z:b.z, s:`拆除 +${refund}`, c:'#F1D29A', t:1.4});
  if (b.owner === player) { toast(`已拆除${Bd.n}，${b.built ? '返還' : '退還'} ${refund} 軍資`, 'g'); sig('brand'); updateHud(); }
  return refund;
}
function updateDemoHL() {
  if (!G) return;
  if (!G.demoHL) { G.demoHL = ring(2.6, 3.3, '#F0978A', 0.9); G.demoHL.visible = false; world.add(G.demoHL); }
  const b = G.demo && phase === 'play' && G.aim ? ownBldAt(G.aim) : null;
  G.demoHL.visible = !!b;
  if (b) { G.demoHL.position.set(b.x, 0.25, b.z); const k = (b.r + 1)/2.6; G.demoHL.scale.set(k, k, k); }
}
// formation preview while setting an order's position
function previewSlots(sel, pt, face) {
  const c = player, out = [];
  const ks = grpKeys(sel).filter(k => c.grp[k].mem.length);
  pt = {x:clamp(pt.x, -97, 97), z:clamp(pt.z, -97, 97)};
  ks.forEach((k, i) => {
    const g = c.grp[k], n = g.mem.length; let p = {x:pt.x, z:pt.z}, f = face;
    if (f === undefined) { const dx = p.x - g.cent.x, dz = p.z - g.cent.z; f = Math.hypot(dx, dz) > 3 ? Math.atan2(dx, dz) : Math.atan2(CORE[1 - c.team].x - p.x, CORE[1 - c.team].z - p.z); }
    if (ks.length === 2) { const w = (formWidth(g.form, Math.max(1, n)) + formWidth(c.grp[1-k].form, Math.max(1, c.grp[1-k].mem.length)))/4 + 1.2; const o = rot({x:i ? w : -w, z:0}, f); p.x += o.x; p.z += o.z; }
    for (let j = 0; j < n; j++) { const o = rot(slotOff(g.form, j, n), f); out.push({x:p.x + o.x, z:p.z + o.z, k, f}); }
  });
  return out;
}
function updateOPrev() {
  if (!G) return;
  if (!G.oprev) {
    const O = G.oprev = {dots:[], g:new THREE.Group()};
    for (let i = 0; i < 32; i++) { const m = new THREE.Mesh(new THREE.RingGeometry(0.45, 0.75, 20), new THREE.MeshBasicMaterial({color:'#fff', transparent:true, opacity:0.85, depthWrite:false, side:THREE.DoubleSide})); m.rotation.x = -Math.PI/2; O.dots.push(m); O.g.add(m); }
    O.arrow = new THREE.Group(); const am = new THREE.Mesh(new THREE.ConeGeometry(0.8, 2, 3), new THREE.MeshBasicMaterial({color:'#F1D29A', transparent:true, opacity:0.9, depthWrite:false})); am.rotation.x = Math.PI/2; am.position.z = 2.2; O.arrow.add(am); O.g.add(O.arrow);
    O.tgt = new THREE.Mesh(new THREE.RingGeometry(1.5, 2.1, 32), new THREE.MeshBasicMaterial({color:'#F0978A', transparent:true, opacity:0.95, depthWrite:false, side:THREE.DoubleSide})); O.tgt.rotation.x = -Math.PI/2; O.g.add(O.tgt);
    world.add(O.g);
  }
  const O = G.oprev, A = G.oaim;
  for (const d of O.dots) d.visible = false; O.arrow.visible = false; O.tgt.visible = false;
  if (!A || phase !== 'play') return;
  const d = G.drag && G.drag.type ? G.drag : null;
  const p = d ? d.p : (FINE() && G.aim ? G.aim : null); if (!p) return;
  if (A.type === 'focus') {
    const en = enemyAt(p) || findTarget(player, p.x, p.z, 14, {preferCmd:true});
    if (en) { O.tgt.visible = true; O.tgt.position.set(en.x, 0.3, en.z); const sc = 1 + Math.sin(G.time*8)*0.08; O.tgt.scale.set(sc, sc, sc); }
    return;
  }
  const face = d && d.cur ? Math.atan2(d.cur.x - d.p.x, d.cur.z - d.p.z) : undefined;
  const sl = previewSlots(G.sel, p, face);
  sl.slice(0, O.dots.length).forEach((q, i) => { const m = O.dots[i]; m.visible = true; m.position.set(q.x, 0.2, q.z); m.material.color.set(GCOL[q.k]); });
  if (sl.length) { O.arrow.visible = true; O.arrow.position.set(p.x, 0.5, p.z); O.arrow.rotation.y = face !== undefined ? face : sl[0].f; }
}
function selectGrp(s) { G.sel = s; updateCmdHud(); updateAimHud(); }

// ================= vision =================
function updateVision(fogOnly) {
  for (const t of [0,1]) {
    const S = visSrc[t]; S.length = 0;
    for (const e of ents) {
      if (e.dead || e.team !== t) continue;
      let r = 0;
      if (e.kind === 'cmd') r = e.respawn > 0 ? 0 : 17; else if (e.kind === 'sol') r = 11; else if (e.kind === 'min') r = 9; else if (e.kind === 'tow' || e.kind === 'core') r = 18;
      else if (e.kind === 'bld') r = e.built ? (e.type === 'watch' ? BV(e, 'vis') : 9) : 4;
      if (r) S.push([e.x, e.z, r, e.kind === 'bld' && e.type === 'watch' && e.built ? 1 : 0, e]);
    }
    for (const z of zones) if (z.kind === 'crow' && z.team === t) S.push([z.x, z.z, z.r, 1, null]);
    if (G && G.sps) for (const s of G.sps) if (s.owner === t && s.k === 'beacon') S.push([s.x, s.z, 26, 1, null]);
  }
  const bv = [new Set(), new Set()];
  if (!fogOnly) for (const e of ents) if (!e.dead && e.team < 2 && (e.kind === 'sol' || e.kind === 'cmd' || e.kind === 'min')) { const b = bushAt(e.x, e.z); if (b >= 0) bv[e.team].add(b); }
  if (!fogOnly) for (const e of ents) {
    if (e.dead) continue;
    for (const t of [0,1]) {
      if (e.team === t || e.kind === 'tow' || e.kind === 'core') { e.vis[t] = true; continue; }
      let seen = false, reveal = false;
      for (const s of visSrc[t]) { const dd = (s[0]-e.x)**2 + (s[1]-e.z)**2; if (dd < s[2]*s[2]) { seen = true; if (s[3] || dd < 20) reveal = true; } }
      const bush = (e.kind === 'sol' || e.kind === 'cmd' || e.kind === 'min') ? bushAt(e.x, e.z) : -1;
      const hidden = e.stealth || (e.kind === 'bld' && e.type === 'trap') || (bush >= 0 && !bv[t].has(bush));
      e.vis[t] = seen && (!hidden || reveal);
      if (e.kind === 'sol' && e.vis[t] && !isComp(e)) {
        let ident = false;
        for (const s of visSrc[t]) { const dd = (s[0]-e.x)**2 + (s[1]-e.z)**2; if ((s[3] && dd < s[2]*s[2]) || (s[4] && dd < 81) || (s[4] && s[4].kind === 'sol' && s[4].utype === 'scout' && dd < 144)) { ident = true; break; } }
        if (ident) identify(t, e);
      }
    }
  }
  fogCtx.globalCompositeOperation = 'source-over';
  fogCtx.clearRect(0, 0, 128, 128); fogCtx.fillStyle = 'rgba(4,6,10,0.62)'; fogCtx.fillRect(0, 0, 128, 128);
  fogCtx.globalCompositeOperation = 'destination-out';
  for (const s of visSrc[0]) {
    const x = (s[0] + 100)*0.64, y = (s[1] + 100)*0.64, r = s[2]*0.64;
    const gr = fogCtx.createRadialGradient(x, y, r*0.55, x, y, r); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    fogCtx.fillStyle = gr; fogCtx.beginPath(); fogCtx.arc(x, y, r, 0, 7); fogCtx.fill();
  }
  fogTex.needsUpdate = true;
}
function identify(t, s) {
  const key = ik(s.owner, s.grp), I = intel[t][key];
  if (!I || (I.st === 2 && I.type === s.utype)) return;
  intel[t][key] = {st:2, type:s.utype, hint:UNITS[s.utype].cls};
  if (t === 0 || SVR) tToast(t, `情報確認：敵方${CMDS[s.owner.key].n}第${GNUM[s.grp]}隊是「${UNITS[s.utype].n}」`, 'r');
}
const clsOf = u => UNITS[u].fly ? '飛行' : UNITS[u].magic ? '魔法' : UNITS[u].ranged ? '遠程' : '近戰';
function hintIntel(t, att) {
  if (!att || att.kind !== 'sol' || isComp(att)) return;
  const I = intel[t][ik(att.owner, att.grp)];
  if (I && I.st === 0) { I.st = 1; I.hint = clsOf(att.utype); if (t === 0 || SVR) tToast(t, `推測：敵方${CMDS[att.owner.key].n}第${GNUM[att.grp]}隊是${I.hint}類`, ''); }
}

// ================= combat =================
function attackable(e, team) {
  if (e.dead || e.team === team || !e.vis[team]) return false;
  if (e.kind === 'tow' || e.kind === 'core') return !e.prot;
  if (e.kind === 'cmd' && e.respawn > 0) return false;
  return true;
}
function findTarget(a, x, z, range, opt = {}) {
  let best = null, bd = 1e9;
  const G2 = G && G.grid, R = range + 7;
  const x0 = G2 ? gi(x - R) : 0, x1 = G2 ? gi(x + R) : 0, z0 = G2 ? gi(z - R) : 0, z1 = G2 ? gi(z + R) : 0;
  for (let ci = x0; ci <= x1; ci++) for (let cj = z0; cj <= z1; cj++) {
  for (const e of (G2 ? G2[ci*GN + cj] : ents)) {
    if (e.team === a.team || e.dead) continue;
    if (opt.noStruct && (e.kind === 'tow' || e.kind === 'core' || e.kind === 'bld')) continue;
    if (e.kind === 'neu' && (opt.noNeu || a.kind === 'min' || a.kind === 'tow' || a.kind === 'core' || a.kind === 'bld' || a.kind === 'drg')) continue;
    const dd = (e.x-x)**2 + (e.z-z)**2, rr = range + e.r;
    if (dd > rr*rr || !attackable(e, a.team)) continue;
    let score = dd;
    if (e.kind === 'neu') score += 300; else if (e.kind === 'tow' || e.kind === 'core') score += 400; else if (e.kind === 'bld') score += 150; else if (e.kind === 'cmd') score += opt.preferCmd ? -200 : 60;
    if (score < bd) { bd = score; best = e; }
  }
  }
  return best;
}
// coarse spatial grid, rebuilt once per simulation step, so target searches only look at nearby cells
const GN = 14, gi = v => { const i = ((v + 112)*0.0625) | 0; return i < 0 ? 0 : i >= GN ? GN - 1 : i; };
function gridBuild() {
  const g = G.grid || (G.grid = Array.from({length:GN*GN}, () => []));
  for (const c of g) c.length = 0;
  for (const e of ents) if (!e.dead) g[gi(e.x)*GN + gi(e.z)].push(e);
}
function inAura(team, x, z, type) {
  let best = null;
  for (const e of (G && G.bl && team < 2 ? G.bl[team] : ents)) {
    if (e.kind !== 'bld' || e.dead || !e.built || e.team !== team || e.type !== type) continue;
    const r = bRad(e);
    if ((e.x-x)**2 + (e.z-z)**2 < r*r && (!best || blv(e) > blv(best))) best = e;
  }
  return best;
}
function inZone(team, x, z, kind) { for (const zz of zones) if (zz.kind === kind && zz.team === team && zz.live && (zz.x-x)**2 + (zz.z-z)**2 < zz.r*zz.r) return zz; return null; }
const formOf = s => s.kind === 'sol' && !isComp(s) ? s.owner.grp[s.grp].form : null;
function frontOf(t, src, f) { const dx = src.x - t.x, dz = src.z - t.z, L = Math.hypot(dx, dz) || 1; return (dx*Math.sin(f) + dz*Math.cos(f))/L > 0.3; }
function hurt(t, amt, src, opt = {}) {
  if (NET.client) return;
  if (t.dead || (t.kind === 'cmd' && t.respawn > 0)) return;
  let m = 1;
  const su = src && src.kind === 'sol' ? src.utype : null, tu = t.kind === 'sol' ? t.utype : null;
  if (su && tu) { if (STRONG[su].includes(tu)) m *= 1.5; else if (STRONG[tu].includes(su)) m *= 0.75; }
  const struct = t.kind === 'tow' || t.kind === 'core' || t.kind === 'bld';
  const srcRanged = src && ((src.kind === 'sol' && UNITS[src.utype].ranged) || (src.kind === 'cmd' && CMDS[src.key].ranged) || src.kind === 'tow' || src.kind === 'core' || src.kind === 'bld' || (src.kind === 'min' && src.ranged));
  if (struct) {
    if (su === 'siege') m *= 2.5;
    if (src && src.kind === 'sol' && src.owner.golemT > 0) m *= 2;
    const own = src && (src.kind === 'cmd' ? src : src.owner);
    if (own && own.key === 'brand') m *= 1.2;
    if (src && src.kind === 'min') m *= 0.8;
    if (t.kind === 'tow' || t.kind === 'core') { const cover = ents.some(o => !o.dead && o.team !== t.team && (o.kind === 'min' || o.kind === 'sol' || o.kind === 'drg') && (o.x-t.x)**2 + (o.z-t.z)**2 < 260); if (!cover) m *= 0.45; }
  }
  if (tu && UNITS[tu].fly && src && src.kind === 'sol' && !UNITS[su].ranged && !UNITS[su].fly) m *= 0.6;
  if (tu && UNITS[tu].fly && su === 'archer') m *= 1.5;
  if (tu === 'shield' && srcRanged && su !== 'longbow') m *= 0.5;
  if (tu === 'dwarf' && srcRanged) m *= 0.7;
  m *= featHurt(t, src, tu, su)*bldHurt(t, src);
  if (tu === 'priest' && src && ((src.kind === 'sol' && UNITS[su].magic) || (src.kind === 'cmd' && CMDS[src.key].magic))) m *= 0.5;
  if (tu && UNITS[tu].inf && src) { const tr = inAura(t.team, t.x, t.z, 'trench'); if (tr) m *= 1 - (srcRanged ? BV(tr, 'red') : BV(tr, 'mel'))/100; }
  const tf = formOf(t);
  if (tf === 'circle') m *= 0.75;
  if (tf === 'square' && srcRanged) m *= 0.9;
  if (tf === 'loose' && opt.aoe) m *= 0.6;
  if (opt.aoe && tu && tu !== 'wolf') m *= Math.min(1, 1.5*(UNITS[tu].bk || 1));
  if (tu && !isComp(t)) { const g = t.owner.grp[t.grp]; if (tu === 'pike' && g.order === 'hold' && su === 'cav') m *= 0.7; if (g.braceT > 0 && src && frontOf(t, src, g.face)) m *= 0.6; }
  if (t.kind === 'sol' || t.kind === 'cmd' || t.kind === 'bld') { if (inZone(t.team, t.x, t.z, 'bastion')) m *= 0.5; if (inZone(t.team, t.x, t.z, 'fort')) m *= 0.6; if (inZone(t.team, t.x, t.z, 'sanct')) m *= 0.7; }
  if (tu && !isComp(t) && src && src !== t && src.x !== undefined) {
    const g = t.owner.grp[t.grp];
    if (g.form !== 'circle') {
      const dx = src.x - t.x, dz = src.z - t.z, L = Math.hypot(dx, dz) || 1, dot = (dx*Math.sin(t.facing || 0) + dz*Math.cos(t.facing || 0))/L;
      let ml = 0, tag = null;
      if (dot < -0.45) { m *= 1.5; ml = 1.6; tag = '背擊'; } else if (dot < 0.3) { m *= 1.25; ml = 0.8; tag = '側擊'; }
      if (ml) {
        g.mor -= ml*(1 - 0.1*g.rank)*((g.form === 'square' && (tu === 'pike' || tu === 'shield')) ? 0.8 : 1);
        if (src.kind === 'sol' && !isComp(src) && G.time - src.owner.grp[src.grp].msgT > 0.9 && isMe(src.owner)) { const sg = src.owner.grp[src.grp]; { sg.msgT = G.time; floaters.push({x:t.x, y:4.4, z:t.z, s:tag + '！', c:'#F1D29A', t:1.0}); } }
        if (tag === '背擊' && G.time - g.msgT > 4 && isMe(t.owner)) { g.msgT = G.time; toast(`第${GNUM[t.grp]}隊遭到背擊！快轉向或撤出`, 'r'); }
      }
    }
    g.lastHitT = G.time;
    if (g.routT > 0) m *= 1.25;
  }
  if (src && src.kind === 'sol' && src.owner.elite) m *= src.owner.elite;
  if (src && src.kind === 'sol' && !isComp(src)) m *= armMul(src.owner, src.utype, 'w');
  if (src && src.kind === 'cmd') m *= skPow(src, t);
  if (src && src.kind === 'sol' && !isComp(src)) { const sg = src.owner.grp[src.grp]; m *= 1 + 0.08*sg.rank; if (sg.mor < 50) m *= 0.85; if (beaconBonus(src)) m *= 1.1; }
  if (src && src.team < 2 && G.buff[src.team].titan > 0 && (src.kind === 'sol' || src.kind === 'cmd')) m *= 1.2;
  if (src && src.team < 2 && G.lastStand[src.team] && Math.hypot(src.x - CORE[src.team].x, src.z - CORE[src.team].z) < 32) m *= 1.2;
  if (t.kind === 'core' && G.coreShield[t.team] > 0) m *= 0.7;
  const dmg = amt * m;
  t.hp -= dmg;
  hurtStat(t, src, dmg);
  if (t.kind === 'neu' && src && src.team < 2) t.lastTeam = src.team;
  if (t.kind === 'sol') { t.stillT = 0; if (t.stealth) t.stealth = false; }
  if (t.team < 2) hintIntel(t.team, src);
  if (t.kind === 'cmd' && src && src.kind === 'cmd') t.lastHitBy = {c:src, t:G.time};
  const mc = SVR ? ((src && src.net && src) || (src && src.owner && src.owner.net && src.owner) || (t.net && t) || null) : null;
  const mine = SVR ? !!mc : (src && (src === player || src.owner === player)) || t === player, vt = mc ? mc.team : 0;
  if (mine && (t.vis[vt] || t.team === vt) && dmg >= 1) floaters.push({x:t.x, y:t.kind === 'cmd' ? 5 : 3, z:t.z, s:Math.round(dmg), c:t.team === vt ? '#F0978A' : (m > 1.2 ? C.gold : C.ink), t:0.9, w:mc ? mc.cid : null});
  if (t === player && t.hp/t.maxHp < 0.3 && !t.lowSaid) { t.lowSaid = true; say(t, 'low', true); }
  if (t.hp <= 0) kill(t, src);
}
function kill(t, src) {
  t.dead = true; t.hp = 0;
  if (t.mesh && !(t.kind !== 'cmd' && artCorpse(t))) world.remove(t.mesh);   // commanders reuse their model on respawn, so no corpse
  const own = src ? (src.kind === 'cmd' ? src : src.owner) : null;
  let reward = {min:15, sol:Math.round(20*(t.kind === 'sol' ? UNITS[t.utype].bk : 1)), cmd:150, drg:150, bld:Math.round((BUILDS[t.type] || {cost:0}).cost*0.4)}[t.kind] || 0;
  const bounty = t.kind === 'cmd' && t.streak >= 2 ? 100*t.streak : 0; reward += bounty;
  if (own && own.team < 2 && G.behind === own.team) reward = Math.round(reward*1.5);
  if (own && reward && own.gold !== undefined) own.gold += reward;
  if (t.kind === 'sol' && !isComp(t)) {
    const g = t.owner.grp[t.grp]; g.mor -= 12*UNITS[t.utype].bk*(1 - 0.1*g.rank);
    if (g.mem.length <= 1 && own && own.team !== t.team && own.gold !== undefined) { own.gold += 80; if (isMe(own)) toast(`殲滅敵方${CMDS[t.owner.key].n}第${GNUM[t.grp]}隊（+80）`, 'g'); else if (isMe(t.owner)) toast(`第${GNUM[t.grp]}隊全軍覆沒，將在補員點重整`, 'r'); }
  }
  if (src && src.kind === 'sol' && !isComp(src) && t.kind !== 'bld') { const sg = src.owner.grp[src.grp]; sg.mor = Math.min(100, sg.mor + 4*(t.kind === 'sol' ? UNITS[t.utype].bk : 1)); gainXp(src.owner, src.grp, {sol:t.kind === 'sol' ? UNITS[t.utype].bk : 1, cmd:3, min:0.3, neu:5, drg:4}[t.kind] || 0.5); }
  featKill(t, own);
  if (t.kind === 'neu') neutralSlain(t);
  if (t.kind === 'drg') toast(t.team === 0 ? '我方的巨龍被擊倒了' : '敵方的巨龍被擊倒了', t.team === 0 ? 'r' : 'g');
  if (t.kind === 'cmd') {
    if (bounty) toast(`${own ? CMDS[own.key].n : '眾軍'}終結了${CMDS[t.key].n}的懸賞（+${bounty}）`, own && own.team === 0 ? 'g' : 'r');
    t.streak = 0; if (own && own.kind === 'cmd' && own.team !== t.team) { own.streak++; if (own.streak === 2 && own.team === 1) toast(`敵方${CMDS[own.key].n}連勝中，懸賞 ${own.streak*100}`, 'b'); }
    t.respawn = (8 + G.time/60)*(G.behind === t.team ? 0.6 : 1); t.dead = false; t.hp = 0; t.mesh.visible = false; world.add(t.mesh); t.lowSaid = false;
    G.rpick = null;
    if (t === player) { G.stats.deaths++; say(t, 'death', true); toast('你的指揮官陣亡，部隊撤回出生點。復活前可以免費重新整編', 'r'); cancelAim(); cancelOAim(); cancelPlace(); cancelDemo(); G.rpick = [player.grp[0].utype, player.grp[1].utype]; showRespawnMuster(); }
    else if (own === player) { G.stats.kills++; say(player, 'kill', true); toast(`擊殺敵方指揮官 ${CMDS[t.key].n}`, 'g'); }
    else { if (own && own.net && isMe(own)) toast(`擊殺敵方指揮官 ${CMDS[t.key].n}`, 'g'); toast(`${t.team ? '敵方' : '我方'}指揮官 ${CMDS[t.key].n} 陣亡`, t.team ? 'g' : 'r'); }
  }
  if (t.kind === 'tow') {
    for (const c of cmds()) if (c.team !== t.team) c.gold += 120;
    G.lost[t.team]++; updateBehind();
    if (t.team === 1) { G.stats.towers++; say(player, 'tower', true); }
    toast(`${t.team ? '敵方' : '我方'}${LNAME[t.lane]}${['外','中','內'][t.tier-1]}塔被摧毀`, t.team ? 'g' : 'r'); drum();
  }
  if (t.kind === 'bld') { t.owner.builds--; if (isMe(t.owner)) toast(`你的${BUILDS[t.type].n}被摧毀`, 'r'); }
  if (t.kind === 'core') endGame(t.team === 1);
}
function doAttack(a, t) {
  let base = a.atk, opt = {};
  a.atkA = 0.35;
  if (a.kind === 'sol') {
    const U = UNITS[a.utype], g = !isComp(a) ? a.owner.grp[a.grp] : null;
    base = U.atk;
    if (g && a.utype === 'pike' && g.order === 'hold') base *= 1.3;
    if (a.utype === 'cav' && a.moveT >= 3) { base *= 2; knock(t, a, 2.5); a.moveT = 0; }
    if (g && g.form === 'wedge' && a.moveT >= 1.5) { base *= 1.3; a.moveT = 0; }
    if (g && g.form === 'square' && !U.ranged) base *= 1.1;
    if (g && g.order === 'charge') { base *= 1.25; if (a.owner.chargeAll > 0) { base *= 1.6; knock(t, a, 1.5); } }
    if (a.stealth || a.ambushHit) { base *= a.blinkHit ? 2 : 1.5; a.stealth = false; a.ambushHit = false; a.blinkHit = false; }
    if (a.owner.respawn <= 0 && (a.x-a.owner.x)**2 + (a.z-a.owner.z)**2 < 256) base *= 1.1;
    a.stillT = 0;
    if (U.aoe) { opt.aoe = true; for (const e of ents) if (e !== t && e.team !== a.team && !e.dead && e.kind !== 'tow' && e.kind !== 'core' && (e.x-t.x)**2 + (e.z-t.z)**2 < U.aoe*U.aoe && e.vis[a.team]) hurt(e, base*0.7, a, opt); }
    if (U.ranged) shot(a, t, U.magic ? '#C9A0FF' : a.utype === 'siege' ? '#6FE0E8' : '#F2E6C8', a.utype === 'siege' ? 0.5 : 0.18);
  } else if (a.kind === 'cmd') {
    if (CMDS[a.key].ranged) shot(a, t, CMDS[a.key].magic ? '#C9A0FF' : '#FFF1C8', 0.24);
    if (t.kind === 'tow' || t.kind === 'core') base *= 0.8;
  } else if (a.kind === 'tow' || a.kind === 'core') { base = (t.kind === 'cmd' ? 110 : t.kind === 'min' ? 42 : 46)*(G.behind === a.team ? 1.25 : 1); shot(a, t, TEAML[a.team], 0.4, 12); }
  else if (a.kind === 'min') { base = a.atk; if (a.ranged) shot(a, t, '#F2E6C8', 0.15); }
  else if (a.kind === 'bld') { base = a.type === 'arrowtower' ? BV(a, 'dmg') : 26; if (t.kind === 'sol' && UNITS[t.utype].fly) base *= 2; shot(a, t, '#F2E6C8', 0.18, 6.5); }
  hurt(t, base, a, opt);
}
function knock(t, a, d, dir) {
  if (NET.client) return;
  if (t.kind !== 'sol' && t.kind !== 'min' && t.kind !== 'cmd') return;
  let dx, dz; if (dir !== undefined) { dx = Math.sin(dir); dz = Math.cos(dir); } else { dx = t.x - a.x; dz = t.z - a.z; }
  const L = Math.hypot(dx, dz) || 1;
  t.x = clamp(t.x + dx/L*d, -98, 98); t.z = clamp(t.z + dz/L*d, -98, 98);
}
const shotGeo = new THREE.SphereGeometry(1, 8, 6);
function shot(a, t, color, size, y0 = 2) {
  if (SVR) { if (SVR.shots.length < 160) SVR.shots.push([a.id, t.id, color, size, y0]); return; }
  if (shot2) { shot2(a, t, color, size, y0); return; }
  if (!a.vis[0] && !t.vis[0]) return;
  const m = new THREE.Mesh(shotGeo, new THREE.MeshBasicMaterial({color})); m.scale.setScalar(size);
  world.add(m); fx.push({m, ax:a.x, az:a.z, ay:y0 + (a.kind === 'sol' && UNITS[a.utype].fly ? 3.5 : 0), bx:t.x, bz:t.z, by:t.kind === 'sol' && UNITS[t.utype].fly ? 3.8 : 1.5, t:0, dur:0.28});
}

// ================= skills =================
function aimPoint(c, range) {
  const e = findTarget(c, c.x, c.z, range + 4, {noStruct:true, preferCmd:true}) || findTarget(c, c.x, c.z, range + 4);
  const p = e ? {x:e.x, z:e.z} : {x:c.x + Math.sin(c.facing)*8, z:c.z + Math.cos(c.facing)*8};
  return clampPt(c, p, range);
}
function addZone(z) {
  z.t = 0; z.live = !z.delay; z.tick = 0;
  const col = z.color || (z.team === 0 ? C.blue : C.red);
  z.mesh = new THREE.Group();
  if (z.kind === 'brace') { const s = new THREE.Mesh(new THREE.CircleGeometry(z.r, 24, -Math.PI/2 - 0.87, 1.74), new THREE.MeshBasicMaterial({color:col, transparent:true, opacity:0.3, depthWrite:false, side:THREE.DoubleSide})); s.rotation.x = -Math.PI/2; const g = new THREE.Group(); g.add(s); g.rotation.y = z.f; z.mesh.add(ring(0.1, 0.2, col, 0)); z.mesh.add(g); for (let i = -2; i <= 2; i++) { const a = z.f + i*0.3; add(z.mesh, CO(0.08, 1.4, 4), metal(P.steel), Math.sin(a)*(z.r - 1), 0.6, Math.cos(a)*(z.r - 1), Math.cos(a)*0.9, 0, -Math.sin(a)*0.9); } }
  else if (z.kind === 'sweep') {
    const g = new THREE.Group(); const pl = new THREE.Mesh(new THREE.PlaneGeometry(z.w, z.len), new THREE.MeshBasicMaterial({color:col, transparent:true, opacity:0.25, depthWrite:false, side:THREE.DoubleSide})); pl.rotation.x = -Math.PI/2; pl.position.z = z.len/2; g.add(pl); g.rotation.y = z.f;
    z.mesh.add(ring(z.r - 0.3, z.r, col, 0.9)); z.mesh.add(g); z.mover = z.mesh.children[0];
  } else { z.mesh.add(ring(z.r - 0.4, z.r, col, 0.85)); z.mesh.add(disc(z.r, col, 0.14)); }
  if (z.kind === 'wall') for (let i = 0; i < 9; i++) { const a = i/9*Math.PI*2; add(z.mesh, B(1.6, 2.2, 0.8), MT(P.stone), Math.sin(a)*z.r*0.85, 1.1, Math.cos(a)*z.r*0.85, 0, a); }
  if (z.kind === 'meteor' || z.kind === 'boulder') z.rock = add(z.mesh, IC(z.kind === 'meteor' ? (z.big ? 2.6 : 1.2) : 0.9), z.kind === 'meteor' ? MT('#7A4A9A', {e:'#C9A0FF', ei:0.6}) : MT('#5A6B6E', {e:'#6FE0E8', ei:0.5}), 0, 30, 0);
  if (z.kind === 'frost') for (let i = 0; i < 10; i++) { const a = i/10*Math.PI*2; add(z.mesh, CO(0.3, 1.6, 4), MT('#BFE8F6', {e:'#6FC8E8', ei:0.4, op:0.85}), Math.sin(a)*z.r*0.6, 0.6, Math.cos(a)*z.r*0.6); }
  if (z.kind === 'sanct') add(z.mesh, CY(z.r, z.r, 0.05, 32), MT('#FFE6A0', {e:'#FFE6A0', ei:0.4, op:0.18}), 0, 0.3, 0);
  z.mesh.position.set(z.x, 0.05, z.z);
  if (z.team === 0 || z.kind !== 'crow') world.add(z.mesh);
  if (!z.delay) zoneImpact(z);
  zones.push(z); return z;
}
function castSkill(c, slot, p, tgt) {
  if (slot !== 'q' && !unl(slot)) return false;
  if (c[slot + 'T'] > 0 || c.respawn > 0 || c.stunT > 0) return false;
  if (slot === 'e' && c.lvl < 6) return false;
  const k = c.key, sp = CSK[k][slot];
  if (sp.t === 'circle') p = clampPt(c, p || aimPoint(c, sp.range), sp.range);
  if (slot === 'e') { p = p || aimPoint(c, sp.range || sp.len || 10); if (!castE(c, p, tgt)) return false; }
  else if (slot === 'q') {
    if (k === 'valen') addZone({kind:'wall', team:c.team, x:p.x, z:p.z, r:5, dur:TV(c, 'v_q1', 4, 7), dps:TV(c, 'v_q2', 0, 30), owner:c, color:'#C9B48A'});
    if (k === 'sylvie') addZone({kind:'rain', team:c.team, x:p.x, z:p.z, r:6, dur:2, owner:c, dmg:TV(c, 's_q1', 13, 20)});
    if (k === 'orion') { addZone({kind:'meteor', team:c.team, x:p.x, z:p.z, r:6, dur:1.5, delay:1.2, dmg:110, stun:TV(c, 'o_q2', 0.8, 1.4), owner:c, color:'#C9A0FF'}); if (hasTal(c, 'o_q1')) addZone({kind:'meteor', team:c.team, x:p.x, z:p.z, r:5, dur:2.2, delay:1.9, dmg:90, owner:c, color:'#C9A0FF'}); }
    if (k === 'gru') { for (let i = 0; i < TV(c, 'g_q1', 3, 5); i++) bigWolf(c, spawnSoldier(c, 'wolf', c.x + rnd(-2,2), c.z + rnd(-2,2), 1, 12*TV(c, 'g_p2', 1, 1.5))); addZone({kind:'flash', team:c.team, x:c.x, z:c.z, r:4, dur:0.6, owner:c, color:'#E6B07A'}); }
    if (k === 'brand') addZone({kind:'barrel', team:c.team, x:p.x, z:p.z, r:TV(c, 'b_q2', 5, 7), sdmg:TV(c, 'b_q1', 320, 480), dur:0.5, owner:c, color:'#E8A04A'});
    if (k === 'raven') addZone({kind:'crow', team:c.team, x:p.x, z:p.z, r:TV(c, 'r_q1', 18, 26), dur:TV(c, 'r_q2', 8, 16), owner:c, color:'#B892E0'});
  } else {
    if (k === 'valen') addZone({kind:'fort', team:c.team, x:c.x, z:c.z, r:TV(c, 'v_r1', 15, 22), dur:6, owner:c, color:C.gold});
    if (k === 'sylvie') addZone({kind:'rainU', team:c.team, x:p.x, z:p.z, r:TV(c, 's_r1', 13, 17), dur:3, owner:c, dmg:11, slowF:TV(c, 's_r2', 0, 0.5)});
    if (k === 'orion') addZone({kind:'stasis', team:c.team, x:p.x, z:p.z, r:12, dur:TV(c, 'o_r1', 4, 7), dps:TV(c, 'o_r2', 0, 30), owner:c, color:'#C9A0FF'});
    if (k === 'gru') { const L = TV(c, 'g_r2', 22, 32); p = p || aimPoint(c, L); const f = Math.atan2(p.x - c.x, p.z - c.z); const end = clampPt(c, {x:c.x + Math.sin(f)*L, z:c.z + Math.cos(f)*L}, L); c.chargeAll = 4; order(c, 'all', 'charge', end, f, true); addZone({kind:'sweep', team:c.team, x:c.x, z:c.z, f, len:L, w:8, r:4, dur:1.4*L/22, dmg:45, kb:2, stun:TV(c, 'g_r1', 0, 1), owner:c, color:'#E6B07A', hit:new Set()}); }
    if (k === 'brand') { c.golemT = TV(c, 'b_r2', 10, 18); for (const s of squad(c)) s.hp = Math.min(s.maxHp*1.5, s.hp + s.maxHp*TV(c, 'b_r1', 0.5, 1)); addZone({kind:'flash', team:c.team, x:c.x, z:c.z, r:16, dur:0.8, owner:c, color:'#F2B56B'}); }
    if (k === 'raven') {
      const e = (tgt && !tgt.dead && attackable(tgt, c.team) && dist(tgt, c) <= 18) ? tgt : (p && findTarget(c, p.x, p.z, 6, {noStruct:true, preferCmd:true})) || findTarget(c, c.x, c.z, 16, {noStruct:true, preferCmd:true});
      if (!e || dist(e, c) > 18) { if (c === player) toast('影襲：範圍內沒有目標', ''); return false; }
      c.x = clamp(e.x + (e.x - c.x)*0.15, -98, 98); c.z = clamp(e.z + (e.z - c.z)*0.15, -98, 98);
      hurt(e, TV(c, 'r_r1', 140, 200), c); e.stunT = Math.max(e.stunT, TV(c, 'r_r1', 2, 3));
      for (const o of ents) if (o !== e && o.team !== c.team && !o.dead && (o.kind === 'sol' || o.kind === 'cmd' || o.kind === 'min') && !(o.kind === 'cmd' && o.respawn > 0) && (o.x-c.x)**2 + (o.z-c.z)**2 < 30) { hurt(o, 45, c, {aoe:true}); o.stunT = Math.max(o.stunT, 0.8); }
      addZone({kind:'flash', team:c.team, x:c.x, z:c.z, r:5.5, dur:0.6, owner:c, color:'#B892E0'});
    }
  }
  if (p && (c === player || c.net)) c.facing = Math.atan2(p.x - c.x, p.z - c.z) || c.facing;
  c[slot + 'T'] = skCd(c, slot); c.cmdA = 0.6; say(c, slot === 'e' ? 'r' : slot, true);
  if (c === player) G.stats.skills++;
  return true;
}
function castU(c, k, p) {
  if (!unl('uskill')) return false;
  const g = c.grp[k];
  if (!g || !g.mem.length || g.skT > 0 || c.respawn > 0) return false;
  const S = USK[g.utype], o = {x:g.cent.x, z:g.cent.z};
  if (!p) p = {x:o.x + Math.sin(g.face)*8, z:o.z + Math.cos(g.face)*8};
  const f = Math.hypot(p.x - o.x, p.z - o.z) > 0.5 ? Math.atan2(p.x - o.x, p.z - o.z) : g.face;
  const col = c.team === 0 ? (c === player ? GCOL[k] : C.blue) : C.red;
  switch (g.utype) {
    case 'templar': case 'longbow': case 'revenant': case 'necro': castU2(c, k, g, o, p, f, S, col); break;
    case 'pike':
      g.order = 'hold'; g.pt = o; g.face = f; g.braceT = 6;
      for (const s of g.mem) { s.rootT = 6; s.facing = f; }
      addZone({kind:'brace', team:c.team, x:o.x, z:o.z, r:S.r, dur:6, f, owner:c, color:col});
      break;
    case 'shield': case 'cav': {
      const cav = g.utype === 'cav', end = clampPt(o, {x:o.x + Math.sin(f)*S.len, z:o.z + Math.cos(f)*S.len}, 999);
      addZone({kind:'sweep', team:c.team, x:o.x, z:o.z, f, len:S.len, w:S.w, r:S.w/2, dur:cav ? 0.9 : 1.6, dmg:cav ? 70 : 45, kb:cav ? 3 : 4.5, stun:cav ? 0.6 : 0.5, owner:c, color:col, hit:new Set()});
      order(c, k, 'charge', end, f, true); g.dashT = cav ? 1.0 : 1.7;
      break;
    }
    default: {
      p = clampPt(o, p, S.range);
      if (g.utype === 'archer') addZone({kind:'fire', team:c.team, x:p.x, z:p.z, r:S.r, dur:3, dmg:9, owner:c, color:'#F29A3A'});
      if (g.utype === 'mage') addZone({kind:'frost', team:c.team, x:p.x, z:p.z, r:S.r, dur:1.0, owner:c, color:'#9FD8F0'});
      if (g.utype === 'scout') { const n = g.mem.length; g.mem.forEach((s, i) => { const so = rot(slotOff(g.form, i, n), f); s.x = s.px = clamp(p.x + so.x, -97, 97); s.z = s.pz = clamp(p.z + so.z, -97, 97); s.stealth = true; s.ambushHit = true; s.blinkHit = true; s.stillT = 1; }); g.order = 'hold'; g.pt = p; g.face = f; addZone({kind:'flash', team:c.team, x:p.x, z:p.z, r:S.r, dur:0.6, owner:c, color:'#B892E0'}); }
      if (g.utype === 'griffin') { order(c, k, 'charge', p, f, true); addZone({kind:'dive', team:c.team, x:p.x, z:p.z, r:S.r, dur:1.2, delay:0.8, owner:c, color:'#F1D29A'}); }
      if (g.utype === 'siege') addZone({kind:'boulder', team:c.team, x:p.x, z:p.z, r:S.r, dur:1.5, delay:1.2, owner:c, color:'#6FE0E8'});
      if (g.utype === 'priest') addZone({kind:'sanct', team:c.team, x:p.x, z:p.z, r:S.r, dur:5, owner:c, color:'#FFE6A0'});
    }
  }
  g.skT = S.cd;
  for (const s of g.mem) s.atkA = 0.35;
  if (c === player) { say(c, 'skill', true); toast(`第${GNUM[k]}隊 ${UNITS[g.utype].n}：${S.n}`, 'b'); G.stats.skills++; updateCmdHud(); }
  return true;
}
function zoneHits(z, fn, opts = {}) {
  if (NET.client) return;
  for (const e of ents) {
    if (e.team === z.team || e.dead) continue;
    if (!(e.kind === 'sol' || e.kind === 'cmd' || e.kind === 'min' || (opts.bld && e.kind === 'bld'))) continue;
    if (e.kind === 'cmd' && e.respawn > 0) continue;
    if (opts.ground && e.kind === 'sol' && UNITS[e.utype].fly) continue;
    const cx = opts.cx ?? z.x, cz = opts.cz ?? z.z, r = (opts.r ?? z.r) + (opts.pad ? e.r : 0);
    if ((e.x-cx)**2 + (e.z-cz)**2 < r*r) fn(e);
  }
}
function updateZones(dt) {
  for (const z of zones) {
    z.t += dt;
    if (z.rock) { const k = Math.min(1, z.t/(z.delay || 1)); z.rock.position.y = 30*(1 - k) + 1; z.rock.rotation.x += dt*4; }
    if (!z.live && z.delay && z.t >= z.delay) {
      z.live = true; zoneImpact(z);
      if (z.kind === 'meteor') zoneHits(z, e => { hurt(e, z.dmg || 140, z.owner, {aoe:true}); e.stunT = Math.max(e.stunT, z.stun || 1); }, {bld:true});
      if (z.kind === 'dive') zoneHits(z, e => { hurt(e, 90, z.owner, {aoe:true}); e.stunT = Math.max(e.stunT, 1.5); });
      if (z.kind === 'boulder') { for (const e of ents) if (e.team !== z.team && !e.dead && (e.x-z.x)**2 + (e.z-z.z)**2 < (z.r + e.r)**2) { if (e.kind === 'tow' || e.kind === 'core') { if (attackable(e, z.team)) hurt(e, 300, z.owner); } else if (e.kind === 'bld') hurt(e, 300, z.owner); else if (e.kind !== 'cmd' || e.respawn <= 0) hurt(e, 110, z.owner, {aoe:true}); } }
    }
    if (z.kind === 'barrel' && !z.done) {
      z.done = true;
      for (const e of ents) if (e.team !== z.team && !e.dead && (e.x-z.x)**2 + (e.z-z.z)**2 < (z.r + e.r)**2) {
        if (e.kind === 'tow' || e.kind === 'core') { if (attackable(e, z.team)) hurt(e, z.sdmg || 320, z.owner); }
        else if (e.kind === 'bld') hurt(e, z.sdmg || 320, z.owner); else hurt(e, 80, z.owner, {aoe:true});
      }
    }
    if (z.kind === 'frost' && !z.done) { z.done = true; zoneHits(z, e => { hurt(e, 70, z.owner, {aoe:true}); slow(e, 0.6, 3); }); }
    if ((z.kind === 'rain' || z.kind === 'rainU' || z.kind === 'fire') && z.live) {
      z.tick -= dt;
      if (z.tick <= 0) { z.tick = 0.25; zoneHits(z, e => { hurt(e, z.dmg*(z.kind === 'rainU' && e.kind === 'sol' && UNITS[e.utype].fly ? 2 : 1), z.owner, {aoe:true}); if (z.kind === 'rain') slow(e, 0.2, 0.4); if (z.slowF) slow(e, z.slowF, 0.4); }); }
    }
    if (z.kind === 'sanct') { z.tick -= dt; if (z.tick <= 0) { z.tick = 0.5; for (const e of ents) if (e.team === z.team && !e.dead && (e.kind === 'sol' || (e.kind === 'cmd' && e.respawn <= 0)) && (e.x-z.x)**2 + (e.z-z.z)**2 < z.r*z.r) e.hp = Math.min(e.maxHp, e.hp + e.maxHp*0.03); } }
    if (z.dps && z.live !== false) { z.dt2 = (z.dt2 || 0) - dt; if (z.dt2 <= 0) { z.dt2 = 0.5; zoneHits(z, e => hurt(e, z.dps*0.5, z.owner, {aoe:true})); } }
    if (z.kind === 'stasis' || z.kind === 'wall' || z.kind === 'bastion') zoneHits(z, e => slow(e, z.kind === 'wall' ? 0.75 : z.kind === 'bastion' ? 0.4 : 0.6, 0.3));
    if (z.kind === 'brace') zoneHits(z, e => { const a = Math.atan2(e.x - z.x, e.z - z.z); let d = a - z.f; while (d > Math.PI) d -= Math.PI*2; while (d < -Math.PI) d += Math.PI*2; if (Math.abs(d) < 0.9 && !(e.brT > G.time)) { e.brT = G.time + 2; hurt(e, e.kind === 'sol' && UNITS[e.utype].mounted ? 70 : 40, z.owner); e.stunT = Math.max(e.stunT, 1); } }, {ground:true});
    if (z.kind === 'sweep') {
      const k = Math.min(1, z.t/z.dur), cx = z.x + Math.sin(z.f)*z.len*k, cz = z.z + Math.cos(z.f)*z.len*k;
      if (z.mover) z.mover.position.set(cx - z.x, 0.12, cz - z.z);
      zoneHits(z, e => { if (z.hit.has(e.id)) return; z.hit.add(e.id); hurt(e, z.dmg, z.owner, {aoe:true}); knock(e, null, z.kb, z.f); if (z.stun) e.stunT = Math.max(e.stunT, z.stun); }, {cx, cz, pad:true});
    }
    if (z.mesh) { const k = z.dur - z.t < 0.5 ? Math.max(0, (z.dur - z.t)/0.5) : 1; z.mesh.traverse(o => { if (o.material && o.material.transparent && o.material.userData.base === undefined) o.material.userData.base = o.material.opacity; if (o.material && o.material.userData.base !== undefined) o.material.opacity = o.material.userData.base*k*(z.live || o === z.rock ? 1 : 0.5); }); }
  }
  for (const z of zones) if (z.t >= z.dur) { z.dead = true; world.remove(z.mesh); }
  zones = zones.filter(z => !z.dead);
}
function slow(e, f, t) { if (e.kind === 'sol' && UNITS[e.utype].fly && f < 0.7) return; if (f >= e.slowF || e.slowT <= 0) { e.slowF = f; e.slowT = t; } }

// ================= building =================
function canPlace(c, type, x, z) {
  if (!unl('b:' + type)) return `${BUILDS[type].n}在軍階 ${rankNeed('b:' + type)} 解鎖`;
  const Bd = BUILDS[type];
  if (c.gold < bcost(c, type)) return '軍資不足';
  if (c.builds >= 4) return '建築已達上限 4 座';
  if (type === 'barracks' && ents.some(e => e.kind === 'bld' && !e.dead && e.type === 'barracks' && e.team === c.team)) return '每隊只能有 1 座前線兵營';
  if (Math.abs(x) > 96 || Math.abs(z) > 96) return '超出地圖';
  if (Math.abs(x - z)/SQ2 < 10) return '不能建在河道或橋上';
  if (!visSrc[c.team].some(s => s[4] && s[4].kind !== 'tow' && s[4].kind !== 'core' && (s[0]-x)**2 + (s[1]-z)**2 < 22*22) && Math.hypot(x - CORE[c.team].x, z - CORE[c.team].z) > 30) return '只能建在部隊附近';
  if (ents.some(e => (e.kind === 'tow' || e.kind === 'core') && !e.dead && e.team !== c.team && (e.x-x)**2 + (e.z-z)**2 < 16*16)) return '太靠近敵方防禦塔';
  if (ents.some(e => (e.kind === 'bld' || e.kind === 'tow' || e.kind === 'core') && !e.dead && (e.x-x)**2 + (e.z-z)**2 < (e.r + 2.5)**2)) return '與其他建築重疊';
  return null;
}
function place(c, type, x, z) {
  const err = canPlace(c, type, x, z);
  if (err) { if (c === player) toast(err, 'r'); return false; }
  const Bd = BUILDS[type];
  c.gold -= bcost(c, type); c.spent += bcost(c, type); c.builds++;
  const hp = Bd.hp * (c.key === 'valen' ? 1.25 : 1)*TV(c, 'b_p1', 1, 1.2);
  const b = addEnt({kind:'bld', type, team:c.team, owner:c, x, z, r:type === 'trap' ? 0.8 : type === 'cheval' ? 2 : 2.2, hp, maxHp:hp, built:false, buildT:Bd.t*(c.key === 'valen' ? 0.6 : 1)*TV(c, 'b_p1', 1, 0.6), mesh:mkBuilding(type, c.team)});
  b.mesh.rotation.y = Math.atan2(CORE[1 - c.team].x - x, CORE[1 - c.team].z - z);
  setOpacity(b.mesh, 0.35);
  if (Bd.r > 0 && type !== 'trap') { b.rr = ring(Math.min(Bd.r, 30) - 0.25, Math.min(Bd.r, 30), TEAML[c.team], type === 'watch' ? 0.12 : 0.3); b.rr.position.set(x, 0.14, z); world.add(b.rr); bRing(b); }
  if (c === player) toast(`開始建造${Bd.n}`, 'b');
  return true;
}
function canReform(c, k) {
  if (!unl('reform')) return `整編在軍階 ${rankNeed('reform')} 解鎖`;
  const g = c.grp[k];
  if (g.reformT > 0) return `第${GNUM[k]}隊整編冷卻中（${Math.ceil(g.reformT)} 秒）`;
  if (c.gold < 150) return '軍資不足（需要 150）';
  const atBase = Math.hypot(c.x - CORE[c.team].x, c.z - CORE[c.team].z) < 22;
  if (!atBase && !inAura(c.team, c.x, c.z, 'supply') && !G.sps.some(s => s.owner === c.team && Math.hypot(s.x - c.x, s.z - c.z) < 12)) return `需要在${reformWhere()}範圍內`;
  return null;
}
// on respawn both squads are rebuilt for free: same type = topped up and healed, new type = fresh full squad
function refreshSquads(c, picks) {
  for (const k of [0, 1]) {
    const g = c.grp[k], nt = picks[k] || g.utype;
    if (nt !== g.utype) {
      for (const s of squad(c, k)) { s.dead = true; world.remove(s.mesh); }
      g.utype = nt; g.xp = 0; g.rank = 0; g.form = UNITS[nt].form; spawnSquad(c, k);
      intel[1 - c.team][ik(c, k)] = {st:0, hint:''};
      if (c.team === 1) toast('敵方有指揮官復活時改換了兵種', 'r');
    } else {
      const live = squad(c, k).filter(s => s.utype === nt);
      for (const s of live) s.hp = s.maxHp;
      for (let i = live.length; i < UNITS[nt].sq; i++) spawnSoldier(c, nt, c.x + rnd(-3,3), c.z + rnd(-3,3), 1, 0, k);
    }
    g.mor = 100; g.routT = 0; g.reformT = 0; g.skT = 0; g.order = 'rally'; g.pt = null; g.focus = null;
  }
  groupFrame(0);
}
function aiRespawnPicks(c) {
  const out = [c.grp[0].utype, c.grp[1].utype];
  if (!c.smart && Math.random() < 0.6) return out;
  const near = cmds().filter(o => o.team !== c.team && (o.lane === c.lane || Math.hypot(o.x - c.x, o.z - c.z) < 50));
  const known = near.flatMap(o => [0, 1].map(k => intel[c.team][ik(o, k)])).filter(I => I && I.st === 2).map(I => I.type);
  for (const k of [0, 1]) {
    const T = known.find(T => STRONG[T].includes(out[k])); if (!T) continue;
    const opts = unitsFor(c).filter(u => STRONG[u].includes(T) && !known.some(K => STRONG[K].includes(u)));
    const alt = opts.length ? opts : unitsFor(c).filter(u => STRONG[u].includes(T));
    if (alt.length) out[k] = pick(alt);
  }
  return out;
}
function showRespawnMuster() {
  if (phase !== 'play' || !G.rpick) return;
  G.rmOpen = true; let ks = 0;
  const draw = () => {
    if (!G.rpick) return;
    const rp = G.rpick;
    const slot = k => `<button type="button" class="slotb ${ks === k ? 'on' : ''}" data-slot="${k}">${icon(rp[k], 44)}<span><strong style="color:${GCOL[k]}">第 ${GNUM[k]} 隊</strong><small>${UNITS[rp[k]].n}${rp[k] === player.grp[k].utype ? '・保留，補滿兵力' : '・改換，星級歸零'}</small></span></button>`;
    modal.innerHTML = `<div class="sheet"><div class="bar"><div style="display:flex;flex-direction:column;gap:6px;flex:1"><span class="kick">陣亡整編・免費・敵方看不到你的選擇</span><h1>復活時重新整軍</h1>
     <p>復活時兩隊都會補滿兵力、恢復士氣、整編冷卻歸零。保留原兵種的隊伍保有老兵星級；改換兵種的隊伍星級歸零，敵方對該隊的情報也會重置。</p></div>
     <div style="text-align:center"><div class="count" id="rcount">${Math.ceil(player.respawn)}</div><div class="sub" style="color:var(--muted);font-size:12px">秒後復活</div></div></div>
     <div class="slots2">${slot(0)}${slot(1)}</div>
     <h2>第 ${GNUM[ks]} 隊的兵種</h2>
     <div class="grid">${unitsFor(player).map(u => unitCard(u, u === rp[ks], u === player.grp[ks].utype ? '目前兵種' : '')).join('')}</div>
     <div class="bar"><button type="button" class="go" id="okR">確定：${UNITS[rp[0]].n} ＋ ${UNITS[rp[1]].n}</button><button type="button" class="go alt" id="keepR">保持原兵種</button></div></div>`;
    modal.querySelectorAll('[data-slot]').forEach(b => b.onclick = () => { ks = +b.dataset.slot; draw(); });
    modal.querySelectorAll('[data-u]').forEach(b => b.onclick = () => { G.rpick[ks] = b.dataset.u; if (ks === 0) ks = 1; draw(); });
    $('okR').onclick = () => { G.rmOpen = false; closeModal(); toast(`復活時整編為 ${UNITS[G.rpick[0]].n} ＋ ${UNITS[G.rpick[1]].n}`, 'g'); };
    $('keepR').onclick = () => { G.rpick = [player.grp[0].utype, player.grp[1].utype]; G.rmOpen = false; closeModal(); };
  };
  modal.classList.add('show'); draw();
}
function reform(c, k, type) {
  if (canReform(c, k)) return false;
  const g = c.grp[k];
  c.gold -= 150; c.spent += 150; g.reformT = 90;
  for (const s of squad(c, k)) { s.dead = true; world.remove(s.mesh); }
  g.utype = type; g.xp = 0; g.rank = 0; g.mor = 100; g.routT = 0; spawnSquad(c, k, true);
  g.order = 'rally'; g.pt = null; g.skT = 0;
  intel[1 - c.team][ik(c, k)] = {st:0, hint:''};
  if (c === player) { toast(`整編完成：第${GNUM[k]}隊改為「${UNITS[type].n}」，敵方對此隊的情報已重置`, 'g'); updateCmdHud(); }
  else if (c.team === 1) toast('敵方有指揮官完成整編', 'r');
  return true;
}

// ================= updates =================
function moveTo(e, tx, tz, dt, spdMul = 1) {
  if (e.stunT > 0 || e.rootT > 0) return false;
  if (walksOnGround(e)) {
    if (deepWater(tx, tz)) { const eu = (e.x - e.z)/SQ2, tv = (tx + tz)/SQ2, nu = (eu < 0 ? -1 : 1)*8.7; tx = (nu + tv)/SQ2; tz = (tv - nu)/SQ2; }   // aim for the near bank instead
    const w = riverWay(e, tx, tz); if (w) { tx = w.x; tz = w.z; }
  }
  const dx = tx - e.x, dz = tz - e.z, L = Math.hypot(dx, dz);
  if (L < 0.35) return false;
  let sp = (e.spd || 6) * spdMul * (e.slowT > 0 ? 1 - e.slowF : 1);
  if (L < 1.2 && e.kind === 'sol') sp *= Math.max(0.3, L/1.2);   // ease into the formation slot instead of snapping
  if (e.kind !== 'neu' && e.kind !== 'drg' && !(e.kind === 'sol' && UNITS[e.utype].fly) && inRiver(e.x, e.z)) sp *= 0.75;
  const step = Math.min(L, sp*dt);
  e.x = clamp(e.x + dx/L*step, -98, 98); e.z = clamp(e.z + dz/L*step, -98, 98);
  if (L > 0.9 || e.kind !== 'sol') e.facing = Math.atan2(dx, dz);   // small slot corrections keep the current facing
  return true;
}
function separate() {
  const L = ents.filter(e => !e.dead && (e.kind === 'sol' || e.kind === 'min' || e.kind === 'cmd' || e.kind === 'neu' || e.kind === 'drg') && !(e.kind === 'cmd' && e.respawn > 0));
  L.sort((a, b) => a.x - b.x);   // sweep along x: only neighbours closer than the largest pair radius can overlap
  for (let i = 0; i < L.length; i++) {
    const a = L[i], af = a.kind === 'sol' && UNITS[a.utype].fly;
    for (let j = i + 1; j < L.length; j++) {
      const b = L[j];
      if (b.x - a.x > 8) break;
      if (af !== (b.kind === 'sol' && UNITS[b.utype].fly)) continue;
      const dx = b.x - a.x, dz = b.z - a.z, r = (a.r + b.r)*0.85, dd = dx*dx + dz*dz;
      if (dd > 0.0001 && dd < r*r) { const d = Math.sqrt(dd), p = (r - d)*0.5, nx = dx/d*p, nz = dz/d*p; if (!(a.rootT > 0) && a.kind !== 'neu') { a.x -= nx; a.z -= nz; } if (!(b.rootT > 0) && b.kind !== 'neu') { b.x += nx; b.z += nz; } }
    }
  }
}
function statusTick(e, dt) { if (e.stunT > 0) e.stunT -= dt; if (e.rootT > 0) e.rootT -= dt; if (e.slowT > 0) e.slowT -= dt; else e.slowF = 0; if (e.atkA > 0) e.atkA -= dt; }
function baseTick(e, dt) {
  const own = SPAWN[e.team], foe = SPAWN[1 - e.team];
  if ((e.x-own.x)**2 + (e.z-own.z)**2 < 196) e.hp = Math.min(e.maxHp, e.hp + e.maxHp*0.12*dt);
  if ((e.x-foe.x)**2 + (e.z-foe.z)**2 < 100) hurt(e, 160*dt, null);
  { const sp = inAura(e.team, e.x, e.z, 'supply'); if (sp) e.hp = Math.min(e.maxHp, e.hp + e.maxHp*BV(sp, 'heal')/100*dt); }
}
function atkCd(e, base) {
  let cd = base;
  const bn = inAura(e.team, e.x, e.z, 'banner'); if (bn) cd /= 1 + BV(bn, 'spd')/100;
  if (e.kind === 'sol' && UNITS[e.utype].magic) { const o = inAura(e.team, e.x, e.z, 'obelisk'); if (o && (e.utype === 'mage' || BV(o, 'all'))) cd /= 1 + (BV(o, 'spd') + (o.owner.key === 'orion' ? 15 : 0))/100; }
  if (e.kind === 'sol' && e.owner && e.owner.frenzyT > 0) cd /= 1.4;
  if (e.kind === 'sol') cd = featCd(e, cd);
  return cd;
}
function unitRange(s) {
  let r = UNITS[s.utype].rng;
  if (UNITS[s.utype].ranged && s.owner.key === 'sylvie') r *= 1.15;
  if (UNITS[s.utype].ranged && formOf(s) === 'line') r *= 1.15;
  if (UNITS[s.utype].ranged && beaconBonus(s)) r *= 1.2;
  if (UNITS[s.utype].magic) { const o = inAura(s.team, s.x, s.z, 'obelisk'); if (o && (s.utype === 'mage' || BV(o, 'all'))) r *= 1 + (BV(o, 'rng') + (o.owner.key === 'orion' ? 20 : 0))/100; }
  if (UNITS[s.utype].ranged && hasTal(s.owner, 's_p1')) r *= 1.1;
  if (s.utype === 'siege' && hasTal(s.owner, 'b_p2')) r *= 1.2;
  return r;
}
function groupFrame(dt) {
  for (const c of cmds()) { c.grp[0].mem = []; c.grp[1].mem = []; }
  for (const e of ents) if (e.kind === 'sol' && !e.dead && !isComp(e)) e.owner.grp[e.grp].mem.push(e);
  for (const c of cmds()) {
    let d = c.facing - c.faceS; while (d > Math.PI) d -= Math.PI*2; while (d < -Math.PI) d += Math.PI*2; c.faceS += d*Math.min(1, dt*2.5);
    const both = c.grp[0].order === 'rally' && c.grp[1].order === 'rally';
    c.grp.forEach((g, k) => {
      g.t += dt;
      for (const key of ['skT', 'reformT', 'braceT', 'dashT']) if (g[key] > 0) g[key] -= dt;
      let x = 0, z = 0; for (const s of g.mem) { x += s.x; z += s.z; } const n = g.mem.length;
      g.cent = n ? {x:x/n, z:z/n} : {x:c.x, z:c.z};
      g.mem.forEach((s, i) => s.slotI = i);
      g.both = both;
      if (n) {
        let reg = G.time - g.lastHitT > 3 ? 1.5 : 0;
        if (c.respawn <= 0 && Math.hypot(g.cent.x - c.x, g.cent.z - c.z) < 16) reg += 3; if (c.respawn > 0) reg -= 2;
        { const bn = inAura(c.team, g.cent.x, g.cent.z, 'banner'); if (bn) reg += BV(bn, 'mor'); const sp = inAura(c.team, g.cent.x, g.cent.z, 'supply'); if (sp) reg += BV(sp, 'mor'); } if (G.buff[c.team].titan > 0) reg += 3;
        g.mor = clamp(g.mor + reg*dt, 0, 100);
        if (g.routT > 0) { g.routT -= dt; if (g.routT <= 0) { g.mor = 45; g.order = 'rally'; g.pt = null; if (c === player) updateCmdHud(); } }
        else if (g.mor < 25) { g.routT = 5; if (isMe(c)) { toast(`第${GNUM[k]}隊士氣崩潰，正在潰散！靠近指揮官${uj('b:banner', '或戰旗')}可穩住軍心`, 'r'); say(c, 'low', true); } else if (c.team === 1 && g.mem.some(s => s.vis[0])) toast(`敵方${CMDS[c.key].n}第${GNUM[k]}隊潰散了！`, 'g'); }
      }
      if (g.order === 'focus' && (!g.focus || g.focus.dead || !g.focus.vis[c.team])) { g.order = 'hold'; g.pt = {x:g.cent.x, z:g.cent.z}; if (c === player) updateCmdHud(); }
      if (g.pt && (g.order === 'move' || g.order === 'ambush' || g.order === 'charge') && n) {
        const arr = Math.hypot(g.cent.x - g.pt.x, g.cent.z - g.pt.z) < 3;
        if (g.order === 'move' && arr) { g.order = 'hold'; if (c === player) updateCmdHud(); }
        if (g.order === 'ambush' && arr) g.arrived = true;
        if (g.order === 'charge' && (arr || g.t > 5)) { g.order = 'hold'; g.pt = {x:g.cent.x, z:g.cent.z}; if (c === player) updateCmdHud(); }
      }
      if (g.order === 'advance') { const Pl = POLY[c.team][g.lane || c.lane], pr = lproj(Pl, g.cent.x, g.cent.z); g.adv = lpoint(Pl, pr.s + 9); const nx = lpoint(Pl, pr.s + 14); g.face = Math.atan2(nx.x - g.adv.x, nx.z - g.adv.z); }
    });
    if (c.chargeAll > 0) c.chargeAll -= dt;
  }
}

function updateCommander(c, dt) {
  if (c.respawn > 0) {
    c.respawn -= dt;
    if (c.respawn <= 0) {
      c.respawn = 0; c.hp = c.maxHp; c.x = SPAWN[c.team].x + rnd(-3,3); c.z = SPAWN[c.team].z + rnd(-3,3); c.mesh.visible = true;
      const picks = c === player ? (G.rpick || [c.grp[0].utype, c.grp[1].utype]) : c.net ? (c.rpick || [c.grp[0].utype, c.grp[1].utype]) : aiRespawnPicks(c);
      c.rpick = null;
      refreshSquads(c, picks);
      if (c === player) { if (G.rmOpen) closeModal(); G.rmOpen = false; G.rpick = null; toast(`指揮官重回戰場，兩隊已補滿：第 I 隊 ${UNITS[c.grp[0].utype].n}、第 II 隊 ${UNITS[c.grp[1].utype].n}`, 'b'); say(c, 'start', true); updateCmdHud(); }
    }
    return;
  }
  statusTick(c, dt);
  for (const k of ['qT','rT','eT','golemT','cmdA','frenzyT']) if (c[k] > 0) c[k] -= dt;
  cmdXp(c, 1.0*dt);
  baseTick(c, dt);
  if (c.respawn > 0) return;
  c.gold += (3 + G.sps.filter(s => s.k === 'granary' && s.owner === c.team).length*3)*dt*(G.behind === c.team ? 1.5 : 1);
  if (c.isP) { const v = inputVec(); if (v && c.stunT <= 0 && c.rootT <= 0) { moveTo(c, c.x + v.x*5, c.z + v.z*5, dt); if (G.freeCam) { G.freeCam = null; $('camlab').classList.add('hidden'); } } }
  else if (c.net) { const v = c.netMv; if (v && (v.x || v.z) && c.stunT <= 0 && c.rootT <= 0) moveTo(c, c.x + v.x*5, c.z + v.z*5, dt); }
  else ai(c, dt);
  c.reinT = (c.reinT || 0) - dt;
  if (c.reinT <= 0 && c.grp[0].utype) {
    const br = ents.find(e => e.kind === 'bld' && e.type === 'barracks' && e.built && !e.dead && e.team === c.team);
    c.reinT = (G.behind === c.team ? 8 : 12)*(br ? 1 - BV(br, 'cd')/100 : 1);
    const need = [0, 1].filter(k => c.grp[k].mem.length < UNITS[c.grp[k].utype].sq).sort((a, b) => c.grp[a].mem.length/UNITS[c.grp[a].utype].sq - c.grp[b].mem.length/UNITS[c.grp[b].utype].sq);
    if (need.length) {
      const k = need[0];
      const opts = [SPAWN[c.team], ...G.sps.filter(s => s.owner === c.team)]; if (br) opts.push(br);
      for (const e of ents) if (e.kind === 'bld' && e.type === 'supply' && e.built && !e.dead && e.team === c.team && BV(e, 'rein')) opts.push(e);
      let p = opts[0], bd = 1e9; for (const o of opts) { const dd = (o.x - c.x)**2 + (o.z - c.z)**2; if (dd < bd) { bd = dd; p = o; } }
      const U = UNITS[c.grp[k].utype], n = Math.min(U.rf + (p === br ? BV(br, 'rf') : 0), U.sq - c.grp[k].mem.length);
      for (let i = 0; i < n; i++) spawnSoldier(c, c.grp[k].utype, p.x + rnd(-2,2), p.z + rnd(-2,2), 1, 0, k);
    }
  }
}
function ai(c, dt) {
  if (G.tut && !G.tut.done && c.team === 1) return;
  c.aiT -= dt;
  if (c.goal) moveTo(c, c.goal.x, c.goal.z, dt);
  if (c.aiT > 0) return;
  c.aiT = 0.3;
  const hpR = c.hp/c.maxHp, base = SPAWN[c.team];
  const laneDone = !ents.some(o => o.kind === 'tow' && !o.dead && o.team !== c.team && o.lane === c.lane);
  if ((c.team === 0 ? laneDone : G.time > 720) && (c.laneT = (c.laneT || 0) - 0.3) <= 0) {
    c.laneT = 20; let best = c.lane, bn = 9;
    for (const l of LKEYS) { const n = ents.filter(o => o.kind === 'tow' && !o.dead && o.team !== c.team && o.lane === l).length; if (n < bn) { bn = n; best = l; } }
    c.lane = best;
  }
  if (hpR < 0.3) c.retreat = true;
  if (c.retreat) {
    c.goal = base; c.tgt = findTarget(c, c.x, c.z, c.rng + 0.5);
    if (c.grp[0].order !== 'retreat') order(c, 'all', 'retreat', null, undefined, true);
    if (dist(c, base) < 10 && hpR > 0.95) { c.retreat = false; order(c, 'all', 'rally', null, undefined, true); aiReform(c); }
    return;
  }
  const Pl = POLY[c.team][c.lane], pr = lproj(Pl, c.x, c.z);
  if (c.smart) { aiSmart(c, Pl, pr); return; }
  const foe = findTarget(c, c.x, c.z, 18, {noStruct:true, preferCmd:true, noNeu:true});
  if (foe) aiFight(c, foe);
  else aiLane(c, Pl, pr);
}
function aiFight(c, foe) {
  {
    c.tgt = foe;
    const d = dist(c, foe), keep = 9;
    c.goal = d > keep + foe.r ? {x:foe.x, z:foe.z} : (d < 6 ? {x:c.x - (foe.x - c.x)*0.5, z:c.z - (foe.z - c.z)*0.5} : null);
    if (c.smart) aiCmdSkills(c);
    else {
      if (d < 14 && Math.random() < 0.5) castSkill(c, 'q');
      const n = ents.filter(e => e.team !== c.team && !e.dead && (e.kind === 'sol' || e.kind === 'cmd') && e.vis[c.team] && (e.x-c.x)**2 + (e.z-c.z)**2 < 196).length;
      if (n >= 4 || (foe.kind === 'cmd' && foe.hp/foe.maxHp < 0.4)) castSkill(c, 'r', {x:foe.x, z:foe.z}, foe);
    }
    c.tacT = (c.tacT || 0) - 0.3;
    if (c.tacT <= 0) {
      c.tacT = rnd(5, 9);
      const fp = {x:foe.x, z:foe.z};
      [0, 1].forEach(k => {
        const g = c.grp[k]; if (!g.mem.length) return;
        const U = UNITS[g.utype];
        if (c.smart) { if (aiUnitSkill(c, k)) return; }
        else if (g.skT <= 0 && Math.random() < 0.45 && dist(g.cent, fp) < 24) { if (castU(c, k, g.utype === 'priest' ? {x:g.cent.x, z:g.cent.z} : fp)) return; }
        if (U.ranged) { const back = {x:c.x - Math.sin(c.facing)*2 + (k ? 3 : -3), z:c.z - Math.cos(c.facing)*2}; order(c, k, 'hold', back, Math.atan2(fp.x - back.x, fp.z - back.z), true); }
        else if (Math.random() < 0.6) { let tp = fp; if (k === 1 && Math.random() < 0.5) { const side = rot({x:Math.random() < 0.5 ? -9 : 9, z:0}, Math.atan2(fp.x - c.x, fp.z - c.z)); tp = {x:fp.x + side.x, z:fp.z + side.z}; } order(c, k, 'charge', tp, undefined, true); }
        else order(c, k, 'focus', fp, undefined, true);
      });
    }
  }
}
function aiLane(c, Pl, pr) {
  {
    c.tgt = findTarget(c, c.x, c.z, 16);
    let ahead = lpoint(Pl, pr.s + 10), push = false;
    const tw = ents.find(e => (e.kind === 'tow' || e.kind === 'core') && !e.dead && e.team !== c.team && (e.x-ahead.x)**2 + (e.z-ahead.z)**2 < 22*22);
    if (tw) {
      const cover = ents.filter(o => !o.dead && o.team === c.team && (o.kind === 'min' || o.kind === 'sol') && (o.x-tw.x)**2 + (o.z-tw.z)**2 < 15*15).length;
      const unsafe = c.smart && aiPower(c.team, tw.x, tw.z, 22) < 1.1*aiPower(1 - c.team, tw.x, tw.z, 22, c.team);
      if (cover < 2 || !attackable(tw, c.team) || unsafe) ahead = lpoint(Pl, Math.max(0, lproj(Pl, tw.x, tw.z).s - 19));
      else { ahead = lpoint(Pl, Math.max(0, lproj(Pl, tw.x, tw.z).s - 10)); push = true; for (const k of [0, 1]) if (c.grp[k].utype === 'siege' && c.grp[k].skT <= 0 && dist(c.grp[k].cent, tw) < 32) castU(c, k, {x:tw.x, z:tw.z}); }
    }
    c.goal = ahead;
    const want = push ? 'advance' : 'rally';
    c.spT = (c.spT ?? rnd(10, 25)) - 0.3;
    if (c.spT <= 0) { c.spT = rnd(18, 30); const sp = G.sps.filter(s => s.owner !== c.team && Math.hypot(s.x - c.x, s.z - c.z) < 55).sort((a, b) => Math.hypot(a.x - c.x, a.z - c.z) - Math.hypot(b.x - c.x, b.z - c.z))[0]; if (sp && c.grp[1].mem.length) { order(c, 1, c.smart ? 'hold' : 'move', {x:sp.x, z:sp.z}, undefined, true); c.capUntil = G.time + 22; } }
    const ob = aiObjective(c);
    if (ob) { c.goal = {x:ob.x + (c.x > ob.x ? 9 : -9), z:ob.z + (c.z > ob.z ? 9 : -9)}; if (Math.hypot(ob.x - c.x, ob.z - c.z) < 28 && (c.grp[0].order !== 'focus' || c.grp[0].focus !== ob)) order(c, 'all', 'focus', null, undefined, true, ob); }
    else for (const k of [0, 1]) {
      if (k === 1 && G.time < (c.capUntil || 0)) continue;
      // tactical AI keeps squads with the commander and only commits them onto a tower it can safely take
      if (c.smart) { if (push && tw && dist(c, tw) < 24) aiOrder(c, k, 'focus', {x:tw.x, z:tw.z}, undefined, tw); else if (c.grp[k].order !== 'rally') order(c, k, 'rally', null, undefined, true); continue; }
      if (c.grp[k].order !== want) order(c, k, want, null, undefined, true);
    }
    c.buildT -= 0.3;
    if (c.buildT <= 0) {
      c.buildT = rnd(30, 50);
      const opp = cmds().find(o => o.team !== c.team && o.lane === c.lane);
      const known = opp ? [0, 1].map(k => intel[c.team][ik(opp, k)]).filter(I => I && I.st === 2).map(I => I.type) : [];
      // only buildings this match's rank allows; fall back to any allowed one when the squad's favourites are locked
      const okB = t => unl('b:' + t) && (t !== 'barracks' || !ents.some(e => e.kind === 'bld' && !e.dead && e.type === 'barracks' && e.team === c.team));
      let opts = (BPREF[pick([c.grp[0].utype, c.grp[1].utype])] || []).filter(okB);
      if (!opts.length) opts = BKEYS.filter(okB);
      let type = opts.length ? pick(opts) : null;
      if (known.includes('cav') && okB('cheval')) type = 'cheval'; if (known.includes('griffin') && okB('arrowtower')) type = 'arrowtower'; if (known.includes('scout') && okB('watch')) type = 'watch';
      if (type && c.smart && c.builds >= 4 && c.gold >= BUILDS[type].cost + 60) aiRecycle(c);
      if (type && c.gold >= BUILDS[type].cost + 60) { const back = lpoint(Pl, pr.s - 6); place(c, type, back.x + rnd(-5,5), back.z + rnd(-5,5)); }
    }
  }
}
// ---------- tactical AI (allies; enemies too when 敵方 AI 強化 is on) ----------
const AIFAV = {valen:['shield','pike'], sylvie:['archer','pike'], orion:['mage','shield'], gru:['cav','griffin'], brand:['siege','shield'], raven:['scout','cav']};
function aiPickUnits(c) {
  const U2 = unitsFor(c), ex = (facOf(c) >= 0 ? FUNITS[facOf(c)] : []).filter(unitOk);
  if (!c.smart) { c.grp[0].utype = pick(U2); c.grp[1].utype = Math.random() < 0.3 ? c.grp[0].utype : pick(U2); return; }
  const f = AIFAV[c.key].map(u => unitOk(u) ? u : pick(U2));
  if (Math.random() < 0.45) { c.grp[0].utype = f[0]; c.grp[1].utype = Math.random() < 0.4 && ex.length ? pick(ex) : f[1]; return; }
  // keep the favourite, pair it with something that covers its weaknesses
  const a = f[0], weak = ALLU.filter(u => STRONG[u].includes(a));
  const cover = U2.filter(u => u !== a && weak.some(w => STRONG[u].includes(w)));
  c.grp[0].utype = a; c.grp[1].utype = cover.length ? pick(cover) : f[1];
}
function aiVal(e) {
  if (e.kind === 'sol') return e.hp*(UNITS[e.utype].ranged ? 1.3 : 1);
  if (e.kind === 'min') return e.hp*0.8;
  if (e.kind === 'cmd') return e.respawn > 0 ? 0 : 250 + e.hp*0.4;
  if (e.kind === 'drg') return e.hp;
  return 0;
}
// fighting strength of `team` around (x,z); enemies count only if `viewer` can see them
function aiPower(team, x, z, R, viewer) {
  let p = 0;
  for (const e of ents) {
    if (e.dead || e.team !== team) continue;
    const d2 = (e.x - x)**2 + (e.z - z)**2;
    if (e.kind === 'tow' || e.kind === 'core') { if (d2 < 15*15) p += e.hp*0.6; continue; }
    if (d2 > R*R) continue;
    if (viewer !== undefined && viewer !== team && e.vis && !e.vis[viewer]) continue;
    p += aiVal(e);
  }
  return p;
}
function aiCluster(c, x, z, range, r, filt) {
  const L = ents.filter(e => !e.dead && e.team !== c.team && e.team < 2 && (e.kind === 'sol' || e.kind === 'cmd' || e.kind === 'min') && (!e.vis || e.vis[c.team]) && !(e.kind === 'cmd' && e.respawn > 0) && (e.x - x)**2 + (e.z - z)**2 < (range + r*0.5)**2 && (!filt || filt(e)));
  let best = null, bn = 0;
  for (const a of L) { let n = 0, sx = 0, sz = 0, w = 0; for (const b of L) if ((a.x - b.x)**2 + (a.z - b.z)**2 < r*r) { const v = b.kind === 'cmd' ? 3 : b.kind === 'min' ? 0.4 : 1; n += v; sx += b.x*v; sz += b.z*v; w += v; } if (n > bn) { bn = n; best = {x:sx/w, z:sz/w}; } }
  return best ? {p:best, n:bn} : null;
}
function aiArmy(c) {
  let x = 0, z = 0, n = 0;
  for (const k of [0, 1]) for (const m of c.grp[k].mem) if (!m.dead) { x += m.x; z += m.z; n++; }
  return n ? {x:x/n, z:z/n, n} : null;
}
function aiCmdSkills(c) {
  for (const slot of ['q', 'r', 'e']) {
    if (c[slot + 'T'] > 0 || (slot === 'e' && c.lvl < 6)) continue;
    if (slot === 'e' && aiCastE(c)) continue;
    const sp = CSK[c.key][slot], need = slot === 'r' ? 3 : 1.5;
    if (sp.t === 'circle') { const cl = aiCluster(c, c.x, c.z, sp.range, sp.r); if (cl && cl.n >= (c.key === 'raven' && slot === 'q' ? 2 : need)) castSkill(c, slot, cl.p); }
    else if (sp.t === 'line') { const cl = aiCluster(c, c.x, c.z, sp.len, sp.w); if (cl && cl.n >= need) castSkill(c, slot, cl.p); }
    else if (sp.t === 'unit') { const t = findTarget(c, c.x, c.z, sp.range, {noStruct:true, preferCmd:true, noNeu:true}); if (t && (t.kind === 'cmd' ? t.hp/t.maxHp < 0.6 : false)) castSkill(c, slot, {x:t.x, z:t.z}, t); }
    else { const n = ents.filter(e => !e.dead && e.team !== c.team && e.team < 2 && (e.kind === 'sol' || e.kind === 'cmd') && (e.x - c.x)**2 + (e.z - c.z)**2 < sp.r*sp.r).length; if (n >= (slot === 'r' ? 5 : 3)) castSkill(c, slot, {x:c.x, z:c.z}); }
  }
}
function aiUnitSkill(c, k) {
  const g = c.grp[k]; if (!g.mem.length || g.skT > 0) return false;
  const S = USK[g.utype], o = g.cent;
  if (g.utype === 'priest') {
    let hurtN = 0; for (const kk of [0, 1]) for (const m of c.grp[kk].mem) if (m.hp < m.maxHp*0.7 && (m.x - o.x)**2 + (m.z - o.z)**2 < 18*18) hurtN++;
    if (hurtN >= 5) { const a = aiArmy(c) || o; return castU(c, k, {x:a.x, z:a.z}); }
    return false;
  }
  if (g.utype === 'siege') { const tw = ents.find(e => (e.kind === 'tow' || e.kind === 'core' || e.kind === 'bld') && !e.dead && e.team !== c.team && attackable(e, c.team) && (e.x - o.x)**2 + (e.z - o.z)**2 < S.range*S.range); if (tw) return castU(c, k, {x:tw.x, z:tw.z}); }
  if (g.utype === 'scout') { const cl = aiCluster(c, o.x, o.z, S.range, 7, e => e.kind === 'cmd' || (e.kind === 'sol' && UNITS[e.utype].ranged)); return cl && cl.n >= 3 ? castU(c, k, cl.p) : false; }
  if (g.utype === 'pike') { const cl = aiCluster(c, o.x, o.z, 12, 8, e => e.kind === 'sol' && !UNITS[e.utype].ranged); return cl && cl.n >= 3 ? castU(c, k, cl.p) : false; }
  if (g.utype === 'revenant') { const cl = aiCluster(c, o.x, o.z, 10, 6); return cl && cl.n >= 4 ? castU(c, k, o) : false; }
  if (g.utype === 'templar') { let hurtN = 0; for (const m of g.mem) if (m.hp < m.maxHp*0.6) hurtN++; const cl = aiCluster(c, o.x, o.z, S.range, S.r); if (hurtN >= 3 || (cl && cl.n >= 4)) return castU(c, k, cl ? cl.p : o); return false; }
  const range = S.t === 'line' ? S.len : S.range, r = S.t === 'line' ? S.w + 2 : S.r;
  const cl = aiCluster(c, o.x, o.z, range, r);
  return cl && cl.n >= 3 ? castU(c, k, cl.p) : false;
}
function underEnemyTower(team, x, z, pad = 0) { return ents.some(t => (t.kind === 'tow' || t.kind === 'core') && !t.dead && t.team !== team && t.team < 2 && attackable(t, team) && (t.x - x)**2 + (t.z - z)**2 < (t.rng + 2 + pad)**2); }
// best enemy for squad k to fight: something it counters, else the nearest
function aiPrey(c, k, foe) {
  const g = c.grp[k], o = g.cent, good = STRONG[g.utype] || [];
  let best = null, bd = 1e9;
  for (const e of ents) {
    if (e.dead || e.team === c.team || e.team > 1 || (e.kind !== 'sol' && e.kind !== 'cmd') || (e.kind === 'cmd' && e.respawn > 0) || (e.vis && !e.vis[c.team])) continue;
    const d = (e.x - o.x)**2 + (e.z - o.z)**2; if (d > 24*24 || underEnemyTower(c.team, e.x, e.z)) continue;
    // a fallen commander sends his whole army home, so he is the prize
    const sc = e.kind === 'cmd' ? d - 900 - (1 - e.hp/e.maxHp)*400 : d - (good.includes(e.utype) ? 400 : 0) + (STRONG[e.utype] && STRONG[e.utype].includes(g.utype) ? 300 : 0);
    if (sc < bd) { bd = sc; best = e; }
  }
  return best || foe;
}
function aiRecycle(c) {
  const mine = ents.filter(e => e.kind === 'bld' && !e.dead && e.owner === c);
  if (!mine.length) return;
  const sc = e => Math.hypot(e.x - c.x, e.z - c.z) + (e.built ? 0 : -999);
  demolish(mine.sort((a, b) => sc(b) - sc(a))[0]);
}
// issue an order only if it actually changes something (re-issuing makes squads re-form and stop fighting)
function aiOrder(c, k, type, pt, face, target) {
  const g = c.grp[k]; if (!g.mem.length) return;
  if (g.order === type) {
    if (type === 'focus' && g.focus === target && target && !target.dead) return;
    if (type !== 'focus' && (!pt || (g.pt && Math.hypot(g.pt.x - pt.x, g.pt.z - pt.z) < 6))) return;
  }
  order(c, k, type, pt, face, true, target);
}
function aiSmart(c, Pl, pr) {
  const tm = c.team, hpR = c.hp/c.maxHp, player = SVR ? netLead(c) : PLAYER();
  // answering the player's call for support: stay at the player's side, fight whatever is there
  if (c.supportUntil > G.time && player.respawn <= 0) {
    const f = findTarget(c, c.x, c.z, 18, {noStruct:true, preferCmd:true, noNeu:true});
    if (f && dist(f, player) < 30) { aiCmdSkills(c); aiFight(c, f); return; }
    const off = c.id % 2 ? 5 : -5;
    c.goal = {x:player.x + off, z:player.z - off}; c.tgt = null;
    for (const k of [0, 1]) if (c.grp[k].mem.length && c.grp[k].order !== 'rally') order(c, k, 'rally', null, undefined, true);
    return;
  }
  c.refT = (c.refT ?? 10) - 0.3; if (c.refT <= 0) { c.refT = 8; aiReform(c); }
  let foe = findTarget(c, c.x, c.z, 22, {noStruct:true, preferCmd:true, noNeu:true});
  if (foe && underEnemyTower(tm, foe.x, foe.z) && aiPower(tm, c.x, c.z, 24) < 2.2*aiPower(1 - tm, foe.x, foe.z, 24, tm)) foe = null;
  if (!foe) {
    let help = null;
    if (tm === player.team && player !== c && player.respawn <= 0 && dist(c, player) < 42) {
      const pf = findTarget(player, player.x, player.z, 18, {noStruct:true, noNeu:true});
      if (pf && aiPower(1 - tm, pf.x, pf.z, 20, tm) > 0.7*aiPower(tm, player.x, player.z, 18)) help = {x:(player.x*2 + pf.x)/3, z:(player.z*2 + pf.z)/3};
    }
    if (!help) {
      const tw = ents.find(e => (e.kind === 'tow' || e.kind === 'core') && !e.dead && e.team === tm && Math.hypot(e.x - c.x, e.z - c.z) < 70 && ents.some(o => !o.dead && o.team === 1 - tm && (o.kind === 'sol' || o.kind === 'cmd') && (o.x - e.x)**2 + (o.z - e.z)**2 < 16*16));
      if (tw) help = {x:tw.x, z:tw.z};
    }
    if (help) {
      if (globalThis.__DBG) __DBG[tm].help++;
      c.goal = help; c.tgt = null;
      for (const k of [0, 1]) { const g = c.grp[k]; if (g.mem.length && g.order !== 'rally') order(c, k, 'rally', null, undefined, true); }
      return;
    }
    if (globalThis.__DBG) __DBG[tm].lane++;
    return aiLane(c, Pl, pr);
  }
  c.tgt = foe;
  const my = aiPower(tm, c.x, c.z, 24), en = aiPower(1 - tm, foe.x, foe.z, 24, tm);
  const ratio = my/Math.max(1, en);
  const army = aiArmy(c);
  const ref = army || c;
  let ux = ref.x - foe.x, uz = ref.z - foe.z; const ul = Math.hypot(ux, uz) || 1; ux /= ul; uz /= ul;
  const faceFoe = p => Math.atan2(foe.x - p.x, foe.z - p.z);
  aiCmdSkills(c);
  if (globalThis.__DBG) { __DBG[tm][ratio < 0.5 || (hpR < 0.4 && ratio < 0.9) ? 'fall' : ratio > 1.15 ? 'press' : 'even']++; }
  if (ratio < 0.5 || (hpR < 0.4 && ratio < 0.9)) {
    if (unl('team') && tm === player.team && G.time - (c.askT || -99) > 45 && dist(c, player) > 30) { c.askT = G.time; tToast(tm, `${LNAME[c.lane]}的${CMDS[c.key].n}兵力不足，請求支援`, 'r'); G.pingAt = {x:c.x, z:c.z, t:G.time}; }
    // outmatched: fall back to the nearest friendly tower and fight under it
    const tw = ents.filter(e => (e.kind === 'tow' || e.kind === 'core') && !e.dead && e.team === tm).sort((a, b) => Math.hypot(a.x - c.x, a.z - c.z) - Math.hypot(b.x - c.x, b.z - c.z))[0];
    const anchor = tw ? {x:tw.x + (SPAWN[tm].x - tw.x)*0.06, z:tw.z + (SPAWN[tm].z - tw.z)*0.06} : SPAWN[tm];
    c.goal = {x:anchor.x + (SPAWN[tm].x - anchor.x)*0.08, z:anchor.z + (SPAWN[tm].z - anchor.z)*0.08};
    if ((c.fbT = (c.fbT || 0) - 0.3) <= 0) {
      c.fbT = 3;
      for (const k of [0, 1]) { const g = c.grp[k]; if (!g.mem.length) continue; const off = UNITS[g.utype].ranged ? 0 : 5; const p = {x:anchor.x - ux*off + (k ? 3 : -3), z:anchor.z - uz*off}; aiOrder(c, k, 'hold', p, faceFoe(p)); }
    }
    return;
  }
  aiFight(c, foe);
}
function unitRangeOf(u) { return UNITS[u].rng || 2; }
function aiReformSmart(c) {
  if (c.gold < 320) return;
  // only react to squads we actually face: the commanders in our lane or close by
  const near = cmds().filter(o => o.team !== c.team && (o.lane === c.lane || Math.hypot(o.x - c.x, o.z - c.z) < 45));
  const known = near.flatMap(o => [0, 1].map(k => intel[c.team][ik(o, k)])).filter(I => I && I.st === 2).map(I => I.type);
  if (!known.length) return;
  for (const k of [0, 1]) {
    const g = c.grp[k], U = UNITS[g.utype];
    const threats = known.filter(T => STRONG[T].includes(g.utype));
    if (!threats.length || g.mem.length > U.sq*0.6) continue;
    const T = threats[0], counters = unitsFor(c).filter(u => STRONG[u].includes(T) && !known.some(K => STRONG[K].includes(u)));
    const opts = counters.length ? counters : unitsFor(c).filter(u => STRONG[u].includes(T));
    if (opts.length && !canReform(c, k)) { reform(c, k, pick(opts)); break; }
  }
}
function aiReform(c) {
  if (c.smart) return aiReformSmart(c);
  const known = cmds().filter(o => o.team !== c.team).flatMap(o => [0, 1].map(k => intel[c.team][ik(o, k)])).filter(I => I && I.st === 2).map(I => I.type);
  if (!known.length) return;
  for (const k of [0, 1]) {
    const g = c.grp[k], threat = known.find(T => STRONG[T].includes(g.utype));
    if (!threat && Math.random() < 0.75) continue;
    const T = threat || pick(known), counters = unitsFor(c).filter(u => STRONG[u].includes(T));
    if (counters.length && !canReform(c, k)) { reform(c, k, pick(counters)); break; }
  }
}

function updateSoldier(s, dt) {
  const c = s.owner, U = UNITS[s.utype];
  statusTick(s, dt); baseTick(s, dt); if (s.dead) return;
  if (s.temp) { s.temp -= dt; if (s.temp <= 0) { s.dead = true; world.remove(s.mesh); return; } }
  s.atkT -= dt; s.spd = U.spd;
  const wolf = isComp(s);
  const g = wolf ? null : c.grp[s.grp];
  let ord = wolf ? 'rally' : g.order;
  if (c.respawn > 0) ord = 'retreat';
  if (g && g.routT > 0) ord = 'rout';
  const form = wolf ? 'loose' : g.form;
  let spdMul = 1;
  if ((s.utype === 'cav' || s.utype === 'griffin') && c.key === 'gru') spdMul *= 1.1;
  spdMul *= solSpeedMul(s, g);
  if (form === 'wedge') spdMul *= 1.15; if (form === 'circle') spdMul *= 0.8;
  if (g && g.dashT > 0) spdMul *= g.utype === 'cav' ? 2.2 : 1.3;
  if (s.utype === 'cav') { const tr = inAura(1 - s.team, s.x, s.z, 'trench'); if (tr) slow(s, BV(tr, 'cav')/100, 0.3); }
  const rng = unitRange(s);
  let anchor, aggroFrom = s, aggro = 10, leash = 16, leashFrom = c, tgt = null, engage = true;
  const n = wolf ? 1 : Math.max(1, g.mem.length);
  const slotAt = (p, f) => { const o = rot(slotOff(form, wolf ? 0 : s.slotI, n), f); return {x:p.x + o.x, z:p.z + o.z}; };
  switch (ord) {
    case 'retreat': anchor = slotAt(SPAWN[s.team], 0); engage = false; spdMul *= 1.25; break;
    case 'rout': anchor = c.respawn > 0 ? SPAWN[s.team] : {x:c.x - Math.sin(c.faceS)*4 + Math.sin(s.id)*2, z:c.z - Math.cos(c.faceS)*4 + Math.cos(s.id)*2}; engage = false; spdMul *= 1.2; break;
    case 'move': anchor = slotAt(g.pt, g.face); engage = false; spdMul *= 1.15; break;
    case 'ambush':
      anchor = slotAt(g.pt, g.face);
      if (!g.arrived) { engage = false; spdMul *= 1.15; } else { aggro = 6; leash = 9; leashFrom = g.pt; if (s.stillT > 0.5) s.stealth = true; }
      break;
    case 'hold': anchor = slotAt(g.pt || g.cent, g.face); aggroFrom = g.pt || s; aggro = Math.max(9, rng + 2); leash = 13; leashFrom = g.pt || s; break;
    case 'charge': anchor = slotAt(g.pt || g.cent, g.face); spdMul *= 1.6*(c.chargeAll > 0 ? 1.15 : 1); aggro = g.dashT > 0 ? 0 : 6; leash = 99; if (g.dashT > 0) engage = false; break;
    case 'focus': anchor = {x:s.x, z:s.z}; if (g.focus && !g.focus.dead && attackable(g.focus, s.team)) tgt = g.focus; spdMul *= 1.1; break;
    case 'advance': anchor = slotAt(g.adv || g.cent, g.face); aggro = 11; leash = 99; break;
    default: {
      let off = {x:0, z:-3}; if (wolf) off = {x:Math.sin(s.id)*3, z:Math.cos(s.id)*3}; else if (g.both) off = {x:s.grp ? 4 : -4, z:-3.2};
      const fg = s.comp && s.follow !== undefined ? c.grp[s.follow] : null;
      if (fg && fg.mem.length) { const base = fg.cent, r0 = 3.5 + (s.id % 4); anchor = {x:base.x + Math.sin(s.id*2.4)*r0, z:base.z + Math.cos(s.id*2.4)*r0}; aggroFrom = base; aggro = 12; leash = 18; leashFrom = base; }
      else { const o = rot(off, c.faceS); anchor = slotAt({x:c.x + o.x, z:c.z + o.z}, c.faceS); }
    }
  }
  if (U.heal && s.atkT <= 0 && ord !== 'retreat') {
    let lo = null, lr = 0.92;
    for (const e of ents) if (!e.dead && e.team === s.team && (e.kind === 'sol' || e.kind === 'cmd') && !(e.respawn > 0) && e.hp/e.maxHp < lr && (e.x-s.x)**2 + (e.z-s.z)**2 < rng*rng) { lr = e.hp/e.maxHp; lo = e; }
    if (lo) { lo.hp = Math.min(lo.maxHp, lo.hp + U.heal); s.atkT = atkCd(s, U.cd); s.atkA = 0.35; shot(s, lo, '#FFE6A0', 0.2); if (lo === player || isMe(lo) || isMe(lo.owner)) floaters.push({x:lo.x, y:3, z:lo.z, s:'+' + U.heal, c:'#9FE0A0', t:0.8}); }
  }
  if (!tgt && engage && aggro > 0) {
    const cand = findTarget(s, aggroFrom.x, aggroFrom.z, aggro);
    if (cand && (cand.x-leashFrom.x)**2 + (cand.z-leashFrom.z)**2 < leash*leash) tgt = cand;
  }
  if (s.rootT > 0 && tgt && dist(s, tgt) > rng + tgt.r + 0.3) tgt = null;
  if (s.utype === 'siege' && !tgt && engage) { const st = findTarget(s, s.x, s.z, rng + 4); if (st && (st.kind === 'tow' || st.kind === 'core' || st.kind === 'bld')) tgt = st; }
  let moving = false;
  if (tgt) {
    const d = dist(s, tgt);
    if (d <= rng + tgt.r + 0.3) {
      if (s.atkT <= 0 && s.stunT <= 0) { doAttack(s, tgt); s.atkT = atkCd(s, U.cd); if (ord === 'ambush' && g) { g.order = 'hold'; g.pt = {x:g.cent.x, z:g.cent.z}; if (c === player) updateCmdHud(); } }
      s.facing = Math.atan2(tgt.x - s.x, tgt.z - s.z);
    } else moving = moveTo(s, tgt.x, tgt.z, dt, spdMul);
  } else {
    moving = moveTo(s, anchor.x, anchor.z, dt, spdMul);
    if (!moving && g && (ord === 'hold' || ord === 'ambush' || ord === 'move')) s.facing = g.face;
  }
  if (moving) { s.moveT += dt; s.stillT = 0; if (ord !== 'ambush' && !s.blinkHit && !(s.shadowT > G.time)) s.stealth = false; }
  else { s.moveT = Math.max(0, s.moveT - dt*2); s.stillT += dt; if (U.stealth && s.stillT > 2 && !tgt) s.stealth = true; }
  if (ord !== 'ambush' && !U.stealth && !(s.shadowT > G.time)) s.stealth = false;
  if (!U.fly) {
    const ch = inAura(1 - s.team, s.x, s.z, 'cheval');
    if (ch) { slow(s, BV(ch, 'slow')/100, 0.3); if ((U.mounted || ord === 'charge') && !(s.chevT > G.time)) { s.chevT = G.time + 3; hurt(s, BV(ch, 'dmg'), ch); s.stunT = BV(ch, 'stun'); } }
  }
}
function updateMinion(m, dt) {
  statusTick(m, dt); baseTick(m, dt); if (m.dead) return;
  m.atkT -= dt;
  if (m.guard) { const home = CORE[m.team], tg = findTarget(m, home.x, home.z, 24); if (tg) { if (dist(m, tg) <= m.rng + tg.r + 0.3) { if (m.atkT <= 0 && m.stunT <= 0) { doAttack(m, tg); m.atkT = 1.0; } m.facing = Math.atan2(tg.x - m.x, tg.z - m.z); } else moveTo(m, tg.x, tg.z, dt); } else moveTo(m, m.post.x, m.post.z, dt); return; }
  const t = findTarget(m, m.x, m.z, 9);
  if (t) { if (dist(m, t) <= m.rng + t.r + 0.3) { if (m.atkT <= 0 && m.stunT <= 0) { doAttack(m, t); m.atkT = 1.2; } m.facing = Math.atan2(t.x - m.x, t.z - m.z); } else moveTo(m, t.x, t.z, dt); }
  else { const Pl = POLY[m.team][m.lane], pr = lproj(Pl, m.x, m.z), p = lpoint(Pl, pr.s + 6); moveTo(m, p.x + m.off, p.z + m.off, dt); }
}
function updateTower(t, dt) {
  t.atkT -= dt; if (t.atkT > 0) return;
  let tg = null;
  for (const c of cmds()) if (c.team === t.team && c.lastHitBy && G.time - c.lastHitBy.t < 2 && !c.lastHitBy.c.dead && c.lastHitBy.c.respawn <= 0 && dist(t, c.lastHitBy.c) < t.rng + 1) tg = c.lastHitBy.c;
  if (!tg) { let bd = 1e9; for (const e of ents) { if (e.team === t.team || e.dead || !e.vis[t.team] || !(e.kind === 'sol' || e.kind === 'min' || e.kind === 'cmd' || e.kind === 'drg') || (e.kind === 'cmd' && e.respawn > 0)) continue; const dd = (e.x-t.x)**2 + (e.z-t.z)**2; if (dd > t.rng*t.rng) continue; const sc = dd + (e.kind === 'cmd' ? 300 : 0); if (sc < bd) { bd = sc; tg = e; } } }
  if (tg) { doAttack(t, tg); t.atkT = t.kind === 'core' ? 0.8 : 1.2; } else t.atkT = 0.2;
}
function updateBuilding(b, dt) {
  if (!b.built) { b.buildT -= dt; if (b.buildT <= 0) { b.built = true; setOpacity(b.mesh, b.type === 'trap' ? 0.8 : 1); if (isMe(b.owner)) { toast(`${BUILDS[b.type].n}建造完成：${BUILDS[b.type].s}`, 'b'); chime(); } } return; }
  if (b.type === 'arrowtower') { b.atkT -= dt; if (b.atkT <= 0) { const t = findTarget(b, b.x, b.z, BV(b, 'rng'), {noStruct:true}); if (t) { doAttack(b, t); if (BV(b, 'n2')) towerExtra(b, t, BV(b, 'n2')); b.atkT = 1; if (b.mesh.userData.aim) b.mesh.userData.aim.rotation.y = Math.atan2(t.x - b.x, t.z - b.z) - b.mesh.rotation.y; } else b.atkT = 0.25; } }
  if (b.type === 'trap' && !(b.armT > G.time)) {
    for (const e of ents) if (e.team !== b.team && !e.dead && (e.kind === 'sol' || e.kind === 'cmd' || e.kind === 'min') && !(e.kind === 'sol' && UNITS[e.utype].fly) && !(e.kind === 'cmd' && e.respawn > 0) && (e.x-b.x)**2 + (e.z-b.z)**2 < 6.25) {
      for (const o of ents) if (o.team !== b.team && !o.dead && (o.kind === 'sol' || o.kind === 'cmd') && (o.x-b.x)**2 + (o.z-b.z)**2 < 25) { o.rootT = BV(b, 'root'); hurt(o, BV(b, 'dmg'), b); }
      if (b.team === 0) toast('符文陷阱觸發', 'g'); else if (e.team === 0) toast('踩中敵方陷阱！', 'r');
      b.uses = (b.uses || 0) + 1; if (b.uses < BV(b, 'ch')) { b.armT = G.time + 3; break; }
      kill(b, null); break;
    }
  }
}
function refreshProt() {
  const alive = {};
  for (const o of ents) if (o.kind === 'tow' && !o.dead) { const k = o.team + o.lane; alive[k] = Math.min(alive[k] || 9, o.tier); }
  for (const o of ents) { if (o.kind === 'tow') o.prot = (alive[o.team + o.lane] || 9) < o.tier; else if (o.kind === 'core') o.prot = LKEYS.every(l => alive[o.team + l]); }
}
function spawnWave() {
  const sc = 1 + G.time/480;
  for (const t of [0,1]) for (const l of LKEYS) {
    const broken = !ents.some(o => o.kind === 'tow' && !o.dead && o.team !== t && o.lane === l);
    for (let i = 0; i < (broken ? 6 : 4); i++) {
      const ranged = i === 3, sup = i >= 4, st = lpoint(POLY[t][l], 14 + i*1.6), hp = (sup ? 650 : ranged ? 120 : 180)*sc;
      addEnt({kind:'min', team:t, lane:l, x:st.x + rnd(-1,1), z:st.z + rnd(-1,1), r:sup ? 1 : 0.6, hp, maxHp:hp, atk:(sup ? 28 : ranged ? 11 : 9)*sc, rng:ranged ? 9 : 1.8, ranged, sup, spd:6, off:rnd(-1.5,1.5), mesh:bake(mkMinion(t, ranged, sup))});
    }
  }
}
function updateRespawnUi() {
  const dead = phase === 'play' && player && player.respawn > 0;
  const b = $('rsBtn'); if (b) { b.classList.toggle('hidden', !dead || !!G.rmOpen); if (dead) b.textContent = `陣亡整編（免費）・${Math.ceil(player.respawn)} 秒後復活`; }
  const rc = $('rcount'); if (rc && dead) rc.textContent = Math.ceil(player.respawn);
}
function update(dt) {
  if (phase === 'muster') {
    G.muster -= dt; const el = $('mcount'); if (el) el.textContent = Math.max(0, Math.ceil(G.muster));
    if (SVR && cmds().every(c => !c.net || c.mpick)) G.muster = Math.min(G.muster, 0);
    if (G.muster <= 0) { if (SVR) netMusterDone(); else { const a = G.mpick[0] || pick(unitsFor(player)); chooseUnits(a, G.mpick[1] || a); } }
    G.visT -= dt; if (G.visT <= 0) { G.visT = 0.2; updateVision(); }
    return;
  }
  if (phase !== 'play') return;
  if (!G.introDone) { G.introDone = true; if (!SVR) rankIntro(); }
  G.time += dt;
  if (!(G.tut && !G.tut.done)) { G.waveT -= dt; if (G.waveT <= 0) { G.waveT = 26; spawnWave(); } }
  bldTick(); gridBuild(); featTick(dt); if (!SVR) supplyFx(dt);
  G.visT -= dt; if (G.visT <= 0) { G.visT = 0.2; updateVision(); }
  for (const t of [0,1]) {
    G.ravenT[t] -= dt;
    if (G.ravenT[t] <= 0) {
      G.ravenT[t] = cmds().some(c => c.team === t && hasTal(c, 'r_p2')) ? 35 : 60;
      if (cmds().some(c => c.team === t && c.key === 'raven')) {
        for (const c of cmds()) if (c.team !== t) for (const k of [0, 1]) { const I = intel[t][ik(c, k)]; if (I.st === 0) { I.st = 1; I.hint = clsOf(c.grp[k].utype); } }
        if (t === 0 || SVR) tToast(t, '暗影情報：敵方各隊大類已更新', 'g');
      }
    }
  }
  refreshProt(); groupFrame(dt); strategicTick(dt);
  for (const e of ents) {
    if (e.dead) continue;
    if (e.kind === 'cmd') updateCommander(e, dt); else if (e.kind === 'sol') updateSoldier(e, dt); else if (e.kind === 'min') updateMinion(e, dt);
    else if (e.kind === 'tow' || e.kind === 'core') updateTower(e, dt); else if (e.kind === 'bld') updateBuilding(e, dt);
    else if (e.kind === 'neu') updateNeutral(e, dt); else if (e.kind === 'drg') updateAllyDragon(e, dt);
  }
  separate(); riverWall(); updateZones(dt);
  for (const e of ents) if (e.dead && e.rr) { world.remove(e.rr); e.rr = null; }
  ents = ents.filter(e => !e.dead || e.kind === 'cmd');
}

// ================= strategy layer: strongpoints, morale, veterancy, comeback, neutral objectives =================
function mkSP(s) {
  const o = Object.assign({}, s, {prog:0, owner:-1, contest:false, arc:null});
  o.mesh = s.k === 'granary' ? mkGranary() : mkBeacon();
  o.mesh.position.set(s.x, 0, s.z); o.mesh.rotation.y = s.x > 0 ? Math.PI : 0; world.add(o.mesh);
  o.base = ring(6.6, 7.0, '#CFC6B2', 0.55); o.base.position.set(s.x, s.k === 'beacon' ? 2.85 : 0.35, s.z); world.add(o.base);
  updateSPVisual(o);
  return o;
}
function updateSPVisual(s) {
  const col = s.owner === 0 ? '#5A9AE8' : s.owner === 1 ? '#E06A4A' : '#CFC6B2';
  for (const m of s.mesh.userData.ownerMats || []) { m.color.set(col); if (m.emissive) m.emissive.set(s.k === 'beacon' ? col : '#000000'); }
  s.base.material.color.set(col);
}
function updateSPRing(s) {
  if (s.arc) { world.remove(s.arc); s.arc.geometry.dispose(); s.arc = null; }
  const p = Math.abs(s.prog); if (p < 1) return;
  s.arc = new THREE.Mesh(new THREE.RingGeometry(7.1, 7.8, 48, 1, Math.PI/2, -p/100*Math.PI*2), new THREE.MeshBasicMaterial({color:s.prog > 0 ? C.blue : C.red, transparent:true, opacity:s.contest ? 0.5 : 0.9, depthWrite:false, side:THREE.DoubleSide}));
  s.arc.rotation.x = -Math.PI/2; s.arc.position.set(s.x, s.k === 'beacon' ? 2.9 : 0.4, s.z); world.add(s.arc);
}
const beaconBonus = e => G && G.sps && G.sps.some(sp => sp.k === 'beacon' && sp.owner === e.team && (e.x - sp.x)**2 + (e.z - sp.z)**2 < 144);
function gainXp(c, k, amt) {
  const g = c.grp[k]; if (!g || !amt) return;
  g.xp += amt;
  const rank = g.xp >= 30 ? 3 : g.xp >= 15 ? 2 : g.xp >= 6 ? 1 : 0;
  if (rank > g.rank) { g.rank = rank; for (const s of g.mem) { const add2 = UNITS[s.utype].hp*0.08; s.maxHp += add2; s.hp += add2; } if (isMe(c)) { toast(`第${GNUM[k]}隊晉升老兵 ${'★'.repeat(rank)}：攻擊與生命 +${rank*8}%`, 'g'); chime(); updateCmdHud(); } }
}
function updateBehind() {
  const d = G.lost[0] - G.lost[1], prev = G.behind;
  G.behind = d >= 2 ? 0 : d <= -2 ? 1 : -1;
  if (G.behind !== prev) {
    if (G.behind === 0) toast('逆風加成啟動：我方軍資收入 +50%、復活加快、防禦塔傷害 +25%' + uj('obj', '、中立目標效果延長'), 'g');
    else if (G.behind === 1) toast('敵方獲得逆風加成：小心他們的反撲', 'r');
    else toast('雙方戰力拉平，逆風加成解除', '');
  }
}
function spawnNeutral(key) {
  const home = key === 'titan' ? {x:-48, z:-48} : {x:48, z:48};
  const n = addEnt({kind:'neu', sub:key, team:2, x:home.x, z:home.z, home, r:key === 'dragon' ? 4.5 : 4, hp:key === 'dragon' ? 4500 : 3800, maxHp:key === 'dragon' ? 4500 : 3800, spd:4, lastTeam:-1, facing:0, mesh:key === 'dragon' ? mkDragon() : mkTitan()});
  n.mesh.scale.setScalar(key === 'dragon' ? 0.85 : 1);
  G.obj[key].ent = n;
  toast(key === 'titan' ? '遠古泰坦在西側河道甦醒：擊倒後全隊獲得「泰坦之力」' : '深淵巨龍在東側河道現身：擊倒後巨龍將替你進軍', 'b');
  drum();
}
function updateNeutral(n, dt) {
  if (n.camp) { updateCampMob(n, dt); return; }
  statusTick(n, dt); n.atkT -= dt;
  let tg = null, bd = 1e9;
  for (const e of ents) {
    if (e.dead || e.team > 1 || !(e.kind === 'sol' || e.kind === 'cmd' || e.kind === 'drg') || (e.kind === 'cmd' && e.respawn > 0)) continue;
    if ((e.x - n.home.x)**2 + (e.z - n.home.z)**2 > 18*18) continue;
    const dd = (e.x - n.x)**2 + (e.z - n.z)**2; if (dd < bd) { bd = dd; tg = e; }
  }
  if (!tg) { moveTo(n, n.home.x, n.home.z, dt); n.hp = Math.min(n.maxHp, n.hp + n.maxHp*0.04*dt); return; }
  const d = Math.sqrt(bd); n.facing = Math.atan2(tg.x - n.x, tg.z - n.z);
  if (d > 7 + tg.r) { if ((n.x - n.home.x)**2 + (n.z - n.home.z)**2 < 100) moveTo(n, tg.x, tg.z, dt); return; }
  if (n.atkT <= 0) {
    n.atkT = 2.2; n.atkA = 0.35;
    const dmg = n.sub === 'dragon' ? 75 : 60;
    for (const e of ents) if (!e.dead && e.team < 2 && (e.kind === 'sol' || e.kind === 'cmd' || e.kind === 'min' || e.kind === 'drg') && !(e.kind === 'cmd' && e.respawn > 0) && (e.x - tg.x)**2 + (e.z - tg.z)**2 < 30) hurt(e, dmg, n, {aoe:true});
    addZone({kind:'flash', team:2, x:tg.x, z:tg.z, r:5.5, dur:0.6, owner:n, color:n.sub === 'dragon' ? '#F2703A' : '#6FE0E8'});
  }
}
function neutralSlain(n) {
  if (n.camp) { campMobSlain(n); return; }
  const team = n.lastTeam, o = G.obj[n.sub];
  o.ent = null; o.t = G.time + 180;
  if (team < 0) return;
  for (const c of cmds()) if (c.team === team) c.gold += 100;
  if (team === 0) G.stats.objs++;
  if (n.sub === 'titan') {
    G.buff[team].titan = 90*(G.behind === team ? 1.5 : 1);
    toast(team === 0 ? `我方擊倒遠古泰坦！泰坦之力 ${Math.round(G.buff[team].titan)} 秒：部隊傷害 +20%、士氣回復加快${anyB() ? '、建築 -30% 造價' : ''}` : '敵方擊倒遠古泰坦，獲得泰坦之力', team === 0 ? 'g' : 'r');
  } else {
    spawnAllyDragon(team);
    toast(team === 0 ? '我方擊倒深淵巨龍！巨龍將沿最脆弱的路線替我們進軍' : '敵方馴服了深淵巨龍，牠正朝我方防線推進！', team === 0 ? 'g' : 'r');
  }
  drum();
}
function spawnAllyDragon(team) {
  let lane = 'mid', bn = 9;
  for (const l of LKEYS) { const n = ents.filter(o => o.kind === 'tow' && !o.dead && o.team !== team && o.lane === l).length; if (n < bn) { bn = n; lane = l; } }
  const d = addEnt({kind:'drg', team, lane, x:48, z:48, r:3.5, hp:3000*(G.behind === team ? 1.4 : 1), maxHp:3000*(G.behind === team ? 1.4 : 1), spd:5.5, life:120, facing:0, mesh:mkDragon()});
  d.mesh.scale.setScalar(0.62); d.mesh.add(ring(5, 5.6, TEAML[team], 0.9));
}
function updateAllyDragon(d, dt) {
  statusTick(d, dt); d.atkT -= dt; d.life -= dt;
  if (d.life <= 0) { kill(d, null); toast(d.team === 0 ? '我方巨龍力竭離去' : '敵方巨龍力竭離去', ''); return; }
  const t = findTarget(d, d.x, d.z, 12);
  if (t) {
    d.facing = Math.atan2(t.x - d.x, t.z - d.z);
    if (dist(d, t) <= 9 + t.r) {
      if (d.atkT <= 0) {
        d.atkT = 1.8; d.atkA = 0.35;
        for (const e of ents) if (!e.dead && e.team !== d.team && e.team < 2 && (e.x - t.x)**2 + (e.z - t.z)**2 < (4 + e.r)**2) {
          if (e.kind === 'tow' || e.kind === 'core') { if (attackable(e, d.team)) hurt(e, 130, d); }
          else if (e.kind === 'bld') hurt(e, 130, d); else hurt(e, 60, d, {aoe:true});
        }
        addZone({kind:'flash', team:d.team, x:t.x, z:t.z, r:4.5, dur:0.6, owner:d, color:'#F2703A'});
      }
    } else moveTo(d, t.x, t.z, dt);
  } else { const Pl = POLY[d.team][d.lane], pr = lproj(Pl, d.x, d.z), p = lpoint(Pl, pr.s + 8); moveTo(d, p.x, p.z, dt); }
}
function strategicTick(dt) {
  for (const t of [0, 1]) { if (G.buff[t].titan > 0) G.buff[t].titan -= dt; if (G.coreShield[t] > 0) G.coreShield[t] -= dt; }
  for (const key of ['titan', 'dragon']) { const o = G.obj[key]; if (!o.ent && G.time >= o.t && unl('obj')) spawnNeutral(key); }
  for (const t of [0, 1]) {
    const core = ents.find(e => e.kind === 'core' && e.team === t);
    if (core && !core.dead && !core.prot && !G.lastStand[t]) {
      G.lastStand[t] = true; G.coreShield[t] = 60;
      for (let i = 0; i < 6; i++) { const a = i/6*Math.PI*2, p = {x:CORE[t].x + Math.sin(a)*9, z:CORE[t].z + Math.cos(a)*9}; addEnt({kind:'min', team:t, lane:'mid', guard:true, post:p, x:p.x, z:p.z, r:0.9, hp:900, maxHp:900, atk:30, rng:2.4, spd:7, off:0, mesh:bake(mkMinion(t, false, false, true))}); }
      toast(t === 0 ? '背水一戰！王城衛隊出陣，主塔 60 秒減傷 30%，我方在主堡周圍傷害 +20%' : '敵方背水一戰：王城衛隊出陣，主塔暫時減傷', t === 0 ? 'g' : 'r'); drum();
    }
  }
  for (const s of G.sps) {
    let n0 = 0, n1 = 0;
    for (const e of ents) if (!e.dead && (e.kind === 'sol' || (e.kind === 'cmd' && e.respawn <= 0)) && (e.x - s.x)**2 + (e.z - s.z)**2 < 49) { if (e.team === 0) n0++; else if (e.team === 1) n1++; }
    const prev = s.owner;
    s.contest = !!(n0 && n1);
    if (n0 && !n1) s.prog = Math.min(100, s.prog + 20*dt); else if (n1 && !n0) s.prog = Math.max(-100, s.prog - 20*dt);
    if (s.prog >= 100) s.owner = 0; else if (s.prog <= -100) s.owner = 1; else if ((s.owner === 0 && s.prog <= 0) || (s.owner === 1 && s.prog >= 0)) s.owner = -1;
    if (s.owner !== prev) {
      updateSPVisual(s);
      if (s.owner >= 0) { toast(`${s.owner === 0 ? '我方' : '敵方'}佔領了${s.n}（${s.k === 'granary' ? '軍資收入提升' : '視野與遠程加成'}）`, s.owner === 0 ? 'g' : 'r'); if (s.owner === 0) G.stats.caps++; }
      else toast(`${s.n}恢復中立`, '');
    }
    s.vt = (s.vt || 0) - dt; if (s.vt <= 0) { s.vt = 0.15; updateSPRing(s); }
  }
}
function aiObjective(c) {
  for (const key of ['titan', 'dragon']) {
    const o = G.obj[key].ent; if (!o || o.dead) continue;
    if (key === 'titan' ? c.lane !== 'top' : c.lane !== 'bot') continue;
    if (G.behind === c.team || G.time > 360 || o.hp < o.maxHp*0.5) { if (squad(c).length >= 9 && c.hp/c.maxHp > 0.6) return o; }
  }
  return aiCampTarget(c);
}

// ================= render =================
const v3 = new THREE.Vector3();
const ov = $('ov'), octx = ov.getContext('2d');
let W = 1, H = 1, DPR = 1, camZoom = 1, camZ = 1;
function resize() {
  W = window.innerWidth; H = window.innerHeight; DPR = Math.min(2, window.devicePixelRatio || 1);
  renderer.setSize(W, H, false); camera.aspect = W/H; camera.updateProjectionMatrix(); lcam.aspect = W/H;
  ov.width = W*DPR; ov.height = H*DPR; setLobbyView();
  if (composer) { try { composer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); composer.setSize(W, H); } catch (e) {} }
}
function setLobbyView() {
  const narrow = W <= 860;
  const cx = narrow ? W/2 : 224 + (W - 224 - 420)/2, cy = narrow ? 96 + (H*0.5 - 96)/2 + 20 : H/2 - 10;
  lcam.setViewOffset(W, H, W/2 - cx, H/2 - cy, W, H); lcam.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
function toScreen(x, y, z) { v3.set(x, y, z).project(camera); return {x:(v3.x*0.5 + 0.5)*W, y:(-v3.y*0.5 + 0.5)*H, ok:v3.z < 1 && v3.z > -1}; }
const camT = {x:-70, z:70};
let last = performance.now(), tAll = 0;
function renderLobby(dt) {
  tAll += dt;
  if (!lobbyDrag) holder.rotation.y += dt*lobbyRotV;
  if (lobbyModel) animModel(lobbyModel, false, tAll, 0, 0);
  for (const l of lights) { const f = 1 + Math.sin(tAll*11 + l.L.position.x)*0.12 + Math.sin(tAll*23)*0.06; l.L.intensity = 1.2*f; l.f.scale.y = f; }
  draw3d(lobby, lcam);
  octx.setTransform(DPR, 0, 0, DPR, 0, 0); octx.clearRect(0, 0, W, H);
}
function render(dt) {
  tAll += dt;
  if (phase === 'exit') return;
  if (phase === 'lobby') return renderLobby(dt);
  skinFx(dt);
  const focus = G && G.freeCam ? G.freeCam : (player && player.respawn <= 0 ? player : SPAWN[0]);
  camT.x += (focus.x - camT.x)*Math.min(1, dt*6); camT.z += (focus.z - camT.z)*Math.min(1, dt*6);
  camZ += ((G && G.deploy ? 1.55 : 1)*camZoom - camZ)*Math.min(1, dt*4);
  const narrow = W < H, hgt = (narrow ? 78 : 56)*camZ, back = (narrow ? 50 : 38)*camZ;
  camera.position.set(camT.x, hgt, camT.z + back); camera.lookAt(camT.x, 0, camT.z - 2);
  camShake(dt);
  sun.position.set(camT.x - 30, 80, camT.z + 30); sun.target.position.set(camT.x, 0, camT.z);
  for (const e of ents) {
    if (!e.mesh) continue;
    if (e.kind === 'cmd' && e.respawn > 0) { e.mesh.visible = false; continue; }
    e.mesh.visible = !e.dead && (e.team === 0 || e.vis[0]);
    if (e.rr) e.rr.visible = e.built && e.mesh.visible;
    if (!e.mesh.visible) continue;
    const mv = dt > 0 ? Math.hypot(e.x - e.px, e.z - e.pz) / dt : 0; e.px = e.x; e.pz = e.z; e.mv += ((mv > 0.8 ? 1 : 0) - e.mv)*Math.min(1, dt*8); e.sv = (e.sv || 0) + (Math.min(mv, 30) - (e.sv || 0))*Math.min(1, dt*6);
    e.mesh.position.x = e.x; e.mesh.position.z = e.z;
    if (e.kind === 'cmd' || e.kind === 'sol' || e.kind === 'min' || e.kind === 'neu' || e.kind === 'drg') {
      let d = (e.facing || 0) - e.mesh.rotation.y; while (d > Math.PI) d -= Math.PI*2; while (d < -Math.PI) d += Math.PI*2;
      e.mesh.rotation.y += d*Math.min(1, dt*10);
      animModel(e.mesh, e.mv > 0.5, tAll + e.id*0.37, e.atkA, e.kind === 'cmd' ? e.cmdA : 0, e.sv);
    } else animModel(e.mesh, false, tAll + e.id, 0, 0);
  }
  artTick(dt);
  fxStep(dt);
  if (G && G.placing && G.ghost) { const p = G.aim || player; G.ghost.position.set(p.x, 0, p.z); const ok = !canPlace(player, G.placing, p.x, p.z); G.ghost.children[0].material.color.set(ok ? '#7CD08A' : '#E06A55'); }
  if (G && G.aura && player) { G.aura.visible = player.respawn <= 0; G.aura.position.set(player.x, 0.13, player.z); }
  if (G && G.drag && G.drag.cur) { G.dragG.visible = true; const a = G.drag.p, b = G.drag.cur; G.dragG.position.set(a.x, 0.5, a.z); G.dragG.rotation.y = Math.atan2(b.x - a.x, b.z - a.z); } else if (G && G.dragG) G.dragG.visible = false;
  if (player) { updateMarkers(); updateInd(); updateOPrev(); updateDemoHL(); updateUpgHL(); }
  waterU.t.value = tAll;
  draw3d(scene, camera);
  drawOverlay(dt);
}
function bar(x, y, w, h, f, col) { octx.fillStyle = 'rgba(8,10,14,.85)'; octx.fillRect(x - w/2 - 1, y - 1, w + 2, h + 2); octx.fillStyle = col; octx.fillRect(x - w/2, y, w*clamp(f, 0, 1), h); }
function pill(x, y, text, col, bg) {
  octx.font = '600 12px "Noto Sans TC", sans-serif';
  const w = octx.measureText(text).width + 14;
  octx.fillStyle = bg || 'rgba(12,15,20,.88)'; octx.beginPath(); if (octx.roundRect) octx.roundRect(x - w/2, y - 10, w, 20, 10); else octx.rect(x - w/2, y - 10, w, 20); octx.fill();
  octx.fillStyle = col; octx.fillText(text, x, y + 4);
}
function drawOverlay(dt) {
  octx.setTransform(DPR, 0, 0, DPR, 0, 0); octx.clearRect(0, 0, W, H);
  if (!G) return;
  octx.textAlign = 'center';
  for (const e of ents) {
    if (e.dead || (e.kind === 'cmd' && e.respawn > 0) || (e.team === 1 && !e.vis[0])) continue;
    const fly = e.kind === 'sol' && UNITS[e.utype].fly;
    const top = {neu:11, drg:7.5, cmd:4.4, sol:fly ? 7.2 : (e.utype === 'cav' ? 4.0 : e.utype === 'siege' ? 3.2 : 3.6), min:e.sup || e.guard ? 4.0 : 3.5, tow:20, core:22, bld:e.type === 'watch' ? 14 : e.type === 'trap' ? 1.2 : e.type === 'banner' ? 8.2 : 9.5}[e.kind];
    let ty = top;
    if ((e.kind === 'tow' || e.kind === 'core' || e.kind === 'bld') && e.mesh) { if (e.topY === undefined) { const bb = new THREE.Box3().setFromObject(e.mesh); e.topY = isFinite(bb.max.y) && bb.max.y > 0.5 ? bb.max.y + (e.kind === 'bld' ? 1.4 : 1.6) : top; } ty = e.topY; }
    const p = toScreen(e.x, ty, e.z);
    if (ty !== top) {   // tall structures: keep the bar on screen while the building itself is in view
      const b = toScreen(e.x, 0, e.z);
      if (b.ok && b.y > 0 && b.y < H + 40 && b.x > -80 && b.x < W + 80) { p.ok = true; if (!(p.y >= 26)) p.y = 26; }
    }
    if (!p.ok || p.x < -80 || p.x > W + 80 || p.y < -60 || p.y > H + 60) continue;
    const col = e === player ? '#7CD08A' : e.team === 0 ? C.blue : C.red;
    if (e.kind === 'neu' || e.kind === 'drg') { bar(p.x, p.y, e.camp ? 56 : 96, e.camp ? 5 : 7, e.hp/e.maxHp, e.kind === 'neu' ? C.neutral : col); if (!e.camp) pill(p.x, p.y - 14, e.kind === 'neu' ? (e.sub === 'titan' ? '遠古泰坦' : '深淵巨龍') : `${e.team ? '敵方' : '我方'}巨龍・${Math.ceil(e.life)}s`, e.kind === 'neu' ? '#D9C2FF' : (e.team ? '#F4A698' : '#BFDBFA')); continue; }
    if (e.kind === 'cmd') { bar(p.x, p.y - 8, 54, 6, e.hp/e.maxHp, col); octx.font = '700 12px "Noto Sans TC", sans-serif'; octx.fillStyle = C.ink; octx.fillText(`${e.human && e.name ? e.name + '・' : ''}${CMDS[e.key].n}・Lv${e.lvl}`, p.x, p.y - 14); if (e.streak >= 2) pill(p.x, p.y - 32, `懸賞 ${e.streak*100}`, '#F1D29A', 'rgba(60,40,10,.9)'); }
    else if (e.kind === 'sol') {
      bar(p.x, p.y, 18, 3, e.hp/e.maxHp, e.owner === player ? GCOL[e.grp] : col);
      let key = e.utype === 'wolf' ? 'gru' : e.utype;
      if (e.team === 1) { const I = intel[0][ik(e.owner, e.grp)]; if (!isComp(e) && (!I || I.st !== 2 || I.type !== e.utype)) key = 'unknown'; }
      const im = glyphImg(key, e.team ? '#F4A698' : '#BFDBFA'); if (im.complete) octx.drawImage(im, p.x - 8, p.y - 19, 16, 16);
      if (e.owner === player && !isComp(e)) { octx.font = '700 10px "Noto Sans TC", sans-serif'; octx.fillStyle = GCOL[e.grp]; octx.fillText(GNUM[e.grp], p.x + 13, p.y - 8); }
      if (e.stealth && e.team === 0) { octx.font = '11px "Noto Sans TC", sans-serif'; octx.fillStyle = '#C9A0FF'; octx.fillText('隱身', p.x, p.y - 22); }
    } else if (e.kind === 'min') bar(p.x, p.y, e.sup ? 22 : 14, 3, e.hp/e.maxHp, col);
    else if (e.kind === 'tow' || e.kind === 'core') {
      bar(p.x, p.y, e.kind === 'core' ? 86 : 58, 6, e.hp/e.maxHp, col);
      if (e.prot) { octx.font = '11px "Noto Sans TC", sans-serif'; octx.fillStyle = C.muted; octx.fillText('受保護', p.x, p.y - 5); }
    } else if (e.kind === 'bld') {
      bar(p.x, p.y, 34, 4, e.built ? e.hp/e.maxHp : 1 - e.buildT/BUILDS[e.type].t, e.built ? col : C.gold);
      const Bd = BUILDS[e.type];
      pill(p.x, p.y - 15, e.built ? (blv(e) > 1 ? `${bldName(e)}｜${bldShort(e.type, blv(e))}` : `${Bd.n}｜${Bd.s}`) : `${Bd.n}｜建造中`, e.team ? '#F4A698' : '#F1D29A');
    }
  }
  if (player && player.respawn <= 0 && phase === 'play') {
    for (const k of [0, 1]) {
      const g = player.grp[k]; if (!g.mem.length) continue;
      const pc = toScreen(g.cent.x, 4.5, g.cent.z);
      const sk = !unl('uskill') ? '' : g.skT > 0 ? `・技能 ${Math.ceil(g.skT)}s` : '・技能就緒';
      if (pc.ok) pill(pc.x, pc.y - 18, `${GNUM[k]}隊 ${'★'.repeat(g.rank)}${UNITS[g.utype].n}・${g.routT > 0 ? '潰散中' : ONAME[g.order]}・士氣 ${Math.round(g.mor)}${sk}`, GCOL[k], (G.sel === 'all' || G.sel === k) ? 'rgba(12,15,20,.92)' : 'rgba(12,15,20,.55)');
    }
  }
  if (G.sps) for (const s of G.sps) {
    const p = toScreen(s.x, s.k === 'beacon' ? 8.5 : 6.5, s.z); if (!p.ok || p.x < -80 || p.x > W + 80 || p.y < -40 || p.y > H + 40) continue;
    const st = s.contest ? '爭奪中' : s.owner === 0 ? '我方' : s.owner === 1 ? '敵方' : Math.abs(s.prog) > 1 ? `佔領 ${Math.round(Math.abs(s.prog))}%` : '中立';
    pill(p.x, p.y, `${s.n}｜${s.k === 'granary' ? '軍資+3/秒' : '視野・遠程加成'}｜${st}`, s.owner === 0 ? '#BFDBFA' : s.owner === 1 ? '#F4A698' : '#E7DFC9');
  }
  if (G.aiming && G.aiming.p && phase === 'play') {
    const A = G.aiming, p = toScreen(A.p.x, 0.5, A.p.z);
    if (p.ok) { const name = aimSlotName(A.slot), extra = A.sp.t === 'unit' ? (A.tgt ? '・已鎖定' : '・游標靠近敵人以鎖定') : A.sp.t === 'line' ? `・長 ${A.sp.len}` : A.sp.t === 'circle' ? `・半徑 ${A.sp.r}` : ''; pill(p.x, p.y + 26, name + extra, A.slot[0] === 'u' ? GCOL[+A.slot[1]] : '#F1D29A'); }
  }
  if (bubble) {
    bubble.t -= dt;
    const c = bubble.c;
    if (bubble.t > 0 && c.respawn <= 0) {
      const p = toScreen(c.x, 6.8, c.z);
      octx.font = '900 16px "Noto Serif TC", serif'; const w = octx.measureText(bubble.text).width + 26;
      octx.globalAlpha = clamp(bubble.t/0.4, 0, 1);
      octx.fillStyle = VP[c.key].c; octx.beginPath(); if (octx.roundRect) octx.roundRect(p.x - w/2, p.y - 36, w, 32, 10); else octx.rect(p.x - w/2, p.y - 36, w, 32); octx.fill();
      octx.beginPath(); octx.moveTo(p.x - 7, p.y - 5); octx.lineTo(p.x + 7, p.y - 5); octx.lineTo(p.x, p.y + 4); octx.fill();
      octx.fillStyle = '#16120A'; octx.fillText(bubble.text, p.x, p.y - 14); octx.globalAlpha = 1;
    } else if (bubble.t <= 0) bubble = null;
  }
  for (const f of floaters) { f.t -= dt; f.y += dt*3; const p = toScreen(f.x, f.y, f.z); if (!p.ok) continue; octx.globalAlpha = clamp(f.t/0.4, 0, 1); octx.fillStyle = f.c; octx.font = '700 14px "Noto Sans TC", sans-serif'; octx.fillText(f.s, p.x, p.y); }
  octx.globalAlpha = 1; floaters = floaters.filter(f => f.t > 0);
}
const mm = $('mm'), mctx = mm.getContext('2d');
function drawMini() {
  const S = 344, k = S/200, Pm = v => (v + 100)*k;
  mctx.fillStyle = '#1C2A1E'; mctx.fillRect(0, 0, S, S);
  mctx.strokeStyle = '#23476E'; mctx.lineWidth = 16*k; mctx.beginPath(); mctx.moveTo(0, 0); mctx.lineTo(S, S); mctx.stroke();
  mctx.strokeStyle = '#6B5D43'; mctx.lineWidth = 9*k; mctx.lineJoin = 'round';
  for (const l of LKEYS) { mctx.beginPath(); LANES[l].forEach((p, i) => i ? mctx.lineTo(Pm(p[0]), Pm(p[1])) : mctx.moveTo(Pm(p[0]), Pm(p[1]))); mctx.stroke(); }
  for (const e of ents) {
    if (e.dead || (e.kind === 'cmd' && e.respawn > 0) || (e.team === 1 && !e.vis[0])) continue;
    if (e.kind === 'neu') continue;
    const x = Pm(e.x), y = Pm(e.z); mctx.fillStyle = TC[e.team] || C.neutral;
    if (e.kind === 'drg') { mctx.beginPath(); mctx.arc(x, y, 10, 0, 7); mctx.fill(); mctx.strokeStyle = '#F2703A'; mctx.lineWidth = 3; mctx.stroke(); continue; }
    if (e.kind === 'tow' || e.kind === 'core') { const s = e.kind === 'core' ? 13 : 8; mctx.save(); mctx.translate(x, y); mctx.rotate(Math.PI/4); mctx.fillRect(-s/2, -s/2, s, s); mctx.strokeStyle = '#0F1218'; mctx.lineWidth = 2; mctx.strokeRect(-s/2, -s/2, s, s); mctx.restore(); }
    else if (e.kind === 'cmd') { mctx.beginPath(); mctx.arc(x, y, e === player ? 9 : 7, 0, 7); mctx.fill(); mctx.strokeStyle = e === player ? '#fff' : '#0F1218'; mctx.lineWidth = 3; mctx.stroke(); }
    else if (e.kind === 'bld') mctx.fillRect(x - 3, y - 3, 6, 6);
    else { if (e.owner === player) mctx.fillStyle = GCOL[e.grp]; mctx.beginPath(); mctx.arc(x, y, e.kind === 'sol' ? 3 : 2.2, 0, 7); mctx.fill(); }
  }
  if (player) for (const k of [0, 1]) { const g = player.grp[k]; if (g.pt && ['move','hold','charge','ambush'].includes(g.order)) { mctx.strokeStyle = GCOL[k]; mctx.lineWidth = 3; mctx.beginPath(); mctx.arc(Pm(g.pt.x), Pm(g.pt.z), 7, 0, 7); mctx.stroke(); } }
  mctx.globalAlpha = 0.5; mctx.drawImage(fogCv, 0, 0, S, S); mctx.globalAlpha = 1;
  if (G && G.sps) for (const s of G.sps) { mctx.fillStyle = s.owner === 0 ? C.blue : s.owner === 1 ? C.red : '#CFC6B2'; const x = Pm(s.x), y = Pm(s.z); mctx.beginPath(); if (s.k === 'granary') mctx.rect(x - 7, y - 7, 14, 14); else { mctx.moveTo(x, y - 9); mctx.lineTo(x + 8, y + 6); mctx.lineTo(x - 8, y + 6); mctx.closePath(); } mctx.fill(); mctx.strokeStyle = '#0F1218'; mctx.lineWidth = 2; mctx.stroke(); }
  if (G && G.obj && unl('obj')) for (const key of ['titan', 'dragon']) { const o = G.obj[key], h = objHome(key); mctx.strokeStyle = C.neutral; mctx.lineWidth = 3; mctx.beginPath(); mctx.arc(Pm(h.x), Pm(h.z), 11, 0, 7); mctx.stroke(); if (o.ent) { mctx.fillStyle = C.neutral; mctx.beginPath(); mctx.arc(Pm(h.x), Pm(h.z), 7, 0, 7); mctx.fill(); } }
  drawCampsMini(mctx, Pm);
  if (G && G.pingAt && G.time - G.pingAt.t < 6) { const a = (G.time - G.pingAt.t)%1.2/1.2; mctx.strokeStyle = `rgba(240,151,138,${1 - a})`; mctx.lineWidth = 4; mctx.beginPath(); mctx.arc(Pm(G.pingAt.x), Pm(G.pingAt.z), 8 + a*26, 0, 7); mctx.stroke(); }
  const vw = 30*camZ*k, vh = 22*camZ*k; mctx.strokeStyle = 'rgba(236,229,213,.8)'; mctx.lineWidth = 2; mctx.strokeRect(Pm(camT.x) - vw, Pm(camT.z) - vh, vw*2, vh*2);
}

// ================= HUD =================
function toast(msg, cls) {
  if (SVR) { const w = SVR.ctx || (SVR.who && SVR.who.cid); SVR.who = null; if (SVR.mute) return; if (w) SVR.ptoasts.push([w, msg, cls || '']); else SVR.toasts.push([msg, cls || '', 0]); return; }
  const box = $('toasts'); if (!box) return;
  const d = document.createElement('div'); d.className = 'toast ' + (cls || ''); d.textContent = msg;
  box.prepend(d); while (box.children.length > 4) box.lastChild.remove();
  setTimeout(() => d.remove(), 4000);
}
const qIcon = k => ({valen:'cheval', sylvie:'archer', orion:'mage', gru:'cav', brand:'siege', raven:'spyglass'})[k];
const rIcon = k => ({valen:'core', sylvie:'focus', orion:'obelisk', gru:'charge', brand:'build', raven:'ambush'})[k];
function buildHud() {
  $('team').onpointerdown = teamPanelDown;
  $('rsBtn').onclick = () => { if (!G.rpick) G.rpick = [player.grp[0].utype, player.grp[1].utype]; showRespawnMuster(); };
  $('cmd').innerHTML = `<div class="h"><span>指揮台</span><span>1 / 2 / 3 選隊</span></div>
   <div class="sq" id="sq0"></div><div class="sq" id="sq1"></div>
   <button type="button" class="allb" data-g="all">全軍（3）</button>
   <div class="ords">${ORDERS.filter(o => unl('o:' + o[0])).map(o => `<button type="button" class="cb" data-o="${o[0]}" aria-label="${o[1]}（${o[2].toUpperCase()}）：${o[3]}" title="${o[3]}">${icon(o[0], 40)}<span>${o[1]}</span><span class="k">${o[2].toUpperCase()}</span></button>`).join('')}</div>
   <div class="forms" ${unl('form') ? '' : 'style="display:none"'}>${FKEYS.map(f => `<button type="button" class="cb" data-f="${f}" aria-label="${FORMS[f].n}（${FORMS[f].k}）：${FORMS[f].d}" title="${FORMS[f].d}">${icon(FORMS[f].ic, 36)}<span>${FORMS[f].n}</span><span class="k">${FORMS[f].k}</span></button>`).join('')}</div>
   <button type="button" class="dep" id="depBtn" ${unl('deploy') ? '' : 'style="display:none"'}>${glyph('deploy', 20)}戰術部署<span style="font-weight:400;font-size:12px;opacity:.8">（空白鍵）</span></button>`;
  $('builds').innerHTML = BKEYS.filter(k => unl('b:' + k)).map(k => `<button type="button" class="bb" data-b="${k}" aria-label="建造${BUILDS[k].n}，${BUILDS[k].cost} 軍資：${BUILDS[k].d}" title="${BUILDS[k].n}：${BUILDS[k].d}">${icon(k, 46)}<span>${BUILDS[k].cost}</span></button>`).join('')
    + (unl('upg') ? '' : '<!--') + `<button type="button" class="bb" data-act="upgrade" aria-label="升級自己的建築（L）" title="升級（L）：完工的建築可升級，最高 5 級">${icon('upgrade', 46)}<span>升級</span></button>` + (unl('upg') ? '' : '-->')
    + (BKEYS.some(b => unl('b:' + b)) ? '' : '<!--') + `<button type="button" class="bb" data-act="demolish" aria-label="拆除自己的建築（K）" title="拆除（K）：完工返還 50%、建造中全額退還">${icon('demolish', 46)}<span>拆除</span></button>` + (BKEYS.some(b => unl('b:' + b)) ? '' : '-->');
  const d = CMDS[player.key];
  $('skills').innerHTML = `
   <div class="sk" style="right:0;bottom:4px"><div style="position:relative">${icon(player.key, 92)}<span class="lvb" id="lvB">1</span><svg class="xpr" viewBox="0 0 100 100"><circle cx="50" cy="50" r="47" pathLength="100" id="xpR"></circle></svg></div><span class="lb">統帥</span></div>
   <button type="button" class="sk lock" id="skE" style="right:176px;bottom:6px;${unl('e') ? '' : 'display:none'}" aria-label="${d.e.n}（E）：${d.e.d}" title="${d.e.d}"><div style="position:relative">${icon('e_' + player.key, 60)}<div class="cd" id="cdE"></div><span class="key">E</span></div><span class="lb">${d.e.n}</span></button>
   <button type="button" class="sk" id="skU" style="right:166px;bottom:92px;${unl('armory') ? '' : 'display:none'}" aria-label="軍械庫（U）"><div style="position:relative">${icon('armory', 46)}<span class="key">U</span></div><span class="lb">軍械庫</span></button>
   <button type="button" class="sk" id="skQ" style="right:104px;bottom:6px" aria-label="${d.q.n}（Q）：${d.q.d}" title="${d.q.d}"><div style="position:relative">${icon(qIcon(player.key), 60)}<div class="cd" id="cdQ"></div><span class="key">Q</span></div><span class="lb">${d.q.n}</span></button>
   <button type="button" class="sk" id="skR" style="right:84px;bottom:86px;${unl('r') ? '' : 'display:none'}" aria-label="${d.r.n}（R）：${d.r.d}" title="${d.r.d}"><div style="position:relative">${icon(rIcon(player.key), 60)}<div class="cd" id="cdR"></div><span class="key">R</span></div><span class="lb">${d.r.n}</span></button>
   <button type="button" class="sk" id="skT" style="right:6px;bottom:112px;${unl('reform') ? '' : 'display:none'}" aria-label="整編（T）"><div style="position:relative">${icon('reform', 46)}<div class="cd" id="cdT"></div><span class="key">T</span></div><span class="lb">整編</span></button>`;
  $('menuBtn').innerHTML = glyph('menu', 24);
  $('cmd').onclick = e => {
    const sk = e.target.closest('[data-sk]'); if (sk) { startAim('u' + sk.dataset.sk); return; }
    const g = e.target.closest('[data-g]'); if (g) { selectGrp(g.dataset.g === 'all' ? 'all' : +g.dataset.g); return; }
    const o = e.target.closest('[data-o]'); if (o) { issue(o.dataset.o); return; }
    const f = e.target.closest('[data-f]'); if (f && phase === 'play') { setForm(player, G.sel, f.dataset.f); return; }
    if (e.target.closest('#depBtn')) toggleDeploy();
  };
  $('builds').onclick = e => { if (e.target.closest('[data-act="demolish"]')) { toggleDemo(); return; } if (e.target.closest('[data-act="upgrade"]')) { toggleUpg(); return; } const b = e.target.closest('[data-b]'); if (b) startPlace(b.dataset.b); };
  $('skQ').onclick = () => startAim('q');
  $('skR').onclick = () => startAim('r');
  $('skT').onclick = () => openReform();
  $('skE').onclick = () => startAim('e');
  $('skU').onclick = () => openArmory();
  $('menuBtn').onclick = () => showMenu();
  $('hudroot').classList.remove('hidden');
  $('tip').textContent = hudTip();
  updateCmdHud();
}
function sqCard(k) {
  const g = player.grp[k];
  if (!g.utype) return '';
  const S = USK[g.utype];
  return `<button type="button" class="sqsel ${G.sel === k ? 'on' : ''}" data-g="${k}" aria-label="選擇第${GNUM[k]}隊（${k+1}）">${icon(g.utype, 40)}<span class="nm"><b style="color:${GCOL[k]}">第${GNUM[k]}隊 ${'★'.repeat(g.rank)}${UNITS[g.utype].n} ×${g.mem.length}</b><span>${ONAME[g.order]}${uj('form', '・' + FORMS[g.form].n)}</span><span class="mor"><i id="mor${k}"></i></span></span></button>
   <button type="button" class="sqsk" data-sk="${k}" ${unl('uskill') ? '' : 'style="display:none"'} aria-label="第${GNUM[k]}隊技能 ${S.n}（${k ? 'G' : 'F'}）：${S.d}" title="${S.n}：${S.d}">${glyph(g.utype, 26, GCOL[k])}<span>${S.n}</span><span class="cd" id="skc${k}" style="display:none"></span><span class="key">${k ? 'G' : 'F'}</span></button>`;
}
function updateCmdHud() {
  if (!player || !G) return;
  for (const k of [0, 1]) { const el = $('sq' + k); if (el) el.innerHTML = sqCard(k); }
  const ab = document.querySelector('.allb'); if (ab) ab.classList.toggle('on', G.sel === 'all');
  const ks = grpKeys(G.sel);
  for (const b of document.querySelectorAll('[data-o]')) b.classList.toggle('on', ks.every(k => player.grp[k].order === b.dataset.o));
  for (const b of document.querySelectorAll('[data-f]')) b.classList.toggle('on', ks.every(k => player.grp[k].form === b.dataset.f));
  const dep = $('depBtn'); if (dep) dep.classList.toggle('on', !!G.deploy);
  updateAimHud();
}
function updateHud() {
  const c = player;
  const alive = t => ents.filter(e => e.kind === 'tow' && !e.dead && e.team === t).length;
  $('tb').innerHTML = glyph('t1', 20, C.blue) + alive(0); $('tr').innerHTML = alive(1) + glyph('t1', 20, C.red);
  $('clock').textContent = fmt(G.time);
  const ob = $('objbar'); if (ob) {
    const parts = [];
    if (unl('obj')) for (const [key, nm] of [['titan', '遠古泰坦'], ['dragon', '深淵巨龍']]) { const o = G.obj[key]; parts.push(`<span class="ob">${glyph(key === 'titan' ? 't3' : 'core', 16, C.neutral)}${nm} ${o.ent ? `<b>出現中 ${Math.round(o.ent.hp/o.ent.maxHp*100)}%</b>` : fmt(Math.max(0, o.t - G.time))}</span>`); }
    for (const t of [0, 1]) if (G.buff[t].titan > 0) parts.push(`<span class="ob ${t ? 'r' : 'b'}">${t ? '敵方' : '我方'}泰坦之力 ${Math.ceil(G.buff[t].titan)}s</span>`);
    const dr = ents.find(e => e.kind === 'drg' && !e.dead); if (dr) parts.push(`<span class="ob ${dr.team ? 'r' : 'b'}">${dr.team ? '敵方' : '我方'}巨龍進軍${LNAME[dr.lane]}</span>`);
    if (G.behind === 0) parts.push('<span class="ob g">逆風加成：軍資+50%・復活加快・塔傷+25%</span>'); else if (G.behind === 1) parts.push('<span class="ob r">敵方逆風加成中</span>');
    for (const t of [0, 1]) if (G.coreShield[t] > 0) parts.push(`<span class="ob ${t ? 'r' : 'g'}">${t ? '敵方' : '我方'}背水一戰 ${Math.ceil(G.coreShield[t])}s</span>`);
    const caps = [0, 1].map(t => G.sps.filter(s => s.owner === t).length); parts.push(`<span class="ob">據點 <b style="color:${C.blue}">${caps[0]}</b> : <b style="color:${C.red}">${caps[1]}</b></span>`);
    ob.innerHTML = parts.join('');
  }
  $('res').innerHTML = `${glyph('gold', 22, C.gold)}${Math.floor(c.gold)}${anyB() ? `<small>建築 ${c.builds}/4</small>` : ''}`;
  for (const b of document.querySelectorAll('.bb[data-b]')) { b.classList.toggle('no', c.gold < BUILDS[b.dataset.b].cost); b.classList.toggle('sel', G.placing === b.dataset.b); }
  const setCd = (id, v) => { const el = $(id); if (el) { el.textContent = v > 0 ? Math.ceil(v) : ''; el.style.display = v > 0 ? 'flex' : 'none'; } };
  setCd('cdQ', c.qT); setCd('cdR', c.rT); hudLevel(c, setCd); setCd('cdT', Math.min(c.grp[0].reformT, c.grp[1].reformT));
  if (c.respawn > 0) { const el = $('cdQ'); el.style.display = 'flex'; el.textContent = Math.ceil(c.respawn); }
  for (const k of [0, 1]) {
    const card = $('sq' + k); if (!card) continue;
    const b = card.querySelector('b'), g = c.grp[k]; if (b && g.utype) b.textContent = `第${GNUM[k]}隊 ${'★'.repeat(g.rank)}${UNITS[g.utype].n} ×${g.mem.length}`;
    const sp = card.querySelector('.nm span'); if (sp) sp.textContent = `${g.routT > 0 ? '潰散中' : ONAME[g.order]}・${uj('form', FORMS[g.form].n + '・')}士氣 ${Math.round(g.mor)}`;
    const mb = $('mor' + k); if (mb) { mb.style.width = Math.round(g.mor) + '%'; mb.style.background = g.mor < 25 ? C.red : g.mor < 50 ? C.gold : GCOL[k]; }
    setCd('skc' + k, g.skT);
  }
  const tmHtml = cmds().filter(o => o.team === 0).map(o => `<div class="tm ${o.respawn > 0 ? 'dead' : ''}">${icon(o.key, 30)}${glyph(o.grp[0].utype || 'unknown', 18, C.g1)}${glyph(o.grp[1].utype || 'unknown', 18, C.g2)}<span>${CMDS[o.key].n}${o === player ? '（你）' : ''}</span>${o === player || !unl('team') ? `<span class="lt ${o === player ? 'me' : ''}">${LNAME[o.lane]}</span>` : `<button type="button" class="lt" data-tl="${o.id}" title="改派到下一路">${LNAME[o.lane]}</button><button type="button" class="sup ${o.supportUntil > G.time ? 'on' : ''}" data-ts="${o.id}" title="叫這位隊友到你身邊支援 30 秒">${o.supportUntil > G.time ? '支援中 ' + Math.ceil(o.supportUntil - G.time) : '支援'}</button>`}</div>`).join('');
  if ($('team').dataset.h !== tmHtml) { $('team').innerHTML = tmHtml; $('team').dataset.h = tmHtml; }
  $('intel').innerHTML = `<h3>敵方情報 ${glyph('spyglass', 18, C.gold)}</h3>` + cmds().filter(o => o.team === 1).map(o => {
    const rows = [0, 1].map(k => { const I = intel[0][ik(o, k)] || {st:0}; const g = I.st === 2 ? glyph(I.type, 18, C.red) : glyph('unknown', 18, C.muted); const s = I.st === 2 ? `<span class="ok">${UNITS[I.type].n}</span>` : I.st === 1 ? `<span class="st">推測${I.hint}</span>` : '<span class="st">未知</span>'; return `<div style="display:flex;align-items:center;gap:4px">${g}<span style="color:${C.muted}">${GNUM[k]}</span>${s}</div>`; }).join('');
    return `<div class="ir">${icon(o.key, 32, 1)}<div style="display:flex;flex-direction:column;line-height:1.3;gap:1px"><span>${CMDS[o.key].n}${o.respawn > 0 ? '（陣亡）' : ''}</span>${rows}</div></div>`;
  }).join('');
}
function toggleDeploy() {
  if (phase !== 'play' || lockedMsg('deploy')) return;
  G.deploy = !G.deploy;
  $('deplab').classList.toggle('hidden', !G.deploy); $('vign').classList.toggle('hidden', !G.deploy);
  if (G.deploy) tone([220, 330], 'triangle', 0.35, 0.06);
  updateCmdHud();
}

// ================= input =================
const keys = {};
window.addEventListener('keydown', e => {
  ac();
  const k = e.key.toLowerCase();
  if (k === 'escape') { if (G && G.aiming) cancelAim(); else if (G && G.oaim) cancelOAim(); else if (G && G.demo) cancelDemo(); else if (G && G.upg) cancelUpg(); else if (G && G.mercOpen) toggleMercs(); else if (G && G.armOpen && phase === 'pause') openArmory(); else if (G && G.placing) cancelPlace(); else if (phase === 'play') showMenu(); else if (phase === 'pause' && $('modal').classList.contains('show')) { closeModal(); phase = 'play'; } return; }
  if (G && phase === 'pause' && ((k === 'j' && G.mercOpen) || (k === 'u' && G.armOpen))) { if (G.mercOpen) toggleMercs(); else openArmory(); return; }
  if (phase !== 'play' || $('modal').classList.contains('show')) return;
  if (e.target && (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT')) return;
  keys[k] = true;
  if (k === 'q') startAim('q');
  if (k === 'r') startAim('r');
  if (k === 'f') startAim('u0');
  if (k === 'g') startAim('u1');
  if (k === 't') openReform();
  if (k === 'k') toggleDemo();
  if (k === 'h') showHelp();
  if (k === 'y') { G.freeCam = null; $('camlab').classList.add('hidden'); }
  if (k === '1') selectGrp(0); if (k === '2') selectGrp(1); if (k === '3') selectGrp('all');
  if (k === 'e') startAim('e');
  if (k === 'u') openArmory();
  if (k === 'j') toggleMercs();
  if (k === '9') pickTalent(0);
  if (k === '0') pickTalent(1);
  if (k === 'l') toggleUpg();
  if (k === 'tab') { e.preventDefault(); selectGrp(G.sel === 'all' ? 0 : G.sel === 0 ? 1 : 'all'); }
  if (k === ' ') { e.preventDefault(); toggleDeploy(); }
  for (const o of ORDERS) if (o[2] === k) issue(o[0]);
  for (const f of FKEYS) if (FORMS[f].k === k) setForm(player, G.sel, f);
  if (['arrowup','arrowdown','arrowleft','arrowright'].includes(k)) e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
window.addEventListener('pointerdown', () => ac(), {capture:true});
let joyV = null, joyId = null;
function inputVec() {
  let x = 0, z = 0;
  if (keys.a || keys.arrowleft) x--; if (keys.d || keys.arrowright) x++; if (keys.w || keys.arrowup) z--; if (keys.s || keys.arrowdown) z++;
  if (joyV) { x = joyV.x; z = joyV.z; }
  const L = Math.hypot(x, z); if (L < 0.15) return null;
  return {x:x/Math.max(1, L), z:z/Math.max(1, L)};
}
const joy = $('joy');
joy.addEventListener('pointerdown', e => { joyId = e.pointerId; joy.setPointerCapture(e.pointerId); joyMove(e); });
joy.addEventListener('pointermove', e => { if (e.pointerId === joyId) joyMove(e); });
const joyEnd = e => { if (e.pointerId === joyId) { joyId = null; joyV = null; joy.firstElementChild.style.transform = ''; } };
joy.addEventListener('pointerup', joyEnd); joy.addEventListener('pointercancel', joyEnd);
function joyMove(e) {
  const r = joy.getBoundingClientRect(), cx = r.left + r.width/2, cy = r.top + r.height/2;
  let dx = (e.clientX - cx)/(r.width/2), dy = (e.clientY - cy)/(r.height/2); const L = Math.hypot(dx, dy); if (L > 1) { dx /= L; dy /= L; }
  joyV = {x:dx, z:dy}; joy.firstElementChild.style.transform = `translate(${dx*30}px,${dy*30}px)`;
}
const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), mv2 = new THREE.Vector2(), hit = new THREE.Vector3();
function groundAt(cx, cy) { mv2.set(cx/W*2 - 1, -(cy/H)*2 + 1); ray.setFromCamera(mv2, camera); return ray.ray.intersectPlane(plane, hit) ? {x:hit.x, z:hit.z} : null; }
function ownSoldierAt(p) { let b = null, bd = 2.6*2.6; for (const e of ents) if (e.kind === 'sol' && !e.dead && e.owner === player && !isComp(e)) { const dd = (e.x-p.x)**2 + (e.z-p.z)**2; if (dd < bd) { bd = dd; b = e; } } return b; }
function enemyAt(p) { let b = null, bd = 3*3; for (const e of ents) if ((e.team === 1 || e.kind === 'neu' || (e.kind === 'drg' && e.team === 1)) && (e.kind === 'neu' || e.kind === 'drg' || e.kind === 'sol' || e.kind === 'cmd' || e.kind === 'min' || e.kind === 'bld' || e.kind === 'tow' || e.kind === 'core') && attackable(e, 0)) { const dd = (e.x-p.x)**2 + (e.z-p.z)**2 - e.r*e.r; if (dd < bd) { bd = dd; b = e; } } return b; }
function setFreeCam(p) { G.freeCam = {x:clamp(p.x, -95, 95), z:clamp(p.z, -95, 95)}; $('camlab').classList.remove('hidden'); }
canvas.addEventListener('pointermove', e => {
  if (phase === 'lobby') { if (lobbyDrag) { holder.rotation.y += (e.clientX - lobbyDrag.x)*0.01; lobbyDrag.x = e.clientX; } return; }
  if (!G) return;
  if (G.pan) { const s = 0.12*camZ; setFreeCam({x:(G.freeCam || camT).x - (e.clientX - G.pan.x)*s, z:(G.freeCam || camT).z - (e.clientY - G.pan.y)*s}); G.pan = {x:e.clientX, y:e.clientY}; return; }
  const p = groundAt(e.clientX, e.clientY);
  if (e.pointerType !== 'touch') { G.aim = p; G.mouseT = G.time; }
  if (G.drag && p) G.drag.cur = Math.hypot(p.x - G.drag.p.x, p.z - G.drag.p.z) > 2 ? p : null;
});
canvas.addEventListener('pointerdown', e => {
  if (phase === 'lobby') { lobbyDrag = {x:e.clientX}; canvas.setPointerCapture(e.pointerId); return; }
  if (!G || phase !== 'play') return;
  if (e.button === 1) { e.preventDefault(); G.pan = {x:e.clientX, y:e.clientY}; canvas.setPointerCapture(e.pointerId); return; }
  const p = groundAt(e.clientX, e.clientY); if (!p) return;
  if (e.pointerType !== 'touch') { G.aim = p; G.mouseT = G.time; }
  if (G.aiming) {
    if (e.button === 0 && e.pointerType !== 'touch') { cancelAim(); return; }
    if (e.button !== 2 && e.pointerType !== 'touch') return;
    G.lastTap = p; G.tapT = G.time; fireAim(); return;
  }
  if (G.upg) {
    if (e.button === 0 && e.pointerType !== 'touch') { cancelUpg(); return; }
    if (e.button === 2 || e.pointerType === 'touch') { const b = ownBldAt(p); if (b) upgradeBld(player, b); else toast('這裡沒有你的建築', 'r'); }
    return;
  }
  if (G.demo) {
    if (e.button === 0 && e.pointerType !== 'touch') { cancelDemo(); return; }
    if (e.button === 2 || e.pointerType === 'touch') { const b = ownBldAt(p); if (b) { demolish(b); cancelDemo(); } else toast('這裡沒有你的建築', 'r'); }
    return;
  }
  if (G.oaim) {
    if (e.button === 0 && e.pointerType !== 'touch') { cancelOAim(); return; }
    if (e.pointerType === 'touch') { G.lastTap = p; G.tapT = G.time; const t = G.oaim.type; cancelOAim(); orderAt(t, p); return; }
    if (e.button === 2) { G.drag = {p, cur:null, shift:false, type:G.oaim.type}; canvas.setPointerCapture(e.pointerId); ensureDragG(); return; }
    return;
  }
  if (G.placing) {
    if (e.button === 2) { cancelPlace(); return; }
    const at = e.pointerType === 'touch' ? {x:player.x + Math.sin(player.facing)*6, z:player.z + Math.cos(player.facing)*6} : p;
    if (place(player, G.placing, at.x, at.z)) cancelPlace();
    return;
  }
  if (e.button === 0) { const s = ownSoldierAt(p); if (s) { selectGrp(s.grp); toast(`選定：第${GNUM[s.grp]}隊 ${UNITS[s.utype].n}`, 'b'); return; } }
  if (e.button === 2 || (G.deploy && e.button === 0) || (e.pointerType === 'touch' && G.deploy)) {
    G.drag = {p, cur:null, shift:e.shiftKey}; canvas.setPointerCapture(e.pointerId); ensureDragG();
  }
});
function ensureDragG() {
    if (!G.dragG) { G.dragG = new THREE.Group(); const a = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.4, 3), new THREE.MeshBasicMaterial({color:C.gold, transparent:true, opacity:0.9})); a.rotation.x = Math.PI/2; a.position.z = 3.2; G.dragG.add(a); const l = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.05, 3), a.material); l.position.z = 1.5; G.dragG.add(l); world.add(G.dragG); }
}
canvas.addEventListener('pointerup', e => {
  if (phase === 'lobby') { lobbyDrag = null; return; }
  if (!G) return;
  if (G.pan) { G.pan = null; return; }
  if (!G.drag) return;
  const d = G.drag; G.drag = null;
  G.lastTap = d.p; G.tapT = G.time;
  if (d.type) { cancelOAim(); if (d.type === 'focus') { orderAt('focus', d.p); return; } orderAt(d.type, d.p, d.cur ? Math.atan2(d.cur.x - d.p.x, d.cur.z - d.p.z) : undefined); return; }
  if (!d.cur) { const en = enemyAt(d.p); if (en) { order(player, G.sel, 'focus', d.p, undefined, false, en); return; } }
  const face = d.cur ? Math.atan2(d.cur.x - d.p.x, d.cur.z - d.p.z) : undefined;
  order(player, G.sel, d.shift ? 'charge' : 'move', {x:d.p.x, z:d.p.z}, face);
});
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('wheel', e => { if (phase === 'lobby') return; camZoom = clamp(camZoom + (e.deltaY > 0 ? 0.08 : -0.08), 0.7, 1.6); e.preventDefault(); }, {passive:false});
mm.addEventListener('contextmenu', e => e.preventDefault());
mm.addEventListener('pointerdown', e => {
  if (!G || phase !== 'play') return;
  const r = mm.getBoundingClientRect(), p = {x:(e.clientX - r.left)/r.width*200 - 100, z:(e.clientY - r.top)/r.height*200 - 100};
  if (G.oaim && (e.button === 2 || e.pointerType === 'touch')) { const t = G.oaim.type; cancelOAim(); if (t !== 'focus') orderAt(t, p); return; }
  if (G.oaim && e.button === 0) { cancelOAim(); }
  if (e.button === 2 || (e.pointerType === 'touch' && G.deploy)) { order(player, G.sel, 'move', p); return; }
  setFreeCam(p);
});
function startPlace(type) {
  if (lockedMsg('b:' + type)) return;
  if (phase !== 'play') return;
  cancelAim(); cancelOAim(); cancelDemo(); cancelUpg();
  if (G.placing === type) { cancelPlace(); return; }
  cancelPlace();
  const err = canPlace(player, type, player.x + 0.01, player.z + 0.01);
  if (err && (err.startsWith('軍資') || err.startsWith('建築已') || err.startsWith('每隊'))) { toast(err, 'r'); return; }
  if (!FINE()) { const at = {x:player.x + Math.sin(player.facing)*6, z:player.z + Math.cos(player.facing)*6}; place(player, type, at.x, at.z); return; }
  G.placing = type;
  const r = Math.max(2.5, Math.min(30, BUILDS[type].r));
  G.ghost = new THREE.Group(); G.ghost.add(ring(r - 0.4, r, '#7CD08A', 0.9)); G.ghost.add(disc(r, '#7CD08A', 0.1));
  const gm = mkBuilding(type, 0); setOpacity(gm, 0.45); G.ghost.add(gm);
  world.add(G.ghost);
  toast(`${BUILDS[type].n}：${BUILDS[type].d}。點擊地面放置，右鍵或 Esc 取消`, 'b');
}
function cancelPlace() { if (G && G.ghost) world.remove(G.ghost); if (G) { G.ghost = null; G.placing = null; } }

// ================= lobby UI =================
const LT = [['play','出征','core'], ['cmd','指揮官','valen'], ['unit','兵種','troops'], ['bld','建築','build'], ['shop','軍需商店','rep'], ['set','設定','voice']];
let ltab = 'play', lsel = {cmd:'sylvie', unit:'pike', bld:'trench'};
try { const s = localStorage.getItem('fhwz-cmd'); if (s && CMDS[s]) lsel.cmd = s; } catch (e) {}
let subT = null;
function subtitle(text) { const el = $('subtitle'); el.textContent = text ? `「${text}」` : ''; clearTimeout(subT); if (text) subT = setTimeout(() => el.textContent = '', 3200); }
function lobbySay(key, kind) { const line = VO[key][kind]; subtitle(line); sig(key, BIG.has(kind)); speak(key, line); }
function chipsFor(u) { const ok = v => phase === 'lobby' || unitOk(v), w = weakOf(u).filter(ok), st = STRONG[u].filter(ok); return `<div class="row"><span class="lbl">克制</span>${st.length ? '' : '<span class="chip">—</span>'}${st.map(v => `<span class="chip s">${glyph(v, 14, '#E7BC6A')}${UNITS[v].n}</span>`).join('')}</div><div class="row"><span class="lbl">被克</span>${w.length ? '' : '<span class="chip">—</span>'}${w.map(v => `<span class="chip w">${glyph(v, 14, '#F0978A')}${UNITS[v].n}</span>`).join('')}</div>`; }
function cmdDetail(k) { const d = CMDS[k], fi = facOf(k);
  const fac = fi >= 0 ? `專屬兵種：${FUNITS[fi].map(u => UNITS[u].n).join('、')}${lkTag('faction')}` : `沒有專屬兵種${unl('camps') ? '；僱用傭兵 -30% 費用、時間 +50%' : `；傭兵費用 -30%、服役時間 +50%${lkTag('camps')}`}`;
  return `<div class="dl"><div><b>陣營</b><span>${d.fac}・${fac}</span></div><div><b>被動</b><span>${passTxt(k)}</span></div><div><b>Q</b><span><strong>${d.q.n}</strong>　${d.q.d}</span></div><div><b>R</b><span><strong>${d.r.n}</strong>${lkTag('r')}　${d.r.d}</span></div><div><b>E</b><span><strong>${d.e.n}</strong>${lkTag('e')}　${d.e.d}（6 級解鎖）</span></div></div>${talentHtml(k)}`; }
function showLobby() {
  if (NET.client || NET.ws) netDrop();
  phase = 'lobby'; G = null; player = null;
  try { speechSynthesis.cancel(); } catch (e) {}
  closeModal();
  $('hudroot').classList.add('hidden'); $('lobby').classList.remove('hidden');
  $('lnav').innerHTML = `<div class="logo">烽火王座</div><div class="sub">指揮官 MOBA・試玩版</div>` + LT.map(t => `<button type="button" class="tab ${t[0] === ltab ? 'on' : ''}" data-t="${t[0]}">${glyph(t[2], 22, t[0] === ltab ? C.gold : C.muted)}${t[1]}</button>`).join('') + `<button type="button" id="lexit">${glyph('exit', 22, C.muted)}離開遊戲</button>`;
  $('lnav').onclick = e => { if (e.target.closest('#lexit')) { confirmExitGame(); return; } const b = e.target.closest('[data-t]'); if (b) { ltab = b.dataset.t; showLobby(); } };
  drawLobbyPanel();
  rankUpModal();
}
function drawLobbyPanel() {
  const P2 = $('lpanel'), cap = $('lcap');
  if (ltab === 'play' || ltab === 'cmd') {
    if (ltab === 'play' && !unlMe('cmd:' + lsel.cmd)) lsel.cmd = CKEYS.find(c => unlMe('cmd:' + c));
    const k = lsel.cmd, d = CMDS[k];
    showModel('cmd', k);
    cap.innerHTML = `<div class="t">${d.t}・${d.fac}</div><div class="n">${d.n}</div><div class="hint">拖曳旋轉模型</div>`;
    const grid = `<div class="pick">${CKEYS.map(c => `<button type="button" class="pk ${c === k ? 'on' : ''} ${unlMe('cmd:' + c) ? '' : 'lockd'}" data-c="${c}">${icon(c, 46)}<span>${CMDS[c].n}</span>${unlMe('cmd:' + c) ? '' : `<small class="lk">軍階 ${rankNeed('cmd:' + c)}</small>`}</button>`).join('')}</div>`;
    if (ltab === 'play') {
      P2.innerHTML = `${rankBar()}<div><div class="kick">出征準備・3 對 3</div><h2>選擇你的指揮官</h2></div>${grid}
       <div class="roster"><div class="side"><span class="h" style="color:var(--blue)">聖輝聯軍（我方）</span><div class="slot">${icon(k, 30, 0)}<span>${d.n}（你）</span></div><div class="slot">${icon('unknown', 30)}<span style="color:var(--muted)">AI 隊友</span></div><div class="slot">${icon('unknown', 30)}<span style="color:var(--muted)">AI 隊友</span></div></div>
       <div class="side"><span class="h" style="color:var(--red)">黑曜大軍（敵方）</span>${('<div class="slot">' + icon('unknown', 30, 1) + '<span style="color:var(--muted)">開戰後揭曉</span></div>').repeat(3)}</div></div>
       <div class="dl"><div><b>規則</b><span>進場後為兩支隊伍各選一種兵種（可相同），推倒三路防禦塔，摧毀敵方主塔獲勝。指揮官不親自攻擊，靠部隊、技能與佈局取勝。</span></div><div><b>戰略</b><span>側擊與背擊、士氣潰散、老兵晉升、搶奪糧倉與烽火台、草叢藏兵${uj('obj', '、討伐泰坦與巨龍')}。</span></div><div><b>翻盤</b><span>落後方獲得逆風加成；擊殺連勝者領懸賞；主塔告急時王城衛隊出陣。</span></div></div>
       <div class="bar"><button type="button" class="go" id="goBtn">${glyph('advance', 22, '#1A1408')}以 ${d.n} 出征</button><button type="button" class="go alt" id="tutBtn">${glyph('spyglass', 20)}新手教學</button><button type="button" class="go alt ${unlMe('online') ? '' : 'lockd'}" id="netBtn">${glyph('banner', 20)}線上對戰${unlMe('online') ? '' : `（軍階 ${rankNeed('online')}）`}</button></div>${tutSeen() ? '' : '<p style="color:var(--gold)">第一次玩？建議先完成新手教學（約 3 分鐘，敵軍會等你）。</p>'}`;
      $('goBtn').onclick = () => { ac(); drum(); lobbySay(k, 'start'); try { localStorage.setItem('fhwz-cmd', k); } catch (e) {} startWhenArt(() => newGame(k)); };
      $('netBtn').onclick = () => { ac(); if (!unlMe('online')) { toast(`線上對戰在軍階 ${rankNeed('online')}「${RANKS[rankNeed('online') - 1].n}」開放：先打幾場單人對戰熟悉操作`, 'r'); return; } openNetLobby(); };
      $('tutBtn').onclick = () => { ac(); drum(); try { localStorage.setItem('fhwz-cmd', k); } catch (e) {} startWhenArt(() => startTutorial(k)); };
    } else {
      const v = voiceFor(k);
      const opts = `<option value="">自動${AUTOV[k] ? '（' + AUTOV[k].name + '）' : ''}</option>` + zhVoices.map(x => `<option value="${x.voiceURI.replace(/"/g, '&quot;')}" ${SET.vmap[k] === x.voiceURI ? 'selected' : ''}>${x.name}（${x.lang}）</option>`).join('');
      P2.innerHTML = `<div><div class="kick">指揮官檔案・6 位</div><h2>${d.t} ${d.n}</h2></div>${grid}${cmdDetail(k)}
       <div class="dl"><div><b>聲線</b><span>${{valen:'低沉威嚴的鐵壁統帥', sylvie:'明快銳利的女王', orion:'緩慢深沉的老賢者', gru:'粗獷咆哮的獸王', brand:'急躁豪邁的工匠', raven:'冷冽低語的刺客'}[k]}，搭配專屬聲效：${{valen:'戰號與盾擊', sylvie:'弓弦與鷹嘯', orion:'星辰鐘鳴', gru:'低吼與狼嚎', brand:'爆炸與齒輪', raven:'鴉鳴與風聲'}[k]}</span></div></div>
       ${zhVoices.length ? `<label class="vsel">語音<select id="vsel">${opts}</select></label>` : '<p>這台裝置沒有中文語音，台詞會以字幕與專屬聲效呈現。</p>'}
       <div class="bar"><button type="button" class="go alt" id="vo1">${glyph('voice', 18)}選角</button><button type="button" class="go alt" id="vo2">${glyph('voice', 18)}衝鋒</button><button type="button" class="go alt" id="vo3">${glyph('voice', 18)}終極技</button><button type="button" class="go alt" id="vo4">${glyph('voice', 18)}擊殺</button></div>`;
      $('vo1').onclick = () => lobbySay(k, 'select'); $('vo2').onclick = () => lobbySay(k, 'charge'); $('vo3').onclick = () => lobbySay(k, 'r'); $('vo4').onclick = () => lobbySay(k, 'kill');
      const vs = $('vsel'); if (vs) vs.onchange = () => { SET.vmap[k] = vs.value; saveSet(); lobbySay(k, 'select'); };
    }
    P2.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { if (ltab === 'play' && !unlMe('cmd:' + b.dataset.c)) { toast(`${CMDS[b.dataset.c].n}在軍階 ${rankNeed('cmd:' + b.dataset.c)}「${RANKS[rankNeed('cmd:' + b.dataset.c) - 1].n}」解鎖；可以先到「指揮官」頁看介紹`, 'r'); return; } lsel.cmd = b.dataset.c; drawLobbyPanel(); lobbySay(lsel.cmd, 'select'); });
  } else if (ltab === 'shop') { drawShop(P2, cap);
  } else if (ltab === 'unit') {
    const u = lsel.unit, U = UNITS[u], S = USK[u];
    showModel('unit', u);
    cap.innerHTML = `<div class="t">${U.cls}・每隊 ${U.sq} 人</div><div class="n">${U.n}</div><div class="hint">拖曳旋轉模型</div>`;
    const pk = L => `<div class="pick">${L.map(v => `<button type="button" class="pk ${v === u ? 'on' : ''} ${unlMe('unit:' + v) ? '' : 'lockd'}" data-u="${v}">${icon(v, 44)}<span>${UNITS[v].n}</span>${unlMe('unit:' + v) ? '' : `<small class="lk">軍階 ${rankNeed('unit:' + v)}</small>`}</button>`).join('')}</div>`;
    P2.innerHTML = `<div><div class="kick">兵種圖鑑・共用 9 種＋兩國專屬各 2 種＋傭兵 3 種</div>${unlMe('unit:' + u) ? '' : `<div class="lockn">軍階 ${rankNeed('unit:' + u)}「${RANKS[rankNeed('unit:' + u) - 1].n}」解鎖</div>`}<h2>${U.n}${U.fac === 0 ? '<small style="color:var(--blue)">　聖輝王國專屬</small>' : U.fac === 1 ? '<small style="color:var(--red)">　黑曜帝國專屬</small>' : U.merc ? '<small style="color:var(--gold)">　傭兵</small>' : ''}</h2></div>
     ${pk(UKEYS)}<div class="kick">聖輝王國專屬（瓦倫、希爾薇）</div>${pk(FUNITS[0])}<div class="kick">黑曜帝國專屬（歐瑞恩、格魯、布蘭德）</div>${pk(FUNITS[1])}<div class="kick">傭兵（野區傭兵營地僱用）</div>${pk(MERCS)}
     <div class="dl"><div><b>特性</b><span>${uTrait(u)}</span></div>${S ? `<div><b>技能</b><span><strong>${S.n}</strong>${lkTag('uskill')}　${S.d}（冷卻 ${S.cd} 秒・${S.t === 'line' ? '直線' : S.t === 'dir' ? '扇形朝向' : '圓形範圍'}）</span></div>` : `<div><b>僱用</b><span>${U.cost} 軍資・6 名・跟隨指定小隊作戰 120 秒，不佔編制</span></div>`}<div><b>預設陣形</b><span>${FORMS[U.form].n}：${FORMS[U.form].d}</span></div><div><b>數值</b><span>生命 ${U.hp}・攻擊 ${U.atk}・射程 ${U.rng}・移速 ${U.spd}</span></div></div>${chipsFor(u)}
     <p>克制方造成 1.5 倍傷害，被克時只造成 0.75 倍。兩支隊伍可選不同兵種，也可以相同。</p>`;
    P2.querySelectorAll('[data-u]').forEach(b => b.onclick = () => { lsel.unit = b.dataset.u; drawLobbyPanel(); });
  } else if (ltab === 'bld') {
    const b = lsel.bld, Bd = BUILDS[b];
    showModel('bld', b);
    cap.innerHTML = `<div class="t">${Bd.s}</div><div class="n">${Bd.n}</div><div class="hint">拖曳旋轉模型</div>`;
    P2.innerHTML = `<div><div class="kick">建築圖鑑・9 種</div><h2>${Bd.n}</h2></div>
     ${unl('b:' + b) ? '' : `<div class="lockn">軍階 ${rankNeed('b:' + b)}「${RANKS[rankNeed('b:' + b) - 1].n}」解鎖</div>`}<div class="pick">${BKEYS.map(v => `<button type="button" class="pk ${v === b ? 'on' : ''} ${unl('b:' + v) ? '' : 'lockd'}" data-b="${v}">${icon(v, 44)}<span>${BUILDS[v].n}</span>${unl('b:' + v) ? '' : `<small class="lk">軍階 ${rankNeed('b:' + v)}</small>`}</button>`).join('')}</div>
     <div class="dl"><div><b>造價</b><span>${glyph('gold', 16, C.gold)} ${Bd.cost} 軍資・建造 ${Bd.t} 秒・生命 ${Bd.hp}</span></div><div><b>功能</b><span>${Bd.d}</span></div><div><b>範圍</b><span>${Bd.r ? Bd.r + '（戰場上以地面圓圈標示）' : '無'}</span></div><div><b>搭配</b><span>${UKEYS.filter(u => BPREF[u].includes(b)).map(u => UNITS[u].n).join('、') || '—'}</span></div>${[1, 2, 3, 4, 5].map(l => `<div><b>${l === 1 ? '1 級' : `${l} 級`}</b><span>${l > 1 ? `${glyph('gold', 14, C.gold)} ${upgCostL(b, l - 1)}・` : ''}${bldEff(b, l)}</span></div>`).join('')}</div>
     <p>完工的建築可以按 L 升級${lkTag('upg')}，最高 5 級，每級生命 +25%。戰場上每座建築頭上都會顯示名稱與功能，建造中會顯示進度。自己的建築可以拆除（建造列的「拆除」或 K 鍵）：完工的返還 50% 軍資，建造中的全額退還。</p>`;
    P2.querySelectorAll('[data-b]').forEach(x => x.onclick = () => { lsel.bld = x.dataset.b; drawLobbyPanel(); });
  } else {
    showModel('core', null);
    cap.innerHTML = `<div class="t">聖輝王國</div><div class="n">主塔</div>`;
    const tg = (k, t, s) => `<button type="button" class="tg" data-s="${k}" aria-pressed="${!!SET[k]}"><span><strong>${t}</strong><small>${s}</small></span><span class="sw"></span></button>`;
    P2.innerHTML = `<div><div class="kick">設定</div><h2>遊戲設定</h2></div>${setToggles(tg)}
      <button type="button" class="tg" id="vetTg" aria-pressed="${!!PROF.vet}"><span><strong>老手模式：直接開放全部功能</strong><small>跳過軍階逐步解鎖，所有指令、兵種、建築與系統一次開放，AI 對手也用最高強度。軍階經驗照常累積，可隨時關閉</small></span><span class="sw"></span></button>
      <p>AI 隊友與對手的強度會跟著你的指揮官軍階調整。語音使用你裝置上的中文語音；若沒有中文語音，台詞仍會以字幕與專屬聲效呈現。</p>`;
    bindToggles(P2, () => drawLobbyPanel());
    $('vetTg').onclick = () => { PROFR().vet = !PROF.vet; saveProf(); toast(PROF.vet ? '已開放全部功能' : `回到軍階 ${myRank()}「${RANKS[myRank() - 1].n}」的功能`, 'b'); drawLobbyPanel(); };
  }
}
function setToggles(tg) {
  return tg('bloom', '光暈特效', '水晶、火焰與法術的發光效果（關閉可提升效能）')
    + tg('quick', '快速施放', '按下技能鍵立刻施放在游標處，不顯示瞄準（需滑鼠）')
    + tg('voice', '指揮官語音', '下令與施放技能時朗讀台詞，每位指揮官聲線不同')
    + tg('sfx', '號角與聲效', '下令號角、角色專屬聲效' + (anyB() ? '、建築完成提示' : ''))
    + tg('music', '背景音樂', '依戰況切換：平時、交戰、背水一戰')
    + tg('amb', '戰場環境音', '風聲、遠方兵刃交擊與吶喊')
    + tg('shadow', '即時陰影', '關閉可提升效能');
}
function bindToggles(root, redraw) { root.querySelectorAll('[data-s]').forEach(x => x.onclick = () => { const k = x.dataset.s; SET[k] = !SET[k]; saveSet(); applySet(); redraw(); if (k === 'voice' && SET.voice && player) say(player, 'select', true); if (k === 'sfx' && SET.sfx) horn(); }); }
function applySet() { renderer.shadowMap.enabled = SET.shadow; sun.castShadow = SET.shadow; MC.forEach(m => m.needsUpdate = true); scene.traverse(o => { if (o.material) o.material.needsUpdate = true; }); }

// ================= modals =================
const modal = $('modal');
function closeModal() { modal.classList.remove('show'); modal.innerHTML = ''; }
function unitCard(u, sel, note) {
  const U = UNITS[u], S = USK[u];
  return `<button type="button" class="card ${sel ? 'sel' : ''}" data-u="${u}"><div style="display:flex;gap:12px;align-items:center">${icon(u, 56)}<div><h3>${U.n}</h3><div class="sub">${U.cls}・每隊 ${U.sq} 人${uj('form', '・預設' + FORMS[U.form].n)}${note ? '・' + note : ''}</div></div></div>
   <div class="d">${uTrait(u)}</div>${unl('uskill') ? `<div class="d"><b>技能 ${S.n}</b>　${S.d}</div>` : ''}${chipsFor(u)}</button>`;
}
function allyCmd(e, attr) { const b = e.target.closest('[' + attr + ']'); return b ? cmds().find(o => o.id === +b.getAttribute(attr)) : null; }
function teamPanelDown(e) {
  if (!unl('team')) return;
  if (phase !== 'play') return;
  let c = allyCmd(e, 'data-ts');
  if (c) { e.preventDefault(); if (c.supportUntil > G.time) { c.supportUntil = 0; toast(`${CMDS[c.key].n}回到${LNAME[c.lane]}`, 'b'); } else if (c.respawn > 0) toast(`${CMDS[c.key].n}陣亡中，無法支援`, 'r'); else { c.supportUntil = G.time + 30; toast(`${CMDS[c.key].n}趕來支援你（30 秒）`, 'g'); } updateHud(); return; }
  c = allyCmd(e, 'data-tl');
  if (c) { e.preventDefault(); c.lane = LKEYS[(LKEYS.indexOf(c.lane) + 1) % 3]; c.laneSet = true; c.supportUntil = 0; toast(`${CMDS[c.key].n}改派${LNAME[c.lane]}`, 'b'); updateHud(); }
}
function laneRows() {
  return cmds().filter(o => o.team === 0).map(o => `<div class="lrow">${icon(o.key, 34)}<span class="ln">${CMDS[o.key].n}${o === player ? '（你）' : ''}</span>${LKEYS.map(l => `<button type="button" class="lb ${o.lane === l ? 'on' : ''}" data-lc="${o.id}" data-ln="${l}">${LNAME[l]}</button>`).join('')}</div>`).join('');
}
function laneWarn() {
  const empty = LKEYS.filter(l => !cmds().some(o => o.team === 0 && o.lane === l));
  return empty.length ? `<p style="color:#F0B8AE;font-size:13px;margin:4px 0 0">${empty.map(l => LNAME[l]).join('、')}無人主攻，只有小兵與防禦塔把守。</p>` : '';
}
function showMuster() {
  const draw = () => {
    const mp = G.mpick, ms = G.mslot;
    const slot = k => `<button type="button" class="slotb ${ms === k ? 'on' : ''}" data-slot="${k}">${mp[k] ? icon(mp[k], 44) : icon('unknown', 44)}<span><strong style="color:${GCOL[k]}">第 ${GNUM[k]} 隊</strong><small>${mp[k] ? UNITS[mp[k]].n + uj('uskill', '・技能 ' + USK[mp[k]].n) : '點此後選擇兵種'}</small></span></button>`;
    modal.innerHTML = `<div class="sheet"><div class="bar"><div style="display:flex;flex-direction:column;gap:6px;flex:1"><span class="kick">整軍期・敵方看不到你的選擇</span><h1>為兩支隊伍選兵</h1>
     <p>兩隊可以選不同兵種互補，也可以選同一種集中火力。開戰後右鍵派兵${uj('uskill', '、F / G 施放兩隊的兵種技能')}。</p></div>
     <div style="text-align:center"><div class="count" id="mcount">30</div><div class="sub" style="color:var(--muted);font-size:12px">秒後自動決定</div></div></div>
     ${unl('team') ? `<h2>分路・決定每位指揮官主攻哪一路</h2>
     <p class="sub" style="color:var(--muted);margin:-4px 0 8px">開戰後仍可以互相支援：點左上隊友的「支援」叫他來你身邊，或點他的分路標籤改派。</p>
     <div class="lanes">${laneRows()}</div>${laneWarn()}` : ''}
     <div class="slots2">${slot(0)}${slot(1)}</div>
     <h2>正在選擇：第 ${GNUM[ms]} 隊</h2>
     <div class="grid">${unitsFor(player).map(u => unitCard(u, u === mp[ms], mp[1 - ms] === u ? '另一隊也選了' : '')).join('')}</div>
     <div class="bar"><button type="button" class="go" id="goU" ${mp[0] && mp[1] ? '' : 'disabled'}>${mp[0] && mp[1] ? `確認開戰：${UNITS[mp[0]].n} ＋ ${UNITS[mp[1]].n}` : '請為兩隊都選好兵種'}</button>${mp[0] && !mp[1] ? `<button type="button" class="go alt" id="sameU">第 II 隊也用${UNITS[mp[0]].n}</button>` : ''}</div></div>`;
    modal.querySelectorAll('[data-slot]').forEach(b => b.onclick = () => { G.mslot = +b.dataset.slot; draw(); });
    modal.querySelectorAll('[data-lc]').forEach(b => b.onclick = () => { const c = cmds().find(o => o.id === +b.dataset.lc); if (c) { if (NET.client) { if (c.human && c !== player) { toast('真人隊友的分路由他自己決定', ''); return; } netLaneClick(c, b.dataset.ln); } c.lane = b.dataset.ln; c.laneSet = true; } draw(); });
    modal.querySelectorAll('[data-u]').forEach(b => b.onclick = () => { G.mpick[G.mslot] = b.dataset.u; if (G.mslot === 0 && !G.mpick[1]) G.mslot = 1; draw(); });
    $('goU').onclick = () => { if (mp[0] && mp[1]) chooseUnits(mp[0], mp[1]); };
    const su = $('sameU'); if (su) su.onclick = () => { G.mpick[1] = G.mpick[0]; draw(); };
  };
  modal.classList.add('show'); draw();
}
function chooseUnits(u0, u1) {
  if (phase !== 'muster') return;
  closeModal();
  player.grp[0].utype = u0; player.grp[1].utype = u1;
  for (const c of cmds()) { spawnSquad(c, 0); spawnSquad(c, 1); }
  phase = 'play'; G.waveT = 3;
  groupFrame(0);
  say(player, 'start', true); horn();
  toast(`開戰！第 I 隊 ${UNITS[u0].n}、第 II 隊 ${UNITS[u1].n}。${startTip()}`, 'g');
  updateHud(); updateCmdHud();
}
function openReform() {
  if (phase !== 'play' || lockedMsg('reform')) return;
  cancelAim();
  let k = G.sel === 'all' ? 0 : G.sel, sel = null;
  const draw = () => {
    const err = canReform(player, k);
    modal.innerHTML = `<div class="sheet"><div style="display:flex;flex-direction:column;gap:6px"><span class="kick">整編・每隊花費 150 軍資・各自冷卻 90 秒</span><h1>更換隊伍兵種</h1><p>在${reformWhere()}範圍內才能整編。新部隊以一半生命值出發，敵方對該隊的情報會重置。</p></div>
     <div class="slots2">${[0, 1].map(j => `<button type="button" class="slotb ${j === k ? 'on' : ''}" data-slot="${j}">${icon(player.grp[j].utype, 44)}<span><strong style="color:${GCOL[j]}">第 ${GNUM[j]} 隊</strong><small>目前：${UNITS[player.grp[j].utype].n}${player.grp[j].reformT > 0 ? `・冷卻 ${Math.ceil(player.grp[j].reformT)} 秒` : ''}</small></span></button>`).join('')}</div>
     ${err ? `<p style="color:#F0978A">${err}</p>` : ''}
     <div class="grid">${unitsFor(player).filter(u => u !== player.grp[k].utype).map(u => unitCard(u, u === sel)).join('')}</div>
     <div class="bar"><button type="button" class="go" id="goR" ${sel && !err ? '' : 'disabled'}>${sel ? `第 ${GNUM[k]} 隊整編為 ${UNITS[sel].n}` : '請選擇兵種'}</button><button type="button" class="go alt" id="noR">取消</button></div></div>`;
    modal.querySelectorAll('[data-slot]').forEach(b => b.onclick = () => { k = +b.dataset.slot; sel = null; draw(); });
    modal.querySelectorAll('[data-u]').forEach(b => b.onclick = () => { sel = b.dataset.u; draw(); });
    $('goR').onclick = () => { if (sel) { closeModal(); phase = 'play'; reform(player, k, sel); } };
    $('noR').onclick = () => { closeModal(); phase = 'play'; };
  };
  phase = 'pause'; modal.classList.add('show'); draw();
}
function helpHtml() {
  const K = (k, key, t) => (k && !unl(k) ? '' : `<div><kbd>${key}</kbd><span>${t}</span></div>`);
  const od = [['hold', '駐守'], ['charge', '衝鋒'], ['focus', '集火'], ['ambush', '埋伏']].filter(o => unl('o:' + o[0]));
  const okey = {hold:'X', charge:'B', focus:'N', ambush:'M'};
  return `<h2>調兵遣將</h2>
   <div class="keys">
    ${K(null, '右鍵地面', '選定隊伍移動並固守；按住拖曳決定朝向')}
    ${K('o:focus', '右鍵敵人', '選定隊伍集火該目標')}
    ${K('o:charge', 'Shift+右鍵', '選定隊伍衝鋒到該處')}
    ${K(null, '左鍵士兵', '選擇該士兵所屬的隊伍')}
    ${K(null, '1 / 2 / 3', '選第 I 隊 / 第 II 隊 / 全軍（Tab 循環）')}
    ${K(null, 'Z C V', '前進、集結、撤退（立即執行）')}
    ${K(null, od.map(o => okey[o[0]]).join(' '), `${od.map(o => o[1]).join('、')}：按下後地面顯示隊形預覽，右鍵設定位置（按住拖曳決定朝向），左鍵／Esc 取消`)}
    ${K('form', '4–8', '方陣、橫列、楔形、圓陣、散兵')}
    ${K('uskill', 'F / G', '第 I 隊 / 第 II 隊兵種技能：顯示瞄準，右鍵設定位置施放')}
    ${K('deploy', '空白鍵', '戰術部署：時間放慢、鏡頭拉遠，左鍵也能派兵')}
   </div>
   <h2>指揮官與鏡頭</h2>
   <div class="keys">
    ${K(null, 'WASD', '移動指揮官')}${K(null, unl('r') ? 'Q / R' : 'Q', `${unl('r') ? '主動 / 終極技能' : '主動技能'}：顯示範圍與方向，右鍵設定位置施放、左鍵或 Esc 取消`)}
    ${K('e', 'E', '第三技能（大招）：指揮官 6 級解鎖')}${K(null, '等級', `擊殺、推塔${uj('obj', '、中立目標')}累積經驗，最高 10 級；每級技能傷害 +5%（對士兵 +2.5%）、${unl('r') ? 'Q／R' : 'Q'} 冷卻 -3%、生命 +6%`)}
    ${K('camps', 'J', '傭兵：站在我方佔領的傭兵營地旁僱用傭兵（清空營地守衛即可佔領）')}${K('talent', '9 / 0', '天賦：3、5、8 級時二選一')}
    ${K('armory', 'U', '軍械庫：在主堡範圍內（或陣亡時）替兵種升級武器與護甲，各 3 級')}${K('upg', 'L', '升級建築：右鍵點已完工的自己建築，最高升到 5 級')}
    ${K('reform', 'T', `整編：在${reformWhere()}更換某隊兵種`)}${anyB() ? K(null, '建造列', '點選建築後點地面放置') : ''}${K('team', '左上隊友', '點「支援」叫隊友到你身邊 30 秒；點分路標籤改派他去下一路')}${K(null, '陣亡時', '可免費重新整編，復活時兩隊補滿兵力')}${anyB() ? K(null, 'K', '拆除：右鍵點自己的建築（完工返還 50%、建造中全額退還），騰出建築上限') : ''}
    ${K(null, '小地圖', '左鍵移動鏡頭、右鍵派選定隊伍前往')}${K(null, '中鍵拖曳', '平移鏡頭；Y 回到指揮官')}
    ${K(null, 'Esc', `取消瞄準／指令${anyB() ? '／建造' : ''}，或開啟選單`)}${K(null, '手機', `點隊伍卡片選隊；${unl('deploy') ? '戰術部署中點地面派兵' : '點指令後再點地面派兵'}；技能按鈕點後點地面施放`)}
   </div>
   <h2>戰略與翻盤</h2>
   <div class="keys">
    ${K(null, '側擊／背擊', `從側面打 +25%、從背後打 +50%，並打擊對方士氣${uj('form', '（圓陣沒有側背）')}`)}
    ${K(null, '士氣', `傷亡與被夾擊會降低士氣，低於 25 會潰散 5 秒；靠近指揮官${uj('b:banner', '、戰旗')}或休整可回復`)}
    ${K(null, '老兵', '隊伍累積戰功升到 ★1–★3，每級攻擊與生命 +8%；整編會失去星級')}
    ${K(null, '據點', '站在糧倉或烽火台圈內佔領：糧倉每秒軍資 +3，烽火台給視野與遠程加成；據點也是補員與整編點')}
    ${K(null, '草叢', '在草叢中的部隊，敵人看不到，除非對方也進入同一片草叢；河流會讓地面部隊減速')}
    ${K('obj', '中立目標', '4 分鐘後出現。遠古泰坦給全隊泰坦之力；深淵巨龍會替擊殺方沿最脆弱的路線進軍')}
    ${K(null, '逆風加成', `失塔比對方多 2 座時：軍資 +50%、復活與補員加快、防禦塔傷害 +25%${uj('obj', '、中立目標效果延長')}`)}
    ${K(null, '懸賞・背水', '連殺 2 名以上的指揮官身上有懸賞；主塔失去保護時王城衛隊出陣，主塔 60 秒減傷')}
   </div>
   <p>金色圓圈是指揮官的統御範圍（圈內士兵傷害 +10%、士氣回復）。敵兵頭上的「?」代表兵種未確認。指揮官不會普通攻擊。${flv() < RMAX && !(G && G.tut) ? `<br>目前軍階 ${flv()}：更多指令與系統會隨軍階開放。` : ''}</p>`;
}
function showMenu() {
  if (phase !== 'play') return;
  cancelAim(); cancelPlace();
  phase = 'pause';
  const draw = (view) => {
    const tg = (k, t, s) => `<button type="button" class="tg" data-s="${k}" aria-pressed="${!!SET[k]}"><span><strong>${t}</strong><small>${s}</small></span><span class="sw"></span></button>`;
    let body;
    if (view === 'help') body = helpHtml() + `<div class="bar"><button type="button" class="go alt" data-v="main">返回選單</button></div>`;
    else if (view === 'set') body = `<div class="mlist">${setToggles(tg)}</div><div class="bar"><button type="button" class="go alt" data-v="main">返回選單</button></div>`;
    else if (view === 'quit') body = `<p>確定要退出這場戰役並回到大廳嗎？目前戰局不會保存。</p><div class="bar"><button type="button" class="go" id="doQuit" style="background:var(--red);color:#fff">${glyph('exit', 20, '#fff')}退出到大廳</button><button type="button" class="go alt" data-v="main">取消</button></div>`;
    else body = `<div class="mlist">
      <button type="button" class="go" id="mResume">${glyph('advance', 20, '#1A1408')}繼續戰鬥</button>
      <button type="button" class="go alt" data-v="help">${glyph('deploy', 20)}操作說明</button>
      <button type="button" class="go alt" data-v="set">${glyph('voice', 20)}設定</button>
      <button type="button" class="go alt" data-v="quit">${glyph('exit', 20)}退出遊戲</button></div>`;
    modal.innerHTML = `<div class="sheet"><span class="kick">${fmt(G.time)}・${NET.client ? '線上對戰不會暫停' : '遊戲已暫停'}</span><h1>${{help:'操作說明', set:'設定', quit:'退出遊戲'}[view] || '選單'}</h1>${body}</div>`;
    modal.querySelectorAll('[data-v]').forEach(b => b.onclick = () => draw(b.dataset.v));
    const r = $('mResume'); if (r) r.onclick = () => { closeModal(); phase = 'play'; };
    const q = $('doQuit'); if (q) q.onclick = () => showLobby();
    bindToggles(modal, () => { draw('set'); buildHud(); });
  };
  modal.classList.add('show'); draw('main');
}
function showHelp() { showMenu(); const b = modal.querySelector('[data-v="help"]'); if (b) b.click(); }
function confirmExitGame() {
  modal.innerHTML = `<div class="sheet" style="margin-top:10vh"><span class="kick">離開遊戲</span><h1>確定要離開烽火王座？</h1><p>設定與上次選擇的指揮官會保留。</p>
   <div class="bar"><button type="button" class="go" id="exY" style="background:var(--red);color:#fff">${glyph('exit', 20, '#fff')}離開</button><button type="button" class="go alt" id="exN">留下</button></div></div>`;
  modal.classList.add('show');
  $('exN').onclick = () => closeModal();
  $('exY').onclick = () => exitGame();
}
function exitGame() {
  phase = 'exit';
  try { speechSynthesis.cancel(); } catch (e) {}
  try { if (AC) AC.suspend(); } catch (e) {}
  $('lobby').classList.add('hidden'); $('hudroot').classList.add('hidden');
  renderer.setClearColor('#05070A'); renderer.clear();
  modal.innerHTML = `<div class="sheet" style="margin-top:18vh;align-items:center;text-align:center"><span class="kick">烽火王座</span><h1>你已離開戰場</h1><p>烽火未熄，王座仍待其主。</p><div class="bar" style="justify-content:center"><button type="button" class="go" id="reEnter">${glyph('advance', 20, '#1A1408')}重新進入</button></div></div>`;
  modal.classList.add('show');
  $('reEnter').onclick = () => { try { if (AC) AC.resume(); } catch (e) {} showLobby(); };
}
function endGame(win) {
  if (SVR) { if (G.over) return; G.over = true; phase = 'over'; G.win = win; recordEco(); SVR.over = {win:win ? 0 : 1}; return; }
  if (G.over) return; G.over = true; phase = 'over'; cancelPlace(); cancelAim(); G.win = win; recordEco(); musStinger(win);
  if (G.deploy) toggleDeploy();
  setTimeout(() => {
    if (!G) return;
    say(player, win ? 'tower' : 'death', true);
    modal.innerHTML = `<div class="sheet" style="margin-top:8vh"><span class="kick">${fmt(G.time)}・戰役結束</span>
     <h1 style="color:${win ? C.gold : C.red}">${win ? '勝利：敵方主塔已陷落' : '敗北：我方主塔失守'}</h1>
     <div class="keys" style="max-width:820px"><div><kbd>${G.stats.orders}</kbd><span>下達指令</span></div><div><kbd>${G.stats.skills}</kbd><span>施放技能</span></div><div><kbd>${G.stats.kills}</kbd><span>擊殺指揮官</span></div><div><kbd>${G.stats.deaths}</kbd><span>陣亡次數</span></div><div><kbd>${G.stats.towers}</kbd><span>摧毀敵塔</span></div></div>
     <div class="bar"><button type="button" class="go" id="again">回到大廳</button></div></div>`;
    modal.classList.add('show');
    $('again').onclick = () => showLobby();
    showResults(win);
  }, 1200);
}

// ================= v0.7: growth (levels, armory, building upgrades), battle feedback, music, tutorial, results =================

// ---------- commander levels (1–10) ----------
const XPN = l => 200 + 100*(l - 1);                      // xp from level l to l+1 (Lv6 at 2000, Lv10 at 5400)
const skPow = (c, t) => 1 + (t && (t.kind === 'sol' || t.kind === 'min') ? 0.025 : 0.05)*((c.lvl || 1) - 1);   // skill damage (half the growth against troops)
function skCd(c, slot) {
  const b = CMDS[c.key][slot].cd, l = c.lvl || 1;
  return (slot === 'e' ? b*(1 - 0.03*Math.max(0, l - 6)) : b*(1 - 0.03*(l - 1)))*talCd(c, slot);
}
function cmdXp(c, x) {
  if (!c || c.kind !== 'cmd' || !(c.lvl < 10) || !G || G.over || !(x > 0)) return;
  c.xp += x;
  while (c.lvl < 10 && c.xp >= XPN(c.lvl)) { c.xp -= XPN(c.lvl); c.lvl++; levelUp(c); }
  if (c.lvl >= 10) c.xp = 0;
}
function levelUp(c) {
  const base = CMDS[c.key].hp, nm = Math.round(base*(1 + 0.06*(c.lvl - 1)));
  if (c.respawn <= 0) c.hp = Math.min(nm, c.hp + (nm - c.maxHp) + base*0.1);
  c.maxHp = nm;
  if (c.team === 0 || (c.vis && c.vis[0])) { floaters.push({x:c.x, y:5.8, z:c.z, s:`Lv ${c.lvl}`, c:C.gold, t:1.6}); if (c.respawn <= 0) { fxRing(c.x, c.z, 4.5, C.gold, 0.8); sparks(c.x, 1.5, c.z, '#F1D29A', 18, 6, -4); } }
  if (c === player) {
    if (c.lvl === 6 && unl('e')) { toast(`升到 6 級：解鎖第三技能「${CMDS[c.key].e.n}」（E）`, 'g'); say(c, 'r', true); }
    else toast(`指揮官升到 ${c.lvl} 級：技能傷害 +${Math.round((skPow(c) - 1)*100)}%（對士兵減半）、${unl('r') ? 'Q／R' : 'Q'} 冷卻 -${(c.lvl - 1)*3}%、生命 +${(c.lvl - 1)*6}%`, 'b');
    chime();
  }
  talentCheck(c);
}
// xp and per-commander statistics on every kill
function featKill(t, own) {
  kill2(t, own);
  if (t.kind === 'sol' && t.utype !== 'wolf' && t.owner && t.owner.st) { t.owner.st.solL++; if (own && own.st && own.team !== t.team) own.st.solK++; }
  if (t.kind === 'cmd') { t.st.deaths++; if (own && own.kind === 'cmd' && own.team !== t.team) own.st.kills++; }
  if (t.kind === 'tow' || t.kind === 'core') { for (const c of cmds()) if (c.team !== t.team) cmdXp(c, 160); if (own && own.st && own.team !== t.team) own.st.towers++; return; }
  if (t.kind === 'neu') { const tm = t.lastTeam; if (tm === 0 || tm === 1) for (const c of cmds()) if (c.team === tm && (!t.camp || (c.x - t.x)**2 + (c.z - t.z)**2 < 2500)) cmdXp(c, t.camp ? 45 : 160); return; }
  const x = t.kind === 'sol' ? (t.utype === 'wolf' ? 6 : 18*UNITS[t.utype].bk) : t.kind === 'cmd' ? 150 + 20*((t.lvl || 1) - 1) : t.kind === 'min' ? 10 : t.kind === 'drg' ? 120 : t.kind === 'bld' ? 40 : 0;
  if (!x) return;
  for (const c of cmds()) {
    if (c.team === t.team || c.team > 1 || c.respawn > 0) continue;
    if (c === own) cmdXp(c, x);
    else if ((c.x - t.x)**2 + (c.z - t.z)**2 < 900) cmdXp(c, x*0.4);
  }
}
function hurtStat(t, src, dmg) {
  const own = src && (src.kind === 'cmd' ? src : src.owner);
  if (own && own.st && own.team !== t.team && t.team < 3) own.st.dmg += dmg;
  if (!G || !t.vis) return;
  const near = (t.x - camT.x)**2 + (t.z - camT.z)**2 < 55*55;
  if (near && (t.team === 0 || t.vis[0])) {
    G.combatT = G.time; G.combatN = Math.min(30, (G.combatN || 0) + 0.15);
    // steel-on-steel sparks for melee blows
    if (src && (src.kind === 'sol' || src.kind === 'min') && !(src.kind === 'sol' ? UNITS[src.utype].ranged : src.ranged) && Math.random() < 0.6)
      sparks(t.x + (src.x - t.x)*0.35, 1.6, t.z + (src.z - t.z)*0.35, src.utype === 'wolf' ? '#E6B07A' : '#FFE2A8', 4, 5);
  }
}
function hudLevel(c, setCd) {
  const lb = $('lvB'); if (lb && lb.textContent !== String(c.lvl)) lb.textContent = c.lvl;
  const xr = $('xpR'); if (xr) xr.style.strokeDasharray = `${c.lvl >= 10 ? 100 : Math.round(c.xp/XPN(c.lvl)*100)} 100`;
  const be = $('skE');
  if (be) { const lock = c.lvl < 6; be.classList.toggle('lock', lock); be.classList.toggle('ready', !lock && c.eT <= 0 && c.respawn <= 0); }
  if (lb) { const tt = talentTitle(c); lb.title = tt ? '天賦：' + tt : ''; }
  if (c.lvl < 6) { const el = $('cdE'); if (el) el.textContent = '6級'; }
  else setCd('cdE', c.respawn > 0 ? 0 : c.eT);
}

// ---------- third skill (E, unlocked at level 6) ----------
function castE(c, p, tgt) {
  const k = c.key;
  if (k === 'valen') addZone({kind:'bastion', team:c.team, x:p.x, z:p.z, r:10, dur:8, owner:c, color:C.gold});
  else if (k === 'sylvie') { const f = Math.hypot(p.x - c.x, p.z - c.z) > 0.5 ? Math.atan2(p.x - c.x, p.z - c.z) : c.facing; c.facing = f; addZone({kind:'sweep', team:c.team, x:c.x, z:c.z, f, len:40, w:4, r:2.2, dur:0.55, dmg:150, kb:1.5, stun:0, owner:c, color:'#FFE6A0', hit:new Set()}); }
  else if (k === 'orion') addZone({kind:'meteor', team:c.team, x:p.x, z:p.z, r:9, dur:2.4, delay:1.8, owner:c, color:'#C9A0FF', dmg:170, stun:1, big:true});
  else if (k === 'gru') { for (let i = 0; i < 6 + (hasTal(c, 'g_p2') ? 2 : 0); i++) bigWolf(c, spawnSoldier(c, 'wolf', c.x + rnd(-3, 3), c.z + rnd(-3, 3), 1, 15*TV(c, 'g_p2', 1, 1.5))); c.frenzyT = 8; addZone({kind:'flash', team:c.team, x:c.x, z:c.z, r:10, dur:0.8, owner:c, color:'#E6B07A'}); }
  else if (k === 'brand') { for (let i = 0; i < 5; i++) { const a = Math.random()*Math.PI*2, r = Math.sqrt(Math.random())*6; addZone({kind:'boulder', team:c.team, x:p.x + Math.sin(a)*r, z:p.z + Math.cos(a)*r, r:4, dur:1.1 + i*0.45, delay:0.8 + i*0.45, owner:c, color:'#E8A04A'}); } }
  else if (k === 'raven') {
    c.x = clamp(p.x, -98, 98); c.z = clamp(p.z, -98, 98); c.px = c.x; c.pz = c.z;
    squad(c).forEach((s, i) => { const a = i*2.4, r = 2 + (i % 6)*0.8; s.x = clamp(p.x + Math.sin(a)*r, -98, 98); s.z = clamp(p.z + Math.cos(a)*r, -98, 98); s.px = s.x; s.pz = s.z; s.stealth = true; s.shadowT = G.time + 3; });
    for (const o of ents) if (o.team !== c.team && !o.dead && (o.kind === 'sol' || o.kind === 'cmd' || o.kind === 'min') && !(o.kind === 'cmd' && o.respawn > 0) && (o.x - p.x)**2 + (o.z - p.z)**2 < 64) { hurt(o, 60, c, {aoe:true}); o.stunT = Math.max(o.stunT, 0.8); }
    addZone({kind:'flash', team:c.team, x:p.x, z:p.z, r:8, dur:0.8, owner:c, color:'#B892E0'});
    order(c, 'all', 'hold', {x:p.x, z:p.z}, c.facing, true);
  }
  return true;
}
function aiCastE(c) {
  const foes = r => ents.filter(e => !e.dead && e.team !== c.team && e.team < 2 && (e.kind === 'sol' || (e.kind === 'cmd' && e.respawn <= 0)) && (e.x - c.x)**2 + (e.z - c.z)**2 < r*r).length;
  const k = c.key;
  if (k === 'valen' || k === 'gru') { if (foes(12) >= 6) castSkill(c, 'e', {x:c.x, z:c.z}); return true; }
  if (k === 'brand') {
    const tw = ents.find(e => (e.kind === 'tow' || e.kind === 'core') && !e.dead && e.team !== c.team && attackable(e, c.team) && (e.x - c.x)**2 + (e.z - c.z)**2 < 900);
    if (tw) { castSkill(c, 'e', {x:tw.x, z:tw.z}); return true; }
  }
  const sp = CSK[k].e, cl = sp.t === 'line' ? aiCluster(c, c.x, c.z, sp.len, sp.w) : aiCluster(c, c.x, c.z, sp.range, sp.r);
  if (cl && cl.n >= (k === 'raven' ? 4 : 5)) castSkill(c, 'e', cl.p);
  return true;
}

// ---------- armory: weapons and armor per unit type, 3 levels each ----------
const ARM_COST = [200, 350, 500], ARM_STEP = 0.1;
const armLv = (c, u, k) => (c && c.arm && c.arm[u] && c.arm[u][k]) || 0;
const armMul = (c, u, k) => 1 + ARM_STEP*armLv(c, u, k);
function armorUp(c, type, s) { const m = armMul(c, type, 'a')*((type === 'shield' || type === 'templar') && hasTal(c, 'v_p2') ? 1.2 : 1); if (m !== 1) { s.hp *= m; s.maxHp *= m; } return s; }
const atBase = c => c.respawn > 0 || Math.hypot(c.x - CORE[c.team].x, c.z - CORE[c.team].z) < 30 || Math.hypot(c.x - SPAWN[c.team].x, c.z - SPAWN[c.team].z) < 16;
function buyArm(c, u, k) {
  if (!unl('armory')) return `軍械庫在軍階 ${rankNeed('armory')} 解鎖`;
  const lv = armLv(c, u, k);
  if (lv >= 3) return '已達最高等級';
  if (!atBase(c)) return '回到主堡範圍內（或陣亡等待復活時）才能購買';
  const cost = ARM_COST[lv]; if (c.gold < cost) return `軍資不足（需要 ${cost}）`;
  c.gold -= cost; c.spent += cost;
  c.arm[u] = c.arm[u] || {w:0, a:0}; c.arm[u][k] = lv + 1;
  if (k === 'a') { const f = (1 + ARM_STEP*(lv + 1))/(1 + ARM_STEP*lv); for (const e of ents) if (e.kind === 'sol' && !e.dead && e.owner === c && e.utype === u) { e.maxHp *= f; e.hp *= f; } }
  return null;
}
function openArmory() {
  if (!G) return;
  if (phase === 'pause' && G.armOpen) { closeModal(); phase = 'play'; G.armOpen = false; return; }
  if (lockedMsg('armory')) return;
  if (phase !== 'play') return;
  cancelAim(); cancelOAim(); cancelPlace(); cancelDemo(); cancelUpg();
  if (G.tut) G.tut.arm = true;
  const pips = n => `<span class="pips">${[0, 1, 2].map(i => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span>`;
  const draw = msg => {
    const here = atBase(player), cur = [player.grp[0].utype, player.grp[1].utype], UL = unitsFor(player);
    const btn = (u, k) => {
      const lv = armLv(player, u, k), cost = ARM_COST[lv];
      return `<button type="button" class="ab" data-u="${u}" data-k="${k}" ${lv >= 3 || !here || player.gold < cost ? 'disabled' : ''}><b>${k === 'w' ? '武器' : '護甲'}${pips(lv)}</b><small>${lv >= 3 ? '已滿級' : `${cost} 軍資・${k === 'w' ? '傷害' : '生命'} +${Math.round(ARM_STEP*100)}%`}</small></button>`;
    };
    const ordered = UL.slice().sort((a, b) => (cur.includes(b) ? 1 : 0) - (cur.includes(a) ? 1 : 0));
    modal.innerHTML = `<div class="sheet"><div style="display:flex;flex-direction:column;gap:6px"><span class="kick">軍械庫・軍資 ${Math.floor(player.gold)}</span><h1>強化兵種裝備</h1>
      <p>每個兵種的武器（傷害）與護甲（生命）各 3 級，每級 +10%。對你這個兵種的所有士兵永久有效，整編換掉再換回來也保留，所以投資哪個兵種本身就是決策。</p>
      ${here ? '<p style="color:#9FE0A0">你在主堡範圍內，可以購買。</p>' : '<p style="color:#F0978A">你不在主堡範圍內：回到主堡附近，或陣亡等待復活時才能購買。</p>'}${msg ? `<p style="color:#F0978A">${msg}</p>` : ''}</div>
      <div class="arm">${ordered.map(u => `<div class="ar ${cur.includes(u) ? 'cur' : ''}">${icon(u, 44)}<div><div class="nm">${UNITS[u].n}${cur.includes(u) ? '<small>出戰中</small>' : ''}</div><div class="rw">${btn(u, 'w')}${btn(u, 'a')}</div></div></div>`).join('')}</div>
      <div class="bar"><button type="button" class="go alt" id="noA">關閉（U）</button></div></div>`;
    modal.querySelectorAll('[data-k]').forEach(b => b.onclick = () => {
      const u = b.dataset.u, k = b.dataset.k, err = buyArm(player, u, k);
      if (!err) { chime(); toast(`${UNITS[u].n}${k === 'w' ? '武器' : '護甲'}升到 ${armLv(player, u, k)} 級`, 'g'); }
      draw(err); updateHud();
    });
    $('noA').onclick = () => { closeModal(); phase = 'play'; G.armOpen = false; };
  };
  phase = 'pause'; G.armOpen = true; modal.classList.add('show'); draw();
}
function aiArmory(c) {
  if (!unl('armory')) return;
  if (!atBase(c) || c.gold < 500) return;
  const opts = [];
  for (const k of [0, 1]) { const u = c.grp[k].utype; if (!u) continue; for (const s of ['w', 'a']) { const lv = armLv(c, u, s); if (lv < 3) opts.push({u, s, cost:ARM_COST[lv]}); } }
  opts.sort((a, b) => a.cost - b.cost || Math.random() - 0.5);
  if (opts.length && c.gold - opts[0].cost >= 300) buyArm(c, opts[0].u, opts[0].s);
}

// ---------- building upgrades (level 2) ----------
const UPG = {
  trench:{n:'碉堡', f:0.8, hp:1.6, d:'步兵受遠程傷害 -35% → -55%，生命 +60%'},
  arrowtower:{n:'二級箭塔', f:0.75, hp:1.4, d:'每次多射一箭（打第二個目標），生命 +40%'},
  cheval:{n:'鐵刺拒馬', f:0.75, hp:1.4, d:'撞擊傷害 60 → 110、暈眩 1 → 1.6 秒，生命 +40%'},
  barracks:{n:'大兵營', f:0.6, hp:1.4, d:'從這裡補員時每次多 1 人，生命 +40%'},
  obelisk:{n:'星輝方尖碑', f:0.7, hp:1.3, d:'法師射程 +20% → +30%、攻速 +15% → +30%'},
  banner:{n:'王旗', f:0.8, hp:1.3, d:'攻速 +15% → +25%、士氣回復 +2 → +4'},
  watch:{n:'烽火瞭望塔', f:0.8, hp:1.3, d:'視野 30 → 40'},
  trap:{n:'強化陷阱', f:0.7, hp:1, d:'定身 2 → 3 秒、傷害 40 → 100'},
  supply:{n:'野戰醫院', f:0.7, hp:1.3, d:'範圍回血速度 ×1.8'}
};
function cancelUpg() { if (G && G.upg) { G.upg = false; updateAimHud(); } }
function updateUpgHL() {
  if (!G) return;
  if (!G.upgHL) { G.upgHL = new THREE.Mesh(new THREE.RingGeometry(2.6, 3.3, 40), new THREE.MeshBasicMaterial({color:C.gold, transparent:true, opacity:0.9, depthWrite:false, side:THREE.DoubleSide})); G.upgHL.rotation.x = -Math.PI/2; G.upgHL.visible = false; world.add(G.upgHL); }
  const b = G.upg && phase === 'play' && G.aim ? ownBldAt(G.aim) : null;
  G.upgHL.visible = !!b;
  if (b) {
    G.upgHL.position.set(b.x, 0.26, b.z); const k = (b.r + 1)/2.6; G.upgHL.scale.set(k, k, k);
    const lab = $('aimlab'), err = canUpg(player, b);
    const txt = err ? `${bldName(b)}：${err}` : `${bldName(b)} 升到 ${blv(b) + 1} 級（${upgCostL(b.type, blv(b))} 軍資）：${bldEff(b.type, blv(b) + 1)}・右鍵確認`;
    if (lab && lab.textContent !== txt) lab.textContent = txt;
  }
}
function towerSecond(b, t) {
  let best = null, bd = 1e9;
  for (const e of ents) {
    if (e === t || e.dead || e.team === b.team || e.team > 1 || !(e.kind === 'sol' || e.kind === 'min' || (e.kind === 'cmd' && e.respawn <= 0)) || !e.vis[b.team]) continue;
    const d = (e.x - b.x)**2 + (e.z - b.z)**2; if (d < 169 && d < bd) { bd = d; best = e; }
  }
  if (best) doAttack(b, best);
}
// ---------- battle feedback: projectiles, sparks, shockwaves, camera shake ----------
const PMAX = 480;
let pGeo = null, pPts = null, pPos, pCol, pVel, pLife, pGrav, pNext = 0;
function pfxInit() {
  if (pPts) return;
  pGeo = new THREE.BufferGeometry();
  pPos = new Float32Array(PMAX*3); pCol = new Float32Array(PMAX*3); pVel = new Float32Array(PMAX*3); pLife = new Float32Array(PMAX); pGrav = new Float32Array(PMAX);
  for (let i = 0; i < PMAX; i++) pPos[i*3 + 1] = -200;
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3)); pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
  pPts = new THREE.Points(pGeo, new THREE.PointsMaterial({size:0.42, vertexColors:true, transparent:true, opacity:0.95, depthWrite:false, blending:THREE.AdditiveBlending}));
  pPts.frustumCulled = false; scene.add(pPts);
}
const _pc = new THREE.Color();
function sparks(x, y, z, color, n, speed, grav = 14, up = 0.6) {
  pfxInit(); _pc.set(color);
  for (let j = 0; j < n; j++) {
    const i = pNext; pNext = (pNext + 1) % PMAX;
    const a = Math.random()*Math.PI*2, s = speed*(0.4 + Math.random()*0.8), u = Math.random();
    pPos[i*3] = x; pPos[i*3 + 1] = y; pPos[i*3 + 2] = z;
    pVel[i*3] = Math.sin(a)*s*(1 - u*0.5); pVel[i*3 + 1] = s*(up + u*0.8); pVel[i*3 + 2] = Math.cos(a)*s*(1 - u*0.5);
    pLife[i] = 0.35 + Math.random()*0.45; pGrav[i] = grav;
    const k = 0.75 + Math.random()*0.35; pCol[i*3] = _pc.r*k; pCol[i*3 + 1] = _pc.g*k; pCol[i*3 + 2] = _pc.b*k;
  }
}
function pfxStep(dt) {
  if (!pPts) return;
  for (let i = 0; i < PMAX; i++) {
    if (pLife[i] <= 0) continue;
    pLife[i] -= dt;
    if (pLife[i] <= 0) { pPos[i*3 + 1] = -200; continue; }
    pVel[i*3 + 1] -= pGrav[i]*dt;
    pPos[i*3] += pVel[i*3]*dt; pPos[i*3 + 1] = Math.max(0.05, pPos[i*3 + 1] + pVel[i*3 + 1]*dt); pPos[i*3 + 2] += pVel[i*3 + 2]*dt;
    const f = Math.min(1, pLife[i]*3); pCol[i*3] *= 0.97 + 0.03*f; pCol[i*3 + 1] *= 0.96 + 0.04*f; pCol[i*3 + 2] *= 0.95 + 0.05*f;
  }
  pGeo.attributes.position.needsUpdate = true; pGeo.attributes.color.needsUpdate = true;
}
const RING_GEO = new THREE.RingGeometry(0.82, 1, 48);
function fxRing(x, z, r, color, dur = 0.6, op = 0.85) {
  if (!G) return;
  const m = new THREE.Mesh(RING_GEO, new THREE.MeshBasicMaterial({color, transparent:true, opacity:op, depthWrite:false, side:THREE.DoubleSide, blending:THREE.AdditiveBlending}));
  m.rotation.x = -Math.PI/2; m.position.set(x, 0.3, z); m.scale.setScalar(r*0.2); world.add(m);
  (G.rings = G.rings || []).push({m, r, t:0, dur, op});
}
function ringStep(dt) {
  if (!G || !G.rings) return;
  for (const R of G.rings) { R.t += dt; const k = Math.min(1, R.t/R.dur), e = 1 - (1 - k)**3; R.m.scale.setScalar(R.r*(0.2 + 0.8*e)); R.m.material.opacity = R.op*(1 - k); if (k >= 1) { world.remove(R.m); R.m.material.dispose(); R.dead = true; } }
  G.rings = G.rings.filter(R => !R.dead);
}
function shake(a, x, z) { if (!G || (x !== undefined && (x - camT.x)**2 + (z - camT.z)**2 > 70*70)) return; G.shk = Math.min(1.2, Math.max(G.shk || 0, a)); }
function camShake(dt) {
  if (G && G.shk > 0) { const s = G.shk*0.55; camera.position.x += (Math.random() - 0.5)*s; camera.position.y += (Math.random() - 0.5)*s*0.6; camera.position.z += (Math.random() - 0.5)*s; G.shk = Math.max(0, G.shk - dt*2.6); }
  pfxStep(dt); ringStep(dt);
}
function zoneImpact(z) {
  if (!(z.team === 0 || (z.kind !== 'crow' && z.kind !== 'trapz'))) return;
  const col = z.color || (z.team === 0 ? C.blue : C.red), k = z.kind;
  if (k === 'meteor') { fxRing(z.x, z.z, z.r*1.15, '#C9A0FF', 0.8); sparks(z.x, 0.8, z.z, '#E0B0FF', z.big ? 46 : 24, z.big ? 14 : 9); sparks(z.x, 0.5, z.z, '#FFB070', z.big ? 30 : 14, z.big ? 9 : 6); sparks(z.x, 0.3, z.z, '#8A7A6A', 18, 5, 8, 0.3); shake(z.big ? 1.1 : 0.45, z.x, z.z); }
  else if (k === 'boulder') { fxRing(z.x, z.z, z.r*1.1, '#C8B59A', 0.6); sparks(z.x, 0.4, z.z, '#9C8A74', 20, 6, 10, 0.4); sparks(z.x, 0.6, z.z, '#6FE0E8', 8, 7); shake(0.4, z.x, z.z); }
  else if (k === 'barrel') { fxRing(z.x, z.z, z.r*1.2, '#F2A040', 0.6); sparks(z.x, 0.8, z.z, '#FFB24A', 34, 11); sparks(z.x, 0.5, z.z, '#5A4A3A', 16, 5, 6, 0.4); shake(0.55, z.x, z.z); }
  else if (k === 'frost') { fxRing(z.x, z.z, z.r*1.1, '#BFE8F6', 0.7); sparks(z.x, 0.6, z.z, '#CFF2FF', 26, 7, 4); }
  else if (k === 'dive') { fxRing(z.x, z.z, z.r*1.1, col, 0.5); sparks(z.x, 0.5, z.z, '#9C8A74', 16, 6, 10, 0.4); shake(0.3, z.x, z.z); }
  else if (k === 'wall' || k === 'fort' || k === 'bastion' || k === 'sanct') { fxRing(z.x, z.z, z.r, k === 'wall' ? '#C9B48A' : '#F1D29A', 0.9, 0.7); sparks(z.x, 0.3, z.z, '#F1D29A', k === 'bastion' ? 30 : 14, 4, -3, 0.2); if (k === 'bastion') shake(0.3, z.x, z.z); }
  else if (k === 'flash' || k === 'stasis') { fxRing(z.x, z.z, z.r, col, 0.6); sparks(z.x, 0.6, z.z, col, 14, 5, 2); }
  else if (k === 'sweep') { sparks(z.x, 1, z.z, col, 16, 6); }
  else if (k === 'rain' || k === 'rainU' || k === 'fire') fxRing(z.x, z.z, z.r, col, 0.5, 0.5);
}
// projectiles
const PGEO = {arrow:new THREE.BoxGeometry(0.07, 0.07, 1.5), head:new THREE.ConeGeometry(0.12, 0.35, 5), orb:new THREE.SphereGeometry(0.34, 10, 8), rock:new THREE.IcosahedronGeometry(0.55, 0)};
PGEO.head.rotateX(Math.PI/2); PGEO.head.translate(0, 0, 0.9);
const PMAT = {};
const pmat = (col, basic) => PMAT[col + basic] || (PMAT[col + basic] = basic ? new THREE.MeshBasicMaterial({color:col}) : new THREE.MeshLambertMaterial({color:col}));
function shot2(a, t, color, size, y0) {
  if (!(a.vis && a.vis[0]) && !(t.vis && t.vis[0])) return;
  let kind = 'arrow';
  if (a.kind === 'sol') { const U = UNITS[a.utype]; kind = a.utype === 'siege' ? 'rock' : U.magic ? 'orb' : 'arrow'; }
  else if (a.kind === 'tow' || a.kind === 'core') kind = 'bolt';
  else if (a.kind === 'cmd') kind = 'orb';
  let m;
  if (kind === 'arrow') { m = new THREE.Group(); m.add(new THREE.Mesh(PGEO.arrow, pmat('#D8C9A8', false))); m.add(new THREE.Mesh(PGEO.head, pmat(color, true))); }
  else if (kind === 'rock') { m = new THREE.Mesh(PGEO.rock, pmat('#6A6258', false)); }
  else { m = new THREE.Mesh(PGEO.orb, pmat(color, true)); m.scale.setScalar(kind === 'bolt' ? 1.4 : 1); }
  const d = Math.hypot(t.x - a.x, t.z - a.z), fly = a.kind === 'sol' && UNITS[a.utype].fly;
  const dur = kind === 'rock' ? 0.55 + d*0.02 : kind === 'bolt' ? 0.25 : Math.min(0.6, Math.max(0.18, d/38));
  const arc = kind === 'rock' ? 2 + d*0.25 : kind === 'arrow' ? 0.6 + d*0.07 : 0.3;
  world.add(m);
  fx.push({m, kind, color, arc, ax:a.x, az:a.z, ay:y0 + (fly ? 3.5 : 0), bx:t.x, bz:t.z, by:t.kind === 'sol' && UNITS[t.utype].fly ? 3.8 : 1.5, t:0, dur, tr:0});
}
const _v = new THREE.Vector3();
function fxStep(dt) {
  for (const f of fx) {
    f.t += dt;
    const k = Math.min(1, f.t/f.dur), at = q => [f.ax + (f.bx - f.ax)*q, f.ay + (f.by - f.ay)*q + Math.sin(q*Math.PI)*(f.arc === undefined ? 2 : f.arc), f.az + (f.bz - f.az)*q];
    const p = at(k); f.m.position.set(p[0], p[1], p[2]);
    if (f.kind === 'arrow') { const n = at(Math.min(1, k + 0.03)); _v.set(n[0], n[1], n[2]); if (k < 0.99) f.m.lookAt(_v); }
    else if (f.kind === 'rock') { f.m.rotation.x += dt*7; f.m.rotation.z += dt*5; }
    else if (f.kind === 'orb' || f.kind === 'bolt') { f.tr -= dt; if (f.tr <= 0) { f.tr = 0.04; sparks(p[0], p[1], p[2], f.color, 1, 0.6, 0); } }
    if (k >= 1) {
      world.remove(f.m); f.dead = true;
      if (f.kind === undefined) { f.m.material.dispose(); continue; }
      if (f.kind === 'arrow') sparks(f.bx, f.by, f.bz, '#FFE7B8', 3, 3);
      else if (f.kind === 'orb') { sparks(f.bx, f.by, f.bz, f.color, 9, 4, 4); }
      else if (f.kind === 'bolt') { sparks(f.bx, f.by, f.bz, f.color, 10, 5, 6); fxRing(f.bx, f.bz, 1.6, f.color, 0.35, 0.7); }
      else if (f.kind === 'rock') { sparks(f.bx, 0.4, f.bz, '#9C8A74', 12, 5, 10, 0.4); fxRing(f.bx, f.bz, 2.6, '#C8B59A', 0.45, 0.6); shake(0.18, f.bx, f.bz); }
    }
  }
  fx = fx.filter(f => !f.dead);
}

// ---------- music & battlefield ambience (generated with Web Audio) ----------
const MUS = {bus:null, amb:null, next:0, step:0, bar:0, state:'calm', chk:0, clashT:0};
const mtof = n => 440*Math.pow(2, (n - 69)/12);
const CHORDS = {Dm:[50, 53, 57], C:[48, 52, 55], Bb:[46, 50, 53], Am:[45, 48, 52], Gm:[43, 46, 50], A:[45, 49, 52], F:[41, 45, 48]};
const PROG = {calm:['Dm', 'C', 'Bb', 'C', 'Dm', 'Am', 'Bb', 'A'], war:['Dm', 'Dm', 'C', 'Bb', 'Dm', 'Dm', 'Bb', 'A'], last:['Dm', 'Bb', 'Gm', 'A']};
const STEP = {calm:60/76/2, war:60/118/2, last:60/92/2};
function musSetup(a) {
  MUS.bus = a.createGain(); MUS.bus.gain.value = 0;
  const comp = a.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3; MUS.bus.connect(comp); comp.connect(a.destination);
  MUS.amb = a.createGain(); MUS.amb.gain.value = 1; MUS.amb.connect(a.destination);
  const loopN = (type, fr, q) => { const s = a.createBufferSource(); s.buffer = nbuf(a); s.loop = true; s.playbackRate.value = 0.7 + Math.random()*0.2; const f = a.createBiquadFilter(); f.type = type; f.frequency.value = fr; f.Q.value = q; const g = a.createGain(); g.gain.value = 0; s.connect(f); f.connect(g); g.connect(MUS.amb); s.start(); return {g, f}; };
  MUS.wind = loopN('bandpass', 420, 0.8);
  const lfo = a.createOscillator(), lg = a.createGain(); lfo.frequency.value = 0.06; lg.gain.value = 240; lfo.connect(lg); lg.connect(MUS.wind.f.frequency); lfo.start();
  MUS.roar = loopN('lowpass', 650, 0.5);
}
function mEnv(a, t, peak, att, rel, dest) { const g = a.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + att); g.gain.exponentialRampToValueAtTime(0.0001, t + att + rel); g.connect(dest || MUS.bus); return g; }
function mOsc(a, type, f, t, dur, dest, det) { const o = a.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); if (det) o.detune.value = det; o.connect(dest); o.start(t); o.stop(t + dur + 0.05); return o; }
function pluck(a, t, n, v, dec = 0.7) { const g = mEnv(a, t, v, 0.005, dec), f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(mtof(n)*6, t); f.frequency.exponentialRampToValueAtTime(mtof(n)*1.5, t + dec); f.connect(g); mOsc(a, 'triangle', mtof(n), t, dec, f); mOsc(a, 'square', mtof(n), t, dec*0.5, mEnv(a, t, v*0.18, 0.003, dec*0.4, f)); }
function pad(a, t, notes, dur, v, bright = 900) { const g = mEnv(a, t, v, dur*0.35, dur*0.9), f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = bright; f.connect(g); for (const n of notes) { mOsc(a, 'sawtooth', mtof(n), t, dur*1.3, f, -7); mOsc(a, 'sawtooth', mtof(n), t, dur*1.3, f, 7); } }
function brass(a, t, notes, dur, v) { const g = mEnv(a, t, v, 0.06, dur), f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(380, t); f.frequency.exponentialRampToValueAtTime(1900, t + 0.12); f.frequency.exponentialRampToValueAtTime(700, t + dur); f.connect(g); for (const n of notes) { mOsc(a, 'sawtooth', mtof(n), t, dur, f, -5); mOsc(a, 'sawtooth', mtof(n), t, dur, f, 6); } }
function tom(a, t, f0, v) { const g = mEnv(a, t, v, 0.004, 0.42); const o = a.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0*0.42, t + 0.35); o.connect(g); o.start(t); o.stop(t + 0.5); const n = a.createBufferSource(); n.buffer = nbuf(a); const lpf = a.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = 260; n.connect(lpf); lpf.connect(mEnv(a, t, v*0.5, 0.002, 0.12)); n.start(t); n.stop(t + 0.15); }
function snare(a, t, v) { const n = a.createBufferSource(); n.buffer = nbuf(a); const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 0.8; n.connect(f); f.connect(mEnv(a, t, v, 0.002, 0.14)); n.start(t, Math.random()*0.5); n.stop(t + 0.2); }
function flute(a, t, n, dur, v) { const g = mEnv(a, t, v, 0.08, dur), o = a.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(mtof(n), t); const l = a.createOscillator(), lg = a.createGain(); l.frequency.value = 5.2; lg.gain.value = mtof(n)*0.006; l.connect(lg); lg.connect(o.frequency); o.connect(g); o.start(t); l.start(t); o.stop(t + dur + 0.1); l.stop(t + dur + 0.1); }
function musStep(a, t) {
  const st = MUS.state, i = MUS.step % 8, prog = PROG[st], ch = CHORDS[prog[MUS.bar % prog.length]], root = ch[0];
  if (st === 'calm') {
    if (i === 0) { pad(a, t, ch.map(n => n), STEP.calm*8, 0.05, 700); pluck(a, t, root - 12, 0.12, 1.6); }
    const arp = [0, 1, 2, 1, 2, 0, 1, 2][i], n = ch[arp] + 12 + (i === 4 ? 12 : 0);
    if (Math.random() < 0.82) pluck(a, t, n, 0.07);
    if ((i === 0 || i === 4) && Math.random() < 0.35) flute(a, t, ch[Math.floor(Math.random()*3)] + 24, STEP.calm*3, 0.03);
  } else if (st === 'war') {
    if (i === 0) { pad(a, t, ch, STEP.war*8, 0.035, 600); if (MUS.bar % 2 === 0) brass(a, t, ch.map(n => n + 12), STEP.war*2.5, 0.05); }
    if ([0, 3, 4, 6].includes(i)) tom(a, t, i === 0 ? 120 : 95, 0.32);
    if (i === 2 || i === 6) snare(a, t, 0.1);
    pluck(a, t, root - 12 + (i === 7 ? 7 : 0), 0.1, 0.25);
    pluck(a, t, ch[[0, 2, 1, 2][i % 4]] + 12, 0.05, 0.3);
  } else {
    if (i === 0) { brass(a, t, ch.map(n => n + 12), STEP.last*7.5, 0.06); pad(a, t, ch.map(n => n - 12), STEP.last*8, 0.05, 500); }
    if (i === 0 || i === 4) tom(a, t, 80, 0.45);
    if (i >= 6) tom(a, t + STEP.last*0.5, 140, 0.16);
    if (i % 2 === 1) snare(a, t, 0.06);
    pluck(a, t, root - 12, 0.08, 0.5);
  }
  MUS.step++; if (MUS.step % 8 === 0) { MUS.bar++; MUS.state = MUS.want || 'calm'; }
}
function clash(a, t, v) {
  const g = a.createGain(); g.gain.value = 1; const pan = a.createStereoPanner ? a.createStereoPanner() : null; if (pan) { pan.pan.value = Math.random()*1.6 - 0.8; g.connect(pan); pan.connect(MUS.amb); } else g.connect(MUS.amb);
  const r = Math.random();
  if (r < 0.6) { const f = 1900 + Math.random()*1800; mOsc(a, 'sine', f, t, 0.25, mEnv(a, t, v*0.35, 0.002, 0.22, g)); mOsc(a, 'sine', f*1.47, t, 0.18, mEnv(a, t, v*0.2, 0.002, 0.15, g)); const n = a.createBufferSource(); n.buffer = nbuf(a); const hp = a.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3000; n.connect(hp); hp.connect(mEnv(a, t, v*0.4, 0.001, 0.05, g)); n.start(t, Math.random()*0.5); n.stop(t + 0.08); }
  else if (r < 0.82) { const n = a.createBufferSource(); n.buffer = nbuf(a); const bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 4; bp.frequency.setValueAtTime(2400, t); bp.frequency.exponentialRampToValueAtTime(700, t + 0.3); n.connect(bp); bp.connect(mEnv(a, t, v*0.3, 0.02, 0.28, g)); n.start(t, Math.random()*0.5); n.stop(t + 0.35); }
  else { const n = a.createBufferSource(); n.buffer = nbuf(a); const bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 6; bp.frequency.setValueAtTime(520 + Math.random()*250, t); const l = a.createOscillator(), lg = a.createGain(); l.frequency.value = 6; lg.gain.value = 60; l.connect(lg); lg.connect(bp.frequency); l.start(t); l.stop(t + 0.8); n.connect(bp); bp.connect(mEnv(a, t, v*0.25, 0.08, 0.6, g)); n.start(t, Math.random()*0.3); n.stop(t + 0.8); }
}
function musState() {
  if (!G || phase === 'lobby' || phase === 'exit') return 'calm';
  if (phase === 'over') return 'calm';
  const last = (G.lastStand && (G.lastStand[0] || G.lastStand[1])) || ents.some(e => e.kind === 'core' && !e.dead && e.hp/e.maxHp < 0.5);
  if (last) return 'last';
  return G.time - (G.combatT === undefined ? -99 : G.combatT) < 5 ? 'war' : 'calm';
}
function musTick(dt) {
  const a = AC; if (!a || a.state !== 'running') return;
  if (!(SET.music || SET.amb) && !MUS.bus) return;
  if (!MUS.bus) { musSetup(a); MUS.next = a.currentTime + 0.1; }
  const now = a.currentTime;
  if (G && G.combatN) G.combatN = Math.max(0, G.combatN - dt*1.5);
  MUS.chk -= dt; if (MUS.chk <= 0) { MUS.chk = 0.5; MUS.want = musState(); if (MUS.step % 8 === 0) MUS.state = MUS.want; }
  const vol = SET.vol*(SET.music ? (phase === 'lobby' ? 0.7 : 1) : 0);
  MUS.bus.gain.setTargetAtTime(vol, now, 0.6);
  const play = SET.amb && G && (phase === 'play' || phase === 'muster'), inten = Math.min(1, (G && G.combatN || 0)/8);
  MUS.wind.g.gain.setTargetAtTime(play ? (MUS.state === 'calm' ? 0.05 : 0.025)*SET.vol : 0, now, 0.8);
  MUS.roar.g.gain.setTargetAtTime(play && MUS.state !== 'calm' ? (0.02 + 0.05*inten + (MUS.state === 'last' ? 0.03 : 0))*SET.vol : 0, now, 0.8);
  if (SET.music) { if (MUS.next < now) MUS.next = now + 0.05; while (MUS.next < now + 0.3) { musStep(a, MUS.next); MUS.next += STEP[MUS.state]; } }
  else MUS.next = now;
  if (play && MUS.state !== 'calm' && now > MUS.clashT) { clash(a, now + 0.05, (0.25 + 0.5*inten)*SET.vol); MUS.clashT = now + (0.12 + Math.random()*0.8)/(0.4 + inten); }
}
function musStinger(win) {
  const a = AC; if (!a || !SET.music || !MUS.bus) return;
  const t = a.currentTime + 0.2;
  const seq = win ? [[50, 54, 57], [52, 55, 59], [54, 57, 62], [57, 62, 66]] : [[50, 53, 57], [48, 51, 55], [46, 50, 53], [45, 49, 52]];
  seq.forEach((ch, i) => { brass(a, t + i*0.42, ch.map(n => n + 12), i === 3 ? 2.4 : 0.5, 0.08); tom(a, t + i*0.42, 110, 0.35); });
  MUS.step = 0; MUS.bar = 0; MUS.next = t + 4.5;
}

// ---------- per-frame bookkeeping inside the simulation ----------
function featTick(dt) {
  if (!G.eco) { G.eco = []; G.ecoT = 0; }
  G.ecoT -= dt; if (G.ecoT <= 0) { G.ecoT = 10; recordEco(); }
  G.featT = (G.featT || 0) - dt;
  if (G.featT <= 0) { G.featT = 2; for (const c of cmds()) if (c !== player && !c.net) { aiArmory(c); aiUpg(c); } }
  if (G.tut && !G.tut.done) tutTick(dt);
  else if ($('tut')) $('tut').remove();
  featTick2(dt);
}
const teamEarn = t => cmds().filter(c => c.team === t).reduce((s, c) => s + c.gold + c.spent, 0);
function recordEco() { if (G && G.eco) G.eco.push([G.time, Math.round(teamEarn(0)), Math.round(teamEarn(1))]); }

// ---------- tutorial ----------
const tutSeen = () => { try { return !!localStorage.getItem('fhwz-tut'); } catch (e) { return false; } };
const TSTEPS = [
  {t:() => FINE() ? '用 <b>W A S D</b> 移動你的指揮官。指揮官不會親自攻擊，靠部隊與技能作戰。' : '用左下的<b>搖桿</b>移動你的指揮官。指揮官不會親自攻擊，靠部隊與技能作戰。', on:T => { T.p0 = {x:player.x, z:player.z}; }, ok:T => dist(player, T.p0) > 9},
  {t:() => FINE() ? '按 <b>1</b> 選擇第 I 隊（或點右下指揮台的第 I 隊卡片）。' : '點右下指揮台的<b>第 I 隊</b>卡片選擇它。', ok:() => G.sel === 0},
  {t:() => FINE() ? '在地面按<b>右鍵</b>：第 I 隊會移動到那裡並固守。按住右鍵拖曳可以決定隊伍朝向。' : '點地面：第 I 隊會移動到那裡並固守。', on:T => { T.o0 = G.stats.orders; }, ok:T => G.stats.orders > T.o0 && ['hold', 'move', 'focus', 'charge'].includes(player.grp[0].order)},
  {t:() => FINE() ? '按 <b>3</b> 選全軍，再按 <b>Z 前進</b>：兩隊會沿著中路推進。' : '點<b>全軍</b>，再點<b>前進</b>：兩隊會沿著中路推進。', ok:() => G.sel === 'all' && player.grp[0].order === 'advance' && player.grp[1].order === 'advance'},
  {need:() => unl('form'), t:() => FINE() ? '按 <b>4–8</b> 切換陣形：6 楔形適合衝鋒、7 圓陣防守最穩、5 橫列讓弓兵射得更遠。' : '點指揮台下方的<b>陣形</b>按鈕切換：楔形適合衝鋒、圓陣防守最穩、橫列讓弓兵射得更遠。', on:T => { T.f0 = player.grp.map(g => g.form).join(); }, ok:T => player.grp.map(g => g.form).join() !== T.f0},
  {need:() => unl('uskill'), t:() => FINE() ? '按 <b>F</b> 準備第 I 隊的兵種技能，地面會顯示範圍，再按<b>右鍵</b>施放。' : '點第 I 隊卡片右邊的<b>技能</b>，再點地面施放。', ok:() => player.grp[0].skT > 0 || player.grp[1].skT > 0},
  {t:() => FINE() ? '按 <b>Q</b> 準備指揮官技能，同樣用<b>右鍵</b>指定位置施放。' : '點右下的<b>指揮官技能</b>，再點地面施放。', ok:() => player.qT > 0},
  {need:() => anyB(), t:() => { const b = BKEYS.filter(k => unl('b:' + k)).sort((x, y) => BUILDS[x].cost - BUILDS[y].cost)[0]; return `點下方建造列的建築（例如 <b>${BUILDS[b].n} ${BUILDS[b].cost}</b>），再在部隊附近的地面點一下放置。建築能強化或剋制特定兵種。`; }, on:T => { T.b0 = player.builds; player.gold = Math.max(player.gold, 300); }, ok:T => player.builds > T.b0},
  {need:() => unl('armory'), t:() => FINE() ? '按 <b>U</b> 打開軍械庫：用軍資替兵種升級武器與護甲（各 3 級），只能在主堡範圍內或陣亡時購買。先打開看看。' : '點右下的<b>軍械庫</b>：用軍資替兵種升級武器與護甲（各 3 級），只能在主堡範圍內或陣亡時購買。', ok:T => T.arm},
  {need:() => unl('deploy'), t:() => FINE() ? '按<b>空白鍵</b>進入戰術部署：時間放慢、鏡頭拉遠，方便下指令。再按一次離開。' : '點指揮台下方的<b>戰術部署</b>：時間放慢、鏡頭拉遠。再點一次離開。', ok:T => { if (G.deploy) T.dep = true; return T.dep && !G.deploy; }},
  {t:() => `<b>成長</b>：擊殺、推塔${uj('obj', '、打中立目標')}會讓指揮官升級（右下頭像的等級與經驗環），每級強化 ${unl('r') ? 'Q／R' : 'Q'}${uj('e', '，<b>6 級解鎖 E 大招</b>')}。${uj('upg', '建築完工後可按 <b>L</b> 升級，最高 5 級。')}${flv() < RMAX ? '打完對戰會提升<b>軍階</b>，逐步開放更多指令與系統。' : ''}`, ok:T => T.t > 9},
  {t:() => '教學完成！敵軍出動了：推倒任一路三座防禦塔、摧毀敵方主塔就能獲勝。按 <b>H</b> 隨時查看操作說明。', ok:T => T.t > 6}
];
function startTutorial(k) {
  newGame(k);
  chooseUnits('pike', 'archer');
  G.tut = {i:-1, t:0, done:false, st:TSTEPS.filter(s => !s.need || s.need())};
  tutGo(0);
}
function tutGo(i) {
  const T = G.tut; T.i = i; T.t = 0;
  const ST = T.st || TSTEPS;
  if (i >= ST.length) { tutEnd(); return; }
  if (ST[i].on) ST[i].on(T);
  let el = $('tut');
  if (!el) { el = document.createElement('div'); el.id = 'tut'; $('hudroot').appendChild(el); }
  el.innerHTML = `<div class="tk"><span>新手教學・${i + 1} / ${ST.length}</span><button type="button" id="tutSkip">跳過教學</button></div><div class="tt">${ST[i].t()}</div><div class="tbar"><i style="width:${Math.round(i/ST.length*100)}%"></i></div>`;
  $('tutSkip').onclick = () => tutEnd();
  if (i > 0) chime();
}
function tutTick(dt) {
  const T = G.tut; T.t += dt;
  const ST = T.st || TSTEPS; if (T.i >= 0 && T.i < ST.length && ST[T.i].ok(T) && T.t > 0.6) tutGo(T.i + 1);
}
function tutEnd() {
  if (!G || !G.tut) return;
  G.tut.done = true; G.waveT = 3;
  const el = $('tut'); if (el) el.remove();
  try { localStorage.setItem('fhwz-tut', '1'); } catch (e) {}
  toast('敵軍出動了！', 'r'); drum();
}

// ---------- results screen ----------
function showResults(win) {
  if (!G) return;
  const el = $('tut'); if (el) el.remove();
  for (const id of ['talent', 'mercBtn']) { const x = $(id); if (x) x.remove(); }
  const cs = cmds(), score = c => c.st.kills*4 + c.st.solK*0.5 + c.st.towers*5 + c.st.dmg/500 - c.st.deaths*2 + c.lvl;
  const winners = cs.filter(c => c.team === (win ? 0 : 1)), mvp = winners.slice().sort((a, b) => score(b) - score(a))[0];
  const row = c => `<tr class="${c === player ? 'me' : ''}"><td>${icon(c.key, 26, c.team)} ${CMDS[c.key].n}${c === player ? '（你）' : ''}${c === mvp ? '<span class="mvp">MVP</span>' : ''}</td><td>${c.lvl}</td><td>${c.st.kills}／${c.st.deaths}</td><td>${c.st.solK}</td><td>${c.st.solL}</td><td>${c.st.towers}</td><td>${Math.round(c.st.dmg/100)/10}k</td><td>${Math.round(c.gold + c.spent)}</td></tr>`;
  const head = `<tr><th>指揮官</th><th>等級</th><th>擊殺／陣亡</th><th>殲敵士兵</th><th>折損士兵</th><th>推塔</th><th>傷害</th><th>總軍資</th></tr>`;
  const tot = t => { const L = cs.filter(c => c.team === t); return {k:L.reduce((s, c) => s + c.st.kills, 0), l:L.reduce((s, c) => s + c.st.solL, 0), g:Math.round(teamEarn(t))}; };
  const RR = repReward(win, mvp === player), RK = rankReward(win, mvp === player);
  const T0 = tot(0), T1 = tot(1), why = mvp ? [mvp.st.kills ? `擊殺 ${mvp.st.kills}` : '', mvp.st.towers ? `推塔 ${mvp.st.towers}` : '', `殲敵士兵 ${mvp.st.solK}`, `傷害 ${Math.round(mvp.st.dmg/100)/10}k`].filter(Boolean).join('・') : '';
  modal.innerHTML = `<div class="sheet" style="margin-top:4vh"><div class="bar" style="align-items:flex-end"><div style="display:flex;flex-direction:column;gap:6px;flex:1"><span class="kick">${fmt(G.time)}・戰役結束</span>
     <h1 style="color:${win ? C.gold : C.red};margin:0">${win ? '勝利：敵方主塔已陷落' : '敗北：我方主塔失守'}</h1></div>
     ${mvp ? `<div style="display:flex;gap:10px;align-items:center">${icon(mvp.key, 56, mvp.team)}<div><div class="kick">本場 MVP</div><div style="font-size:20px;font-weight:800">${CMDS[mvp.key].t} ${CMDS[mvp.key].n}${mvp === player ? '（你）' : ''}</div><div style="color:var(--muted);font-size:12px">${why}</div></div></div>` : ''}</div>
     <div class="res"><div class="card"><h3 style="color:${C.blue}">聖輝聯軍・擊殺 ${T0.k}・折損士兵 ${T0.l}・推倒敵塔 ${G.lost[1]}</h3><table>${head}${cs.filter(c => c.team === 0).map(row).join('')}</table>
       <h3 style="color:${C.red};margin-top:12px">黑曜大軍・擊殺 ${T1.k}・折損士兵 ${T1.l}・推倒敵塔 ${G.lost[0]}</h3><table>${head}${cs.filter(c => c.team === 1).map(row).join('')}</table></div>
     <div class="card"><h3>經濟曲線（累計軍資）</h3><canvas id="ecoC" width="520" height="230" style="width:100%;height:auto"></canvas>
       <div class="keys" style="margin-top:8px"><div><kbd>${G.stats.orders}</kbd><span>下達指令</span></div><div><kbd>${G.stats.skills}</kbd><span>施放技能</span></div><div><kbd>${G.stats.caps}</kbd><span>佔領據點</span></div>${unl('obj') ? `<div><kbd>${G.stats.objs}</kbd><span>中立目標</span></div>` : ''}</div></div></div>
     ${rankHtml(RK)}${repHtml(RR)}
     <div class="bar"><button type="button" class="go" id="againQ">${glyph('advance', 20, '#1A1408')}再來一場（${CMDS[player.key].n}）</button><button type="button" class="go alt" id="again">換指揮官（回大廳）</button></div></div>`;
  modal.classList.add('show');
  const key = player.key;
  $('againQ').onclick = () => { closeModal(); ac(); drum(); startWhenArt(() => newGame(key)); };
  $('again').onclick = () => showLobby();
  if ($('toShop')) $('toShop').onclick = () => { ltab = 'shop'; shopPrev = null; showLobby(); };
  drawEco($('ecoC'));
}
function drawEco(cv) {
  if (!cv || !G.eco || !cv.getContext) return;
  const x = cv.getContext('2d'), W2 = cv.width, H2 = cv.height, pad = {l:44, r:12, t:12, b:26}, E = G.eco.length ? G.eco : [[0, 0, 0]];
  const tMax = Math.max(60, E[E.length - 1][0]), vMax = Math.max(500, ...E.map(e => Math.max(e[1], e[2])));
  const X = t => pad.l + t/tMax*(W2 - pad.l - pad.r), Y = v => H2 - pad.b - v/vMax*(H2 - pad.t - pad.b);
  x.clearRect(0, 0, W2, H2); x.font = '11px "Noto Sans TC", sans-serif'; x.fillStyle = C.muted; x.strokeStyle = 'rgba(255,255,255,.08)'; x.lineWidth = 1;
  for (let i = 0; i <= 4; i++) { const v = vMax*i/4, y = Y(v); x.beginPath(); x.moveTo(pad.l, y); x.lineTo(W2 - pad.r, y); x.stroke(); x.textAlign = 'right'; x.fillText(v >= 1000 ? (v/1000).toFixed(1) + 'k' : Math.round(v), pad.l - 6, y + 4); }
  x.textAlign = 'center'; for (let m = 0; m <= tMax/60; m += Math.max(1, Math.ceil(tMax/60/6))) x.fillText(m + ' 分', X(m*60), H2 - 8);
  for (const [i, col] of [[1, C.blue], [2, C.red]]) { x.strokeStyle = col; x.lineWidth = 2.5; x.beginPath(); E.forEach((e, j) => { const px = X(e[0]), py = Y(e[i]); if (j) x.lineTo(px, py); else x.moveTo(px, py); }); x.stroke(); }
  x.textAlign = 'left'; x.fillStyle = C.blue; x.fillText('聖輝聯軍', pad.l + 8, pad.t + 12); x.fillStyle = C.red; x.fillText('黑曜大軍', pad.l + 78, pad.t + 12);
}

// ================= v0.9: commander talents, faction-exclusive squads, jungle camps & mercenaries =================

// ---------- talents (levels 3 / 5 / 8: two choices each) ----------
const TAL_LV = [3, 5, 8];
const TALENTS = {
  valen:[[['v_q1', '堅石', '築壘號令的石牆持續 4 → 7 秒'], ['v_q2', '荊棘牆', '石牆範圍內的敵軍每秒受 30 傷害']],
         [['v_r1', '鐵律', '不落之城範圍 15 → 22'], ['v_r2', '反擊號令', '不落之城期間，範圍內友軍士兵傷害 +20%']],
         [['v_p1', '築城大師', '建築造價 -20%'], ['v_p2', '盾衛長', '盾衛與聖殿騎士生命 +20%']]],
  sylvie:[[['s_q1', '火箭雨', '箭雨傷害 +50%'], ['s_q2', '疾風', '箭雨冷卻 -35%']],
          [['s_r1', '萬箭齊發', '萬箭穿雲範圍 13 → 17'], ['s_r2', '釘地', '萬箭穿雲範圍內的敵軍減速 50%']],
          [['s_p1', '神射手', '遠程部隊射程再 +10%'], ['s_p2', '輕裝', '弓兵與皇家長弓手移速 +15%']]],
  orion:[[['o_q1', '雙星', '流星墜擊後再落一顆小隕石（90 傷害）'], ['o_q2', '重力', '流星暈眩 0.8 → 1.4 秒']],
         [['o_r1', '時間凝滯', '時滯結界持續 4 → 7 秒'], ['o_r2', '虛空侵蝕', '時滯結界內的敵軍每秒受 30 傷害']],
         [['o_p1', '秘法共鳴', '戰鬥法師與死靈術士傷害 +15%'], ['o_p2', '星辰祝福', '所有技能冷卻 -12%']]],
  gru:[[['g_q1', '狼王', '狼群召喚 3 → 5 頭'], ['g_q2', '巨狼', '召喚的戰狼生命與攻擊 +60%']],
       [['g_r1', '蠻荒衝撞', '萬獸奔騰沿途的敵軍暈眩 1 秒'], ['g_r2', '長驅', '萬獸奔騰衝鋒距離 22 → 32']],
       [['g_p1', '狂野之心', '騎兵與獅鷲騎士傷害 +15%'], ['g_p2', '獸群', '戰狼存在時間 +50%，萬獸之王多召 2 頭']]],
  brand:[[['b_q1', '烈性火藥', '爆破火藥對建築與塔 320 → 480'], ['b_q2', '大範圍', '爆破火藥範圍 5 → 7']],
         [['b_r1', '急救', '巨像覺醒回復一半 → 全部生命'], ['b_r2', '攻城狂熱', '攻城傷害加倍持續 10 → 18 秒']],
         [['b_p1', '工程學', '建造時間 -40%、建築生命 +20%'], ['b_p2', '重型器械', '投石車射程 +20%']]],
  raven:[[['r_q1', '群鴉', '烏鴉斥候範圍 18 → 26'], ['r_q2', '鴉眼', '烏鴉視野持續 8 → 16 秒']],
         [['r_r1', '影殺', '影襲傷害 120 → 180、暈眩 2 → 3 秒'], ['r_r2', '連影', '影襲冷卻 -40%']],
         [['r_p1', '暗殺術', '暗影斥候、亡魂戰士與狂戰士對指揮官傷害 +30%'], ['r_p2', '情報網', '暗影情報每 60 → 35 秒']]]
};
const hasTal = (c, id) => !!(c && c.tal && c.tal.includes(id));
const TV = (c, id, a, b) => hasTal(c, id) ? b : a;
const bcost = (c, type) => Math.round(BUILDS[type].cost*(hasTal(c, 'v_p1') ? 0.8 : 1));
function talCd(c, slot) {
  let m = 1;
  if (slot === 'q' && hasTal(c, 's_q2')) m *= 0.65;
  if (slot === 'r' && hasTal(c, 'r_r2')) m *= 0.6;
  if (hasTal(c, 'o_p2')) m *= 0.88;
  return m;
}
function bigWolf(c, s) { if (s && hasTal(c, 'g_q2')) { s.maxHp *= 1.6; s.hp *= 1.6; s.atkMul = 1.6; s.mesh.scale.multiplyScalar(1.2); } return s; }
function applyTal(c, tier, i) {
  const T = TALENTS[c.key][tier][i]; c.tal = c.tal || [null, null, null];
  if (c.tal[tier]) return;
  c.tal[tier] = T[0];
  if (T[0] === 'v_p2') for (const e of ents) if (e.kind === 'sol' && !e.dead && e.owner === c && (e.utype === 'shield' || e.utype === 'templar')) { e.maxHp *= 1.2; e.hp *= 1.2; }
  if (T[0] === 'b_p1') for (const e of ents) if (e.kind === 'bld' && !e.dead && e.owner === c) { e.maxHp *= 1.2; e.hp *= 1.2; }
  if (c === player) { toast(`天賦「${T[1]}」：${lkTxt(T[2])}`, 'g'); chime(); updateHud(); }
}
function talentCheck(c) {
  if (!unl('talent')) return;
  const tier = TAL_LV.indexOf(c.lvl); if (tier < 0 || (c.tal && c.tal[tier])) return;
  if (c.net) { (c.talQ = c.talQ || []).push(tier); return; }
  if (c !== player) { applyTal(c, tier, Math.random() < 0.5 ? 0 : 1); return; }
  (G.talQ = G.talQ || []).push(tier); showTalent();
}
function showTalent() {
  let el = $('talent');
  if (!G || !G.talQ || !G.talQ.length || phase === 'over') { if (el) el.remove(); return; }
  const tier = G.talQ[0], T = TALENTS[player.key][tier];
  if (!el) { el = document.createElement('div'); el.id = 'talent'; $('hudroot').appendChild(el); }
  el.innerHTML = `<div class="th">${glyph('talent', 18, C.gold)} ${TAL_LV[tier]} 級天賦・二選一<small>（按 9／0 或點選，遊戲不暫停）</small></div><div class="tb">${T.map((t, i) => `<button type="button" data-ti="${i}"><b><kbd>${i ? '0' : '9'}</kbd>${t[1]}</b><small>${lkTxt(t[2])}</small></button>`).join('')}</div>`;
  el.querySelectorAll('[data-ti]').forEach(b => b.onclick = () => pickTalent(+b.dataset.ti));
}
function pickTalent(i) { if (!G || !G.talQ || !G.talQ.length || !unl('talent')) return; applyTal(player, G.talQ.shift(), i); showTalent(); }
function talentHtml(k) {
  return `<div class="dl">${TALENTS[k].map((tier, j) => `<div><b>${TAL_LV[j]} 級天賦</b>${j ? '' : lkTag('talent')}<span>${tier.map(t => `<strong>${t[1]}</strong>：${lkTxt(t[2])}`).join('<br>或　')}</span></div>`).join('')}</div>`;
}
function talentTitle(c) { return (c.tal || []).filter(Boolean).map(id => { for (const tier of TALENTS[c.key]) for (const t of tier) if (t[0] === id) return t[1]; return ''; }).join('・'); }

// ---------- per-soldier modifiers (faction squads, buffs, talents) ----------
function templarNear(team, e) {
  const L = G && G.tpl && G.tpl[team]; if (!L || !L.length) return false;
  for (const p of L) if ((p.x - e.x)**2 + (p.z - e.z)**2 < 49) return true;
  return false;
}
function featHurt(t, src, tu, su) {
  let m = 1;
  if (t.kind === 'neu' && t.camp) { t.hitT = G.time; const cs = G.camps && G.camps[t.camp.key]; if (cs) cs.aggroT = G.time; }
  if (t.kind === 'sol' && templarNear(t.team, t)) m *= 0.88;
  if (t.kind === 'sol' && t.owner && t.owner.stoneT > G.time && !isComp(t)) m *= 0.85;
  if (src && src.kind === 'sol') {
    const o = src.owner;
    if (src.atkMul) m *= src.atkMul;
    if (hasTal(o, 'v_r2') && inZone(src.team, src.x, src.z, 'fort')) m *= 1.2;
    if ((su === 'mage' || su === 'necro') && hasTal(o, 'o_p1')) m *= 1.15;
    if ((su === 'cav' || su === 'griffin') && hasTal(o, 'g_p1')) m *= 1.15;
    if (t.kind === 'cmd' && (su === 'scout' || su === 'revenant' || su === 'berserk') && hasTal(o, 'r_p1')) m *= 1.3;
  }
  return m;
}
function featCd(e, cd) {
  if (e.utype === 'berserk') cd /= 1 + 0.6*(1 - e.hp/e.maxHp);
  const g = !isComp(e) && e.owner ? e.owner.grp[e.grp] : null;
  if (g && g.frenzyT > G.time) cd /= 1.4;
  if (e.owner && e.owner.wolfT > G.time) cd /= 1.1;
  return cd;
}
function solSpeedMul(s, g) {
  let m = 1;
  if (g && g.frenzyT > G.time) m *= 1.3;
  if (s.owner && s.owner.wolfT > G.time) m *= 1.15;
  if ((s.utype === 'archer' || s.utype === 'longbow') && hasTal(s.owner, 's_p2')) m *= 1.15;
  return m;
}
function castU2(c, k, g, o, p, f, S, col) {
  if (g.utype === 'templar') {
    p = clampPt(o, p, S.range);
    for (const e of ents) {
      if (e.dead || (e.x - p.x)**2 + (e.z - p.z)**2 > (S.r + (e.r || 0))**2) continue;
      if (e.team === c.team && (e.kind === 'sol' || (e.kind === 'cmd' && e.respawn <= 0))) e.hp = Math.min(e.maxHp, e.hp + e.maxHp*0.2);
      else if (e.team !== c.team && e.team < 2 && (e.kind === 'sol' || e.kind === 'min' || (e.kind === 'cmd' && e.respawn <= 0))) hurt(e, e.utype === 'revenant' || e.utype === 'necro' ? 200 : 100, c, {aoe:true});
    }
    addZone({kind:'sanct', team:c.team, x:p.x, z:p.z, r:S.r, dur:0.9, owner:c, color:'#FFE6A0'});
    sparks(p.x, 4, p.z, '#FFF1C8', 26, 3, 9, -0.2);
  } else if (g.utype === 'longbow') {
    addZone({kind:'sweep', team:c.team, x:o.x, z:o.z, f, len:S.len, w:S.w, r:S.w/2, dur:0.7, dmg:90, kb:1.5, stun:0, owner:c, color:'#E8F0C0', hit:new Set()});
    g.face = f;
  } else if (g.utype === 'revenant') {
    g.frenzyT = G.time + 6;
    addZone({kind:'flash', team:c.team, x:o.x, z:o.z, r:S.r, dur:0.8, owner:c, color:'#9C7AE0'});
  } else if (g.utype === 'necro') {
    p = clampPt(o, p, S.range);
    for (const e of ents) if (!e.dead && e.team !== c.team && e.team < 2 && (e.kind === 'sol' || e.kind === 'min' || (e.kind === 'cmd' && e.respawn <= 0)) && (e.x - p.x)**2 + (e.z - p.z)**2 < (S.r + e.r)**2) { hurt(e, 90, c, {aoe:true}); slow(e, 0.4, 3); }
    addZone({kind:'flash', team:c.team, x:p.x, z:p.z, r:S.r, dur:0.8, owner:c, color:'#8AE07A'});
    sparks(p.x, 0.8, p.z, '#9CFF8A', 22, 7);
  }
}
// undead: revenants get back up once; necromancers raise the fallen
function kill2(t, own) {
  if (t.kind !== 'sol' || !G) return;
  if (t.utype === 'revenant' && !t.revived && !t.comp && t.owner) (G.revQ = G.revQ || []).push({c:t.owner, grp:t.grp, x:t.x, z:t.z, at:G.time + 2.5});
  if (t.utype === 'revenant' && t.comp) return;
  let nb = null, bd = 144;
  for (const e of ents) if (e.kind === 'sol' && !e.dead && e.utype === 'necro' && e.team !== t.team && e.team < 2) { const d = (e.x - t.x)**2 + (e.z - t.z)**2; if (d < bd) { bd = d; nb = e; } }
  if (!nb) return;
  const c = nb.owner, gk = nb.grp;
  if (ents.filter(e => e.comp && !e.dead && e.raisedBy === c && e.follow === gk).length >= 6) return;
  const s = spawnSoldier(c, 'revenant', t.x, t.z, 0.7, 25, gk);
  s.comp = true; s.follow = gk; s.raisedBy = c; s.revived = true;
  if (t.vis && (t.vis[0] || c.team === 0)) sparks(t.x, 0.6, t.z, '#9CFF8A', 10, 3, -2, 0.8);
}
function undeadTick() {
  if (!G.revQ || !G.revQ.length) return;
  const keep = [];
  for (const q of G.revQ) {
    if (G.time < q.at) { keep.push(q); continue; }
    const c = q.c, g = c.grp[q.grp];
    if (g.utype !== 'revenant' || g.mem.length >= UNITS.revenant.sq) continue;
    const s = spawnSoldier(c, 'revenant', q.x, q.z, 0.5, 0, q.grp); s.revived = true; g.mem.push(s);
    if (c.team === 0 || (s.vis && s.vis[0])) sparks(q.x, 0.4, q.z, '#B89CFF', 12, 3, -3, 1);
  }
  G.revQ = keep;
}

// ---------- jungle camps ----------
const CAMPS = [
  {key:'wolfB', type:'wolf', x:-60, z:-10, n:'西林狼窩'}, {key:'golemB', type:'golem', x:-5, z:50, n:'南谷石像遺跡'},
  {key:'wolfR', type:'wolf', x:60, z:10, n:'東林狼窩'}, {key:'golemR', type:'golem', x:5, z:-50, n:'北谷石像遺跡'},
  {key:'mercN', type:'merc', x:-30, z:-62, n:'北境傭兵營地'}, {key:'mercS', type:'merc', x:30, z:62, n:'南境傭兵營地'}
];
const CAMP_T = {
  wolf:{n:3, hp:520, r:1.2, spd:6.5, dmg:22, cd:1.2, rng:2.2, resp:100, icon:'camp_wolf', d:'狼群疾行：附近我方指揮官的部隊移速 +15%、攻速 +10%，60 秒，＋60 軍資'},
  golem:{n:2, hp:1250, r:2, spd:3.5, dmg:48, cd:2.4, rng:3.2, aoe:3, resp:100, icon:'camp_golem', d:'石膚：附近我方指揮官的部隊受傷 -15%，60 秒，＋80 軍資'},
  merc:{n:3, hp:560, r:1, spd:6, dmg:26, cd:1.1, rng:2.4, resp:150, icon:'camp_merc', d:'佔領傭兵營地：直到守衛重生前，我方指揮官可在這裡僱用傭兵（J）'}
};
function campInit() {
  G.camps = {};
  for (const cp of CAMPS) { G.camps[cp.key] = {cp, mobs:[], t:45, owner:-1, ownUntil:0, aggroT:-9}; campProps(cp); }
}
function campProps(cp) {
  const g = new THREE.Group(); g.position.set(cp.x, 0, cp.z);
  const rg = new THREE.Mesh(new THREE.RingGeometry(6.2, 6.6, 48), new THREE.MeshBasicMaterial({color:C.neutral, transparent:true, opacity:0.35, depthWrite:false, side:THREE.DoubleSide})); rg.rotation.x = -Math.PI/2; rg.position.y = 0.12; g.add(rg); G.campRings = G.campRings || []; G.campRings.push(rg);
  const stone = new THREE.MeshLambertMaterial({color:'#8E8A80'}), wood = new THREE.MeshLambertMaterial({color:'#6B4E32'}), cloth = new THREE.MeshLambertMaterial({color:'#A8946E'});
  if (cp.type === 'wolf') for (let i = 0; i < 5; i++) { const a = i*1.3 + 0.4, m = new THREE.Mesh(new THREE.DodecahedronGeometry(1 + (i % 3)*0.5, 0), stone); m.position.set(Math.sin(a)*7.5, 0.4, Math.cos(a)*7.5); m.rotation.set(i, i*2, 0); m.castShadow = true; g.add(m); }
  if (cp.type === 'golem') for (let i = 0; i < 4; i++) { const a = i*1.57 + 0.6, h = 2 + (i % 2)*2.5, m = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, h, 8), stone); m.position.set(Math.sin(a)*7, h/2, Math.cos(a)*7); m.rotation.z = (i % 2) ? 0.08 : -0.12; m.castShadow = true; g.add(m); }
  if (cp.type === 'merc') {
    for (const [x, z, s] of [[-5, -4, 1], [5, -5, 0.85]]) { const t = new THREE.Mesh(new THREE.ConeGeometry(2.4*s, 3.2*s, 6), cloth); t.position.set(x, 1.6*s, z); t.castShadow = true; g.add(t); }
    const fire = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.2, 6), new THREE.MeshBasicMaterial({color:'#FFB24A'})); fire.position.set(0, 0.6, 2); g.add(fire);
    for (let i = 0; i < 5; i++) { const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.4, 5), wood); const a = i*1.25; lg.position.set(Math.sin(a)*0.7, 0.15, 2 + Math.cos(a)*0.7); lg.rotation.set(Math.PI/2, a, 0); g.add(lg); }
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 5, 6), wood); pole.position.set(6, 2.5, 3); g.add(pole);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1), new THREE.MeshLambertMaterial({color:'#C9A24A', side:THREE.DoubleSide})); fl.position.set(6.8, 4.4, 3); g.add(fl);
  }
  world.add(g);
}
function spawnCamp(cs) {
  const cp = cs.cp, T = CAMP_T[cp.type];
  cs.mobs = [];
  for (let i = 0; i < T.n; i++) {
    const a = i/T.n*Math.PI*2, x = cp.x + Math.sin(a)*2.5, z = cp.z + Math.cos(a)*2.5;
    let mesh;
    if (cp.type === 'wolf') { mesh = mkSoldier('wolf', 1); mesh.scale.multiplyScalar(1.5); }
    else if (cp.type === 'golem') { mesh = mkTitan(); mesh.scale.setScalar(0.36); }
    else mesh = mkSoldier('berserk', 1);
    const n = addEnt({kind:'neu', sub:'camp', camp:cp, team:2, x, z, home:{x, z}, r:T.r, hp:T.hp, maxHp:T.hp, spd:T.spd, lastTeam:-1, facing:a, atkT:0, mesh});
    cs.mobs.push(n);
  }
  cs.owner = -1;
}
function updateCampMob(n, dt) {
  statusTick(n, dt); n.atkT -= dt;
  const cs = G.camps[n.camp.key], T = CAMP_T[n.camp.type], angry = G.time - cs.aggroT < 5;
  let tg = null, bd = 1e9;
  for (const e of ents) {
    if (e.dead || e.team > 1 || !(e.kind === 'sol' || e.kind === 'cmd') || (e.kind === 'cmd' && e.respawn > 0)) continue;
    if ((e.x - n.home.x)**2 + (e.z - n.home.z)**2 > 15*15) continue;
    const dd = (e.x - n.x)**2 + (e.z - n.z)**2; if (!angry && dd > 36) continue;
    if (dd < bd) { bd = dd; tg = e; }
  }
  if (!tg) { if ((n.x - n.home.x)**2 + (n.z - n.home.z)**2 > 0.5) moveTo(n, n.home.x, n.home.z, dt); else n.hp = Math.min(n.maxHp, n.hp + n.maxHp*0.08*dt); return; }
  cs.aggroT = Math.max(cs.aggroT, G.time - 3);
  const d = Math.sqrt(bd); n.facing = Math.atan2(tg.x - n.x, tg.z - n.z);
  if (d > T.rng + tg.r) { moveTo(n, tg.x, tg.z, dt); return; }
  if (n.atkT <= 0 && n.stunT <= 0) {
    n.atkT = T.cd; n.atkA = 0.35;
    if (T.aoe) { for (const e of ents) if (!e.dead && e.team < 2 && (e.kind === 'sol' || e.kind === 'cmd') && !(e.kind === 'cmd' && e.respawn > 0) && (e.x - tg.x)**2 + (e.z - tg.z)**2 < T.aoe*T.aoe) hurt(e, T.dmg, n, {aoe:true}); if (tg.vis && tg.vis[0]) { fxRing(tg.x, tg.z, T.aoe, '#C8B59A', 0.4, 0.6); shake(0.12, tg.x, tg.z); } }
    else hurt(tg, T.dmg, n);
  }
}
function campMobSlain(n) {
  const cs = G.camps[n.camp.key], cp = cs.cp, T = CAMP_T[cp.type];
  cs.mobs = cs.mobs.filter(m => m !== n && !m.dead);
  if (cs.mobs.length) return;
  cs.t = G.time + T.resp;
  const team = n.lastTeam; if (team !== 0 && team !== 1) return;
  const near = cmds().filter(c => c.team === team && c.respawn <= 0 && (c.x - cp.x)**2 + (c.z - cp.z)**2 < 45*45);
  if (cp.type === 'wolf') { for (const c of near) { c.wolfT = G.time + 60; c.gold += 60; } }
  else if (cp.type === 'golem') { for (const c of near) { c.stoneT = G.time + 60; c.gold += 80; } }
  else { cs.owner = team; cs.ownUntil = cs.t; }
  if (team === 0) toast(cp.type === 'merc' ? `拿下${cp.n}：守衛重生前可在這裡僱用傭兵（靠近後按 J）` : `清空${cp.n}：${T.d.split('，')[0]}`, 'g');
  else if (cp.type === 'merc') toast(`敵方佔領了${cp.n}`, 'r');
  if (n.vis && n.vis[0]) { fxRing(cp.x, cp.z, 7, C.gold, 0.8); sparks(cp.x, 1, cp.z, '#F1D29A', 20, 6); }
}
function campTick() {
  if (!G.camps) campInit();
  for (const k in G.camps) {
    const cs = G.camps[k];
    if (!cs.mobs.length && G.time >= cs.t) spawnCamp(cs);
    if (cs.owner >= 0 && G.time >= cs.ownUntil) cs.owner = -1;
  }
}
const heldCampNear = c => { if (!G || !G.camps) return null; for (const k in G.camps) { const cs = G.camps[k]; if (cs.cp.type === 'merc' && cs.owner === c.team && c.respawn <= 0 && (c.x - cs.cp.x)**2 + (c.z - cs.cp.z)**2 < 15*15) return cs; } return null; };
function aiCampTarget(c) {
  if (!unl('camps')) return null;
  if (!G.camps || G.time < 50 || squad(c).length < 8 || c.hp/c.maxHp < 0.55) return null;
  if ((c.campCD = (c.campCD || 0) - 0.3) > 0 && !c.campGo) return null;
  let best = null, bd = 40*40;
  for (const k in G.camps) {
    const cs = G.camps[k]; if (!cs.mobs.length) continue;
    const d = (cs.cp.x - c.x)**2 + (cs.cp.z - c.z)**2; if (d < bd) { bd = d; best = cs; }
  }
  if (!best) { c.campGo = false; c.campCD = 12; return null; }
  if (!c.campGo) { if (Math.random() < 0.35) { c.campGo = true; } else { c.campCD = 15; return null; } }
  return best.mobs.find(m => !m.dead) || null;
}

// ---------- mercenaries ----------
const mercCost = (c, u) => Math.round(UNITS[u].cost*(c.key === 'raven' ? 0.7 : 1));
const mercDur = c => c.key === 'raven' ? 180 : 120;
function hireMerc(c, u, gk) {
  if (!unl('camps')) return `傭兵在軍階 ${rankNeed('camps')} 解鎖`;
  const cs = heldCampNear(c); if (!cs) return '要站在我方佔領的傭兵營地旁才能僱用';
  if (c.mercUntil > G.time) return `目前的傭兵還要服役 ${Math.ceil(c.mercUntil - G.time)} 秒`;
  const cost = mercCost(c, u); if (c.gold < cost) return `軍資不足（需要 ${cost}）`;
  c.gold -= cost; c.spent += cost; const dur = mercDur(c);
  for (let i = 0; i < UNITS[u].sq; i++) { const s = spawnSoldier(c, u, cs.cp.x + rnd(-3, 3), cs.cp.z + rnd(-3, 3), 1, dur, gk); s.comp = true; s.follow = gk; }
  c.mercUntil = G.time + dur;
  if (c === player) { toast(`僱用${UNITS[u].n} ${UNITS[u].sq} 名：跟隨第 ${GNUM[gk]} 隊作戰 ${dur} 秒`, 'g'); horn(); }
  return null;
}
function openMercs() {
  if (!G || phase !== 'play' || lockedMsg('camps')) return;
  if (!heldCampNear(player)) { toast('要站在我方佔領的傭兵營地旁才能僱用傭兵（先清掉營地守衛）', 'r'); return; }
  cancelAim(); cancelOAim(); cancelPlace(); cancelDemo(); cancelUpg();
  const draw = msg => {
    const busy = player.mercUntil > G.time;
    modal.innerHTML = `<div class="sheet"><div style="display:flex;flex-direction:column;gap:6px"><span class="kick">傭兵營地・軍資 ${Math.floor(player.gold)}</span><h1>僱用傭兵</h1>
      <p>傭兵一次 6 名，不佔小隊編制，跟隨你指定的小隊一起作戰 ${mercDur(player)} 秒；同時只能有一團傭兵。${player.key === 'raven' ? '夜鴉是傭兵出身：費用 -30%、服役時間 +50%。' : ''}</p>
      ${busy ? `<p style="color:#F0978A">目前的傭兵還要服役 ${Math.ceil(player.mercUntil - G.time)} 秒。</p>` : ''}${msg ? `<p style="color:#F0978A">${msg}</p>` : ''}</div>
      <div class="arm">${MERCS.map(u => { const U = UNITS[u], cost = mercCost(player, u), dis = busy || player.gold < cost ? 'disabled' : ''; return `<div class="ar">${icon(u, 52)}<div><div class="nm">${U.n}<small>${cost} 軍資・6 名</small></div><div style="font-size:12px;color:var(--muted);margin:2px 0 4px">${U.trait}</div><div class="rw"><button type="button" class="ab" data-u="${u}" data-g="0" ${dis}><b>跟隨第 I 隊</b><small>${UNITS[player.grp[0].utype].n}</small></button><button type="button" class="ab" data-u="${u}" data-g="1" ${dis}><b>跟隨第 II 隊</b><small>${UNITS[player.grp[1].utype].n}</small></button></div></div></div>`; }).join('')}</div>
      <div class="bar"><button type="button" class="go alt" id="noM">關閉（J）</button></div></div>`;
    modal.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { const err = hireMerc(player, b.dataset.u, +b.dataset.g); if (err) draw(err); else { closeModal(); phase = 'play'; G.mercOpen = false; updateHud(); } });
    $('noM').onclick = () => { closeModal(); phase = 'play'; G.mercOpen = false; };
  };
  phase = 'pause'; G.mercOpen = true; modal.classList.add('show'); draw();
}
function toggleMercs() { if (G && phase === 'pause' && G.mercOpen) { closeModal(); phase = 'play'; G.mercOpen = false; } else openMercs(); }
function aiMerc(c) {
  if (!unl('camps')) return;
  if (c.mercUntil > G.time || c.gold < 380 || !heldCampNear(c)) return;
  const foes = cmds().filter(o => o.team !== c.team).flatMap(o => [o.grp[0].utype, o.grp[1].utype]);
  const u = MERCS.slice().sort((a, b) => foes.filter(f => STRONG[b].includes(f)).length - foes.filter(f => STRONG[a].includes(f)).length)[0];
  hireMerc(c, u, c.grp[0].mem.length >= c.grp[1].mem.length ? 0 : 1);
}

// ---------- per-frame bookkeeping ----------
function featTick2(dt) {
  if (G.campRings) { const v = unl('camps'); if (G.campRings[0].visible !== v) for (const r of G.campRings) r.visible = v; }
  if (unl('camps')) campTick(); undeadTick();
  G.tplT = (G.tplT || 0) - dt;
  if (G.tplT <= 0) { G.tplT = 0.25; G.tpl = [[], []]; for (const e of ents) if (e.kind === 'sol' && !e.dead && e.utype === 'templar' && e.team < 2) G.tpl[e.team].push({x:e.x, z:e.z}); }
  G.f2T = (G.f2T || 0) - dt;
  if (G.f2T <= 0) { G.f2T = 1.5; for (const c of cmds()) if (c !== player && !c.net) aiMerc(c); }
  // hire prompt next to a camp we hold
  let b = $('mercBtn');
  const show = phase === 'play' && unl('camps') && heldCampNear(player);
  if (show && !b) { b = document.createElement('button'); b.id = 'mercBtn'; b.type = 'button'; b.onclick = () => openMercs(); $('hudroot').appendChild(b); }
  if (b) { b.style.display = show ? '' : 'none'; if (show) { const txt = player.mercUntil > G.time ? `傭兵服役中・剩 ${Math.ceil(player.mercUntil - G.time)} 秒` : '傭兵營地・按 J 僱用傭兵'; if (b.dataset.t !== txt) { b.dataset.t = txt; b.innerHTML = `${icon('mercs', 26)}<span>${txt}</span>`; } } }
  if (G.talQ && G.talQ.length && !$('talent')) showTalent();
}
function drawCampsMini(mctx, Pm) {
  if (!G || !G.camps || !unl('camps')) return;
  for (const k in G.camps) {
    const cs = G.camps[k], x = Pm(cs.cp.x), y = Pm(cs.cp.z), alive = cs.mobs.length > 0;
    mctx.fillStyle = cs.owner === 0 ? C.blue : cs.owner === 1 ? C.red : alive ? C.neutral : 'rgba(150,150,150,.4)';
    mctx.beginPath();
    if (cs.cp.type === 'merc') { mctx.moveTo(x, y - 7); mctx.lineTo(x + 6, y + 5); mctx.lineTo(x - 6, y + 5); mctx.closePath(); }
    else mctx.arc(x, y, alive ? 5 : 3.5, 0, 7);
    mctx.fill();
  }
}
function campLabel(e) { return e.camp ? e.camp.n : ''; }

// ================= v1.1: building levels 1–5 =================
// Every completed building can be upgraded four times. Values are listed per level (index 0 = level 1).
const BMAX = 5;
const BLV = {
  trench:     {red:[35, 45, 50, 55, 60], mel:[0, 0, 10, 15, 20], cav:[30, 35, 40, 45, 50]},
  arrowtower: {dmg:[30, 34, 40, 46, 54], rng:[13, 14, 15, 16, 17], n2:[0, 1, 1, 2, 2]},
  cheval:     {dmg:[60, 110, 140, 170, 200], stun:[1, 1.6, 1.8, 2, 2.2], slow:[40, 45, 50, 55, 60]},
  barracks:   {rf:[0, 1, 1, 2, 2], cd:[0, 0, 15, 25, 35]},
  obelisk:    {rng:[20, 30, 35, 40, 45], spd:[15, 30, 35, 40, 50], all:[0, 0, 1, 1, 1]},
  banner:     {spd:[15, 25, 30, 35, 40], mor:[2, 4, 5, 6, 7], dmg:[0, 0, 0, 8, 12]},
  watch:      {vis:[30, 40, 45, 50, 55], mark:[0, 0, 8, 12, 15]},
  trap:       {root:[2, 3, 3.5, 4, 4.5], dmg:[40, 100, 140, 180, 220], ch:[1, 1, 1, 2, 2]},
  supply:     {heal:[3, 4.5, 5.5, 6.5, 8], r:[9, 10, 11, 12, 13], rein:[0, 1, 1, 1, 1], mor:[0, 0, 2, 3, 4]}
};
const blv = b => Math.max(1, Math.min(BMAX, b && b.lvl || 1));
const BV = (b, k) => BLV[b.type][k][blv(b) - 1];
// aura radius grows 8% per level (the supply station has its own table, the watchtower uses its vision)
function bRad(b) {
  const T = b.type, l = blv(b);
  if (T === 'supply') return BLV.supply.r[l - 1];
  if (T === 'watch') return BLV.watch.vis[l - 1];
  let r = BUILDS[T].r*(1 + 0.08*(l - 1));
  if (T === 'obelisk' && b.owner && b.owner.key === 'orion') r *= 2;
  return r;
}
const UPF = [0.6, 0.8, 1.0, 1.25];      // upgrade price as a share of the build price, for levels 2..5
const upgCostL = (type, lvl) => Math.round(BUILDS[type].cost*UPF[lvl - 1]/10)*10;
function bldEff(type, l) {
  const V = k => BLV[type][k][l - 1];
  switch (type) {
    case 'trench': return `我方步兵受遠程傷害 -${V('red')}%${V('mel') ? `、受近戰 -${V('mel')}%` : ''}，敵騎兵減速 ${V('cav')}%`;
    case 'arrowtower': return `每發 ${V('dmg')} 傷害、射程 ${V('rng')}${V('n2') ? `、每次多射 ${V('n2')} 箭` : ''}，對飛行加倍`;
    case 'cheval': return `敵軍減速 ${V('slow')}%，撞上的騎兵或衝鋒者受 ${V('dmg')} 傷害並暈眩 ${V('stun')} 秒`;
    case 'barracks': return `部隊補員從這裡出發${V('rf') ? `，每次多 ${V('rf')} 人` : ''}${V('cd') ? `，全隊補員間隔 -${V('cd')}%` : ''}`;
    case 'obelisk': return `${V('all') ? lkTxt('所有魔法兵種（法師、死靈術士、祭司）') : '法師'}射程 +${V('rng')}%、攻速 +${V('spd')}%`;
    case 'banner': return `範圍內友軍攻速 +${V('spd')}%、士氣回復 +${V('mor')}／秒${V('dmg') ? `、傷害 +${V('dmg')}%` : ''}`;
    case 'watch': return `視野 ${V('vis')}、揭露隱身、辨識兵種${V('mark') ? `，視野內敵軍受到的傷害 +${V('mark')}%` : ''}`;
    case 'trap': return `隱形；踏入的敵軍定身 ${V('root')} 秒並受 ${V('dmg')} 傷害${V('ch') > 1 ? '，可以觸發 2 次' : ''}`;
    case 'supply': return `範圍內部隊與指揮官每秒回復 ${V('heal')}% 生命${V('mor') ? `、士氣 +${V('mor')}／秒` : ''}${V('rein') ? '，也是補員點' : ''}；可在此整編`;
  }
  return '';
}
const bldShort = (type, l) => bldEff(type, l).split(/[，、；]/)[0];
const bldName = b => (blv(b) > 1 ? '★'.repeat(blv(b) - 1) + UPG[b.type].n : BUILDS[b.type].n);
function canUpg(c, b) {
  if (!unl('upg')) return `建築升級在軍階 ${rankNeed('upg')} 解鎖`;
  if (!b || b.dead || b.owner !== c) return '這不是你的建築';
  if (!b.built) return '建築還沒完工';
  if (blv(b) >= BMAX) return `已經是最高等級（${BMAX} 級）`;
  const cost = upgCostL(b.type, blv(b));
  if (c.gold < cost) return `軍資不足（需要 ${cost}）`;
  return null;
}
function upgradeBld(c, b) {
  const err = canUpg(c, b); if (err) { if (c === player) toast(err, 'r'); return false; }
  const cost = upgCostL(b.type, blv(b));
  c.gold -= cost; c.spent += cost; b.lvl = blv(b) + 1;
  b.maxHp *= 1.25; b.hp = Math.min(b.maxHp, b.hp*1.25 + b.maxHp*0.2);
  if (b.type === 'trap') b.uses = 0;
  upgVisual(b);
  if (b.team === 0 || (b.vis && b.vis[0])) { fxRing(b.x, b.z, 4.5, C.gold, 0.7); sparks(b.x, 2, b.z, '#F1D29A', 14, 5, -3); }
  if (c === player) { toast(`${BUILDS[b.type].n}升到 ${b.lvl} 級：${bldEff(b.type, b.lvl)}`, 'g'); chime(); cancelUpg(); updateHud(); }
  return true;
}
// level 2 raises a gold banner; each further level adds a star to it, grows the building a little and widens its ring
function upgVisual(b) {
  const g = b.mesh; if (!g) return;
  const l = blv(b);
  if (!b.upgFlag) {
    const gold = new THREE.MeshLambertMaterial({color:'#D9A54A', emissive:'#5A3A08'}), stone = new THREE.MeshLambertMaterial({color:'#8E8A80'});
    const flag = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 4.4, 6), new THREE.MeshLambertMaterial({color:'#5A4330'})); pole.position.y = 2.2; flag.add(pole);
    const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), gold); cloth.material.side = THREE.DoubleSide; cloth.position.set(0.62, 2.75, 0); flag.add(cloth);
    flag.position.set(b.type === 'trap' ? 0.9 : 1.7, b.type === 'watch' || b.type === 'arrowtower' ? 2.5 : 0, -1.2);
    g.add(flag);
    if (b.type === 'trench') for (let i = 0; i < 10; i++) {   // 碉堡: a ring of stone parapets
      const a = i/10*Math.PI*2, blk = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.2, 0.7), stone);
      blk.position.set(Math.sin(a)*3.4, 0.6, Math.cos(a)*3.4); blk.rotation.y = a; blk.castShadow = true; g.add(blk);
    }
    b.upgFlag = flag; b.upgStars = 0; b.upgGold = gold;
  }
  while (b.upgStars < l - 1) { const st = new THREE.Mesh(new THREE.OctahedronGeometry(0.26), b.upgGold); st.position.set(0, 3.3 + b.upgStars*0.5, 0); b.upgFlag.add(st); b.upgStars++; }
  if (!b.baseScale) b.baseScale = g.scale.x || 1;
  g.scale.setScalar(b.baseScale*(1 + 0.04*(l - 1)));
  bRing(b);
}
function bRing(b) { if (b.rr && BUILDS[b.type].r > 0) b.rr.scale.setScalar(bRad(b)/Math.min(BUILDS[b.type].r, 30)); }
function toggleUpg() {
  if (phase !== 'play' || lockedMsg('upg')) return;
  if (G.upg) { cancelUpg(); return; }
  cancelAim(); cancelOAim(); cancelPlace(); cancelDemo();
  if (!ents.some(e => e.kind === 'bld' && !e.dead && e.owner === player && e.built && blv(e) < BMAX)) { toast(`目前沒有可升級的建築（需要已完工、還沒到 ${BMAX} 級）`, 'r'); return; }
  G.upg = true; updateAimHud();
}
function aiUpg(c) {
  if (!unl('upg')) return;
  if (c.gold < 400) return;
  const pref = ['arrowtower', 'trench', 'supply', 'barracks', 'banner', 'obelisk', 'cheval', 'watch', 'trap'];
  const bs = ents.filter(e => e.kind === 'bld' && !e.dead && e.owner === c && e.built && blv(e) < BMAX).sort((a, b) => blv(a) - blv(b) || pref.indexOf(a.type) - pref.indexOf(b.type));
  if (bs.length && c.gold - upgCostL(bs[0].type, blv(bs[0])) >= 250) upgradeBld(c, bs[0]);
}
// extra arrows from upgraded arrow towers, each at a different nearby target
function towerExtra(b, t, n) {
  const R = BV(b, 'rng'), hit = new Set([t]);
  for (let k = 0; k < n; k++) {
    let best = null, bd = R*R;
    for (const e of ents) {
      if (hit.has(e) || e.dead || e.team === b.team || e.team > 1 || !(e.kind === 'sol' || e.kind === 'min' || (e.kind === 'cmd' && e.respawn <= 0)) || !e.vis[b.team]) continue;
      const d = (e.x - b.x)**2 + (e.z - b.z)**2; if (d < bd) { bd = d; best = e; }
    }
    if (!best) return;
    hit.add(best); doAttack(b, best);
  }
}
// buildings of each side, refreshed once per simulation step (aura checks run thousands of times a second)
function bldTick() {
  G.bl = [[], []];
  for (const e of ents) if (e.kind === 'bld' && !e.dead && e.built && e.team < 2) G.bl[e.team].push(e);
}
// marked by an enemy watchtower (level 3+): takes more damage
function watchMark(t) {
  if (!G || !G.bl || t.team > 1) return 1;
  for (const w of G.bl[1 - t.team]) if (w.type === 'watch' && blv(w) >= 3) { const r = BV(w, 'vis'); if ((w.x - t.x)**2 + (w.z - t.z)**2 < r*r) return 1 + BV(w, 'mark')/100; }
  return 1;
}
// green sparkles on units being healed by a supply station / field hospital (visible feedback for the healing)
function supplyFx(dt) {
  G.sfxT = (G.sfxT || 0) - dt; if (G.sfxT > 0) return; G.sfxT = 0.35;
  for (const b of ents) {
    if (b.kind !== 'bld' || b.type !== 'supply' || b.dead || !b.built || !(b.team === 0 || b.vis[0])) continue;
    const r = bRad(b);
    b.pulseT = (b.pulseT || 0) - 0.35; if (b.pulseT <= 0) { b.pulseT = 2.4; fxRing(b.x, b.z, r, '#7CD08A', 1.2, 0.35); }
    for (const e of ents) {
      if (e.dead || e.team !== b.team || !(e.kind === 'sol' || e.kind === 'cmd') || (e.kind === 'cmd' && e.respawn > 0) || e.hp >= e.maxHp - 0.5) continue;
      if ((e.x - b.x)**2 + (e.z - b.z)**2 < r*r && Math.random() < 0.5) sparks(e.x, 1.2, e.z, '#9FE0A0', 2, 1.6, -3, 1);
    }
  }
}
function bldHurt(t, src) {
  let m = watchMark(t);
  if (src && src.kind === 'sol' && src.team < 2) { const bn = inAura(src.team, src.x, src.z, 'banner'); if (bn && BV(bn, 'dmg')) m *= 1 + BV(bn, 'dmg')/100; }
  return m;
}

// ================= v1.2: reputation (聲望) and cosmetic skins =================
// Reputation is earned by finishing matches (more for wins) and buys commander and unit skins.
// The profile lives in this browser's localStorage.
// each skin repaints the model's texture: cloth (the team-coloured parts), metal and leather get new colours, skin and faces stay
const SKINS = {
  valen_gold:  {c:'valen',  n:'黃金聖騎',   cloth:'#F4EAD0', metal:'#F0BE48', leather:'#A06A20', fx:'#FFD36A', p:'halo',   price:2500},
  valen_frost: {c:'valen',  n:'寒冰公爵',   cloth:'#D6ECFF', metal:'#CFEFFF', leather:'#4A6A8A', fx:'#9AD8FF', p:'frost',  price:1500},
  sylvie_jade: {c:'sylvie', n:'翡翠林后',   cloth:'#3FA060', metal:'#D8C070', leather:'#5A3A1A', fx:'#7EE08E', p:'leaf',   price:1500},
  sylvie_moon: {c:'sylvie', n:'月影遊俠',   cloth:'#3C3C78', metal:'#E0E4F4', leather:'#2A2A3A', fx:'#C9C9FF', p:'moon',   price:2500},
  orion_star:  {c:'orion',  n:'星界大賢者', cloth:'#4A2A90', metal:'#F0CC60', leather:'#2A1A40', fx:'#B596FF', p:'star',   price:2500},
  orion_fire:  {c:'orion',  n:'烈焰術士',   cloth:'#B0281A', metal:'#FFA040', leather:'#3A1A10', fx:'#FF8A3C', p:'flame',  price:1500},
  gru_frost:   {c:'gru',    n:'冰原狼王',   cloth:'#EEF4FA', metal:'#A8D4F0', leather:'#8A9AAA', fx:'#9AD8FF', p:'frost',  price:1500},
  gru_blood:   {c:'gru',    n:'血月獸王',   cloth:'#6E1018', metal:'#3A3A40', leather:'#2A1414', fx:'#FF5050', p:'blood',  price:2500},
  brand_gold:  {c:'brand',  n:'黃金機匠',   cloth:'#E8D4A0', metal:'#F0BE48', leather:'#7A4A1A', fx:'#FFD36A', p:'spark',  price:1500},
  brand_lava:  {c:'brand',  n:'熔岩巨匠',   cloth:'#2E2626', metal:'#FF7020', leather:'#1E1818', fx:'#FF7A2C', p:'flame',  price:2500},
  raven_blood: {c:'raven',  n:'血鴉',       cloth:'#5A0E16', metal:'#2A2A30', leather:'#1A1012', fx:'#D23C3C', p:'shadow', price:1500},
  raven_frost: {c:'raven',  n:'霜鴉',       cloth:'#E6F2FC', metal:'#9CCCF0', leather:'#5A6A7A', fx:'#9AD8FF', p:'frost',  price:2500}
};
// unit skins keep the team colour (brighter or darker) so squads stay easy to tell apart
const USKIN = {gold:{n:'金甲禁衛', clothMul:1.2, metal:'#F0BE48', leather:'#D0A040', price:600}, dark:{n:'玄甲夜軍', clothMul:0.42, metal:'#3E4252', leather:'#1A1818', price:600}};
const SKU = () => ALLU.concat(MERCS);                     // unit types that can wear a skin
const uSkinId = (u, v) => u + ':' + v;
const skinOk = id => typeof id === 'string' && (SKINS[id] || /^[a-z]+:(gold|dark)$/.test(id) && USKIN[id.split(':')[1]]);

// ---------- profile ----------
const PROF_KEY = 'fhwz-profile';
const PROF0 = () => ({rep:0, own:[], eqC:{}, eqU:{}, fw:'', games:0, wins:0});
let PROF = (() => { try { const p = JSON.parse(localStorage.getItem(PROF_KEY) || 'null'); if (p && typeof p.rep === 'number') return Object.assign(PROF0(), p); } catch (e) {} return PROF0(); })();
function saveProf() { try { localStorage.setItem(PROF_KEY, JSON.stringify(PROF)); } catch (e) {} }
const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const owns = id => PROF.own.includes(id);
// what this browser's player wears: {c: commander skin, u: {unitType: skin}}
function mySkins(key) {
  const u = {}; for (const t in PROF.eqU) if (owns(PROF.eqU[t])) u[t] = PROF.eqU[t];
  return {c:owns(PROF.eqC[key]) ? PROF.eqC[key] : '', u};
}

// ---------- rewards ----------
// 勝 100、敗 30；線上對戰 ×1.5；強化敵方 AI 的單人勝場 +50%；MVP +30；每日首勝 +100
function repReward(win, mvpMe) {
  if (!G || G.repDone || G.tut || !player) return G && G.repR || null;
  G.repDone = true;
  const online = !!NET.client, L = [];
  L.push([win ? '勝利' : '完成對戰', win ? 100 : 30]);
  if (online) L.push(['線上對戰加成', win ? 50 : 15]);
  else if (win && G.flv >= 6) L.push(['高階對手', 50]);
  if (mvpMe) L.push(['本場 MVP', 30]);
  if (win && PROF.fw !== today()) { PROF.fw = today(); L.push(['每日首勝', 100]); }
  const sum = L.reduce((a, b) => a + b[1], 0);
  PROF.rep += sum; PROF.games++; if (win) PROF.wins++; saveProf();
  return (G.repR = {L, sum});
}
function repHtml(R) {
  if (!R) return '';
  return `<div class="repbox">${glyph('rep', 34, C.gold)}<div><div class="kick">獲得聲望</div><div class="rv">+${R.sum}</div><div class="rl">${R.L.map(x => `${x[0]} +${x[1]}`).join('・')}</div></div><div class="rt">目前聲望 <b>${PROF.rep}</b><button type="button" class="go alt" id="toShop">${glyph('rep', 18, C.gold)}軍需商店</button></div></div>`;
}

// ---------- applying a skin to a model ----------
const skinDef = id => SKINS[id] || USKIN[id.split(':')[1]];
const hx3 = h => [parseInt(h.slice(1, 3), 16)/255, parseInt(h.slice(3, 5), 16)/255, parseInt(h.slice(5, 7), 16)/255];
// the two team atlases differ exactly where the team colour is painted: that difference is the "cloth" mask
let SKB = null;
function skinBase() {
  if (SKB) return SKB;
  const N = 1024, read = img => { const cv = document.createElement('canvas'); cv.width = cv.height = N; const x = cv.getContext('2d'); x.drawImage(img, 0, 0, N, N); return x.getImageData(0, 0, N, N).data; };
  const A = [read(ART.unitMat[0].map.image), read(ART.unitMat[1].map.image)], wc = new Float32Array(N*N);
  for (let i = 0, j = 0; i < wc.length; i++, j += 4) { const d = Math.abs(A[0][j] - A[1][j]) + Math.abs(A[0][j + 1] - A[1][j + 1]) + Math.abs(A[0][j + 2] - A[1][j + 2]); wc[i] = Math.min(1, Math.max(0, (d - 30)/50)); }
  return (SKB = {N, A, wc});
}
const SKTEX = new Map();
function skinTex(team, id) {
  const key = team + id; if (SKTEX.has(key)) return SKTEX.get(key);
  const S = skinDef(id), B = skinBase(), N = B.N, src = B.A[team], cv = document.createElement('canvas'); cv.width = cv.height = N;
  const x = cv.getContext('2d'), out = x.createImageData(N, N), o = out.data;
  const C = S.cloth && hx3(S.cloth), M = S.metal && hx3(S.metal), L = S.leather && hx3(S.leather), cm = S.clothMul || 0;
  for (let i = 0, j = 0; i < B.wc.length; i++, j += 4) {
    let r = src[j]/255, g = src[j + 1]/255, b = src[j + 2]/255;
    const lum = 0.3*r + 0.59*g + 0.11*b, mx = Math.max(r, g, b), mn = Math.min(r, g, b), sat = (mx - mn)/(mx + 0.001);
    const row = Math.floor(i/N)/N, band = row >= 0.5 && row < 0.75, wc = B.wc[i];   // band: bodies and faces, never repainted
    if (C) { const k = Math.min(1.3, Math.max(0.12, lum*2.3)); r += (C[0]*k - r)*wc; g += (C[1]*k - g)*wc; b += (C[2]*k - b)*wc; }
    else if (cm) { const f = 1 + (cm - 1)*wc; r *= f; g *= f; b *= f; }
    const wm = band ? 0 : Math.min(1, Math.max(0, (0.22 - sat)/0.08))*Math.min(1, Math.max(0, (lum - 0.26)/0.1))*(1 - wc);
    if (M && wm > 0) { const k = Math.min(1.35, lum*1.45); r += (M[0]*k - r)*wm; g += (M[1]*k - g)*wm; b += (M[2]*k - b)*wm; }
    if (L && !band && sat > 0.2 && src[j] > src[j + 1] && src[j + 1] > src[j + 2]) { const w = 0.7*(1 - wc)*(1 - wm), k = Math.min(1.2, lum*3); r += (L[0]*k - r)*w; g += (L[1]*k - g)*w; b += (L[2]*k - b)*w; }
    o[j] = r*255; o[j + 1] = g*255; o[j + 2] = b*255; o[j + 3] = 255;
  }
  x.putImageData(out, 0, 0);
  const t = new THREE.CanvasTexture(cv), m0 = ART.unitMat[team].map; t.flipY = m0.flipY; t.encoding = m0.encoding; t.anisotropy = 4; t.wrapS = m0.wrapS; t.wrapT = m0.wrapT;
  SKTEX.set(key, t); return t;
}
const SKMAT = new Map();
function skinMat(m, id, team) {
  const k = m.uuid + id + team; if (SKMAT.has(k)) return SKMAT.get(k);
  const n = m.clone(), S = skinDef(id);
  if (typeof ART !== 'undefined' && ART.ready && m.map && (m.map === ART.unitMat[0].map || m.map === ART.unitMat[1].map)) n.map = skinTex(m.map === ART.unitMat[1].map ? 1 : 0, id);
  else if (n.color && !m.map) n.color.lerp(new THREE.Color(S.cloth || S.metal), 0.4);   // simple models (art not loaded, mounts, machines)
  SKMAT.set(k, n); return n;
}
function applySkin(mesh, id) {
  if (SVR || !mesh || !id || !skinOk(id)) return mesh;
  try {
    mesh.traverse(o => {
      if (!o.isMesh || !o.material || o.userData.skinFx) return;
      o.material = Array.isArray(o.material) ? o.material.map(m => skinMat(m, id)) : skinMat(o.material, id);
    });
  } catch (e) { console.warn('skin', id, e); }
  const S = SKINS[id];
  if (S) {   // commander skins also get a glowing ring at the feet, and a halo for the gold paladin
    const ringM = new THREE.Mesh(new THREE.RingGeometry(1.15, 1.45, 40), new THREE.MeshBasicMaterial({color:S.fx, transparent:true, opacity:0.55, depthWrite:false, side:THREE.DoubleSide}));
    ringM.rotation.x = -Math.PI/2; ringM.position.y = 0.06; ringM.userData.skinFx = true; mesh.add(ringM);
    if (S.p === 'halo') { const h = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.06, 6, 24), new THREE.MeshBasicMaterial({color:'#FFE6A0'})); h.rotation.x = Math.PI/2; h.position.y = 3.3; h.userData.skinFx = true; mesh.add(h); }
    mesh.userData.skinFx = {c:S.fx, p:S.p, ring:ringM, t:0};
  }
  return mesh;
}
// particles drifting around skinned commanders
function skinFx(dt) {
  if (!G) return;
  for (const e of ents) {
    if (e.kind !== 'cmd' || e.dead || e.respawn > 0 || !e.mesh || !e.mesh.userData.skinFx || !(e.team === 0 || e.vis[0]) || e.stealth) continue;
    const F = e.mesh.userData.skinFx;
    F.ring.rotation.z += dt*0.8; F.ring.material.opacity = 0.42 + Math.sin(G.time*3 + e.id)*0.14;
    F.t -= dt; if (F.t > 0) continue; F.t = F.p === 'shadow' ? 0.12 : 0.2;
    const a = Math.random()*Math.PI*2, r = 0.6 + Math.random()*0.8;
    sparks(e.x + Math.sin(a)*r, 0.6 + Math.random()*2.4, e.z + Math.cos(a)*r, F.c, F.p === 'star' || F.p === 'spark' ? 2 : 1, F.p === 'flame' ? 1.6 : 1, F.p === 'leaf' || F.p === 'frost' ? -1.5 : F.p === 'shadow' ? -0.5 : -3, F.p === 'shadow' ? 1.3 : 0.8);
  }
}
// commanders: the player's choice (or another player's online); AI commanders sometimes show off a skin
function skinCmd(c) {
  if (c.sk === undefined) {
    if (c === player) { const s = mySkins(c.key); c.sk = s.c; c.skU = s.u; }
    else if (!c.net) { const own = Object.keys(SKINS).filter(id => SKINS[id].c === c.key); c.sk = Math.random() < 0.35 ? pick(own) : ''; c.skU = {}; if (Math.random() < 0.3) { const v = Math.random() < 0.5 ? 'gold' : 'dark'; for (const u of SKU()) c.skU[u] = uSkinId(u, v); } }
  }
  if (c.sk && c.mesh) applySkin(c.mesh, c.sk);
}
const soldierSkin = (c, type) => c && c.skU && c.skU[type] || '';

// ---------- shop (lobby tab) ----------
let shopPrev = null;     // skin being previewed on the lobby stage
let shopTab = 'cmd';    // 'cmd' | 'unit'
function drawShop(P2, cap) {
  const isC = shopTab === 'cmd', k = lsel.cmd, u = lsel.unit;
  // what the stage shows: the previewed skin, else what is equipped
  const eqC = owns(PROF.eqC[k]) ? PROF.eqC[k] : '', eqU = owns(PROF.eqU[u]) ? PROF.eqU[u] : '';
  const pv = shopPrev === 'none' ? '' : shopPrev || (isC ? eqC : eqU);
  if (isC) showModel('cmd', k, pv); else showModel('unit', u, pv);
  const who = isC ? CMDS[k].n : UNITS[u].n;
  const pvName = !pv ? '原始造型' : isC ? SKINS[pv].n : USKIN[pv.split(':')[1]].n;
  cap.innerHTML = `<div class="t">外觀預覽</div><div class="n">${who}・${pvName}</div><div class="hint">拖曳旋轉模型</div>`;
  // one row per look: swatch, name, state, action
  const row = (id, nm, price, sw, eqd, ownd) => {
    const on = (pv || '') === id;
    const act = eqd ? '<span class="shst eq">使用中</span>'
      : ownd ? `<button type="button" class="go alt shb" data-eq="${id}">使用</button>`
      : `<button type="button" class="go shb ${PROF.rep < price ? 'poor' : ''}" data-buy="${id}">${glyph('rep', 15, '#1A1408')}${price}</button>`;
    return `<div class="shr ${on ? 'on' : ''} ${eqd ? 'eqd' : ''}"><button type="button" class="shp" data-pv="${id || 'none'}"><span class="shsw" style="background:${sw}"></span><span class="shn"><b>${nm}</b><small>${eqd ? '目前穿著' : ownd ? '已擁有' : on ? '預覽中' : '點一下預覽'}</small></span></button>${act}</div>`;
  };
  let pick, rows;
  if (isC) {
    pick = `<div class="pick">${CKEYS.map(c => `<button type="button" class="pk ${c === k ? 'on' : ''}" data-sc="${c}">${icon(c, 40)}<span>${CMDS[c].n}</span>${Object.keys(SKINS).some(id => SKINS[id].c === c && owns(id)) ? '<small class="own">已有外觀</small>' : ''}</button>`).join('')}</div>`;
    rows = row('', '原始造型', 0, '#5A6070', !eqC, true) + Object.keys(SKINS).filter(id => SKINS[id].c === k).map(id => row(id, SKINS[id].n, SKINS[id].price, SKINS[id].cloth, eqC === id, owns(id))).join('');
  } else {
    pick = `<div class="pick upick">${SKU().map(v => `<button type="button" class="pk ${v === u ? 'on' : ''}" data-su="${v}">${icon(v, 34)}<span>${UNITS[v].n}</span></button>`).join('')}</div>`;
    rows = row('', '原始造型', 0, '#5A6070', !eqU, true) + Object.keys(USKIN).map(v => { const id = uSkinId(u, v); return row(id, USKIN[v].n, USKIN[v].price, USKIN[v].metal, eqU === id, owns(id)); }).join('');
  }
  P2.innerHTML = `<div><div class="kick">軍需商店・外觀只改變造型，不影響能力</div>
     <div class="shtop"><h2>${glyph('rep', 30, C.gold)}${PROF.rep}<small>聲望</small></h2><details class="shhow"><summary>怎麼獲得聲望？</summary><p>每場對戰結束都會獲得：勝利 100、完成對戰 30、線上對戰再加 50%、MVP +30、每日首勝 +100。聲望與外觀存在這個瀏覽器裡。</p></details></div></div>
    <div class="seg" role="tablist"><button type="button" role="tab" aria-selected="${isC}" class="${isC ? 'on' : ''}" data-st="cmd">指揮官外觀</button><button type="button" role="tab" aria-selected="${!isC}" class="${isC ? '' : 'on'}" data-st="unit">兵種外觀</button></div>
    <section class="shsec"><div class="kick">1．選擇${isC ? '指揮官' : '兵種'}</div>${pick}</section>
    <section class="shsec"><div class="kick">2．${who}的外觀${isC ? '' : '<span class="shnote">套用到你這個兵種的所有士兵</span>'}</div><div class="shlist">${rows}</div></section>`;
  P2.querySelectorAll('[data-st]').forEach(b => b.onclick = () => { shopTab = b.dataset.st; shopPrev = null; drawLobbyPanel(); });
  P2.querySelectorAll('[data-sc]').forEach(b => b.onclick = () => { lsel.cmd = b.dataset.sc; shopPrev = null; drawLobbyPanel(); });
  P2.querySelectorAll('[data-su]').forEach(b => b.onclick = () => { lsel.unit = b.dataset.su; shopPrev = null; drawLobbyPanel(); });
  P2.querySelectorAll('[data-pv]').forEach(b => b.onclick = () => { shopPrev = b.dataset.pv; drawLobbyPanel(); });
  P2.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => {
    const id = b.dataset.buy, S = SKINS[id] || USKIN[id.split(':')[1]];
    if (PROF.rep < S.price) { toast(`聲望不足：還差 ${S.price - PROF.rep}`, 'r'); shopPrev = id; drawLobbyPanel(); return; }
    PROF.rep -= S.price; PROF.own.push(id);
    if (SKINS[id]) PROF.eqC[SKINS[id].c] = id; else PROF.eqU[id.split(':')[0]] = id;
    saveProf(); chime(); toast(`購買並換上「${SKINS[id] ? S.n : UNITS[id.split(':')[0]].n + '・' + S.n}」`, 'g'); shopPrev = null; drawLobbyPanel();
  });
  P2.querySelectorAll('[data-eq]').forEach(b => b.onclick = () => {
    const id = b.dataset.eq;
    if (isC) { if (id) PROF.eqC[k] = id; else delete PROF.eqC[k]; }
    else { if (id) PROF.eqU[u] = id; else delete PROF.eqU[u]; }
    saveProf(); shopPrev = null; drawLobbyPanel();
  });
}

// ================= v1.4: commander rank (指揮官軍階) — features unlock step by step =================
// The player's rank is kept in this browser's profile. Each match runs at a feature level (G.flv): the player's rank in
// single player, the lowest rank among the humans online. Everything above that level is off for every commander,
// AI included, and the AI strength on both sides follows the level too.
const RANKS = [
  {n:'見習指揮官', xp:0,    foe:0.8, ally:1.1, smart:false, u:['o:advance', 'o:hold', 'o:rally', 'o:retreat', 'o:move', 'o:focus', 'q', 'reform', 'b:arrowtower', 'b:supply', 'b:barracks', 'upg', 'unit:pike', 'unit:shield', 'unit:archer', 'cmd:valen', 'cmd:sylvie', 'cmd:gru']},
  {n:'百夫長',     xp:100,  foe:0.9, ally:1.1, smart:false, u:['r', 'unit:cav', 'unit:priest', 'team', 'deploy', 'cmd:brand']},
  {n:'千夫長',     xp:250,  foe:1, ally:1.05, smart:false, u:['uskill', 'form', 'o:charge', 'b:trench', 'b:cheval', 'online']},
  {n:'騎士隊長',   xp:450,  foe:1, ally:1, smart:false, u:['b:banner', 'b:watch', 'unit:mage', 'unit:scout', 'cmd:orion', 'obj']},
  {n:'軍團長',     xp:750,  foe:1, ally:1, smart:true, u:['e', 'armory', 'unit:griffin', 'unit:siege', 'cmd:raven', 'o:ambush']},
  {n:'將軍',       xp:1100, foe:1.05, ally:1, smart:true, u:['talent', 'b:obelisk', 'b:trap']},
  {n:'大將軍',     xp:1550, foe:1.1, ally:1, smart:true, u:['camps', 'faction']},
  {n:'元帥',       xp:2100, foe:1.2, ally:1, smart:true, u:[]}
];
const RMAX = RANKS.length;
// what each unlock key means on the rank screen
const UNLN = {q:'Q 技能', r:'R 技能', e:'6 級大招（E）', uskill:'兵種技能（F／G）', form:'陣形（4–8）', team:'隊友支援與分路', deploy:'戰術部署（空白鍵）',
  online:'線上對戰', reform:'整編（T）', obj:'中立目標：遠古泰坦、深淵巨龍', armory:'軍械庫（U）', talent:'指揮官天賦', upg:'建築升級（L）', camps:'野區營地與傭兵（J）', faction:'兩國專屬兵種'};
function unlName(k) {
  const [a, b] = k.split(':');
  if (a === 'o') return `指令「${ONAME[b]}」`;
  if (a === 'unit') return `兵種「${UNITS[b].n}」`;
  if (a === 'b') return `建築「${BUILDS[b].n}」`;
  if (a === 'cmd') return `指揮官「${CMDS[b].n}」`;
  return UNLN[k] || k;
}
const RUNL = {};    // unlock key -> rank (1-based)
RANKS.forEach((R, i) => { for (const k of R.u) RUNL[k] = i + 1; });
const rankNeed = k => RUNL[k] || (k.startsWith('unit:') && FUNITS.flat().includes(k.slice(5)) ? RUNL.faction : k.startsWith('unit:') && MERCS.includes(k.slice(5)) ? RUNL.camps : 1);

// ---------- the player's rank ----------
const PROFR = () => { if (typeof PROF.rxp !== 'number') PROF.rxp = 0; return PROF; };
function myRank() { if (PROFR().vet) return RMAX; let r = 1; for (let i = 0; i < RMAX; i++) if (PROF.rxp >= RANKS[i].xp) r = i + 1; return r; }
const trueRank = () => { let r = 1; for (let i = 0; i < RMAX; i++) if (PROFR().rxp >= RANKS[i].xp) r = i + 1; return r; };
// feature level of what is on screen now: the running match, or the player's rank in the lobby
const flv = () => (G && G.flv) || myRank();
const unl = k => rankNeed(k) <= flv();
const unlMe = k => rankNeed(k) <= myRank();
// a locked hotkey does nothing in a match: no hint about features the player doesn't have yet
function lockedMsg(k) { if (unl(k)) return false; if (phase === 'lobby') toast(`${unlName(k)}在軍階 ${rankNeed(k)}「${RANKS[rankNeed(k) - 1].n}」解鎖`, 'r'); return true; }
const unitOk = u => unl('unit:' + u);

// ---------- AI strength per level ----------
function rankAI(c, isAlly) {
  const R = RANKS[(G.flv || RMAX) - 1];
  if (isAlly) { c.smart = true; c.elite = R.ally; }
  else { c.smart = R.smart; c.elite = R.foe; }
}

// ---------- rank experience after a match ----------
// 勝 100、敗 50、MVP +20；教學不計
function rankReward(win, mvpMe) {
  if (!G || G.rankDone || G.tut || !player) return G && G.rankR || null;
  G.rankDone = true;
  const before = trueRank(), gain = (win ? 100 : 50) + (mvpMe ? 20 : 0);
  PROFR().rxp += gain; saveProf();
  const after = trueRank(), nu = [];
  for (let r = before + 1; r <= after; r++) nu.push(...RANKS[r - 1].u);
  return (G.rankR = {gain, before, after, nu});
}
function rankBar() {
  const r = trueRank(), R = RANKS[r - 1], N = RANKS[r], xp = PROFR().rxp;
  const pct = N ? Math.round((xp - R.xp)/(N.xp - R.xp)*100) : 100;
  return `<div class="rankc"><div class="rk">${r}</div><div style="flex:1"><div class="kick">指揮官軍階</div><b>${R.n}</b>${PROF.vet ? '<small>（已解鎖全部功能）</small>' : ''}
    <div class="rbar"><i style="width:${pct}%"></i></div><small>${N ? `${xp - R.xp}／${N.xp - R.xp}・下一階「${N.n}」解鎖：${N.u.map(unlName).join('、') || 'AI 對手更強'}` : '已達最高軍階'}</small></div></div>`;
}
function rankHtml(RR) {
  if (!RR) return '';
  const up = RR.after > RR.before;
  return `<div class="repbox rankup">${glyph('banner', 34, C.gold)}<div style="flex:1"><div class="kick">軍階經驗</div><div class="rv">+${RR.gain}</div>
    ${up ? `<div class="rl" style="color:var(--gold);font-size:14px">晉升為「${RANKS[RR.after - 1].n}」（軍階 ${RR.after}）！新開放：${RR.nu.map(unlName).join('、') || 'AI 對手更強'}</div>` : `<div class="rl">${rankBar().replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 90)}</div>`}</div></div>`;
}
// at the start of a match, mention what this rank has just opened
function rankIntro() {
  if (!G || G.tut || NET.client) return;
  const r = myRank(); if (PROF.seenRank === r) return;
  PROF.seenRank = r; saveProf();
  if (r === 1) { toast('見習指揮官：先熟悉移動、右鍵派兵、Q 技能，用軍資蓋箭塔、補給站、前線兵營並升級。打完對戰會升階，逐步開放更多功能', 'b'); return; }
  const nu = RANKS[r - 1].u; if (nu.length) setTimeout(() => toast(`軍階 ${r}「${RANKS[r - 1].n}」新開放：${nu.map(unlName).join('、')}`, 'g'), 1500);
}

// ---------- rank-aware wording: never mention a feature the player can't use yet ----------
const uj = (k, s, alt = '') => (unl(k) ? s : alt);
const anyB = () => BKEYS.some(b => unl('b:' + b));
const reformWhere = () => (unl('b:supply') ? '主堡、補給站或我方據點' : '主堡或我方據點');
// strip mentions of locked units inside fixed description strings
const LKT = [['，對騎兵反擊', 'unit:cav'], ['與聖殿騎士', 'unit:templar'], ['、死靈術士', 'unit:necro'], ['與獅鷲騎士', 'unit:griffin'], ['與獅鷲', 'unit:griffin']];
const lkTxt = s => LKT.reduce((a, [w, k]) => (unl(k) ? a : a.split(w).join('')), s);
const lkTag = k => (unl(k) ? '' : `<small class="lk">軍階 ${rankNeed(k)}</small>`);
function griffinTrait() {
  const n = ['trench', 'cheval', 'trap'].filter(b => unl('b:' + b)).map(b => BUILDS[b].n);
  return n.length ? `俯衝：無視${n.length > 1 ? n.slice(0, -1).join('、') + '與' + n[n.length - 1] : n[0]}` : '俯衝：飛越地面障礙';
}
const uTrait = u => (u === 'griffin' ? griffinTrait() : lkTxt(UNITS[u].trait));
// what each passive needs before it does anything
const PDEP = {valen:() => anyB(), orion:() => unl('b:obelisk'), gru:() => unl('unit:cav')};
function passTxt(k) {
  const d = CMDS[k];
  if (k === 'valen' && !anyB()) return `${d.p}<small class="lk">建築在軍階 ${Math.min(...BKEYS.map(b => rankNeed('b:' + b)))} 開放後生效</small>`;
  if (k === 'orion' && !unl('b:obelisk')) return `${d.p}<small class="lk">方尖碑在軍階 ${rankNeed('b:obelisk')} 開放後生效</small>`;
  if (k === 'gru' && !unl('unit:griffin')) return unl('unit:cav') ? '狂野血脈：騎兵移速 +10%' : `狂野血脈：騎兵移速 +10%<small class="lk">騎兵在軍階 ${rankNeed('unit:cav')} 開放</small>`;
  return d.p;
}
function hudTip() {
  if (FINE()) {
    const ok = [['X', '駐守', 'hold'], ['B', '衝鋒', 'charge'], ['N', '集火', 'focus'], ['M', '埋伏', 'ambush']].filter(o => unl('o:' + o[2]));
    return ['右鍵：設定小隊位置（拖曳定朝向）', `${ok.map(o => o[0]).join(' ')} 後右鍵：${ok.map(o => o[1]).join('／')}`, '左鍵點士兵：選隊',
      uj('uskill', 'F / G 後右鍵：兵種技能'), 'H 說明', 'Esc 選單'].filter(Boolean).join('・');
  }
  return ['點隊伍卡片選隊', unl('deploy') ? '戰術部署模式下點地面派兵' : '點指令後再點地面派兵', '技能按鈕點一下後點地面施放'].join('；');
}
const startTip = () => `右鍵派兵${uj('uskill', '，F / G 施放兵種技能')}`;

// ---------- lobby: show what a promotion opened ----------
const UHOW = {
  r:['core', 'R 終極技能', '按 R 顯示範圍，右鍵施放。威力大、冷卻長，留給關鍵時刻'],
  e:['e_valen', '6 級大招（E）', '指揮官升到 6 級後按 E 施放第三技能'],
  uskill:['archer', '兵種技能（F／G）', '按 F／G 準備第 I／II 隊的兵種技能，地面顯示範圍後右鍵施放'],
  form:['f_wedge', '陣形（4–8）', '方陣、橫列、楔形、圓陣、散兵：楔形適合衝鋒、圓陣最耐打、橫列讓弓兵射得更遠'],
  team:['troops', '隊友支援與分路', '整軍時安排每位指揮官主攻哪一路；開戰後點左上隊友的「支援」叫他來身邊 30 秒'],
  deploy:['deploy', '戰術部署（空白鍵）', '時間放慢、鏡頭拉遠，左鍵也能派兵，適合一次下多個指令'],
  online:['core', '線上對戰', '大廳「線上對戰」：與真人對戰或合作打 AI，最多 6 人'],
  obj:['titan', '中立目標', '4 分鐘後河道出現遠古泰坦與深淵巨龍，擊倒可獲得全隊加成或巨龍替你進軍'],
  armory:['armory', '軍械庫（U）', '在主堡範圍內（或陣亡時）用軍資替兵種升級武器與護甲，各 3 級'],
  talent:['talent', '指揮官天賦', '指揮官 3、5、8 級時從兩個天賦二選一（按 9／0）'],
  upg:['upgrade', '建築升級（L）', '按 L 後右鍵點自己已完工的建築，最高升到 5 級'],
  camps:['mercs', '野區營地與傭兵（J）', '清空狼窩、石像遺跡得到增益；佔領傭兵營地後靠近按 J 僱用傭兵'],
  faction:['templar', '兩國專屬兵種', '依指揮官陣營，整軍時多出 2 種專屬兵種可選']
};
function unlCard(k) {
  const [a, b] = k.split(':');
  let ic, nm, how;
  if (a === 'o') { const O = ORDERS.find(o => o[0] === b); ic = b; nm = `指令「${O[1]}」`; how = `${/^[a-z]$/.test(O[2]) ? `按 ${O[2].toUpperCase()}：` : ''}${O[3]}`; }
  else if (a === 'unit') { ic = b; nm = `兵種「${UNITS[b].n}」`; how = `${UNITS[b].cls}・${uTrait(b)}。整軍與整編時可選`; }
  else if (a === 'cmd') { ic = b; nm = `指揮官「${CMDS[b].n}」`; how = `${CMDS[b].t}・${CMDS[b].fac}。出征時可選`; }
  else if (a === 'b') { ic = b; nm = `建築「${BUILDS[b].n}」`; how = `${BUILDS[b].d}。${BUILDS[b].cost} 軍資，點下方建造列放置`; }
  else { const H = UHOW[k] || ['core', unlName(k), '']; ic = k === 'e' ? 'e_' + (lsel.cmd || 'valen') : H[0]; nm = H[1]; how = H[2]; }
  return `<div class="ucard">${icon(ic, 46)}<div><b>${nm}</b><small>${how}</small></div></div>`;
}
function rankUpModal() {
  const now = trueRank();
  if (typeof PROFR().seenLobby !== 'number') { PROF.seenLobby = now; saveProf(); return false; }
  if (PROF.vet || now <= PROF.seenLobby) { if (now > PROF.seenLobby) { PROF.seenLobby = now; saveProf(); } return false; }
  const from = PROF.seenLobby;
  let body = '';
  for (let r = from + 1; r <= now; r++) {
    const R = RANKS[r - 1], P = RANKS[r - 2];
    const ai = R.foe !== P.foe || R.smart !== P.smart ? `<p class="aiup">AI 對手變強${R.smart && !P.smart ? '，也會開始用埋伏、集火等戰術' : ''}</p>` : '';
    body += `<h2>軍階 ${r}「${R.n}」</h2>${R.u.length ? `<div class="ucards">${R.u.map(unlCard).join('')}</div>` : ''}${ai}`;
  }
  modal.innerHTML = `<div class="sheet rankup-m"><div style="display:flex;gap:14px;align-items:center"><div class="rk big">${now}</div><div><span class="kick">晉升</span><h1>你晉升為「${RANKS[now - 1].n}」</h1><p>以下內容已經開放，下一場對戰就能使用。</p></div></div>
    ${body}<div class="bar"><button type="button" class="go" id="okRU">${glyph('advance', 20, '#1A1408')}知道了</button></div></div>`;
  modal.classList.add('show');
  $('okRU').onclick = () => { PROF.seenLobby = now; PROF.seenRank = now; saveProf(); closeModal(); drawLobbyPanel(); };
  try { chime(); } catch (e) {}
  return true;
}

// ================= v1.0: online multiplayer =================
// One authoritative simulation runs on the Node server (server/server.js loads this same file with globalThis.NETSV set).
// Browsers send commands, receive ~10 snapshots a second and only render. A client on the red team sees the map
// rotated 180° with its own side shown as blue at the bottom-left, so every existing view of the game (fog, HUD,
// minimap, "我方/敵方") keeps working unchanged; positions, teams and lanes are mirrored on the way in and out.
const SVR = globalThis.NETSV || null;
const NET = {client:false, team:0, mirror:false, ws:null, url:'', name:'', id:null, room:null, you:null, ents:new Map(), zmap:new Map(), lastSend:0, mv:{x:0, z:0}, rpickS:'', snapN:0, hp:new Map()};
const NET_VER = '1.3.5';      // must match the server's copy of the game
const NET_URL_DEFAULT = '';   // build_itch.py can bake the server address in
const MIRL = {top:'bot', mid:'mid', bot:'top'};
const CAMPMIR = {wolfB:'wolfR', wolfR:'wolfB', golemB:'golemR', golemR:'golemB', mercN:'mercS', mercS:'mercN'};
const objHome = key => { const h = key === 'titan' ? {x:-48, z:-48} : {x:48, z:48}; return NET.mirror ? {x:-h.x, z:-h.z} : h; };

// ---------- helpers shared by both sides ----------
// isMe(c): on the server, routes the next toast or floater to that remote player; in single player it is just c === player
function isMe(c) { if (!SVR) return c === player; if (c && c.net) { SVR.who = c; return true; } return false; }
// a notice written for one side ("敵方…" means that side's enemy)
function tToast(t, msg, cls) { if (SVR) SVR.toasts.push([msg, cls || '', 2, t]); else if (t === 0) toast(msg, cls); }
// the human an AI ally should help (whoever asked for support, else the nearest teammate)
function netLead(c) {
  if (c.supportC && c.supportC.net && c.supportUntil > G.time && c.supportC.respawn <= 0) return c.supportC;
  let b = player, bd = 1e9; for (const o of cmds()) if (o.net && o.team === c.team && o.respawn <= 0) { const d = (o.x - c.x)**2 + (o.z - c.z)**2; if (d < bd) { bd = d; b = o; } }
  return b;
}
function netDrop() { try { if (NET.ws) { netSend({t:'leave'}); NET.ws.onclose = null; NET.ws.close(); } } catch (e) {} NET.ws = null; NET.client = false; NET.mirror = false; NET.room = null; player = null; const b = $('netBox'); if (b) b.remove(); }
if (SVR) {   // the server never draws: skip particle, corpse and model work
  sparks = () => {}; fxRing = () => {}; shake = () => {}; artCorpse = () => false;
  const M = () => SVR.mesh();
  mkCommander = M; mkSoldier = M; mkMinion = M; mkTower = M; mkCore = M; mkBuilding = M; mkDragon = M; mkTitan = M; bake = m => m;
  SVR.api = {netStartServer, netSnap, netFull, netPriv, netCmd, update:dt => update(dt), cmds:() => cmds(), get G() { return G; }, get phase() { return phase; },
    cmdOf:cid => cmds().find(c => c.cid === cid) || null, hurt:(t, d) => hurt(t, d, null), get ents() { return ents; },
    leave(cid) { const c = cmds().find(o => o.cid === cid); if (!c) return; c.net = false; c.smart = true; c.netMv = null; if (c.talQ) { for (const t of c.talQ) applyTal(c, t, Math.random() < 0.5 ? 0 : 1); c.talQ = []; } if (phase === 'muster' && !c.mpick) c.mpick = AIFAV[c.key].map(u => unitOk(u) ? u : unitsFor(c)[0]); },
    back(cid) { const c = cmds().find(o => o.cid === cid); if (!c) return null; c.net = true; c.smart = false; c.netMv = null; c.supportUntil = 0; return c; }};
}

// ---------- server side ----------
function netDummy() {
  return {kind:'cmd', key:'valen', team:9, x:9999, z:9999, hp:1, maxHp:1, respawn:0, dead:false, isP:false, grp:[newGrp(), newGrp()], lvl:1, xp:0, tal:[], arm:{}, vis:[false, false], gold:0, spent:0, builds:0, st:{kills:0, deaths:0, solK:0, solL:0, towers:0, dmg:0}, qT:0, rT:0, eT:0, facing:0, faceS:0};
}
function netStartServer(lineup) {
  newGame(lineup[0].key, lineup);
  Object.assign(SVR, {known:new Map(), toasts:[], ptoasts:[], shots:[], zid:0, ctx:null, who:null, mute:false, over:null});
  // floaters on the server belong to one player (or to nobody, and are dropped)
  floaters.push = function (f) { if (f.w === undefined) { f.w = SVR.ctx || (SVR.who && SVR.who.cid) || null; SVR.who = null; } return Array.prototype.push.call(this, f); };
}
function netMusterDone() {
  for (const c of cmds()) if (c.net && !c.grp[0].utype) { const fav = AIFAV[c.key].map(u => unitOk(u) ? u : unitsFor(c)[0]), a = c.mpick && c.mpick[0] || fav[0]; c.grp[0].utype = a; c.grp[1].utype = c.mpick && c.mpick[1] || a; }
  for (const c of cmds()) { spawnSquad(c, 0); spawnSquad(c, 1); }
  phase = 'play'; G.waveT = 3; groupFrame(0);
}
const NR1 = v => Math.round(v*10)/10;
function netDesc(e) {
  const d = {i:e.id, k:e.kind, tm:e.team, x:NR1(e.x), z:NR1(e.z), f:NR1(e.facing || 0), r:e.r};
  if (e.kind === 'cmd') { d.key = e.key; d.ln = e.lane; d.nm = e.name || ''; d.hu = e.net ? 1 : 0; if (e.sk) d.sk = e.sk; }
  else if (e.kind === 'sol') { d.u = e.utype; d.o = e.owner.id; d.g = e.grp; if (isComp(e)) d.cp = 1; else { const sk = soldierSkin(e.owner, e.utype); if (sk) d.sk = sk; } if (e.atkMul) d.big = 1; }
  else if (e.kind === 'min') { d.rg = e.ranged ? 1 : 0; d.sp = e.sup ? 1 : 0; d.gu = e.guard ? 1 : 0; d.ln = e.lane; }
  else if (e.kind === 'tow') { d.ln = e.lane; d.ti = e.tier; }
  else if (e.kind === 'bld') { d.ty = e.type; d.o = e.owner ? e.owner.id : 0; }
  else if (e.kind === 'neu') { d.sb = e.sub; if (e.camp) d.ca = e.camp.key; }
  return d;
}
function netRow(e) {
  const bits = (e.vis[0] ? 2 : 0) | (e.vis[1] ? 4 : 0) | (e.stealth ? 8 : 0) | (e.stunT > 0 ? 16 : 0) | (e.built ? 64 : 0) | (e.prot ? 128 : 0) | (e.rootT > 0 ? 256 : 0);
  const a = [e.id, Math.round(e.x*10), Math.round(e.z*10), Math.round((e.facing || 0)*100), Math.round(e.hp), Math.round(e.maxHp), bits, e.atkA > 0.2 ? 1 : 0];
  if (e.kind === 'cmd') a.push(Math.round(e.respawn*10), e.lvl, e.streak || 0, e.cmdA > 0.3 ? 1 : 0);
  else if (e.kind === 'bld') a.push(e.lvl || 1, Math.round((e.buildT || 0)*10));
  else if (e.kind === 'drg') a.push(Math.round(e.life || 0));
  return a;
}
// shared part of a snapshot (only what changed since the previous one); the server adds each player's private part
function netSnap() {
  const S = {t:NR1(G.time), ph:phase, mu:NR1(G.muster), n:[], e:[], d:[], zn:[], zd:[], s:SVR.shots.splice(0)};
  const seen = new Set();
  for (const e of ents) {
    if (e.dead && e.kind !== 'cmd') continue;
    seen.add(e.id);
    const row = netRow(e), key = row.join(',');
    if (!SVR.known.has(e.id)) S.n.push(netDesc(e));
    if (SVR.known.get(e.id) !== key) { S.e.push(row); SVR.known.set(e.id, key); }
  }
  for (const id of SVR.known.keys()) if (!seen.has(id)) { S.d.push(id); SVR.known.delete(id); }
  SVR.zones = SVR.zones || new Map();
  const zl = new Set();
  for (const z of zones) {
    if (z.nid === undefined) { z.nid = ++SVR.zid; S.zn.push([z.nid, z.kind, z.team, NR1(z.x), NR1(z.z), NR1(z.r), NR1(z.f || 0), NR1(z.len || 0), NR1(z.w || 0), NR1(z.dur), NR1(z.t), NR1(z.delay || 0), z.color || '', z.big ? 1 : 0]); SVR.zones.set(z.nid, 1); }
    zl.add(z.nid);
  }
  for (const id of SVR.zones.keys()) if (!zl.has(id)) { S.zd.push(id); SVR.zones.delete(id); }
  S.G = {lost:G.lost, be:G.behind, ls:G.lastStand, ob:{titan:[NR1(G.obj.titan.t), G.obj.titan.ent ? G.obj.titan.ent.id : 0], dragon:[NR1(G.obj.dragon.t), G.obj.dragon.ent ? G.obj.dragon.ent.id : 0]},
    sp:G.sps.map(s => [s.owner, Math.round(s.prog), s.contest ? 1 : 0]), ca:G.camps ? Object.fromEntries(Object.entries(G.camps).map(([k, cs]) => [k, [cs.mobs.length, cs.owner, NR1(cs.t)]])) : null,
    in:[intel[0], intel[1]], rv:G.ravenT.map(NR1), wv:NR1(G.waveT)};
  S.C = cmds().map(c => [c.id, c.lane, c.lvl, Math.round(c.gold), c.grp.map(g => [g.utype, g.order, g.form, Math.round(g.mor), g.rank, g.routT > 0 ? 1 : 0]), c.supportUntil > G.time ? 1 : 0, c.tal || [], c.net ? 1 : 0, c.st, Math.round(c.spent)]);
  S.to = SVR.toasts.splice(0);
  S.fl = floaters.splice(0).filter(f => f.w).map(f => [f.w, NR1(f.x), NR1(f.y), NR1(f.z), f.s, f.c, f.t]);
  S.pt = SVR.ptoasts.splice(0);
  return S;
}
// everything a player needs to join or rejoin mid-match
function netFull() {
  const S = {t:NR1(G.time), ph:phase, mu:NR1(G.muster), n:[], e:[], d:[], zn:[], zd:[], s:[], to:[], full:1};
  for (const e of ents) { if (e.dead && e.kind !== 'cmd') continue; S.n.push(netDesc(e)); S.e.push(netRow(e)); }
  for (const z of zones) if (z.nid !== undefined) S.zn.push([z.nid, z.kind, z.team, NR1(z.x), NR1(z.z), NR1(z.r), NR1(z.f || 0), NR1(z.len || 0), NR1(z.w || 0), NR1(z.dur), NR1(z.t), NR1(z.delay || 0), z.color || '', z.big ? 1 : 0]);
  return S;
}
function netPriv(c) {
  const P = {gold:Math.round(c.gold), spent:c.spent, qT:NR1(c.qT), rT:NR1(c.rT), eT:NR1(c.eT), lvl:c.lvl, xp:Math.round(c.xp), tal:c.tal || [], tq:c.talQ || [], arm:c.arm, mu:NR1(c.mercUntil || 0), bu:c.builds,
    rs:NR1(c.respawn), gT:NR1(c.golemT), sT:NR1(c.stoneT || 0), fz:NR1(c.frenzyT || 0), ca:NR1(c.chargeAll || 0), st:c.st,
    g:c.grp.map(g => ({u:g.utype, o:g.order, f:g.form, m:Math.round(g.mor), r:g.rank, sk:NR1(g.skT), rf:NR1(g.reformT), rt:NR1(g.routT), bt:NR1(g.braceT), fz:NR1(g.frenzyT || 0), pt:g.pt ? [NR1(g.pt.x), NR1(g.pt.z)] : null, fa:NR1(g.face || 0), fo:g.focus && !g.focus.dead ? g.focus.id : 0, xp:Math.round(g.xp || 0)}))};
  return P;
}
const okU = (c, u) => unitsFor(c).includes(u);
// commands from a player's browser, already converted back to real map coordinates
function netCmd(c, m) {
  const E = id => ents.find(e => e.id === id && !e.dead) || null, P = p => p ? {x:+p[0], z:+p[1]} : null;
  const prev = player; player = c; SVR.ctx = c.cid; SVR.mute = !['skill', 'unit', 'demo', 'upg'].includes(m.t);   // the browser already showed its own feedback for the rest
  try {
    switch (m.t) {
      case 'mv': c.netMv = {x:clamp(+m.x || 0, -1, 1), z:clamp(+m.z || 0, -1, 1)}; break;
      case 'order': order(c, m.sel, m.ty, P(m.p), m.f === null || m.f === undefined ? undefined : +m.f, false, m.tg ? E(m.tg) : null); break;
      case 'form': setForm(c, m.sel, m.fm); break;
      case 'skill': castSkill(c, m.s, P(m.p), m.tg ? E(m.tg) : null); break;
      case 'unit': castU(c, m.k, P(m.p)); break;
      case 'build': place(c, m.ty, +m.p[0], +m.p[1]); break;
      case 'demo': { const b = E(m.b); if (b && b.owner === c) demolish(b); break; }
      case 'upg': { const b = E(m.b); if (b && b.owner === c) upgradeBld(c, b); break; }
      case 'arm': if (unitsFor(c).includes(m.u) && (m.k === 'w' || m.k === 'a')) buyArm(c, m.u, m.k); break;
      case 'merc': if (MERCS.includes(m.u)) hireMerc(c, m.u, m.g ? 1 : 0); break;
      case 'tal': if (c.talQ && c.talQ.length) applyTal(c, c.talQ.shift(), m.i ? 1 : 0); break;
      case 'reform': reform(c, m.k, m.u); break;
      case 'rpick': if (okU(c, m.u0) && okU(c, m.u1)) c.rpick = [m.u0, m.u1]; break;
      case 'units': if (phase === 'muster' && okU(c, m.u0) && okU(c, m.u1)) { c.mpick = [m.u0, m.u1]; c.grp[0].utype = m.u0; c.grp[1].utype = m.u1; } break;
      case 'lane': { const o = E(m.c); if (o && o.kind === 'cmd' && o.team === c.team && (o === c || !o.net) && LKEYS.includes(m.l)) { o.lane = m.l; o.laneSet = true; o.supportUntil = 0; } break; }
      case 'support': { const o = E(m.c); if (o && o.kind === 'cmd' && o.team === c.team && !o.net && o.respawn <= 0) { if (o.supportUntil > G.time) o.supportUntil = 0; else { o.supportUntil = G.time + 30; o.supportC = c; } } break; }
    }
  } catch (err) { console.error('cmd', m.t, err && err.stack); }
  player = prev; SVR.ctx = null; SVR.mute = false; SVR.who = null;
}

// ---------- client side ----------
const NMX = x => NET.mirror ? -x : x;
const NMF = f => NET.mirror ? f + Math.PI : f;
const NMT = t => NET.mirror && (t === 0 || t === 1) ? 1 - t : t;
const NMV = b => NET.mirror ? [!!(b & 4), !!(b & 2)] : [!!(b & 2), !!(b & 4)];
const outP = p => p ? [NR1(NMX(p.x)), NR1(NMX(p.z))] : null;
function netSend(o) { if (NET.ws && NET.ws.readyState === 1) NET.ws.send(JSON.stringify(o)); }
function netCmdSend(o) { netSend({t:'cmd', m:o}); }

function netSpawn(d) {
  if (NET.ents.has(d.i)) return;
  const tm = NMT(d.tm), x = NMX(d.x), z = NMX(d.z);
  const o = {kind:d.k, team:tm, x, z, tx:x, tz:z, facing:NMF(d.f), r:d.r, hp:1, maxHp:1, net:true};
  if (d.k === 'cmd') Object.assign(o, {key:d.key, lane:NET.mirror ? MIRL[d.ln] : d.ln, name:d.nm, human:!!d.hu, grp:[newGrp(), newGrp()], lvl:1, xp:0, tal:[], arm:{}, respawn:0, streak:0, gold:0, spent:0, builds:0, st:{kills:0, deaths:0, solK:0, solL:0, towers:0, dmg:0}, qT:0, rT:0, eT:0, cmdA:0, spd:CMDS[d.key].spd, faceS:NMF(d.f), sk:d.sk || '', mesh:applySkin(bake(mkCommander(d.key, tm)), d.sk)});
  else if (d.k === 'sol') { Object.assign(o, {utype:d.u, owner:NET.ents.get(d.o) || null, grp:d.g || 0, comp:!!d.cp && d.u !== 'wolf', mesh:applySkin(bake(mkSoldier(d.u, tm)), d.sk)}); if (d.big) o.mesh.scale.multiplyScalar(1.2); }
  else if (d.k === 'min') Object.assign(o, {ranged:!!d.rg, sup:!!d.sp, guard:!!d.gu, lane:d.ln, mesh:bake(mkMinion(tm, !!d.rg, !!d.sp, !!d.gu))});
  else if (d.k === 'tow') Object.assign(o, {lane:NET.mirror ? MIRL[d.ln] : d.ln, tier:d.ti, mesh:mkTower(tm, d.ti - 1)});
  else if (d.k === 'core') o.mesh = mkCore(tm);
  else if (d.k === 'bld') {
    Object.assign(o, {type:d.ty, owner:NET.ents.get(d.o) || null, built:false, buildT:BUILDS[d.ty].t, lvl:1, mesh:mkBuilding(d.ty, tm)});
    o.mesh.rotation.y = Math.atan2(CORE[1 - tm].x - x, CORE[1 - tm].z - z); setOpacity(o.mesh, 0.35);
  }
  else if (d.k === 'neu') {
    o.sub = d.sb;
    if (d.ca) { const cp = CAMPS.find(c => c.key === (NET.mirror ? CAMPMIR[d.ca] : d.ca)); o.camp = cp; if (cp.type === 'wolf') { o.mesh = mkSoldier('wolf', 1); o.mesh.scale.multiplyScalar(1.5); } else if (cp.type === 'golem') { o.mesh = mkTitan(); o.mesh.scale.setScalar(0.36); } else o.mesh = mkSoldier('berserk', 1); }
    else { o.mesh = d.sb === 'dragon' ? mkDragon() : mkTitan(); o.mesh.scale.setScalar(d.sb === 'dragon' ? 0.85 : 1); }
  }
  else if (d.k === 'drg') { o.life = 120; o.mesh = mkDragon(); o.mesh.scale.setScalar(0.62); o.mesh.add(ring(5, 5.6, TEAML[tm], 0.9)); }
  addEnt(o); o.id = d.i; o.vis = [tm === 0, tm === 1];
  if (d.k === 'bld') { const Bd = BUILDS[d.ty]; if (Bd.r > 0 && d.ty !== 'trap') { o.rr = ring(Math.min(Bd.r, 30) - 0.25, Math.min(Bd.r, 30), TEAML[tm], d.ty === 'watch' ? 0.12 : 0.3); o.rr.position.set(x, 0.14, z); world.add(o.rr); bRing(o); } }
  NET.ents.set(d.i, o);
  if (d.k === 'cmd' && d.i === NET.you.cmd) netGotPlayer(o);
}
function netGotPlayer(o) {
  player = o; o.isP = true;
  buildHud();
  if (phase === 'muster') { G.mpick = [null, null]; showMuster(); }
}
function netRemove(id) {
  const e = NET.ents.get(id); if (!e) return;
  NET.ents.delete(id); e.dead = true;
  if (e.rr) { world.remove(e.rr); e.rr = null; }
  const seen = e.team === 0 || e.vis[0];
  if (e.mesh && !((e.kind === 'sol' || e.kind === 'min' || e.kind === 'neu') && seen && artCorpse(e))) world.remove(e.mesh);
  if (seen && (e.kind === 'tow' || e.kind === 'bld' || e.kind === 'core')) { fxRing(e.x, e.z, e.r + 4, '#C8B59A', 0.7); sparks(e.x, 2, e.z, '#9C8A74', 26, 7, 10, 0.5); shake(e.kind === 'bld' ? 0.25 : 0.6, e.x, e.z); }
}
function netApply(S) {
  NET.snapN++; NET.lt = S.t; if (S.full || NET.rt === undefined) NET.rt = S.t - 0.18;
  NET.prev = player ? {rs:player.respawn, lvl:player.lvl} : null;
  for (const d of S.n) netSpawn(d);
  for (const a of S.e) {
    const e = NET.ents.get(a[0]); if (!e) continue;
    const nx = NMX(a[1]/10), nz = NMX(a[2]/10);
    if (e.t1 === undefined || S.full || (nx - e.x1)**2 + (nz - e.z1)**2 > 225) { e.x0 = e.x1 = nx; e.z0 = e.z1 = nz; e.t0 = e.t1 = S.t; }
    else { const t0 = Math.max(e.t1, S.t - 0.1); e.x0 = e.x1; e.z0 = e.z1; e.t0 = Math.min(t0, S.t - 0.02); e.x1 = nx; e.z1 = nz; e.t1 = S.t; }
    e.tx = nx; e.tz = nz; if (!(e === player && NET.mv && (NET.mv.x || NET.mv.z))) e.facing = NMF(a[3]/100);
    const hp0 = e.hp; e.hp = a[4]; e.maxHp = a[5];
    const b = a[6]; e.vis = NMV(b); e.stealth = !!(b & 8); e.stunT = b & 16 ? 0.2 : 0; e.rootT = b & 256 ? 0.2 : 0;
    if (a[7]) e.atkA = 0.35;
    if (e.kind === 'bld') { const built = !!(b & 64); if (built && !e.built) setOpacity(e.mesh, e.type === 'trap' ? 0.8 : 1); e.built = built; e.buildT = a[9]/10; if (a[8] !== (e.lvl || 1)) { e.lvl = a[8]; upgVisual(e); } }
    else if (e.kind === 'tow' || e.kind === 'core') e.prot = !!(b & 128);
    else if (e.kind === 'cmd') { const rs0 = e.respawn; e.respawn = a[8]/10; e.lvl = a[9]; e.streak = a[10]; if (a[11]) e.cmdA = 0.6; if (rs0 > 0 && e.respawn <= 0) { e.x = e.tx; e.z = e.tz; } if (e.respawn > 0) e.hp = 0; }
    else if (e.kind === 'drg') e.life = a[8];
    if (S.full) { e.x = e.tx; e.z = e.tz; }
    if (NET.snapN > 2 && e.hp < hp0 - 0.5 && e.vis[0] && (e.x - camT.x)**2 + (e.z - camT.z)**2 < 3600) { G.combatT = G.time; G.combatN = Math.min(30, (G.combatN || 0) + 0.15); if (Math.random() < 0.3) sparks(e.x, 1.3, e.z, e.team === 0 ? '#F0978A' : '#FFE2A8', 3, 4); }
  }
  for (const id of S.d) netRemove(id);
  if (S.n.length || S.d.length) ents = ents.filter(e => !e.dead || e.kind === 'cmd');
  // spell zones are copied once and then animated locally
  for (const q of S.zn) {
    if (NET.zmap.has(q[0])) continue;
    const z = addZone({kind:q[1], team:NMT(q[2]), x:NMX(q[3]), z:NMX(q[4]), r:q[5], f:NMF(q[6]), len:q[7], w:q[8], dur:q[9], delay:q[11] || 0, color:q[12] || undefined, big:!!q[13], net:true});
    z.t = q[10]; if (z.delay && z.t >= z.delay) z.live = true;
    NET.zmap.set(q[0], z);
  }
  for (const id of S.zd) { const z = NET.zmap.get(id); if (!z) continue; NET.zmap.delete(id); z.dead = true; world.remove(z.mesh); }
  if (S.zd.length) zones = zones.filter(z => !z.dead);
  for (const s of S.s) { const a = NET.ents.get(s[0]), t = NET.ents.get(s[1]); if (a && t) shot2(a, t, s[2], s[3], s[4]); }
  for (const f of S.fl || []) floaters.push({x:NMX(f[0]), y:f[1], z:NMX(f[2]), s:f[3], c:f[4], t:f[5]});
  for (const m of S.to || []) netToast(m);
  G.time = S.t;
  if (S.G) netWorld(S.G);
  if (S.C) for (const r of S.C) {
    const c = NET.ents.get(r[0]); if (!c) continue;
    c.lane = NET.mirror ? MIRL[r[1]] : r[1]; c.lvl = r[2]; c.gold = r[3]; c.tal = r[6]; c.human = !!r[7]; c.st = r[8]; c.spent = r[9];
    c.supportUntil = r[5] ? G.time + 5 : 0;
    r[4].forEach((q, k) => { const g = c.grp[k]; g.utype = q[0]; g.order = q[1]; g.form = q[2]; g.mor = q[3]; g.rank = q[4]; g.routT = q[5] ? 1 : 0; });
  }
  netGroupFrame();
  if (S.P && player) netPrivApply(S.P);
  // phase changes driven by the server
  if (S.ph === 'muster' && phase === 'muster') { G.muster = S.mu; const el = $('mcount'); if (el) el.textContent = Math.max(0, Math.ceil(S.mu)); }
  if (S.ph === 'play' && phase === 'muster' && player) {
    closeModal(); phase = 'play'; say(player, 'start', true); horn();
    toast(`開戰！第 I 隊 ${UNITS[player.grp[0].utype].n}、第 II 隊 ${UNITS[player.grp[1].utype].n}。${startTip()}`, 'g');
    updateHud(); updateCmdHud();
  }
  if (S.full && S.ph === 'play' && player) { closeModal(); phase = 'play'; updateHud(); updateCmdHud(); }
}
function netWorld(Gs) {
  const sw = a => NET.mirror ? [a[1], a[0]] : a;
  G.lost = sw(Gs.lost); G.behind = NMT(Gs.be); G.lastStand = sw(Gs.ls); G.ravenT = sw(Gs.rv); G.waveT = Gs.wv;
  for (const key of ['titan', 'dragon']) { const o = Gs.ob[key]; G.obj[key].t = o[0]; G.obj[key].ent = o[1] ? NET.ents.get(o[1]) || null : null; }
  if (!NET.spMap) NET.spMap = SPTS.map(s => G.sps.findIndex(r => Math.abs(r.x - NMX(s.x)) < 1 && Math.abs(r.z - NMX(s.z)) < 1));
  Gs.sp.forEach((v, i) => {
    const s = G.sps[NET.spMap[i]]; if (!s) return;
    const ow = NMT(v[0]), pr = NET.mirror ? -v[1] : v[1];
    if (s.owner !== ow) { s.owner = ow; updateSPVisual(s); }
    if (Math.abs(pr - s.prog) >= 1 || s.contest !== !!v[2]) { s.prog = pr; s.contest = !!v[2]; updateSPRing(s); }
  });
  if (Gs.ca) { if (!G.camps) campInit(); for (const k in Gs.ca) { const cs = G.camps[NET.mirror ? CAMPMIR[k] : k], v = Gs.ca[k]; if (!cs) continue; cs.mobs = v[0] ? ents.filter(e => !e.dead && e.camp === cs.cp) : []; cs.owner = NMT(v[1]); cs.t = v[2]; } }
  const I = Gs.in; intel[0] = NET.mirror ? I[1] : I[0]; intel[1] = NET.mirror ? I[0] : I[1];
}
function netPrivApply(P) {
  const c = player, pv = NET.prev || {rs:c.respawn, lvl:c.lvl}, wasDead = pv.rs > 0, lv0 = pv.lvl;
  Object.assign(c, {gold:P.gold, spent:P.spent, qT:P.qT, rT:P.rT, eT:P.eT, lvl:P.lvl, xp:P.xp, tal:P.tal, arm:P.arm, mercUntil:P.mu, builds:P.bu, respawn:P.rs, golemT:P.gT, stoneT:P.sT, frenzyT:P.fz, chargeAll:P.ca, st:P.st});
  P.g.forEach((q, k) => { const g = c.grp[k]; Object.assign(g, {utype:q.u, order:q.o, form:q.f, mor:q.m, rank:q.r, skT:q.sk, reformT:q.rf, routT:q.rt, braceT:q.bt, xp:q.xp}); g.face = NMF(q.fa); g.pt = q.pt ? {x:NMX(q.pt[0]), z:NMX(q.pt[1])} : null; g.focus = q.fo ? NET.ents.get(q.fo) || null : null; });
  if (NET.snapN < 3) return;
  // own events the server does not announce to us
  if (c.lvl > lv0 && lv0 > 0) {
    floaters.push({x:c.x, y:5.8, z:c.z, s:`Lv ${c.lvl}`, c:C.gold, t:1.6}); if (c.respawn <= 0) { fxRing(c.x, c.z, 4.5, C.gold, 0.8); sparks(c.x, 1.5, c.z, '#F1D29A', 18, 6, -4); }
    if (c.lvl >= 6 && lv0 < 6 && unl('e')) { toast(`升到 6 級：解鎖第三技能「${CMDS[c.key].e.n}」（E）`, 'g'); say(c, 'r', true); }
    else toast(`指揮官升到 ${c.lvl} 級：技能傷害 +${Math.round((skPow(c) - 1)*100)}%（對士兵減半）、${unl('r') ? 'Q／R' : 'Q'} 冷卻 -${(c.lvl - 1)*3}%、生命 +${(c.lvl - 1)*6}%`, 'b');
    chime();
  }
  const tq = JSON.stringify(P.tq);
  if (tq !== NET.tq) { NET.tq = tq; G.talQ = P.tq.slice(); showTalent(); }
  if (!wasDead && c.respawn > 0) { G.stats.deaths++; say(c, 'death', true); toast('你的指揮官陣亡，部隊撤回出生點。復活前可以免費重新整編', 'r'); cancelAim(); cancelOAim(); cancelPlace(); cancelDemo(); G.rpick = [c.grp[0].utype, c.grp[1].utype]; NET.rpickS = JSON.stringify(G.rpick); showRespawnMuster(); }
  if (wasDead && c.respawn <= 0) { if (G.rmOpen) closeModal(); G.rmOpen = false; G.rpick = null; toast(`指揮官重回戰場，兩隊已補滿：第 I 隊 ${UNITS[c.grp[0].utype].n}、第 II 隊 ${UNITS[c.grp[1].utype].n}`, 'b'); say(c, 'start', true); updateCmdHud(); }
}
function netGroupFrame() {
  for (const c of cmds()) for (const g of c.grp) g.mem = [];
  for (const e of ents) if (e.kind === 'sol' && !e.dead && e.owner && !isComp(e)) { const g = e.owner.grp[e.grp]; if (g) g.mem.push(e); }
  for (const c of cmds()) for (const g of c.grp) { if (!g.mem.length) { g.cent = {x:c.x, z:c.z}; continue; } let x = 0, z = 0; for (const m of g.mem) { x += m.tx; z += m.tz; } g.cent = {x:x/g.mem.length, z:z/g.mem.length}; }
}
function netToast(m) {
  // [text, class, 0]: shared, written from the blue side; [text, class, 1]: only for us; [text, class, 2, team]: for one side, already in its words
  if (m[2] === 2) { if (NMT(m[3]) === 0) toast(m[0], m[1]); return; }
  let s = m[0], cls = m[1];
  if (NET.mirror && !m[2]) { s = s.replace(/我方|敵方/g, w => w === '我方' ? '敵方' : '我方'); cls = cls === 'g' ? 'r' : cls === 'r' ? 'g' : cls; }
  toast(s, cls);
}
// per-frame work on a client: smooth movement, zone visuals, fog, HUD bits, outgoing input
function netTick(dt) {
  // render the world about 0.18 s behind the newest snapshot and interpolate between snapshots;
  // the render clock speeds up or slows down a little to follow the server, so late or bunched packets don't stutter
  if (NET.lt !== undefined) {
    const want = NET.lt - 0.18, gap = want - NET.rt;
    if (Math.abs(gap) > 0.6) NET.rt = want; else NET.rt += dt*(1 + clamp(gap*2.5, -0.35, 0.35));
  }
  const rt = NET.rt || 0;
  for (const e of ents) {
    if (e.dead) continue;
    if (e.atkA > 0) e.atkA = Math.max(0, e.atkA - dt);
    if (e.cmdA > 0) e.cmdA = Math.max(0, e.cmdA - dt);
    if (e.t1 === undefined || (e === player && e.respawn <= 0)) continue;
    const span = e.t1 - e.t0, k = span > 0.001 ? clamp((rt - e.t0)/span, 0, 1.1) : 1;
    e.x = e.x0 + (e.x1 - e.x0)*k; e.z = e.z0 + (e.z1 - e.z0)*k;
  }
  // our own commander moves at once and is pulled back only when it drifts from the server's copy
  if (player && player.respawn <= 0) {
    const v = phase === 'play' && !G.rmOpen ? inputVec() : null;
    if (v) { moveTo(player, player.x + v.x*5, player.z + v.z*5, dt); player.facing = Math.atan2(v.x, v.z); }
    const ex = player.tx - player.x, ez = player.tz - player.z, er = Math.hypot(ex, ez), lim = v ? player.spd*0.45 : 0.1;
    if (er > 12) { player.x = player.tx; player.z = player.tz; }
    else if (er > lim) { const f = Math.min(1, dt*(v ? 2.5 : 6))*(1 - lim/er); player.x += ex*f; player.z += ez*f; }
  }
  if (player) for (const s of ['qT', 'rT', 'eT']) if (player[s] > 0) player[s] = Math.max(0, player[s] - dt);
  if (player) for (const g of player.grp) { if (g.skT > 0) g.skT = Math.max(0, g.skT - dt); if (g.reformT > 0) g.reformT = Math.max(0, g.reformT - dt); }
  if (phase === 'play' || phase === 'pause') G.time += dt;   // smooth between snapshots; every snapshot resets it
  updateZones(dt); supplyFx(dt);
  G.visT -= dt; if (G.visT <= 0) { G.visT = 0.2; updateVision(true); }
  G.f2T = (G.f2T || 0) - dt;
  if (G.f2T <= 0 && player) {
    G.f2T = 0.3;
    let b = $('mercBtn');
    const show = phase === 'play' && heldCampNear(player);
    if (show && !b) { b = document.createElement('button'); b.id = 'mercBtn'; b.type = 'button'; b.onclick = () => openMercs(); $('hudroot').appendChild(b); }
    if (b) { b.style.display = show ? '' : 'none'; if (show) { const txt = player.mercUntil > G.time ? `傭兵服役中・剩 ${Math.ceil(player.mercUntil - G.time)} 秒` : '傭兵營地・按 J 僱用傭兵'; if (b.dataset.t !== txt) { b.dataset.t = txt; b.innerHTML = `${icon('mercs', 26)}<span>${txt}</span>`; } } }
    if (G.talQ && G.talQ.length && !$('talent')) showTalent();
  }
  // movement input (sent when it changes, and refreshed a few times a second while held)
  NET.lastSend -= dt;
  if ((phase === 'play' || phase === 'pause') && player) {
    const v = (phase === 'play' && !(G.rmOpen) ? inputVec() : null) || {x:0, z:0}, mv = {x:NR1(NMX(v.x)), z:NR1(NMX(v.z))};
    if (mv.x !== NET.mv.x || mv.z !== NET.mv.z || (NET.lastSend <= 0 && (mv.x || mv.z))) {
      NET.mv = mv; NET.lastSend = 0.3; netCmdSend({t:'mv', x:mv.x, z:mv.z});
      if ((v.x || v.z) && G.freeCam) { G.freeCam = null; $('camlab').classList.add('hidden'); }
    }
  }
  if (G.rpick) { const s = JSON.stringify(G.rpick); if (s !== NET.rpickS) { NET.rpickS = s; netCmdSend({t:'rpick', u0:G.rpick[0], u1:G.rpick[1]}); } }
}
// the player's own actions go to the server; HUD feedback stays local
function netWrap() {
  const o = {order, setForm, castSkill, castU, place, demolish, upgradeBld, buyArm, hireMerc, pickTalent, reform, chooseUnits, teamPanelDown, endGame};
  NET.orig = o;
  order = (c, sel, type, pt, face, silent, target) => {
    if (!NET.client || c !== player) return o.order(c, sel, type, pt, face, silent, target);
    const ok = o.order(c, sel, type, pt, face, silent, target);
    if (ok) netCmdSend({t:'order', sel, ty:type, p:outP(pt), f:face === undefined ? null : NR1(NMF(face)), tg:target ? target.id : 0});
    return ok;
  };
  setForm = (c, sel, form, silent) => { if (!NET.client || c !== player) return o.setForm(c, sel, form, silent); o.setForm(c, sel, form, silent); netCmdSend({t:'form', sel, fm:form}); };
  castSkill = (c, slot, p, tgt) => {
    if (!NET.client || c !== player) return o.castSkill(c, slot, p, tgt);
    if (c[slot + 'T'] > 0 || c.respawn > 0 || c.stunT > 0 || (slot === 'e' && c.lvl < 6)) return false;
    if (p) c.facing = Math.atan2(p.x - c.x, p.z - c.z) || c.facing;
    netCmdSend({t:'skill', s:slot, p:outP(p), tg:tgt ? tgt.id : 0}); c[slot + 'T'] = 0.5; c.cmdA = 0.6; say(c, slot === 'e' ? 'r' : slot, true); G.stats.skills++; return true;
  };
  castU = (c, k, p) => {
    if (!NET.client || c !== player) return o.castU(c, k, p);
    const g = c.grp[k]; if (!g.mem.length || g.skT > 0 || c.respawn > 0) return false;
    netCmdSend({t:'unit', k, p:outP(p)}); g.skT = 0.5; G.stats.skills++; tone([330, 440], 'triangle', 0.2, 0.05); return true;
  };
  place = (c, type, x, z) => {
    if (!NET.client || c !== player) return o.place(c, type, x, z);
    const err = canPlace(c, type, x, z); if (err) { toast(err, 'r'); return false; }
    netCmdSend({t:'build', ty:type, p:outP({x, z})}); toast(`開始建造${BUILDS[type].n}`, 'b'); return true;
  };
  demolish = b => { if (!NET.client) return o.demolish(b); netCmdSend({t:'demo', b:b.id}); cancelDemo(); return true; };
  upgradeBld = (c, b) => { if (!NET.client || c !== player) return o.upgradeBld(c, b); const err = canUpg(c, b); if (err) { toast(err, 'r'); return false; } netCmdSend({t:'upg', b:b.id}); cancelUpg(); chime(); return true; };
  buyArm = (c, u, k) => { if (!NET.client || c !== player) return o.buyArm(c, u, k); const lv = armLv(c, u, k); if (lv >= 3) return '已達最高等級'; if (!atBase(c)) return '回到主堡範圍內（或陣亡等待復活時）才能購買'; if (c.gold < ARM_COST[lv]) return '軍資不足'; netCmdSend({t:'arm', u, k}); c.gold -= ARM_COST[lv]; c.arm[u] = c.arm[u] || {w:0, a:0}; c.arm[u][k] = lv + 1; return null; };
  hireMerc = (c, u, gk) => { if (!NET.client || c !== player) return o.hireMerc(c, u, gk); if (!heldCampNear(c)) return '要站在我方佔領的傭兵營地旁才能僱用'; if (c.mercUntil > G.time) return '目前的傭兵還在服役'; if (c.gold < mercCost(c, u)) return '軍資不足'; netCmdSend({t:'merc', u, g:gk}); toast(`僱用${UNITS[u].n}`, 'g'); return null; };
  pickTalent = i => { if (!NET.client) return o.pickTalent(i); if (!G.talQ || !G.talQ.length) return; const tier = G.talQ.shift(); netCmdSend({t:'tal', i}); const T = TALENTS[player.key][tier][i]; toast(`天賦「${T[1]}」：${lkTxt(T[2])}`, 'g'); chime(); showTalent(); };
  reform = (c, k, type) => { if (!NET.client || c !== player) return o.reform(c, k, type); const err = canReform(c, k); if (err) { toast(err, 'r'); return false; } netCmdSend({t:'reform', k, u:type}); toast(`第${GNUM[k]}隊整編為${UNITS[type].n}`, 'b'); return true; };
  chooseUnits = (u0, u1) => {
    if (!NET.client) return o.chooseUnits(u0, u1);
    netCmdSend({t:'units', u0, u1}); player.grp[0].utype = u0; player.grp[1].utype = u1;
    modal.innerHTML = `<div class="sheet" style="margin-top:14vh;max-width:520px"><span class="kick">整軍期</span><h1>已選好：${UNITS[u0].n}＋${UNITS[u1].n}</h1><p>等待其他玩家選兵，倒數結束或全員選好後開戰。</p><div class="count" id="mcount">${Math.ceil(G.muster)}</div></div>`;
  };
  teamPanelDown = e => {
    if (!NET.client) return o.teamPanelDown(e);
    if (phase !== 'play' || !unl('team')) return;
    let c = allyCmd(e, 'data-ts'); if (c) { e.preventDefault(); if (c.human) { toast('真人隊友不會聽從支援請求', ''); return; } netCmdSend({t:'support', c:c.id}); toast(c.supportUntil > G.time ? `${CMDS[c.key].n}回到${LNAME[c.lane]}` : `${CMDS[c.key].n}前來支援 30 秒`, 'b'); return; }
    c = allyCmd(e, 'data-tl'); if (c) { e.preventDefault(); if (c.human && c !== player) { toast('真人隊友的分路由他自己決定', ''); return; } const l = LKEYS[(LKEYS.indexOf(c.lane) + 1) % 3]; netCmdSend({t:'lane', c:c.id, l:NET.mirror ? MIRL[l] : l}); c.lane = l; toast(`${CMDS[c.key].n}改派${LNAME[l]}`, 'b'); updateHud(); }
  };
}
netWrap();
function netLaneClick(c, l) { netCmdSend({t:'lane', c:c.id, l:NET.mirror ? MIRL[l] : l}); }

// ---------- connection & online lobby ----------
function netConnect(url, then) {
  try { if (NET.ws) NET.ws.close(); } catch (e) {}
  let ws;
  try { ws = new WebSocket(url); } catch (e) { netErr('無法連線：網址格式不對（要以 wss:// 或 ws:// 開頭）'); return; }
  NET.ws = ws; NET.url = url;
  ws.onopen = () => { try { localStorage.setItem('fhwz-net-url', url); } catch (e) {} netSend({t:'hello', name:NET.name, ver:NET_VER}); if (then) then(); };
  clearInterval(NET.pingIv); NET.pingIv = setInterval(() => { if (NET.ws === ws) netSend({t:'ping'}); else clearInterval(NET.pingIv); }, 20000);   // keeps free hosts from sleeping mid-lobby
  ws.onmessage = ev => { let m; try { m = JSON.parse(ev.data); } catch (e) { return; } netOnMsg(m); };
  ws.onclose = () => { NET.ws = null; if (NET.client && phase !== 'lobby' && phase !== 'over') netLost(); else if ($('netBox')) netErr('已和伺服器斷線'); };
  ws.onerror = () => netErr('連不上伺服器：請確認網址、伺服器是否已啟動（免費主機閒置後第一次連線要等約 1 分鐘）');
}
function netErr(msg) { const el = $('netMsg'); if (el) { el.textContent = msg; el.style.color = '#F0978A'; } else toast(msg, 'r'); }
function netOnMsg(m) {
  if (m.t === 'welcome') { NET.id = m.id; }
  else if (m.t === 'err') { netErr(m.msg); if (m.gone) { try { localStorage.removeItem('fhwz-net-tok'); } catch (e) {} } }
  else if (m.t === 'room') { NET.room = m; if (phase === 'lobby') drawNetRoom(); }
  else if (m.t === 'start') netClientStart(m);
  else if (m.t === 'snap' || m.t === 'me') { if (!NET.client) return; const q = m.t === 'me' ? {me:m} : m.s; if (G && G.net) netApplyAny(q); else (NET.pend = NET.pend || []).push(q); }
  else if (m.t === 'over') netOver(m);
}
function openNetLobby() {
  const P2 = $('lp2') || $('lpanel'); if (!P2) return;
  let url = NET_URL_DEFAULT; try { url = localStorage.getItem('fhwz-net-url') || url; } catch (e) {}
  let nm = '', rj = null; try { nm = localStorage.getItem('fhwz-net-name') || ''; rj = JSON.parse(localStorage.getItem('fhwz-net-tok') || 'null'); } catch (e) {}
  if (rj && rj.url) url = rj.url;
  if ($('netBox')) $('netBox').remove();
  const box = document.createElement('div'); box.id = 'netBox';
  box.innerHTML = `<div class="sheet net"><div class="bar"><div style="flex:1"><span class="kick">線上連機・最多 6 人，空位由 AI 補上</span><h1>線上對戰</h1></div><button type="button" class="go alt" id="netClose">返回</button></div>
    <div class="nf"><label>伺服器網址<input id="netUrl" value="${url}" spellcheck="false" placeholder="wss://你的伺服器.onrender.com"></label><label>你的名字<input id="netName" value="${nm}" maxlength="12" placeholder="指揮官"></label></div>
    <div class="bar"><button type="button" class="go" id="netCreate">建立房間</button><label class="nf" style="flex:1"><span style="display:none">房號</span><input id="netCode" maxlength="5" placeholder="輸入 5 碼房號" style="text-transform:uppercase"></label><button type="button" class="go alt" id="netJoin">加入房間</button></div>
    ${rj ? `<div class="bar"><button type="button" class="go" id="netRe">重回進行中的對戰（房號 ${rj.code}）</button></div>` : ''}
    <p id="netMsg" style="color:var(--muted);font-size:13px">房主建立房間後，把房號告訴朋友。伺服器網址只需要設定一次。</p><div id="netRoom"></div></div>`;
  document.body.appendChild(box);
  const go = act => { if (!/^wss?:\/\/./.test($('netUrl').value.trim())) { netErr('請先填伺服器網址（wss:// 開頭，部署伺服器後取得）'); return; } NET.name = ($('netName').value || '指揮官').slice(0, 12); try { localStorage.setItem('fhwz-net-name', NET.name); } catch (e) {} const u = $('netUrl').value.trim(); $('netMsg').textContent = '連線中…'; $('netMsg').style.color = 'var(--muted)'; netConnect(u, act); };
  $('netCreate').onclick = () => go(() => netSend({t:'create', key:lsel.cmd, sk:mySkins(lsel.cmd), rk:myRank()}));
  if (rj) $('netRe').onclick = () => go(() => netSend({t:'rejoin', code:rj.code, tok:rj.tok}));
  $('netJoin').onclick = () => { const code = $('netCode').value.trim().toUpperCase(); if (code.length !== 5) { netErr('房號是 5 碼'); return; } go(() => netSend({t:'join', code, key:lsel.cmd, sk:mySkins(lsel.cmd), rk:myRank()})); };
  $('netClose').onclick = () => closeNetLobby();
}
function closeNetLobby() { const b = $('netBox'); if (b) b.remove(); if (NET.ws && !NET.client) { netSend({t:'leave'}); try { NET.ws.close(); } catch (e) {} } NET.room = null; }
function drawNetRoom() {
  const R = NET.room, el = $('netRoom'); if (!el || !R) return;
  const me = R.players.find(p => p.id === NET.id), host = R.host === NET.id;
  $('netMsg').textContent = `房號 ${R.code}・${R.players.length} 位玩家${host ? '・你是房主' : ''}`; $('netMsg').style.color = 'var(--gold)';
  const slot = (team, i) => {
    const p = R.players.find(q => q.team === team && q.slot === i);
    return `<button type="button" class="ns ${p && p.id === NET.id ? 'me' : ''} ${p && !p.on ? 'off' : ''}" data-team="${team}" data-slot="${i}">${p ? icon(p.key, 40, team) : icon('unknown', 40)}<span><b>${p ? p.name : 'AI'}</b><small>${p ? `${CMDS[p.key].n}・軍階 ${p.rk || 1}` : '空位（點擊加入）'}</small></span></button>`;
  };
  const used = new Set(R.players.filter(p => me && p.team === me.team && p.id !== NET.id).map(p => p.key));
  el.innerHTML = `<div class="nteams"><div><h3 style="color:${C.blue}">聖輝聯軍（藍方）</h3>${[0, 1, 2].map(i => slot(0, i)).join('')}</div><div><h3 style="color:${C.red}">黑曜大軍（紅方）</h3>${[0, 1, 2].map(i => slot(1, i)).join('')}</div></div>
    <p style="color:var(--muted);font-size:13px;margin:6px 0">本場功能等級：軍階 ${Math.min(...R.players.map(p => p.rk || 1))}「${RANKS[Math.min(...R.players.map(p => p.rk || 1)) - 1].n}」（以房內最低軍階為準，AI 也照這個等級作戰）</p><div class="kick" style="margin-top:8px">你的指揮官（同隊不可重複）</div><div class="pick">${CKEYS.map(k => `<button type="button" class="pk ${me && me.key === k ? 'on' : ''}" data-k="${k}" ${used.has(k) || !unlMe('cmd:' + k) ? 'disabled' : ''}>${icon(k, 40)}<span>${CMDS[k].n}</span></button>`).join('')}</div>
    <div class="bar">${host ? `<button type="button" class="go" id="netStart">${glyph('advance', 20, '#1A1408')}開始對戰</button>` : '<span style="color:var(--muted)">等待房主開始…</span>'}<span style="color:var(--muted);font-size:12px">兩隊都可以放真人；同隊是合作、分隊就是對戰。空位由 AI 指揮官補上。</span></div>`;
  el.querySelectorAll('[data-slot]').forEach(b => b.onclick = () => netSend({t:'slot', team:+b.dataset.team, slot:+b.dataset.slot}));
  el.querySelectorAll('[data-k]').forEach(b => b.onclick = () => netSend({t:'pick', key:b.dataset.k, sk:mySkins(b.dataset.k)}));
  const st = $('netStart'); if (st) st.onclick = () => netSend({t:'start'});
}
function netClientStart(m) {
  NET.client = true; NET.you = m.you; NET.team = m.you.team; NET.mirror = m.you.team === 1;
  NET.ents.clear(); NET.zmap.clear(); NET.spMap = null; NET.tq = ''; NET.snapN = 0; NET.mv = {x:0, z:0}; NET.rpickS = '';
  try { localStorage.setItem('fhwz-net-tok', JSON.stringify({code:m.code, tok:m.you.tok, url:NET.url})); } catch (e) {}
  const b = $('netBox'); if (b) b.remove();
  closeModal();
  startWhenArt(() => { newGame(m.you.key, 'net'); G.net = true; G.flv = m.flv || RMAX; G.muster = m.muster || 30; camT.x = SPAWN[0].x; camT.z = SPAWN[0].z; if (NET.pend) { const q = NET.pend; NET.pend = null; q.forEach(netApplyAny); } });
}
function netOver(m) {
  try { localStorage.removeItem('fhwz-net-tok'); } catch (e) {}
  if (!G || !player) return;
  G.eco = (m.eco || []).map(e => NET.mirror ? [e[0], e[2], e[1]] : e);
  if (player.st) { G.stats.kills = player.st.kills || 0; G.stats.deaths = player.st.deaths || 0; G.stats.towers = player.st.towers || 0; }
  NET.orig.endGame(m.win === NET.team);
  setTimeout(() => { const a = $('againQ'); if (a) { a.innerHTML = '回到線上大廳'; a.onclick = () => { netDrop(); showLobby(); openNetLobby(); }; } const b = $('again'); if (b) b.onclick = () => { netDrop(); showLobby(); }; }, 1500);
}
function netLeaveGame() { netDrop(); showLobby(); }

// connection dropped mid-match: the server hands our commander to the AI until we come back
function netLost() {
  let rj = null; try { rj = JSON.parse(localStorage.getItem('fhwz-net-tok') || 'null'); } catch (e) {}
  phase = 'pause';
  modal.innerHTML = `<div class="sheet" style="margin-top:14vh;max-width:560px"><span class="kick">線上對戰</span><h1>和伺服器的連線中斷了</h1><p>斷線期間你的指揮官由 AI 代管。重新連線後會接回原本的位置。</p>
    <div class="bar">${rj ? `<button type="button" class="go" id="nlRe">重新連線</button>` : ''}<button type="button" class="go alt" id="nlQuit">回到大廳</button></div><p id="netMsg"></p></div>`;
  modal.classList.add('show');
  if (rj) $('nlRe').onclick = () => { $('netMsg').textContent = '連線中…'; netConnect(rj.url || NET.url, () => netSend({t:'rejoin', code:rj.code, tok:rj.tok})); };
  $('nlQuit').onclick = () => { netDrop(); showLobby(); };
}

// a snapshot is sent once to everyone ('snap'), followed by each player's own part ('me')
function netApplyAny(q) {
  if (!q.me) { netApply(q); return; }
  const m = q.me;
  for (const f of m.fl || []) floaters.push({x:NMX(f[0]), y:f[1], z:NMX(f[2]), s:f[3], c:f[4], t:f[5]});
  for (const t of m.to || []) netToast(t);
  if (m.P && player) netPrivApply(m.P);
}

// ================= loop =================
function frame(now) {
  const dt = Math.min(0.05, (now - last)/1000); last = now;
  try {
    const sdt = G && G.deploy ? dt*0.3 : dt;
    if (G && NET.client) netTick(dt);
    else if (G && (phase === 'play' || phase === 'muster')) update(sdt);
    render(sdt);
    musTick(dt);
    if (G && player && phase !== 'lobby' && phase !== 'exit') { G.hudT -= dt; if (G.hudT <= 0) { G.hudT = 0.15; updateHud(); updateRespawnUi(); } G.mmT -= dt; if (G.mmT <= 0) { G.mmT = 0.2; drawMini(); } }
  } catch (err) { console.error(err); }
  requestAnimationFrame(frame);
}
try { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; } catch (e) {}
setupComposer(); applySet(); resize(); showLobby(); requestAnimationFrame(frame);
function startWhenArt(go) {
  if (ART.ready || ART.failed) { go(); return; }
  const b = $('goBtn'), txt = b ? b.textContent : '';
  const iv = setInterval(() => { if (b) b.textContent = `載入正式美術 ${Math.round(ART.progress*100)}%…`; }, 200);
  whenArt(() => { clearInterval(iv); if (b) b.textContent = txt; go(); });
}
loadArt().then(ok => { if (ok) { artScenery(scene); refreshLobbyModel(); } else toast && phase === 'lobby' && console.warn('procedural art in use'); });
window.__game = {NET, netConnect, netSend, netCmdSend, netTick, get zones() { return zones; }, CMDS, hireMerc, pickTalent, applyTal, openMercs, unitsFor, kill2, UNITS, hurt, startTutorial, openArmory, buyArm, upgradeBld, showResults, toggleUpg, castE, cmdXp, musTick, fxStep, get fx() { return fx; }, teamPanelDown, showRespawnMuster, respawnSquads:cs => { for (const c of cs) for (const k of [0, 1]) spawnSquad(c, k); }, get ents() { return ents; }, get G() { return G; }, get phase() { return phase; }, newGame, chooseUnits, update, castSkill, castU, order, setForm, place, reform, startPlace, startAim, fireAim, cancelAim, get player() { return player; }, intel, updateHud, drawMini, render, openReform, showMenu, issue, showLobby, drawLobbyPanel, setTab:t => { ltab = t; }, toggleDeploy, exitGame, confirmExitGame, get sps() { return G && G.sps; }, resume:() => { closeModal(); if (phase === 'pause') phase = 'play'; }, models:{mkCommander, mkSoldier, mkBuilding, mkMinion, mkTower, mkCore}};

}
