import {$,$$,esc,load,params,keepUrl,press,normalize,safeUrl,zoomButton,errorAt} from './pages.js';
const views=['sources','packs','papers'];
export async function mount(){
  const host=$('#library');let view=views.includes(params().get('view'))?params().get('view'):'sources', current=0;
  function sourcePanel(ds){
    return `<div class="library-layout"><div><p class="eyebrow">SOURCE MAP</p><h2>张宇旋的数据来源蓝图</h2><p>116 项获取入口，按 13 类整理。它们是资料搜集入口，数量不等于已引用或走查的证据数。</p><ul class="source-list">${ds.byCat.map(x=>`<li><span>${esc(x.name)}</span><b>${esc(x.n)}</b></li>`).join('')}</ul></div><figure>${zoomButton('assets/figures/datasource.jpg','数据来源横向树图',`<img src="assets/figures/datasource.jpg" class="source-preview" alt="数据来源横向树图" loading="lazy">`)}<figcaption>点击放大，可滚动阅读图中内容</figcaption></figure></div>`;
  }
  function packPanel(packs){
    return `<p class="eyebrow">GROUP DATA PACKS</p><h2>五位成员的数据包</h2><p>表中统计文件数量。「包内总数」也包含目录根部单独存放的文件。</p><div class="table-wrap table-wrap--short"><table><thead><tr><th>成员</th>${packs.columns.map(x=>`<th>${esc(x)}</th>`).join('')}<th>包内总数</th></tr></thead><tbody>${packs.rows.map(x=>`<tr><th scope="row">${esc(x.name)}</th>${x.cells.map(n=>`<td>${esc(n)}</td>`).join('')}<td><strong>${esc(x.files)}</strong></td></tr>`).join('')}</tbody></table></div>`;
  }
  function paperPanel(items){
    host.innerHTML=`<div class="split-head"><div><p class="eyebrow">READING INDEX / arXiv</p><h2>文献索引</h2><p>按标题和作者筛选，链接指向原文。条目中含预印本。</p></div><label class="filter-stack">检索文献<input id="paperQuery" type="search" placeholder="标题或作者"></label></div><div id="paperRows"></div>`;
    const out=$('#paperRows'), query=$('#paperQuery');let take=12;
    function draw(){const keys=normalize(query.value).split(/\s+/).filter(Boolean);const selected=items.filter(x=>keys.every(k=>normalize(`${x.title} ${x.authors} ${x.year}`).includes(k))),shown=selected.slice(0,take);
      out.innerHTML=`<ol class="paper-index">${shown.map(x=>`<li><span>${esc(x.no)}</span><div><a href="${esc(safeUrl(x.url))}" target="_blank" rel="noopener noreferrer">${esc(x.title)} ↗</a><p>${esc(x.authors)} · ${esc(x.year)}</p></div></li>`).join('')}</ol><div class="batch-bar"><span role="status">${shown.length} / ${selected.length} 项</span>${shown.length<selected.length?'<button data-paper-more type="button" class="small-button">显示下一批 ↓</button>':''}</div>`;
    }
    query.addEventListener('input',()=>{take=12;draw();});out.addEventListener('click',e=>{if(!e.target.closest('[data-paper-more]'))return;const old=take;take+=12;draw();const next=$$('.paper-index li a',out)[old];next?.focus({preventScroll:true});});draw();
  }
  async function choose(next){
    view=next;const version=++current;press('[data-view]',view);keepUrl({view:view==='sources'?'':view});
    host.setAttribute('aria-busy','true');host.textContent='正在读取资料…';
    try{
      const data=await load(view==='papers'?'papers':'library');if(version!==current)return;
      if(view==='papers')paperPanel(data);else host.innerHTML=view==='sources'?sourcePanel(data.datasource):packPanel(data.packs);
      host.setAttribute('aria-busy','false');
    }catch{if(version===current)errorAt(host);}
  }
  $$('[data-view]').forEach(b=>b.addEventListener('click',()=>{if(view!==b.dataset.view)choose(b.dataset.view);}));
  await choose(view);
}
