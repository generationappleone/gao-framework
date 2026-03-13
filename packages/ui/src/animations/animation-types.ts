/**
 * @gao/ui — Animation Types
 *
 * Type definitions for the GAO animation system.
 *
 * @since 0.6.0
 */

/**
 * All available animation names (~65 animations).
 */
export type GaoAnimationName =
    // Entrances — Fade
    | 'fadeIn' | 'fadeInUp' | 'fadeInDown' | 'fadeInLeft' | 'fadeInRight'
    // Entrances — Slide
    | 'slideInUp' | 'slideInDown' | 'slideInLeft' | 'slideInRight'
    // Entrances — Bounce
    | 'bounceIn' | 'bounceInUp' | 'bounceInDown'
    // Entrances — Zoom
    | 'zoomIn' | 'zoomInUp' | 'zoomInDown'
    // Entrances — Flip/Rotate
    | 'flipInX' | 'flipInY' | 'rotateIn' | 'rollIn' | 'expandIn'
    // Exits — Fade
    | 'fadeOut' | 'fadeOutUp' | 'fadeOutDown' | 'fadeOutLeft' | 'fadeOutRight'
    // Exits — Slide
    | 'slideOutUp' | 'slideOutDown' | 'slideOutLeft' | 'slideOutRight'
    // Exits — Others
    | 'bounceOut' | 'zoomOut' | 'flipOutX' | 'flipOutY' | 'rotateOut' | 'collapseOut'
    // Attention
    | 'bounce' | 'pulse' | 'shake' | 'wobble' | 'flash' | 'swing'
    | 'tada' | 'heartBeat' | 'jello' | 'rubberBand' | 'headShake' | 'flip'
    // Loaders
    | 'shimmer' | 'skeletonWave' | 'progressIndeterminate' | 'dotsLoading'
    | 'barsLoading' | 'ringLoading' | 'breathe' | 'gradientShift'
    // Scroll Reveal
    | 'revealUp' | 'revealDown' | 'revealLeft' | 'revealRight'
    | 'revealZoom' | 'revealFade' | 'revealFlip' | 'revealRotate'
    | 'parallaxSlow' | 'parallaxFast' | 'countUp';

/**
 * Configuration for a CSS animation.
 */
export interface GaoAnimationConfig {
    /** Duration in ms. Default: 600. */
    duration?: number;
    /** Delay in ms. Default: 0. */
    delay?: number;
    /** CSS easing function. Default: 'ease'. */
    easing?: string;
    /** Iteration count. Default: 1. */
    iterationCount?: number | 'infinite';
    /** Fill mode. Default: 'both'. */
    fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
}
