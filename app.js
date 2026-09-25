const projects = [
  {
    name: "Aeredium",
    status: "maybe-late",
    logo: "aerediumlogo.jpg",
    twitter: "https://x.com/aeredium",
    discord: "https://discord.gg/aeredium",
    description: "An attested blockchain secured by machine validators running in trusted execution environments."
  },
  {
    name: "Blinq",
    status: "maybe-late",
    logo: "blinqlogo.jpg",
    twitter: "https://x.com/blinqfi",
    discord: "https://discord.gg/blinq",
    description: "The derivatives layer for prediction markets."
  },
  {
    name: "Pact_Swap",
    status: "prime",
    logo: "pactswaplogo.jpg",
    twitter: "https://x.com/Pact_Swap",
    discord: "https://discord.gg/pactswap",
    description: "The ultimate cross-chain DEX."
  },
  {
    name: "Providence",
    status: "prime",
    logo: "providencelogo.png",
    twitter: "https://x.com/PlayProvidence",
    discord: "https://discord.gg/bjeHDc9WUK",
    description: "A player-owned sci-fi survival universe."
  },
  {
    name: "heyAura",
    status: "maybe-late",
    logo: "heyauralogo.jpg",
    twitter: "https://x.com/heyaura",
    discord: "",
    description: "A Web3 AI assistant that makes crypto easy."
  },
  {
    name: "dTelecom",
    status: "maybe-late",
    logo: "dtelecomlogo.jpg",
    twitter: "https://x.com/dtelecom",
    discord: "https://discord.gg/dtelecom",
    description: "Communication layer for agents and humans."
  },
  {
    name: "Veera",
    status: "maybe-late",
    logo: "veeralogo.jpg",
    twitter: "https://x.com/On_Veera",
    discord: "https://discord.gg/on-veera",
    description: "Your global neobank, built onchain: earn, invest, borrow, and spend across assets."
  },
  {
    name: "Perceptron",
    status: "maybe-late",
    logo: "perceptronlogo.jpg",
    twitter: "https://x.com/PerceptronNTWK",
    discord: "https://discord.gg/perceptron",
    description: "The decentralized AI data network."
  },
  {
    name: "MovitOn",
    status: "maybe-late",
    logo: "movitonlogo.jpg",
    twitter: "https://x.com/MovitOn_P2P",
    discord: "https://discord.gg/moviton",
    description: "A global Web3 P2P delivery platform powered by AI and smart contracts."
  },
  {
    name: "Quip Network",
    status: "maybe-late",
    logo: "quipnetworklogo.jpg",
    twitter: "https://x.com/quipnetwork",
    discord: "https://discord.gg/quipnetwork",
    description: "The worldwide quantum computer."
  },
  {
    name: "American Fortress",
    status: "prime",
    logo: "americanfortlogo.jpg",
    twitter: "https://x.com/Americanfort_io",
    discord: "https://discord.gg/americanfortress",
    description: "The transaction layer that's private by default."
  },
  {
    name: "Unicity",
    status: "prime",
    logo: "unicitylogo.jpg",
    twitter: "https://x.com/unicity_labs",
    discord: "https://discord.gg/unicity",
    description: "Partner project connected to Pythenians role opportunities."
  },
  {
    name: "Fogo",
    status: "too-late",
    logo: "fogologo.jpg",
    twitter: "https://x.com/fogo",
    discord: "https://discord.com/invite/fogochain",
    description: "Defying physics to achieve real-time experiences at scale. SVM Layer 1."
  },
  {
    name: "Valiant",
    status: "too-late",
    logo: "valiantlogo.jpg",
    twitter: "https://x.com/ValiantTrade",
    discord: "https://discord.com/invite/valianttrade",
    description: "Institutional trading in your browser. CEX speed. DEX freedom."
  },
  {
    name: "Monad Nomads",
    status: "too-late",
    logo: "monadnomadslogo.jpg",
    twitter: "https://x.com/MonadNomadsNFT",
    discord: "https://discord.com/invite/monadnomads",
    description: "The first community-driven NFT initiative on Monad."
  },
  {
    name: "Bluefin",
    status: "too-late",
    logo: "bluefinlogo.jpg",
    twitter: "https://x.com/bluefinapp",
    discord: "https://discord.com/invite/bluefinapp",
    description: "A decentralized orderbook-based exchange built for both professional and first-time traders."
  }
];

const news = [
  {
    title: "Monthly RWA Perp Report",
    preview: "August 2026 RWA perp report: record $751.9B volume (+6.2% vs July). Memory stocks (SNDK, SK Hynix, Micron) and Korean names drove both the rally and the selloff. Moderna perps listed within hours of the clinical news. Pyth powered 96% of tracked volume as 24/7 markets keep growing.",
    url: "https://x.com/PythNetwork/status/2097324776427503907"
  }
];

const grid = document.querySelector("#projectsGrid");
const newsGrid = document.querySelector("#newsGrid");
const searchInput = document.querySelector("#searchInput");
const resultCount = document.querySelector("#resultCount");
const newsCount = document.querySelector("#newsCount");
const projectCount = document.querySelector("#projectCount");
const activeCount = document.querySelector("#activeCount");
const filterButtons = [...document.querySelectorAll(".segment")];
const viewLinks = [...document.querySelectorAll("[data-view-link]")];
const views = [...document.querySelectorAll("[data-view]")];
const menuButton = document.querySelector(".mobile-menu-button");
const menuBackdrop = document.querySelector(".sidebar-backdrop");
const sidebar = document.querySelector("#sidebar");
const shareForm = document.querySelector("#shareForm");
const pythenianNumberInput = document.querySelector("#pythenianNumber");
const pythWonInput = document.querySelector("#pythWon");
const shareStatus = document.querySelector("#shareStatus");
const shareResult = document.querySelector("#shareResult");
const shareCanvas = document.querySelector("#shareCanvas");
const downloadCardButton = document.querySelector("#downloadCard");
const copyCardButton = document.querySelector("#copyCard");
const shareModal = document.querySelector("#shareModal");

let currentFilter = "all";
let pytheniansData = {};
let currentCardBlobUrl = "";
let currentShareRecord = null;

const statusLabels = {
  prime: "Prime Time",
  "maybe-late": "Maybe Late",
  "too-late": "Too Late"
};

function normalize(value) {
  return value.toLowerCase().trim();
}

function projectMatches(project, query) {
  const statusMatch = currentFilter === "all" || project.status === currentFilter;
  const queryMatch = !query || normalize(project.name).includes(query);

  return statusMatch && queryMatch;
}

function renderProjects() {
  const query = normalize(searchInput.value);
  const visibleProjects = projects.filter((project) => projectMatches(project, query));

  resultCount.textContent = `${visibleProjects.length} shown`;
  projectCount.textContent = projects.length;
  activeCount.textContent = projects.filter((project) => project.status === "prime").length;

  if (!visibleProjects.length) {
    grid.innerHTML = '<div class="empty-state">No projects match this filter.</div>';
    return;
  }

  grid.innerHTML = visibleProjects.map((project) => {
    const initial = project.name.slice(0, 1);
    const logo = project.logo
      ? `<img src="${project.logo}" alt="" loading="lazy">`
      : initial;
    const twitterIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.4 3h3.1l-6.8 7.8 8 10.2h-6.3l-4.9-6.3L4.9 21H1.8l7.3-8.4L1.5 3h6.5l4.4 5.7L17.4 3Zm-1.1 16.2H18L7.1 4.7H5.3l11 14.5Z"></path></svg>';
    const discordIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.4 5.1A16.3 16.3 0 0 0 15.4 4l-.2.4c1.5.4 2.2 1 2.2 1a13.1 13.1 0 0 0-9 0s.7-.6 2.3-1L10.4 4a16.3 16.3 0 0 0-4 1.1C3.8 9 3.1 12.7 3.4 16.4A16.2 16.2 0 0 0 8.2 19l.6-.8a10.6 10.6 0 0 1-1.6-.8l.4-.3a11.6 11.6 0 0 0 8.8 0l.4.3a10.6 10.6 0 0 1-1.6.8l.6.8a16.2 16.2 0 0 0 4.8-2.6c.4-4.3-.7-8-3.2-11.3ZM9.4 14.2c-.9 0-1.6-.8-1.6-1.7s.7-1.7 1.6-1.7 1.6.8 1.6 1.7-.7 1.7-1.6 1.7Zm5.2 0c-.9 0-1.6-.8-1.6-1.7s.7-1.7 1.6-1.7 1.6.8 1.6 1.7-.7 1.7-1.6 1.7Z"></path></svg>';
    const twitterButton = project.twitter
      ? `<a class="social-link" href="${project.twitter}" target="_blank" rel="noreferrer">${twitterIcon}<span>Twitter</span></a>`
      : `<button class="social-link disabled" type="button" disabled>${twitterIcon}<span>Twitter</span></button>`;
    const discordButton = project.discord
      ? `<a class="social-link" href="${project.discord}" target="_blank" rel="noreferrer">${discordIcon}<span>Discord</span></a>`
      : `<button class="social-link disabled" type="button" disabled>${discordIcon}<span>Discord</span></button>`;

    return `
      <article class="project-card">
        <div class="card-top">
          <div class="project-title">
            <div class="project-logo">${logo}</div>
            <div>
              <h4>${project.name}</h4>
            </div>
          </div>
          <span class="status ${project.status}">${statusLabels[project.status]}</span>
        </div>
        <p class="project-desc">${project.description}</p>
        <div class="social-actions">
          ${twitterButton}
          ${discordButton}
        </div>
      </article>
    `;
  }).join("");
}

function renderNews() {
  newsCount.textContent = `${news.length} ${news.length === 1 ? "post" : "posts"}`;

  if (!news.length) {
    newsGrid.innerHTML = '<div class="empty-state">No news yet.</div>';
    return;
  }

  newsGrid.innerHTML = news.map((item) => `
    <article class="news-item">
      <div class="news-item-head">
        <h4>${item.title}</h4>
      </div>
      <div class="tweet-frame">
        <blockquote class="twitter-tweet" data-theme="dark">
          <a href="${item.url}"></a>
        </blockquote>
      </div>
      <aside class="news-preview">
        <p>${item.preview}</p>
      </aside>
    </article>
  `).join("");

  loadTwitterEmbeds();
}

function loadTwitterEmbeds() {
  if (window.twttr?.widgets) {
    window.twttr.widgets.load(newsGrid);
    return;
  }

  if (document.querySelector('script[src="https://platform.twitter.com/widgets.js"]')) {
    return;
  }

  const script = document.createElement("script");
  script.src = "https://platform.twitter.com/widgets.js";
  script.async = true;
  script.charset = "utf-8";
  document.body.appendChild(script);
}

function setActiveView(viewName) {
  const knownViews = views.map((view) => view.dataset.view);
  const nextView = knownViews.includes(viewName) ? viewName : "projects";

  views.forEach((view) => {
    view.classList.toggle("active", view.dataset.view === nextView);
  });

  viewLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.viewLink === nextView);
  });

  if (nextView === "projects") {
    window.history.replaceState(null, "", window.location.pathname);
  } else {
    window.history.replaceState(null, "", `#${nextView}`);
  }
}

async function loadPytheniansData() {
  if (!shareStatus) return;

  try {
    const response = await fetch("data/pythenians.json", { cache: "no-store" });
    const datasetResponse = response.ok
      ? response
      : await fetch("data/pythenians.poc.json", { cache: "no-store" });

    if (!datasetResponse.ok) {
      throw new Error("Dataset is not available yet.");
    }

    pytheniansData = await datasetResponse.json();
    const verifiedCount = Object.values(pytheniansData).filter((item) => item.verification === "verified").length;
    shareStatus.textContent = `${verifiedCount} verified Pythenians loaded.`;
    drawEmptyCard();
  } catch (error) {
    shareStatus.textContent = "Dataset is not available yet.";
    drawEmptyCard();
  }
}

function calculateDaysHeld(heldSince) {
  return Math.max(0, Math.floor((Date.now() - new Date(heldSince).getTime()) / 86400000));
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

function drawRoundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function drawEmptyCard() {
  if (!shareCanvas) return;

  const context = shareCanvas.getContext("2d");
  const gradient = context.createLinearGradient(0, 0, 1200, 675);
  gradient.addColorStop(0, "#211932");
  gradient.addColorStop(0.55, "#3a284e");
  gradient.addColorStop(1, "#1f2f3d");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 1200, 675);
  context.fillStyle = "rgba(255,255,255,0.88)";
  context.font = "700 48px Archivo, sans-serif";
  context.fillText("PYTHLIST.COM", 72, 110);
  context.fillStyle = "rgba(255,255,255,0.62)";
  context.font = "500 28px Archivo, sans-serif";
  context.fillText("Enter your Pythenians NFT number to build a card.", 72, 170);
}

async function drawShareCard(record, pythWon) {
  const context = shareCanvas.getContext("2d");
  const imageUrl = record.localImage ? `data/${record.localImage}` : record.image;
  const [image, brandMark] = await Promise.all([
    loadImage(imageUrl),
    loadImage("pythlogoforpythlist.png")
  ]);
  const daysHeld = calculateDaysHeld(record.heldSince);

  context.clearRect(0, 0, 1200, 675);

  context.fillStyle = "#261e35";
  context.fillRect(0, 0, 1200, 675);

  const bg = context.createLinearGradient(0, 0, 1200, 675);
  bg.addColorStop(0, "#3a2d48");
  bg.addColorStop(0.46, "#56396e");
  bg.addColorStop(1, "#234a58");
  context.fillStyle = bg;
  context.fillRect(0, 0, 1200, 675);

  const sheen = context.createRadialGradient(930, 110, 60, 930, 110, 720);
  sheen.addColorStop(0, "rgba(83,234,253,0.24)");
  sheen.addColorStop(0.52, "rgba(242,169,255,0.12)");
  sheen.addColorStop(1, "rgba(242,169,255,0)");
  context.fillStyle = sheen;
  context.fillRect(0, 0, 1200, 675);

  const panelFill = "rgba(49,41,64,0.62)";
  const panelStroke = "rgba(248,245,255,0.14)";

  context.shadowColor = "rgba(9,5,20,0.32)";
  context.shadowBlur = 46;
  context.shadowOffsetY = 18;
  context.fillStyle = "rgba(49,41,64,0.42)";
  drawRoundedRect(context, 44, 44, 1112, 587, 30);
  context.fill();
  context.shadowColor = "transparent";
  context.strokeStyle = panelStroke;
  context.lineWidth = 2;
  context.stroke();

  context.save();
  context.globalAlpha = 0.2;
  context.drawImage(brandMark, 842, -18, 300, 300);
  context.restore();

  context.shadowColor = "rgba(9,5,20,0.38)";
  context.shadowBlur = 34;
  context.shadowOffsetY = 16;
  context.fillStyle = "rgba(36,27,53,0.72)";
  context.fillRect(72, 72, 504, 530);
  context.shadowColor = "transparent";

  context.save();
  context.beginPath();
  context.rect(90, 90, 468, 468);
  context.clip();
  context.drawImage(image, 90, 90, 468, 468);
  context.restore();

  context.beginPath();
  context.rect(90, 90, 468, 468);
  context.strokeStyle = "rgba(242,169,255,0.42)";
  context.lineWidth = 3;
  context.stroke();

  context.fillStyle = "rgba(248,245,255,0.58)";
  context.font = "800 20px IBM Plex Mono, monospace";
  context.fillText("PYTHENIANS NFT", 632, 118);

  context.fillStyle = "#f8f5ff";
  context.font = "900 86px Archivo, sans-serif";
  context.fillText(`#${record.number}`, 632, 206);

  context.fillStyle = "rgba(248,245,255,0.52)";
  context.font = "600 23px Archivo, sans-serif";
  context.fillText("Current ownership streak", 636, 244);

  context.fillStyle = panelFill;
  drawRoundedRect(context, 632, 284, 250, 142, 22);
  context.fill();
  drawRoundedRect(context, 904, 284, 204, 142, 22);
  context.fill();
  context.strokeStyle = panelStroke;
  context.lineWidth = 2;
  drawRoundedRect(context, 632, 284, 250, 142, 22);
  context.stroke();
  drawRoundedRect(context, 904, 284, 204, 142, 22);
  context.stroke();

  context.fillStyle = "rgba(248,245,255,0.48)";
  context.font = "800 17px IBM Plex Mono, monospace";
  context.fillText("DAYS OWNED", 656, 324);
  context.fillText("SINCE", 928, 324);

  context.fillStyle = "#f8f5ff";
  context.font = "900 68px Archivo, sans-serif";
  context.fillText(`${daysHeld}`, 656, 394);

  context.fillStyle = "#f8f5ff";
  context.font = "800 25px Archivo, sans-serif";
  context.fillText(new Date(record.heldSince).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  }), 928, 374);
  context.fillStyle = "rgba(248,245,255,0.48)";
  context.font = "700 17px IBM Plex Mono, monospace";
  context.fillText(new Date(record.heldSince).getFullYear().toString(), 928, 402);

  context.fillStyle = panelFill;
  drawRoundedRect(context, 632, 462, 476, 92, 22);
  context.fill();
  context.strokeStyle = panelStroke;
  context.lineWidth = 2;
  drawRoundedRect(context, 632, 462, 476, 92, 22);
  context.stroke();

  context.fillStyle = "rgba(248,245,255,0.48)";
  context.font = "800 16px IBM Plex Mono, monospace";
  context.fillText("$PYTH WHEEL REWARDS", 656, 497);

  context.fillStyle = pythWon ? "#f8f5ff" : "rgba(248,245,255,0.38)";
  context.font = "900 34px IBM Plex Mono, monospace";
  context.fillText(pythWon ? `${pythWon} $PYTH` : "NOT ENTERED", 656, 535);

  context.strokeStyle = "rgba(83,234,253,0.32)";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(632, 586);
  context.lineTo(790, 586);
  context.stroke();

  context.fillStyle = "rgba(248,245,255,0.78)";
  context.font = "800 22px IBM Plex Mono, monospace";
  context.textAlign = "right";
  context.fillText("PYTHLIST.COM", 1128, 610);
  context.textAlign = "left";
  context.shadowColor = "transparent";
}

function renderShareResult(record) {
  if (!shareResult) return;

  const daysHeld = calculateDaysHeld(record.heldSince);
  const imageUrl = record.localImage ? `data/${record.localImage}` : record.image;

  shareResult.innerHTML = `
    <div class="share-result-media">
      <img src="${imageUrl}" alt="">
    </div>
    <div class="share-result-body">
      <p>Pythenians #${record.number}</p>
      <strong>${daysHeld} ${daysHeld === 1 ? "day" : "days"} owned</strong>
      <span>Since ${new Date(record.heldSince).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
      })}</span>
    </div>
    <button class="share-button result-share-button" type="button" data-open-share>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"></path><path d="M16 6 12 2 8 6"></path><path d="M12 2v13"></path></svg>
      Share
    </button>
  `;

  shareResult.querySelector("[data-open-share]")?.addEventListener("click", openSharePanel);
}

function openSharePanel() {
  if (!currentShareRecord || !shareModal) return;
  shareModal.classList.add("active");
  shareModal.setAttribute("aria-hidden", "false");
}

function closeSharePanel() {
  shareModal?.classList.remove("active");
  shareModal?.setAttribute("aria-hidden", "true");
}

async function copyCurrentCard() {
  if (!shareCanvas) return;

  try {
    const blob = await new Promise((resolve) => shareCanvas.toBlob(resolve, "image/png"));
    await navigator.clipboard.write([
      new ClipboardItem({ "image/png": blob })
    ]);
    shareStatus.textContent = "Card copied to clipboard.";
  } catch (error) {
    shareStatus.textContent = "Copy is not available in this browser. Use Save PNG.";
  }
}

async function handleShareFormSubmit(event) {
  event.preventDefault();

  const number = pythenianNumberInput.value.trim();
  const record = pytheniansData[number];

  currentShareRecord = null;

  if (!record) {
    shareStatus.textContent = `Pythenian #${number} is not in the loaded dataset yet.`;
    shareResult.innerHTML = "";
    drawEmptyCard();
    return;
  }

  if (record.verification !== "verified" || !record.heldSince) {
    shareStatus.textContent = `Pythenian #${number} needs transfer-history verification before a card can be generated.`;
    shareResult.innerHTML = "";
    drawEmptyCard();
    return;
  }

  shareStatus.textContent = `Generating Pythenian #${number}...`;

  try {
    await drawShareCard(record, pythWonInput.value.trim());
    currentShareRecord = record;
    renderShareResult(record);
    shareStatus.textContent = `Pythenian #${number} card is ready.`;
  } catch (error) {
    shareStatus.textContent = "Could not load the Pythenian image for this card.";
    drawEmptyCard();
  }
}

function downloadCurrentCard() {
  if (!shareCanvas || !currentShareRecord) return;

  shareCanvas.toBlob((blob) => {
    if (!blob) return;
    if (currentCardBlobUrl) URL.revokeObjectURL(currentCardBlobUrl);
    currentCardBlobUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = currentCardBlobUrl;
    link.download = `pythenian-${pythenianNumberInput.value.trim()}-share-card.png`;
    link.click();
  }, "image/png");
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    currentFilter = button.dataset.filter;
    renderProjects();
  });
});

searchInput.addEventListener("input", renderProjects);

viewLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    setActiveView(link.dataset.viewLink);
  });
});

function setMenuOpen(isOpen) {
  document.body.classList.toggle("menu-open", isOpen);
  menuButton?.setAttribute("aria-expanded", String(isOpen));
}

menuButton?.addEventListener("click", () => {
  setMenuOpen(!document.body.classList.contains("menu-open"));
});

menuBackdrop?.addEventListener("click", () => {
  setMenuOpen(false);
});

sidebar?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    if (window.matchMedia("(max-width: 780px)").matches) {
      setMenuOpen(false);
    }
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setMenuOpen(false);
    closeSharePanel();
  }
});

const initialView = window.location.hash.replace("#", "");
if (initialView) {
  setActiveView(initialView);
}

renderProjects();
renderNews();
loadPytheniansData();
shareForm?.addEventListener("submit", handleShareFormSubmit);
downloadCardButton?.addEventListener("click", downloadCurrentCard);
copyCardButton?.addEventListener("click", copyCurrentCard);
document.querySelectorAll("[data-share-close]").forEach((button) => {
  button.addEventListener("click", closeSharePanel);
});
