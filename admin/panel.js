/* =========================================================
   NEXMARKET — console d'administration
   ========================================================= */
(() => {
  "use strict";

  const API = (
    window.NEXMARKET_API_URL ||
    "https://nexamarket-backend-ffea.onrender.com/api"
  ).replace(/\/$/, "");
  const ROOT = API.replace(/\/api$/, "");
  const TOKEN_KEY = "nexmarket_admin_token";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const state = {
    page: "dashboard",
    me: null,
    listings: [],
    transactions: [],
    channels: [],
    users: [],
    objectUrls: []
  };

  /* ---------------- utilitaires ---------------- */
  const esc = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const fmtNum = (value) =>
    Number(value || 0).toLocaleString("fr-FR", { maximumFractionDigits: 0 });

  const fmtMoney = (value, currency = "XAF") =>
    `${Number(value || 0).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} ${esc(currency)}`;

  const fmtDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "—"
      : date.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
  };

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  let toastTimer = null;
  function toast(message, isError = false) {
    const box = $("#toast");
    $("#toastMessage").textContent = message;
    box.classList.toggle("error", isError);
    box.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => box.classList.add("hidden"), isError ? 6000 : 3500);
  }

  /* ---------------- appels API ---------------- */
  async function api(path, options = {}) {
    const token = sessionStorage.getItem(TOKEN_KEY);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeout || 30000);

    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;

    let response;
    try {
      response = await fetch(`${API}${path}`, {
        method: options.method || "GET",
        headers,
        body: options.body,
        signal: controller.signal
      });
    } catch (error) {
      throw new Error(
        error.name === "AbortError"
          ? "Le serveur met trop de temps à répondre."
          : "Impossible de joindre le serveur."
      );
    } finally {
      clearTimeout(timer);
    }

    let data = null;
    try { data = await response.json(); } catch (error) { data = null; }

    if (!response.ok) {
      let message = data?.detail || data?.message || `Erreur ${response.status}`;
      if (Array.isArray(message)) message = message.map((m) => m.msg).join(" · ");
      if (response.status === 404 && message === "Not Found") {
        message = `Route introuvable sur le serveur (${options.method || "GET"} ${path}). Le serveur n'est pas à jour.`;
      }
      const error = new Error(String(message));
      error.status = response.status;
      throw error;
    }

    return data;
  }

  async function fetchBlobUrl(path) {
    const response = await fetch(`${API}${path}`, {
      headers: { Authorization: `Bearer ${sessionStorage.getItem(TOKEN_KEY)}` }
    });
    if (!response.ok) throw new Error("Photo indisponible");
    const url = URL.createObjectURL(await response.blob());
    state.objectUrls.push(url);
    return url;
  }

  /* Exécute une action en désactivant le bouton et en affichant l'erreur. */
  async function run(button, task) {
    if (button) button.disabled = true;
    try {
      await task();
    } catch (error) {
      if (error.status === 401) {
        sessionStorage.removeItem(TOKEN_KEY);
        toast("Session expirée : reconnecte-toi.", true);
        setTimeout(() => location.reload(), 1200);
      } else {
        toast(error.message, true);
      }
    } finally {
      if (button) button.disabled = false;
    }
  }

  /* ---------------- connexion ---------------- */
  function setAuthStatus(text, isError = false) {
    const element = $("#authStatus");
    element.textContent = text;
    element.classList.toggle("error", isError);
  }

  async function waitForServer() {
    const started = Date.now();
    let lastError = "";

    while (Date.now() - started < 90000) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);

      try {
        const response = await fetch(`${ROOT}/health`, { signal: controller.signal, cache: "no-store" });
        clearTimeout(timer);
        if (response.ok) return true;

        try { lastError = (await response.json())?.detail || ""; } catch (error) { lastError = ""; }
        lastError = lastError || `Le serveur répond avec le code ${response.status}.`;
      } catch (error) {
        clearTimeout(timer);
        lastError = "";
      }

      setAuthStatus(
        lastError
          ? `Serveur indisponible : ${lastError}`
          : "Le serveur se réveille, un instant…",
        Boolean(lastError)
      );
      await wait(2000);
    }

    return false;
  }

  function showLogin(message) {
    setAuthStatus(message || "Entre le code administrateur.");
    $("#authForm").classList.remove("hidden");
    $("#authCode").focus();
  }

  async function login(event) {
    event.preventDefault();
    const code = $("#authCode").value.trim();
    if (!code) return;

    const button = $("#authLoginButton");
    button.disabled = true;
    setAuthStatus("Connexion…");

    try {
      const initData = window.Telegram?.WebApp?.initData || "";
      const data = await api("/admin/login", {
        method: "POST",
        headers: initData ? { "X-Telegram-Init-Data": initData } : {},
        body: JSON.stringify({ code })
      });

      const token = data?.token || data?.access_token;
      if (!token) throw new Error("Le serveur n'a pas renvoyé de session.");

      sessionStorage.setItem(TOKEN_KEY, token);
      state.me = await api("/admin/me");
      await enterApp();
    } catch (error) {
      const message = error.message || "Connexion impossible.";
      setAuthStatus(
        /incorrect/i.test(message) ? "Code incorrect." : message,
        true
      );
      $("#authCode").value = "";
    } finally {
      button.disabled = false;
    }
  }

  async function start() {
    setAuthStatus("Connexion au serveur…");

    if (!(await waitForServer())) {
      setAuthStatus("Le serveur ne répond pas. Réessaie dans un instant.", true);
      return;
    }

    if (sessionStorage.getItem(TOKEN_KEY)) {
      try {
        state.me = await api("/admin/me");
        await enterApp();
        return;
      } catch (error) {
        sessionStorage.removeItem(TOKEN_KEY);
      }
    }

    showLogin();
  }

  async function enterApp() {
    $("#authScreen").classList.add("hidden");
    $("#adminApp").classList.remove("hidden");

    const name = state.me?.username ? `@${state.me.username}` : "Administrateur";
    $("#adminName").textContent = name;
    $("#adminAvatar").textContent = (name.replace("@", "")[0] || "N").toUpperCase();
    $("#welcomeTitle").textContent = `Bonjour ${name}`;

    await showPage("dashboard");
  }

  function logout() {
    sessionStorage.removeItem(TOKEN_KEY);
    location.href = "../";
  }

  /* ---------------- navigation ---------------- */
  const PAGES = {
    dashboard: ["Vue d'ensemble", "Gestion de NexMarket", loadDashboard],
    verifications: ["Vérifications", "Annonces en attente de validation", loadListings],
    transactions: ["Transactions", "Transferts, litiges, remboursements", loadTransactions],
    channels: ["Canaux", "Tous les canaux enregistrés", loadChannels],
    users: ["Utilisateurs", "Comptes de la marketplace", loadUsers],
    reports: ["Signalements", "Problèmes signalés par les utilisateurs", loadReports],
    messages: ["Messages", "Discussions des transactions", loadMessages],
    announcements: ["Annonces", "Message à tous les utilisateurs", async () => {}],
    deposits: ["Dépôts", "Suivi et crédit des dépôts", loadDeposits],
    withdrawals: ["Retraits à vérifier", "Statut inconnu", loadWithdrawals],
    admins: ["Administrateurs", "Comptes autorisés", loadAdmins],
    wallet: ["Portefeuille NEXA", "Commissions de la plateforme", loadWallet]
  };

  async function showPage(name) {
    if (!PAGES[name]) return;
    state.page = name;

    $$(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.page === name));
    $$(".admin-page").forEach((page) => page.classList.toggle("active", page.dataset.section === name));
    $("#pageTitle").textContent = PAGES[name][0];
    $("#pageSubtitle").textContent = PAGES[name][1];
    closeSidebar();

    const refresh = $("#refreshButton");
    refresh.classList.add("spin");
    try {
      await PAGES[name][2]();
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        sessionStorage.removeItem(TOKEN_KEY);
        toast("Session expirée : reconnecte-toi.", true);
        setTimeout(() => location.reload(), 1200);
      } else {
        toast(error.message, true);
      }
    } finally {
      refresh.classList.remove("spin");
    }
  }

  function openSidebar() {
    $("#sidebar").classList.add("open");
    $("#sidebarBackdrop").classList.add("open");
  }

  function closeSidebar() {
    $("#sidebar").classList.remove("open");
    $("#sidebarBackdrop").classList.remove("open");
  }

  /* ---------------- modale ---------------- */
  function openModal(html) {
    $("#modalContent").innerHTML = html;
    $("#modalOverlay").classList.remove("hidden");
    $("#adminModal").classList.remove("hidden");
  }

  function closeModal() {
    $("#modalOverlay").classList.add("hidden");
    $("#adminModal").classList.add("hidden");
    $("#modalContent").innerHTML = "";
    state.objectUrls.forEach((url) => URL.revokeObjectURL(url));
    state.objectUrls = [];
  }

  function lightbox(src) {
    const box = document.createElement("div");
    box.className = "lightbox";
    box.innerHTML = `<img src="${src}" alt="Preuve">`;
    box.addEventListener("click", () => box.remove());
    document.body.appendChild(box);
  }

  const kv = (label, value, wide = false) =>
    `<div class="${wide ? "wide" : ""}"><span>${esc(label)}</span><strong>${value}</strong></div>`;

  /* ---------------- badges ---------------- */
  const TX_STATUS = {
    pending_payment: ["Paiement en attente", ""],
    waiting_admin: ["À prendre en charge", "warn"],
    transfer_started: ["Transfert en cours", "info"],
    protection_period: ["Période de protection", "info"],
    completed: ["Terminée", "ok"],
    cancelled: ["Annulée", ""],
    disputed: ["Litige", "bad"],
    refunded: ["Remboursée", ""]
  };

  const txBadge = (status) => {
    const [label, tone] = TX_STATUS[status] || [status || "—", ""];
    return `<span class="badge ${tone}">${esc(label)}</span>`;
  };

  function setBadge(id, count) {
    const element = $(id);
    if (!element) return;
    element.textContent = count;
    element.classList.toggle("zero", !Number(count));
  }

  /* ================= VUE D'ENSEMBLE ================= */
  async function loadDashboard() {
    const [dashboard, pending, transactions] = await Promise.all([
      api("/admin/dashboard"),
      api("/admin/listings/pending"),
      api("/admin/transactions")
    ]);

    $("#statUsers").textContent = fmtNum(dashboard.users);
    $("#statPendingListings").textContent = fmtNum(dashboard.pending_listings);
    $("#statTransactions").textContent = fmtNum(dashboard.active_transactions);
    $("#statRevenue").textContent = fmtNum(dashboard.platform_wallet?.balance);

    setBadge("#pendingListingsBadge", dashboard.pending_listings || 0);
    setBadge("#activeTransactionsBadge", dashboard.active_transactions || 0);
    setBadge("#reportsBadge", dashboard.pending_reports || 0);

    const listings = pending.listings || [];
    $("#dashboardListings").innerHTML = listings.length
      ? listings.slice(0, 5).map((l) => `
          <div class="item-card">
            <div class="item-main"><strong>${esc(l.title || l.channel?.title || "Canal")}</strong>
              <span class="sub">${fmtMoney(l.price, l.currency)} · ${esc(l.seller?.name || "")}</span></div>
            <button class="btn primary" data-act="review-listing" data-id="${l.id}" type="button">Examiner</button>
          </div>`).join("")
      : `<div class="empty-state">Aucune annonce en attente.</div>`;

    const txs = transactions.transactions || [];
    $("#dashboardTransactions").innerHTML = txs.length
      ? txs.slice(0, 5).map((t) => `
          <div class="item-card">
            <div class="item-main"><strong>${esc(t.reference)}</strong>
              <span class="sub">${fmtMoney(t.channel_price, t.currency)} · ${fmtDate(t.created_at)}</span></div>
            <div class="item-side">${txBadge(t.status)}
              <button class="btn" data-act="open-transaction" data-id="${t.id}" type="button">Détails</button></div>
          </div>`).join("")
      : `<div class="empty-state">Aucune transaction.</div>`;
  }

  /* ================= VÉRIFICATIONS ================= */
  async function loadListings() {
    const data = await api("/admin/listings/pending");
    state.listings = data.listings || [];
    setBadge("#pendingListingsBadge", state.listings.length);
    renderListings();
  }

  function renderListings() {
    const query = ($("#listingSearch").value || "").trim().toLowerCase();
    const rows = state.listings.filter((l) =>
      !query ||
      [l.title, l.channel?.title, l.channel?.telegram_username, l.seller?.name, l.seller?.nexa_id]
        .join(" ").toLowerCase().includes(query)
    );

    $("#listingsTableBody").innerHTML = rows.length
      ? rows.map((l) => `
          <tr>
            <td>#${l.id}</td>
            <td><strong>${esc(l.title || l.channel?.title || "Canal")}</strong>
              <small>${l.channel?.telegram_username ? "@" + esc(l.channel.telegram_username) : "Canal privé"}</small></td>
            <td>${esc(l.seller?.name || "—")}<small>${esc(l.seller?.nexa_id || "")}</small></td>
            <td>${fmtMoney(l.price, l.currency)}</td>
            <td>${fmtNum(l.channel?.subscriber_count)}</td>
            <td>${l.proofs_count
              ? `<span class="badge ok">${l.proofs_count} photo${l.proofs_count > 1 ? "s" : ""}</span>`
              : `<span class="badge bad">Aucune</span>`}</td>
            <td>${fmtDate(l.created_at)}</td>
            <td class="actions"><button class="btn primary" data-act="review-listing" data-id="${l.id}" type="button">Examiner</button></td>
          </tr>`).join("")
      : `<tr><td colspan="8"><div class="empty-state">Aucune annonce à valider.</div></td></tr>`;
  }

  async function openListing(id) {
    const l = await api(`/admin/listings/${id}`);
    const channel = l.channel || {};
    const proofs = l.proofs || [];

    openModal(`
      <h3 class="modal-title">${esc(l.title || channel.title || "Annonce")}</h3>
      <p class="modal-sub">Annonce #${l.id} · ${fmtDate(l.created_at)}</p>
      <div class="kv">
        ${kv("Prix", fmtMoney(l.price, l.currency))}
        ${kv("Catégorie", esc(l.category || "—"))}
        ${kv("Canal", channel.telegram_username ? "@" + esc(channel.telegram_username) : "Canal privé")}
        ${kv("Abonnés", fmtNum(channel.subscriber_count))}
        ${kv("Bot administrateur", channel.bot_is_admin ? "Oui" : "Non")}
        ${kv("Propriétaire vérifié", channel.owner_verified ? "Oui" : "Non")}
        ${l.description ? kv("Description", esc(l.description), true) : ""}
      </div>
      <h3 class="modal-title" style="font-size:14px">Photos de preuve</h3>
      <div class="proofs" id="proofsBox">
        ${proofs.length ? "" : `<div class="proof-empty">Le vendeur n'a fourni aucune photo de preuve.</div>`}
      </div>
      <div class="modal-actions">
        <button class="btn ok" id="approveListing" type="button">${proofs.length ? "Approuver" : "Approuver sans preuve"}</button>
        <button class="btn danger" id="rejectListing" type="button">Refuser</button>
      </div>
    `);

    const box = $("#proofsBox");
    proofs.forEach(async (proof) => {
      try {
        const url = await fetchBlobUrl(`/admin/proofs/${proof.id}`);
        const cell = document.createElement("div");
        cell.className = "proof";
        cell.innerHTML = `<img src="${url}" alt="Preuve">`;
        cell.addEventListener("click", () => lightbox(url));
        box.appendChild(cell);
      } catch (error) {
        /* photo illisible : ignorée */
      }
    });

    $("#approveListing").addEventListener("click", (event) =>
      run(event.currentTarget, async () => {
        if (!proofs.length && !confirm("Aucune photo de preuve. Approuver quand même ?")) return;
        await api(`/admin/listings/${id}/approve${proofs.length ? "" : "?without_proofs=true"}`, { method: "POST" });
        closeModal();
        toast("Annonce approuvée et publiée.");
        await loadListings();
      })
    );

    $("#rejectListing").addEventListener("click", (event) =>
      run(event.currentTarget, async () => {
        const reason = (prompt("Motif du refus (visible par le vendeur) :") || "").trim();
        if (reason.length < 3) return toast("Un motif de refus est obligatoire.", true);
        await api(`/admin/listings/${id}/reject`, { method: "POST", body: JSON.stringify({ reason }) });
        closeModal();
        toast("Annonce refusée.");
        await loadListings();
      })
    );
  }

  /* ================= TRANSACTIONS ================= */
  async function loadTransactions() {
    const status = $("#transactionStatusFilter").value;
    const data = await api(`/admin/transactions${status ? `?transaction_status=${encodeURIComponent(status)}` : ""}`);
    state.transactions = data.transactions || [];
    renderTransactions();
  }

  function renderTransactions() {
    const query = ($("#transactionSearch").value || "").trim().toLowerCase();
    const rows = state.transactions.filter((t) =>
      !query || `${t.reference} ${t.channel_price} ${t.status}`.toLowerCase().includes(query)
    );

    $("#transactionsTableBody").innerHTML = rows.length
      ? rows.map((t) => `
          <tr>
            <td><strong>${esc(t.reference)}</strong></td>
            <td>${txBadge(t.status)}</td>
            <td>${fmtMoney(t.channel_price, t.currency)}</td>
            <td>${fmtMoney(t.seller_amount, t.currency)}</td>
            <td>${fmtDate(t.created_at)}</td>
            <td class="actions"><button class="btn" data-act="open-transaction" data-id="${t.id}" type="button">Détails</button></td>
          </tr>`).join("")
      : `<tr><td colspan="6"><div class="empty-state">Aucune transaction.</div></td></tr>`;
  }

  async function openTransaction(id) {
    const t = await api(`/transactions/${id}`);
    const st = t.status;
    const active = ["waiting_admin", "transfer_started", "protection_period", "disputed"];

    const buttons = [
      !t.assigned_admin_id && !["completed", "cancelled", "refunded"].includes(st)
        ? ["assign", "Me l'assigner", ""] : null,
      st === "waiting_admin" ? ["start", "Démarrer le transfert", "primary"] : null,
      st === "transfer_started" ? ["complete", "Transfert terminé", "primary"] : null,
      ["protection_period", "disputed"].includes(st) ? ["release", "Payer le vendeur", "ok"] : null,
      active.includes(st) ? ["refund", "Rembourser l'acheteur", "danger"] : null
    ].filter(Boolean);

    openModal(`
      <h3 class="modal-title">${esc(t.reference)}</h3>
      <p class="modal-sub">${txBadge(st)} · ${fmtDate(t.created_at)}</p>
      <div class="kv">
        ${kv("Annonce", esc(t.listing_title || "—"), true)}
        ${kv("Acheteur", esc(t.buyer_name || "—"))}
        ${kv("Vendeur", esc(t.seller_name || "—"))}
        ${kv("Prix", fmtMoney(t.channel_price, t.currency))}
        ${kv("Commission", fmtMoney(t.platform_fee, t.currency))}
        ${kv("Versé au vendeur", fmtMoney(t.seller_amount, t.currency))}
        ${kv("Fonds bloqués", t.escrow_held ? "Oui" : "Non")}
        ${t.protection_ends_at ? kv("Fin de protection", fmtDate(t.protection_ends_at), true) : ""}
        ${t.dispute_reason ? kv("Motif du litige", esc(t.dispute_reason), true) : ""}
      </div>
      <div class="modal-actions">
        ${buttons.length
          ? buttons.map(([action, label, tone]) =>
              `<button class="btn ${tone}" data-tx-action="${action}" type="button">${label}</button>`).join("")
          : `<span class="sub" style="color:var(--text-muted)">Aucune action disponible.</span>`}
      </div>
    `);

    $$("[data-tx-action]").forEach((button) =>
      button.addEventListener("click", (event) =>
        run(event.currentTarget, async () => {
          const action = button.dataset.txAction;
          const base = `/transactions/${id}`;
          let path = `${base}/${{ assign: "assign", start: "start-transfer", complete: "complete-transfer" }[action] || "resolve"}`;
          let body;

          if (action === "refund" || action === "release") {
            if (!confirm(action === "refund" ? "Rembourser l'acheteur ?" : "Payer le vendeur ?")) return;
            const note = (prompt("Note interne (facultatif) :") || "").trim();
            body = JSON.stringify({ action: action === "refund" ? "refund_buyer" : "release_seller", ...(note ? { note } : {}) });
          }

          await api(path, { method: "POST", body });
          closeModal();
          toast("Transaction mise à jour.");
          await loadTransactions().catch(() => {});
          if (state.page === "dashboard") await loadDashboard();
        })
      )
    );
  }

  /* ================= CANAUX ================= */
  async function loadChannels() {
    const data = await api("/admin/channels?limit=200");
    state.channels = data.channels || [];
    renderChannels();
  }

  function renderChannels() {
    const query = ($("#channelSearch").value || "").trim().toLowerCase();
    const rows = state.channels.filter((c) =>
      !query || `${c.title} ${c.telegram_username} ${c.telegram_channel_id}`.toLowerCase().includes(query)
    );

    const tone = { approved: "ok", submitted: "warn", rejected: "bad", removed: "bad" };

    $("#channelsTableBody").innerHTML = rows.length
      ? rows.map((c) => `
          <tr>
            <td><strong>${esc(c.title || "Canal")}</strong>
              <small>${c.telegram_username ? "@" + esc(c.telegram_username) : "ID " + esc(c.telegram_channel_id)}</small></td>
            <td><span class="badge ${c.is_private ? "warn" : "info"}">${c.is_private ? "Privé" : "Public"}</span></td>
            <td>${fmtNum(c.subscriber_count)}</td>
            <td><span class="badge ${tone[c.verification_status] || ""}">${esc(c.verification_status || "—")}</span></td>
            <td>${c.bot_is_admin ? "✓" : "✗"}</td>
            <td class="actions">${c.verification_status === "removed" ? "" :
              `<button class="btn danger" data-act="delete-channel" data-id="${c.id}" data-name="${esc(c.title || "ce canal")}" type="button">Supprimer</button>`}</td>
          </tr>`).join("")
      : `<tr><td colspan="6"><div class="empty-state">Aucun canal.</div></td></tr>`;
  }

  /* ================= UTILISATEURS ================= */
  async function loadUsers() {
    const data = await api("/admin/users");
    state.users = data.users || [];
    renderUsers();
  }

  function renderUsers() {
    const query = ($("#userSearch").value || "").trim().toLowerCase();
    const rows = state.users.filter((u) =>
      !query || `${u.first_name} ${u.last_name} ${u.username} ${u.nexa_id} ${u.telegram_id}`.toLowerCase().includes(query)
    );

    $("#usersTableBody").innerHTML = rows.length
      ? rows.map((u) => {
          const name = [u.first_name, u.last_name].filter(Boolean).join(" ") || (u.username ? "@" + u.username : "Utilisateur");
          const badge = u.is_admin
            ? `<span class="badge info">Admin</span>`
            : u.is_active ? `<span class="badge ok">Actif</span>` : `<span class="badge bad">Bloqué</span>`;
          const actions = u.is_admin ? "" : `
            <span class="btn-row">
              <button class="btn ${u.is_active ? "" : "ok"}" data-act="toggle-user" data-id="${u.id}" data-active="${u.is_active ? "1" : "0"}" type="button">${u.is_active ? "Bloquer" : "Débloquer"}</button>
              <button class="btn danger" data-act="remove-user" data-id="${u.id}" data-name="${esc(name)}" type="button">Retirer</button>
            </span>`;
          return `
            <tr>
              <td><strong>${esc(name)}</strong><small>${u.username ? "@" + esc(u.username) : ""}</small></td>
              <td>${esc(u.nexa_id || "—")}</td>
              <td>${esc(u.telegram_id)}</td>
              <td>${badge}</td>
              <td>${fmtDate(u.created_at)}</td>
              <td class="actions">${actions}</td>
            </tr>`;
        }).join("")
      : `<tr><td colspan="6"><div class="empty-state">Aucun utilisateur.</div></td></tr>`;
  }

  /* ================= SIGNALEMENTS / MESSAGES / ADMINS ================= */
  async function loadReports() {
    const data = await api("/admin/reports");
    const reports = data.reports || [];
    setBadge("#reportsBadge", reports.filter((r) => !["resolved", "rejected"].includes(r.status)).length);

    $("#reportsList").innerHTML = reports.length
      ? reports.map((r) => {
          const open = !["resolved", "rejected"].includes(r.status);
          return `
            <div class="item-card">
              <div class="item-main">
                <strong>${esc(r.report_type || "Signalement")} · transaction #${esc(r.transaction_id)}</strong>
                <span class="sub">${esc(r.reason || "")}</span>
                ${r.admin_resolution ? `<span class="sub">Résolution : ${esc(r.admin_resolution)}</span>` : ""}
                <span class="sub">${fmtDate(r.created_at)}</span>
              </div>
              <div class="item-side">
                <span class="badge ${open ? "warn" : "ok"}">${esc(r.status)}</span>
                ${open ? `<span class="btn-row">
                  <button class="btn ok" data-act="resolve-report" data-id="${r.id}" data-result="resolved" type="button">Résoudre</button>
                  <button class="btn" data-act="resolve-report" data-id="${r.id}" data-result="rejected" type="button">Rejeter</button></span>` : ""}
              </div>
            </div>`;
        }).join("")
      : `<div class="empty-state">Aucun signalement.</div>`;
  }

  async function loadMessages() {
    const data = await api("/admin/messages?limit=100");
    const messages = data.messages || [];
    $("#messagesList").innerHTML = messages.length
      ? messages.map((m) => `
          <div class="item-card">
            <div class="item-main"><strong>Transaction #${esc(m.transaction_id)} · utilisateur ${esc(m.sender_id)}</strong>
              <span class="sub">${esc(m.content || "")}</span></div>
            <span class="sub">${fmtDate(m.created_at)}</span>
          </div>`).join("")
      : `<div class="empty-state">Aucun message.</div>`;
  }

  async function loadAdmins() {
    const data = await api("/admin/admins");
    const admins = data.admins || [];
    $("#adminsList").innerHTML = admins.length
      ? admins.map((a) => `
          <div class="item-card">
            <div class="item-main"><strong>${esc(a.name || "Administrateur")}</strong>
              <span class="sub">${a.username ? "@" + esc(a.username) + " · " : ""}${esc(a.nexa_id || "")} · Telegram ${esc(a.telegram_id)}</span></div>
            ${a.is_primary ? `<span class="badge info">Principal</span>` : ""}
          </div>`).join("")
      : `<div class="empty-state">Aucun administrateur.</div>`;
  }

  /* ================= PORTEFEUILLE / RETRAITS ================= */
  async function loadWallet() {
    const data = await api("/admin/platform-wallet");
    const wallets = data.wallets || [];
    $("#walletStats").innerHTML = wallets.length
      ? wallets.map((w) => `
          <div class="stat-card"><div class="stat-icon">◈</div><div><strong>${fmtMoney(w.available_balance, w.currency)}</strong><span>Solde disponible</span></div></div>
          <div class="stat-card"><div class="stat-icon">%</div><div><strong>${fmtMoney(w.total_fees_collected, w.currency)}</strong><span>Commissions collectées</span></div></div>
          <div class="stat-card"><div class="stat-icon">↗</div><div><strong>${fmtMoney(w.total_revenue, w.currency)}</strong><span>Revenu total</span></div></div>`).join("")
      : `<div class="empty-state" style="grid-column:1/-1">Aucune commission encaissée pour le moment.</div>`;
  }

  async function loadWithdrawals() {
    const data = await api("/admin/withdrawals?status_filter=processing");
    const rows = data.withdrawals || [];
    $("#withdrawalsTableBody").innerHTML = rows.length
      ? rows.map((w) => `
          <tr>
            <td><strong>${esc(w.reference)}</strong></td>
            <td>${fmtMoney(w.amount, w.currency)}</td>
            <td>${esc(w.jp_number)}</td>
            <td>${esc(w.failure_reason || "—")}</td>
            <td>${fmtDate(w.created_at)}</td>
            <td class="actions"><span class="btn-row">
              <button class="btn ok" data-act="withdrawal" data-id="${w.id}" data-decision="complete" type="button">Versé</button>
              <button class="btn danger" data-act="withdrawal" data-id="${w.id}" data-decision="fail" type="button">Non versé</button></span></td>
          </tr>`).join("")
      : `<tr><td colspan="6"><div class="empty-state">Aucun retrait à vérifier.</div></td></tr>`;
  }

  const DEPOSIT_LABELS = {
    pending: ["En attente", "warn"], paid: ["Payé", "ok"], failed: ["Échoué", "bad"],
    expired: ["Expiré", "bad"], cancelled: ["Annulé", "bad"], rejected: ["Refusé", "bad"],
    amount_mismatch: ["Montant incohérent", "warn"]
  };

  async function loadDeposits() {
    const filter = $("#depositStatusFilter").value;
    const data = await api(`/admin/deposits${filter ? `?status_filter=${encodeURIComponent(filter)}` : ""}`);
    const rows = data.deposits || [];
    $("#depositsTableBody").innerHTML = rows.length
      ? rows.map((d) => {
          const [label, tone] = DEPOSIT_LABELS[d.status] || [d.status, ""];
          const open = d.status !== "paid";
          return `
          <tr>
            <td><strong>${esc(d.reference)}</strong><small>${esc(d.country || "")} ${esc(d.phone || "")}</small></td>
            <td>${esc(d.user)}<small>${esc(d.nexa_id || "")}</small></td>
            <td>${fmtMoney(d.amount, d.currency)}</td>
            <td><span class="badge ${tone}">${esc(label)}</span>${d.failure_reason ? `<small>${esc(d.failure_reason)}</small>` : ""}</td>
            <td>${fmtDate(d.created_at)}</td>
            <td class="actions"><span class="btn-row">
              ${open ? `<button class="btn" data-act="recheck-deposit" data-id="${d.id}" type="button">Revérifier</button>
              <button class="btn ok" data-act="credit-deposit" data-id="${d.id}" type="button">Créditer</button>` : ""}
            </span></td>
          </tr>`;
        }).join("")
      : `<tr><td colspan="6"><div class="empty-state">Aucun dépôt.</div></td></tr>`;
  }

  document.addEventListener("change", (event) => {
    if (event.target.id === "depositStatusFilter") loadDeposits().catch((e) => toast(e.message, true));
  });

  /* ================= ACTIONS (clics) ================= */
  document.addEventListener("click", (event) => {
    const target = event.target.closest("[data-act]");
    if (!target) return;

    const id = target.dataset.id;

    switch (target.dataset.act) {
      case "review-listing":
        run(target, () => openListing(id));
        break;

      case "open-transaction":
        run(target, () => openTransaction(id));
        break;

      case "delete-channel":
        run(target, async () => {
          if (!confirm(`Supprimer définitivement « ${target.dataset.name} » ?\nSes annonces seront annulées et il ne pourra plus être remis en vente.`)) return;
          const result = await api(`/admin/channels/${id}`, { method: "DELETE" });
          toast(`Canal supprimé (${result.listings_cancelled} annonce(s) annulée(s)).`);
          await loadChannels();
        });
        break;

      case "toggle-user":
        run(target, async () => {
          const makeActive = target.dataset.active !== "1";
          if (!makeActive && !confirm("Bloquer cet utilisateur ? Il ne pourra plus utiliser NexMarket.")) return;
          await api(`/admin/users/${id}/status?active=${makeActive}`, { method: "PATCH" });
          toast(makeActive ? "Utilisateur débloqué." : "Utilisateur bloqué.");
          await loadUsers();
        });
        break;

      case "remove-user":
        run(target, async () => {
          if (!confirm(`Retirer « ${target.dataset.name} » de la marketplace ?\nSon compte est bloqué, ses annonces sont annulées et ses canaux retirés.`)) return;
          const result = await api(`/admin/users/${id}/remove`, { method: "POST" });
          toast(`Utilisateur retiré (${result.listings_cancelled} annonce(s), ${result.channels_removed} canal/canaux).`);
          await loadUsers();
        });
        break;

      case "resolve-report":
        run(target, async () => {
          const resolution = (prompt("Résolution (obligatoire).\nClore un signalement ne rembourse ni ne paie personne : fais-le depuis la transaction.") || "").trim();
          if (resolution.length < 3) return toast("Une résolution est obligatoire.", true);
          await api(`/reports/${id}/resolve`, {
            method: "PATCH",
            body: JSON.stringify({ resolution, result_status: target.dataset.result })
          });
          toast("Signalement clos.");
          await loadReports();
        });
        break;

      case "recheck-deposit":
        run(target, async () => {
          const result = await api(`/admin/deposits/${id}/recheck`, { method: "POST" });
          openModal(`
            <h3 class="modal-title">Réponse de JessiKaPay</h3>
            <p class="modal-sub">Statut NexMarket : <strong>${esc(result.status)}</strong>${result.paid ? " — wallet crédité." : ""}</p>
            <pre style="white-space:pre-wrap;word-break:break-word;background:var(--surface-2);padding:12px;border-radius:12px;font-size:11.5px">${esc(JSON.stringify(result.provider, null, 2))}</pre>`);
          await loadDeposits();
        });
        break;

      case "credit-deposit":
        run(target, async () => {
          if (!confirm("As-tu VÉRIFIÉ dans JessiKaPay que ce paiement a bien été reçu ?\nLe montant sera ajouté au solde de l'utilisateur (une seule fois).")) return;
          const note = (prompt("Note (facultatif) :") || "").trim();
          await api(`/admin/deposits/${id}/credit`, { method: "POST", body: JSON.stringify({ note }) });
          toast("Dépôt crédité.");
          await loadDeposits();
        });
        break;

      case "withdrawal":
        run(target, async () => {
          const decision = target.dataset.decision;
          if (!confirm(decision === "complete"
            ? "Le versement a bien été fait dans JessiKaPay ? Les fonds bloqués seront consommés."
            : "Le versement N'a PAS été fait ? Les fonds seront rendus à l'utilisateur.")) return;
          const note = (prompt("Note (facultatif) :") || "").trim();
          await api(`/admin/withdrawals/${id}/resolve`, {
            method: "POST",
            body: JSON.stringify({ action: decision, ...(note ? { note } : {}) })
          });
          toast("Retrait mis à jour.");
          await loadWithdrawals();
        });
        break;
    }
  });

  /* ================= ANNONCE À TOUS ================= */
  async function sendAnnouncement(audience, button) {
    const text = $("#announceText").value.trim();
    if (text.length < 3) return toast("Écris un message.", true);

    if (audience === "all" && !confirm("Envoyer ce message à TOUS les utilisateurs ?")) return;

    await run(button, async () => {
      const result = await api("/admin/announcements", {
        method: "POST",
        body: JSON.stringify({ text, audience })
      });
      toast(
        audience === "me"
          ? "Test envoyé : regarde ton Telegram."
          : `Envoi en cours à ${fmtNum(result.recipients)} utilisateur(s). Un récapitulatif t'arrivera sur Telegram.`
      );
      if (audience === "all") $("#announceText").value = "";
      $("#announceCount").textContent = `${$("#announceText").value.length} / 3500`;
    });
  }

  /* ================= ÉVÉNEMENTS ================= */
  $("#authForm").addEventListener("submit", login);
  $("#logoutButton").addEventListener("click", logout);
  $("#openSidebar").addEventListener("click", openSidebar);
  $("#closeSidebar").addEventListener("click", closeSidebar);
  $("#sidebarBackdrop").addEventListener("click", closeSidebar);
  $("#closeModal").addEventListener("click", closeModal);
  $("#modalOverlay").addEventListener("click", closeModal);
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeModal(); });

  $$(".nav-item").forEach((item) => item.addEventListener("click", () => showPage(item.dataset.page)));
  $$("[data-goto]").forEach((item) => item.addEventListener("click", () => showPage(item.dataset.goto)));
  $("#refreshButton").addEventListener("click", () => showPage(state.page));

  $("#listingSearch").addEventListener("input", renderListings);
  $("#transactionSearch").addEventListener("input", renderTransactions);
  $("#transactionStatusFilter").addEventListener("change", () => showPage("transactions"));
  $("#channelSearch").addEventListener("input", renderChannels);
  $("#userSearch").addEventListener("input", renderUsers);

  $("#announceText").addEventListener("input", () => {
    $("#announceCount").textContent = `${$("#announceText").value.length} / 3500`;
  });
  $("#announceTest").addEventListener("click", (event) => sendAnnouncement("me", event.currentTarget));
  $("#announceSend").addEventListener("click", (event) => sendAnnouncement("all", event.currentTarget));

  start();
})();
