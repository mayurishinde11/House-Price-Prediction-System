/* =====================================================================
   auth.js — populates the navbar's account area based on session state.
   Included on every page via base layout.
   ===================================================================== */

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
    } else {
      area.innerHTML = `
        <a href="/login" class="btn btn-ghost">Log in</a>
        <a href="/signup" class="btn btn-primary" style="width:auto; padding:10px 18px;">Sign up</a>
      `;
    }
  } catch (err) {
    // Fail silently — auth area just won't render if the API is unreachable
  }
}

document.addEventListener('DOMContentLoaded', refreshAuthArea);