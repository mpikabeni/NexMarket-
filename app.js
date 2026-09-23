/* =========================================================
   NEXMARKET — app.js
   Version finale frontend
   ========================================================= */

(() => {
    "use strict";

    /* =====================================================
       CONFIGURATION
    ===================================================== */

    const CONFIG = {
        // Remplace uniquement cette URL par ton vrai backend Render.
        API_BASE_URL:
            window.NEXMARKET_API_URL ||
            "https://TON-BACKEND.onrender.com/api",

        APP_VERSION: "1.0.0",

        ADMIN_PATH: "/admin/",

        ADMIN_TAP_COUNT: 5,

        ADMIN_TAP_WINDOW: 2500,

        REQUEST_TIMEOUT: 15000
    };


    /* =====================================================
       TELEGRAM WEB APP
    ===================================================== */

    const tg =
        window.Telegram &&
        window.Telegram.WebApp
            ? window.Telegram.WebApp
            : null;


    /* =====================================================
       ETAT APPLICATION
    ===================================================== */

    const state = {
        currentPage: "home",

        user: null,

        wallet: null,

        listings: [],

        myListings: [],

        transactions: [],

        messages: [],

        favorites: [],

        loading: false,

        adminTapCount: 0,

        adminTapTimer: null,

        searchQuery: "",

        selectedCategory: "all",

        selectedCountry: "all",

        selectedLanguage: "all",

        selectedSubscribers: "all",

        selectedPrice: "all"
    };


    /* =====================================================
       DOM
    ===================================================== */

    const DOM = {
        splash:
            document.getElementById("splashScreen"),

        app:
            document.getElementById("app"),

        pageContainer:
            document.getElementById("pageContainer"),

        profileAvatarButton:
            document.getElementById("profileAvatarButton"),

        telegramAvatar:
            document.getElementById("telegramAvatar"),

        avatarLetter:
            document.getElementById("avatarLetter"),

        headerGreeting:
            document.getElementById("headerGreeting"),

        headerSearchButton:
            document.getElementById("headerSearchButton"),

        faqButton:
            document.getElementById("faqButton"),

        bottomNavigation:
            document.getElementById("bottomNavigation"),

        toast:
            document.getElementById("toast"),

        toastTitle:
            document.getElementById("toastTitle"),

        toastMessage:
            document.getElementById("toastMessage"),

        modalContainer:
            document.getElementById("modalContainer"),

        modalOverlay:
            document.getElementById("modalOverlay"),

        modalContent:
            document.getElementById("modalContent"),

        modalBody:
            document.getElementById("modalBody"),

        modalClose:
            document.getElementById("modalClose")
    };


    /* =====================================================
       INITIALISATION TELEGRAM
    ===================================================== */

    function initTelegram() {

        if (!tg) {
            return;
        }

        try {
            tg.ready();

            tg.expand();

            if (typeof tg.setHeaderColor === "function") {
                tg.setHeaderColor("#08080c");
            }

            if (typeof tg.setBackgroundColor === "function") {
                tg.setBackgroundColor("#08080c");
            }

        } catch (error) {
            console.warn(
                "Telegram WebApp initialisation:",
                error
            );
        }
    }


    /* =====================================================
       TELEGRAM INIT DATA
    ===================================================== */

    function getTelegramInitData() {

        if (!tg) {
            return "";
        }

        return tg.initData || "";
    }


    function getTelegramUser() {

        if (!tg || !tg.initDataUnsafe) {
            return null;
        }

        return tg.initDataUnsafe.user || null;
    }


    /* =====================================================
       API
    ===================================================== */

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
            "Content-Type":
                "application/json",

            "Accept":
                "application/json"
        };

        const initData =
            getTelegramInitData();

        if (initData) {
            headers[
                "X-Telegram-Init-Data"
            ] = initData;
        }

        try {

            const response =
                await fetch(
                    `${CONFIG.API_BASE_URL}${endpoint}`,
                    {
                        ...options,

                        headers: {
                            ...headers,
                            ...(options.headers || {})
                        },

                        signal:
                            controller.signal
                    }
                );

            const contentType =
                response.headers.get(
                    "content-type"
                ) || "";

            let data;

            if (
                contentType.includes(
                    "application/json"
                )
            ) {

                data =
                    await response.json();

            } else {

                const text =
                    await response.text();

                data = {
                    detail: text
                };
            }

            if (!response.ok) {

                const message =
                    data?.detail ||
                    data?.message ||
                    "Une erreur est survenue.";

                throw new Error(
                    typeof message === "string"
                        ? message
                        : "Erreur API"
                );
            }

            return data;

        } catch (error) {

            if (
                error.name ===
                "AbortError"
            ) {

                throw new Error(
                    "La requête a pris trop de temps."
                );
            }

            throw error;

        } finally {

            clearTimeout(timeout);
        }
    }


    /* =====================================================
       HELPERS
    ===================================================== */

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


    function formatMoney(
        amount,
        currency = "FCFA"
    ) {

        if (
            amount === null ||
            amount === undefined ||
            Number.isNaN(Number(amount))
        ) {
            return "—";
        }

        return `${new Intl.NumberFormat(
            "fr-FR"
        ).format(Number(amount))} ${currency}`;
    }


    function formatNumber(value) {

        if (
            value === null ||
            value === undefined
        ) {
            return "—";
        }

        return new Intl.NumberFormat(
            "fr-FR"
        ).format(Number(value));
    }


    function formatDate(value) {

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
            return "—";
        }

        return new Intl.DateTimeFormat(
            "fr-FR",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            }
        ).format(date);
    }


    function getInitials(user) {

        if (!user) {
            return "N";
        }

        const first =
            user.first_name || "";

        const last =
            user.last_name || "";

        const text =
            `${first} ${last}`.trim();

        if (!text) {
            return "N";
        }

        return text
            .split(/\s+/)
            .slice(0, 2)
            .map(
                word =>
                    word
                        .charAt(0)
                        .toUpperCase()
            )
            .join("");
    }


    function getDisplayName(user) {

        if (!user) {
            return "Utilisateur";
        }

        const name =
            `${user.first_name || ""} ${user.last_name || ""}`
                .trim();

        return (
            name ||
            (user.username
                ? `@${user.username}`
                : "Utilisateur")
        );
    }


    /* =====================================================
       SVG ICONS
    ===================================================== */

    const ICONS = {

        search: `
            <svg viewBox="0 0 24 24"
                 fill="none"
                 stroke="currentColor"
                 stroke-width="1.8"
                 stroke-linecap="round"
                 stroke-linejoin="round">
                <circle cx="11" cy="11" r="7"></circle>
                <path d="m20 20-4-4"></path>
            </svg>
        `,

        wallet: `
            <svg viewBox="0 0 24 24"
                 fill="none"
                 stroke="currentColor"
                 stroke-width="1.8"
                 stroke-linecap="round"
                 stroke-linejoin="round">
                <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5.5A2.5 2.5 0 0 1 3 16.5v-9Z"></path>
                <path d="M3 8h15"></path>
                <path d="M17 13h4"></path>
                <circle cx="17" cy="13" r=".7"></circle>
            </svg>
        `,

        deposit: `
            <svg viewBox="0 0 24 24"
                 fill="none"
                 stroke="currentColor"
                 stroke-width="1.8"
                 stroke-linecap="round"
                 stroke-linejoin="round">
                <path d="M12 19V5"></path>
                <path d="m6.5 10.5 5.5-5.5 5.5 5.5"></path>
                <path d="M5 19h14"></path>
            </svg>
        `,

        withdraw: `
            <svg viewBox="0 0 24 24"
                 fill="none"
                 stroke="currentColor"
                 stroke-width="1.8"
                 stroke-linecap="round"
                 stroke-linejoin="round">
                <path d="M12 5v14"></path>
                <path d="m6.5 13.5 5.5 5.5 5.5-5.5"></path>
                <path d="M5 5h14"></path>
            </svg>
        `,

        cart: `
            <svg viewBox="0 0 24 24"
                 fill="none"
                 stroke="currentColor"
                 stroke-width="1.8"
                 stroke-linecap="round"
                 stroke-linejoin="round">
                <path d="M6 7h12l1.2 13H4.8L6 7Z"></path>
                <path d="M9 7a3 3 0 0 1 6 0"></path>
            </svg>
        `,

        sell: `
            <svg viewBox="0 0 24 24"
                 fill="none"
                 stroke="currentColor"
                 stroke-width="1.8"
                 stroke-linecap="round"
                 stroke-linejoin="round">
                <path d="M12 19V5"></path>
                <path d="m6.5 10.5 5.5-5.5 5.5 5.5"></path>
                <path d="M5 19h14"></path>
            </svg>
        `,

        message: `
            <svg viewBox="0 0 24 24"
                 fill="none"
                 stroke="currentColor"
                 stroke-width="1.8"
                 stroke-linecap="round"
                 stroke-linejoin="round">
                <path d="M20 11.5a7.5 7.5 0 0 1-7.8 7.5 8.5 8.5 0 0 1-3.4-.7L4 20l1.4-4.2A7.3 7.3 0 0 1 4.5 12 7.5 7.5 0 0 1 12 4.5h.5A7.5 7.5 0 0 1 20 11.5Z"></path>
            </svg>
        `,

        user: `
            <svg viewBox="0 0 24 24"
                 fill="none"
                 stroke="currentColor"
                 stroke-width="1.8"
                 stroke-linecap="round"
                 stroke-linejoin="round">
                <circle cx="12" cy="8" r="3.5"></circle>
                <path d="M5 20a7 7 0 0 1 14 0"></path>
            </svg>
        `,

        heart: `
            <svg viewBox="0 0 24 24"
                 fill="none"
                 stroke="currentColor"
                 stroke-width="1.8"
                 stroke-linecap="round"
                 stroke-linejoin="round">
                <path d="M20.8 8.8c0 5.2-8.8 10-8.8 10S3.2 14 3.2 8.8A4.7 4.7 0 0 1 12 6.1a4.7 4.7 0 0 1 8.8 2.7Z"></path>
            </svg>
        `,

        filter: `
            <svg viewBox="0 0 24 24"
                 fill="none"
                 stroke="currentColor"
                 stroke-width="1.8"
                 stroke-linecap="round"
                 stroke-linejoin="round">
                <path d="M4 6h16"></path>
                <path d="M7 12h10"></path>
                <path d="M10 18h4"></path>
            </svg>
        `,

        arrow: `
            <svg viewBox="0 0 24 24"
                 fill="none"
                 stroke="currentColor"
                 stroke-width="1.8"
                 stroke-linecap="round"
                 stroke-linejoin="round">
                <path d="M5 12h14"></path>
                <path d="m13 6 6 6-6 6"></path>
            </svg>
        `,

        plus: `
            <svg viewBox="0 0 24 24"
                 fill="none"
                 stroke="currentColor"
                 stroke-width="1.8"
                 stroke-linecap="round">
                <path d="M12 5v14"></path>
                <path d="M5 12h14"></path>
            </svg>
        `,

        close: `
            <svg viewBox="0 0 24 24"
                 fill="none"
                 stroke="currentColor"
                 stroke-width="1.8"
                 stroke-linecap="round">
                <path d="M6 6l12 12"></path>
                <path d="M18 6 6 18"></path>
            </svg>
        `,

        channel: `
            <svg viewBox="0 0 24 24"
                 fill="none"
                 stroke="currentColor"
                 stroke-width="1.8"
                 stroke-linecap="round"
                 stroke-linejoin="round">
                <rect x="4" y="4" width="16" height="16" rx="4"></rect>
                <path d="m8 12 2.5 2.5L16 9"></path>
            </svg>
        `,

        lock: `
            <svg viewBox="0 0 24 24"
                 fill="none"
                 stroke="currentColor"
                 stroke-width="1.8"
                 stroke-linecap="round"
                 stroke-linejoin="round">
                <rect x="5" y="10" width="14" height="10" rx="2"></rect>
                <path d="M8 10V7a4 4 0 0 1 8 0v3"></path>
            </svg>
        `,

        help: `
            <svg viewBox="0 0 24 24"
                 fill="none"
                 stroke="currentColor"
                 stroke-width="1.8"
                 stroke-linecap="round"
                 stroke-linejoin="round">
                <circle cx="12" cy="12" r="9"></circle>
                <path d="M9.8 9a2.3 2.3 0 1 1 4.1 1.4c-.8.9-1.9 1.3-1.9 2.6"></path>
                <path d="M12 16.5h.01"></path>
            </svg>
        `
    };


    /* =====================================================
       TOAST
    ===================================================== */

    let toastTimeout = null;

    function showToast(
        title,
        message
    ) {

        if (!DOM.toast) {
            return;
        }

        DOM.toastTitle.textContent =
            title || "";

        DOM.toastMessage.textContent =
            message || "";

        DOM.toast.classList.add("show");

        clearTimeout(toastTimeout);

        toastTimeout =
            setTimeout(() => {

                DOM.toast.classList.remove(
                    "show"
                );

            }, 3500);
    }


    /* =====================================================
       MODAL
    ===================================================== */

    function openModal(content) {

        if (!DOM.modalContainer) {
            return;
        }

        DOM.modalBody.innerHTML =
            content;

        DOM.modalContainer.classList.remove(
            "hidden"
        );

        DOM.modalContainer.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.style.overflow =
            "hidden";
    }


    function closeModal() {

        if (!DOM.modalContainer) {
            return;
        }

        DOM.modalContainer.classList.add(
            "hidden"
        );

        DOM.modalContainer.setAttribute(
            "aria-hidden",
            "true"
        );

        DOM.modalBody.innerHTML = "";

        document.body.style.overflow =
            "";
    }


    /* =====================================================
       TELEGRAM PROFILE
    ===================================================== */

    function updateTelegramProfile() {

        const user =
            state.user ||
            getTelegramUser();

        if (!user) {
            return;
        }

        const initials =
            getInitials(user);

        if (DOM.avatarLetter) {
            DOM.avatarLetter.textContent =
                initials;
        }

        if (
            user.photo_url &&
            DOM.telegramAvatar
        ) {

            DOM.telegramAvatar.src =
                user.photo_url;

            DOM.telegramAvatar.classList.remove(
                "hidden"
            );

            DOM.avatarLetter.classList.add(
                "hidden"
            );

        } else if (DOM.telegramAvatar) {

            DOM.telegramAvatar.classList.add(
                "hidden"
            );

            DOM.avatarLetter.classList.remove(
                "hidden"
            );
        }

        if (DOM.headerGreeting) {

            DOM.headerGreeting.textContent =
                `Bonjour ${getDisplayName(user)}`;
        }
    }


    /* =====================================================
       AUTHENTICATION
    ===================================================== */

    async function authenticate() {

        const initData =
            getTelegramInitData();

        const telegramUser =
            getTelegramUser();

        /*
         * Hors Telegram, on ne crée pas de faux
         * utilisateur financier.
         */

        if (!initData || !telegramUser) {

            state.user = null;

            return null;
        }

        try {

            const data =
                await apiRequest(
                    "/auth/telegram",
                    {
                        method: "POST",

                        body: JSON.stringify({
                            init_data:
                                initData
                        })
                    }
                );

            state.user =
                data.user ||
                data;

            return state.user;

        } catch (error) {

            console.error(
                "Authentification Telegram:",
                error
            );

            /*
             * On conserve les données Telegram
             * locales uniquement pour afficher
             * l'interface.
             *
             * Les opérations sensibles restent
             * bloquées tant que le backend n'est
             * pas authentifié.
             */

            state.user =
                telegramUser;

            return telegramUser;
        }
    }


    /* =====================================================
       LOAD WALLET
    ===================================================== */

    async function loadWallet() {

        try {

            const data =
                await apiRequest(
                    "/wallet"
                );

            state.wallet =
                data.wallet ||
                data;

            return state.wallet;

        } catch (error) {

            console.warn(
                "Wallet:",
                error.message
            );

            state.wallet = null;

            return null;
        }
    }


    /* =====================================================
       LOAD LISTINGS
    ===================================================== */

    async function loadListings() {

        try {

            const params =
                new URLSearchParams();

            params.set(
                "status",
                "available"
            );

            if (
                state.searchQuery.trim()
            ) {

                params.set(
                    "search",
                    state.searchQuery.trim()
                );
            }

            if (
                state.selectedCategory !==
                "all"
            ) {

                params.set(
                    "category",
                    state.selectedCategory
                );
            }

            if (
                state.selectedCountry !==
                "all"
            ) {

                params.set(
                    "country",
                    state.selectedCountry
                );
            }

            if (
                state.selectedLanguage !==
                "all"
            ) {

                params.set(
                    "language",
                    state.selectedLanguage
                );
            }

            const data =
                await apiRequest(
                    `/channels?${params.toString()}`
                );

            state.listings =
                Array.isArray(data)
                    ? data
                    : (
                        data.items ||
                        data.listings ||
                        []
                    );

            return state.listings;

        } catch (error) {

            console.warn(
                "Listings:",
                error.message
            );

            state.listings = [];

            return [];
        }
    }


    /* =====================================================
       LOAD TRANSACTIONS
    ===================================================== */

    async function loadTransactions() {

        try {

            const data =
                await apiRequest(
                    "/transactions"
                );

            state.transactions =
                Array.isArray(data)
                    ? data
                    : (
                        data.items ||
                        data.transactions ||
                        []
                    );

            return state.transactions;

        } catch (error) {

            console.warn(
                "Transactions:",
                error.message
            );

            state.transactions = [];

            return [];
        }
    }


    /* =====================================================
       NAVIGATION
    ===================================================== */

    function setActiveNavigation(
        page
    ) {

        const items =
            document.querySelectorAll(
                ".nav-item"
            );

        items.forEach(item => {

            item.classList.toggle(
                "active",
                item.dataset.page === page
            );

        });
    }


    async function navigateTo(
        page
    ) {

        const allowedPages = [
            "home",
            "buy",
            "sell",
            "messages",
            "profile"
        ];

        if (
            !allowedPages.includes(page)
        ) {
            page = "home";
        }

        state.currentPage =
            page;

        setActiveNavigation(page);

        if (!DOM.pageContainer) {
            return;
        }

        DOM.pageContainer.innerHTML =
            `
            <div class="loading">
                <div class="loading-spinner"></div>
            </div>
            `;

        await new Promise(
            resolve =>
                requestAnimationFrame(resolve)
        );

        switch (page) {

            case "home":
                await renderHome();
                break;

            case "buy":
                await renderBuy();
                break;

            case "sell":
                await renderSell();
                break;

            case "messages":
                await renderMessages();
                break;

            case "profile":
                await renderProfile();
                break;
        }
    }


    /* =====================================================
       HOME
    ===================================================== */

    async function renderHome() {

        await loadListings();

        const user =
            state.user ||
            getTelegramUser();

        const displayName =
            escapeHTML(
                getDisplayName(user)
            );

        DOM.pageContainer.innerHTML =
            `
            <div class="page-enter">

                <section class="hero">

                    <span class="hero-badge">
                        <span class="hero-badge-dot"></span>
                        Marketplace active
                    </span>

                    <h2>
                        Trouve ton prochain
                        canal Telegram.
                    </h2>

                    <p>
                        Achète ou vends des canaux
                        Telegram dans un espace sécurisé
                        pensé pour l'Afrique.
                    </p>

                </section>


                <section class="section">

                    <div class="section-header">

                        <h2 class="section-title">
                            Actions rapides
                        </h2>

                    </div>

                    <div class="quick-actions">

                        ${quickAction(
                            "wallet",
                            ICONS.wallet,
                            "Portefeuille",
                            "wallet"
                        )}

                        ${quickAction(
                            "buy",
                            ICONS.cart,
                            "Acheter",
                            "buy"
                        )}

                        ${quickAction(
                            "sell",
                            ICONS.sell,
                            "Vendre",
                            "sell"
                        )}

                        ${quickAction(
                            "messages",
                            ICONS.message,
                            "Messages",
                            "messages"
                        )}

                    </div>

                </section>


                <section class="section">

                    <div class="section-header">

                        <h2 class="section-title">
                            Canaux disponibles
                        </h2>

                        <button
                            class="section-link"
                            data-action="open-buy"
                            type="button"
                        >
                            Voir tout
                        </button>

                    </div>

                    ${renderChannelList(
                        state.listings.slice(0, 5)
                    )}

                </section>

            </div>
            `;

        bindDynamicEvents();
    }


    function quickAction(
        id,
        icon,
        label,
        action
    ) {

        return `
            <button
                class="quick-action"
                data-action="${escapeHTML(action)}"
                type="button"
                id="quick-${escapeHTML(id)}"
            >

                <span class="quick-action-icon">
                    ${icon}
                </span>

                <span class="quick-action-label">
                    ${escapeHTML(label)}
                </span>

            </button>
        `;
    }


    /* =====================================================
       BUY
    ===================================================== */

    async function renderBuy() {

        await loadListings();

        DOM.pageContainer.innerHTML =
            `
            <div class="page-enter">

                <section class="section">

                    <div class="section-header">

                        <div>
                            <h2 class="section-title">
                                Acheter
                            </h2>

                            <p
                                style="
                                    margin-top:5px;
                                    color:var(--text-muted);
                                    font-size:10px;
                                "
                            >
                                Découvre les canaux disponibles.
                            </p>
                        </div>

                    </div>


                    <div class="search-bar">

                        ${ICONS.search}

                        <input
                            id="listingSearch"
                            type="search"
                            placeholder="Rechercher un canal..."
                            value="${escapeHTML(
                                state.searchQuery
                            )}"
                            autocomplete="off"
                        >

                    </div>

                </section>


                <section class="section">

                    <div class="filter-row">

                        ${filterChip(
                            "all",
                            "Tout",
                            state.selectedCategory === "all"
                        )}

                        ${filterChip(
                            "News",
                            "News",
                            state.selectedCategory === "News"
                        )}

                        ${filterChip(
                            "Sport",
                            "Sport",
                            state.selectedCategory === "Sport"
                        )}

                        ${filterChip(
                            "Entertainment",
                            "Entertainment",
                            state.selectedCategory === "Entertainment"
                        )}

                        ${filterChip(
                            "Games",
                            "Games",
                            state.selectedCategory === "Games"
                        )}

                        ${filterChip(
                            "Education",
                            "Education",
                            state.selectedCategory === "Education"
                        )}

                        ${filterChip(
                            "Business",
                            "Business",
                            state.selectedCategory === "Business"
                        )}

                        ${filterChip(
                            "Tech",
                            "Tech",
                            state.selectedCategory === "Tech"
                        )}

                    </div>

                </section>


                <section class="section">

                    <div class="section-header">

                        <h2 class="section-title">
                            Annonces
                        </h2>

                        <span
                            style="
                                color:var(--text-muted);
                                font-size:10px;
                            "
                        >
                            ${state.listings.length}
                        </span>

                    </div>

                    ${renderChannelList(
                        state.listings
                    )}

                </section>

            </div>
            `;

        bindDynamicEvents();

        const searchInput =
            document.getElementById(
                "listingSearch"
            );

        if (searchInput) {

            let timer;

            searchInput.addEventListener(
                "input",
                event => {

                    clearTimeout(timer);

                    state.searchQuery =
                        event.target.value;

                    timer =
                        setTimeout(
                            () => {
                                renderBuy();
                            },
                            450
                        );
                }
            );
        }
    }


    function filterChip(
        value,
        label,
        active
    ) {

        return `
            <button
                class="filter-chip ${
                    active ? "active" : ""
                }"
                data-category="${escapeHTML(value)}"
                type="button"
            >
                ${escapeHTML(label)}
            </button>
        `;
    }


    /* =====================================================
       CHANNEL LIST
    ===================================================== */

    function renderChannelList(
        listings
    ) {

        if (
            !listings ||
            listings.length === 0
        ) {

            return `
                <div class="empty-state">

                    <div class="empty-icon">
                        ${ICONS.channel}
                    </div>

                    <div class="empty-title">
                        Aucun canal disponible
                    </div>

                    <div class="empty-description">
                        Les nouvelles annonces validées
                        apparaîtront ici.
                    </div>

                </div>
            `;
        }

        return `
            <div class="channel-list">

                ${listings.map(
                    listing =>
                        renderChannelPost(
                            listing
                        )
                ).join("")}

            </div>
        `;
    }


    function renderChannelPost(
        listing
    ) {

        const id =
            listing.id ??
            listing.channel_id;

        const name =
            listing.name ||
            listing.title ||
            "Canal Telegram";

        const username =
            listing.username
                ? `@${String(
                    listing.username
                ).replace(/^@/, "")}`
                : "";

        const description =
            listing.description ||
            "Canal Telegram disponible.";

        const price =
            listing.price;

        const subscribers =
            listing.subscribers_count ??
            listing.subscribers ??
            null;

        const category =
            listing.category ||
            "Autre";

        const country =
            listing.country ||
            "";

        const image =
            listing.photo_url ||
            listing.image_url ||
            listing.thumbnail_url ||
            "";

        return `
            <article
                class="channel-post"
                data-listing-id="${escapeHTML(id)}"
                data-action="listing"
            >

                <div class="channel-poster">

                    ${
                        image
                            ? `
                                <img
                                    src="${escapeHTML(image)}"
                                    alt="${escapeHTML(name)}"
                                    loading="lazy"
                                >
                              `
                            : `
                                <div
                                    style="
                                        width:100%;
                                        height:100%;
                                        display:flex;
                                        align-items:center;
                                        justify-content:center;
                                        color:var(--purple-light);
                                    "
                                >
                                    ${ICONS.channel}
                                </div>
                              `
                    }

                </div>


                <div class="channel-post-body">

                    <div class="channel-post-top">

                        <div style="min-width:0">

                            <div class="channel-name">
                                ${escapeHTML(name)}
                            </div>

                            ${
                                username
                                    ? `
                                        <div class="channel-username">
                                            ${escapeHTML(username)}
                                        </div>
                                      `
                                    : ""
                            }

                        </div>


                        <div class="channel-price">
                            ${
                                price !== undefined &&
                                price !== null
                                    ? formatMoney(price)
                                    : "Prix à définir"
                            }
                        </div>

                    </div>


                    <div class="channel-description">
                        ${escapeHTML(description)}
                    </div>


                    <div class="channel-meta">

                        ${
                            subscribers !== null
                                ? `
                                    <span class="channel-meta-item">
                                        ${formatNumber(
                                            subscribers
                                        )} abonnés
                                    </span>
                                  `
                                : ""
                        }

                        <span class="channel-meta-item">
                            ${escapeHTML(category)}
                        </span>

                        ${
                            country
                                ? `
                                    <span class="channel-meta-item">
                                        ${escapeHTML(country)}
                                    </span>
                                  `
                                : ""
                        }

                    </div>

                </div>

            </article>
        `;
    }


    /* =====================================================
       LISTING DETAIL
    ===================================================== */

    async function openListing(
        listingId
    ) {

        const listing =
            state.listings.find(
                item =>
                    String(
                        item.id ??
                        item.channel_id
                    ) === String(listingId)
            );

        if (!listing) {
            showToast(
                "Annonce",
                "Cette annonce n'est plus disponible."
            );

            return;
        }

        const name =
            listing.name ||
            listing.title ||
            "Canal Telegram";

        const username =
            listing.username
                ? `@${String(
                    listing.username
                ).replace(/^@/, "")}`
                : "";

        const description =
            listing.description ||
            "Aucune description.";

        const price =
            listing.price;

        const subscribers =
            listing.subscribers_count ??
            listing.subscribers ??
            null;

        const category =
            listing.category ||
            "Autre";

        const country =
            listing.country ||
            "Non précisé";

        const language =
            listing.language ||
            "Non précisée";

        const image =
            listing.photo_url ||
            listing.image_url ||
            listing.thumbnail_url ||
            "";

        openModal(`
            <div style="padding-top:10px">

                ${
                    image
                        ? `
                            <img
                                src="${escapeHTML(image)}"
                                alt="${escapeHTML(name)}"
                                style="
                                    width:100%;
                                    max-height:230px;
                                    object-fit:cover;
                                    border-radius:22px;
                                    margin-bottom:16px;
                                "
                            >
                          `
                        : ""
                }

                <h2
                    style="
                        font-size:21px;
                        font-weight:750;
                    "
                >
                    ${escapeHTML(name)}
                </h2>

                ${
                    username
                        ? `
                            <div
                                style="
                                    margin-top:4px;
                                    color:var(--purple-light);
                                    font-size:11px;
                                "
                            >
                                ${escapeHTML(username)}
                            </div>
                          `
                        : ""
                }


                <p
                    style="
                        margin-top:13px;
                        color:var(--text-soft);
                        font-size:12px;
                        line-height:1.55;
                    "
                >
                    ${escapeHTML(description)}
                </p>


                <div
                    style="
                        display:grid;
                        grid-template-columns:repeat(2,1fr);
                        gap:8px;
                        margin-top:18px;
                    "
                >

                    ${detailStat(
                        "Prix",
                        price !== null &&
                        price !== undefined
                            ? formatMoney(price)
                            : "—"
                    )}

                    ${detailStat(
                        "Abonnés",
                        subscribers !== null
                            ? formatNumber(
                                subscribers
                              )
                            : "—"
                    )}

                    ${detailStat(
                        "Catégorie",
                        category
                    )}

                    ${detailStat(
                        "Pays",
                        country
                    )}

                    ${detailStat(
                        "Langue",
                        language
                    )}

                </div>


                <button
                    class="primary-button"
                    data-action="start-purchase"
                    data-listing-id="${escapeHTML(
                        listingId
                    )}"
                    type="button"
                    style="margin-top:18px"
                >
                    ${ICONS.cart}
                    Acheter ce canal
                </button>

            </div>
        `);

        bindDynamicEvents();
    }


    function detailStat(
        label,
        value
    ) {

        return `
            <div
                style="
                    padding:12px;
                    border-radius:15px;
                    background:rgba(255,255,255,.045);
                    border:1px solid var(--border);
                "
            >

                <div
                    style="
                        color:var(--text-muted);
                        font-size:9px;
                    "
                >
                    ${escapeHTML(label)}
                </div>

                <div
                    style="
                        margin-top:5px;
                        font-size:11px;
                        font-weight:700;
                    "
                >
                    ${escapeHTML(value)}
                </div>

            </div>
        `;
    }


    /* =====================================================
       PURCHASE
    ===================================================== */

    async function startPurchase(
        listingId
    ) {

        const listing =
            state.listings.find(
                item =>
                    String(
                        item.id ??
                        item.channel_id
                    ) === String(listingId)
            );

        if (!listing) {
            return;
        }

        const price =
            Number(listing.price);

        if (
            !Number.isFinite(price) ||
            price <= 0
        ) {

            showToast(
                "Achat impossible",
                "Le prix de cette annonce n'est pas valide."
            );

            return;
        }

        openModal(`
            <div style="padding-top:12px">

                <h2
                    style="
                        font-size:20px;
                        font-weight:750;
                    "
                >
                    Confirmer l'achat
                </h2>

                <p
                    style="
                        margin-top:8px;
                        color:var(--text-soft);
                        font-size:12px;
                        line-height:1.5;
                    "
                >
                    Les fonds seront réservés avant
                    le traitement de la transaction.
                </p>


                <div
                    style="
                        margin-top:18px;
                        padding:16px;
                        border-radius:19px;
                        background:rgba(255,255,255,.045);
                        border:1px solid var(--border);
                    "
                >

                    <div
                        style="
                            color:var(--text-muted);
                            font-size:10px;
                        "
                    >
                        Canal
                    </div>

                    <div
                        style="
                            margin-top:5px;
                            font-size:13px;
                            font-weight:700;
                        "
                    >
                        ${escapeHTML(
                            listing.name ||
                            listing.title ||
                            "Canal Telegram"
                        )}
                    </div>

                    <div
                        style="
                            margin-top:13px;
                            color:var(--text-muted);
                            font-size:10px;
                        "
                    >
                        Prix
                    </div>

                    <div
                        style="
                            margin-top:4px;
                            color:var(--purple-light);
                            font-size:20px;
                            font-weight:750;
                        "
                    >
                        ${formatMoney(price)}
                    </div>

                </div>


                <button
                    class="primary-button"
                    data-action="confirm-purchase"
                    data-listing-id="${escapeHTML(
                        listingId
                    )}"
                    type="button"
                    style="margin-top:18px"
                >
                    ${ICONS.lock}
                    Réserver les fonds
                </button>

            </div>
        `);

        bindDynamicEvents();
    }


    async function confirmPurchase(
        listingId
    ) {

        try {

            const data =
                await apiRequest(
                    "/transactions",
                    {
                        method: "POST",

                        body: JSON.stringify({
                            listing_id:
                                Number(listingId)
                        })
                    }
                );

            closeModal();

            showToast(
                "Transaction créée",
                data.message ||
                    "La transaction a été envoyée."
            );

            await loadWallet();
            await loadTransactions();

            await navigateTo(
                "messages"
            );

        } catch (error) {

            showToast(
                "Achat impossible",
                error.message
            );
        }
    }


    /* =====================================================
       SELL
    ===================================================== */

    async function renderSell() {

        DOM.pageContainer.innerHTML =
            `
            <div class="page-enter">

                <section class="section">

                    <div class="section-header">

                        <div>
                            <h2 class="section-title">
                                Vendre
                            </h2>

                            <p
                                style="
                                    margin-top:5px;
                                    color:var(--text-muted);
                                    font-size:10px;
                                "
                            >
                                Ajoute ton canal pour le soumettre
                                à la validation de NexMarket.
                            </p>
                        </div>

                    </div>

                </section>


                <section class="section">

                    <form
                        id="sellForm"
                        class="channel-form"
                    >

                        <div class="form-group">

                            <label class="form-label">
                                @Username du canal
                            </label>

                            <input
                                id="sellUsername"
                                class="form-input"
                                type="text"
                                placeholder="@moncanal"
                                required
                            >

                        </div>


                        <div class="form-group">

                            <label class="form-label">
                                Prix de vente
                            </label>

                            <input
                                id="sellPrice"
                                class="form-input"
                                type="number"
                                min="1"
                                step="1"
                                placeholder="Ex. 25000"
                                required
                            >

                        </div>


                        <div class="form-group">

                            <label class="form-label">
                                Catégorie
                            </label>

                            <select
                                id="sellCategory"
                                class="form-select"
                                required
                            >

                                <option value="">
                                    Choisir une catégorie
                                </option>

                                <option value="News">
                                    News
                                </option>

                                <option value="Sport">
                                    Sport
                                </option>

                                <option value="Entertainment">
                                    Entertainment
                                </option>

                                <option value="Games">
                                    Games
                                </option>

                                <option value="Education">
                                    Education
                                </option>

                                <option value="Business">
                                    Business
                                </option>

                                <option value="Tech">
                                    Tech
                                </option>

                                <option value="Commerce">
                                    Commerce
                                </option>

                                <option value="Music">
                                    Music
                                </option>

                                <option value="Creation">
                                    Création
                                </option>

                                <option value="Community">
                                    Communauté
                                </option>

                                <option value="Other">
                                    Autre
                                </option>

                            </select>

                        </div>


                        <div class="form-group">

                            <label class="form-label">
                                Pays
                            </label>

                            <input
                                id="sellCountry"
                                class="form-input"
                                type="text"
                                placeholder="Pays du canal"
                                required
                            >

                        </div>


                        <div class="form-group">

                            <label class="form-label">
                                Langue
                            </label>

                            <input
                                id="sellLanguage"
                                class="form-input"
                                type="text"
                                placeholder="Ex. Français"
                                required
                            >

                        </div>


                        <div class="form-group">

                            <label class="form-label">
                                Description
                            </label>

                            <textarea
                                id="sellDescription"
                                class="form-textarea"
                                placeholder="Présente ton canal..."
                            ></textarea>

                        </div>


                        <button
                            class="primary-button"
                            type="submit"
                            style="margin-top:18px"
                        >
                            ${ICONS.sell}
                            Soumettre l'annonce
                        </button>

                    </form>

                </section>


                <section class="section">

                    <div class="empty-state">

                        <div class="empty-icon">
                            ${ICONS.channel}
                        </div>

                        <div class="empty-title">
                            Vérification obligatoire
                        </div>

                        <div class="empty-description">
                            Le canal devra être vérifié par
                            NexMarket avant sa publication.
                        </div>

                    </div>

                </section>

            </div>
            `;

        bindDynamicEvents();

        const form =
            document.getElementById(
                "sellForm"
            );

        if (form) {

            form.addEventListener(
                "submit",
                handleSellSubmit
            );
        }
    }


    async function handleSellSubmit(
        event
    ) {

        event.preventDefault();

        const username =
            document
                .getElementById(
                    "sellUsername"
                )
                .value
                .trim();

        const price =
            Number(
                document
                    .getElementById(
                        "sellPrice"
                    )
                    .value
            );

        const category =
            document
                .getElementById(
                    "sellCategory"
                )
                .value;

        const country =
            document
                .getElementById(
                    "sellCountry"
                )
                .value
                .trim();

        const language =
            document
                .getElementById(
                    "sellLanguage"
                )
                .value
                .trim();

        const description =
            document
                .getElementById(
                    "sellDescription"
                )
                .value
                .trim();

        if (!username) {
            showToast(
                "Canal requis",
                "Entre le username du canal."
            );
            return;
        }

        if (
            !Number.isFinite(price) ||
            price <= 0
        ) {

            showToast(
                "Prix invalide",
                "Entre un prix valide."
            );

            return;
        }

        try {

            const data =
                await apiRequest(
                    "/channels",
                    {
                        method: "POST",

                        body: JSON.stringify({
                            username,
                            price,
                            category,
                            country,
                            language,
                            description
                        })
                    }
                );

            showToast(
                "Annonce envoyée",
                data.message ||
                    "Ton annonce attend la validation."
            );

            event.target.reset();

        } catch (error) {

            showToast(
                "Envoi impossible",
                error.message
            );
        }
    }


    /* =====================================================
       MESSAGES
    ===================================================== */

    async function renderMessages() {

        await loadTransactions();

        DOM.pageContainer.innerHTML =
            `
            <div class="page-enter">

                <section class="section">

                    <div class="section-header">

                        <div>
                            <h2 class="section-title">
                                Messages
                            </h2>

                            <p
                                style="
                                    margin-top:5px;
                                    color:var(--text-muted);
                                    font-size:10px;
                                "
                            >
                                Tes conversations liées aux transactions.
                            </p>
                        </div>

                    </div>

                </section>


                <section class="section">

                    ${
                        state.transactions.length
                            ? renderTransactionList()
                            : `
                                <div class="empty-state">

                                    <div class="empty-icon">
                                        ${ICONS.message}
                                    </div>

                                    <div class="empty-title">
                                        Aucune conversation
                                    </div>

                                    <div class="empty-description">
                                        Les discussions apparaîtront
                                        lorsqu'une transaction sera créée.
                                    </div>

                                </div>
                              `
                    }

                </section>

            </div>
            `;

        bindDynamicEvents();
    }


    function renderTransactionList() {

        return `
            <div class="transaction-list">

                ${state.transactions.map(
                    transaction => {

                        const status =
                            transaction.status ||
                            "pending";

                        const listingName =
                            transaction.listing_name ||
                            transaction.channel_name ||
                            "Transaction NexMarket";

                        return `
                            <button
                                class="transaction-item"
                                data-action="transaction"
                                data-transaction-id="${escapeHTML(
                                    transaction.id
                                )}"
                                type="button"
                                style="width:100%;text-align:left"
                            >

                                <div class="transaction-icon">
                                    ${ICONS.message}
                                </div>

                                <div class="transaction-main">

                                    <div class="transaction-title">
                                        ${escapeHTML(
                                            listingName
                                        )}
                                    </div>

                                    <div class="transaction-date">
                                        ${formatDate(
                                            transaction.created_at
                                        )}
                                    </div>

                                </div>

                                <span
                                    class="status-badge ${
                                        status === "completed"
                                            ? "success"
                                            : status === "cancelled"
                                                ? "danger"
                                                : "warning"
                                    }"
                                >
                                    ${escapeHTML(
                                        status
                                    )}
                                </span>

                            </button>
                        `;
                    }
                ).join("")}

            </div>
        `;
    }


    /* =====================================================
       PROFILE
    ===================================================== */

    async function renderProfile() {

        const user =
            state.user ||
            getTelegramUser();

        const name =
            escapeHTML(
                getDisplayName(user)
            );

        const username =
            user?.username
                ? `@${escapeHTML(
                    user.username
                  )}`
                : "Compte Telegram";

        const photo =
            user?.photo_url || "";

        DOM.pageContainer.innerHTML =
            `
            <div class="page-enter">

                <section class="profile-header">

                    <div class="profile-large-avatar">

                        ${
                            photo
                                ? `
                                    <img
                                        src="${escapeHTML(photo)}"
                                        alt="Profil"
                                    >
                                  `
                                : `
                                    <span>
                                        ${escapeHTML(
                                            getInitials(
                                                user
                                            )
                                        )}
                                    </span>
                                  `
                        }

                    </div>


                    <div class="profile-name">
                        ${name}
                    </div>

                    <div class="profile-username">
                        ${username}
                    </div>

                    ${
                        state.user?.nexa_id
                            ? `
                                <div class="profile-id">
                                    ${escapeHTML(
                                        state.user.nexa_id
                                    )}
                                </div>
                              `
                            : ""
                    }

                </section>


                <section class="section">

                    <div class="profile-menu">

                        <button
                            class="profile-menu-item"
                            data-action="wallet"
                            type="button"
                        >

                            <span class="profile-menu-icon">
                                ${ICONS.wallet}
                            </span>

                            <span class="profile-menu-text">

                                <span class="profile-menu-title">
                                    Portefeuille
                                </span>

                                <span class="profile-menu-description">
                                    Déposer, retirer et consulter ton solde
                                </span>

                            </span>

                            <span class="profile-menu-arrow">
                                ${ICONS.arrow}
                            </span>

                        </button>


                        <button
                            class="profile-menu-item"
                            data-action="favorites"
                            type="button"
                        >

                            <span class="profile-menu-icon">
                                ${ICONS.heart}
                            </span>

                            <span class="profile-menu-text">

                                <span class="profile-menu-title">
                                    Favoris
                                </span>

                                <span class="profile-menu-description">
                                    Tes canaux enregistrés
                                </span>

                            </span>

                            <span class="profile-menu-arrow">
                                ${ICONS.arrow}
                            </span>

                        </button>


                        <button
                            class="profile-menu-item"
                            data-action="faq"
                            type="button"
                        >

                            <span class="profile-menu-icon">
                                ${ICONS.help}
                            </span>

                            <span class="profile-menu-text">

                                <span class="profile-menu-title">
                                    Aide & FAQ
                                </span>

                                <span class="profile-menu-description">
                                    Questions fréquentes
                                </span>

                            </span>

                            <span class="profile-menu-arrow">
                                ${ICONS.arrow}
                            </span>

                        </button>


                        <!--
                            IMPORTANT :
                            Le clic 5 fois est géré par JS.
                            Aucun code admin n'est exposé ici.
                        -->

                        <button
                            id="versionItem"
                            class="profile-menu-item version-item"
                            type="button"
                        >

                            <span class="profile-menu-icon">
                                <span
                                    style="
                                        font-size:10px;
                                        font-weight:750;
                                    "
                                >
                                    N
                                </span>
                            </span>

                            <span class="profile-menu-text">

                                <span class="profile-menu-title">
                                    Version
                                </span>

                                <span class="profile-menu-description">
                                    NexMarket ${CONFIG.APP_VERSION}
                                </span>

                            </span>

                            <span class="version-value">
                                ${CONFIG.APP_VERSION}
                            </span>

                        </button>

                    </div>

                </section>


                <section class="section">

                    <div
                        style="
                            text-align:center;
                            color:var(--text-muted);
                            font-size:9px;
                            line-height:1.5;
                            padding:15px;
                        "
                    >
                        NexMarket<br>
                        Propulsé par NEXA
                    </div>

                </section>

            </div>
            `;

        bindDynamicEvents();

        setupAdminFiveTap();
    }


    /* =====================================================
       WALLET PAGE
    ===================================================== */

    async function renderWallet() {

        await loadWallet();
        await loadTransactions();

        const wallet =
            state.wallet || {};

        const available =
            wallet.available_balance ??
            wallet.balance ??
            null;

        const blocked =
            wallet.blocked_balance ??
            null;

        const revenue =
            wallet.revenue ??
            wallet.total_revenue ??
            null;

        DOM.pageContainer.innerHTML =
            `
            <div class="page-enter">

                <section class="section">

                    <div class="section-header">

                        <h2 class="section-title">
                            Portefeuille
                        </h2>

                    </div>


                    <div class="wallet-overview">

                        <div class="wallet-label">
                            Solde disponible
                        </div>

                        <div class="wallet-balance">

                            ${
                                available !== null
                                    ? formatMoney(
                                        available
                                      )
                                    : "—"
                            }

                        </div>


                        <div class="wallet-sub-balances">

                            <div class="wallet-sub-balance">

                                <div class="wallet-sub-label">
                                    Bloqué
                                </div>

                                <div class="wallet-sub-value">
                                    ${
                                        blocked !== null
                                            ? formatMoney(
                                                blocked
                                              )
                                            : "—"
                                    }
                                </div>

                            </div>


                            <div class="wallet-sub-balance">

                                <div class="wallet-sub-label">
                                    Revenus
                                </div>

                                <div class="wallet-sub-value">
                                    ${
                                        revenue !== null
                                            ? formatMoney(
                                                revenue
                                              )
                                            : "—"
                                    }
                                </div>

                            </div>

                        </div>

                    </div>


                    <div class="wallet-actions">

                        <button
                            class="wallet-action"
                            data-action="deposit"
                            type="button"
                        >

                            <span class="wallet-action-icon">
                                ${ICONS.deposit}
                            </span>

                            <span class="wallet-action-text">

                                <span class="wallet-action-title">
                                    Déposer
                                </span>

                                <span class="wallet-action-description">
                                    Ajouter de l'argent
                                </span>

                            </span>

                        </button>


                        <button
                            class="wallet-action"
                            data-action="withdraw"
                            type="button"
                        >

                            <span class="wallet-action-icon">
                                ${ICONS.withdraw}
                            </span>

                            <span class="wallet-action-text">

                                <span class="wallet-action-title">
                                    Retirer
                                </span>

                                <span class="wallet-action-description">
                                    Retirer de l'argent
                                </span>

                            </span>

                        </button>

                    </div>

                </section>


                <section class="section">

                    <div class="section-header">

                        <h2 class="section-title">
                            Transactions
                        </h2>

                    </div>

                    ${
                        state.transactions.length
                            ? renderTransactionList()
                            : `
                                <div class="empty-state">

                                    <div class="empty-icon">
                                        ${ICONS.wallet}
                                    </div>

                                    <div class="empty-title">
                                        Aucun mouvement
                                    </div>

                                    <div class="empty-description">
                                        Ton historique apparaîtra ici
                                        après tes premières opérations.
                                    </div>

                                </div>
                              `
                    }

                </section>

            </div>
            `;

        bindDynamicEvents();
    }


    /* =====================================================
       DEPOSIT
    ===================================================== */

    function openDeposit() {

        openModal(`
            <div style="padding-top:12px">

                <h2
                    style="
                        font-size:20px;
                        font-weight:750;
                    "
                >
                    Déposer
                </h2>

                <p
                    style="
                        margin-top:7px;
                        color:var(--text-soft);
                        font-size:11px;
                        line-height:1.5;
                    "
                >
                    Le paiement sera traité par
                    le prestataire configuré par NexMarket.
                </p>


                <div class="form-group">

                    <label class="form-label">
                        Montant
                    </label>

                    <input
                        id="depositAmount"
                        class="form-input"
                        type="number"
                        min="1"
                        step="1"
                        placeholder="Ex. 10000"
                    >

                </div>


                <button
                    class="primary-button"
                    data-action="confirm-deposit"
                    type="button"
                    style="margin-top:18px"
                >
                    ${ICONS.deposit}
                    Continuer
                </button>

            </div>
        `);

        bindDynamicEvents();
    }


    async function confirmDeposit() {

        const input =
            document.getElementById(
                "depositAmount"
            );

        const amount =
            Number(input?.value);

        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            showToast(
                "Montant invalide",
                "Entre un montant valide."
            );

            return;
        }

        try {

            /*
             * Le backend décide du fournisseur
             * et crée la vraie session de paiement.
             */

            const data =
                await apiRequest(
                    "/wallet/deposit",
                    {
                        method: "POST",

                        body: JSON.stringify({
                            amount
                        })
                    }
                );

            if (
                data.checkout_url
            ) {

                if (tg) {
                    tg.openLink(
                        data.checkout_url
                    );
                } else {
                    window.location.href =
                        data.checkout_url;
                }

                closeModal();

                return;
            }

            closeModal();

            showToast(
                "Dépôt",
                data.message ||
                    "La demande a été enregistrée."
            );

        } catch (error) {

            showToast(
                "Dépôt impossible",
                error.message
            );
        }
    }


    /* =====================================================
       WITHDRAW
    ===================================================== */

    function openWithdraw() {

        openModal(`
            <div style="padding-top:12px">

                <h2
                    style="
                        font-size:20px;
                        font-weight:750;
                    "
                >
                    Retirer
                </h2>

                <p
                    style="
                        margin-top:7px;
                        color:var(--text-soft);
                        font-size:11px;
                        line-height:1.5;
                    "
                >
                    Choisis ton pays et ton moyen
                    de paiement.
                </p>


                <div class="form-group">

                    <label class="form-label">
                        Montant
                    </label>

                    <input
                        id="withdrawAmount"
                        class="form-input"
                        type="number"
                        min="1"
                        step="1"
                        placeholder="Ex. 10000"
                    >

                </div>


                <div class="form-group">

                    <label class="form-label">
                        Pays
                    </label>

                    <select
                        id="withdrawCountry"
                        class="form-select"
                    >

                        <option value="">
                            Sélectionner
                        </option>

                        <option value="CG">
                            Congo-Brazzaville
                        </option>

                        <option value="CD">
                            RDC
                        </option>

                        <option value="CM">
                            Cameroun
                        </option>

                        <option value="CI">
                            Côte d'Ivoire
                        </option>

                        <option value="SN">
                            Sénégal
                        </option>

                        <option value="BJ">
                            Bénin
                        </option>

                        <option value="TG">
                            Togo
                        </option>

                        <option value="BF">
                            Burkina Faso
                        </option>

                        <option value="GH">
                            Ghana
                        </option>

                        <option value="NG">
                            Nigeria
                        </option>

                        <option value="ZA">
                            Afrique du Sud
                        </option>

                    </select>

                </div>


                <div class="form-group">

                    <label class="form-label">
                        Numéro du bénéficiaire
                    </label>

                    <input
                        id="withdrawPhone"
                        class="form-input"
                        type="tel"
                        placeholder="Numéro de paiement"
                    >

                </div>


                <button
                    class="primary-button"
                    data-action="confirm-withdraw"
                    type="button"
                    style="margin-top:18px"
                >
                    ${ICONS.withdraw}
                    Demander le retrait
                </button>

            </div>
        `);

        bindDynamicEvents();
    }


    async function confirmWithdraw() {

        const amount =
            Number(
                document.getElementById(
                    "withdrawAmount"
                )?.value
            );

        const country =
            document.getElementById(
                "withdrawCountry"
            )?.value;

        const phone =
            document.getElementById(
                "withdrawPhone"
            )?.value
                .trim();

        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            showToast(
                "Montant invalide",
                "Entre un montant valide."
            );

            return;
        }

        if (!country) {

            showToast(
                "Pays requis",
                "Sélectionne ton pays."
            );

            return;
        }

        if (!phone) {

            showToast(
                "Numéro requis",
                "Entre le numéro du bénéficiaire."
            );

            return;
        }

        try {

            const data =
                await apiRequest(
                    "/wallet/withdraw",
                    {
                        method: "POST",

                        body: JSON.stringify({
                            amount,
                            country,
                            phone
                        })
                    }
                );

            closeModal();

            showToast(
                "Retrait",
                data.message ||
                    "La demande de retrait a été enregistrée."
            );

            await loadWallet();

        } catch (error) {

            showToast(
                "Retrait impossible",
                error.message
            );
        }
    }


    /* =====================================================
       FAQ
    ===================================================== */

    function openFAQ() {

        openModal(`
            <div style="padding-top:12px">

                <h2
                    style="
                        font-size:20px;
                        font-weight:750;
                    "
                >
                    Questions fréquentes
                </h2>


                ${faqItem(
                    "Comment acheter un canal ?",
                    "Choisis un canal, vérifie ses informations puis lance l'achat. Les fonds sont réservés avant le traitement de la transaction."
                )}

                ${faqItem(
                    "Comment vendre mon canal ?",
                    "Ajoute ton canal, fixe ton prix et soumets l'annonce. Elle doit être vérifiée avant sa publication."
                )}

                ${faqItem(
                    "Pourquoi mes fonds sont-ils bloqués ?",
                    "Pendant une transaction active, les fonds peuvent être réservés jusqu'à la fin ou l'annulation de la transaction."
                )}

                ${faqItem(
                    "Comment fonctionne le transfert du canal ?",
                    "Le transfert est effectué via les mécanismes officiels de Telegram avec l'assistance de NexMarket lorsque cela est nécessaire."
                )}

                ${faqItem(
                    "Comment contacter l'administration ?",
                    "Les discussions liées aux transactions sont accessibles depuis Messages."
                )}

            </div>
        `);
    }


    function faqItem(
        question,
        answer
    ) {

        return `
            <div
                style="
                    margin-top:13px;
                    padding:14px;
                    border-radius:17px;
                    background:rgba(255,255,255,.045);
                    border:1px solid var(--border);
                "
            >

                <div
                    style="
                        font-size:12px;
                        font-weight:700;
                    "
                >
                    ${escapeHTML(question)}
                </div>

                <div
                    style="
                        margin-top:7px;
                        color:var(--text-soft);
                        font-size:10px;
                        line-height:1.5;
                    "
                >
                    ${escapeHTML(answer)}
                </div>

            </div>
        `;
    }


    /* =====================================================
       FAVORITES
    ===================================================== */

    async function renderFavorites() {

        try {

            const data =
                await apiRequest(
                    "/favorites"
                );

            state.favorites =
                Array.isArray(data)
                    ? data
                    : (
                        data.items ||
                        data.favorites ||
                        []
                    );

        } catch (error) {

            state.favorites = [];

            showToast(
                "Favoris",
                error.message
            );
        }

        openModal(`
            <div style="padding-top:12px">

                <h2
                    style="
                        font-size:20px;
                        font-weight:750;
                    "
                >
                    Mes favoris
                </h2>

                <div
                    style="margin-top:15px"
                >

                    ${
                        state.favorites.length
                            ? renderChannelList(
                                state.favorites
                              )
                            : `
                                <div class="empty-state">
                                    <div class="empty-icon">
                                        ${ICONS.heart}
                                    </div>

                                    <div class="empty-title">
                                        Aucun favori
                                    </div>

                                    <div class="empty-description">
                                        Tes canaux favoris apparaîtront ici.
                                    </div>
                                </div>
                              `
                    }

                </div>

            </div>
        `);
    }


    /* =====================================================
       5 CLICS ADMIN
    ===================================================== */

    function setupAdminFiveTap() {

        const versionItem =
            document.getElementById(
                "versionItem"
            );

        if (!versionItem) {
            return;
        }

        state.adminTapCount = 0;

        clearTimeout(
            state.adminTapTimer
        );

        versionItem.addEventListener(
            "click",
            handleVersionTap
        );
    }


    function handleVersionTap() {

        state.adminTapCount += 1;

        clearTimeout(
            state.adminTapTimer
        );

        if (
            state.adminTapCount >=
            CONFIG.ADMIN_TAP_COUNT
        ) {

            state.adminTapCount = 0;

            openAdminLogin();

            return;
        }

        state.adminTapTimer =
            setTimeout(() => {

                state.adminTapCount = 0;

            }, CONFIG.ADMIN_TAP_WINDOW);
    }


    function openAdminLogin() {

        openModal(`
            <div style="padding-top:12px">

                <h2
                    style="
                        font-size:20px;
                        font-weight:750;
                    "
                >
                    Espace administration
                </h2>

                <p
                    style="
                        margin-top:7px;
                        color:var(--text-soft);
                        font-size:11px;
                        line-height:1.5;
                    "
                >
                    Connexion réservée aux administrateurs
                    NexMarket.
                </p>


                <div class="form-group">

                    <label class="form-label">
                        Code administrateur
                    </label>

                    <input
                        id="adminCode"
                        class="form-input"
                        type="password"
                        autocomplete="off"
                        placeholder="Code administrateur"
                    >

                </div>


                <button
                    class="primary-button"
                    data-action="admin-login"
                    type="button"
                    style="margin-top:18px"
                >
                    ${ICONS.lock}
                    Accéder à l'administration
                </button>

            </div>
        `);

        bindDynamicEvents();
    }


    async function adminLogin() {

        const code =
            document.getElementById(
                "adminCode"
            )?.value || "";

        if (!code) {

            showToast(
                "Code requis",
                "Entre le code administrateur."
            );

            return;
        }

        try {

            const response =
                await apiRequest(
                    "/admin/login",
                    {
                        method: "POST",

                        body: JSON.stringify({
                            code
                        })
                    }
                );

            if (
                response.token
            ) {

                sessionStorage.setItem(
                    "nexmarket_admin_token",
                    response.token
                );

                /*
                 * Le secret n'est jamais stocké
                 * dans le frontend.
                 */

                window.location.href =
                    CONFIG.ADMIN_PATH;

            } else {

                throw new Error(
                    "Authentification administrateur invalide."
                );
            }

        } catch (error) {

            showToast(
                "Accès refusé",
                error.message
            );
        }
    }


    /* =====================================================
       DYNAMIC EVENTS
    ===================================================== */

    function bindDynamicEvents() {

        document
            .querySelectorAll(
                "[data-action]"
            )
            .forEach(element => {

                if (
                    element.dataset.bound ===
                    "true"
                ) {
                    return;
                }

                element.dataset.bound =
                    "true";

                element.addEventListener(
                    "click",
                    handleAction
                );
            });


        document
            .querySelectorAll(
                "[data-category]"
            )
            .forEach(element => {

                if (
                    element.dataset.categoryBound ===
                    "true"
                ) {
                    return;
                }

                element.dataset.categoryBound =
                    "true";

                element.addEventListener(
                    "click",
                    () => {

                        state.selectedCategory =
                            element.dataset.category;

                        renderBuy();
                    }
                );
            });
    }


    async function handleAction(
        event
    ) {

        const element =
            event.currentTarget;

        const action =
            element.dataset.action;

        switch (action) {

            case "wallet":
                await renderWallet();
                break;

            case "buy":
            case "open-buy":
                await navigateTo("buy");
                break;

            case "sell":
                await navigateTo("sell");
                break;

            case "messages":
                await navigateTo("messages");
                break;

            case "profile":
                await navigateTo("profile");
                break;

            case "listing":
                await openListing(
                    element.dataset.listingId
                );
                break;

            case "start-purchase":
                await startPurchase(
                    element.dataset.listingId
                );
                break;

            case "confirm-purchase":
                await confirmPurchase(
                    element.dataset.listingId
                );
                break;

            case "deposit":
                openDeposit();
                break;

            case "confirm-deposit":
                await confirmDeposit();
                break;

            case "withdraw":
                openWithdraw();
                break;

            case "confirm-withdraw":
                await confirmWithdraw();
                break;

            case "faq":
                openFAQ();
                break;

            case "favorites":
                await renderFavorites();
                break;

            case "admin-login":
                await adminLogin();
                break;

            case "transaction":
                await openTransaction(
                    element.dataset.transactionId
                );
                break;
        }
    }


    /* =====================================================
       TRANSACTION DETAIL
    ===================================================== */

    async function openTransaction(
        transactionId
    ) {

        try {

            const data =
                await apiRequest(
                    `/transactions/${encodeURIComponent(
                        transactionId
                    )}`
                );

            const transaction =
                data.transaction ||
                data;

            openModal(`
                <div style="padding-top:12px">

                    <h2
                        style="
                            font-size:20px;
                            font-weight:750;
                        "
                    >
                        Transaction
                    </h2>


                    <div
                        style="
                            margin-top:16px;
                            padding:15px;
                            border-radius:18px;
                            background:rgba(255,255,255,.045);
                            border:1px solid var(--border);
                        "
                    >

                        <div
                            style="
                                color:var(--text-muted);
                                font-size:9px;
                            "
                        >
                            Statut
                        </div>

                        <div
                            style="
                                margin-top:5px;
                                font-size:13px;
                                font-weight:700;
                            "
                        >
                            ${escapeHTML(
                                transaction.status ||
                                "pending"
                            )}
                        </div>


                        <div
                            style="
                                margin-top:15px;
                                color:var(--text-muted);
                                font-size:9px;
                            "
                        >
                            Montant
                        </div>

                        <div
                            style="
                                margin-top:5px;
                                color:var(--purple-light);
                                font-size:18px;
                                font-weight:750;
                            "
                        >
                            ${
                                transaction.amount !==
                                undefined
                                    ? formatMoney(
                                        transaction.amount
                                      )
                                    : "—"
                            }
                        </div>

                    </div>


                    <button
                        class="primary-button"
                        data-action="messages"
                        type="button"
                        style="margin-top:16px"
                    >
                        ${ICONS.message}
                        Ouvrir Messages
                    </button>

                </div>
            `);

            bindDynamicEvents();

        } catch (error) {

            showToast(
                "Transaction",
                error.message
            );
        }
    }


    /* =====================================================
       HEADER SEARCH
    ===================================================== */

    function openSearch() {

        navigateTo("buy");

        setTimeout(() => {

            const input =
                document.getElementById(
                    "listingSearch"
                );

            if (input) {
                input.focus();
            }

        }, 350);
    }


    /* =====================================================
       EVENTS PRINCIPAUX
    ===================================================== */

    function bindMainEvents() {

        if (
            DOM.profileAvatarButton
        ) {

            DOM.profileAvatarButton.addEventListener(
                "click",
                () => {

                    /*
                     * Décision produit :
                     * la photo Telegram sur l'accueil
                     * ouvre directement le portefeuille.
                     */

                    renderWallet();
                }
            );
        }


        if (
            DOM.headerSearchButton
        ) {

            DOM.headerSearchButton.addEventListener(
                "click",
                openSearch
            );
        }


        if (
            DOM.faqButton
        ) {

            DOM.faqButton.addEventListener(
                "click",
                openFAQ
            );
        }


        if (
            DOM.modalOverlay
        ) {

            DOM.modalOverlay.addEventListener(
                "click",
                closeModal
            );
        }


        if (
            DOM.modalClose
        ) {

            DOM.modalClose.addEventListener(
                "click",
                closeModal
            );
        }


        if (
            DOM.bottomNavigation
        ) {

            DOM.bottomNavigation
                .querySelectorAll(
                    ".nav-item"
                )
                .forEach(item => {

                    item.addEventListener(
                        "click",
                        () => {

                            navigateTo(
                                item.dataset.page
                            );
                        }
                    );

                });
        }


        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Escape"
                ) {
                    closeModal();
                }

            }
        );
    }


    /* =====================================================
       SPLASH
    ===================================================== */

    function hideSplash() {

        if (!DOM.splash) {
            return;
        }

        setTimeout(() => {

            DOM.splash.classList.add(
                "hide"
            );

            setTimeout(() => {

                DOM.splash.style.display =
                    "none";

                if (DOM.app) {
                    DOM.app.classList.remove(
                        "hidden"
                    );
                }

            }, 550);

        }, 850);
    }


    /* =====================================================
       INITIAL LOAD
    ===================================================== */

    async function init() {

        initTelegram();

        bindMainEvents();

        state.user =
            getTelegramUser();

        updateTelegramProfile();

        /*
         * L'authentification réelle passe
         * par initData Telegram + backend.
         */

        await authenticate();

        updateTelegramProfile();

        await navigateTo(
            "home"
        );

        hideSplash();
    }


    /* =====================================================
       START
    ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            init
        );

    } else {

        init();
    }


    /* =====================================================
       DEBUG / GLOBAL
       ===================================================== */

    window.NexMarket = {
        state,
        navigateTo,
        showToast,
        openModal,
        closeModal,
        loadWallet,
        loadListings
    };

})();