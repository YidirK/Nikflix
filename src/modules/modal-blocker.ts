export const CLASSES_TO_REMOVE = [
  "layout-item_styles__zc08zp30 default-ltr-cache-7vbe6a ermvlvv0",
  "default-ltr-cache-1sfbp89 e1qcljkj0",
  "default-Itr-iqcdef-cache-ohh5jx e53rikt0",
  "css-1nym653 modal-enter-done",
  "nf-modal interstitial-full-screen",
  "nf-modal uma-modal two-section-uma",
  "nf-modal extended-diacritics-language interstitial-full-screen",
  "e38lgv32 default-ltr-yhcdbf-cache-fn1p85",
  "default-ltr-yhcdbf-cache-f4de5d e1ih54e40",
  "nf-modal interstitial-dialog",
];

export function injectEarlyCSS(): void {
  const earlyStyle = document.createElement("style");
  earlyStyle.textContent = `
    .nf-modal.interstitial-full-screen,
    .nf-modal.uma-modal.two-section-uma,
    .nf-modal.extended-diacritics-language.interstitial-full-screen,
    .css-1nym653.modal-enter-done {
      display: none !important;
    }
  `;
  (document.head || document.documentElement).appendChild(earlyStyle);
}

export function removeElementsByClasses(classesNames: string[]): void {
  classesNames.forEach((className) => {
    const elements = document.getElementsByClassName(className);
    while (elements.length > 0) {
      elements[0].parentNode?.removeChild(elements[0]);
    }
  });
}
