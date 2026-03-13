/**
 * @gao/ui — Theme Client Script
 *
 * Client-side JavaScript for runtime theme switching.
 * Provides `window.gaoTheme` API for set/get/restore operations
 * with localStorage persistence.
 *
 * @since 0.6.0
 */

/**
 * Generate the client-side theme switching script.
 *
 * @returns JavaScript string to embed in the page
 *
 * @example
 * ```html
 * <script>
 *   ${themeScript()}
 * </script>
 * ```
 */
export function themeScript(): string {
    return `
(function() {
  'use strict';

  var STORAGE_KEY = 'gao-theme';
  var DARK_KEY = 'gao-dark-mode';

  window.gaoTheme = {
    /**
     * Set active theme by preset name.
     * Dynamically fetches and applies theme CSS.
     * @param {string} name - Theme preset name
     */
    set: function(name) {
      document.documentElement.setAttribute('data-gao-theme', name);
      try { localStorage.setItem(STORAGE_KEY, name); } catch(e) {}
    },

    /**
     * Get current theme name.
     * @returns {string} Current theme name or 'gao' (default)
     */
    get: function() {
      try { return localStorage.getItem(STORAGE_KEY) || 'gao'; } catch(e) { return 'gao'; }
    },

    /**
     * Set a specific CSS custom property.
     * @param {string} variable - CSS variable name (e.g., '--gao-primary')
     * @param {string} value - CSS value
     */
    setProperty: function(variable, value) {
      document.documentElement.style.setProperty(variable, value);
    },

    /**
     * Set primary color by HSL values.
     * @param {number} h - Hue (0-360)
     * @param {number} s - Saturation (0-100)
     * @param {number} l - Lightness (0-100)
     */
    setColor: function(h, s, l) {
      var root = document.documentElement.style;
      root.setProperty('--gao-primary-h', h);
      root.setProperty('--gao-primary-s', s + '%');
      root.setProperty('--gao-primary-l', l + '%');
      root.setProperty('--gao-primary', 'hsl(' + h + ', ' + s + '%, ' + l + '%)');
      root.setProperty('--gao-primary-light', 'hsl(' + h + ', ' + s + '%, ' + Math.min(l + 15, 85) + '%)');
      root.setProperty('--gao-primary-dark', 'hsl(' + h + ', ' + s + '%, ' + Math.max(l - 10, 15) + '%)');
      root.setProperty('--gao-primary-bg', 'hsl(' + h + ', ' + s + '%, 96%)');
    },

    /**
     * Toggle dark mode.
     * @returns {boolean} New dark mode state
     */
    toggleDark: function() {
      var html = document.documentElement;
      var isDark = html.getAttribute('data-theme') === 'dark';
      var newTheme = isDark ? 'light' : 'dark';
      html.setAttribute('data-theme', newTheme);
      try { localStorage.setItem(DARK_KEY, newTheme); } catch(e) {}
      return !isDark;
    },

    /**
     * Get current dark mode state.
     * @returns {boolean} Whether dark mode is active
     */
    isDark: function() {
      return document.documentElement.getAttribute('data-theme') === 'dark';
    },

    /**
     * Restore saved theme and dark mode from localStorage.
     */
    restore: function() {
      try {
        var savedTheme = localStorage.getItem(STORAGE_KEY);
        var savedDark = localStorage.getItem(DARK_KEY);
        if (savedTheme) {
          document.documentElement.setAttribute('data-gao-theme', savedTheme);
        }
        if (savedDark) {
          document.documentElement.setAttribute('data-theme', savedDark);
        }
      } catch(e) {}
    },

    /**
     * Reset all customizations and return to defaults.
     */
    reset: function() {
      document.documentElement.removeAttribute('data-gao-theme');
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.style.cssText = '';
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(DARK_KEY);
      } catch(e) {}
    }
  };

  /* Auto-restore on page load */
  window.gaoTheme.restore();
})();`;
}

/**
 * Generate a `<script>` tag containing the theme switching script.
 */
export function injectThemeScript(): string {
    return `<script id="gao-theme-script">\n${themeScript()}\n</script>`;
}
