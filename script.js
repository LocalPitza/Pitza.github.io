console.log("=== THEME DEBUG ===");
console.log("LocalStorage theme:", localStorage.getItem("theme"));
console.log("Body has 'light' class?", document.body.classList.contains("light"));

function getBasePath() {
    if (window.location.hostname.includes('github.io')) {
        const pathParts = window.location.pathname.split('/');
        if (pathParts.length > 2 && pathParts[1] && pathParts[2]) {
            return '/' + pathParts[1] + '/' + pathParts[2];
        }
    }
    return '';
}

const basePath = getBasePath();
console.log("Base path for assets:", basePath || '(root)');

/* ==============================
   THEME FROM JSON
================================ */

function loadThemeFromJSON() {
    const jsonPath = basePath ? `${basePath}/themes.json` : 'themes.json';
    console.log("Loading theme from:", jsonPath);
    
    fetch(jsonPath)
        .then(res => {
            console.log("Theme fetch status:", res.status);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        })
        .then(data => {
            console.log("Theme JSON loaded successfully");
            applyTheme(data.pastelOrange);
        })
        .catch(err => {
            console.warn("Failed to load themes.json, using fallback:", err.message);
            // FALLBACK THEME (matches your JSON)
            const fallbackTheme = {
                'bg-main': '#f4efe9',
                'bg-secondary': '#e9e2d8',
                'bg-card': '#ded6cb',
                'accent-main': '#d08c60',
                'accent-soft': '#e0b089',
                'accent-strong': '#b36a3c',
                'text-main': '#2e2420',
                'text-muted': '#6b5c55'
            };
            applyTheme(fallbackTheme);
        });
}

function applyTheme(themeData) {
    console.log("Applying theme:", themeData);
    Object.entries(themeData).forEach(([key, value]) => {
        // Convert camelCase to kebab-case for CSS variables
        const cssVar = key.replace(/[A-Z]/g, m => "-" + m.toLowerCase());
        document.documentElement.style.setProperty(`--${cssVar}`, value);
    });
    console.log("Theme variables applied");
}

// Load theme immediately
loadThemeFromJSON();

/* ==============================
   LIGHT / DARK MODE TOGGLE
================================ */

const themeToggle = document.getElementById("themeToggle");
const savedTheme = localStorage.getItem("theme");

console.log("Initial saved theme:", savedTheme);

// Apply saved theme on load
if (savedTheme === "light") {
    document.body.classList.add("light");
    console.log("Applied light theme from localStorage");
} else {
    document.body.classList.remove("light");
    console.log("Applied dark theme (default)");
}

// Toggle functionality
if (themeToggle) {
    console.log("Theme toggle button found");
    
    themeToggle.addEventListener("click", () => {
        console.log("Toggle clicked!");
        
        // Toggle the class
        document.body.classList.toggle("light");
        
        // Save preference
        const isLight = document.body.classList.contains("light");
        localStorage.setItem("theme", isLight ? "light" : "dark");
        
        console.log("Theme toggled to:", isLight ? "light" : "dark");
        console.log("Body classes:", document.body.className);
        
        // Optional: Visual feedback
        themeToggle.textContent = isLight ? "☾" : "☀";
    });
    
    // Set initial button text
    const isLightInitially = document.body.classList.contains("light");
    themeToggle.textContent = isLightInitially ? "☾" : "☀";
} else {
    console.error("Theme toggle button NOT found!");
}

/* ==============================
   CLICK COUNTER
================================ */

let clickCount = 0;
const clickCounterElement = document.getElementById("clickCounter");
const clickCountElement = document.getElementById("clickCount");

console.log("Click counter elements:", {
    counter: clickCounterElement,
    count: clickCountElement
});

if (clickCounterElement && clickCountElement) {
    document.body.addEventListener("click", (event) => {
        // Don't count clicks on theme toggle
        if (event.target === themeToggle || themeToggle.contains(event.target)) {
            return;
        }
        
        clickCount++;
        clickCountElement.textContent = clickCount;
        clickCounterElement.classList.add("show");
        
        console.log("Click registered, total:", clickCount);
        
        setTimeout(() => {
            clickCounterElement.classList.remove("show");
        }, 1200);
    });
    
    // Initialize display
    clickCountElement.textContent = clickCount;
}

/* ==============================
   SCROLL REVEAL ANIMATION
================================ */

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("reveal");
            console.log("Element revealed:", entry.target);
        }
    });
}, { threshold: 0.15 });

// Observe all sections and projects
document.querySelectorAll("section, .project").forEach(el => {
    observer.observe(el);
});

console.log("Scroll observer initialized");

/* ==============================
   PROJECT SLIDESHOW SYSTEM
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
        
        console.log(`Slideshow initialized for ${this.mode} mode`);
        
        // Check video
        if (this.video) {
            const source = this.video.querySelector('source');
            if (source && source.src) {
                // Check if video exists by trying to load it
                this.checkVideoExists(source.src).then(exists => {
                    this.hasVideo = exists;
                    this.init();
                }).catch(() => {
                    this.hasVideo = false;
                    this.init();
                });
            } else {
                this.hasVideo = false;
                this.init();
            }
        } else {
            this.init();
        }
    }

    async checkVideoExists(url) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch {
            return false;
        }
    }

    init() {
        console.log(`Slideshow init - Has video: ${this.hasVideo}`);
        
        // Always start with first image
        this.showSlide(0);
        
        // Hide video if not available
        if (!this.hasVideo && this.videoSlide) {
            this.videoSlide.style.display = 'none';
        }
        
        // Setup video if available
        if (this.video && this.hasVideo) {
            this.video.load(); // Preload
            this.video.onended = () => {
                console.log("Video ended, showing first slide");
                this.showSlide(0);
            };
        }

        // Event listeners
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => {
                console.log("Previous button clicked");
                this.changeSlide(-1);
            });
        }
        
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => {
                console.log("Next button clicked");
                this.changeSlide(1);
            });
        }

        this.indicators.forEach(indicator => {
            indicator.addEventListener('click', () => {
                if (indicator.dataset.slide === 'video' && this.hasVideo) {
                    console.log("Video indicator clicked");
                    this.currentIndex = -1;
                    this.showVideo();
                } else if (indicator.dataset.slide !== 'video') {
                    const slideNum = parseInt(indicator.dataset.slide);
                    console.log(`Slide ${slideNum} indicator clicked`);
                    this.goToSlide(slideNum);
                }
            });
        });
    }

    showVideo() {
        if (!this.hasVideo) {
            console.warn("showVideo called but hasVideo is false");
            return;
        }
        
        console.log("Showing video");
        this.videoSlide.classList.add('active');
        this.slides.forEach(s => s.classList.remove('active'));
        
        this.video.currentTime = 0;
        this.video.play().catch(err => {
            console.warn("Video play failed:", err);
            this.showSlide(0);
        });
        
        this.updateIndicators();
    }

    hideVideo() {
        if (this.video) {
            this.video.pause();
            this.videoSlide.classList.remove('active');
        }
    }

    changeSlide(dir) {
        const total = this.slides.length;
        const min = this.hasVideo ? -1 : 0;

        this.currentIndex += dir;

        if (this.currentIndex < min) this.currentIndex = total - 1;
        if (this.currentIndex >= total) this.currentIndex = min;

        console.log(`Changing slide to index: ${this.currentIndex}`);

        if (this.currentIndex === -1 && this.hasVideo) {
            this.showVideo();
        } else {
            this.hideVideo();
            this.showSlide(Math.max(0, this.currentIndex));
        }
    }

    goToSlide(i) {
        console.log(`Going directly to slide ${i}`);
        this.currentIndex = i;
        this.hideVideo();
        this.showSlide(i);
    }

    showSlide(i) {
        console.log(`Showing slide ${i}`);
        this.slides.forEach((s, idx) => {
            s.classList.toggle('active', idx === i);
        });
        this.updateIndicators();
    }

    updateIndicators() {
        this.indicators.forEach(ind => {
            if (ind.dataset.slide === 'video') {
                ind.classList.toggle('active', this.currentIndex === -1 && this.hasVideo);
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

// Initialize all slideshows
document.querySelectorAll('.media-container').forEach(container => {
    new ProjectSlideshow(container);
});

console.log("All slideshows initialized");

/* ==============================
   FINAL INIT LOG
================================ */

console.log("=== SCRIPT LOADED SUCCESSFULLY ===");
console.log("Page URL:", window.location.href);
console.log("User agent:", navigator.userAgent);