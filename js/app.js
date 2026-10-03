import { getWeekInfo, formatDate, formatWeek } from './semanas.js';
import { getSettings, saveSettings, notificationsSupported, requestNotificationPermission, getNotificationMessage } from './notificacoes.js';
import { schedule2026, scheduleValidationErrors } from './escala.js';

const FORM_LINKS = {
  A: 'https://forms.office.com/pages/responsepage.aspx?id=7Guh5cnmH0OoT5sQPXdeRr0f_UNvjE9Epmu9rn0gis1UNDRRRE45UkZMWExWMDFZMk43MFcwSjNQSyQlQCN0PWcu',
  B: 'https://forms.office.com/pages/responsepage.aspx?id=7Guh5cnmH0OoT5sQPXdeRr0f_UNvjE9Epmu9rn0gis1UOE9aS0tGWFBWMVIyTVI4MDJCVUIyQkhESiQlQCN0PWcu&route=shorturl'
};

const TEAMS = ['A', 'B', 'C', 'D', 'E'];
const SHIFT_LABELS = ['00:00 – 08:00', '08:00 – 16:00', '16:00 – 00:00'];
const state = { route: 'home', week: getWeekInfo(), installPrompt: null, team: loadTeam() };
const app = document.querySelector('#app');

function render() {
  if (state.route === 'configuracoes') return renderSettings();
  return renderHome();
}

function renderHome() {
  const formLink = FORM_LINKS[state.week.formType];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  const todayKey = toScheduleKey(today);
  const todaySchedule = schedule2026[todayKey];
  const currentShift = now.getHours() < 8 ? 0 : now.getHours() < 16 ? 1 : 2;
  const todayRows = todaySchedule ? todaySchedule.shifts.map((team, index) => `<div class="today-shift ${now.getFullYear() === 2026 && index === currentShift ? 'is-current' : ''}"><span>${SHIFT_LABELS[index]}</span><strong>Turma ${team}</strong>${now.getFullYear() === 2026 && index === currentShift ? '<b>AGORA</b>' : ''}</div>`).join('') : '<p class="schedule-unavailable">Escala não cadastrada para esta data.</p>';
  const dayHeading = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }).format(today);
  const days = getUpcomingDays(today);
  const userDays = state.team ? days.map(date => ({ date, schedule: schedule2026[toScheduleKey(date)] })).filter(item => item.schedule) : [];
  const workDays = userDays.filter(item => item.schedule.shifts.includes(state.team)).map(item => shortWeekday(item.date));
  const restDays = userDays.filter(item => item.schedule.off.includes(state.team)).map(item => shortWeekday(item.date));
  const unknownDays = days.filter(date => !schedule2026[toScheduleKey(date)]);
  const nextDays = state.team ? `<div class="days-carousel" aria-label="Escala dos próximos sete dias">${days.map(date => renderDayCard(date, state.team)).join('')}</div><div class="week-summary"><p class="eyebrow">SUA SEMANA</p><p><strong>Você trabalha:</strong> ${workDays.length ? workDays.join(' • ') : '—'}</p><p><strong>Você está de folga:</strong> ${restDays.length ? restDays.join(' • ') : '—'}</p>${unknownDays.length ? `<small>Sem dados para: ${unknownDays.map(formatShortDate).join(', ')}.</small>` : ''}</div>` : '<p class="team-prompt">Selecione sua turma para consultar sua escala.</p>';
  app.innerHTML = `
    <section class="page page-home">
      <div class="santher-identity"><img src="assets/images/santher-logo.png" alt="Santher"></div>
      <div class="week-card">
        <div class="card-topline"><span class="status-dot"></span><span>SEGURANÇA DIÁRIA</span></div>
        <div class="week-card-content"><div><h1>Fazer 5min diário de segurança</h1><p>Semana de ${formatWeek(state.week)}</p></div><div class="paper-icon"><img src="assets/images/5min-timer.png" alt="Cronômetro de 5 minutos"></div></div>
        <a class="primary-button" href="${formLink}" target="_blank" rel="noopener noreferrer">Fazer 5min diário de segurança <span aria-hidden="true">→</span></a>
      </div>
      <section class="schedule-section" aria-labelledby="scheduleTitle">
        <div class="schedule-heading"><div><p class="eyebrow">CONSULTA DA ESCALA</p><h2 id="scheduleTitle">Turnos de hoje</h2><p>${capitalize(dayHeading)}</p></div><span class="schedule-year">2026</span></div>
        <div class="team-picker"><strong>Minha turma</strong><div class="team-options" role="group" aria-label="Selecionar minha turma">${TEAMS.map(team => `<button type="button" class="team-option ${state.team === team ? 'is-selected' : ''}" data-team="${team}" aria-pressed="${state.team === team}">${team}</button>`).join('')}</div></div>
        <div class="today-shifts">${todayRows}</div>
        ${todaySchedule ? `<p class="off-teams"><strong>Folga:</strong> ${formatTeamList(todaySchedule.off)}</p>` : ''}
        ${state.team ? nextDays : '<p class="team-prompt">Selecione sua turma para consultar sua escala.</p>'}
        ${scheduleValidationErrors.length ? `<p class="schedule-warning">A escala contém datas que precisam de correção. Consulte o console para ver o relatório.</p>` : ''}
      </section>
      <div class="summary-grid">
        <div class="summary-item"><span class="summary-icon">◷</span><div><small>Semana atual</small><strong>${formatDate(state.week.start, { day: '2-digit', month: 'short' })} - ${formatDate(state.week.end, { day: '2-digit', month: 'short' })}</strong></div></div>
        <div class="summary-item"><span class="summary-icon">▣</span><div><small>Acesso semanal</small><strong>Disponível</strong></div></div>
      </div>
      <div class="info-strip"><span>i</span><p>O formulário muda automaticamente toda segunda-feira.</p></div>
      ${isIOSInstallAvailable() ? '<div class="ios-install"><strong>Instale no seu iPhone</strong><p>Toque em Compartilhar e depois em Adicionar à Tela de Início.</p></div>' : ''}
    </section>`;
  app.querySelectorAll('[data-team]').forEach(button => button.addEventListener('click', () => {
    state.team = button.dataset.team;
    try { localStorage.setItem('5min-minha-turma', state.team); } catch { /* A seleção permanece ativa nesta sessão. */ }
    renderHome();
  }));
}

function loadTeam() {
  try {
    const saved = localStorage.getItem('5min-minha-turma');
    return TEAMS.includes(saved) ? saved : null;
  } catch {
    return null;
  }
}

function toScheduleKey(date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

function getUpcomingDays(start) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function renderDayCard(date, team) {
  const schedule = schedule2026[toScheduleKey(date)];
  const shift = schedule?.shifts.indexOf(team) ?? -1;
  const isWorking = shift >= 0;
  const status = schedule ? (isWorking ? 'TRABALHA' : 'FOLGA') : 'SEM DADO';
  return `<article class="day-card ${isWorking ? 'is-working' : ''} ${schedule ? '' : 'is-missing'}"><strong class="day-name">${shortWeekday(date)}</strong><span class="day-date">${formatShortDate(date)}</span><strong class="day-team">Turma ${team}</strong><span class="day-status">${status}</span>${isWorking ? `<span class="day-time">${SHIFT_LABELS[shift].replace(' – ', '–')}</span>` : ''}</article>`;
}

function shortWeekday(date) {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(date).replace('.', '').toUpperCase();
}

function formatShortDate(date) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date);
}

function formatTeamList(teams) {
  return teams.length === 2 ? `Turmas ${teams[0]} e ${teams[1]}` : `Turmas ${teams.join(', ')}`;
}

function capitalize(value) {
  return value.charAt(0).toLocaleUpperCase('pt-BR') + value.slice(1);
}

function renderSettings() {
  const settings = getSettings();
  app.innerHTML = `<section class="page"><div class="page-heading"><p class="eyebrow">PREFERÊNCIAS</p><h1>Ajustes</h1><p>Configure o aplicativo para sua rotina.</p></div><div class="settings-panel"><div class="setting-heading"><div class="setting-icon">♧</div><div><h2>Lembretes</h2><p>Receba um lembrete semanal neste dispositivo.</p></div><label class="switch"><input id="reminders" type="checkbox" ${settings.reminders ? 'checked' : ''}><span></span></label></div><div class="reminder-options ${settings.reminders ? '' : 'is-disabled'}"><div class="field"><label for="reminderDay">Dia</label><select id="reminderDay" ${settings.reminders ? '' : 'disabled'}><option value="monday" ${settings.day === 'monday' ? 'selected' : ''}>Segunda-feira</option><option value="friday" ${settings.day === 'friday' ? 'selected' : ''}>Sexta-feira</option></select></div><div class="field"><label for="reminderTime">Horário</label><input id="reminderTime" type="time" value="${settings.time}" ${settings.reminders ? '' : 'disabled'}></div></div><button class="secondary-button" id="notificationPermission" type="button">Verificar notificações</button><p class="support-note" id="notificationMessage">${getNotificationMessage(notificationsSupported() ? Notification.permission : 'unsupported')}</p></div><div class="settings-panel about-panel"><div><span class="eyebrow">SOBRE O APP</span><h2>5Minutos para Segurança</h2><p>Santher · Bragança Paulista/SP</p></div><span class="version-tag">MVP</span></div></section>`;
  const toggle = document.querySelector('#reminders');
  const updateSettings = () => { const current = { reminders: toggle.checked, day: document.querySelector('#reminderDay').value, time: document.querySelector('#reminderTime').value }; saveSettings(current); document.querySelector('.reminder-options').classList.toggle('is-disabled', !current.reminders); document.querySelector('#reminderDay').disabled = !current.reminders; document.querySelector('#reminderTime').disabled = !current.reminders; };
  toggle.addEventListener('change', async () => { if (toggle.checked && (!notificationsSupported() || Notification.permission !== 'granted')) { const permission = await requestNotificationPermission(); if (permission !== 'granted') { toggle.checked = false; document.querySelector('#notificationMessage').textContent = getNotificationMessage(permission); } } updateSettings(); });
  document.querySelectorAll('#reminderDay, #reminderTime').forEach(input => input.addEventListener('change', updateSettings));
  document.querySelector('#notificationPermission').addEventListener('click', async () => { const permission = await requestNotificationPermission(); document.querySelector('#notificationMessage').textContent = permission === 'granted' ? 'Notificações permitidas neste dispositivo.' : getNotificationMessage(permission); });
}

function showToast(message) { const toast = document.querySelector('#toast'); toast.textContent = message; toast.classList.add('is-visible'); setTimeout(() => toast.classList.remove('is-visible'), 3200); }

function updateConnection() { const online = navigator.onLine; const status = document.querySelector('#connectionStatus'); status.classList.toggle('offline', !online); status.querySelector('span').textContent = online ? 'Online' : 'Offline'; }

function isIOSInstallAvailable() { return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.matchMedia('(display-mode: standalone)').matches; }

window.addEventListener('hashchange', () => { const route = location.hash.slice(1) || 'home'; state.route = route === 'configuracoes' ? 'configuracoes' : 'home'; render(); document.querySelector('#app').focus({ preventScroll: true }); });

window.addEventListener('online', updateConnection); window.addEventListener('offline', updateConnection);
window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); state.installPrompt = event; const button = document.querySelector('#installButton'); button.hidden = false; });
document.querySelector('#installButton').addEventListener('click', async () => { if (!state.installPrompt) return; state.installPrompt.prompt(); await state.installPrompt.userChoice; state.installPrompt = null; document.querySelector('#installButton').hidden = true; });
window.addEventListener('appinstalled', () => { document.querySelector('#installButton').hidden = true; showToast('Aplicativo instalado com sucesso.'); });

(function init() { updateConnection(); render(); window.setInterval(() => { if (state.route === 'home') renderHome(); }, 60_000); if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(error => console.error('Service Worker:', error)); })();
