const passwordGate = document.getElementById('passwordGate');
const passwordForm = document.getElementById('passwordForm');
const passwordInput = document.getElementById('sitePassword');
const passwordError = document.getElementById('passwordError');
const passwordHash = '8626da287321d1eb3f0e398208e99367f3328781ca67dfa6493134b07bd96730';

async function hashPassword(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

if (sessionStorage.getItem('fy-unlocked') === 'yes') passwordGate.classList.add('unlocked');
passwordForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (await hashPassword(passwordInput.value) === passwordHash) {
    sessionStorage.setItem('fy-unlocked', 'yes');
    passwordGate.classList.add('unlocked');
    passwordInput.value = '';
    passwordError.textContent = '';
  } else {
    passwordError.textContent = '密码不正确，请再试一次。';
    passwordInput.select();
  }
});

const screens = [...document.querySelectorAll('.screen')];
const backButton = document.getElementById('backBtn');
const progressBar = document.getElementById('pageProgress');
const progressField = document.querySelector('.progress-field');
const progressRunner = document.querySelector('.progress-runner');
const counter = document.querySelector('.chapter-count');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let current = 0;
let transitioning = false;
let navigationToken = 0;
let runnerTimer;

function animateRunner() {
  progressRunner.classList.remove('running');
  void progressRunner.offsetWidth;
  progressRunner.classList.add('running');
  window.clearTimeout(runnerTimer);
  runnerTimer = window.setTimeout(() => progressRunner.classList.remove('running'), 620);
}

function showScreen(index) {
  current = Math.max(0, Math.min(index, screens.length - 1));
  screens.forEach((screen, i) => screen.classList.toggle('active', i === current));
  const active = screens[current];
  active.classList.remove('leaving');
  active.scrollTop = 0;
  backButton.classList.toggle('visible', current > 0);
  progressBar.max = String(screens.length - 1);
  progressBar.value = String(current);
  progressBar.style.setProperty('--progress', `${current / (screens.length - 1) * 100}%`);
  progressField.style.setProperty('--progress', `${current / (screens.length - 1) * 100}%`);
  animateRunner();
  counter.textContent = `${String(current).padStart(2, '0')} / ${String(screens.length - 1).padStart(2, '0')}`;
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
}

function createHearts(container) {
  if (!container || container.children.length) return;
  for (let i = 0; i < 22; i += 1) {
    const heart = document.createElement('i');
    heart.textContent = '♥';
    heart.style.setProperty('--x', `${-170 + Math.random() * 340}px`);
    heart.style.setProperty('--delay', `${Math.random() * .34}s`);
    heart.style.fontSize = `${12 + Math.random() * 20}px`;
    container.appendChild(heart);
  }
}

document.querySelectorAll('.heart-particles').forEach(createHearts);

document.querySelectorAll('[data-next]').forEach(button => {
  button.addEventListener('click', () => {
    if (transitioning) return;
    transitioning = true;
    const token = ++navigationToken;
    const active = screens[current];
    const interaction = button.closest('.interaction');
    interaction?.classList.add('triggered');
    const effectTime = reduceMotion ? 20 : interaction?.dataset.action === 'heart' ? 1250 : 850;
    window.setTimeout(() => { if (token === navigationToken) active.classList.add('leaving'); }, Math.max(10, effectTime - 350));
    window.setTimeout(() => {
      if (token !== navigationToken) return;
      interaction?.classList.remove('triggered');
      active.classList.remove('leaving');
      showScreen(current + 1);
      transitioning = false;
    }, effectTime);
  });
});

backButton.addEventListener('click', () => {
  if (!transitioning && current > 0) { navigationToken += 1; showScreen(current - 1); }
});

progressBar.addEventListener('input', () => {
  navigationToken += 1;
  transitioning = false;
  screens.forEach(screen => screen.classList.remove('leaving'));
  showScreen(Number(progressBar.value));
});

let pageMedia = {};
let beautyPhotos = [];
let beautyPhoto = 0;
const beautyFrame = document.querySelector('.beauty-photo');
const beautyDots = document.getElementById('beautyDots');
const beautyNote = document.getElementById('beautyNote');

function buildMedia(item, className = '') {
  const element = document.createElement(item.type.startsWith('video/') ? 'video' : 'img');
  element.className = className;
  element.src = item.url;
  if (element.tagName === 'VIDEO') {
    element.controls = true;
    element.playsInline = true;
    element.preload = 'metadata';
  } else {
    element.loading = 'lazy';
    element.alt = '';
  }
  return element;
}

function bindNote(note, key) {
  note.value = localStorage.getItem(key) || '';
  note.addEventListener('input', () => localStorage.setItem(key, note.value));
}

function createScratchCard() {
  const card = document.createElement('div');
  card.className = 'scratch-card';
  card.innerHTML = '<div class="scratch-prize"><small>刮开有惊喜</small><strong>恭喜中奖<br>任意奶茶15杯</strong></div><canvas aria-label="用手指刮开查看中奖内容"></canvas>';
  const canvas = card.querySelector('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  let drawing = false;
  let moveCount = 0;
  let lastPoint = null;

  function resizeCanvas() {
    if (card.classList.contains('revealed')) return;
    const rect = card.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.globalCompositeOperation = 'source-over';
    context.fillStyle = '#c8c9cb';
    context.fillRect(0, 0, rect.width, rect.height);
    context.fillStyle = '#74777a';
    context.font = '700 17px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('用手指刮开', rect.width / 2, rect.height / 2);
  }

  function pointFromTouch(touch) {
    const rect = canvas.getBoundingClientRect();
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  }

  function erase(point) {
    context.globalCompositeOperation = 'destination-out';
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = 42;
    context.beginPath();
    if (lastPoint) context.moveTo(lastPoint.x, lastPoint.y);
    else context.moveTo(point.x, point.y);
    context.lineTo(point.x, point.y);
    context.stroke();
    lastPoint = point;
  }

  function revealIfReady() {
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let transparent = 0;
    for (let index = 3; index < pixels.length; index += 16) {
      if (pixels[index] < 32) transparent += 1;
    }
    if (transparent / (pixels.length / 16) >= 0.6) {
      card.classList.add('revealed');
      canvas.style.pointerEvents = 'none';
    }
  }

  canvas.addEventListener('touchstart', event => {
    event.preventDefault();
    drawing = true;
    lastPoint = null;
    erase(pointFromTouch(event.touches[0]));
  }, { passive: false });
  canvas.addEventListener('touchmove', event => {
    event.preventDefault();
    if (!drawing) return;
    erase(pointFromTouch(event.touches[0]));
    moveCount += 1;
    if (moveCount % 10 === 0) revealIfReady();
  }, { passive: false });
  canvas.addEventListener('touchend', event => {
    event.preventDefault();
    drawing = false;
    lastPoint = null;
    revealIfReady();
  }, { passive: false });

  requestAnimationFrame(resizeCanvas);
  new ResizeObserver(resizeCanvas).observe(card);
  return card;
}

function renderTripMedia(trip) {
  const page = trip.dataset.mediaPage;
  const allItems = pageMedia[page] || [];
  const items = page === '6' ? allItems.slice(1) : allItems;
  const stream = trip.querySelector('.photo-stream');
  stream.innerHTML = '';
  items.forEach((item, index) => {
    const entry = document.createElement('article');
    entry.className = 'photo-entry';
    const frame = document.createElement('div');
    frame.className = 'uploaded-media';
    frame.appendChild(buildMedia(item));
    const note = document.createElement('textarea');
    note.className = 'photo-note';
    note.placeholder = '写下这张照片或视频背后的故事……';
    bindNote(note, `fy-note-page-${page}-${index}`);
    entry.append(frame);
    if (page === '13' && index === 0) entry.append(createScratchCard());
    entry.append(note);
    stream.appendChild(entry);
  });
}

function renderChapterMedia(screen) {
  const page = screen.dataset.mediaPage;
  const items = pageMedia[page] || [];
  if (!items.length) return;
  const gallery = document.createElement('div');
  gallery.className = 'chapter-media';
  items.forEach(item => gallery.appendChild(buildMedia(item)));
  screen.insertBefore(gallery, screen.querySelector('.interaction'));
}

function saveBeautyNote() {
  localStorage.setItem(`fy-beauty-note-${beautyPhoto}`, beautyNote.value);
}

function renderBeautyPhoto() {
  if (!beautyPhotos.length) return;
  beautyFrame.innerHTML = '';
  beautyFrame.appendChild(buildMedia(beautyPhotos[beautyPhoto]));
  beautyDots.innerHTML = beautyPhotos.map((_, i) => `<i class="${i === beautyPhoto ? 'active' : ''}"></i>`).join('');
  beautyNote.value = localStorage.getItem(`fy-beauty-note-${beautyPhoto}`) || '';
}

beautyNote.addEventListener('input', saveBeautyNote);
document.getElementById('prevBeauty').addEventListener('click', () => { if (!beautyPhotos.length) return; saveBeautyNote(); beautyPhoto = (beautyPhoto - 1 + beautyPhotos.length) % beautyPhotos.length; renderBeautyPhoto(); });
document.getElementById('nextBeauty').addEventListener('click', () => { if (!beautyPhotos.length) return; saveBeautyNote(); beautyPhoto = (beautyPhoto + 1) % beautyPhotos.length; renderBeautyPhoto(); });

let finalPhotos = [];
let finalPhoto = 0;
const finalFrame = document.querySelector('.final-photo');
const finalDots = document.getElementById('finalDots');

function renderFinalPhoto() {
  if (!finalPhotos.length) return;
  finalFrame.innerHTML = '';
  finalFrame.appendChild(buildMedia(finalPhotos[finalPhoto]));
  finalDots.innerHTML = finalPhotos.map((_, i) => `<i class="${i === finalPhoto ? 'active' : ''}"></i>`).join('');
}

document.getElementById('prevFinal').addEventListener('click', () => { if (!finalPhotos.length) return; finalPhoto = (finalPhoto - 1 + finalPhotos.length) % finalPhotos.length; renderFinalPhoto(); });
document.getElementById('nextFinal').addEventListener('click', () => { if (!finalPhotos.length) return; finalPhoto = (finalPhoto + 1) % finalPhotos.length; renderFinalPhoto(); });

async function loadPageMedia() {
  try {
    const response = await fetch('media-manifest.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('媒体列表加载失败');
    pageMedia = await response.json();
    document.querySelectorAll('.trip[data-media-page]').forEach(renderTripMedia);
    document.querySelectorAll('.story[data-media-page]').forEach(renderChapterMedia);
    beautyPhotos = pageMedia['14'] || [];
    finalPhotos = pageMedia['15'] || [];
    renderBeautyPhoto();
    renderFinalPhoto();
  } catch (error) {
    console.error(error);
  }
}

loadPageMedia();

const letter = document.querySelector('.love-letter');
letter.value = localStorage.getItem('fy-love-letter') || '';
letter.addEventListener('input', () => localStorage.setItem('fy-love-letter', letter.value));
document.getElementById('restart').addEventListener('click', () => showScreen(0));

const audio = document.getElementById('bgm');
const musicButton = document.getElementById('musicBtn');
const musicLabel = document.getElementById('musicLabel');
const playlist = [
  { src: 'audio/wo-ai-ni.mp3', title: '我爱你' }
];
let trackIndex = 0;

function loadTrack(index, autoplay = false) {
  trackIndex = (index + playlist.length) % playlist.length;
  audio.src = playlist[trackIndex].src;
  audio.load();
  musicButton.title = `当前：${playlist[trackIndex].title}`;
  if (autoplay) audio.play().catch(() => { musicLabel.textContent = '音乐不可用'; });
}

function updateMusicButton() {
  const playing = !audio.paused;
  musicButton.classList.toggle('playing', playing);
  musicButton.setAttribute('aria-label', playing ? '暂停音乐' : '播放音乐');
  musicLabel.textContent = playing ? '暂停音乐' : '播放音乐';
}

musicButton.addEventListener('click', async () => {
  try {
    if (audio.paused) await audio.play(); else audio.pause();
  } catch (error) {
    musicLabel.textContent = '音乐不可用';
  }
  updateMusicButton();
});
audio.addEventListener('play', updateMusicButton);
audio.addEventListener('pause', updateMusicButton);
audio.addEventListener('ended', () => loadTrack(trackIndex + 1, true));
loadTrack(0);
updateMusicButton();
showScreen(0);
