import {$,$$,esc,load,params,keepUrl,press,zoomButton,urlFor,errorAt} from './pages.js';
const groups={A:['工作与办公','专注、协作与信息交接'],B:['休闲与情感陪伴','自主选择什么时候参与'],C:['居家生活','家庭事务、照护与空间控制'],D:['学习、教育与个人成长','陪练、理解与辅助表达']};
export async function mount(){
  const index=await load('scenes'),tabs=$('#sceneTabs'),nav=$('#sceneIndex'),body=$('#sceneReading');
  let code='', category='', seq=0;
  tabs.innerHTML=Object.entries(groups).map(([id,[title,caption]])=>`<button type="button" class="scene-tile" data-category="${id}"><img src="assets/art/scene${id}.jpg" alt="" decoding="async"><span><b>${id} / ${title}</b><small>${caption}</small></span></button>`).join('');
  function refreshNav(){
    press('[data-category]',category);
    nav.innerHTML=index.filter(x=>x.catKey===category).map(x=>`<button type="button" data-scene="${esc(x.code)}" ${x.code===code?'aria-current="true"':''}><span>${esc(x.code)}</span>${esc(x.title)}</button>`).join('');
  }
  async function display(next, focus=false){
    const item=index.find(x=>x.code===next);if(!item)return;
    const change=category!==item.catKey;code=next;category=item.catKey;const run=++seq;
    if(change||!nav.children.length)refreshNav();else $$('[data-scene]',nav).forEach(b=>b.dataset.scene===code?b.setAttribute('aria-current','true'):b.removeAttribute('aria-current'));
    keepUrl({scene:code});body.setAttribute('aria-busy','true');
    body.innerHTML=`<header><p class="eyebrow">${esc(code)} / ${esc(item.cat)}</p><h2 id="sceneTitle" tabindex="-1">${esc(item.title)}</h2><p class="hmw"><b>HMW</b> ${esc(item.hmw)}</p></header><div id="analysisText">正在读取人群与行为…</div>`;
    if(focus){$('#sceneTitle').focus({preventScroll:true});if(matchMedia('(max-width: 760px)').matches)body.scrollIntoView({block:'start'});}
    try{
      const content=await load(`users-${code}`);if(run!==seq)return;
      const list=(title,rows)=>`<section><h3>${title} <span>${rows.length}</span></h3><ol>${rows.map(([n,x])=>`<li value="${Number(n)}">${esc(x)}</li>`).join('')}</ol></section>`;
      const references=item.references.map(ref=>`<li><span class="chip">${esc(ref.id)}</span>${ref.opinion?`<a class="quiet-link" href="${esc(urlFor('cases.html',{view:'opinions',case:ref.opinion}))}">${esc(ref.title)} ↗</a>`:ref.case?`<a class="quiet-link" href="${esc(urlFor('cases.html',{case:ref.case}))}">${esc(ref.title)} ↗</a>`:`<span>${esc(ref.title)}</span>${ref.id.startsWith('CZX')?' <a class="quiet-link" href="cases.html?member=czx">查阅成员原卡 ↗</a>':''}`}</li>`).join('');
      $('#analysisText').innerHTML=`<div class="scene-tools">${zoomButton(content.image,`${code} ${item.title} 高清原图`,'查看高清图卡 ↗','small-button')}</div><div class="analysis-grid">${list('极端人群',content.people)}${list('极端行为',content.behaviors)}</div><section class="related"><p class="eyebrow">LINKED CASES / 原分类图</p><h3>关联案例</h3>${references?`<ul>${references}</ul>`:'<p>原场景分类图未列出直接案例。</p>'}</section>`;
      body.setAttribute('aria-busy','false');
    }catch{if(run===seq)errorAt(body);}
  }
  tabs.addEventListener('click',e=>{const b=e.target.closest('[data-category]');if(!b||b.dataset.category===category)return;display(index.find(x=>x.catKey===b.dataset.category).code,true);});
  nav.addEventListener('click',e=>{const b=e.target.closest('[data-scene]');if(b&&b.dataset.scene!==code)display(b.dataset.scene,true);});
  const start=params().get('scene'); await display(index.some(x=>x.code===start)?start:index[0].code);
}
