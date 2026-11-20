// YoutubeFocus web: a fixed list of channels you open directly, skipping the feed.
// Everything lives in this browser's localStorage; Export/Import moves the list elsewhere.

const KEYS = {
  channels: "youtubefocus.channels.v1",
  settings: "youtubefocus.settings.v1",
  session: "youtubefocus.session.v1",
  stats: "youtubefocus.stats.v1",
};
const APP_TITLE = "YoutubeFocus";

// Default list for a first visit.
const DEFAULTS = [
  ["Chat GPT", "https://chat.openai.com/chat"],
  ["Iman Gadzhi", "https://www.youtube.com/@ImanGadzhi"],
  ["My Noise", "https://mynoise.net/"],
  ["Detective Aldo", "https://www.youtube.com/@DetectiveAldo"],
  ["Lazy Monday", "https://www.youtube.com/@TheLazyMondayGaming"],
  ["MLI", "https://www.youtube.com/@MajelisLucu"],
  ["Sneako", "https://rumble.com/user/SNEAKO"],
  ["Brett Cooper", "https://www.youtube.com/@TheCommentsSection"],
  ["Deddy C", "https://www.youtube.com/@corbuzier"],
  ["F and F", "https://www.youtube.com/@FreshFitMiami"],
  ["SANQ4", "https://www.youtube.com/@sanq4"],
  ["Cole Hasting", "https://www.youtube.com/@ColeHastings"],
].map(([name, url]) => ({ name, url }));

const DEFAULT_SETTINGS = { sessionMinutes: 20, videosTab: true };

const $ = (id) => document.getElementById(id);
const els = {
  list: $("list"), empty: $("empty"), search: $("search"), stats: $("todayStats"),
  manageBtn: $("manageBtn"), installBtn: $("installBtn"), panel: $("managePanel"),
  form: $("channelForm"), formTitle: $("formTitle"), name: $("nameInput"), url: $("urlInput"),
  error: $("formError"), saveBtn: $("saveBtn"), cancelEdit: $("cancelEditBtn"),
  exportBtn: $("exportBtn"), importInput: $("importInput"), resetBtn: $("resetBtn"),
  sessionMinutes: $("sessionMinutes"), videosTab: $("videosTab"), notifyBtn: $("notifyBtn"),
  sessionBar: $("sessionBar"), sessionName: $("sessionName"), sessionTime: $("sessionTime"),
  sessionProgress: $("sessionProgress"), extendBtn: $("extendBtn"), endBtn: $("endBtn"),
  toast: $("toast"), toastText: $("toastText"), toastAction: $("toastAction"),
};

// ---------- storage ----------
function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}
function write(key, value) {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch { /* storage blocked: app still works for this visit */ }
}

let channels = (() => {
  const saved = read(KEYS.channels, null);
  return Array.isArray(saved) ? saved.filter(isValidChannel) : DEFAULTS.slice();
})();
let settings = { ...DEFAULT_SETTINGS, ...read(KEYS.settings, {}) };
let session = read(KEYS.session, null);
let managing = false;
let editingIndex = -1;

const saveChannels = () => write(KEYS.channels, channels);
const saveSettings = () => write(KEYS.settings, settings);
const saveSession = () => write(KEYS.session, session);

// ---------- URLs ----------
// Only http(s) links may be opened; this blocks javascript:, data: and file: URLs.
function normalizeUrl(input) {
  let s = String(input || "").trim();
  if (!s) return null;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) s = "https://" + s;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : null;
  } catch { return null; }
}
function isValidChannel(c) {
  return c && typeof c.name === "string" && c.name.trim() && normalizeUrl(c.url);
}

// A YouTube channel's home page is full of recommendations and Shorts;
// its /videos tab is just that channel's uploads.
function videosTabUrl(url) {
  const u = new URL(url);
  if (!/(^|\.)youtube\.com$/i.test(u.hostname)) return url;
  const parts = u.pathname.split("/").filter(Boolean);
  const isChannelRoot =
    (parts.length === 1 && parts[0].startsWith("@")) ||
    (parts.length === 2 && ["channel", "c", "user"].includes(parts[0]));
  if (!isChannelRoot) return url;
  u.pathname = "/" + parts.join("/") + "/videos";
  return u.href;
}
const targetUrl = (c) => (settings.videosTab ? videosTabUrl(c.url) : c.url);

// ---------- daily stats ----------
const today = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD, local time
function getStats() {
  const s = read(KEYS.stats, null);
  return s && s.date === today() ? s : { date: today(), opens: {} };
}
function recordOpen(c) {
  const s = getStats();
  s.opens[c.url] = (s.opens[c.url] || 0) + 1;
  write(KEYS.stats, s);
}
function renderStats() {
  const s = getStats();
  const total = Object.values(s.opens).reduce((a, b) => a + b, 0);
  els.stats.textContent = total
    ? `Today: ${total} open${total === 1 ? "" : "s"} across ${Object.keys(s.opens).length} channel${Object.keys(s.opens).length === 1 ? "" : "s"}.`
    : "Nothing opened yet today.";
}

// ---------- rendering ----------
function render() {
  const q = els.search.value.trim().toLowerCase();
  const opens = getStats().opens;
  els.list.replaceChildren();
  let shown = 0;
  channels.forEach((c, i) => {
    if (q && !c.name.toLowerCase().includes(q) && !c.url.toLowerCase().includes(q)) return;
    shown++;
    els.list.append(renderItem(c, i, opens[c.url] || 0));
  });
  els.empty.hidden = channels.length > 0;
  if (channels.length && !shown) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "No match.";
    els.list.append(li);
  }
  renderStats();
}

function renderItem(c, i, opensToday) {
  const li = document.createElement("li");
  li.className = "item";

  const num = document.createElement("span");
  num.className = "num";
  num.textContent = i + 1;

  const a = document.createElement("a");
  a.className = "open";
  a.href = targetUrl(c);
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.addEventListener("click", () => onOpened(c));
  const name = document.createElement("span");
  name.className = "name";
  name.textContent = c.name;
  const url = document.createElement("span");
  url.className = "url";
  url.textContent = c.url.replace(/^https?:\/\/(www\.)?/, "");
  a.append(name, url);

  li.append(num, siteIcon(c), a);

  if (opensToday) {
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = `${opensToday}× today`;
    badge.title = "Times opened today";
    li.append(badge);
  }

  if (managing) {
    const actions = document.createElement("div");
    actions.className = "row-actions";
    actions.append(
      button("Edit", "btn small", () => startEdit(i)),
      button("↑", "btn small", () => move(i, -1), i === 0, "Move up"),
      button("↓", "btn small", () => move(i, 1), i === channels.length - 1, "Move down"),
      button("Delete", "btn small danger", () => remove(i)),
    );
    li.append(actions);
  }
  return li;
}

// Letter avatar first; swapped for the site's own favicon if it loads.
// The request goes only to the site itself, not to a third-party icon service.
const iconCache = new Map(); // origin -> true (loaded) | false (failed)
function siteIcon(c) {
  const avatar = document.createElement("span");
  avatar.className = "avatar";
  avatar.setAttribute("aria-hidden", "true");
  avatar.textContent = c.name.trim().charAt(0).toUpperCase();

  const origin = new URL(c.url).origin;
  const cached = iconCache.get(origin);
  if (cached === false) return avatar;
  const img = new Image(20, 20);
  img.alt = "";
  img.referrerPolicy = "no-referrer";
  if (cached === true) { img.src = origin + "/favicon.ico"; return img; }
  img.onload = () => { iconCache.set(origin, true); avatar.replaceWith(img); };
  img.onerror = () => iconCache.set(origin, false);
  img.src = origin + "/favicon.ico";
  return avatar;
}

function button(label, cls, onClick, disabled = false, ariaLabel) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = cls;
  b.textContent = label;
  b.disabled = disabled;
  if (ariaLabel) b.setAttribute("aria-label", ariaLabel);
  b.addEventListener("click", onClick);
  return b;
}

// ---------- opening + focus session ----------
function openChannel(i) {
  const c = channels[i];
  if (!c) return;
  window.open(targetUrl(c), "_blank", "noopener,noreferrer");
  onOpened(c);
}

function onOpened(c) {
  recordOpen(c);
  if (settings.sessionMinutes > 0) startSession(c.name, settings.sessionMinutes);
  render();
}

function startSession(name, minutes) {
  const now = Date.now();
  session = { name, startedAt: now, endsAt: now + minutes * 60_000, notified: false };
  saveSession();
  tick();
}

function endSession() {
  session = null;
  saveSession();
  document.title = APP_TITLE;
  tick();
}

const fmt = (ms) => {
  const total = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

let timer = null;
function tick() {
  if (!session) {
    els.sessionBar.hidden = true;
    clearInterval(timer); timer = null;
    return;
  }
  if (!timer) timer = setInterval(tick, 1000);

  const now = Date.now();
  const left = session.endsAt - now;
  const over = left <= 0;
  els.sessionBar.hidden = false;
  els.sessionBar.classList.toggle("over", over);
  els.sessionName.textContent = session.name;

  if (over) {
    els.sessionTime.textContent = `Time's up · +${fmt(-left)}`;
    document.title = `⏰ Time's up · ${APP_TITLE}`;
    if (!session.notified) {
      session.notified = true;
      saveSession();
      notify(session);
    }
  } else {
    els.sessionTime.textContent = `${fmt(left)} left`;
    els.sessionProgress.style.width = `${(100 * (now - session.startedAt)) / (session.endsAt - session.startedAt)}%`;
    document.title = `${fmt(left)} · ${APP_TITLE}`;
  }
}

function notify(s) {
  const minutes = Math.round((s.endsAt - s.startedAt) / 60_000);
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      new Notification("Time's up", { body: `Your ${minutes}-minute session on ${s.name} is over.`, icon: "icon.svg", tag: "youtubefocus" });
    } catch { /* some platforms only allow notifications from a service worker */ }
  }
}

els.extendBtn.addEventListener("click", () => {
  if (!session) return;
  session.endsAt = Math.max(session.endsAt, Date.now()) + 5 * 60_000;
  session.notified = false;
  saveSession();
  tick();
});
els.endBtn.addEventListener("click", endSession);
document.addEventListener("visibilitychange", () => { if (!document.hidden) tick(); });

// ---------- settings ----------
function renderSettings() {
  els.sessionMinutes.value = String(settings.sessionMinutes);
  els.videosTab.checked = settings.videosTab;
  if (!("Notification" in window)) {
    els.notifyBtn.closest(".row").hidden = true;
    return;
  }
  const p = Notification.permission;
  els.notifyBtn.disabled = p !== "default";
  els.notifyBtn.textContent = p === "granted" ? "Notifications on" : p === "denied" ? "Blocked in browser settings" : "Enable notifications";
}
els.sessionMinutes.addEventListener("change", () => {
  settings.sessionMinutes = Number(els.sessionMinutes.value);
  saveSettings();
});
els.videosTab.addEventListener("change", () => {
  settings.videosTab = els.videosTab.checked;
  saveSettings();
  render();
});
els.notifyBtn.addEventListener("click", async () => {
  try { await Notification.requestPermission(); } catch { /* ignore */ }
  renderSettings();
});

// ---------- manage list ----------
function setManaging(on) {
  managing = on;
  els.panel.hidden = !on;
  els.manageBtn.setAttribute("aria-pressed", String(on));
  els.manageBtn.textContent = on ? "Done" : "Manage list";
  if (on) renderSettings(); else resetForm();
  render();
}

function resetForm() {
  editingIndex = -1;
  els.form.reset();
  els.error.hidden = true;
  els.formTitle.textContent = "Add a channel";
  els.saveBtn.textContent = "Add";
  els.cancelEdit.hidden = true;
}

function startEdit(i) {
  editingIndex = i;
  els.name.value = channels[i].name;
  els.url.value = channels[i].url;
  els.formTitle.textContent = `Edit #${i + 1}`;
  els.saveBtn.textContent = "Save";
  els.cancelEdit.hidden = false;
  els.error.hidden = true;
  els.panel.scrollIntoView({ behavior: "smooth", block: "start" });
  els.name.focus({ preventScroll: true });
}

function move(i, dir) {
  const j = i + dir;
  if (j < 0 || j >= channels.length) return;
  [channels[i], channels[j]] = [channels[j], channels[i]];
  if (editingIndex === i) editingIndex = j;
  else if (editingIndex === j) editingIndex = i;
  saveChannels(); render();
}

function remove(i) {
  const [removed] = channels.splice(i, 1);
  if (editingIndex === i) resetForm();
  else if (editingIndex > i) editingIndex--;
  saveChannels(); render();
  showToast(`Deleted “${removed.name}”.`, "Undo", () => {
    channels.splice(Math.min(i, channels.length), 0, removed);
    if (editingIndex >= i) editingIndex++;
    saveChannels(); render();
  });
}

function showError(msg) {
  els.error.textContent = msg;
  els.error.hidden = false;
}

els.form.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = els.name.value.trim();
  const url = normalizeUrl(els.url.value);
  if (!name) return showError("Name is required.");
  if (!url) return showError("Enter a valid http(s) URL.");
  const dup = channels.findIndex((c, k) => c.url === url && k !== editingIndex);
  if (dup >= 0) return showError(`That link is already in the list as #${dup + 1} “${channels[dup].name}”.`);
  if (editingIndex >= 0) channels[editingIndex] = { name, url };
  else channels.push({ name, url });
  saveChannels(); resetForm(); render();
});
els.cancelEdit.addEventListener("click", resetForm);
els.manageBtn.addEventListener("click", () => setManaging(!managing));
els.search.addEventListener("input", render);

els.resetBtn.addEventListener("click", () => {
  const previous = channels;
  channels = DEFAULTS.slice();
  saveChannels(); resetForm(); render();
  showToast("List reset to defaults.", "Undo", () => { channels = previous; saveChannels(); render(); });
});

// ---------- toast with undo ----------
let toastTimer = null;
let toastHandler = null;
function showToast(text, actionLabel, onAction) {
  clearTimeout(toastTimer);
  els.toastText.textContent = text;
  els.toastAction.textContent = actionLabel;
  els.toastAction.hidden = !onAction;
  toastHandler = onAction;
  els.toast.hidden = false;
  toastTimer = setTimeout(hideToast, 7000);
}
function hideToast() {
  els.toast.hidden = true;
  toastHandler = null;
}
els.toastAction.addEventListener("click", () => {
  const fn = toastHandler;
  hideToast();
  if (fn) fn();
});

// ---------- import / export ----------
els.exportBtn.addEventListener("click", () => {
  const text = channels.map((c) => `${c.name},${c.url}`).join("\n") + "\n";
  const blob = new Blob([text], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "channelData.txt";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

els.importInput.addEventListener("change", async () => {
  const file = els.importInput.files[0];
  els.importInput.value = "";
  if (!file) return;
  const parsed = parseImport(await file.text());
  if (!parsed.length) return showToast(`No valid channels found in ${file.name}.`);
  const previous = channels;
  channels = parsed;
  saveChannels(); resetForm(); render();
  showToast(`Imported ${parsed.length} channel${parsed.length === 1 ? "" : "s"}.`, "Undo", () => {
    channels = previous; saveChannels(); render();
  });
});

// Accepts JSON [{name,url}] or the original "Name,URL" lines (split on the first comma).
function parseImport(text) {
  try {
    const data = JSON.parse(text);
    if (Array.isArray(data)) {
      return data.filter(isValidChannel).map((c) => ({ name: c.name.trim(), url: normalizeUrl(c.url) }));
    }
  } catch { /* not JSON */ }
  return text.split(/\r?\n/).flatMap((line) => {
    const k = line.indexOf(",");
    if (k < 0) return [];
    const name = line.slice(0, k).trim();
    const url = normalizeUrl(line.slice(k + 1));
    return name && url ? [{ name, url }] : [];
  });
}

// ---------- keyboard ----------
document.addEventListener("keydown", (e) => {
  const typing = e.target instanceof Element && e.target.closest("input, textarea, select");
  if (e.key === "/" && !typing) { e.preventDefault(); els.search.focus(); return; }
  if (e.key === "Escape") {
    if (e.target === els.search) { els.search.value = ""; render(); els.search.blur(); }
    else if (managing && !typing) setManaging(false);
    return;
  }
  if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
  if (/^[1-9]$/.test(e.key)) openChannel(Number(e.key) - 1);
});

// ---------- install / offline ----------
let installPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  installPrompt = e;
  els.installBtn.hidden = false;
});
els.installBtn.addEventListener("click", async () => {
  if (!installPrompt) return;
  installPrompt.prompt();
  await installPrompt.userChoice.catch(() => {});
  installPrompt = null;
  els.installBtn.hidden = true;
});
window.addEventListener("appinstalled", () => { els.installBtn.hidden = true; });

if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
  navigator.serviceWorker.register("sw.js").catch(() => { /* offline support is optional */ });
}

// Keep tabs in sync if the app is open twice.
window.addEventListener("storage", (e) => {
  if (e.key === KEYS.channels) channels = read(KEYS.channels, DEFAULTS.slice()).filter(isValidChannel);
  if (e.key === KEYS.settings) { settings = { ...DEFAULT_SETTINGS, ...read(KEYS.settings, {}) }; renderSettings(); }
  if (e.key === KEYS.session) { session = read(KEYS.session, null); if (!session) document.title = APP_TITLE; tick(); }
  render();
});

render();
tick();
