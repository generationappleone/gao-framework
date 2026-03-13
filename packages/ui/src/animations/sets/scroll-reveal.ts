/**
 * @gao/ui — Scroll Reveal Animations
 *
 * 11 scroll-triggered reveal animations with IntersectionObserver.
 *
 * @since 0.6.0
 */

export const scrollRevealAnimations: Record<string, string> = {
    revealUp: `@keyframes gao-revealUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }`,
    revealDown: `@keyframes gao-revealDown { from { opacity: 0; transform: translateY(-30px); } to { opacity: 1; transform: translateY(0); } }`,
    revealLeft: `@keyframes gao-revealLeft { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }`,
    revealRight: `@keyframes gao-revealRight { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }`,
    revealZoom: `@keyframes gao-revealZoom { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }`,
    revealFade: `@keyframes gao-revealFade { from { opacity: 0; } to { opacity: 1; } }`,
    revealFlip: `@keyframes gao-revealFlip { from { opacity: 0; transform: perspective(400px) rotateX(60deg); } to { opacity: 1; transform: perspective(400px) rotateX(0); } }`,
    revealRotate: `@keyframes gao-revealRotate { from { opacity: 0; transform: rotate(-15deg) scale(0.9); } to { opacity: 1; transform: rotate(0) scale(1); } }`,
    parallaxSlow: `@keyframes gao-parallaxSlow { from { transform: translateY(20px); } to { transform: translateY(-20px); } }`,
    parallaxFast: `@keyframes gao-parallaxFast { from { transform: translateY(40px); } to { transform: translateY(-40px); } }`,
    countUp: `@keyframes gao-countUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`,
};

/**
 * Client-side IntersectionObserver script for scroll-based reveal.
 */
export function scrollRevealScript(): string {
    return `
(function() {
  'use strict';
  if (typeof IntersectionObserver === 'undefined') return;

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('gao-revealed');
        var anim = entry.target.getAttribute('data-gao-reveal');
        if (anim) {
          entry.target.style.animation = 'gao-' + anim + ' 0.6s ease both';
        }
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -10% 0px' });

  document.querySelectorAll('[data-gao-reveal]').forEach(function(el) {
    el.style.opacity = '0';
    observer.observe(el);
  });
})();`;
}
