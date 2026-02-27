// ===== SLIDE & STEP LOGIC =====
const slides = document.querySelectorAll('.slide');
const navDotsContainer = document.getElementById('navDots');
const slideCounter = document.getElementById('slideCounter');
let current = 0;

// Build nav dots
slides.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = 'nav-dot' + (i === 0 ? ' active' : '');
    dot.onclick = () => goTo(i);
    navDotsContainer.appendChild(dot);
});

// Action for NEXT button (handle step reveal or next slide)
function nextAction() {
    const currentSlideEl = slides[current];
    const hiddenSteps = currentSlideEl.querySelectorAll('.step-reveal:not(.revealed)');

    if (hiddenSteps.length > 0) {
        // Reveal next element
        hiddenSteps[0].classList.add('revealed');
    } else {
        // No more hidden elements, go to next slide
        if (current < slides.length - 1) {
            goTo(current + 1);
        }
    }
}

// Action for PREV button (handle step hide or prev slide)
function prevAction() {
    const currentSlideEl = slides[current];
    const revealedSteps = currentSlideEl.querySelectorAll('.step-reveal.revealed');

    if (revealedSteps.length > 0) {
        // Hide the last revealed element
        revealedSteps[revealedSteps.length - 1].classList.remove('revealed');
    } else {
        // No revealed elements, go to previous slide (and reveal all its elements)
        if (current > 0) {
            goTo(current - 1, true);
        }
    }
}

// Navigate to specific slide
function goTo(n, goingBackwards = false) {
    if (n === current && slides[current].classList.contains('active')) return;

    // Remove active state from current slide
    slides[current].classList.remove('active');
    navDotsContainer.children[current].classList.remove('active');

    // Update index
    current = Math.max(0, Math.min(n, slides.length - 1));

    // Show target slide
    slides[current].classList.add('active');
    navDotsContainer.children[current].classList.add('active');
    slideCounter.textContent = `${current + 1} / ${slides.length}`;

    // Manage Step Reveals for the incoming slide
    const steps = slides[current].querySelectorAll('.step-reveal');
    steps.forEach(step => {
        if (goingBackwards) {
            step.classList.add('revealed'); // Show all elements if going backwards
        } else {
            step.classList.remove('revealed'); // Hide all elements if going forwards
        }
    });

    initCharts(current);
}

// Keyboard navigation
document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === ' ') nextAction();
    if (e.key === 'ArrowLeft') prevAction();
});

// Mouse click navigation: Left-click = next, Right-click = previous
document.addEventListener('click', (e) => {
    // Ignore clicks on buttons or interactive elements
    if (e.target.closest('.btn-nav') || e.target.closest('button') || e.target.closest('a') || e.target.closest('.nav-dot')) return;
    nextAction();
});

document.addEventListener('contextmenu', (e) => {
    e.preventDefault(); // Block the browser right-click menu
    e.stopPropagation();
    prevAction();
    return false;
});

// Fullscreen Logic
function toggleFullScreen() {
    const docEl = document.documentElement;
    if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
        // Enter fullscreen
        if (docEl.requestFullscreen) {
            docEl.requestFullscreen().catch(err => console.log(err));
        } else if (docEl.msRequestFullscreen) {
            docEl.msRequestFullscreen();
        } else if (docEl.mozRequestFullScreen) {
            docEl.mozRequestFullScreen();
        } else if (docEl.webkitRequestFullscreen) {
            docEl.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        }
        document.getElementById('fsBtn').innerHTML = '❌ ออกจากเต็มจอ';
        document.body.classList.add('is-fullscreen');
    } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
        document.getElementById('fsBtn').innerHTML = '🖥️ เต็มจอ';
        document.body.classList.remove('is-fullscreen');
    }
}

// Listen for fullscreen change events to update UI if user presses Esc
document.addEventListener('fullscreenchange', updateFsUI);
document.addEventListener('webkitfullscreenchange', updateFsUI);
document.addEventListener('mozfullscreenchange', updateFsUI);
document.addEventListener('MSFullscreenChange', updateFsUI);

function updateFsUI() {
    if (!document.fullscreenElement && !document.webkitIsFullScreen && !document.mozFullScreen && !document.msFullscreenElement) {
        document.getElementById('fsBtn').innerHTML = '🖥️ เต็มจอ';
        document.body.classList.remove('is-fullscreen');
    }
}

// Hide cursor when inactive in fullscreen
let cursorTimeout;
document.addEventListener('mousemove', () => {
    if (document.body.classList.contains('is-fullscreen')) {
        document.body.style.cursor = 'default';
        clearTimeout(cursorTimeout);
        cursorTimeout = setTimeout(() => {
            document.body.style.cursor = 'none';
        }, 2000);
    } else {
        document.body.style.cursor = 'default';
        clearTimeout(cursorTimeout);
    }
});

// Initialize first slide steps state (just in case)
slides[0].querySelectorAll('.step-reveal').forEach(step => step.classList.remove('revealed'));


// ===== CHARTS =====
const chartsInited = {};

const COLORS = {
    gold: '#d4a843',
    goldLight: '#f0c96a',
    maroon: '#561e23',
    maroonMid: '#7d3c45',
    maroonEnd: '#ad5f6c',
    green: '#5cb85c',
    red: '#e07878',
    orange: '#f0a060',
    white60: 'rgba(255,255,255,0.6)',
    white20: 'rgba(255,255,255,0.15)',
};

const chartDefaults = {
    plugins: {
        legend: {
            labels: { color: 'rgba(255,255,255,0.7)', font: { family: 'Sarabun', size: 11 }, padding: 12 }
        },
        tooltip: {
            backgroundColor: 'rgba(10,2,4,0.9)',
            titleColor: '#d4a843',
            bodyColor: 'rgba(255,255,255,0.8)',
            borderColor: 'rgba(212,168,67,0.3)',
            borderWidth: 1,
        }
    }
};

function initCharts(slideIndex) {
    if (chartsInited[slideIndex]) return;
    chartsInited[slideIndex] = true;

    // Slide 3 (index 3) — Audience Pie
    if (slideIndex === 3) {
        new Chart(document.getElementById('audiencePieChart'), {
            type: 'doughnut',
            data: {
                labels: ['Tier 1: ผู้จัดการ/หัวหน้า', 'Tier 2: SME/พนักงาน', 'Tier 3: HR/IT/Consultant'],
                datasets: [{
                    data: [50, 35, 15],
                    backgroundColor: [COLORS.gold, COLORS.maroonEnd, COLORS.white20],
                    borderColor: 'rgba(255,255,255,0.05)',
                    borderWidth: 2,
                    hoverOffset: 8
                }]
            },
            options: {
                ...chartDefaults,
                cutout: '65%',
                plugins: { ...chartDefaults.plugins }
            }
        });
    }

    // Slide 6 (index 6) — Cost Pie
    if (slideIndex === 6) {
        new Chart(document.getElementById('costPieChart'), {
            type: 'doughnut',
            data: {
                labels: ['Fixed Cost (วิทยากร/การตลาด/สื่อ)', 'Variable Cost (สถานที่/อาหาร 80 คน)', 'Contingency'],
                datasets: [{
                    data: [68000, 82000, 10000],
                    backgroundColor: [COLORS.maroonEnd, COLORS.gold, COLORS.white20],
                    borderColor: 'rgba(255,255,255,0.05)',
                    borderWidth: 2,
                    hoverOffset: 8
                }]
            },
            options: {
                ...chartDefaults,
                cutout: '60%',
                plugins: { ...chartDefaults.plugins, legend: { ...chartDefaults.plugins.legend, position: 'bottom' } }
            }
        });
    }

    // Slide 7 (index 7) — Profit Bar
    if (slideIndex === 7) {
        new Chart(document.getElementById('profitBarChart'), {
            type: 'bar',
            data: {
                labels: ['60 คน', 'Break-even (~32)', '80 คน (เป้า)', '100 คน'],
                datasets: [
                    {
                        label: 'รายได้คาดการณ์ (บาท)',
                        data: [188000, 105000, 266000, 334000],
                        backgroundColor: 'rgba(212,168,67,0.2)',
                        borderColor: COLORS.gold,
                        borderWidth: 1.5,
                        borderRadius: 4,
                    },
                    {
                        label: 'กำไรสุทธิ (บาท)',
                        data: [51000, 0, 106000, 151000],
                        backgroundColor: (ctx) => {
                            const v = ctx.parsed.y;
                            return v > 0 ? 'rgba(92,184,92,0.4)' : (v === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(220,53,69,0.35)');
                        },
                        borderColor: (ctx) => {
                            const v = ctx.parsed.y;
                            return v > 0 ? COLORS.green : (v === 0 ? '#fff' : COLORS.red);
                        },
                        borderWidth: 1.5,
                        borderRadius: 4,
                    }
                ]
            },
            options: {
                ...chartDefaults,
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        ticks: { color: 'rgba(255,255,255,0.6)', font: { size: 10 } },
                        grid: { color: 'rgba(255,255,255,0.05)' }
                    },
                    y: {
                        ticks: {
                            color: 'rgba(255,255,255,0.5)',
                            font: { size: 10 },
                            callback: v => (v / 1000).toFixed(0) + 'K'
                        },
                        grid: { color: 'rgba(255,255,255,0.06)' }
                    }
                }
            }
        });
    }

    // Slide 8 (index 8) — Line chart
    if (slideIndex === 8) {
        new Chart(document.getElementById('ticketLineChart'), {
            type: 'line',
            data: {
                labels: ['มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.(ก่อนงาน)'],
                datasets: [
                    {
                        label: 'Super / Early Bird',
                        data: [15, 40, 40, 40],
                        borderColor: COLORS.gold,
                        backgroundColor: 'rgba(212,168,67,0.1)',
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: COLORS.gold,
                        pointRadius: 5,
                    },
                    {
                        label: 'Regular / Corporate',
                        data: [0, 5, 25, 40],
                        borderColor: COLORS.maroonEnd,
                        backgroundColor: 'rgba(173,95,108,0.1)',
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: COLORS.maroonEnd,
                        pointRadius: 5,
                    },
                    {
                        label: 'รวมเป้า 80 ใบ',
                        data: [15, 45, 65, 80],
                        borderColor: '#9de09d',
                        backgroundColor: 'rgba(92,184,92,0.05)',
                        fill: false,
                        tension: 0.4,
                        pointBackgroundColor: '#9de09d',
                        pointRadius: 5,
                        borderDash: [4, 4],
                    }
                ]
            },
            options: {
                ...chartDefaults,
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        ticks: { color: 'rgba(255,255,255,0.6)', font: { size: 11 } },
                        grid: { color: 'rgba(255,255,255,0.04)' }
                    },
                    y: {
                        max: 100,
                        ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 10 }, callback: v => v + ' คน' },
                        grid: { color: 'rgba(255,255,255,0.05)' }
                    }
                }
            }
        });

        new Chart(document.getElementById('revenueMixChart'), {
            type: 'doughnut',
            data: {
                labels: ['Super/Early Bird', 'Regular / Corporate'],
                datasets: [{
                    data: [110000, 156000],
                    backgroundColor: [COLORS.gold, COLORS.maroonEnd],
                    borderColor: 'rgba(255,255,255,0.05)',
                    borderWidth: 2,
                    hoverOffset: 6
                }]
            },
            options: {
                ...chartDefaults,
                cutout: '60%',
                plugins: { ...chartDefaults.plugins, legend: { ...chartDefaults.plugins.legend, position: 'bottom', labels: { ...chartDefaults.plugins.legend.labels, font: { size: 10 } } } }
            }
        });
    }
}

// Init slide 0
initCharts(0);
