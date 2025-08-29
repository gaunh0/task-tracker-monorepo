const json = (method, body) => ({ method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });


export async function getProjects() {
const r = await fetch('/api/projects');
return r.json();
}
export async function getTasks(params = {}) {
const q = new URLSearchParams(params).toString();
const r = await fetch('/api/tasks' + (q ? `?${q}` : ''));
return r.json();
}
export async function createTask(payload) {
const r = await fetch('/api/tasks', json('POST', payload));
return r.json();
}
export async function updateTask(id, payload) {
const r = await fetch(`/api/tasks/${id}`, json('PUT', payload));
return r.json();
}
export async function deleteTask(id) {
await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
}