"""Build the four static entry points with a shared, accessible frame."""
from pathlib import Path

site=Path(__file__).resolve().parent
nav=(('index.html','首页'),('cases.html','案例与观点'),('scenes.html','场景与用户'),('library.html','资料库'))

def page(name,title,kicker,description,body,home=False):
    links=''.join(f'<a href="{file}"'+(' aria-current="page"' if file==name else '')+f'>{label}</a>' for file,label in nav)
    head=(f'<section class="cover"><div class="hero__art" aria-hidden="true"></div><div class="cover-copy"><p class="eyebrow">{kicker}</p><h1>AI 智能硬件<span>跨场景调研</span></h1><p>{description}</p><div class="cover-links"><a class="action" href="cases.html">浏览案例 ↗</a><a class="quiet-link" href="scenes.html">查看场景版图 ↓</a></div><ul id="stats" class="stats" aria-label="调研概览"></ul></div></section>' if home else
          f'<header class="page-head"><p class="eyebrow">{kicker}</p><h1>{title}</h1><p>{description}</p></header>')
    (site/name).write_text(f'''<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title} · AI 智能硬件调研</title><meta name="description" content="{description}">
<link rel="icon" href="assets/art/mark.svg" type="image/svg+xml"><link rel="stylesheet" href="pages.css">
<script type="module" src="pages.js"></script></head><body data-page="{name.removesuffix('.html')}">
<a class="skip" href="#main">跳到正文</a><progress class="reading" id="reading" max="100" value="0" aria-hidden="true"></progress>
<header class="nav" id="top"><a class="brand" href="index.html"><span class="dot"></span>AI 硬件研究展</a><div class="nav-end"><nav aria-label="展站导航">{links}</nav><a class="gh" href="https://github.com/Zhang-yvxuan/Design-Thinking" target="_blank" rel="noopener noreferrer" aria-label="在 GitHub 打开这个展站的仓库"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg><span>GitHub</span></a></div></header>
<main id="main">{head}<p id="loadError" class="notice" hidden></p>{body}</main>
<footer class="foot"><p>张宇旋 · 蔡紫璇 · 汪觉义 · 李泽星 · 邹忠胜</p><p class="muted">武汉科技大学 · 工业设计 · 设计思维课程</p><p class="foot-links"><a href="https://github.com/Zhang-yvxuan/Design-Thinking" target="_blank" rel="noopener noreferrer">GitHub 仓库 ↗</a><a href="#top">回到顶部 ↑</a></p></footer>
<dialog class="zoom" id="zoom" aria-label="查看大图"><form method="dialog"><button class="small-button" aria-label="关闭大图">关闭 ×</button></form><div class="zoom__image"><img alt=""></div></dialog></body></html>
''',encoding='utf8')

page('index.html','跨场景调研','设计思维课程 / AI HARDWARE STUDIES','从典型硬件的使用细节出发，把产品观察、场景分类和极端用户分析串起来，寻找下一轮设计机会。','''
<section class="edition" id="case"><div class="split-head"><div><p class="eyebrow">01 / CURATED CASES</p><h2>精选案例</h2></div><a class="quiet-link" href="cases.html">进入案例档案 ↗</a></div><div id="featured" aria-live="polite"></div></section>
<section class="edition"><div class="split-head"><div><p class="eyebrow">02 / FIELD GUIDE</p><h2>从哪里读起？</h2></div></div>
<div class="entry-grid"><a href="cases.html"><b>01</b><h3>看一个产品</h3><p>从外观和操作入手，读案例卡里的观察、原因与设计启示。</p><span>案例与观点 ↗</span></a><a href="scenes.html"><b>02</b><h3>看一类人怎么用</h3><p>从四大场景进入 44 个细分场景，顺着原导图回到关联案例。</p><span>场景与用户 ↗</span></a><a href="library.html"><b>03</b><h3>回到资料</h3><p>查看五位成员的数据包、资料获取渠道和文献索引。</p><span>资料库 ↗</span></a></div></section>
<section class="edition takeaway"><p class="eyebrow">03 / DESIGN TAKEAWAY</p><h2>该介入时出现，其余时候退到背景里</h2><p>伴学案例把反馈收在短促的动作里；办公观点卡提出，会议待办应保留原话，由记录者确认后再转发。两条线索都指向同一个原型问题：设备什么时候该介入，控制权怎样交还给人？</p><a class="quiet-link" href="cases.html?view=opinions">去看组员的观点卡 ↗</a></section>''',True)

page('cases.html','案例与观点','01 / CASE ARCHIVE','按成员、产品或编号找案例。案例保留观察、原因和启示；观点单独阅读。','''
<div class="view-tabs" aria-label="案例或观点"><button type="button" data-view="cases">案例档案</button><button type="button" data-view="opinions">观点卡</button></div>
<section class="workbench" aria-label="档案浏览"><aside class="filters-panel"><p class="eyebrow">FILTER / 筛选</p><label for="query">关键词</label><input id="query" type="search" placeholder="输入产品、编号或主题"><label for="member">整理成员</label><select id="member"><option value="all">全部成员</option></select><p id="results" role="status"></p><p class="filter-help">可搜索案例标题、原编号和场景。蔡紫璇的案例以五页原卡保留。</p></aside><div id="archive" class="archive-region" aria-busy="true">正在加载档案…</div></section>''')

page('scenes.html','场景与用户','02 / SCENE ATLAS','从工作、休闲、居家与学习四类切入。每次只打开一个场景，再看设计问题、极端用户与关联案例。','''
<div class="scene-toolbar"><div class="scene-tabs" id="sceneTabs" aria-label="场景大类"></div><button class="small-button" type="button" data-zoom="assets/figures/scene-map.png" data-alt="AI 产品应用场景分类">查看原分类图 ↗</button></div>
<div class="scene-workbench"><nav class="scene-index" aria-label="末级场景" id="sceneIndex"></nav><section class="scene-reading" id="sceneReading" aria-busy="true">正在加载场景…</section></div>''')

page('library.html','资料库','03 / RESEARCH LIBRARY','把资料获取渠道、组员数据包与论文索引分开查询。目录计数不含子文件夹，引用保留原文链接。','''
<div class="view-tabs" aria-label="资料类别"><button type="button" data-view="sources">数据来源</button><button type="button" data-view="packs">成员数据包</button><button type="button" data-view="papers">文献索引</button></div>
<section id="library" class="library-panel" aria-busy="true">正在加载资料…</section>''')
