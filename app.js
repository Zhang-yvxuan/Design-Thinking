const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const ESC_MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (ch) => ESC_MAP[ch]);

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let DATA = null;
let revealObserver = null;

/* ---------- 启动 ---------- */
async function boot() {
  const res = await fetch("data.json", { cache: "no-cache" });
  if (!res.ok) throw new Error("data.json 读取失败 " + res.status);
  DATA = await res.json();

  setupRevealObserver();
  renderStats();
  renderSources();
  renderPacks();
  renderScenes();
  const catalog = await fetch('assets/cases/catalog.json')
    .then(r => r.ok ? r.json() : {}).catch(() => ({}));
  CaseExhibit.view(DATA, catalog);
  renderIdeas();
  renderUsers();
  renderPapers();
  bindLightbox();
  initReadingProgress();
  initNavHighlight();
  initHeroParallax();
  enhance();
}

/* ---------- 进场观察 ---------- */
function setupRevealObserver() {
  if (REDUCED || !('IntersectionObserver' in window)) return;
  revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-in");
        revealObserver.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -6% 0px", threshold: 0.04 }
  );
}

function watch(el) {
  if (!revealObserver || !el) return;
  revealObserver.observe(el);
}

/** 给渲染出来的内容挂上进场动画 */
function enhance(root = document) {
  if (!revealObserver) return;
  $$(".block h2, .block .intro, .source-grid, .scene-card, .cards > .card, .gallery > figure, #packTable tbody tr", root)
    .filter(el => !el.classList.contains('reveal'))
    .forEach((el, i) => {
      el.classList.add('reveal', `reveal--d${i % 4}`);
      watch(el);
    });
}

/* ---------- 数字滚动 ---------- */
function countUp(el, target) {
  if (REDUCED || !Number.isFinite(target)) {
    el.textContent = String(target);
    return;
  }
  const duration = 1200;
  const start = performance.now();
  const tick = (now) => {
    const p = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = String(Math.round(target * eased));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ---------- 首屏 ---------- */
function renderStats() {
  const s = DATA.stats;
  const rows = [
    [s.members, "组员", false],
    [s.sources || 116, "数据来源", true],
    [s.cases, "案例卡", true],
    [s.opinions, "观点卡", true],
    [s.scenes, "末级场景", true],
    [s.papers, "文献", true],
  ];
  $("#stats").innerHTML = rows
    .map(([n, label]) => `<li><b>${n}</b><span>${esc(label)}</span></li>`)
    .join("");

  if (REDUCED) return;
  $$("#stats b").forEach((el, i) => {
    const value = Number(rows[i][0]);
    el.textContent = "0";
    setTimeout(() => countUp(el, value), 620 + i * 60);
  });
}

/* ---------- 数据来源 ---------- */
function renderSources() {
  const ds = DATA.datasource;
  if (!ds) return;
  const groups = ds.byCat
    .map((c) => `<div><span>${esc(c.name)}</span><b>${c.n}</b></div>`)
    .join("");
  $("#sourceCats").innerHTML =
    groups + `<div class="total"><span>合计</span><b>${ds.total}</b></div>`;
}

/* ---------- 数据包 ---------- */
function renderPacks() {
  const body = $("#packTable tbody");
  if (!body || !DATA.packs) return;
  body.innerHTML = DATA.packs.rows
    .map((row) => {
      const cells = row.cells
        .map((n) => `<td class="pack-cell${n ? "" : " is-empty"}">${n || "—"}</td>`)
        .join("");
      return `<tr><th scope="row">${esc(row.name)}</th>${cells}<td class="pack-total">${row.files}</td></tr>`;
    })
    .join("");
}

/* ---------- 场景版图 ---------- */
const SCENE_ART = {
  A: "assets/art/sceneA.jpg",
  B: "assets/art/sceneB.jpg",
  C: "assets/art/sceneC.jpg",
  D: "assets/art/sceneD.jpg",
};

function renderScenes() {
  const groups = new Map();
  for (const scene of DATA.scenes) {
    if (!groups.has(scene.cat)) groups.set(scene.cat, []);
    groups.get(scene.cat).push(scene);
  }
  $("#sceneTree").innerHTML = [...groups.entries()]
    .map(([cat, list]) => {
      const key = list[0].code[0];
      const items = list
        .map(
          (s) => `<li><span class="code">${esc(s.code)}</span><span>${esc(s.title)}</span></li>`
        )
        .join("");
      return `<article class="scene-card">
        <div class="scene-card__media">
          <img src="${SCENE_ART[key]}" alt="${esc(cat)}场景意象" loading="lazy">
        </div>
        <div class="scene-card__body">
          <h3>${esc(cat)}<span class="count">${list.length}</span></h3>
          <ul>${items}</ul>
        </div>
      </article>`;
    })
    .join("");
}

/* ---------- 筛选条 ---------- */
function buildFilters(target, members, onPick) {
  const total = members.reduce((sum, m) => sum + m.n, 0);
  target.innerHTML =
    `<button type="button" data-key="all" aria-pressed="true">全部<span class="count">${total}</span></button>` +
    members
      .map(
        (m) =>
          `<button type="button" data-key="${esc(m.key)}" aria-pressed="false">${esc(m.name)}` +
          `<span class="count">${m.n}</span></button>`
      )
      .join("");

  target.addEventListener("click", (event) => {
    const btn = event.target.closest("button[data-key]");
    if (!btn) return;
    for (const item of target.querySelectorAll("button")) {
      item.setAttribute("aria-pressed", String(item === btn));
    }
    onPick(btn.dataset.key);
  });
}

/* ---------- 观点卡 ---------- */
function renderIdeas() {
  const host = $("#ideaList");
  const members = DATA.members.map((m) => ({
    key: m.key,
    name: m.name,
    n: DATA.opinions.filter((o) => o.ownerKey === m.key).length,
  }));

  const draw = (key) => {
    const rows = DATA.opinions.filter((o) => key === "all" || o.ownerKey === key);
    host.innerHTML = rows.length
      ? rows.map(ideaCard).join("")
      : `<p class="empty">该成员暂无观点卡。</p>`;
    enhance(host);
  };

  buildFilters($("#ideaFilter"), members, draw);
  draw("all");
}

function ideaCard(item) {
  const scene =
    item.scene && item.scene !== item.title
      ? `<p class="card__owner">${esc(item.scene)}</p>`
      : "";
  const core = item.core ? `<p class="card__core">${esc(item.core)}</p>` : "";
  const body = (item.body || []).length
    ? `<ul class="card__list">${item.body.map((line) => `<li>${esc(line)}</li>`).join("")}</ul>`
    : "";

  return `<article class="card">
    <header class="card__head">
      <span class="card__id">${esc(item.id)}</span>
      <span class="card__owner">${esc(item.owner)}</span>
    </header>
    <h4 class="card__title">${esc(item.title)}</h4>
    ${scene}${core}${body}
  </article>`;
}

/* ---------- 极端用户 ---------- */
function renderUsers() {
  $("#userList").innerHTML = DATA.eu
    .map(
      (item) => `<figure>
        <img src="${esc(item.img)}" alt="${esc(item.code)} ${esc(item.title)}" loading="lazy">
        <figcaption><span class="code">${esc(item.code)}</span><span>${esc(item.title)}</span></figcaption>
      </figure>`
    )
    .join("");
}

/* ---------- 文献 ---------- */
function renderPapers() {
  $("#paperList tbody").innerHTML = DATA.papers
    .map(
      (p) => `<tr>
        <td class="num">${p.no}</td>
        <td><a class="cell-link" href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.title)}</a></td>
        <td class="authors">${esc(p.authors)}</td>
        <td class="year">${esc(p.year)}</td>
      </tr>`
    )
    .join("");
}

/* ---------- 灯箱 ---------- */
function bindLightbox() {
  const box = $("#lightbox");
  const img = box.querySelector("img");

  const close = () => {
    box.classList.remove("is-open");
    img.removeAttribute("src");
  };

  document.addEventListener("click", (event) => {
    const target = event.target.closest(".gallery img, .fig img, .card--media img, .case-art img");
    if (target) {
      img.src = target.src;
      box.classList.add("is-open");
      return;
    }
    if (event.target === box) close();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });
}

/* ---------- 阅读进度 ---------- */
function initReadingProgress() {
  const bar = $("#reading");
  if (!bar) return;
  let raf = 0;
  const update = () => {
    raf = 0;
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    bar.value = max > 0 ? Math.min(100, (doc.scrollTop / max) * 100) : 0;
  };
  window.addEventListener(
    "scroll",
    () => {
      if (!raf) raf = requestAnimationFrame(update);
    },
    { passive: true }
  );
  update();
}

/* ---------- 导航高亮 ---------- */
function initNavHighlight() {
  const links = $$(".nav nav a");
  if (!links.length) return;
  const map = new Map();
  for (const link of links) {
    const id = link.getAttribute("href").slice(1);
    const section = document.getElementById(id);
    if (section) map.set(section, link);
  }
  const setActive = (link) => {
    for (const l of links) l.classList.toggle("is-active", l === link);
  };
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) setActive(map.get(entry.target));
      }
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  for (const section of map.keys()) observer.observe(section);
}

/* ---------- 首屏视差 ---------- */
function initHeroParallax() {
  if (REDUCED) return;
  const art = $(".hero__art");
  if (!art) return;
  let raf = 0;
  const update = () => {
    raf = 0;
    const y = window.scrollY;
    art.classList.toggle("is-scrolled", y > 40);
  };
  window.addEventListener(
    "scroll",
    () => {
      if (!raf) raf = requestAnimationFrame(update);
    },
    { passive: true }
  );
}

boot().catch((error) => {
  document.body.insertAdjacentHTML(
    "afterbegin",
    `<p class="notice">页面加载失败：${esc(error.message)}</p>`
  );
});
