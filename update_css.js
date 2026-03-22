const fs = require('fs');

const cssFile = '/mnt/aa57bb54-fe37-4b0d-aa64-b9333df927dc/Coding/telezeta/app/globals.css';
let css = fs.readFileSync(cssFile, 'utf8');

// 1. Replace Animations & Keyframes block
const startKeyframes = css.indexOf('/* ============================================================');
const animationsHeader = css.indexOf('Animations & Keyframes', startKeyframes);
const startStagger = css.indexOf('/* Stagger delay classes */');
const endStaggerBlock = css.indexOf('/* ---- Common UI Patterns ---- */');

if (animationsHeader !== -1 && startStagger !== -1) {
  const newAnimationCSS = `/* ============================================================
   Animations & Keyframes
   ============================================================ */

/* ── KEYFRAMES ── */

@keyframes pageIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.98);
    filter: blur(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
}

@keyframes pageOut {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to { opacity: 0; transform: translateY(-12px) scale(1.01); }
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(28px);
    filter: blur(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideRight {
  from {
    opacity: 0;
    transform: translateX(-20px);
    filter: blur(3px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
    filter: blur(0);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
    filter: blur(2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}

@keyframes popIn {
  0% {
    opacity: 0;
    transform: scale(0.88) translateY(12px);
    filter: blur(4px);
  }
  65% {
    opacity: 1;
    transform: scale(1.03) translateY(-2px);
    filter: blur(0);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes shimmer {
  0% { background-position: -600px 0; }
  100% { background-position: 600px 0; }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}

@keyframes pulseRing {
  0% { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(1.9); opacity: 0; }
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(-0.4deg); }
  35% { transform: translateY(-7px) rotate(0.3deg); }
  70% { transform: translateY(-3px) rotate(-0.2deg); }
}

@keyframes toastIn {
  from {
    opacity: 0;
    transform: translateX(110%) scale(0.92);
    filter: blur(3px);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
    filter: blur(0);
  }
}

@keyframes bounceIn {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); }
}

@keyframes wiggle {
  0%, 100% { transform: rotate(0deg); }
  20% { transform: rotate(-8deg); }
  40% { transform: rotate(8deg); }
  60% { transform: rotate(-5deg); }
  80% { transform: rotate(5deg); }
}

/* ── UTILITY CLASSES ── */

.animate-pageIn {
  animation: pageIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.animate-pageOut {
  animation: pageOut 0.28s cubic-bezier(0.4, 0, 1, 1) both;
  pointer-events: none;
}
.animate-fadeUp {
  animation: fadeUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.animate-fadeIn {
  animation: fadeIn 0.3s ease both;
}
.animate-slideRight {
  animation: slideRight 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.animate-slideDown {
  animation: slideDown 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.animate-popIn {
  animation: popIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.animate-spin {
  animation: spin 0.8s linear infinite;
}
.animate-pulse {
  animation: pulse 2s ease-in-out infinite;
}
.animate-pulseRing {
  animation: pulseRing 1.6s ease-out infinite;
}
.animate-float {
  animation: float 4.5s ease-in-out infinite;
}
.animate-toastIn {
  animation: toastIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.animate-bounceIn {
  animation: bounceIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.animate-wiggle {
  animation: wiggle 0.5s ease both;
}
.animate-shimmer {
  background: linear-gradient(
    105deg,
    #e2e8f0 0%, #e2e8f0 30%,
    #f1f5f9 50%,
    #e2e8f0 70%, #e2e8f0 100%
  );
  background-size: 600px 100%;
  animation: shimmer 2s ease-in-out infinite;
}

/* ── STAGGER DELAYS ── */
.d1 { animation-delay: 0.07s; }
.d2 { animation-delay: 0.14s; }
.d3 { animation-delay: 0.21s; }
.d4 { animation-delay: 0.28s; }
.d5 { animation-delay: 0.35s; }
.d6 { animation-delay: 0.42s; }
.d7 { animation-delay: 0.49s; }
.d8 { animation-delay: 0.56s; }

`;
  
  // Replace from start of Animations block to before Common UI Patterns
  const beforeAnimations = css.substring(0, startKeyframes - 1);
  const afterAnimations = css.substring(endStaggerBlock);
  css = beforeAnimations + '\n' + newAnimationCSS + afterAnimations;
}

// Ensure the other replacements hit the new string correctly by using regexes:

// Replace .card transition
css = css.replace(
  /\.card\s*{[^}]*transition:[^}]*}/g,
  `.card {
  background: #FFFFFF;
  border-radius: 16px;
  border: 1px solid var(--border-color);
  box-shadow: 0 1px 3px rgba(11, 31, 58, 0.04);
  transition: box-shadow 0.25s cubic-bezier(0.22, 1, 0.36, 1),
              border-color 0.2s ease;
}`
);

// Replace .card:hover
css = css.replace(/\.card:hover\s*{[^}]*}/g, '');

// Replace card-clickable
css = css.replace(/\.card-clickable\s*{[^}]*}/g, `.card-clickable {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.3s cubic-bezier(0.22, 1, 0.36, 1),
              border-color 0.2s ease;
  cursor: pointer;
  /* Prevent text selection on clickable cards */
  user-select: none;
  -webkit-user-select: none;
}`);

css = css.replace(/\.card-clickable:hover\s*{[^}]*}/g, `.card-clickable:hover {
  transform: translateY(-5px) scale(1.005);
  box-shadow: 0 20px 48px rgba(11, 31, 58, 0.13),
              0 8px 16px rgba(11, 31, 58, 0.06);
}`);

css = css.replace(/\.card-clickable:active\s*{[^}]*}/g, `.card-clickable:active {
  transform: translateY(-2px) scale(0.998);
  transition-duration: 0.08s;
}`);

// Replace btn-ripple
css = css.replace(/\.btn-ripple\s*{[^}]*}/g, `.btn-ripple {
  position: relative;
  overflow: hidden;
  /* Penting: user-select none agar teks tidak ter-select saat klik */
  user-select: none;
  -webkit-user-select: none;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.25s cubic-bezier(0.22, 1, 0.36, 1),
              background-color 0.15s ease,
              opacity 0.15s ease;
}`);

css = css.replace(/\.btn-ripple:hover\s*{[^}]*}/g, `.btn-ripple:hover:not(:disabled) {
  transform: translateY(-2px);
}`);

css = css.replace(/\.btn-ripple:active\s*{[^}]*}/g, `.btn-ripple:active:not(:disabled) {
  transform: translateY(0) scale(0.97);
  transition-duration: 0.08s;
}

.btn-ripple:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}`);

// Add ripple effect pseudo element CSS
css = css.replace(/\.btn-ripple::after\s*{[^}]*}/g, `.btn-ripple::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.28) 10%,
    transparent 65%
  );
  transform: scale(0);
  transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1),
              opacity 0.4s ease;
  opacity: 0;
  border-radius: inherit;
  pointer-events: none;
}`);

css = css.replace(/\.btn-ripple:active::after\s*{[^}]*}/g, `.btn-ripple:active::after {
  transform: scale(2.5);
  opacity: 1;
  transition-duration: 0s;
}`);

// Replace sidebar nav item CSS
const sidebarContent = `.sidebar-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-radius: 10px;
  color: var(--silver-primary);
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.2s ease,
              color 0.2s ease,
              transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
              border-left-color 0.2s ease;
  border-left: 3px solid transparent;
  text-decoration: none;
  user-select: none;
  -webkit-user-select: none;
}

.sidebar-nav-item:hover {
  background: rgba(255, 255, 255, 0.07);
  color: var(--silver-bright);
  transform: translateX(3px);
}

.sidebar-nav-item.active {
  background: rgba(74, 159, 212, 0.18);
  color: #FFFFFF;
  border-left-color: var(--blue-accent);
  transform: translateX(3px);
}`;

css = css.replace(/\/\* ---- Sidebar styles ---- \*\/[\s\S]*?\/\* ---- Badge styles ---- \*\//, '/* ---- Sidebar styles ---- */\n' + sidebarContent + '\n\n/* ---- Badge styles ---- */');

// Add to badge styles
css = css.replace(/\.badge\s*{[^}]*}/, `.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 100px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  user-select: none;
  -webkit-user-select: none;
}`);

// Skeleton
css = css.replace(/\.skeleton\s*{[^}]*}/, `.skeleton {
  border-radius: 8px;
  background: linear-gradient(
    105deg,
    #dce8f0 0%, #dce8f0 30%,
    #eef4f8 50%,
    #dce8f0 70%, #dce8f0 100%
  );
  background-size: 600px 100%;
  animation: shimmer 2s ease-in-out infinite;
}`);

// Input focus
const inputFocusContent = `/* ── INPUT FOCUS ── */
/* Tambahkan ini untuk semua input/select/textarea */

input, select, textarea {
  transition: border-color 0.2s ease,
              box-shadow 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}

/* Prevent layout shift saat focus — jangan animate padding */
input:focus, select:focus, textarea:focus {
  outline: none;
  /* Hanya box-shadow yang berubah, bukan ukuran element */
}`;

css = css.replace(/\/\* Input field focus styles \*\/[\s\S]*?\/\* Reduced motion preference \*\//, inputFocusContent + '\n\n/* Reduced motion preference */');

// Reduced motion preference replace at bottom
css = css.replace(/\/\* Reduced motion preference \*\/[\s\S]*$/, `/* Reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}`);

fs.writeFileSync(cssFile, css);

