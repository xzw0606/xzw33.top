
if ('scrollRestoration' in history) { history.scrollRestoration = 'manual'; }
let currentModule = 'quant';
let currentPostId = null;
let searchQuery = '';
let sortMode = 'latest'; // 'latest' | 'oldest'
let activeTag = null; // 当前选中的标签
let simRangeDays = 1; // 0=全部, 1=日(默认), 7/30
let simTradeRange = 1; // 0=全部, 1=今日, 7/30天
let simTradePage = 0;  // 平仓记录分页
let simPosPage = 0;    // 持仓分页
let calendarYear = new Date().getFullYear();
let calendarMonth = new Date().getMonth(); // 0-indexed

// HTML转义防XSS
function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function showHome() {
  _cleanupSimHide();
  document.querySelectorAll('.module-tab').forEach(tab => { tab.className = 'module-tab'; });
  document.getElementById('posts-list').style.display = 'block';
  document.getElementById('post-detail').classList.remove('active');
  document.getElementById('about-page').style.display = 'none';
  document.getElementById('simulation-page').style.display = 'none';
  document.getElementById('sortToggle').style.display = 'flex';
  document.getElementById('tagCloud').style.display = 'flex';
  // 恢复 hero/search/hot-tags
  const hero = document.getElementById('heroBanner');
  const search = document.querySelector('.search-container');
  const hotTags = document.getElementById('hotTags');
  if (hero) hero.style.display = '';
  if (search) search.style.display = '';
  if (hotTags) hotTags.style.display = '';
  currentPostId = null;
  document.body.classList.remove('viewing-article');
  history.pushState(null, null, '#/');
  renderPosts();
}

function showAbout() {
  _cleanupSimHide();
  document.getElementById('posts-list').style.display = 'none';
  document.getElementById('post-detail').classList.remove('active');
  document.getElementById('about-page').style.display = 'block';
  document.getElementById('simulation-page').style.display = 'none';
  document.getElementById('sortToggle').style.display = 'none';
  document.getElementById('tagCloud').style.display = 'none';
  currentPostId = null;
  // 重置所有Tab高亮
  document.querySelectorAll('.module-tab').forEach(tab => { tab.className = 'module-tab'; });
  document.body.classList.remove('viewing-article');
  history.pushState(null, null, '#/about');
  renderAbout();
}

function filterModule(module, el) {
  _cleanupSimHide();
  currentModule = module;
  document.getElementById('searchScope').textContent = module === 'quant' ? '量化交易笔记' : '策略更新日志';
  searchQuery = '';
  activeTag = null;
  sortMode = 'latest';
  document.querySelectorAll('.search-input').forEach(inp => { inp.value = ''; });
  document.querySelectorAll('.module-tab').forEach(tab => { tab.className = 'module-tab'; });
  if (el) el.classList.add('active-' + module);
  // 显示文章列表，隐藏关于页、模拟页和文章详情
  document.getElementById('posts-list').style.display = 'block';
  document.getElementById('about-page').style.display = 'none';
  document.getElementById('simulation-page').style.display = 'none';
  // 恢复 hero/search/hot-tags
  const hb = document.getElementById('heroBanner'); if (hb) hb.style.display = '';
  const sc = document.querySelector('.search-container'); if (sc) sc.style.display = '';
  const ht = document.getElementById('hotTags'); if (ht) ht.style.display = '';
  document.getElementById('post-detail').classList.remove('active');
  history.pushState(null, null, '#/tab/' + module);
  renderPosts();
}

let pageHits = {};
async function fetchPageHits() {
  try {
    const resp = await fetch('/api/page-hits');
    if (resp.ok) pageHits = await resp.json();
  } catch(e) { pageHits = {}; }
}
function getPostHits(postId) {
  return pageHits['/#/post/' + postId] || 0;
}

function searchPosts(query) {
  searchQuery = query.trim().toLowerCase();
  renderPosts();
}

function renderPosts() {
  // 确保显示文章列表，隐藏其他视图
  document.getElementById("posts-list").style.display = "block";
  document.getElementById("about-page").style.display = "none";
  document.getElementById("post-detail").classList.remove("active");
  document.getElementById("sortToggle").style.display = "flex";
  document.getElementById("tagCloud").style.display = "flex";
  const grid = document.getElementById('posts-grid');
  let filtered = POSTS.filter(p => p.module === currentModule);
  // 标签过滤
  if (activeTag) {
    filtered = filtered.filter(p => p.tags.includes(activeTag));
  }
  if (searchQuery) {
    const q = searchQuery;
    filtered = filtered.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q)) ||
      p.content.replace(/<[^>]+>/g, '').toLowerCase().includes(q)
    );
  }
  // 排序
  if (sortMode === 'oldest') { filtered.sort((a,b) => a.date.localeCompare(b.date)); }
  else { filtered.sort((a,b) => b.date.localeCompare(a.date)); } // latest
  
  // 渲染排序切换按钮
  renderSortToggle();
  // 渲染标签云
  renderTagCloud();
  
  if (filtered.length === 0) {
    if (searchQuery) {
      grid.innerHTML = '<div class="empty-state"><h3>未找到相关文章</h3><p>没有与「' + escapeHtml(searchQuery) + '」相关的文章，换个关键词试试？</p></div>';
    } else {
      grid.innerHTML = '<div class="empty-state"><h3>暂无文章</h3><p>该模块还没有内容，敬请期待</p></div>';
    }
    return;
  }
  grid.innerHTML = filtered.map(post => {
    const cardClass = post.module === 'quant' ? '' : ' ' + post.module;
    const tagClass = post.module === 'quant' ? '' : ' ' + post.module;
    return '<div class="post-card' + cardClass + '" onclick="openPost(\'' + post.id + '\')">' +
      '<h3>' + post.title + '</h3>' +
      '<p class="summary">' + post.summary + '</p>' +
      '<div class="post-meta">' +
        post.tags.map(t => '<span class="tag' + tagClass + '">' + t + '</span>').join('') +
        '<span class="date">' + post.date + '</span>' +
        '<span class="reading-time">👁 ' + getPostHits(post.id) + ' 次</span>' +
            '</div>' +
    '</div>';
  }).join('');
}

function renderAbout() {
  const page = document.getElementById('about-page');
  const quantCount = POSTS.filter(p => p.module === 'quant').length;
  const strategyCount = POSTS.filter(p => p.module === 'strategy').length;
  const totalPosts = POSTS.length;

  page.innerHTML =
    // 头部卡片
    '<div class="about-hero">' +
      '<div class="about-hero-avatar">⚡</div>' +
      '<div class="about-hero-info">' +
        '<div class="about-hero-name">Xzw</div>' +
        '<div class="about-hero-tagline">量化交易爱好者 · AI 探索者</div>' +
        '<div class="about-hero-meta">' +
          '<span>📍 重庆</span>' +
          '<span>🤖 拥抱 AI</span>' +
        '</div>' +
      '</div>' +
    '</div>' +
    // 简介
    '<p class="about-bio">业余痴迷量化交易与 AI 技术。用 Python 写自动化策略跑实盘，用 AI 工具提升效率，相信代码和模型能改变做事的方式。</p>' +
    // 数据看板
    '<div class="about-grid">' +
      '<div class="about-stat-card"><div class="about-stat-value">' + totalPosts + '</div><div class="about-stat-label">博客文章</div></div>' +
      '<div class="about-stat-card"><div class="about-stat-value">24h</div><div class="about-stat-label">交易机器人</div></div>' +
      '<div class="about-stat-card"><div class="about-stat-value">3</div><div class="about-stat-label">内容模块</div></div>' +
      '<div class="about-stat-card"><div class="about-stat-value">HK/成都</div><div class="about-stat-label">服务器</div></div>' +
    '</div>' +
    // 专注领域
    '<div class="about-section-title">📌 专注领域</div>' +
    '<div class="focus-grid">' +
      '<div class="focus-card">' +
        '<div class="focus-icon">📈</div>' +
        '<div class="focus-title">量化交易</div>' +
        '<div class="focus-desc">币安合约 API，Python 自动化策略，模块化架构，实盘风控与回测</div>' +
      '</div>' +
      '<div class="focus-card">' +
        '<div class="focus-icon">🤖</div>' +
        '<div class="focus-title">AI 应用</div>' +
        '<div class="focus-desc">拥抱 AI 浪潮，探索 WorkBuddy、TokenHub 等平台，用 AI 驱动开发与决策</div>' +
      '</div>' +
      '<div class="focus-card">' +
        '<div class="focus-icon">💻</div>' +
        '<div class="focus-title">全栈开发</div>' +
        '<div class="focus-desc">Python 后端 · Nginx 运维 · 微信小程序 · 赛博朋克风格前端</div>' +
      '</div>' +
          '</div>' +
    // 技术栈
    '<div class="about-section-title">🛠️ 技术栈</div>' +
    '<div class="about-tech-tags">' +
      '<span class="about-tech-tag">Python</span>' +
      '<span class="about-tech-tag">Binance API</span>' +
      '<span class="about-tech-tag">Nginx</span>' +
      '<span class="about-tech-tag">策略回测</span>' +
      '<span class="about-tech-tag">数据分析</span>' +
      '<span class="about-tech-tag">Alibaba Cloud</span>' +
      '<span class="about-tech-tag">Linux</span>' +
      '<span class="about-tech-tag">HTML/CSS/JS</span>' +
      '<span class="about-tech-tag">AI Agent</span>' +
    '</div>' +
    // 博客统计
    '<div class="about-section-title">📊 博客统计</div>' +
    '<div class="about-module-stats">' +
      '<div class="about-module-item">' +
        '<div class="about-module-icon">📈</div>' +
        '<div class="about-module-count">' + quantCount + ' 篇</div>' +
        '<div class="about-module-label">量化交易笔记</div>' +
      '</div>' +
      '<div class="about-module-item">' +
        '<div class="about-module-icon">📊</div>' +
        '<div class="about-module-count">' + strategyCount + ' 篇</div>' +
        '<div class="about-module-label">策略更新日志</div>' +
      '</div>' +
    '</div>' +
    // 页脚
    '<div class="about-footer">' +
      '🟢 模拟交易运行中 · <a href="#" onclick="event.preventDefault(); showHome()">返回博客</a> · © 2026 xzw33.top' +
    '</div>';
}

function openPost(postId) {
  _cleanupSimHide();
  const post = POSTS.find(p => p.id === postId);
  if (!post) return;
  currentPostId = postId;
  document.getElementById('posts-list').style.display = 'none';
  document.getElementById('about-page').style.display = 'none';
  document.getElementById('simulation-page').style.display = 'none';
  document.getElementById('sortToggle').style.display = 'none';
  document.getElementById('tagCloud').style.display = 'none';
  const detail = document.getElementById('post-detail');
  detail.classList.add('active');
  const moduleName = post.module === 'quant' ? '量化交易笔记' : '策略更新日志';
  
  // 查找上一篇/下一篇文章
  const modulePosts = POSTS.filter(p => p.module === post.module);
  const currentIndex = modulePosts.findIndex(p => p.id === postId);
  const prevPost = currentIndex > 0 ? modulePosts[currentIndex - 1] : null;
  const nextPost = currentIndex < modulePosts.length - 1 ? modulePosts[currentIndex + 1] : null;
  
  // 生成相关文章
  const relatedHTML = renderRelatedPosts(post);
  // 字数统计
  const wordCount = (post.content.replace(/<[^>]+>/g, '').match(/[\\u4e00-\\u9fff]/g) || []).length;
  
  // 注入JSON-LD
  injectArticleSchema(post);
  
  detail.innerHTML = '<a class="back-link" onclick="showHome()">← 返回列表</a>' +
    '<div class="post-detail-header">' +
      '<h2>' + post.title + '</h2>' +
      '<div class="post-detail-meta">' +
        '<span>📁 ' + moduleName + '</span>' +
        '<span>📅 ' + post.date + '</span>' +
        '<span>🏷️ ' + post.tags.join(', ') + '</span>' +
      '</div>' +
      '<div class="post-stats-bar">' +
        '<span class="post-stat-item">📝 ' + wordCount + ' 字</span>' +
        '<span class="post-stat-item">👁 ' + getPostHits(post.id) + ' 次浏览</span>' +
      '</div>' +
    '</div>' +
    '<div class="post-content">' + post.content + '</div>' +
    relatedHTML +
    '<div class="post-nav">' +
      (prevPost
        ? '<div class="post-nav-card" onclick="openPost(\'' + prevPost.id + '\')"><span class="post-nav-label">← 上一篇</span><span class="post-nav-title">' + prevPost.title + '</span></div>'
        : '<div class="post-nav-spacer"></div>') +
      (nextPost
        ? '<div class="post-nav-card" onclick="openPost(\'' + nextPost.id + '\')"><span class="post-nav-label">下一篇 →</span><span class="post-nav-title">' + nextPost.title + '</span></div>'
        : '<div class="post-nav-spacer"></div>') +
    '</div>';
  // 触发Prism代码高亮
  requestAnimationFrame(() => { setTimeout(() => { if(typeof Prism !== 'undefined') Prism.highlightAll(); }, 100); });
  // 渲染盈亏曲线图（如果是策略文章），延迟到DOM layout完成后
  if (postId === 'strategy-update-2026-06-08') {
    const dates = ['01:08', '01:36', '02:03', '03:00', '03:40', '05:16', '07:15', '07:52', '10:23', '11:35'];
    const pnlData = [0.37, -1.18, 0.63, -3.13, -2.21, 4.08, -4.43, -7.13, -7.54, 14.46];
    requestAnimationFrame(() => { setTimeout(() => renderPnlChart('pnlChart1', dates, pnlData), 50); });
  } else if (postId === 'strategy-update-2026-06-17') {
    const dates = ['2026-06-05', '2026-06-06', '2026-06-07', '2026-06-08'];
    const pnlData = [-5.2, 3.8, -2.1, -4.06];
    requestAnimationFrame(() => { setTimeout(() => renderPnlChart('pnlChart2', dates, pnlData), 50); });
  }
  document.body.classList.add('viewing-article');
  history.pushState(null, null, '#/post/' + postId);
  window.scrollTo(0, 0);
}

// Hash routing
function handleHash() {
  const hash = window.location.hash || '';
  // 任何非模拟面板路由都清理遮罩
  if (hash !== '#/simulation') _cleanupSimHide();
  if (hash === '#/about') {
    showAbout();
  } else if (hash === '#/simulation') {
    showSimulation();
  } else if (hash.startsWith('#/post/')) {
    const postId = hash.replace('#/post/', '');
    openPost(postId);
  } else if (hash.startsWith('#/tab/')) {
    const module = hash.replace('#/tab/', '');
    currentModule = module;
    document.querySelectorAll('.module-tab').forEach(tab => { tab.className = 'module-tab'; });
    const activeTab = document.querySelector('[data-module="' + module + '"]');
    if (activeTab) activeTab.classList.add('active-' + module);
    document.getElementById('posts-list').style.display = 'block';
    document.getElementById('about-page').style.display = 'none';
    document.getElementById('simulation-page').style.display = 'none';
    var _hb=document.getElementById('heroBanner');if(_hb)_hb.style.display='';
    var _sc=document.querySelector('.search-container');if(_sc)_sc.style.display='';
    var _ht=document.getElementById('hotTags');if(_ht)_ht.style.display='';
    document.getElementById('post-detail').classList.remove('active');
    renderPosts();
  } else {
    showHome();
  }
}
window.addEventListener('hashchange', handleHash);
window.addEventListener('load', handleHash);

// 初始化
(async function init() {
  await fetchPageHits();
  renderPosts();
  document.getElementById('searchScope').textContent = '量化交易笔记';
})();

// 渲染盈亏曲线图（纯Canvas — 赛博朋克视觉优化）
function renderPnlChart(canvasId, dates, pnlData) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  if (!pnlData || pnlData.length === 0 || !dates || dates.length === 0) {
    const wrapper = canvas.closest('.pnl-chart-wrapper');
    if (wrapper) wrapper.innerHTML = '<div style="text-align:center;padding:3rem 1rem;color:var(--text-secondary);font-size:0.9rem;">📊 暂无盈亏数据</div>';
    return;
  }
  const wrapper = canvas.closest('.pnl-chart-wrapper');
  const tooltip = wrapper ? wrapper.querySelector('.pnl-chart-tooltip') : null;

  const dpr = window.devicePixelRatio || 1;
  const cssH = 320;
  const W = canvas.clientWidth * dpr;
  const H = cssH * dpr;
  canvas.width = W; canvas.height = H;
  canvas.style.width = '100%'; canvas.style.height = cssH + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const w = canvas.clientWidth, h = cssH;

  // 计算累计盈亏
  let cumulative = 0;
  const cumData = pnlData.map(v => cumulative += v);
  const allVals = cumData.concat([0]);
  const maxVal = Math.max(...allVals, 1);
  const minVal = Math.min(...allVals, -1);
  const rng = maxVal - minVal || 2;
  const rngPad = rng * 0.1;
  const yMax = maxVal + rngPad, yMin = minVal - rngPad;
  const yRng = yMax - yMin;
  const pad = { top: 20, right: 20, bottom: 36, left: 62 };
  const pw = w - pad.left - pad.right, ph = h - pad.top - pad.bottom;

  function cx(i) { return pad.left + (dates.length > 1 ? (i / (dates.length - 1)) : 0.5) * pw; }
  function cy(v) { return pad.top + ph - ((v - yMin) / yRng) * ph; }
  const y0 = cy(0);

  ctx.clearRect(0, 0, w, h);

  // ── 背景区 ──
  ctx.fillStyle = 'rgba(8,14,24,0.4)';
  ctx.fillRect(pad.left, pad.top, pw, ph);

  // ── 水平网格线 ──
  const gridLines = 5;
  for (let i = 0; i <= gridLines; i++) {
    const yy = pad.top + (i / gridLines) * ph;
    ctx.strokeStyle = i === 0 || i === gridLines ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(pad.left, yy); ctx.lineTo(w - pad.right, yy); ctx.stroke();
  }

  // ── Y轴刻度 ──
  ctx.fillStyle = '#707070'; ctx.font = '10px "SF Mono", "Cascadia Code", Consolas, monospace';
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let i = 0; i <= gridLines; i++) {
    const v = yMax - (i / gridLines) * yRng;
    ctx.fillText((v >= 0 ? '+' : '') + v.toFixed(2), pad.left - 8, pad.top + (i / gridLines) * ph);
  }
  ctx.fillStyle = '#505050'; ctx.font = '9px sans-serif'; ctx.textAlign = 'right';
  ctx.fillText('U', pad.left - 8, pad.top - 8);

  // ── X轴标签 ──
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillStyle = '#707070'; ctx.font = '9px monospace';
  const maxLabels = Math.min(8, dates.length);
  const labelStep = dates.length > 1 ? (dates.length - 1) / (maxLabels - 1) : 0;
  for (let j = 0; j < maxLabels; j++) {
    const i = Math.round(j * labelStep);
    if (i < dates.length) {
      ctx.fillText(dates[i], cx(i), h - pad.bottom + 8);
    }
  }

  // ── 零线 ──
  if (yMin < 0 && yMax > 0) {
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 0.8;
    ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(pad.left, y0); ctx.lineTo(w - pad.right, y0); ctx.stroke();
    ctx.setLineDash([]);
  }

  // ── 颜色 ──
  const isGreen = cumData[cumData.length - 1] >= 0;
  const lineColor = isGreen ? '#00ff88' : '#ff4466';
  const lineColor2 = isGreen ? '#00cc66' : '#cc2244';
  const glowColor = isGreen ? '#00ff88' : '#ff4466';

  // ── 填充渐变 ──
  const fillGrad = ctx.createLinearGradient(0, pad.top, 0, h - pad.bottom);
  fillGrad.addColorStop(0, isGreen ? 'rgba(0,255,136,0.12)' : 'rgba(255,68,102,0.12)');
  fillGrad.addColorStop(0.6, isGreen ? 'rgba(0,255,136,0.03)' : 'rgba(255,68,102,0.03)');
  fillGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = fillGrad;
  ctx.beginPath();
  ctx.moveTo(cx(0), y0);
  for (let i = 0; i < cumData.length; i++) ctx.lineTo(cx(i), cy(cumData[i]));
  ctx.lineTo(cx(cumData.length - 1), y0);
  ctx.closePath(); ctx.fill();

  // ── 折线（带发光） ──
  ctx.save();
  ctx.shadowColor = glowColor; ctx.shadowBlur = 8;
  const lineGrad = ctx.createLinearGradient(pad.left, 0, w - pad.right, 0);
  lineGrad.addColorStop(0, lineColor2);
  lineGrad.addColorStop(0.5, lineColor);
  lineGrad.addColorStop(1, lineColor2);
  ctx.strokeStyle = lineGrad; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < cumData.length; i++) {
    i === 0 ? ctx.moveTo(cx(i), cy(cumData[i])) : ctx.lineTo(cx(i), cy(cumData[i]));
  }
  ctx.stroke();
  ctx.restore();

  // 第二层细线（更亮的芯）
  ctx.strokeStyle = lineColor; ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < cumData.length; i++) {
    i === 0 ? ctx.moveTo(cx(i), cy(cumData[i])) : ctx.lineTo(cx(i), cy(cumData[i]));
  }
  ctx.stroke();

  // ── 数据点 ──
  for (let i = 0; i < cumData.length; i++) {
    const px = cx(i), py = cy(cumData[i]);
    ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fillStyle = isGreen ? 'rgba(0,255,136,0.25)' : 'rgba(255,68,102,0.25)'; ctx.fill();
    ctx.beginPath(); ctx.arc(px, py, 2.8, 0, Math.PI * 2);
    ctx.fillStyle = lineColor; ctx.fill();
    ctx.strokeStyle = '#0d1525'; ctx.lineWidth = 1; ctx.stroke();
  }

  // ── 首尾标注 ──
  const lastVal = cumData[cumData.length - 1];
  const firstVal = cumData[0];
  ctx.font = 'bold 11px monospace';
  ctx.fillStyle = '#707070'; ctx.textAlign = 'right';
  ctx.fillText((firstVal >= 0 ? '+' : '') + firstVal.toFixed(2), cx(0) - 6, cy(firstVal) - 8);
  ctx.save();
  ctx.shadowColor = glowColor; ctx.shadowBlur = 6;
  ctx.fillStyle = lineColor; ctx.textAlign = 'left';
  ctx.fillText((lastVal >= 0 ? '+' : '') + lastVal.toFixed(2) + 'U', cx(cumData.length - 1) + 6, cy(lastVal) - 4);
  ctx.restore();

  // ── Hover 交互 ──
  canvas._chartData = { dates, cumData, cx, cy, pad, w, h, y0, lineColor, glowColor, isGreen };
  canvas._tt = tooltip;

  function onMove(e) {
    if (!canvas._chartData) return;
    const d = canvas._chartData;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    if (mx < d.pad.left || mx > d.w - d.pad.right || my < d.pad.top || my > d.h - d.pad.bottom) {
      if (d._tt) d._tt.classList.remove('active');
      canvas.style.cursor = 'default';
      return;
    }
    let best = 0, bestDist = Infinity;
    for (let i = 0; i < d.cumData.length; i++) {
      const dist = Math.abs(mx - d.cx(i));
      if (dist < bestDist) { bestDist = dist; best = i; }
    }
    if (bestDist > 40) { if (d._tt) d._tt.classList.remove('active'); return; }
    const px = d.cx(best), py = d.cy(d.cumData[best]);

    // 重绘 + 十字线
    renderPnlChart(canvas.id, d.dates, pnlData);
    const c2 = canvas.getContext('2d');
    c2.scale(dpr, dpr);
    c2.strokeStyle = 'rgba(255,255,255,0.15)'; c2.lineWidth = 0.5;
    c2.setLineDash([3, 4]);
    c2.beginPath(); c2.moveTo(px, d.pad.top); c2.lineTo(px, d.h - d.pad.bottom); c2.stroke();
    c2.setLineDash([]);
    // 高亮圆点
    c2.beginPath(); c2.arc(px, py, 6, 0, Math.PI * 2);
    c2.fillStyle = d.isGreen ? 'rgba(0,255,136,0.4)' : 'rgba(255,68,102,0.4)'; c2.fill();
    c2.beginPath(); c2.arc(px, py, 4, 0, Math.PI * 2);
    c2.fillStyle = d.lineColor; c2.fill();
    c2.strokeStyle = '#fff'; c2.lineWidth = 1.5; c2.stroke();

    if (d._tt) {
      const val = pnlData[best], cum = d.cumData[best];
      const cGreen = cum >= 0;
      d._tt.innerHTML = '<div class="tt-date">' + d.dates[best] + '</div>' +
        '<span class="tt-val" style="color:' + (val >= 0 ? '#00ff88' : '#ff4466') + '">' +
        (val >= 0 ? '+' : '') + val.toFixed(2) + 'U 单笔</span>' +
        '<span class="tt-cum" style="color:' + (cGreen ? '#00ff88' : '#ff4466') + '">累计 ' +
        (cum >= 0 ? '+' : '') + cum.toFixed(2) + 'U</span>';
      d._tt.classList.add('active');
      const ttW = d._tt.offsetWidth, ttH = d._tt.offsetHeight;
      let ttx = px + 14, tty = py - ttH - 8;
      if (ttx + ttW > d.w - 10) ttx = px - ttW - 14;
      if (tty < 4) tty = py + 14;
      d._tt.style.left = ttx + 'px'; d._tt.style.top = tty + 'px';
    }
    canvas.style.cursor = 'crosshair';
  }

  function onLeave() {
    if (canvas._tt) canvas._tt.classList.remove('active');
    canvas.style.cursor = 'default';
    renderPnlChart(canvas.id, dates, pnlData);
  }

  canvas.onmousemove = onMove;
  canvas.onmouseleave = onLeave;
  canvas.ontouchmove = function(e) {
    const touch = e.touches[0];
    if (touch) onMove({ clientX: touch.clientX, clientY: touch.clientY });
  };
  canvas.ontouchend = onLeave;
}

// ===== 策略文章统计卡片样式 =====
// 为 about-stats 补充CSS（用于策略文章的版本参数展示）
// 与 About 页面样式区分
// ===== 排序切换 =====
function renderSortToggle() {
  const el = document.getElementById('sortToggle');
  const isLatest = sortMode === 'latest';
  el.innerHTML =
    '<button class="sort-btn'+(isLatest?' active-sort':'')+'" onclick="setSort(\'latest\')">🕐 最新优先</button>'+
    '<button class="sort-btn'+(isLatest?'':' active-sort')+'" onclick="setSort(\'oldest\')">📅 最早优先</button>';
}
function setSort(mode) {
  sortMode = mode;
  renderPosts();
}
// ===== 标签云 =====
function renderTagCloud() {
  const el = document.getElementById('tagCloud');
  const allPosts = POSTS.filter(p => p.module === currentModule);
  const tagCount = {};
  allPosts.forEach(p => p.tags.forEach(t => { tagCount[t] = (tagCount[t]||0)+1; }));
  const tags = Object.entries(tagCount).sort((a,b) => b[1]-a[1]);
  if (tags.length === 0) { el.innerHTML = ''; return; }
  el.innerHTML = '<span style="font-size:0.75rem;color:var(--text-secondary);margin-right:0.3rem;">标签:</span>' +
    tags.map(([t,c]) => '<span class="tag '+(currentModule==='strategy'?'strategy':'')+
    (activeTag===t?' active-tag':'')+'" onclick="toggleTag(\''+escapeHtml(t)+'\')">'+t+' ('+c+')</span>').join('');
}
function toggleTag(tag) {
  if (activeTag === tag) { activeTag = null; }
  else { activeTag = tag; searchQuery = ''; document.querySelectorAll('.search-input').forEach(inp => inp.value = ''); }
  renderPosts();
}
// ===== 回到顶部 =====
function scrollToTop() { window.scrollTo({top:0, behavior:'smooth'}); }
// ===== 阅读进度条 =====
function handleReadingProgress() {
  const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
  const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
  document.getElementById('readingProgress').style.width = scrolled + '%';
  // 回到顶部按钮
  const btn = document.getElementById('backToTop');
  btn.classList.toggle('visible', winScroll > 400);
}
// ===== 相关文章推荐 =====
function renderRelatedPosts(post) {
  const others = POSTS.filter(p => p.id !== post.id);
  const scored = others.map(p => {
    let score = 0;
    if (p.module === post.module) score += 3;
    post.tags.forEach(t => { if (p.tags.includes(t)) score += 2; });
    return {post:p, score:score};
  });
  scored.sort((a,b) => b.score - a.score);
  const top = scored.filter(s => s.score > 0).slice(0, 4);
  if (top.length === 0) return '';
  return '<div class="related-posts"><h3>🔗 相关文章</h3><div class="related-list">'+
    top.map(s => '<span class="related-link" onclick="openPost(\''+s.post.id+'\')">'+s.post.title+'</span>').join('')+
    '</div></div>';
}
// ===== JSON-LD文章结构化数据 =====
function injectArticleSchema(post) {
  let existing = document.getElementById('article-jsonld');
  if (existing) existing.remove();
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    'headline': post.title,
    'datePublished': post.date,
    'dateModified': post.date,
    'author': {'@type':'Person','name':'Xzw'},
    'description': post.summary,
    'publisher': {'@type':'Person','name':'Xzw'},
    'mainEntityOfPage': {'@type':'WebPage','@id':'https://xzw33.top/#/post/'+post.id},
    'keywords': post.tags.join(',')
  };
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = 'article-jsonld';
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
}
// ===== 右侧滚动进度条 =====
function updateVerticalProgress() {
  const bar = document.getElementById('verticalProgress');
  if (!bar) return;
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;
  bar.style.setProperty('--scroll-pct', pct + '%');
}
// ===== 模拟交易模块 =====
let simData = null;
let analyticsData = null;
let hitCount = null;
let simLoading = false;

async function showSimulation() {
  window.scrollTo({top: 0, behavior: 'instant'});

  // 隐藏其他面板
  document.getElementById('posts-list').style.display = 'none';
  document.getElementById('post-detail').classList.remove('active');
  document.getElementById('about-page').style.display = 'none';
  document.getElementById('sortToggle').style.display = 'none';
  document.getElementById('tagCloud').style.display = 'none';
  document.querySelectorAll('.module-tab').forEach(tab => { tab.className = 'module-tab'; });
  currentPostId = null;
  document.body.classList.remove('viewing-article');
  history.pushState(null, null, '#/simulation');

  // 隐藏 hero/search/hot-tags
  const hero = document.getElementById('heroBanner');
  const search = document.querySelector('.search-container');
  const hotTags = document.getElementById('hotTags');
  if (hero) hero.style.display = 'none';
  if (search) search.style.display = 'none';
  if (hotTags) hotTags.style.display = 'none';

  // 激活模拟标签
  document.querySelectorAll('.module-tab').forEach(tab => { tab.className = 'module-tab'; });
  const simTab = document.querySelector('.module-tab[onclick*="showSimulation"]');
  if (simTab) simTab.classList.add('active-sim');

  // 显示模拟面板
  const page = document.getElementById('simulation-page');
  page.style.display = 'block';
  document.getElementById('posts-list').style.display = 'none';

  // 加载数据 — 优先用 sessionStorage 缓存秒开
  if (simData && !simLoading) {
    renderSimulationDashboard();
    _unlockSimBody();
  } else if (!simLoading) {
    // 尝试从 sessionStorage 读取缓存（秒开但不解锁 body）
    try {
      var cached = sessionStorage.getItem('sim_cache');
      if (cached) {
        var parsed = JSON.parse(cached);
        if (parsed.simData) { simData = parsed.simData; hitCount = parsed.hitCount; }
        if (parsed.analyticsData) analyticsData = parsed.analyticsData;
        if (simData) renderSimulationDashboard();  // 秒开但保持 body locked
      }
    } catch(e) {}
    // 后台拉最新数据
    await fetchSimulationData();
    // 最终渲染完成后才解锁 body
    _unlockSimBody();
  }

  // 每60秒自动刷新
  if (autoRefreshTimer) clearInterval(autoRefreshTimer);
  autoRefreshTimer = setInterval(() => {
    if (document.getElementById('simulation-page').style.display !== 'none') {
      fetchSimulationData();
    } else {
      clearInterval(autoRefreshTimer);
      autoRefreshTimer = null;
    }
  }, 60000);

}

async function fetchSimulationData() {
  simLoading = true;
  document.getElementById('simLoading').style.display = 'block';
  document.getElementById('simError').style.display = 'none';
  document.getElementById('simDashboard').style.display = 'none';

  try {
    const [simResp, anaResp, statsResp] = await Promise.all([
      fetch('/simulation.json?t=' + Date.now()),
      fetch('/analytics.json?t=' + Date.now()),
      fetch('/api/stats')
    ]);
    if (!simResp.ok) throw new Error('HTTP ' + simResp.status);
    simData = await simResp.json();
    if (anaResp.ok) { try { analyticsData = await anaResp.json(); } catch(e) { analyticsData = null; } }
    else { analyticsData = null; }
    if (statsResp.ok) { try { const s = await statsResp.json(); hitCount = s.today || s.total || 0; } catch(e) { hitCount = null; } }
    else { hitCount = null; }
    renderSimulationDashboard();
    // 缓存到 sessionStorage（刷新秒开）
    try {
      sessionStorage.setItem('sim_cache', JSON.stringify({
        simData: simData,
        analyticsData: analyticsData,
        hitCount: hitCount,
        ts: Date.now()
      }));
    } catch(e) {}
  } catch (e) {
    document.getElementById('simLoading').style.display = 'none';
    document.getElementById('simError').style.display = 'block';
    console.error('Simulation load error:', e);
  } finally {
    simLoading = false;
  }
}

// === 日报日历：从 closed_trades 聚合每日盈亏 ===
function computeDailyPnl(trades) {
  const daily = {};  // { '2026-06-18': { pnl: 1.23, trades: [...], wins: 0, losses: 0 } }
  for (const t of trades) {
    const day = (t.close_time || '').substring(0, 10);
    if (!day) continue;
    if (!daily[day]) daily[day] = { pnl: 0, trades: [], wins: 0, losses: 0 };
    daily[day].pnl += t.pnl || 0;
    daily[day].trades.push(t);
    if ((t.pnl || 0) >= 0) daily[day].wins++; else daily[day].losses++;
  }
  return daily;
}

function renderSimulationDashboard() {
  if (!simData) return;
  document.getElementById('simLoading').style.display = 'none';
  document.getElementById('simDashboard').style.display = 'block';

  // 策略状态行
  const now = new Date();
  const updatedAt = simData.updated_ts ? new Date(simData.updated_ts * 1000) : null;
  const minsAgo = updatedAt ? Math.floor((now - updatedAt) / 60000) : null;
  const statusRunning = minsAgo !== null && minsAgo < 30;
  const version = simData.version || 'v3.9.50';
  document.getElementById('simStrategyStatus').innerHTML =
    '<span class="ss-item"><span class="ss-dot ' + (statusRunning ? 'on' : 'off') + '"></span>' +
    (statusRunning ? '策略运行中' : '数据可能停更') + '</span>' +
    '<span class="ss-item">📌 版本: ' + version + '</span>' +
    (hitCount !== null ? '<span class="ss-item">👁 ' + hitCount + ' 次浏览</span>' : '');

  const a = simData.account || {};
  const pnlClass = a.total_pnl >= 0 ? 'up' : 'down';
  const pnlSign = a.total_pnl >= 0 ? '+' : '';

  // 概览卡片
  document.getElementById('simCards').innerHTML =
    '<div class="sim-card card-equity">' +
      '<div class="sc-label">总权益</div>' +
      '<div class="sc-value" style="color:#00d4ff">$' + (a.total_equity || 0).toFixed(2) + '</div>' +
      '<div class="sc-sub">初始 $' + (a.initial_balance || 0).toFixed(2) + '</div>' +
    '</div>' +
    '<div class="sim-card card-pnl">' +
      '<div class="sc-label">累计盈亏</div>' +
      '<div class="sc-value ' + pnlClass + '">' + pnlSign + '$' + (a.total_pnl || 0).toFixed(2) + '</div>' +
      '<div class="sc-sub">' + pnlSign + (a.total_pnl_pct || 0).toFixed(2) + '%</div>' +
    '</div>' +
    '<div class="sim-card card-balance">' +
      '<div class="sc-label">可用余额</div>' +
      '<div class="sc-value" style="color:#a78bfa">$' + (a.balance || 0).toFixed(2) + '</div>' +
      '<div class="sc-sub">保证金占用 $' + (a.total_margin || 0).toFixed(0) + '</div>' +
    '</div>' +
    '<div class="sim-card card-win">' +
      '<div class="sc-label">胜率</div>' +
      '<div class="sc-value" style="color:#39ff14">' + (simData.win_rate || 0) + '%</div>' +
      '<div class="sc-sub">' + (simData.wins || 0) + '赢 / ' + (simData.losses || 0) + '亏</div>' +
    '</div>' +
    '<div class="sim-card card-fee">' +
      '<div class="sc-label">累计手续费</div>' +
      '<div class="sc-value" style="color:#f87171">-$' + (a.total_fee || 0).toFixed(2) + '</div>' +
      '<div class="sc-sub">含开平仓 taker 0.04%</div>' +
    '</div>' +
    '<div class="sim-card card-pos">' +
      '<div class="sc-label">当前持仓</div>' +
      '<div class="sc-value" style="color:#f59e0b">' + (simData.positions_count || 0) + '</div>' +
      '<div class="sc-sub">浮盈 $' + (a.unrealized_pnl || 0).toFixed(2) + '</div>' +
    '</div>';

  // 分析卡片（夏普/回撤/盈亏比/期望值）
  renderAnalyticsCards();
  // 权益曲线
  renderEquityChart(simData.equity_history || []);

  // 当前持仓
  renderPositionsTable(simData.positions || []);

  // 已平仓
  renderTradesTable(simData.closed_trades || []);

  // 日报日历
  renderDailyCalendar();

  // 更新时间
  const footer = document.querySelector('.simulation-section .sim-updated');
  const timeStr = simData.updated_at || '';
  if (footer) {
    footer.textContent = '🕒 更新于 ' + timeStr;
  } else {
    const el = document.getElementById('simDashboard');
    const existing = el.querySelector('.sim-updated');
    if (existing) existing.remove();
    el.insertAdjacentHTML('beforeend', '<div class="sim-updated">🕒 更新于 ' + timeStr + '</div>');
  }
  
  // 更新脚注时间
  // (body 解锁由 _unlockSimBody() 在最终渲染后调用，防中间渲染提前解锁)
}

// === Lightweight Charts 权益曲线 ===
let eqChart = null;
let eqSeries = null;
let eqInitLine = null;

function renderEquityChart(history) {
  const container = document.getElementById('simChartContainer');
  if (!container) return;

  // 过滤时间范围
  const now = new Date();
  let filtered = history;
  if (simRangeDays > 0) {
    let cutoff;
    if (simRangeDays === 1) {
      cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000;
    } else if (simRangeDays === 7) {
      const day = now.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset).getTime() / 1000;
    } else if (simRangeDays === 30) {
      cutoff = new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000;
    } else {
      cutoff = 0;
    }
    filtered = filtered.filter(h => h.ts >= cutoff);
  }
  if (filtered.length < 2) filtered = history;

  if (!filtered || filtered.length < 2) {
    container.innerHTML = '<div style="text-align:center;padding:2rem;color:#94a3b8;">暂无权益历史数据</div>';
    return;
  }

  // 重建容器
  container.innerHTML = '';

  // 标题行 + 范围按钮
  const header = document.createElement('div');
  header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:0.6rem;flex-wrap:wrap;gap:0.4rem;';
  header.innerHTML =
    '<span class="chart-title">📈 权益曲线</span>' +
    '<div class="range-selector">' +
      '<button class="range-btn'+(simRangeDays===0?' active':'')+'" onclick="setChartRange(0)">全部</button>' +
      '<button class="range-btn'+(simRangeDays===1?' active':'')+'" onclick="setChartRange(1)">日</button>' +
      '<button class="range-btn'+(simRangeDays===7?' active':'')+'" onclick="setChartRange(7)">周</button>' +
      '<button class="range-btn'+(simRangeDays===30?' active':'')+'" onclick="setChartRange(30)">月</button>' +
    '</div>';
  container.appendChild(header);

  const chartDiv = document.createElement('div');
  chartDiv.style.cssText = 'width:100%;height:320px;';
  container.appendChild(chartDiv);

  // 数据转换 — 加8小时偏移使图表显示北京时间
  const chartData = filtered.map(h => ({
    time: h.ts + 28800,
    value: h.equity
  }));

  const initBalance = simData && simData.account ? simData.account.initial_balance : 500;

  // 销毁旧图
  if (eqChart) { eqChart.remove(); eqChart = null; eqSeries = null; eqInitLine = null; }

  // requestAnimationFrame: 确保 chartDiv 已完成布局再创建图表（否则0尺寸→空白）
  requestAnimationFrame(function() {
  eqChart = LightweightCharts.createChart(chartDiv, {
    layout: { background: { color: '#0a0e17' }, textColor: '#64748b' },
    grid: { vertLines: { color: 'rgba(255,255,255,0.05)' }, horzLines: { color: 'rgba(255,255,255,0.05)' } },
    crosshair: { mode: 1, vertLine: { color: 'rgba(0,212,255,0.3)', labelBackgroundColor: '#0a0e17' }, horzLine: { color: 'rgba(0,212,255,0.3)', labelBackgroundColor: '#0a0e17' } },
    timeScale: { timeVisible: true, secondsVisible: false, borderColor: 'rgba(255,255,255,0.1)' },
    rightPriceScale: { borderColor: 'rgba(255,255,255,0.1)', scaleMargins: { top: 0.1, bottom: 0.1 } },
    handleScroll: true, handleScale: true,

  });

  eqSeries = eqChart.addLineSeries({
    color: '#00d4ff',
    lineWidth: 2,
    crosshairMarkerBackgroundColor: '#00d4ff',
    lastValueVisible: true,
    priceLineVisible: false,
  });
  eqSeries.setData(chartData);

  // 初始资金参考线
  eqInitLine = eqSeries.createPriceLine({
    price: initBalance,
    color: 'rgba(255,255,255,0.15)',
    lineWidth: 1,
    lineStyle: 2, // dashed
    axisLabelVisible: true,
    title: '初始',
  });

  // 时间轴对齐：从日/周/月起点开始（加8小时偏移匹配北京时间）
  const OFFSET = 28800;
  if (simRangeDays > 0) {
    const nowTs = Math.floor(Date.now() / 1000) + OFFSET;
    let rangeFrom;
    if (simRangeDays === 1) {
      rangeFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000 + OFFSET;
    } else if (simRangeDays === 7) {
      const day = now.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      rangeFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset).getTime() / 1000 + OFFSET;
    } else if (simRangeDays === 30) {
      rangeFrom = new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000 + OFFSET;
    }
    eqChart.timeScale().setVisibleRange({ from: rangeFrom, to: nowTs });
  } else {
    eqChart.timeScale().fitContent();
  }
  }); // end requestAnimationFrame
}

function renderPositionsTable(positions) {
  const container = document.getElementById('simPositions');
  if (!positions || positions.length === 0) {
    container.innerHTML = '<div class="sim-empty">暂无持仓</div>';
    return;
  }

  // 分页：每页10个
  const pageSize = 10;
  const totalPages = Math.ceil(positions.length / pageSize);
  if (simPosPage >= totalPages) simPosPage = Math.max(0, totalPages - 1);
  const pageData = positions.slice(simPosPage * pageSize, (simPosPage + 1) * pageSize);

  let html = '<table class="sim-table"><thead><tr>' +
    '<th>交易对</th><th>方向</th><th>入场价</th><th>当前价</th><th>数量</th><th>保证金</th><th>杠杆</th><th>浮盈(USD)</th><th>浮盈(%)</th><th>开仓时间</th>' +
    '</tr></thead><tbody>';
  pageData.forEach(p => {
    const pnlClass = p.unrealized_pnl >= 0 ? 'pnl-up' : 'pnl-down';
    const pnlSign = p.unrealized_pnl >= 0 ? '+' : '';
    const sideClass = p.side === 'BUY' ? 'side-buy' : 'side-sell';
    html += '<tr>' +
      '<td style="color:#e2e8f0">' + p.symbol + '</td>' +
      '<td class="' + sideClass + '">' + (p.side === 'BUY' ? '多' : '空') + '</td>' +
      '<td>' + formatPrice(p.entry_price) + '</td>' +
      '<td>' + formatPrice(p.current_price) + '</td>' +
      '<td>' + (p.size || 0).toFixed(2) + '</td>' +
      '<td>$' + (p.size_usdt || 0).toFixed(0) + '</td>' +
      '<td>' + (p.leverage || 0) + 'x</td>' +
      '<td class="' + pnlClass + '">' + pnlSign + '$' + (p.unrealized_pnl || 0).toFixed(2) + '</td>' +
      '<td class="' + pnlClass + '">' + pnlSign + (p.pnl_pct || 0).toFixed(2) + '%</td>' +
      '<td style="color:#94a3b8;font-size:0.75rem">' + (p.open_time || '') + '</td>' +
      '</tr>';
  });
  html += '</tbody></table>';

  // 分页导航
  if (totalPages > 1) {
    html += '<div class="page-nav">' +
      '<button class="page-btn" onclick="simPosPage=0;renderPositionsTable(simData.positions||[])" ' + (simPosPage === 0 ? 'disabled' : '') + '>«</button>';
    for (let p = 0; p < totalPages; p++) {
      html += '<button class="page-btn' + (p === simPosPage ? ' active' : '') + '" onclick="simPosPage=' + p + ';renderPositionsTable(simData.positions||[])">' + (p + 1) + '</button>';
    }
    html += '<button class="page-btn" onclick="simPosPage=' + (totalPages - 1) + ';renderPositionsTable(simData.positions||[])" ' + (simPosPage >= totalPages - 1 ? 'disabled' : '') + '>»</button>' +
      '<span class="page-info">' + (simPosPage + 1) + '/' + totalPages + ' 页</span></div>';
  }

  container.innerHTML = html;
}

// ===== v3.9.51 分析卡片（夏普/回撤/盈亏比/期望值） =====
function renderAnalyticsCards() {
  const container = document.getElementById('simAnalyticsCards');
  if (!container) return;
  if (!analyticsData || !analyticsData.trade_metrics) {
    // 无 analytics 数据时尝试从 simulation 数据计算
    // v3.9.73: 无平仓时也从持仓/权益历史降级计算
    const hasTrades = simData && simData.closed_trades && simData.closed_trades.length > 0;
    const hasPositions = simData && simData.positions && simData.positions.length > 0;
    const hasEquity = simData && simData.equity_history && simData.equity_history.length >= 2;
    
    if (hasTrades || hasPositions || hasEquity) {
      // v3.9.73: 有平仓用平仓数据，无平仓用持仓浮盈 + 权益历史
      let trades, wins, losses, totalPnL, winSum, lossSum, pf, expVal, maxDD;
      if (hasTrades) {
        trades = simData.closed_trades;
        wins = trades.filter(t => t.pnl > 0);
        losses = trades.filter(t => t.pnl <= 0);
        totalPnL = trades.reduce((s, t) => s + t.pnl, 0);
        winSum = wins.reduce((s, t) => s + t.pnl, 0);
        lossSum = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
        pf = lossSum > 0 ? (winSum / lossSum).toFixed(2) : '--';
        expVal = trades.length > 0 ? (totalPnL / trades.length).toFixed(2) : '--';
      } else {
        trades = [];
        wins = []; losses = [];
        totalPnL = simData.account ? (simData.account.total_pnl || 0) : 0;
        winSum = 0; lossSum = 0;
        pf = '--'; expVal = '--';
      }
      // 最大回撤：优先用 computed max_drawdown_pct，否则从 equity_history 计算
      if (simData.account && simData.account.max_drawdown_pct) {
        maxDD = simData.account.max_drawdown_pct.toFixed(1) + '%';
      } else if (hasEquity) {
        const equities = simData.equity_history.map(h => h.equity);
        let peak = equities[0], dd = 0;
        for (let i = 1; i < equities.length; i++) {
          if (equities[i] > peak) peak = equities[i];
          const d = (peak - equities[i]) / peak * 100;
          if (d > dd) dd = d;
        }
        maxDD = dd.toFixed(1) + '%';
      } else {
        maxDD = '--';
      }
      container.innerHTML =
        '<div class="sim-analytics-card card-pf">' +
          '<div class="sac-label">盈亏比</div>' +
          '<div class="sac-value" style="color:' + (parseFloat(pf) >= 1 ? '#39ff14' : '#ff4466') + '">' + pf + '</div>' +
          '<div class="sac-sub">盈利合计/' + (lossSum > 0 ? '亏损合计' : '--') + '</div>' +
        '</div>' +
        '<div class="sim-analytics-card card-exp">' +
          '<div class="sac-label">期望值</div>' +
          '<div class="sac-value" style="color:' + (parseFloat(expVal) >= 0 ? '#39ff14' : '#ff4466') + '">$' + expVal + '</div>' +
          '<div class="sac-sub">每笔交易平均</div>' +
        '</div>' +
        '<div class="sim-analytics-card card-dd">' +
          '<div class="sac-label">最大回撤</div>' +
          '<div class="sac-value" style="color:#f59e0b">' + maxDD + '</div>' +
          '<div class="sac-sub">权益峰值到谷底</div>' +
        '</div>' +
        '<div class="sim-analytics-card card-count">' +
          '<div class="sac-label">交易笔数</div>' +
          '<div class="sac-value" style="color:#00d4ff">' + trades.length + '</div>' +
          '<div class="sac-sub">' + wins.length + '赢 / ' + losses.length + '亏</div>' +
        '</div>';
      return;
    }
    container.innerHTML = '<div class="sim-empty" style="grid-column:1/-1">📊 分析数据收集中，需要更多交易日</div>';
    return;
  }
  const m = analyticsData.trade_metrics;
  const p = analyticsData.performance || {};
  const pf = m.profit_factor || 0;
  // 夏普: analytics null → 从simulation equity_history估算, 都不行就 N/A
  let sharpe = p.sharpe_ratio;
  if (!sharpe && simData && simData.equity_history && simData.equity_history.length >= 2) {
    const eq = simData.equity_history;
    const initBal = simData.account ? (simData.account.initial_balance || 500) : 500;
    const dailyReturns = [];
    let dayStart = null, dayEq = null;
    for (let i = 0; i < eq.length; i++) {
      const d = new Date(eq[i].ts * 1000);
      const dayKey = d.toDateString();
      if (dayStart !== dayKey) {
        if (dayStart && dayEq !== null) dailyReturns.push((eq[i-1].equity - dayEq) / dayEq);
        dayStart = dayKey;
        dayEq = eq[i].equity;
      }
    }
    if (dailyReturns.length >= 2) {
      const mean = dailyReturns.reduce((s,v) => s+v, 0) / dailyReturns.length;
      const variance = dailyReturns.reduce((s,v) => s + Math.pow(v-mean, 2), 0) / (dailyReturns.length-1);
      const std = Math.sqrt(variance);
      sharpe = std > 0 ? ((mean / std) * Math.sqrt(252)).toFixed(2) : null;
    }
  }
  if (!sharpe) sharpe = 'N/A';
  // 最大回撤: analytics null → simulation account.max_drawdown_pct → equity计算
  let maxDD = p.max_drawdown;
  if (!maxDD && simData) {
    if (simData.account && simData.account.max_drawdown_pct) {
      maxDD = simData.account.max_drawdown_pct;
    } else if (simData.equity_history && simData.equity_history.length >= 2) {
      const eq = simData.equity_history.map(h => h.equity);
      let peak = eq[0], dd = 0;
      for (let i = 1; i < eq.length; i++) {
        if (eq[i] > peak) peak = eq[i];
        const d = (peak - eq[i]) / peak * 100;
        if (d > dd) dd = d;
      }
      maxDD = dd;
    }
  }
  const maxDDStr = maxDD ? (typeof maxDD === 'number' ? maxDD.toFixed(1) + '%' : String(maxDD)) : 'N/A';
  const wl = (m.win_count || 0) + '赢 / ' + (m.loss_count || 0) + '亏';
  
  container.innerHTML =
    '<div class="sim-analytics-card card-sharpe">' +
      '<div class="sac-label">夏普比率</div>' +
      '<div class="sac-value" style="color:' + (typeof sharpe === 'number' && sharpe >= 1 ? '#39ff14' : typeof sharpe === 'number' && sharpe > 0 ? '#f59e0b' : '#ff4466') + '">' + (typeof sharpe === 'number' ? sharpe.toFixed(2) : sharpe) + '</div>' +
      '<div class="sac-sub">年化风险调整收益</div>' +
    '</div>' +
    '<div class="sim-analytics-card card-pf">' +
      '<div class="sac-label">盈亏比</div>' +
      '<div class="sac-value" style="color:' + (pf >= 1 ? '#39ff14' : '#ff4466') + '">' + (typeof pf === 'number' ? pf.toFixed(2) : pf) + '</div>' +
      '<div class="sac-sub">$' + (m.avg_win || 0).toFixed(0) + ' / -$' + Math.abs(m.avg_loss || 0).toFixed(0) + ' 均笔</div>' +
    '</div>' +
    '<div class="sim-analytics-card card-dd">' +
      '<div class="sac-label">最大回撤</div>' +
      '<div class="sac-value" style="color:#f59e0b">' + maxDDStr + '</div>' +
      '<div class="sac-sub">' + wl + '</div>' +
    '</div>' +
    '<div class="sim-analytics-card card-exp">' +
      '<div class="sac-label">期望值</div>' +
      '<div class="sac-value" style="color:' + ((m.expectancy || 0) >= 0 ? '#39ff14' : '#ff4466') + '">$' + (m.expectancy || 0).toFixed(2) + '</div>' +
      '<div class="sac-sub">' + (m.total_trades || 0) + '笔交易 · ' + (m.win_rate || 0) + '%胜率</div>' +
    '</div>';
}

function renderTradesTable(trades) {
  const container = document.getElementById('simTrades');
  if (!trades || trades.length === 0) {
    container.innerHTML = '<div class="sim-empty">暂无平仓记录</div>';
    return;
  }

  // 时间范围过滤
  const now = new Date();
  let filtered = trades;
  if (simTradeRange > 0) {
    let cutoff;
    if (simTradeRange === 1) {
      // 日 = 今天 00:00
      cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    } else if (simTradeRange === 7) {
      // 周 = 本周一 00:00
      const day = now.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day; // Sunday=0 → -6, Monday=1 → 0
      const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
      cutoff = monday.getTime();
    } else if (simTradeRange === 30) {
      // 月 = 本月1日 00:00
      cutoff = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    } else {
      cutoff = 0;
    }
    filtered = trades.filter(t => {
      const ct = t.close_time;
      if (!ct) return false;
      const parsed = new Date(ct.replace(' ','T') + '+08:00');
      return parsed.getTime() >= cutoff;
    });
  }
  if (filtered.length === 0) filtered = trades.slice(-30);

  // 分页：每页10笔
  const pageSize = 10;
  const totalPages = Math.ceil(filtered.length / pageSize);
  if (simTradePage >= totalPages) simTradePage = Math.max(0, totalPages - 1);
  const pageData = filtered.slice(simTradePage * pageSize, (simTradePage + 1) * pageSize);

  // 标题
  let html = '<div class="trade-range-bar">' +
    '<span class="trade-range-label">📋 已平仓记录</span>' +
    '<div class="range-selector">' +
      '<button class="range-btn'+(simTradeRange===0?' active':'')+'" onclick="setTradeRange(0)">全部</button>' +
      '<button class="range-btn'+(simTradeRange===1?' active':'')+'" onclick="setTradeRange(1)">日</button>' +
      '<button class="range-btn'+(simTradeRange===7?' active':'')+'" onclick="setTradeRange(7)">周</button>' +
      '<button class="range-btn'+(simTradeRange===30?' active':'')+'" onclick="setTradeRange(30)">月</button>' +
    '</div>' +
    '</div>';

  // 表格（移除高度限制，全部显示）
  html += '<div class="sim-table-wrap"><table class="sim-table"><thead><tr>' +
    '<th>交易对</th><th>方向</th><th>入场价</th><th>出场价</th><th>保证金</th><th>盈亏(USD)</th><th>盈亏(%)</th><th>平仓时间</th>' +
    '</tr></thead><tbody>';
  pageData.forEach(t => {
    const pnlClass = t.pnl >= 0 ? 'pnl-up' : 'pnl-down';
    const pnlSign = t.pnl >= 0 ? '+' : '';
    const sideClass = t.side === 'BUY' ? 'side-buy' : 'side-sell';
    html += '<tr>' +
      '<td style="color:#e2e8f0">' + t.symbol + '</td>' +
      '<td class="' + sideClass + '">' + (t.side === 'BUY' ? '多' : '空') + '</td>' +
      '<td>' + formatPrice(t.entry_price) + '</td>' +
      '<td>' + formatPrice(t.exit_price) + '</td>' +
      '<td>$' + (t.size_usdt || 0).toFixed(0) + '</td>' +
      '<td class="' + pnlClass + '">' + pnlSign + '$' + (t.pnl || 0).toFixed(2) + '</td>' +
      '<td class="' + pnlClass + '">' + pnlSign + (t.pnl_pct || 0).toFixed(2) + '%</td>' +
      '<td style="color:#94a3b8;font-size:0.75rem">' + (t.close_time || '') + '</td>' +
      '</tr>';
  });
  html += '</tbody></table></div>';

  // 分页导航 — 始终显示（1页时仅显示页码信息）
  html += '<div class="page-nav">';
  if (totalPages > 1) {
    html += '<button class="page-btn" onclick="setTradeRange(' + simTradeRange + ');simTradePage=0;renderTradesTable(simData.closed_trades||[])" ' + (simTradePage === 0 ? 'disabled' : '') + '>«</button>';
    for (let p = 0; p < totalPages; p++) {
      html += '<button class="page-btn' + (p === simTradePage ? ' active' : '') + '" onclick="simTradePage=' + p + ';renderTradesTable(simData.closed_trades||[])">' + (p + 1) + '</button>';
    }
    html += '<button class="page-btn" onclick="setTradeRange(' + simTradeRange + ');simTradePage=' + (totalPages - 1) + ';renderTradesTable(simData.closed_trades||[])" ' + (simTradePage >= totalPages - 1 ? 'disabled' : '') + '>»</button>';
  }
  html += '<span class="page-info">' + filtered.length + ' 笔 · ' + (simTradePage + 1) + '/' + totalPages + ' 页</span></div>';

  container.innerHTML = html;
}
function setTradeRange(days) {
  simTradeRange = days;
  simTradePage = 0;
  renderTradesTable(simData.closed_trades || []);
}

// === 日报日历渲染 ===
const CAL_MONTH_NAMES = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
const CAL_DAY_NAMES = ['一','二','三','四','五','六','日'];

function renderDailyCalendar() {
  var container = document.getElementById('simCalendar');
  if (!container) return;

  var trades = simData.closed_trades || [];
  var daily = computeDailyPnl(trades);
  var year = calendarYear;
  var month = calendarMonth;

  var firstDay = new Date(year, month, 1);
  var totalDays = new Date(year, month + 1, 0).getDate();
  var startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  var now = new Date();
  var monthPnl = 0, monthDays = 0, monthWins = 0, monthLosses = 0;

  var html = '';
  html += '<div class="cal-header">';
  html += '<button class="cal-nav" onclick="calendarMonth--;if(calendarMonth<0){calendarMonth=11;calendarYear--;}renderDailyCalendar();">◀</button>';
  html += '<span class="cal-title">' + year + '年 ' + CAL_MONTH_NAMES[month] + '</span>';
  html += '<button class="cal-nav" onclick="calendarMonth++;if(calendarMonth>11){calendarMonth=0;calendarYear++;}renderDailyCalendar();">▶</button>';
  html += '</div>';

  html += '<div class="cal-grid">';
  for (var d = 0; d < 7; d++) {
    html += '<div class="cal-day-name">' + CAL_DAY_NAMES[d] + '</div>';
  }
  for (var i = 0; i < startDow; i++) {
    html += '<div class="cal-cell cal-empty"></div>';
  }
  for (var day = 1; day <= totalDays; day++) {
    var dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
    var dd = daily[dateStr];
    var isToday = dateStr === now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    var isFuture = new Date(year, month, day) > now;

    var cellClass = 'cal-cell';
    var pnlDisplay = '';

    if (isFuture) {
      cellClass += ' cal-future';
    } else if (dd) {
      var pnl = dd.pnl;
      monthPnl += pnl;
      monthDays++;
      monthWins += dd.wins;
      monthLosses += dd.losses;
      if (pnl >= 0) {
        if (pnl > 5) cellClass += ' cal-profit-high';
        else if (pnl > 1) cellClass += ' cal-profit-mid';
        else cellClass += ' cal-profit-low';
      } else {
        if (pnl < -5) cellClass += ' cal-loss-high';
        else if (pnl < -1) cellClass += ' cal-loss-mid';
        else cellClass += ' cal-loss-low';
      }
      cellClass += ' cal-has-data';
      pnlDisplay = (pnl >= 0 ? '+' : '') + pnl.toFixed(1);
    } else {
      cellClass += ' cal-no-data';
    }
    if (isToday) cellClass += ' cal-today';

    html += '<div class="' + cellClass + '"' + (dd ? ' onclick="showDayTrades(\'' + dateStr + '\')" title="' + dateStr + ': ' + (dd.pnl >= 0 ? '+' : '') + dd.pnl.toFixed(2) + 'U | ' + dd.trades.length + '笔"' : '') + '>';
    html += '<span class="cal-day-num">' + day + '</span>';
    if (pnlDisplay) {
      html += '<span class="cal-day-pnl">' + pnlDisplay + '</span>';
    }
    html += '</div>';
  }
  html += '</div>';

  var summaryPnlClass = monthPnl >= 0 ? 'cal-summary-up' : 'cal-summary-down';
  html += '<div class="cal-summary">';
  html += '<span>本月交易 <strong>' + monthDays + '</strong> 天</span>';
  html += '<span>总盈亏 <strong class="' + summaryPnlClass + '">' + (monthPnl >= 0 ? '+' : '') + monthPnl.toFixed(2) + 'U</strong></span>';
  html += '<span>胜率 <strong>' + (monthDays > 0 ? Math.round(monthWins / (monthWins + monthLosses) * 100) : 0) + '%</strong>（' + monthWins + '赢' + monthLosses + '亏）</span>';
  html += '</div>';

  html += '<div class="cal-detail" id="calDetail" style="display:none;"></div>';
  container.innerHTML = html;
}

function showDayTrades(dateStr) {
  var trades = (simData.closed_trades || []).filter(function(t) { return (t.close_time || '').substring(0, 10) === dateStr; });
  if (!trades.length) return;
  var detail = document.getElementById('calDetail');
  if (!detail) return;

  var totalPnl = 0;
  var html = '<div class="cal-detail-header" onclick="document.getElementById(\'calDetail\').style.display=\'none\'">📅 ' + dateStr + ' 交易明细（' + trades.length + '笔） ✕</div>';
  html += '<div class="sim-table-wrap"><table class="sim-table"><thead><tr>';
  html += '<th>币种</th><th>方向</th><th>入场</th><th>出场</th><th>盈亏</th><th>盈亏%</th>';
  html += '</tr></thead><tbody>';

  for (var i = 0; i < trades.length; i++) {
    var t = trades[i];
    var sideClass = t.side === 'BUY' ? 'side-buy' : 'side-sell';
    var pnlClass = (t.pnl || 0) >= 0 ? 'pnl-up' : 'pnl-down';
    var pnlSign = (t.pnl || 0) >= 0 ? '+' : '';
    totalPnl += t.pnl || 0;
    html += '<tr>';
    html += '<td>' + (t.symbol || '') + '</td>';
    html += '<td class="' + sideClass + '">' + (t.side || '') + '</td>';
    html += '<td>' + formatPrice(t.entry_price) + '</td>';
    html += '<td>' + formatPrice(t.exit_price) + '</td>';
    html += '<td class="' + pnlClass + '">' + pnlSign + '$' + (t.pnl || 0).toFixed(2) + '</td>';
    html += '<td class="' + pnlClass + '">' + pnlSign + (t.pnl_pct || 0).toFixed(2) + '%</td>';
    html += '</tr>';
  }

  html += '</tbody></table></div>';
  var totalClass = totalPnl >= 0 ? 'pnl-up' : 'pnl-down';
  html += '<div class="cal-detail-total">合计: <span class="' + totalClass + '">' + (totalPnl >= 0 ? '+' : '') + '$' + totalPnl.toFixed(2) + '</span></div>';
  detail.innerHTML = html;
  detail.style.display = 'block';
}

// ===== 解锁模拟面板 — 仅图表resize + 暴力滚动，不移除遮罩 =====
function _unlockSimBody() {
  var simPage = document.getElementById('simulation-page');
  if (simPage) simPage.scrollTop = 0;
  // Lightweight Charts resize
  if (eqChart) {
    try { eqChart.resize(); } catch(e) {}
  }
  // 三段暴力滚动
  window.scrollTo({top: 0, behavior: 'instant'});
  setTimeout(function(){ window.scrollTo({top: 0, behavior: 'instant'}); }, 50);
  setTimeout(function(){ window.scrollTo({top: 0, behavior: 'instant'}); }, 300);
  setTimeout(function(){
    if (simPage && simPage.style.display !== 'none') {
      simPage.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 400);
}

// 清理 pre-sim-hide 遮罩（仅导航离开模拟面板时调用）
function _cleanupSimHide() {
  var preHide = document.getElementById('pre-sim-hide');
  if (preHide) preHide.remove();
}

// ===== v3.9.51 手动刷新模拟数据 =====
async function refreshSimulation() {
  const btn = document.querySelector('.sim-refresh-btn');
  if (btn) { btn.textContent = '⏳ 刷新中...'; btn.disabled = true; }
  simData = null;
  analyticsData = null;
  hitCount = null;
  simPosPage = 0;
  simTradePage = 0;
  await fetchSimulationData();
  if (btn) { btn.textContent = '🔄 手动刷新'; btn.disabled = false; }
}

function formatPrice(price) {
  if (price === null || price === undefined || price === 0) return '-';
  if (price >= 100) return price.toFixed(2);
  if (price >= 1) return price.toFixed(4);
  if (price >= 0.01) return price.toFixed(5);
  return price.toFixed(6);
}
// ===== 模拟交易模块 END =====
// ===== v3.9.51 热门标签点击 =====
function hotTagClick(tag) {
  // 切换到量化交易笔记tab（标签主要在quant模块）
  currentModule = 'quant';
  document.querySelectorAll('.module-tab').forEach(tab => { tab.className = 'module-tab'; });
  const quantTab = document.querySelector('[data-module="quant"]');
  if (quantTab) quantTab.classList.add('active-quant');
  document.getElementById('posts-list').style.display = 'block';
  document.getElementById('about-page').style.display = 'none';
  document.getElementById('simulation-page').style.display = 'none';
  document.getElementById('post-detail').classList.remove('active');
  document.getElementById('searchScope').textContent = '量化交易笔记';
  searchQuery = '';
  activeTag = tag;
  document.querySelectorAll('.search-input').forEach(inp => { inp.value = ''; });
  renderPosts();
  window.scrollTo({top: 0, behavior: 'smooth'});
}

// ===== 滚动事件监听 =====
function setChartRange(days) {
  simRangeDays = days;
  renderEquityChart(simData.equity_history || []);
}

window.addEventListener('scroll', function() {
  handleReadingProgress();
  updateVerticalProgress();
}, {passive:true});
