// Setu Meet — সেটিং
// গেস্টরা যে লিংক পাবে তার ঠিকানা (আপনার ফ্রি GitHub Pages)
const SETU_PUBLIC_BASE = 'https://ibrahimbinshiraj40-debug.github.io/setu-meet/';

// কল কানেক্ট করার ফ্রি সার্ভার (STUN)
// TURN = মোবাইল ডাটা/আলাদা নেটওয়ার্কেও কথা আর ভিডিও পৌঁছানোর ফ্রি রিলে
const SETU_ICE = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun.cloudflare.com:3478'] },
  { urls: ['turn:openrelay.metered.ca:80', 'turn:openrelay.metered.ca:443', 'turn:openrelay.metered.ca:443?transport=tcp'],
    username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: ['turn:freeturn.net:3478', 'turns:freeturn.tel:5349'], username: 'free', credential: 'free' }
];

// মিটিংয়ের মেসেজ আদান-প্রদানের ফ্রি পাবলিক সংযোগ (দুটো একসাথে — একটা বন্ধ থাকলেও অন্যটা চলবে)
// সব মেসেজ মিটিং-কোড দিয়ে তালা (AES) মারা থাকে — লিংক ছাড়া কেউ পড়তে পারবে না
const SETU_BROKERS = ['wss://broker.emqx.io:8084/mqtt', 'wss://broker.hivemq.com:8884/mqtt'];

// এই পেজ কোন ঠিকানা থেকে চলছে — অ্যাপের ভেতরে হলে উপরের পাবলিক ঠিকানা
function setuBase() {
  if (location.hostname === 'setu.local' || location.protocol === 'file:') return SETU_PUBLIC_BASE;
  return location.href.replace(/[?#].*$/, '').replace(/[^/]*$/, '');
}
const setuMeetLink = (id) => setuBase() + 'm.html?r=' + id;

// (ঐচ্ছিক) Google দিয়ে সাইন ইন করে Gmail-এর প্রোফাইল ছবি নেওয়ার জন্য OAuth Client ID
// Google Cloud Console থেকে বানিয়ে এখানে বসান। খালি থাকলে শুধু "ছবি দিন" বাটন থাকবে।
const SETU_GOOGLE_CLIENT_ID = '';
