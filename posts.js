const POSTS = [
      {
    id: "strategy-update-20260617-v39",
    module: "strategy",
    title: "策略更新 v3.9.50 — 方案C: ATR追踪止损 + EMA死叉止盈",
    date: "2026-06-17",
    tags: ["策略更新", "v3.9", "ATR"],
    summary: "v3.9.50 重构出场逻辑：用极简的 TP1/SL1（±1%）替代 ATR 追踪止盈体系，降低频繁止损导致的净值磨损。",
    content: '<h2>为什么出新版本</h2>'+
      '<p>v3.9.48 的 ATR 追踪止损在窄幅震荡市中频繁触发止损：引擎自动交易 32 笔，胜率仅 44%，盈亏比 0.75（亏多赢少），合计净亏 -4.06U。</p>'+
      '<p>根本问题：ATR×1.5 的追踪距离在低波动币上太近，价格小幅震荡就被扫损；在高波动币上又太远，止损触发时亏损已经很大。一个固定倍数不可能适配所有币。</p>'+
      '<h2>方案C：极简化出场</h2>'+
      '<p>放弃 ATR 追踪止盈，改为最简单的固定 TP/SL：</p>'+
      '<table><tr><th>参数</th><th>旧值(v3.9.48)</th><th>新值(v3.9.50)</th></tr>'+
        '<tr><td>止盈</td><td>ATR 追踪 + 分层止盈(50%@2xATR)</td><td><code>TP1 = +1%</code></td></tr>'+
        '<tr><td>止损</td><td>ATR 追踪(1.5x) + 硬止损5.5%</td><td><code>SL1 = -1%</code></td></tr>'+
        '<tr><td>保本</td><td>浮盈1.5%→拉到entry+ATR×0.3</td><td>移除（TP1已够简单）</td></tr>'+
        '<tr><td>超时</td><td>1小时</td><td>保留不变</td></tr>'+
      '</table>'+
      '<h2>设计理念</h2>'+
      '<p>±1% 的固定出场让每笔交易的 RR 比固定为 1:1。不再依赖 ATR 波动率估算——越小越简单，越不容易出现意外行为。</p>'+
      '<p>配合 8U/仓 + 最大 5 仓，单笔风险控制在 0.08U，最大同时风险 0.4U。即使连续亏损也不致命。</p>'+
      '<h2>文件变更</h2>'+
      '<ul><li><code>config.py</code> — 新增 TP1_PCT=1.0 / SL1_PCT=1.0，删除 ATR 追踪相关参数</li>'+
        '<li><code>position/manager.py</code> — 移除 ATR 追踪逻辑，简化为固定 TP/SL 检查</li></ul>'+
      '<h2>模拟盘验证中</h2>'+
      '<p>v3.9.50 当前在模拟盘运行（500U 初始资金），等待足够交易数据后再评估是否切实盘。</p>'+
      '<blockquote>核心原则：复杂不等于好。ATR 追踪在理论上很优雅，但在 1U 级别的小仓位下，手续费和噪音让它变成了亏损放大器。简单粗暴的 ±1% 可能更实用。</blockquote>'
  },
  {
    id: "strategy-update-20260605-v39",
    module: "strategy",
    title: "策略更新 v3.9.48 — 手动仓位隔离 + 开仓即追踪 + 保本缓冲",
    date: "2026-06-05",
    tags: ["策略更新", "v3.9", "止损"],
    summary: "v3.9.48 三个关键修复：手动仓位不再被引擎接管止损、ATR 追踪止损开仓即启用、保本触发加 0.2% 缓冲。",
    content: '<h2>修复1：手动仓位隔离</h2>'+
      '<p>之前的版本：手动开仓后，引擎的 position manager 会接管并覆盖手动设置的止损价。用户在 Binance APP 上设的止损被引擎改掉，导致意外亏损。</p>'+
      '<p>修复：引擎只管理自己的仓位，手动仓位只记录浮盈不接管止损。手动操作者自己负责风控。</p>'+
      '<pre><code class="language-text"># position/manager.py 添加判断\nif position.managed_by != "engine":\n    continue  # 跳过手动仓位</code></pre>'+
      '<h2>修复2：开仓即启用 ATR 追踪</h2>'+
      '<p>之前的版本：持仓盈利后才启用 ATR 追踪止损。导致开仓后立即反转被套牢——因为没有止损保护。</p>'+
      '<p>修复：开仓时立即计算 ATR 并设置追踪止损价。<code>trail_stop = entry - (atr_pct × 1.5)</code>。即使立即反转也能控制亏损。</p>'+
      '<h2>修复3：保本触发加缓冲</h2>'+
      '<p>之前的版本：浮盈 ≥ 1.5% 时将止损拉到入场价，价格回撤到入场价即平仓。问题：经常被小波动震出后价格继续上涨。</p>'+
      '<p>修复：保本触发后止损价 = entry + ATR×0.3（微利状态），给波动留 0.3×ATR 的呼吸空间。</p>'+
      '<h2>其他参数</h2>'+
      '<ul>'+
        '<li>EMA 缓冲 0.2%：入场信号要求 EMA7 在 EMA25 上方 + 0.2% 缓冲，避免假金叉</li>'+
        '<li>冷却 30min：连续亏损 6 次后冷却 30 分钟，防止情绪化追单</li>'+
        '<li>超时 1h：持仓超过 1 小时且浮盈不达标，强制平仓释放仓位</li>'+
      '</ul>'+
      '<h2>效果</h2>'+
      '<p>v3.9.48 实盘运行 3 天（6/5-6/8），引擎自动交易 32 笔，胜率 44%，盈亏比 0.75。ATR 追踪在窄幅震荡中频繁止损，最终 v3.9.50 放弃了这套体系。</p>'+
      '<blockquote>教训：手动仓位隔离是最有价值的修复。开仓即追踪止损保护了资金但也在震荡市放大了亏损。好的风控不是止损设得越紧越好。</blockquote>'
  },
  {
    id: "strategy-update-20260531-v39",
    module: "strategy",
    title: "策略更新 v3.9.31 — 持仓管理模块独立化",
    date: "2026-05-31",
    tags: ["策略更新", "v3.9", "架构"],
    summary: "v3.9.31 将持仓管理从 engine.py 中拆出为独立的 position/manager.py 模块，支持多仓并行管理、单仓独立止损、动态杠杆分档。",
    content: '<h2>为什么拆分</h2>'+
      '<p>v3.9 之前的版本，持仓管理逻辑嵌在 <code>core/engine.py</code> 主循环里——止损检查、平仓、保本触发全部混在一起。新增一个持仓类型就要动 engine，维护成本爆炸。</p>'+
      '<h2>拆分架构</h2>'+
      '<pre><code class="language-text">拆分前：\ncore/engine.py (2000+ 行)\n  ├── 主循环\n  ├── 选币逻辑\n  ├── 持仓管理（混在一起）\n  └── 订单管理\n\n拆分后：\ncore/engine.py (主循环 + 选币)\nposition/manager.py (持仓管理独立模块)\n  ├── update_trailing_stops()  # ATR追踪\n  ├── check_timeout()         # 超时平仓\n  ├── check_hard_stop()       # 硬止损\n  └── sync_positions()        # 交易所同步</code></pre>'+
      '<h2>关键设计决策</h2>'+
      '<h3>单仓版本</h3>'+
      '<p>最初设计是每个仓位独立管理，不做组合层面的风险控制。后来发现这样无法限制总杠杆和总风险暴露，v3.9.48 之后加入了 account-level 风控（每日最大亏损 15%、连续亏损 6 次冷却）。</p>'+
      '<h3>动态杠杆分档</h3>'+
      '<p>不是所有币用同一杠杆。根据选币排名分档：</p>'+
      '<table><tr><th>排名</th><th>杠杆</th><th>逻辑</th></tr>'+
        '<tr><td>≤10</td><td>20x</td><td>信号最强，给足杠杆</td></tr>'+
        '<tr><td>≤50</td><td>15x</td><td>中等信号，适度杠杆</td></tr>'+
        '<tr><td>>50</td><td>10x</td><td>信号偏弱，控制风险</td></tr>'+
      '</table>'+
      '<h2>文件变更</h2>'+
      '<ul>'+
        '<li><code>position/manager.py</code> — 新建，持仓管理核心模块</li>'+
        '<li><code>core/engine.py</code> — 删除持仓管理逻辑，改为调用 position/manager</li>'+
        '<li><code>core/config.py</code> — 新增杠杆分档参数</li>'+
      '</ul>'+
      '<blockquote>这次拆分是 v3.9 系列最重要的架构改进。虽然代码行数没减少，但修 bug 时不再需要在 2000 行文件里大海捞针。</blockquote>'
  },
// ===== 量化交易笔记（真实内容）=====
  {
    id:"momentum-strategy-architecture",
    title:"MomentumStrategy 系统架构详解",
    date:"2026-06-08",
    tags:["策略","架构","Momentum"],
    summary:"详解 /opt/bian/ 量化系统的完整架构：engine引擎、position管理、selector选币、ATR追踪止损机制。",
    module:"quant",
    content:'<h2>系统架构</h2>'+
      '<p>系统运行在HK服务器（8.210.178.248）/opt/bian/，Python 3.12，24小时运行。</p>'+
      '<pre><code class="language-text">核心模块：\n├── core/\n│   ├── engine.py      # 主引擎（3秒循环）\n│   ├── manager.py    # 账户管理\n│   └── config.py     # 全局配置\n├── position/\n│   └── manager.py  # 持仓管理（ATR追踪止损）\n├── selectors/\n│   └── volume_selector.py  # 成交量选币\n├── real_pnl_final.py     # 真实PnL计算（Binance API）\n├── today_summary.py      # 每日盈亏汇总\n└── engine.log            # 引擎日志</code></pre>'+
      '<h2>主循环逻辑</h2>'+
      '<p>引擎每 <code>LOOP_INTERVAL = 3</code> 秒执行一次，顺序：</p>'+
      '<ol>'+
        '<li>刷新账户余额（available_balance）</li>'+
        '<li>同步交易所实际持仓（防止手动操作导致状态不一致）</li>'+
        '<li>执行选币（每60秒执行一次，SELECTOR_INTERVAL = 60）</li>'+
        '<li>检查所有持仓的止损条件（ATR追踪 + 硬止损5.5% + 超时1小时）</li>'+
        '<li>如果有空闲仓位且有候选币，执行开仓</li>'+
      '</ol>'+
      '<h2>风控参数（真实配置）</h2>'+
      '<pre># 每日最大亏损 15%\nmax_daily_loss_pct: 15\n# 连续亏损6次冷却30分钟\nmax_consecutive_loss: 6\n# 最大总杠杆30x\nmax_total_leverage: 30\n# 最大持仓数5个\nmax_positions: 5\n# 单币当日最大亏损次数4次（锁到次日）</pre>'+
      '<h2>杠杆分档</h2>'+
      '<p>根据选币排名动态调整杠杆：</p>'+
      '<table><tr><th>排名</th><th>杠杆</th></tr>'+
        '<tr><td>≤10</td><td>20x</td></tr>'+
        '<tr><td>≤50</td><td>15x</td></tr>'+
        '<tr><td>>50</td><td>10x</td></tr>'+
      '</table>'+
      '<h2>当前问题</h2>'+
      '<p>账户余额不足（~0.82U），导致所有信号都被跳过：</p>'+
      '<pre>[Engine] 仓位动态缩减: 8.0U→1.0U (权益1U×20%)\n[Engine] 余额不足: 需1.0U, 可用0.82U, 跳过</pre>'+
      '<p>需要充值或降低 base_size_usdt 才能恢复交易。</p>'
  },
  {
    id:"atr-trailing-stop-implementation",
    title:"ATR追踪止损实盘实现",
    date:"2026-06-07",
    tags:["ATR","止损","实盘"],
    summary:"position/manager.py 中ATR追踪止损的完整实现逻辑：动态计算、保本触发、分层止盈、超时平仓。",
    module:"quant",
    content:'<h2>ATR追踪止损原理</h2>'+
      '<p>ATR（Average True Range）衡量波动率。追踪止损距离 = ATR × 倍数（默认1.5x）。</p>'+
      '<p>当价格向有利方向移动时，止损价跟随移动；价格反转触及止损价时平仓。</p>'+
      '<h2>开仓即启用追踪</h2>'+
      '<p>之前的版本是"盈利后才启用追踪"，导致开仓后立即反转被套牢。v3.9.48 改为<strong>开仓即启用ATR追踪止损</strong>。</p>'+
      '<pre><code class="language-text"># 开仓时立即计算ATR并设置追踪止损\ntrail_stop_price = entry_price - (atr_pct * trail_atr_mult)</code></pre>'+
      '<h2>保本机制（Breakeven）</h2>'+
      '<p>当浮盈 ≥ <code>breakeven_trigger_pct = 1.5%</code> 时，将止损价拉到入场价 + ATR×0.3（微利状态）。</p>'+
      '<p>防止盈利单倒亏，同时给波动留一点呼吸空间。</p>'+
      '<h2>分层止盈（Partial TP）</h2>'+
      '<p>当浮盈 ≥ <code>partial_tp_atr_mult = 2.0×ATR</code> 时，平50%仓位锁利，同时放宽追踪倍数到 2.5x（让利润奔跑）。</p>'+
      '<pre><code class="language-text"># 部分平仓示例\nif unrealized_pnl_pct >= partial_tp_atr_mult * atr_pct:\n    close_partial(0.5, "分层止盈")  # 平50%\n    trail_atr_mult = wide_trail_atr_mult  # 2.5x</code></pre>'+
      '<h2>硬止损兜底</h2>'+
      '<p>如果ATR计算失败或者波动太窄导致止损过近，触发 <code>max_loss_pct = 5.5%</code> 硬止损。</p>'+
      '<p>这是黑天鹅防护，防止极端行情下 ATR 追踪失效。</p>'+
      '<h2>超时平仓</h2>'+
      '<p>持仓超过 <code>timeout_hours = 1</code> 小时，且浮盈 &lt; 1.5% 或 &lt; 0.5×ATR 时，强制平仓释放仓位。</p>'+
      '<p>避免资金被低质量信号占用。</p>'
  },
  {
    id:"binance-api-pitfalls",
    title:"币安合约API实战踩坑记录",
    date:"2026-06-05",
    tags:["币安","API","踩坑"],
    summary:"对接币安合约API的真实踩坑：时间戳同步、精度处理、错误码解读、频次限制。",
    module:"quant",
    content:'<h2>问题1：时间戳不同步</h2>'+
      '<p>币安API要求 <code>timestamp</code> 与服务器时间差 ≤ 1000ms。HK服务器时间不准会导致 <code>-1021 INVALID_TIMESTAMP</code>。</p>'+
      '<pre><code class="language-text"># 解决：用服务器时间戳而非本地时间\nimport time\nts = int(time.time() * 1000)  # 秒→毫秒</code></pre>'+
      '<h2>问题2：数量精度</h2>'+
      '<p>每个交易对的 <code>LOT_SIZE</code> 精度不同。直接传 0.001 可能报 <code>-1111 PRECISION_EXCEEDED</code>。</p>'+
      '<pre><code class="language-text"># 获取交易所规则\nexchange_info = client.fapiPublicGetExchangeinfo()\n# 找到对应symbol的LOT_SIZE filter\n# stepSize 是最小精度，如 0.001 表示最多3位小数</code></pre>'+
      '<h2>问题3：错误码 -2019</h2>'+
      '<p><code>-2019 MARGIN_INSUFFICIENT</code>：保证金不足。但有时候可用余额足够却仍然报错，原因是：</p>'+
      '<ul>'+
        '<li>已有持仓占用了保证金</li>'+
        '<li>新开仓的 notional value（数量×价格）超过可用余额</li>'+
        '<li>动态减仓后（权益×20%），实际下单量太小导致某些小币无法交易</li>'+
      '</ul>'+
      '<h2>问题4：频次限制</h2>'+
      '<p>币安有权重（weight）限制，公开API 通常 weight=1，账户相关API weight=5~20。</p>'+
      '<p>解决：<code>enableRateLimit: true</code>（ccxt自带），或者自己实现指数退避重试。</p>'+
      '<h2>真实账户状态查看</h2>'+
      '<pre><code class="language-text">GET /fapi/v2/account\n# 返回：\n#   totalWalletBalance: 钱包总余额\n#   totalUnrealizedProfit: 未实现盈亏\n#   positions: 所有持仓（包括数量为0的）</code></pre>'
  },
  {
    id:"selector-volume-filter",
    title:"选币模块：成交量过滤的必要性",
    date:"2026-06-03",
    tags:["选币","成交量","过滤"],
    summary:"为什么必须过滤低成交量币？真实爆雷案例：7天跌幅>70%的归零币如何过滤。",
    module:"quant",
    content:'<h2>为什么要过滤低成交量币</h2>'+
      '<p>低成交量币（24h成交额 &lt; 2000万U）流动性差，容易被操控，滑点大，且归零风险高。</p>'+
      '<p>配置：<code>volume_min_usdt: 20_000_000</code>（v3.9.40 从5M提升到20M）</p>'+
      '<h2>归零币过滤</h2>'+
      '<p>配置 <code>max_weekly_drop_pct: 70</code>：如果某个币7天跌幅超过70%，跳过不选。</p>'+
      '<p>这是为了过滤已经归零或即将归零的币。真实案例：</p>'+
      '<table><tr><th>币</th><th>7天跌幅</th><th>结果</th></tr>'+
        '<tr><td>CLOUSDT</td><td>-82%</td><td>归零（项目方跑路）</td></tr>'+
        '<tr><td>SIGNUSDT</td><td>-75%</td><td>接近归零</td></tr>'+
      '</table>'+
      '<h2>ATR过滤</h2>'+
      '<p><code>atr_15m_min_pct: 0.7</code>：15分钟K线的ATR百分比小于0.7%的币，波动太小，不值得交易。</p>'+
      '<h2>振幅过滤</h2>'+
      '<p><code>amplitude_min_pct: 4.0</code>：最近24h振幅小于4%的币跳过，趋势不明朗。</p>'+
      '<h2>候选池大小</h2>'+
      '<p>选币结果保存在一个候选池（通常44~47个币）。引擎每次循环都检查候选池是否有更新（每60秒更新一次）。</p>'+
      '<p>从候选池中选出信号最强的币开仓。如果候选池为空（所有币都被过滤了），则不交易。</p>'
  },

  // ===== 量化交易笔记（含基础设施/部署类）=====
  {
    id:"xzw33-top-build-log",
    title:"xzw33.top 从0到上线全记录",
    date:"2026-06-17",
    tags:["博客","上线","Nginx"],
    summary:"个人博客 xzw33.top 从开发到部署上线的完整过程：纯HTML单文件、赛博朋克风格、Nginx配置、SSL证书、安全加固。",
    module:"quant",
    content:'<h2>需求</h2>'+
      '<p>需要一个个人博客，记录量化交易实盘和技术方案。要求：</p>'+
      '<ul>'+
        '<li>纯HTML单文件（CSS/JS全内联），部署简单</li>'+
        '<li>赛博朋克暗色风格</li>'+
        '<li>两个模块：量化交易笔记、策略更新日志</li>'+
        '<li>部署到 xzw33.top（已有域名，DNS在阿里云）</li>'+
      '</ul>'+
      '<h2>开发</h2>'+
      '<p>纯手写HTML，不依赖任何框架。文章内容用JS数组存储，前端直接渲染。</p>'+
      '<p>优点：部署极简（传一个文件），CDN挂了也能正常显示。</p>'+
      '<p>缺点：内容对SEO不友好（内容在JS里），100篇以上会卡。</p>'+
      '<h2>部署</h2>'+
      '<p>服务器：成都阿里云 8.137.13.137，Nginx，网站根目录 /var/www/xzw33.top/</p>'+
      '<pre><code class="language-text"># 部署命令（通过paramiko SSH上传）\nsftp.put(\'blog.html\', \'/var/www/xzw33.top/index.html\')\nnginx -t  # 测试配置\nsystemctl reload nginx</code></pre>'+
      '<h2>SSL证书</h2>'+
      '<p>Let\'s Encrypt 免费证书，到期2026-08-31，自动续期。</p>'+
      '<h2>安全加固</h2>'+
      '<p>完成了完整的安全加固（详见另一篇文章），综合评级 A-：</p>'+
      '<ul>'+
        '<li>CSP响应头（需允许 \'unsafe-inline\'，因为JS内联）</li>'+
        '<li>隐藏 Nginx 版本号</li>'+
        '<li>创建 security.txt（/.well-known/security.txt）</li>'+
        '<li>隐藏文件保护（.env、.git 等无法访问）</li>'+
        '<li>频率限制 10r/s + 20突发</li>'+
      '</ul>'+
      '<h2>访问地址</h2>'+
      '<p><a href="https://xzw33.top/" style="color:var(--neon-blue);">https://xzw33.top/</a></p>'
  },
  {
    id:"server-security-hardening",
    title:"服务器安全加固实录（Nginx + Linux）",
    date:"2026-06-17",
    tags:["安全","Nginx","Linux"],
    summary:"对 xzw33.top 服务器进行完整安全加固：CSP头、隐藏版本号、security.txt、频率限制、隐藏文件保护。",
    module:"quant",
    content:'<h2>初始状态</h2>'+
      '<p>扫描发现的问题：</p>'+
      '<ul>'+
        '<li>🟡 中危：缺少 CSP 响应头</li>'+
        '<li>🟡 低危：Server 头暴露 Nginx 版本号</li>'+
        '<li>🔵 信息：security.txt 不存在</li>'+
        '<li>🔵 信息：隐藏文件（.env等）可以访问</li>'+
      '</ul>'+
      '<h2>修复1：添加CSP响应头</h2>'+
      '<p>在 <code>/etc/nginx/conf.d/security.conf</code> 中添加：</p>'+
      '<pre>add_header Content-Security-Policy "default-src \'self\'; script-src \'self\' \'unsafe-inline\' https://cdn.jsdelivr.net; style-src \'self\' \'unsafe-inline\' https://cdn.jsdelivr.net; font-src \'self\' https://cdn.jsdelivr.net; img-src \'self\' data: https:; connect-src \'self\';" always;</pre>'+
      '<p class="pnl-negative">⚠️ 注意：纯HTML单文件依赖内联 script，script-src 必须加 \'unsafe-inline\'，否则JS不执行，页面空白！</p>'+
      '<h2>修复2：隐藏Nginx版本号</h2>'+
      '<p>在 <code>/etc/nginx/nginx.conf</code> 的 http 块中添加：</p>'+
      '<pre>server_tokens off;</pre>'+
      '<p>修复前：<code>Server: nginx/1.20.2</code><br>修复后：<code>Server: nginx</code>（无版本号）</p>'+
      '<h2>修复3：创建security.txt</h2>'+
      '<p>在 <code>/.well-known/security.txt</code> 中提供安全联系方式：</p>'+
      '<pre>Contact: https://xzw33.top/ (About页面联系)\nExpires: 2027-06-17T00:00:00.000Z\nPreferred-Languages: zh, en\nCanonical: https://xzw33.top/.well-known/security.txt</pre>'+
      '<h2>修复4：隐藏文件保护</h2>'+
      '<p>在 <code>xzw33.top.conf</code> 中添加：</p>'+
      '<pre>location ~ /\\. { deny all; }</pre>'+
      '<p>注意：这条规则会阻止 /.well-known/ 的访问，所以必须在这条规则之前添加：</p>'+
      '<pre>location = /.well-known/security.txt { }  # 放行security.txt</pre>'+
      '<h2>修复5：频率限制</h2>'+
      '<p>在 <code>nginx.conf</code> 的 http 块中添加（注意：不能在 server 块中）：</p>'+
      '<pre>limit_req_zone $binary_remote_addr zone=xzw33:10m rate=10r/s;</pre>'+
      '<p>在 <code>xzw33.top.conf</code> 的 server 块中添加：</p>'+
      '<pre>limit_req zone=xzw33 burst=20 nodelay;</pre>'+
      '<h2>最终评级</h2>'+
      '<p>综合安全评级：<span class="pnl-positive">A-</span>（原有 B+，修复后提升）</p>'
  },
  {
    id:"hk-quant-server-setup",
    title:"HK量化服务器搭建记录",
    date:"2026-06-02",
    tags:["服务器","HK","量化"],
    summary:"在香港阿里云服务器上搭建Python量化交易系统的完整过程：环境配置、目录结构、systemd守护进程。",
    module:"quant",
    content:'<h2>服务器信息</h2>'+
      '<table><tr><th>项目</th><th>内容</th></tr>'+
        '<tr><td>IP</td><td>8.210.178.248</td></tr>'+
        '<tr><td>位置</td><td>香港阿里云</td></tr>'+
        '<tr><td>系统</td><td>Ubuntu 22.04</td></tr>'+
        '<tr><td>Python</td><td>3.12</td></tr>'+
        '<tr><td>SSH密钥</td><td>id_ed25519_hk_local</td></tr>'+
      '</table>'+
      '<h2>目录结构</h2>'+
      '<pre>/opt/bian/\n├── core/\n│   ├── __init__.py\n│   ├── engine.py      # 主引擎\n│   ├── manager.py    # 账户管理\n│   └── config.py     # 全局配置\n├── position/\n│   ├── __init__.py\n│   └── manager.py   # 持仓管理（ATR追踪止损）\n├── selectors/\n│   ├── __init__.py\n│   ├── base.py\n│   └── volume_selector.py  # 成交量选币\n├── real_pnl_final.py     # 真实PnL计算\n├── today_summary.py      # 每日盈亏汇总\n├── today_pnl_simple.py  # 简化版PnL\n├── analyze_recent.py     # 分析最近交易\n├── fix_trailing.py      # 修复追踪止损\n├── show_pool.py        # 显示候选池\n└── engine.log            # 引擎日志</pre>'+
      '<h2>systemd守护进程</h2>'+
      '<p>创建 <code>/etc/systemd/system/bian.service</code>：</p>'+
      '<pre>[Unit]\nDescription=Bian Quant Trading Engine\nAfter=network.target\n\n[Service]\nType=simple\nUser=root\nWorkingDirectory=/opt/bian\nExecStart=/usr/bin/python3 /opt/bian/core/engine.py\nRestart=always\nRestartSec=10\n\n[Install]\nWantedBy=multi-user.target</pre>'+
      '<p>管理命令：</p>'+
      '<pre>systemctl status bian    # 查看状态\nsystemctl restart bian  # 重启\ntail -f /opt/bian/engine.log  # 查看日志</pre>'+
      '<h2>防火墙</h2>'+
      '<p>仅允许固定IP访问SSH（22端口），不开放0.0.0.0/0。</p>'+
      '<pre>ufw allow from 14.111.240.14 to any port 22\nufw enable</pre>'
  },
  {
    id:"stock-screener-dev-log",
    title:"A股量化筛选工具开发记录",
    date:"2026-06-05",
    tags:["A股","量化","akshare"],
    summary:"基于akshare库的A股自动化筛选工具开发记录：量比、换手率、市值过滤条件，每日盘前自动运行。",
    module:"quant",
    content:'<h2>开发背景</h2>'+
      '<p>手动筛选A股效率低，需要一套自动化的量化筛选工具，根据技术指标和基本面快速找到符合条件的股票。</p>'+
      '<h2>技术选型</h2>'+
      '<table><tr><th>组件</th><th>选型</th><th>理由</th></tr>'+
        '<tr><td>数据源</td><td>akshare</td><td>免费、数据全、更新及时</td></tr>'+
        '<tr><td>后端</td><td>Python</td><td>akshare只支持Python</td></tr>'+
        '<tr><td>前端</td><td>纯HTML单文件</td><td>部署简单，无需编译</td></tr>'+
      '</table>'+
      '<h2>筛选条件（真实配置）</h2>'+
      '<pre># 量比 ≥ 1.2\nvolume_ratio_min: 1.2\n\n# 换手率 1.5% - 20%\nturnover_min: 1.5\n# 换手率上限\nmax_turnover: 20.0\n\n# 市值 30亿 - 200亿\nmarket_cap_min: 30\nmarket_cap_max: 200</pre>'+
      '<h2>使用记录</h2>'+
      '<p>每日盘前（9:15）运行筛选，输出符合条件的股票列表。</p>'+
      '<p>2026年5月实测：符合条件股票约20-50只，人工二次筛选后买入2-3只。</p>'+
      '<h2>下一步优化</h2>'+
      '<ul>'+
        '<li>加入技术指标过滤（MACD金叉、KDJ超卖等）</li>'+
        '<li>回测功能：验证筛选条件历史胜率</li>'+
        '<li>自动监控：盘中实时预警符合条件的股票</li>'+
      '</ul>'
  },
  // ===== 旅游平台方案 =====
  // ===== 策略更新日志（真实PnL数据）=====
  {
    id:"strategy-update-2026-06-08",
    title:"实盘记录 - 2026-06-08（亏损日）",
    date:"2026-06-08",
    tags:["实盘","PnL","亏损"],
    summary:"2026-06-08实盘记录：引擎自动交易32笔，盈亏-4.06U。主要亏损来源：STGUSDT硬止损-7.13U、PORTALUSDT硬止损-7.54U。",
    module:"strategy",
    content:'<h2>账户状态（2026-06-08开盘前）</h2>'+
      '<div class="about-stats">'+
        '<div class="stat-card"><div class="stat-value">~1.0U</div><div class="stat-label">钱包余额</div></div>'+
        '<div class="stat-card"><div class="stat-value">0.82U</div><div class="stat-label">可用余额</div></div>'+
        '<div class="stat-card"><div class="stat-value">5</div><div class="stat-label">最大持仓数</div></div>'+
      '</div>'+
      '<h2>引擎自动交易记录</h2>'+
      '<p>以下为 <code>today_summary.py</code> 输出的真实平仓记录（ATR追踪止损/硬止损/超时）：</p>'+
      '<table>'+
        '<tr><th>时间</th><th>币</th><th>方向</th><th>PnL (U)</th><th>出场原因</th></tr>'+
        '<tr><td>01:08</td><td>CLOUSDT</td><td>BUY</td><td class="pnl-positive">+0.37</td><td>ATR追踪止损</td></tr>'+
        '<tr><td>01:36</td><td>SIGNUSDT</td><td>SELL</td><td class="pnl-negative">-1.18</td><td>ATR追踪止损</td></tr>'+
        '<tr><td>02:03</td><td>USUSDT</td><td>SELL</td><td class="pnl-positive">+0.63</td><td>ATR追踪止损</td></tr>'+
        '<tr><td>03:00</td><td>XLMUSDT</td><td>SELL</td><td class="pnl-negative">-3.13</td><td>ATR追踪止损</td></tr>'+
        '<tr><td>03:40</td><td>IDUSDT</td><td>SELL</td><td class="pnl-negative">-2.21</td><td>ATR追踪止损</td></tr>'+
        '<tr><td>05:16</td><td>STGUSDT</td><td>BUY</td><td class="pnl-positive">+4.08</td><td>ATR追踪止损</td></tr>'+
        '<tr><td>07:15</td><td>HEIUSDT</td><td>SELL</td><td class="pnl-negative">-4.43</td><td>ATR追踪止损</td></tr>'+
        '<tr><td>07:52</td><td>STGUSDT</td><td>BUY</td><td class="pnl-negative">-7.13</td><td>硬止损5.5%</td></tr>'+
        '<tr><td>10:23</td><td>PORTALUSDT</td><td>SELL</td><td class="pnl-negative">-7.54</td><td>硬止损5.5%</td></tr>'+
        '<tr><td>11:35</td><td>PORTALUSDT</td><td>SELL</td><td class="pnl-positive">+14.46</td><td>ATR追踪止损</td></tr>'+
      '</table>'+
      '<h2>当日汇总</h2>'+
      '<table>'+
        '<tr><th>项目</th><th>数值</th></tr>'+
        '<tr><td>自动交易笔数</td><td>32笔</td></tr>'+
        '<tr><td>盈利笔数</td><td>14笔</td></tr>'+
        '<tr><td>亏损笔数</td><td>18笔</td></tr>'+
        '<tr><td>单笔最大盈利</td><td class="pnl-positive">+14.46U（PORTALUSDT）</td></tr>'+
        '<tr><td>单笔最大亏损</td><td class="pnl-negative">-7.54U（PORTALUSDT硬止损）</td></tr>'+
        '<tr><td>当日净盈亏</td><td class="pnl-negative">-4.06U</td></tr>'+
        '<tr><td>手动交易盈亏</td><td class="pnl-negative">-10.76U（STGUSDT + LABUSDT）</td></tr>'+
        '<tr><td>总盈亏</td><td class="pnl-negative">约-14.82U</td></tr>'+
      '</table>'+
      '<h2>复盘</h2>'+
      '<p>这一天暴露了系统的核心问题：</p>'+
      '<ol>'+
        '<li><strong>硬止损触发太频繁</strong>：5.5%的硬止损在波动大的币上容易被扫，然后价格又回来了。考虑放宽到7%或动态调整。</li>'+
        '<li><strong>余额不足导致仓位太小</strong>：只有0.82U可用，每次下单量约1U，手续费占比过高，盈利很难覆盖手续费。</li>'+
        '<li><strong>手动交易干扰</strong>：手动开仓后引擎会接管止损，但手动开仓的止损价可能不合理。v3.9.48之后手动仓位不再被引擎接管。</li>'+
      '</ol>'+
      '<blockquote>教训：小资金做合约，手续费和滑点会吃掉所有利润。需要先充值到至少100U以上，才能有效分散仓位。</blockquote>'+
      '<h2>盈亏曲线（2026-06-08）</h2>'+
      '<div class="pnl-chart-wrapper"><div class="pnl-chart-header"><div class="pnl-chart-title"><span class="dot" style="background:#00ff88;box-shadow:0 0 6px #00ff88;"></span>累计盈亏曲线</div><div class="pnl-chart-legend">数据来源：币安合约API · 实盘记录</div></div><canvas id="pnlChart1" class="pnl-chart-canvas"></canvas><div class="pnl-chart-tooltip" id="pnlChart1-tt"></div></div>'
  },
  {
    id:"strategy-update-2026-06-17",
    title:"策略说明 v3.9.48（当前运行版本）",
    date:"2026-06-17",
    tags:["策略","版本","说明"],
    summary:"当前运行的策略版本 v3.9.48 说明：手动仓位不接管、ATR追踪止损开仓即启用、保本缓冲0.2%、超时平仓1小时。",
    module:"strategy",
    content:'<h2>版本 v3.9.48 更新内容</h2>'+
      '<p>更新时间：2026-06-05</p>'+
      '<h3>✅ 修改1：手动仓位不再被引擎接管止损</h3>'+
      '<p>之前的版本：手动开仓后，引擎的 position manager 会接管并设置止损，导致手动设置的止损价被覆盖。</p>'+
      '<p>修复：引擎只管理自己开的仓位，手动仓位只记录浮盈，不设置止损（由手动操作者自己负责）。</p>'+
      '<h3>✅ 修改2：ATR追踪止损开仓即启用</h3>'+
      '<p>之前的版本：持仓盈利後才启用ATR追踪，导致开仓后立即反转被套牢且不止损。</p>'+
      '<p>修复：开仓时立即计算ATR并设置追踪止损价。即使立即反转，也会被止损出场，控制亏损。</p>'+
      '<h3>✅ 修改3：保本触发加缓冲</h3>'+
      '<p><code>breakeven_trigger_pct = 1.5%</code>：浮盈 ≥ 1.5% 时，将止损价拉到 entry + ATR×0.3（而不是直接拉到entry）。</p>'+
      '<p>这样即使价格回撤到保本价附近，也有0.3×ATR的缓冲，避免被小波动震出后再上涨。</p>'+
      '<h3>✅ 修改4：超时平仓时间调整</h3>'+
      '<p><code>timeout_hours: 1</code>：持仓超过1小时且浮盈 &lt; 1.5% 或 &lt; 0.5×ATR 时，强制平仓。</p>'+
      '<p>释放仓位给更高质量的信号。避免资金被低质量信号占用。</p>'+
      '<h2>当前系统状态</h2>'+
      '<div class="about-stats">'+
        '<div class="stat-card"><div class="stat-value">v3.9.48</div><div class="stat-label">策略版本</div></div>'+
        '<div class="stat-card"><div class="stat-value">3s</div><div class="stat-label">主循环间隔</div></div>'+
        '<div class="stat-card"><div class="stat-value">60s</div><div class="stat-label">选币间隔</div></div>'+
        '<div class="stat-card"><div class="stat-value">1U×20%</div><div class="stat-label">动态仓位大小</div></div>'+
      '</div>'+
      '<h2>下一步优化方向</h2>'+
      '<ul>'+
        '<li>充值到至少100U，让仓位大小合理（至少5~10U/仓）</li>'+
        '<li>优化 selector：加入趋势过滤（EMA/MA），避免震荡市中频繁止损</li>'+
        '<li>加入时间过滤：避开美股开盘前后的高波动时段</li>'+
        '<li>优化 hard stop：根据ATR动态调整，不再固定5.5%</li>'+
      '</ul>'+
      '<h2>策略版本历史盈亏曲线</h2>'+
      '<div class="pnl-chart-wrapper"><div class="pnl-chart-header"><div class="pnl-chart-title"><span class="dot" style="background:#00ff88;box-shadow:0 0 6px #00ff88;"></span>累计盈亏曲线</div><div class="pnl-chart-legend">数据来源：币安合约API · 实盘记录</div></div><canvas id="pnlChart2" class="pnl-chart-canvas"></canvas><div class="pnl-chart-tooltip" id="pnlChart2-tt"></div></div>'
  }
];
