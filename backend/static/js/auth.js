/* =====================================================================
   auth.js — populates the navbar's account area based on session state.
   Also handles dark/light mode toggle.
   ===================================================================== */

// Apply saved theme on every page load
function applyTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'light') {
    document.body.classList.add('light-mode');
  } else {
    document.body.classList.remove('light-mode');
  }
}

function toggleTheme() {
  const isLight = document.body.classList.toggle('light-mode');
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
  updateThemeIcon();
}

function updateThemeIcon() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  const isLight = document.body.classList.contains('light-mode');
  btn.innerHTML = isLight
    ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
       </svg>`
    : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>
       </svg>`;
}

async function refreshAuthArea() {
  const area = document.getElementById('nav-auth-area');
  if (!area) return;

  try {
    const res = await fetch('/api/me');
    const data = await res.json();

    if (data.email) {
      area.innerHTML = `
        <span class="nav-email">${data.email}</span>
        <button class="btn btn-ghost" id="signout-btn">Sign out</button>
        <button class="btn-icon" id="theme-toggle" title="Toggle theme">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>
          </svg>
        </button>
      `;
      document.getElementById('signout-btn').addEventListener('click', async () => {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = '/';
      });
      document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
      updateThemeIcon();
    } else {
      area.innerHTML = `
        <button class="btn-icon" id="theme-toggle" title="Toggle theme">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>
          </svg>
        </button>
        <a href="/login" class="btn btn-ghost">Log in</a>
        <a href="/signup" class="btn btn-primary" style="width:auto; padding:10px 18px;">Sign up</a>
      `;
      document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
      updateThemeIcon();
    }
  } catch (err) {
    // Fail silently
  }
}

// Apply theme immediately before page renders
applyTheme();
document.addEventListener('DOMContentLoaded', refreshAuthArea);