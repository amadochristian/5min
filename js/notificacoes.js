const SETTINGS_KEY = 'santher-settings';

export function getSettings() {
  try {
    return { reminders: false, day: 'monday', time: '07:00', ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
  } catch {
    return { reminders: false, day: 'monday', time: '07:00' };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function notificationsSupported() {
  return 'Notification' in window;
}

export async function requestNotificationPermission() {
  if (!notificationsSupported()) return 'unsupported';
  return Notification.requestPermission();
}

export function getNotificationMessage(permission) {
  if (permission === 'unsupported') return 'Seu navegador não oferece notificações web.';
  if (permission === 'denied') return 'As notificações estão bloqueadas. Permita-as nas configurações do navegador.';
  return 'Ative as notificações para receber lembretes neste dispositivo.';
}
