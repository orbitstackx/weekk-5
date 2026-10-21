/* LearnHub SPA - vanilla JS client-side router, History API, state management */
(() => {
  'use strict';

  /* ---------- Data (simulated back-end) ---------- */
  const COURSES = [
    { id: 1, title: 'HTML Foundations', cat: 'Frontend', emoji: '🧱', level: 'Beginner', hours: 6, desc: 'Semantic markup, forms, accessibility and document structure.' },
    { id: 2, title: 'Modern CSS', cat: 'Frontend', emoji: '🎨', level: 'Beginner', hours: 8, desc: 'Flexbox, grid, custom properties, transitions and animations.' },
    { id: 3, title: 'JavaScript Essentials', cat: 'Frontend', emoji: '⚡', level: 'Intermediate', hours: 12, desc: 'DOM manipulation, events, async code and the History API.' },
    { id: 4, title: 'Node.js Basics', cat: 'Backend', emoji: '🟢', level: 'Intermediate', hours: 10, desc: 'Modules, HTTP servers and REST APIs with Node.js.' },
    { id: 5, title: 'SQL & Databases', cat: 'Backend', emoji: '🗄️', level: 'Intermediate', hours: 9, desc: 'Relational modelling, joins, indexes and transactions.' },
    { id: 6, title: 'Git & GitHub', cat: 'Tools', emoji: '🔀', level: 'Beginner', hours: 4, desc: 'Version control, branching, pull requests and collaboration.' }
  ];
  const CATS = ['All', ...new Set(COURSES.map(c => c.cat))];

  /* ---------- Application state ---------- */
  const state = { filter: 'All', search: '', draft: { name: '', email: '', msg: '' }, loading: false };
  const $ = (s, r = document) => r.querySelector(s);
  const app = $('#app');
  const USE_HASH = true;   // hash URLs (#/courses) work from any folder, host or file://, with no server rewrite rules
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  /* ---------- Simulated async API with optional failure ---------- */
  async function api(fn, delay = 350) {
    await sleep(delay);
    if (/[?&]fail\b/.test(location.hash + location.search)) throw new Error('Simulated network failure');
    return fn();
  }

  /* ---------- Views (return HTML strings) ---------- */
  const views = {
    home: () => `
      <section class="view">
        <div class="hero"><h1>Learn web development, one view at a time.</h1>
          <p>This site is a Single Page Application: every page you open is rendered by JavaScript without reloading the browser.</p>
          <a class="btn" href="/courses" data-link>Browse courses &rarr;</a></div>
        <div class="stats">
          <div class="stat"><b>${COURSES.length}</b>Courses</div>
          <div class="stat"><b>${COURSES.reduce((a, c) => a + c.hours, 0)}</b>Hours of content</div>
          <div class="stat"><b>0</b>Page reloads</div>
        </div>
      </section>`,

    courses: async () => {
      const list = await api(() => COURSES.filter(c =>
        (state.filter === 'All' || c.cat === state.filter) &&
        c.title.toLowerCase().includes(state.search.toLowerCase())));
      return `
      <section class="view"><h1>Courses</h1>
        <input id="search" type="search" placeholder="Search courses…" value="${esc(state.search)}" aria-label="Search courses">
        <div class="toolbar">${CATS.map(c => `<button class="chip ${c === state.filter ? 'on' : ''}" data-filter="${c}">${c}</button>`).join('')}</div>
        <div class="grid" id="grid">${gridHTML(list)}</div>
      </section>`;
    },

    course: async ({ id }) => {
      const c = await api(() => COURSES.find(x => x.id === Number(id)));
      if (!c) return null;                      // triggers 404 view
      return `
      <section class="view"><p class="crumbs"><a href="/courses" data-link>Courses</a> / ${esc(c.title)}</p>
        <div class="panel"><div class="emoji" style="font-size:3rem">${c.emoji}</div>
          <h1>${esc(c.title)}</h1>
          <p><span class="tag">${c.cat}</span> <span class="tag">${c.level}</span> <span class="tag">${c.hours} hours</span></p>
          <p>${esc(c.desc)}</p>
          <button class="btn primary" id="enrol">Enrol now</button>
          <button class="btn" id="back" style="border:1px solid var(--border)">&larr; Back</button></div>
      </section>`;
    },

    about: () => `
      <section class="view"><h1>About this project</h1>
        <div class="panel"><p>LearnHub demonstrates client-side routing with the History API, dynamic DOM rendering, state management, transitions and graceful error handling.</p>
          <ul><li>Routes: <code>/</code>, <code>/courses</code>, <code>/courses/:id</code>, <code>/about</code>, <code>/contact</code></li>
          <li>Back/forward buttons work through <code>popstate</code></li>
          <li>Unknown URLs render a 404 view; add <code>?fail</code> to a URL to see the error view</li></ul></div>
      </section>`,

    contact: () => `
      <section class="view"><h1>Contact</h1>
        <form class="panel" id="form" novalidate>
          <label for="name">Name</label><input id="name" value="${esc(state.draft.name)}"><div class="err" data-for="name"></div>
          <label for="email">Email</label><input id="email" type="email" value="${esc(state.draft.email)}"><div class="err" data-for="email"></div>
          <label for="msg">Message</label><textarea id="msg" rows="4">${esc(state.draft.msg)}</textarea><div class="err" data-for="msg"></div>
          <button class="btn primary" type="submit">Send</button>
        </form>
      </section>`,

    notFound: path => `
      <section class="view state"><div style="font-size:4rem">🧭</div><h1>404 &ndash; Page not found</h1>
        <p>No view matches <code>${esc(path)}</code>.</p><a class="btn primary" href="/" data-link>Go home</a></section>`,

    error: msg => `
      <section class="view state"><div style="font-size:4rem">⚠️</div><h1>Something went wrong</h1>
        <p>${esc(msg)}</p><button class="btn primary" id="retry">Try again</button></section>`
  };

  const gridHTML = list => list.length
    ? list.map(c => `<a class="card" href="/courses/${c.id}" data-link><div class="emoji">${c.emoji}</div><h3>${esc(c.title)}</h3><p>${esc(c.desc)}</p><p style="margin-top:.6rem"><span class="tag">${c.level}</span></p></a>`).join('')
    : '<p>No courses match your search.</p>';

  /* ---------- Route table ---------- */
  const routes = [
    { re: /^\/$/, view: views.home, title: 'Home', bind: () => {} },
    { re: /^\/courses\/?$/, view: views.courses, title: 'Courses', bind: bindCourses },
    { re: /^\/courses\/(\d+)\/?$/, view: views.course, title: 'Course', params: ['id'], bind: bindCourse },
    { re: /^\/about\/?$/, view: views.about, title: 'About', bind: () => {} },
    { re: /^\/contact\/?$/, view: views.contact, title: 'Contact', bind: bindContact }
  ];

  /* ---------- Router ---------- */
  const currentPath = () => (location.hash.slice(1).split('?')[0] || '/');
  const fixLinks = () => document.querySelectorAll('a[data-link]').forEach(a => { const h = a.dataset.path || a.getAttribute('href'); if (h.startsWith('/')) { a.dataset.path = h; a.setAttribute('href', '#' + h); } });

  function href(path) { return USE_HASH ? '#' + path : path; }

  function navigate(path, { replace = false } = {}) {
    if (path === currentPath() && !location.hash.includes('?') && !replace) return;
    const url = USE_HASH ? '#' + path : path;
    history[replace ? 'replaceState' : 'pushState']({ path, scroll: 0 }, '', url);
    render();
  }

  let token = 0;                                     // guards against out-of-order async renders
  async function render() {
    const my = ++token;
    const path = currentPath();
    const route = routes.find(r => r.re.test(path));
    setActive(path);
    startProgress();
    const old = $('.view', app);
    if (old) { old.classList.add('leaving'); await sleep(180); }

    let html, title = 'Not found';
    try {
      if (!route) { html = views.notFound(path); }
      else {
        const m = path.match(route.re);
        const params = Object.fromEntries((route.params || []).map((k, i) => [k, m[i + 1]]));
        app.innerHTML = '<div class="view state"><div class="spinner"></div><p>Loading…</p></div>';
        html = await route.view(params);
        title = route.title;
        if (html === null) { html = views.notFound(path); title = 'Not found'; }
      }
    } catch (e) { html = views.error(e.message); title = 'Error'; }

    if (my !== token) return;                        // a newer navigation superseded this one
    app.innerHTML = html;
    fixLinks();
    document.title = `${title} · LearnHub`;
    stopProgress();
    app.focus({ preventScroll: true });
    window.scrollTo(0, history.state?.scroll || 0);
    if (route && html && !html.includes('state"')) route.bind();
    $('#retry')?.addEventListener('click', render);
    $('#menu-btn').setAttribute('aria-expanded', 'false'); $('#nav').classList.remove('open');
  }

  /* ---------- View behaviour ---------- */
  function bindCourses() {
    $('#search').addEventListener('input', e => {
      state.search = e.target.value;
      $('#grid').innerHTML = gridHTML(COURSES.filter(c => (state.filter === 'All' || c.cat === state.filter) && c.title.toLowerCase().includes(state.search.toLowerCase())));
    });
    app.querySelectorAll('[data-filter]').forEach(b => b.addEventListener('click', () => { state.filter = b.dataset.filter; render(); }));
  }
  function bindCourse() {
    $('#enrol').addEventListener('click', () => toast('Enrolled! (simulated)'));
    $('#back').addEventListener('click', () => history.length > 1 ? history.back() : navigate('/courses'));
  }
  function bindContact() {
    const f = $('#form');
    f.addEventListener('input', e => { state.draft[e.target.id] = e.target.value; });   // draft survives navigation
    f.addEventListener('submit', e => {
      e.preventDefault();
      const d = state.draft, errs = {};
      if (d.name.trim().length < 2) errs.name = 'Please enter your name.';
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) errs.email = 'Enter a valid email.';
      if (d.msg.trim().length < 10) errs.msg = 'Message must be at least 10 characters.';
      f.querySelectorAll('.err').forEach(el => el.textContent = errs[el.dataset.for] || '');
      if (Object.keys(errs).length) return;
      state.draft = { name: '', email: '', msg: '' };
      toast('Message sent! (simulated)'); navigate('/');
    });
  }

  /* ---------- UI helpers ---------- */
  function setActive(path) {
    document.querySelectorAll('.nav a').forEach(a => {
      const p = a.getAttribute('href');
      a.classList.toggle('active', p === '/' ? path === '/' : path.startsWith(p));
    });
  }
  const bar = $('#progress');
  function startProgress() { bar.className = 'progress run'; }
  function stopProgress() { bar.className = 'progress done'; setTimeout(() => bar.className = 'progress', 350); }
  let tt; function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 2200); }

  /* ---------- Global wiring ---------- */
  document.addEventListener('click', e => {
    const a = e.target.closest('a[data-link]');
    if (!a || e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;   // let new-tab clicks work
    e.preventDefault();
    history.replaceState({ ...history.state, scroll: window.scrollY }, '');     // remember scroll before leaving
    navigate(a.dataset.path || a.getAttribute('href'));
  });
  window.addEventListener('popstate', render);
  window.addEventListener('hashchange', () => { if (history.state?.path !== currentPath()) render(); });                                 // back / forward
  fixLinks();
  $('#menu-btn').addEventListener('click', () => { const o = $('#nav').classList.toggle('open'); $('#menu-btn').setAttribute('aria-expanded', o); });

  const saved = localStorage.getItem('theme');
  if (saved) document.documentElement.dataset.theme = saved;
  $('#theme-btn').addEventListener('click', () => {
    const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = t; localStorage.setItem('theme', t);
  });

  history.scrollRestoration = 'manual';
  history.replaceState({ path: currentPath(), scroll: 0 }, '');
  render();
})();
