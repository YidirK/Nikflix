
export function t(key, substitutions) {
    if (typeof chrome !== 'undefined' && chrome.i18n) {
        const msg = chrome.i18n.getMessage(key, substitutions);
        if (msg) return msg;
    }
    console.warn(`[Nikflix i18n] Missing translation for key: "${key}"`);
    return key;
}


export function applyI18n() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        const attr = el.getAttribute('data-i18n-attr') || 'text';
        const translated = t(key);

        switch (attr) {
            case 'html':
                el.innerHTML = translated;
                break;
            case 'placeholder':
                el.placeholder = translated;
                break;
            case 'title':
                el.title = translated;
                break;
            case 'aria-label':
                el.setAttribute('aria-label', translated);
                break;
            case 'text':
            default:
                el.textContent = translated;
                break;
        }
    });
    const rtlLocales = ['ar', 'he', 'fa', 'ur'];
    const uiLocale = (typeof chrome !== 'undefined' && chrome.i18n)
        ? chrome.i18n.getUILanguage()
        : navigator.language || 'en';
    const lang = uiLocale.split('-')[0].toLowerCase();

    if (rtlLocales.includes(lang)) {
        document.documentElement.setAttribute('dir', 'rtl');
        document.documentElement.setAttribute('lang', lang);
    } else {
        document.documentElement.setAttribute('dir', 'ltr');
        document.documentElement.setAttribute('lang', lang);
    }
}