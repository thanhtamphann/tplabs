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

  const emptyWorkspace = { channels: [], content: [], team: [], automations: [], media: [] };

  const localMode = true;
  const LOCAL_STORAGE_KEY = "tplabs_local_workspace_v1";

  const state = {
    route: location.hash.replace("#", "") || "overview",
    channels: [], content: [], team: [], automations: [], media: [],
    filter: "all", search: "", role: null, authenticated: false,
    live: false
  };

  let db = null;
  let currentUser = null;
  let workspaceId = null;

  const permissions = {
    owner: new Set(["create", "update", "delete", "publish", "sync", "invite", "manage_team", "settings"]),
    admin: new Set(["create", "update", "delete", "publish", "sync", "invite", "manage_team"]),
    content_manager: new Set(["create", "update", "publish", "sync"]),
    scriptwriter: new Set(["create", "update"]),
    editor: new Set(["update"]),
    reviewer: new Set(["update"]),
    viewer: new Set([])
  };

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
  function authErrorMessage(error) {
    const code = String(error?.code || "").toLowerCase();
    const message = String(error?.message || "");
    if (code === "over_email_send_rate_limit" || /email.*rate limit|rate limit.*email/i.test(message)) {
      return "Đã hết giới hạn 2 email đăng nhập mỗi giờ của Supabase Free. Vui lòng chờ khoảng 30–60 phút rồi chỉ bấm gửi một lần.";
    }
    if (code === "email_address_not_authorized" || /email address not authorized/i.test(message)) {
      return "Gmail này chưa được Supabase cho phép nhận email. Hãy dùng đúng Gmail Owner đã đăng ký.";
    }
    return message || "Không thể gửi liên kết đăng nhập. Vui lòng thử lại sau.";
  }
  function persist() {
    if (!localMode) return;
    const payload = {
      channels: state.channels,
      content: state.content,
      team: state.team,
      automations: state.automations,
      media: state.media,
      workspaceName: window.CONTENTOPS_CONFIG.workspaceName || "TPLabs"
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
  }

  function localId(prefix) {
    const id = globalThis.crypto?.randomUUID?.() || (Date.now().toString(36) + Math.random().toString(36).slice(2));
    return `${prefix}-${id}`;
  }

  function loadLocalData() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "null"); } catch (_) {}
    state.channels = Array.isArray(saved?.channels) ? saved.channels : [];
    state.content = Array.isArray(saved?.content) ? saved.content : [];
    state.automations = Array.isArray(saved?.automations) ? saved.automations : [];
    state.media = Array.isArray(saved?.media) ? saved.media : [];
    state.team = Array.isArray(saved?.team) && saved.team.length ? saved.team : [{
      id: "local-owner",
      name: "TPLabs Owner",
      email: "Local Owner",
      role: "Owner",
      initials: "TP",
      color: "#7357e8",
      status: "Active"
    }];
    if (saved?.workspaceName) window.CONTENTOPS_CONFIG.workspaceName = saved.workspaceName;
    workspaceId = "local-workspace";
    currentUser = { id: "local-owner", email: "Local Owner", user_metadata: { full_name: "TPLabs Owner" } };
    state.role = "owner";
    state.authenticated = true;
    state.live = false;
    setAuthLocked(false);
    document.querySelector("#profileButton strong").textContent = "TPLabs Owner";
    document.querySelector("#profileButton small").textContent = "Owner · Local";
    document.querySelector(".workspace-card strong").textContent = window.CONTENTOPS_CONFIG.workspaceName || "TPLabs";
  }
  function can(action) {
    return permissions[state.role]?.has(action) || false;
  }
  function requirePermission(action) {
    if (can(action)) return true;
    toast("Tài khoản này không có quyền thực hiện thao tác.", "warning");
    return false;
  }
  function setAuthLocked(locked) {
    document.body.classList.toggle("auth-locked", locked);
    if (locked) nav.innerHTML = "";
  }
  function renderAccessScreen(kind, detail = "") {
    setAuthLocked(true);
    const screens = {
      setup: ["TPLabs đang ở chế độ riêng tư", "Database bảo mật đang chờ hoàn tất kết nối. Không có nội dung nào được tải hoặc lưu công khai.", ""],
      login: ["Đăng nhập TPLabs", "Chỉ Gmail đã được Owner cấp quyền mới có thể truy cập nội dung.", '<form id="emailLoginForm" class="email-login"><input id="loginEmail" type="email" inputmode="email" autocomplete="email" placeholder="yourname@gmail.com" required><button class="button primary google-button" id="emailLoginButton" type="submit">Gửi link đăng nhập</button><p id="loginFeedback" class="login-feedback" aria-live="polite"></p></form>'],
      denied: ["Tài khoản chưa được cấp quyền", `Gmail ${escapeHtml(detail)} không nằm trong danh sách truy cập của TPLabs.`, '<button class="button secondary google-button" id="signOutDenied">Đăng xuất</button>'],
      error: ["Không thể mở workspace", detail || "TPLabs chưa kết nối được database. Nếu Supabase vừa được khôi phục, hãy đợi hệ thống bật lại rồi bấm Thử lại.", '<button class="button secondary google-button" id="retryLoad">Thử lại</button>']
    };
    const [title, message, action] = screens[kind];
    page.innerHTML = `<div class="auth-gate"><article class="auth-card"><div class="auth-logo">TP</div><span class="eyebrow">PRIVATE CONTENT HUB</span><h1>${title}</h1><p>${message}</p>${action}<div class="privacy-note">🔒 Dữ liệu được bảo vệ bằng liên kết đăng nhập Gmail, danh sách tài khoản cho phép và Row Level Security.</div></article></div>`;
    document.getElementById("emailLoginForm")?.addEventListener("submit", async event => {
      event.preventDefault();
      const input = document.getElementById("loginEmail");
      const button = document.getElementById("emailLoginButton");
      const feedback = document.getElementById("loginFeedback");
      const email = input.value.trim().toLowerCase();
      if (!confirm(`Gửi link đăng nhập đến:\n${email}\n\nHãy kiểm tra kỹ địa chỉ Gmail trước khi tiếp tục.`)) return;
      button.disabled = true;
      button.textContent = "Đang gửi…";
      const { error } = await db.auth.signInWithOtp({ email, options: { emailRedirectTo: "https://thanhtamphann.github.io/tplabs/", shouldCreateUser: true } });
      const friendlyError = error ? authErrorMessage(error) : "";
      const rateLimited = error && friendlyError.includes("2 email đăng nhập mỗi giờ");
      button.disabled = Boolean(rateLimited);
      button.textContent = rateLimited ? "Hãy thử lại sau 30–60 phút" : error ? "Thử gửi lại" : "Gửi lại link";
      feedback.className = `login-feedback ${error ? "error" : "success"}`;
      feedback.innerHTML = error
        ? `Không gửi được: ${escapeHtml(friendlyError)}`
        : `Đã gửi đến <strong>${escapeHtml(email)}</strong>. Hãy kiểm tra Hộp thư đến và Spam, sau đó mở link trên cùng thiết bị này.`;
      toast(error ? friendlyError : `Đã gửi link đến ${email}.`, error ? "warning" : "success");
    });
    document.getElementById("signOutDenied")?.addEventListener("click", async () => { await db.auth.signOut(); location.reload(); });
    document.getElementById("retryLoad")?.addEventListener("click", () => location.reload());
  }
  function renderLogin() {
    renderAccessScreen("login");
  }
  async function loadLiveData() {
    db = window.supabase.createClient(window.CONTENTOPS_CONFIG.supabaseUrl, window.CONTENTOPS_CONFIG.supabaseAnonKey);
    const { data: authData, error: authError } = await db.auth.getSession();
    if (authError) throw authError;
    if (!authData.session) { renderLogin(); return false; }
    currentUser = authData.session.user;
    const { data: memberships, error: membershipError } = await db.from("workspace_members").select("workspace_id,role,display_name,email,status").eq("status", "active").limit(1);
    if (membershipError) throw membershipError;
    if (!memberships?.length) {
      renderAccessScreen("denied", currentUser.email || "này");
      return false;
    }
    workspaceId = memberships[0].workspace_id;
    state.role = memberships[0].role;
    state.authenticated = true;
    const [channelsRes, contentRes, postsRes, membersRes, automationsRes, mediaRes] = await Promise.all([
      db.from("channels").select("*").eq("workspace_id", workspaceId).order("created_at"),
      db.from("content_items").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }),
      db.from("published_posts").select("*,content_items(title,content_pillar,owner_name,due_date),channels(name)").eq("workspace_id", workspaceId).order("published_at", { ascending: false }),
      db.from("workspace_members").select("*").eq("workspace_id", workspaceId),
      db.from("automations").select("*").eq("workspace_id", workspaceId).order("created_at"),
      db.from("media_assets").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false })
    ]);
    const errors = [channelsRes, contentRes, postsRes, membersRes, automationsRes, mediaRes].map(x=>x.error).filter(Boolean);
    if (errors.length) throw errors[0];
    state.channels = (channelsRes.data || []).map(x=>({ id:x.id,name:x.name,platform:x.platform,handle:x.handle||x.channel_url||"",followers:Number(x.followers||0),views:Number(x.total_views||0),posts:Number(x.post_count||0),color:x.color||platformColor(x.platform),active:x.active }));
    const publishedIds = new Set((postsRes.data || []).map(x=>x.content_id));
    state.content = (contentRes.data || []).filter(x=>!publishedIds.has(x.id)).map(x=>({ id:x.id,title:x.title,channel:state.channels.find(c=>c.id===x.primary_channel_id)?.name||"Chưa chọn",platform:x.primary_platform||"—",status:x.status[0].toUpperCase()+x.status.slice(1),date:x.due_date||"—",owner:x.owner_name||"Chưa giao",type:x.content_pillar||"General",views:0,likes:0,comments:0,shares:0,saves:0,avgWatch:"—",retention:0,score:0,url:"" }));
    state.content.unshift(...(postsRes.data || []).map(x=>({ id:x.content_id,title:x.content_items?.title||"Untitled",channel:x.channels?.name||"Chưa chọn",platform:x.platform,status:x.status[0].toUpperCase()+x.status.slice(1),date:(x.published_at||"").slice(0,10)||"—",owner:x.content_items?.owner_name||"Chưa giao",type:x.content_items?.content_pillar||"General",views:Number(x.views||0),likes:Number(x.likes||0),comments:Number(x.comments||0),shares:Number(x.shares||0),saves:Number(x.saves||0),avgWatch:x.average_watch_seconds?`${Math.floor(x.average_watch_seconds/60).toString().padStart(2,"0")}:${Math.round(x.average_watch_seconds%60).toString().padStart(2,"0")}`:"—",retention:Number(x.retention_rate||0),score:Number(x.performance_score||0),url:x.post_url,publishedPostId:x.id })));
    state.team = (membersRes.data || []).map(x=>({ id:x.user_id,name:x.display_name||x.email,email:x.email,role:x.role.split("_").map(y=>y[0].toUpperCase()+y.slice(1)).join(" "),initials:(x.display_name||x.email).split(/\s+/).map(y=>y[0]).slice(-2).join("").toUpperCase(),color:"#7357e8",status:x.status[0].toUpperCase()+x.status.slice(1) }));
    state.automations = (automationsRes.data || []).map(x=>({ id:x.id,title:x.title,description:`Trigger: ${x.trigger_type}`,icon:"ϟ",enabled:x.enabled }));
    state.media = (mediaRes.data || []).map(x=>({ id:x.id,name:x.file_name,url:x.storage_path,type:x.mime_type||"Link",size:Number(x.size_bytes||0) }));
    setAuthLocked(false);
    const displayName = memberships[0].display_name || currentUser.user_metadata?.full_name || currentUser.email;
    document.querySelector("#profileButton strong").textContent = displayName;
    document.querySelector("#profileButton small").textContent = state.role === "owner" ? "Owner" : state.role;
    return true;
  }
  async function loadData() {
    try {
      const publicSettings = await fetch("data/site.json", { cache: "no-store" }).then(response => response.ok ? response.json() : null);
      if (publicSettings?.workspaceName) {
        window.CONTENTOPS_CONFIG.workspaceName = publicSettings.workspaceName;
        document.querySelector(".workspace-card strong").textContent = publicSettings.workspaceName;
      }
    } catch (_) { /* Giữ cấu hình mặc định nếu Pages CMS chưa có dữ liệu. */ }
    if (localMode) {
      loadLocalData();
      document.getElementById("modeBadge").textContent = "Local Owner";
      document.getElementById("modeBadge").style.background = "var(--green-soft)";
      render();
      return;
    }
    if (state.live && window.supabase) {
      try {
        const ready = await loadLiveData();
        document.getElementById("modeBadge").textContent = "Live sync";
        document.getElementById("modeBadge").style.background = "var(--green-soft)";
        if (ready) render();
        return;
      } catch (error) {
        console.error(error);
        const message = String(error?.message || "");
        const backendUnavailable = /failed to fetch|network|fetch|connection|econn|unavailable/i.test(message);
        renderAccessScreen(
          "error",
          backendUnavailable
            ? "Database TPLabs đang tạm ngưng hoặc đang khởi động lại. Bấm “Thử lại” sau khi Supabase hoạt động trở lại."
            : "Không thể tải dữ liệu TPLabs. Vui lòng kiểm tra cấu hình đăng nhập hoặc kết nối Supabase rồi thử lại."
        );
        return;
      }
    }
    Object.assign(state, emptyWorkspace);
    document.getElementById("modeBadge").textContent = "Private";
    renderAccessScreen("setup");
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
      <td><div class="inline-actions">${can("update") ? `<button class="button ghost small" data-edit-content="${item.id}">Sửa</button>` : ""}${can("delete") ? `<button class="button ghost small danger" data-delete-content="${item.id}">Xóa</button>` : ""}</div></td>
    </tr>`).join("");
  }

  function overviewPage() {
    const published = state.content.filter(x => x.status === "Published");
    const totalViews = published.reduce((sum, x) => sum + Number(x.views || 0), 0);
    const totalLikes = published.reduce((sum, x) => sum + Number(x.likes || 0), 0);
    const ownerName = currentUser?.user_metadata?.full_name || "Owner";
    return `${head("WORKSPACE OVERVIEW", `Xin chào, ${escapeHtml(ownerName)}`, "Tổng quan hoạt động nội dung trong 30 ngày gần nhất.", `<button class="button secondary" data-action="export">⇩ Xuất báo cáo</button>${can("create") ? '<button class="button primary" data-action="add-content">＋ Nội dung mới</button>' : ""}`)}
      <div class="stats-grid">
        ${stat("TOTAL VIEWS", format(totalViews), "Dữ liệu đã đồng bộ", "◉", "#eaf2ff", "#3b82f6")}
        ${stat("ENGAGEMENT", format(totalLikes), "Dữ liệu đã đồng bộ", "♡", "#fff0ef", "#ff6b6b")}
        ${stat("AVG. WATCH TIME", published.length ? published[0].avgWatch : "—", "Theo bài đăng", "◷", "#f0edff", "#7357e8")}
        ${stat("PUBLISHED", published.length, "Tổng bài đã đăng", "✓", "#e8f8f1", "#1fab75")}
      </div>
      <div class="dashboard-grid">
        <div class="stack">
          <article class="card"><div class="card-head"><div><h2>Hiệu suất nội dung</h2><p>Views theo ngày trên tất cả nền tảng</p></div><div class="head-actions"><div class="legend"><span>Views</span><span>Tương tác</span></div><select class="filter"><option>30 ngày</option><option>7 ngày</option></select></div></div>
            <div class="chart-shell"><div class="chart-summary"><div><span>Tổng lượt xem<strong>${format(totalViews)}</strong></span></div><div><span>Tổng tương tác<strong>${format(totalLikes)}</strong></span></div></div>
            <svg class="line-chart" viewBox="0 0 700 180" preserveAspectRatio="none" aria-label="Biểu đồ lượt xem"><defs><linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7357e8" stop-opacity=".24"/><stop offset="1" stop-color="#7357e8" stop-opacity="0"/></linearGradient></defs>
              <line class="chart-grid-line" x1="0" y1="20" x2="700" y2="20"/><line class="chart-grid-line" x1="0" y1="70" x2="700" y2="70"/><line class="chart-grid-line" x1="0" y1="120" x2="700" y2="120"/><line class="chart-grid-line" x1="0" y1="170" x2="700" y2="170"/>
              <path class="chart-area" d="M0 150 C55 130 65 145 115 112 S190 76 235 104 S320 121 370 78 S455 38 505 65 S595 88 700 25 L700 180 L0 180Z"/><path class="chart-line" d="M0 150 C55 130 65 145 115 112 S190 76 235 104 S320 121 370 78 S455 38 505 65 S595 88 700 25"/><circle class="chart-dot" cx="700" cy="25" r="5"/>
            </svg><div class="axis-labels"><span>17 Aug</span><span>22 Aug</span><span>27 Aug</span><span>01 Sep</span><span>06 Sep</span><span>11 Sep</span><span>15 Sep</span></div></div>
          </article>
          <article class="card"><div class="card-head"><div><h2>Nội dung gần đây</h2><p>Theo dõi tiến độ và kết quả mới nhất</p></div><div class="head-actions"><button class="button ghost small" data-route-link="content">Xem tất cả →</button></div></div><div class="table-wrap"><table><thead><tr><th>Nội dung</th><th>Nền tảng</th><th>Kênh</th><th>Trạng thái</th><th>Phụ trách</th><th>Ngày</th><th></th></tr></thead><tbody>${contentRows(state.content.slice(0,5))}</tbody></table></div></article>
        </div>
        <aside class="stack">
          <article class="card"><div class="card-head"><div><h3>Hiệu suất theo kênh</h3><p>30 ngày gần nhất</p></div></div><div class="card-body progress-list">${state.channels.slice(0,5).map((c,i) => `<div class="progress-row"><strong>${escapeHtml(c.name)}</strong><div class="progress-track"><div class="progress-fill" style="width:${92-i*11}%;--bar:${c.color}"></div></div><span>${format(c.views)}</span></div>`).join("")}</div></article>
          <article class="card"><div class="card-head"><div><h3>Quyền riêng tư</h3><p>Trạng thái truy cập workspace</p></div></div><div class="card-body activity-list"><div class="activity"><span class="activity-icon">🔒</span><p>Chỉ Gmail do Owner cấp quyền mới xem được dữ liệu.</p><time>${state.role === "owner" ? "Owner" : escapeHtml(state.role)}</time></div></div></article>
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
    const totalViews = published.reduce((sum,item)=>sum+Number(item.views||0),0);
    const totalLikes = published.reduce((sum,item)=>sum+Number(item.likes||0),0);
    const engagementRate = totalViews ? ((totalLikes/totalViews)*100).toFixed(1)+"%" : "—";
    const retention = published.length ? Math.round(published.reduce((sum,item)=>sum+Number(item.retention||0),0)/published.length)+"%" : "—";
    return `${head("INSIGHTS", "Analytics", "So sánh hiệu suất giữa các kênh, nền tảng và định dạng.", `<select class="filter"><option>30 ngày gần nhất</option><option>7 ngày gần nhất</option><option>Quý này</option></select><button class="button secondary" data-action="export">⇩ Báo cáo</button>`)}
      <div class="stats-grid">${stat("TOTAL VIEWS",format(totalViews),"Đã đồng bộ","◎","#eaf2ff","#3b82f6")}${stat("ENGAGEMENT RATE",engagementRate,"Likes / Views","♡","#fff0ef","#ff6b6b")}${stat("AVG. RETENTION",retention,"Theo nội dung","✓","#e8f8f1","#1fab75")}${stat("PUBLISHED",published.length,"Tổng bài","＋","#f0edff","#7357e8")}</div>
      <div class="dashboard-grid"><article class="card"><div class="card-head"><div><h2>Tăng trưởng lượt xem</h2><p>Views tích lũy theo ngày</p></div></div><div class="chart-shell"><svg class="line-chart" viewBox="0 0 700 180" preserveAspectRatio="none"><defs><linearGradient id="areaFill2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff6b6b" stop-opacity=".22"/><stop offset="1" stop-color="#ff6b6b" stop-opacity="0"/></linearGradient></defs><line class="chart-grid-line" x1="0" y1="20" x2="700" y2="20"/><line class="chart-grid-line" x1="0" y1="70" x2="700" y2="70"/><line class="chart-grid-line" x1="0" y1="120" x2="700" y2="120"/><line class="chart-grid-line" x1="0" y1="170" x2="700" y2="170"/><path fill="url(#areaFill2)" d="M0 160 C80 148 100 133 160 138 S270 94 330 107 S430 66 490 73 S590 44 700 28 L700 180 L0 180Z"/><path fill="none" stroke="#ff6b6b" stroke-width="3" d="M0 160 C80 148 100 133 160 138 S270 94 330 107 S430 66 490 73 S590 44 700 28"/></svg><div class="axis-labels"><span>17 Aug</span><span>22 Aug</span><span>27 Aug</span><span>01 Sep</span><span>06 Sep</span><span>11 Sep</span><span>15 Sep</span></div></div></article>
      <aside class="card"><div class="card-head"><div><h3>Top content</h3><p>Theo Performance Score</p></div></div><div class="card-body progress-list">${published.sort((a,b)=>b.score-a.score).map((x,i)=>`<div class="progress-row"><strong>${escapeHtml(x.title)}</strong><div class="progress-track"><div class="progress-fill" style="width:${x.score}%;--bar:${i?"#ff6b6b":"#7357e8"}"></div></div><span>${x.score}</span></div>`).join("")}</div></aside></div>`;
  }

  function channelsPage() {
    return `${head("DISTRIBUTION", "Channels", "Thêm, kết nối và quản lý không giới hạn số lượng kênh.", can("create") ? `<button class="button primary" data-action="add-channel">＋ Thêm kênh</button>` : "")}
      <div class="channel-grid">${state.channels.map(c=>`<article class="channel-card"><div class="channel-top"><span class="channel-logo" style="--channel:${c.color}">${c.platform.slice(0,2).toUpperCase()}</span><div><h3>${escapeHtml(c.name)}</h3><p>${c.platform} · ${escapeHtml(c.handle)}</p></div></div><div class="channel-metrics"><div><span>Followers<strong>${format(c.followers)}</strong></span></div><div><span>Views<strong>${format(c.views)}</strong></span></div><div><span>Posts<strong>${c.posts}</strong></span></div></div><div style="margin-top:13px;display:flex;align-items:center;gap:4px"><span class="status ${c.active?"active":""}">${c.active?"Connected":"Paused"}</span>${can("sync") ? `<button class="button ghost small spacer" data-action="sync" data-channel="${c.id}">↻ Sync</button>` : ""}${can("update") ? `<button class="button ghost small" data-edit-channel="${c.id}">Sửa</button>` : ""}${can("delete") ? `<button class="button ghost small danger" data-delete-channel="${c.id}">Xóa</button>` : ""}</div></article>`).join("") || '<div class="empty-state"><div><span>◉</span><h3>Chưa có kênh</h3><p>Owner có thể thêm kênh đầu tiên mà không phải sửa mã nguồn.</p></div></div>'}</div>`;
  }

  function mediaPage() {
    return `${head("ASSETS", "Media Library", "Lưu liên kết Google Drive hoặc kho cá nhân để không phát sinh phí lưu trữ.", can("create") ? `<button class="button primary" data-action="add-media">＋ Thêm link file</button>` : "")}
      <div class="toolbar"><select class="filter"><option>Tất cả định dạng</option><option>Video</option><option>Image</option><option>Audio</option></select><span class="spacer"></span><span class="helper">${state.media.length} files · lưu bằng liên kết</span></div><div class="media-grid">${state.media.map(x=>`<article class="media-card"><a class="media-preview" href="${escapeHtml(x.url)}" target="_blank" rel="noopener" style="--media1:#7357e8;--media2:#9a87f5">↗</a><div class="media-info"><strong>${escapeHtml(x.name)}</strong><span>${escapeHtml(x.type)}</span>${can("delete") ? `<button class="button ghost small danger" data-delete-media="${x.id}">Xóa</button>` : ""}</div></article>`).join("") || '<div class="empty-state"><div><span>◇</span><h3>Chưa có file</h3><p>Thêm link Drive để quản lý file lớn mà không dùng dung lượng Supabase.</p></div></div>'}</div>`;
  }

  function automationsPage() {
    return `${head("WORKFLOWS", "Automations", "Tạo quy tắc Trigger → Condition → Action cho quy trình nội dung.", `<button class="button primary" data-action="add-automation">＋ Tạo automation</button>`)}
      <div class="automation-grid">${state.automations.map(a=>`<article class="automation-card"><span class="automation-icon">${a.icon}</span><div><h3>${escapeHtml(a.title)}</h3><p>${escapeHtml(a.description)}</p><div class="inline-actions">${can("update") ? `<button class="button ghost small" data-edit-automation="${a.id}">Sửa</button>` : ""}${can("delete") ? `<button class="button ghost small danger" data-delete-automation="${a.id}">Xóa</button>` : ""}</div></div>${can("update") ? `<button class="switch ${a.enabled?"on":""}" data-toggle-automation="${a.id}" aria-label="Bật hoặc tắt ${escapeHtml(a.title)}"></button>` : ""}</article>`).join("")}</div>
      <article class="card" style="margin-top:18px"><div class="card-head"><div><h2>Lịch đồng bộ đề xuất</h2><p>Tối ưu giới hạn API trong 30 ngày đầu</p></div></div><div class="card-body"><div class="progress-list"><div class="progress-row"><strong>1 giờ</strong><div class="progress-track"><div class="progress-fill" style="width:100%;--bar:#ff6b6b"></div></div><span>Sync</span></div><div class="progress-row"><strong>6 giờ</strong><div class="progress-track"><div class="progress-fill" style="width:86%;--bar:#f2a83b"></div></div><span>Sync</span></div><div class="progress-row"><strong>24 giờ</strong><div class="progress-track"><div class="progress-fill" style="width:70%;--bar:#7357e8"></div></div><span>Sync</span></div><div class="progress-row"><strong>3–30 ngày</strong><div class="progress-track"><div class="progress-fill" style="width:48%;--bar:#3b82f6"></div></div><span>Daily</span></div></div></div></article>`;
  }

  function teamPage() {
    return `${head("ACCESS CONTROL", "Team", "Chỉ Gmail được Owner mời mới có thể xem workspace.", can("invite") ? `<button class="button primary" data-action="invite">＋ Cấp quyền Gmail</button>` : "")}
      <div class="team-grid">${state.team.map(u=>`<article class="team-card"><div class="team-top"><span class="avatar" style="width:42px;height:42px;--avatar:${u.color}">${u.initials}</span><div><h3>${escapeHtml(u.name)}</h3><p>${escapeHtml(u.email)}</p></div></div><div style="display:flex;align-items:center;gap:5px;margin-top:15px;padding-top:13px;border-top:1px solid var(--line)"><span class="status active">${u.status}</span><span class="tag spacer">${u.role}</span>${can("manage_team") && u.role !== "Owner" ? `<button class="button ghost small" data-edit-member="${u.id}">Đổi quyền</button><button class="button ghost small danger" data-revoke-member="${u.id}">Thu hồi</button>` : ""}</div></article>`).join("")}</div>`;
  }

  function settingsPage() {
    return `${head("CONFIGURATION", "Settings", "Quản lý workspace, tích hợp và quyền sở hữu dữ liệu.", `<button class="button primary" data-action="save-settings">Lưu thay đổi</button>`)}
      <div class="settings-layout"><aside class="card settings-nav"><button class="active">Workspace</button><button>Integrations</button><button>Roles & permissions</button><button>Content fields</button><button>Notifications</button><button>Data & export</button></aside>
      <section class="stack"><article class="card"><div class="card-head"><div><h2>Workspace profile</h2><p>Thông tin hiển thị chung</p></div></div><div class="card-body form-grid"><div class="field"><label>Tên workspace</label><input id="workspaceName" value="${escapeHtml(window.CONTENTOPS_CONFIG?.workspaceName || "TPLabs")}" ${can("settings") ? "" : "disabled"}></div><div class="field"><label>Múi giờ</label><select id="workspaceTimezone" ${can("settings") ? "" : "disabled"}><option>Asia/Ho_Chi_Minh</option><option>UTC</option></select></div><div class="field full"><label>Mô tả</label><textarea disabled>Quản lý toàn bộ hoạt động content marketing và social channels.</textarea></div></div></article>
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
    return `<div class="form-grid">${fields.map(f=>`<div class="field ${f.full?"full":""}"><label for="${f.name}">${f.label}</label>${f.type === "select" ? `<select id="${f.name}" name="${f.name}" required>${f.options.map(o=>`<option ${String(o)===String(f.value)?"selected":""}>${escapeHtml(o)}</option>`).join("")}</select>` : f.type === "textarea" ? `<textarea id="${f.name}" name="${f.name}" ${f.required?"required":""} placeholder="${escapeHtml(f.placeholder||"")}">${escapeHtml(f.value||"")}</textarea>` : `<input id="${f.name}" name="${f.name}" type="${f.type||"text"}" ${f.required?"required":""} placeholder="${escapeHtml(f.placeholder||"")}" value="${escapeHtml(f.value||"")}">`}${f.help?`<span class="helper">${f.help}</span>`:""}</div>`).join("")}</div>`;
  }
  function openDialog(kind, entityId = "") {
    const title = document.getElementById("dialogTitle");
    const eyebrow = document.getElementById("dialogEyebrow");
    const body = document.getElementById("dialogBody");
    const submit = document.getElementById("dialogSubmit");
    dialogForm.dataset.kind = kind;
    dialogForm.dataset.entityId = entityId;
    if (kind === "content") {
      const item = state.content.find(x=>x.id===entityId) || {};
      eyebrow.textContent = "CONTENT"; title.textContent = entityId ? "Sửa nội dung" : "Tạo nội dung mới"; submit.textContent = entityId ? "Lưu thay đổi" : "Tạo nội dung";
      body.innerHTML = formFields([{name:"title",label:"Tiêu đề",required:true,full:true,placeholder:"Nhập ý tưởng hoặc tiêu đề",value:item.title},{name:"channel",label:"Kênh",type:"select",options:state.channels.length?state.channels.map(x=>x.name):["Chưa chọn"],value:item.channel},{name:"platform",label:"Nền tảng",type:"select",options:["YouTube","TikTok","Instagram","Facebook","Other"],value:item.platform},{name:"status",label:"Trạng thái",type:"select",options:["Idea","Script","Editing","Review","Approved","Scheduled","Published","Failed","Removed"],value:item.status},{name:"date",label:"Deadline",type:"date",required:true,value:item.date && item.date!=="—"?item.date:new Date().toISOString().slice(0,10)},{name:"owner",label:"Người phụ trách",type:"select",options:state.team.length?state.team.map(x=>x.name):[currentUser?.user_metadata?.full_name||currentUser?.email||"Owner"],value:item.owner},{name:"type",label:"Content pillar",placeholder:"Psychology, Travel…",value:item.type}]);
    } else if (kind === "channel") {
      const item = state.channels.find(x=>x.id===entityId) || {};
      eyebrow.textContent = "CHANNEL"; title.textContent = entityId ? "Sửa kênh" : "Thêm kênh mới"; submit.textContent = entityId ? "Lưu thay đổi" : "Thêm kênh";
      body.innerHTML = formFields([{name:"name",label:"Tên kênh",required:true,placeholder:"Ví dụ: Kênh YouTube",value:item.name},{name:"platform",label:"Nền tảng",type:"select",options:["YouTube","TikTok","Instagram","Facebook","Other"],value:item.platform},{name:"handle",label:"Handle hoặc URL",required:true,full:true,placeholder:"@channel hoặc https://…",value:item.handle}]);
    } else if (kind === "link") {
      eyebrow.textContent = "POST-PUBLISH TRACKING"; title.textContent = "Add Published Link"; submit.textContent = "Lưu và đồng bộ";
      body.innerHTML = formFields([{name:"contentId",label:"Nội dung gốc",type:"select",full:true,options:state.content.map(x=>x.title)},{name:"url",label:"Link bài đăng",type:"url",required:true,full:true,placeholder:"https://youtube.com/shorts/…",help:"Hệ thống sẽ nhận diện nền tảng và Post/Video ID."},{name:"publishedAt",label:"Thời gian đăng",type:"datetime-local",required:true},{name:"status",label:"Trạng thái",type:"select",options:["Published","Scheduled"]}]);
    } else if (kind === "invite") {
      eyebrow.textContent = "TEAM ACCESS"; title.textContent = "Mời thành viên"; submit.textContent = "Gửi lời mời";
      body.innerHTML = formFields([{name:"email",label:"Địa chỉ Gmail",type:"email",required:true,full:true,placeholder:"name@gmail.com"},{name:"role",label:"Vai trò",type:"select",options:["Admin","Content Manager","Scriptwriter","Editor","Reviewer","Viewer"]},{name:"channel",label:"Quyền theo kênh",type:"select",options:["Tất cả kênh",...state.channels.map(x=>x.name)]}]);
    } else if (kind === "member") {
      const item = state.team.find(x=>x.id===entityId) || {};
      eyebrow.textContent = "TEAM ACCESS"; title.textContent = "Đổi quyền truy cập"; submit.textContent = "Cập nhật quyền";
      body.innerHTML = formFields([{name:"email",label:"Gmail",type:"email",full:true,value:item.email},{name:"role",label:"Vai trò",type:"select",options:["Admin","Content Manager","Scriptwriter","Editor","Reviewer","Viewer"],value:item.role}]);
      document.getElementById("email").readOnly = true;
    } else if (kind === "media") {
      eyebrow.textContent = "MEDIA LINK"; title.textContent = "Thêm liên kết file"; submit.textContent = "Lưu liên kết";
      body.innerHTML = formFields([{name:"name",label:"Tên file",required:true,full:true,placeholder:"video-01.mp4"},{name:"url",label:"Link Google Drive hoặc kho file",type:"url",required:true,full:true,placeholder:"https://drive.google.com/…"},{name:"type",label:"Loại file",type:"select",options:["Video","Image","Audio","Document","Other"]}]);
    } else {
      const item = state.automations.find(x=>x.id===entityId) || {};
      eyebrow.textContent = "AUTOMATION"; title.textContent = entityId ? "Sửa automation" : "Tạo automation"; submit.textContent = entityId ? "Lưu thay đổi" : "Tạo quy tắc";
      body.innerHTML = formFields([{name:"title",label:"Tên automation",required:true,full:true,placeholder:"Ví dụ: Approved → Publishing Queue",value:item.title},{name:"trigger",label:"Khi",type:"select",options:["Trạng thái thay đổi","Bài đăng thành công","Đến deadline","Metrics được cập nhật"]},{name:"condition",label:"Nếu",type:"select",options:["Mọi nội dung","Views > trung bình 50%","Retention < 35%","Performance Score > 85"]},{name:"action",label:"Thực hiện",type:"select",full:true,options:["Chuyển trạng thái","Gửi thông báo","Tạo nhiệm vụ mới","Đồng bộ metrics","Gửi email report"]}]);
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
    if (!requirePermission("sync")) return;
    if (localMode) {
      toast("Đồng bộ metrics tự động cần kết nối API. Dữ liệu local vẫn dùng bình thường.", "warning");
      return;
    }
    const buttons = document.querySelectorAll('[data-action="sync"]');
    buttons.forEach(b=>{ b.disabled=true; b.textContent="↻ Đang đồng bộ…"; });
    try {
      const { error } = await db.functions.invoke("sync-metrics", { body: { workspaceId } });
      if (error) throw error;
      await loadLiveData();
      toast("Đã đồng bộ số liệu mới nhất.", "success");
    } catch (_) { toast("Chưa thể đồng bộ. Hãy kiểm tra kết nối API.", "warning"); }
    render();
  }

  function exportCsv() {
    const header = ["Title","Platform","Channel","Status","Owner","Date","Views","Likes","Avg Watch","Score","URL"];
    const rows = state.content.map(x=>[x.title,x.platform,x.channel,x.status,x.owner,x.date,x.views,x.likes,x.avgWatch,x.score,x.url]);
    const csv = [header,...rows].map(row=>row.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\n");
    const link = document.createElement("a"); link.href=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv"})); link.download="contentops-report.csv"; link.click(); URL.revokeObjectURL(link.href);
    toast("Đã xuất báo cáo CSV.", "success");
  }

  async function deleteEntity(table, id, label) {
    if (!requirePermission("delete")) return;
    const warning = table === "content_items" ? "Bài đăng và số liệu liên quan cũng sẽ bị xóa." : "Thao tác này không thể hoàn tác.";
    if (!confirm(`Xóa ${label}? ${warning}`)) return;
    if (localMode) {
      const map = { content_items: "content", channels: "channels", automations: "automations", media_assets: "media" };
      const key = map[table];
      if (key) state[key] = state[key].filter(item => item.id !== id);
      persist();
      render();
      toast(`Đã xóa ${label}.`, "success");
      return;
    }
    const { error } = await db.from(table).delete().eq("workspace_id", workspaceId).eq("id", id);
    if (error) return toast(error.message, "warning");
    await loadLiveData(); render(); toast(`Đã xóa ${label}.`, "success");
  }

  async function manageMember(action, member, role = "viewer") {
    if (!requirePermission("manage_team")) return;
    if (member.role === "Owner") return toast("Không thể thay đổi tài khoản Owner.", "warning");
    if (action === "revoke" && !confirm(`Thu hồi toàn bộ quyền của ${member.email}?`)) return;
    if (localMode) {
      if (action === "revoke") state.team = state.team.filter(x => x.id !== member.id);
      else {
        member.role = role.split("_").map(x => x[0].toUpperCase() + x.slice(1)).join(" ");
      }
      persist();
      render();
      toast(action === "revoke" ? "Đã xóa thành viên khỏi máy này." : "Đã cập nhật vai trò.", "success");
      return;
    }
    const { error } = await db.functions.invoke("invite-member", { body: { action, workspaceId, email: member.email, userId: member.id, role } });
    if (error) return toast(error.message, "warning");
    await loadLiveData(); render(); toast(action === "revoke" ? "Đã thu hồi quyền Gmail." : "Đã cập nhật vai trò.", "success");
  }

  function bindPageEvents() {
    page.querySelectorAll("[data-action]").forEach(button => button.addEventListener("click", () => {
      const action = button.dataset.action;
      if (action === "add-content" && requirePermission("create")) openDialog("content");
      else if (action === "add-channel" && requirePermission("create")) openDialog("channel");
      else if (action === "add-link" && requirePermission("publish")) openDialog("link");
      else if (action === "invite" && requirePermission("invite")) openDialog("invite");
      else if (action === "add-automation" && requirePermission("create")) openDialog("automation");
      else if (action === "add-media" && requirePermission("create")) openDialog("media");
      else if (action === "sync") syncMetrics();
      else if (action === "export") exportCsv();
      else if (action === "save-settings" && requirePermission("settings")) {
        if (localMode) {
          window.CONTENTOPS_CONFIG.workspaceName = document.getElementById("workspaceName").value.trim() || "TPLabs";
          document.querySelector(".workspace-card strong").textContent = window.CONTENTOPS_CONFIG.workspaceName;
          persist();
          toast("Đã lưu cài đặt workspace trên máy này.", "success");
        } else {
          db.from("workspaces").update({ name:document.getElementById("workspaceName").value.trim(),timezone:document.getElementById("workspaceTimezone").value }).eq("id",workspaceId).then(({error})=>toast(error?error.message:"Đã lưu cài đặt workspace.",error?"warning":"success"));
        }
      }
    }));
    page.querySelectorAll("[data-route-link]").forEach(b=>b.addEventListener("click",()=>location.hash=b.dataset.routeLink));
    page.querySelectorAll("[data-toggle-automation]").forEach(b=>b.addEventListener("click",async()=>{ if(!requirePermission("update"))return; const item=state.automations.find(x=>x.id===b.dataset.toggleAutomation); if(!item)return; if(localMode){ item.enabled=!item.enabled; persist(); render(); toast(item.enabled?"Đã bật automation.":"Đã tắt automation.","success"); return; } const {error}=await db.from("automations").update({enabled:!item.enabled}).eq("workspace_id",workspaceId).eq("id",item.id); if(error)return toast(error.message,"warning"); item.enabled=!item.enabled; render(); toast(item.enabled?"Đã bật automation.":"Đã tắt automation.","success"); }));
    page.querySelectorAll("[data-edit-content]").forEach(b=>b.addEventListener("click",()=>requirePermission("update")&&openDialog("content",b.dataset.editContent)));
    page.querySelectorAll("[data-delete-content]").forEach(b=>b.addEventListener("click",()=>deleteEntity("content_items",b.dataset.deleteContent,"nội dung")));
    page.querySelectorAll("[data-edit-channel]").forEach(b=>b.addEventListener("click",()=>requirePermission("update")&&openDialog("channel",b.dataset.editChannel)));
    page.querySelectorAll("[data-delete-channel]").forEach(b=>b.addEventListener("click",()=>deleteEntity("channels",b.dataset.deleteChannel,"kênh")));
    page.querySelectorAll("[data-edit-automation]").forEach(b=>b.addEventListener("click",()=>requirePermission("update")&&openDialog("automation",b.dataset.editAutomation)));
    page.querySelectorAll("[data-delete-automation]").forEach(b=>b.addEventListener("click",()=>deleteEntity("automations",b.dataset.deleteAutomation,"automation")));
    page.querySelectorAll("[data-delete-media]").forEach(b=>b.addEventListener("click",()=>deleteEntity("media_assets",b.dataset.deleteMedia,"liên kết file")));
    page.querySelectorAll("[data-edit-member]").forEach(b=>b.addEventListener("click",()=>requirePermission("manage_team")&&openDialog("member",b.dataset.editMember)));
    page.querySelectorAll("[data-revoke-member]").forEach(b=>b.addEventListener("click",()=>{ const member=state.team.find(x=>x.id===b.dataset.revokeMember); if(member)manageMember("revoke",member); }));
    page.querySelectorAll("[data-connect]").forEach(b=>b.addEventListener("click",()=>{ if(b.dataset.connect==="Pages CMS") window.open(window.CONTENTOPS_CONFIG.pagesCmsUrl,"_blank","noopener"); else toast(`Cần thêm thông tin OAuth/API cho ${b.dataset.connect}.`,"warning"); }));
    const filter = document.getElementById("statusFilter"); if (filter) filter.addEventListener("change",()=>{ state.filter=filter.value; render(); });
  }

  dialogForm.addEventListener("submit", async event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(dialogForm));
    const kind = dialogForm.dataset.kind;
    const entityId = dialogForm.dataset.entityId;
    const neededPermission = kind === "invite" ? "invite" : kind === "member" ? "manage_team" : kind === "link" ? "publish" : entityId ? "update" : "create";
    if (!requirePermission(neededPermission)) return;

    if (localMode) {
      if (kind === "content") {
        const channel = state.channels.find(x => x.name === data.channel);
        const payload = {
          title: data.title.trim(),
          channel: channel?.name || "Chưa chọn",
          platform: data.platform || channel?.platform || "Other",
          status: data.status || "Idea",
          date: data.date || "—",
          owner: data.owner || "TPLabs Owner",
          type: data.type?.trim() || "General",
          views: 0, likes: 0, comments: 0, shares: 0, saves: 0,
          avgWatch: "—", retention: 0, score: 0, url: ""
        };
        if (entityId) Object.assign(state.content.find(x => x.id === entityId) || {}, payload);
        else state.content.unshift({ id: localId("content"), ...payload });
        toast(entityId ? "Đã cập nhật nội dung." : "Đã tạo nội dung mới.", "success");
      } else if (kind === "channel") {
        const payload = { name:data.name.trim(), platform:data.platform, handle:data.handle.trim(), followers:0, views:0, posts:0, color:platformColor(data.platform), active:true };
        if (entityId) Object.assign(state.channels.find(x => x.id === entityId) || {}, payload);
        else state.channels.push({ id:localId("channel"), ...payload });
        toast(entityId ? "Đã cập nhật kênh." : "Đã thêm kênh mới.", "success");
      } else if (kind === "link") {
        const item = state.content.find(x => x.title === data.contentId);
        const platform = detectPlatform(data.url);
        if (item) {
          item.status = data.status || "Published";
          item.platform = platform;
          item.url = data.url;
          item.date = data.publishedAt ? data.publishedAt.slice(0,10) : new Date().toISOString().slice(0,10);
        }
        toast(`Đã lưu link ${platform}.`, "success");
      } else if (kind === "invite") {
        const email = data.email.trim().toLowerCase();
        state.team.push({
          id: localId("member"),
          name: email.split("@")[0],
          email,
          role: data.role,
          initials: email.slice(0,2).toUpperCase(),
          color: "#7357e8",
          status: "Active"
        });
        toast("Đã thêm thành viên vào danh sách local.", "success");
      } else if (kind === "member") {
        const member = state.team.find(x => x.id === entityId);
        if (member) member.role = data.role;
        toast("Đã cập nhật vai trò.", "success");
      } else if (kind === "media") {
        let parsed;
        try { parsed = new URL(data.url); } catch (_) { return toast("Link file không hợp lệ.", "warning"); }
        if (!["http:","https:"].includes(parsed.protocol)) return toast("Chỉ chấp nhận link HTTP/HTTPS.", "warning");
        state.media.unshift({ id:localId("media"), name:data.name.trim(), url:parsed.href, type:data.type, size:0 });
        toast("Đã thêm liên kết file.", "success");
      } else {
        const payload = { title:data.title.trim(), description:`Trigger: ${data.trigger}`, trigger:data.trigger, condition:data.condition, action:data.action, icon:"ϟ", enabled:true };
        if (entityId) Object.assign(state.automations.find(x => x.id === entityId) || {}, payload);
        else state.automations.unshift({ id:localId("automation"), ...payload });
        toast(entityId ? "Đã cập nhật automation." : "Đã tạo automation.", "success");
      }
      persist();
      dialog.close();
      render();
      return;
    }

    if (kind === "content") {
      const channel = state.channels.find(x=>x.name===data.channel);
      const payload = { title:data.title.trim(),content_pillar:data.type?.trim()||"General",status:data.status.toLowerCase(),due_date:data.date,owner_name:data.owner,primary_channel_id:channel?.id||null,primary_platform:data.platform };
      const query = entityId ? db.from("content_items").update(payload).eq("workspace_id",workspaceId).eq("id",entityId) : db.from("content_items").insert({ workspace_id:workspaceId,...payload,created_by:currentUser.id });
      const { error } = await query;
      if (error) { toast(error.message,"warning"); return; }
      toast(entityId ? "Đã cập nhật nội dung." : "Đã tạo nội dung mới.", "success");
    } else if (kind === "channel") {
      const payload = { name:data.name.trim(),platform:data.platform,handle:data.handle.trim(),channel_url:data.handle.startsWith("http")?data.handle.trim():null,color:platformColor(data.platform) };
      const query = entityId ? db.from("channels").update(payload).eq("workspace_id",workspaceId).eq("id",entityId) : db.from("channels").insert({ workspace_id:workspaceId,...payload });
      const { error } = await query;
      if (error) { toast(error.message,"warning"); return; }
      toast(entityId ? "Đã cập nhật kênh." : "Đã thêm kênh mới.", "success");
    } else if (kind === "link") {
      const item = state.content.find(x=>x.title===data.contentId); const platform=detectPlatform(data.url);
      if (item) {
        const channel = state.channels.find(x=>x.name===item.channel);
        const externalId = platform === "YouTube" ? (data.url.match(/(?:youtu\.be\/|shorts\/|watch\?v=|embed\/)([\w-]{6,})/i)?.[1]||null) : (data.url.match(/(?:video\/|reel\/|p\/)([\w-]+)/i)?.[1]||null);
        const { error } = await db.from("published_posts").insert({ workspace_id:workspaceId,content_id:item.id,channel_id:channel?.id||null,platform,post_url:data.url,external_post_id:externalId,status:data.status.toLowerCase(),published_at:data.publishedAt||new Date().toISOString(),next_sync_at:new Date().toISOString() });
        if (error) { toast(error.message,"warning"); return; }
        await db.from("content_items").update({ status:data.status.toLowerCase() }).eq("workspace_id",workspaceId).eq("id",item.id);
      }
      toast(`Đã nhận diện ${platform} và lưu link bài đăng.`, "success");
    } else if (kind === "invite") {
      const channel = state.channels.find(x=>x.name===data.channel);
      const { error } = await db.functions.invoke("invite-member", { body:{ action:"invite",workspaceId,email:data.email.trim().toLowerCase(),role:data.role.toLowerCase().replace(/ /g,"_"),channelScope:channel?[channel.id]:[],redirectTo:location.href.split("#")[0] } });
      if (error) { toast(error.message,"warning"); return; }
      toast(`Đã tạo lời mời cho ${data.email}.`, "success");
    } else if (kind === "member") {
      const member = state.team.find(x=>x.id===entityId);
      if (!member) return;
      await manageMember("update", member, data.role.toLowerCase().replace(/ /g,"_"));
      dialog.close(); return;
    } else if (kind === "media") {
      let parsed;
      try { parsed = new URL(data.url); } catch (_) { return toast("Link file không hợp lệ.", "warning"); }
      if (!["http:","https:"].includes(parsed.protocol)) return toast("Chỉ chấp nhận link HTTP/HTTPS.", "warning");
      const { error } = await db.from("media_assets").insert({ workspace_id:workspaceId,file_name:data.name.trim(),storage_path:parsed.href,mime_type:data.type,uploaded_by:currentUser.id });
      if (error) { toast(error.message,"warning"); return; }
      toast("Đã thêm liên kết file.", "success");
    } else {
      const payload = { title:data.title.trim(),trigger_type:data.trigger,conditions:{ label:data.condition },actions:[{ type:data.action }] };
      const query = entityId ? db.from("automations").update(payload).eq("workspace_id",workspaceId).eq("id",entityId) : db.from("automations").insert({ workspace_id:workspaceId,...payload,enabled:true,created_by:currentUser.id });
      const { error } = await query;
      if (error) { toast(error.message,"warning"); return; }
      toast(entityId ? "Đã cập nhật automation." : "Đã tạo automation.", "success");
    }
    dialog.close();
    await loadLiveData();
    render();
  });

  document.getElementById("menuToggle").addEventListener("click",()=>document.getElementById("sidebar").classList.add("open"));
  document.getElementById("mobileClose").addEventListener("click",()=>document.getElementById("sidebar").classList.remove("open"));
  document.querySelector(".dialog-close").addEventListener("click",()=>dialog.close());
  document.querySelector(".dialog-cancel").addEventListener("click",()=>dialog.close());
  document.getElementById("globalSearch").addEventListener("input",e=>{ state.search=e.target.value.trim().toLowerCase(); if(state.route!=="content") location.hash="content"; else render(); });
  document.getElementById("profileButton").addEventListener("click", async ()=>{ if(localMode){ toast("Bạn đang dùng Local Owner Mode — không cần đăng nhập.", "success"); return; } if(state.live && db && confirm("Đăng xuất khỏi TPLabs ContentOps?")){ await db.auth.signOut(); location.reload(); } });
  document.addEventListener("keydown",e=>{ if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();document.getElementById("globalSearch").focus();} });
  window.addEventListener("hashchange",()=>{ state.route=location.hash.replace("#","")||"overview"; render(); });
  function registerWebMcpTools() {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const register = tool => { try { void Promise.resolve(context.registerTool(tool)).catch(console.error); } catch (error) { console.error(error); } };
    register({ name:"navigate_tplabs", title:"Mở khu vực TPLabs", description:"Đi tới một khu vực quản trị trong TPLabs ContentOps.", inputSchema:{ type:"object", properties:{ route:{ type:"string", enum:Object.keys(pages) } }, required:["route"], additionalProperties:false }, annotations:{ readOnlyHint:true, untrustedContentHint:false }, execute(input){ if(!pages[input.route]) throw new Error("Invalid route"); location.hash=input.route; return { route:input.route }; } });
    register({ name:"create_content_item", title:"Tạo nội dung", description:"Tạo một nội dung mới trong workspace hiện tại và cập nhật giao diện.", inputSchema:{ type:"object", properties:{ title:{type:"string"}, channel:{type:"string"}, platform:{type:"string"}, dueDate:{type:"string"}, owner:{type:"string"} }, required:["title","channel","platform","dueDate","owner"], additionalProperties:false }, annotations:{ readOnlyHint:false, untrustedContentHint:false }, async execute(input){ if(!state.authenticated||!can("create")) throw new Error("Permission denied"); if(!input.title.trim()) throw new Error("Title is required"); const channel=state.channels.find(x=>x.name===input.channel); if(localMode){ const item={id:localId("content"),title:input.title.trim(),channel:channel?.name||"Chưa chọn",platform:input.platform,status:"Idea",date:input.dueDate,owner:input.owner,type:"General",views:0,likes:0,comments:0,shares:0,saves:0,avgWatch:"—",retention:0,score:0,url:""}; state.content.unshift(item); persist(); render(); return {id:item.id,status:"Idea",mode:"local"}; } const {data,error}=await db.from("content_items").insert({workspace_id:workspaceId,title:input.title.trim(),status:"idea",due_date:input.dueDate,owner_name:input.owner,primary_channel_id:channel?.id||null,primary_platform:input.platform,created_by:currentUser.id}).select().single(); if(error) throw error; await loadLiveData(); render(); return {id:data.id,status:"Idea"}; } });
    register({ name:"sync_published_metrics", title:"Đồng bộ số liệu", description:"Chạy đồng bộ số liệu cho các bài đã đăng đến hạn cập nhật.", inputSchema:{type:"object",properties:{},additionalProperties:false}, annotations:{readOnlyHint:false,untrustedContentHint:true}, async execute(){ if(!state.authenticated||!can("sync")) throw new Error("Permission denied"); await syncMetrics(); return {status:"completed",mode:"live"}; } });
  }

  registerWebMcpTools();
  loadData();
})();
