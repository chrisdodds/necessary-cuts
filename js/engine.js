const audio = new AudioEngine();
const soundBuffers = {};
let currentScene = 0;
let narrativeEl, choicesEl, sceneLabelEl;
const typeSpeed = 30;
let activeSounds = {};
let clickingSound = null;
let boneTicker = null;

async function preloadSounds() {
  if (!audio.initialized) return;
  const files = {
    water: 'audio/water.mp3',
    crickets: 'audio/crickets.mp3',
    wind: 'audio/wind.mp3',
    hum: 'audio/hum.mp3',
    boneClick: 'audio/bone-click.mp3',
    gravel: 'audio/gravel.mp3'
  };
  const entries = Object.entries(files);
  const results = await Promise.allSettled(
    entries.map(([key, url]) => audio.loadSound(url).then(buf => { soundBuffers[key] = buf; }))
  );
  results.forEach((r, i) => {
    if (r.status === 'rejected') console.warn(`Failed to load ${entries[i][0]}:`, r.reason);
  });
  if (soundBuffers.crickets) soundBuffers.crickets = audio.crossfadeLoop(soundBuffers.crickets, 1.5);
  if (soundBuffers.wind) soundBuffers.wind = audio.crossfadeLoop(soundBuffers.wind, 1);
  if (soundBuffers.water) soundBuffers.water = audio.crossfadeLoop(soundBuffers.water, 1);
}

function typeText(element, text, speed = 30) {
  return new Promise(resolve => {
    let i = 0;
    element.textContent = '';
    const interval = setInterval(() => {
      if (i < text.length) {
        element.textContent += text[i];
        i++;
        scrollToBottom();
      } else {
        clearInterval(interval);
        resolve();
      }
    }, speed);
  });
}

async function showPassages(passages, container) {
  for (const p of passages) {
    const el = document.createElement('div');
    el.className = 'passage ' + (p.class || '');
    container.appendChild(el);
    await typeText(el, p.text, typeSpeed);
    el.style.opacity = '1';
    await wait(400);
    scrollToBottom();
  }
}

function showChoices(choices, container) {
  return new Promise(resolve => {
    clearEl(container);
    container.style.animation = 'none';
    container.offsetHeight;
    container.style.animation = 'fadeIn 0.8s ease 0.3s forwards';
    container.style.opacity = '0';

    choices.forEach((c) => {
      const btn = document.createElement('button');
      btn.className = 'choice';
      btn.textContent = c.text;
      btn.addEventListener('click', () => {
        container.querySelectorAll('.choice').forEach(b => {
          if (b !== btn) b.classList.add('selected');
        });

        setTimeout(() => {
          clearEl(container);
          resolve(c.next);
        }, 600);
      });
      container.appendChild(btn);
    });
  });
}

function dimOlderPassages() {
  const passages = narrativeEl.querySelectorAll('.passage:not(.dim)');
  if (passages.length > 6) {
    for (let i = 0; i < passages.length - 6; i++) {
      passages[i].classList.add('dim');
    }
  }
}

function scrollToBottom() {
  narrativeEl.scrollTop = narrativeEl.scrollHeight;
}

function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function clearEl(el) { while (el.firstChild) el.removeChild(el.firstChild); }

function animateSceneLabel() {
  sceneLabelEl.style.animation = 'none';
  sceneLabelEl.offsetHeight;
  sceneLabelEl.style.animation = 'fadeIn 1.5s ease 0.3s forwards';
  sceneLabelEl.style.opacity = '0';
}

function startSceneAudio(sceneName) {
  if (!audio.initialized) return;

  stopAllAudio();

  if (sceneName === 'lake') {
    // Water lapping - real file or fallback to brown noise
    if (soundBuffers.water) {
      const water = audio.playBuffer(soundBuffers.water, { loop: true, volume: 0 });
      audio.fadeIn(water.gain, 0.25, 4);
      activeSounds.water = water;
    } else {
      const water = audio.createNoise();
      const waterGain = audio.ctx.createGain();
      const waterFilter = audio.ctx.createBiquadFilter();
      waterFilter.type = 'lowpass';
      waterFilter.frequency.value = 250;
      waterGain.gain.value = 0;
      water.connect(waterFilter);
      waterFilter.connect(waterGain);
      waterGain.connect(audio.masterGain);
      water.start();
      audio.fadeIn(waterGain, 0.7, 4);
      activeSounds.water = { source: water, gain: waterGain };
    }

    // Crickets/frogs - real file or fallback to procedural
    if (soundBuffers.crickets) {
      const crickets = audio.playBuffer(soundBuffers.crickets, { loop: true, volume: 0 });
      audio.fadeIn(crickets.gain, 0.4, 3);
      activeSounds.crickets = crickets;
    } else {
      const crickets = audio.createCrickets();
      crickets.output.connect(audio.masterGain);
      audio.fadeIn(crickets.gain, 0.15, 3);
      activeSounds.crickets = crickets;
    }

    // Clicking - keep procedural (it's good and rhythmic)
    clickingSound = audio.createClicking();
    clickingSound.start(1500);
    activeSounds.clicking = clickingSound;

  } else if (sceneName === 'bedroom') {
    // Wind - real file or fallback to procedural
    if (soundBuffers.wind) {
      const wind = audio.playBuffer(soundBuffers.wind, { loop: true, volume: 0 });
      audio.fadeIn(wind.gain, 0.4, 3);
      activeSounds.wind = wind;
    } else {
      const wind = audio.createWind();
      wind.output.connect(audio.masterGain);
      audio.fadeIn(wind.gain, 0.5, 3);
      activeSounds.wind = wind;
    }

    // Electric hum - real file or fallback to procedural
    if (soundBuffers.hum) {
      const hum = audio.playBuffer(soundBuffers.hum, { loop: true, volume: 0 });
      audio.fadeIn(hum.gain, 0.25, 4);
      activeSounds.hum = hum;
    } else {
      const hum = audio.createHum();
      hum.output.connect(audio.masterGain);
      audio.fadeIn(hum.gain, 0.2, 4);
      activeSounds.hum = hum;
    }

    // Bone ticker - use real bone click sample if available
    if (soundBuffers.boneClick) {
      const tick = () => {
        if (!audio.ctx) return;
        const src = audio.ctx.createBufferSource();
        src.buffer = soundBuffers.boneClick;
        const gain = audio.ctx.createGain();
        gain.gain.value = 0.6;
        src.connect(gain);
        gain.connect(audio.masterGain);
        src.start();
      };
      boneTicker = { tick };
    } else {
      boneTicker = audio.createBoneTicks();
    }
    activeSounds.boneTicker = boneTicker;

  } else if (sceneName === 'morning') {
    if (soundBuffers.wind) {
      const wind = audio.playBuffer(soundBuffers.wind, { loop: true, volume: 0 });
      audio.fadeIn(wind.gain, 0.2, 5);
      activeSounds.wind = wind;
    } else {
      const wind = audio.createWind();
      wind.output.connect(audio.masterGain);
      audio.fadeIn(wind.gain, 0.25, 5);
      activeSounds.wind = wind;
    }

    // Gravel/road — starts silent, fades in when the car moves
    if (soundBuffers.gravel) {
      const gravel = audio.playBuffer(soundBuffers.gravel, { loop: true, volume: 0 });
      activeSounds.gravel = gravel;
    }
  }
}

function stopAllAudio() {
  const fadeAndStop = (sound, fadeDuration = 2) => {
    if (!sound) return;
    if (sound.gain) audio.fadeOut(sound.gain, fadeDuration);
    if (sound.source) {
      setTimeout(() => { try { sound.source.stop(); } catch(e){} }, (fadeDuration + 0.5) * 1000);
    }
  };

  fadeAndStop(activeSounds.water);
  fadeAndStop(activeSounds.crickets);
  fadeAndStop(activeSounds.wind);
  fadeAndStop(activeSounds.hum);
  fadeAndStop(activeSounds.gravel);

  if (activeSounds.clicking) {
    activeSounds.clicking.stop();
  }

  activeSounds = {};
  clickingSound = null;
  boneTicker = null;
}

async function playBeats(beats, scene) {
  for (const beat of beats) {
    dimOlderPassages();
    await showPassages(beat.passages, narrativeEl);

    if (scene.label === 'the lake') {
      if (clickingSound && beat.passages.some(p => p.text.includes('faster'))) {
        clickingSound.setRate(400);
      }
      if (clickingSound && beat.passages.some(p => p.text.includes('sighs'))) {
        clickingSound.stop();
        if (activeSounds.crickets) {
          audio.fadeIn(activeSounds.crickets.gain, 0.12, 2);
        }
      }
    }

    if (scene.label === 'departure') {
      if (activeSounds.gravel && beat.passages.some(p => p.text.includes('grip your shirt'))) {
        audio.fadeIn(activeSounds.gravel.gain, 0.35, 4);
      }
    }

    if (scene.label === 'the bedroom') {
      if (boneTicker && beat.passages.some(p => p.text.includes('tick-tick'))) {
        boneTicker.tick();
        setTimeout(() => boneTicker.tick(), 300);
        setTimeout(() => boneTicker.tick(), 700);
      }
      if (boneTicker && beat.passages.some(p => p.text.includes('hums'))) {
        if (activeSounds.hum) audio.fadeIn(activeSounds.hum.gain, 0.15, 2);
      }
    }

    if (beat.choices) {
      const chosen = await showChoices(beat.choices, choicesEl);
      if (scene.branches[chosen]) {
        await playBeats(scene.branches[chosen].beats, scene);
        return;
      }
    } else if (beat.then === 'next_scene') {
      await wait(beat.delay || 1000);
      await transitionToNextScene();
      return;
    } else if (beat.then === 'ending') {
      // Fade canvas to black over the delay so the scene darkens while the last line lingers
      const fadeDuration = (beat.delay || 1000) - 500;
      canvas.style.transition = `opacity ${fadeDuration / 1000}s ease`;
      canvas.style.opacity = '0';
      await wait(beat.delay || 1000);
      await showEnding();
      return;
    } else if (beat.then) {
      // Branch to another branch
      if (scene.branches[beat.then]) {
        await wait(beat.delay || 500);
        await playBeats(scene.branches[beat.then].beats, scene);
        return;
      }
    }

    if (beat.delay) await wait(beat.delay);
  }
}

async function transitionToNextScene() {
  const overlay = document.getElementById('scene-overlay');
  overlay.classList.add('active');
  stopAllAudio();
  await wait(2000);

  currentScene++;
  clearEl(narrativeEl);
  clearEl(choicesEl);

  if (currentScene < scenes.length) {
    const scene = scenes[currentScene];
    startCanvasTransition(scene.ambient, 3000);
    createParticles(scene.ambient);
    sceneLabelEl.textContent = scene.label;
    animateSceneLabel();

    startSceneAudio(scene.ambient);

    overlay.classList.remove('active');
    await wait(1500);
    await playBeats(scene.beats, scene);
  }
}

async function appendEndingEl(className, text, speed, styles = {}) {
  const el = document.createElement('div');
  el.className = className;
  Object.assign(el.style, styles);
  narrativeEl.appendChild(el);
  await typeText(el, text, speed);
  el.style.opacity = '1';
}

async function showEnding() {
  const overlay = document.getElementById('scene-overlay');
  overlay.classList.add('active');
  stopAllAudio();
  await wait(1500);

  clearEl(narrativeEl);
  clearEl(choicesEl);
  sceneLabelEl.textContent = '';

  overlay.classList.remove('active');
  await wait(1200);

  // Links appear first
  const endLinks = document.createElement('div');
  endLinks.style.cssText = 'margin-top:30vh;display:flex;flex-direction:column;align-items:center;gap:1.2rem;';
  narrativeEl.appendChild(endLinks);

  const signup = document.createElement('a');
  signup.className = 'replay-link';
  signup.href = '/#signup';
  signup.textContent = 'get notified when the book is out';
  signup.style.letterSpacing = '0.12em';
  endLinks.appendChild(signup);

  const replay = document.createElement('button');
  replay.className = 'replay-link';
  replay.textContent = 'begin again';
  replay.style.opacity = '0';
  replay.style.animationDelay = '0.8s';
  replay.addEventListener('click', restartGame);
  endLinks.appendChild(replay);

  await wait(2500);

  // Credits type in below
  await appendEndingEl('passage end-text', 'Necessary Cuts', 80, { textAlign: 'center', marginTop: '3rem' });
  await wait(1000);
  await appendEndingEl('passage end-text whisper', 'Chris Dodds', 60, { textAlign: 'center' });
  await wait(1500);
}

async function restartGame() {
  const overlay = document.getElementById('scene-overlay');
  overlay.classList.add('active');
  await wait(1500);

  currentScene = 0;
  stopAllAudio();
  canvasTransition = { active: false, fromMode: null, toMode: null, progress: 0, duration: 0, startTime: 0 };

  clearEl(narrativeEl);
  clearEl(choicesEl);

  canvas.style.transition = 'none';
  canvas.style.opacity = '';

  const scene = scenes[0];
  sceneLabelEl.textContent = scene.label;
  animateSceneLabel();
  ambientMode = scene.ambient;
  createParticles(ambientMode);
  startSceneAudio(scene.ambient);

  overlay.classList.remove('active');
  await wait(1000);
  await playBeats(scene.beats, scene);
}

let gameStarted = false;
document.getElementById('title-screen').addEventListener('click', async () => {
  if (gameStarted) return;
  gameStarted = true;

  audio.init();
  const preloadPromise = preloadSounds();

  const titleScreen = document.getElementById('title-screen');
  titleScreen.classList.add('hiding');

  await Promise.all([
    wait(1500),
    Promise.race([preloadPromise, wait(3000)])
  ]);
  titleScreen.style.display = 'none';

  const game = document.getElementById('game');
  game.style.display = 'flex';

  narrativeEl = document.getElementById('narrative');
  choicesEl = document.getElementById('choices');
  sceneLabelEl = document.getElementById('scene-label');

  const scene = scenes[0];
  sceneLabelEl.textContent = scene.label;
  ambientMode = scene.ambient;
  createParticles(ambientMode);
  startSceneAudio(scene.ambient);

  await wait(1000);
  await playBeats(scene.beats, scene);
});

let soundOn = true;
document.getElementById('sound-hint').addEventListener('click', (e) => {
  e.stopPropagation();
  soundOn = !soundOn;
  if (audio.masterGain) {
    audio.masterGain.gain.value = soundOn ? 0.3 : 0;
  }
  document.getElementById('sound-hint').classList.toggle('muted', !soundOn);
});
