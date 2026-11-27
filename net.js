// Setu Meet — net.js
// সার্ভার ছাড়া মিটিং: হোস্টের ফোনই "সার্ভার" (hub)। সবাই PeerJS-এর ফ্রি পাবলিক সংযোগ দিয়ে হোস্টের সাথে জোড়া লাগে।
// meet.js আগের মতোই socket.emit / socket.on ব্যবহার করে — এখানে সেটাই নকল করা হয়েছে।
(function () {
  'use strict';
  const hubIdOf = (room) => 'setumeet-' + room;
  const peerOpts = () => ({ debug: 0, ...(window.SETU_PEER_OVERRIDE || {}), config: { iceServers: (typeof SETU_ICE !== 'undefined' ? SETU_ICE : [{ urls: 'stun:stun.l.google.com:19302' }]) } });

  // ---------------- socket-এর মতো ছোট ক্লাস ----------------
  function Sock() { this.id = null; this._h = {}; this.connected = false; }
  Sock.prototype.on = function (ev, fn) { (this._h[ev] = this._h[ev] || []).push(fn); return this; };
  Sock.prototype._fire = function (ev, d) { (this._h[ev] || []).forEach((f) => { try { f(d); } catch (e) { console.log(e); } }); };

  // ================= হোস্টের "সার্ভার" =================
  function Hub(sock) {
    this.sock = sock;
    this.conns = new Map();
    this.r = { members: new Map(), waiting: new Map(), lobby: false, lockMic: false, banned: new Set(), admitted: new Set() };
  }
  Hub.prototype.send = function (id, ev, d) {
    if (id === this.sock.id) { const s = this.sock; setTimeout(() => s._fire(ev, d), 0); return; }
    const c = this.conns.get(id);
    if (c && c.open) { try { c.send({ t: 'e', ev, d }); } catch (e) {} }
  };
  Hub.prototype.all = function (ev, d, except) { for (const id of this.r.members.keys()) if (id !== except) this.send(id, ev, d); };
  Hub.prototype.settings = function () { return { lobby: this.r.lobby, lockMic: this.r.lockMic }; };
  Hub.prototype.hosts = function () { return [...this.r.members.values()].filter((p) => p.host); };
  Hub.prototype.waitList = function () { return [...this.r.waiting.values()].map((w) => ({ id: w.p.id, name: w.p.name, lang: w.p.lang })); };
  Hub.prototype.sendLobby = function () { const l = this.waitList(); this.hosts().forEach((h) => this.send(h.id, 'lobby', l)); };
  Hub.prototype.others = function (except) { return [...this.r.members.values()].filter((p) => p.id !== except); };

  Hub.prototype.addConn = function (conn) {
    const id = conn.peer;
    conn.on('open', () => this.conns.set(id, conn));
    conn.on('data', (m) => {
      if (!m || m.t !== 'e') return;
      const ack = m.a ? (res) => { try { conn.send({ t: 'a', a: m.a, d: res }); } catch (e) {} } : null;
      this.handle(id, m.ev, m.d, ack);
    });
    const gone = () => { if (this.conns.get(id) === conn) { this.conns.delete(id); this.leave(id); } };
    conn.on('close', gone);
    conn.on('error', gone);
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
              const c = this.conns.get(target.id);
              setTimeout(() => { try { c && c.close(); } catch (e) {} this.leave(target.id); }, 400);
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
    this.room = room;
    this.closed = false;
    this.hub = null;
    this._start();
  }
  HostSock.prototype = Object.create(Sock.prototype);
  HostSock.prototype._start = function () {
    if (this.closed) return;
    const peer = this.peer = new Peer(hubIdOf(this.room), peerOpts());
    peer.on('open', (id) => {
      this.id = id;
      if (!this.hub) this.hub = new Hub(this);
      this.connected = true;
      this._fire('connect');
    });
    peer.on('connection', (conn) => this.hub && this.hub.addConn(conn));
    peer.on('disconnected', () => { if (!this.closed) setTimeout(() => { try { peer.reconnect(); } catch (e) {} }, 1500); });
    peer.on('error', (e) => {
      if (this.closed) return;
      if (e.type === 'unavailable-id') { // আগের সংযোগ এখনো ছাড়েনি — একটু পরে আবার
        this._fire('busy');
        try { peer.destroy(); } catch (x) {}
        setTimeout(() => this._start(), 3000);
      } else if (['network', 'server-error', 'socket-error', 'socket-closed'].includes(e.type)) {
        setTimeout(() => { try { peer.reconnect(); } catch (x) {} }, 2000);
      }
    });
  };
  HostSock.prototype.emit = function (ev, d, ack) {
    if (!this.hub) return;
    this.hub.handle(this.id, ev, d, ack ? (res) => setTimeout(() => ack(res), 0) : null);
  };
  HostSock.prototype.disconnect = function () {
    this.closed = true;
    try { this.peer.destroy(); } catch (e) {}
  };

  // ================= গেস্ট সংযোগ =================
  function GuestSock(room) {
    Sock.call(this);
    this.room = room;
    this.closed = false;
    this.acks = {};
    this.seq = 0;
    this.conn = null;
    const peer = this.peer = new Peer(peerOpts());
    peer.on('open', (id) => { this.id = id; this._dial(); });
    peer.on('disconnected', () => { if (!this.closed) setTimeout(() => { try { peer.reconnect(); } catch (e) {} }, 1500); });
    peer.on('error', (e) => {
      if (this.closed) return;
      if (e.type === 'peer-unavailable') { this._fire('nohost'); this._retry(4000); }
      else if (['network', 'server-error', 'socket-error', 'socket-closed'].includes(e.type)) setTimeout(() => { try { peer.reconnect(); } catch (x) {} }, 2000);
    });
  }
  GuestSock.prototype = Object.create(Sock.prototype);
  GuestSock.prototype._retry = function (ms) {
    clearTimeout(this._rt);
    this._rt = setTimeout(() => { if (!this.closed && !this.connected) this._dial(); }, ms);
  };
  GuestSock.prototype._dial = function () {
    if (this.closed || !this.peer || this.peer.destroyed) return;
    if (this.peer.disconnected) { try { this.peer.reconnect(); } catch (e) {} return this._retry(3000); }
    const conn = this.conn = this.peer.connect(hubIdOf(this.room), { serialization: 'json', reliable: true });
    const t = setTimeout(() => { if (!conn.open) { try { conn.close(); } catch (e) {} this._fire('nohost'); this._retry(3000); } }, 15000);
    conn.on('open', () => { clearTimeout(t); this.connected = true; this._fire('connect'); });
    conn.on('data', (m) => {
      if (!m) return;
      if (m.t === 'a') { const f = this.acks[m.a]; delete this.acks[m.a]; if (f) f(m.d); }
      else if (m.t === 'e') this._fire(m.ev, m.d);
    });
    conn.on('close', () => {
      clearTimeout(t);
      if (this.conn !== conn) return;
      if (this.connected) { this.connected = false; this._fire('disconnect'); }
      if (!this.closed) { this._fire('nohost'); this._retry(3000); }
    });
  };
  GuestSock.prototype.emit = function (ev, d, ack) {
    const c = this.conn;
    if (!c || !c.open) return;
    const m = { t: 'e', ev, d };
    if (ack) { m.a = 'a' + (++this.seq); this.acks[m.a] = ack; }
    try { c.send(m); } catch (e) {}
  };
  GuestSock.prototype.disconnect = function () {
    this.closed = true;
    clearTimeout(this._rt);
    try { this.conn && this.conn.close(); } catch (e) {}
    try { this.peer.destroy(); } catch (e) {}
  };

  window.SetuNet = {
    connect: (room, asHost) => (asHost ? new HostSock(room) : new GuestSock(room)),
    Hub
  };
})();
