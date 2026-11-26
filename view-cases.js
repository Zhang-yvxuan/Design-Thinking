import {$,$$,esc,load,params,keepUrl,press,normalize,zoomButton,safeUrl,factList,caseKey,urlFor,errorAt} from './pages.js';
const BATCH=9;
export async function mount(){
  const host=$('#archive'), q=$('#query'), owner=$('#member'), status=$('#results');
  const initial=params();let view=initial.get('view')==='opinions'?'opinions':'cases', opened=initial.get('case')||'', take=BATCH, loaded=null, version=0, rows=[], ticking=false;
  q.value=initial.get('q')||'';
  let member=initial.get('member')||'all';
  const key=x=>view==='cases'?caseKey(x):`${x.ownerKey}:${x.id}`;
  const sceneLink=s=>`<a class="chip" href="${esc(urlFor('scenes.html',{scene:s.code}))}">${esc(s.code)} · ${esc(s.title)}</a>`;
  function card(x){
    const id=esc(key(x));
    if(x.image)return `<article class="record scan-record" data-record="${id}">${zoomButton(x.image,x.title,`<img class="record-img" src="${esc(x.image)}" alt="" loading="lazy">`)}<div class="record-body"><p class="eyebrow">案例原页</p><h3>${esc(x.title)}</h3><p>点击放大读整页。</p></div></article>`;
    const isOpen=key(x)===opened;
    const img=x.art?.image;
    const href=safeUrl(x.url);
    const title=esc(x.title||x.id);
    const officialId=x.ownerKey==='lzx'&&view==='cases'?`LZX-${x.id}`:x.id;
    const illustration=x.art?.caption||(x.art?.illustration?'案例示意图':'原案例卡配图');
    return `<article class="record${view==='opinions'?' opinion-record':''}" data-record="${id}">${img?zoomButton(img,x.title,`<img class="record-img" src="${esc(img)}" alt="" loading="lazy" decoding="async"><span class="record-caption">${illustration}</span>`):''}<div class="record-body"><p class="record-meta"><b>${esc(officialId)}</b><span>${esc(x.owner)}</span></p><h3>${title}</h3>${view==='opinions'&&x.scene&&x.scene!==x.title?`<p class="byline">${esc(x.scene)}</p>`:''}${x.core?`<blockquote>${esc(x.core)}</blockquote>`:''}<details ${isOpen?'open':''}><summary>${view==='cases'?'阅读观察、原因与启示':'展开观点正文'}</summary>${view==='cases'?`<dl class="record-facts">${factList(x)}</dl>`:`<div class="opinion-body">${x.body.map(t=>`<p>${esc(t)}</p>`).join('')}</div>`}${x.scenes?.length?`<div class="chip-list">${x.scenes.map(sceneLink).join('')}</div>`:''}${href?`<a class="quiet-link" href="${esc(href)}" rel="noopener noreferrer" target="_blank">原卡所列来源 ↗</a>`:''}${x.source||x.art?.source?`<p class="byline">原件：${esc(x.source||x.art.source)}</p>`:''}</details></div></article>`;
  }
  function computeRows(){
    const tokens=normalize(q.value).split(/\s+/).filter(Boolean);
    const source=view==='cases'?[...loaded.cases,...loaded.scans]:loaded.opinions;
    const list=source.filter(x=>(member==='all'||member===x.ownerKey)&&tokens.every(k=>normalize([x.title,x.id,x.owner,x.scene,x.core,x.observe,x.why,x.inspire,x.body?.join(' '),x.scenes?.map(s=>s.title+' '+s.code).join(' '),x.ownerKey+'-'+x.id].join(' ')).includes(k)));
    if(opened){const i=list.findIndex(x=>key(x)===opened);if(i>0)list.unshift(list.splice(i,1)[0]);}
    return list;
  }
  function bar(shown,total){
    return `<div class="batch-bar" id="batchBar"><span>已显示 ${shown} / ${total} 项</span>${shown<total?'<button class="small-button" type="button" data-more>继续加载 ↓</button>':'<span class="batch-done">已到底</span>'}</div>`;
  }
  function paint(append=false){
    const shown=rows.slice(0,take);
    status.textContent=view==='cases'?`${rows.filter(x=>!x.image).length} 张文字案例卡${rows.some(x=>x.image)?` · ${rows.filter(x=>x.image).length} 页原卡`:''}`:`${rows.length} 张观点卡`;
    host.setAttribute('aria-busy','false');
    const grid=$('#records',host);
    if(append&&grid){
      const have=grid.children.length;
      if(shown.length>have){
        const tpl=document.createElement('template');
        tpl.innerHTML=shown.slice(have).map(card).join('');
        grid.append(tpl.content);
        const old=$('#batchBar',host);
        if(old)old.outerHTML=bar(shown.length,rows.length);
      }
      const cur=$('#batchBar',host);
      if(cur&&shown.length<rows.length&&shown.length===rows.length)cur.outerHTML=bar(shown.length,rows.length);
    }else{
      host.innerHTML=shown.length?`<div id="records" class="record-grid">${shown.map(card).join('')}</div>${bar(shown.length,rows.length)}`:'<p class="panel-empty">没有匹配的条目，试着清空筛选或换个词。</p>';
    }
    keepUrl({view:view==='opinions'?view:'',q:q.value,member:member==='all'?'':member,case:opened});
  }
  function nearEdge(){
    const el=$('#batchBar',host);
    return !!el&&el.getBoundingClientRect().top<innerHeight+360;
  }
  function fill(){
    if(!loaded)return;
    let guard=0;
    while(take<rows.length&&guard++<20&&nearEdge()){
      take=Math.min(rows.length,take+BATCH);
      paint(true);
    }
  }
  function draw(){
    if(!loaded)return;
    rows=computeRows();take=BATCH;paint();fill();
  }
  async function select(next){
    view=next;press('[data-view]',view);const request=++version;
    loaded=null;host.setAttribute('aria-busy','true');host.textContent='正在读取档案…';status.textContent='';
    try{const result=await load(view);if(request!==version)return;loaded=result;owner.innerHTML='<option value="all">全部成员</option>'+loaded.members.map(x=>`<option value="${esc(x.key)}">${esc(x.name)}</option>`).join('');owner.value=member;if(!owner.value){member='all';owner.value=member;}draw();}
    catch{if(request===version)errorAt(host);}
  }
  $$('[data-view]').forEach(b=>b.addEventListener('click',()=>{if(view===b.dataset.view)return;opened='';take=BATCH;select(b.dataset.view);}));
  owner.addEventListener('change',()=>{member=owner.value;take=BATCH;opened='';draw();});
  let delay; q.addEventListener('input',()=>{clearTimeout(delay);delay=setTimeout(()=>{take=BATCH;opened='';draw();},130);});
  host.addEventListener('click',e=>{if(!e.target.closest('[data-more]'))return;take=Math.min(rows.length,take+BATCH);paint(true);fill();});
  addEventListener('scroll',()=>{if(ticking)return;ticking=true;requestAnimationFrame(()=>{ticking=false;fill();});},{passive:true});
  addEventListener('resize',fill);
  await select(view);
}
