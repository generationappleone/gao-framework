/**
 * @gao/ui — Admin Scripts (Vanilla JavaScript)
 *
 * Provides standalone admin scripts as a string for inline injection.
 * Features: sidebar toggle, dark mode, dropdowns, toasts, modals,
 * search shortcut, keyboard navigation.
 */

/**
 * Full admin JavaScript as a string — inject via `<script>` tag.
 */
export const adminScripts: string = `(function() {
  'use strict';

  // ── Sidebar Toggle ──────────────────────────────────────
  var toggle = document.querySelector('.gao-admin-navbar-toggle');
  var sidebar = document.querySelector('.gao-admin-sidebar');
  var layout = document.querySelector('.gao-admin-layout');

  if (toggle && sidebar) {
    toggle.addEventListener('click', function() {
      if (window.innerWidth <= 768) {
        sidebar.classList.toggle('open');
      } else if (layout) {
        layout.classList.toggle('gao-admin-collapsed');
      }
    });
  }

  // ── Dark Mode Toggle ────────────────────────────────────
  var themeBtn = document.querySelector('.gao-admin-theme-toggle');
  if (themeBtn) {
    var html = document.documentElement;
    var saved = localStorage.getItem('gao-theme');
    if (saved) html.setAttribute('data-theme', saved);

    themeBtn.addEventListener('click', function() {
      var current = html.getAttribute('data-theme');
      var next = current === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      localStorage.setItem('gao-theme', next);
    });
  }

  // ── Dropdown Menus ──────────────────────────────────────
  document.querySelectorAll('.gao-admin-dropdown-trigger').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var dropdown = btn.closest('.gao-admin-dropdown');
      document.querySelectorAll('.gao-admin-dropdown.open').forEach(function(d) {
        if (d !== dropdown) d.classList.remove('open');
      });
      dropdown.classList.toggle('open');
    });
  });

  document.addEventListener('click', function() {
    document.querySelectorAll('.gao-admin-dropdown.open').forEach(function(d) {
      d.classList.remove('open');
    });
  });

  // ── Toast Notifications ─────────────────────────────────
  window.gaoToast = function(message, type, duration) {
    type = type || 'info';
    duration = duration || 4000;
    var container = document.querySelector('.gao-admin-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'gao-admin-toast-container';
      document.body.appendChild(container);
    }
    var toast = document.createElement('div');
    toast.className = 'gao-admin-toast gao-admin-toast-' + type;
    toast.innerHTML = '<span>' + message + '</span>' +
      '<button class="gao-admin-toast-close">&times;</button>';
    container.appendChild(toast);
    toast.querySelector('.gao-admin-toast-close').addEventListener('click', function() {
      toast.remove();
    });
    setTimeout(function() { toast.remove(); }, duration);
  };

  // ── Modal ───────────────────────────────────────────────
  window.gaoModal = {
    open: function(id) {
      var modal = document.getElementById(id);
      if (modal) { modal.style.display = 'flex'; document.body.style.overflow = 'hidden'; }
    },
    close: function(id) {
      var modal = document.getElementById(id);
      if (modal) { modal.style.display = 'none'; document.body.style.overflow = ''; }
    }
  };

  document.querySelectorAll('[data-modal-close]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var overlay = btn.closest('.gao-admin-modal-overlay');
      if (overlay) { overlay.style.display = 'none'; document.body.style.overflow = ''; }
    });
  });

  // ── Search Shortcut (Ctrl/Cmd + K) ──────────────────────
  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      var input = document.querySelector('.gao-admin-search input');
      if (input) input.focus();
    }
    if (e.key === 'Escape') {
      document.querySelectorAll('.gao-admin-dropdown.open').forEach(function(d) { d.classList.remove('open'); });
      document.querySelectorAll('.gao-admin-modal-overlay').forEach(function(m) { m.style.display = 'none'; });
      document.body.style.overflow = '';
    }
  });

  // ── Responsive sidebar close on click outside ───────────
  document.addEventListener('click', function(e) {
    if (sidebar && sidebar.classList.contains('open')) {
      if (!sidebar.contains(e.target) && e.target !== toggle) {
        sidebar.classList.remove('open');
      }
    }
  });

  // ── Tab Navigation ──────────────────────────────────────
  document.querySelectorAll('.gao-admin-tabs').forEach(function(tabGroup) {
    tabGroup.querySelectorAll('.gao-admin-tab').forEach(function(tab) {
      tab.addEventListener('click', function() {
        tabGroup.querySelectorAll('.gao-admin-tab').forEach(function(t) { t.classList.remove('active'); });
        tab.classList.add('active');
        var target = tab.getAttribute('data-tab');
        if (target) {
          var parent = tabGroup.parentElement;
          if (parent) {
            parent.querySelectorAll('[data-tab-content]').forEach(function(c) {
              c.style.display = c.getAttribute('data-tab-content') === target ? 'block' : 'none';
            });
          }
        }
      });
    });
  });
})();`;

/**
 * Generate `<script>` tag with admin scripts.
 */
export function injectAdminScripts(): string {
    return `<script id="gao-admin-scripts">\n${adminScripts}\n</script>`;
}
