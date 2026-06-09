/**
 * NeuroStrat AI — Core Frontend Logic
 * Handles: Particles, Neural Network Canvas, Auth, Sidebar, Reveals, Utilities
 */

// ─── Particle Background ──────────────────────────────────────────────────────
function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    const particles = [];
    const COUNT = Math.min(80, Math.floor(W * H / 18000));

    for (let i = 0; i < COUNT; i++) {
        particles.push({
            x: Math.random() * W, y: Math.random() * H,
            vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
            r: Math.random() * 2 + 1,
            alpha: Math.random() * 0.5 + 0.1
        });
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);
        // Draw connections
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(109,40,217,${0.12 * (1 - dist / 120)})`;
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
        // Draw dots
        particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(109,40,217,${p.alpha * 0.7})`;
            ctx.fill();
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0 || p.x > W) p.vx *= -1;
            if (p.y < 0 || p.y > H) p.vy *= -1;
        });
        requestAnimationFrame(draw);
    }
    draw();

    window.addEventListener('resize', () => {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
    });
}

// ─── Neural Network Canvas (Login Visual) ────────────────────────────────────
function initNeuralNetwork() {
    const canvas = document.getElementById('neural-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const W = canvas.width, H = canvas.height;

    const nodes = [];
    const layers = [4, 6, 6, 4];
    const layerSpacing = W / (layers.length + 1);

    layers.forEach((count, li) => {
        const nodeSpacing = H / (count + 1);
        for (let ni = 0; ni < count; ni++) {
            nodes.push({
                x: layerSpacing * (li + 1),
                y: nodeSpacing * (ni + 1),
                layer: li,
                pulse: Math.random() * Math.PI * 2
            });
        }
    });

    function draw() {
        ctx.clearRect(0, 0, W, H);
        const t = Date.now() / 1000;

        // Connections
        nodes.forEach(n => {
            nodes.forEach(m => {
                if (m.layer === n.layer + 1) {
                    const alpha = 0.08 + 0.05 * Math.sin(t + n.pulse);
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(109,40,217,${alpha})`;
                    ctx.lineWidth = 0.8;
                    ctx.moveTo(n.x, n.y);
                    ctx.lineTo(m.x, m.y);
                    ctx.stroke();
                }
            });
        });

        // Nodes
        nodes.forEach(n => {
            const pulse = 0.4 + 0.3 * Math.sin(t * 2 + n.pulse);
            ctx.beginPath();
            ctx.arc(n.x, n.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(109,40,217,${pulse})`;
            ctx.fill();
            // Glow ring
            ctx.beginPath();
            ctx.arc(n.x, n.y, 8, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(37,99,235,${pulse * 0.4})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        });
        requestAnimationFrame(draw);
    }
    draw();
}

// ─── Auth Logic ───────────────────────────────────────────────────────────────
let isSignUp = false;
const NS_AUTH_API_BASE = 'http://localhost:8000';
const NS_EMAIL_RE = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/;

function normalizeEmail(email) {
    return (email || '').trim().toLowerCase();
}

function isValidEmail(email) {
    if (!NS_EMAIL_RE.test(email) || email.length > 254) return false;
    const [local, domain] = email.split('@');
    if (!local || local.length > 64 || !domain) return false;
    return domain.split('.').every(part => part && !part.startsWith('-') && !part.endsWith('-'));
}

function isStrongPassword(password) {
    return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
}

function getStoredAccounts() {
    return JSON.parse(localStorage.getItem('ns_accounts') || '[]');
}

async function digestPassword(password) {
    if (!window.crypto?.subtle) return btoa(password);
    const bytes = new TextEncoder().encode(password);
    const hash = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function makeLocalToken() {
    return 'local_auth_' + (window.crypto?.randomUUID ? crypto.randomUUID() : Date.now());
}

async function localRegister(fullName, email, password) {
    const accounts = getStoredAccounts();
    if (accounts.some(account => account.email === email)) {
        throw new Error('An account with this email already exists.');
    }
    const account = {
        name: fullName,
        email,
        role: email.includes('admin') ? 'admin' : 'user',
        joined: new Date().toLocaleDateString(),
        passwordHash: await digestPassword(password)
    };
    accounts.push(account);
    localStorage.setItem('ns_accounts', JSON.stringify(accounts));
    const { passwordHash: _passwordHash, ...user } = account;
    return { token: makeLocalToken(), user };
}

async function localLogin(email, password) {
    const passwordHash = await digestPassword(password);
    const account = getStoredAccounts().find(item => item.email === email);
    if (!account || account.passwordHash !== passwordHash) {
        throw new Error('Invalid email or password.');
    }
    const { passwordHash: _passwordHash, ...user } = account;
    return { token: makeLocalToken(), user };
}

async function authenticateWithBackend(path, payload) {
    const response = await fetch(`${NS_AUTH_API_BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.detail || 'Authentication failed.');
    return data;
}

function toggleAuthMode() {
    isSignUp = !isSignUp;
    const signupFields = document.querySelectorAll('.signup-fields');
    const title = document.getElementById('auth-title');
    const subtitle = document.getElementById('auth-subtitle');
    const btn = document.getElementById('auth-btn');
    const toggle = document.getElementById('auth-toggle');
    const extras = document.getElementById('login-extras');
    const fullNameInput = document.getElementById('fullname');
    const confirmInput = document.getElementById('confirm-password');

    if (isSignUp) {
        signupFields.forEach(f => f.classList.add('show'));
        title.textContent = 'Create Account';
        subtitle.textContent = 'Join the NeuroStrat AI research platform';
        btn.textContent = 'Create Account';
        toggle.innerHTML = 'Already have an account? <a onclick="toggleAuthMode()">Sign In</a>';
        if (extras) extras.style.display = 'none';
        if (fullNameInput) fullNameInput.required = true;
        if (confirmInput) confirmInput.required = true;
    } else {
        signupFields.forEach(f => f.classList.remove('show'));
        title.textContent = 'Welcome Back';
        subtitle.textContent = 'Sign in to access the clinical dashboard';
        btn.textContent = 'Sign In';
        toggle.innerHTML = "Don't have an account? <a onclick=\"toggleAuthMode()\">Sign Up</a>";
        if (extras) extras.style.display = 'flex';
        if (fullNameInput) fullNameInput.required = false;
        if (confirmInput) confirmInput.required = false;
    }
}

async function handleAuth(e) {
    e.preventDefault();
    const btn = document.getElementById('auth-btn');
    const email = normalizeEmail(document.getElementById('email').value);
    const password = document.getElementById('password').value;

    if (!email || !password) { showToast('Please fill in all fields.', 'error'); return; }
    if (!isValidEmail(email)) { showToast('Please enter a valid email address.', 'error'); return; }
    if (!isStrongPassword(password)) {
        showToast('Password must be at least 8 characters and include a letter and a number.', 'error');
        return;
    }

    let name = '';
    if (isSignUp) {
        const confirm = document.getElementById('confirm-password').value;
        if (password !== confirm) { showToast('Passwords do not match.', 'error'); return; }
        name = document.getElementById('fullname').value.trim();
        if (name.length < 2) { showToast('Please enter your full name.', 'error'); return; }
    }

    btn.textContent = 'Authenticating...';
    btn.disabled = true;

    // Simulate auth — store session
    try {
        let result;
        try {
            result = isSignUp
                ? await authenticateWithBackend('/api/auth/register', { full_name: name, email, password })
                : await authenticateWithBackend('/api/auth/login', { email, password });
        } catch (backendError) {
            if (backendError.message && !backendError.message.includes('Failed to fetch')) throw backendError;
            result = isSignUp ? await localRegister(name, email, password) : await localLogin(email, password);
        }

        localStorage.setItem('ns_user', JSON.stringify(result.user));
        localStorage.setItem('ns_token', result.token);
        showToast(isSignUp ? 'Account created successfully! Redirecting...' : 'Login successful! Redirecting...', 'success');
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 900);
    } catch (err) {
        showToast(err.message || 'Authentication failed.', 'error');
        btn.textContent = isSignUp ? 'Create Account' : 'Sign In';
        btn.disabled = false;
    }
}

// ─── Session Guard ────────────────────────────────────────────────────────────
function requireAuth() {
    const token = localStorage.getItem('ns_token');
    if (!token) { window.location.href = 'index.html'; return null; }
    return JSON.parse(localStorage.getItem('ns_user') || '{}');
}

function logout() {
    localStorage.removeItem('ns_token');
    localStorage.removeItem('ns_user');
    window.location.href = 'index.html';
}

// ─── Per-User Data Isolation ──────────────────────────────────────────────────
/**
 * Returns the localStorage key for the current user's screening history.
 * Each account gets its own isolated key: ns_history_{email}
 * Falls back to a shared key only if no user is logged in (should not happen on protected pages).
 */
function getUserHistoryKey() {
    const user = JSON.parse(localStorage.getItem('ns_user') || '{}');
    const email = (user.email || '').trim().toLowerCase();
    return email ? `ns_history_${email}` : 'ns_history_guest';
}

/** Read the current user's screening history array. */
function getUserHistory() {
    return JSON.parse(localStorage.getItem(getUserHistoryKey()) || '[]');
}

/** Save an array as the current user's screening history. */
function setUserHistory(arr) {
    localStorage.setItem(getUserHistoryKey(), JSON.stringify(arr));
}

/** Prepend a new screening record to the current user's history. */
function appendUserHistory(record) {
    const history = getUserHistory();
    history.unshift(record);
    setUserHistory(history);
}

/** Current screening session key (shared — only one session at a time per browser). */
function getCurrentScreening() {
    return JSON.parse(localStorage.getItem('ns_current_screening') || '{}');
}
function setCurrentScreening(obj) {
    localStorage.setItem('ns_current_screening', JSON.stringify(obj));
}

// ─── Populate User Info ───────────────────────────────────────────────────────
function populateUser() {
    const user = requireAuth();
    if (!user) return;
    document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = user.name || 'User');
    document.querySelectorAll('[data-user-email]').forEach(el => el.textContent = user.email || '');
    document.querySelectorAll('[data-user-avatar]').forEach(el => {
        el.textContent = (user.name || 'U')[0].toUpperCase();
    });
    return user;
}

// ─── Sidebar Toggle ───────────────────────────────────────────────────────────
function initSidebar() {
    const toggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    if (toggle && sidebar) {
        toggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            if (overlay) overlay.classList.toggle('hidden');
        });
    }
    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar?.classList.remove('open');
            overlay.classList.add('hidden');
        });
    }

    // Mark active nav link
    const current = window.location.pathname.split('/').pop();
    document.querySelectorAll('.nav-menu a').forEach(a => {
        if (a.getAttribute('href') === current) a.classList.add('active');
    });
}

// ─── Scroll Reveal ────────────────────────────────────────────────────────────
function initReveal() {
    const els = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.1 });
    els.forEach(el => obs.observe(el));
}

// ─── Toast Notifications ──────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = 'position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;display:flex;flex-direction:column;gap:.5rem;';
        document.body.appendChild(container);
    }
    const colors = { success: '#10b981', error: '#ef4444', info: '#3b82f6', warning: '#f59e0b' };
    const toast = document.createElement('div');
    toast.style.cssText = `background:rgba(255,255,255,.95);backdrop-filter:blur(12px);border:1.5px solid ${colors[type] || colors.info};border-radius:12px;padding:.75rem 1.25rem;color:#1e1b2e;font-size:.9rem;min-width:240px;box-shadow:0 4px 24px rgba(30,27,46,.12);animation:fadeUp .3s ease;display:flex;align-items:center;gap:.5rem;`;
    toast.innerHTML = `<span style="color:${colors[type]};font-size:1rem;">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>${msg}`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity .3s'; setTimeout(() => toast.remove(), 300); }, 3500);
}

// ─── Loader ───────────────────────────────────────────────────────────────────
function showLoader(msg = 'Processing...') {
    const el = document.createElement('div');
    el.id = 'global-loader';
    el.className = 'loader-overlay';
    el.innerHTML = `<div class="loader-spinner"></div><p class="loader-text">${msg}</p>`;
    document.body.appendChild(el);
}
function hideLoader() {
    document.getElementById('global-loader')?.remove();
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
function animateCount(el, target, suffix = '', duration = 1500) {
    const start = performance.now();
    function step(now) {
        const progress = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(ease * target) + suffix;
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

// ─── Chart Bars ───────────────────────────────────────────────────────────────
function renderBarChart(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    const max = Math.max(...data.map(d => d.value), 1);
    data.forEach((item, i) => {
        const pct = (item.value / max) * 100;
        const row = document.createElement('div');
        row.className = 'chart-row';
        row.innerHTML = `
            <div class="chart-label">${item.label}</div>
            <div class="chart-bar-bg"><div class="chart-bar-fill" id="bar-${containerId}-${i}"></div></div>
            <div class="chart-val">${item.value}${item.suffix || '%'}</div>`;
        container.appendChild(row);
        setTimeout(() => {
            document.getElementById(`bar-${containerId}-${i}`).style.width = pct + '%';
        }, 200 + i * 120);
    });
}

// ─── Circular Progress ────────────────────────────────────────────────────────
function animateCircle(circleId, valueId, percent, color1 = '#7c3aed', color2 = '#3b82f6') {
    const circle = document.getElementById(circleId);
    const valueEl = document.getElementById(valueId);
    if (!circle || !valueEl) return;
    const svg = circle.closest('svg');
    let defs = svg.querySelector('defs');
    if (!defs) { defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs'); svg.prepend(defs); }
    defs.innerHTML = `<linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="${color1}"/><stop offset="100%" stop-color="${color2}"/></linearGradient>`;
    const circumference = 283;
    setTimeout(() => {
        circle.style.strokeDashoffset = circumference - (percent / 100) * circumference;
        let cur = 0;
        const iv = setInterval(() => {
            if (cur >= percent) clearInterval(iv);
            else { cur++; valueEl.textContent = cur + '%'; }
        }, 1500 / percent);
    }, 300);
}

// ─── Accordion (FAQ) ──────────────────────────────────────────────────────────
function initAccordion() {
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            const item = header.closest('.accordion-item');
            const isOpen = item.classList.contains('open');
            document.querySelectorAll('.accordion-item.open').forEach(i => i.classList.remove('open'));
            if (!isOpen) item.classList.add('open');
        });
    });
}

// ─── Search Filter ────────────────────────────────────────────────────────────
function initSearch(inputId, itemSelector) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.addEventListener('input', () => {
        const q = input.value.toLowerCase();
        document.querySelectorAll(itemSelector).forEach(el => {
            el.style.display = el.textContent.toLowerCase().includes(q) ? '' : 'none';
        });
    });
}

// ─── Wizard Steps ─────────────────────────────────────────────────────────────
let currentWizardStep = 1;
let totalWizardSteps = 3;

function goToStep(step) {
    document.querySelectorAll('.form-step').forEach((el, i) => {
        el.classList.toggle('active', i + 1 === step);
    });
    document.querySelectorAll('.wizard-step').forEach((el, i) => {
        el.classList.remove('active', 'done');
        if (i + 1 < step) el.classList.add('done');
        else if (i + 1 === step) el.classList.add('active');
    });
    currentWizardStep = step;
}

function nextStep() {
    if (currentWizardStep < totalWizardSteps) goToStep(currentWizardStep + 1);
}
function prevStep() {
    if (currentWizardStep > 1) goToStep(currentWizardStep - 1);
}

// ─── Age-Based Module Redirect ────────────────────────────────────────────────
function getAgeGroup(age) {
    age = parseInt(age);
    if (age >= 4 && age <= 8)  return { group: '4-8',   label: 'Behavioral Adventure',        module: 'module_4_8.html' };
    if (age >= 9 && age <= 11) return { group: '9-12',  label: 'Social Simulation',           module: 'module_9_12.html' };
    if (age >= 12 && age <= 16) return { group: '12-16', label: 'Voice Interaction',           module: 'module_12_16.html' };
    if (age >= 17 && age <= 22) return { group: '17-22', label: 'Social Reasoning & Voice',    module: 'module_17_22.html' };
    if (age > 22)               return { group: '22+',   label: 'Cognitive Interaction',       module: 'module_22plus.html' };
    return null;
}

// ─── Per-user history helpers ─────────────────────────────────────────────────
function getUserHistoryKey() {
    const user  = JSON.parse(localStorage.getItem('ns_user') || '{}');
    const email = (user.email || '').trim().toLowerCase();
    return email ? 'ns_history_' + email : 'ns_history_guest';
}
function getUserHistory() {
    return JSON.parse(localStorage.getItem(getUserHistoryKey()) || '[]');
}
function pushUserHistory(entry) {
    const key = getUserHistoryKey();
    const h   = JSON.parse(localStorage.getItem(key) || '[]');
    h.unshift(entry);
    localStorage.setItem(key, JSON.stringify(h));
}
function clearUserHistory() {
    localStorage.removeItem(getUserHistoryKey());
}

// ─── Expose shared utilities for pages that load after script.js ─────────────
window._sc_animateCount   = animateCount;
window._sc_renderBarChart = renderBarChart;
window.getUserHistoryKey  = getUserHistoryKey;
window.getUserHistory     = getUserHistory;
window.pushUserHistory    = pushUserHistory;
window.clearUserHistory   = clearUserHistory;

// ─── Init on DOM Load ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // initParticles();
    // initNeuralNetwork();
    initSidebar();
    initReveal();
    initAccordion();

    // If on auth page, check if already logged in
    const page = window.location.pathname.split('/').pop();
    if (page === 'index.html' || page === '') {
        if (localStorage.getItem('ns_token')) window.location.href = 'dashboard.html';
    }

    // Populate user info on all protected pages
    if (page !== 'index.html' && page !== '') {
        populateUser();
    }
});