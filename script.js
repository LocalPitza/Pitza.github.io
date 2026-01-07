/* ==============================
   DEBUG & PATH FIX FOR GITHUB PAGES
================================ */

console.log("=== THEME DEBUG ===");
console.log("LocalStorage theme:", localStorage.getItem("theme"));
console.log("Body has 'light' class?", document.body.classList.contains("light"));

// Fix for GitHub Pages path issues
function getBasePath() {
    // If we're on GitHub Pages (github.io domain)
    if (window.location.hostname.includes('github.io')) {
        const pathParts = window.location.pathname.split('/');
        // Usually pattern is: /username/repo-name/
        if (pathParts.length > 2 && pathParts[1] && pathParts[2]) {
            return '/' + pathParts[1] + '/' + pathParts[2];
        }
    }
    // Local development or root domain
    return '';
}

const basePath = getBasePath();
console.log("Base path for assets:", basePath || '(root)');

/* ==============================
   THEME SYSTEM - COMPLETE FIX
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
            // Store both themes globally
            window.themes = data;
            
            // Apply initial theme based on saved preference
            applyInitialTheme();
        })
        .catch(err => {
            console.warn("Failed to load themes.json, using fallback:", err.message);
            useFallbackThemes();
        });
}

function applyInitialTheme() {
    const savedTheme = localStorage.getItem("theme");
    console.log("Saved theme preference:", savedTheme || "none (using default)");
    
    // Default to DARK mode if not saved
    const themeToApply = savedTheme === "light" ? "light" : "dark";
    
    console.log("Applying initial theme:", themeToApply);
    applyThemeVars(themeToApply);
    
    // Set body class - REMOVE light class for dark mode
    if (themeToApply === "light") {
        document.body.classList.add("light");
    } else {
        document.body.classList.remove("light"); // Ensure light class is removed
    }
    
    // Update button text
    updateThemeButton();
}

function applyThemeVars(themeKey) {
    if (!window.themes || !window.themes[themeKey]) {
        console.error("Theme not found:", themeKey);
        return;
    }
    
    const themeData = window.themes[themeKey];
    console.log("Applying theme variables for:", themeKey, themeData);
    
    Object.entries(themeData).forEach(([key, value]) => {
        const cssVar = key.replace(/[A-Z]/g, m => "-" + m.toLowerCase());
        document.documentElement.style.setProperty(`--${cssVar}`, value);
    });
}

function useFallbackThemes() {
    console.log("Using fallback themes");
    
    // Hardcoded fallback themes (same as JSON structure)
    window.themes = {
        light: {
            'bgMain': '#f4efe9',
            'bgSecondary': '#e9e2d8',
            'bgCard': '#ded6cb',
            'accentMain': '#d08c60',
            'accentSoft': '#e0b089',
            'accentStrong': '#b36a3c',
            'textMain': '#2e2420',
            'textMuted': '#6b5c55'
        },
        dark: {
            'bgMain': '#1c1c1c',
            'bgSecondary': '#242424',
            'bgCard': '#2a2a2a',
            'accentMain': '#f4b183',
            'accentSoft': '#f6c7a1',
            'accentStrong': '#ffb070',
            'textMain': '#e6e6e6',
            'textMuted': '#b5b5b5'
        }
    };
    
    applyInitialTheme();
}

function updateThemeButton() {
    const themeToggle = document.getElementById("themeToggle");
    if (!themeToggle) return;
    
    const isLight = document.body.classList.contains("light");
    themeToggle.textContent = isLight ? "☾" : "☀";
    console.log("Theme button updated to:", themeToggle.textContent);
}

// Load theme immediately
loadThemeFromJSON();

/* ==============================
   LIGHT / DARK MODE TOGGLE - FIXED
================================ */

const themeToggle = document.getElementById("themeToggle");

if (themeToggle) {
    console.log("Theme toggle button found");
    
    // Set initial button text after a short delay
    setTimeout(() => {
        updateThemeButton();
    }, 100);
    
    themeToggle.addEventListener("click", () => {
        console.log("Theme toggle clicked!");
        
        // Toggle the light class
        document.body.classList.toggle("light");
        
        // Get current mode
        const isLight = document.body.classList.contains("light");
        const themeKey = isLight ? "light" : "dark";
        
        console.log("Switching to theme:", themeKey);
        
        // Save preference to localStorage
        localStorage.setItem("theme", themeKey);
        
        // Apply the correct theme variables
        applyThemeVars(themeKey);
        
        // Update button text
        updateThemeButton();
        
        // Log final state
        console.log("Theme switched successfully to:", themeKey);
        console.log("Body classes now:", document.body.className);
    });
} else {
    console.error("Theme toggle button NOT found!");
}

/* ==============================
   CLICK COUNTER
================================ */

let clickCount = 0;
const clickCounterElement = document.getElementById("clickCounter");
const clickCountElement = document.getElementById("clickCount");

if (clickCounterElement && clickCountElement) {
    console.log("Click counter initialized");
    
    document.body.addEventListener("click", (event) => {
        // Don't count clicks on theme toggle
        if (event.target === themeToggle || themeToggle?.contains(event.target)) {
            return;
        }
        
        clickCount++;
        clickCountElement.textContent = clickCount;
        clickCounterElement.classList.add("show");
        
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
        }
    });
}, { threshold: 0.15 });

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
        
        // Check video
        if (this.video) {
            const source = this.video.querySelector('source');
            if (source && source.src) {
                this.hasVideo = true;
            }
        }
        
        this.init();
    }

    init() {
        // Start with first image
        this.showSlide(0);
        
        // Hide video if not available
        if (!this.hasVideo && this.videoSlide) {
            this.videoSlide.style.display = 'none';
        }
        
        // Setup video if available
        if (this.video && this.hasVideo) {
            this.video.load();
            this.video.onended = () => {
                this.showSlide(0);
            };
        }

        // Event listeners
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => this.changeSlide(-1));
        }
        
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.changeSlide(1));
        }

        this.indicators.forEach(indicator => {
            indicator.addEventListener('click', () => {
                if (indicator.dataset.slide === 'video' && this.hasVideo) {
                    this.currentIndex = -1;
                    this.showVideo();
                } else if (indicator.dataset.slide !== 'video') {
                    const slideNum = parseInt(indicator.dataset.slide);
                    this.goToSlide(slideNum);
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
console.log("=== SCRIPT LOADED COMPLETELY ===");