class AudioSystem {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'dark';
        this.musicVolume = 0.3;
        this.sfxVolume = 0.5;
        this.isPlaying = false;
        
        this.initMusic();
        this.initSFX();
        this.initVisualizer();
        this.attachEventListeners();
    }

    initMusic() {
        // Dark theme ambient music
        this.darkMusic = new Howl({
            src: ['assets/music/dark-ambient.mp3', 'assets/music/dark-ambient.ogg'],
            loop: true,
            volume: this.musicVolume,
            html5: true
        });

        // Light theme ambient music
        this.lightMusic = new Howl({
            src: ['assets/music/light-ambient.mp3', 'assets/music/light-ambient.ogg'],
            loop: true,
            volume: this.musicVolume,
            html5: true
        });

        this.currentMusic = this.currentTheme === 'dark' ? this.darkMusic : this.lightMusic;
    }

    initSFX() {
        // Hover sound effect
        this.hoverSFX = new Howl({
            src: ['assets/sfx/hover.mp3', 'assets/sfx/hover.ogg'],
            volume: this.sfxVolume
        });

        // Click sound effect
        this.clickSFX = new Howl({
            src: ['assets/sfx/click.mp3', 'assets/sfx/click.ogg'],
            volume: this.sfxVolume
        });
    }

    initVisualizer() {
        this.canvas = document.getElementById('visualizer');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = 80;
        
        this.visualizerData = {
            bars: 50,
            values: new Array(50).fill(0)
        };
    }

    play() {
        if (this.isPlaying) return;
        
        this.currentMusic.play();
        this.isPlaying = true;
        this.startVisualizer();
    }

    pause() {
        if (!this.isPlaying) return;
        
        this.currentMusic.pause();
        this.isPlaying = false;
    }

    switchTheme(newTheme) {
        const wasPlaying = this.isPlaying;
        const currentPosition = this.currentMusic.seek();
        
        // Fade out current music
        this.currentMusic.fade(this.musicVolume, 0, 500);
        
        setTimeout(() => {
            this.currentMusic.stop();
            
            // Switch music
            this.currentTheme = newTheme;
            this.currentMusic = newTheme === 'dark' ? this.darkMusic : this.lightMusic;
            
            if (wasPlaying) {
                this.currentMusic.volume(0);
                this.currentMusic.play();
                this.currentMusic.fade(0, this.musicVolume, 500);
            }
        }, 500);
    }

    setVolume(volume) {
        this.musicVolume = volume;
        this.darkMusic.volume(volume);
        this.lightMusic.volume(volume);
    }

    startVisualizer() {
        const animate = () => {
            if (!this.isPlaying) {
                // Fade out bars
                this.visualizerData.values = this.visualizerData.values.map(v => v * 0.9);
            } else {
                // Generate random wave data (in real implementation, use Web Audio API)
                for (let i = 0; i < this.visualizerData.bars; i++) {
                    const target = Math.random() * 40 + 10;
                    this.visualizerData.values[i] = this.visualizerData.values[i] * 0.8 + target * 0.2;
                }
            }

            this.drawVisualizer();
            requestAnimationFrame(animate);
        };
        animate();
    }

    drawVisualizer() {
        const { width, height } = this.canvas;
        const barWidth = width / this.visualizerData.bars;
        
        this.ctx.clearRect(0, 0, width, height);
        
        const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#f4b183');
        gradient.addColorStop(1, '#ffb070');
        
        this.visualizerData.values.forEach((value, i) => {
            const barHeight = value;
            const x = i * barWidth;
            const y = height - barHeight;
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(x, y, barWidth - 2, barHeight);
        });
    }

    attachEventListeners() {
        // Add hover SFX to all buttons and links
        document.addEventListener('mouseover', (e) => {
            if (e.target.matches('button, a, nav a')) {
                this.hoverSFX.play();
            }
        });

        // Add click SFX to all buttons and links
        document.addEventListener('click', (e) => {
            if (e.target.matches('button, a, nav a')) {
                this.clickSFX.play();
            }
        });
    }
}

// Initialize the audio system
let audioSystem;

document.addEventListener('DOMContentLoaded', () => {
    audioSystem = new AudioSystem();
    
    // Play button
    const playBtn = document.getElementById('playBtn');
    if (playBtn) {
        playBtn.addEventListener('click', () => {
            if (audioSystem.isPlaying) {
                audioSystem.pause();
                playBtn.textContent = '▶ Play Music';
                playBtn.classList.remove('active');
            } else {
                audioSystem.play();
                playBtn.textContent = '⏸ Pause Music';
                playBtn.classList.add('active');
            }
        });
    }

    // Volume control
    const volumeSlider = document.getElementById('volumeSlider');
    const volumePercent = document.getElementById('volumePercent');
    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            audioSystem.setVolume(volume);
            volumePercent.textContent = e.target.value + '%';
        });
    }

    // // Theme toggle (integrate with your existing theme system)
    // const themeToggle = document.getElementById('themeToggle');
    // if (themeToggle) {
    //     themeToggle.addEventListener('click', () => {
    //         document.body.classList.toggle('light');
    //         const newTheme = document.body.classList.contains('light') ? 'light' : 'dark';
    //         audioSystem.switchTheme(newTheme);
    //         localStorage.setItem('theme', newTheme);
    //     });
    // }
});