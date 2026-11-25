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
  const reader=$('#reading'); let queued=false;
  const paint=()=>{queued=false;const d=document.documentElement;reader.value=Math.max(0,Math.min(100,d.scrollTop/(d.scrollHeight-d.clientHeight)*100||0));};
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
