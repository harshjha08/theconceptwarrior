/* ============================================================
   THE CONCEPT WARRIORS — MAIN SCRIPT
   ============================================================ */

// ── THEME MANAGEMENT ─────────────────────────────────────────
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const icon = document.getElementById('themeIcon');
  if (icon) icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'light' ? 'dark' : 'light';
  localStorage.setItem('cw-theme', next);
  applyTheme(next);
}
(function () {
  const saved = localStorage.getItem('cw-theme') || 'light';
  applyTheme(saved);
})();

// ── NAVBAR ───────────────────────────────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (!navbar) return;
  navbar.classList.toggle('scrolled', window.scrollY > 20);
  const btt = document.getElementById('backToTop');
  if (btt) btt.classList.toggle('visible', window.scrollY > 400);
});

function toggleMenu() {
  const links = document.getElementById('navLinks');
  const ham = document.getElementById('hamburger');
  if (!links) return;
  links.classList.toggle('open');
  if (ham) ham.classList.toggle('open');
}
// Close menu on link click
document.querySelectorAll('.nav-link').forEach(l => {
  l.addEventListener('click', () => {
    const links = document.getElementById('navLinks');
    if (links) links.classList.remove('open');
  });
});

function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

// ── POPUPS ───────────────────────────────────────────────────
function openPopup(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closePopup(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('active');
  document.body.style.overflow = '';
}
function openDemoPopup() { closePopup('welcomePopup'); openPopup('demoPopup'); }
function openEnrollPopup() { openPopup('enrollPopup'); }

// Close popup on overlay click
document.querySelectorAll('.popup-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closePopup(overlay.id);
  });
});

// Welcome popup
setTimeout(() => { if (document.getElementById('welcomePopup')) openPopup('welcomePopup'); }, 2500);

// ── FORM SUBMISSIONS ─────────────────────────────────────────
function getFormData(fields) {
  const data = {};
  fields.forEach(f => {
    const el = document.getElementById(f);
    if (el) data[f] = el.value;
  });
  return data;
}
function storeSubmission(key, data) {
  const existing = JSON.parse(localStorage.getItem(key) || '[]');
  existing.push({ ...data, timestamp: new Date().toISOString(), status: 'New' });
  localStorage.setItem(key, JSON.stringify(existing));
}
function showSuccess() { openPopup('successPopup'); }

function submitDemo() {
  const data = getFormData(['demoName','demoPhone','demoEmail','demoClass','demoGoal']);
  if (!data.demoName || !data.demoPhone) { alert('Please fill Name and Phone.'); return; }
  storeSubmission('cw-demo-requests', data);
  closePopup('demoPopup');
  showSuccess();
}
function submitEnroll() {
  const data = getFormData(['enrollName','enrollPhone','enrollEmail','enrollCourse','enrollMode']);
  if (!data.enrollName || !data.enrollPhone) { alert('Please fill Name and Phone.'); return; }
  storeSubmission('cw-enroll-requests', data);
  closePopup('enrollPopup');
  showSuccess();
}

// Generic contact form submit
function submitForm(formId, storageKey) {
  const form = document.getElementById(formId);
  if (!form) return;
  const inputs = form.querySelectorAll('input, select, textarea');
  const data = {};
  inputs.forEach(i => { if (i.name || i.id) data[i.name || i.id] = i.value; });
  storeSubmission(storageKey, data);
  form.reset();
  showSuccess();
}

// ── COUNTERS ─────────────────────────────────────────────────
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 2000;
  const step = Math.ceil(target / (duration / 16));
  let current = 0;
  const interval = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current.toLocaleString();
    if (current >= target) clearInterval(interval);
  }, 16);
}
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !entry.target.dataset.counted) {
      entry.target.dataset.counted = 'true';
      animateCounter(entry.target);
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('.counter').forEach(c => counterObserver.observe(c));

// ── FAQ ──────────────────────────────────────────────────────
function toggleFaq(btn) {
  const answer = btn.nextElementSibling;
  const isOpen = answer.classList.contains('open');
  document.querySelectorAll('.faq-answer.open').forEach(a => {
    a.classList.remove('open');
    a.previousElementSibling.classList.remove('active');
  });
  if (!isOpen) {
    answer.classList.add('open');
    btn.classList.add('active');
  }
}

// ── TESTIMONIALS CAROUSEL ────────────────────────────────────
let testimonialIndex = 0;
const testimonialTrack = document.getElementById('testimonialTrack');
const cards = testimonialTrack ? testimonialTrack.querySelectorAll('.testimonial-card') : [];
let cardsPerView = window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3;

function buildDots() {
  const dotsContainer = document.getElementById('carouselDots');
  if (!dotsContainer || !cards.length) return;
  const totalSlides = Math.ceil(cards.length / cardsPerView);
  dotsContainer.innerHTML = '';
  for (let i = 0; i < totalSlides; i++) {
    const dot = document.createElement('div');
    dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
    dot.addEventListener('click', () => goToSlide(i));
    dotsContainer.appendChild(dot);
  }
}
function goToSlide(idx) {
  const totalSlides = Math.ceil(cards.length / cardsPerView);
  testimonialIndex = (idx + totalSlides) % totalSlides;
  if (testimonialTrack) {
    const cardWidth = cards[0] ? cards[0].offsetWidth + 24 : 0;
    testimonialTrack.style.transform = `translateX(-${testimonialIndex * cardsPerView * cardWidth}px)`;
  }
  document.querySelectorAll('.carousel-dot').forEach((d, i) => {
    d.classList.toggle('active', i === testimonialIndex);
  });
}
function slideTestimonial(dir) { goToSlide(testimonialIndex + dir); }
window.addEventListener('resize', () => {
  cardsPerView = window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3;
  goToSlide(0);
  buildDots();
});
buildDots();
setInterval(() => slideTestimonial(1), 5000);

// ── CHATBOT ──────────────────────────────────────────────────
function toggleChatbot() {
  const panel = document.getElementById('chatbotPanel');
  const icon = document.getElementById('chatbotIcon');
  if (!panel) return;
  const isOpen = panel.classList.toggle('open');
  if (icon) icon.className = isOpen ? 'fas fa-times' : 'fas fa-comments';
}

const botReplies = {
  courses: `📚 <strong>Our Courses:</strong><br>
• Foundation (Class 8-10)<br>
• NEET Preparation<br>
• JEE Main & Advanced<br>
• CUET Preparation<br>
• Board Exam Prep<br>
• Personal Mentorship<br><br>
Visit our <a href="courses.html" style="color:var(--primary)">Courses page</a> for full details!`,
  demo: `🎯 <strong>Book a Free Demo Class!</strong><br>
It's super easy — just click the button below and fill in your details. Sandeep Sir will call you within 24 hours.<br><br>
No commitment, completely free! 🙌`,
  fees: `💰 <strong>Fee Structure:</strong><br>
Fees depend on your program, mode (online/offline), and number of subjects. We believe in transparent, value-first pricing.<br><br>
📲 <strong>Contact us for a personalized quote:</strong><br>
WhatsApp: <a href="https://wa.me/918427168892" target="_blank" style="color:#25D366">8427168892</a>`,
  contact: `📞 <strong>Contact Sandeep Sir:</strong><br>
📱 WhatsApp: <a href="https://wa.me/918427168892" target="_blank" style="color:#25D366">+91 8427168892</a><br>
📧 Email: sandeep@conceptwarriors.in<br>
📍 Punjab, India (Online Nationwide)`,
  neet: `🏥 <strong>NEET Preparation:</strong><br>
Complete Physics, Chemistry coverage with concept-first approach, mock tests, and previous year papers. Sandeep Sir has guided multiple NEET qualifiers personally.`,
  jee: `⚙️ <strong>JEE Preparation:</strong><br>
JEE Main & Advanced with advanced problem solving, short tricks, and intensive practice. Many students have achieved 90%+ percentile.`,
  default: `I'm not sure about that specific question! 🤔<br><br>
For the best answer, please:<br>
📲 WhatsApp: <a href="https://wa.me/918427168892" target="_blank" style="color:#25D366">8427168892</a><br>
Or <a href="contact.html" style="color:var(--primary)">visit our contact page</a>.`
};

function sendBotMessage(key) {
  const messages = document.getElementById('chatbotMessages');
  if (!messages) return;
  const reply = botReplies[key] || botReplies.default;
  const msgEl = document.createElement('div');
  msgEl.className = 'bot-message';
  msgEl.innerHTML = `<p>${reply}</p>`;
  messages.appendChild(msgEl);
  if (key === 'demo') {
    const btn = document.createElement('button');
    btn.textContent = '📅 Book Free Demo Now';
    btn.className = 'btn-primary btn-sm';
    btn.style.marginTop = '8px';
    btn.onclick = openDemoPopup;
    msgEl.appendChild(btn);
  }
  messages.scrollTop = messages.scrollHeight;
}

function sendChatMessage() {
  const input = document.getElementById('chatInput');
  if (!input || !input.value.trim()) return;
  const messages = document.getElementById('chatbotMessages');
  const userMsg = input.value.trim();
  const userEl = document.createElement('div');
  userEl.className = 'user-message';
  userEl.innerHTML = `<p>${userMsg}</p>`;
  messages.appendChild(userEl);
  input.value = '';
  const lower = userMsg.toLowerCase();
  let key = 'default';
  if (lower.includes('course') || lower.includes('program') || lower.includes('class')) key = 'courses';
  else if (lower.includes('demo') || lower.includes('free') || lower.includes('trial')) key = 'demo';
  else if (lower.includes('fee') || lower.includes('price') || lower.includes('cost') || lower.includes('charge')) key = 'fees';
  else if (lower.includes('contact') || lower.includes('number') || lower.includes('phone') || lower.includes('whatsapp')) key = 'contact';
  else if (lower.includes('neet') || lower.includes('medical')) key = 'neet';
  else if (lower.includes('jee') || lower.includes('engineering')) key = 'jee';
  setTimeout(() => { sendBotMessage(key); messages.scrollTop = messages.scrollHeight; }, 600);
}

function handleChatKey(e) { if (e.key === 'Enter') sendChatMessage(); }

// ── AOS INIT ─────────────────────────────────────────────────
if (typeof AOS !== 'undefined') {
  AOS.init({ once: true, duration: 700, easing: 'ease-out-cubic', offset: 60 });
}


// ── SKILL BARS (about page) ──────────────────────────────────
function animateSkills() {
  document.querySelectorAll('.skill-progress').forEach(bar => {
    bar.style.width = bar.dataset.width || '90%';
  });
}
const skillObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { animateSkills(); skillObserver.disconnect(); } });
}, { threshold: 0.3 });
const skillSection = document.querySelector('.skills-section-inner');
if (skillSection) skillObserver.observe(skillSection);

// ── COURSE FILTER ────────────────────────────────────────────
function filterCourses(category) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  document.querySelectorAll('.course-card').forEach(card => {
    const cat = card.dataset.category || '';
    card.style.display = (category === 'all' || cat === category) ? 'flex' : 'none';
  });
}

// ── EXAM TABS ────────────────────────────────────────────────
function switchExamTab(id) {
  document.querySelectorAll('.exam-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.exam-content').forEach(c => c.classList.remove('active'));
  event.target.classList.add('active');
  const content = document.getElementById(id);
  if (content) content.classList.add('active');
}

// ── LMS NAV ──────────────────────────────────────────────────
function showLmsSection(id) {
  document.querySelectorAll('.lms-nav-item').forEach(i => i.classList.remove('active'));
  document.querySelectorAll('.lms-section').forEach(s => s.classList.remove('active'));
  event.currentTarget.classList.add('active');
  const section = document.getElementById(id);
  if (section) section.classList.add('active');
  const title = document.getElementById('lmsPageTitle');
  if (title) title.textContent = event.currentTarget.querySelector('span').textContent;
}

// ── LMS LOGIN ────────────────────────────────────────────────
function lmsLogin() {
  const user = document.getElementById('lmsUsername');
  const pass = document.getElementById('lmsPassword');
  if (!user || !pass) return;
  const validCreds = [
    { u: 'student@demo.com', p: 'demo123' },
    { u: 'arjun@cw.in', p: 'arjun123' },
    { u: 'simran@cw.in', p: 'simran123' }
  ];
  const found = validCreds.find(c => c.u === user.value.trim() && c.p === pass.value.trim());
  if (found) {
    localStorage.setItem('cw-lms-logged', 'true');
    localStorage.setItem('cw-lms-user', user.value.trim());
    window.location.href = 'lms-dashboard.html';
  } else {
    showError('lmsError', 'Invalid credentials. Try: student@demo.com / demo123');
  }
}
function lmsLogout() {
  localStorage.removeItem('cw-lms-logged');
  window.location.href = 'lms-login.html';
}
function checkLmsAuth() {
  if (!localStorage.getItem('cw-lms-logged') && window.location.pathname.includes('lms-dashboard')) {
    window.location.href = 'lms-login.html';
  }
}
checkLmsAuth();

// ── ADMIN LOGIN ──────────────────────────────────────────────
function adminLogin() {
  const user = document.getElementById('adminUser');
  const pass = document.getElementById('adminPass');
  if (!user || !pass) return;
  if (user.value === 'admin@conceptwarriors.in' && pass.value === 'Admin@2025') {
    localStorage.setItem('cw-admin-logged', 'true');
    window.location.href = 'admin.html';
  } else {
    showError('adminError', 'Invalid credentials. Contact system admin.');
  }
}
function adminLogout() {
  localStorage.removeItem('cw-admin-logged');
  window.location.href = 'admin-login.html';
}
function checkAdminAuth() {
  if (!localStorage.getItem('cw-admin-logged') && window.location.pathname.includes('admin.html')) {
    window.location.href = 'admin-login.html';
  }
}
checkAdminAuth();

function showError(id, msg) {
  let el = document.getElementById(id);
  if (!el) { el = document.createElement('p'); el.id = id; el.style.cssText = 'color:var(--danger);font-size:0.85rem;margin-top:8px;text-align:center;'; }
  el.textContent = msg;
  const btn = document.querySelector('.lms-form .btn-primary') || document.querySelector('.admin-login-card .btn-primary');
  if (btn && btn.parentNode) btn.parentNode.insertBefore(el, btn.nextSibling);
}

// ── ADMIN NAV ────────────────────────────────────────────────
function showAdminSection(id) {
  document.querySelectorAll('.admin-nav-item').forEach(i => i.classList.remove('active'));
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  event.currentTarget.classList.add('active');
  const section = document.getElementById(id);
  if (section) section.classList.add('active');
  const title = document.getElementById('adminPageTitle');
  if (title) title.textContent = event.currentTarget.querySelector('span').textContent;
}

// ── ADMIN DATA LOADER ────────────────────────────────────────
function loadAdminData() {
  const seedDemo = [
    { demoName: 'Priya Sharma', demoPhone: '9876543210', demoEmail: 'priya@email.com', demoClass: 'Class 12', demoGoal: 'NEET', timestamp: new Date().toISOString(), status: 'New' },
    { demoName: 'Rahul Verma', demoPhone: '9988776655', demoEmail: 'rahul@email.com', demoClass: 'Class 11', demoGoal: 'JEE Main', timestamp: new Date().toISOString(), status: 'Contacted' }
  ];
  const seedEnroll = [
    { enrollName: 'Ananya Singh', enrollPhone: '9112233445', enrollEmail: 'ananya@email.com', enrollCourse: 'NEET Preparation', enrollMode: 'Online', timestamp: new Date().toISOString(), status: 'New' }
  ];
  const seedCallback = [
    { name: 'Mohan Lal', phone: '9001122334', email: 'mohan@email.com', timestamp: new Date().toISOString(), status: 'New' }
  ];
  if (!localStorage.getItem('cw-demo-requests')) localStorage.setItem('cw-demo-requests', JSON.stringify(seedDemo));
  if (!localStorage.getItem('cw-enroll-requests')) localStorage.setItem('cw-enroll-requests', JSON.stringify(seedEnroll));
  if (!localStorage.getItem('cw-callback-requests')) localStorage.setItem('cw-callback-requests', JSON.stringify(seedCallback));

  renderTable('demoTable', 'cw-demo-requests', ['demoName','demoPhone','demoEmail','demoClass','demoGoal']);
  renderTable('enrollTable', 'cw-enroll-requests', ['enrollName','enrollPhone','enrollEmail','enrollCourse','enrollMode']);
  renderTable('callbackTable', 'cw-callback-requests', ['name','phone','email']);
  updateAdminStats();
}

function renderTable(tableId, storageKey, fields) {
  const table = document.getElementById(tableId);
  if (!table) return;
  const data = JSON.parse(localStorage.getItem(storageKey) || '[]');
  if (!data.length) { table.innerHTML = '<tr><td colspan="10" style="text-align:center;color:var(--text-muted);padding:20px;">No submissions yet.</td></tr>'; return; }
  table.innerHTML = data.map((row, idx) => `
    <tr>
      <td>${idx + 1}</td>
      ${fields.map(f => `<td>${row[f] || '—'}</td>`).join('')}
      <td>${new Date(row.timestamp).toLocaleDateString()}</td>
      <td><span class="status-badge badge-${(row.status || 'New').toLowerCase()}">${row.status || 'New'}</span></td>
      <td>
        <button class="action-btn" onclick="updateStatus('${storageKey}',${idx},'Contacted')">Mark Contacted</button>
        <button class="action-btn" onclick="updateStatus('${storageKey}',${idx},'Enrolled')" style="margin-left:4px;">Enroll</button>
      </td>
    </tr>
  `).join('');
}

function updateStatus(key, idx, status) {
  const data = JSON.parse(localStorage.getItem(key) || '[]');
  if (data[idx]) data[idx].status = status;
  localStorage.setItem(key, JSON.stringify(data));
  loadAdminData();
}

function updateAdminStats() {
  const demo = JSON.parse(localStorage.getItem('cw-demo-requests') || '[]');
  const enroll = JSON.parse(localStorage.getItem('cw-enroll-requests') || '[]');
  const callback = JSON.parse(localStorage.getItem('cw-callback-requests') || '[]');
  const total = demo.length + enroll.length + callback.length;
  const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  el('statTotal', total);
  el('statDemo', demo.length);
  el('statEnroll', enroll.length);
  el('statCallback', callback.length);
}

// Init admin if on admin page
if (window.location.pathname.includes('admin.html')) {
  document.addEventListener('DOMContentLoaded', loadAdminData);
}

// ── SMOOTH ANCHOR SCROLL ─────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});

// ── TILT EFFECT ──────────────────────────────────────────────
document.querySelectorAll('.course-card, .why-card, .subject-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(1000px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-6px)`;
  });
  card.addEventListener('mouseleave', () => { card.style.transform = ''; });
});

// ── HASH ROUTING (exam tabs) ─────────────────────────────────
function handleHash() {
  const hash = window.location.hash.replace('#', '');
  if (hash && document.getElementById(hash)) {
    const tab = document.querySelector(`[data-tab="${hash}"]`);
    if (tab) tab.click();
    setTimeout(() => { document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' }); }, 200);
  }
}
window.addEventListener('hashchange', handleHash);
document.addEventListener('DOMContentLoaded', handleHash);