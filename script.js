// Initialize year
document.getElementById('year').textContent = new Date().getFullYear();

// Intersection Observer for fade-ins
const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  }
}, { threshold: 0.15 });

document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));

// Image fallback for broken sources (try data-alt-src before placeholder)
function attachImageFallbacks() {
  const fallback = './assets/images/placeholder.svg';
  document.querySelectorAll('img').forEach((img) => {
    img.addEventListener('error', function onError() {
      if (img.dataset.triedAlt === 'true') {
        if (img.dataset.fallbackApplied === 'true') return;
        console.warn('Image failed (alt tried). Using placeholder:', img.src);
        img.dataset.fallbackApplied = 'true';
        img.src = fallback;
        return;
      }
      if (img.dataset.altSrc) {
        console.warn('Image failed. Trying alt source:', img.dataset.altSrc);
        img.dataset.triedAlt = 'true';
        img.src = img.dataset.altSrc;
        return;
      }
      if (img.dataset.fallbackApplied === 'true') return;
      console.warn('Image failed. Using placeholder:', img.src);
      img.dataset.fallbackApplied = 'true';
      img.src = fallback;
    });
  });
}
attachImageFallbacks();

// Back to top visibility
const toTopButton = document.getElementById('to-top');
window.addEventListener('scroll', () => {
  const show = window.scrollY > 400;
  toTopButton.classList.toggle('visible', show);
});
toTopButton.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// Background audio playlist control (user-initiated only)
const audioEl = document.getElementById('bg-audio');
const audioToggle = document.getElementById('audio-toggle');
const prevBtn = document.getElementById('prev-track');
const playPauseBtn = document.getElementById('play-pause');
const nextBtn = document.getElementById('next-track');
const trackTitle = document.getElementById('track-title');
let audioEnabled = false;
const playlist = [
  { title: 'Surah Ar-Rahman', src: './assets/audio/surah-rahman.mp3' },
  { title: 'Surah Yaseen', src: './assets/audio/surah-yaseen.mp3' },
  { title: 'Soft Recitation', src: './assets/audio/soft-recitation.mp3' },
];
let currentTrack = 0;

function loadTrack(index) {
  const t = playlist[index];
  if (!t) return;
  audioEl.src = t.src;
  trackTitle.textContent = t.title;
}

function updateAudioUi() {
  audioToggle.setAttribute('aria-pressed', String(audioEnabled));
  audioToggle.querySelector('.icon').textContent = audioEnabled ? '🔈' : '🔊';
  playPauseBtn.textContent = audioEnabled ? '⏸' : '▶';
}

loadTrack(currentTrack);

audioToggle.addEventListener('click', async () => {
  try {
    if (!audioEnabled) {
      await audioEl.play();
      audioEnabled = true;
    } else {
      audioEl.pause();
      audioEnabled = false;
    }
  } catch (e) {
    console.warn('Audio toggle failed', e);
  } finally {
    updateAudioUi();
  }
});

playPauseBtn && playPauseBtn.addEventListener('click', async () => {
  try {
    if (!audioEnabled) {
      await audioEl.play();
      audioEnabled = true;
    } else if (audioEl.paused) {
      await audioEl.play();
      audioEnabled = true;
    } else {
      audioEl.pause();
      audioEnabled = false;
    }
  } finally {
    updateAudioUi();
  }
});

prevBtn && prevBtn.addEventListener('click', async () => {
  currentTrack = (currentTrack - 1 + playlist.length) % playlist.length;
  loadTrack(currentTrack);
  if (audioEnabled) await audioEl.play();
  updateAudioUi();
});

nextBtn && nextBtn.addEventListener('click', async () => {
  currentTrack = (currentTrack + 1) % playlist.length;
  loadTrack(currentTrack);
  if (audioEnabled) await audioEl.play();
  updateAudioUi();
});

// Elevate header on scroll
const header = document.querySelector('.site-header');
let lastY = 0;
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  const elevate = y > 10;
  header.style.boxShadow = elevate ? '0 6px 20px rgba(0,0,0,.25)' : 'none';
  lastY = y;
});

// Dark mode toggle
const modeToggle = document.getElementById('mode-toggle');
const storedTheme = localStorage.getItem('theme');
if (storedTheme) document.documentElement.setAttribute('data-theme', storedTheme);
modeToggle && modeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', current);
  localStorage.setItem('theme', current);
  modeToggle.setAttribute('aria-pressed', String(current === 'dark'));
});

// Particles in hero (simple stars drift)
const canvas = document.getElementById('particles');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let w, h; const stars = Array.from({ length: 100 }).map(() => ({ x: Math.random(), y: Math.random(), z: Math.random() }));
  function resize() { w = canvas.width = canvas.offsetWidth; h = canvas.height = canvas.offsetHeight; }
  window.addEventListener('resize', resize); resize();
  function draw() {
    ctx.clearRect(0,0,w,h);
    for (const s of stars) {
      const px = s.x * w; const py = (s.y * h + performance.now() * 0.01 * (s.z * 0.5 + 0.2)) % h;
      const size = s.z * 2 + 0.3;
      ctx.fillStyle = 'rgba(243,228,167,0.8)';
      ctx.beginPath(); ctx.arc(px, py, size, 0, Math.PI*2); ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  draw();
}

// Rotating featured ayah
const rotatingAyah = document.getElementById('rotating-ayah');
const ayahTrans = document.getElementById('ayah-trans');
const featuredAyat = [
  { ar: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا', en: 'Indeed, with hardship will be ease. — 94:6' },
  { ar: 'اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ', en: 'Allah is the Light of the heavens and the earth. — 24:35' },
  { ar: 'فَاذْكُرُونِي أَذْكُرْكُمْ', en: 'So remember Me; I will remember you. — 2:152' },
  { ar: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ', en: 'Verily, in the remembrance of Allah do hearts find rest. — 13:28' },
  { ar: 'ادْعُونِي أَسْتَجِبْ لَكُمْ', en: 'Call upon Me; I will respond to you. — 40:60' },
  { ar: 'وَرَحْمَتِي وَسِعَتْ كُلَّ شَيْءٍ', en: 'My mercy encompasses all things. — 7:156' },
];
let ayahIndex = 0;
function renderAyah() {
  if (!rotatingAyah || !ayahTrans) return;
  rotatingAyah.textContent = featuredAyat[ayahIndex].ar;
  ayahTrans.textContent = featuredAyat[ayahIndex].en;
}
renderAyah();
setInterval(() => {
  ayahIndex = (ayahIndex + 1) % featuredAyat.length;
  renderAyah();
}, 6000);

// Footer widgets: tasbeeh and prayer times
const tasInc = document.getElementById('tasbeeh-inc');
const tasReset = document.getElementById('tasbeeh-reset');
const tasCount = document.getElementById('tasbeeh-count');
let tasValue = Number(localStorage.getItem('tasbeeh') || '0');
if (tasCount) tasCount.textContent = String(tasValue);
tasInc && tasInc.addEventListener('click', () => { tasValue += 1; localStorage.setItem('tasbeeh', String(tasValue)); tasCount.textContent = String(tasValue); });
tasReset && tasReset.addEventListener('click', () => { tasValue = 0; localStorage.setItem('tasbeeh', '0'); tasCount.textContent = '0'; });

const prayerTimesEl = document.getElementById('prayer-times');
async function loadPrayerTimes() {
  if (!prayerTimesEl || !navigator.geolocation) return;
  try {
    const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 8000 }));
    const { latitude, longitude } = pos.coords;
    const url = `https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=2`;
    const data = await fetch(url).then(r => r.json());
    const t = data?.data?.timings || {};
    const keys = ['Fajr','Dhuhr','Asr','Maghrib','Isha'];
    prayerTimesEl.innerHTML = keys.map(k => `<div><strong>${k}:</strong> ${t[k] || '-'}</div>`).join('');
  } catch (e) {
    prayerTimesEl.textContent = 'Location blocked. Unable to load prayer times.';
  }
}
loadPrayerTimes();


// Mobile menu toggle
const menuToggle = document.getElementById('menu-toggle');
const primaryNav = document.getElementById('primary-nav');
if (menuToggle && primaryNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = primaryNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  });
  // Close menu when a link is clicked
  primaryNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    primaryNav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open menu');
  }));
  // Close menu on resize to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 860 && primaryNav.classList.contains('open')) {
      primaryNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open menu');
    }
  });
}


