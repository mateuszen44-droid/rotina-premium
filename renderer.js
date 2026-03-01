const DEFAULT_TASKS = [
  { id: 'devocional', time: '05:00', title: 'Devocional', tag: '🙏 Fé', done: false, type: 'devocional' },
  { id: 'cachorro', time: '05:25', title: 'Passear com o cachorro', tag: '🐶 Casa', done: false, type: 'casa' },
  { id: 'treino', time: '07:30', title: 'Treino (casa da mãe)', tag: '💪 Shape', done: false, type: 'treino' },
  { id: 'trabalho', time: '08:30', title: 'Trabalho', tag: '💼 Rotina', done: false, type: 'trabalho' },
  { id: 'coco', time: '19:45', title: 'Limpar coco do cachorro', tag: '🐶 Casa', done: false, type: 'casa' },
  { id: 'projetos', time: '21:00', title: 'Projetos (Apps/Artes)', tag: '📱 Foco', done: false, type: 'projetos' },
  { id: 'dormir', time: '22:00', title: 'Dormir', tag: '😴 Sono', done: false, type: 'sono' }
];

function pct(n, d){ return d === 0 ? 0 : Math.round((n/d)*100); }

function ringSVG(value, max, label){
  const r = 46;
  const c = 2 * Math.PI * r;
  const p = Math.min(1, max === 0 ? 0 : value / max);
  const dash = c * p;
  return `
  <svg width="120" height="120" viewBox="0 0 120 120" aria-label="${label}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="rgba(255,45,45,.55)"/>
        <stop offset="1" stop-color="rgba(255,45,45,1)"/>
      </linearGradient>
    </defs>
    <circle cx="60" cy="60" r="${r}" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="10"/>
    <circle cx="60" cy="60" r="${r}" fill="none" stroke="url(#g)" stroke-width="10"
      stroke-linecap="round"
      stroke-dasharray="${dash} ${c}"
      transform="rotate(-90 60 60)"/>
    <text x="60" y="56" text-anchor="middle" fill="white" font-size="18" font-weight="800">${value}/${max}</text>
    <text x="60" y="78" text-anchor="middle" fill="#b8b8c5" font-size="11" font-weight="700">${label}</text>
  </svg>`;
}

async function loadState(){
  const saved = await window.api.get('state');
  if(saved && saved.tasks){
    return saved;
  }
  // estado inicial
  const init = {
    tasks: DEFAULT_TASKS,
    streakDays: 0,
    weekBars: [2,3,4,3,5,2,1],
    stats: { treinos: 0, devocionais: 0, projetosMin: 0 },
    weight: { now: '', goal: '' }
  };
  await window.api.set('state', init);
  return init;
}

async function saveState(state){
  await window.api.set('state', state);
}

function renderTasks(state){
  const dash = document.getElementById('dashTasks');
  dash.innerHTML = '';
  state.tasks.slice(0,5).forEach(t => {
    const el = document.createElement('div');
    el.className = 'task' + (t.done ? ' done' : '');
    el.innerHTML = `
      <div class="left">
        <div class="time">${t.time}</div>
        <div class="name">${t.title}</div>
        <div class="tag">${t.tag}</div>
      </div>
      <div>${t.done ? '✅' : '⭕'}</div>
    `;
    el.addEventListener('click', async () => {
      t.done = !t.done;
      await onToggle(state, t);
    });
    dash.appendChild(el);
  });

  const timeline = document.getElementById('timeline');
  timeline.innerHTML = '';
  state.tasks.forEach(t => {
    const row = document.createElement('div');
    row.className = 'row' + (t.done ? ' done' : '');
    row.innerHTML = `
      <div class="time">${t.time}</div>
      <div class="title">${t.title}</div>
      <div class="chev">${t.done ? '✔' : '›'}</div>
    `;
    row.addEventListener('click', async () => {
      t.done = !t.done;
      await onToggle(state, t);
    });
    timeline.appendChild(row);
  });

  const doneCount = state.tasks.filter(t => t.done).length;
  const progress = pct(doneCount, state.tasks.length);
  document.getElementById('progressPct').innerText = progress + '%';
  document.getElementById('progressFill').style.width = progress + '%';
  document.getElementById('streakDays').innerText = state.streakDays;

  // Rings (sem bibliotecas)
  document.getElementById('ringTreinos').innerHTML = ringSVG(state.stats.treinos, 5, 'Treinos');
  document.getElementById('ringDevocionais').innerHTML = ringSVG(state.stats.devocionais, 5, 'Devocionais');
  const projHours = Math.floor(state.stats.projetosMin / 60);
  const projMin = state.stats.projetosMin % 60;
  document.getElementById('ringProjetos').innerHTML = ringSVG(projHours, 5, 'Projetos (h)');

  // mini bars
  const bars = document.getElementById('miniBars');
  bars.innerHTML = '';
  const max = Math.max(...state.weekBars, 1);
  state.weekBars.forEach(v => {
    const b = document.createElement('div');
    b.className = 'b';
    b.style.height = (v / max) * 100 + '%';
    bars.appendChild(b);
  });

  // peso
  document.getElementById('weightNow').value = state.weight.now;
  document.getElementById('weightGoal').value = state.weight.goal;
  document.getElementById('weightNote').innerText =
    state.weight.now && state.weight.goal
      ? `Falta ${Math.max(0, (Number(state.weight.now) - Number(state.weight.goal))).toFixed(1)} kg para a meta.`
      : 'Preencha seu peso atual e meta para acompanhar.';
}

async function onToggle(state, task){
  // stats simples
  if(task.type === 'treino'){
    state.stats.treinos += task.done ? 1 : -1;
    state.stats.treinos = Math.max(0, state.stats.treinos);
  }
  if(task.type === 'devocional'){
    state.stats.devocionais += task.done ? 1 : -1;
    state.stats.devocionais = Math.max(0, state.stats.devocionais);
  }
  if(task.type === 'projetos'){
    state.stats.projetosMin += task.done ? 45 : -45; // bloco padrão
    state.stats.projetosMin = Math.max(0, state.stats.projetosMin);
  }

  // quando completa 100% -> soma sequência
  const doneCount = state.tasks.filter(t => t.done).length;
  if(doneCount === state.tasks.length){
    state.streakDays = (state.streakDays || 0) + 1;
  }

  await saveState(state);
  renderTasks(state);
}

async function init(){
  const state = await loadState();

  document.getElementById('addTaskBtn').addEventListener('click', async () => {
    const time = document.getElementById('newTime').value.trim();
    const title = document.getElementById('newTitle').value.trim();
    if(!time || !title) return;
    state.tasks.push({
      id: String(Date.now()),
      time,
      title,
      tag: '🧩 Extra',
      done: false,
      type: 'extra'
    });
    document.getElementById('newTime').value = '';
    document.getElementById('newTitle').value = '';
    await saveState(state);
    renderTasks(state);
  });

  document.getElementById('resetDayBtn').addEventListener('click', async () => {
    state.tasks.forEach(t => t.done = false);
    await saveState(state);
    renderTasks(state);
  });

  document.getElementById('clearAllBtn').addEventListener('click', async () => {
    await window.api.clear();
    location.reload();
  });

  document.getElementById('saveWeightBtn').addEventListener('click', async () => {
    state.weight.now = document.getElementById('weightNow').value;
    state.weight.goal = document.getElementById('weightGoal').value;
    await saveState(state);
    renderTasks(state);
  });

  // tabs (visual apenas)
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  renderTasks(state);
}

init();
