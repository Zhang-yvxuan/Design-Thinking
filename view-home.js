import {$,$$,esc,load,reduced,urlFor,zoomButton,factList,caseKey} from './pages.js';

export async function mount(){
  const {stats,featured}=await load('home');
  $('#stats').innerHTML=stats.map(([name,n])=>`<li><b data-stat="${n}">${reduced?n:0}</b><span>${esc(name)}</span></li>`).join('');
  if(!reduced){
    const start=performance.now(); const els=$$('#stats b');
    function tick(t){const x=Math.min(1,(t-start)/1100);els.forEach(el=>el.textContent=Math.round(el.dataset.stat*(1-(1-x)**3)));if(x<1)requestAnimationFrame(tick);}
    requestAnimationFrame(tick);
  }
  const stage=$('#featured'); let current=0;
  stage.innerHTML=`<div class="feature-card"><div id="featurePanel"></div><div class="feature-rail"><div class="feature-choices" aria-label="精选案例">${featured.map((x,i)=>`<button class="small-button" data-feature="${i}" type="button"><span>${String(i+1).padStart(2,'0')}</span> ${esc(x.label)}</button>`).join('')}</div><div class="feature-arrows"><button class="small-button" data-move="-1" type="button" aria-label="上一个案例">←</button><span id="featureCount"></span><button class="small-button" data-move="1" type="button" aria-label="下一个案例">→</button></div></div></div>`;
  function render(i,dir=1){
    current=(i+featured.length)%featured.length;const x=featured[current];
    $$('[data-feature]',stage).forEach((b,k)=>b.setAttribute('aria-pressed',String(current===k)));
    $('#featureCount').textContent=`${current+1} / ${featured.length}`;
    $('#featurePanel').innerHTML=`<article class="feature-slide${dir<0?' feature-slide--back':''}"><div class="feature-media">${zoomButton(x.art.image,x.title,`<img src="${esc(x.art.image)}" alt="" decoding="async">`)}<span>${x.art.illustration?'案例示意图':'原案例卡配图'}</span></div><div class="feature-copy"><p class="eyebrow">${esc(x.id)} / ${esc(x.label)}</p><h3>${esc(x.title)}</h3><p class="byline">整理 · ${esc(x.owner)}</p><dl>${factList(x)}</dl><a class="quiet-link" href="${esc(urlFor('cases.html',{case:caseKey(x)}))}">在档案中查看 ↗</a></div></article>`;
  }
  stage.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.move){const d=Number(b.dataset.move);render(current+d,d);}else if(b.dataset.feature!==undefined){const n=Number(b.dataset.feature);if(n!==current)render(n,n-current);}});
  stage.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key)||!e.target.closest('.feature-rail'))return;e.preventDefault();const d=e.key==='ArrowLeft'?-1:1;render(current+d,d);$(`[data-feature="${current}"]`,stage).focus();});
  render(current);
}
