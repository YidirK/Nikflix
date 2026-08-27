export const CLASSES_TO_REMOVE = [
  "layout-item_styles__zc08zp30 default-ltr-cache-7vbe6a ermvlvv0",
  "default-ltr-cache-1sfbp89 e1qcljkj0",
  "default-ltr-iqcdef-cache-ohh5jx e53rikt0",
  "css-1nym653 modal-enter-done",
  "nf-modal interstitial-full-screen",
  "nf-modal uma-modal two-section-uma",
  "nf-modal extended-diacritics-language interstitial-full-screen",
  "e38lgv32 default-ltr-yhcdbf-cache-fn1p85",
  "default-ltr-yhcdbf-cache-f4de5d e1ih54e40",
  "nf-modal interstitial-dialog",
  "ermvlvv0",
  "e1qcljkj0",
  "e53rikt0",
  "interstitial-full-screen",
  "two-section-uma",
];

export const SELECTORS_TO_REMOVE = [
  ".nf-modal.interstitial-full-screen",
  ".nf-modal.uma-modal.two-section-uma",
  ".nf-modal.extended-diacritics-language.interstitial-full-screen",
  ".css-1nym653.modal-enter-done",
  ".nf-modal.interstitial-dialog",
  "[class*='interstitial-full-screen']",
  "[class*='two-section-uma']",
  "[class*='ermvlvv0']",
  "[class*='e1qcljkj0']",
  "[class*='e53rikt0']",
  "[data-uia*='interstitial']",
  "[data-uia*='uma-modal']",
];

export function injectEarlyCSS(): void {
  const existing = document.getElementById("nikflix-early-css");
  if (existing) return;

  const earlyStyle = document.createElement("style");
  earlyStyle.id = "nikflix-early-css";
  earlyStyle.textContent = `
    .nf-modal.interstitial-full-screen,
    .nf-modal.uma-modal.two-section-uma,
    .nf-modal.extended-diacritics-language.interstitial-full-screen,
    .nf-modal.interstitial-dialog,
    .css-1nym653.modal-enter-done,
    [class*="interstitial-full-screen"],
    [class*="two-section-uma"],
    [data-uia*="interstitial"],
    [data-uia*="uma-modal"] {
      display: none !important;
      opacity: 0 !important;
      pointer-events: none !important;
      visibility: hidden !important;
    }
  `;
  (document.head || document.documentElement).appendChild(earlyStyle);
}

export function removeElementsByClasses(classesNames: string[]): void {
  // 1. Remove exact class elements
  classesNames.forEach((className) => {
    try {
      const elements = document.getElementsByClassName(className);
      while (elements.length > 0) {
        elements[0].parentNode?.removeChild(elements[0]);
      }
    } catch (e) {}
  });

  // 2. Remove by query selectors
  SELECTORS_TO_REMOVE.forEach((selector) => {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el) => el.parentNode?.removeChild(el));
    } catch (e) {}
  });
}
