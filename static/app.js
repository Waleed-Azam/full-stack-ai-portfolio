'use strict';
const $ = (selector) => document.querySelector(selector);
let state = {messages: [], tickets: [], knowledge: []};
let busy = false;
let ready = false;
const welcome = $('#welcome').cloneNode(true);
function error(message = '') { $('#error').textContent = message; $('#error').hidden = !message; }
async function api(path, method = 'GET', body) {
  const response = await fetch(path, {method, headers: {'Content-Type': 'application/json', 'X-CSRF-Token': state.csrf || ''}, ...(body ? {body: JSON.stringify(body)} : {})});
  let result;
  try { result = await response.json(); } catch { throw new Error('The server is not responding. Please refresh and try again.'); }
  if (!response.ok) throw new Error(result.error || 'Something went wrong. Please try again.');
  return result;
}
function el(tag, className, text) { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; }
function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(button => { const active = button.dataset.tab === tab; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
  ['chat', 'tickets', 'knowledge'].forEach(name => $(`#${name}-panel`).hidden = name !== tab);
  const titles = {chat: ['AI assistant', 'Helpful answers, grounded in your knowledge base.'], tickets: ['Support tickets', 'From a question to a clear next step.'], knowledge: ['Knowledge base', 'The sample policies behind every answer.']};
  $('#panel-title').textContent = titles[tab][0]; $('#panel-subtitle').textContent = titles[tab][1];
}
function showSource(id) { switchTab('knowledge'); document.getElementById(id)?.scrollIntoView({block: 'nearest', behavior: 'smooth'}); }
function renderMessages() {
  const box = $('#messages'); box.replaceChildren();
  if (!state.messages.length) { box.append(welcome.cloneNode(true)); bindSuggestions(); }
  state.messages.forEach(message => {
    const row = el('div', `message ${message.role}`);
    if (message.role === 'assistant') row.append(el('span', 'message-avatar', '✳'));
    const body = el('div', 'message-body'); body.append(el('div', 'message-text', message.content));
    if (message.sources?.length) { const sources = el('div', 'source-list'); message.sources.forEach(source => { const button = el('button', '', `↗ ${source.id} · ${source.title}`); button.addEventListener('click', () => showSource(source.id)); sources.append(button); }); body.append(sources); }
    row.append(body); box.append(row);
  });
  if (busy) { const typing = el('div', 'message assistant'); typing.append(el('span', 'message-avatar', '✳'), el('span', '', state.mode === 'live' ? 'Looking through the policies…' : 'Finding the relevant policy…')); box.append(typing); }
  box.scrollTop = box.scrollHeight;
}
function bindSuggestions() { document.querySelectorAll('[data-question]').forEach(button => button.addEventListener('click', () => { $('#message').value = button.dataset.question; send(); })); }
async function send() {
  const text = $('#message').value.trim(); if (!text || busy) return;
  if (!ready) { error('Still connecting to the backend. Please refresh if this continues.'); return; }
  busy = true; error(); $('#send-btn').disabled = true; $('#clear-btn').disabled = true;
  state.messages.push({role: 'user', content: text, sources: []}); renderMessages(); $('#message').value = '';
  try { const result = await api('/api/chat', 'POST', {message: text}); state.messages.push(result); }
  catch (err) { state.messages.pop(); $('#message').value = text; error(err.message); }
  finally { busy = false; $('#send-btn').disabled = false; $('#clear-btn').disabled = false; renderMessages(); $('#message').focus(); }
}
function renderTickets() {
  $('#ticket-count').textContent = state.tickets.length;
  const list = $('#ticket-list'); list.replaceChildren();
  if (!state.tickets.length) { list.append(el('div', 'empty-state', 'Your workspace is clear. Create your first demo ticket above.')); return; }
  state.tickets.forEach(ticket => {
    const row = el('div', 'ticket-row'); const info = el('div'); info.append(el('strong', '', ticket.subject), el('small', '', `TICKET ${String(ticket.id).padStart(4, '0')} · ${ticket.status.toUpperCase()} · ${ticket.created_at.slice(0, 10)}`));
    const button = el('button', '', ticket.status === 'open' ? 'Mark resolved ✓' : 'Reopen ↻');
    button.addEventListener('click', async () => { button.disabled = true; error(); try { const status = ticket.status === 'open' ? 'resolved' : 'open'; await api(`/api/tickets/${ticket.id}`, 'PATCH', {status}); ticket.status = status; renderTickets(); } catch (err) {error(err.message); button.disabled = false;} });
    row.append(info, button); list.append(row);
  });
}
function renderKnowledge() {
  const list = $('#knowledge-list'); list.replaceChildren();
  state.knowledge.forEach(source => { const card = el('article', 'knowledge-card'); card.id = source.id; const title = el('h4'); title.append(el('span', '', source.id), document.createTextNode(source.title)); card.append(title, el('p', '', source.text)); list.append(card); });
}
document.querySelectorAll('.tab').forEach(button => button.addEventListener('click', () => switchTab(button.dataset.tab)));
$('#chat-form').addEventListener('submit', event => {event.preventDefault(); send();});
$('#message').addEventListener('keydown', event => {if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {event.preventDefault(); send();}});
$('#clear-btn').addEventListener('click', async () => {
  if (busy || !state.messages.length) return;
  if (!confirm('Delete the saved conversation for this browser? Support tickets will remain.')) return;
  error(); $('#clear-btn').disabled = true;
  try {await api('/api/chat', 'DELETE'); state.messages = []; renderMessages();} catch (err) {error(err.message);} finally {$('#clear-btn').disabled = false;}
});
$('#ticket-form').addEventListener('submit', async event => {
  event.preventDefault(); const button = event.target.querySelector('button'); button.disabled = true; error();
  try {const ticket = await api('/api/tickets', 'POST', {subject: $('#ticket-subject').value}); state.tickets.unshift(ticket); $('#ticket-subject').value = ''; renderTickets();} catch (err) {error(err.message);} finally {button.disabled = false;}
});
$('#export-btn').addEventListener('click', () => {
  if (!state.messages.length) { switchTab('chat'); error('Start a conversation before exporting it.'); return; }
  const lines = ['Deskwise — sample store conversation', `Exported: ${new Date().toISOString()}`, '', ...state.messages.map(message => `${message.role.toUpperCase()}\n${message.content}${message.sources?.length ? '\nReferences: ' + message.sources.map(source => source.id + ' ' + source.title).join(', ') : ''}\n`)];
  const url = URL.createObjectURL(new Blob([lines.join('\n')], {type: 'text/plain'})); const link = el('a'); link.href = url; link.download = 'deskwise-conversation.txt'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
async function init() { try {state = await api('/api/state'); ready = true; $('#mode-badge').textContent = state.mode === 'live' ? '● Live AI' : '● Demo mode'; if (state.mode === 'live') $('#demo-notice').textContent = 'Live AI: messages are sent to OpenAI. Responses may be inaccurate; verify the referenced sample policies.'; renderMessages(); renderTickets(); renderKnowledge();} catch (err) {error(err.message); $('#mode-badge').textContent = 'Offline'; document.querySelector('.sidebar-status').textContent = 'Backend unavailable';} }
switchTab('chat'); init();
