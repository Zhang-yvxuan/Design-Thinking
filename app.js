const $ = (sel, root = document) => root.querySelector(sel);

const ESC_MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (ch) => ESC_MAP[ch]);

let DATA = null;

async function boot() {
  const res = await fetch("data.json", { cache: "no-cache" });
  if (!res.ok) throw new Error("data.json 读取失败 " + res.status);
  DATA = await res.json();

  renderStats();
  renderSources();
  renderPacks();
  renderScenes();
  renderCases();
  renderIdeas();
  renderUsers();
  renderPapers();
  bindLightbox();
}

/* ---------- 首屏统计 ---------- */
function renderStats() {
  const s = DATA.stats;
  const rows = [
    [s.members, "组员"],
    [s.sources || 116, "数据来源"],
    [s.cases, "案例卡"],
    [s.opinions, "观点卡"],
    [s.scenes, "末级场景"],
    [s.papers, "文献"],
  ];
  $("#stats").innerHTML = rows
    .map(([n, label]) => `<li><b>${n}</b><span>${esc(label)}</span></li>`)
    .join("");
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
function renderScenes() {
  const groups = new Map();
  for (const scene of DATA.scenes) {
    if (!groups.has(scene.cat)) groups.set(scene.cat, []);
    groups.get(scene.cat).push(scene);
  }
  $("#sceneTree").innerHTML = [...groups.entries()]
    .map(([cat, list]) => {
      const items = list
        .map((s) => `<li><span class="code">${esc(s.code)}</span><span>${esc(s.title)}</span></li>`)
        .join("");
      return `<div class="scene-col">
        <h3>${esc(cat)}<span class="count">${list.length}</span></h3>
        <ul>${items}</ul>
      </div>`;
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

/* ---------- 案例卡 ---------- */
function renderCases() {
  const host = $("#caseList");
  const members = DATA.members.map((m) => ({
    key: m.key,
    name: m.name,
    n: DATA.cases.filter((c) => c.ownerKey === m.key).length,
  }));

  const draw = (key) => {
    const rows = DATA.cases.filter((c) => key === "all" || c.ownerKey === key);
    if (rows.length) {
      host.innerHTML = rows.map(caseCard).join("");
      return;
    }
    host.innerHTML = imageCaseFallback();
  };

  buildFilters($("#caseFilter"), members, draw);
  draw("all");
}

function caseCard(item) {
  const facts = [
    ["观察", item.observe],
    ["为什么", item.why],
    ["启示", item.inspire],
  ]
    .filter(([, text]) => text)
    .map(([label, text]) => `<div><dt>${label}</dt><dd>${esc(text)}</dd></div>`)
    .join("");

  const link = item.url
    ? `<a class="card__link" href="${esc(item.url)}" target="_blank" rel="noopener">${esc(item.url)}</a>`
    : "";

  return `<article class="card">
    <header class="card__head">
      <span class="card__id">${esc(item.id)}</span>
      <span class="card__owner">${esc(item.owner)}</span>
    </header>
    <h4 class="card__title">${esc(item.title)}</h4>
    <dl>${facts}</dl>
    ${link}
  </article>`;
}

function imageCaseFallback() {
  const pages = ["01", "02", "03", "04", "05"]
    .map(
      (n) => `<figure class="card card--media">
        <img src="assets/czx/${n}.jpg" alt="蔡紫璇案例卡第 ${n} 页" loading="lazy">
      </figure>`
    )
    .join("");

  return `<article class="card">
    <header class="card__head"><span class="card__owner">蔡紫璇</span></header>
    <h4 class="card__title">案例卡为图片版</h4>
    <p class="card__note">该成员的案例卡以图片形式提交，文字不可提取。原页见下图。</p>
  </article>` + pages;
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
    ? `<ul class="card__list">${item.body
        .map((line) => `<li>${esc(line)}</li>`)
        .join("")}</ul>`
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
    const target = event.target.closest(".gallery img, .fig img, .card--media img");
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

boot().catch((error) => {
  document.body.insertAdjacentHTML(
    "afterbegin",
    `<p class="notice">页面加载失败：${esc(error.message)}</p>`
  );
});
