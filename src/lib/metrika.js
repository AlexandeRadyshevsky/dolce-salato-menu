const counterId = Number(import.meta.env.VITE_YANDEX_METRIKA_ID);
const enabled = Number.isSafeInteger(counterId) && counterId > 0;

export function initMetrika() {
  if (!enabled) return;
  if (!window.ym) {
    window.ym = function () {
      (window.ym.a ||= []).push(arguments);
    };
    window.ym.l = Date.now();
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://mc.yandex.ru/metrika/tag.js';
    document.head.append(script);
  }
  window.ym(counterId, 'init', {});
}

export function trackPriceRequest() {
  if (!enabled) return;
  try {
    window.ym?.(counterId, 'reachGoal', 'price_request_success');
  } catch {
    // Статус заявки не зависит от доступности аналитики.
  }
}
