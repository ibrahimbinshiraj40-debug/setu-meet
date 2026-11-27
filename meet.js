// Setu Meet — মিটিং রুম (ভাষা বাছাই, চ্যাট, কল, লাইভ অনুবাদ)
(function () {
  'use strict';
  const roomId = (new URLSearchParams(location.search).get('r') || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (!roomId) { location.href = 'index.html'; return; }
  const LINK = setuMeetLink(roomId);
  const REACTS = { like: '👍', love: '❤️', clap: '👏', laugh: '😂', wow: '😮', sad: '😢', party: '🎉' };
  let SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  // অ্যাপের (APK) ভেতরে: ফোনের নিজের কথা-শোনা সিস্টেম ব্যবহার
  if (window.SetuNative) {
    SR = function NativeSR() { this.lang = 'en-US'; this.onresult = this.onerror = this.onend = null; };
    SR.prototype.start = function () { window.__setuSR = this; SetuNative.startListen(this.lang); };
    SR.prototype.stop = function () { SetuNative.stopListen(); };
    SR.prototype._ev = function (type, text) {
      if (window.__setuSR !== this) return;
      const mk = (fin) => { const r = [{ transcript: text }]; r.isFinal = fin; return { resultIndex: 0, results: [r] }; };
      if (type === 'partial' && this.onresult) this.onresult(mk(false));
      else if (type === 'final' && this.onresult) this.onresult(mk(true));
      else if (type === 'error' && this.onerror) this.onerror({ error: text });
      else if (type === 'end') { window.__setuSR = null; if (this.onend) this.onend(); }
    };
  }

  // ---------- অবস্থা ----------
  let myLang = null;
  let myGender = localStorage.getItem('setu_gender') === 'm' ? 'm' : 'f';
  let myName = localStorage.getItem('setu_name') || '';
  let socket = null, me = null, joinedOnce = false, wantMode = 'chat';
  const parts = new Map(); // অন্যরা: id -> participant
  const ICE = SETU_ICE;
  let localStream = null, micTrack = null, camTrack = null, screenTrack = null;
  let inCall = false, prefMic = true, prefCam = true;
  const peers = new Map(); // id -> {pc, snd:{audio,video}, stream, pending:[], offerer}
  const tiles = new Map(); // id|'me' -> {el, video}
  const set = { captions: true, original: false, headphones: false };
  let sideMode = null, unread = 0;
  let roomSet = { lobby: false, lockMic: false }, lobby = [];
  const isHost = () => !!(me && me.host);
  let clientId = localStorage.getItem('setu_cid');
  if (!clientId) { clientId = Array.from(crypto.getRandomValues(new Uint8Array(10)), (x) => x.toString(16).padStart(2, '0')).join(''); localStorage.setItem('setu_cid', clientId); }
  const hostKey = localStorage.getItem('setu_hk_' + roomId) || '';
  const shownMsg = new Set();


  // ---------- আইকন বসানো ----------
  const putIcons = () => {
    const m = { pvMic: 'mic', pvCam: 'cam', callI: 'video', chatI: 'chat', chLink: 'link', chPeople: 'people', chMore: 'more', chCallI: 'phone', chLeave: 'end',
      sideClose: 'close', dictate: 'mic', sendBtn: 'send', bReact: 'smile', bScreen: 'screen', bHand: 'hand', bChatM: 'chat', bMore: 'more', bLeave: 'end', bPeople: 'people', bChat: 'chat', bCC: 'cc' };
    for (const id in m) { const el = $('#' + id); if (el) el.innerHTML = icon(m[id]) + (el.querySelector('.cnt') ? el.querySelector('.cnt').outerHTML : ''); }
    $('#changeLang').innerHTML = icon('globe') + '<span data-i18n="changeLang">' + esc(t('changeLang')) + '</span>';
  };
  putIcons();
  $('#reactPop').innerHTML = Object.entries(REACTS).map(([k, e]) => `<button data-r="${k}">${e}</button>`).join('');

  // ================= ধাপ ১: ভাষা =================
  let pickedLang = null;
  function renderLangGrid(grid, q, selected, onPick) {
    q = (q || '').toLowerCase().trim();
    const list = SETU_LANGS.filter((l) => !q || (l.name + ' ' + l.en).toLowerCase().includes(q));
    grid.innerHTML = list.map((l) => `<button class="lang-card${l.code === selected ? ' sel' : ''}" data-c="${l.code}"><b>${esc(l.name)}</b><span>${esc(l.en)}</span></button>`).join('');
    grid.onclick = (e) => { const b = e.target.closest('.lang-card'); if (b) onPick(b.dataset.c); };
  }
  function pickLang(c) {
    pickedLang = c;
    renderLangGrid($('#langGrid'), $('#langSearch').value, c, pickLang);
    $('#langNext').disabled = false;
    loadLang(c).then(setLangTitle);
  }
  function setLangTitle() {
    const loc = t('chooseLang');
    $('#langTitle').textContent = loc === EN.chooseLang ? loc : loc + ' · ' + EN.chooseLang;
    $('#langWhyEn').textContent = t('langWhy') === EN.langWhy ? '' : EN.langWhy;
  }
  const guess = guessLang();
  loadLang(guess).then(setLangTitle);
  renderLangGrid($('#langGrid'), '', null, pickLang);
  $('#langSearch').oninput = () => renderLangGrid($('#langGrid'), $('#langSearch').value, pickedLang, pickLang);
  $('#langNext').onclick = () => {
    if (!pickedLang) return toast(t('langRequired'));
    myLang = pickedLang;
    localStorage.setItem('setu_lang', myLang);
    $('#stepLang').classList.add('hidden');
    $('#stepSetup').classList.remove('hidden');
    $('#name').value = myName;
    updateSetup();
    tryAutoPreview();
  };

  // ================= ধাপ ২: সেটআপ =================
  function updateSetup() {
    $$('#genderSeg button').forEach((b) => b.classList.toggle('on', b.dataset.g === myGender));
    $('#pvMic').classList.toggle('off', !prefMic);
    $('#pvMic').innerHTML = icon(prefMic ? 'mic' : 'micOff');
    $('#pvCam').classList.toggle('off', !prefCam);
    $('#pvCam').innerHTML = icon(prefCam ? 'cam' : 'camOff');
    $('#pvAv').textContent = ($('#name').value.trim()[0] || '?').toUpperCase();
    const v = $('#pvVideo');
    const on = prefCam && camTrack;
    v.style.opacity = on ? 1 : 0;
    $('#pvAv').style.display = on ? 'none' : '';
  }
  $('#genderSeg').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; myGender = b.dataset.g; localStorage.setItem('setu_gender', myGender); updateSetup(); };
  $('#name').oninput = updateSetup;
  $('#pvMic').onclick = () => { prefMic = !prefMic; if (micTrack) micTrack.enabled = prefMic; updateSetup(); };
  $('#pvCam').onclick = async () => {
    prefCam = !prefCam;
    if (prefCam && !localStream) await getMedia();
    if (camTrack) camTrack.enabled = prefCam;
    updateSetup();
  };
  $('#changeLang').onclick = () => { $('#stepSetup').classList.add('hidden'); $('#stepLang').classList.remove('hidden'); };
  async function tryAutoPreview() {
    try {
      const p = await navigator.permissions.query({ name: 'camera' });
      if (p.state === 'granted') await getMedia();
    } catch (e) {}
    updateSetup();
  }
  function readName() {
    const n = $('#name').value.trim();
    if (!n) { toast(t('needName')); $('#name').focus(); return false; }
    myName = n; localStorage.setItem('setu_name', n); return true;
  }
  $('#goChat').onclick = () => { if (!readName()) return; unlockAudio(); connect('chat'); };
  $('#goCall').onclick = async () => { if (!readName()) return; unlockAudio(); connect('call'); };

  // ================= মিডিয়া =================
  async function getMedia() {
    if (localStream) return localStream;
    const audio = { echoCancellation: true, noiseSuppression: true, autoGainControl: true };
    const video = { width: { ideal: 640 }, height: { ideal: 360 }, frameRate: { ideal: 24, max: 30 }, facingMode: 'user' };
    try { localStream = await navigator.mediaDevices.getUserMedia({ audio, video }); }
    catch (e) {
      try { localStream = await navigator.mediaDevices.getUserMedia({ audio }); }
      catch (e2) { localStream = new MediaStream(); toast(t('noMedia'), 4000); }
    }
    micTrack = localStream.getAudioTracks()[0] || null;
    camTrack = localStream.getVideoTracks()[0] || null;
    if (micTrack) micTrack.enabled = prefMic;
    if (camTrack) camTrack.enabled = prefCam;
    $('#pvVideo').srcObject = localStream;
    return localStream;
  }
  const outVideo = () => screenTrack || camTrack;

  // iPhone/Android-এ অডিও চালু রাখার জন্য
  const ttsAudio = new Audio();
  ttsAudio.preload = 'auto';
  function silentWav() {
    const n = 800, b = new ArrayBuffer(44 + n), v = new DataView(b);
    const w = (o, str) => { for (let i = 0; i < str.length; i++) v.setUint8(o + i, str.charCodeAt(i)); };
    w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true);
    v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, 8000, true); v.setUint32(28, 8000, true);
    v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, 'data'); v.setUint32(40, n, true);
    for (let i = 0; i < n; i++) v.setUint8(44 + i, 128);
    return URL.createObjectURL(new Blob([b], { type: 'audio/wav' }));
  }
  function unlockAudio() {
    try { ttsAudio.src = silentWav(); ttsAudio.play().catch(() => {}); } catch (e) {}
    try { if (window.speechSynthesis) speechSynthesis.speak(new SpeechSynthesisUtterance('')); } catch (e) {}
  }

  // ================= সংযোগ =================
  function connect(mode) {
    wantMode = mode;
    $('#stepSetup').classList.add('hidden');
    $('#room').classList.remove('hidden');
    $('#codeTxt').textContent = roomId;
    toast(t('connecting'), 1500);
    if (socket) socket.disconnect();
    socket = SetuNet.connect(roomId, !!hostKey);
    socket.on('nohost', () => {
      if (me) return;
      $('#room').classList.add('hidden');
      $('#waitScr').classList.remove('hidden');
      $('#waitScr h2').textContent = t('waitingHost');
    });
    socket.on('connect', doJoin);
    socket.on('p-join', onPJoin);
    socket.on('p-update', onPUpdate);
    socket.on('p-leave', onPLeave);
    socket.on('signal', onSignal);
    socket.on('chat', onChat);
    socket.on('speech', onSpeech);
    socket.on('react', onReact);
    socket.on('admitted', onJoined);
    socket.on('denied', () => showEnd(t('denied'), true));
    socket.on('kicked', (d) => { kickedOut = true; showEnd(d && d.ban ? t('banned') : t('kicked'), !(d && d.ban)); });
    socket.on('force', onForce);
    socket.on('settings', onSettings);
    socket.on('lobby', (l) => { lobby = l || []; renderPeople(); renderKnocks(); });
    socket.on('knock', (k) => { if (isHost()) { beep(740); setTimeout(() => beep(990), 180); } });
    socket.on('disconnect', () => { for (const id of [...peers.keys()]) closePeer(id); if (me && !kickedOut) toast(t('connecting'), 3000); });
    renderRoom();
  }

  let kickedOut = false;
  function doJoin() {
    if (kickedOut) return;
    socket.emit('join', { room: roomId, name: myName, lang: myLang, gender: myGender, mode: 'chat', clientId, hostKey }, onJoined);
  }
  async function onJoined(res) {
      if (!res) return;
      if (res.error === 'banned') return showEnd(t('banned'), false);
      if (res.error) return toast('Error');
      if (res.waiting) {
        $('#waitScr h2').textContent = t('waiting');
        $('#room').classList.add('hidden');
        $('#waitScr').classList.remove('hidden');
        return;
      }
      $('#waitScr').classList.add('hidden');
      $('#room').classList.remove('hidden');
      me = res.me;
      if (window.SetuNative && SetuNative.meetingOn) try { SetuNative.meetingOn(); } catch (e) {}
      roomSet = res.settings || roomSet;
      if (roomSet.lockMic && !isHost()) prefMic = false;
      parts.clear();
      res.participants.forEach((p) => parts.set(p.id, p));
      const firstTime = !joinedOnce;
      joinedOnce = true;
      if (firstTime) addSys(myName + ' · ' + langInfo(myLang).name);
      if (wantMode === 'call') await startCall();
      else { renderRoom(); openSide('chat'); }
      renderPeople();
  }

  // ---------- হোস্ট যা করলে আমার দিকে কী হবে ----------
  function onForce(d) {
    if (d.mic === false) {
      prefMic = false;
      if (micTrack) micTrack.enabled = false;
      stopRec();
      sendUpdate({ mic: false });
      toast(t('mutedBy') + ': ' + (d.by || t('host')));
    }
    if (d.cam === false) {
      prefCam = false;
      if (camTrack) camTrack.enabled = false;
      sendUpdate({ cam: false });
      toast(t('camOffBy') + ': ' + (d.by || t('host')));
    }
    renderBar(); updateTile('me');
  }
  function onSettings(st) {
    const was = roomSet.lockMic;
    roomSet = st;
    if (!isHost()) {
      if (st.lockMic && !was) { onForce({ mic: false, by: t('host') }); toast(t('micsLockedOn')); }
      if (!st.lockMic && was) toast(t('micsUnlocked'));
    }
    renderPeople(); renderBar();
  }
  function hostDo(action, target, value) { if (socket && isHost()) socket.emit('host', { action, target, value }); }

  // কেউ ঢুকতে চাইলে হোস্টের স্ক্রিনে কার্ড
  function renderKnocks() {
    const box = $('#knocks');
    if (!isHost() || sideMode === 'people') { box.innerHTML = ''; return; }
    box.innerHTML = lobby.slice(0, 3).map((w) => `<div class="knock"><div class="av" style="width:38px;font-size:15px">${esc((w.name || '?')[0].toUpperCase())}</div>
      <div class="inf"><b>${esc(w.name)}</b><span>${esc(t('wantsJoin'))} · ${esc(langInfo(w.lang).name)}</span></div>
      <button class="mini" data-d="${w.id}">${esc(t('deny'))}</button><button class="mini ok" data-a="${w.id}">${esc(t('admit'))}</button></div>`).join('')
      + (lobby.length > 1 ? `<button class="mini ok" data-all="1" style="align-self:flex-start">${esc(t('admitAll'))} (${lobby.length})</button>` : '');
  }
  $('#knocks').onclick = (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.a) hostDo('admit', b.dataset.a);
    if (b.dataset.d) hostDo('deny', b.dataset.d);
    if (b.dataset.all) hostDo('admit-all');
  };

  function showEnd(msg, canRejoin) {
    try { if (recorder) recorder.stop(); } catch (e) {}
    if (inCall) { for (const id of [...peers.keys()]) closePeer(id); stopScreen(true); if (localStream) localStream.getTracks().forEach((tr) => tr.stop()); localStream = micTrack = camTrack = null; inCall = false; }
    stopRec();
    kickedOut = true;
    if (window.SetuNative && SetuNative.meetingOff) try { SetuNative.meetingOff(); } catch (e) {}
    if (socket) socket.disconnect();
    $('#room').classList.add('hidden');
    $('#waitScr').classList.add('hidden');
    $('#knocks').innerHTML = '';
    $('#endedTxt').textContent = msg;
    $('#rejoin').classList.toggle('hidden', !canRejoin);
    $('#ended').classList.remove('hidden');
  }
  $('#waitCancel').onclick = () => { if (socket) socket.disconnect(); location.href = 'index.html'; };

  // ---------- অংশগ্রহণকারী ----------
  function onPJoin(p) {
    parts.set(p.id, p);
    addSys(p.name + ' ' + t('joined') + ' · ' + langInfo(p.lang).name);
    beep(660);
    renderPeople(); renderCount();
  }
  function onPUpdate(p) {
    if (me && p.id === me.id) { me = p; renderPeople(); renderKnocks(); renderBar(); updateTile('me'); return; }
    const old = parts.get(p.id);
    parts.set(p.id, p);
    if (old && !old.hand && p.hand) { toast(p.name + ' ' + t('raised')); chime(); }
    if (old && old.mode === 'call' && p.mode !== 'call') closePeer(p.id);
    updateTile(p.id);
    renderPeople(); renderCount();
  }
  function onPLeave(id) {
    const p = parts.get(id);
    if (p) addSys(p.name + ' ' + t('left'));
    parts.delete(id);
    closePeer(id);
    renderPeople(); renderCount();
  }
  function sendUpdate(d) { if (socket) socket.emit('update', d); }

  // ================= কল =================
  async function startCall() {
    await getMedia();
    if (roomSet.lockMic && !isHost()) prefMic = false;
    if (micTrack) micTrack.enabled = prefMic;
    if (camTrack) camTrack.enabled = prefCam;
    inCall = true;
    wantMode = 'call';
    $('#room').classList.remove('chatmode');
    ensureTile('me');
    tiles.get('me').video.srcObject = new MediaStream(outVideo() ? [outVideo()] : []);
    sendUpdate({ mode: 'call', mic: !!(micTrack && prefMic), cam: !!(camTrack && prefCam), screen: false });
    if (me) Object.assign(me, { mode: 'call', mic: !!(micTrack && prefMic), cam: !!(camTrack && prefCam) });
    for (const p of parts.values()) if (p.mode === 'call') makeOffer(p.id);
    watchLevel('me', localStream);
    startRec();
    if (!SR) toast(t('noSpeech'), 5000);
    keepAwake();
    if (window.innerWidth <= 860) closeSide();
    renderRoom(); layout();
  }

  function leaveCall() {
    for (const id of [...peers.keys()]) closePeer(id);
    stopScreen(true);
    stopRec();
    if (localStream) localStream.getTracks().forEach((tr) => tr.stop());
    localStream = micTrack = camTrack = null;
    inCall = false; wantMode = 'chat';
    tiles.forEach((tl) => tl.el.remove()); tiles.clear();
    $('#caps').innerHTML = '';
    sendUpdate({ mode: 'chat', mic: false, cam: false, screen: false, hand: false });
    if (me) Object.assign(me, { mode: 'chat', hand: false });
    if (window.SetuNative) try { SetuNative.callEnded(); } catch (e) {}
    $('#room').classList.add('chatmode');
    openSide('chat');
    renderRoom();
  }

  function newPeer(id, offerer) {
    const pc = new RTCPeerConnection({ iceServers: ICE, iceCandidatePoolSize: 4, bundlePolicy: 'max-bundle' });
    const peer = { pc, snd: {}, stream: new MediaStream(), pending: [], offerer, attached: false };
    peers.set(id, peer);
    ensureTile(id);
    tiles.get(id).video.srcObject = peer.stream;
    pc.onicecandidate = (e) => { if (e.candidate) socket.emit('signal', { to: id, data: { candidate: e.candidate } }); };
    pc.ontrack = (e) => {
      peer.stream.getTracks().filter((x) => x.kind === e.track.kind).forEach((x) => peer.stream.removeTrack(x));
      peer.stream.addTrack(e.track);
      const v = tiles.get(id) && tiles.get(id).video;
      if (v) { v.srcObject = peer.stream; v.play().catch(needTap); }
      if (e.track.kind === 'audio') watchLevel(id, peer.stream);
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' && peer.offerer) {
        try { pc.restartIce(); } catch (e) {}
        pc.createOffer({ iceRestart: true }).then((o) => pc.setLocalDescription(o))
          .then(() => socket.emit('signal', { to: id, data: { sdp: pc.localDescription } })).catch(() => {});
      }
    };
    return peer;
  }

  async function makeOffer(id) {
    if (peers.has(id)) closePeer(id);
    const peer = newPeer(id, true);
    const pc = peer.pc;
    const ta = pc.addTransceiver(micTrack || 'audio', { direction: 'sendrecv', streams: [localStream] });
    const tv = pc.addTransceiver(outVideo() || 'video', { direction: 'sendrecv', streams: [localStream] });
    peer.snd = { audio: ta.sender, video: tv.sender };
    peer.attached = true;
    try {
      await pc.setLocalDescription(await pc.createOffer());
      socket.emit('signal', { to: id, data: { sdp: pc.localDescription } });
    } catch (e) { console.log('offer fail', e); }
  }

  async function onSignal({ from, data }) {
    if (!inCall || !data) return;
    try {
      if (data.sdp) {
        const desc = data.sdp;
        let peer = peers.get(from);
        if (desc.type === 'offer') {
          if (peer && peer.pc.signalingState !== 'stable') {
            if (socket.id < from) { closePeer(from); peer = null; } // ভদ্র পক্ষ নিজেরটা বাদ দেয়
            else return;
          }
          if (!peer) peer = newPeer(from, false);
          const pc = peer.pc;
          await pc.setRemoteDescription(desc);
          if (!peer.attached) {
            for (const tr of pc.getTransceivers()) {
              const kind = tr.receiver.track.kind;
              tr.direction = 'sendrecv';
              const track = kind === 'audio' ? micTrack : outVideo();
              if (track) await tr.sender.replaceTrack(track);
              try { if (localStream && tr.sender.setStreams) tr.sender.setStreams(localStream); } catch (e) {}
              peer.snd[kind] = tr.sender;
            }
            peer.attached = true;
          }
          await pc.setLocalDescription(await pc.createAnswer());
          socket.emit('signal', { to: from, data: { sdp: pc.localDescription } });
          flushCand(peer);
        } else if (desc.type === 'answer' && peer && peer.pc.signalingState === 'have-local-offer') {
          await peer.pc.setRemoteDescription(desc);
          flushCand(peer);
        }
      } else if (data.candidate) {
        const peer = peers.get(from);
        if (peer && peer.pc.remoteDescription) await peer.pc.addIceCandidate(data.candidate).catch(() => {});
        else if (peer) peer.pending.push(data.candidate);
        else { pendingEarly[from] = pendingEarly[from] || []; pendingEarly[from].push(data.candidate); }
      }
    } catch (e) { console.log('signal err', e); }
  }
  const pendingEarly = {};
  function flushCand(peer) {
    const id = [...peers.entries()].find(([, p]) => p === peer);
    const early = id ? (pendingEarly[id[0]] || []) : [];
    if (id) delete pendingEarly[id[0]];
    [...early, ...peer.pending].forEach((c) => peer.pc.addIceCandidate(c).catch(() => {}));
    peer.pending = [];
  }
  function closePeer(id) {
    const peer = peers.get(id);
    if (peer) { try { peer.pc.close(); } catch (e) {} peers.delete(id); }
    const tl = tiles.get(id);
    if (tl) { tl.el.remove(); tiles.delete(id); }
    levels.delete(id);
    layout(); renderAlone();
  }
  function replaceAll(kind, track) {
    for (const p of peers.values()) if (p.snd[kind]) p.snd[kind].replaceTrack(track).catch(() => {});
  }

  // ব্রাউজার শব্দ আটকে দিলে: একবার স্ক্রিনে চাপলেই সবার শব্দ চালু
  let tapAsked = false;
  function needTap() {
    if (tapAsked) return; tapAsked = true;
    toast(t('tapSound'), 6000);
    const go = () => { tapAsked = false; tiles.forEach((tl) => tl.video.play().catch(() => {})); document.removeEventListener('click', go, true); };
    document.addEventListener('click', go, true);
  }

  // অ্যাপের Back বাটন: আগে খোলা প্যানেল/মেনু বন্ধ
  window.setuBack = function () {
    if (!$('#morePop').classList.contains('hidden')) { $('#morePop').classList.add('hidden'); return true; }
    if (!$('#reactPop').classList.contains('hidden')) { $('#reactPop').classList.add('hidden'); return true; }
    if (!$('#langModal').classList.contains('hidden')) { $('#langModal').classList.add('hidden'); return true; }
    if (inCall && sideMode) { closeSide(); return true; }
    if (!inCall && sideMode === 'people') { openSide('chat'); return true; }
    if (!$('#stepSetup').classList.contains('hidden')) { $('#stepSetup').classList.add('hidden'); $('#stepLang').classList.remove('hidden'); return true; }
    if (me && !$('#room').classList.contains('hidden')) { toast(t('leaveHint')); return true; }
    return false;
  };

  // ---------- টাইল ----------
  function ensureTile(id) {
    if (tiles.has(id)) return tiles.get(id);
    const el = document.createElement('div');
    el.className = 'tile' + (id === 'me' ? ' me' : '');
    el.innerHTML = `<video autoplay playsinline ${id === 'me' ? 'muted' : ''}></video><div class="av"></div><div class="trn">${esc(t('translated'))}</div><div class="badges"></div><div class="nm"><span class="t"></span><span class="lg"></span></div>`;
    $('#grid').appendChild(el);
    const tl = { el, video: el.querySelector('video') };
    tiles.set(id, tl);
    updateTile(id);
    layout(); renderAlone();
    return tl;
  }
  function updateTile(id) {
    const tl = tiles.get(id); if (!tl) return;
    const p = id === 'me' ? { ...(me || {}), name: myName, lang: myLang, mic: !!(micTrack && micTrack.enabled), cam: !!(camTrack && camTrack.enabled), screen: !!screenTrack } : parts.get(id);
    if (!p) return;
    tl.el.classList.toggle('nocam', !p.cam && !p.screen);
    tl.el.classList.toggle(id === 'me' ? 'sharing' : 'screen', !!p.screen);
    tl.el.querySelector('.av').textContent = (p.name || '?')[0].toUpperCase();
    tl.el.querySelector('.t').textContent = id === 'me' ? myName + ' (' + t('you') + ')' : p.name;
    tl.el.querySelector('.lg').textContent = langInfo(p.lang).name;
    tl.el.querySelector('.badges').innerHTML = (p.hand ? `<i class="hnd">${icon('hand')}</i>` : '') + (!p.mic ? `<i>${icon('micOff')}</i>` : '');
  }
  function layout() {
    const g = $('#grid'); if (!g) return;
    const n = Math.max(1, tiles.size);
    const W = g.clientWidth || window.innerWidth, H = g.clientHeight || window.innerHeight * 0.7;
    let best = 1, bestSize = 0;
    for (let c = 1; c <= n; c++) {
      const r = Math.ceil(n / c);
      const w = Math.min(W / c, (H / r) * 16 / 9);
      if (w > bestSize) { bestSize = w; best = c; }
    }
    g.style.setProperty('--cols', best);
  }
  window.addEventListener('resize', layout);
  function renderAlone() {
    $('#alone').classList.toggle('hidden', !(inCall && peers.size === 0));
  }

  // ---------- কথা বলার ইন্ডিকেটর ----------
  let actx = null;
  const levels = new Map();
  function watchLevel(id, stream) {
    try {
      if (!stream || !stream.getAudioTracks().length) return;
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      const src = actx.createMediaStreamSource(new MediaStream(stream.getAudioTracks()));
      const an = actx.createAnalyser(); an.fftSize = 512;
      src.connect(an);
      levels.set(id, { an, buf: new Uint8Array(an.fftSize) });
    } catch (e) {}
  }
  setInterval(() => {
    levels.forEach((l, id) => {
      l.an.getByteTimeDomainData(l.buf);
      let s = 0; for (let i = 0; i < l.buf.length; i++) { const v = (l.buf[i] - 128) / 128; s += v * v; }
      const on = Math.sqrt(s / l.buf.length) > 0.04;
      const tl = tiles.get(id); if (tl) tl.el.classList.toggle('speaking', on);
    });
  }, 180);

  // ---------- কন্ট্রোল ----------
  async function toggleMic() {
    if (roomSet.lockMic && !isHost() && !(micTrack && micTrack.enabled)) return toast(t('micLocked'));
    if (!micTrack) {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
        micTrack = s.getAudioTracks()[0]; localStream.addTrack(micTrack); replaceAll('audio', micTrack); watchLevel('me', localStream);
      } catch (e) { return toast(t('noMedia')); }
      prefMic = true;
    } else prefMic = !micTrack.enabled;
    micTrack.enabled = prefMic;
    sendUpdate({ mic: prefMic });
    if (prefMic) startRec(); else stopRec();
    renderBar(); updateTile('me');
  }
  async function toggleCam() {
    if (!camTrack) {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 360 }, frameRate: { ideal: 24, max: 30 }, facingMode: 'user' } });
        camTrack = s.getVideoTracks()[0]; localStream.addTrack(camTrack);
        if (!screenTrack) { replaceAll('video', camTrack); tiles.get('me').video.srcObject = new MediaStream([camTrack]); }
      } catch (e) { return toast(t('noMedia')); }
      prefCam = true;
    } else prefCam = !camTrack.enabled;
    camTrack.enabled = prefCam;
    sendUpdate({ cam: prefCam });
    renderBar(); updateTile('me');
  }
  async function toggleScreen() {
    if (screenTrack) return stopScreen();
    if (!navigator.mediaDevices.getDisplayMedia) return toast(t('noScreen'));
    try {
      const s = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 15 }, audio: false });
      screenTrack = s.getVideoTracks()[0];
      screenTrack.onended = () => stopScreen();
      replaceAll('video', screenTrack);
      tiles.get('me').video.srcObject = new MediaStream([screenTrack]);
      sendUpdate({ screen: true });
      renderBar(); updateTile('me');
    } catch (e) {}
  }
  function stopScreen(silent) {
    if (!screenTrack) return;
    screenTrack.onended = null; screenTrack.stop(); screenTrack = null;
    if (!silent) {
      replaceAll('video', camTrack || null);
      if (tiles.get('me')) tiles.get('me').video.srcObject = new MediaStream(camTrack ? [camTrack] : []);
      sendUpdate({ screen: false });
      renderBar(); updateTile('me');
    }
  }
  function toggleHand() {
    if (!me) return;
    me.hand = !me.hand;
    if (me.hand) chime();
    sendUpdate({ hand: me.hand });
    renderBar(); updateTile('me');
  }

  // ---------- রেকর্ড ----------
  let recorder = null, recStart = 0, recTimer = null;
  async function toggleRecord() {
    if (recorder) { recorder.stop(); return; }
    if (!navigator.mediaDevices.getDisplayMedia || !window.MediaRecorder) return toast(t('noRecord'), 4000);
    let disp;
    try { disp = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: true, preferCurrentTab: true, selfBrowserSurface: 'include' }); }
    catch (e) { return; }
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    const dest = ac.createMediaStreamDestination();
    const addSrc = (tracks) => { if (tracks.length) ac.createMediaStreamSource(new MediaStream(tracks)).connect(dest); };
    const tabAudio = disp.getAudioTracks();
    addSrc(tabAudio);
    if (micTrack) addSrc([micTrack]);
    if (!tabAudio.length) peers.forEach((p) => addSrc(p.stream.getAudioTracks()));
    const mix = new MediaStream([...disp.getVideoTracks(), ...dest.stream.getAudioTracks()]);
    const mime = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'].find((m) => MediaRecorder.isTypeSupported(m)) || '';
    const chunks = [];
    recorder = new MediaRecorder(mix, mime ? { mimeType: mime } : undefined);
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    recorder.onstop = () => {
      disp.getTracks().forEach((x) => x.stop()); ac.close().catch(() => {});
      const blob = new Blob(chunks, { type: recorder.mimeType || 'video/webm' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'SetuMeet-' + roomId + '-' + new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-') + (blob.type.includes('mp4') ? '.mp4' : '.webm');
      document.body.appendChild(a); a.click(); a.remove();
      recorder = null; clearInterval(recTimer); $('#recBadge').innerHTML = '';
      toast(t('saved')); renderBar();
    };
    disp.getVideoTracks()[0].onended = () => recorder && recorder.state !== 'inactive' && recorder.stop();
    recorder.start(1000);
    recStart = Date.now();
    recTimer = setInterval(() => {
      const s = Math.floor((Date.now() - recStart) / 1000);
      $('#recBadge').innerHTML = `<span class="recdot">${esc(t('recording'))} ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}</span>`;
    }, 500);
    renderBar();
  }

  // ================= লাইভ কথা → লেখা → অনুবাদ =================
  let rec = null, recOn = false, recPaused = false, seg = 0, lastInterim = 0, srWarned = false;
  function startRec() {
    if (!SR || !inCall || !micTrack || !micTrack.enabled) return;
    recOn = true;
    if (rec) return;
    rec = new SR();
    rec.lang = langInfo(myLang).sr;
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const txt = r[0].transcript.trim();
        if (!txt) continue;
        if (r.isFinal) {
          socket.emit('speech', { text: txt, final: true, seg: String(seg) });
          showCap('me', myName + ' (' + t('you') + ')', txt, null, 'me|' + seg, true);
          seg++;
        } else interim += txt + ' ';
      }
      interim = interim.trim();
      if (interim) {
        showCap('me', myName + ' (' + t('you') + ')', interim, null, 'me|' + seg, false);
        if (Date.now() - lastInterim > 700) { lastInterim = Date.now(); socket.emit('speech', { text: interim, final: false, seg: String(seg) }); }
      }
    };
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { recOn = false; if (!srWarned) { srWarned = true; toast(t('noSpeech'), 5000); } }
      if (e.error === 'audio-capture' && !srWarned) { srWarned = true; toast(t('noSpeech'), 5000); }
    };
    rec.onend = () => {
      rec = null;
      if (recOn && !recPaused && inCall) setTimeout(startRec, 80);
    };
    try { rec.start(); } catch (e) { rec = null; }
  }
  function stopRec() { recOn = false; if (rec) { try { rec.stop(); } catch (e) {} } }
  function pauseRec(p) {
    if (set.headphones) return;
    recPaused = p;
    if (p) { if (rec) try { rec.stop(); } catch (e) {} }
    else if (recOn) startRec();
  }

  function onSpeech(d) {
    if (inCall) {
      if (set.captions) showCap(d.from, d.name, d.text, d.same ? null : d.original, d.from + '|' + d.seg, d.final);
      if (d.final && !d.same && !set.original) speak(d);
    } else if (d.final) addMsg({ id: 'v' + d.from + d.seg, from: d.from, name: d.name, text: d.text, original: d.original, srcLang: d.srcLang, time: Date.now(), voice: true });
  }

  const capEls = new Map();
  function showCap(from, name, text, original, key, final) {
    if (!set.captions || !inCall) return;
    const box = $('#caps');
    let el = capEls.get(key);
    if (!el) {
      el = document.createElement('div'); el.className = 'cap';
      el.innerHTML = '<b></b><span class="tx"></span><span class="og"></span>';
      box.appendChild(el); capEls.set(key, el);
      while (box.children.length > 3) { const f = box.firstChild; for (const [k, v] of capEls) if (v === f) capEls.delete(k); f.remove(); }
    }
    el.classList.toggle('interim', !final);
    el.querySelector('b').textContent = name;
    el.querySelector('.tx').textContent = text;
    el.querySelector('.og').textContent = original && original !== text ? original : '';
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.remove(); capEls.delete(key); }, final ? 7000 : 12000);
  }

  // ---------- অনুবাদ করা কথা ভয়েসে বলা ----------
  const queue = [];
  let speaking = false;
  function speak(d) {
    const L = langInfo(myLang);
    queue.push({ text: d.text, gender: d.gender, from: d.from, sr: L.sr });
    while (queue.length > 4) queue.shift();
    if (!speaking) nextSpeak();
  }
  function duck(from, on) {
    const tl = tiles.get(from);
    if (!tl) return;
    tl.video.volume = on ? 0.12 : 1;
    tl.el.classList.toggle('tts', on);
  }
  let ttsSeq = 0;
  const ttsWait = {};
  window.__setuTTSDone = (id) => { const f = ttsWait[id]; delete ttsWait[id]; if (f) f(); };
  function pickVoice(lang, gender) {
    try {
      const vs = speechSynthesis.getVoices().filter((v) => v.lang && v.lang.replace('_', '-').toLowerCase().startsWith(lang.split('-')[0].toLowerCase()));
      if (!vs.length) return null;
      const exact = vs.filter((v) => v.lang.replace('_', '-').toLowerCase() === lang.toLowerCase());
      const list = exact.length ? exact : vs;
      const g = list.find((v) => (gender === 'm' ? /male|man|guy/i : /female|woman/i).test(v.name) && !(gender === 'm' && /female/i.test(v.name)));
      return g || list.find((v) => /google|natural|neural/i.test(v.name)) || list[0];
    } catch (e) { return null; }
  }
  function nextSpeak() {
    const it = queue.shift();
    if (!it) { speaking = false; pauseRec(false); return; }
    speaking = true;
    pauseRec(true);
    duck(it.from, true);
    let done = false;
    const finish = () => {
      if (done) return; done = true; clearTimeout(guard);
      if (!queue.length || queue[0].from !== it.from) duck(it.from, false);
      nextSpeak();
    };
    const guard = setTimeout(finish, 20000);
    if (window.SetuNative && SetuNative.speak) {
      const id = 's' + (++ttsSeq);
      ttsWait[id] = finish;
      try { SetuNative.speak(id, it.text, it.sr, it.gender || 'f'); } catch (e) { finish(); }
      return;
    }
    if (!window.speechSynthesis) return finish();
    const u = new SpeechSynthesisUtterance(it.text);
    u.lang = it.sr; u.rate = 1.1;
    const v = pickVoice(it.sr, it.gender);
    if (v) u.voice = v;
    u.onend = finish; u.onerror = finish;
    speechSynthesis.speak(u);
  }

  // ================= চ্যাট =================
  function sendChat() {
    const ta = $('#msgIn');
    const text = ta.value.trim();
    if (!text || !socket) return;
    const id = socket.id + '-' + Date.now();
    addMsg({ id, from: socket.id, name: myName, text, original: text, srcLang: myLang, time: Date.now() });
    socket.emit('chat', { text, id });
    ta.value = ''; autoGrow();
  }
  function onChat(m) { addMsg(m); }
  function addMsg(m) {
    if (shownMsg.has(m.id)) return;
    shownMsg.add(m.id);
    $('#emptyChat') && $('#emptyChat').remove();
    const mine = socket && m.from === socket.id;
    const translated = !mine && langInfo(m.srcLang).code.split('-')[0] !== myLang.split('-')[0] && m.original !== m.text;
    const el = document.createElement('div');
    el.className = 'msg' + (mine ? ' mine' : '') + (m.voice ? ' voice' : '');
    const tm = new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    el.innerHTML = `<div class="who">${mine ? '' : '<b>' + esc(m.name) + '</b>'}<span class="tm">${tm}${m.voice ? ' · ' + esc(t('spoke')) : ''}</span></div>`
      + `<div class="bub">${esc(m.text)}<span class="og hidden">${esc(m.original)}</span></div>`
      + (translated ? `<div class="meta"><span>${esc(t('translated'))} · ${esc(langInfo(m.srcLang).name)}</span><button>${esc(t('showOriginal'))}</button></div>` : '');
    if (translated) {
      const btn = el.querySelector('.meta button');
      btn.onclick = () => {
        const og = el.querySelector('.og');
        og.classList.toggle('hidden');
        btn.textContent = og.classList.contains('hidden') ? t('showOriginal') : t('hideOriginal');
      };
    }
    const box = $('#msgs');
    box.appendChild(el);
    $('#sideBody').scrollTop = 1e9;
    if (!mine && sideMode !== 'chat') { unread++; renderBar(); beep(520); }
  }
  function addSys(s) {
    const el = document.createElement('div'); el.className = 'sys'; el.textContent = s;
    $('#msgs').appendChild(el);
    $('#sideBody').scrollTop = 1e9;
  }
  const autoGrow = () => { const ta = $('#msgIn'); ta.style.height = 'auto'; ta.style.height = Math.min(120, ta.scrollHeight) + 'px'; };
  $('#msgIn').oninput = autoGrow;
  $('#msgIn').onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey && window.innerWidth > 860) { e.preventDefault(); sendChat(); } };
  $('#sendBtn').onclick = sendChat;

  // বলে লেখা (চ্যাটে ভয়েস টাইপিং)
  let dict = null;
  $('#dictate').onclick = () => {
    if (!SR) return toast(t('noSpeech'));
    if (dict) { dict.stop(); return; }
    pauseRec(true);
    dict = new SR();
    dict.lang = langInfo(myLang).sr; dict.interimResults = true; dict.continuous = false;
    const base = $('#msgIn').value ? $('#msgIn').value + ' ' : '';
    dict.onresult = (e) => { let s = ''; for (const r of e.results) s += r[0].transcript; $('#msgIn').value = base + s; autoGrow(); };
    dict.onend = () => { dict = null; $('#dictate').classList.remove('listening'); pauseRec(false); };
    $('#dictate').classList.add('listening');
    try { dict.start(); } catch (e) { dict = null; }
  };

  // ================= রিঅ্যাকশন =================
  function onReact(r) {
    const e = REACTS[r.type]; if (!e) return;
    if (inCall) {
      const el = document.createElement('div');
      el.className = 'fly';
      el.style.left = (10 + Math.random() * 75) + '%';
      el.innerHTML = e + `<small>${esc(r.name)}</small>`;
      $('#reactLayer').appendChild(el);
      setTimeout(() => el.remove(), 3100);
    } else addSys(r.name + ' ' + e);
  }
  $('#reactPop').onclick = (e) => {
    const b = e.target.closest('button'); if (!b) return;
    socket.emit('react', b.dataset.r);
  };

  // ================= সাইড প্যানেল =================
  function openSide(mode) {
    sideMode = mode;
    $('#side').classList.remove('hidden');
    $('#sideTitle').textContent = mode === 'chat' ? t('chat') : t('people');
    $('#msgs').classList.toggle('hidden', mode !== 'chat');
    $('#compose').classList.toggle('hidden', mode !== 'chat');
    $('#plist').classList.toggle('hidden', mode !== 'people');
    if (mode === 'chat') { unread = 0; setTimeout(() => ($('#sideBody').scrollTop = 1e9), 30); }
    renderPeople(); renderBar(); renderKnocks();
    setTimeout(layout, 50);
  }
  function closeSide() {
    if (!inCall) { openSide('chat'); return; }
    sideMode = null; $('#side').classList.add('hidden'); renderBar(); renderKnocks(); setTimeout(layout, 50);
  }
  $('#sideClose').onclick = closeSide;
  const toggleSide = (m) => (sideMode === m && inCall ? closeSide() : openSide(m));

  function renderPeople() {
    const list = [];
    if (me) list.push({ ...me, name: myName, lang: myLang, mic: inCall && !!(micTrack && micTrack.enabled), isMe: true });
    parts.forEach((p) => list.push(p));
    const H = isHost();
    let html = '';
    if (H) {
      html += `<div class="hostbox"><h4>${icon('shield')}${esc(t('hostControls'))}</h4>
        <button class="tg ${roomSet.lobby ? 'on' : ''}" data-h="lobby">${icon('lock')}<div><b>${esc(t('lobbyOpt'))}</b><small>${esc(t('lobbyDesc'))}</small></div><span class="chk"></span></button>
        <button class="tg ${roomSet.lockMic ? 'on' : ''}" data-h="lock-mic">${icon('micOff')}<div><b>${esc(t('lockMicOpt'))}</b><small>${esc(t('lockMicDesc'))}</small></div><span class="chk"></span></button>
        <div class="hb"><button class="btn ghost" data-h="mute-all">${icon('micOff')}${esc(t('muteAll'))}</button><button class="btn ghost" data-h="unban">${icon('block')}${esc(t('unbanAll'))}</button></div></div>`;
      if (lobby.length) html += `<div class="wl"><h5>${esc(t('waitingList'))} (${lobby.length})</h5>` + lobby.map((w) => `<div class="wr"><div class="av" style="width:34px;font-size:14px">${esc((w.name || '?')[0].toUpperCase())}</div>
        <div class="inf"><b>${esc(w.name)}</b><span>${esc(langInfo(w.lang).name)}</span></div>
        <button class="mini" data-h="deny" data-t="${w.id}">${esc(t('deny'))}</button><button class="mini ok" data-h="admit" data-t="${w.id}">${esc(t('admit'))}</button></div>`).join('')
        + (lobby.length > 1 ? `<button class="mini ok" data-h="admit-all">${esc(t('admitAll'))}</button>` : '') + '</div>';
    }
    const nCall = list.filter((p) => p.mode === 'call').length;
    html += `<div class="sumline">${nCall} ${esc(t('inCallN'))} · ${list.length - nCall} ${esc(t('inChatN'))}</div>`;
    html += list.map((p) => `<div class="pr"><div class="av">${esc((p.name || '?')[0].toUpperCase())}</div>
      <div class="inf"><b>${esc(p.name)}${p.isMe ? ' (' + esc(t('you')) + ')' : ''}${p.host ? '<span class="tag">' + esc(t('host')) + '</span>' : ''}</b>
      <span>${esc(langInfo(p.lang).name)} · ${esc(p.mode === 'call' ? t('inCall') : t('inChat'))}</span></div>
      <div class="st">${p.hand ? '<span class="yl">' + icon('hand') + '</span>' : ''}${p.mode === 'call' ? icon(p.mic ? 'mic' : 'micOff') : icon('chat')}</div>
      ${H && !p.isMe && !p.host ? `<div class="hc">
        <button data-h="mute" data-t="${p.id}" title="${esc(t('muteP'))}">${icon('micOff')}</button>
        <button data-h="cam-off" data-t="${p.id}" title="${esc(t('camOffP'))}">${icon('camOff')}</button>
        <button class="danger" data-h="kick" data-t="${p.id}" title="${esc(t('kickP'))}">${icon('kick')}</button>
        <button class="danger" data-h="ban" data-t="${p.id}" title="${esc(t('banP'))}">${icon('block')}</button></div>` : ''}</div>`).join('');
    $('#plist').innerHTML = html;
    renderCount();
  }
  $('#plist').onclick = (e) => {
    const b = e.target.closest('[data-h]'); if (!b) return;
    const a = b.dataset.h, tg = b.dataset.t;
    if (a === 'lobby') return hostDo('lobby', null, !roomSet.lobby);
    if (a === 'lock-mic') return hostDo('lock-mic', null, !roomSet.lockMic);
    if ((a === 'kick' || a === 'ban')) {
      const p = parts.get(tg);
      if (!confirmBox(b, a)) return;
      hostDo(a, tg);
      if (p) toast(p.name + ' · ' + t(a === 'ban' ? 'bannedOk' : 'removedOk'));
      return;
    }
    hostDo(a, tg);
    if (a === 'mute-all') toast(t('allMuted'));
  };
  // ভুল করে চাপ পড়া ঠেকাতে: প্রথম চাপে লাল হয়, ৩ সেকেন্ডের মধ্যে আবার চাপলে কাজ হয়
  function confirmBox(btn, a) {
    if (btn.dataset.sure) return true;
    btn.dataset.sure = '1'; btn.style.background = 'var(--red)'; btn.style.color = '#fff';
    toast(t(a === 'ban' ? 'banP' : 'kickP') + '?');
    setTimeout(() => { delete btn.dataset.sure; btn.style.background = ''; btn.style.color = ''; }, 3000);
    return false;
  }
  function renderCount() {
    const n = parts.size + 1;
    $('#chCount').textContent = n + ' ' + t('participants') + ' · ' + roomId;
    const lb = isHost() && lobby.length;
    const cnt = lb ? `<span class="cnt" style="background:var(--yel);color:#000">${lobby.length}</span>` : n > 1 ? `<span class="cnt">${n}</span>` : '';
    $('#bPeople').innerHTML = icon('people') + cnt;
    $('#chPeople').innerHTML = icon('people') + cnt;
  }

  // ================= বার রেন্ডার =================
  function renderBar() {
    const micOn = !!(micTrack && micTrack.enabled), camOn = !!(camTrack && camTrack.enabled);
    $('#bMic').innerHTML = icon(micOn ? 'mic' : 'micOff'); $('#bMic').classList.toggle('off', !micOn);
    $('#bMic').classList.toggle('locked', roomSet.lockMic && !isHost());
    $('#bCam').innerHTML = icon(camOn ? 'cam' : 'camOff'); $('#bCam').classList.toggle('off', !camOn);
    $('#bCC').classList.toggle('on', set.captions);
    $('#bScreen').classList.toggle('on', !!screenTrack);
    $('#bScreen').title = t(screenTrack ? 'stopScreen' : 'screen');
    $('#bHand').classList.toggle('on', !!(me && me.hand));
    const cnt = unread ? `<span class="cnt">${unread}</span>` : '';
    $('#bChat').innerHTML = icon('chat') + cnt; $('#bChat').classList.toggle('on', sideMode === 'chat');
    $('#bChatM').innerHTML = icon('chat') + cnt;
    $('#bPeople').classList.toggle('on', sideMode === 'people');
    renderCount();
  }
  function renderRoom() {
    $('#room').classList.toggle('chatmode', !inCall);
    renderBar(); renderAlone(); applyI18n($('#room'));
  }
  setInterval(() => ($('#clock').textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })), 1000);

  // ================= মেনু (আরও) =================
  function openMore(anchorRight) {
    const pop = $('#morePop');
    const items = [];
    if (inCall) {
      items.push(['screen', 'screen', screenTrack ? t('stopScreen') : t('screen'), toggleScreen]);
      items.push(['hand', 'hand', me && me.hand ? t('lowerHand') : t('hand'), toggleHand]);
      items.push(['rec', 'rec', recorder ? t('stopRecord') : t('record'), toggleRecord]);
      items.push(['cc', 'cc', t('captions'), () => { set.captions = !set.captions; if (!set.captions) $('#caps').innerHTML = ''; }, set.captions]);
      items.push(['ear', 'ear', t('original'), () => { set.original = !set.original; if (set.original) { queue.length = 0; try { speechSynthesis.cancel(); } catch (e) {} } }, set.original]);
      items.push(['headset', 'headset', t('headphones'), () => { set.headphones = !set.headphones; }, set.headphones]);
      items.push(['people', 'people', t('people'), () => openSide('people')]);
      items.push(['back', 'chat', t('backToChat'), leaveCall]);
    }
    if (isHost()) items.unshift(['shield', 'shield', t('hostControls'), () => openSide('people')]);
    items.push(['globe', 'globe', t('changeLang') + ' · ' + langInfo(myLang).name, openLangModal]);
    items.push(['link', 'copy', t('copy'), copyLink]);
    items.push(['shareI', 'shareI', t('share'), shareLink]);
    pop.innerHTML = items.map((it, i) => `<button data-i="${i}" class="${it[4] ? 'on' : ''}">${icon(it[0])}<span>${esc(it[2])}</span>${it.length > 4 ? '<span class="chk"></span>' : ''}</button>`).join('');
    pop.onclick = (e) => {
      const b = e.target.closest('button'); if (!b) return;
      const it = items[+b.dataset.i];
      pop.classList.add('hidden');
      it[3](); renderBar();
    };
    pop.style.bottom = inCall ? '76px' : 'auto';
    pop.style.top = inCall ? 'auto' : '64px';
    pop.classList.remove('hidden');
    $('#reactPop').classList.add('hidden');
  }
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#morePop,#bMore,#chMore')) $('#morePop').classList.add('hidden');
    if (!e.target.closest('#reactPop,#bReact')) $('#reactPop').classList.add('hidden');
  });

  async function copyLink() { if (await copyText(LINK)) toast(t('copied')); }
  async function shareLink() {
    if (window.SetuNative) return SetuNative.share(t('shareText'), LINK);
    if (navigator.share) { try { await navigator.share({ title: 'Setu Meet', text: t('shareText'), url: LINK }); } catch (e) {} }
    else copyLink();
  }

  // ভাষা বদলানো (মিটিংয়ের মধ্যে)
  function openLangModal() {
    $('#langModal').classList.remove('hidden');
    const draw = () => renderLangGrid($('#langGrid2'), $('#langSearch2').value, myLang, async (c) => {
      myLang = c; localStorage.setItem('setu_lang', c);
      await loadLang(c);
      sendUpdate({ lang: c });
      if (rec) { try { rec.stop(); } catch (e) {} }
      $('#langModal').classList.add('hidden');
      putIcons(); renderRoom(); renderPeople(); updateTile('me');
      if (sideMode) openSide(sideMode);
    });
    $('#langSearch2').value = ''; $('#langSearch2').oninput = draw; draw();
  }
  $('#langModalClose').onclick = () => $('#langModal').classList.add('hidden');

  // ================= বাটন =================
  $('#bMic').onclick = toggleMic;
  $('#bCam').onclick = toggleCam;
  $('#bCC').onclick = () => { set.captions = !set.captions; if (!set.captions) $('#caps').innerHTML = ''; renderBar(); };
  $('#bScreen').onclick = toggleScreen;
  $('#bHand').onclick = toggleHand;
  $('#bReact').onclick = () => $('#reactPop').classList.toggle('hidden');
  $('#bMore').onclick = () => ($('#morePop').classList.contains('hidden') ? openMore() : $('#morePop').classList.add('hidden'));
  $('#chMore').onclick = () => ($('#morePop').classList.contains('hidden') ? openMore() : $('#morePop').classList.add('hidden'));
  $('#bChat').onclick = () => toggleSide('chat');
  $('#bChatM').onclick = () => toggleSide('chat');
  $('#bPeople').onclick = () => toggleSide('people');
  $('#chPeople').onclick = () => openSide(sideMode === 'people' ? 'chat' : 'people');
  $('#chLink').onclick = copyLink;
  $('#aloneCopy').onclick = copyLink;
  $('#chCall').onclick = () => { unlockAudio(); startCall(); };
  $('#bLeave').onclick = leaveMeeting;
  $('#chLeave').onclick = leaveMeeting;
  $('#rejoin').onclick = () => location.reload();

  function leaveMeeting() {
    if (inCall) leaveCall();
    showEnd(t('ended'), true);
  }

  // ---------- ছোট টুলস ----------
  let beepCtx = null;
  function beep(f) {
    try {
      beepCtx = beepCtx || new (window.AudioContext || window.webkitAudioContext)();
      const o = beepCtx.createOscillator(), g = beepCtx.createGain();
      o.frequency.value = f; g.gain.value = 0.04;
      o.connect(g); g.connect(beepCtx.destination);
      o.start(); g.gain.exponentialRampToValueAtTime(0.0001, beepCtx.currentTime + 0.25); o.stop(beepCtx.currentTime + 0.26);
    } catch (e) {}
  }
  // হাত তোলার মিষ্টি ঘণ্টা-শব্দ (তিনটা সুর পরপর)
  function chime() {
    try {
      beepCtx = beepCtx || new (window.AudioContext || window.webkitAudioContext)();
      const ctx = beepCtx, now = ctx.currentTime;
      [659.25, 830.61, 987.77, 1318.5].forEach((f, i) => {
        const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o2.type = 'triangle';
        o.frequency.value = f; o2.frequency.value = f * 2;
        const t0 = now + i * 0.09;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.09, t0 + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.9);
        const g2 = ctx.createGain(); g2.gain.value = 0.18;
        o.connect(g); o2.connect(g2); g2.connect(g); g.connect(ctx.destination);
        o.start(t0); o2.start(t0); o.stop(t0 + 1); o2.stop(t0 + 1);
      });
    } catch (e) {}
  }
  let wake = null;
  async function keepAwake() { try { wake = await navigator.wakeLock.request('screen'); } catch (e) {} }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && inCall) keepAwake(); });
})();
