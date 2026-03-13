/**
 * @gao/ui — Media Components
 *
 * Carousel and Offcanvas components.
 *
 * @since 0.6.0
 */

// ─── Types ───────────────────────────────────────────────────

export interface CarouselSlide {
    content: string;
    caption?: string;
}

export interface CarouselConfig {
    slides: CarouselSlide[];
    showDots?: boolean;
    showArrows?: boolean;
    id?: string;
    className?: string;
}

export interface OffcanvasConfig {
    position?: 'left' | 'right' | 'top' | 'bottom';
    title?: string;
    content: string;
    backdrop?: boolean;
    id?: string;
    className?: string;
}

// ─── Components ──────────────────────────────────────────────

/**
 * CSS Scroll Snap carousel.
 */
export function gaoCarousel(config: CarouselConfig): string {
    const { slides, showDots = true, showArrows = true, id, className = '' } = config;
    const carouselId = id ?? `gao-carousel-${Math.random().toString(36).slice(2, 8)}`;
    const cls = `gao-carousel ${className}`.trim();

    const slidesHtml = slides.map((slide, i) =>
        `<div class="gao-carousel-slide" id="${carouselId}-slide-${i}">${slide.content}${slide.caption ? `<div class="gao-carousel-caption">${slide.caption}</div>` : ''}</div>`
    ).join('\n');

    const arrowsHtml = showArrows ? `
<button class="gao-carousel-arrow gao-carousel-prev" aria-label="Previous slide" onclick="this.closest('.gao-carousel').querySelector('.gao-carousel-track').scrollBy({left:-this.closest('.gao-carousel').offsetWidth,behavior:'smooth'})">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
</button>
<button class="gao-carousel-arrow gao-carousel-next" aria-label="Next slide" onclick="this.closest('.gao-carousel').querySelector('.gao-carousel-track').scrollBy({left:this.closest('.gao-carousel').offsetWidth,behavior:'smooth'})">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
</button>` : '';

    const dotsHtml = showDots ? `
<div class="gao-carousel-dots">
${slides.map((_, i) => `<button class="gao-carousel-dot${i === 0 ? ' gao-carousel-dot-active' : ''}" aria-label="Go to slide ${i + 1}"></button>`).join('\n')}
</div>` : '';

    return `<div class="${cls}" id="${carouselId}" role="region" aria-label="Carousel">
<div class="gao-carousel-track">
${slidesHtml}
</div>${arrowsHtml}${dotsHtml}
</div>`;
}

/**
 * Slide-in offcanvas panel.
 */
export function gaoOffcanvas(config: OffcanvasConfig): string {
    const { position = 'right', title, content, backdrop = true, id, className = '' } = config;
    const canvasId = id ?? `gao-offcanvas-${Math.random().toString(36).slice(2, 8)}`;
    const cls = `gao-offcanvas gao-offcanvas-${position} ${className}`.trim();

    const titleHtml = title ? `<span class="gao-offcanvas-title">${title}</span>` : '';
    const closeBtn = `<button class="gao-offcanvas-close" aria-label="Close" onclick="document.getElementById('${canvasId}').classList.remove('open');document.getElementById('${canvasId}-backdrop')?.classList.remove('open')">
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
</button>`;

    const backdropHtml = backdrop
        ? `<div id="${canvasId}-backdrop" class="gao-offcanvas-backdrop" onclick="document.getElementById('${canvasId}').classList.remove('open');this.classList.remove('open')"></div>`
        : '';

    return `${backdropHtml}
<div id="${canvasId}" class="${cls}" role="dialog" aria-modal="true">
<div class="gao-offcanvas-header">${titleHtml}${closeBtn}</div>
<div class="gao-offcanvas-body">${content}</div>
</div>`;
}
