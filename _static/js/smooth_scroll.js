/**
 * SYSTEMS ENGINEERING LOG - VIBE SCROLL CONTROLLER
 * Version: 3.1 (Snappy + External Links)
 * dependency: @studio-freight/lenis
 */

document.addEventListener("DOMContentLoaded", function() {
    if (typeof Lenis === 'undefined') return;

    // 1. Force-Disable CSS Smooth Scroll
    document.documentElement.style.scrollBehavior = 'auto';

    const lenis = new Lenis({
        duration: 1.2,         // Snappy
        mouseMultiplier: 1.2,  // Responsive
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        smooth: true,
        smoothTouch: false,
        touchMultiplier: 2,
    });

    // 2. Animation Loop
    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // 3. Internal Anchor Links (Smooth Scroll)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            lenis.scrollTo(targetId, {
                offset: -80,
                duration: 1.2, 
                immediate: false,
            });
        });
    });

    // --- 4. EXTERNAL LINK MANAGER (NEW) ---
    // Target all links that start with "http" (External or Absolute)
    document.querySelectorAll('a[href^="http"]').forEach(link => {
        // Check if the link goes to a DIFFERENT domain than your site
        if (link.hostname !== window.location.hostname) {
            link.setAttribute('target', '_blank');           // Open in new tab
            link.setAttribute('rel', 'noopener noreferrer'); // Security best practice
            
            // Optional: Add a visual cue (like a tiny arrow icon) via CSS later if you want
        }
    });
});
