"use strict";

/*
=========================================================
NEXMARKET ADMIN
Frontend administration
=========================================================

IMPORTANT :
- Aucun ADMIN_CODE dans ce fichier.
- Aucun secret Money Fusion.
- Aucun token permanent.
- Le token admin est reçu du backend après vérification.
=========================================================
*/


/* =======================================================
   CONFIGURATION
======================================================= */

const CONFIG = {

    API_BASE_URL:
        window.NEXMARKET_API_URL ||
        "https://TON-BACKEND.onrender.com/api",

    TOKEN_KEY:
        "nexmarket_admin_token",

    REQUEST_TIMEOUT:
        15000

};


/* =======================================================
   STATE
======================================================= */

const state = {

    currentPage:
        "dashboard",

    adminToken:
        sessionStorage.getItem(CONFIG.TOKEN_KEY),

    listings:
        [],

    transactions:
        [],

    channels:
        [],

    users:
        [],

    reports:
        [],

    loading:
        false

};


/* =======================================================
   DOM
======================================================= */

const $ = (selector) =>
    document.querySelector(selector);

const $$ = (selector) =>
    document.querySelectorAll(selector);


/* =======================================================
   ELEMENTS
======================================================= */

const authScreen =
    $("#authScreen");

const adminApp =
    $("#adminApp");

const authStatus =
    $("#authStatus");

const authLoginButton =
    $("#authLoginButton");

const sidebar =
    $("#sidebar");

const openSidebar =
    $("#openSidebar");

const closeSidebar =
    $("#closeSidebar");

const logoutButton =
    $("#logoutButton");

const refreshButton =
    $("#refreshButton");

const pageTitle =
    $("#pageTitle");

const pageSubtitle =
    $("#pageSubtitle");

const modalOverlay =
    $("#modalOverlay");

const adminModal =
    $("#adminModal");

const modalContent =
    $("#modalContent");

const closeModal =
    $("#closeModal");

const toast =
    $("#toast");

const toastMessage =
    $("#toastMessage");


/* =======================================================
   PAGE INFORMATION
======================================================= */

const PAGE_INFO = {

    dashboard: {
        title: "Vue d'ensemble",
        subtitle: "Gestion de NexMarket"
    },

    verifications: {
        title: "Vérifications",
        subtitle: "Validation des annonces Telegram"
    },

    transactions: {
        title: "Transactions",
        subtitle: "Suivi des achats et transferts"
    },

    channels: {
        title: "Canaux Telegram",
        subtitle: "Gestion des canaux présents sur NexMarket"
    },

    users: {
        title: "Utilisateurs",
        subtitle: "Gestion des utilisateurs NexMarket"
    },

    reports: {
        title: "Signalements",
        subtitle: "Signalements envoyés par les utilisateurs"
    },

    messages: {
        title: "Messages",
        subtitle: "Conversations liées aux transactions"
    },

    admins: {
        title: "Administrateurs",
        subtitle: "Gestion des administrateurs NEXA"
    },

    wallet: {
        title: "Portefeuille NEXA",
        subtitle: "Commissions et opérations NexMarket"
    }

};


/* =======================================================
   TOAST
======================================================= */

let toastTimer = null;

function showToast(
    message,
    type = "normal"
) {

    if (!toast || !toastMessage) {
        return;
    }

    toastMessage.textContent =
        message;

    toast.classList.remove(
        "success",
        "error",
        "warning"
    );

    if (type !== "normal") {
        toast.classList.add(type);
    }

    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {

        toast.classList.remove("show");

    }, 3200);
}


/* =======================================================
   MODAL
======================================================= */

function openModal(content) {

    if (!modalOverlay || !modalContent) {
        return;
    }

    modalContent.innerHTML =
        content;

    modalOverlay.classList.remove(
        "hidden"
    );
}


function closeAdminModal() {

    if (!modalOverlay) {
        return;
    }

    modalOverlay.classList.add(
        "hidden"
    );

    if (modalContent) {
        modalContent.innerHTML = "";
    }
}


/* =======================================================
   LOADING
======================================================= */

function loadingHTML(
    text = "Chargement..."
) {

    return `
        <div class="loading-row">
            <span class="spinner"></span>
            <span>${escapeHTML(text)}</span>
        </div>
    `;
}


/* =======================================================
   HTML ESCAPE
======================================================= */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =======================================================
   API REQUEST
======================================================= */

async function apiRequest(
    endpoint,
    options = {}
) {

    const controller =
        new AbortController();

    const timeout =
        setTimeout(
            () => controller.abort(),
            CONFIG.REQUEST_TIMEOUT
        );

    const headers = {

        "Accept":
            "application/json",

        ...(options.headers || {})

    };

    if (
        options.body &&
        !headers["Content-Type"]
    ) {

        headers["Content-Type"] =
            "application/json";
    }


    if (state.adminToken) {

        headers["Authorization"] =
            `Bearer ${state.adminToken}`;
    }


    try {

        const response =
            await fetch(
                `${CONFIG.API_BASE_URL}${endpoint}`,
                {
                    ...options,
                    headers,
                    signal:
                        controller.signal
                }
            );


        let data = null;

        try {

            data =
                await response.json();

        } catch {

            data = null;
        }


        if (
            response.status === 401 ||
            response.status === 403
        ) {

            handleUnauthorized();

            throw new Error(
                "Session administrateur expirée."
            );
        }


        if (!response.ok) {

            const message =
                data?.detail ||
                data?.message ||
                `Erreur HTTP ${response.status}`;

            throw new Error(message);
        }


        return data;

    } catch (error) {

        if (
            error.name ===
            "AbortError"
        ) {

            throw new Error(
                "Le serveur met trop de temps à répondre."
            );
        }

        throw error;

    } finally {

        clearTimeout(timeout);
    }
}


/* =======================================================
   AUTHENTICATION
======================================================= */

async function verifyAdminSession() {

    if (!state.adminToken) {

        showAuthLogin();

        return;
    }


    authStatus.textContent =
        "Vérification de la session...";


    try {

        /*
         * Endpoint attendu :
         * GET /admin/me
         */

        const data =
            await apiRequest(
                "/admin/me"
            );


        setupAdminIdentity(
            data
        );

        showAdminApp();

        await loadDashboard();

    } catch (error) {

        console.warn(
            "Session admin invalide:",
            error
        );

        sessionStorage.removeItem(
            CONFIG.TOKEN_KEY
        );

        state.adminToken =
            null;

        showAuthLogin();
    }
}


/* =======================================================
   LOGIN SCREEN
======================================================= */

function showAuthLogin() {

    if (authScreen) {
        authScreen.classList.remove(
            "hidden"
        );
    }

    if (adminApp) {
        adminApp.classList.add(
            "hidden"
        );
    }

    if (authStatus) {

        authStatus.textContent =
            "Connectez-vous depuis NexMarket pour accéder à l'administration.";
    }

    if (authLoginButton) {

        authLoginButton.classList.remove(
            "hidden"
        );
    }
}


/* =======================================================
   LOGIN
======================================================= */

async function loginAdmin() {

    const code =
        window.prompt(
            "Entrez le code administrateur NEXA :"
        );


    if (!code) {
        return;
    }


    authStatus.textContent =
        "Connexion en cours...";


    authLoginButton.disabled =
        true;


    try {

        const data =
            await apiRequest(
                "/admin/login",
                {
                    method: "POST",

                    body:
                        JSON.stringify({
                            code
                        })
                }
            );


        if (!data?.token) {

            throw new Error(
                "Le serveur n'a pas retourné de token administrateur."
            );
        }


        state.adminToken =
            data.token;


        sessionStorage.setItem(
            CONFIG.TOKEN_KEY,
            data.token
        );


        setupAdminIdentity(
            data.admin || data
        );


        showAdminApp();


        await loadDashboard();


        showToast(
            "Connexion administrateur réussie.",
            "success"
        );


    } catch (error) {

        console.error(error);

        authStatus.textContent =
            "Code administrateur incorrect ou serveur indisponible.";

        showToast(
            error.message,
            "error"
        );

    } finally {

        authLoginButton.disabled =
            false;
    }
}


/* =======================================================
   ADMIN IDENTITY
======================================================= */

function setupAdminIdentity(
    admin
) {

    if (!admin) {
        return;
    }


    const name =
        admin.first_name ||
        admin.username ||
        admin.name ||
        "Administrateur";


    const username =
        admin.username
            ? `@${admin.username}`
            : "NEXA";


    const nameElement =
        $("#adminName");

    const avatarElement =
        $("#adminAvatar");


    if (nameElement) {
        nameElement.textContent =
            name;
    }


    if (avatarElement) {

        avatarElement.textContent =
            String(name)
                .charAt(0)
                .toUpperCase();
    }
}


/* =======================================================
   SHOW ADMIN
======================================================= */

function showAdminApp() {

    authScreen?.classList.add(
        "hidden"
    );

    adminApp?.classList.remove(
        "hidden"
    );
}


/* =======================================================
   UNAUTHORIZED
======================================================= */

function handleUnauthorized() {

    sessionStorage.removeItem(
        CONFIG.TOKEN_KEY
    );

    state.adminToken =
        null;

    state.listings = [];
    state.transactions = [];
    state.channels = [];
    state.users = [];
    state.reports = [];

    showAuthLogin();
}


/* =======================================================
   LOGOUT
======================================================= */

function logoutAdmin() {

    sessionStorage.removeItem(
        CONFIG.TOKEN_KEY
    );

    state.adminToken =
        null;

    showToast(
        "Déconnexion réussie.",
        "success"
    );

    setTimeout(() => {

        showAuthLogin();

    }, 300);
}


/* =======================================================
   NAVIGATION
======================================================= */

function navigateTo(
    page
) {

    if (!PAGE_INFO[page]) {
        return;
    }


    state.currentPage =
        page;


    $$(".nav-item").forEach(
        item => {

            item.classList.toggle(
                "active",
                item.dataset.page === page
            );
        }
    );


    $$(".admin-page").forEach(
        section => {

            section.classList.toggle(
                "active",
                section.dataset.section === page
            );
        }
    );


    pageTitle.textContent =
        PAGE_INFO[page].title;

    pageSubtitle.textContent =
        PAGE_INFO[page].subtitle;


    sidebar?.classList.remove(
        "open"
    );


    loadPageData(
        page
    );
}


/* =======================================================
   LOAD PAGE DATA
======================================================= */

async function loadPageData(
    page
) {

    try {

        switch (page) {

            case "dashboard":
                await loadDashboard();
                break;

            case "verifications":
                await loadListings();
                break;

            case "transactions":
                await loadTransactions();
                break;

            case "channels":
                await loadChannels();
                break;

            case "users":
                await loadUsers();
                break;

            case "reports":
                await loadReports();
                break;

            case "messages":
                break;

            case "admins":
                await loadAdmins();
                break;

            case "wallet":
                await loadPlatformWallet();
                break;
        }

    } catch (error) {

        console.error(
            `Erreur page ${page}:`,
            error
        );

        showToast(
            error.message,
            "error"
        );
    }
}


/* =======================================================
   DASHBOARD
======================================================= */

async function loadDashboard() {

    try {

        /*
         * Endpoint attendu :
         * GET /admin/dashboard
         */

        const data =
            await apiRequest(
                "/admin/dashboard"
            );


        renderDashboardStats(
            data
        );


        if (Array.isArray(
            data?.pending_listings
        )) {

            state.listings =
                data.pending_listings;

            renderDashboardListings(
                state.listings
            );
        }


        if (Array.isArray(
            data?.active_transactions
        )) {

            state.transactions =
                data.active_transactions;

            renderDashboardTransactions(
                state.transactions
            );
        }


        updateBadges(
            data
        );


    } catch (error) {

        console.error(
            error
        );

        /*
         * On essaie quand même de charger
         * les données séparément si le
         * endpoint dashboard n'est pas
         * encore disponible.
         */

        await loadDashboardFallback();

        throw error;
    }
}


/* =======================================================
   DASHBOARD FALLBACK
======================================================= */

async function loadDashboardFallback() {

    try {

        const [
            listings,
            transactions,
            users
        ] = await Promise.allSettled([

            apiRequest(
                "/admin/listings?status=pending"
            ),

            apiRequest(
                "/admin/transactions"
            ),

            apiRequest(
                "/admin/users"
            )

        ]);


        if (
            listings.status ===
            "fulfilled"
        ) {

            state.listings =
                normalizeArray(
                    listings.value
                );

            renderDashboardListings(
                state.listings
            );
        }


        if (
            transactions.status ===
            "fulfilled"
        ) {

            state.transactions =
                normalizeArray(
                    transactions.value
                );

            renderDashboardTransactions(
                state.transactions
            );
        }


        if (
            users.status ===
            "fulfilled"
        ) {

            state.users =
                normalizeArray(
                    users.value
                );

            setText(
                "statUsers",
                state.users.length
            );
        }


        setText(
            "statPendingListings",
            state.listings.length
        );

        setText(
            "statTransactions",
            state.transactions.length
        );


    } catch (error) {

        console.warn(
            "Dashboard fallback:",
            error
        );
    }
}


/* =======================================================
   DASHBOARD STATS
======================================================= */

function renderDashboardStats(
    data
) {

    setText(
        "statUsers",
        data?.users_count ??
        data?.total_users ??
        "—"
    );


    setText(
        "statPendingListings",
        data?.pending_listings_count ??
        data?.pending_count ??
        "—"
    );


    setText(
        "statTransactions",
        data?.active_transactions_count ??
        data?.active_count ??
        "—"
    );


    const revenue =
        data?.platform_revenue ??
        data?.platform_balance;


    setText(
        "statRevenue",
        formatMoney(
            revenue,
            data?.currency || "XAF"
        )
    );


    setText(
        "platformBalance",
        formatMoney(
            data?.platform_balance,
            data?.currency || "XAF"
        )
    );


    setText(
        "platformRevenue",
        formatMoney(
            data?.platform_revenue,
            data?.currency || "XAF"
        )
    );


    setText(
        "platformCurrency",
        data?.currency || "XAF"
    );
}


/* =======================================================
   BADGES
======================================================= */

function updateBadges(
    data
) {

    setText(
        "pendingListingsBadge",
        data?.pending_listings_count ??
        state.listings.length ??
        0
    );


    setText(
        "activeTransactionsBadge",
        data?.active_transactions_count ??
        state.transactions.length ??
        0
    );
}


/* =======================================================
   LISTINGS
======================================================= */

async function loadListings() {

    const status =
        $("#listingStatusFilter")?.value ||
        "pending";


    const endpoint =
        status === "all"
            ? "/admin/listings"
            : `/admin/listings?status=${encodeURIComponent(status)}`;


    const data =
        await apiRequest(
            endpoint
        );


    state.listings =
        normalizeArray(data);


    renderListingsTable(
        state.listings
    );


    setText(
        "pendingListingsBadge",
        state.listings.length
    );
}


/* =======================================================
   LISTINGS TABLE
======================================================= */

function renderListingsTable(
    listings
) {

    const tbody =
        $("#listingsTableBody");


    if (!tbody) {
        return;
    }


    if (!listings.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        Aucune annonce trouvée.
                    </div>
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        listings.map(
            listing =>
                listingRowHTML(
                    listing
                )
        ).join("");
}


function listingRowHTML(
    listing
) {

    const channel =
        listing.channel ||
        {};

    const seller =
        listing.seller ||
        {};


    const title =
        channel.title ||
        listing.title ||
        "Canal sans nom";


    const username =
        channel.username ||
        listing.username ||
        "";


    const sellerName =
        seller.username
            ? `@${seller.username}`
            : seller.first_name ||
              seller.name ||
              "—";


    const price =
        formatMoney(
            listing.price,
            listing.currency ||
            channel.currency ||
            "XAF"
        );


    const subscribers =
        formatNumber(
            channel.subscribers_count ??
            listing.subscribers_count
        );


    return `
        <tr>

            <td>
                <strong>
                    ${escapeHTML(title)}
                </strong>

                ${
                    username
                        ? `
                            <br>
                            <small>
                                ${escapeHTML(username)}
                            </small>
                          `
                        : ""
                }
            </td>

            <td>
                ${escapeHTML(sellerName)}
            </td>

            <td>
                ${escapeHTML(price)}
            </td>

            <td>
                ${escapeHTML(subscribers)}
            </td>

            <td>
                ${statusBadge(
                    listing.status
                )}
            </td>

            <td>

                <button
                    class="table-action"
                    data-listing-action="view"
                    data-id="${listing.id}"
                    type="button"
                >
                    Voir
                </button>

            </td>

        </tr>
    `;
}


/* =======================================================
   DASHBOARD LISTINGS
======================================================= */

function renderDashboardListings(
    listings
) {

    const container =
        $("#dashboardListings");


    if (!container) {
        return;
    }


    if (!listings.length) {

        container.innerHTML = `
            <div class="empty-state">
                Aucune annonce à vérifier.
            </div>
        `;

        return;
    }


    container.innerHTML =
        listings.slice(0, 5)
            .map(
                listing => {

                    const channel =
                        listing.channel ||
                        {};

                    return `
                        <div class="list-card">

                            <div class="list-card-header">

                                <div>

                                    <h3>
                                        ${escapeHTML(
                                            channel.title ||
                                            listing.title ||
                                            "Canal"
                                        )}
                                    </h3>

                                    <p>
                                        ${
                                            channel.username
                                                ? escapeHTML(
                                                    channel.username
                                                  )
                                                : "Canal Telegram"
                                        }
                                    </p>

                                </div>

                                ${statusBadge(
                                    listing.status
                                )}

                            </div>

                        </div>
                    `;
                }
            )
            .join("");
}


/* =======================================================
   TRANSACTIONS
======================================================= */

async function loadTransactions() {

    const status =
        $("#transactionStatusFilter")?.value ||
        "all";


    const endpoint =
        status === "all"
            ? "/admin/transactions"
            : `/admin/transactions?status=${encodeURIComponent(status)}`;


    const data =
        await apiRequest(
            endpoint
        );


    state.transactions =
        normalizeArray(data);


    renderTransactionsTable(
        state.transactions
    );


    setText(
        "activeTransactionsBadge",
        state.transactions.filter(
            transaction =>
                ![
                    "completed",
                    "cancelled"
                ].includes(
                    transaction.status
                )
        ).length
    );
}


/* =======================================================
   TRANSACTIONS TABLE
======================================================= */

function renderTransactionsTable(
    transactions
) {

    const tbody =
        $("#transactionsTableBody");


    if (!tbody) {
        return;
    }


    if (!transactions.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        Aucune transaction trouvée.
                    </div>
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        transactions.map(
            transaction =>
                transactionRowHTML(
                    transaction
                )
        ).join("");
}


function transactionRowHTML(
    transaction
) {

    const buyer =
        transaction.buyer ||
        {};

    const seller =
        transaction.seller ||
        {};

    const listing =
        transaction.listing ||
        {};


    const channel =
        listing.channel ||
        transaction.channel ||
        {};


    return `
        <tr>

            <td>
                <strong>
                    ${escapeHTML(
                        transaction.reference ||
                        `#${transaction.id}`
                    )}
                </strong>
            </td>

            <td>
                ${escapeHTML(
                    channel.title ||
                    listing.title ||
                    "Canal"
                )}
            </td>

            <td>
                ${escapeHTML(
                    buyer.username
                        ? `@${buyer.username}`
                        : buyer.first_name ||
                          "—"
                )}
            </td>

            <td>
                ${escapeHTML(
                    seller.username
                        ? `@${seller.username}`
                        : seller.first_name ||
                          "—"
                )}
            </td>

            <td>
                ${escapeHTML(
                    formatMoney(
                        transaction.total_buyer_amount ||
                        transaction.channel_price,
                        transaction.currency ||
                        "XAF"
                    )
                )}
            </td>

            <td>
                ${statusBadge(
                    transaction.status
                )}
            </td>

            <td>

                <button
                    class="table-action"
                    data-transaction-action="view"
                    data-id="${transaction.id}"
                    type="button"
                >
                    Voir
                </button>

            </td>

        </tr>
    `;
}


/* =======================================================
   DASHBOARD TRANSACTIONS
======================================================= */

function renderDashboardTransactions(
    transactions
) {

    const container =
        $("#dashboardTransactions");


    if (!container) {
        return;
    }


    if (!transactions.length) {

        container.innerHTML = `
            <div class="empty-state">
                Aucune transaction active.
            </div>
        `;

        return;
    }


    container.innerHTML =
        transactions
            .filter(
                transaction =>
                    ![
                        "completed",
                        "cancelled"
                    ].includes(
                        transaction.status
                    )
            )
            .slice(0, 5)
            .map(
                transaction => `

                    <div class="list-card">

                        <div class="list-card-header">

                            <div>

                                <h3>
                                    ${escapeHTML(
                                        transaction.reference ||
                                        `Transaction #${transaction.id}`
                                    )}
                                </h3>

                                <p>
                                    ${escapeHTML(
                                        formatMoney(
                                            transaction.total_buyer_amount ||
                                            transaction.channel_price,
                                            transaction.currency ||
                                            "XAF"
                                        )
                                    )}
                                </p>

                            </div>

                            ${statusBadge(
                                transaction.status
                            )}

                        </div>

                    </div>
                `
            )
            .join("");
}


/* =======================================================
   CHANNELS
======================================================= */

async function loadChannels() {

    const data =
        await apiRequest(
            "/admin/channels"
        );


    state.channels =
        normalizeArray(data);


    renderChannelsTable(
        state.channels
    );
}


function renderChannelsTable(
    channels
) {

    const tbody =
        $("#channelsTableBody");


    if (!tbody) {
        return;
    }


    if (!channels.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        Aucun canal trouvé.
                    </div>
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        channels.map(
            channel => `

                <tr>

                    <td>
                        <strong>
                            ${escapeHTML(
                                channel.title ||
                                "Canal"
                            )}
                        </strong>

                        ${
                            channel.username
                                ? `
                                    <br>
                                    <small>
                                        ${escapeHTML(
                                            channel.username
                                        )}
                                    </small>
                                  `
                                : ""
                        }
                    </td>

                    <td>
                        ${escapeHTML(
                            channel.category ||
                            "—"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            channel.country ||
                            "—"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            channel.language ||
                            "—"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            formatNumber(
                                channel.subscribers_count
                            )
                        )}
                    </td>

                    <td>
                        ${channel.telegram_verified
                            ? statusBadge("available", "Vérifié")
                            : statusBadge("pending", "Non vérifié")
                        }
                    </td>

                </tr>
            `
        )
        .join("");
}


/* =======================================================
   USERS
======================================================= */

async function loadUsers() {

    const data =
        await apiRequest(
            "/admin/users"
        );


    state.users =
        normalizeArray(data);


    renderUsersTable(
        state.users
    );


    setText(
        "statUsers",
        state.users.length
    );
}


function renderUsersTable(
    users
) {

    const tbody =
        $("#usersTableBody");


    if (!tbody) {
        return;
    }


    if (!users.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        Aucun utilisateur trouvé.
                    </div>
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        users.map(
            user => `

                <tr>

                    <td>

                        <strong>
                            ${escapeHTML(
                                [
                                    user.first_name,
                                    user.last_name
                                ]
                                .filter(Boolean)
                                .join(" ") ||
                                "Utilisateur"
                            )}
                        </strong>

                    </td>

                    <td>
                        ${escapeHTML(
                            user.nexa_id ||
                            "—"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            user.username
                                ? `@${user.username}`
                                : "—"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            user.currency ||
                            "XAF"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            formatDate(
                                user.created_at
                            )
                        )}
                    </td>

                    <td>
                        ${
                            user.is_active
                                ? statusBadge(
                                    "available",
                                    "Actif"
                                  )
                                : statusBadge(
                                    "cancelled",
                                    "Inactif"
                                  )
                        }
                    </td>

                </tr>
            `
        )
        .join("");
}


/* =======================================================
   REPORTS
======================================================= */

async function loadReports() {

    const data =
        await apiRequest(
            "/admin/reports"
        );


    state.reports =
        normalizeArray(data);


    renderReports(
        state.reports
    );
}


function renderReports(
    reports
) {

    const container =
        $("#reportsList");


    if (!container) {
        return;
    }


    if (!reports.length) {

        container.innerHTML = `
            <div class="empty-state">
                Aucun signalement.
            </div>
        `;

        return;
    }


    container.innerHTML =
        reports.map(
            report => `

                <article class="list-card">

                    <div class="list-card-header">

                        <div>

                            <h3>
                                Signalement #${escapeHTML(
                                    report.id
                                )}
                            </h3>

                            <p>
                                ${escapeHTML(
                                    report.reason ||
                                    "Sans motif"
                                )}
                            </p>

                        </div>

                        ${statusBadge(
                            report.status
                        )}

                    </div>

                    <p>
                        ${escapeHTML(
                            report.description ||
                            "Aucune description."
                        )}
                    </p>

                    <div class="list-card-actions">

                        <button
                            class="table-action"
                            data-report-action="view"
                            data-id="${report.id}"
                            type="button"
                        >
                            Voir
                        </button>

                    </div>

                </article>
            `
        )
        .join("");
}


/* =======================================================
   ADMINS
======================================================= */

async function loadAdmins() {

    const container =
        $("#adminsList");


    if (!container) {
        return;
    }


    try {

        const data =
            await apiRequest(
                "/admin/admins"
            );


        const admins =
            normalizeArray(data);


        if (!admins.length) {

            container.innerHTML = `
                <div class="empty-state">
                    Aucun administrateur trouvé.
                </div>
            `;

            return;
        }


        container.innerHTML =
            admins.map(
                admin => `

                    <article class="list-card">

                        <div class="list-card-header">

                            <div>

                                <h3>
                                    ${escapeHTML(
                                        admin.first_name ||
                                        admin.username ||
                                        "Administrateur"
                                    )}
                                </h3>

                                <p>
                                    ${escapeHTML(
                                        admin.username
                                            ? `@${admin.username}`
                                            : "NEXA"
                                    )}
                                </p>

                            </div>

                            ${admin.is_active
                                ? statusBadge(
                                    "available",
                                    "Actif"
                                  )
                                : statusBadge(
                                    "cancelled",
                                    "Inactif"
                                  )
                            }

                        </div>

                    </article>
                `
            )
            .join("");


    } catch (error) {

        container.innerHTML = `
            <div class="empty-state">
                ${escapeHTML(
                    error.message
                )}
            </div>
        `;

        throw error;
    }
}


/* =======================================================
   PLATFORM WALLET
======================================================= */

async function loadPlatformWallet() {

    const data =
        await apiRequest(
            "/admin/wallet"
        );


    setText(
        "platformBalance",
        formatMoney(
            data?.balance,
            data?.currency ||
            "XAF"
        )
    );


    setText(
        "platformRevenue",
        formatMoney(
            data?.revenue,
            data?.currency ||
            "XAF"
        )
    );


    setText(
        "platformCurrency",
        data?.currency ||
        "XAF"
    );


    const ledger =
        normalizeArray(
            data?.ledger
        );


    renderPlatformLedger(
        ledger
    );
}


function renderPlatformLedger(
    entries
) {

    const tbody =
        $("#platformLedgerBody");


    if (!tbody) {
        return;
    }


    if (!entries.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        Aucune opération.
                    </div>
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        entries.map(
            entry => `

                <tr>

                    <td>
                        ${escapeHTML(
                            entry.reference ||
                            "—"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            entry.operation_type ||
                            "—"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            formatMoney(
                                entry.amount,
                                entry.currency ||
                                "XAF"
                            )
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            entry.direction ||
                            "—"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            formatDate(
                                entry.created_at
                            )
                        )}
                    </td>

                </tr>
            `
        )
        .join("");
}


/* =======================================================
   LISTING DETAILS
======================================================= */

async function showListing(
    listingId
) {

    openModal(
        loadingHTML(
            "Chargement de l'annonce..."
        )
    );


    try {

        const listing =
            await apiRequest(
                `/admin/listings/${listingId}`
            );


        const channel =
            listing.channel ||
            {};


        const seller =
            listing.seller ||
            {};


        openModal(`

            <h2>
                Vérification de l'annonce
            </h2>

            <p style="color:var(--text-muted);margin-top:6px;">
                Vérifiez les informations avant de prendre une décision.
            </p>


            <div class="list-card" style="margin-top:20px;">

                <h3>
                    ${escapeHTML(
                        channel.title ||
                        listing.title ||
                        "Canal"
                    )}
                </h3>

                <p>
                    ${
                        channel.username
                            ? escapeHTML(
                                channel.username
                              )
                            : ""
                    }
                </p>

                <p>
                    Abonnés :
                    ${escapeHTML(
                        formatNumber(
                            channel.subscribers_count
                        )
                    )}
                </p>

                <p>
                    Prix :
                    ${escapeHTML(
                        formatMoney(
                            listing.price,
                            listing.currency ||
                            "XAF"
                        )
                    )}
                </p>

                <p>
                    Vendeur :
                    ${escapeHTML(
                        seller.username
                            ? `@${seller.username}`
                            : seller.first_name ||
                              "—"
                    )}
                </p>

                <p>
                    Vérification Telegram :
                    ${
                        channel.telegram_verified
                            ? "Vérifiée"
                            : "À vérifier"
                    }
                </p>

            </div>


            <div style="margin-top:20px;">

                <label
                    style="
                        display:block;
                        color:var(--text-soft);
                        font-size:12px;
                        margin-bottom:8px;
                    "
                >
                    Note administrateur
                </label>

                <textarea
                    id="listingDecisionNote"
                    style="
                        width:100%;
                        min-height:100px;
                        padding:12px;
                        resize:vertical;
                        color:var(--text);
                        background:var(--surface-2);
                        border:1px solid var(--border);
                        border-radius:12px;
                        outline:none;
                    "
                    placeholder="Note facultative..."
                ></textarea>

            </div>


            <div class="list-card-actions">

                <button
                    class="table-action success"
                    id="approveListingButton"
                    type="button"
                >
                    Approuver
                </button>

                <button
                    class="table-action danger"
                    id="rejectListingButton"
                    type="button"
                >
                    Rejeter
                </button>

            </div>

        `);


        $("#approveListingButton")
            ?.addEventListener(
                "click",
                () => decideListing(
                    listingId,
                    "approve"
                )
            );


        $("#rejectListingButton")
            ?.addEventListener(
                "click",
                () => decideListing(
                    listingId,
                    "reject"
                )
            );


    } catch (error) {

        openModal(`
            <div class="empty-state">
                ${escapeHTML(
                    error.message
                )}
            </div>
        `);
    }
}


/* =======================================================
   LISTING DECISION
======================================================= */

async function decideListing(
    listingId,
    action
) {

    const note =
        $("#listingDecisionNote")
            ?.value
            ?.trim() ||
        "";


    const confirmed =
        window.confirm(
            action === "approve"
                ? "Approuver cette annonce ?"
                : "Rejeter cette annonce ?"
        );


    if (!confirmed) {
        return;
    }


    try {

        await apiRequest(
            `/admin/listings/${listingId}/decision`,
            {
                method: "POST",

                body:
                    JSON.stringify({
                        action,
                        note
                    })
            }
        );


        closeAdminModal();

        showToast(
            action === "approve"
                ? "Annonce approuvée."
                : "Annonce rejetée.",
            "success"
        );


        await loadListings();


    } catch (error) {

        showToast(
            error.message,
            "error"
        );
    }
}


/* =======================================================
   TRANSACTION DETAILS
======================================================= */

async function showTransaction(
    transactionId
) {

    openModal(
        loadingHTML(
            "Chargement de la transaction..."
        )
    );


    try {

        const transaction =
            await apiRequest(
                `/admin/transactions/${transactionId}`
            );


        const buyer =
            transaction.buyer ||
            {};

        const seller =
            transaction.seller ||
            {};

        const listing =
            transaction.listing ||
            {};

        const channel =
            listing.channel ||
            transaction.channel ||
            {};


        openModal(`

            <h2>
                Transaction
            </h2>

            <p style="color:var(--text-muted);margin-top:6px;">
                ${escapeHTML(
                    transaction.reference ||
                    `#${transaction.id}`
                )}
            </p>


            <div class="list-card" style="margin-top:20px;">

                <h3>
                    ${escapeHTML(
                        channel.title ||
                        listing.title ||
                        "Canal"
                    )}
                </h3>

                <p>
                    Acheteur :
                    ${escapeHTML(
                        buyer.username
                            ? `@${buyer.username}`
                            : buyer.first_name ||
                              "—"
                    )}
                </p>

                <p>
                    Vendeur :
                    ${escapeHTML(
                        seller.username
                            ? `@${seller.username}`
                            : seller.first_name ||
                              "—"
                    )}
                </p>

                <p>
                    Montant :
                    ${escapeHTML(
                        formatMoney(
                            transaction.total_buyer_amount ||
                            transaction.channel_price,
                            transaction.currency ||
                            "XAF"
                        )
                    )}
                </p>

                <p>
                    Statut :
                    ${statusBadge(
                        transaction.status
                    )}
                </p>

            </div>


            <div
                id="transactionActions"
                class="list-card-actions"
            >

                ${transaction.status === "waiting_admin"
                    ? `
                        <button
                            class="table-action"
                            id="assignTransactionButton"
                            type="button"
                        >
                            Prendre en charge
                        </button>
                      `
                    : ""
                }

                ${
                    [
                        "assigned",
                        "transfer_pending"
                    ].includes(
                        transaction.status
                    )
                        ? `
                            <button
                                class="table-action success"
                                id="completeTransactionButton"
                                type="button"
                            >
                                Confirmer le transfert
                            </button>

                            <button
                                class="table-action danger"
                                id="cancelTransactionButton"
                                type="button"
                            >
                                Annuler
                            </button>
                          `
                        : ""
                }

            </div>

        `);


        $("#assignTransactionButton")
            ?.addEventListener(
                "click",
                () => transactionAction(
                    transactionId,
                    "assign"
                )
            );


        $("#completeTransactionButton")
            ?.addEventListener(
                "click",
                () => transactionAction(
                    transactionId,
                    "complete"
                )
            );


        $("#cancelTransactionButton")
            ?.addEventListener(
                "click",
                () => transactionAction(
                    transactionId,
                    "cancel"
                )
            );


    } catch (error) {

        openModal(`
            <div class="empty-state">
                ${escapeHTML(
                    error.message
                )}
            </div>
        `);
    }
}


/* =======================================================
   TRANSACTION ACTION
======================================================= */

async function transactionAction(
    transactionId,
    action
) {

    const messages = {

        assign:
            "Prendre cette transaction en charge ?",

        complete:
            "Confirmer que le transfert du canal est terminé ?",

        cancel:
            "Annuler cette transaction ?"

    };


    if (
        !window.confirm(
            messages[action] ||
            "Confirmer cette action ?"
        )
    ) {
        return;
    }


    try {

        await apiRequest(
            `/admin/transactions/${transactionId}/action`,
            {
                method: "POST",

                body:
                    JSON.stringify({
                        action
                    })
            }
        );


        closeAdminModal();


        showToast(
            "Action effectuée.",
            "success"
        );


        await loadTransactions();


    } catch (error) {

        showToast(
            error.message,
            "error"
        );
    }
}


/* =======================================================
   HELPERS
======================================================= */

function normalizeArray(
    data
) {

    if (Array.isArray(data)) {
        return data;
    }

    if (
        Array.isArray(
            data?.items
        )
    ) {
        return data.items;
    }

    if (
        Array.isArray(
            data?.data
        )
    ) {
        return data.data;
    }

    return [];
}


function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (!element) {
        return;
    }

    element.textContent =
        value ??
        "—";
}


function formatNumber(
    value
) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "—";
    }


    const number =
        Number(value);


    if (
        !Number.isFinite(number)
    ) {
        return String(value);
    }


    return new Intl.NumberFormat(
        "fr-FR"
    ).format(number);
}


function formatMoney(
    amount,
    currency = "XAF"
) {

    if (
        amount === null ||
        amount === undefined ||
        amount === ""
    ) {
        return "—";
    }


    const number =
        Number(amount);


    if (
        !Number.isFinite(number)
    ) {
        return `${amount} ${currency}`;
    }


    return new Intl.NumberFormat(
        "fr-FR",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }
    ).format(number)
        + ` ${currency}`;
}


function formatDate(
    value
) {

    if (!value) {
        return "—";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return String(value);
    }


    return new Intl.DateTimeFormat(
        "fr-FR",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    ).format(date);
}


function statusBadge(
    status,
    customLabel = null
) {

    const labels = {

        pending:
            "En attente",

        waiting_admin:
            "En attente d'un admin",

        available:
            "Disponible",

        assigned:
            "Assignée",

        transfer_pending:
            "Transfert en cours",

        completed:
            "Terminée",

        cancelled:
            "Annulée",

        rejected:
            "Rejetée",

        disputed:
            "Litige",

        refunded:
            "Remboursée"

    };


    const label =
        customLabel ||
        labels[status] ||
        status ||
        "Inconnu";


    return `
        <span class="status-badge ${escapeHTML(
            status || ""
        )}">
            ${escapeHTML(label)}
        </span>
    `;
}


/* =======================================================
   SIDEBAR
======================================================= */

openSidebar?.addEventListener(
    "click",
    () => {

        sidebar?.classList.add(
            "open"
        );
    }
);


closeSidebar?.addEventListener(
    "click",
    () => {

        sidebar?.classList.remove(
            "open"
        );
    }
);


/* =======================================================
   NAVIGATION EVENTS
======================================================= */

$$(".nav-item").forEach(
    item => {

        item.addEventListener(
            "click",
            () => {

                navigateTo(
                    item.dataset.page
                );
            }
        );
    }
);


$$("[data-goto]").forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                navigateTo(
                    button.dataset.goto
                );
            }
        );
    }
);


/* =======================================================
   REFRESH
======================================================= */

refreshButton?.addEventListener(
    "click",
    async () => {

        refreshButton.disabled =
            true;

        try {

            await loadPageData(
                state.currentPage
            );

            showToast(
                "Données actualisées.",
                "success"
            );

        } catch (error) {

            showToast(
                error.message,
                "error"
            );

        } finally {

            refreshButton.disabled =
                false;
        }
    }
);


/* =======================================================
   FILTER EVENTS
======================================================= */

$("#refreshListings")
    ?.addEventListener(
        "click",
        () => loadListings()
    );


$("#refreshTransactions")
    ?.addEventListener(
        "click",
        () => loadTransactions()
    );


$("#listingStatusFilter")
    ?.addEventListener(
        "change",
        () => loadListings()
    );


$("#transactionStatusFilter")
    ?.addEventListener(
        "change",
        () => loadTransactions()
    );


$("#listingSearch")
    ?.addEventListener(
        "input",
        filterListings
    );


$("#transactionSearch")
    ?.addEventListener(
        "input",
        filterTransactions
    );


$("#userSearch")
    ?.addEventListener(
        "input",
        filterUsers
    );


/* =======================================================
   FILTER LISTINGS
======================================================= */

function filterListings() {

    const query =
        $("#listingSearch")
            ?.value
            ?.trim()
            ?.toLowerCase() ||
        "";


    if (!query) {

        renderListingsTable(
            state.listings
        );

        return;
    }


    const filtered =
        state.listings.filter(
            listing => {

                const channel =
                    listing.channel ||
                    {};

                const values = [

                    channel.title,

                    channel.username,

                    channel.category,

                    channel.country,

                    channel.language,

                    listing.seller?.username

                ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


                return values.includes(
                    query
                );
            }
        );


    renderListingsTable(
        filtered
    );
}


/* =======================================================
   FILTER TRANSACTIONS
======================================================= */

function filterTransactions() {

    const query =
        $("#transactionSearch")
            ?.value
            ?.trim()
            ?.toLowerCase() ||
        "";


    if (!query) {

        renderTransactionsTable(
            state.transactions
        );

        return;
    }


    const filtered =
        state.transactions.filter(
            transaction => {

                const values = [

                    transaction.reference,

                    transaction.buyer?.username,

                    transaction.seller?.username,

                    transaction.listing?.channel?.title,

                    transaction.channel?.title

                ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


                return values.includes(
                    query
                );
            }
        );


    renderTransactionsTable(
        filtered
    );
}


/* =======================================================
   FILTER USERS
======================================================= */

function filterUsers() {

    const query =
        $("#userSearch")
            ?.value
            ?.trim()
            ?.toLowerCase() ||
        "";


    if (!query) {

        renderUsersTable(
            state.users
        );

        return;
    }


    const filtered =
        state.users.filter(
            user => {

                const values = [

                    user.first_name,

                    user.last_name,

                    user.username,

                    user.nexa_id,

                    user.telegram_id

                ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


                return values.includes(
                    query
                );
            }
        );


    renderUsersTable(
        filtered
    );
}


/* =======================================================
   TABLE ACTIONS
======================================================= */

document.addEventListener(
    "click",
    event => {

        const listingButton =
            event.target.closest(
                "[data-listing-action]"
            );


        if (listingButton) {

            const id =
                listingButton.dataset.id;

            if (
                listingButton.dataset
                    .listingAction ===
                "view"
            ) {

                showListing(id);
            }

            return;
        }


        const transactionButton =
            event.target.closest(
                "[data-transaction-action]"
            );


        if (transactionButton) {

            const id =
                transactionButton.dataset.id;

            if (
                transactionButton.dataset
                    .transactionAction ===
                "view"
            ) {

                showTransaction(id);
            }

            return;
        }


        const reportButton =
            event.target.closest(
                "[data-report-action]"
            );


        if (reportButton) {

            const id =
                reportButton.dataset.id;

            if (
                reportButton.dataset
                    .reportAction ===
                "view"
            ) {

                showReport(id);
            }
        }
    }
);


/* =======================================================
   REPORT DETAILS
======================================================= */

async function showReport(
    reportId
) {

    openModal(
        loadingHTML(
            "Chargement du signalement..."
        )
    );


    try {

        const report =
            await apiRequest(
                `/admin/reports/${reportId}`
            );


        openModal(`

            <h2>
                Signalement #${escapeHTML(
                    report.id
                )}
            </h2>

            <div
                class="list-card"
                style="margin-top:20px;"
            >

                <p>
                    Motif :
                    ${escapeHTML(
                        report.reason ||
                        "—"
                    )}
                </p>

                <p>
                    Description :
                    ${escapeHTML(
                        report.description ||
                        "Aucune description."
                    )}
                </p>

                <p>
                    Statut :
                    ${statusBadge(
                        report.status
                    )}
                </p>

            </div>


            <div class="list-card-actions">

                <button
                    class="table-action success"
                    id="resolveReportButton"
                    type="button"
                >
                    Résoudre
                </button>

            </div>

        `);


        $("#resolveReportButton")
            ?.addEventListener(
                "click",
                () => resolveReport(
                    reportId
                )
            );


    } catch (error) {

        openModal(`
            <div class="empty-state">
                ${escapeHTML(
                    error.message
                )}
            </div>
        `);
    }
}


/* =======================================================
   RESOLVE REPORT
======================================================= */

async function resolveReport(
    reportId
) {

    if (
        !window.confirm(
            "Marquer ce signalement comme résolu ?"
        )
    ) {
        return;
    }


    try {

        await apiRequest(
            `/admin/reports/${reportId}/resolve`,
            {
                method: "POST",

                body:
                    JSON.stringify({
                        note: ""
                    })
            }
        );


        closeAdminModal();

        showToast(
            "Signalement résolu.",
            "success"
        );

        await loadReports();


    } catch (error) {

        showToast(
            error.message,
            "error"
        );
    }
}


/* =======================================================
   MODAL EVENTS
======================================================= */

closeModal?.addEventListener(
    "click",
    closeAdminModal
);


modalOverlay?.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            modalOverlay
        ) {

            closeAdminModal();
        }
    }
);


/* =======================================================
   LOGOUT
======================================================= */

logoutButton?.addEventListener(
    "click",
    () => {

        if (
            window.confirm(
                "Voulez-vous vous déconnecter ?"
            )
        ) {

            logoutAdmin();
        }
    }
);


/* =======================================================
   LOGIN
======================================================= */

authLoginButton?.addEventListener(
    "click",
    loginAdmin
);


/* =======================================================
   KEYBOARD
======================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape"
        ) {

            closeAdminModal();

            sidebar?.classList.remove(
                "open"
            );
        }
    }
);


/* =======================================================
   INITIALISATION
======================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        verifyAdminSession();

    }
);