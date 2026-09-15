(function () {
  "use strict";

  const navItems = [
    { section: "Workspace" },
    { id: "overview", label: "Overview", icon: "⌂" },
    { id: "content", label: "Content", icon: "▤", count: 24 },
    { id: "calendar", label: "Calendar", icon: "□" },
    { id: "board", label: "Production Board", icon: "◫", count: 8 },
    { section: "Publish & Measure" },
    { id: "publishing", label: "Publishing Queue", icon: "↗", count: 5 },
    { id: "published", label: "Published Content", icon: "✓" },
    { id: "analytics", label: "Analytics", icon: "⌁" },
    { section: "Manage" },
    { id: "channels", label: "Channels", icon: "◉" },
    { id: "media", label: "Media Library", icon: "◇" },
    { id: "automations", label: "Automations", icon: "ϟ", count: 6 },
    { id: "team", label: "Team", icon: "♙" },
    { id: "settings", label: "Settings", icon: "⚙" }
  ];

  const fallback = {
    channels: [
      { id: "ch1", name: "PsychToonsHQ", platform: "YouTube", handle: "@PsychToonsHQ", followers: 124800, views: 2840000, posts: 86, color: "#ff4b55", active: true },
      { id: "ch2", name: "TraceTheGlobe", platform: "TikTok", handle: "@tracetheglobe", followers: 89200, views: 1920000, posts: 114, color: "#12182a", active: true },
      { id: "ch3", name: "HiddenCompass", platform: "Instagram", handle: "@hiddencompass.1", followers: 63500, views: 1380000, posts: 72, color: "#d9468d", active: true },
      { id: "ch4", name: "Inkexplainer96", platform: "YouTube", handle: "@Inkexplainer96", followers: 47700, views: 980000, posts: 54, color: "#ff4b55", active: true },
      { id: "ch5", name: "IconicFemme", platform: "Instagram", handle: "@iconicfemme", followers: 35600, views: 761000, posts: 67, color: "#d9468d", active: true },
      { id: "ch6", name: "OfficialDesireDiaries", platform: "Facebook", handle: "Desire Diaries", followers: 28900, views: 634000, posts: 49, color: "#3478f6", active: true }
    ],
    content: [
      { id: "ct1", title: "Why your brain remembers unfinished stories", channel: "PsychToonsHQ", platform: "YouTube", status: "Published", date: "2026-09-15", owner: "Thanh Tam", type: "Explainer", views: 284300, likes: 18900, comments: 642, shares: 1240, saves: 3800, avgWatch: "01:18", retention: 72, score: 91, url: "https://youtube.com/shorts/demo1" },
      { id: "ct2", title: "7 places that look like another planet", channel: "TraceTheGlobe", platform: "TikTok", status: "Published", date: "2026-09-14", owner: "Minh Anh", type: "Travel", views: 196800, likes: 12700, comments: 428, shares: 2100, saves: 4800, avgWatch: "00:34", retention: 81, score: 88, url: "https://tiktok.com/@demo/video/2" },
      { id: "ct3", title: "The forgotten map that changed history", channel: "HiddenCompass", platform: "Instagram", status: "Review", date: "2026-09-17", owner: "Thanh Tam", type: "History", views: 0, likes: 0, comments: 0, shares: 0, saves: 0, avgWatch: "—", retention: 0, score: 0, url: "" },
      { id: "ct4", title: "The psychology behind first impressions", channel: "PsychToonsHQ", platform: "YouTube", status: "Editing", date: "2026-09-18", owner: "Quang Huy", type: "Psychology", views: 0, likes: 0, comments: 0, shares: 0, saves: 0, avgWatch: "—", retention: 0, score: 0, url: "" },
      { id: "ct5", title: "Fashion details hiding in famous paintings", channel: "IconicFemme", platform: "Instagram", status: "Scheduled", date: "2026-09-19", owner: "Linh Chi", type: "Culture", views: 0, likes: 0, comments: 0, shares: 0, saves: 0, avgWatch: "—", retention: 0, score: 0, url: "" },
      { id: "ct6", title: "Five inventions created by accident", channel: "Inkexplainer96", platform: "YouTube", status: "Script", date: "2026-09-20", owner: "Thanh Tam", type: "Science", views: 0, likes: 0, comments: 0, shares: 0, saves: 0, avgWatch: "—", retention: 0, score: 0, url: "" },
      { id: "ct7", title: "Small habits that make you more confident", channel: "OfficialDesireDiaries", platform: "Facebook", status: "Idea", date: "2026-09-22", owner: "Minh Anh", type: "Lifestyle", views: 0, likes: 0, comments: 0, shares: 0, saves: 0, avgWatch: "—", retention: 0, score: 0, url: "" },
      { id: "ct8", title: "What your favorite color actually says", channel: "PsychToonsHQ", platform: "TikTok", status: "Approved", date: "2026-09-16", owner: "Linh Chi", type: "Psychology", views: 0, likes: 0, comments: 0, shares: 0, saves: 0, avgWatch: "—", retention: 0, score: 0, url: "" }
    ],
    team: [
      { id: "u1", name: "Thanh Tam", email: "owner@example.com", role: "Owner", initials: "TP", color: "#7357e8", status: "Active" },
      { id: "u2", name: "Minh Anh", email: "minhanh@example.com", role: "Content Manager", initials: "MA", color: "#ff6b6b", status: "Active" },
      { id: "u3", name: "Quang Huy", email: "quanghuy@example.com", role: "Editor", initials: "QH", color: "#3b82f6", status: "Active" },
      { id: "u4", name: "Linh Chi", email: "linhchi@example.com", role: "Scriptwriter", initials: "LC", color: "#1fab75", status: "Active" }
    ],
    automations: [
      { id: "a1", title: "Approved → Publishing queue", description: "Khi nội dung được duyệt, tự chuyển vào hàng chờ đăng.", icon: "↗", enabled: true },
      { id: "a2", title: "Post-publish metric sync", description: "Đồng bộ sau 1h, 6h, 24h, 3 ngày và 7 ngày.", icon: "↻", enabled: true },
      { id: "a3", title: "High performance alert", description: "Thông báo khi lượt xem cao hơn trung bình kênh 50%.", icon: "↥", enabled: true },
      { id: "a4", title: "Low retention warning", description: "Cảnh báo Content Manager khi retention dưới 35%.", icon: "!", enabled: true },
      { id: "a5", title: "Weekly email report", description: "Gửi báo cáo tổng hợp vào 08:00 sáng thứ Hai.", icon: "✉", enabled: false },
      { id: "a6", title: "Repurpose top content", description: "Tạo task mới khi Performance Score lớn hơn 85.", icon: "⎘", enabled: false }
    ]
  };

  const state = {
    route: location.hash.replace("#", "") || "overview",
    channels: [], content: [], team: [], automations: [],
    filter: "all", search: "", live: Boolean(window.CONTENTOPS_CONFIG?.supabaseUrl && window.CONTENTOPS_CONFIG?.supabaseAnonKey)
  };

  let db = null;
  let currentUser = null;
  let workspaceId = null;

  const page = document.getElementById("page");
  const nav = document.getElementById("mainNav");
  const dialog = document.getElementById("appDialog");
  const dialogForm = document.getElementById("dialogForm");

  function escapeHtml(value = "") {
    return String(value).replace(/[&<>'"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c]));
  }
  function format(value) {
    if (value === undefined || value === null) return "—";
    if (value >= 1000000) return `${(value / 1000000).toFixed(value >= 10000000 ? 0 : 1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(value >= 100000 ? 0 : 1)}K`;
    return Number(value).toLocaleString("vi-VN");
  }
  function platformColor(platform) {
    return { YouTube: "#ff4b55", TikTok: "#12182a", Instagram: "#d9468d", Facebook: "#3478f6" }[platform] || "#7357e8";
  }
  function statusClass(status) {
    return String(status).toLowerCase().replace(/\s+/g, "-").replace("in-review", "review");
  }
  function toast(message, type = "") {
    const item = document.createElement("div");
    item.className = `toast ${type}`;
    item.textContent = message;
    document.getElementById("toastStack").appendChild(item);
    setTimeout(() => item.remove(), 3200);
  }
  function persist() {
    if (state.live) return;
    localStorage.setItem("contentops_state", JSON.stringify({ channels: state.channels, content: state.content, team: state.team, automations: state.automations }));
  }
  function renderLogin() {
    renderNav();
    page.innerHTML = `<div class="auth-gate"><article class="auth-card"><div class="auth-logo">C</div><span class="eyebrow">CONTENTOPS HUB</span><h1>Đăng nhập workspace</h1><p>Sử dụng tài khoản Google đã được mời để truy cập nội dung, kênh và báo cáo của đội ngũ.</p><button class="button primary google-button" id="googleSignIn">G&nbsp; Tiếp tục với Google</button></article></div>`;
    document.getElementById("googleSignIn").addEventListener("click", async () => {
      await db.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.href.split("#")[0] } });
    });
  }
  async function loadLiveData() {
    db = window.supabase.createClient(window.CONTENTOPS_CONFIG.supabaseUrl, window.CONTENTOPS_CONFIG.supabaseAnonKey);
    const { data: authData } = await db.auth.getSession();
    if (!authData.session) { renderLogin(); return false; }
    currentUser = authData.session.user;
    let { data: memberships } = await db.from("workspace_members").select("workspace_id,role,display_name,email").limit(1);
    if (!memberships?.length) {
      const created = await db.rpc("create_personal_workspace", { workspace_name: window.CONTENTOPS_CONFIG.workspaceName || "My Content Studio" });
      if (created.error) throw created.error;
      memberships = [{ workspace_id: created.data, role: "owner", display_name: currentUser.user_metadata?.full_name, email: currentUser.email }];
    }
    workspaceId = memberships[0].workspace_id;
    const [channelsRes, contentRes, postsRes, membersRes, automationsRes] = await Promise.all([
      db.from("channels").select("*").eq("workspace_id", workspaceId).order("created_at"),
      db.from("content_items").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }),
      db.from("published_posts").select("*,content_items(title,content_pillar,owner_name,due_date),channels(name)").eq("workspace_id", workspaceId).order("published_at", { ascending: false }),
      db.from("workspace_members").select("*").eq("workspace_id", workspaceId),
      db.from("automations").select("*").eq("workspace_id", workspaceId).order("created_at")
    ]);
    const errors = [channelsRes, contentRes, postsRes, membersRes, automationsRes].map(x=>x.error).filter(Boolean);
    if (errors.length) throw errors[0];
    state.channels = (channelsRes.data || []).map(x=>({ id:x.id,name:x.name,platform:x.platform,handle:x.handle||x.channel_url||"",followers:Number(x.followers||0),views:Number(x.total_views||0),posts:Number(x.post_count||0),color:x.color||platformColor(x.platform),active:x.active }));
    const publishedIds = new Set((postsRes.data || []).map(x=>x.content_id));
    state.content = (contentRes.data || []).filter(x=>!publishedIds.has(x.id)).map(x=>({ id:x.id,title:x.title,channel:state.channels.find(c=>c.id===x.primary_channel_id)?.name||"Chưa chọn",platform:x.primary_platform||"—",status:x.status[0].toUpperCase()+x.status.slice(1),date:x.due_date||"—",owner:x.owner_name||"Chưa giao",type:x.content_pillar||"General",views:0,likes:0,comments:0,shares:0,saves:0,avgWatch:"—",retention:0,score:0,url:"" }));
    state.content.unshift(...(postsRes.data || []).map(x=>({ id:x.content_id,title:x.content_items?.title||"Untitled",channel:x.channels?.name||"Chưa chọn",platform:x.platform,status:x.status[0].toUpperCase()+x.status.slice(1),date:(x.published_at||"").slice(0,10)||"—",owner:x.content_items?.owner_name||"Chưa giao",type:x.content_items?.content_pillar||"General",views:Number(x.views||0),likes:Number(x.likes||0),comments:Number(x.comments||0),shares:Number(x.shares||0),saves:Number(x.saves||0),avgWatch:x.average_watch_seconds?`${Math.floor(x.average_watch_seconds/60).toString().padStart(2,"0")}:${Math.round(x.average_watch_seconds%60).toString().padStart(2,"0")}`:"—",retention:Number(x.retention_rate||0),score:Number(x.performance_score||0),url:x.post_url,publishedPostId:x.id })));
    state.team = (membersRes.data || []).map(x=>({ id:x.user_id,name:x.display_name||x.email,email:x.email,role:x.role.split("_").map(y=>y[0].toUpperCase()+y.slice(1)).join(" "),initials:(x.display_name||x.email).split(/\s+/).map(y=>y[0]).slice(-2).join("").toUpperCase(),color:"#7357e8",status:x.status[0].toUpperCase()+x.status.slice(1) }));
    state.automations = (automationsRes.data || []).map(x=>({ id:x.id,title:x.title,description:`Trigger: ${x.trigger_type}`,icon:"ϟ",enabled:x.enabled }));
    return true;
  }
  async function loadData() {
    if (state.live && window.supabase) {
      try {
        const ready = await loadLiveData();
        document.getElementById("modeBadge").textContent = "Live sync";
        document.getElementById("modeBadge").style.background = "var(--green-soft)";
        if (ready) render();
        return;
      } catch (error) {
        console.error(error);
        toast("Không thể tải workspace. Kiểm tra cấu hình Supabase.", "warning");
      }
    }
    let remote = {};
    try {
      const [channels, content, team, automations] = await Promise.all([
        fetch("data/channels.json").then(r => r.json()), fetch("data/content.json").then(r => r.json()),
        fetch("data/team.json").then(r => r.json()), fetch("data/automations.json").then(r => r.json())
      ]);
      remote = { channels, content, team, automations };
    } catch (_) { remote = fallback; }
    const saved = JSON.parse(localStorage.getItem("contentops_state") || "null");
    Object.assign(state, saved || remote || fallback);
    document.getElementById("modeBadge").textContent = state.live ? "Live sync" : "Demo mode";
    document.getElementById("modeBadge").style.background = state.live ? "var(--green-soft)" : "var(--amber-soft)";
    render();
  }

  function renderNav() {
    nav.innerHTML = navItems.map(item => item.section
      ? `<div class="nav-section">${item.section}</div>`
      : `<button class="nav-item ${state.route === item.id ? "active" : ""}" data-route="${item.id}"><span class="nav-icon">${item.icon}</span><span class="nav-label">${item.label}</span>${item.count ? `<span class="nav-count">${item.count}</span>` : ""}</button>`
    ).join("");
    nav.querySelectorAll("[data-route]").forEach(btn => btn.addEventListener("click", () => {
      location.hash = btn.dataset.route;
      document.getElementById("sidebar").classList.remove("open");
    }));
  }

  function head(eyebrow, title, subtitle, actions = "") {
    return `<div class="page-head"><div><span class="eyebrow">${eyebrow}</span><h1>${title}</h1><p>${subtitle}</p></div><div class="page-actions">${actions}</div></div>`;
  }
  function stat(label, value, delta, icon, tone, color) {
    return `<article class="stat-card" style="--tone:${tone};--icon:${color}"><div class="stat-top"><span>${label}</span><span class="stat-icon">${icon}</span></div><div class="stat-value">${value}</div><span class="delta ${String(delta).startsWith("-") ? "down" : ""}">${delta}</span></article>`;
  }
  function contentRows(items, published = false) {
    return items.map(item => `<tr>
      <td><div class="title-cell"><span class="thumb">${escapeHtml(item.title).slice(0,1)}</span><div><strong>${escapeHtml(item.title)}</strong><small>${item.type} · ${item.date}</small></div></div></td>
      <td><span class="platform" style="--platform:${platformColor(item.platform)}">${item.platform}</span></td>
      <td>${escapeHtml(item.channel)}</td>
      <td><span class="status ${statusClass(item.status)}">${item.status}</span></td>
      ${published ? `<td class="metric">${format(item.views)}</td><td class="metric">${format(item.likes)}</td><td>${item.avgWatch}</td><td><div class="score" style="--score:${item.score}"><span>${item.score || "—"}</span></div></td>` : `<td>${escapeHtml(item.owner)}</td><td>${item.date}</td>`}
      <td><button class="button ghost small row-action" data-id="${item.id}">•••</button></td>
    </tr>`).join("");
  }

  function overviewPage() {
    const published = state.content.filter(x => x.status === "Published");
    const totalViews = published.reduce((sum, x) => sum + Number(x.views || 0), 0);
    const totalLikes = published.reduce((sum, x) => sum + Number(x.likes || 0), 0);
    return `${head("WORKSPACE OVERVIEW", "Good afternoon, Thanh Tam", "Tổng quan hoạt động nội dung trong 30 ngày gần nhất.", `<button class="button secondary" data-action="export">⇩ Xuất báo cáo</button><button class="button primary" data-action="add-content">＋ Nội dung mới</button>`)}
      <div class="stats-grid">
        ${stat("TOTAL VIEWS", format(totalViews || 481100), "+18.4% so với kỳ trước", "◉", "#eaf2ff", "#3b82f6")}
        ${stat("ENGAGEMENT", format(totalLikes || 31600), "+12.7% so với kỳ trước", "♡", "#fff0ef", "#ff6b6b")}
        ${stat("AVG. WATCH TIME", "00:56", "+8.2% so với kỳ trước", "◷", "#f0edff", "#7357e8")}
        ${stat("PUBLISHED", published.length || 18, "3 nội dung tuần này", "✓", "#e8f8f1", "#1fab75")}
      </div>
      <div class="dashboard-grid">
        <div class="stack">
          <article class="card"><div class="card-head"><div><h2>Hiệu suất nội dung</h2><p>Views theo ngày trên tất cả nền tảng</p></div><div class="head-actions"><div class="legend"><span>Views</span><span>Tương tác</span></div><select class="filter"><option>30 ngày</option><option>7 ngày</option></select></div></div>
            <div class="chart-shell"><div class="chart-summary"><div><span>Tổng lượt xem<strong>1.28M</strong></span></div><div><span>Tổng tương tác<strong>84.6K</strong></span></div></div>
            <svg class="line-chart" viewBox="0 0 700 180" preserveAspectRatio="none" aria-label="Biểu đồ lượt xem"><defs><linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7357e8" stop-opacity=".24"/><stop offset="1" stop-color="#7357e8" stop-opacity="0"/></linearGradient></defs>
              <line class="chart-grid-line" x1="0" y1="20" x2="700" y2="20"/><line class="chart-grid-line" x1="0" y1="70" x2="700" y2="70"/><line class="chart-grid-line" x1="0" y1="120" x2="700" y2="120"/><line class="chart-grid-line" x1="0" y1="170" x2="700" y2="170"/>
              <path class="chart-area" d="M0 150 C55 130 65 145 115 112 S190 76 235 104 S320 121 370 78 S455 38 505 65 S595 88 700 25 L700 180 L0 180Z"/><path class="chart-line" d="M0 150 C55 130 65 145 115 112 S190 76 235 104 S320 121 370 78 S455 38 505 65 S595 88 700 25"/><circle class="chart-dot" cx="700" cy="25" r="5"/>
            </svg><div class="axis-labels"><span>17 Aug</span><span>22 Aug</span><span>27 Aug</span><span>01 Sep</span><span>06 Sep</span><span>11 Sep</span><span>15 Sep</span></div></div>
          </article>
          <article class="card"><div class="card-head"><div><h2>Nội dung gần đây</h2><p>Theo dõi tiến độ và kết quả mới nhất</p></div><div class="head-actions"><button class="button ghost small" data-route-link="content">Xem tất cả →</button></div></div><div class="table-wrap"><table><thead><tr><th>Nội dung</th><th>Nền tảng</th><th>Kênh</th><th>Trạng thái</th><th>Phụ trách</th><th>Ngày</th><th></th></tr></thead><tbody>${contentRows(state.content.slice(0,5))}</tbody></table></div></article>
        </div>
        <aside class="stack">
          <article class="card"><div class="card-head"><div><h3>Hiệu suất theo kênh</h3><p>30 ngày gần nhất</p></div></div><div class="card-body progress-list">${state.channels.slice(0,5).map((c,i) => `<div class="progress-row"><strong>${escapeHtml(c.name)}</strong><div class="progress-track"><div class="progress-fill" style="width:${92-i*11}%;--bar:${c.color}"></div></div><span>${format(c.views)}</span></div>`).join("")}</div></article>
          <article class="card"><div class="card-head"><div><h3>Hoạt động mới</h3><p>Cập nhật từ workspace</p></div></div><div class="card-body activity-list">
            <div class="activity"><span class="activity-icon">✓</span><p><strong>Minh Anh</strong> đã duyệt một kịch bản.</p><time>12 phút</time></div>
            <div class="activity"><span class="activity-icon">↻</span><p>Số liệu <strong>PsychToonsHQ</strong> đã đồng bộ.</p><time>34 phút</time></div>
            <div class="activity"><span class="activity-icon">↗</span><p>Một video đã được đưa vào hàng chờ.</p><time>1 giờ</time></div>
            <div class="activity"><span class="activity-icon">!</span><p><strong>TraceTheGlobe</strong> vượt trung bình 50%.</p><time>3 giờ</time></div>
          </div></article>
        </aside>
      </div>`;
  }

  function contentPage() {
    const items = state.content.filter(x => (state.filter === "all" || x.status.toLowerCase() === state.filter) && (!state.search || x.title.toLowerCase().includes(state.search)));
    return `${head("CONTENT LIBRARY", "Content", "Quản lý ý tưởng, nội dung, phiên bản và người phụ trách.", `<button class="button secondary" data-action="export">⇩ Export CSV</button><button class="button primary" data-action="add-content">＋ Tạo nội dung</button>`)}
      <div class="toolbar"><select class="filter" id="statusFilter"><option value="all">Tất cả trạng thái</option>${["idea","script","editing","review","approved","scheduled","published"].map(s=>`<option value="${s}" ${state.filter===s?"selected":""}>${s[0].toUpperCase()+s.slice(1)}</option>`).join("")}</select><select class="filter"><option>Tất cả nền tảng</option><option>YouTube</option><option>TikTok</option><option>Instagram</option><option>Facebook</option></select><span class="spacer"></span><span class="helper">${items.length} nội dung</span></div>
      <article class="card"><div class="table-wrap"><table><thead><tr><th>Nội dung</th><th>Nền tảng</th><th>Kênh</th><th>Trạng thái</th><th>Phụ trách</th><th>Deadline</th><th></th></tr></thead><tbody>${contentRows(items)}</tbody></table></div></article>`;
  }

  function boardPage() {
    const columns = [
      { key: "Idea", color: "#98a0b3" }, { key: "Script", color: "#3b82f6" }, { key: "Editing", color: "#f2a83b" }, { key: "Review", color: "#ff6b6b" }, { key: "Approved", color: "#1fab75" }
    ];
    return `${head("PRODUCTION", "Production Board", "Di chuyển nội dung qua từng giai đoạn sản xuất.", `<button class="button primary" data-action="add-content">＋ Tạo nhiệm vụ</button>`)}
      <div class="kanban">${columns.map(col => { const items = state.content.filter(x => x.status === col.key); return `<section class="kanban-col"><div class="kanban-head" style="--column:${col.color}"><span></span>${col.key}<span class="kanban-count">${items.length}</span></div><div class="kanban-cards">${items.map(item=>`<article class="kanban-card"><span class="tag">${item.type}</span><h4>${escapeHtml(item.title)}</h4><div class="kanban-meta"><span class="avatar">${item.owner.split(" ").map(x=>x[0]).slice(-2).join("")}</span><span>${item.owner}</span><span class="spacer">${item.date}</span></div></article>`).join("") || `<div class="helper" style="padding:12px;text-align:center">Chưa có nội dung</div>`}</div></section>`; }).join("")}</div>`;
  }

  function calendarPage() {
    const days = Array.from({length:35}, (_,i) => i < 2 ? null : i-1);
    const byDay = Object.fromEntries(state.content.map(x => [Number(x.date.slice(-2)), x]));
    return `${head("SCHEDULE", "Content Calendar", "Lịch sản xuất và xuất bản tháng 9, 2026.", `<button class="button secondary">Hôm nay</button><button class="button primary" data-action="add-content">＋ Lên lịch</button>`)}
      <article class="card calendar"><div class="calendar-head">${["Thứ Hai","Thứ Ba","Thứ Tư","Thứ Năm","Thứ Sáu","Thứ Bảy","Chủ Nhật"].map(x=>`<div>${x}</div>`).join("")}</div><div class="calendar-grid">${days.map(d=>`<div class="day ${d===15?"today":""}">${d ? `<div class="day-number">${d}</div>${byDay[d] ? `<div class="calendar-event" style="--event:${platformColor(byDay[d].platform)}"><strong>${byDay[d].platform}</strong><br>${escapeHtml(byDay[d].title).slice(0,42)}…</div>` : ""}` : ""}</div>`).join("")}</div></article>`;
  }

  function publishingPage() {
    const items = state.content.filter(x => ["Approved","Scheduled"].includes(x.status));
    return `${head("PUBLISHING", "Publishing Queue", "Xem nội dung sẵn sàng đăng và lịch phát hành sắp tới.", `<button class="button primary" data-action="add-content">＋ Thêm vào hàng chờ</button>`)}
      <article class="card">${items.length ? `<div class="table-wrap"><table><thead><tr><th>Nội dung</th><th>Nền tảng</th><th>Kênh</th><th>Trạng thái</th><th>Phụ trách</th><th>Thời gian</th><th></th></tr></thead><tbody>${contentRows(items)}</tbody></table></div>` : `<div class="empty-state"><div><span>↗</span><h3>Hàng chờ đang trống</h3><p>Nội dung được duyệt sẽ tự động xuất hiện tại đây.</p></div></div>`}</article>`;
  }

  function publishedPage() {
    const items = state.content.filter(x => x.status === "Published");
    return `${head("POST-PUBLISH TRACKING", "Published Content", "Liên kết bài đăng và tự động theo dõi hiệu suất sau xuất bản.", `<button class="button secondary" data-action="sync">↻ Sync Now</button><button class="button primary" data-action="add-link">＋ Add Published Link</button>`)}
      <div class="stats-grid">${stat("PUBLISHED POSTS", items.length, "+2 tuần này", "✓", "#e8f8f1", "#1fab75")}${stat("TOTAL VIEWS", format(items.reduce((s,x)=>s+x.views,0)), "+19.6%", "◉", "#eaf2ff", "#3b82f6")}${stat("AVG. RETENTION", `${Math.round(items.reduce((s,x)=>s+x.retention,0)/(items.length||1))}%`, "+5.1%", "◷", "#f0edff", "#7357e8")}${stat("HIGH PERFORMERS", items.filter(x=>x.score>=85).length, "Score ≥ 85", "↥", "#fff0ef", "#ff6b6b")}</div>
      <article class="card"><div class="table-wrap"><table><thead><tr><th>Nội dung</th><th>Nền tảng</th><th>Kênh</th><th>Trạng thái</th><th>Views</th><th>Likes</th><th>Avg. Watch</th><th>Score</th><th></th></tr></thead><tbody>${contentRows(items,true)}</tbody></table></div></article>
      <div class="helper" style="margin-top:12px">Lịch đồng bộ: 1h → 6h → 24h → 3 ngày → 7 ngày → mỗi ngày trong 30 ngày. Các chỉ số không được nền tảng hỗ trợ sẽ tự động ẩn.</div>`;
  }

  function analyticsPage() {
    const published = state.content.filter(x=>x.status==="Published");
    return `${head("INSIGHTS", "Analytics", "So sánh hiệu suất giữa các kênh, nền tảng và định dạng.", `<select class="filter"><option>30 ngày gần nhất</option><option>7 ngày gần nhất</option><option>Quý này</option></select><button class="button secondary" data-action="export">⇩ Báo cáo</button>`)}
      <div class="stats-grid">${stat("IMPRESSIONS", "3.84M", "+21.3%", "◎", "#eaf2ff", "#3b82f6")}${stat("ENGAGEMENT RATE", "6.8%", "+0.9%", "♡", "#fff0ef", "#ff6b6b")}${stat("COMPLETION RATE", "64.2%", "+4.7%", "✓", "#e8f8f1", "#1fab75")}${stat("FOLLOWERS GAINED", "+4,281", "+16.8%", "＋", "#f0edff", "#7357e8")}</div>
      <div class="dashboard-grid"><article class="card"><div class="card-head"><div><h2>Tăng trưởng lượt xem</h2><p>Views tích lũy theo ngày</p></div></div><div class="chart-shell"><svg class="line-chart" viewBox="0 0 700 180" preserveAspectRatio="none"><defs><linearGradient id="areaFill2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff6b6b" stop-opacity=".22"/><stop offset="1" stop-color="#ff6b6b" stop-opacity="0"/></linearGradient></defs><line class="chart-grid-line" x1="0" y1="20" x2="700" y2="20"/><line class="chart-grid-line" x1="0" y1="70" x2="700" y2="70"/><line class="chart-grid-line" x1="0" y1="120" x2="700" y2="120"/><line class="chart-grid-line" x1="0" y1="170" x2="700" y2="170"/><path fill="url(#areaFill2)" d="M0 160 C80 148 100 133 160 138 S270 94 330 107 S430 66 490 73 S590 44 700 28 L700 180 L0 180Z"/><path fill="none" stroke="#ff6b6b" stroke-width="3" d="M0 160 C80 148 100 133 160 138 S270 94 330 107 S430 66 490 73 S590 44 700 28"/></svg><div class="axis-labels"><span>17 Aug</span><span>22 Aug</span><span>27 Aug</span><span>01 Sep</span><span>06 Sep</span><span>11 Sep</span><span>15 Sep</span></div></div></article>
      <aside class="card"><div class="card-head"><div><h3>Top content</h3><p>Theo Performance Score</p></div></div><div class="card-body progress-list">${published.sort((a,b)=>b.score-a.score).map((x,i)=>`<div class="progress-row"><strong>${escapeHtml(x.title)}</strong><div class="progress-track"><div class="progress-fill" style="width:${x.score}%;--bar:${i?"#ff6b6b":"#7357e8"}"></div></div><span>${x.score}</span></div>`).join("")}</div></aside></div>`;
  }

  function channelsPage() {
    return `${head("DISTRIBUTION", "Channels", "Thêm, kết nối và quản lý không giới hạn số lượng kênh.", `<button class="button primary" data-action="add-channel">＋ Thêm kênh</button>`)}
      <div class="channel-grid">${state.channels.map(c=>`<article class="channel-card"><div class="channel-top"><span class="channel-logo" style="--channel:${c.color}">${c.platform.slice(0,2).toUpperCase()}</span><div><h3>${escapeHtml(c.name)}</h3><p>${c.platform} · ${escapeHtml(c.handle)}</p></div><button class="card-menu">•••</button></div><div class="channel-metrics"><div><span>Followers<strong>${format(c.followers)}</strong></span></div><div><span>Views<strong>${format(c.views)}</strong></span></div><div><span>Posts<strong>${c.posts}</strong></span></div></div><div style="margin-top:13px;display:flex;align-items:center"><span class="status ${c.active?"active":""}">${c.active?"Connected":"Paused"}</span><button class="button ghost small spacer" data-action="sync" data-channel="${c.id}">↻ Sync</button></div></article>`).join("")}</div>`;
  }

  function mediaPage() {
    const media = [
      ["psychology-hooks-v03.mp4","VIDEO · 84 MB","▶","#7357e8","#9a87f5"], ["hidden-map-thumbnail.jpg","IMAGE · 2.4 MB","◇","#f07a62","#ffb66e"], ["travel-broll-iceland.mp4","VIDEO · 218 MB","▶","#1f9d85","#73c5aa"], ["brand-template-reels.psd","DESIGN · 46 MB","Ps","#3b82f6","#77a7f4"], ["voiceover-episode-42.wav","AUDIO · 18 MB","♫","#d9468d","#ed87b7"], ["storyboard-compass.pdf","DOCUMENT · 3.1 MB","▤","#24324e","#697795"]
    ];
    return `${head("ASSETS", "Media Library", "Tập trung video, hình ảnh, âm thanh và tài liệu sản xuất.", `<button class="button secondary">＋ Tạo thư mục</button><button class="button primary">⇧ Tải lên</button>`)}
      <div class="toolbar"><select class="filter"><option>Tất cả định dạng</option><option>Video</option><option>Image</option><option>Audio</option></select><span class="spacer"></span><span class="helper">6 files · 372 MB</span></div><div class="media-grid">${media.map(x=>`<article class="media-card"><div class="media-preview" style="--media1:${x[3]};--media2:${x[4]}">${x[2]}</div><div class="media-info"><strong>${x[0]}</strong><span>${x[1]}</span></div></article>`).join("")}</div>`;
  }

  function automationsPage() {
    return `${head("WORKFLOWS", "Automations", "Tạo quy tắc Trigger → Condition → Action cho quy trình nội dung.", `<button class="button primary" data-action="add-automation">＋ Tạo automation</button>`)}
      <div class="automation-grid">${state.automations.map(a=>`<article class="automation-card"><span class="automation-icon">${a.icon}</span><div><h3>${escapeHtml(a.title)}</h3><p>${escapeHtml(a.description)}</p></div><button class="switch ${a.enabled?"on":""}" data-toggle-automation="${a.id}" aria-label="Bật hoặc tắt ${escapeHtml(a.title)}"></button></article>`).join("")}</div>
      <article class="card" style="margin-top:18px"><div class="card-head"><div><h2>Lịch đồng bộ đề xuất</h2><p>Tối ưu giới hạn API trong 30 ngày đầu</p></div></div><div class="card-body"><div class="progress-list"><div class="progress-row"><strong>1 giờ</strong><div class="progress-track"><div class="progress-fill" style="width:100%;--bar:#ff6b6b"></div></div><span>Sync</span></div><div class="progress-row"><strong>6 giờ</strong><div class="progress-track"><div class="progress-fill" style="width:86%;--bar:#f2a83b"></div></div><span>Sync</span></div><div class="progress-row"><strong>24 giờ</strong><div class="progress-track"><div class="progress-fill" style="width:70%;--bar:#7357e8"></div></div><span>Sync</span></div><div class="progress-row"><strong>3–30 ngày</strong><div class="progress-track"><div class="progress-fill" style="width:48%;--bar:#3b82f6"></div></div><span>Daily</span></div></div></div></article>`;
  }

  function teamPage() {
    return `${head("ACCESS CONTROL", "Team", "Mời thành viên bằng Gmail và phân quyền theo vai trò, kênh.", `<button class="button primary" data-action="invite">＋ Mời thành viên</button>`)}
      <div class="team-grid">${state.team.map(u=>`<article class="team-card"><div class="team-top"><span class="avatar" style="width:42px;height:42px;--avatar:${u.color}">${u.initials}</span><div><h3>${escapeHtml(u.name)}</h3><p>${escapeHtml(u.email)}</p></div><button class="card-menu">•••</button></div><div style="display:flex;align-items:center;margin-top:15px;padding-top:13px;border-top:1px solid var(--line)"><span class="status active">${u.status}</span><span class="tag spacer">${u.role}</span></div></article>`).join("")}</div>`;
  }

  function settingsPage() {
    return `${head("CONFIGURATION", "Settings", "Quản lý workspace, tích hợp và quyền sở hữu dữ liệu.", `<button class="button primary" data-action="save-settings">Lưu thay đổi</button>`)}
      <div class="settings-layout"><aside class="card settings-nav"><button class="active">Workspace</button><button>Integrations</button><button>Roles & permissions</button><button>Content fields</button><button>Notifications</button><button>Data & export</button></aside>
      <section class="stack"><article class="card"><div class="card-head"><div><h2>Workspace profile</h2><p>Thông tin hiển thị chung</p></div></div><div class="card-body form-grid"><div class="field"><label>Tên workspace</label><input value="${escapeHtml(window.CONTENTOPS_CONFIG?.workspaceName || "Thanh Tam Studio")}"></div><div class="field"><label>Múi giờ</label><select><option>Asia/Ho_Chi_Minh (GMT+7)</option><option>UTC</option></select></div><div class="field full"><label>Mô tả</label><textarea>Quản lý toàn bộ hoạt động content marketing và social channels.</textarea></div></div></article>
      <article class="card"><div class="card-head"><div><h2>Platform integrations</h2><p>Kết nối OAuth, CMS và API để đồng bộ dữ liệu</p></div></div><div class="card-body integration-list">${[["YT","YouTube","Upload, schedule & analytics","#ff4b55"],["TT","TikTok","Content Posting API","#12182a"],["IG","Instagram","Reels publishing & insights","#d9468d"],["FB","Facebook","Pages publishing & insights","#3478f6"],["SB","Supabase","Database, auth & storage","#1fab75"],["GH","GitHub","Source control & Pages deploy","#24292f"],["PC","Pages CMS","Edit configuration and seed content","#7357e8"]].map(x=>`<div class="integration"><span style="--integration:${x[3]}">${x[0]}</span><div><strong>${x[1]}</strong><small>${x[2]}</small></div><button class="button secondary small" data-connect="${x[1]}">${x[1]==="Supabase" && state.live ? "Connected" : x[1]==="Pages CMS" ? "Open CMS" : "Connect"}</button></div>`).join("")}</div></article></section></div>`;
  }

  const pages = { overview: overviewPage, content: contentPage, calendar: calendarPage, board: boardPage, publishing: publishingPage, published: publishedPage, analytics: analyticsPage, channels: channelsPage, media: mediaPage, automations: automationsPage, team: teamPage, settings: settingsPage };

  function render() {
    if (!pages[state.route]) state.route = "overview";
    renderNav();
    page.innerHTML = pages[state.route]();
    bindPageEvents();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function formFields(fields) {
    return `<div class="form-grid">${fields.map(f=>`<div class="field ${f.full?"full":""}"><label for="${f.name}">${f.label}</label>${f.type === "select" ? `<select id="${f.name}" name="${f.name}" required>${f.options.map(o=>`<option>${o}</option>`).join("")}</select>` : f.type === "textarea" ? `<textarea id="${f.name}" name="${f.name}" ${f.required?"required":""} placeholder="${f.placeholder||""}"></textarea>` : `<input id="${f.name}" name="${f.name}" type="${f.type||"text"}" ${f.required?"required":""} placeholder="${f.placeholder||""} value="${f.value||""}">`}${f.help?`<span class="helper">${f.help}</span>`:""}</div>`).join("")}</div>`;
  }
  function openDialog(kind) {
    const title = document.getElementById("dialogTitle");
    const eyebrow = document.getElementById("dialogEyebrow");
    const body = document.getElementById("dialogBody");
    const submit = document.getElementById("dialogSubmit");
    dialogForm.dataset.kind = kind;
    if (kind === "content") {
      eyebrow.textContent = "CONTENT"; title.textContent = "Tạo nội dung mới"; submit.textContent = "Tạo nội dung";
      body.innerHTML = formFields([{name:"title",label:"Tiêu đề",required:true,full:true,placeholder:"Nhập ý tưởng hoặc tiêu đề"},{name:"channel",label:"Kênh",type:"select",options:state.channels.map(x=>x.name)},{name:"platform",label:"Nền tảng",type:"select",options:["YouTube","TikTok","Instagram","Facebook"]},{name:"status",label:"Trạng thái",type:"select",options:["Idea","Script","Editing","Review","Approved","Scheduled"]},{name:"date",label:"Deadline",type:"date",required:true,value:"2026-09-20"},{name:"owner",label:"Người phụ trách",type:"select",options:state.team.map(x=>x.name)},{name:"type",label:"Content pillar",placeholder:"Psychology, Travel…"}]);
    } else if (kind === "channel") {
      eyebrow.textContent = "CHANNEL"; title.textContent = "Thêm kênh mới"; submit.textContent = "Thêm kênh";
      body.innerHTML = formFields([{name:"name",label:"Tên kênh",required:true,placeholder:"Ví dụ: PsychToonsHQ"},{name:"platform",label:"Nền tảng",type:"select",options:["YouTube","TikTok","Instagram","Facebook"]},{name:"handle",label:"Handle hoặc URL",required:true,full:true,placeholder:"@channel hoặc https://…"}]);
    } else if (kind === "link") {
      eyebrow.textContent = "POST-PUBLISH TRACKING"; title.textContent = "Add Published Link"; submit.textContent = "Lưu và đồng bộ";
      body.innerHTML = formFields([{name:"contentId",label:"Nội dung gốc",type:"select",full:true,options:state.content.map(x=>x.title)},{name:"url",label:"Link bài đăng",type:"url",required:true,full:true,placeholder:"https://youtube.com/shorts/…",help:"Hệ thống sẽ nhận diện nền tảng và Post/Video ID."},{name:"publishedAt",label:"Thời gian đăng",type:"datetime-local",required:true},{name:"status",label:"Trạng thái",type:"select",options:["Published","Scheduled"]}]);
    } else if (kind === "invite") {
      eyebrow.textContent = "TEAM ACCESS"; title.textContent = "Mời thành viên"; submit.textContent = "Gửi lời mời";
      body.innerHTML = formFields([{name:"email",label:"Địa chỉ Gmail",type:"email",required:true,full:true,placeholder:"name@gmail.com"},{name:"role",label:"Vai trò",type:"select",options:["Admin","Content Manager","Scriptwriter","Editor","Reviewer","Viewer"]},{name:"channel",label:"Quyền theo kênh",type:"select",options:["Tất cả kênh",...state.channels.map(x=>x.name)]}]);
    } else {
      eyebrow.textContent = "AUTOMATION"; title.textContent = "Tạo automation"; submit.textContent = "Tạo quy tắc";
      body.innerHTML = formFields([{name:"title",label:"Tên automation",required:true,full:true,placeholder:"Ví dụ: Approved → Publishing Queue"},{name:"trigger",label:"Khi",type:"select",options:["Trạng thái thay đổi","Bài đăng thành công","Đến deadline","Metrics được cập nhật"]},{name:"condition",label:"Nếu",type:"select",options:["Mọi nội dung","Views > trung bình 50%","Retention < 35%","Performance Score > 85"]},{name:"action",label:"Thực hiện",type:"select",full:true,options:["Chuyển trạng thái","Gửi thông báo","Tạo nhiệm vụ mới","Đồng bộ metrics","Gửi email report"]}]);
    }
    dialog.showModal();
  }

  function detectPlatform(url) {
    if (/youtu\.be|youtube\.com/i.test(url)) return "YouTube";
    if (/tiktok\.com/i.test(url)) return "TikTok";
    if (/instagram\.com/i.test(url)) return "Instagram";
    if (/facebook\.com|fb\.watch/i.test(url)) return "Facebook";
    return "Other";
  }

  async function syncMetrics() {
    const buttons = document.querySelectorAll('[data-action="sync"]');
    buttons.forEach(b=>{ b.disabled=true; b.textContent="↻ Đang đồng bộ…"; });
    if (state.live) {
      try {
        const { error } = await db.functions.invoke("sync-metrics", { body: { workspaceId } });
        if (error) throw error;
        await loadLiveData();
        toast("Đã đồng bộ số liệu mới nhất.", "success");
      } catch (_) { toast("Chưa thể đồng bộ. Hãy kiểm tra kết nối API.", "warning"); }
    } else {
      await new Promise(resolve=>setTimeout(resolve,650));
      state.content.filter(x=>x.status==="Published").forEach(x=>{ x.views=Math.round(x.views*1.012); x.likes=Math.round(x.likes*1.008); x.score=Math.min(99,x.score+1); });
      persist(); toast("Đã chạy mô phỏng đồng bộ. Kết nối Supabase để dùng dữ liệu thật.", "success");
    }
    render();
  }

  function exportCsv() {
    const header = ["Title","Platform","Channel","Status","Owner","Date","Views","Likes","Avg Watch","Score","URL"];
    const rows = state.content.map(x=>[x.title,x.platform,x.channel,x.status,x.owner,x.date,x.views,x.likes,x.avgWatch,x.score,x.url]);
    const csv = [header,...rows].map(row=>row.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\n");
    const link = document.createElement("a"); link.href=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv"})); link.download="contentops-report.csv"; link.click(); URL.revokeObjectURL(link.href);
    toast("Đã xuất báo cáo CSV.", "success");
  }

  function bindPageEvents() {
    page.querySelectorAll("[data-action]").forEach(button => button.addEventListener("click", () => {
      const action = button.dataset.action;
      if (action === "add-content") openDialog("content");
      else if (action === "add-channel") openDialog("channel");
      else if (action === "add-link") openDialog("link");
      else if (action === "invite") openDialog("invite");
      else if (action === "add-automation") openDialog("automation");
      else if (action === "sync") syncMetrics();
      else if (action === "export") exportCsv();
      else if (action === "save-settings") toast("Đã lưu cài đặt workspace.", "success");
    }));
    page.querySelectorAll("[data-route-link]").forEach(b=>b.addEventListener("click",()=>location.hash=b.dataset.routeLink));
    page.querySelectorAll("[data-toggle-automation]").forEach(b=>b.addEventListener("click",()=>{ const item=state.automations.find(x=>x.id===b.dataset.toggleAutomation); item.enabled=!item.enabled; persist(); render(); toast(item.enabled?"Đã bật automation.":"Đã tắt automation.","success"); }));
    page.querySelectorAll("[data-connect]").forEach(b=>b.addEventListener("click",()=>{ if(b.dataset.connect==="Pages CMS") window.open(window.CONTENTOPS_CONFIG.pagesCmsUrl,"_blank","noopener"); else toast(`Cần thêm thông tin OAuth/API cho ${b.dataset.connect}.`,"warning"); }));
    const filter = document.getElementById("statusFilter"); if (filter) filter.addEventListener("change",()=>{ state.filter=filter.value; render(); });
  }

  dialogForm.addEventListener("submit", async event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(dialogForm));
    const kind = dialogForm.dataset.kind;
    if (kind === "content") {
      if (state.live) {
        const channel = state.channels.find(x=>x.name===data.channel);
        const { error } = await db.from("content_items").insert({ workspace_id:workspaceId,title:data.title,content_pillar:data.type||"General",status:data.status.toLowerCase(),due_date:data.date,owner_name:data.owner,primary_channel_id:channel?.id||null,primary_platform:data.platform,created_by:currentUser.id });
        if (error) { toast(error.message,"warning"); return; }
      } else state.content.unshift({ id:`ct${Date.now()}`, title:data.title, channel:data.channel, platform:data.platform, status:data.status, date:data.date, owner:data.owner, type:data.type||"General", views:0, likes:0, comments:0, shares:0, saves:0, avgWatch:"—", retention:0, score:0, url:"" });
      toast("Đã tạo nội dung mới.", "success");
    } else if (kind === "channel") {
      if (state.live) {
        const { error } = await db.from("channels").insert({ workspace_id:workspaceId,name:data.name,platform:data.platform,handle:data.handle,channel_url:data.handle.startsWith("http")?data.handle:null,color:platformColor(data.platform) });
        if (error) { toast(error.message,"warning"); return; }
      } else state.channels.push({ id:`ch${Date.now()}`, name:data.name, platform:data.platform, handle:data.handle, followers:0, views:0, posts:0, color:platformColor(data.platform), active:true });
      toast("Đã thêm kênh mới.", "success");
    } else if (kind === "link") {
      const item = state.content.find(x=>x.title===data.contentId); const platform=detectPlatform(data.url);
      if (state.live && item) {
        const channel = state.channels.find(x=>x.name===item.channel);
        const externalId = platform === "YouTube" ? (data.url.match(/(?:youtu\.be\/|shorts\/|watch\?v=|embed\/)([\w-]{6,})/i)?.[1]||null) : (data.url.match(/(?:video\/|reel\/|p\/)([\w-]+)/i)?.[1]||null);
        const { error } = await db.from("published_posts").insert({ workspace_id:workspaceId,content_id:item.id,channel_id:channel?.id||null,platform,post_url:data.url,external_post_id:externalId,status:data.status.toLowerCase(),published_at:data.publishedAt||new Date().toISOString(),next_sync_at:new Date().toISOString() });
        if (error) { toast(error.message,"warning"); return; }
        await db.from("content_items").update({ status:data.status.toLowerCase() }).eq("id",item.id);
      } else if (item) { item.url=data.url; item.platform=platform; item.status=data.status; item.date=(data.publishedAt||"").slice(0,10)||item.date; }
      toast(`Đã nhận diện ${platform} và lưu link bài đăng.`, "success");
    } else if (kind === "invite") {
      if (state.live) {
        const { error } = await db.functions.invoke("invite-member", { body:{ workspaceId,email:data.email,role:data.role.toLowerCase().replace(/ /g,"_"),redirectTo:location.href.split("#")[0] } });
        if (error) { toast(error.message,"warning"); return; }
      } else state.team.push({ id:`u${Date.now()}`, name:data.email.split("@")[0], email:data.email, role:data.role, initials:data.email.slice(0,2).toUpperCase(), color:"#7357e8", status:"Invited" });
      toast(`Đã tạo lời mời cho ${data.email}.`, "success");
    } else {
      if (state.live) {
        const { error } = await db.from("automations").insert({ workspace_id:workspaceId,title:data.title,trigger_type:data.trigger,conditions:{ label:data.condition },actions:[{ type:data.action }],enabled:true,created_by:currentUser.id });
        if (error) { toast(error.message,"warning"); return; }
      } else state.automations.push({ id:`a${Date.now()}`, title:data.title, description:`Khi ${data.trigger}, nếu ${data.condition}, hệ thống sẽ ${data.action}.`, icon:"ϟ", enabled:true });
      toast("Đã tạo automation.", "success");
    }
    persist(); dialog.close();
    if (state.live) await loadLiveData();
    render();
  });

  document.getElementById("menuToggle").addEventListener("click",()=>document.getElementById("sidebar").classList.add("open"));
  document.getElementById("mobileClose").addEventListener("click",()=>document.getElementById("sidebar").classList.remove("open"));
  document.querySelector(".dialog-close").addEventListener("click",()=>dialog.close());
  document.querySelector(".dialog-cancel").addEventListener("click",()=>dialog.close());
  document.getElementById("globalSearch").addEventListener("input",e=>{ state.search=e.target.value.trim().toLowerCase(); if(state.route!=="content") location.hash="content"; else render(); });
  document.getElementById("profileButton").addEventListener("click", async ()=>{ if(state.live && db && confirm("Đăng xuất khỏi TPLabs ContentOps?")){ await db.auth.signOut(); location.reload(); } });
  document.addEventListener("keydown",e=>{ if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();document.getElementById("globalSearch").focus();} });
  window.addEventListener("hashchange",()=>{ state.route=location.hash.replace("#","")||"overview"; render(); });
  function registerWebMcpTools() {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const register = tool => { try { void Promise.resolve(context.registerTool(tool)).catch(console.error); } catch (error) { console.error(error); } };
    register({ name:"navigate_tplabs", title:"Mở khu vực TPLabs", description:"Đi tới một khu vực quản trị trong TPLabs ContentOps.", inputSchema:{ type:"object", properties:{ route:{ type:"string", enum:Object.keys(pages) } }, required:["route"], additionalProperties:false }, annotations:{ readOnlyHint:true, untrustedContentHint:false }, execute(input){ if(!pages[input.route]) throw new Error("Invalid route"); location.hash=input.route; return { route:input.route }; } });
    register({ name:"create_content_item", title:"Tạo nội dung", description:"Tạo một nội dung mới trong workspace hiện tại và cập nhật giao diện.", inputSchema:{ type:"object", properties:{ title:{type:"string"}, channel:{type:"string"}, platform:{type:"string"}, dueDate:{type:"string"}, owner:{type:"string"} }, required:["title","channel","platform","dueDate","owner"], additionalProperties:false }, annotations:{ readOnlyHint:false, untrustedContentHint:false }, async execute(input){ if(!input.title.trim()) throw new Error("Title is required"); const item={ id:`ct${Date.now()}`,title:input.title,channel:input.channel,platform:input.platform,status:"Idea",date:input.dueDate,owner:input.owner,type:"General",views:0,likes:0,comments:0,shares:0,saves:0,avgWatch:"—",retention:0,score:0,url:"" }; if(state.live){ const channel=state.channels.find(x=>x.name===input.channel); const {data,error}=await db.from("content_items").insert({workspace_id:workspaceId,title:item.title,status:"idea",due_date:item.date,owner_name:item.owner,primary_channel_id:channel?.id||null,primary_platform:item.platform,created_by:currentUser.id}).select().single(); if(error) throw error; item.id=data.id; await loadLiveData(); } else { state.content.unshift(item); persist(); } render(); return { id:item.id,status:"Idea" }; } });
    register({ name:"sync_published_metrics", title:"Đồng bộ số liệu", description:"Chạy đồng bộ số liệu cho các bài đã đăng đến hạn cập nhật.", inputSchema:{type:"object",properties:{},additionalProperties:false}, annotations:{readOnlyHint:false,untrustedContentHint:true}, async execute(){ await syncMetrics(); return { status:"completed", mode:state.live?"live":"demo" }; } });
  }

  registerWebMcpTools();
  loadData();
})();
