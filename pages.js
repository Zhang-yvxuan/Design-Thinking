const root = document.querySelector('main');
export const $ = (q, context = document) => context.querySelector(q);
export const $$ = (q, context = document) => [...context.querySelectorAll(q)];
export const esc = t => String(t ?? '').replace(/[&<>"']/g, ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch]);
export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const params = () => new URLSearchParams(location.search);
const cache = new Map();
export function load(name) {
  if (!cache.has(name)) cache.set(name, fetch(`content/${name}.json`).then(r=>{if(!r.ok)throw Error(`${name}: ${r.status}`);return r.json();}).catch(error=>{cache.delete(name);throw error;}));
  return cache.get(name);
}
export function safeUrl(value){try{const u=new URL(value);return ['http:','https:'].includes(u.protocol)?u.href:'';}catch{return '';}}
export const normalize = t => String(t ?? '').normalize('NFKC').toLowerCase().trim();
export function urlFor(path, values){const q=new URLSearchParams(Object.entries(values).filter(([,v])=>v));return `${path}${q.size?'?'+q:''}`;}
export function keepUrl(values){const path=location.pathname.split('/').pop()||'index.html';history.replaceState(null,'',urlFor(path,values)+location.hash);}
export function errorAt(el){el.setAttribute('aria-busy','false');el.innerHTML='<p class="notice" role="status">这部分暂时没加载成功，请刷新页面重试。</p>';}
export function press(selector,key){$$(selector).forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.view===key || x.dataset.category===key)));}
export function zoomButton(path,label,body,classes=''){return `<button type="button" class="zoom-trigger ${classes}" data-zoom="${esc(path)}" data-alt="${esc(label)}" aria-label="放大：${esc(label)}">${body}</button>`;}
export function factList(item){return [['观察',item.observe],['原因',item.why],['启示',item.inspire]].filter(([,v])=>v).map(([k,v])=>`<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('');}
export const caseKey = x=>`${x.ownerKey}:${x.id}`;

export function openDetail(item, origin){
  const dlg=$('#detail'); if(!dlg||!item) return;
  const img=$('.detail-figure img',dlg);
  const src=item.art?.image||item.image||'';
  if(src){img.src=src;img.hidden=false;}else{img.removeAttribute('src');img.hidden=true;}
  img.alt=item.title||item.id||'';
  $('#detailMeta',dlg).textContent=[item.id,item.owner].filter(Boolean).join(' / ');
  $('#detailTitle',dlg).textContent=item.title||item.id||'';
  $('#detailOwner',dlg).textContent=item.owner?`整理 · ${item.owner}`:'';
  const facts=factList(item);
  const bodyHtml=(item.body&&item.body.length)?`<div class="detail-prose">${item.body.map(t=>`<p>${esc(t)}</p>`).join('')}</div>`:'';
  $('#detailFacts',dlg).innerHTML=facts||bodyHtml;
  $('#detailChips',dlg).innerHTML=(item.scenes||[]).map(s=>`<span class="chip">${esc(s.code)} · ${esc(s.title)}</span>`).join('');
  const href=safeUrl(item.url);
  const link=$('#detailSrc',dlg);
  if(href){link.href=href;link.hidden=false;}else{link.removeAttribute('href');link.hidden=true;}
  const originText=item.source||item.art?.source||'';
  $('#detailSource',dlg).textContent=originText?`原件：${originText}`:'';
  const originImg=origin?.querySelector?.('img');
  const first=originImg?originImg.getBoundingClientRect():null;
  dlg.classList.remove('is-closing');
  dlg.showModal();
  if(first&&!reduced&&src){
    const last=img.getBoundingClientRect();
    if(last.width&&last.height){
      const dx=first.left-last.left, dy=first.top-last.top;
      const sx=first.width/last.width, sy=first.height/last.height;
      img.animate([{transform:`translate(${dx}px,${dy}px) scale(${sx},${sy})`,transformOrigin:'top left'},{transform:'none'}],{duration:460,easing:'cubic-bezier(.2,.85,.25,1)'});
    }
    const body=$('.detail-body',dlg);
    body.animate([{opacity:0,transform:'translateX(26px)'},{opacity:1,transform:'none'}],{duration:380,delay:110,easing:'cubic-bezier(.2,.85,.25,1)',fill:'backwards'});
  }
}


function bindShared(){
  const dialog=$('#zoom'), image=$('img',dialog);
  let origin;
  document.addEventListener('click',event=>{
    const b=event.target.closest('[data-zoom]');
    if(!b) return;
    origin=b;
    image.alt=b.dataset.alt||'档案原图'; image.src=b.dataset.zoom;
    image.classList.remove('is-large'); dialog.showModal();
  });
  image.addEventListener('click',()=>image.classList.toggle('is-large'));
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
  dialog.addEventListener('close',()=>{image.removeAttribute('src');origin?.focus({preventScroll:true});});
  const detail=$('#detail');
  if(detail){
    const shut=()=>{
      if(!detail.open||detail.classList.contains('is-closing'))return;
      if(reduced){detail.close();return;}
      detail.classList.add('is-closing');
      setTimeout(()=>{detail.close();detail.classList.remove('is-closing');},200);
    };
    const close=$('.detail-close',detail);
    if(close)close.addEventListener('click',shut);
    detail.addEventListener('click',e=>{if(e.target===detail)shut();});
    detail.addEventListener('cancel',e=>{e.preventDefault();shut();});
  }
  const reader=$('#reading'), navBar=$('.nav'); let queued=false;
  const paint=()=>{queued=false;const d=document.documentElement;reader.value=Math.max(0,Math.min(100,d.scrollTop/(d.scrollHeight-d.clientHeight)*100||0));if(navBar)navBar.toggleAttribute('data-stuck',d.scrollTop>8);};
  const queue=()=>{if(!queued){queued=true;requestAnimationFrame(paint);}};
  addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue);paint();
  if(location.pathname.endsWith('/')||location.pathname.endsWith('index.html')){
    const old={source:['library.html','#source'],pack:['library.html','?view=packs'],scene:['scenes.html',''],idea:['cases.html','?view=opinions'],user:['scenes.html',''],paper:['library.html','?view=papers']};
    const link=old[location.hash.slice(1)]; if(link)location.replace(link.join(''));
  }
}
async function start(){
  bindShared();
  switch(document.body.dataset.page){
    case 'index': await (await import('./view-home.js')).mount();break;
    case 'cases': await (await import('./view-cases.js')).mount();break;
    case 'scenes': await (await import('./view-scenes.js')).mount();break;
    case 'library': await (await import('./view-library.js')).mount();break;
  }
  root.dataset.ready='true';
}
start().catch(()=>{const out=$('#loadError');out.textContent='页面资料暂时无法读取，请刷新后再试。';out.hidden=false;});
