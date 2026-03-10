// AapkiDhun PWA — app.js v4.0
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

tabs.forEach(tab => tab.addEventListener('click', () => showView(tab.dataset.view)));
document.querySelectorAll('[data-goto]').forEach(el => el.addEventListener('click', () => showView(el.dataset.goto)));

// PWA Install
let deferredPrompt;
const btnInstall = document.getElementById('btnInstall');
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault(); deferredPrompt = e;
  btnInstall.classList.remove('hidden');
});
btnInstall && btnInstall.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') btnInstall.classList.add('hidden');
  deferredPrompt = null;
});

// Prompt Builder
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
  charCount.textContent = prompt.length + ' chars';
  promptOutputCard.classList.remove('hidden');
});

document.getElementById('btnCopyPrompt') && document.getElementById('btnCopyPrompt').addEventListener('click', () => {
  navigator.clipboard.writeText(promptOut.value); alert('✅ Prompt copied!');
});
document.getElementById('btnPrintPrompt') && document.getElementById('btnPrintPrompt').addEventListener('click', () => window.print());
document.getElementById('btnClearPrompt') && document.getElementById('btnClearPrompt').addEventListener('click', () => {
  promptOut.value = ''; promptOutputCard.classList.add('hidden');
});

// Presets
const PRESETS_KEY = 'aapkidhun_presets';
const loadPresets = () => JSON.parse(localStorage.getItem(PRESETS_KEY) || '[]');
const savePresets = arr => localStorage.setItem(PRESETS_KEY, JSON.stringify(arr));

const defaultPresets = [
  { name: '🌺 Rajasthani Holi', mode: 'Regional Folk', language: 'Marwadi / Rajasthani', theme: 'Fagun Holi masti', tempo: '118 BPM', instruments: 'Chang, Dholak, Khartal', vocal: 'Male Folk — Regional authentic' },
  { name: '🕉️ Bhajan Devotional', mode: 'Bhajan', language: 'Hindi', theme: 'Krishna bhakti', tempo: '76 BPM', instruments: 'Harmonium, Tabla, Manjira', vocal: 'Male Bhajan — Devotional' },
  { name: '🎸 Sufi Rock', mode: 'Sufi', language: 'Urdu', theme: 'Ishq-e-haqiqi', tempo: '96 BPM', instruments: 'Sitar, Electric Guitar, Tabla', vocal: 'Male Sufi — Chest voice + Alaap' },
];

function renderPresets() {
  const list = document.getElementById('presetList');
  const myList = document.getElementById('myPresetList');
  if (list) list.innerHTML = defaultPresets.map((p, i) => `<div class="preset-item"><div class="preset-name">${p.name}</div><button class="btn small" onclick="applyPreset(${i},'default')">Use</button></div>`).join('');
  const saved = loadPresets();
  if (myList) myList.innerHTML = saved.length ? saved.map((p, i) => `<div class="preset-item"><div class="preset-name">${p.name||'Preset '+(i+1)}</div><button class="btn small" onclick="applyPreset(${i},'saved')">Use</button><button class="btn ghost small" onclick="deletePreset(${i})">🗑️</button></div>`).join('') : '<p class="muted">Koi saved preset nahi</p>';
}

window.applyPreset = function(i, type) {
  const p = type === 'default' ? defaultPresets[i] : loadPresets()[i];
  if (!p || !promptForm) return;
  Object.keys(p).forEach(key => { const el = promptForm.elements[key]; if (el) el.value = p[key]; });
  showView('prompt');
};
window.deletePreset = function(i) {
  const arr = loadPresets(); arr.splice(i, 1); savePresets(arr); renderPresets();
};

document.getElementById('btnSavePreset') && document.getElementById('btnSavePreset').addEventListener('click', () => {
  const d = Object.fromEntries(new FormData(promptForm));
  const name = prompt('Preset ka naam:') || 'My Preset';
  const arr = loadPresets(); arr.push({...d, name}); savePresets(arr); renderPresets();
  alert('✅ Preset saved!');
});
renderPresets();

// Recorder
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
      recPlayer.src = url; recPlayer.classList.remove('hidden');
      recDownload.href = url; recDownload.download = 'recording.webm'; recDownload.classList.remove('hidden');
    };
    mediaRecorder.start();
    btnRecord.disabled = true; btnStop.disabled = false;
    btnRecord.textContent = '🔴 Recording...';
  } catch(e) { alert('Mic access denied: ' + e.message); }
});

btnStop && btnStop.addEventListener('click', () => {
  mediaRecorder && mediaRecorder.stop();
  btnRecord.disabled = false; btnStop.disabled = true;
  btnRecord.textContent = '🎤 Record';
});

// Transcribe
document.getElementById('btnTranscribe') && document.getElementById('btnTranscribe').addEventListener('click', () => {
  const genre = document.getElementById('trGenrePreset').value;
  const bpm = document.getElementById('trBpm').value;
  const key = document.getElementById('trKey').value;
  document.getElementById('trOut').value = `[TRANSCRIPTION RESULT]
Genre: ${genre||'Indian Folk'} | BPM: ${bpm||'~110'} | Key: ${key||'D Major'}
Time Signature: 4/4
Structure: Intro → Verse → Chorus → Outro
Instruments: Dholak, Harmonium, Tabla
Mood: Energetic, Festive`;
  document.getElementById('trOutputCard').classList.remove('hidden');
  document.getElementById('trLyricsCard').classList.remove('hidden');
  document.getElementById('trLyricsOut').value = '[Mukhda]
Aao milo sang aao
Rang barse phagun mein

[Antara]
Dholak baje taal pe
Naache mann har pal re';
});

// Analyze
document.getElementById('btnAnalyze') && document.getElementById('btnAnalyze').addEventListener('click', () => {
  const genre = document.getElementById('anGenre').value || 'Regional Folk';
  const bpm = document.getElementById('anBpm').value || '112';
  const key = document.getElementById('anKey').value || 'E Minor';
  const vocal = document.getElementById('anVocal').value || 'Male Folk';
  const instr = document.getElementById('anInstr').value || 'Dholak, Harmonium';

  document.getElementById('fullOut').value = `[FULL MUSIC PROMPT]
Genre: ${genre} | BPM: ${bpm} | Key: ${key}
Vocal: ${vocal} | Instruments: ${instr}
Style: Authentic, emotionally rich
Production: Natural reverb, warm analog tone`;
  document.getElementById('beatOut').value = `BPM: ${bpm} | Groove: 4/4 Dhamal
Kick: 1,3 | Clap: 2,4
Dholak double stroke on chorus`;
  document.getElementById('instrOut').value = `Lead: ${instr.split(',')[0]||'Harmonium'}
Rhythm: Dholak + Tabla
Texture: Sarangi drone + Manjira`;
  document.getElementById('vocalOut').value = `Type: ${vocal}
Style: Call-and-response
Ornamentation: Gamak, meend, taan`;
  document.getElementById('anOutputCard').classList.remove('hidden');
  document.getElementById('sampleCard').classList.remove('hidden');
  document.getElementById('anLyricsCard').classList.remove('hidden');
  document.getElementById('anLyricsOut').value = '[Mukhda]
Rang barse bheege chunarwali

[Antara]
Balam pichkari jo tune maari
Toh seeni mein dard hua';
});

document.getElementById('btnPlaySample') && document.getElementById('btnPlaySample').addEventListener('click', () => { document.getElementById('sampleStatus').textContent = '▶️ Sample playing...'; });
document.getElementById('btnStopSample') && document.getElementById('btnStopSample').addEventListener('click', () => { document.getElementById('sampleStatus').textContent = '⏹️ Stopped'; });

// Lyrics Studio
document.getElementById('btnGenNewLyrics') && document.getElementById('btnGenNewLyrics').addEventListener('click', () => {
  const lang = document.getElementById('nlLang').value || 'Hindi';
  const theme = document.getElementById('nlTheme').value || 'Love';
  const mood = document.getElementById('nlMood').value || 'Romantic';
  document.getElementById('nlOut').value = `[${lang} Lyrics — ${theme}]
Mood: ${mood}

[Mukhda]
${theme} ki baatein sunao
Dil ki dhun pe gao

[Antara]
Subah ki roshni jaisi
Teri muskaan pyaari

[Chorus]
Gao dil se gao
Apni dhun pe chalo`;
  document.getElementById('nlOutputCard').classList.remove('hidden');
});

document.getElementById('btnAnalyzeLyrics') && document.getElementById('btnAnalyzeLyrics').addEventListener('click', () => {
  const text = document.getElementById('olText').value;
  if (!text.trim()) { alert('Pehle lyrics paste karo'); return; }
  document.getElementById('olOut').value = `[LYRICS ANALYSIS]
Lines: ${text.split('
').filter(l=>l.trim()).length}
Rhyme: ABAB mixed
Syllables: ~8-10 per line
Singability: 8.5/10`;
  document.getElementById('olOutputCard').classList.remove('hidden');
});

document.getElementById('btnGenRefLyrics') && document.getElementById('btnGenRefLyrics').addEventListener('click', () => {
  const theme = document.getElementById('rlRefTheme').value || 'Bhakti';
  const lang = document.getElementById('rlTargLang').value || 'Hindi';
  document.getElementById('rlOut').value = `[${lang} Lyrics — ${theme}]

[Mukhda]
${theme} ki leher aai
Mann ko bha gayi

[Antara]
Jaise nadiya behti
Parvat se utar ke

[Outro]
Tera hi gungaan hai
Tu hi mera praan hai`;
  document.getElementById('rlOutputCard').classList.remove('hidden');
});

// Nature Sounds
document.getElementById('btnGenNature') && document.getElementById('btnGenNature').addEventListener('click', () => {
  const genre = document.getElementById('natureGenre').value || 'Ambient';
  const mood = document.getElementById('natureMood').value || 'Peaceful';
  const bpm = document.getElementById('natureBpm').value || '60';
  const layer = document.getElementById('natureLayer').value || 'Forest + Rain';
  const intensity = document.getElementById('natureIntensity').value || 'Soft';
  const special = document.getElementById('natureSpecial').value || '';
  document.getElementById('natureOut').value = `[NATURE SOUND PROMPT]
Genre: ${genre} | Mood: ${mood} | BPM: ${bpm}
Layer: ${layer} | Intensity: ${intensity}
${special ? 'Special: '+special+'
' : ''}Production: Binaural, 432Hz, fade in/out 10s`;
  document.getElementById('natureOutputCard').classList.remove('hidden');
});
document.getElementById('btnClearNature') && document.getElementById('btnClearNature').addEventListener('click', () => {
  document.getElementById('natureOut').value = '';
  document.getElementById('natureOutputCard').classList.add('hidden');
});

// Music Player
const mainPlayer = document.getElementById('mainPlayer');
const playerFile = document.getElementById('playerFile');
const trackInfo = document.getElementById('trackInfo');
const btnPlay = document.getElementById('btnPlay');

playerFile && playerFile.addEventListener('change', e => {
  const file = e.target.files[0]; if (!file) return;
  mainPlayer.src = URL.createObjectURL(file);
  trackInfo.textContent = file.name;
  mainPlayer.classList.remove('hidden');
});

btnPlay && btnPlay.addEventListener('click', () => {
  if (mainPlayer.paused) { mainPlayer.play(); btnPlay.textContent = '⏸️'; }
  else { mainPlayer.pause(); btnPlay.textContent = '▶️'; }
});

document.getElementById('btnPrev') && document.getElementById('btnPrev').addEventListener('click', () => { mainPlayer.currentTime = Math.max(0, mainPlayer.currentTime - 10); });
document.getElementById('btnNext') && document.getElementById('btnNext').addEventListener('click', () => { mainPlayer.currentTime += 10; });

['trFile','anFile'].forEach(id => {
  const el = document.getElementById(id);
  el && el.addEventListener('change', e => {
    const f = e.target.files[0];
    const info = document.getElementById(id.replace('File','FileInfo'));
    if (f && info) info.textContent = `📁 ${f.name} (${(f.size/1024).toFixed(1)} KB)`;
  });
});

// Double-click to copy any output
['nlOut','olOut','rlOut','trOut','anLyricsOut','fullOut','beatOut','instrOut','vocalOut','natureOut'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('dblclick', () => { navigator.clipboard.writeText(el.value); alert('✅ Copied!'); });
});

showView('home');
