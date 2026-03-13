/**
 * @gao/ui — Exit Animations
 *
 * 15 exit CSS @keyframes.
 *
 * @since 0.6.0
 */

export const exitAnimations: Record<string, string> = {
    fadeOut: `@keyframes gao-fadeOut { from { opacity: 1; } to { opacity: 0; } }`,
    fadeOutUp: `@keyframes gao-fadeOutUp { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-20px); } }`,
    fadeOutDown: `@keyframes gao-fadeOutDown { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(20px); } }`,
    fadeOutLeft: `@keyframes gao-fadeOutLeft { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(-20px); } }`,
    fadeOutRight: `@keyframes gao-fadeOutRight { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(20px); } }`,
    slideOutUp: `@keyframes gao-slideOutUp { from { transform: translateY(0); } to { transform: translateY(-100%); } }`,
    slideOutDown: `@keyframes gao-slideOutDown { from { transform: translateY(0); } to { transform: translateY(100%); } }`,
    slideOutLeft: `@keyframes gao-slideOutLeft { from { transform: translateX(0); } to { transform: translateX(-100%); } }`,
    slideOutRight: `@keyframes gao-slideOutRight { from { transform: translateX(0); } to { transform: translateX(100%); } }`,
    bounceOut: `@keyframes gao-bounceOut { 20% { transform: scale(0.9); } 50%, 55% { opacity: 1; transform: scale(1.1); } 100% { opacity: 0; transform: scale(0.3); } }`,
    zoomOut: `@keyframes gao-zoomOut { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(0.5); } }`,
    flipOutX: `@keyframes gao-flipOutX { from { opacity: 1; transform: perspective(400px) rotateX(0); } 30% { transform: perspective(400px) rotateX(-20deg); opacity: 1; } to { transform: perspective(400px) rotateX(90deg); opacity: 0; } }`,
    flipOutY: `@keyframes gao-flipOutY { from { opacity: 1; transform: perspective(400px) rotateY(0); } 30% { transform: perspective(400px) rotateY(-15deg); opacity: 1; } to { transform: perspective(400px) rotateY(90deg); opacity: 0; } }`,
    rotateOut: `@keyframes gao-rotateOut { from { opacity: 1; transform: rotate(0); } to { opacity: 0; transform: rotate(200deg); } }`,
    collapseOut: `@keyframes gao-collapseOut { from { opacity: 1; transform: scaleY(1); transform-origin: top; } to { opacity: 0; transform: scaleY(0); } }`,
};
