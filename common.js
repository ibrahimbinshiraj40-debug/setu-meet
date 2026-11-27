// Setu Meet — common: ভাষা (i18n), আইকন, ছোট টুলস
const EN = {
  tagline: 'Talk in any language. Everyone hears their own.',
  heroTitle: 'Meetings without language barriers',
  heroSub: 'Make a link, send it to anyone. They join from the browser — no app to download. Every message and every word is translated live into each person\'s own language.',
  newMeeting: 'New meeting', codePh: 'Enter a code or link', join: 'Join',
  meetingReady: 'Your meeting link is ready',
  sendLink: 'Send this link to anyone. They can join from any browser — no app needed.',
  copy: 'Copy link', copied: 'Link copied', share: 'Share', joinNow: 'Join now', close: 'Close',
  f1: 'Live voice translation', f1d: 'You speak your language, they hear theirs.',
  f2: 'Translated chat', f2d: 'Every message arrives in the reader\'s language.',
  f3: 'No download', f3d: 'Guests join with just the link.',
  chooseLang: 'Choose your language',
  langWhy: 'Everything in this meeting — messages, voice and buttons — will reach you in the language you choose. Others will get your words in their own language.',
  langRequired: 'Choosing a language is required to join.',
  search: 'Search language', next: 'Next',
  yourName: 'Your name', namePh: 'Write your name', voice: 'Your translated voice', female: 'Female', male: 'Male',
  howJoin: 'How do you want to join?',
  chatOpt: 'Chat', chatDesc: 'Send messages — everyone reads them in their own language.',
  callOpt: 'Call', callDesc: 'Video or voice call with live translation.',
  changeLang: 'Change language', needName: 'Please write your name.',
  mic: 'Microphone', cam: 'Camera', screen: 'Share screen', stopScreen: 'Stop sharing',
  reactions: 'Reactions', hand: 'Raise hand', lowerHand: 'Lower hand',
  record: 'Record', stopRecord: 'Stop recording', chat: 'Chat', people: 'People', more: 'More',
  leaveCall: 'Leave call', captions: 'Captions', original: 'Hear original voice (no translation voice)',
  headphones: 'I am using headphones', joinCall: 'Join call', backToChat: 'Leave call, stay in chat',
  typeMsg: 'Type a message', send: 'Send', you: 'You', inCall: 'In call', inChat: 'In chat',
  translated: 'Translated', showOriginal: 'Show original', hideOriginal: 'Hide original',
  joined: 'joined', left: 'left', raised: 'raised a hand', meetingLink: 'Meeting link',
  alone: 'No one else is here yet. Send the link!',
  noRecord: 'Recording is not supported on this device. Use your phone\'s screen recorder.',
  noScreen: 'Screen sharing is not supported on this device.',
  noSpeech: 'Live voice translation needs Google Chrome. Others will hear your original voice.',
  noMedia: 'Camera or microphone permission was denied.',
  tapSound: 'Tap anywhere on the screen to turn on sound', leaveHint: 'To leave, press the red button', waitingHost: 'Waiting for the host to open the meeting…', connecting: 'Connecting…', participants: 'participants', voiceType: 'Voice typing',
  ended: 'You left the meeting', rejoin: 'Rejoin', home: 'Back to home', host: 'Host',
  recording: 'Recording', saved: 'Recording saved', emptyChat: 'Messages are translated automatically. Say hello!',
  spoke: 'said (voice)', shareText: 'Join my meeting',
  waiting: 'Asking to join…', waitingSub: 'The host will let you in soon. Please keep this page open.',
  denied: 'The host didn\'t let you in', kicked: 'The host removed you from the meeting', banned: 'You can\'t join this meeting',
  hostControls: 'Host controls', lobbyOpt: 'Ask my permission before joining',
  lobbyDesc: 'On: people need your OK to join. Off: anyone with the link joins.',
  lockMicOpt: 'Only host can speak', lockMicDesc: 'Everyone else\'s microphone stays off.',
  muteAll: 'Mute everyone', waitingList: 'Waiting to join', admit: 'Admit', deny: 'Deny', admitAll: 'Admit all',
  wantsJoin: 'wants to join', muteP: 'Mute', camOffP: 'Turn off camera', kickP: 'Remove', banP: 'Ban',
  mutedBy: 'You were muted by', camOffBy: 'Your camera was turned off by',
  micLocked: 'The host has turned off microphones', micsLockedOn: 'The host turned off everyone\'s microphone',
  micsUnlocked: 'Microphones are allowed again', cancel: 'Cancel', unbanAll: 'Remove all bans',
  inCallN: 'in call', inChatN: 'in chat', removedOk: 'Removed', bannedOk: 'Banned', allMuted: 'Everyone is muted'
};

const BN = {
  tagline: 'যেকোনো ভাষায় কথা বলুন, সবাই শুনবে নিজের ভাষায়।',
  heroTitle: 'ভাষার বাধা ছাড়া মিটিং',
  heroSub: 'একটা লিংক বানান, যে কাউকে পাঠান। সে ব্রাউজার থেকেই জয়েন করবে — কোনো অ্যাপ নামাতে হবে না। প্রতিটা মেসেজ আর প্রতিটা কথা সাথে সাথে যার যার ভাষায় অনুবাদ হবে।',
  newMeeting: 'নতুন মিটিং', codePh: 'কোড বা লিংক লিখুন', join: 'জয়েন',
  meetingReady: 'আপনার মিটিং লিংক তৈরি',
  sendLink: 'এই লিংকটা যে কাউকে পাঠান। সে যেকোনো ব্রাউজার থেকে জয়েন করতে পারবে — অ্যাপ লাগবে না।',
  copy: 'লিংক কপি', copied: 'লিংক কপি হয়েছে', share: 'শেয়ার', joinNow: 'এখনই জয়েন করুন', close: 'বন্ধ',
  f1: 'লাইভ ভয়েস অনুবাদ', f1d: 'আপনি বলবেন আপনার ভাষায়, সে শুনবে তার ভাষায়।',
  f2: 'অনুবাদ করা চ্যাট', f2d: 'প্রতিটা মেসেজ পাঠকের ভাষায় পৌঁছাবে।',
  f3: 'কিছু নামাতে হবে না', f3d: 'শুধু লিংক দিয়েই জয়েন।',
  chooseLang: 'আপনার ভাষা বেছে নিন',
  langWhy: 'এই মিটিংয়ের সবকিছু — মেসেজ, কথা আর বাটন — আপনার বাছাই করা ভাষায় আসবে। অন্যরা আপনার কথা পাবে তাদের নিজের ভাষায়।',
  langRequired: 'জয়েন করতে ভাষা বাছাই করা বাধ্যতামূলক।',
  search: 'ভাষা খুঁজুন', next: 'পরের ধাপ',
  yourName: 'আপনার নাম', namePh: 'আপনার নাম লিখুন', voice: 'অনুবাদ করা কণ্ঠ', female: 'মেয়ে', male: 'ছেলে',
  howJoin: 'কীভাবে জয়েন করতে চান?',
  chatOpt: 'চ্যাট', chatDesc: 'মেসেজ পাঠান — সবাই নিজের ভাষায় পড়বে।',
  callOpt: 'কল', callDesc: 'লাইভ অনুবাদসহ ভিডিও বা ভয়েস কল।',
  changeLang: 'ভাষা বদলান', needName: 'আপনার নাম লিখুন।',
  mic: 'মাইক', cam: 'ক্যামেরা', screen: 'স্ক্রিন শেয়ার', stopScreen: 'শেয়ার বন্ধ',
  reactions: 'রিঅ্যাকশন', hand: 'হাত তুলুন', lowerHand: 'হাত নামান',
  record: 'রেকর্ড', stopRecord: 'রেকর্ড বন্ধ', chat: 'চ্যাট', people: 'লোকজন', more: 'আরও',
  leaveCall: 'কল কাটুন', captions: 'ক্যাপশন', original: 'আসল কণ্ঠ শুনুন (অনুবাদের ভয়েস বন্ধ)',
  headphones: 'আমি হেডফোন ব্যবহার করছি', joinCall: 'কলে জয়েন', backToChat: 'কল ছাড়ুন, চ্যাটে থাকুন',
  typeMsg: 'মেসেজ লিখুন', send: 'পাঠান', you: 'আপনি', inCall: 'কলে আছে', inChat: 'চ্যাটে আছে',
  translated: 'অনুবাদ', showOriginal: 'আসলটা দেখুন', hideOriginal: 'আসলটা লুকান',
  joined: 'জয়েন করেছে', left: 'চলে গেছে', raised: 'হাত তুলেছে', meetingLink: 'মিটিং লিংক',
  alone: 'এখনো আর কেউ আসেনি। লিংকটা পাঠান!',
  noRecord: 'এই ডিভাইসে রেকর্ড হয় না। ফোনের স্ক্রিন রেকর্ডার ব্যবহার করুন।',
  noScreen: 'এই ডিভাইসে স্ক্রিন শেয়ার হয় না।',
  noSpeech: 'লাইভ ভয়েস অনুবাদের জন্য Google Chrome লাগবে। অন্যরা আপনার আসল কণ্ঠ শুনবে।',
  noMedia: 'ক্যামেরা বা মাইকের অনুমতি দেওয়া হয়নি।',
  tapSound: 'শব্দ চালু করতে স্ক্রিনের যেকোনো জায়গায় একবার চাপুন', leaveHint: 'বের হতে লাল বাটন চাপুন', waitingHost: 'হোস্ট মিটিং চালু করার অপেক্ষা করা হচ্ছে…', connecting: 'কানেক্ট হচ্ছে…', participants: 'জন', voiceType: 'বলে লিখুন',
  ended: 'আপনি মিটিং থেকে বের হয়েছেন', rejoin: 'আবার জয়েন', home: 'হোমে যান', host: 'হোস্ট',
  recording: 'রেকর্ড হচ্ছে', saved: 'রেকর্ড সেভ হয়েছে', emptyChat: 'মেসেজ অটোমেটিক অনুবাদ হবে। সালাম দিয়ে শুরু করুন!',
  spoke: 'বলেছে (ভয়েস)', shareText: 'আমার মিটিংয়ে জয়েন করুন',
  waiting: 'জয়েন করার অনুমতি চাওয়া হচ্ছে…', waitingSub: 'হোস্ট একটু পরেই আপনাকে ঢুকতে দেবে। পেজটা খোলা রাখুন।',
  denied: 'হোস্ট আপনাকে ঢুকতে দেয়নি', kicked: 'হোস্ট আপনাকে মিটিং থেকে বের করে দিয়েছে', banned: 'আপনি এই মিটিংয়ে ঢুকতে পারবেন না',
  hostControls: 'হোস্ট কন্ট্রোল', lobbyOpt: 'জয়েনের আগে আমার অনুমতি লাগবে',
  lobbyDesc: 'চালু: ঢুকতে আপনার অনুমতি লাগবে। বন্ধ: লিংকে ক্লিক করলেই যে কেউ ঢুকবে।',
  lockMicOpt: 'শুধু হোস্ট কথা বলবে', lockMicDesc: 'বাকি সবার মাইক বন্ধ থাকবে, চালু করতে পারবে না।',
  muteAll: 'সবার মাইক বন্ধ', waitingList: 'ঢোকার অপেক্ষায়', admit: 'ঢুকতে দিন', deny: 'না', admitAll: 'সবাইকে ঢুকতে দিন',
  wantsJoin: 'ঢুকতে চাচ্ছে', muteP: 'মাইক বন্ধ', camOffP: 'ক্যামেরা বন্ধ', kickP: 'বের করুন', banP: 'ব্যান',
  mutedBy: 'আপনার মাইক বন্ধ করেছে', camOffBy: 'আপনার ক্যামেরা বন্ধ করেছে',
  micLocked: 'হোস্ট সবার মাইক বন্ধ রেখেছে', micsLockedOn: 'হোস্ট সবার মাইক বন্ধ করে দিয়েছে',
  micsUnlocked: 'এখন আবার মাইক চালু করা যাবে', cancel: 'বাতিল', unbanAll: 'সব ব্যান তুলে দিন',
  inCallN: 'জন কলে', inChatN: 'জন চ্যাটে', removedOk: 'বের করা হয়েছে', bannedOk: 'ব্যান করা হয়েছে', allMuted: 'সবার মাইক বন্ধ হয়েছে'
};

let STR = { ...EN };
const t = (k) => STR[k] || EN[k] || k;
const langInfo = (code) => SETU_LANGS.find((l) => l.code === code) || SETU_LANGS[1];

// ---------- অনুবাদ (সার্ভার ছাড়া, সরাসরি Google Translate) ----------
const _trCache = new Map();
let _trSeq = 0;
const _trWait = {};
window.__setuTrDone = (id, res) => { const f = _trWait[id]; delete _trWait[id]; if (f) f(res || null); };
function nativeTr(text, sl, tl) {
  return new Promise((res) => {
    const id = 't' + (++_trSeq);
    _trWait[id] = res;
    try { SetuNative.translate(id, text, sl || 'auto', tl); } catch (e) { delete _trWait[id]; return res(null); }
    setTimeout(() => { if (_trWait[id]) { delete _trWait[id]; res(null); } }, 10000);
  });
}
async function webTr(text, sl, tl) {
  const q = encodeURIComponent(text);
  try {
    const r = await fetch('https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=' + (sl || 'auto') + '&tl=' + tl + '&q=' + q);
    const j = await r.json();
    const out = (j[0] || []).map((x) => x[0]).join('');
    if (out) return out;
  } catch (e) {}
  try {
    const r = await fetch('https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=' + (sl || 'auto') + '&tl=' + tl + '&q=' + q);
    let j = await r.json();
    while (Array.isArray(j)) j = j[0];
    if (typeof j === 'string' && j) return j;
  } catch (e) {}
  return null;
}
async function setuTranslate(text, sl, tl) {
  text = String(text || '').slice(0, 1500);
  if (!text.trim() || !tl) return text;
  const b = (c) => String(c || '').split('-')[0].toLowerCase();
  if (sl && b(sl) === b(tl)) return text;
  const key = (sl || 'auto') + '|' + tl + '|' + text;
  if (_trCache.has(key)) return _trCache.get(key);
  let out = null;
  if (window.SetuNative && SetuNative.translate) out = await nativeTr(text, sl, tl);
  if (!out) out = await webTr(text, sl, tl);
  if (!out) return text;
  if (_trCache.size > 5000) _trCache.delete(_trCache.keys().next().value);
  _trCache.set(key, out);
  return out;
}

async function loadLang(code) {
  if (code === 'en') STR = { ...EN };
  else if (code === 'bn') STR = { ...EN, ...BN };
  else {
    const ck = 'setu_ui_' + code + '_v2';
    let got = null;
    try { got = JSON.parse(localStorage.getItem(ck) || 'null'); } catch (e) {}
    if (!got) {
      got = {};
      const keys = Object.keys(EN);
      const chunks = [];
      for (let i = 0; i < keys.length; i += 12) chunks.push(keys.slice(i, i + 12));
      await Promise.all(chunks.map(async (ks) => {
        const joined = ks.map((k) => EN[k].replace(/\n/g, ' ')).join('\n');
        const out = await setuTranslate(joined, 'en', code);
        const lines = String(out || '').split('\n');
        if (out !== joined && lines.length === ks.length) ks.forEach((k, i) => (got[k] = lines[i].trim()));
        else await Promise.all(ks.map(async (k) => { got[k] = await setuTranslate(EN[k], 'en', code); }));
      }));
      if (Object.keys(got).some((k) => got[k] !== EN[k])) try { localStorage.setItem(ck, JSON.stringify(got)); } catch (e) {}
    }
    STR = { ...EN, ...got };
  }
  const info = langInfo(code);
  document.documentElement.lang = code;
  document.documentElement.dir = info.rtl ? 'rtl' : 'ltr';
  applyI18n();
}

function applyI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => (el.textContent = t(el.dataset.i18n)));
  root.querySelectorAll('[data-i18n-ph]').forEach((el) => (el.placeholder = t(el.dataset.i18nPh)));
  root.querySelectorAll('[data-i18n-title]').forEach((el) => {
    el.title = t(el.dataset.i18nTitle);
    el.setAttribute('aria-label', el.title);
  });
}

// Material-style আইকন
const ICONS = {
  mic: 'M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z',
  micOff: 'M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5a3 3 0 0 0-6 0v.18l5.98 5.99zM4.27 3 3 4.27l6.01 6.01V11a3 3 0 0 0 3 3c.22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52A5.2 5.2 0 0 1 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28a6.9 6.9 0 0 0 2.54-.9L19.73 21 21 19.73 4.27 3z',
  cam: 'M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z',
  camOff: 'M21 6.5l-4 4V7a1 1 0 0 0-1-1H9.82L21 17.18V6.5zM3.27 2 2 3.27 4.73 6H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z',
  screen: 'M20 18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2H0v2h24v-2h-4zM4 6h16v10H4V6zm9 7.5V11c-2.78 0-4.6.85-6 2.72.56-2.67 2.11-5.33 6-5.87V5.5L17 9.5l-4 4z',
  hand: 'M21 7a2 2 0 0 0-4 0v4h-1V4a2 2 0 0 0-4 0v7h-1V5a2 2 0 0 0-4 0v9.3l-1.9-2.06a1.97 1.97 0 0 0-2.75.04 1.9 1.9 0 0 0-.06 2.62l4.9 5.45A5 5 0 0 0 10 22h5a6 6 0 0 0 6-6V7z',
  smile: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-3.5 6A1.5 1.5 0 1 1 7 9.5 1.5 1.5 0 0 1 8.5 8zm7 0A1.5 1.5 0 1 1 14 9.5 1.5 1.5 0 0 1 15.5 8zM12 17.5A5.5 5.5 0 0 1 6.89 14h10.22A5.5 5.5 0 0 1 12 17.5z',
  rec: 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0-5a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z',
  chat: 'M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z',
  people: 'M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05A4.2 4.2 0 0 1 17 16.5V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
  more: 'M12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm0 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
  end: 'M12 9c-1.6 0-3.15.25-4.6.72v3.1a1 1 0 0 1-.56.9 11.4 11.4 0 0 0-2.66 1.85 1 1 0 0 1-1.41-.02L.29 13.08a1 1 0 0 1 0-1.41C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67a1 1 0 0 1 0 1.41l-2.48 2.48a1 1 0 0 1-1.41.02 11.3 11.3 0 0 0-2.67-1.85 1 1 0 0 1-.56-.9v-3.1A15 15 0 0 0 12 9z',
  cc: 'M19 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm-8 7H9.5v-.5h-2v3h2V13H11v1a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1zm7 0h-1.5v-.5h-2v3h2V13H18v1a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1z',
  send: 'M2.01 21 23 12 2.01 3 2 10l15 2-15 2z',
  link: 'M3.9 12A3.1 3.1 0 0 1 7 8.9h4V7H7a5 5 0 0 0 0 10h4v-1.9H7A3.1 3.1 0 0 1 3.9 12zM8 13h8v-2H8v2zm9-6h-4v1.9h4a3.1 3.1 0 0 1 0 6.2h-4V17h4a5 5 0 0 0 0-10z',
  copy: 'M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z',
  shareI: 'M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11A2.99 2.99 0 0 0 21 5a3 3 0 1 0-5.91.7L8.04 9.81A3 3 0 1 0 8.04 14.2l7.12 4.16c-.05.21-.08.43-.08.65A2.92 2.92 0 1 0 18 16.08z',
  globe: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.93 6h-2.95a15.65 15.65 0 0 0-1.38-3.56A8.03 8.03 0 0 1 18.93 8zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14a8.2 8.2 0 0 1 0-4h3.38a16.5 16.5 0 0 0 0 4H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56A7.99 7.99 0 0 1 5.08 16zm2.95-8H5.08a7.99 7.99 0 0 1 4.33-3.56A15.65 15.65 0 0 0 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66a14.7 14.7 0 0 1 0-4h4.68a14.7 14.7 0 0 1 0 4zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 0 1-4.33 3.56zM16.36 14a16.5 16.5 0 0 0 0-4h3.38a8.2 8.2 0 0 1 0 4h-3.38z',
  close: 'M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
  ear: 'M17 20c-.29 0-.56-.06-.76-.15-.71-.37-1.21-.88-1.71-2.38-.51-1.56-1.47-2.29-2.39-3-.79-.61-1.61-1.24-2.32-2.53C9.29 10.98 9 9.93 9 9c0-2.8 2.2-5 5-5s5 2.2 5 5h2c0-3.93-3.07-7-7-7S7 5.07 7 9c0 1.26.38 2.65 1.07 3.9.91 1.65 1.98 2.48 2.85 3.15.81.62 1.39 1.07 1.71 2.05.6 1.82 1.37 2.84 2.73 3.55A3.9 3.9 0 0 0 17 22c2.21 0 4-1.79 4-4h-2c0 1.1-.9 2-2 2zM7.64 2.64 6.22 1.22A10.94 10.94 0 0 0 3 9c0 3.04 1.23 5.79 3.22 7.78l1.41-1.41A9 9 0 0 1 5 9c0-2.49 1.01-4.74 2.64-6.36zM11.5 9a2.5 2.5 0 1 0 5 0 2.5 2.5 0 0 0-5 0z',
  headset: 'M12 1a9 9 0 0 0-9 9v7a3 3 0 0 0 3 3h3v-8H5v-2a7 7 0 0 1 14 0v2h-4v8h3a3 3 0 0 0 3-3v-7a9 9 0 0 0-9-9z',
  phone: 'M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.98.98 0 0 0-1.01.24l-1.57 1.97a15.2 15.2 0 0 1-6.92-6.92l1.95-1.66c.27-.28.35-.67.24-1.02a11.4 11.4 0 0 1-.56-3.53c0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z',
  video: 'M15 8v8H5V8h10m1-2H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4V7a1 1 0 0 0-1-1z',
  plus: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
  keyboard: 'M20 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z',
  block: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM4 12a8 8 0 0 1 12.9-6.32L5.68 16.9A7.9 7.9 0 0 1 4 12zm8 8a7.9 7.9 0 0 1-4.9-1.68L18.32 7.1A8 8 0 0 1 12 20z',
  kick: 'M14 8a4 4 0 1 0-8 0 4 4 0 0 0 8 0zm3 2v2h6v-2h-6zM2 18v2h16v-2c0-2.66-5.33-4-8-4s-8 1.34-8 4z',
  lock: 'M18 8h-1V6A5 5 0 0 0 7 6v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2zm-6 9a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm3.1-9H8.9V6a3.1 3.1 0 0 1 6.2 0v2z',
  shield: 'M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z',
  back: 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z'
};
const icon = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[n] || ''}"/></svg>`;

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function toast(msg, ms = 2600) {
  let box = $('#toasts');
  if (!box) { box = document.createElement('div'); box.id = 'toasts'; document.body.appendChild(box); }
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  box.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, ms);
}

async function copyText(s) {
  if (window.SetuNative) { try { SetuNative.copy(s); return true; } catch (e) {} }
  try { await navigator.clipboard.writeText(s); return true; } catch (e) {
    const ta = document.createElement('textarea'); ta.value = s; document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch (e2) {}
    ta.remove(); return ok;
  }
}

function guessLang() {
  const saved = localStorage.getItem('setu_lang');
  if (saved && SETU_LANGS.some((l) => l.code === saved)) return saved;
  const nav = (navigator.language || 'en').toLowerCase();
  const hit = SETU_LANGS.find((l) => nav.startsWith(l.code.toLowerCase().split('-')[0]));
  return hit ? hit.code : 'en';
}

if ('serviceWorker' in navigator && !window.SetuNative && location.protocol === 'https:') window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
