/**
 * @gao/ui — Attention-Seeking Animations
 *
 * 12 attention CSS @keyframes.
 *
 * @since 0.6.0
 */

export const attentionAnimations: Record<string, string> = {
    bounce: `@keyframes gao-bounce { 0%, 20%, 53%, 100% { animation-timing-function: cubic-bezier(0.215,0.61,0.355,1); transform: translateY(0); } 40%, 43% { animation-timing-function: cubic-bezier(0.755,0.05,0.855,0.06); transform: translateY(-30px); } 70% { animation-timing-function: cubic-bezier(0.755,0.05,0.855,0.06); transform: translateY(-15px); } 90% { transform: translateY(-4px); } }`,
    pulse: `@keyframes gao-pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }`,
    shake: `@keyframes gao-shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); } 20%, 40%, 60%, 80% { transform: translateX(10px); } }`,
    wobble: `@keyframes gao-wobble { 0% { transform: translateX(0) rotate(0); } 15% { transform: translateX(-25%) rotate(-5deg); } 30% { transform: translateX(20%) rotate(3deg); } 45% { transform: translateX(-15%) rotate(-3deg); } 60% { transform: translateX(10%) rotate(2deg); } 75% { transform: translateX(-5%) rotate(-1deg); } 100% { transform: translateX(0) rotate(0); } }`,
    flash: `@keyframes gao-flash { 0%, 50%, 100% { opacity: 1; } 25%, 75% { opacity: 0; } }`,
    swing: `@keyframes gao-swing { 20% { transform: rotate(15deg); } 40% { transform: rotate(-10deg); } 60% { transform: rotate(5deg); } 80% { transform: rotate(-5deg); } 100% { transform: rotate(0); } }`,
    tada: `@keyframes gao-tada { 0% { transform: scale(1) rotate(0); } 10%, 20% { transform: scale(0.9) rotate(-3deg); } 30%, 50%, 70%, 90% { transform: scale(1.1) rotate(3deg); } 40%, 60%, 80% { transform: scale(1.1) rotate(-3deg); } 100% { transform: scale(1) rotate(0); } }`,
    heartBeat: `@keyframes gao-heartBeat { 0% { transform: scale(1); } 14% { transform: scale(1.3); } 28% { transform: scale(1); } 42% { transform: scale(1.3); } 70% { transform: scale(1); } }`,
    jello: `@keyframes gao-jello { 0%, 11.1%, 100% { transform: none; } 22.2% { transform: skewX(-12.5deg) skewY(-12.5deg); } 33.3% { transform: skewX(6.25deg) skewY(6.25deg); } 44.4% { transform: skewX(-3.125deg) skewY(-3.125deg); } 55.5% { transform: skewX(1.5625deg) skewY(1.5625deg); } 66.6% { transform: skewX(-0.78125deg) skewY(-0.78125deg); } 77.7% { transform: skewX(0.390625deg) skewY(0.390625deg); } 88.8% { transform: skewX(-0.1953125deg) skewY(-0.1953125deg); } }`,
    rubberBand: `@keyframes gao-rubberBand { 0% { transform: scale(1); } 30% { transform: scaleX(1.25) scaleY(0.75); } 40% { transform: scaleX(0.75) scaleY(1.25); } 50% { transform: scaleX(1.15) scaleY(0.85); } 65% { transform: scaleX(0.95) scaleY(1.05); } 75% { transform: scaleX(1.05) scaleY(0.95); } 100% { transform: scale(1); } }`,
    headShake: `@keyframes gao-headShake { 0% { transform: translateX(0); } 6.5% { transform: translateX(-6px) rotateY(-9deg); } 18.5% { transform: translateX(5px) rotateY(7deg); } 31.5% { transform: translateX(-3px) rotateY(-5deg); } 43.5% { transform: translateX(2px) rotateY(3deg); } 50% { transform: translateX(0); } }`,
    flip: `@keyframes gao-flip { 0% { transform: perspective(400px) rotateY(0); } 40% { transform: perspective(400px) rotateY(-180deg); } 100% { transform: perspective(400px) rotateY(-360deg); } }`,
};
