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

let currentFilter = "all";

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
  const nextView = viewName === "news" ? "news" : "projects";

  views.forEach((view) => {
    view.classList.toggle("active", view.dataset.view === nextView);
  });

  viewLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.viewLink === nextView);
  });

  if (nextView === "news") {
    window.history.replaceState(null, "", "#news");
  } else {
    window.history.replaceState(null, "", window.location.pathname);
  }
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
  }
});

if (window.location.hash === "#news") {
  setActiveView("news");
}

renderProjects();
renderNews();
