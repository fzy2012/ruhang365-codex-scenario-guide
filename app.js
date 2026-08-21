const grid = document.querySelector("#scenario-grid");
const form = document.querySelector("#scenario-form");
const input = document.querySelector("#scenario-input");
const submitButton = form.querySelector('button[type="submit"]');
const recommendation = document.querySelector("#recommendation");
const dialog = document.querySelector("#scenario-dialog");
const dialogContent = document.querySelector("#dialog-content");
const closeButton = document.querySelector("#dialog-close");

let scenarios = [];

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function arrowIcon() {
  return '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg>';
}

function renderCards() {
  grid.innerHTML = scenarios
    .map(
      (scenario, index) => `
        <button class="scenario-row" data-id="${escapeHtml(scenario.id)}" type="button">
          <span class="card-number">${String(index + 1).padStart(2, "0")}</span>
          <span class="card-copy">
            <strong>${escapeHtml(scenario.title)}</strong>
            <small>${escapeHtml(scenario.entry)}</small>
          </span>
          ${arrowIcon()}
        </button>`,
    )
    .join("");
}

function scoreScenario(scenario, query) {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return 0;
  const searchable = `${scenario.title} ${scenario.summary} ${scenario.keywords.join(" ")}`.toLowerCase();
  return scenario.keywords.reduce(
    (score, keyword) => score + (normalized.includes(keyword.toLowerCase()) ? 3 : 0),
    searchable.includes(normalized) ? 5 : 0,
  );
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Some browsers expose the Clipboard API but deny it on local pages.
    }
  }
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.append(textArea);
  textArea.select();
  const copied = document.execCommand("copy");
  textArea.remove();
  if (!copied) throw new Error("clipboard unavailable");
}

function openScenario(scenario) {
  if (!scenario) return;
  dialogContent.innerHTML = `
    <span class="dialog-label">推荐入口</span>
    <h2 id="dialog-title">${escapeHtml(scenario.entry)}</h2>
    <p class="reason">${escapeHtml(scenario.reason)}</p>
    <section class="dialog-section">
      <h3>怎么开始</h3>
      <ol class="steps">${scenario.steps
        .map((step, index) => `<li><span>${index + 1}</span><p>${escapeHtml(step)}</p></li>`)
        .join("")}</ol>
    </section>
    <section class="dialog-section">
      <h3>可以直接复制</h3>
      <div class="prompt-box">
        <p>${escapeHtml(scenario.prompt)}</p>
        <button class="copy-button" type="button">复制任务描述</button>
      </div>
    </section>
    <div class="result-grid">
      <section><h3>成功标志</h3><p>${escapeHtml(scenario.success)}</p></section>
      <section><h3>卡住时</h3><p>${escapeHtml(scenario.recovery)}</p></section>
    </div>
    <a class="source-link" href="${escapeHtml(scenario.source_url)}" target="_blank" rel="noreferrer">官方依据：${escapeHtml(scenario.source_label)}</a>`;
  dialog.showModal();
  dialog.scrollTop = 0;
  const copyButton = dialogContent.querySelector(".copy-button");
  copyButton.addEventListener("click", async () => {
    try {
      await copyText(scenario.prompt);
      copyButton.textContent = "已复制，可以去开始了";
    } catch {
      copyButton.textContent = "复制失败，请手动选择文字";
    }
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = input.value.trim();
  if (!query) {
    input.focus();
    return;
  }
  if (!scenarios.length) {
    recommendation.hidden = false;
    recommendation.innerHTML = '<p class="load-error">路线仍在加载，请稍后再试。</p>';
    return;
  }
  const ranked = scenarios
    .map((scenario) => ({ scenario, score: scoreScenario(scenario, query) }))
    .sort((a, b) => b.score - a.score);
  const best = ranked[0]?.score > 0 ? ranked[0].scenario : null;
  recommendation.hidden = false;
  if (!best) {
    recommendation.innerHTML = `
      <div class="route-marker" aria-hidden="true">?</div>
      <div class="recommendation-copy no-match">
        <span>还不能可靠判断入口</span>
        <strong>请补充你要处理的对象和结果</strong>
        <p>例如“修改这个网站的首页”“整理下载文件夹”或“比较两款产品并推荐一个”。我们不会为了给答案而猜错入口。</p>
        <button type="button">返回补充描述</button>
      </div>`;
    recommendation.querySelector("button").addEventListener("click", () => {
      input.focus();
      input.select();
    });
    recommendation.scrollIntoView({ behavior: "smooth", block: "nearest" });
    return;
  }
  recommendation.innerHTML = `
    <div class="route-marker" aria-hidden="true">1</div>
    <div class="recommendation-copy">
      <span>为你推荐的默认入口</span>
      <strong>${escapeHtml(best.entry)}</strong>
      <p>${escapeHtml(best.reason)}</p>
      <button type="button">查看完整路线</button>
    </div>
    <div class="quick-steps">
      <span>可以直接开始的步骤</span>
      <ol>${best.steps.slice(0, 3).map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>
    </div>`;
  recommendation.querySelector("button").addEventListener("click", () => openScenario(best));
  recommendation.scrollIntoView({ behavior: "smooth", block: "nearest" });
});

grid.addEventListener("click", (event) => {
  const row = event.target.closest("[data-id]");
  if (!row) return;
  openScenario(scenarios.find((scenario) => scenario.id === row.dataset.id));
});

closeButton.addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

fetch("content/scenarios.json")
  .then((response) => {
    if (!response.ok) throw new Error("无法加载场景数据");
    return response.json();
  })
  .then((data) => {
    scenarios = data;
    renderCards();
    submitButton.disabled = false;
    submitButton.textContent = "给我路线";
  })
  .catch(() => {
    submitButton.textContent = "路线加载失败";
    grid.innerHTML = '<p class="load-error">场景内容加载失败，请使用本地 HTTP 服务打开。</p>';
  });
