// AapkiDhun PWA — app.js v4.0
// Tab Navigation
const tabs = document.querySelectorAll('.tab');
const views = document.querySelectorAll('.view');

function showView(name) {
  views.forEach(v => v.classList.add('hidden'));
  tabs.forEach(t => t.classList.remove('active'));
  const target = document.getElementById('view-' + name);
  if (target) target.classList.remove('hidden');
  const activeTab = document.querySelector(`.tab[data-view="${name}"]`);
  if (activeTab) activeTab.classList.add('active');
}

tabs.forEach(tab => {
  tab.addEventListener('click', () => showView(tab.dataset.view));
});

document.querySelectorAll('[data-goto]').forEach(el => {
  el.addEventListener('click', () => showView(el.dataset.goto));
});

// ── PWA Install ──
let deferredPrompt;
const btnInstall = document.getElementById('btnInstall');
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  btnInstall.classList.remove('hidden');
});
btnInstall.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') btnInstall.classList.add('hidden');
  deferredPrompt = null;
});

// ── Prompt Builder ──
const promptForm = document.getElementById('promptForm');
const promptOut = document.getElementById('promptOut');
const promptOutputCard = document.getElementById('promptOutputCard');
const charCount = document.getElementById('charCount');

promptForm && promptForm.addEventListener('submit', e => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(promptForm));
  const prompt = `[GENRE] ${d.mode}
[LANGUAGE] ${d.language}
[THEME] ${d.theme}
[STYLE] ${d.stylePack || 'Authentic regional'}
[TEMPO] ${d.tempo || '100 BPM'}
[RHYTHM] ${d.rhythm || '4/4 standard'}
[INSTRUMENTS] ${d.instruments || 'Traditional instruments'}
[VOCAL] ${d.vocal}
[DURATION] ${d.duration}
[LYRICS RULE] ${d.lyricsRule}
[SPECIAL] ${d.special || 'None'}

Generate a complete music track with above specifications. Make it authentic, emotionally rich, and production-ready.`;
  promptOut.value = prompt;
  charCount.textContent = `${prompt.length} chars`;
  promptOutputCard.classList.remove('hidden');
});

document.getElementById('btnCopyPrompt') && document.getElementById('btnCopyPrompt').addEventListener('click', () => {
  navigator.clipboard.writeText(promptOut.value);
  alert('✅ Prompt copied!');
});
document.getElementById('btnPrintPrompt') && document.getElementById('btnPrintPrompt').addEventListener('click', () => window.print());
document.getElementById('btnClearPrompt') && document.getElementById('btnClearPrompt').addEventListener('click', () => {
  promptOut.value = '';
  promptOutputCard.classList.add('hidden');
});

// ── Presets ──
const PRESETS_KEY = 'aapkidhun_presets';
function loadPresets() {
  return JSON.parse(localStorage.getItem(PRESETS_KEY) || '[]');
}
function savePresets(arr) {
  localStorage.setItem(PRESETS_KEY, JSON.stringify(arr));
}

const defaultPresets = [
  { name: '🌺 Rajasthani Holi', mode: 'Regional Folk', language: 'Marwadi / Rajasthani', theme: 'Fagun Holi masti', tempo: '118 BPM', instruments: 'Chang, Dholak, Khartal', vocal: 'Male Folk — Regional authentic' },
  { name: '🕉️ Bhajan Devotional', mode: 'Bhajan', language: 'Hindi', theme: 'Krishna bhakti', tempo: '76 BPM', instruments: 'Harmonium, Tabla, Manjira', vocal: 'Male Bhajan — Devotional' },
  { name: '🎸 Sufi Rock', mode: 'Sufi', language: 'Urdu', theme: 'Ishq-e-haqiqi', tempo: '96 BPM', instruments: 'Sitar, Electric Guitar, Tabla', vocal: 'Male Sufi — Chest voice + Alaap' },
];

function renderPresets() {
  const list = document.getElementById('presetList');
  const myList = document.getElementById('myPresetList');
  if (list) {
    list.innerHTML = defaultPresets.map((p, i) => `
      <div class="preset-item">
        <div class="preset-name">${p.name}</div>
        <button class="btn small" onclick="applyPreset(${i}, 'default')">Use</button>
      </div>`).join('');
  }
  const saved = loadPresets();
  if (myList) {
    myList.innerHTML = saved.length ? saved.map((p, i) => `
      <div class="preset-item">
        <div class="preset-name">${p.name || 'Preset ' + (i+1)}</div>
        <button class="btn small" onclick="applyPreset(${i}, 'saved')">Use</button>
        <button class="btn ghost small" onclick="deletePreset(${i})">🗑️</button>
      </div>`).join('') : '<p class="muted">Koi saved preset nahi</p>';
  }
}

window.applyPreset = function(i, type) {
  const p = type === 'default' ? defaultPresets[i] : loadPresets()[i];
  if (!p || !promptForm) return;
  Object.keys(p).forEach(key => {
    const el = promptForm.elements[key];
    if (el) el.value = p[key];
  });
  showView('prompt');
};
window.deletePreset = function(i) {
  const arr = loadPresets();
  arr.splice(i, 1);
  savePresets(arr);
  renderPresets();
};

document.getElementById('btnSavePreset') && document.getElementById('btnSavePreset').addEventListener('click', () => {
  const d = Object.fromEntries(new FormData(promptForm));
  const name = prompt('Preset ka naam:') || 'My Preset';
  const arr = loadPresets();
  arr.push({ ...d, name });
  savePresets(arr);
  renderPresets();
  alert('✅ Preset saved!');
});

renderPresets();

// ── Recorder ──
let mediaRecorder, recChunks = [];
const btnRecord = document.getElementById('btnRecord');
const btnStop = document.getElementById('btnStop');
const recPlayer = document.getElementById('recPlayer');
const recDownload = document.getElementById('recDownload');

btnRecord && btnRecord.addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    recChunks = [];
    mediaRecorder.ondataavailable = e => recChunks.push(e.data);
    mediaRecorder.onstop = () => {
      const blob = new Blob(recChunks, { type: 'audio/webm' });
      const url = URL.createObjectURL(blob);
      recPlayer.src = url;
      recPlayer.classList.remove('hidden');
      recDownload.href = url;
      recDownload.download = 'recording.webm';
      recDownload.classList.remove('hidden');
    };
    mediaRecorder.start();
    btnRecord.disabled = true;
    btnStop.disabled = false;
    btnRecord.textContent = '🔴 Recording...';
  } catch(e) {
    alert('Mic access denied: ' + e.message);
  }
});

btnStop && btnStop.addEventListener('click', () => {
  mediaRecorder && mediaRecorder.stop();
  btnRecord.disabled = false;
  btnStop.disabled = true;
  btnRecord.textContent = '🎤 Record';
});

// ── Transcribe ──
function fakeTranscribe(genre, bpm, key) {
  return `[TRANSCRIPTION RESULT]
Genre Detected: ${genre || 'Indian Folk'}
Estimated BPM: ${bpm || '~110 BPM'}
Key: ${key || 'D Major'}
Time Signature: 4/4
Structure: Intro (8 bars) → Verse (16 bars) → Chorus (8 bars) → Outro
Instruments Detected: Dholak, Harmonium, Tabla, Claps
Mood: Energetic, Festive
Suggested Prompt: Use above details in Prompt Builder for best results.`;
}

document.getElementById('btnTranscribe') && document.getElementById('btnTranscribe').addEventListener('click', () => {
  const genre = document.getElementById('trGenrePreset').value;
  const bpm = document.getElementById('trBpm').value;
  const key = document.getElementById('trKey').value;
  const out = fakeTranscribe(genre, bpm, key);
  document.getElementById('trOut').value = out;
  document.getElementById('trOutputCard').classList.remove('hidden');
  document.getElementById('trLyricsCard').classList.remove('hidden');
  document.getElementById('trLyricsOut').value = '[Mukhda]\nAao milo sang aao\nRang barse phagun mein\n\n[Antara]\nDholak baje taal pe\nNaache mann har pal re';
});

// ── Analyze ──
document.getElementById('btnAnalyze') && document.getElementById('btnAnalyze').addEventListener('click', () => {
  const genre = document.getElementById('anGenre').value || 'Regional Folk';
  const bpm = document.getElementById('anBpm').value || '112';
  const key = document.getElementById('anKey').value || 'E Minor';
  const vocal = document.getElementById('anVocal').value || 'Male Folk';
  const instr = document.getElementById('anInstr').value || 'Dholak, Harmonium, Sarangi';

  document.getElementById('fullOut').value = `[FULL MUSIC PROMPT]
Genre: ${genre} | BPM: ${bpm} | Key: ${key}
Vocal: ${vocal} | Instruments: ${instr}
Style: Authentic, emotionally rich, live performance feel
Production: Natural reverb, warm analog tone, minimal compression`;

  document.getElementById('beatOut').value = `BPM: ${bpm} | Groove: 4/4 Dhamal
Beat Pattern: Kick on 1, 3 | Snare/Clap on 2, 4
Tabla fills every 8 bars | Dholak double stroke on chorus`;

  document.getElementById('instrOut').value = `Lead: ${instr.split(',')[0] || 'Harmonium'}
Rhythm: Dholak + Tabla
Texture: Sarangi drone + Manjira accents
Arrangement: Sparse intro → full ensemble chorus`;

  document.getElementById('vocalOut').value = `Type: ${vocal}
Style: Call-and-response | Alaap intro
Pronunciation: Clear regional dialect
Ornamentation: Gamak, meend, taan`;

  document.getElementById('anOutputCard').classList.remove('hidden');
  document.getElementById('sampleCard').classList.remove('hidden');
  document.getElementById('anLyricsCard').classList.remove('hidden');
  document.getElementById('anLyricsOut').value = `[Mukhda]\nRang barse bheege chunarwali\nRang barse\n\n[Antara]\nBalam pichkari jo tune maari\nToh seeni mein dard hua`;
});

document.getElementById('btnPlaySample') && document.getElementById('btnPlaySample').addEventListener('click', () => {
  document.getElementById('sampleStatus').textContent = '▶️ Sample playing (demo mode)...';
});
document.getElementById('btnStopSample') && document.getElementById('btnStopSample').addEventListener('click', () => {
  document.getElementById('sampleStatus').textContent = '⏹️ Stopped';
});

// ── Lyrics Studio ──
document.getElementById('btnGenNewLyrics') && document.getElementById('btnGenNewLyrics').addEventListener('click', () => {
  const lang = document.getElementById('nlLang').value || 'Hindi';
  const theme = document.getElementById('nlTheme').value || 'Love & Nature';
  const mood = document.getElementById('nlMood').value || 'Romantic';
  const vocal = document.getElementById('nlVocal').value || 'Male Solo';

  const lyrics = `[${lang} Lyrics — ${theme}]
Mood: ${mood} | Vocal: ${vocal}

[Mukhda]
${theme} ki baatein sunao
Dil ki dhun pe gao
Mann mein jo bhi chhupa hai
Aaj use jagao

[Antara 1]
Subah ki roshni jaisi
Teri muskaan pyaari
Zindagi mein rang bhare
Teri yaad hamaari

[Chorus]
Gao, gao, dil se gao
Apni dhun pe chalo
${theme} ka ehsaas lao
Aage badhte chalo`;

  document.getElementById('nlOut').value = lyrics;
  document.getElementById('nlOutputCard').classList.remove('hidden');
});

document.getElementById('btnAnalyzeLyrics') && document.getElementById('btnAnalyzeLyrics').addEventListener('click', () => {
  const text = document.getElementById('olText').value;
  if (!text.trim()) { alert('Pehle lyrics paste karo'); return; }
  const analysis = `[LYRICS ANALYSIS]
Language: ${document.getElementById('olLang').value || 'Auto-detected: Hindi'}
Type: ${document.getElementById('olType').value || 'Song'}
Vocal: ${document.getElementById('olVocal').value || 'Mixed'}

Structure Detected:
- Mukhda/Chorus: Lines 1-4
- Antara: Lines 5-8
- Total Lines: ${text.split('\n').filter(l=>l.trim()).length}

Rhyme Scheme: ABAB / AABB mixed
Syllable Count: ~8-10 per line (good for 100-120 BPM)
Emotion: Romantic, Devotional
Singability Score: 8.5/10
Suggestions: Add more internal rhymes for better flow`;

  document.getElementById('olOut').value = analysis;
  document.getElementById('olOutputCard').classList.remove('hidden');
});

document.getElementById('btnGenRefLyrics') && document.getElementById('btnGenRefLyrics').addEventListener('click', () => {
  const theme = document.getElementById('rlRefTheme').value || 'Bhakti';
  const lang = document.getElementById('rlTargLang').value || 'Hindi';
  const mood = document.getElementById('rlTargMood').value || 'Devotional';

  const lyrics = `[Reference-Style ${lang} Lyrics]
Theme: ${theme} | Mood: ${mood}

[Mukhda]
${theme} ki leher aai
Mann ko bha gayi
Dil ke draar mein
Amrit bhar gayi

[Antara]
Jaise nadiya behti
Parvat se utar ke
Waise tu aaya mere
Jeevan mein nikhaar ke

[Outro]
Tera hi gungaan hai
Tera hi dhyan hai
Tu hi mera ${theme}
Tu hi mera praan hai`;

  document.getElementById('rlOut').value = lyrics;
  document.getElementById('rlOutputCard').classList.remove('hidden');
});

// Copy buttons for all outputs
['nlOut','olOut','rlOut','trOut','anLyricsOut','fullOut','beatOut','instrOut','vocalOut','natureOut'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('dblclick', () => {
    navigator.clipboard.writeText(el.value);
    alert('✅ Copied!');
  });
});

// ── Nature Sounds ──
document.getElementById('btnGenNature') && document.getElementById('btnGenNature').addEventListener('click', () => {
  const genre = document.getElementById('natureGenre').value || 'Ambient';
  const mood = document.getElementById('natureMood').value || 'Peaceful';
  const bpm = document.getElementById('natureBpm').value || '60';
  const layer = document.getElementById('natureLayer').value || 'Forest + Rain';
  const intensity = document.getElementById('natureIntensity').value || 'Soft';
  const special = document.getElementById('natureSpecial').value || '';

  const out = `[NATURE SOUND PROMPT]
Genre: ${genre} | Mood: ${mood}
BPM: ${bpm} | Intensity: ${intensity}
Nature Layer: ${layer}

Prompt:
Create a ${mood.toLowerCase()} ${genre} composition at ${bpm} BPM.
Layer ${layer} sounds as background ambience with ${intensity.toLowerCase()} intensity.
Add subtle ${genre === 'Meditation' ? 'singing bowl, flute' : 'strings, pads'} over the nature soundscape.
${special ? 'Special: ' + special : ''}
Production: Binaural, 432 Hz tuning, no sharp transients, fade in/out 10 seconds.`;

  document.getElementById('natureOut').value = out;
  document.getElementById('natureOutputCard').classList.remove('hidden');
});

document.getElementById('btnClearNature') && document.getElementById('btnClearNature').addEventListener('click', () => {
  document.getElementById('natureOut').value = '';
  document.getElementById('natureOutputCard').classList.add('hidden');
});

// ── Music Player ──
const mainPlayer = document.getElementById('mainPlayer');
const playerFile = document.getElementById('playerFile');
const trackInfo = document.getElementById('trackInfo');
const btnPlay = document.getElementById('btnPlay');

playerFile && playerFile.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  mainPlayer.src = URL.createObjectURL(file);
  trackInfo.textContent = file.name;
  mainPlayer.classList.remove('hidden');
});

btnPlay && btnPlay.addEventListener('click', () => {
  if (mainPlayer.paused) {
    mainPlayer.play();
    btnPlay.textContent = '⏸️';
  } else {
    mainPlayer.pause();
    btnPlay.textContent = '▶️';
  }
});

document.getElementById('btnPrev') && document.getElementById('btnPrev').addEventListener('click', () => {
  mainPlayer.currentTime = Math.max(0, mainPlayer.currentTime - 10);
});
document.getElementById('btnNext') && document.getElementById('btnNext').addEventListener('click', () => {
  mainPlayer.currentTime = Math.min(mainPlayer.duration || 0, mainPlayer.currentTime + 10);
});

// File info handlers
['trFile','anFile'].forEach(id => {
  const el = document.getElementById(id);
  const infoId = id.replace('File','FileInfo');
  el && el.addEventListener('change', e => {
    const f = e.target.files[0];
    const info = document.getElementById(infoId);
    if (f && info) info.textContent = `📁 ${f.name} (${(f.size/1024).toFixed(1)} KB)`;
  });
});

// Show home on load
showView('home');
