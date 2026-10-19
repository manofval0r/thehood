/* Cyber-Security 300L Course Resources — application logic */
const MANIFEST_URL = "resources.json";

let manifest = null;
let pdfjsLoaded = false;
let pdfjsLib = null;

/* ---------- Helpers ---------- */

const qs = (s, r = document) => r.querySelector(s);
const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

const urlPath = (p) => encodeURI(p);

const formatUnits = (n) => (n === 1 ? "1 unit" : `${n} units`);

const typeLabel = (t) => {
  const map = { pdf: "PDF", pptx: "Slides", txt: "Text", csv: "Data", json: "Data", eml: "Email" };
  return map[t] || "File";
};

/* ---------- Load manifest ---------- */

async function loadManifest() {
  const res = await fetch(MANIFEST_URL, { cache: "no-store" });
  if (!res.ok) throw new Error("Could not load resources manifest");
  manifest = await res.json();
  return manifest;
}

const courseByCode = (code) =>
  manifest.courses.find((c) => c.code.toLowerCase() === code.toLowerCase());

const allCourses = () => manifest.courses;

/* ---------- Render: course list (index.html) ---------- */

function renderCourseList() {
  const container = qs("#course-grid");
  const searchInput = qs("#search");
  const courses = allCourses();

  let filtered = courses;

  function render(list) {
    container.innerHTML = "";
    if (list.length === 0) {
      container.innerHTML = `<p class="no-resources" style="text-align:center;grid-column:1/-1;">No courses match your search.</p>`;
      return;
    }
    list.forEach((c) => {
      const hasRes = c.resources && c.resources.length > 0;
      const empty = !hasRes;
      const card = document.createElement("a");
      card.href = `course.html?code=${encodeURIComponent(c.code)}`;
      card.className = `course-card${empty ? " empty" : ""}`;
      card.tabIndex = 0;
      card.innerHTML = `
        <div class="course-head">
          <div class="course-code">${escapeHtml(c.code)}</div>
          <div class="course-units">${formatUnits(c.units)}</div>
        </div>
        <h3 class="course-title">${escapeHtml(c.title)}</h3>
        <div class="course-meta">
          <span class="chip">${escapeHtml(c.lecturer)}</span>
          <span class="chip">${escapeHtml(c.venue)}</span>
          <span class="chip">${escapeHtml(c.day)}</span>
        </div>
        <div class="resource-count">
          ${hasRes ? `${c.resources.length} resource${c.resources.length !== 1 ? "s" : ""}` : "No resources yet"}
        </div>
      `;
      container.appendChild(card);
    });
  }

  render(filtered);

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase().trim();
      if (!term) {
        render(courses);
        return;
      }
      filtered = courses.filter((c) => {
        const haystack = [
          c.code,
          c.title,
          c.lecturer,
          c.venue,
          c.day,
          c.description || ""
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(term);
      });
      render(filtered);
    });
  }
}

/* ---------- Render: course detail (course.html) ---------- */

function renderCourseDetail() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  if (!code) {
    qs("#detail-body").innerHTML =
      '<p class="no-resources">No course specified.</p>';
    return;
  }

  const course = courseByCode(code);
  if (!course) {
    qs("#detail-body").innerHTML =
      '<p class="no-resources">Course not found.</p>';
    return;
  }

  // Page title
  document.title = `${course.code} — Course Resources`;

  // Header
  const head = qs("#detail-head");
  head.innerHTML = `
    <h1 class="detail-code">${escapeHtml(course.code)}</h1>
    <h2 class="detail-title">${escapeHtml(course.title)}</h2>
    <div class="detail-meta">
      <span class="chip">${formatUnits(course.units)}</span>
      <span class="chip">${escapeHtml(course.lecturer)}</span>
      <span class="chip">${escapeHtml(course.venue)}</span>
      <span class="chip">${escapeHtml(course.day)} · ${escapeHtml(course.time)}</span>
    </div>
    <p class="detail-desc">${escapeHtml(course.description)}</p>
  `;

  // Tabs
  const panels = qsa(".tab-panel");
  const tabs = qsa(".tab");
  tabs.forEach((t) => {
    t.addEventListener("click", () => {
      const target = t.dataset.tab;
      tabs.forEach((x) => x.classList.remove("active"));
      panels.forEach((p) => p.classList.remove("active"));
      t.classList.add("active");
      qs(`#panel-${target}`).classList.add("active");
    });
  });

  // Resources tab
  renderResources(course);
}

function renderResources(course) {
  const grid = qs("#resource-grid");
  const batch = qs("#batch-actions");
  const selectAll = qs("#select-all");
  const resources = course.resources || [];

  if (!resources.length) {
    grid.innerHTML = `
      <div class="no-resources" style="grid-column:1/-1;">
        <p>No resources published for ${course.code} yet.</p>
        <p style="font-size:13px;">Check back — your lecturer is still uploading materials.</p>
      </div>`;
    batch.style.display = "none";
    return;
  }

  batch.style.display = "flex";

  grid.innerHTML = "";
  resources.forEach((r) => {
    const card = document.createElement("article");
    card.className = "resource-card";
    card.tabIndex = 0;
    card.dataset.id = r.id;
    card.innerHTML = `
      <input type="checkbox" class="resource-check" value="${escapeHtml(r.id)}" aria-label="Select ${escapeHtml(r.title)}">
      <div class="resource-type">${typeLabel(r.type)}</div>
      <h4 class="resource-title">${escapeHtml(r.title)}</h4>
      <p class="resource-desc">${escapeHtml(r.description || "")}</p>
      <div class="resource-actions">
        <button class="view-btn${r.type !== "pdf" ? " secondary" : ""} disabled${r.type !== "pdf" ? "" : ""}">
          ${r.type === "pdf" ? "View" : "Download"}
        </button>
        <button class="download-btn">Download</button>
      </div>
      <div class="resource-preview" id="preview-${escapeHtml(r.id)}" aria-hidden="true"></div>
    `;

    const check = card.querySelector(".resource-check");
    const viewBtn = card.querySelector(".view-btn");
    const dlBtn = card.querySelector(".download-btn");
    const preview = card.querySelector(".resource-preview");

    dlBtn.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      window.location.href = urlPath(r.path);
    });

    if (r.type === "pdf") {
      viewBtn.disabled = false;
      viewBtn.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        openPdfModal(r);
      });
    }

    // Expand / sneak peak on card click (not on buttons/checkbox)
    card.addEventListener("click", (ev) => {
      if (ev.target.tagName === "BUTTON" || ev.target.tagName === "INPUT") return;
      card.classList.toggle("expanded");
      const expanded = card.classList.contains("expanded");
      preview.setAttribute("aria-hidden", !expanded);
      if (expanded) {
        renderPreview(card, r);
      } else {
        preview.innerHTML = "";
      }
    });

    card.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        card.click();
      }
    });

    grid.appendChild(card);
  });

  // Select all / batch download
  const downloadSelected = qs("#download-selected");
  selectAll.addEventListener("change", () => {
    qsa(".resource-check", grid).forEach((c) => {
      c.checked = selectAll.checked;
    });
  });

  downloadSelected.addEventListener("click", async () => {
    const checked = qsa(".resource-check:checked", grid);
    if (!checked.length) return;
    downloadSelected.disabled = true;
    downloadSelected.textContent = "Zipping…";
    try {
      await batchDownload(checked.map((c) => c.value));
    } finally {
      downloadSelected.disabled = false;
      downloadSelected.textContent = "Download selected";
    }
  });
}

function renderPreview(card, resource) {
  const preview = card.querySelector(".resource-preview");
  if (resource.type === "pdf") {
    preview.innerHTML = `<canvas id="canvas-${escapeHtml(resource.id)}"></canvas>`;
    renderPdfFirstPage(resource, qs(`#canvas-${escapeHtml(resource.id)}`));
  } else {
    preview.innerHTML = `<p>Preview not available for ${typeLabel(
      resource.type
    )}. <a href="${urlPath(resource.path)}" target="_blank" rel="noopener">Download to open</a>.</p>`;
  }
}

/* ---------- Batch download (JSZip) ---------- */

async function batchDownload(resourceIds) {
  const JSZip = (await import("https://esm.sh/jszip@3.10.1")).default;
  const zip = new JSZip();

  for (const id of resourceIds) {
    const resource = findResource(id);
    if (!resource) continue;
    try {
      const blob = await fetchBlob(urlPath(resource.path));
      zip.file(resource.title + getExt(resource.path), blob);
    } catch (err) {
      console.warn("Failed to add", resource.title, err);
    }
  }

  const content = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(content);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cyber305-resources-${Date.now()}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function findResource(id) {
  for (const c of manifest.courses) {
    const r = c.resources.find((x) => x.id === id);
    if (r) return r;
  }
  return null;
}

function getExt(path) {
  const m = path.match(/\.([^./]+)$/);
  return m ? "." + m[1] : "";
}

async function fetchBlob(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.blob();
}

/* ---------- PDF viewer (PDF.js) ---------- */

async function loadPdfjs() {
  if (pdfjsLoaded) return pdfjsLib;
  pdfjsLib = await import(
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.mjs"
  );
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.mjs";
  pdfjsLoaded = true;
  return pdfjsLib;
}

async function openPdfModal(resource) {
  await loadPdfjs();
  const modal = qs("#pdf-modal");
  const title = qs("#modal-title");
  const canvas = qs("#pdf-canvas");
  title.textContent = resource.title;
  modal.classList.add("open");

  const loadingTask = pdfjsLib.getDocument({ url: urlPath(resource.path) });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 1.4 });

  canvas.height = viewport.height;
  canvas.width = viewport.width;

  await page.render({
    canvasContext: canvas.getContext("2d"),
    viewport: viewport,
  }).promise;

  qs("#pdf-close").onclick = closePdfModal;
  qs("#pdf-modal").onclick = (e) => {
    if (e.target === qs("#pdf-modal")) closePdfModal();
  };
}

function closePdfModal() {
  qs("#pdf-modal").classList.remove("open");
  qs("#pdf-canvas").getContext("2d").clearRect(0, 0, 2000, 2000);
}

async function renderPdfFirstPage(resource, canvasEl) {
  try {
    await loadPdfjs();
    const loadingTask = pdfjsLib.getDocument({ url: urlPath(resource.path) });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 0.85 });
    canvasEl.height = viewport.height;
    canvasEl.width = viewport.width;
    await page.render({
      canvasContext: canvasEl.getContext("2d"),
      viewport: viewport,
    }).promise;
  } catch (err) {
    canvasEl.parentElement.innerHTML = `<p style="color:#666;font-size:12px;">Preview unavailable.</p>`;
  }
}

/* ---------- Escape ---------- */

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ---------- Init ---------- */

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await loadManifest();
  } catch (err) {
    console.error(err);
  }

  if (qs("#course-grid")) renderCourseList();
  if (qs("#detail-head")) renderCourseDetail();

  // Close modal on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePdfModal();
  });
});
