/**
 * @gao/ui — Entrance Animations
 *
 * 20 entrance CSS @keyframes.
 *
 * @since 0.6.0
 */

export const entranceAnimations: Record<string, string> = {
    fadeIn: `@keyframes gao-fadeIn { from { opacity: 0; } to { opacity: 1; } }`,
    fadeInUp: `@keyframes gao-fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`,
    fadeInDown: `@keyframes gao-fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }`,
    fadeInLeft: `@keyframes gao-fadeInLeft { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }`,
    fadeInRight: `@keyframes gao-fadeInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }`,
    slideInUp: `@keyframes gao-slideInUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`,
    slideInDown: `@keyframes gao-slideInDown { from { transform: translateY(-100%); } to { transform: translateY(0); } }`,
    slideInLeft: `@keyframes gao-slideInLeft { from { transform: translateX(-100%); } to { transform: translateX(0); } }`,
    slideInRight: `@keyframes gao-slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }`,
    bounceIn: `@keyframes gao-bounceIn { 0% { opacity: 0; transform: scale(0.3); } 50% { opacity: 1; transform: scale(1.05); } 70% { transform: scale(0.9); } 100% { transform: scale(1); } }`,
    bounceInUp: `@keyframes gao-bounceInUp { 0% { opacity: 0; transform: translateY(40px); } 60% { opacity: 1; transform: translateY(-10px); } 80% { transform: translateY(5px); } 100% { transform: translateY(0); } }`,
    bounceInDown: `@keyframes gao-bounceInDown { 0% { opacity: 0; transform: translateY(-40px); } 60% { opacity: 1; transform: translateY(10px); } 80% { transform: translateY(-5px); } 100% { transform: translateY(0); } }`,
    zoomIn: `@keyframes gao-zoomIn { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }`,
    zoomInUp: `@keyframes gao-zoomInUp { from { opacity: 0; transform: scale(0.5) translateY(40px); } to { opacity: 1; transform: scale(1) translateY(0); } }`,
    zoomInDown: `@keyframes gao-zoomInDown { from { opacity: 0; transform: scale(0.5) translateY(-40px); } to { opacity: 1; transform: scale(1) translateY(0); } }`,
    flipInX: `@keyframes gao-flipInX { from { opacity: 0; transform: perspective(400px) rotateX(90deg); } 40% { transform: perspective(400px) rotateX(-10deg); } 70% { transform: perspective(400px) rotateX(10deg); } to { opacity: 1; transform: perspective(400px) rotateX(0); } }`,
    flipInY: `@keyframes gao-flipInY { from { opacity: 0; transform: perspective(400px) rotateY(90deg); } 40% { transform: perspective(400px) rotateY(-10deg); } 70% { transform: perspective(400px) rotateY(10deg); } to { opacity: 1; transform: perspective(400px) rotateY(0); } }`,
    rotateIn: `@keyframes gao-rotateIn { from { opacity: 0; transform: rotate(-200deg); } to { opacity: 1; transform: rotate(0); } }`,
    rollIn: `@keyframes gao-rollIn { from { opacity: 0; transform: translateX(-100%) rotate(-120deg); } to { opacity: 1; transform: translateX(0) rotate(0); } }`,
    expandIn: `@keyframes gao-expandIn { from { opacity: 0; transform: scaleY(0); transform-origin: top; } to { opacity: 1; transform: scaleY(1); } }`,
};
