// Setu Meet — net.js
// সার্ভার ছাড়া মিটিং: হোস্টের ফোনই "সার্ভার" (hub)।
// মেসেজ যায় ফ্রি পাবলিক MQTT সংযোগ দিয়ে (দুটো একসাথে), মিটিং-কোড দিয়ে তালা মারা (AES-GCM)।
// meet.js আগের মতোই socket.emit / socket.on ব্যবহার করে — এখানে সেটাই বানানো হয়েছে।
(function () {
  'use strict';
  const enc = new TextEncoder(), dec = new TextDecoder();
  const rid = (n) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (x) => x.toString(16).padStart(2, '0')).join('');
  const b64 = (buf) => { let s = ''; const u = new Uint8Array(buf); for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s); };
  const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  async function sha(s) { return new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(s))); }
  const hex = (u) => Array.from(u, (x) => x.toString(16).padStart(2, '0')).join('');

  // ---------------- Bus: দুই ব্রোকারে একসাথে, তালা মারা মেসেজ ----------------
  function Bus(room, myId, will) {
    this.room = room; this.myId = myId; this.will = will;
    this.subs = new Set(); this.h = null; this.seen = new Map(); this.clients = []; this.readyCbs = []; this.ready = false;
  }
  Bus.prototype.start = async function () {
    this.base = 'setumeet/v2/' + hex(await sha('setu-topic:' + this.room)).slice(0, 32);
    this.key = await crypto.subtle.importKey('raw', await sha('setu-key:' + this.room), 'AES-GCM', false, ['encrypt', 'decrypt']);
    const willMsg = this.will ? { topic: this.base + '/' + this.will.to, payload: await this._pack(this.will.msg), qos: 0, retain: false } : undefined;
    const brokers = (typeof SETU_BROKERS !== 'undefined' ? SETU_BROKERS : []);
    brokers.forEach((url) => {
      let c;
      try {
        c = mqtt.connect(url, { clientId: 'sm' + rid(8), keepalive: 20, reconnectPeriod: 2500, connectTimeout: 8000, clean: true, will: willMsg });
      } catch (e) { return; }
      this.clients.push(c);
      c.on('connect', () => {
        this.subs.forEach((t) => c.subscribe(this.base + '/' + t, { qos: 0 }));
        if (!this.ready) { this.ready = true; this.readyCbs.forEach((f) => f()); }
      });
      c.on('message', (topic, payload) => this._recv(topic, payload));
      c.on('error', () => {});
    });
  };
  Bus.prototype.onReady = function (f) { if (this.ready) f(); else this.readyCbs.push(f); };
  Bus.prototype.sub = function (t) {
    this.subs.add(t);
    this.clients.forEach((c) => { if (c.connected) c.subscribe(this.base + '/' + t, { qos: 0 }); });
  };
  Bus.prototype._pack = async function (obj) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, this.key, enc.encode(JSON.stringify(obj)));
    return b64(iv) + '.' + b64(ct);
  };
  Bus.prototype.pub = async function (t, obj) {
    obj.mid = obj.mid || rid(6);
    const payload = await this._pack(obj);
    this.clients.forEach((c) => { if (c.connected) c.publish(this.base + '/' + t, payload, { qos: 0 }); });
  };
  Bus.prototype._recv = async function (topic, payload) {
    try {
      const [iv, ct] = String(payload).split('.');
      const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, this.key, unb64(ct));
      const m = JSON.parse(dec.decode(pt));
      if (m.mid) {
        if (this.seen.has(m.mid)) return; // দুই ব্রোকার থেকে একই মেসেজ — একবারই
        this.seen.set(m.mid, 1);
        if (this.seen.size > 3000) this.seen.delete(this.seen.keys().next().value);
      }
      if (this.h) this.h(topic.slice(this.base.length + 1), m);
    } catch (e) { /* অন্য মিটিংয়ের বা নষ্ট মেসেজ */ }
  };
  Bus.prototype.end = function () { this.clients.forEach((c) => { try { c.end(true); } catch (e) {} }); };

  // ---------------- socket-এর মতো ছোট ক্লাস ----------------
  function Sock() { this.id = null; this._h = {}; this.connected = false; }
  Sock.prototype.on = function (ev, fn) { (this._h[ev] = this._h[ev] || []).push(fn); return this; };
  Sock.prototype._fire = function (ev, d) { (this._h[ev] || []).forEach((f) => { try { f(d); } catch (e) { console.log(e); } }); };

  // ================= হোস্টের "সার্ভার" =================
  function Hub(sock, bus) {
    this.sock = sock; this.bus = bus;
    this.seenAt = new Map();
    this.r = { members: new Map(), waiting: new Map(), lobby: false, lockMic: false, banned: new Set(), admitted: new Set() };
    // ২০ সেকেন্ড সাড়া না দিলে ধরে নেওয়া হয় চলে গেছে
    this.sweep = setInterval(() => {
      const now = Date.now();
      for (const id of [...this.r.members.keys(), ...this.r.waiting.keys()]) {
        if (id === this.sock.id) continue;
        if (now - (this.seenAt.get(id) || 0) > 20000) this.leave(id);
      }
    }, 5000);
  }
  Hub.prototype.send = function (id, ev, d) {
    if (id === this.sock.id) { const s = this.sock; setTimeout(() => s._fire(ev, d), 0); return; }
    this.bus.pub('c/' + id, { t: 'e', ev, d });
  };
  Hub.prototype.all = function (ev, d, except) { for (const id of this.r.members.keys()) if (id !== except) this.send(id, ev, d); };
  Hub.prototype.settings = function () { return { lobby: this.r.lobby, lockMic: this.r.lockMic }; };
  Hub.prototype.hosts = function () { return [...this.r.members.values()].filter((p) => p.host); };
  Hub.prototype.waitList = function () { return [...this.r.waiting.values()].map((w) => ({ id: w.p.id, name: w.p.name, lang: w.p.lang })); };
  Hub.prototype.sendLobby = function () { const l = this.waitList(); this.hosts().forEach((h) => this.send(h.id, 'lobby', l)); };
  Hub.prototype.others = function (except) { return [...this.r.members.values()].filter((p) => p.id !== except); };
  Hub.prototype.onBus = function (m) {
    if (!m || !m.from || m.from === this.sock.id) return;
    this.seenAt.set(m.from, Date.now());
    if (m.t === 'ping') { this.bus.pub('c/' + m.from, { t: 'pong' }); return; }
    if (m.t === 'bye') { this.leave(m.from); return; }
    if (m.t === 'e') {
      const ack = m.a ? (res) => this.bus.pub('c/' + m.from, { t: 'a', a: m.a, d: res }) : null;
      this.handle(m.from, m.ev, m.d, ack);
    }
  };
  Hub.prototype.admit = function (p, ack) {
    const r = this.r;
    r.waiting.delete(p.id);
    r.admitted.add(p.clientId);
    r.members.set(p.id, p);
    this.all('p-join', p, p.id);
    const res = { me: p, participants: this.others(p.id), settings: this.settings() };
    if (ack) ack(res); else this.send(p.id, 'admitted', res);
    if (p.host) this.send(p.id, 'lobby', this.waitList());
  };
  Hub.prototype.leave = function (id) {
    const r = this.r;
    if (r.waiting.delete(id)) this.sendLobby();
    if (r.members.delete(id)) this.all('p-leave', id);
    this.seenAt.delete(id);
  };

  const cleanName = (s) => String(s || '').replace(/[<>]/g, '').trim().slice(0, 40) || 'Guest';
  const validLang = (c) => (typeof SETU_LANGS !== 'undefined' ? SETU_LANGS : []).some((l) => l.code === c) ? c : 'en';
  const baseOf = (c) => String(c || '').split('-')[0].toLowerCase();

  async function trMap(text, from, langs) {
    const uniq = [...new Set(langs)];
    const res = await Promise.all(uniq.map((l) => setuTranslate(text, from, l)));
    const m = {}; uniq.forEach((l, i) => (m[l] = res[i])); return m;
  }

  Hub.prototype.handle = async function (from, ev, d, ack) {
    const r = this.r;
    const me = r.members.get(from);
    switch (ev) {
      case 'join': {
        if (!ack || !d) return;
        const isHost = from === this.sock.id;
        const clientId = String(d.clientId || from).replace(/[^a-zA-Z0-9]/g, '').slice(0, 40);
        if (!isHost && r.banned.has(clientId)) return ack({ error: 'banned' });
        const p = { id: from, clientId, name: cleanName(d.name), lang: validLang(d.lang), gender: d.gender === 'm' ? 'm' : 'f',
          mode: 'chat', mic: false, cam: false, hand: false, screen: false, host: isHost, joinedAt: Date.now() };
        if (r.members.has(from)) r.members.delete(from);
        if (!isHost && r.lobby && !r.admitted.has(clientId)) {
          r.waiting.set(from, { p });
          ack({ waiting: true });
          this.hosts().forEach((h) => this.send(h.id, 'knock', { id: from, name: p.name, lang: p.lang }));
          this.sendLobby();
          return;
        }
        this.admit(p, ack);
        return;
      }
      case 'update': {
        if (!me || !d) return;
        for (const k of ['mic', 'cam', 'hand', 'screen']) if (k in d) me[k] = !!d[k];
        if (r.lockMic && !me.host) me.mic = false;
        if (d.mode === 'call' || d.mode === 'chat') me.mode = d.mode;
        if (d.lang) me.lang = validLang(d.lang);
        if (d.gender === 'm' || d.gender === 'f') me.gender = d.gender;
        if (d.name) me.name = cleanName(d.name);
        this.all('p-update', me);
        return;
      }
      case 'signal':
        if (me && d && d.to && r.members.has(d.to)) this.send(d.to, 'signal', { from, data: d.data });
        return;
      case 'chat': {
        if (!me || !d || !String(d.text || '').trim()) return;
        const text = String(d.text).slice(0, 1500);
        const list = [...r.members.values()];
        const map = await trMap(text, me.lang, list.map((x) => x.lang));
        const base = { id: String(d.id || Date.now()), from, name: me.name, srcLang: me.lang, original: text, time: Date.now() };
        list.forEach((x) => this.send(x.id, 'chat', { ...base, text: map[x.lang] }));
        return;
      }
      case 'speech': {
        if (!me || !d || !String(d.text || '').trim()) return;
        if (r.lockMic && !me.host) return;
        const text = String(d.text).slice(0, 800);
        const list = this.others(from);
        if (!list.length) return;
        const map = await trMap(text, me.lang, list.map((x) => x.lang));
        const base = { from, name: me.name, srcLang: me.lang, gender: me.gender, original: text, final: !!d.final, seg: String(d.seg || '') };
        list.forEach((x) => this.send(x.id, 'speech', { ...base, text: map[x.lang], same: baseOf(x.lang) === baseOf(me.lang) }));
        return;
      }
      case 'react':
        if (me && ['like', 'love', 'clap', 'laugh', 'wow', 'sad', 'party'].includes(d)) this.all('react', { from, name: me.name, type: d });
        return;
      case 'host': {
        if (!me || !me.host || !d) return;
        const target = d.target ? r.members.get(d.target) : null;
        const force = (p, what) => { Object.assign(p, what); this.send(p.id, 'force', { ...what, by: me.name }); this.all('p-update', p); };
        switch (d.action) {
          case 'mute': if (target && !target.host) force(target, { mic: false }); break;
          case 'cam-off': if (target && !target.host) force(target, { cam: false }); break;
          case 'mute-all': for (const p of r.members.values()) if (!p.host) force(p, { mic: false }); break;
          case 'kick': case 'ban':
            if (target && !target.host) {
              if (d.action === 'ban') r.banned.add(target.clientId);
              r.admitted.delete(target.clientId);
              this.send(target.id, 'kicked', { ban: d.action === 'ban', by: me.name });
              setTimeout(() => this.leave(target.id), 400);
            }
            break;
          case 'unban': r.banned.clear(); break;
          case 'lobby':
            r.lobby = !!d.value;
            if (!r.lobby) for (const w of [...r.waiting.values()]) this.admit(w.p);
            this.all('settings', this.settings());
            break;
          case 'lock-mic':
            r.lockMic = !!d.value;
            if (r.lockMic) for (const p of r.members.values()) if (!p.host) { p.mic = false; this.all('p-update', p); }
            this.all('settings', this.settings());
            break;
          case 'admit': { const w = r.waiting.get(d.target); if (w) this.admit(w.p); break; }
          case 'admit-all': for (const w of [...r.waiting.values()]) this.admit(w.p); break;
          case 'deny': { const w = r.waiting.get(d.target); if (w) { r.waiting.delete(d.target); this.send(d.target, 'denied'); } break; }
        }
        this.sendLobby();
        return;
      }
    }
  };

  // ================= হোস্ট সংযোগ =================
  function HostSock(room) {
    Sock.call(this);
    this.id = 'h' + rid(6);
    this.bus = new Bus(room, this.id, { to: 'a', msg: { t: 'hostgone' } });
    this.hub = new Hub(this, this.bus);
    this.bus.h = (topic, m) => { if (topic === 'h') this.hub.onBus(m); };
    this.bus.sub('h');
    this.bus.start().then(() => this.bus.onReady(() => {
      this.bus.pub('a', { t: 'hoststart' });
      this.connected = true;
      this._fire('connect');
    }));
  }
  HostSock.prototype = Object.create(Sock.prototype);
  HostSock.prototype.emit = function (ev, d, ack) {
    this.hub.handle(this.id, ev, d, ack ? (res) => setTimeout(() => ack(res), 0) : null);
  };
  HostSock.prototype.disconnect = function () {
    clearInterval(this.hub.sweep);
    this.bus.pub('a', { t: 'hostgone' }).finally(() => setTimeout(() => this.bus.end(), 300));
  };

  // ================= গেস্ট সংযোগ =================
  function GuestSock(room) {
    Sock.call(this);
    this.id = 'g' + rid(6);
    this.closed = false; this.acks = {}; this.seq = 0; this.lastPong = 0; this.noHostShown = false;
    this.bus = new Bus(room, this.id, { to: 'h', msg: { t: 'bye', from: this.id } });
    this.bus.h = (topic, m) => this._onBus(topic, m);
    this.bus.sub('c/' + this.id);
    this.bus.sub('a');
    this.bus.start().then(() => this.bus.onReady(() => this._probe()));
    // প্রতি ৪ সেকেন্ডে হোস্টকে "আছি" বলা
    this.timer = setInterval(() => this._tick(), 4000);
  }
  GuestSock.prototype = Object.create(Sock.prototype);
  GuestSock.prototype._probe = function () {
    if (this.closed) return;
    this.bus.pub('h', { t: 'ping', from: this.id });
    clearTimeout(this.pt);
    this.pt = setTimeout(() => { if (!this.connected && !this.closed) { this._fire('nohost'); } }, 6000);
  };
  GuestSock.prototype._tick = function () {
    if (this.closed || !this.bus.ready) return;
    this.bus.pub('h', { t: 'ping', from: this.id });
    if (this.connected && Date.now() - this.lastPong > 16000) this._lost();
  };
  GuestSock.prototype._lost = function () {
    if (!this.connected) return;
    this.connected = false;
    this._fire('disconnect');
    this._fire('nohost');
  };
  GuestSock.prototype._onBus = function (topic, m) {
    if (topic === 'a') {
      if (m.t === 'hostgone') this._lost();
      if (m.t === 'hoststart') this._probe();
      return;
    }
    if (m.t === 'pong') {
      this.lastPong = Date.now();
      if (!this.connected) { this.connected = true; clearTimeout(this.pt); this._fire('connect'); }
    } else if (m.t === 'a') { const f = this.acks[m.a]; delete this.acks[m.a]; if (f) f(m.d); }
    else if (m.t === 'e') { this.lastPong = Date.now(); this._fire(m.ev, m.d); }
  };
  GuestSock.prototype.emit = function (ev, d, ack) {
    const m = { t: 'e', from: this.id, ev, d };
    if (ack) { m.a = 'a' + (++this.seq); this.acks[m.a] = ack; }
    this.bus.pub('h', m);
  };
  GuestSock.prototype.disconnect = function () {
    this.closed = true;
    clearInterval(this.timer);
    this.bus.pub('h', { t: 'bye', from: this.id }).finally(() => setTimeout(() => this.bus.end(), 300));
  };

  window.SetuNet = { connect: (room, asHost) => (asHost ? new HostSock(room) : new GuestSock(room)) };
})();
