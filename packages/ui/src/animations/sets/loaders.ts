/**
 * @gao/ui — Loader Animations
 *
 * 8 loader CSS @keyframes.
 *
 * @since 0.6.0
 */

export const loaderAnimations: Record<string, string> = {
    shimmer: `@keyframes gao-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`,
    skeletonWave: `@keyframes gao-skeletonWave { 0% { transform: translateX(-100%); } 60% { transform: translateX(100%); } 100% { transform: translateX(100%); } }`,
    progressIndeterminate: `@keyframes gao-progressIndeterminate { 0% { left: -35%; right: 100%; } 60% { left: 100%; right: -90%; } 100% { left: 100%; right: -90%; } }`,
    dotsLoading: `@keyframes gao-dotsLoading { 0%, 80%, 100% { transform: scale(0); opacity: 0.5; } 40% { transform: scale(1); opacity: 1; } }`,
    barsLoading: `@keyframes gao-barsLoading { 0%, 40%, 100% { transform: scaleY(0.4); } 20% { transform: scaleY(1); } }`,
    ringLoading: `@keyframes gao-ringLoading { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`,
    breathe: `@keyframes gao-breathe { 0%, 100% { opacity: 0.4; transform: scale(0.95); } 50% { opacity: 1; transform: scale(1); } }`,
    gradientShift: `@keyframes gao-gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }`,
};
