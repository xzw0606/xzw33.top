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
  },
{
    id: "beat-esports-missed-signals-2026-06-18",
    module: "quant",
    title: "BEAT/ESPORTS 大单边行情未触发信号诊断",
    date: "2026-06-18",
    tags: ["诊断", "策略门", "BEAT", "ESPORTS"],
    summary: "BEAT（振幅97%）和 ESPORTS（振幅279%）今日通过选币器但策略门未触发信号。逐门诊断：BEAT 方向矛盾、ESPORTS 偏离度过大+4h高位拦截。",
    content: '<h2>背景</h2>'+
      '<p>6/18 当日，BEAT（24h 振幅 97%，量排名 #21）和 ESPORTS（24h 振幅 279%，量排名 #18）均通过选币器全量过滤，但引擎日志中零信号、零拒绝。模拟账户 v3.9.53 已跳过全部余额+风控限制，排除账户问题。</p>'+
      '<h2>BEATUSDT — 方向矛盾</h2>'+
      '<p>BEAT 已从 3.05 跌至 1.55 后反弹到 1.92，EMA7 刚翻多。</p>'+
      '<table><tr><th>门</th><th>结果</th><th>状态</th></tr>'+
        '<tr><td>15m EMA 方向</td><td>BULL（EMA7 &gt; EMA25）</td><td>PASS</td></tr>'+
        '<tr><td>价格 vs EMA7</td><td>+0.27%（BUY OK）</td><td>PASS</td></tr>'+
        '<tr><td>ADX / 偏离度</td><td>ADX=37 / dev=6.4% &lt; 9.5%（2&times;ATR）</td><td>PASS</td></tr>'+
        '<tr><td>4h 范围位置</td><td>pos=64%（BUY/SELL 均 OK）</td><td>PASS</td></tr>'+
        '<tr><td><strong>1m EMA 方向</strong></td><td><strong>SELL（EMA7 &lt; EMA25&times;0.998）</strong></td><td><strong>FAIL</strong></td></tr>'+
        '<tr><td>量比</td><td>0.4x（&lt;1.0x）</td><td>FAIL</td></tr></table>'+
      '<p><strong>根因：</strong>15m 看多，1m 出 SELL 信号，方向不匹配。反弹末端的局部回调导致 1m EMA 死叉，策略不会触发。</p>'+
      '<h2>ESPORTSUSDT — 涨太猛被拦</h2>'+
      '<p>ESPORTS 从 0.065 暴涨至 0.246（+279%），ADX=51 确认强趋势。</p>'+
      '<table><tr><th>门</th><th>结果</th><th>状态</th></tr>'+
        '<tr><td>15m EMA 方向</td><td>BULL</td><td>PASS</td></tr>'+
        '<tr><td>价格 vs EMA7</td><td>+17.8%（BUY OK，但偏离极大）</td><td>PASS</td></tr>'+
        '<tr><td><strong>ADX / 偏离度</strong></td><td><strong>dev=40% &gt; 17%（2&times;ATR）</strong></td><td><strong>FAIL</strong></td></tr>'+
        '<tr><td><strong>4h 范围位置</strong></td><td><strong>pos=91%（&gt;70% BUY 被拦）</strong></td><td><strong>FAIL</strong></td></tr>'+
        '<tr><td>1m EMA 方向</td><td>BUY（EMA7 &gt; EMA25&times;1.002）</td><td>PASS</td></tr>'+
        '<tr><td>量比</td><td>0.7x（&lt;1.0x）</td><td>FAIL</td></tr></table>'+
      '<p><strong>三重拦截：</strong>价格距 EMA25 偏离 40%（远超 2&times;ATR=17%）、在 4h 区间顶部 91% 位置、缩量。防追高机制在极端单边行情下过度拦截。</p>'+
      '<h2>策略门设计权衡</h2>'+
      '<p>偏离度上限和 4h 范围位置过滤的设计初衷是防止追高/追低。这在正常行情下有效（8 笔大亏单曾被 4h 门全部拦截），但在振幅 97%+ 的极端行情中，任何"合理"的阈值都会被击穿。</p>'+
      '<p>这不是 bug，是 trade-off：放宽阈值 → 更多追高亏损；收紧阈值 → 错过极端趋势。</p>'+
      '<h2>当前处理</h2>'+
      '<p>暂不修改策略门参数。BEAT/ESPORTS 这类单日翻倍或腰斩的行情属于极端事件，样本太少，不值得为此放宽门槛引入更多噪音信号。等待更多类似案例再评估。</p>'
  },
{
    id: "strategy-update-2026-06-18",
    module: "strategy",
    title: "策略更新 v3.9.52-53 — 模拟账户跳过全部风控限制",
    date: "2026-06-18",
    tags: ["策略更新", "v3.9", "模拟交易"],
    summary: "模拟账户去除余额校验和全部风控限制（冷却/熔断/单币上限/日亏/连续亏损停机）。三处 engine.py + 一处 paper/account.py 改动。",
    content: '<h2>v3.9.52：跳过余额检查</h2>'+
      '<p>模拟账户（PAPER_TRADING=True）不再校验虚拟余额。此前多次出现「余额不足」导致信号被拦截——虽然信号方向正确，但模拟金耗尽后无法开仓。</p>'+
      '<h3>改动</h3>'+
      '<ul><li><code>engine.py</code> line 287：<code>if not self.paper and balance &lt; size</code> → 模拟模式跳过余额判断</li>'+
        '<li><code>paper/account.py</code>：删除 <code>if self.balance &lt; size_usdt: return None</code></li></ul>'+
      '<p>唯一保留的限制是<strong>仓位动态缩减</strong>：<code>max_size = min(base_size, total_equity x 20%)</code>，防止权益归零后无限开仓。</p>'+
      '<h2>v3.9.53：跳过全部风控</h2>'+
      '<p>模拟账户不涉及真实资金，冷却、熔断、单币上限、日亏熔断、连续亏损停机、总杠杆限制对模拟交易无意义，全部跳过。</p>'+
      '<h3>三处 engine.py 改动</h3>'+
      '<table><tr><th>位置</th><th>原逻辑</th><th>修改</th></tr>'+
        '<tr><td>日亏熔断预检</td><td><code>is_daily_loss_breached()</code> → 整轮跳过</td><td><code>if not self.paper</code></td></tr>'+
        '<tr><td>自动停机</td><td>连亏 &ge;6 次 + 无持仓 → 引擎停止</td><td><code>if not self.paper</code></td></tr>'+
        '<tr><td>can_open()</td><td>冷却/熔断/单币上限/日亏/总杠杆，6 项检查</td><td><code>if not self.paper</code></td></tr></table>'+
      '<p>三处改动统一使用 <code>if not self.paper:</code> 前缀，不影响实盘路径。</p>'+
      '<h2>文件变更</h2>'+
      '<ul><li><code>core/engine.py</code> — 四处 <code>if not self.paper</code></li>'+
        '<li><code>paper/account.py</code> — 删除余额拦截</li></ul>'
  },
  {
    id: "quant-lessons-20260618-deploy",
    module: "quant",
    title: "教训：一次部署失误毁掉60笔交易记录",
    date: "2026-06-18",
    tags: ["部署", "教训", "数据备份", "运维"],
    summary: "改个配置参数却顺手把整台引擎的 state 重置了——60笔历史交易瞬间清零。复盘三个根因：盲目照搬部署模板、不先看数据管线全貌、没有备份机制。",
    content: '<h2>发生了什么</h2>'+
      '<p>纸面交易引擎需要改两个参数：<code>max_positions=10</code> 和统一 10 倍杠杆。改动只涉及 <code>engine.py</code> 里的几个常量，不需要动 state。</p>'+
      '<p>但部署时直接照搬了 skill 里的"全新纸盘部署"模板，完整执行了 kill → reset state → 重启。结果 <code>paper_state.json</code> 和 <code>state.json</code> 被重置为初始 500U 空状态，引擎重启前积累的 60 笔交易记录瞬间清零。</p>'+
      '<h2>连带故障</h2>'+
      '<p>祸不单行。重置后 HK 服务器上 <code>export_simulation.py</code> 丢失（复制代码时漏了这个文件），cron 每 5 分钟执行报 <code>No such file or directory</code>，网站模拟面板持续显示"数据可能停更"。</p>'+
      '<p>排查时又犯了同样的错：没先加载 skill 看完整数据管线，跳到第一个断点就动手修，漏掉了下游环节。</p>'+
      '<h2>三个根因</h2>'+
      '<table><tr><th>问题</th><th>根因</th><th>应该怎么做</th></tr>'+
        '<tr><td>交易记录被清</td><td>改了参数却用了重置模板</td><td>改什么用什么操作——改常量不需要 reset</td></tr>'+
        '<tr><td>管线断了没发现</td><td>没先看管线全貌就动手</td><td>排查前先 load skill 对完整链路逐环节查</td></tr>'+
        '<tr><td>数据永久丢失</td><td>没有备份机制</td><td>现在已加每小时自动备份到 /var/backups/simulation/</td></tr>'+
      '</table>'+
      '<h2>补救措施</h2>'+
      '<ul>'+
        '<li><strong>数据重建</strong>：从 HK 引擎日志中解析所有 <code>[模拟] 清仓</code> 行，提取 symbol、PnL、时间，重建了 60 笔交易记录</li>'+
        '<li><strong>备份机制</strong>：成都服务器新增每小时自动备份，保留 90 天</li>'+
        '<li><strong>规则更新</strong>：运维操作铁律从"改代码前 load skill"扩展到"任何操作前 load skill"</li>'+
      '</ul>'+
      '<h2>核心教训</h2>'+
      '<blockquote>部署模板是给"首次全新部署"用的。日常改参数不需要清 state。能增量操作的绝不全量重置。</blockquote>'+
      '<p>这次如果只是在引擎运行时直接 scp 覆盖 <code>engine.py</code> 然后发 SIGHUP 重载，60 笔记录全部还在。代价：500U 模拟账户跌到 360U 的完整交易日志，从零开始重新积累。</p>'
  },



  {
    id: "strategy-update-2026-06-20",
    module: "strategy",
    title: "v3.9.58：冷却延长+入场保护期——两刀砍掉 84U 无效止损",
    date: "2026-06-20",
    tags: ["版本升级", "止损优化", "参数调整", "数据回测"],
    summary: "6/19-20 两天 54 笔交易净亏 -12.81U 的复盘驱动两项改动：平仓冷却 30→60min、新仓位前 30 分钟跳过 ATR 追踪仅保留 -15% 硬止损。回测验证两项合计可挽回 84U 亏损，零误杀盈利单。",
    content: '<h2>复盘背景</h2>'+
      '<p>6/19 纸面交易引擎产生了 46 笔交易，净亏 -96.93U。6/20 凌晨 BICOUSDT 一笔 +88.16U 将亏损拉回到 -12.81U。如果不算这一单，其余 53 笔合计 -100.97U。</p>'+
      '<h2>数据审计发现</h2>'+
      '<h3>余额一致性</h3>'+
      '<p><code>paper_state.json</code> 数据正确：初始 500U → 累计 PnL -52.78U → 期望余额 447.22U，实际自由余额 336.59U + 100U 保证金 + 11.94U 浮盈 = 448.52U，差额 1.30U 来自手续费。</p>'+
      '<h3>simulation.json 价格 bug（已修复）</h3>'+
      '<p><code>export_simulation.py</code> 的 <code>fetch_prices()</code> 还在用 Spot API（<code>api.binance.com</code>）而非 Futures API。XMRUSDT 的 Spot 价格 118.70 vs Futures 315.15，导致未实现盈亏被计算为 +620.54%。修复后降至 -7.11%。</p>'+
      '<h3>出场后走势：4/5 大亏单方向全对</h3>'+
      '<p>拉了 5 笔最大亏损单的出场后 15m K 线：</p>'+
      '<table><tr><th>币种</th><th>方向</th><th>出场后空间</th><th>评估</th></tr>'+
        '<tr><td>REUSDT</td><td>BUY</td><td>+45.3%</td><td>39 分钟后暴涨</td></tr>'+
        '<tr><td>VELVETUSDT</td><td>SELL</td><td>+86.1%</td><td>被轧空后暴跌</td></tr>'+
        '<tr><td>EVAAUSDT</td><td>BUY</td><td>+968%</td><td>当天 6x 暴涨</td></tr>'+
        '<tr><td>REUSDT(2)</td><td>BUY</td><td>+40.4%</td><td>同上</td></tr>'+
        '<tr><td>SYNUSDT</td><td>BUY</td><td>-15.7%</td><td>止损正确</td></tr>'+
      '</table>'+
      '<p>核心发现：方向判断基本正确，但 ATR 追踪止损在低流动性时段把大量仓位提前踢了出去。</p>'+
      '<h2>两项改动</h2>'+
      '<h3>改动 1：平仓冷却 30→60min</h3>'+
      '<p>6/19 同币反复开的案例很频繁（MEGAUSDT 3 次、VELVETUSDT 2 次、REUSDT 2 次），短冷却让仓位释放后市场没消化一轮就重新入场，导致连续亏损。</p>'+
      '<p>回测：60min 冷却在现有 64 笔交易中可拦截 3 笔同币重开，被拦截交易 PnL 合计 -16.51U，<strong>零笔盈利单被误杀</strong>。</p>'+
      '<h3>改动 2：入场保护期（30min 不追踪）</h3>'+
      '<p>新仓位开仓后前 30 分钟跳过 ATR 追踪止损，仅保留 -15% 硬止损。给行情点呼吸空间，避免正常波动被过早踢出。</p>'+
      '<p>回测最近 15 笔交易：<strong>9 笔本可被救回，挽回 67.77U</strong>。包括 PORTALUSDT -11.35U、AGTUSDT -10.22U、SKYAIUSDT -7.90U 等。零笔在这 30 分钟内触及 -15% 硬止损。</p>'+
      '<h2>额外验证：凌晨不该停</h2>'+
      '<p>最初怀疑凌晨流动性差应该关停策略，但数据显示凌晨 00-06 反而是唯一赚钱的时段（19 笔 +61.70U，笔均 +3.25U）。真正该警惕的是上午 08-10（-34.93U）和晚上 22-23（-51.21U）。</p>'+
      '<h2>净效果预估</h2>'+
      '<p>两项改动合计在 6/19-20 两天可挽回约 84U（16.51 + 67.77），把 -12.81U 变成约 +71U。</p>'+
      '<h2>文件变更</h2>'+
      '<ul>'+
        '<li><code>core/config.py</code> — 冷却 30→60min + 新增 entry_protection_seconds/entry_protection_max_loss_pct</li>'+
        '<li><code>core/engine.py</code> — 三处 cooldown 1800→3600</li>'+
        '<li><code>position/manager.py</code> — _check_stops() 加入场保护期分支 + cooldown 1800→3600</li>'+
        '<li><code>export_simulation.py</code> — fetch_prices() Spot→Futures API</li>'+
      '</ul>'+
      '<h2>数据正确性保证</h2>'+
      '<p>部署前后完整校验：paper_state 余额一致性、引擎日志余额链追溯、simulation.json 价格修复验证。</p>'
  },,
  {
    id: "strategy-update-2026-06-28",
    title: "v3.9.61 — 纸面交易全量审计：H15硬止损修复 + 入场保护期补漏",
    date: "2026-06-28",
    module: "strategy",
    summary: "200笔交易全量审计：发现硬止损（H15）基于资产跌幅永不触发、入场保护期config缺失未运行。两项修复后硬止损从-30%资产→-3%资产（=-6U），入场保护期补上entry_protection_seconds。",
    tags: ["审计", "硬止损", "入场保护", "v3.9.61"],
    content: '<h2>审计范围</h2>'+
      '<p>纸面交易账户全量 200 笔交易，时间跨度 6/23-6/28。余额从 500U 跌至 15.65U（-96.9%），全时累计 PnL -121.89U。</p>'+
      '<table>'+
        '<tr><th>日期</th><th>笔数</th><th>PnL</th><th>胜率</th><th>特征</th></tr>'+
        '<tr><td>6/23</td><td>26</td><td>-21.9U</td><td>33%</td><td>正常亏损</td></tr>'+
        '<tr><td>6/24</td><td>46</td><td>-65.5U</td><td>37%</td><td>加速失血</td></tr>'+
        '<tr><td>6/25</td><td>31</td><td>+67.7U</td><td>39%</td><td>FOGOUSDT +58.7U 一笔撑住</td></tr>'+
        '<tr><td>6/26</td><td>44</td><td>+3.1U</td><td>41%</td><td>基本打平</td></tr>'+
        '<tr><td>6/27</td><td>34</td><td>-12.5U</td><td>35%</td><td>回归亏损</td></tr>'+
        '<tr><td>6/28</td><td>19</td><td>-92.8U</td><td>12%</td><td>崩盘日</td></tr>'+
      '</table>'+
      '<p>6/28 单日亏损集中在凌晨：RAVEUSDT -21.45U + AGLDUSDT -11.19U + 持续 ATR 追踪止损。</p>'+
      '<h2>发现 Bug 1：硬止损 H15 — 基于资产跌幅，永不触发</h2>'+
      '<p><code>max_loss_pct=30.0</code> 是底层资产价格跌幅，不是保证金 PnL。10x 杠杆下：</p>'+
      '<ul>'+
        '<li>资产 -30% = 保证金 -300% = -60U 才触发硬止损</li>'+
        '<li>ATR 追踪上限 7% 远在此之前触发</li>'+
        '<li>硬止损形同虚设</li>'+
      '</ul>'+
      '<p>RAVEUSDT 实际 -10.7% 资产跌幅 = -107% 保证金 = -21.45U，如果硬止损在工作，应该在 -3% 资产（-6U）处就截断了。</p>'+
      '<p><strong>修复</strong>：<code>manager.py</code> 硬编码 <code>pnl_pct &lt;= -3.0</code>（-3% 资产 = -30% 保证金 = -6U）。不再从 config 读取 max_loss_pct。</p>'+
      '<h2>发现 Bug 2：入场保护期 — 从未实际运行</h2>'+
      '<p><code>config.py</code> 的 POSITION 字典从未包含 <code>entry_protection_seconds</code> 和 <code>entry_protection_max_loss_pct</code> 两个 key。<code>manager.py</code> 读取时 <code>.get("entry_protection_seconds", 0)</code> 永远返回 0 → 保护期逻辑跳过。</p>'+
      '<p>日志中「保护期止损」触发次数：<strong>0</strong>。所有新仓位从第一秒就走 ATR 追踪。</p>'+
      '<p><strong>修复</strong>：config.py 补上两个 key：<code>entry_protection_seconds=1800</code>（30min）、<code>entry_protection_max_loss_pct=15.0</code>。</p>'+
      '<h2>出场后分析：方向对但被洗出</h2>'+
      '<p>对 6/28 大亏单拉取出场后 K 线：</p>'+
      '<table>'+
        '<tr><th>币种</th><th>PnL</th><th>出场后最佳</th><th>判定</th></tr>'+
        '<tr><td>RAVEUSDT</td><td>-21.45U</td><td>+8.5%</td><td>止损太早</td></tr>'+
        '<tr><td>AGLDUSDT</td><td>-11.19U</td><td>+7.2%</td><td>止损太早</td></tr>'+
        '<tr><td>CAPUSDT SELL</td><td>-8.57U</td><td>+3.6%</td><td>止损太早</td></tr>'+
        '<tr><td>MYXUSDT</td><td>-6.59U</td><td>+5.2%</td><td>止损太早</td></tr>'+
        '<tr><td>NFPUSDT</td><td>-8.83U</td><td>-14.5%</td><td>方向反了</td></tr>'+
      '</table>'+
      '<p>4/6 大亏单方向完全正确，出场后价格继续走了 3.6%~8.5%。不是入场问题，是 ATR 追踪在回调中过早踢出。</p>'+
      '<h2>其他发现</h2>'+
      '<ul>'+
        '<li><strong>BUY vs SELL 反转</strong>：BUY 133笔 -157.9U（32% WR），SELL 67笔 +36.1U（42% WR）。市场方向从牛转熊，DI/EMA 方向判断滞后。</li>'+
        '<li><strong>凌晨死亡区</strong>：02:00-04:00 时段 -89U，胜率 <20%。亚洲深夜低流动性导致 ATR 缓冲被穿刺。</li>'+
        '<li><strong>EMA 止盈几乎不触发</strong>：679 笔清仓中仅 8 次 EMA 止盈（1.2%），ATR 追踪总在 EMA 交叉前先触发。</li>'+
        '<li><strong>系统性亏损币种</strong>：UBUSDT 6笔 0% WR、SYNUSDT 14笔 29% WR、HEIUSDT 6笔 17% WR。模拟账户风控全跳过（v3.9.53），没有单币熔断。</li>'+
        '<li><strong>盈亏分布极端</strong>：17笔爆盈 +324.8U 被 75笔小亏（-220.7U）+ 8笔爆亏（-103.4U）全部吞噬。</li>'+
      '</ul>'+
      '<h2>文件变更</h2>'+
      '<ul>'+
        '<li><code>position/manager.py</code> — 硬止损从 <code>-self.cfg.get("max_loss_pct", 30)</code> 硬编码为 <code>-3.0</code>（-3% 资产 = -30% 保证金）</li>'+
        '<li><code>core/config.py</code> — 补上 <code>entry_protection_seconds: 1800</code> + <code>entry_protection_max_loss_pct: 15.0</code>；更新 max_loss_pct 注释标注 H15 已修</li>'+
      '</ul>'+
      '<h2>纸面账户重置</h2>'+
      '<p>历史数据已清空，余额重置为 500U，状态干干净净。两项修复已部署到 HK 引擎。</p>'
  },,
  {
    id: "strategy-update-2026-06-28-v3965",
    module: "strategy",
    title: "v3.9.64-65 入场&出场重构 — 趋势跟随 + 5m结构出场",
    date: "2026-06-28",
    tags: ["策略更新", "v3.9", "Plan G", "出场重构"],
    summary: "入场放宽Gate 2（前3根有阴即可），出场从固定3%跟踪改为5m结构+8%跟踪兜底，解决ACT暴拉无法接入+跟踪过早踢出的问题。",
    content: '<h2>问题来源</h2>'+
      '<p>ACTUSDT 今天从 0.00781 暴涨 83% 到 0.01431，但引擎完全没有开仓。</p>'+
      '<h2>根因分析</h2>'+
      '<p>Plan G Gate 2 要求「前一根必须阴线 + 当前阳线吞噬」。ACT 在启动后连续拉了 4 根 15m 阳线（18:30-19:45），没有任何阴线回调——Gate 2 在单边暴拉行情中永远不成立。</p>'+
      '<p>这暴露了两个设计缺陷：</p>'+
      '<ol>'+
        '<li><strong>入场太死板</strong>：必须紧挨着的阴线才能触发，市场不一定会留下完美的阴线回调。</li>'+
        '<li><strong>出场太早（原 3% 跟踪止盈）</strong>：ACT 模拟回放入场 0.00958，最高 0.01036（+8.1%）触发保本，3% 跟踪锁在 0.01005 止盈（+4.9%），但后面涨到 0.01431（+49%）。</li>'+
      '</ol>'+
      '<h2>修改内容</h2>'+
      '<h3>入场 — v3.9.64</h3>'+
      '<p><code>strategies/momentum.py</code> Gate 2 放宽：</p>'+
      '<ul>'+
        '<li><strong>原逻辑</strong>：前一根必须阴线 + 当前阳线吞噬</li>'+
        '<li><strong>新逻辑</strong>：当前阳线吞噬前一根 + <strong>前 3 根 K 线内至少有一根阴线</strong></li>'+
      '</ul>'+
      '<p>ACT 案例：17:30 有最后一根恐慌阴线，18:15 阳线吞噬 18:00 阳线，前 3 根（17:30-18:00）包含了阴线 → Gate 2 通过 ✅。</p>'+
      '<h3>出场 — v3.9.65</h3>'+
      '<p><code>position/manager.py</code> + <code>core/config.py</code> 三层出场：</p>'+
      '<table>'+
        '<tr><th>#</th><th>触发条件</th><th>参数</th><th>作用</th></tr>'+
        '<tr><td>①</td><td>硬止损</td><td>-6%</td><td>保本前最后防线</td></tr>'+
        '<tr><td>②</td><td>5m 连续 3 根收盘逐根走低</td><td>3 连收低</td><td>主力出场信号——急跌反转立刻平</td></tr>'+
        '<tr><td>③</td><td>跟踪止盈</td><td><strong>8%（原 3%）</strong></td><td>兜底慢跌——正常回调不会被踢</td></tr>'+
      '</table>'+
      '<p>核心思路：<strong>趋势没坏就拿着，微观结构破位才走。</strong>不再用固定百分比跟踪来替代趋势判断。正常趋势中 5m 结构不会触发，跟踪 8% 只兜极端反转。</p>'+
      '<h2>ACT 预期效果</h2>'+
      '<p>回放入场 0.00958（18:15），持有到 20:00 附近 5m 3 连阴触发 → 平仓 @ ~0.0135（+41%）。对比原版 3% 跟踪只吃到 +4.9%。</p>'+
      '<table>'+
        '<tr><th></th><th>v3.9.63（旧）</th><th>v3.9.65（新）</th></tr>'+
        '<tr><td>入场</td><td>❌ Gate 2 不通过</td><td>✅ 18:15 通过</td></tr>'+
        '<tr><td>出场</td><td>跟踪 3% → 0.01005 出</td><td>5m 结构 → ~0.0135 出</td></tr>'+
        '<tr><td>收益</td><td>—（未入场）</td><td><strong>+41%</strong></td></tr>'+
      '</table>'+
      '<h2>文件变更</h2>'+
      '<ul>'+
        '<li><code>strategies/momentum.py</code> — Gate 2: 前一根阴线 → 前3根内至少1阴（v3.9.64）</li>'+
        '<li><code>position/manager.py</code> — 保本后新增 5m 3连收低出场（①），跟踪 3%→8% 兜底（②）（v3.9.65）</li>'+
        '<li><code>core/config.py</code> — <code>trail_stop_pct: 3.0 → 8.0</code>；新增 VERSION 描述</li>'+
      '</ul>'+
      '<h2>设计讨论</h2>'+
      '<p>本次改动源于与 Hermes 的真实协作对话。最初考虑「1h EMA 死叉出场」，但 ACT 案例中 1h EMA 反转滞后数小时。最终方案：用 5m K 线结构做灵敏出场 + 8% 跟踪止盈兜底——既不在正常趋势中被踢出，又能及时响应反转。</p>'+
      '<p><strong>入场端也做了优化</strong>：曾考虑「1h EMA 趋势强时跳过 Gate 2」（方案 C），但 ACT 当前 EMA7 领先 25 达 18%，若此时入场实际上是在已经 +83% 的位置追高——一根大阴线就触发硬止损。放宽 Gate 2 为「前 3 根有阴」更安全：阴线说明最近有过回调洗盘，当前阳线吞噬是多头反攻信号，而非无脑追涨。</p>'
  },

];