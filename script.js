// Load JSON data
async function loadJSON(filename) {
    try {
        const response = await fetch(filename);
        if (!response.ok) throw new Error('Failed to load data');
        return await response.json();
    } catch (error) {
        console.error('Error loading JSON:', error);
        return [];
    }
}

// Create project card HTML
function createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.setAttribute('data-tools', project.tools.join(','));
    
    const tagsHTML = project.tools.slice(0, 3).map(tool => 
        `<span class="tag">${tool}</span>`
    ).join('');
    
    card.innerHTML = `
        <div class="project-image">🎮</div>
        <div class="project-info">
            <h3 class="project-title">${project.title}</h3>
            <p class="project-description">${project.description}</p>
            <div class="project-tags">${tagsHTML}</div>
        </div>
    `;
    
    card.addEventListener('click', () => openProjectModal(project));
    return card;
}

// Load featured projects on home page
async function loadFeaturedProjects() {
    const games = await loadJSON('games.json');
    const featuredGames = games.filter(game => 
        game.remarks && game.remarks.includes('featured')
    ).slice(0, 3);
    
    const container = document.getElementById('featuredProjects');
    if (container) {
        featuredGames.forEach(game => {
            container.appendChild(createProjectCard(game));
        });
    }
}

// Load all projects on games page
async function loadAllProjects() {
    const games = await loadJSON('games.json');
    const container = document.getElementById('projectsGrid');
    
    if (container) {
        games.forEach(game => {
            container.appendChild(createProjectCard(game));
        });
    }
}

// Filter functionality
function initializeFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');
            
            const filter = button.getAttribute('data-filter');
            
            projectCards.forEach(card => {
                if (filter === 'all') {
                    card.style.display = 'block';
                } else {
                    const tools = card.getAttribute('data-tools');
                    if (tools.includes(filter)) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                }
            });
        });
    });
}

// Open project modal
function openProjectModal(project) {
    const modal = document.getElementById('projectModal');
    const modalBody = document.getElementById('modalBody');
    
    if (!modal || !modalBody) return;
    
    const toolsHTML = project.tools.map(tool => 
        `<span class="tag">${tool}</span>`
    ).join(' ');
    
    const rolesHTML = project.roles.map(role => 
        `<li>${role}</li>`
    ).join('');
    
    const additionalHTML = project.additional.map(item => 
        `<li>${item}</li>`
    ).join('');
    
    const collaboratorsHTML = project.collaborators && Object.keys(project.collaborators).length > 0
        ? `<div style="margin-top: 2rem;">
            <h3 style="color: var(--primary-color); margin-bottom: 1rem;">Collaborators</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 1rem;">
                ${Object.entries(project.collaborators).map(([name, url]) => 
                    url 
                        ? `<a href="${url}" target="_blank" class="tag" style="text-decoration: none;">${name}</a>`
                        : `<span class="tag">${name}</span>`
                ).join('')}
            </div>
        </div>`
        : '';
    
    modalBody.innerHTML = `
        <h2 style="color: var(--primary-color); margin-bottom: 1rem; font-size: 2rem;">
            ${project.title}
        </h2>
        
        <div style="margin-bottom: 1.5rem;">
            <p style="color: #bdc3c7; margin-bottom: 0.5rem;">
                <strong>Year:</strong> ${project.year} | 
                <strong>Duration:</strong> ${project.duration}
            </p>
            <div style="margin-top: 1rem;">
                ${toolsHTML}
            </div>
        </div>
        
        <div style="margin-bottom: 2rem;">
            <h3 style="color: var(--primary-color); margin-bottom: 1rem;">Description</h3>
            <p style="line-height: 1.8; color: #bdc3c7;">${project.description}</p>
        </div>
        
        ${project.roles.length > 0 ? `
            <div style="margin-bottom: 2rem;">
                <h3 style="color: var(--primary-color); margin-bottom: 1rem;">Roles</h3>
                <ul style="color: #bdc3c7; line-height: 1.8; margin-left: 1.5rem;">
                    ${rolesHTML}
                </ul>
            </div>
        ` : ''}
        
        ${project.additional.length > 0 ? `
            <div style="margin-bottom: 2rem;">
                <h3 style="color: var(--primary-color); margin-bottom: 1rem;">Additional Information</h3>
                <ul style="color: #bdc3c7; line-height: 1.8; margin-left: 1.5rem;">
                    ${additionalHTML}
                </ul>
            </div>
        ` : ''}
        
        ${project.platforms ? `
            <div style="margin-bottom: 2rem;">
                <h3 style="color: var(--primary-color); margin-bottom: 1rem;">Platforms</h3>
                <p style="color: #bdc3c7;">${project.platforms.join(', ')}</p>
            </div>
        ` : ''}
        
        ${project.downloadLink && project.downloadLink[0] ? `
            <div style="margin-bottom: 2rem;">
                <a href="${project.downloadLink[0]}" target="_blank" class="btn btn-primary">
                    ${project.downloadLink[1] || 'Download / View Project'}
                </a>
            </div>
        ` : ''}
        
        ${collaboratorsHTML}
    `;
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Close project modal
function closeProjectModal() {
    const modal = document.getElementById('projectModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Smooth scroll for navigation links
document.addEventListener('DOMContentLoaded', () => {
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
});

// Navbar scroll effect
let lastScroll = 0;
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > lastScroll && currentScroll > 100) {
        navbar.style.transform = 'translateY(-100%)';
    } else {
        navbar.style.transform = 'translateY(0)';
    }
    
    lastScroll = currentScroll;
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements with animation
document.addEventListener('DOMContentLoaded', () => {
    const animateElements = document.querySelectorAll('.project-card, .skill-card, .timeline-item');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Close modal on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeProjectModal();
    }
});

// Animate skill bars on scroll
const skillObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const bars = entry.target.querySelectorAll('.skill-progress-bar');
            bars.forEach(bar => {
                const width = bar.style.width;
                bar.style.width = '0';
                setTimeout(() => {
                    bar.style.width = width;
                }, 100);
            });
            skillObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

document.addEventListener('DOMContentLoaded', () => {
    const skillSections = document.querySelectorAll('.skill-category');
    skillSections.forEach(section => {
        skillObserver.observe(section);
    });
});