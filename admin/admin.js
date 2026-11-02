(() => {
  'use strict';

  const CONFIG = {
    API_BASE_URL: window.NEXMARKET_API_URL || 'https://nexamarket-backend-ffea.onrender.com/api',
    TOKEN_KEY: 'nexmarket_admin_token',
    REQUEST_TIMEOUT: 45000,
    // Statuts réels renvoyés par le backend
    ACTIVE_TRANSACTION_STATUSES: [
      'pending_payment','waiting_admin','transfer_started',
      'protection_period','disputed'
    ]
  };

  const state = {
    dashboard: null,
    listings: [],
    transactions: [],
    users: [],
    channels: [],
    reports: [],
    messages: [],
    wallet: null,
    currentModule: null
  };

  const $ = (s) => document.querySelector(s);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const token = () => sessionStorage.getItem(CONFIG.TOKEN_KEY) || '';

  async function api(endpoint, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token()) headers.Authorization = `Bearer ${token()}`;
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, { ...options, headers, signal: controller.signal });
      const text = await res.text();
      let data = null;
      try { data = text ? JSON.parse(text) : null; } catch { data = text; }
      if (!res.ok) {
        const message = data?.detail || data?.message || data?.error || `HTTP ${res.status}`;
        const err = new Error(message); err.status = res.status; throw err;
      }
      return data;
    } finally { clearTimeout(timer); }
  }

  function items(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.results)) return data.results;
    if (Array.isArray(data?.data)) return data.data;
    // Le backend renvoie { users: [...] }, { listings: [...] }, etc.
    if (data && typeof data === 'object') {
      const list = Object.values(data).find(Array.isArray);
      if (list) return list;
    }
    return [];
  }

  function showToast(message, error = false) {
    let el = $('#adminToast');
    if (!el) { el = document.createElement('div'); el.id = 'adminToast'; document.body.appendChild(el); }
    el.textContent = message; el.className = `admin-toast ${error ? 'error' : ''}`;
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => el.classList.remove('show'), 2800);
  }

  function setMetric(id, value) { const el = document.getElementById(id); if (el) el.textContent = value ?? 0; }

  async function login(code) {
    // Le backend vérifie aussi que le compte Telegram est celui de l'admin :
    // la page doit donc être ouverte depuis la Mini App Telegram.
    const initData = window.Telegram?.WebApp?.initData || '';
    const data = await api('/admin/login', {
      method: 'POST',
      headers: initData ? { 'X-Telegram-Init-Data': initData } : {},
      body: JSON.stringify({ code })
    });
    const jwt = data?.access_token || data?.token || data?.jwt;
    if (!jwt) throw new Error('Le backend n’a pas retourné de token admin.');
    sessionStorage.setItem(CONFIG.TOKEN_KEY, jwt);
    await bootDashboard();
  }

  function renderLogin(error = '') {
    document.body.classList.add('locked');
    const existing = $('#adminLogin');
    if (existing) { existing.classList.remove('hidden'); return; }
    const wrap = document.createElement('div');
    wrap.id = 'adminLogin'; wrap.innerHTML = `
      <div class="admin-login-backdrop"></div>
      <section class="admin-login-card">
        <div class="kicker">§ NEXMARKET / ADMIN</div>
        <h2>Connexion administration</h2>
        <p>Entre le code administrateur configuré sur le backend Render.</p>
        <form id="adminLoginForm">
          <input id="adminCode" type="password" autocomplete="current-password" placeholder="Code administrateur" required>
          <button type="submit">Se connecter</button>
          <div id="adminLoginError" class="admin-login-error">${esc(error)}</div>
        </form>
      </section>`;
    document.body.appendChild(wrap);
    $('#adminLoginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const button = e.submitter; button.disabled = true;
      $('#adminLoginError').textContent = '';
      try { await login($('#adminCode').value.trim()); }
      catch (err) { $('#adminLoginError').textContent = err.message; }
      finally { button.disabled = false; }
    });
  }

  function hideLogin() { $('#adminLogin')?.classList.add('hidden'); document.body.classList.remove('locked'); }

  async function bootDashboard() {
    hideLogin();
    await Promise.all([loadDashboard(), loadPendingListings(), loadTransactions()]);
    renderDashboard();
  }

  async function loadDashboard() {
    state.dashboard = await api('/admin/dashboard');
    return state.dashboard;
  }

  async function loadPendingListings() {
    state.listings = items(await api('/admin/listings/pending'));
    return state.listings;
  }

  async function loadTransactions() {
    state.transactions = items(await api('/admin/transactions'));
    return state.transactions;
  }

  async function loadUsers() { state.users = items(await api('/admin/users')); return state.users; }
  async function loadChannels() { state.channels = items(await api('/admin/channels')); return state.channels; }
  async function loadReports() { state.reports = items(await api('/admin/reports')); return state.reports; }
  async function loadMessages() { state.messages = items(await api('/admin/messages')); return state.messages; }
  async function loadWallet() { state.wallet = await api('/admin/platform-wallet'); return state.wallet; }

  function activeTransactions() {
    return state.transactions.filter(t => {
      const s = String(t.status || '').toLowerCase();
      return CONFIG.ACTIVE_TRANSACTION_STATUSES.includes(s);
    });
  }

  function renderDashboard() {
    const d = state.dashboard || {};
    setMetric('metricUsers', d.users ?? 0);
    setMetric('metricChannels', d.channels ?? 0);
    setMetric('metricListings', d.listings ?? 0);
    setMetric('metricPending', d.pending_listings ?? state.listings.length);
    setMetric('metricTransactions', d.transactions ?? 0);
    setMetric('metricActive', d.active_transactions ?? activeTransactions().length);
    setMetric('metricReports', d.pending_reports ?? state.reports.length);
    setMetric('volume', d.platform_wallet?.balance != null ? `${d.platform_wallet.balance} ${d.platform_wallet.currency || ''}`.trim() : '—');
    const pendingBox = $('#pendingListingsBox');
    if (pendingBox) pendingBox.innerHTML = state.listings.slice(0, 5).map(listingCard).join('') || empty('Aucune annonce en attente.');
    const activeBox = $('#activeTransactionsBox');
    if (activeBox) activeBox.innerHTML = activeTransactions().slice(0, 5).map(transactionCard).join('') || empty('Aucune transaction active.');
  }

  function empty(text) { return `<div class="detail-box"><p>${esc(text)}</p></div>`; }
  function listingCard(x) {
    const id = x.id ?? x.listing_id;
    return `<button class="data-row" data-action="listing" data-id="${esc(id)}"><div><b>#${esc(id)}</b><span>${esc(x.title || x.channel_name || x.description || 'Annonce')}</span></div><em>${esc(x.status || 'pending')} ›</em></button>`;
  }
  function transactionCard(x) {
    const id = x.id ?? x.transaction_id;
    return `<button class="data-row" data-action="transaction" data-id="${esc(id)}"><div><b>#${esc(id)}</b><span>${esc(x.reference || '')} · ${esc(x.status || 'transaction')}</span></div><em>${esc(x.channel_price ?? x.amount ?? '')} ${esc(x.currency || '')} ›</em></button>`;
  }

  const moduleData = {
    users: ['Utilisateurs','Gestion des comptes utilisateurs.'],
    transactions: ['Transactions','Historique des transactions et états d’escrow.'],
    transfers: ['Transfert de solde','Vue opérationnelle des transactions actives.'],
    fees: ['Frais','Commission NexMarket : 5 % du prix de vente.'],
    listings: ['Annonces','Validation et rejet des annonces de canaux.'],
    messages: ['Messages','Messages liés aux transactions et support.'],
    stats: ['Statistiques','Indicateurs provenant du backend.'],
    channels: ['Canaux','Canaux enregistrés sur NexMarket.'],
    reports: ['Signalements','Signalements en attente de traitement.'],
    wallet: ['Portefeuille plateforme','Solde et opérations du portefeuille plateforme.']
  };

  async function openModule(name) {
    state.currentModule = name;
    const d = moduleData[name] || ['Module',''];
    const body = $('#adminBody');
    body.innerHTML = `<div class="module-detail"><div class="kicker">§ MODULE / ${esc(name.toUpperCase())}</div><h2>${esc(d[0])}</h2><p>${esc(d[1])}</p><div id="moduleData">Chargement…</div></div>`;
    $('#adminModal').classList.remove('hidden');
    try {
      if (name === 'users') await loadUsers();
      else if (name === 'channels') await loadChannels();
      else if (name === 'reports') await loadReports();
      else if (name === 'messages') await loadMessages();
      else if (name === 'wallet') await loadWallet();
      else if (name === 'transactions' || name === 'transfers') await loadTransactions();
      renderModuleData(name);
    } catch (err) { $('#moduleData').innerHTML = empty(`Erreur backend : ${err.message}`); }
  }

  function renderModuleData(name) {
    const el = $('#moduleData'); if (!el) return;
    if (name === 'users') el.innerHTML = state.users.slice(0,50).map(x => `<div class="detail-box"><b>${esc([x.first_name, x.username && '@' + x.username].filter(Boolean).join(' ') || x.telegram_id || x.id)}</b><p>${esc(x.is_admin ? 'admin' : (x.is_active === false ? 'désactivé' : 'actif'))}</p></div>`).join('') || empty('Aucun utilisateur.');
    else if (name === 'channels') el.innerHTML = state.channels.slice(0,50).map(x => `<div class="detail-box"><b>${esc(x.telegram_username ? '@' + x.telegram_username : (x.title || x.id))}</b><p>${esc(x.verification_status || '')}</p></div>`).join('') || empty('Aucun canal.');
    else if (name === 'reports') el.innerHTML = state.reports.slice(0,50).map(x => `<div class="detail-box"><b>Signalement #${esc(x.id)}</b><p>${esc(x.reason || x.status || '')}</p><button class="small-action" data-report-resolve="${esc(x.id)}">Résoudre</button></div>`).join('') || empty('Aucun signalement.');
    else if (name === 'messages') el.innerHTML = state.messages.slice(0,50).map(x => `<div class="detail-box"><b>Transaction #${esc(x.transaction_id)} · utilisateur ${esc(x.sender_id)}</b><p>${esc(x.content || x.message || '')}</p></div>`).join('') || empty('Aucun message.');
    else if (name === 'wallet') el.innerHTML = (state.wallet?.wallets || []).map(w => `<div class="detail-box"><b>Commissions (${esc(w.currency)})</b><h3>${esc(w.available_balance)} ${esc(w.currency)}</h3><p>Total collecté : ${esc(w.total_fees_collected)}</p></div>`).join('') || empty('Aucune commission encaissée pour le moment.');
    else if (name === 'transactions' || name === 'transfers') el.innerHTML = state.transactions.slice(0,50).map(transactionCard).join('') || empty('Aucune transaction.');
    else if (name === 'listings') el.innerHTML = state.listings.map(listingCard).join('') || empty('Aucune annonce en attente.');
    else if (name === 'stats') el.innerHTML = `<div class="detail-box"><p>Utilisateurs : <b>${esc(state.dashboard?.users ?? 0)}</b></p><p>Canaux : <b>${esc(state.dashboard?.channels ?? 0)}</b></p><p>Annonces : <b>${esc(state.dashboard?.listings ?? 0)}</b></p><p>Transactions : <b>${esc(state.dashboard?.transactions ?? 0)}</b></p></div>`;
    else if (name === 'fees') el.innerHTML = `<div class="detail-box"><h3>5 %</h3><p>Commission NexMarket fixée à 5 % du prix de vente.</p></div>`;
  }

  async function listingDecision(id, action) {
    const base = `/admin/listings/${encodeURIComponent(id)}`;
    if (action === 'approve') {
      await api(`${base}/approve`, { method: 'POST' });
    } else {
      const reason = (window.prompt('Motif du refus (visible par le vendeur) :') || '').trim();
      if (reason.length < 3) throw new Error('Un motif de refus est obligatoire.');
      await api(`${base}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });
    }
    showToast(`Annonce #${id} : ${action === 'approve' ? 'approuvée' : 'rejetée'}`); await bootDashboard(); if (state.currentModule === 'listings') openModule('listings');
  }

  async function transactionAction(id, action) {
    const base = `/transactions/${encodeURIComponent(id)}`;
    const routes = {
      assign: [`${base}/assign`],
      start: [`${base}/start-transfer`],
      complete: [`${base}/complete-transfer`],
      refund: [`${base}/resolve`, { action: 'refund_buyer' }],
      release: [`${base}/resolve`, { action: 'release_seller' }]
    };
    const [url, body] = routes[action] || [];
    if (!url) throw new Error('Action inconnue.');
    if (body) {
      const note = (window.prompt('Note interne (facultatif) :') || '').trim();
      if (note) body.note = note;
    }
    await api(url, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
    showToast(`Transaction #${id} mise à jour`); await bootDashboard();
  }

  async function resolveReport(id) {
    const resolution = (window.prompt('Résolution (obligatoire).\nNote : clore le signalement ne rembourse ni ne paie personne ; faites-le depuis la transaction (Rembourser / Payer le vendeur).') || '').trim();
    if (resolution.length < 3) throw new Error('Une résolution est obligatoire.');
    await api(`/reports/${encodeURIComponent(id)}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify({ resolution, result_status: 'resolved' })
    });
    showToast(`Signalement #${id} résolu`); await openModule('reports');
  }

  document.addEventListener('click', async (e) => {
    const module = e.target.closest('.module[data-module]');
    if (module) return openModule(module.dataset.module);
    const row = e.target.closest('[data-action]');
    if (row?.dataset.action === 'listing') return openListingDetail(row.dataset.id);
    if (row?.dataset.action === 'transaction') return openTransactionDetail(row.dataset.id);
    const resolve = e.target.closest('[data-report-resolve]');
    if (resolve) { try { await resolveReport(resolve.dataset.reportResolve); } catch(err) { showToast(err.message,true); } }
  });

  async function openListingDetail(id) {
    try { const x = await api(`/admin/listings/${encodeURIComponent(id)}`); $('#adminBody').innerHTML = `<div class="module-detail"><div class="kicker">§ ANNONCE #${esc(id)}</div><h2>${esc(x.title || x.channel_name || 'Annonce')}</h2><div class="detail-box"><pre>${esc(JSON.stringify(x,null,2))}</pre></div><div class="actions"><button class="small-action" data-decision="approve">Approuver</button><button class="small-action danger" data-decision="reject">Rejeter</button></div></div>`; $('#adminModal').classList.remove('hidden'); $('#adminBody').dataset.id=id; }
    catch(err) { showToast(err.message,true); }
  }
  async function openTransactionDetail(id) {
    try {
      const x = await api(`/transactions/${encodeURIComponent(id)}`);
      const st = x.status;
      const buttons = [
        !x.assigned_admin_id && !['completed','cancelled','refunded'].includes(st) ? ['assign','Me l’assigner'] : null,
        st === 'waiting_admin' ? ['start','Démarrer le transfert'] : null,
        st === 'transfer_started' ? ['complete','Transfert terminé'] : null,
        ['waiting_admin','transfer_started','protection_period','disputed'].includes(st) ? ['refund','Rembourser l’acheteur'] : null,
        ['protection_period','disputed'].includes(st) ? ['release','Payer le vendeur'] : null
      ].filter(Boolean).map(([a, label]) => `<button class="small-action ${a === 'refund' ? 'danger' : ''}" data-tx-action="${a}">${label}</button>`).join('');
      const view = { reference: x.reference, statut: st, annonce: x.listing_title, acheteur: x.buyer_name, vendeur: x.seller_name, prix: `${x.channel_price} ${x.currency}`, commission: x.platform_fee, 'versé au vendeur': x.seller_amount, 'fonds bloqués': x.escrow_held, 'fin de protection': x.protection_ends_at, 'motif du litige': x.dispute_reason };
      $('#adminBody').innerHTML = `<div class="module-detail"><div class="kicker">§ TRANSACTION #${esc(id)}</div><h2>${esc(st || 'Transaction')}</h2><div class="detail-box"><pre>${esc(JSON.stringify(view, null, 2))}</pre></div><div class="actions">${buttons}</div></div>`;
      $('#adminBody').dataset.id = id;
      $('#adminModal').classList.remove('hidden');
    } catch (err) { showToast(err.message, true); }
  }

  document.addEventListener('click', async (e) => {
    const t = e.target.closest('[data-tx-action]');
    if (!t) return;
    try { await transactionAction($('#adminBody').dataset.id, t.dataset.txAction); $('#adminModal').classList.add('hidden'); }
    catch (err) { showToast(err.message, true); }
  });

  document.addEventListener('click', async (e) => {
    const d = e.target.closest('[data-decision]');
    if (d) { try { await listingDecision($('#adminBody').dataset.id, d.dataset.decision); $('#adminModal').classList.add('hidden'); } catch(err) { showToast(err.message,true); } }
  });

  $('#closeAdmin')?.addEventListener('click', () => $('#adminModal').classList.add('hidden'));
  $('#adminModal')?.addEventListener('click', e => { if (e.target.classList.contains('admin-backdrop')) $('#adminModal').classList.add('hidden'); });
  $('#adminExit')?.addEventListener('click', () => { sessionStorage.removeItem(CONFIG.TOKEN_KEY); location.href='../index.html'; });
  $('#adminMore')?.addEventListener('click', () => showToast(`API : ${CONFIG.API_BASE_URL}`));
  $('#moduleSearch')?.addEventListener('input', e => { const q=e.target.value.toLowerCase(); document.querySelectorAll('.module[data-module]').forEach(b=>b.style.display=b.innerText.toLowerCase().includes(q)?'flex':'none'); });
  $('#refreshAdmin')?.addEventListener('click', async () => { try { await bootDashboard(); showToast('Données actualisées'); } catch(err) { showToast(err.message,true); } });

  async function start() {
    if (!token()) return renderLogin();
    try { await api('/admin/me'); await bootDashboard(); }
    catch (err) { sessionStorage.removeItem(CONFIG.TOKEN_KEY); renderLogin(err.status === 401 ? 'Session admin expirée.' : err.message); }
  }

  window.NexMarketAdmin = { api, bootDashboard, openModule, CONFIG };
  start();
})();
