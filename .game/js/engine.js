// ============================================
// GAME STATE
// ============================================
const audio = new AudioEngine();
const soundBuffers = {};
let currentScene = 0;
let narrativeEl, choicesEl, sceneLabelEl;
let typeSpeed = 30;
let activeSounds = {};
let clickingSound = null;
let boneTicker = null;

// ============================================
// AUDIO PRELOADER
// ============================================
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
  // Crossfade loop boundaries for seamless looping
  if (soundBuffers.crickets) audio.crossfadeLoop(soundBuffers.crickets, 1.5);
  if (soundBuffers.wind) audio.crossfadeLoop(soundBuffers.wind, 1);
  if (soundBuffers.water) audio.crossfadeLoop(soundBuffers.water, 1);
}

// ============================================
// TEXT ENGINE
// ============================================
function typeText(element, text, speed = 30) {
  return new Promise(resolve => {
    let i = 0;
    element.textContent = '';
    const interval = setInterval(() => {
      if (i < text.length) {
        element.textContent += text[i];
        i++;
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
    // Clear container safely - all content is from hardcoded story data
    while (container.firstChild) container.removeChild(container.firstChild);
    container.style.animation = 'none';
    container.offsetHeight; // reflow
    container.style.animation = 'fadeIn 0.8s ease 0.3s forwards';
    container.style.opacity = '0';

    choices.forEach((c, i) => {
      const btn = document.createElement('button');
      btn.className = 'choice';
      btn.textContent = c.text;
      btn.addEventListener('click', () => {
        // Dim all choices, highlight selected
        container.querySelectorAll('.choice').forEach(b => b.classList.add('selected'));
        btn.style.opacity = '0.7';
        btn.style.borderColor = 'var(--accent)';
        btn.style.color = 'var(--accent)';

        setTimeout(() => {
          while (container.firstChild) container.removeChild(container.firstChild);
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

// ============================================
// SOUND SCENES
// ============================================
function startSceneAudio(sceneName) {
  if (!audio.initialized) return;

  // Stop all existing
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
    // Light wind - real file or fallback
    if (soundBuffers.wind) {
      const wind = audio.playBuffer(soundBuffers.wind, { loop: true, volume: 0 });
      audio.fadeIn(wind.gain, 0.3, 3);
      activeSounds.wind = wind;
    } else {
      const wind = audio.createWind();
      wind.output.connect(audio.masterGain);
      audio.fadeIn(wind.gain, 0.4, 3);
      activeSounds.wind = wind;
    }

    // Gravel/car sound for departure
    if (soundBuffers.gravel) {
      const gravel = audio.playBuffer(soundBuffers.gravel, { loop: true, volume: 0 });
      audio.fadeIn(gravel.gain, 0.0, 0); // starts silent, faded in later during narrative
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

// ============================================
// SCENE RUNNER
// ============================================
async function playBeats(beats, scene) {
  for (const beat of beats) {
    dimOlderPassages();
    await showPassages(beat.passages, narrativeEl);

    // Trigger audio events
    if (scene.label === 'the lake') {
      // Speed up clicking as tension builds
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
  while (narrativeEl.firstChild) narrativeEl.removeChild(narrativeEl.firstChild);
  while (choicesEl.firstChild) choicesEl.removeChild(choicesEl.firstChild);

  if (currentScene < scenes.length) {
    const scene = scenes[currentScene];
    // Start canvas gradient crossfade (runs during the overlay fade-out)
    startCanvasTransition(scene.ambient, 3000);
    createParticles(scene.ambient);
    sceneLabelEl.textContent = scene.label;
    sceneLabelEl.style.animation = 'none';
    sceneLabelEl.offsetHeight;
    sceneLabelEl.style.animation = 'fadeIn 1.5s ease 0.3s forwards';
    sceneLabelEl.style.opacity = '0';

    startSceneAudio(scene.ambient);

    overlay.classList.remove('active');
    await wait(1500);
    await playBeats(scene.beats, scene);
  }
}

async function showEnding() {
  const overlay = document.getElementById('scene-overlay');
  overlay.classList.add('active');
  stopAllAudio();
  await wait(3000);

  while (narrativeEl.firstChild) narrativeEl.removeChild(narrativeEl.firstChild);
  while (choicesEl.firstChild) choicesEl.removeChild(choicesEl.firstChild);
  sceneLabelEl.textContent = '';
  ambientMode = 'morning';

  overlay.classList.remove('active');
  await wait(1000);

  const end = document.createElement('div');
  end.className = 'passage end-text';
  end.style.marginTop = '30vh';
  narrativeEl.appendChild(end);
  await typeText(end, 'Necessary Cuts', 80);
  end.style.opacity = '1';

  await wait(1500);

  const by = document.createElement('div');
  by.className = 'passage end-text whisper';
  by.style.textAlign = 'center';
  narrativeEl.appendChild(by);
  await typeText(by, 'Chris Dodds', 60);
  by.style.opacity = '1';

  await wait(2000);

  const cta = document.createElement('div');
  cta.className = 'passage end-text whisper';
  cta.style.textAlign = 'center';
  cta.style.fontSize = '0.75rem';
  cta.style.marginTop = '2rem';
  narrativeEl.appendChild(cta);
  await typeText(cta, 'a fragment from the novella', 40);
  cta.style.opacity = '1';

  // Fade ending text and canvas to black
  await wait(3000);
  const endingEls = narrativeEl.querySelectorAll('.passage');
  endingEls.forEach(el => {
    el.style.transition = 'opacity 3s ease';
    el.style.opacity = '0';
  });
  canvas.style.transition = 'opacity 3s ease';
  canvas.style.opacity = '0';
  await wait(3500);

  // Show "begin again" link
  while (narrativeEl.firstChild) narrativeEl.removeChild(narrativeEl.firstChild);
  const replay = document.createElement('button');
  replay.className = 'replay-link';
  replay.textContent = 'begin again';
  replay.style.marginTop = '45vh';
  replay.style.display = 'block';
  replay.style.marginLeft = 'auto';
  replay.style.marginRight = 'auto';
  replay.addEventListener('click', restartGame);
  narrativeEl.appendChild(replay);
}

// ============================================
// RESTART
// ============================================
async function restartGame() {
  const overlay = document.getElementById('scene-overlay');
  overlay.classList.add('active');
  await wait(1500);

  // Reset game state
  currentScene = 0;
  stopAllAudio();
  canvasTransition = { active: false, fromMode: null, toMode: null, progress: 0, duration: 0, startTime: 0 };

  // Clear DOM
  while (narrativeEl.firstChild) narrativeEl.removeChild(narrativeEl.firstChild);
  while (choicesEl.firstChild) choicesEl.removeChild(choicesEl.firstChild);

  // Restore canvas opacity
  canvas.style.transition = 'none';
  canvas.style.opacity = '';

  // Set up scene 0
  const scene = scenes[0];
  sceneLabelEl.textContent = scene.label;
  sceneLabelEl.style.animation = 'none';
  sceneLabelEl.offsetHeight;
  sceneLabelEl.style.animation = 'fadeIn 1.5s ease 0.3s forwards';
  sceneLabelEl.style.opacity = '0';
  ambientMode = scene.ambient;
  createParticles(ambientMode);
  startSceneAudio(scene.ambient);

  overlay.classList.remove('active');
  await wait(1000);
  await playBeats(scene.beats, scene);
}

// ============================================
// INIT
// ============================================
let gameStarted = false;
document.getElementById('title-screen').addEventListener('click', async () => {
  if (gameStarted) return;
  gameStarted = true;

  audio.init();
  const preloadPromise = preloadSounds();

  const titleScreen = document.getElementById('title-screen');
  titleScreen.classList.add('hiding');

  // Wait for title fade AND give preload up to 3s to finish
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

// Sound toggle
let soundOn = true;
document.getElementById('sound-hint').addEventListener('click', (e) => {
  e.stopPropagation();
  soundOn = !soundOn;
  if (audio.masterGain) {
    audio.masterGain.gain.value = soundOn ? 0.3 : 0;
  }
  document.getElementById('sound-hint').classList.toggle('muted', !soundOn);
});
