const passwordGate = document.getElementById('passwordGate');
const passwordForm = document.getElementById('passwordForm');
const passwordInput = document.getElementById('sitePassword');
const passwordError = document.getElementById('passwordError');
const passwordHash = 'bf5f609cbe892bde7d19dc274435c5792b07080db61efa02aee9ca058176e14a';

function sha256(value) {
  const rightRotate = (number, amount) => number >>> amount | number << 32 - amount;
  const words = [];
  const ascii = unescape(encodeURIComponent(value));
  const bitLength = ascii.length * 8;
  const hash = sha256.initialHash || [];
  const constants = sha256.constants || [];
  let primeCounter = constants.length;
  if (!primeCounter) {
    const composites = {};
    for (let candidate = 2; primeCounter < 64; candidate += 1) {
      if (composites[candidate]) continue;
      for (let multiple = candidate * candidate; multiple < 313; multiple += candidate) composites[multiple] = true;
      hash[primeCounter] = Math.pow(candidate, .5) * 4294967296 | 0;
      constants[primeCounter] = Math.pow(candidate, 1 / 3) * 4294967296 | 0;
      primeCounter += 1;
    }
    sha256.initialHash = hash;
    sha256.constants = constants;
  }
  let message = ascii + '\x80';
  while (message.length % 64 !== 56) message += '\x00';
  for (let index = 0; index < message.length; index += 1) words[index >> 2] |= message.charCodeAt(index) << (3 - index % 4) * 8;
  words.push(bitLength / 4294967296 | 0, bitLength);
  let currentHash = hash.slice(0, 8);
  for (let block = 0; block < words.length; block += 16) {
    const oldHash = currentHash.slice(0);
    const schedule = words.slice(block, block + 16);
    for (let round = 0; round < 64; round += 1) {
      const w15 = schedule[round - 15];
      const w2 = schedule[round - 2];
      const a = currentHash[0];
      const e = currentHash[4];
      const word = round < 16 ? schedule[round] : schedule[round] = (schedule[round - 16] + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ w15 >>> 3) + schedule[round - 7] + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ w2 >>> 10)) | 0;
      const temp = (currentHash[7] + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) + (e & currentHash[5] ^ ~e & currentHash[6]) + constants[round] + word) | 0;
      currentHash = [(temp + ((rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) + (a & currentHash[1] ^ a & currentHash[2] ^ currentHash[1] & currentHash[2]))) | 0, a, currentHash[1], currentHash[2], (currentHash[3] + temp) | 0, e, currentHash[5], currentHash[6]];
    }
    for (let index = 0; index < 8; index += 1) currentHash[index] = currentHash[index] + oldHash[index] | 0;
  }
  return currentHash.map(word => (word >>> 0).toString(16).padStart(8, '0')).join('');
}

if (sessionStorage.getItem('fy-unlocked') === 'yes') passwordGate.classList.add('unlocked');
passwordForm.addEventListener('submit', event => {
  event.preventDefault();
  if (sha256(passwordInput.value) === passwordHash) {
    sessionStorage.setItem('fy-unlocked', 'yes');
    passwordGate.classList.add('unlocked');
    passwordInput.value = '';
    passwordError.textContent = '';
    audio.play().catch(() => updateMusicButton());
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
let publishedContent = { pages: [] };

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

function publishedPageForScreen(screen) {
  return publishedContent.pages.find(page => String(page.screen) === String(screen?.dataset.screen));
}

function bindNote(note, key, publishedValue = '') {
  const saved = localStorage.getItem(key);
  note.value = saved === null ? publishedValue : saved;
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
  const publishedPage = publishedPageForScreen(trip);
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
    bindNote(note, `fy-note-page-${page}-${index}`, publishedPage?.photoNotes?.[index] || '');
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
    finalPhotos = pageMedia['15'] || [];
    renderFinalPhoto();
  } catch (error) {
    console.error(error);
  }
}

const editableSelectors = [
  '.cover-copy h1', '.cover-copy p', '.cover-copy small',
  '.copy-block h1', '.copy-block h2', '.copy-block p',
  '.trip-head h2', '.trip-head p',
  '.final-head h2'
].join(',');

function editableKey(element, index) {
  const screen = element.closest('.screen');
  return `fy-page-text-${screen?.dataset.screen || 'unknown'}-${index}`;
}

function initializeEditableText() {
  document.querySelectorAll('.screen').forEach(screen => {
    const publishedPage = publishedPageForScreen(screen);
    screen.querySelectorAll(editableSelectors).forEach((element, index) => {
      const key = editableKey(element, index);
      const saved = localStorage.getItem(key);
      const publishedValue = publishedPage?.texts?.[index]?.html;
      if (publishedValue !== undefined) element.innerHTML = publishedValue;
      if (saved !== null) element.innerHTML = saved;
      element.contentEditable = 'true';
      element.spellcheck = false;
      element.classList.add('editable-text');
      element.setAttribute('aria-label', '可编辑文字');
      element.addEventListener('input', () => localStorage.setItem(key, element.innerHTML));
      element.addEventListener('paste', event => {
        event.preventDefault();
        document.execCommand('insertText', false, event.clipboardData.getData('text/plain'));
      });
    });
  });
}

const letter = document.querySelector('.love-letter');
const savedLetter = localStorage.getItem('fy-love-letter');
letter.value = savedLetter === null ? '' : savedLetter;
letter.addEventListener('input', () => localStorage.setItem('fy-love-letter', letter.value));
document.getElementById('restart').addEventListener('click', () => showScreen(0));

const audio = document.getElementById('bgm');
const musicButton = document.getElementById('musicBtn');
const musicLabel = document.getElementById('musicLabel');
const playlist = [
  { src: 'audio/xuyue.mp3', title: '嘘月' },
  { src: 'audio/wo-ai-ni.mp3', title: '我爱你' },
  { src: 'audio/april-encounter.mp3', title: '春日相遇' }
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
  musicButton.setAttribute('aria-label', playing ? '暂停音乐' : '继续音乐');
  musicLabel.textContent = playing ? '暂停' : '继续';
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

async function initializeSite() {
  try {
    const response = await fetch('published-content.json', { cache: 'no-store' });
    if (response.ok) publishedContent = await response.json();
  } catch (error) {
    console.error(error);
  }
  initializeEditableText();
  const finalPage = publishedPageForScreen(document.querySelector('.finale'));
  if (savedLetter === null) letter.value = finalPage?.loveLetter || '';
  await loadPageMedia();
  showScreen(0);
}

initializeSite();
