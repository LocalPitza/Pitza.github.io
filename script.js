/* ==============================
   THEME FROM JSON
================================ */
fetch("themes.json")
    .then(res => res.json())
    .then(data => {
        const t = data.pastelOrange;
        Object.entries(t).forEach(([k, v]) => {
            document.documentElement.style.setProperty(
                `--${k.replace(/[A-Z]/g, m => "-" + m.toLowerCase())}`,
                v
            );
        });
    });

/* ==============================
   LIGHT / DARK MODE - FIXED (DEFAULT: DARK)
================================ */
const toggle = document.getElementById("themeToggle");
const saved = localStorage.getItem("theme");

// Apply saved theme on load, default to dark mode
if (saved === "light") {
    document.body.classList.add("light");
} else {
    // Explicitly remove light class to ensure dark mode is default
    document.body.classList.remove("light");
}

if (toggle) {
    toggle.addEventListener("click", () => {
        // Toggle the 'light' class on body
        document.body.classList.toggle("light");
        
        // Save preference
        const isLight = document.body.classList.contains("light");
        localStorage.setItem("theme", isLight ? "light" : "dark");
    });
}

/* ==============================
   CLICK COUNTER
================================ */
let clicks = 0;
const counter = document.getElementById("clickCounter");
const countText = document.getElementById("clickCount");

if (counter) {
    document.body.addEventListener("click", () => {
        clicks++;
        countText.textContent = clicks;
        counter.classList.add("show");
        setTimeout(() => counter.classList.remove("show"), 1200);
    });
}

/* ==============================
   SCROLL REVEAL
================================ */
const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add("reveal");
    });
}, { threshold: 0.15 });

document.querySelectorAll("section, .project").forEach(el => observer.observe(el));

/* ==============================
   PROJECT SLIDESHOW - FIXED FOR MISSING MEDIA
================================ */
class ProjectSlideshow {
    constructor(container) {
        this.container = container;
        this.mode = container.dataset.mode || "featured";
        this.videoSlide = container.querySelector('.video-slide');
        this.video = this.videoSlide ? this.videoSlide.querySelector('video') : null;
        this.slideshow = container.querySelector('.slideshow');
        this.slides = container.querySelectorAll('.slide');
        this.indicators = container.querySelectorAll('.indicator');
        this.prevBtn = container.querySelector('.prev');
        this.nextBtn = container.querySelector('.next');
        this.currentIndex = 0;
        this.hasVideo = false;
        
        // Check if video actually has a valid source
        if (this.video) {
            const source = this.video.querySelector('source');
            if (source && source.src && !source.src.endsWith('/')) {
                this.hasVideo = true;
            }
        }

        this.init();
    }

    init() {
        // Always start with first image slide (skip video for now)
        this.showSlide(0);
        
        // Hide video slide if no valid video
        if (!this.hasVideo && this.videoSlide) {
            this.videoSlide.style.display = 'none';
        }
        
        // Try to play video if available
        if (this.video && this.hasVideo && this.mode === "project") {
            this.video.play().catch(() => {
                // Video failed to load, hide it
                this.hasVideo = false;
                if (this.videoSlide) this.videoSlide.style.display = 'none';
            });

            this.video.onended = () => {
                this.showSlide(0);
            };
        }

        this.prevBtn.addEventListener('click', () => this.changeSlide(-1));
        this.nextBtn.addEventListener('click', () => this.changeSlide(1));

        this.indicators.forEach(indicator => {
            indicator.addEventListener('click', () => {
                if (indicator.dataset.slide === 'video' && this.hasVideo) {
                    this.currentIndex = -1;
                    this.showVideo();
                } else if (indicator.dataset.slide !== 'video') {
                    this.goToSlide(parseInt(indicator.dataset.slide));
                }
            });
        });
    }

    showVideo() {
        if (!this.hasVideo) return;
        this.videoSlide.classList.add('active');
        this.slides.forEach(s => s.classList.remove('active'));
        this.video.currentTime = 0;
        this.video.play().catch(() => {
            // If video fails, show first slide instead
            this.showSlide(0);
        });
        this.updateIndicators();
    }

    hideVideo() {
        if (!this.video) return;
        this.video.pause();
        this.videoSlide.classList.remove('active');
    }

    changeSlide(dir) {
        const total = this.slides.length;
        const min = this.hasVideo ? -1 : 0;

        this.currentIndex += dir;

        if (this.currentIndex < min) this.currentIndex = total - 1;
        if (this.currentIndex >= total) this.currentIndex = min;

        if (this.currentIndex === -1 && this.hasVideo) {
            this.showVideo();
        } else {
            this.hideVideo();
            this.showSlide(Math.max(0, this.currentIndex));
        }
    }

    goToSlide(i) {
        this.currentIndex = i;
        this.hideVideo();
        this.showSlide(i);
    }

    showSlide(i) {
        this.slides.forEach((s, idx) =>
            s.classList.toggle('active', idx === i)
        );
        this.updateIndicators();
    }

    updateIndicators() {
        this.indicators.forEach(ind => {
            if (ind.dataset.slide === 'video') {
                ind.classList.toggle('active', this.currentIndex === -1 && this.hasVideo);
                // Hide video indicator if no video available
                if (!this.hasVideo) {
                    ind.style.display = 'none';
                }
            } else {
                ind.classList.toggle(
                    'active',
                    parseInt(ind.dataset.slide) === this.currentIndex
                );
            }
        });
    }
}

/* INIT SLIDESHOWS */
document.querySelectorAll('.media-container').forEach(c => {
    new ProjectSlideshow(c);
});