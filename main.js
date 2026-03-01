const STORAGE_KEY = "rotina_premium_tasks_v1";
const DAY_KEY = () => `rotina_premium_done_${new Date().toISOString().slice(0,10)}`;

const $ = (id) => document.getElementById(id);

const listEl = $("list");
const progressText = $("progressText");
const barFill = $("barFill");
const doneText = $("doneText");
const totalText = $("totalText");
const todayLabel = $("todayLabel");

const modal = $("modal");
const backdrop = $("modalBackdrop");
const closeModalBtn = $("closeModal");
const addBtn = $("addBtn");
const resetDayBtn = $("resetDayBtn");

const taskForm = $("taskForm");
const modalTitle = $("modalTitle");
const titleInput = $("titleInput");
const timeInput = $("timeInput");
const emojiInput = $("emojiInput");
const catInput = $("catInput");
const noteInput = $("noteInput");
const deleteBtn = $("deleteBtn");

let tasks = loadTasks();
let editingId = null;

function formatDateBR(date){
  return date.toLocaleDateString("pt-BR", { weekday:"long", day:"2-digit", month:"2-digit" });
}

function loadTasks(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw){
      // Base inicial (você pode apagar depois)
      return [
        makeTask("Devocional", "05:00", "🙏", "Fé", ""),
        makeTask("Treino", "07:30", "💪", "Saúde", ""),
        makeTask("Trabalho", "08:30", "💼", "Trabalho", "Até 18:00"),
        makeTask("Limpar coco", "19:45", "🐶", "Cachorro", ""),
        makeTask("Projetos", "21:00", "📱", "Projetos", "")
      ];
    }
    return JSON.parse(raw);
  }catch{
    return [];
  }
}

function saveTasks(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadDoneMap(){
  try{
    const raw = localStorage.getItem(DAY_KEY());
    return raw ? JSON.parse(raw) : {};
  }catch{
    return {};
  }
}

function saveDoneMap(doneMap){
  localStorage.setItem(DAY_KEY(), JSON.stringify(doneMap));
}

function makeTask(title, time, emoji, category, note){
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
    title,
    time,
    emoji: (emoji || "").trim(),
    category,
    note: (note || "").trim()
  };
}

function sortByTime(a,b){
  return (a.time || "").localeCompare(b.time || "");
}

function render(){
  todayLabel.textContent = formatDateBR(new Date());
  tasks.sort(sortByTime);

  const doneMap = loadDoneMap();
  listEl.innerHTML = "";

  for(const t of tasks){
    const done = !!doneMap[t.id];

    const item = document.createElement("div");
    item.className = "item";

    const left = document.createElement("div");
    left.className = "item-left";

    const titleRow = document.createElement("div");
    titleRow.className = "titleRow";

    const title = document.createElement("div");
    title.className = "title";
    title.textContent = `${t.emoji ? t.emoji + " " : ""}${t.title}`;

    titleRow.appendChild(title);

    const meta = document.createElement("div");
    meta.className = "meta";

    const p1 = document.createElement("span");
    p1.className = "pill";
    p1.textContent = `⏰ ${t.time}`;

    const p2 = document.createElement("span");
    p2.className = "pill";
    p2.textContent = `🏷️ ${t.category || "Outros"}`;

    meta.appendChild(p1);
    meta.appendChild(p2);

    if(t.note){
      const p3 = document.createElement("span");
      p3.className = "pill";
      p3.textContent = `📝 ${t.note}`;
      meta.appendChild(p3);
    }

    left.appendChild(titleRow);
    left.appendChild(meta);

    const right = document.createElement("div");
    right.className = "item-right";

    const edit = document.createElement("button");
    edit.className = "edit";
    edit.type = "button";
    edit.textContent = "✎";
    edit.title = "Editar";
    edit.addEventListener("click", () => openEdit(t.id));

    const check = document.createElement("button");
    check.className = "check" + (done ? " done" : "");
    check.type = "button";
    check.textContent = done ? "✓" : "✓";
    check.title = done ? "Desmarcar" : "Concluir";
    check.addEventListener("click", () => toggleDone(t.id));

    right.appendChild(edit);
    right.appendChild(check);

    item.appendChild(left);
    item.appendChild(right);

    listEl.appendChild(item);
  }

  updateProgress();
}

function updateProgress(){
  const doneMap = loadDoneMap();
  const total = tasks.length;
  const done = tasks.filter(t => doneMap[t.id]).length;

  const pct = total === 0 ? 0 : Math.round((done/total) * 100);
  progressText.textContent = `${pct}%`;
  barFill.style.width = `${pct}%`;

  doneText.textContent = `${done} concluídas`;
  totalText.textContent = `${total} tarefas`;
}

function toggleDone(id){
  const doneMap = loadDoneMap();
  doneMap[id] = !doneMap[id];
  if(!doneMap[id]) delete doneMap[id];
  saveDoneMap(doneMap);
  render();
}

function openModal(){
  modal.classList.remove("hidden");
  backdrop.classList.remove("hidden");
}
function closeModal(){
  modal.classList.add("hidden");
  backdrop.classList.add("hidden");
  editingId = null;
  taskForm.reset();
  deleteBtn.classList.add("hidden");
}
backdrop.addEventListener("click", closeModal);
closeModalBtn.addEventListener("click", closeModal);

addBtn.addEventListener("click", () => {
  editingId = null;
  modalTitle.textContent = "Nova tarefa";
  taskForm.reset();
  // horário padrão: agora arredondado
  const now = new Date();
  const hh = String(now.getHours()).padStart(2,"0");
  const mm = String(Math.round(now.getMinutes()/5)*5).padStart(2,"0");
  timeInput.value = `${hh}:${mm}`;
  catInput.value = "Outros";
  deleteBtn.classList.add("hidden");
  openModal();
});

function openEdit(id){
  const t = tasks.find(x => x.id === id);
  if(!t) return;
  editingId = id;
  modalTitle.textContent = "Editar tarefa";

  titleInput.value = t.title || "";
  timeInput.value = t.time || "08:00";
  emojiInput.value = t.emoji || "";
  catInput.value = t.category || "Outros";
  noteInput.value = t.note || "";

  deleteBtn.classList.remove("hidden");
  openModal();
}

deleteBtn.addEventListener("click", () => {
  if(!editingId) return;
  tasks = tasks.filter(t => t.id !== editingId);
  saveTasks();
  closeModal();
  render();
});

taskForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const title = titleInput.value.trim();
  const time = timeInput.value;
  const emoji = emojiInput.value.trim();
  const cat = catInput.value;
  const note = noteInput.value.trim();

  if(!title || !time) return;

  if(editingId){
    const t = tasks.find(x => x.id === editingId);
    if(t){
      t.title = title;
      t.time = time;
      t.emoji = emoji;
      t.category = cat;
      t.note = note;
    }
  }else{
    tasks.push(makeTask(title, time, emoji, cat, note));
  }

  saveTasks();
  closeModal();
  render();
});

resetDayBtn.addEventListener("click", () => {
  localStorage.removeItem(DAY_KEY());
  render();
});

// Primeira renderização
render();