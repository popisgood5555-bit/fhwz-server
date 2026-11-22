// Runs one match of 烽火王座 headless: the same game code as the browser, with drawing and sound replaced by no-ops.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const SRC = fs.readFileSync(path.join(__dirname, 'game_built.js'), 'utf8');
const SCRIPT = new vm.Script(SRC, {filename: 'game_built.js'});

// a do-nothing object that accepts any property access, call or construction
function mock(name) {
  const store = new Map();
  let pr;
  const f = function () {};
  pr = new Proxy(f, {
    get(t, p) {
      if (p === Symbol.iterator) return function* () {};
      if (p === Symbol.toPrimitive) return () => 0;
      if (p === 'then' || p === 'toJSON') return undefined;
      if (p === 'length') return 0;
      if (p === 'classList') { if (!store.has(p)) store.set(p, {contains: () => false, add() {}, remove() {}, toggle() {}}); return store.get(p); }
      if (p === 'children') { if (!store.has(p)) store.set(p, []); return store.get(p); }
      if (p === 'add' || p === 'appendChild' || p === 'prepend') return (...xs) => pr;
      if (p === 'remove') return () => pr;
      if (p === 'userData' || p === 'dataset' || p === 'style') { if (!store.has(p)) store.set(p, {}); return store.get(p); }
      if (p === 'querySelectorAll') return () => [];
      if (p === 'querySelector' || p === 'closest') return () => null;
      if (!store.has(p)) store.set(p, mock(name + '.' + String(p)));
      return store.get(p);
    },
    set(t, p, v) { store.set(p, v); return true; },
    apply() { return mock(name + '()'); },
    construct() { return mock('new ' + name); }
  });
  return pr;
}
// meshes are plain objects with just what game logic touches
function lightMesh() {
  const v3 = () => ({x: 0, y: 0, z: 0, set() {}, copy() {}, setScalar() {}, multiplyScalar() {}});
  const m = {position: v3(), rotation: v3(), scale: v3(), visible: true, userData: {}, children: [], material: {}, add() {}, remove() {}, traverse() {}};
  m.userData = new Proxy({}, {get: (t, p) => p in t ? t[p] : (t[p] = mock('ud'))});
  return m;
}

function createMatch(lineup) {
  const NETSV = {mesh: lightMesh};
  const noop = () => {};
  const store = {};
  const sandbox = {
    NETSV, console: {log: noop, warn: noop, error: (...a) => console.error('[sim]', ...a)},
    Math, JSON, Date, Map, Set, WeakMap, Array, Object, Number, String, Boolean, Symbol, Promise, Proxy, Reflect, Error, TypeError, RangeError, isFinite, isNaN, parseInt, parseFloat, Float32Array, Uint8Array, Uint16Array, Int16Array, Uint32Array,
    window: {innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1, addEventListener: noop, removeEventListener: noop, matchMedia: () => ({matches: false, addEventListener: noop})},
    document: {getElementById: id => mock('#' + id), createElement: () => mock('el'), querySelectorAll: () => [], querySelector: () => null, addEventListener: noop, body: mock('body'), documentElement: mock('html')},
    navigator: {userAgent: 'server', maxTouchPoints: 0},
    THREE: mock('THREE'),
    performance: {now: () => Date.now()},
    requestAnimationFrame: noop, cancelAnimationFrame: noop,
    setTimeout: () => 0, clearTimeout: noop, setInterval: () => 0, clearInterval: noop,
    Image: function () { this.complete = true; },
    matchMedia: () => ({matches: false, addEventListener: noop}),
    localStorage: {getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; }},
    speechSynthesis: {cancel: noop, speak: noop, getVoices: () => []},
    SpeechSynthesisUtterance: function () {},
    fetch: () => new Promise(() => {}),
    location: {search: '', hash: '', href: ''},
    addEventListener: noop
  };
  sandbox.globalThis = sandbox; sandbox.self = sandbox;
  const ctx = vm.createContext(sandbox);
  SCRIPT.runInContext(ctx, {timeout: 20000});
  const api = NETSV.api;
  if (!api) throw new Error('game did not expose the server api');
  api.netStartServer(lineup);
  return api;
}
module.exports = {createMatch};
