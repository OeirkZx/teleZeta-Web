const fs = require('fs');

const cssFile = '/mnt/aa57bb54-fe37-4b0d-aa64-b9333df927dc/Coding/telezeta/app/globals.css';
let css = fs.readFileSync(cssFile, 'utf8');

css = css.replace(/@keyframes pageIn \{[\s\S]*?\}/, `@keyframes pageIn {
  from { opacity: 0; transform: translateY(16px) scale(0.99); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}`);

css = css.replace(/@keyframes fadeUp \{[\s\S]*?\}/, `@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}`);

css = css.replace(/@keyframes slideRight \{[\s\S]*?\}/, `@keyframes slideRight {
  from { opacity: 0; transform: translateX(-16px); }
  to { opacity: 1; transform: translateX(0); }
}`);

css = css.replace(/@keyframes slideDown \{[\s\S]*?\}/, `@keyframes slideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}`);

css = css.replace(/@keyframes popIn \{[\s\S]*?\}/, `@keyframes popIn {
  0% { opacity: 0; transform: scale(0.9); }
  60% { opacity: 1; transform: scale(1.02); }
  100% { opacity: 1; transform: scale(1); }
}`);

css = css.replace(/@keyframes toastIn \{[\s\S]*?\}/, `@keyframes toastIn {
  from { opacity: 0; transform: translateX(100%); }
  to { opacity: 1; transform: translateX(0); }
}`);

css = css.replace(/@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\}\s*\}/, `@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}`);

fs.writeFileSync(cssFile, css);
