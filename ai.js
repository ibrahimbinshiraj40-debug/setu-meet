// Setu Meet — ai.js
// কলের শব্দ থেকেই কথা ধরা (মাইক নিয়ে টানাটানি নেই) → Google Gemini দিয়ে লেখা
(function () {
  'use strict';
  const KEY_LS = 'setu_gemini';
  const MODELS = ['gemini-2.5-flash-lite', 'gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-2.0-flash'];
  let goodModel = localStorage.getItem('setu_gemini_model') || '';
  let limitWarned = 0;

  const getKey = () => (localStorage.getItem(KEY_LS) || '').trim();
  const setKey = (k) => { if (k) localStorage.setItem(KEY_LS, k.trim()); else localStorage.removeItem(KEY_LS); goodModel = ''; };

  // ---------- WAV বানানো ----------
  function wavB64(samples, rate) {
    const n = samples.length, buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
    const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    w(36, 'data'); v.setUint32(40, n * 2, true);
    for (let i = 0; i < n; i++) { const s = Math.max(-1, Math.min(1, samples[i])); v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true); }
    const u = new Uint8Array(buf); let bin = '';
    for (let i = 0; i < u.length; i += 0x8000) bin += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
    return btoa(bin);
  }

  // ---------- Gemini: শব্দ → লেখা ----------
  async function transcribe(b64, langName) {
    const key = getKey();
    if (!key) throw new Error('nokey');
    const prompt = 'Transcribe the speech in this audio exactly as spoken. The speaker is speaking ' + langName +
      '. Write it in the native script of that language. Output ONLY the spoken words, nothing else. If there is no clear human speech, output exactly: -';
    const mk = (think) => JSON.stringify({
      contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: 'audio/wav', data: b64 } }] }],
      generationConfig: think ? { temperature: 0, maxOutputTokens: 400, thinkingConfig: { thinkingBudget: 0 } } : { temperature: 0, maxOutputTokens: 400 }
    });
    const list = goodModel ? [goodModel, ...MODELS.filter((m) => m !== goodModel)] : MODELS;
    const tries = [];
    list.forEach((m) => { tries.push([m, true]); tries.push([m, false]); });
    for (const [m, think] of tries) {
      const body = mk(think);
      let r;
      try {
        r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + m + ':generateContent', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body
        });
      } catch (e) { throw new Error('net'); }
      if (r.status === 404 || r.status === 400) {
        // মডেল নেই বা thinkingConfig না চিনলে — পরেরটা
        if (r.status === 400) {
          const t = await r.text();
          if (/API key not valid|API_KEY_INVALID/i.test(t)) throw new Error('badkey');
        }
        continue;
      }
      if (r.status === 429) { throw new Error('limit'); }
      if (r.status === 403) throw new Error('badkey');
      if (!r.ok) continue;
      const j = await r.json();
      goodModel = m; localStorage.setItem('setu_gemini_model', m);
      const txt = ((((j.candidates || [])[0] || {}).content || {}).parts || []).map((p) => p.text || '').join('').trim();
      if (!txt || txt === '-' || /^[\-.\s]+$/.test(txt)) return '';
      return txt.replace(/^["“]|["”]$/g, '');
    }
    throw new Error('nomodel');
  }

  // ---------- কথা শুরু/শেষ ধরা (VAD) ----------
  // stream থেকে শুনে কথা শেষ হলেই onUtterance(wavBase64) ডাকে
  function Listener(ctx, stream, onUtterance, opts) {
    opts = opts || {};
    const RATE = 16000;
    const src = ctx.createMediaStreamSource(new MediaStream(stream.getAudioTracks()));
    const proc = ctx.createScriptProcessor(4096, 1, 1);
    const mute = ctx.createGain(); mute.gain.value = 0;
    src.connect(proc); proc.connect(mute); mute.connect(ctx.destination);
    const ratio = ctx.sampleRate / RATE;
    let floor = 0.008, speaking = false, silentMs = 0, speechMs = 0;
    let pre = [], cur = [];
    const PRE_MS = 300, END_MS = opts.endMs || 800, MAX_MS = opts.maxMs || 12000;
    this.active = false;
    this.paused = false;
    proc.onaudioprocess = (e) => {
      const inp = e.inputBuffer.getChannelData(0);
      // 16kHz-এ নামানো
      const outLen = Math.floor(inp.length / ratio), out = new Float32Array(outLen);
      for (let i = 0; i < outLen; i++) out[i] = inp[Math.floor(i * ratio)];
      let s = 0; for (let i = 0; i < inp.length; i++) s += inp[i] * inp[i];
      const rms = Math.sqrt(s / inp.length);
      const ms = (inp.length / ctx.sampleRate) * 1000;
      if (this.paused) { if (speaking) finish(false); return; }
      const loud = rms > Math.max(opts.minLevel || 0.012, floor * 3.2);
      if (!speaking) {
        floor = floor * 0.95 + Math.min(rms, 0.05) * 0.05;
        pre.push(out); while (pre.length * ms > PRE_MS) pre.shift();
        if (loud) { speaking = true; this.active = true; cur = pre.slice(); pre = []; silentMs = 0; speechMs = ms; }
      } else {
        cur.push(out);
        speechMs += ms;
        if (loud) silentMs = 0; else silentMs += ms;
        if (silentMs >= END_MS || speechMs >= MAX_MS) finish(true);
      }
    };
    const finish = (send) => {
      speaking = false; this.active = false;
      const chunks = cur; cur = [];
      if (!send || speechMs - silentMs < 350) return;
      let n = 0; chunks.forEach((c) => (n += c.length));
      const all = new Float32Array(n); let o = 0; chunks.forEach((c) => { all.set(c, o); o += c.length; });
      onUtterance(wavB64(all, RATE), speechMs);
    };
    this.flush = () => { if (speaking) finish(true); };
    this.stop = () => { try { proc.disconnect(); src.disconnect(); mute.disconnect(); } catch (e) {} proc.onaudioprocess = null; };
  }

  // একই কথা আবার শোনা ঠেকানো (স্পিকারের প্রতিধ্বনি)
  function norm(s) { return String(s || '').toLowerCase().replace(/[\s.,!?।'"“”‘’\-:;()]+/g, ' ').trim(); }
  function similar(a, b) {
    a = norm(a); b = norm(b);
    if (!a || !b) return false;
    if (a === b || a.includes(b) || b.includes(a)) return true;
    const A = new Set(a.split(' ')), B = b.split(' ');
    let hit = 0; B.forEach((w) => A.has(w) && hit++);
    return hit / Math.max(A.size, B.length) > 0.6;
  }

  // ---------- key ছাড়া: ফোনের নিজের Google কথা-শোনা (অ্যাপ, Android 13+) ----------
  let nSeq = 0, nFails = 0;
  const nWait = {};
  window.__setuSttDone = (id, text, err) => { const w = nWait[id]; delete nWait[id]; if (w) w(text, err); };
  const nativeOK = () => { try { return !!(window.SetuNative && SetuNative.canPcmStt && SetuNative.canPcmStt()) && nFails < 4; } catch (e) { return false; } };
  function nativeStt(b64, langCode) {
    return new Promise((res, rej) => {
      const id = 'n' + (++nSeq);
      const sr = (typeof langInfo === 'function' ? langInfo(langCode).sr : langCode);
      nWait[id] = (text, err) => {
        if (err) { if (err !== 'timeout') nFails++; return rej(new Error('native-' + err)); }
        nFails = 0; res(String(text || '').trim());
      };
      try { SetuNative.sttPcm(id, b64, sr); } catch (e) { delete nWait[id]; rej(new Error('native')); }
      setTimeout(() => { if (nWait[id]) { delete nWait[id]; rej(new Error('native-timeout')); } }, 20000);
    });
  }
  // সব মিলিয়ে: key থাকলে Gemini, না থাকলে/না চললে ফোনের নিজেরটা
  async function stt(b64, langCode) {
    const name = typeof langInfo === 'function' ? langInfo(langCode).en : langCode;
    if (getKey()) {
      try { return await transcribe(b64, name); }
      catch (e) { if (!nativeOK()) throw e; }
    }
    if (nativeOK()) return nativeStt(b64, langCode);
    throw new Error('nokey');
  }

  window.SetuAI = {
    getKey, setKey, hasKey: () => !!getKey(), ready: () => !!getKey() || nativeOK(), nativeOK, stt,
    transcribe, Listener, wavB64, similar,
    limitHit: () => { const n = Date.now(); if (n - limitWarned > 60000) { limitWarned = n; return true; } return false; }
  };
})();
