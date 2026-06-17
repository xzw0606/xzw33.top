
let currentModule = 'quant';
let currentPostId = null;
let searchQuery = '';
let sortMode = 'latest'; // 'latest' | 'oldest'
let activeTag = null; // 当前选中的标签

// HTML转义防XSS
function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function showHome() {
  document.getElementById('posts-list').style.display = 'block';
  document.getElementById('post-detail').classList.remove('active');
  document.getElementById('about-page').style.display = 'none';
  document.getElementById('simulation-page').style.display = 'none';
  document.getElementById('sortToggle').style.display = 'flex';
  document.getElementById('tagCloud').style.display = 'flex';
  currentPostId = null;
  document.body.classList.remove('viewing-article');
  history.pushState(null, null, '#/');
  renderPosts();
}

function showAbout() {
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
  document.getElementById('post-detail').classList.remove('active');
  history.pushState(null, null, '#/tab/' + module);
  renderPosts();
}

// 估算阅读时间（每分钟200字）
function getReadingTime(content) {
  const text = content.replace(/<[^>]+>/g, '');
  const cn = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const en = (text.match(/[a-zA-Z]+/g) || []).join(' ').length;
  const words = cn + Math.ceil(en / 5); // 中文1字=1词，英文5字符≈1词
  const minutes = Math.max(1, Math.ceil(words / 200));
  return minutes;
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
    const readingTime = getReadingTime(post.content);
    return '<div class="post-card' + cardClass + '" onclick="openPost(\'' + post.id + '\')">' +
      '<h3>' + post.title + '</h3>' +
      '<p class="summary">' + post.summary + '</p>' +
      '<div class="post-meta">' +
        post.tags.map(t => '<span class="tag' + tagClass + '">' + t + '</span>').join('') +
        '<span class="date">' + post.date + '</span>' +
        '<span class="reading-time">🕒 ' + readingTime + '分钟</span>' +
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
  
  // 生成TOC
  const tocHTML = generateTOC(post.content);
  // 生成相关文章
  const relatedHTML = renderRelatedPosts(post);
  // 阅读时间+字数统计
  const wordCount = (post.content.replace(/<[^>]+>/g, '').match(/[\u4e00-\u9fff]/g) || []).length;
  const readingTime = getReadingTime(post.content);
  
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
        '<span class="post-stat-item">🕒 ' + readingTime + ' 分钟</span>' +
      '</div>' +
    '</div>' +
    tocHTML +
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
  // 给文章h2/h3添加锚点（TOC跳转用）
  requestAnimationFrame(() => { setTimeout(() => addHeadingAnchors(), 30); });
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
    document.getElementById('post-detail').classList.remove('active');
    renderPosts();
  } else {
    showHome();
  }
}
window.addEventListener('hashchange', handleHash);
window.addEventListener('load', handleHash);

// 初始化
renderPosts();
document.getElementById('searchScope').textContent = '量化交易笔记';

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
// ===== 文章目录(TOC) =====
function generateTOC(content) {
  const h2Matches = [...content.matchAll(/<h2[^>]*>(.*?)<\/h2>/g)];
  const h3Matches = [...content.matchAll(/<h3[^>]*>(.*?)<\/h3>/g)];
  if (h2Matches.length + h3Matches.length < 2) return '<div class="toc-panel toc-empty"><div class="toc-title">📑 目录</div><div class="toc-empty-hint">本文较短，无目录</div></div>';
  const tocCollapsed = localStorage.getItem('toc_collapsed') === 'true';
  let toc = '<div class="toc-panel' + (tocCollapsed ? ' collapsed' : '') + '"><div class="toc-title" onclick="toggleTOC(this.parentElement)">📑 目录</div><ul class="toc-list">';
  let idx = 0;
  // 构建章节索引
  const sections = [];
  h2Matches.forEach(m => sections.push({level:2, text:m[1].replace(/<[^>]+>/g,''), idx:idx++}));
  h3Matches.forEach(m => sections.push({level:3, text:m[1].replace(/<[^>]+>/g,''), idx:idx++}));
  sections.forEach((s,i) => {
    const id = 'toc-'+i;
    toc += '<li><a href="#'+id+'" class="'+(s.level===3?'toc-h3':'')+'" onclick="scrollToToc(event,\''+id+'\')">'+s.text+'</a></li>';
  });
  toc += '</ul></div>';
  // 给content中的h2/h3添加id（已有content会在inner中使用，所以这里需要返回修改后的content的占位）
  return toc;
}
function toggleTOC(panel) {
  panel.classList.toggle('collapsed');
  localStorage.setItem('toc_collapsed', panel.classList.contains('collapsed'));
}

function scrollToToc(e, id) {
  e.preventDefault();
  const target = document.getElementById(id);
  if (!target) { // 动态查找
    const links = document.querySelectorAll('.toc-panel a');
    const idx = Array.from(links).findIndex(a => a.getAttribute('href')==='#'+id);
    if (idx >= 0) {
      const headings = document.querySelectorAll('.post-content h2, .post-content h3');
      if (headings[idx]) {
        headings[idx].scrollIntoView({behavior:'smooth',block:'start'});
        headings[idx].style.outline = '2px solid var(--neon-blue)';
        setTimeout(() => { headings[idx].style.outline = ''; }, 2000);
      }
    }
  }
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
// ===== 文章内容中的h2/h3添加锚点id（用于TOC跳转）=====
function addHeadingAnchors() {
  const headings = document.querySelectorAll('.post-content h2, .post-content h3');
  headings.forEach((h, i) => { h.id = 'toc-'+i; });
}
// ===== 模拟交易模块 =====
let simData = null;
let analyticsData = null;
let simLoading = false;

async function showSimulation() {
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

  // 显示模拟面板
  const page = document.getElementById('simulation-page');
  page.style.display = 'block';
  document.getElementById('posts-list').style.display = 'none';

  // 加载数据
  if (!simData && !simLoading) {
    await fetchSimulationData();
  } else if (simData) {
    renderSimulationDashboard();
  }
}

async function fetchSimulationData() {
  simLoading = true;
  document.getElementById('simLoading').style.display = 'block';
  document.getElementById('simError').style.display = 'none';
  document.getElementById('simDashboard').style.display = 'none';

  try {
    const [simResp, anaResp] = await Promise.all([
      fetch('/simulation.json?t=' + Date.now()),
      fetch('/analytics.json?t=' + Date.now())
    ]);
    if (!simResp.ok) throw new Error('HTTP ' + simResp.status);
    simData = await simResp.json();
    if (anaResp.ok) { try { analyticsData = await anaResp.json(); } catch(e) { analyticsData = null; } }
    else { analyticsData = null; }
    renderSimulationDashboard();
  } catch (e) {
    document.getElementById('simLoading').style.display = 'none';
    document.getElementById('simError').style.display = 'block';
    console.error('Simulation load error:', e);
  } finally {
    simLoading = false;
  }
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
    (minsAgo !== null ? '<span class="ss-item">🕐 ' + minsAgo + '分钟前更新</span>' : '');

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
    '<div class="sim-card card-win">' +
      '<div class="sc-label">胜率</div>' +
      '<div class="sc-value" style="color:#39ff14">' + (simData.win_rate || 0) + '%</div>' +
      '<div class="sc-sub">' + (simData.wins || 0) + '赢 / ' + (simData.losses || 0) + '亏</div>' +
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
}

function renderEquityChart(history) {
  const container = document.getElementById('simChartContainer');
  let canvas = container.querySelector('canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '300px';
    container.appendChild(canvas);
  }

  if (!history || history.length < 2) {
    canvas.style.display = 'none';
    container.insertAdjacentHTML('beforeend', '<div class="sim-empty">暂无权益历史数据</div>');
    return;
  }

  const dpr = window.devicePixelRatio || 1;
  const rect = container.getBoundingClientRect();
  const W = rect.width - 32;
  const H = 300;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);

  const pad = { top: 20, right: 20, bottom: 40, left: 60 };
  const pw = W - pad.left - pad.right;
  const ph = H - pad.top - pad.bottom;

  // 数据范围
  const equities = history.map(h => h.equity);
  let minVal = Math.min(...equities);
  let maxVal = Math.max(...equities);
  const range = maxVal - minVal || 1;
  minVal -= range * 0.1;
  maxVal += range * 0.1;
  if (minVal < 0) minVal *= 1.1;

  // 网格和Y轴
  ctx.fillStyle = '#0a0e17';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  const gridLines = 6;
  for (let i = 0; i <= gridLines; i++) {
    const y = pad.top + (ph / gridLines) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(W - pad.right, y);
    ctx.stroke();
    // Y标签
    const val = maxVal - (range * 1.2) / gridLines * i;
    ctx.fillStyle = '#64748b';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('$' + val.toFixed(0), pad.left - 8, y + 4);
  }

  // 初始资金参考线
  if (simData && simData.account && simData.account.initial_balance) {
    const initEquity = simData.account.initial_balance;
    const initY = pad.top + ((maxVal - initEquity) / (maxVal - minVal)) * ph;
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(pad.left, initY);
    ctx.lineTo(W - pad.right, initY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#64748b';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('初始 $' + initEquity.toFixed(0), pad.left + 4, initY - 4);
  }

  // 渐变填充
  const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + ph);
  grad.addColorStop(0, 'rgba(0,212,255,0.15)');
  grad.addColorStop(1, 'rgba(0,212,255,0)');

  // 绘制区域
  ctx.beginPath();
  const firstPt = history[0];
  let x0 = pad.left + ((0) / (history.length - 1)) * pw;
  let y0 = pad.top + ((maxVal - firstPt.equity) / (maxVal - minVal)) * ph;
  ctx.moveTo(x0, pad.top + ph);
  ctx.lineTo(x0, y0);

  // 绘制线条和数据点
  ctx.strokeStyle = '#00d4ff';
  ctx.lineWidth = 2;
  ctx.shadowColor = 'rgba(0,212,255,0.5)';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  for (let i = 0; i < history.length; i++) {
    const x = pad.left + (i / (history.length - 1)) * pw;
    const y = pad.top + ((maxVal - history[i].equity) / (maxVal - minVal)) * ph;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // 区域填充
  ctx.shadowBlur = 0;
  ctx.lineTo(pad.left + pw, pad.top + ph);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // 再次绘制线条（在填充上方）
  ctx.strokeStyle = '#00d4ff';
  ctx.lineWidth = 1.5;
  ctx.shadowColor = 'rgba(0,212,255,0.3)';
  ctx.shadowBlur = 5;
  ctx.beginPath();
  for (let i = 0; i < history.length; i++) {
    const x = pad.left + (i / (history.length - 1)) * pw;
    const y = pad.top + ((maxVal - history[i].equity) / (maxVal - minVal)) * ph;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  // 起点和终点标记
  const lastIdx = history.length - 1;
  const lx = pad.left + (lastIdx / lastIdx) * pw;
  const ly = pad.top + ((maxVal - history[lastIdx].equity) / (maxVal - minVal)) * ph;
  // 终点
  ctx.fillStyle = '#00d4ff';
  ctx.shadowColor = 'rgba(0,212,255,0.8)';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(lx, ly, 4, 0, Math.PI * 2);
  ctx.fill();
  // 终点标注
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#00d4ff';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('$' + history[lastIdx].equity.toFixed(2), lx + 8, ly + 4);

  // X轴标签（简化）
  ctx.fillStyle = '#64748b';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  const xStep = Math.max(1, Math.floor(history.length / 5));
  for (let i = 0; i < history.length; i += xStep) {
    const x = pad.left + (i / (history.length - 1)) * pw;
    const label = history[i].t || '';
    const short = label.length > 16 ? label.slice(-8) : label.slice(11, 16);
    ctx.fillText(short, x, H - pad.bottom + 16);
  }
}

function renderPositionsTable(positions) {
  const container = document.getElementById('simPositions');
  if (!positions || positions.length === 0) {
    container.innerHTML = '<div class="sim-empty">暂无持仓</div>';
    return;
  }
  let html = '<table class="sim-table"><thead><tr>' +
    '<th>交易对</th><th>方向</th><th>入场价</th><th>当前价</th><th>数量</th><th>保证金</th><th>杠杆</th><th>浮盈(USD)</th><th>浮盈(%)</th><th>开仓时间</th>' +
    '</tr></thead><tbody>';
  positions.forEach(p => {
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
  container.innerHTML = html;
}

// ===== v3.9.51 分析卡片（夏普/回撤/盈亏比/期望值） =====
function renderAnalyticsCards() {
  const container = document.getElementById('simAnalyticsCards');
  if (!container) return;
  if (!analyticsData || !analyticsData.trade_metrics) {
    // 无 analytics 数据时尝试从 simulation 数据计算
    if (simData && simData.closed_trades && simData.closed_trades.length > 0) {
      const trades = simData.closed_trades;
      const wins = trades.filter(t => t.pnl > 0);
      const losses = trades.filter(t => t.pnl <= 0);
      const totalPnL = trades.reduce((s, t) => s + t.pnl, 0);
      const winSum = wins.reduce((s, t) => s + t.pnl, 0);
      const lossSum = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
      const pf = lossSum > 0 ? (winSum / lossSum).toFixed(2) : '--';
      const expVal = trades.length > 0 ? (totalPnL / trades.length).toFixed(2) : '--';
      const maxDD = simData.account && simData.account.max_drawdown_pct 
        ? simData.account.max_drawdown_pct.toFixed(1) + '%' : '--';
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
  const sharpe = p.sharpe_ratio || '--';
  const maxDD = p.max_drawdown ? (p.max_drawdown.max_dd_pct || p.max_drawdown) : '--';
  const maxDDStr = typeof maxDD === 'object' ? (maxDD.max_dd_pct || '--') + '%' : (maxDD !== '--' ? maxDD + '%' : '--');
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
  let html = '<table class="sim-table"><thead><tr>' +
    '<th>交易对</th><th>方向</th><th>入场价</th><th>出场价</th><th>保证金</th><th>盈亏(USD)</th><th>盈亏(%)</th><th>平仓时间</th>' +
    '</tr></thead><tbody>';
  trades.forEach(t => {
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
  html += '</tbody></table>';
  container.innerHTML = html;
}

// ===== v3.9.51 手动刷新模拟数据 =====
async function refreshSimulation() {
  const btn = document.querySelector('.sim-refresh-btn');
  if (btn) { btn.textContent = '⏳ 刷新中...'; btn.disabled = true; }
  simData = null;
  analyticsData = null;
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
window.addEventListener('scroll', function() {
  handleReadingProgress();
  // 高亮当前TOC项
  const tocLinks = document.querySelectorAll('.toc-panel a');
  if (tocLinks.length === 0) return;
  const headings = document.querySelectorAll('.post-content h2, .post-content h3');
  if (headings.length === 0) return;
  let current = -1;
  headings.forEach((h, i) => {
    if (h.getBoundingClientRect().top <= 120) current = i;
  });
  tocLinks.forEach((a,i) => { a.classList.toggle('active', i === current); });
}, {passive:true});
