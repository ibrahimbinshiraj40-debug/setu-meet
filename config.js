// Setu Meet — সেটিং
// গেস্টরা যে লিংক পাবে তার ঠিকানা (আপনার ফ্রি GitHub Pages)
const SETU_PUBLIC_BASE = 'https://ibrahimbinshiraj40-debug.github.io/setu-meet/';

// কল কানেক্ট করার ফ্রি সার্ভার (STUN)
const SETU_ICE = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302', 'stun:stun.cloudflare.com:3478'] }
];

// এই পেজ কোন ঠিকানা থেকে চলছে — অ্যাপের ভেতরে হলে উপরের পাবলিক ঠিকানা
function setuBase() {
  if (location.hostname === 'setu.local' || location.protocol === 'file:') return SETU_PUBLIC_BASE;
  return location.href.replace(/[?#].*$/, '').replace(/[^/]*$/, '');
}
const setuMeetLink = (id) => setuBase() + 'm.html?r=' + id;
