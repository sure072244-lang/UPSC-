/* ========================================
   V8.7.3 SAFEGUARDS
   - Block 3D intelligence rendering
   - Prevent performance issues
   - Smooth startup
   ======================================== */

// Intercept view rendering to block 3D
const originalNavigate = window.showView || function() {};

window.showView = function(viewName, ...args) {
  if (viewName === 'threeD' || viewName === '3d3d' || viewName === '3D') {
    console.log('ℹ️ 3D Intelligence removed for performance. Use Study Command instead.');
    // Redirect to Intelligence Lab
    if (typeof showView === 'function') {
      return originalNavigate.call(this, 'studyCommand', ...args);
    }
    return;
  }

  return originalNavigate.call(this, viewName, ...args);
};

// Block view links to 3D
document.addEventListener('click', (e) => {
  const target = e.target.closest('[data-view]');
  if (target && (target.dataset.view === 'threeD' || target.dataset.view === '3d3d')) {
    e.preventDefault();
    e.stopPropagation();
    console.log('ℹ️ Redirecting to Study Command...');
    // Trigger Study Command view
    const btn = document.querySelector('[data-view="intelligence"]');
    if (btn) btn.click();
    return false;
  }
}, true);

// Block human nav 3D
document.addEventListener('click', (e) => {
  const target = e.target.closest('[data-human-view]');
  if (target && target.dataset.humanView === 'threeD') {
    e.preventDefault();
    e.stopPropagation();
    console.log('ℹ️ Redirecting to Study Command...');
    const btn = document.querySelector('[data-view="intelligence"]');
    if (btn) btn.click();
    return false;
  }
}, true);

// Performance optimization
if (window.requestIdleCallback) {
  requestIdleCallback(() => {
    // Clean up unused 3D resources
    const threeD = document.querySelector('.threeD-intelligence');
    if (threeD) threeD.remove();

    // Remove 3D canvas if exists
    const canvases = Array.from(document.querySelectorAll('canvas'));
    canvases.forEach(c => {
      if (c.id && c.id.includes('3d')) {
        c.remove();
      }
    });
  });
}

console.log('✓ V8.7.3 Safeguards: 3D blocked, performance optimized');
