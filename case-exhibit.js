/* Case gallery: a curated stage, then an indexed archive. */
const CaseExhibit = (() => {
  const featured = [
    ['zyx:ZYX-001', '学习陪伴'], ['lzx:040', '日常起居'],
    ['zzs:ZZS-003', '第一视角'], ['zyx:ZYX-005', '远程协作'],
  ];
  const archiveSize = 9;
  const mediaKey = item => `${item.ownerKey}:${item.id}`;
  const normalized = text => String(text || '').normalize('NFKC').toLowerCase();
  function safeLink(value) {
    try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
  }
  function view(data, catalog) {
    const cases = data.cases.map(item => ({ ...item, art: catalog[mediaKey(item)] || null }));
    for (const item of cases) item.title = item.art?.title || item.title;
    const show = featured.flatMap(([key, label]) => {
      const item = cases.find(x => mediaKey(x) === key && x.art?.image);
      return item ? [{ ...item, label }] : [];
    });
    renderStage(show);
    renderArchive(cases, data.members);
  }
  function art(item, eager = false) {
    if (!/^assets\/cases\/[a-z0-9-]+\.webp$/.test(item.art?.image || '')) return '';
    return `<figure class="case-art"><img src="${esc(item.art.image)}" alt="${esc(item.title)}案例配图" ${eager ? '' : 'loading="lazy"'} decoding="async"><figcaption>${item.art.illustration ? '案例示意图' : '原案例卡配图'}</figcaption></figure>`;
  }
  function factList(item) {
    return [['观察',item.observe],['原因',item.why],['启示',item.inspire]].filter(([,t]) => t)
      .map(([label,t]) => `<div><dt>${label}</dt><dd>${esc(t)}</dd></div>`).join('');
  }
  function renderStage(items) {
    if (!items.length) return;
    const el = $('#caseExhibit');
    el.innerHTML = `<div class="exhibit__head"><div><p class="eyebrow">IN FOCUS</p><h3>从一个具体用法看起</h3></div><p class="exhibit__tag">精选案例 · ${items.length} 件展品</p></div>
      <div class="exhibit__frame"><div id="exhibitPanel"></div><div class="exhibit__rail"><div class="exhibit__pick" aria-label="选择精选案例">${items.map((item,i) => `<button type="button" data-slide="${i}" aria-controls="exhibitPanel"><span>${String(i+1).padStart(2,'0')}</span><strong>${esc(item.label)}</strong></button>`).join('')}</div>
      <div class="exhibit__controls"><button type="button" data-dir="-1" aria-label="上一个精选案例">←</button><span id="exhibitCounter" aria-live="polite"></span><button type="button" data-dir="1" aria-label="下一个精选案例">→</button></div></div></div>`;
    let current = 0;
    function set(next, direction = 1) {
      current = (next + items.length) % items.length;
      const item = items[current];
      $$('#caseExhibit [data-slide]').forEach((b,i) => b.setAttribute('aria-pressed',String(i === current)));
      $('#exhibitCounter').textContent = `${String(current + 1).padStart(2,'0')} / ${String(items.length).padStart(2,'0')}`;
      $('#exhibitPanel').innerHTML = `<article class="focus-case ${direction < 0 ? 'focus-case--reverse' : ''}">
        <div class="focus-case__visual">${art(item,true)}</div><div class="focus-case__copy">
          <p class="eyebrow">${esc(item.id)} / ${esc(item.label)}</p><h4>${esc(item.title)}</h4>
          <p class="focus-case__owner">整理 · ${esc(item.owner)}</p><dl>${factList(item)}</dl>
        </div></article>`;
    }
    el.addEventListener('click', e => {
      const btn=e.target.closest('button'); if (!btn) return;
      if (btn.hasAttribute('data-dir')) { const dir=Number(btn.dataset.dir); set(current+dir,dir); }
      else if (btn.hasAttribute('data-slide')) { const next=Number(btn.dataset.slide); if (next!==current) set(next,next-current); }
    });
    el.addEventListener('keydown', e => {
      if (!['ArrowLeft','ArrowRight'].includes(e.key) || !e.target.closest('button')) return;
      e.preventDefault(); const dir=e.key==='ArrowRight'?1:-1; set(current+dir,dir);
      $(`#caseExhibit [data-slide="${current}"]`).focus();
    });
    set(0);
  }
  function renderArchive(cases, members) {
    const host=$('#caseList'), input=$('#caseSearch'), more=$('#caseMore'), status=$('#caseStatus');
    const scans=Array.from({length:5},(_,i)=>({ ownerKey:'czx',owner:'蔡紫璇',id:`P${i+1}`,title:`蔡紫璇案例卡原页 · ${i+1}`,img:`assets/czx/0${i+1}.jpg` }));
    const all=[...cases.slice(0,3),...scans,...cases.slice(3)];
    let owner='all', take=archiveSize;
    function row(item) {
      if(item.img) return `<figure class="card card--media case-scan"><img src="${item.img}" alt="${esc(item.title)}" loading="lazy"><figcaption>${esc(item.title)}</figcaption></figure>`;
      const url=safeLink(item.url);
      return `<article class="card archive-card">${art(item)}<div class="archive-card__body">
        <header class="card__head"><span class="card__id">${esc(item.id)}</span><span class="card__owner">${esc(item.owner)}</span></header>
        <h4 class="card__title">${esc(item.title)}</h4><dl>${factList(item)}</dl>
        ${url ? `<a class="card__link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">查看案例来源 ↗</a>` : ''}</div></article>`;
    }
    function draw(reset = true) {
      const query=normalized(input.value).trim().split(/\s+/).filter(Boolean);
      const selected=all.filter(item => (owner==='all'||item.ownerKey===owner)&&query.every(word=>normalized([item.id,item.title,item.owner,item.observe,item.why,item.inspire].join(' ')).includes(word)));
      const visible=selected.slice(0,take);
      if (reset) {
        if (revealObserver) for (const old of host.children) revealObserver.unobserve(old);
        host.innerHTML=visible.length ? visible.map(row).join('') : '<p class="empty">没有匹配的案例，换个关键词试试。</p>';
      } else {
        host.insertAdjacentHTML('beforeend',visible.slice(host.children.length).map(row).join(''));
      }
      more.hidden=visible.length===selected.length;
      status.textContent=`已显示 ${visible.length} / ${selected.length} 项（原页按页计）`;
      enhance(host);
    }
    buildFilters($('#caseFilter'), members.map(m=>({...m,n:all.filter(x=>x.ownerKey===m.key).length})), key=>{ owner=key;take=archiveSize;draw(); });
    input.addEventListener('input',()=>{ take=archiveSize;draw(); });
    more.addEventListener('click',()=>{take+=archiveSize;draw(false); if(more.hidden){status.tabIndex=-1;status.focus();} });
    draw();
  }
  return { view };
})();
