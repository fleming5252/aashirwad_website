// Register GSAP Plugins
gsap.registerPlugin(ScrollTrigger);

// Initialize Lenis Smooth Scrolling
const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), 
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    mouseMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 2,
});

function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// Update ScrollTrigger on Lenis scroll
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0, 0);

// Custom Cursor Logic
const cursor = document.querySelector('.cursor');
const cursorFollower = document.querySelector('.cursor-follower');

document.addEventListener('mousemove', (e) => {
    gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0 });
    gsap.to(cursorFollower, { x: e.clientX, y: e.clientY, duration: 0.3 });
});

document.querySelectorAll('a, button, .h-card, .scatter-card').forEach(el => {
    el.addEventListener('mouseenter', () => {
        gsap.to(cursor, { scale: 2, backgroundColor: 'transparent', border: '1px solid var(--accent)' });
        gsap.to(cursorFollower, { scale: 1.5, borderColor: 'var(--accent)' });
    });
    el.addEventListener('mouseleave', () => {
        gsap.to(cursor, { scale: 1, backgroundColor: 'var(--accent)', border: 'none' });
        gsap.to(cursorFollower, { scale: 1, borderColor: 'rgba(255,255,255,0.3)' });
    });
});

// Preloader Sequence
const tlPreload = gsap.timeline();
tlPreload.fromTo(".preloader-text", {y: 50, opacity: 0}, {y: 0, opacity: 1, duration: 1, ease: "power3.out"})
         .to(".preloader-text", {y: -50, opacity: 0, duration: 0.8, ease: "power3.in", delay: 0.5})
         .to(".preloader", {y: "-100%", duration: 1, ease: "power4.inOut"}, "-=0.2")
         .fromTo(".hero .title", {y: 100, opacity: 0, clipPath: "polygon(0 100%, 100% 100%, 100% 100%, 0% 100%)"}, 
                                {y: 0, opacity: 1, clipPath: "polygon(0 0%, 100% 0%, 100% 100%, 0% 100%)", duration: 1.2, ease: "power4.out"}, "-=0.5")
         .fromTo(".hero .subtitle, .hero .tagline", {opacity: 0, y: 20}, {opacity: 1, y: 0, duration: 0.8, stagger: 0.2}, "-=0.8");

// Setup matchMedia for responsive animations
let mm = gsap.matchMedia();

mm.add("(min-width: 1025px)", () => {

    // 1. Hero Parallax
    gsap.to(".hero-bg", {
        y: "20%",
        ease: "none",
        scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom top",
            scrub: true
        }
    });

    // 2. Excellence 3D Scatter (Section 1)
    // Initially stack them
    gsap.set(".scatter-card", { rotation: 0, x: 0, y: 0, zIndex: 1 });
    
    let scatterTl = gsap.timeline({
        scrollTrigger: {
            trigger: ".excellence",
            start: "top 10%",
            end: "+=100%",
            pin: true,
            scrub: 1
        }
    });
    
    scatterTl.to(".card-1", { x: -250, y: -100, rotation: -15, scale: 1.1, zIndex: 3 }, 0)
             .to(".card-2", { x: 250, y: -50, rotation: 10, scale: 1.05, zIndex: 2 }, 0)
             .to(".card-3", { x: -100, y: 200, rotation: -5, scale: 1.15, zIndex: 4 }, 0)
             .to(".card-text", { x: 150, y: 150, rotation: 5, scale: 1, zIndex: 5 }, 0);

    // 3. Ecosystem Horizontal Scroll (Section 2)
    let track = document.querySelector(".horizontal-track");
    let getScrollAmount = () => -(track.scrollWidth - window.innerWidth);
    
    gsap.to(track, {
        x: getScrollAmount,
        ease: "none",
        scrollTrigger: {
            trigger: ".ecosystem",
            start: "top top",
            end: () => `+=${track.scrollWidth}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true
        }
    });

    // Image Parallax inside Horizontal Scroll
    gsap.utils.toArray('.h-card-inner img').forEach(img => {
        gsap.to(img, {
            x: "15%",
            ease: "none",
            scrollTrigger: {
                trigger: ".ecosystem",
                start: "top top",
                end: () => `+=${track.scrollWidth}`,
                scrub: true,
                invalidateOnRefresh: true
            }
        });
    });

    // 4. CSNP Image Mask Reveal (Section 3)
    gsap.to(".csnp-mask-layer", {
        clipPath: "circle(150% at 50% 50%)",
        ease: "power2.inOut",
        scrollTrigger: {
            trigger: ".csnp",
            start: "top top",
            end: "+=150%",
            pin: true,
            scrub: 1
        }
    });

    // 5. Innovation 3D Book Open (Section 4 - Lowest Level)
    let bookTl = gsap.timeline({
        scrollTrigger: {
            trigger: ".innovation",
            start: "center center",
            end: "+=100%",
            pin: true,
            scrub: 1
        }
    });
    // Open the cover
    bookTl.to(".book-cover", { rotationY: -160, duration: 1, ease: "power1.inOut" });
    // Slight overall book rotation for 3D effect
    gsap.to(".book", {
        rotationX: 10,
        rotationZ: -2,
        scrollTrigger: {
            trigger: ".innovation",
            start: "top bottom",
            end: "bottom top",
            scrub: true
        }
    });

    // 6. Beyond Classroom Z-Axis Tunnel (Section 5)
    gsap.set(".t-img", { z: -3000, opacity: 0 });
    
    let tunnelTl = gsap.timeline({
        scrollTrigger: {
            trigger: ".beyond",
            start: "top top",
            end: "+=200%",
            pin: true,
            scrub: 1
        }
    });
    
    // Images fly towards screen and fade out as they pass
    tunnelTl.to(".t-img-1", { z: 500, opacity: 1, duration: 2 }, 0)
            .to(".t-img-1", { opacity: 0, duration: 0.5 }, 1.5)
            .to(".t-img-2", { z: 500, opacity: 1, duration: 2 }, 0.5)
            .to(".t-img-2", { opacity: 0, duration: 0.5 }, 2.0)
            .to(".t-img-3", { z: 500, opacity: 1, duration: 2 }, 1.0)
            .to(".t-img-3", { opacity: 0, duration: 0.5 }, 2.5)
            .to(".t-img-4", { z: 500, opacity: 1, duration: 2 }, 1.5)
            .to(".t-img-4", { opacity: 0, duration: 0.5 }, 3.0);

    // 7. Results SVG Timeline Drawing (Section 6)
    let path = document.querySelector(".timeline-path");
    if(path) {
        let length = path.getTotalLength();
        gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
        
        gsap.to(path, {
            strokeDashoffset: 0,
            ease: "none",
            scrollTrigger: {
                trigger: ".results",
                start: "top 30%",
                end: "bottom 80%",
                scrub: 1
            }
        });

        // Fade in points as path reaches them
        gsap.utils.toArray('.t-point').forEach((point, i) => {
            gsap.to(point, {
                y: 0,
                opacity: 1,
                duration: 0.5,
                scrollTrigger: {
                    trigger: point,
                    start: "top 70%",
                    toggleActions: "play none none reverse"
                }
            });
        });
    }

    // 8. Vision/Mission Morphing Hover Outro (Section 7)
    gsap.utils.toArray(".outline-text").forEach(text => {
        ScrollTrigger.create({
            trigger: text,
            start: "top 80%",
            onEnter: () => {
                gsap.to(text, { color: "#ffffff", WebkitTextStroke: "0px", duration: 1, ease: "power2.out" });
            },
            onLeaveBack: () => {
                gsap.to(text, { color: "transparent", WebkitTextStroke: "2px rgba(255,255,255,0.2)", duration: 1 });
            }
        });
    });

});

// Mobile simplified animations
mm.add("(max-width: 1024px)", () => {
    gsap.to(".hero-bg", { y: "10%", ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }});
    
    // Simple fade in for points since SVG is hidden
    gsap.utils.toArray('.t-point').forEach((point) => {
        gsap.to(point, {
            y: 0,
            opacity: 1,
            duration: 0.8,
            scrollTrigger: { trigger: point, start: "top 80%" }
        });
    });
});
