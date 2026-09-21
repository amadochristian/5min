import { getWeekInfo, formatDate, formatWeek } from './semanas.js';
import { getSettings, saveSettings, notificationsSupported, requestNotificationPermission, getNotificationMessage } from './notificacoes.js';

const FORM_LINKS = {
  A: 'https://forms.office.com/pages/responsepage.aspx?id=7Guh5cnmH0OoT5sQPXdeRr0f_UNvjE9Epmu9rn0gis1UNDRRRE45UkZMWExWMDFZMk43MFcwSjNQSyQlQCN0PWcu',
  B: 'https://forms.office.com/pages/responsepage.aspx?id=7Guh5cnmH0OoT5sQPXdeRr0f_UNvjE9Epmu9rn0gis1UOE9aS0tGWFBWMVIyTVI4MDJCVUIyQkhESiQlQCN0PWcu&route=shorturl'
};

const state = { route: 'home', week: getWeekInfo(), installPrompt: null };
const app = document.querySelector('#app');

function render() {
  if (state.route === 'configuracoes') return renderSettings();
  return renderHome();
}

function renderHome() {
  const formLink = FORM_LINKS[state.week.formType];
  app.innerHTML = `
    <section class="page page-home">
      <div class="santher-identity"><img src="assets/images/santher-logo.png" alt="Santher"></div>
      <div class="welcome-row"><div><p class="eyebrow">SANTHER · SEGURANÇA</p><h1>Olá, vamos cuidar<br>da segurança?</h1></div><div class="cipa-badge"><img src="assets/images/cipa-logo.png" alt="CIPA Segurança do Trabalho"></div></div>
      <div class="week-card">
        <div class="card-topline"><span class="status-dot"></span><span>SEGURANÇA DIÁRIA</span></div>
        <div class="week-card-content"><div><h2>Fazer 5min diário de segurança</h2><p>Semana de ${formatWeek(state.week)}</p></div><div class="paper-icon"><img src="assets/images/5min-timer.png" alt="Cronômetro de 5 minutos"></div></div>
        <a class="primary-button" href="${formLink}" target="_blank" rel="noopener noreferrer">Fazer 5min diário de segurança <span aria-hidden="true">→</span></a>
      </div>
      <div class="summary-grid">
        <div class="summary-item"><span class="summary-icon">◷</span><div><small>Semana atual</small><strong>${formatDate(state.week.start, { day: '2-digit', month: 'short' })} - ${formatDate(state.week.end, { day: '2-digit', month: 'short' })}</strong></div></div>
        <div class="summary-item"><span class="summary-icon">▣</span><div><small>Acesso semanal</small><strong>Disponível</strong></div></div>
      </div>
      <div class="info-strip"><span>i</span><p>O formulário muda automaticamente toda segunda-feira.</p></div>
      ${isIOSInstallAvailable() ? '<div class="ios-install"><strong>Instale no seu iPhone</strong><p>Toque em Compartilhar e depois em Adicionar à Tela de Início.</p></div>' : ''}
    </section>`;
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

(function init() { updateConnection(); render(); if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(error => console.error('Service Worker:', error)); })();
