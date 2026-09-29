/* ========================================
   LAYOUT SYSTEM V3
   - Sidebar: Fixed, scrollable, no hang
   - Main: Scrollable with glass effect
   - Tab area: Fully interactive
   ======================================== */

function initializeLayoutSystemV3() {
  console.log('🎨 Initializing layout system V3...');

  // Fix sidebar scrolling
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    sidebar.style.overflow = 'auto';
    sidebar.style.maxHeight = 'calc(100vh - 70px)';
    sidebar.style.overflowX = 'hidden';
    sidebar.style.scrollBehavior = 'smooth';
    
    // Custom scrollbar styling
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      .sidebar::-webkit-scrollbar {
        width: 6px;
      }
      .sidebar::-webkit-scrollbar-track {
        background: rgba(55,214,255,0.05);
        border-radius: 3px;
      }
      .sidebar::-webkit-scrollbar-thumb {
        background: rgba(55,214,255,0.3);
        border-radius: 3px;
      }
      .sidebar::-webkit-scrollbar-thumb:hover {
        background: rgba(55,214,255,0.5);
      }
    `;
    document.head.appendChild(styleEl);
  }

  // Fix main area - scrollable with glass effect
  const main = document.querySelector('main');
  if (main) {
    main.style.overflow = 'auto';
    main.style.maxHeight = 'calc(100vh - 70px)';
    main.style.scrollBehavior = 'smooth';
    main.style.backgroundColor = 'transparent';
    
    // Add glass effect wrapper
    const glassStyleEl = document.createElement('style');
    glassStyleEl.textContent = `
      main {
        background: linear-gradient(135deg,
          rgba(5,8,19,0.72) 0%,
          rgba(10,15,35,0.68) 50%,
          rgba(5,8,19,0.72) 100%);
        backdrop-filter: blur(12px) saturate(110%);
        -webkit-backdrop-filter: blur(12px) saturate(110%);
      }

      main::-webkit-scrollbar {
        width: 8px;
      }
      main::-webkit-scrollbar-track {
        background: rgba(55,214,255,0.05);
      }
      main::-webkit-scrollbar-thumb {
        background: rgba(55,214,255,0.25);
        border-radius: 4px;
      }
      main::-webkit-scrollbar-thumb:hover {
        background: rgba(55,214,255,0.45);
      }

      /* Smooth tab transitions */
      main > * {
        animation: fadeIn 0.3s ease-out;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(5px); }
        to { opacity: 1; transform: translateY(0); }
      }

      /* Tab container glass effect */
      .view-head {
        background: rgba(10,20,40,0.45);
        backdrop-filter: blur(15px);
        border-bottom: 1px solid rgba(55,214,255,0.15);
        border-radius: 12px;
        padding: 18px;
        margin: -25px -28px 22px;
        position: sticky;
        top: 0;
        z-index: 10;
      }

      .card {
        background: linear-gradient(145deg,
          rgba(14,22,40,0.72),
          rgba(8,14,27,0.68));
        backdrop-filter: blur(18px);
        border: 1px solid rgba(55,214,255,0.12);
      }

      .card:hover {
        border-color: rgba(55,214,255,0.25);
        box-shadow: 0 0 30px rgba(55,214,255,0.08);
      }
    `;
    document.head.appendChild(glassStyleEl);
  }

  console.log('✓ Layout V3 active: Sidebar scrollable, Main with glass effect');
  return true;
}

// Run on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeLayoutSystemV3);
} else {
  initializeLayoutSystemV3();
}

window.initializeLayoutSystemV3 = initializeLayoutSystemV3;
