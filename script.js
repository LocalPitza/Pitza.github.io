/* ==============================
   DEBUG & PATH FIX FOR GITHUB PAGES
================================ */

console.log("=== THEME PERSISTENCE DEBUG ===");
console.log("Page URL:", window.location.href);
console.log("Previous theme from localStorage:", localStorage.getItem("theme"));

// Fix for GitHub Pages path issues
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
   DEVLOG CMS AUTHENTICATION SYSTEM
================================ */

const MASTER_PASSWORD = "TestMaster";
let isAuthenticated = localStorage.getItem('devlog_auth') === 'true';
const DEVLOGS_STORAGE_KEY = 'janmar_devlogs_data';
const MAX_DEVLOGS = 5; // Maximum number of devlogs allowed

/* ==============================
   AUTHENTICATION FUNCTIONS
================================ */

function initializeAuthSystem() {
    const authToggle = document.getElementById('authToggle');
    const authModal = document.getElementById('authModal');
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const closeModal = document.querySelector('.close-modal');
    
    if (authToggle) {
        updateAuthButton();
        
        authToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (isAuthenticated) {
                if (confirm('Are you sure you want to log out?')) {
                    logout();
                }
            } else {
                authModal.style.display = 'block';
            }
        });
    }
    
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const password = document.getElementById('masterPassword').value;
            
            if (password === MASTER_PASSWORD) {
                login();
                authModal.style.display = 'none';
                loginForm.reset();
                showNotification('Login successful!', 'success');
            } else {
                showNotification('Incorrect password!', 'error');
                document.getElementById('masterPassword').value = '';
                document.getElementById('masterPassword').focus();
            }
        });
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            authModal.style.display = 'none';
        });
    }
    
    window.addEventListener('click', (e) => {
        if (e.target === authModal) {
            authModal.style.display = 'none';
        }
    });
}

    
function getDevlogs() {
    try {
        const stored = localStorage.getItem(DEVLOGS_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            return Array.isArray(parsed) ? parsed : [];
        } else {
            localStorage.setItem(DEVLOGS_STORAGE_KEY, JSON.stringify(defaultDevlogs));
            return defaultDevlogs;
        }
    } catch (error) {
        console.error('Error loading devlogs:', error);
        return [];
    }
}

function saveDevlogs(devlogs) {
    try {
        localStorage.setItem(DEVLOGS_STORAGE_KEY, JSON.stringify(devlogs));
        return true;
    } catch (error) {
        console.error('Error saving devlogs:', error);
        showNotification('Failed to save devlogs!', 'error');
        return false;
    }
}

function generateDevlogId() {
    const devlogs = getDevlogs();
    if (devlogs.length === 0) return 1;
    const maxId = devlogs.reduce((max, devlog) => Math.max(max, devlog.id), 0);
    return maxId + 1;
}

function exportDevlogs() {
    const devlogs = getDevlogs();
    const dataStr = JSON.stringify(devlogs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `devlogs-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showNotification('Devlogs exported successfully!', 'success');
}

function importDevlogs(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (Array.isArray(imported)) {
                const existing = getDevlogs();
                const merged = [...existing];
                
                imported.forEach(newDevlog => {
                    const exists = merged.some(d => d.id === newDevlog.id);
                    if (!exists) {
                        merged.push(newDevlog);
                    }
                });
                
                merged.sort((a, b) => b.id - a.id);
                
                if (saveDevlogs(merged)) {
                    showNotification('Devlogs imported successfully!', 'success');
                    if (window.location.pathname.includes('devlogs.html')) {
                        loadDevlogsForEditing();
                        renderDevlogs();
                    }
                }
            } else {
                showNotification('Invalid devlog file format!', 'error');
            }
        } catch (error) {
            showNotification('Error parsing devlog file!', 'error');
            console.error('Import error:', error);
        }
    };
    reader.readAsText(file);
}

/* ==============================
   DEVLOG EDITOR FUNCTIONS
================================ */

function initializeDevlogEditor() {
    const editorSection = document.getElementById('devlogEditor');
    const newDevlogBtn = document.getElementById('newDevlogBtn');
    const devlogForm = document.getElementById('devlogForm');
    const cancelBtn = document.getElementById('cancelDevlog');
    const imageUpload = document.getElementById('devlogImages');
    const previewContainer = document.getElementById('imagePreview');
    const exportBtn = document.getElementById('exportDevlogs');
    const importBtn = document.getElementById('importDevlogs');
    const importInput = document.getElementById('importFile');
    
    if (!editorSection || !isAuthenticated) return;
    
    console.log('Initializing devlog editor...');
    
    editorSection.style.display = 'block';
    
    if (newDevlogBtn) {
        newDevlogBtn.addEventListener('click', () => {
            // Check devlog limit
            const devlogs = getDevlogs();
            if (devlogs.length >= MAX_DEVLOGS) {
                showNotification(`Maximum of ${MAX_DEVLOGS} devlogs allowed! Please delete one first.`, 'error');
                return;
            }
            
            resetDevlogForm();
            devlogForm.style.display = 'block';
            newDevlogBtn.style.display = 'none';
            window.scrollTo({
                top: editorSection.offsetTop - 20,
                behavior: 'smooth'
            });
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            devlogForm.style.display = 'none';
            if (newDevlogBtn) newDevlogBtn.style.display = 'block';
            resetDevlogForm();
        });
    }
    
    if (devlogForm) {
        devlogForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveDevlog();
        });
    }
    
    if (imageUpload) {
        imageUpload.addEventListener('change', (e) => {
            previewContainer.innerHTML = '';
            const files = Array.from(e.target.files);
            
            files.forEach((file, index) => {
                if (!file.type.startsWith('image/')) {
                    showNotification(`File ${file.name} is not an image!`, 'error');
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = (event) => {
                    const preview = document.createElement('div');
                    preview.className = 'image-preview-item';
                    preview.innerHTML = `
                        <img src="${event.target.result}" alt="Preview ${index + 1}">
                        <button type="button" class="remove-image" data-index="${index}">×</button>
                        <input type="text" class="image-caption" placeholder="Image caption (optional)">
                    `;
                    previewContainer.appendChild(preview);
                    
                    preview.querySelector('.remove-image').addEventListener('click', () => {
                        preview.remove();
                        const dt = new DataTransfer();
                        const remainingFiles = Array.from(imageUpload.files).filter((_, i) => i !== index);
                        remainingFiles.forEach(file => dt.items.add(file));
                        imageUpload.files = dt.files;
                    });
                };
                reader.readAsDataURL(file);
            });
        });
    }
    
    if (exportBtn) {
        exportBtn.addEventListener('click', exportDevlogs);
    }
    
    if (importBtn && importInput) {
        importBtn.addEventListener('click', () => importInput.click());
        importInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                if (confirm('Import devlogs from file? This will add to existing devlogs.')) {
                    importDevlogs(e.target.files[0]);
                    e.target.value = '';
                }
            }
        });
    }
    
    loadDevlogsForEditing();
    updateDevlogCounter();
}

function resetDevlogForm() {
    const form = document.getElementById('devlogForm');
    if (!form) return;
    
    form.reset();
    form.dataset.editingId = '';
    
    const preview = document.getElementById('imagePreview');
    if (preview) preview.innerHTML = '';
    
    const fileInput = document.getElementById('devlogImages');
    if (fileInput) fileInput.value = '';
    
    const statusSelect = document.getElementById('devlogStatus');
    if (statusSelect) statusSelect.value = 'In Progress';
    
    const categorySelect = document.getElementById('devlogCategory');
    if (categorySelect) categorySelect.value = 'Game Development';
}

function updateDevlogCounter() {
    const devlogs = getDevlogs();
    const newBtn = document.getElementById('newDevlogBtn');
    
    if (newBtn) {
        const count = devlogs.length;
        if (count >= MAX_DEVLOGS) {
            newBtn.textContent = `✨ Limit Reached (${count}/${MAX_DEVLOGS})`;
            newBtn.disabled = true;
            newBtn.style.opacity = '0.5';
            newBtn.style.cursor = 'not-allowed';
        } else {
            newBtn.textContent = `✨ Create New DevLog (${count}/${MAX_DEVLOGS})`;
            newBtn.disabled = false;
            newBtn.style.opacity = '1';
            newBtn.style.cursor = 'pointer';
        }
    }
}

function loadDevlogsForEditing() {
    const devlogList = document.getElementById('devlogList');
    if (!devlogList) return;
    
    const devlogs = getDevlogs();
    devlogList.innerHTML = '';
    
    if (devlogs.length === 0) {
        devlogList.innerHTML = `
            <div class="no-devlogs-message">
                <p>📝 No devlogs yet. Ready to create your first one?</p>
                <p class="hint">Click the "Create New Devlog" button above to get started!</p>
            </div>
        `;
        return;
    }
    
    const sortedDevlogs = [...devlogs].sort((a, b) => {
        const dateA = new Date(a.updated || a.created || '1970-01-01');
        const dateB = new Date(b.updated || b.created || '1970-01-01');
        return dateB - dateA;
    });
    
    sortedDevlogs.forEach(devlog => {
        const devlogItem = document.createElement('div');
        devlogItem.className = 'devlog-item';
        
        const displayDate = devlog.date || devlog.updated || devlog.created || 'No date';
        
        devlogItem.innerHTML = `
            <div class="devlog-item-header">
                <h4>${devlog.title}</h4>
                <span class="devlog-meta">${displayDate} • ${devlog.category || 'Uncategorized'} • ${devlog.status || 'Unknown'}</span>
            </div>
            <div class="devlog-item-actions">
                <button class="edit-devlog" data-id="${devlog.id}">✏️ Edit</button>
                <button class="delete-devlog" data-id="${devlog.id}">🗑️ Delete</button>
            </div>
        `;
        
        devlogList.appendChild(devlogItem);
    });
    
    document.querySelectorAll('.edit-devlog').forEach(btn => {
        btn.addEventListener('click', () => editDevlog(parseInt(btn.dataset.id)));
    });
    
    document.querySelectorAll('.delete-devlog').forEach(btn => {
        btn.addEventListener('click', () => deleteDevlog(parseInt(btn.dataset.id)));
    });
    
    updateDevlogCounter();
}

function editDevlog(id) {
    const devlogs = getDevlogs();
    const devlog = devlogs.find(d => d.id === id);
    if (!devlog) return;
    
    document.getElementById('devlogTitle').value = devlog.title || '';
    document.getElementById('devlogDate').value = devlog.date || '';
    document.getElementById('devlogCategory').value = devlog.category || 'Game Development';
    document.getElementById('devlogStatus').value = devlog.status || 'In Progress';
    
    if (devlog.content) {
        document.getElementById('devlogVision').value = devlog.content.vision || '';
        document.getElementById('devlogChallenges').value = Array.isArray(devlog.content.challenges) 
            ? devlog.content.challenges.join('\n') 
            : (devlog.content.challenges || '');
        document.getElementById('devlogMilestones').value = Array.isArray(devlog.content.milestones) 
            ? devlog.content.milestones.join('\n') 
            : (devlog.content.milestones || '');
        document.getElementById('devlogTakeaways').value = devlog.content.takeaways || '';
        document.getElementById('devlogCurrent').value = devlog.content.current || '';
    }
    
    const form = document.getElementById('devlogForm');
    form.dataset.editingId = id;
    
    form.style.display = 'block';
    const newBtn = document.getElementById('newDevlogBtn');
    if (newBtn) newBtn.style.display = 'none';
    
    window.scrollTo({
        top: form.offsetTop - 20,
        behavior: 'smooth'
    });
    
    showNotification(`Editing: ${devlog.title}`, 'info');
}

function deleteDevlog(id) {
    const devlogs = getDevlogs();
    const devlog = devlogs.find(d => d.id === id);
    
    if (!devlog) return;
    
    if (!confirm(`Are you sure you want to delete "${devlog.title}"?\n\nThis action cannot be undone.`)) {
        return;
    }
    
    const filtered = devlogs.filter(d => d.id !== id);
    
    if (saveDevlogs(filtered)) {
        showNotification(`Deleted: ${devlog.title}`, 'success');
        loadDevlogsForEditing();
        if (typeof renderDevlogs === 'function') {
            renderDevlogs();
        }
    }
}

function saveDevlog() {
    const form = document.getElementById('devlogForm');
    const editingId = form.dataset.editingId;
    
    const title = document.getElementById('devlogTitle').value.trim();
    const date = document.getElementById('devlogDate').value.trim();
    const category = document.getElementById('devlogCategory').value;
    const status = document.getElementById('devlogStatus').value;
    const vision = document.getElementById('devlogVision').value.trim();
    const challenges = document.getElementById('devlogChallenges').value.trim();
    const milestones = document.getElementById('devlogMilestones').value.trim();
    const takeaways = document.getElementById('devlogTakeaways').value.trim();
    const current = document.getElementById('devlogCurrent').value.trim();
    
    if (!title) {
        showNotification('Please enter a title!', 'error');
        document.getElementById('devlogTitle').focus();
        return;
    }
    
    if (!date) {
        showNotification('Please enter a date!', 'error');
        document.getElementById('devlogDate').focus();
        return;
    }
    
    let content = {};
    
    if (vision) content.vision = vision;
    if (takeaways) content.takeaways = takeaways;
    if (current) content.current = current;
    
    if (challenges) {
        content.challenges = challenges.split('\n')
            .filter(line => line.trim() !== '')
            .map(line => line.trim());
    }
    
    if (milestones) {
        content.milestones = milestones.split('\n')
            .filter(line => line.trim() !== '')
            .map(line => line.trim());
    }
    
    const imageFiles = document.getElementById('devlogImages').files;
    const imageNames = [];
    for (let i = 0; i < imageFiles.length; i++) {
        imageNames.push(imageFiles[i].name);
    }
    
    let devlogs = getDevlogs();
    const now = new Date().toISOString().split('T')[0];
    
    if (editingId) {
        const index = devlogs.findIndex(d => d.id === parseInt(editingId));
        if (index !== -1) {
            const existingImages = imageNames.length > 0 ? imageNames : devlogs[index].images || [];
            
            devlogs[index] = {
                ...devlogs[index],
                title,
                date,
                category,
                status,
                content,
                images: existingImages,
                updated: now
            };
        }
    } else {
        // Check limit for new devlog
        if (devlogs.length >= MAX_DEVLOGS) {
            showNotification(`Cannot create devlog: Maximum of ${MAX_DEVLOGS} devlogs allowed!`, 'error');
            return;
        }
        
        const newDevlog = {
            id: generateDevlogId(),
            title,
            date,
            category,
            status,
            content,
            images: imageNames,
            created: now,
            updated: now
        };
        devlogs.unshift(newDevlog);
    }
    
    if (saveDevlogs(devlogs)) {
        showNotification(
            editingId ? 'Devlog updated successfully!' : 'Devlog created successfully!',
            'success'
        );
        
        resetDevlogForm();
        document.getElementById('devlogForm').style.display = 'none';
        const newBtn = document.getElementById('newDevlogBtn');
        if (newBtn) newBtn.style.display = 'block';
        
        loadDevlogsForEditing();
        
        if (typeof renderDevlogs === 'function') {
            renderDevlogs();
        }
        
        const fileInput = document.getElementById('devlogImages');
        if (fileInput) fileInput.value = '';
    }
}

/* ==============================
   DEVLOG RENDERER (For devlogs.html)
================================ */

function initializeDevlogRenderer() {
    if (!window.location.pathname.includes('devlogs.html')) return;
    
    console.log('Initializing devlog renderer...');
    renderDevlogs();
}

function renderDevlogs() {
    const container = document.getElementById('devlogs-container');
    if (!container) return;
    
    const devlogs = getDevlogs();
    
    if (devlogs.length === 0) {
        container.innerHTML = `
            <div class="empty-devlogs-message">
                <h3>🚀 Welcome to DevLogs!</h3>
                <p>No devlogs have been created yet or they've all been removed!.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    const sortedDevlogs = [...devlogs].sort((a, b) => {
        const dateA = new Date(a.updated || a.created || '1970-01-01');
        const dateB = new Date(b.updated || b.created || '1970-01-01');
        return dateB - dateA;
    });
    
    sortedDevlogs.forEach((devlog, index) => {
        const devlogElement = createDevlogElement(devlog, index);
        container.appendChild(devlogElement);
    });
    
    initializeSlideshows();
}

function createDevlogElement(devlog, index) {
    const div = document.createElement('div');
    div.className = 'project';
    
    let slideshowHTML = '';
    if (devlog.images && devlog.images.length > 0) {
        slideshowHTML = `
            <div class="media-container">
                <div class="slideshow">
                    ${devlog.images.map((img, i) => `
                        <div class="slide ${i === 0 ? 'active' : ''}">
                            <div class="image-placeholder">
                                <span class="image-info">${img}</span>
                                <p class="image-note">🖼️ Image would be displayed here</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
                ${devlog.images.length > 1 ? `
                    <div class="slide-indicators">
                        ${devlog.images.map((_, i) => `
                            <div class="indicator ${i === 0 ? 'active' : ''}" data-slide="${i}"></div>
                        `).join('')}
                    </div>
                    <div class="slideshow-controls">
                        <button class="prev">◄</button>
                        <button class="next">►</button>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    let contentHTML = '';
    
    if (devlog.content) {
        if (devlog.content.vision) {
            contentHTML += `
                <h4>Project Vision</h4>
                <p>${devlog.content.vision}</p>
            `;
        }
        
        if (devlog.content.challenges && devlog.content.challenges.length > 0) {
            contentHTML += `
                <h4>Challenges & Solutions</h4>
                <ul>
                    ${devlog.content.challenges.map(challenge => 
                        `<li>${challenge.includes(':') ? 
                            `<strong>${challenge.split(':')[0]}:</strong> ${challenge.split(':').slice(1).join(':')}` : 
                            challenge}</li>`
                    ).join('')}
                </ul>
            `;
        }
        
        if (devlog.content.milestones && devlog.content.milestones.length > 0) {
            contentHTML += `
                <h4>Development Milestones</h4>
                <ul>
                    ${devlog.content.milestones.map(milestone => 
                        `<li>${milestone.includes(':') ? 
                            `<strong>${milestone.split(':')[0]}:</strong> ${milestone.split(':').slice(1).join(':')}` : 
                            milestone}</li>`
                    ).join('')}
                </ul>
            `;
        }
        
        if (devlog.content.current) {
            contentHTML += `
                <h4>Current Focus</h4>
                <p>${devlog.content.current}</p>
            `;
        }
        
        if (devlog.content.takeaways) {
            contentHTML += `
                <h4>Key Takeaways</h4>
                <p>${devlog.content.takeaways}</p>
            `;
        }
    }
    
    if (!contentHTML && devlog.content) {
        contentHTML = `
            <p>${JSON.stringify(devlog.content, null, 2)}</p>
        `;
    }
    
    div.innerHTML = `
        <h3>${devlog.title || 'Untitled Devlog'}</h3>
        <p class="project-meta">
            Posted: ${devlog.date || 'No date'} • 
            Category: ${devlog.category || 'Game Development'} • 
            Status: ${devlog.status || 'Unknown'}
        </p>
        
        ${slideshowHTML}
        
        <div class="devlog-content">
            ${contentHTML || '<p>No content added yet.</p>'}
        </div>
        
        ${isAuthenticated ? `
            <div class="devlog-admin-info">
                <small>ID: ${devlog.id} | Created: ${devlog.created || 'Unknown'} | Updated: ${devlog.updated || devlog.created || 'Unknown'}</small>
            </div>
        ` : ''}
    `;
    
    return div;
}

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
    
    fetch(jsonPath, { cache: 'no-store' })
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
            'bgMain': '#f3f4ed',
            'bgSecondary': '#ffffff',
            'bgCard': '#e5eee8',
            'accentMain': '#167e73',
            'accentSoft': '#a66b13',
            'accentStrong': '#c84c42',
            'textMain': '#1e302d',
            'textMuted': '#526662'
        },
        dark: {
            'bgMain': '#141b1d',
            'bgSecondary': '#202b2d',
            'bgCard': '#29383a',
            'accentMain': '#79d6c4',
            'accentSoft': '#ffd166',
            'accentStrong': '#ff8066',
            'textMain': '#f2f4ec',
            'textMuted': '#adbfba'
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
        // Hide video if not available
        if (!this.hasVideo && this.videoSlide) {
            this.videoSlide.style.display = 'none';
        }

        // Video is the first slide when one is available.
        if (this.hasVideo && this.container.dataset.autoplay !== 'false') {
            this.currentIndex = -1;
            this.showVideo();
        } else {
            this.showSlide(0);
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
   DROPDOWN INITIALIZATION - ENHANCED
================================ */

function initializeDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown');
    
    dropdowns.forEach(dropdown => {
        const toggle = dropdown.querySelector('.dropdown-toggle');
        const menu = dropdown.querySelector('.dropdown-menu');
        
        if (toggle && menu) {
            // Toggle on click for mobile
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                
                // Check if we're on mobile
                const isMobile = window.innerWidth <= 768;
                
                if (isMobile) {
                    const isOpen = menu.style.opacity === '1' || 
                                   menu.style.visibility === 'visible';
                    
                    // Close all other dropdowns first
                    document.querySelectorAll('.dropdown-menu').forEach(otherMenu => {
                        if (otherMenu !== menu) {
                            otherMenu.style.opacity = '0';
                            otherMenu.style.visibility = 'hidden';
                        }
                    });
                    
                    // Toggle current dropdown
                    if (isOpen) {
                        closeDropdown(menu);
                    } else {
                        openDropdown(menu);
                    }
                }
                // On desktop, we rely on :hover
            });
            
            // Make sure dropdown closes when clicking elsewhere
            document.addEventListener('click', (e) => {
                if (!dropdown.contains(e.target)) {
                    closeDropdown(menu);
                }
            });
            
            // Prevent menu from closing when clicking inside
            menu.addEventListener('click', (e) => {
                e.stopPropagation();
            });
            
            // Close dropdown when pressing Escape
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    closeDropdown(menu);
                }
            });
            
            // Handle window resize
            let resizeTimer;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(() => {
                    // Close all dropdowns on resize
                    closeDropdown(menu);
                }, 250);
            });
        }
    });
    
    function openDropdown(menu) {
        requestAnimationFrame(() => {
            menu.style.opacity = '1';
            menu.style.visibility = 'visible';
            menu.style.transform = window.innerWidth <= 768 ? 
                'translateX(-50%) translateY(0)' : 'translateY(0)';
            menu.style.pointerEvents = 'auto';
        });
    }
    
    function closeDropdown(menu) {
        requestAnimationFrame(() => {
            menu.style.opacity = '0';
            menu.style.visibility = 'hidden';
            menu.style.transform = window.innerWidth <= 768 ? 
                'translateX(-50%) translateY(-10px)' : 'translateY(-10px)';
            menu.style.pointerEvents = 'none';
        });
    }
    
    // Close dropdowns when scrolling (optional)
    let scrollTimer;
    window.addEventListener('scroll', () => {
        // Only close on mobile where dropdowns are click-based
        if (window.innerWidth <= 768) {
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                document.querySelectorAll('.dropdown-menu').forEach(menu => {
                    closeDropdown(menu);
                });
            }, 100);
        }
    });
}

function initializeFeaturedProjectPicker() {
    const projectButtons = document.querySelectorAll('.featured-project-card');
    const projectView = document.querySelector('[data-portfolio-view="projects"]');
    const layout = document.querySelector('.featured-project-layout');
    const picker = document.querySelector('.featured-project-picker');
    const prompt = document.querySelector('.project-picker-prompt');
    const spotlight = document.querySelector('.project-spotlight');
    const mediaPicker = document.getElementById('projectMediaPicker');
    const detailImage = document.getElementById('projectDetailImage');
    const detailVideo = document.getElementById('projectDetailVideo');
    if (!projectButtons.length || !projectView || !layout || !picker || !spotlight || !mediaPicker || !detailImage || !detailVideo) return;

    const projects = {
        'lost-voices': {
            index: '01',
            title: 'Lost Voices',
            images: [
                'assets/images/project1-screenshot1.png',
                'assets/images/project1-screenshot2.png',
                'assets/images/project1-screenshot3.png'
            ],
            meta: 'SOLO DEVELOPER · UNITY · 2024',
            role: 'Sole Developer',
            software: 'Unity · C#',
            description: 'Atmospheric sci-fi horror inspired by Alien Isolation, built around sound, tension, and environmental storytelling.',
            link: 'https://pitza.itch.io/lost-voices'
        },
        mistake: {
            index: '02',
            title: 'MISTAKE',
            images: [
                'assets/images/project2-screenshot1.jpg',
                'assets/images/project2-screenshot2.jpg',
                'assets/images/project2-screenshot3.jpg'
            ],
            video: 'assets/video/project2-preview.mp4',
            meta: 'GAME DESIGNER & PROGRAMMER · UNITY · 2024',
            role: 'Game Designer & Programmer',
            software: 'Unity · C#',
            description: 'A short first-person story experience about ethical choice, consequence, and the weight of a single decision.',
            link: 'https://pitza.itch.io/mistake'
        },
        'kitty-kultivation': {
            index: '03',
            title: 'Kitty Kultivation',
            images: [
                'assets/images/project3-screenshot1.png',
                'assets/images/project3-screenshot2.png',
                'assets/images/project3-screenshot3.jpg'
            ],
            meta: 'GAME DESIGN · LEVEL DESIGN · UNITY · 2025',
            role: 'Game Designer · Level Designer · Programmer',
            software: 'Unity · C#',
            description: 'A capstone project exploring urban gardening, sustainability, and the quiet joy of growing something in a polluted world.',
            link: 'https://pitza.itch.io/kitty-kultivation'
        }
    };

    const detailIndex = document.getElementById('projectDetailIndex');
    const detailMeta = document.getElementById('projectDetailMeta');
    const detailTitle = document.getElementById('projectDetailTitle');
    const detailRole = document.getElementById('projectDetailRole');
    const detailSoftware = document.getElementById('projectDetailSoftware');
    const detailDescription = document.getElementById('projectDetailDescription');
    const detailLink = document.getElementById('projectDetailLink');
    let hasSelectedProject = false;

    function reserveExpandedStage() {
        if (projectView.hidden) return;

        const previousMinHeight = layout.style.minHeight;
        const wasSelected = layout.classList.contains('has-selection');
        const wasMeasuring = layout.classList.contains('is-measuring');
        const spotlightWasHidden = spotlight.hidden;
        const promptWasDismissed = prompt?.classList.contains('is-dismissed') || false;
        const promptAriaHidden = prompt?.getAttribute('aria-hidden');
        const compactHeight = layout.getBoundingClientRect().height;

        layout.style.minHeight = '';
        layout.classList.add('is-measuring', 'has-selection');
        prompt?.classList.add('is-dismissed');
        prompt?.setAttribute('aria-hidden', 'true');
        spotlight.hidden = false;
        void layout.offsetHeight;
        const expandedHeight = layout.getBoundingClientRect().height;

        spotlight.hidden = spotlightWasHidden;
        layout.classList.toggle('has-selection', wasSelected);
        layout.classList.toggle('is-measuring', wasMeasuring);
        prompt?.classList.toggle('is-dismissed', promptWasDismissed);
        if (prompt && promptAriaHidden === null) {
            prompt.removeAttribute('aria-hidden');
        } else if (prompt && promptAriaHidden !== null) {
            prompt.setAttribute('aria-hidden', promptAriaHidden);
        }

        layout.style.minHeight = `${Math.ceil(Math.max(compactHeight, expandedHeight) + 24)}px`;
        if (previousMinHeight && Number.parseFloat(previousMinHeight) > expandedHeight) {
            layout.style.minHeight = previousMinHeight;
        }
    }

    let resizeTimer;
    window.addEventListener('resize', () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(reserveExpandedStage, 120);
    });
    document.addEventListener('portfolio:viewchange', (event) => {
        if (event.detail?.view === 'projects') {
            requestAnimationFrame(reserveExpandedStage);
        }
    });
    if (!projectView.hidden) requestAnimationFrame(reserveExpandedStage);

    function showMedia(project, media) {
        mediaPicker.querySelectorAll('.project-media-thumb').forEach((button) => {
            const isSelected = button.dataset.mediaType === media.type && button.dataset.mediaSrc === media.src;
            button.classList.toggle('is-selected', isSelected);
            button.setAttribute('aria-pressed', String(isSelected));
        });

        if (media.type === 'video' && project.video) {
            detailImage.hidden = true;
            detailVideo.hidden = false;
            detailVideo.src = project.video;
            detailVideo.currentTime = 0;
            detailVideo.play().catch(() => {});
            return;
        }

        detailVideo.pause();
        detailVideo.hidden = true;
        detailImage.hidden = false;
        detailImage.src = media.src;
        detailImage.alt = `${project.title} screenshot ${media.index + 1}`;
    }

    function buildMediaPicker(project) {
        mediaPicker.replaceChildren();
        const mediaItems = project.images.map((src, index) => ({
            type: 'image',
            src,
            index,
            label: `Screenshot ${index + 1}`
        }));

        if (project.video) {
            mediaItems.push({
                type: 'video',
                src: project.video,
                index: -1,
                label: 'Play video'
            });
        }

        mediaItems.forEach((media) => {
            const button = document.createElement('button');
            button.className = 'project-media-thumb';
            button.type = 'button';
            button.dataset.mediaType = media.type;
            button.dataset.mediaSrc = media.src;
            button.setAttribute('aria-label', `${project.title}: ${media.label}`);
            button.setAttribute('aria-pressed', 'false');

            const image = document.createElement('img');
            image.src = media.type === 'video' ? project.images[0] : media.src;
            image.alt = '';
            image.loading = 'lazy';
            button.appendChild(image);

            if (media.type === 'video') {
                const playMark = document.createElement('span');
                playMark.className = 'media-video-mark';
                playMark.setAttribute('aria-hidden', 'true');
                playMark.textContent = '▶';
                button.appendChild(playMark);
            }

            const label = document.createElement('span');
            label.className = 'project-media-label';
            label.textContent = media.label;
            button.appendChild(label);

            button.addEventListener('click', () => showMedia(project, media));
            mediaPicker.appendChild(button);
        });

        showMedia(project, mediaItems[0]);
    }

    function animatePickerIntoRail() {
        const cards = Array.from(projectButtons);
        const initialRects = cards.map((card) => card.getBoundingClientRect());
        layout.classList.add('has-selection');
        const finalRects = cards.map((card) => card.getBoundingClientRect());

        cards.forEach((card, index) => {
            const initialRect = initialRects[index];
            const finalRect = finalRects[index];
            const translateX = initialRect.left - finalRect.left;
            const translateY = initialRect.top - finalRect.top;
            const scaleX = initialRect.width / finalRect.width;
            const scaleY = initialRect.height / finalRect.height;
            card.style.transition = 'none';
            card.style.transformOrigin = 'top left';
            card.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`;
        });

        void picker.offsetWidth;
        requestAnimationFrame(() => {
            cards.forEach((card) => {
                card.style.transition = '';
                card.style.transform = '';
            });

            const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            const revealSpotlight = () => {
                spotlight.hidden = false;
                requestAnimationFrame(() => spotlight.classList.add('is-revealed'));
            };

            if (reducedMotion) {
                revealSpotlight();
                return;
            }

            window.setTimeout(revealSpotlight, 850);
        });
    }

    function selectProject(button) {
        const project = projects[button.dataset.featuredProject];
        if (!project) return;

        projectButtons.forEach((item) => {
            const isSelected = item === button;
            item.classList.toggle('is-selected', isSelected);
            item.setAttribute('aria-pressed', String(isSelected));
        });

        detailIndex.textContent = project.index;
        detailMeta.textContent = project.meta;
        detailTitle.textContent = project.title;
        detailRole.textContent = project.role;
        detailSoftware.textContent = project.software;
        detailDescription.textContent = project.description;
        detailLink.href = project.link;
        detailVideo.pause();
        buildMediaPicker(project);

        if (!hasSelectedProject) {
            hasSelectedProject = true;
            if (prompt) {
                prompt.classList.add('is-dismissed');
                prompt.setAttribute('aria-hidden', 'true');
            }
            animatePickerIntoRail();
        }
    }

    projectButtons.forEach((button) => button.addEventListener('click', () => selectProject(button)));
}

function initializeProjectShowcase() {
    const showcase = document.querySelector('.project-showcase');
    if (!showcase || showcase.dataset.initialized === 'true') return;

    const projects = [
        {
            title: 'Lost Voices',
            role: 'Sole Developer',
            software: 'Unity • C#',
            date: '2024',
            image: 'assets/images/project1-screenshot1.png',
            link: 'https://pitza.itch.io/lost-voices',
            description: 'Atmospheric sci-fi horror inspired by Alien Isolation, built around sound, tension, and environmental storytelling.'
        },
        {
            title: 'MISTAKE',
            role: 'Game Designer & Programmer',
            software: 'Unity • C#',
            date: '2024',
            image: 'assets/images/project2-screenshot1.jpg',
            link: 'https://pitza.itch.io/mistake',
            description: 'A short first-person story experience about ethical choice, consequence, and the weight of a single decision.'
        },
        {
            title: 'Kitty Kultivation',
            role: 'Game Designer • Level Designer • Programmer',
            software: 'Unity • C#',
            date: '2025',
            image: 'assets/images/project3-screenshot1.png',
            link: 'https://pitza.itch.io/kitty-kultivation',
            description: 'A capstone project exploring urban gardening, sustainability, and the quiet joy of growing something in a polluted world.'
        }
    ];

    const track = document.getElementById('projectTrack');
    const detailTitle = document.getElementById('projectDetailTitle');
    const detailRole = document.getElementById('projectDetailRole');
    const detailSoftware = document.getElementById('projectDetailSoftware');
    const detailDate = document.getElementById('projectDetailDate');
    const detailDescription = document.getElementById('projectDetailDescription');
    const detailLink = document.getElementById('projectDetailLink');
    const detailCard = document.querySelector('.project-detail-box');
    const prevButton = document.querySelector('.project-arrow.prev');
    const nextButton = document.querySelector('.project-arrow.next');

    if (!track || !detailTitle || !detailRole || !detailSoftware || !detailDate || !detailDescription || !detailLink || !prevButton || !nextButton) {
        return;
    }

    showcase.dataset.initialized = 'true';

    let currentIndex = 0;
    let isAnimating = false;
    let trackIndex = projects.length;
    const projectSlideshows = [];

    function getTrackOffset(index) {
        const slide = track.children[index];
        if (!slide) return 0;

        const laneWidth = track.parentElement.clientWidth;
        return (laneWidth - slide.offsetWidth) / 2 - slide.offsetLeft;
    }

    function updateTrackPosition(offset) {
        if (typeof gsap !== 'undefined') {
            gsap.set(track, { x: offset });
        } else {
            track.style.transform = `translate3d(${offset}px, 0, 0)`;
        }
    }

    function triggerLaneMotion(direction, onComplete) {
        const targetIndex = direction === 'next' ? trackIndex + 1 : trackIndex - 1;
        const targetProjectIndex = ((targetIndex % projects.length) + projects.length) % projects.length;

        if (typeof gsap === 'undefined') {
            currentIndex = targetProjectIndex;
            trackIndex = projects.length + currentIndex;
            renderProject();
            if (typeof onComplete === 'function') onComplete();
            return;
        }

        const currentSlideshow = projectSlideshows.find(({ slide }) => slide === track.children[trackIndex]);
        if (currentSlideshow && currentSlideshow.slideshow.hasVideo) {
            currentSlideshow.slideshow.hideVideo();
            currentSlideshow.slideshow.showSlide(0);
        }

        Array.from(track.children).forEach((slide, index) => {
            slide.classList.toggle('is-active', index === targetIndex);
        });

        gsap.killTweensOf(track);
        gsap.to(track, {
            x: getTrackOffset(targetIndex),
            duration: 0.46,
            ease: 'power3.inOut',
            onComplete: () => {
                trackIndex = targetIndex;
                currentIndex = targetProjectIndex;
                renderProject();
                trackIndex = projects.length + currentIndex;
                gsap.set(track, { x: getTrackOffset(trackIndex) });
                if (typeof onComplete === 'function') onComplete();
            }
        });
    }

    function goToPrevious() {
        if (isAnimating) return;
        isAnimating = true;

        triggerLaneMotion('prev', () => { isAnimating = false; });
    }

    function goToNext() {
        if (isAnimating) return;
        isAnimating = true;

        triggerLaneMotion('next', () => { isAnimating = false; });
    }

    function renderProject() {
        const project = projects[currentIndex];

        if (!project) return;

        if (!track.children.length) {
            for (let copy = 0; copy < 3; copy += 1) {
                projects.forEach((item, index) => {
                    const slide = document.createElement('article');
                    slide.className = 'project-slide';
                    slide.dataset.index = index;
                    const screenshotPaths = [
                        `assets/images/project${index + 1}-screenshot1.${index === 1 ? 'jpg' : index === 2 ? 'png' : index === 3 ? 'PNG' : index === 4 ? 'png' : 'png'}`,
                        `assets/images/project${index + 1}-screenshot2.${index === 1 ? 'jpg' : index === 2 ? 'png' : index === 3 ? 'PNG' : index === 4 ? 'png' : 'png'}`,
                        `assets/images/project${index + 1}-screenshot3.${index === 1 || index === 2 ? 'jpg' : 'png'}`
                    ];
                    const hasPreviewVideo = index === 1;
                    slide.innerHTML = `
                        <div class="media-container project-media" data-autoplay="false">
                            ${hasPreviewVideo ? `
                                <div class="video-slide">
                                    <video muted loop>
                                        <source src="assets/video/project2-preview.mp4" type="video/mp4">
                                    </video>
                                </div>
                            ` : ''}
                            <div class="slideshow">
                                ${screenshotPaths.map((path, screenshotIndex) => `
                                    <div class="slide ${screenshotIndex === 0 ? 'active' : ''}">
                                        <img src="${path}" alt="${item.title} screenshot ${screenshotIndex + 1}">
                                    </div>
                                `).join('')}
                            </div>
                            <div class="slide-indicators">
                                ${hasPreviewVideo ? '<div class="indicator active" data-slide="video"></div>' : ''}
                                ${screenshotPaths.map((_, screenshotIndex) => `
                                    <div class="indicator ${!hasPreviewVideo && screenshotIndex === 0 ? 'active' : ''}" data-slide="${screenshotIndex}"></div>
                                `).join('')}
                            </div>
                            <div class="slideshow-controls">
                                <button class="prev" type="button" aria-label="Previous screenshot">◄</button>
                                <button class="next" type="button" aria-label="Next screenshot">►</button>
                            </div>
                        </div>
                        <span>${item.title}</span>
                    `;
                    track.appendChild(slide);
                    const projectSlideshow = new ProjectSlideshow(slide.querySelector('.project-media'));
                    projectSlideshows.push({ slide, slideshow: projectSlideshow });
                });
            }
        }

        Array.from(track.children).forEach((slide, index) => {
            slide.classList.toggle('is-active', Number(slide.dataset.index) === currentIndex && index === trackIndex);
        });

        projectSlideshows.forEach(({ slide, slideshow }) => {
            const isCentered = slide === track.children[trackIndex];
            if (isCentered && slideshow.hasVideo) {
                slideshow.showVideo();
            } else if (slideshow.hasVideo) {
                slideshow.hideVideo();
                slideshow.showSlide(0);
            }
        });

        updateTrackPosition(getTrackOffset(trackIndex));

        detailTitle.textContent = project.title;
        detailRole.textContent = project.role;
        detailSoftware.textContent = project.software;
        detailDate.textContent = project.date;
        detailDescription.textContent = project.description;
        detailLink.href = project.link;

        if (detailCard) {
            detailCard.classList.remove('animate');
            void detailCard.offsetWidth;
            detailCard.classList.add('animate');
        }
    }

    prevButton.addEventListener('click', (event) => {
        event.stopPropagation();
        goToPrevious();
    });
    nextButton.addEventListener('click', (event) => {
        event.stopPropagation();
        goToNext();
    });

    const lane = document.querySelector('.project-lane');
    if (lane) {
        const proximity = 115;

        lane.addEventListener('mousemove', (event) => {
            const previousBounds = prevButton.getBoundingClientRect();
            const nextBounds = nextButton.getBoundingClientRect();
            const nearPrevious = Math.abs(event.clientX - (previousBounds.left + previousBounds.width / 2)) < proximity;
            const nearNext = Math.abs(event.clientX - (nextBounds.left + nextBounds.width / 2)) < proximity;

            prevButton.classList.toggle('visible', nearPrevious);
            nextButton.classList.toggle('visible', nearNext);
        });

        lane.addEventListener('mouseleave', () => {
            prevButton.classList.remove('visible');
            nextButton.classList.remove('visible');
        });
    }

    renderProject();
}

function initializeMoreGamesLibrary() {
    const gameButtons = document.querySelectorAll('.library-game');
    if (!gameButtons.length) return;

    const games = {
        cuboids: {
            title: 'Cuboids Revolt',
            image: 'assets/images/project4-screenshot1.PNG',
            meta: 'SOLO DEVELOPER · UNITY · 2023',
            role: 'Sole Developer',
            description: 'A top-down survival shooter about protecting small cubes through escalating waves of enemies.',
            link: 'https://pitza.itch.io/cuboids-revolt'
        },
        grembox: {
            title: 'GremBox',
            image: 'assets/images/project5-screenshot1.png',
            meta: 'SOLO DEVELOPER · UNITY · 2025',
            role: 'Sole Developer',
            description: 'A playful sandbox project centered on gathering mascots, exploration, and lighthearted discovery.',
            link: 'https://pitza.itch.io/grembox'
        }
    };

    const detailImage = document.getElementById('moreGameImage');
    const detailMeta = document.getElementById('moreGameMeta');
    const detailTitle = document.getElementById('moreGameTitle');
    const detailRole = document.getElementById('moreGameRole');
    const detailDescription = document.getElementById('moreGameDescription');
    const detailLink = document.getElementById('moreGameLink');

    gameButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const game = games[button.dataset.libraryGame];
            if (!game) return;

            gameButtons.forEach((item) => {
                const isSelected = item === button;
                item.classList.toggle('is-selected', isSelected);
                item.setAttribute('aria-pressed', String(isSelected));
            });

            detailImage.src = game.image;
            detailImage.alt = `${game.title} gameplay screenshot`;
            detailMeta.textContent = game.meta;
            detailTitle.textContent = game.title;
            detailRole.textContent = game.role;
            detailDescription.textContent = game.description;
            detailLink.href = game.link;
        });
    });
}

function initializePortfolioViews() {
    const views = Array.from(document.querySelectorAll('[data-portfolio-view]'));
    const viewButtons = document.querySelectorAll('[data-view-target]');
    const homeButtons = document.querySelectorAll('[data-home-button]');
    if (!views.length) return;

    let activeView = views.find((view) => !view.hidden) || views[0];
    let isTransitioning = false;
    let queuedView = null;

    views.forEach((view) => {
        const isActive = view === activeView;
        view.hidden = !isActive;
        view.classList.toggle('is-active', isActive);
    });

    async function animateView(element, keyframes, options) {
        if (typeof element.animate !== 'function') return;

        const animation = element.animate(keyframes, options);
        try {
            await animation.finished;
        } catch {
            return;
        }
        animation.cancel();
    }

    async function showView(viewName, updateHistory = true) {
        const targetView = views.find((view) => view.dataset.portfolioView === viewName) || views[0];
        const activeName = targetView.dataset.portfolioView;
        if (isTransitioning) {
            queuedView = { viewName: activeName, updateHistory };
            return;
        }

        if (targetView === activeView) {
            document.dispatchEvent(new CustomEvent('portfolio:viewchange', { detail: { view: activeName } }));
            return;
        }

        isTransitioning = true;
        const outgoingView = activeView;
        const returningHome = activeName === 'home';
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        activeView = targetView;

        viewButtons.forEach((button) => {
            const isActive = button.dataset.viewTarget === activeName;
            button.setAttribute('aria-pressed', String(isActive));
        });

        if (updateHistory) {
            const nextHash = activeName === 'home' ? '' : `#${activeName}`;
            if (window.location.hash !== nextHash) {
                window.history.pushState({ view: activeName }, '', `${window.location.pathname}${window.location.search}${nextHash}`);
            }
        }

        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });

        if (activeName !== 'projects') {
            document.getElementById('projectDetailVideo')?.pause();
        }

        if (!prefersReducedMotion) {
            const exitX = returningHome ? 24 : -24;
            await animateView(outgoingView, [
                { opacity: 1, transform: 'translate3d(0, 0, 0) scale(1)', filter: 'blur(0)' },
                { opacity: 0, transform: `translate3d(${exitX}px, 0, 0) scale(0.99)`, filter: 'blur(2px)' }
            ], { duration: 190, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' });
        }

        outgoingView.hidden = true;
        outgoingView.classList.remove('is-active');
        targetView.hidden = false;
        targetView.classList.add('is-active');
        window.scrollTo({ top: 0, behavior: 'auto' });
        document.dispatchEvent(new CustomEvent('portfolio:viewchange', { detail: { view: activeName } }));

        if (!prefersReducedMotion) {
            const enterX = returningHome ? -28 : 28;
            await animateView(targetView, [
                { opacity: 0, transform: `translate3d(${enterX}px, 0, 0) scale(0.99)`, filter: 'blur(2px)' },
                { opacity: 1, transform: 'translate3d(0, 0, 0) scale(1)', filter: 'blur(0)' }
            ], { duration: 360, easing: 'cubic-bezier(0.2, 0.75, 0.25, 1)', fill: 'forwards' });
        }

        isTransitioning = false;
        if (queuedView) {
            const nextView = queuedView;
            queuedView = null;
            showView(nextView.viewName, nextView.updateHistory);
        }
    }

    viewButtons.forEach((button) => {
        button.addEventListener('click', () => showView(button.dataset.viewTarget));
    });

    homeButtons.forEach((button) => {
        button.addEventListener('click', () => showView('home'));
    });

    window.addEventListener('popstate', () => {
        showView(window.location.hash.slice(1) || 'home', false);
    });

    showView(window.location.hash.slice(1) || 'home', false);
}

/* ==============================
   UPDATED INITIALIZATION
================================ */

document.addEventListener('DOMContentLoaded', () => {
    console.log("=== INITIALIZING PAGE ===");
    console.log("Current page:", window.location.pathname);
    
    // Load and apply theme first (this is most important)
    loadThemeFromJSON();
    
    // Initialize theme toggle
    initializeThemeToggle();

    // Initialize the single-page portfolio navigation
    initializePortfolioViews();
    initializeFeaturedProjectPicker();
    initializeMoreGamesLibrary();
    
    // Initialize click counter (if exists on this page)
    initializeClickCounter();
    
    // Initialize scroll animations
    initializeScrollAnimations();
    
    // Initialize slideshows (if exists on this page)
    initializeSlideshows();
    
    // Initialize dropdowns
    initializeDropdowns();

    // Initialize authentication system
    initializeAuthSystem();
    
    // Initialize devlog renderer (for devlogs page)
    initializeDevlogRenderer();
    
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