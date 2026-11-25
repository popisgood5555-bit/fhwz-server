// 烽火王座 online server: rooms, lobby and the authoritative match simulation.
// No dependencies: Node 18+ only. Start with `node server.js` (PORT env var, default 8080).
'use strict';
const http = require('http'), crypto = require('crypto'), zlib = require('zlib');
const {createMatch} = require('./sim.js');
const VER = (require('fs').readFileSync(require('path').join(__dirname, 'game_built.js'), 'utf8').match(/const NET_VER = '([^']+)'/) || [])[1] || '?';

const PORT = +process.env.PORT || 8080;
const TICK = 1/20, SNAP_EVERY = 2;            // 20 simulation steps and 10 snapshots a second (the browser game also steps at most 1/20 s)
const CKEYS = ['valen', 'sylvie', 'orion', 'gru', 'brand', 'raven'];
const NAME = {valen: '瓦倫', sylvie: '希爾薇', orion: '歐瑞恩', gru: '格魯', brand: '布蘭德', raven: '雷文'};

// ---------------- minimal WebSocket (RFC 6455, with permessage-deflate) ----------------
const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
class Sock {
  constructor(socket, deflate) {
    this.s = socket; this.deflate = deflate; this.buf = Buffer.alloc(0); this.frag = null; this.open = true;
    this.onmessage = () => {}; this.onclose = () => {};
    socket.setNoDelay(true);
    socket.on('data', d => this.data(d));
    socket.on('close', () => this.closed());
    socket.on('error', () => this.closed());
    this.alive = true;
  }
  data(d) {
    this.buf = this.buf.length ? Buffer.concat([this.buf, d]) : d;
    if (this.buf.length > 1 << 20) { this.close(); return; }
    for (;;) {
      const b = this.buf; if (b.length < 2) return;
      const fin = b[0] & 0x80, rsv1 = b[0] & 0x40, op = b[0] & 0x0f, masked = b[1] & 0x80;
      let len = b[1] & 0x7f, off = 2;
      if (len === 126) { if (b.length < 4) return; len = b.readUInt16BE(2); off = 4; }
      else if (len === 127) { if (b.length < 10) return; len = Number(b.readBigUInt64BE(2)); off = 10; }
      if (len > 1 << 18) { this.close(); return; }
      const mk = masked ? 4 : 0; if (b.length < off + mk + len) return;
      let p = b.subarray(off + mk, off + mk + len);
      if (masked) { const m = b.subarray(off, off + 4); p = Buffer.from(p); for (let i = 0; i < p.length; i++) p[i] ^= m[i & 3]; }
      this.buf = b.subarray(off + mk + len);
      if (op === 8) { this.close(); return; }
      if (op === 9) { this.frame(10, p); continue; }
      if (op === 10) { this.alive = true; continue; }
      if (op === 1 || op === 2) { this.frag = {op, rsv1, parts: [p]}; }
      else if (op === 0 && this.frag) this.frag.parts.push(p);
      else continue;
      if (fin && this.frag) {
        let msg = Buffer.concat(this.frag.parts); const z = this.frag.rsv1; this.frag = null;
        try { if (z) msg = zlib.inflateRawSync(Buffer.concat([msg, Buffer.from([0, 0, 0xff, 0xff])]), {finishFlush: zlib.constants.Z_SYNC_FLUSH}); }
        catch (e) { this.close(); return; }
        let o; try { o = JSON.parse(msg.toString('utf8')); } catch (e) { continue; }
        try { this.onmessage(o); } catch (e) { console.error('message handler', e); }
      }
    }
  }
  frame(op, payload, compress) {
    if (!this.open) return;
    const n = payload.length;
    const h = n < 126 ? Buffer.alloc(2) : n < 65536 ? Buffer.alloc(4) : Buffer.alloc(10);
    h[0] = 0x80 | (compress ? 0x40 : 0) | op;
    if (n < 126) h[1] = n; else if (n < 65536) { h[1] = 126; h.writeUInt16BE(n, 2); } else { h[1] = 127; h.writeBigUInt64BE(BigInt(n), 2); }
    try { this.s.write(Buffer.concat([h, payload])); } catch (e) { this.closed(); }
  }
  send(obj) { this.sendPacked(pack(obj)); }
  sendPacked(pk) { if (this.deflate && pk.z) this.frame(1, pk.z, true); else this.frame(1, pk.raw, false); }
  close() { if (this.open) { this.frame(8, Buffer.alloc(0)); try { this.s.end(); } catch (e) {} } this.closed(); }
  closed() { if (!this.open) return; this.open = false; try { this.s.destroy(); } catch (e) {} this.onclose(); }
}

// a message encoded once (plain and compressed) so the same bytes can go to every player
function pack(obj) {
  const raw = Buffer.from(typeof obj === 'string' ? obj : JSON.stringify(obj), 'utf8');
  return {raw, z: raw.length > 200 ? zlib.deflateRawSync(raw, {level: 3, finishFlush: zlib.constants.Z_SYNC_FLUSH}).subarray(0, -4) : null};
}

// ---------------- rooms ----------------
const rooms = new Map();      // code -> room
const clients = new Set();
let nextId = 1;
const code5 = () => { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s; do { s = ''; for (let i = 0; i < 5; i++) s += A[crypto.randomInt(A.length)]; } while (rooms.has(s)); return s; };
const cleanSk = sk => {   // cosmetic skin choices sent by the browser: keep only well-formed ids
  const o = {c: '', u: {}}; if (!sk || typeof sk !== 'object') return o;
  if (typeof sk.c === 'string' && /^[a-z]{2,10}_[a-z]{2,10}$/.test(sk.c)) o.c = sk.c;
  if (sk.u && typeof sk.u === 'object') for (const [k, v] of Object.entries(sk.u).slice(0, 24)) if (/^[a-z]{2,12}$/.test(k) && (v === k + ':gold' || v === k + ':dark')) o.u[k] = v;
  return o;
};
const clean = s => String(s || '').replace(/[<>&"'`]/g, '').trim().slice(0, 12) || '指揮官';

function roomInfo(r) { return {t: 'room', code: r.code, host: r.host, state: r.state, players: r.players.map(p => ({id: p.id, name: p.name, team: p.team, slot: p.slot, key: p.key, rk: p.rk, on: !!p.ws}))}; }
function broadcastRoom(r) { const m = JSON.stringify(roomInfo(r)); for (const p of r.players) if (p.ws) p.ws.send(m); }
function freeSlot(r, team) { for (let i = 0; i < 3; i++) if (!r.players.some(p => p.team === team && p.slot === i)) return i; return -1; }
function freeKey(r, team, want, self) { const used = new Set(r.players.filter(p => p.team === team && p !== self).map(p => p.key)); if (want && CKEYS.includes(want) && !used.has(want)) return want; return CKEYS.find(k => !used.has(k)); }
function addPlayer(r, cl, key, sk, rk) {
  if (r.players.length >= 6) return '房間已滿（6 人）';
  const n0 = r.players.filter(p => p.team === 0).length, n1 = r.players.filter(p => p.team === 1).length;
  const team = n0 <= n1 ? (freeSlot(r, 0) >= 0 ? 0 : 1) : (freeSlot(r, 1) >= 0 ? 1 : 0);
  const p = {id: cl.id, name: cl.name, team, slot: freeSlot(r, team), key: null, sk: cleanSk(sk), rk: Math.max(1, Math.min(8, Math.floor(+rk) || 1)), tok: crypto.randomBytes(12).toString('hex'), ws: cl.ws, cl};
  p.key = freeKey(r, team, key, p);
  r.players.push(p); cl.room = r; cl.p = p;
  return null;
}
function removePlayer(r, p) {
  r.players = r.players.filter(q => q !== p);
  if (p.cl) { p.cl.room = null; p.cl.p = null; }
  if (r.host === p.id && r.players.length) r.host = r.players[0].id;
  if (!r.players.length) { rooms.delete(r.code); return; }
  broadcastRoom(r);
}

function startMatch(r) {
  const lineup = [];
  for (const team of [0, 1]) {
    const used = new Set(r.players.filter(p => p.team === team).map(p => p.key));
    const pool = CKEYS.filter(k => !used.has(k)).sort(() => Math.random() - 0.5);
    for (let slot = 0; slot < 3; slot++) {
      const p = r.players.find(q => q.team === team && q.slot === slot);
      lineup.push(p ? {team, slot, key: p.key, cid: 'p' + p.id, name: p.name, sk: p.sk && p.sk.c && p.sk.c.startsWith(p.key + '_') ? p.sk.c : '', skU: p.sk ? p.sk.u : {}} : {team, slot, key: pool.pop()});
    }
  }
  lineup.flv = Math.min(...r.players.map(p => p.rk || 1));     // everyone plays with what the least experienced player has unlocked
  let api;
  try { api = createMatch(lineup); } catch (e) { console.error('match start failed', e); for (const p of r.players) if (p.ws) p.ws.send({t: 'err', msg: '伺服器開局失敗：' + e.message}); return; }
  r.api = api; r.flv = lineup.flv; r.state = 'game'; r.step = 0; r.last = Date.now(); r.acc = 0; r.idleT = 0;
  for (const p of r.players) { p.cid = 'p' + p.id; if (p.ws) sendStart(r, p, false); }
  broadcastRoom(r);
  r.timer = setInterval(() => roomTick(r), 1000*TICK);
}
function sendStart(r, p, full) {
  const c = r.api.cmdOf(p.cid);
  p.ws.send({t: 'start', code: r.code, muster: r.api.G.muster, flv: r.flv, you: {team: p.team, key: p.key, cmd: c.id, tok: p.tok}});
  if (full) { const S = r.api.netFull(); S.P = r.api.netPriv(c); p.ws.send({t: 'snap', s: S}); }
}
function roomTick(r) {
  try { roomTick2(r); } catch (e) { console.error('room', r.code, e); }
}
function roomTick2(r) {
  const now = Date.now(); r.acc += Math.min(0.25, (now - r.last)/1000); r.last = now;
  const api = r.api;
  try {
    while (r.acc >= TICK) {
      r.acc -= TICK; api.update(TICK); r.step++;
      if (r.step % SNAP_EVERY === 0) sendSnap(r);
      if (api.phase === 'over') break;
    }
  } catch (e) { console.error('room', r.code, 'sim error', e); }
  const G = api.G;
  if (process.env.FHWZ_TEST_KILL && !r.killed && G.time > +process.env.FHWZ_TEST_KILL) { r.killed = true; for (const c of api.cmds()) if (c.net) api.hurt(c, 1e7); }
  if (process.env.FHWZ_TEST_END && G.time > +process.env.FHWZ_TEST_END && !G.over) { const core = api.ents.find(e => e.kind === 'core' && e.team === 1); if (core) api.hurt(core, 1e7); }
  if (api.phase === 'over' || (G && G.over)) {
    sendSnap(r);
    const win = G.win ? 0 : 1;
    for (const p of r.players) if (p.ws) p.ws.send({t: 'over', win, eco: G.eco || []});
    endRoom(r); return;
  }
  // nobody connected for two minutes: close the match
  if (!r.players.some(p => p.ws)) { r.idleT += TICK; if (r.idleT > 120) endRoom(r); } else r.idleT = 0;
}
function sendSnap(r) {
  const api = r.api, S = api.netSnap(), fl = S.fl, pt = S.pt; delete S.fl; delete S.pt;
  const shared = pack({t: 'snap', s: S});          // encoded and compressed once for everyone
  for (const p of r.players) {
    if (!p.ws) continue;
    const c = api.cmdOf(p.cid); if (!c) continue;
    p.ws.sendPacked(shared);
    p.ws.send({t: 'me', P: api.netPriv(c), fl: fl.filter(f => f[0] === p.cid).map(f => f.slice(1)), to: pt.filter(t => t[0] === p.cid).map(t => [t[1], t[2], 1])});
  }
}
function endRoom(r) {
  clearInterval(r.timer); r.timer = null; r.api = null;
  for (const p of r.players) if (p.cl) { p.cl.room = null; p.cl.p = null; }
  rooms.delete(r.code);
}

// ---------------- messages ----------------
function onMessage(cl, m) {
  const r = cl.room, p = cl.p;
  if (cl.bad && m.t !== 'hello') return;
  switch (m.t) {
    case 'hello':
      cl.name = clean(m.name);
      if (m.ver !== VER) { cl.ws.send({t: 'err', msg: `遊戲版本（${m.ver || '舊版'}）和伺服器（${VER}）不同：請把伺服器和 itch.io 上的遊戲更新成同一版`}); cl.bad = true; break; }
      cl.ws.send({t: 'welcome', id: cl.id, ver: VER}); break;
    case 'ping': break;
    case 'create': {
      if (r) leave(cl);
      const room = {code: code5(), host: cl.id, players: [], state: 'lobby'};
      rooms.set(room.code, room); addPlayer(room, cl, m.key, m.sk, m.rk); broadcastRoom(room); break;
    }
    case 'join': {
      if (r) leave(cl);
      const room = rooms.get(String(m.code || '').toUpperCase());
      if (!room) { cl.ws.send({t: 'err', msg: '找不到這個房號'}); break; }
      if (room.state !== 'lobby') { cl.ws.send({t: 'err', msg: '這個房間已經開戰了'}); break; }
      const err = addPlayer(room, cl, m.key, m.sk, m.rk); if (err) { cl.ws.send({t: 'err', msg: err}); break; }
      broadcastRoom(room); break;
    }
    case 'rejoin': {
      const room = rooms.get(String(m.code || '').toUpperCase());
      const q = room && room.players.find(x => x.tok === m.tok);
      if (!room || !q || room.state !== 'game' || !room.api) { cl.ws.send({t: 'err', msg: '那場對戰已經結束了', gone: true}); break; }
      if (q.ws && q.ws !== cl.ws) { try { q.ws.close(); } catch (e) {} }
      q.ws = cl.ws; q.cl = cl; cl.room = room; cl.p = q; q.name = cl.name || q.name;
      room.api.back(q.cid);
      sendStart(room, q, true); broadcastRoom(room); break;
    }
    case 'slot': {
      if (!r || r.state !== 'lobby') break;
      const team = m.team === 1 ? 1 : 0, slot = +m.slot;
      if (!(slot >= 0 && slot < 3) || r.players.some(q => q.team === team && q.slot === slot)) break;
      p.team = team; p.slot = slot; p.key = freeKey(r, team, p.key, p); broadcastRoom(r); break;
    }
    case 'pick': {
      if (!r || r.state !== 'lobby' || !CKEYS.includes(m.key)) break;
      if (r.players.some(q => q !== p && q.team === p.team && q.key === m.key)) { cl.ws.send({t: 'err', msg: `同隊已經有人選了${NAME[m.key]}`}); break; }
      p.key = m.key; if (m.sk) p.sk = cleanSk(m.sk); broadcastRoom(r); break;
    }
    case 'start': {
      if (!r || r.state !== 'lobby') break;
      if (r.host !== cl.id) { cl.ws.send({t: 'err', msg: '只有房主可以開始'}); break; }
      startMatch(r); break;
    }
    case 'cmd': {
      if (!r || r.state !== 'game' || !r.api || !p || !m.m || typeof m.m.t !== 'string') break;
      const c = r.api.cmdOf(p.cid); if (!c || !c.net) break;
      cl.cmdN = (cl.cmdN || 0) + 1; if (cl.cmdN > 60) break;      // flood guard (per second)
      r.api.netCmd(c, m.m); break;
    }
    case 'leave': leave(cl); break;
  }
}
function leave(cl) {
  const r = cl.room, p = cl.p; if (!r || !p) return;
  if (r.state === 'lobby') removePlayer(r, p);
  else { p.ws = null; p.cl = null; cl.room = null; cl.p = null; if (r.api) r.api.leave(p.cid); broadcastRoom(r); }
}
setInterval(() => { for (const cl of clients) cl.cmdN = 0; }, 1000);
// keep idle connections alive through proxies, and drop dead ones
setInterval(() => { for (const cl of clients) { if (!cl.ws.alive) { cl.ws.close(); continue; } cl.ws.alive = false; cl.ws.frame(9, Buffer.alloc(0)); } }, 25000);

// ---------------- cloud saves bound to an itch.io account ----------------
// The player signs in on itch.io (OAuth implicit flow, scope profile:me) in a popup that ends on /itch/cb here.
// We check the itch.io key once, remember only the itch user id, and hand the game a random session key (sk).
// Saves live in Upstash Redis (REST, so still no npm packages); without it they fall back to memory (lost on restart).
const ITCH_CLIENT = process.env.ITCH_CLIENT_ID || '';
const KV_URL = (process.env.UPSTASH_REDIS_REST_URL || '').replace(/\/$/, ''), KV_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || '';
const MEM = new Map();
async function kv(...cmd) {
  if (!KV_URL) {
    const [op, k, v] = cmd;
    if (op === 'GET') return MEM.has(k) ? MEM.get(k) : null;
    if (op === 'SET') { MEM.set(k, v); return 'OK'; }
    if (op === 'DEL') { MEM.delete(k); return 1; }
    return null;
  }
  const r = await fetch(KV_URL, {method: 'POST', headers: {Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json'}, body: JSON.stringify(cmd)});
  const j = await r.json(); if (j.error) throw new Error(j.error); return j.result;
}
const pend = new Map();          // OAuth state -> {sk, uid, name, t}
setInterval(() => { const now = Date.now(); for (const [k, v] of pend) if (now - v.t > 10*60e3) pend.delete(k); }, 60e3);
const lastWrite = new Map();     // uid -> time of the last save, to keep writes under one per 3 s
const okState = s => typeof s === 'string' && /^[A-Za-z0-9]{16,64}$/.test(s);
const okSk = s => typeof s === 'string' && /^[a-f0-9]{48}$/.test(s);
function body(req, max = 40000) {
  return new Promise((ok, no) => { let b = ''; req.on('data', d => { b += d; if (b.length > max) { no(new Error('too large')); req.destroy(); } }); req.on('end', () => ok(b)); req.on('error', no); });
}
function json(res, code, o) { res.writeHead(code, {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store'}); res.end(JSON.stringify(o)); }
const origin = req => `${(req.headers['x-forwarded-proto'] || 'http').split(',')[0]}://${req.headers.host}`;
const CB_PAGE = `<!DOCTYPE html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>烽火王座・綁定 itch.io</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0E1116;color:#EDE6D6;font:16px/1.6 system-ui,"Noto Sans TC",sans-serif}main{max-width:420px;padding:28px;text-align:center}h1{font-size:22px;color:#F1D29A;margin:0 0 8px}.e{color:#F0B8AE}</style></head>
<body><main><h1>烽火王座</h1><p id="m">正在確認 itch.io 帳號…</p></main><script>
(async () => {
  const h = new URLSearchParams(location.hash.slice(1)); history.replaceState(null, '', location.pathname);
  const m = document.getElementById('m'), tok = h.get('access_token'), st = h.get('state');
  if (!tok || !st) { m.className = 'e'; m.textContent = '沒有收到 itch.io 的授權，請回到遊戲重新按「綁定」。'; return; }
  try {
    const r = await fetch('/itch/token', {method: 'POST', headers: {'Content-Type': 'text/plain'}, body: JSON.stringify({state: st, token: tok})}).then(r => r.json());
    if (!r.ok) throw new Error(r.err || '');
    m.innerHTML = '已綁定 itch.io 帳號 <b>' + r.name.replace(/[<>&]/g, '') + '</b>。<br>可以關閉這個視窗，回到遊戲。';
    setTimeout(() => window.close(), 2500);
  } catch (e) { m.className = 'e'; m.textContent = '綁定失敗：' + (e.message || '請稍後再試'); }
})();
</script></body></html>`;
async function cloudRoute(req, res, u) {
  const p = u.pathname;
  if (req.method === 'OPTIONS') { res.writeHead(204, {'Access-Control-Allow-Methods': 'GET,POST', 'Access-Control-Allow-Headers': 'Content-Type'}); res.end(); return true; }
  if (p === '/itch/status') { json(res, 200, {itch: !!ITCH_CLIENT, persist: !!KV_URL}); return true; }
  if (p === '/itch/login') {
    const s = u.searchParams.get('s');
    if (!ITCH_CLIENT || !okState(s)) { res.writeHead(400, {'Content-Type': 'text/plain; charset=utf-8'}); res.end(ITCH_CLIENT ? '參數錯誤' : '伺服器尚未設定 ITCH_CLIENT_ID'); return true; }
    const q = new URLSearchParams({client_id: ITCH_CLIENT, scope: 'profile:me', response_type: 'token', redirect_uri: `${origin(req)}/itch/cb`, state: s});
    res.writeHead(302, {Location: `https://itch.io/user/oauth?${q}`}); res.end(); return true;
  }
  if (p === '/itch/cb') { res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer'}); res.end(CB_PAGE); return true; }
  if (p === '/itch/token' && req.method === 'POST') {
    const b = JSON.parse(await body(req) || '{}');
    if (!okState(b.state) || typeof b.token !== 'string' || b.token.length > 200) return json(res, 400, {ok: false, err: '參數錯誤'}), true;
    const r = process.env.FHWZ_TEST_ITCH && b.token.startsWith('test:') ? {user: {id: +b.token.split(':')[1], username: b.token.split(':')[2]}}   // local tests only
      : await fetch('https://itch.io/api/1/key/me', {headers: {Authorization: `Bearer ${b.token}`}}).then(r => r.json()).catch(() => null);
    const us = r && r.user;
    if (!us || !us.id) return json(res, 401, {ok: false, err: 'itch.io 沒有確認這個帳號'}), true;
    const sk = crypto.randomBytes(24).toString('hex'), name = String(us.display_name || us.username || us.id).slice(0, 40);
    await kv('SET', `sk:${sk}`, JSON.stringify({uid: us.id, name}));
    pend.set(b.state, {sk, uid: us.id, name, t: Date.now()});
    json(res, 200, {ok: true, name}); return true;
  }
  if (p === '/itch/claim') {
    const s = u.searchParams.get('s'), v = okState(s) && pend.get(s);
    if (!v) { json(res, 200, {wait: true}); return true; }
    pend.delete(s); json(res, 200, {ok: true, sk: v.sk, uid: v.uid, name: v.name, persist: !!KV_URL}); return true;
  }
  if (p === '/save' || p === '/itch/logout') {
    const b = req.method === 'POST' ? JSON.parse(await body(req) || '{}') : {sk: u.searchParams.get('sk')};
    if (!okSk(b.sk)) return json(res, 400, {ok: false}), true;
    const who = JSON.parse(await kv('GET', `sk:${b.sk}`) || 'null');
    if (!who) return json(res, 401, {ok: false, err: 'relink'}), true;
    if (p === '/itch/logout') { await kv('DEL', `sk:${b.sk}`); return json(res, 200, {ok: true}), true; }
    if (req.method !== 'POST') { const d = await kv('GET', `save:${who.uid}`); json(res, 200, {ok: true, name: who.name, save: d ? JSON.parse(d) : null, persist: !!KV_URL}); return true; }
    const now = Date.now();
    if (now - (lastWrite.get(who.uid) || 0) < 3000) return json(res, 429, {ok: false, err: 'slow'}), true;
    if (!b.data || typeof b.data !== 'object') return json(res, 400, {ok: false}), true;
    lastWrite.set(who.uid, now);
    const rec = {at: now, data: b.data};
    await kv('SET', `save:${who.uid}`, JSON.stringify(rec)); json(res, 200, {ok: true, at: now}); return true;
  }
  return false;
}

// ---------------- http ----------------
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const u = new URL(req.url, 'http://x');
  if (u.pathname.startsWith('/itch/') || u.pathname === '/save') {
    cloudRoute(req, res, u).then(done => { if (!done) { res.writeHead(404); res.end(); } }).catch(e => { console.error('cloud', e.message); if (!res.headersSent) json(res, 500, {ok: false, err: '伺服器錯誤'}); });
    return;
  }
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, {'Content-Type': 'text/plain; charset=utf-8'});
    res.end(`烽火王座伺服器 ${VER} 運作中・房間 ${rooms.size}・連線 ${clients.size}\n`);
    return;
  }
  res.writeHead(404); res.end();
});
server.on('upgrade', (req, socket) => {
  const key = req.headers['sec-websocket-key'];
  if (!key || (req.headers.upgrade || '').toLowerCase() !== 'websocket') { socket.end('HTTP/1.1 400 Bad Request\r\n\r\n'); return; }
  const accept = crypto.createHash('sha1').update(key + GUID).digest('base64');
  const deflate = /permessage-deflate/i.test(req.headers['sec-websocket-extensions'] || '');
  socket.write(['HTTP/1.1 101 Switching Protocols', 'Upgrade: websocket', 'Connection: Upgrade', `Sec-WebSocket-Accept: ${accept}`,
    ...(deflate ? ['Sec-WebSocket-Extensions: permessage-deflate; server_no_context_takeover; client_no_context_takeover'] : []), '', ''].join('\r\n'));
  const ws = new Sock(socket, deflate);
  const cl = {id: nextId++, ws, name: '指揮官', room: null, p: null};
  clients.add(cl);
  ws.onmessage = m => onMessage(cl, m);
  ws.onclose = () => { clients.delete(cl); leave(cl); };
});
process.on('uncaughtException', e => console.error('uncaught', e));
server.listen(PORT, () => console.log(`烽火王座 server ${VER} listening on :${PORT}`));
