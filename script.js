/* ==============================
   DEBUG & PATH FIX FOR GITHUB PAGES
================================ */

console.log("=== THEME PERSISTENCE DEBUG ===");
console.log("Page URL:", window.location.href);
console.log("Previous theme from localStorage:", localStorage.getItem("theme"));

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
   THEME SYSTEM - PERSISTENT ACROSS PAGES
================================ */

// Function to apply theme consistently
function applyTheme(themeKey) {
    console.log("Applying theme:", themeKey);
    
    // Apply CSS variables
    applyThemeVars(themeKey);
    
    // Set body class correctly
    if (themeKey === "light") {
        document.body.classList.add("light");
    } else {
        document.body.classList.remove("light");
    }
    
    // Update theme button text
    updateThemeButton();
    
    // Save to localStorage
    localStorage.setItem("theme", themeKey);
    
    // Update audio system if it exists
    if (typeof audioSystem !== 'undefined' && audioSystem.switchTheme) {
        console.log("Updating audio system theme to:", themeKey);
        audioSystem.switchTheme(themeKey);
    }
}

// Load theme from JSON with persistence
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
    // Get saved theme from localStorage
    const savedTheme = localStorage.getItem("theme");
    console.log("Saved theme preference from localStorage:", savedTheme || "none");
    
    // Default to dark mode if not saved
    const themeToApply = savedTheme === "light" ? "light" : "dark";
    
    console.log("Applying initial theme:", themeToApply);
    applyTheme(themeToApply);
}

function applyThemeVars(themeKey) {
    if (!window.themes || !window.themes[themeKey]) {
        console.error("Theme not found:", themeKey);
        return;
    }
    
    const themeData = window.themes[themeKey];
    console.log("Applying theme variables for:", themeKey);
    
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
    // Button shows what you'll switch TO
    themeToggle.textContent = isLight ? "☾" : "☀";
    console.log("Theme button updated. Current mode:", isLight ? "light" : "dark");
}

/* ==============================
   THEME TOGGLE - FIXED FOR ALL PAGES
================================ */

function initializeThemeToggle() {
    const themeToggle = document.getElementById("themeToggle");
    
    if (themeToggle) {
        console.log("Theme toggle button found on this page");
        
        // Set initial button text
        setTimeout(() => {
            updateThemeButton();
        }, 100);
        
        themeToggle.addEventListener("click", () => {
            console.log("Theme toggle clicked!");
            
            // Get current mode
            const isCurrentlyLight = document.body.classList.contains("light");
            const newTheme = isCurrentlyLight ? "dark" : "light";
            
            console.log("Switching from", isCurrentlyLight ? "light" : "dark", "to", newTheme);
            
            // Apply the new theme
            applyTheme(newTheme);
            
            console.log("Theme switched successfully to:", newTheme);
        });
    } else {
        console.warn("Theme toggle button NOT found on this page!");
    }
}

/* ==============================
   CLICK COUNTER - PERSISTENT
================================ */

function initializeClickCounter() {
    let clickCount = 0;
    const clickCounterElement = document.getElementById("clickCounter");
    const clickCountElement = document.getElementById("clickCount");
    const themeToggle = document.getElementById("themeToggle");

    // Try to get saved click count
    const savedClicks = localStorage.getItem("totalClicks");
    if (savedClicks) {
        clickCount = parseInt(savedClicks);
        console.log("Loaded saved click count:", clickCount);
    } else {
        console.log("No saved click count found, starting from 0");
    }

    if (clickCounterElement && clickCountElement) {
        console.log("Click counter initialized");
        
        // Initialize display
        clickCountElement.textContent = clickCount;
        
        document.body.addEventListener("click", (event) => {
            // Don't count clicks on theme toggle
            if (event.target === themeToggle || themeToggle?.contains(event.target)) {
                return;
            }
            
            clickCount++;
            clickCountElement.textContent = clickCount;
            
            // Save to localStorage
            localStorage.setItem("totalClicks", clickCount.toString());
            
            clickCounterElement.classList.add("show");
            
            setTimeout(() => {
                clickCounterElement.classList.remove("show");
            }, 1200);
        });
    } else {
        console.log("Click counter elements not found on this page");
    }
}

/* ==============================
   SCROLL REVEAL ANIMATIONS
================================ */

function initializeScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("reveal");
            }
        });
    }, { threshold: 0.15 });

    const elementsToObserve = document.querySelectorAll("section, .project, .featured-project");
    if (elementsToObserve.length > 0) {
        elementsToObserve.forEach(el => {
            observer.observe(el);
        });
        console.log("Scroll observer initialized for", elementsToObserve.length, "elements");
    } else {
        console.log("No elements found for scroll animation");
    }
}

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

function initializeSlideshows() {
    const slideshowContainers = document.querySelectorAll('.media-container');
    if (slideshowContainers.length > 0) {
        slideshowContainers.forEach(container => {
            new ProjectSlideshow(container);
        });
        console.log("Slideshows initialized for", slideshowContainers.length, "containers");
    } else {
        console.log("No slideshow containers found on this page");
    }
}

/* ==============================
   HOVER DEBUG (Temporary - remove after fixing)
================================ */

function initializeHoverDebug() {
    console.log("=== HOVER DEBUG ===");
    
    // Check which elements have pointer-events: none
    setTimeout(() => {
        const allElements = document.querySelectorAll('*');
        const problematic = [];
        
        allElements.forEach(el => {
            const style = window.getComputedStyle(el);
            if (style.pointerEvents === 'none' && 
                (el.tagName === 'A' || el.tagName === 'BUTTON' || 
                 el.classList.contains('clickable') || 
                 el.hasAttribute('onclick'))) {
                problematic.push(el);
                console.warn("Element with pointer-events: none that should be clickable:", el);
            }
        });
        
        if (problematic.length > 0) {
            console.warn(`Found ${problematic.length} problematic elements`);
            // Temporarily fix them
            problematic.forEach(el => {
                el.style.pointerEvents = 'auto';
                el.style.zIndex = '100';
            });
        }
    }, 1000);
}

/* ==============================
   INITIALIZE EVERYTHING ON PAGE LOAD
================================ */

document.addEventListener('DOMContentLoaded', () => {
    console.log("=== INITIALIZING PAGE ===");
    console.log("Current page:", window.location.pathname);
    
    // Load and apply theme first (this is most important)
    loadThemeFromJSON();
    
    // Initialize theme toggle
    initializeThemeToggle();
    
    // Initialize click counter (if exists on this page)
    initializeClickCounter();
    
    // Initialize scroll animations
    initializeScrollAnimations();
    
    // Initialize slideshows (if exists on this page)
    initializeSlideshows();
    
    // Temporary hover debug
    initializeHoverDebug();
    
    console.log("=== PAGE INITIALIZATION COMPLETE ===");
});

/* ==============================
   FALLBACK: If DOMContentLoaded already fired
================================ */

// Check if document is already loaded
if (document.readyState === 'loading') {
    // Loading, wait for DOMContentLoaded
    console.log("Document still loading, waiting for DOMContentLoaded");
} else {
    // DOM already loaded, initialize immediately
    console.log("DOM already loaded, initializing immediately");
    document.dispatchEvent(new Event('DOMContentLoaded'));
}