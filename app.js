const form = document.querySelector("#search-form");
const input = document.querySelector("#search-input");
const submitButton = form.querySelector('button[type="submit"]');
const filters = document.querySelector("#content-filters");
const list = document.querySelector("#content-list");
const resultsTitle = document.querySelector("#results-title");
const resultsCount = document.querySelector("#results-count");
const clearButton = document.querySelector("#clear-search");
const starterList = document.querySelector("#starter-list");
const updateList = document.querySelector("#update-list");
const dialog = document.querySelector("#content-dialog");
const dialogContent = document.querySelector("#dialog-content");
const closeButton = document.querySelector("#dialog-close");

const TYPE_LABELS = { manual: "使用手册", update: "最近更新", solution: "场景解决方案" };
let contents = [];
let activeFilter = "all";
let query = "";

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function arrowIcon() {
  return '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg>';
}

function searchableText(item) {
  const action = item.action || {};
  return [item.title, item.summary, ...(item.keywords || []), ...(item.product_surface || []), action.entry, action.reason, action.example, ...(action.steps || []), ...(action.success_signals || []), action.recovery].join(" ").toLowerCase();
}

function scoreItem(item, rawQuery) {
  const normalized = rawQuery.toLowerCase().trim();
  if (!normalized) return item.featured_order || 100;
  const text = searchableText(item);
  let score = text.includes(normalized) ? 30 : 0;
  for (const keyword of item.keywords || []) {
    const key = keyword.toLowerCase();
    if (normalized.includes(key)) score += 12;
  }
  const titleAndSummary = `${item.title} ${item.summary}`.toLowerCase();
  const ignoredTokens = new Set(["chat", "work", "codex", "怎么", "如何", "一个"]);
  for (const token of normalized.split(/[\s，。？、]+/).filter((part) => part.length > 1 && !ignoredTokens.has(part))) {
    if (titleAndSummary.includes(token)) score += 5;
  }
  return score;
}

function sourceStatus(item) {
  return item.official_sources?.length ? "有官方来源" : "来源待补";
}

function renderContent() {
  const filtered = contents
    .filter((item) => item.status === "published")
    .filter((item) => activeFilter === "all" || item.content_type === activeFilter)
    .map((item) => ({ item, score: scoreItem(item, query) }))
    .filter(({ score }) => !query || score > 0)
    .sort((a, b) => query ? b.score - a.score : a.score - b.score)
    .map(({ item }) => item);

  resultsTitle.textContent = query ? `“${query}”的结果` : activeFilter === "all" ? "全部内容" : TYPE_LABELS[activeFilter];
  resultsCount.textContent = filtered.length ? `找到 ${filtered.length} 条已核验内容` : "没有找到可靠匹配";
  clearButton.hidden = !query;
  if (!filtered.length) {
    list.innerHTML = `<div class="empty-state"><strong>还不能可靠判断你需要哪篇内容</strong><p>请补充操作对象和预期结果，例如“修改网站首页”“怎么选择 Chat 或 Work”或“任务卡住了”。我们不会为了给答案而猜错入口。</p><button type="button">返回补充描述</button></div>`;
    list.querySelector("button").addEventListener("click", () => { input.focus(); input.select(); });
    return;
  }
  list.innerHTML = filtered.map((item) => `
    <button class="content-row" type="button" data-id="${escapeHtml(item.id)}">
      <span class="type-icon" aria-hidden="true">${item.content_type === "manual" ? "书" : item.content_type === "update" ? "新" : "解"}</span>
      <span class="row-main"><span class="row-type">${TYPE_LABELS[item.content_type]}</span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.summary)}</small><span class="row-meta">${escapeHtml(item.product_surface.join(" · "))}<i></i>核验于 ${escapeHtml(item.verified_at)}<i></i>${sourceStatus(item)}</span></span>
      ${arrowIcon()}
    </button>`).join("");
}

function renderRail() {
  const starters = contents
    .filter((item) => item.content_type === "manual" && item.status === "published")
    .sort((a, b) => (a.featured_order || 100) - (b.featured_order || 100))
    .slice(0, 5);
  starterList.innerHTML = starters.map((item, index) => `<li><button type="button" data-id="${escapeHtml(item.id)}"><span>${index + 1}</span>${escapeHtml(item.title)}${arrowIcon()}</button></li>`).join("");
  const updates = contents.filter((item) => item.content_type === "update" && item.status === "published").slice(0, 3);
  updateList.innerHTML = updates.map((item) => `<button class="rail-update" type="button" data-id="${escapeHtml(item.id)}"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.official_published_at || item.verified_at)}</small></button>`).join("");
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try { await navigator.clipboard.writeText(text); return; } catch { /* local pages can deny clipboard access */ }
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.cssText = "position:fixed;opacity:0";
  document.body.append(area);
  area.select();
  const copied = document.execCommand("copy");
  area.remove();
  if (!copied) throw new Error("clipboard unavailable");
}

function sourcesHtml(sources = []) {
  return sources.map((source) => `<a href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">${escapeHtml(source.label)}</a>`).join("");
}

function sectionList(title, items) {
  if (!items?.length) return "";
  return `<section class="detail-section"><h3>${title}</h3><ol class="detail-list">${items.map((value, index) => `<li><span>${index + 1}</span><p>${escapeHtml(value)}</p></li>`).join("")}</ol></section>`;
}

function openContent(item) {
  if (!item) return;
  const action = item.action || {};
  const related = (item.related_content_ids || []).map((id) => contents.find((candidate) => candidate.id === id)).filter(Boolean);
  const updateIntro = item.content_type === "update" ? `<section class="detail-section"><h3>发生了什么</h3><p>${escapeHtml(action.what_changed)}</p></section>` : "";
  const entry = action.entry ? `<div class="entry-callout"><span>${item.content_type === "solution" ? "推荐入口" : "从这里开始"}</span><strong>${escapeHtml(action.entry)}</strong>${action.reason ? `<p>${escapeHtml(action.reason)}</p>` : ""}</div>` : "";
  const copyable = action.example ? `<section class="detail-section"><h3>${item.content_type === "solution" ? "可以直接复制" : "示例任务描述"}</h3><div class="copy-box"><p>${escapeHtml(action.example)}</p><button class="copy-button" type="button">复制任务描述</button></div></section>` : "";
  const researchSources = item.research_sources?.length ? `<p><strong>研究材料：</strong></p><div class="source-links">${sourcesHtml(item.research_sources)}</div>` : "";
  dialogContent.innerHTML = `<span class="detail-type">${TYPE_LABELS[item.content_type]}</span><h2 id="dialog-title">${escapeHtml(item.title)}</h2><p class="detail-summary">${escapeHtml(item.summary)}</p><div class="scope-line"><span>${escapeHtml(item.product_surface.join(" · "))}</span><span>核验于 ${escapeHtml(item.verified_at)}</span><span>${escapeHtml(item.availability_scope)}</span></div>${entry}${updateIntro}${sectionList(item.content_type === "update" ? "怎样尝试" : "操作步骤", action.steps)}${copyable}<div class="outcome-grid"><section><h3>成功判断</h3><ul>${(action.success_signals || []).map((signal) => `<li>${escapeHtml(signal)}</li>`).join("")}</ul></section><section><h3>卡住时</h3><p>${escapeHtml(action.recovery)}</p></section></div><section class="evidence"><h3>依据与适用范围</h3><p><strong>官方依据：</strong></p><div class="source-links">${sourcesHtml(item.official_sources)}</div>${researchSources}<p><strong>前置条件：</strong>${escapeHtml(item.prerequisites.join("；") || "无特别前置条件")}</p><p><strong>限制说明：</strong>${escapeHtml(item.limitations.join("；"))}</p></section>${related.length ? `<section class="related"><h3>相关内容</h3>${related.map((target) => `<button type="button" data-related-id="${escapeHtml(target.id)}"><span>${TYPE_LABELS[target.content_type]}</span>${escapeHtml(target.title)}${arrowIcon()}</button>`).join("")}</section>` : ""}`;
  dialog.showModal();
  dialog.scrollTop = 0;
  const copyButton = dialogContent.querySelector(".copy-button");
  copyButton?.addEventListener("click", async () => {
    try { await copyText(action.example); copyButton.textContent = "已复制，可以去开始了"; }
    catch { copyButton.textContent = "复制失败，请手动选择文字"; }
  });
}

function setFilter(value) {
  activeFilter = value;
  filters.querySelectorAll("button").forEach((button) => {
    const active = button.dataset.filter === value;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  renderContent();
  document.querySelector(".results").scrollIntoView({ behavior: "smooth", block: "start" });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!contents.length) return;
  query = input.value.trim();
  renderContent();
  document.querySelector(".results").scrollIntoView({ behavior: "smooth", block: "start" });
});
filters.addEventListener("click", (event) => { const button = event.target.closest("[data-filter]"); if (button) setFilter(button.dataset.filter); });
document.addEventListener("click", (event) => {
  const opener = event.target.closest("[data-id]");
  if (opener) openContent(contents.find((item) => item.id === opener.dataset.id));
  const related = event.target.closest("[data-related-id]");
  if (related) openContent(contents.find((item) => item.id === related.dataset.relatedId));
  const filterButton = event.target.closest("[data-set-filter]");
  if (filterButton) setFilter(filterButton.dataset.setFilter);
});
clearButton.addEventListener("click", () => { query = ""; input.value = ""; renderContent(); input.focus(); });
closeButton.addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });

fetch("content/guide.json")
  .then((response) => { if (!response.ok) throw new Error("无法加载内容"); return response.json(); })
  .then((data) => {
    contents = data.contents.filter((item) => item.status === "published");
    renderRail();
    renderContent();
    submitButton.disabled = false;
    submitButton.textContent = "搜索";
  })
  .catch(() => {
    submitButton.textContent = "内容加载失败";
    resultsCount.textContent = "请使用本地 HTTP 服务打开";
    list.innerHTML = '<p class="load-error">内容加载失败，请稍后再试。</p>';
  });
