const STORAGE_KEY = 'daylist.tasks.v1';

const form = document.querySelector('#todo-form');
const input = document.querySelector('#todo-input');
const list = document.querySelector('#task-list');
const emptyState = document.querySelector('#empty-state');
const count = document.querySelector('#task-count');
const clearCompletedButton = document.querySelector('#clear-completed');
const filterButtons = [...document.querySelectorAll('.filter-button')];
const todayLabel = document.querySelector('#today-label');

let tasks = loadTasks();
let currentFilter = 'all';

todayLabel.textContent = new Intl.DateTimeFormat(undefined, {
  weekday: 'long', month: 'long', day: 'numeric'
}).format(new Date()).toUpperCase();

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(saved)) return [];
    return saved.filter((task) => task && typeof task.id === 'string' &&
      typeof task.text === 'string' && typeof task.completed === 'boolean');
  } catch (error) {
    console.warn('Could not read saved tasks:', error);
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.warn('Could not save tasks:', error);
    count.textContent = 'Could not save changes';
  }
}

function visibleTasks() {
  if (currentFilter === 'active') return tasks.filter((task) => !task.completed);
  if (currentFilter === 'completed') return tasks.filter((task) => task.completed);
  return tasks;
}

function render() {
  const shown = visibleTasks();
  const remaining = tasks.filter((task) => !task.completed).length;
  list.replaceChildren();

  shown.forEach((task) => {
    const item = document.createElement('li');
    item.className = `task-item${task.completed ? ' is-completed' : ''}`;
    item.dataset.id = task.id;

    const checkbox = document.createElement('button');
    checkbox.className = 'task-check';
    checkbox.type = 'button';
    checkbox.setAttribute('role', 'checkbox');
    checkbox.setAttribute('aria-checked', String(task.completed));
    checkbox.setAttribute('aria-label', `${task.completed ? 'Mark as not done' : 'Mark as done'}: ${task.text}`);
    checkbox.innerHTML = '<span aria-hidden="true">✓</span>';
    checkbox.addEventListener('click', () => toggleTask(task.id));

    const text = document.createElement('span');
    text.className = 'task-text';
    text.textContent = task.text;

    const remove = document.createElement('button');
    remove.className = 'delete-button';
    remove.type = 'button';
    remove.setAttribute('aria-label', `Delete task: ${task.text}`);
    remove.title = 'Delete task';
    remove.innerHTML = '<span aria-hidden="true">×</span>';
    remove.addEventListener('click', () => deleteTask(task.id));

    item.append(checkbox, text, remove);
    list.append(item);
  });

  emptyState.hidden = shown.length > 0;
  if (tasks.length === 0) {
    emptyState.querySelector('.empty-title').textContent = 'Nothing on the list yet';
    emptyState.querySelector('.empty-copy').textContent = 'Add a task above and take it one step at a time.';
  } else if (shown.length === 0) {
    emptyState.querySelector('.empty-title').textContent = 'No tasks in this view';
    emptyState.querySelector('.empty-copy').textContent = 'Try another filter to see your tasks.';
  }

  count.textContent = `${remaining} ${remaining === 1 ? 'task' : 'tasks'} left`;
  clearCompletedButton.hidden = !tasks.some((task) => task.completed);
}

function addTask(text) {
  const cleanText = text.trim();
  if (!cleanText) return;
  tasks.unshift({
    id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    text: cleanText,
    completed: false,
    createdAt: new Date().toISOString()
  });
  currentFilter = 'all';
  updateFilterButtons();
  saveTasks();
  render();
}

function toggleTask(id) {
  tasks = tasks.map((task) => task.id === id ? { ...task, completed: !task.completed } : task);
  saveTasks();
  render();
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  saveTasks();
  render();
}

function updateFilterButtons() {
  filterButtons.forEach((button) => {
    const active = button.dataset.filter === currentFilter;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  addTask(input.value);
  input.value = '';
  input.focus();
});

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    currentFilter = button.dataset.filter;
    updateFilterButtons();
    render();
  });
});

clearCompletedButton.addEventListener('click', () => {
  tasks = tasks.filter((task) => !task.completed);
  saveTasks();
  render();
});

render();
