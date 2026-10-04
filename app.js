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
        // Backend Render NexMarket
        API_BASE_URL:
            window.NEXMARKET_API_URL ||
            "https://nexamarket-backend.onrender.com/api",

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

            if (
                error instanceof TypeError &&
                error.message === "Failed to fetch"
            ) {
                throw new Error(
                    "Impossible de contacter le serveur NexMarket. Vérifie que le backend Render est en ligne et que le domaine Netlify est autorisé par le CORS."
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

        if (DOM.headerGreeting) {

            DOM.headerGreeting.textContent =
                `Bonjour ${user.first_name || "à vous"}`;
        }

        if (DOM.telegramAvatar) {

            if (user.photo_url) {

                DOM.telegramAvatar.src = user.photo_url;
                DOM.telegramAvatar.classList.remove("hidden");
                DOM.telegramAvatar.classList.add("visible");

                DOM.telegramAvatar.onerror = () => {
                    DOM.telegramAvatar.classList.add("hidden");
                    DOM.telegramAvatar.classList.remove("visible");

                    if (DOM.avatarLetter) {
                        DOM.avatarLetter.classList.remove("hidden");
                    }
                };

            } else {

                DOM.telegramAvatar.classList.add("hidden");
                DOM.telegramAvatar.classList.remove("visible");
            }
        }

        if (DOM.avatarLetter) {

            DOM.avatarLetter.textContent =
                getInitials(user);

            if (!user.photo_url) {
                DOM.avatarLetter.classList.remove("hidden");
            } else {
                DOM.avatarLetter.classList.add("hidden");
            }
        }
    }


    /* =====================================================
       LOAD FAVORITES
    ===================================================== */

    async function loadFavorites() {

        if (!state.user) {
            state.favorites = [];
            return [];
        }

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

            return state.favorites;

        } catch (error) {

            console.warn(
                "Favorites:",
                error.message
            );

            state.favorites = [];

            return [];
        }
    }


    /* =====================================================
       LOAD MY LISTINGS
    ===================================================== */

    async function loadMyListings() {

        if (!state.user) {
            state.myListings = [];
            return [];
        }

        try {

            const data =
                await apiRequest(
                    "/listings/mine/all"
                );

            const raw =
                Array.isArray(data)
                    ? data
                    : (
                        data.items ||
                        data.listings ||
                        []
                    );

            state.myListings =
                raw.map(normalizeListing);

            return state.myListings;

        } catch (error) {

            console.warn(
                "Mes annonces:",
                error.message
            );

            state.myListings = [];

            return [];
        }
    }


    /* =====================================================
       PAGE LOADING
    ===================================================== */

    function showLoading(
        message = "Chargement..."
    ) {

        if (!DOM.pageContainer) {
            return;
        }

        DOM.pageContainer.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>${escapeHTML(message)}</p>
            </div>
        `;
    }


    function showEmpty(
        title,
        message,
        icon = ICONS.channel
    ) {

        return `
            <div class="empty-state">
                <div class="empty-state-icon">
                    ${icon}
                </div>

                <h3>
                    ${escapeHTML(title)}
                </h3>

                <p>
                    ${escapeHTML(message)}
                </p>
            </div>
        `;
    }


    /* =====================================================
       PAGE HOME
    ===================================================== */

    async function renderHome() {

        state.currentPage = "home";

        showLoading(
            "Chargement des annonces..."
        );

        await Promise.all([
            loadListings(),
            loadWallet()
        ]);

        if (!DOM.pageContainer) {
            return;
        }

        DOM.pageContainer.innerHTML = `
            <section class="home-page">

                <div class="home-hero">

                    <div class="hero-copy">

                        <span class="hero-eyebrow">
                            NEXMARKET
                        </span>

                        <h1>
                            Trouve ton prochain
                            <span>canal Telegram.</span>
                        </h1>

                        <p>
                            Achète et vends des canaux
                            Telegram dans un espace pensé
                            pour des transactions sécurisées.
                        </p>

                    </div>

                    <div class="hero-actions">

                        <button
                            class="primary-action"
                            type="button"
                            data-action="buy"
                        >
                            ${ICONS.cart}
                            <span>
                                Acheter un canal
                            </span>
                        </button>

                        <button
                            class="secondary-action"
                            type="button"
                            data-action="sell"
                        >


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

        if (DOM.headerGreeting) {

            DOM.headerGreeting.textContent =
                `Bonjour ${user.first_name || "à vous"}`;
        }

        if (DOM.telegramAvatar) {

            if (user.photo_url) {

                DOM.telegramAvatar.src = user.photo_url;
                DOM.telegramAvatar.classList.remove("hidden");
                DOM.telegramAvatar.classList.add("visible");

                DOM.telegramAvatar.onerror = () => {
                    DOM.telegramAvatar.classList.add("hidden");
                    DOM.telegramAvatar.classList.remove("visible");

                    if (DOM.avatarLetter) {
                        DOM.avatarLetter.classList.remove("hidden");
                    }
                };

            } else {

                DOM.telegramAvatar.classList.add("hidden");
                DOM.telegramAvatar.classList.remove("visible");
            }
        }

        if (DOM.avatarLetter) {

            DOM.avatarLetter.textContent =
                getInitials(user);

            if (!user.photo_url) {
                DOM.avatarLetter.classList.remove("hidden");
            } else {
                DOM.avatarLetter.classList.add("hidden");
            }
        }
    }


    /* =====================================================
       LOAD FAVORITES
    ===================================================== */

    async function loadFavorites() {

        if (!state.user) {
            state.favorites = [];
            return [];
        }

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

            return state.favorites;

        } catch (error) {

            console.warn(
                "Favorites:",
                error.message
            );

            state.favorites = [];

            return [];
        }
    }


    /* =====================================================
       LOAD MY LISTINGS
    ===================================================== */

    async function loadMyListings() {

        if (!state.user) {
            state.myListings = [];
            return [];
        }

        try {

            const data =
                await apiRequest(
                    "/listings/mine/all"
                );

            const raw =
                Array.isArray(data)
                    ? data
                    : (
                        data.items ||
                        data.listings ||
                        []
                    );

            state.myListings =
                raw.map(normalizeListing);

            return state.myListings;

        } catch (error) {

            console.warn(
                "Mes annonces:",
                error.message
            );

            state.myListings = [];

            return [];
        }
    }


    /* =====================================================
       PAGE LOADING
    ===================================================== */

    function showLoading(
        message = "Chargement..."
    ) {

        if (!DOM.pageContainer) {
            return;
        }

        DOM.pageContainer.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>${escapeHTML(message)}</p>
            </div>
        `;
    }


    function showEmpty(
        title,
        message,
        icon = ICONS.channel
    ) {

        return `
            <div class="empty-state">
                <div class="empty-state-icon">
                    ${icon}
                </div>

                <h3>
                    ${escapeHTML(title)}
                </h3>

                <p>
                    ${escapeHTML(message)}
                </p>
            </div>
        `;
    }


    /* =====================================================
       PAGE HOME
    ===================================================== */

    async function renderHome() {

        state.currentPage = "home";

        showLoading(
            "Chargement des annonces..."
        );

        await Promise.all([
            loadListings(),
            loadWallet()
        ]);

        if (!DOM.pageContainer) {
            return;
        }

        DOM.pageContainer.innerHTML = `
            <section class="home-page">

                <div class="home-hero">

                    <div class="hero-copy">

                        <span class="hero-eyebrow">
                            NEXMARKET
                        </span>

                        <h1>
                            Trouve ton prochain
                            <span>canal Telegram.</span>
                        </h1>

                        <p>
                            Achète et vends des canaux
                            Telegram dans un espace pensé
                            pour des transactions sécurisées.
                        </p>

                    </div>

                    <div class="hero-actions">

                        <button
                            class="primary-action"
                            type="button"
                            data-action="buy"
                        >
                            ${ICONS.cart}
                            <span>
                                Acheter un canal
                            </span>
                        </button>

                        <button
                            class="secondary-action"
                            type="button"
                            data-action="sell"
                        >
                            ${ICONS.sell}
                            <span>
                                Vendre un canal
                            </span>
                        </button>

                    </div>

                </div>


                <div class="section-header">

                    <div>
                        <span class="section-kicker">
                            MARKETPLACE
                        </span>

                        <h2>
                            Dernières annonces
                        </h2>
                    </div>

                    <button
                        class="text-button"
                        type="button"
                        data-action="buy"
                    >
                        Voir tout
                        ${ICONS.arrow}
                    </button>

                </div>


                <div
                    class="listing-feed"
                    id="homeListingFeed"
                >
                    ${renderListingFeed(
                        state.listings.slice(0, 6)
                    )}
                </div>

            </section>
        `;
    }


    /* =====================================================
       NORMALIZE LISTING
    ===================================================== */

    function normalizeListing(
        listing
    ) {

        if (!listing) {
            return null;
        }

        return {
            ...listing,

            id:
                listing.id ??
                listing.listing_id,

            title:
                listing.title ||
                listing.name ||
                "Canal Telegram",

            username:
                listing.username ||
                listing.channel_username ||
                "",

            description:
                listing.description ||
                "",

            category:
                listing.category ||
                "Autre",

            country:
                listing.country ||
                "",

            language:
                listing.language ||
                "",

            subscribers:
                Number(
                    listing.subscribers ??
                    listing.subscriber_count ??
                    0
                ),

            price:
                Number(
                    listing.price ??
                    listing.amount ??
                    0
                ),

            currency:
                listing.currency ||
                "FCFA",

            image:
                listing.image ||
                listing.image_url ||
                listing.photo_url ||
                "",

            status:
                listing.status ||
                "pending",

            is_favorite:
                Boolean(
                    listing.is_favorite
                )
        };
    }


    /* =====================================================
       LISTINGS
    ===================================================== */

    async function loadListings() {

        try {

            const data =
                await apiRequest(
                    "/listings"
                );

            const raw =
                Array.isArray(data)
                    ? data
                    : (
                        data.items ||
                        data.listings ||
                        data.results ||
                        []
                    );

            state.listings =
                raw
                    .map(normalizeListing)
                    .filter(Boolean);

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


    function renderListingFeed(
        listings
    ) {

        if (
            !Array.isArray(listings) ||
            listings.length === 0
        ) {

            return showEmpty(
                "Aucune annonce",
                "Aucun canal n'est disponible pour le moment."
            );
        }

        return listings
            .map(renderListingCard)
            .join("");
    }


    /* =====================================================
       LISTING CARD
    ===================================================== */

    function renderListingCard(
        listing
    ) {

        const item =
            normalizeListing(listing);

        if (!item) {
            return "";
        }

        const favorite =
            state.favorites.includes(
                item.id
            ) ||
            item.is_favorite;

        const image =
            item.image
                ? `
                    <img
                        src="${escapeHTML(item.image)}"
                        alt="${escapeHTML(item.title)}"
                        loading="lazy"
                    >
                `
                : `
                    <div class="listing-image-placeholder">
                        ${ICONS.channel}
                    </div>
                `;

        return `
            <article
                class="channel-listing"
                data-listing-id="${escapeHTML(item.id)}"
            >

                <button
                    class="listing-main"
                    type="button"
                    data-action="listing"
                    data-id="${escapeHTML(item.id)}"
                >

                    <div class="listing-image">
                        ${image}
                    </div>

                    <div class="listing-content">

                        <div class="listing-top">

                            <span class="listing-category">
                                ${escapeHTML(
                                    item.category
                                )}
                            </span>

                            <span class="listing-username">
                                ${escapeHTML(
                                    item.username
                                )}
                            </span>

                        </div>

                        <h3>
                            ${escapeHTML(
                                item.title
                            )}
                        </h3>

                        <p class="listing-description">
                            ${escapeHTML(
                                item.description
                            )}
                        </p>

                        <div class="listing-meta">

                            <span>
                                ${formatNumber(
                                    item.subscribers
                                )}
                                abonnés
                            </span>

                            <strong>
                                ${formatMoney(
                                    item.price,
                                    item.currency
                                )}
                            </strong>

                        </div>

                    </div>

                </button>

                <button
                    class="favorite-button ${
                        favorite
                            ? "active"
                            : ""
                    }"
                    type="button"
                    data-action="favorite"
                    data-id="${escapeHTML(item.id)}"
                    aria-label="Ajouter aux favoris"
                >
                    ${ICONS.heart}
                </button>

            </article>
        `;
    }


    /* =====================================================
       LISTING DETAIL
    ===================================================== */

    async function renderListingDetail(
        listingId
    ) {

        state.currentPage =
            "listing-detail";

        showLoading(
            "Chargement du canal..."
        );

        let listing =
            state.listings.find(
                item =>
                    String(item.id) ===
                    String(listingId)
            );

        try {

            const data =
                await apiRequest(
                    `/listings/${listingId}`
                );

            listing =
                normalizeListing(
                    data?.listing ||
                    data
                );

        } catch (error) {

            console.warn(
                "Listing detail:",
                error.message
            );
        }

        if (!listing) {

            DOM.pageContainer.innerHTML =
                showEmpty(
                    "Canal introuvable",
                    "Cette annonce n'est plus disponible."
                );

            return;
        }

        const image =
            listing.image
                ? `
                    <img
                        src="${escapeHTML(listing.image)}"
                        alt="${escapeHTML(listing.title)}"
                    >
                `
                : `
                    <div class="detail-image-placeholder">
                        ${ICONS.channel}
                    </div>
                `;

        DOM.pageContainer.innerHTML = `
            <section class="listing-detail-page">

                <button
                    class="back-button"
                    type="button"
                    data-action="back"
                >
                    ${ICONS.arrow}
                    <span>Retour</span>
                </button>

                <div class="detail-image">
                    ${image}
                </div>

                <div class="detail-content">

                    <span class="listing-category">
                        ${escapeHTML(
                            listing.category
                        )}
                    </span>

                    <h1>
                        ${escapeHTML(
                            listing.title
                        )}
                    </h1>

                    <p class="listing-username">
                        ${escapeHTML(
                            listing.username
                        )}
                    </p>

                    <p class="detail-description">
                        ${escapeHTML(
                            listing.description ||
                            "Aucune description disponible."
                        )}
                    </p>

                    <div class="detail-stats">

                        <div>
                            <span>
                                Abonnés
                            </span>

                            <strong>
                                ${formatNumber(
                                    listing.subscribers
                                )}
                            </strong>
                        </div>

                        <div>
                            <span>
                                Pays
                            </span>

                            <strong>
                                ${escapeHTML(
                                    listing.country ||
                                    "—"
                                )}
                            </strong>
                        </div>

                        <div>
                            <span>
                                Langue
                            </span>

                            <strong>
                                ${escapeHTML(
                                    listing.language ||
                                    "—"
                                )}
                            </strong>
                        </div>

                    </div>

                    <div class="detail-price">

                        <span>
                            Prix
                        </span>

                        <strong>
                            ${formatMoney(
                                listing.price,
                                listing.currency
                            )}
                        </strong>

                    </div>

                    <button
                        class="primary-action detail-buy-button"
                        type="button"
                        data-action="buy-listing"
                        data-id="${escapeHTML(
                            listing.id
                        )}"
                    >
                        ${ICONS.cart}
                        <span>
                            Acheter ce canal
                        </span>
                    </button>

                </div>

            </section>
        `;
    }


            const category =
            listing.category ||
            "Autre";

        const description =
            listing.description ||
            "Aucune description disponible.";

        const subscribers =
            Number(
                listing.subscribers ||
                listing.subscriber_count ||
                0
            );

        const price =
            Number(
                listing.price ||
                listing.amount ||
                0
            );

        const currency =
            listing.currency ||
            "FCFA";

        const image =
            listing.image_url ||
            listing.image ||
            listing.photo_url ||
            "";

        const isFavorite =
            state.favorites.includes(
                id
            );

        return `
            <article
                class="channel-listing"
                data-listing-id="${escapeHTML(id)}"
            >

                <button
                    class="listing-main"
                    type="button"
                    data-action="listing"
                    data-id="${escapeHTML(id)}"
                >

                    <div class="listing-image">

                        ${
                            image
                                ? `
                                    <img
                                        src="${escapeHTML(image)}"
                                        alt="${escapeHTML(title)}"
                                        loading="lazy"
                                    >
                                `
                                : `
                                    <div class="listing-image-placeholder">
                                        ${ICONS.channel}
                                    </div>
                                `
                        }

                    </div>


                    <div class="listing-content">

                        <div class="listing-top">

                            <span class="listing-category">
                                ${escapeHTML(
                                    category
                                )}
                            </span>

                            <span class="listing-username">
                                ${escapeHTML(
                                    username
                                )}
                            </span>

                        </div>


                        <h3>
                            ${escapeHTML(title)}
                        </h3>


                        <p class="listing-description">
                            ${escapeHTML(
                                description
                            )}
                        </p>


                        <div class="listing-meta">

                            <span>
                                ${formatNumber(
                                    subscribers
                                )}
                                abonnés
                            </span>

                            <strong>
                                ${formatMoney(
                                    price,
                                    currency
                                )}
                            </strong>

                        </div>

                    </div>

                </button>


                <button
                    class="favorite-button ${
                        isFavorite
                            ? "active"
                            : ""
                    }"
                    type="button"
                    data-action="favorite"
                    data-id="${escapeHTML(id)}"
                    aria-label="Ajouter aux favoris"
                >
                    ${ICONS.heart}
                </button>

            </article>
        `;
    }


    /* =====================================================
       PAGE BUY
    ===================================================== */

    async function renderBuy() {

        state.currentPage =
            "buy";

        showLoading(
            "Chargement du marketplace..."
        );

        await loadListings();

        if (!DOM.pageContainer) {
            return;
        }

        DOM.pageContainer.innerHTML = `
            <section class="market-page">

                <div class="page-heading">

                    <div>
                        <span class="section-kicker">
                            MARKETPLACE
                        </span>

                        <h1>
                            Acheter un canal
                        </h1>

                        <p>
                            Découvre les canaux Telegram
                            disponibles sur NexMarket.
                        </p>
                    </div>

                    <button
                        class="filter-button"
                        type="button"
                        data-action="filters"
                    >
                        ${ICONS.filter}
                        <span>
                            Filtres
                        </span>
                    </button>

                </div>


                <div
                    class="search-box"
                >

                    ${ICONS.search}

                    <input
                        id="marketSearch"
                        type="search"
                        placeholder="Rechercher un canal..."
                        autocomplete="off"
                    >

                </div>


                <div
                    class="active-filters"
                    id="activeFilters"
                >
                </div>


                <div
                    class="listing-feed"
                    id="buyListingFeed"
                >
                    ${renderListingFeed(
                        state.listings
                    )}
                </div>

            </section>
        `;

        const searchInput =
            document.getElementById(
                "marketSearch"
            );

        if (searchInput) {

            searchInput.value =
                state.searchQuery || "";

            searchInput.addEventListener(
                "input",
                event => {

                    state.searchQuery =
                        event.target.value;

                    applyListingFilters();
                }
            );
        }

        bindPageActions();
    }


    /* =====================================================
       FILTERS
    ===================================================== */

    function applyListingFilters() {

        let listings =
            [...state.listings];

        const query =
            String(
                state.searchQuery ||
                ""
            )
                .trim()
                .toLowerCase();

        if (query) {

            listings =
                listings.filter(
                    listing => {

                        const text =
                            [
                                listing.title,
                                listing.username,
                                listing.description,
                                listing.category,
                                listing.country,
                                listing.language
                            ]
                                .filter(Boolean)
                                .join(" ")
                                .toLowerCase();

                        return text.includes(
                            query
                        );
                    }
                );
        }


        if (
            state.selectedCategory &&
            state.selectedCategory !== "all"
        ) {

            listings =
                listings.filter(
                    listing =>
                        String(
                            listing.category ||
                            ""
                        ).toLowerCase() ===
                        String(
                            state.selectedCategory
                        ).toLowerCase()
                );
        }


        if (
            state.selectedCountry &&
            state.selectedCountry !== "all"
        ) {

            listings =
                listings.filter(
                    listing =>
                        String(
                            listing.country ||
                            ""
                        ).toLowerCase() ===
                        String(
                            state.selectedCountry
                        ).toLowerCase()
                );
        }


        if (
            state.selectedLanguage &&
            state.selectedLanguage !== "all"
        ) {

            listings =
                listings.filter(
                    listing =>
                        String(
                            listing.language ||
                            ""
                        ).toLowerCase() ===
                        String(
                            state.selectedLanguage
                        ).toLowerCase()
                );
        }


        if (
            state.selectedSubscribers &&
            state.selectedSubscribers !== "all"
        ) {

            const value =
                state.selectedSubscribers;

            listings =
                listings.filter(
                    listing => {

                        const count =
                            Number(
                                listing.subscribers ||
                                0
                            );

                        if (
                            value ===
                            "0-1000"
                        ) {
                            return count < 1000;
                        }

                        if (
                            value ===
                            "1000-10000"
                        ) {
                            return (
                                count >= 1000 &&
                                count < 10000
                            );
                        }

                        if (
                            value ===
                            "10000-50000"
                        ) {
                            return (
                                count >= 10000 &&
                                count < 50000
                            );
                        }

                        if (
                            value ===
                            "50000+"
                        ) {
                            return count >= 50000;
                        }

                        return true;
                    }
                );
        }


        if (
            state.selectedPrice &&
            state.selectedPrice !== "all"
        ) {

            listings =
                listings.filter(
                    listing => {

                        const price =
                            Number(
                                listing.price ||
                                0
                            );

                        if (
                            state.selectedPrice ===
                            "0-10000"
                        ) {
                            return price < 10000;
                        }

                        if (
                            state.selectedPrice ===
                            "10000-50000"
                        ) {
                            return (
                                price >= 10000 &&
                                price < 50000
                            );
                        }

                        if (
                            state.selectedPrice ===
                            "50000-100000"
                        ) {
                            return (
                                price >= 50000 &&
                                price < 100000
                            );
                        }

                        if (
                            state.selectedPrice ===
                            "100000+"
                        ) {
                            return price >= 100000;
                        }

                        return true;
                    }
                );
        }


        const feed =
            document.getElementById(
                "buyListingFeed"
            );

        if (feed) {

            feed.innerHTML =
                renderListingFeed(
                    listings
                );
        }

        bindPageActions();
    }


    /* =====================================================
       FILTER MODAL
    ===================================================== */

    function openFilters() {

        openModal(`

            <div class="filter-modal">

                <div class="modal-header">

                    <div>
                        <span class="section-kicker">
                            FILTRES
                        </span>

                        <h2>
                            Affiner la recherche
                        </h2>
                    </div>

                    <button
                        class="modal-close-button"
                        type="button"
                        data-action="close-modal"
                    >
                        ${ICONS.close}
                    </button>

                </div>


                <div class="filter-form">

                    <label class="field">

                        <span>
                            Catégorie
                        </span>

                        <select
                            id="filterCategory"
                        >
                            <option value="all">
                                Toutes les catégories
                            </option>

                            <option value="anime">
                                Anime
                            </option>

                            <option value="gaming">
                                Gaming
                            </option>

                            <option value="business">
                                Business
                            </option>

                            <option value="actualite">
                                Actualité
                            </option>

                            <option value="education">
                                Éducation
                            </option>

                            <option value="divertissement">
                                Divertissement
                            </option>

                            <option value="autre">
                                Autre
                            </option>
                        </select>

                    </label>


                    <label class="field">

                        <span>
                            Pays
                        </span>

                        <select
                            id="filterCountry"
                        >
                            <option value="all">
                                Tous les pays
                            </option>

                            <option value="CG">
                                Congo
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

                            <option value="GA">
                                Gabon
                            </option>
                        </select>

                    </label>


                    <label class="field">

                        <span>
                            Langue
                        </span>

                        <select
                            id="filterLanguage"
                        >
                            <option value="all">
                                Toutes les langues
                            </option>

                            <option value="fr">
                                Français
                            </option>

                            <option value="en">
                                English
                            </option>

                            <option value="pt">
                                Português
                            </option>
                        </select>

                    </label>


                    <label class="field">

                        <span>
                            Nombre d'abonnés
                        </span>

                        <select
                            id="filterSubscribers"
                        >
                            <option value="all">
                                Tous
                            </option>

                            <option value="0-1000">
                                Moins de 1 000
                            </option>

                            <option value="1000-10000">
                                1 000 – 10 000
                            </option>

                            <option value="10000-50000">
                                10 000 – 50 000
                            </option>

                            <option value="50000+">
                                Plus de 50 000
                            </option>
                        </select>

                    </label>


                    <label class="field">

                        <span>
                            Prix
                        </span>

                        <select
                            id="filterPrice"
                        >
                            <option value="all">
                                Tous les prix
                            </option>

                            <option value="0-10000">
                                Moins de 10 000 FCFA
                            </option>

                            <option value="10000-50000">
                                10 000 – 50 000 FCFA
                            </option>

                            <option value="50000-100000">
                                50 000 – 100 000 FCFA
                            </option>

                            <option value="100000+">
                                Plus de 100 000 FCFA
                            </option>
                        </select>

                    </label>


                    <div class="filter-actions">

                        <button
                            class="secondary-action"
                            type="button"
                            data-action="reset-filters"
                        >
                            Réinitialiser
                        </button>

                        <button
                            class="primary-action"
                            type="button"
                            data-action="apply-filters"
                        >
                            Appliquer
                        </button>

                    </div>

                </div>

            </div>

        `);


        const category =
            document.getElementById(
                "filterCategory"
            );

        const country =
            document.getElementById(
                "filterCountry"
            );

        const language =
            document.getElementById(
                "filterLanguage"
            );

        const subscribers =
            document.getElementById(
                "filterSubscribers"
            );

        const price =
            document.getElementById(
                "filterPrice"
            );


        if (category) {
            category.value =
                state.selectedCategory ||
                "all";
        }

        if (country) {
            country.value =
                state.selectedCountry ||
                "all";
        }

        if (language) {
            language.value =
                state.selectedLanguage ||
                "all";
        }

        if (subscribers) {
            subscribers.value =
                state.selectedSubscribers ||
                "all";
        }

        if (price) {
            price.value =
                state.selectedPrice ||
                "all";
        }

        bindPageActions();
    }

        /* =====================================================
       LOAD USER
    ===================================================== */

    async function loadCurrentUser() {

        try {

            const data =
                await apiRequest(
                    "/users/me"
                );

            state.user =
                data?.user ||
                data;

            updateTelegramProfile();

            return state.user;

        } catch (error) {

            console.warn(
                "Utilisateur:",
                error.message
            );

            const telegramUser =
                getTelegramUser();

            if (telegramUser) {

                state.user = {
                    telegram_id:
                        telegramUser.id,

                    first_name:
                        telegramUser.first_name,

                    last_name:
                        telegramUser.last_name,

                    username:
                        telegramUser.username,

                    photo_url:
                        telegramUser.photo_url
                };

                updateTelegramProfile();

                return state.user;
            }

            return null;
        }
    }


    /* =====================================================
       WALLET
    ===================================================== */

    async function loadWallet() {

        try {

            const data =
                await apiRequest(
                    "/wallet"
                );

            state.wallet =
                data?.wallet ||
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


    function getWalletBalance() {

        if (!state.wallet) {
            return 0;
        }

        return Number(
            state.wallet.balance ??
            state.wallet.available_balance ??
            state.wallet.amount ??
            0
        );
    }


    /* =====================================================
       PAGE WALLET
    ===================================================== */

    async function renderWallet() {

        state.currentPage =
            "wallet";

        showLoading(
            "Chargement du portefeuille..."
        );

        await loadWallet();

        if (!DOM.pageContainer) {
            return;
        }

        const balance =
            getWalletBalance();

        const currency =
            state.wallet?.currency ||
            state.user?.currency ||
            "XAF";

        DOM.pageContainer.innerHTML = `

            <section class="wallet-page">

                <div class="page-heading">

                    <span class="section-kicker">
                        PORTEFEUILLE
                    </span>

                    <h1>
                        Mon portefeuille
                    </h1>

                    <p>
                        Gère ton solde et tes transactions
                        directement depuis NexMarket.
                    </p>

                </div>


                <div class="wallet-balance-panel">

                    <div class="wallet-balance-label">
                        Solde disponible
                    </div>

                    <div class="wallet-balance-value">
                        ${formatMoney(
                            balance,
                            currency
                        )}
                    </div>

                    <div class="wallet-balance-status">
                        Solde NexMarket
                    </div>

                </div>


                <div class="wallet-actions">

                    <button
                        class="wallet-action primary-action"
                        type="button"
                        data-action="deposit"
                    >
                        ${ICONS.deposit}

                        <span>
                            Déposer
                        </span>
                    </button>


                    <button
                        class="wallet-action secondary-action"
                        type="button"
                        data-action="withdraw"
                    >
                        ${ICONS.withdraw}

                        <span>
                            Retirer
                        </span>
                    </button>

                </div>


                <div class="wallet-stats">

                    <div class="wallet-stat">

                        <span>
                            Solde
                        </span>

                        <strong>
                            ${formatMoney(
                                balance,
                                currency
                            )}
                        </strong>

                    </div>


                    <div class="wallet-stat">

                        <span>
                            Devise
                        </span>

                        <strong>
                            ${escapeHTML(
                                currency
                            )}
                        </strong>

                    </div>

                </div>


                <div class="wallet-info">

                    <div class="wallet-info-icon">
                        ${ICONS.lock}
                    </div>

                    <div>

                        <strong>
                            Paiements sécurisés
                        </strong>

                        <p>
                            Les opérations financières
                            sont traitées via
                            JessiKaPay.
                        </p>

                    </div>

                </div>

            </section>
        `;

        bindPageActions();
    }


    /* =====================================================
       DEPOSIT
    ===================================================== */

    function openWalletDeposit() {

        openModal(`

            <div class="wallet-modal">

                <div class="modal-header-content">

                    <div>

                        <span class="section-kicker">
                            PORTEFEUILLE
                        </span>

                        <h2>
                            Déposer des fonds
                        </h2>

                    </div>

                    <button
                        class="modal-close-button"
                        type="button"
                        data-action="close-modal"
                    >
                        ${ICONS.close}
                    </button>

                </div>


                <div class="payment-provider">

                    <div class="payment-provider-icon">
                        ${ICONS.wallet}
                    </div>

                    <div>

                        <strong>
                            JessiKaPay
                        </strong>

                        <span>
                            Paiement sécurisé
                        </span>

                    </div>

                </div>


                <form
                    id="depositForm"
                    class="wallet-form"
                >

                    <label class="field">

                        <span>
                            Montant
                        </span>

                        <input
                            id="depositAmount"
                            type="number"
                            min="100"
                            step="1"
                            placeholder="Ex : 5000"
                            required
                        >

                    </label>


                    <label class="field">

                        <span>
                            Pays
                        </span>

                        <select
                            id="depositCountry"
                            required
                        >

                            <option value="">
                                Sélectionner un pays
                            </option>

                            <option value="CG">
                                Congo
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

                            <option value="GA">
                                Gabon
                            </option>

                        </select>

                    </label>


                    <label class="field">

                        <span>
                            Numéro Mobile Money
                        </span>

                        <input
                            id="depositPhone"
                            type="tel"
                            placeholder="Ex : 06 000 00 00"
                            autocomplete="tel"
                            required
                        >

                    </label>


                    <button
                        class="primary-action full-width"
                        type="submit"
                    >
                        ${ICONS.deposit}

                        <span>
                            Continuer avec JessiKaPay
                        </span>
                    </button>

                </form>

            </div>

        `);


        const form =
            document.getElementById(
                "depositForm"
            );

        if (form) {

            form.addEventListener(
                "submit",
                handleDepositSubmit
            );
        }
    }


    /* =====================================================
       DEPOSIT SUBMIT
    ===================================================== */

    async function handleDepositSubmit(
        event
    ) {

        event.preventDefault();

        const amount =
            Number(
                document.getElementById(
                    "depositAmount"
                )?.value
            );

        const country =
            document.getElementById(
                "depositCountry"
            )?.value;

        const phone =
            document.getElementById(
                "depositPhone"
            )?.value.trim();


        if (
            !amount ||
            amount <= 0
        ) {

            showToast(
                "Montant invalide",
                "Entre un montant supérieur à zéro."
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
                "Entre ton numéro Mobile Money."
            );

            return;
        }


        try {

            const submitButton =
                event.target.querySelector(
                    'button[type="submit"]'
                );

            if (submitButton) {
                submitButton.disabled = true;
                submitButton.classList.add(
                    "is-loading"
                );
            }


            const data =
                await apiRequest(
                    "/wallet/deposit",
                    {
                        method: "POST",

                        body:
                            JSON.stringify({
                                amount,
                                country,
                                phone
                            })
                    }
                );


            closeModal();


            if (
                data?.payment_link
            ) {

                showToast(
                    "Dépôt créé",
                    "Redirection vers JessiKaPay..."
                );


                if (
                    tg &&
                    typeof tg.openLink ===
                        "function"
                ) {

                    tg.openLink(
                        data.payment_link
                    );

                } else {

                    window.open(
                        data.payment_link,
                        "_blank"
                    );
                }

            } else {

                showToast(
                    "Dépôt créé",
                    "Ta demande de dépôt a été enregistrée."
                );
            }


            await loadWallet();


            if (
                state.currentPage ===
                "wallet"
            ) {

                await renderWallet();
            }

        } catch (error) {

            console.error(
                "Dépôt:",
                error
            );

            showToast(
                "Dépôt impossible",
                error.message ||
                "Une erreur est survenue."
            );

        } finally {

            const submitButton =
                event.target.querySelector(
                    'button[type="submit"]'
                );

            if (submitButton) {
                submitButton.disabled = false;
                submitButton.classList.remove(
                    "is-loading"
                );
            }
        }
    }


    /* =====================================================
       WITHDRAW
    ===================================================== */

    function openWalletWithdraw() {

        openModal(`

            <div class="wallet-modal">

                <div class="modal-header-content">

                    <div>

                        <span class="section-kicker">
                            PORTEFEUILLE
                        </span>

                        <h2>
                            Retirer des fonds
                        </h2>

                    </div>

                    <button
                        class="modal-close-button"
                        type="button"
                        data-action="close-modal"
                    >
                        ${ICONS.close}
                    </button>

                </div>


                <div class="payment-provider">

                    <div class="payment-provider-icon">
                        ${ICONS.wallet}
                    </div>

                    <div>

                        <strong>
                            JessiKaPay
                        </strong>

                        <span>
                            Retrait sécurisé
                        </span>

                    </div>

                </div>


                <form
                    id="withdrawForm"
                    class="wallet-form"
                >

                    <label class="field">

                        <span>
                            Montant
                        </span>

                        <input
                            id="withdrawAmount"
                            type="number"
                            min="100"
                            step="1"
                            placeholder="Ex : 5000"
                            required
                        >

                    </label>


                    <label class="field">

                        <span>
                            Pays
                        </span>

                        <select
                            id="withdrawCountry"
                            required
                        >

                            <option value="">
                                Sélectionner un pays
                            </option>

                            <option value="CG">
                                Congo
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

                            <option value="GA">
                                Gabon
                            </option>

                        </select>

                    </label>


                    <label class="field">

                        <span>
                            Numéro Mobile Money
                        </span>

                        <input
                            id="withdrawPhone"
                            type="tel"
                            placeholder="Ex : 06 000 00 00"
                            autocomplete="tel"
                            required
                        >

                    </label>


                    <button
                        class="primary-action full-width"
                        type="submit"
                    >
                        ${ICONS.withdraw}

                        <span>
                            Demander le retrait
                        </span>

                    </button>

                </form>

            </div>

        `);


        const form =
            document.getElementById(
                "withdrawForm"
            );

        if (form) {

            form.addEventListener(
                "submit",
                handleWithdrawSubmit
            );
        }
    }

            input.addEventListener(
            "input",
            event => {

                clearTimeout(timer);

                timer =
                    setTimeout(
                        async () => {

                            state.searchQuery =
                                event.target.value;

                            await renderBuy();

                        },
                        350
                    );
            }
        );
    }


    /* =====================================================
       FILTERS
    ===================================================== */

    function openFilters() {

        openModal(`

            <div class="modal-header-content">

                <div>

                    <span class="section-kicker">
                        FILTRES
                    </span>

                    <h2>
                        Affiner la recherche
                    </h2>

                </div>

            </div>


            <div class="filter-form">

                <label>

                    Catégorie

                    <select
                        id="filterCategory"
                    >

                        <option value="all">
                            Toutes
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
                            Creation
                        </option>

                        <option value="Community">
                            Community
                        </option>

                        <option value="Other">
                            Other
                        </option>

                    </select>

                </label>


                <label>

                    Pays

                    <input
                        id="filterCountry"
                        type="text"
                        placeholder="Ex : Congo"
                        value="${
                            state.selectedCountry ===
                            "all"
                                ? ""
                                : escapeHTML(
                                    state.selectedCountry
                                )
                        }"
                    >

                </label>


                <label>

                    Langue

                    <input
                        id="filterLanguage"
                        type="text"
                        placeholder="Ex : Français"
                        value="${
                            state.selectedLanguage ===
                            "all"
                                ? ""
                                : escapeHTML(
                                    state.selectedLanguage
                                )
                        }"
                    >

                </label>


                <div class="modal-actions">

                    <button
                        type="button"
                        class="secondary-action"
                        data-action="reset-filters"
                    >
                        Réinitialiser
                    </button>


                    <button
                        type="button"
                        class="primary-action"
                        data-action="apply-filters"
                    >
                        Appliquer
                    </button>

                </div>

            </div>

        `);


        const category =
            document.getElementById(
                "filterCategory"
            );

        if (category) {

            category.value =
                state.selectedCategory;
        }


        document
            .querySelector(
                '[data-action="apply-filters"]'
            )
            ?.addEventListener(
                "click",
                applyFilters
            );


        document
            .querySelector(
                '[data-action="reset-filters"]'
            )
            ?.addEventListener(
                "click",
                resetFilters
            );
    }


    async function applyFilters() {

        const category =
            document.getElementById(
                "filterCategory"
            );

        const country =
            document.getElementById(
                "filterCountry"
            );

        const language =
            document.getElementById(
                "filterLanguage"
            );


        state.selectedCategory =
            category?.value ||
            "all";


        state.selectedCountry =
            country?.value.trim() ||
            "all";


        state.selectedLanguage =
            language?.value.trim() ||
            "all";


        closeModal();

        await renderBuy();
    }


    async function resetFilters() {

        state.selectedCategory =
            "all";

        state.selectedCountry =
            "all";

        state.selectedLanguage =
            "all";

        state.selectedSubscribers =
            "all";

        state.selectedPrice =
            "all";

        closeModal();

        await renderBuy();
    }


    /* =====================================================
       LOAD LISTINGS
    ===================================================== */

    async function loadListings() {

        try {

            const params =
                new URLSearchParams();


            if (state.searchQuery) {

                params.set(
                    "search",
                    state.searchQuery
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


            const query =
                params.toString();


            const endpoint =
                query
                    ? `/listings?${query}`
                    : "/listings";


            const data =
                await apiRequest(
                    endpoint
                );


            const rawListings =
                Array.isArray(data)
                    ? data
                    : (
                        data.items ||
                        data.listings ||
                        data.results ||
                        []
                    );


            state.listings =
                rawListings.map(
                    normalizeListing
                );


            return state.listings;

        } catch (error) {

            console.error(
                "Erreur chargement annonces:",
                error
            );


            state.listings = [];


            showToast(
                "Erreur",
                error.message ||
                "Impossible de charger les annonces."
            );


            return [];
        }
    }


    /* =====================================================
       NORMALISATION LISTING
    ===================================================== */

    function normalizeListing(
        listing
    ) {

        if (!listing) {
            return {};
        }


        const channel =
            listing.channel ||
            {};


        return {

            ...listing,


            id:
                listing.id ??
                listing.listing_id,


            channel_id:
                listing.channel_id ??
                channel.id,


            title:
                listing.title ||
                listing.name ||
                channel.title ||
                channel.name ||
                "Canal Telegram",


            name:
                listing.name ||
                listing.title ||
                channel.name ||
                channel.title ||
                "Canal Telegram",


            username:
                listing.username ||
                channel.username ||
                "",


            description:
                listing.description ||
                channel.description ||
                "",


            photo_url:
                listing.photo_url ||
                channel.photo_url ||
                "",


            category:
                listing.category ||
                channel.category ||
                "Other",


            country:
                listing.country ||
                channel.country ||
                "",


            language:
                listing.language ||
                channel.language ||
                "",


            subscribers_count:
                listing.subscribers_count ??
                channel.subscribers_count ??
                0,


            telegram_verified:
                listing.telegram_verified ??
                channel.telegram_verified ??
                false,


            bot_is_admin:
                listing.bot_is_admin ??
                channel.bot_is_admin ??
                false,


            seller_is_admin:
                listing.seller_is_admin ??
                channel.seller_is_admin ??
                false,


            price:
                listing.price ??
                listing.locked_price ??
                0,


            currency:
                listing.currency ||
                "XAF"
        };
    }


    /* =====================================================
       LOAD USER
    ===================================================== */

    async function loadCurrentUser() {

        try {

            const data =
                await apiRequest(
                    "/users/me"
                );


            state.user =
                data?.user ||
                data;


            updateTelegramProfile();


            return state.user;

        } catch (error) {

            console.warn(
                "Utilisateur:",
                error.message
            );


            const telegramUser =
                getTelegramUser();


            if (telegramUser) {

                state.user = {

                    telegram_id:
                        telegramUser.id,

                    username:
                        telegramUser.username,

                    first_name:
                        telegramUser.first_name,

                    last_name:
                        telegramUser.last_name,

                    photo_url:
                        telegramUser.photo_url,

                    currency:
                        "XAF",

                    language:
                        "fr"
                };


                updateTelegramProfile();
            }


            return state.user;
        }
    }


    /* =====================================================
       LOAD WALLET
    ===================================================== */

    async function loadWallet() {

        if (!state.user) {
            return null;
        }


        try {

            const data =
                await apiRequest(
                    "/wallet"
                );


            state.wallet =
                data?.wallet ||
                data;


            return state.wallet;

        } catch (error) {

            console.warn(
                "Portefeuille:",
                error.message
            );


            state.wallet =
                null;


            return null;
        }
    }


    /* =====================================================
       LOAD TRANSACTIONS
    ===================================================== */

    async function loadTransactions() {

        if (!state.user) {

            state.transactions =
                [];

            return [];
        }


        try {

            const data =
                await apiRequest(
                    "/transactions/mine"
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


            state.transactions =
                [];


            return [];
        }
    }


    /* =====================================================
       LOAD FAVORITES
    ===================================================== */

    async function loadFavorites() {

        if (!state.user) {

            state.favorites =
                [];

            return [];
        }


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


            return state.favorites;

        } catch (error) {

            console.warn(
                "Favoris:",
                error.message
            );


            state.favorites =
                [];


            return [];
        }
    }


    /* =====================================================
       LOAD MY LISTINGS
    ===================================================== */

    async function loadMyListings() {

        if (!state.user) {

            state.myListings =
                [];

            return [];
        }


        try {

            const data =
                await apiRequest(
                    "/listings/mine/all"
                );


            const raw =
                Array.isArray(data)
                    ? data
                    : (
                        data.items ||
                        data.listings ||
                        []
                    );


            state.myListings =
                raw.map(
                    normalizeListing
                );


            return state.myListings;

        } catch (error) {

            console.warn(
                "Mes annonces:",
                error.message
            );


            state.myListings =
                [];


            return [];
        }
    }

                const data =
                await apiRequest(
                    `/transactions/purchase/${listingId}`,
                    {
                        method: "POST"
                    }
                );


            closeModal();


            showToast(
                "Achat lancé",
                data?.message ||
                "La transaction est maintenant protégée."
            );


            await loadTransactions();
            await loadWallet();


            renderMessages();

        } catch (error) {

            showToast(
                "Achat impossible",
                error.message ||
                "Impossible de lancer la transaction."
            );
        }
    }


    /* =====================================================
       SELL PAGE
    ===================================================== */

    async function renderSell() {

        state.currentPage =
            "sell";


        showLoading(
            "Préparation de la vente..."
        );


        await Promise.all([
            loadCurrentUser(),
            loadMyListings()
        ]);


        if (!DOM.pageContainer) {
            return;
        }


        DOM.pageContainer.innerHTML = `

            <section class="sell-page">

                <div class="page-heading">

                    <span class="section-kicker">
                        VENDEUR
                    </span>

                    <h1>
                        Vendre un canal
                    </h1>

                    <p>
                        Ajoute ton canal Telegram
                        et soumets-le à la vérification
                        NexMarket.
                    </p>

                </div>


                <div class="sell-info-card">

                    ${ICONS.shield}

                    <div>

                        <strong>
                            Vente sécurisée
                        </strong>

                        <p>
                            Ton canal sera vérifié avant
                            sa publication sur NexMarket.
                        </p>

                    </div>

                </div>


                <form
                    id="listingForm"
                    class="listing-form"
                >

                    <div class="form-section">

                        <div class="form-section-heading">

                            <span>
                                01
                            </span>

                            <div>

                                <h2>
                                    Informations du canal
                                </h2>

                                <p>
                                    Donne-nous les informations
                                    principales de ton canal.
                                </p>

                            </div>

                        </div>


                        <label class="form-field">

                            <span>
                                Nom du canal
                            </span>

                            <input
                                id="listingTitle"
                                name="title"
                                type="text"
                                placeholder="Ex : NEXA Community"
                                required
                            >

                        </label>


                        <label class="form-field">

                            <span>
                                @username du canal
                            </span>

                            <input
                                id="listingUsername"
                                name="username"
                                type="text"
                                placeholder="@moncanal"
                            >

                        </label>


                        <label class="form-field">

                            <span>
                                Description
                            </span>

                            <textarea
                                id="listingDescription"
                                name="description"
                                rows="4"
                                placeholder="Présente ton canal..."
                            ></textarea>

                        </label>


                        <div class="form-grid">

                            <label class="form-field">

                                <span>
                                    Catégorie
                                </span>

                                <div
                                    class="nexa-category-picker"
                                    id="categoryPicker"
                                >

                                    <button
                                        type="button"
                                        class="category-trigger"
                                        id="categoryTrigger"
                                    >

                                        <span
                                            id="categoryValue"
                                        >
                                            Choisir une catégorie
                                        </span>

                                        ${ICONS.chevron}

                                    </button>


                                    <div
                                        class="category-panel hidden"
                                        id="categoryPanel"
                                    >

                                        <div
                                            class="category-options"
                                        >

                                            <button
                                                type="button"
                                                data-category="News"
                                            >
                                                News
                                            </button>

                                            <button
                                                type="button"
                                                data-category="Sport"
                                            >
                                                Sport
                                            </button>

                                            <button
                                                type="button"
                                                data-category="Entertainment"
                                            >
                                                Entertainment
                                            </button>

                                            <button
                                                type="button"
                                                data-category="Games"
                                            >
                                                Games
                                            </button>

                                            <button
                                                type="button"
                                                data-category="Education"
                                            >
                                                Education
                                            </button>

                                            <button
                                                type="button"
                                                data-category="Business"
                                            >
                                                Business
                                            </button>

                                            <button
                                                type="button"
                                                data-category="Tech"
                                            >
                                                Tech
                                            </button>

                                            <button
                                                type="button"
                                                data-category="Commerce"
                                            >
                                                Commerce
                                            </button>

                                            <button
                                                type="button"
                                                data-category="Music"
                                            >
                                                Music
                                            </button>

                                            <button
                                                type="button"
                                                data-category="Creation"
                                            >
                                                Creation
                                            </button>

                                            <button
                                                type="button"
                                                data-category="Community"
                                            >
                                                Community
                                            </button>

                                            <button
                                                type="button"
                                                data-category="Other"
                                            >
                                                Other
                                            </button>

                                        </div>

                                    </div>

                                </div>

                            </label>


                            <label class="form-field">

                                <span>
                                    Pays
                                </span>

                                <input
                                    id="listingCountry"
                                    name="country"
                                    type="text"
                                    placeholder="Ex : Congo"
                                    required
                                >

                            </label>

                        </div>


                        <div class="form-grid">

                            <label class="form-field">

                                <span>
                                    Langue
                                </span>

                                <input
                                    id="listingLanguage"
                                    name="language"
                                    type="text"
                                    placeholder="Ex : Français"
                                    required
                                >

                            </label>


                            <label class="form-field">

                                <span>
                                    Nombre d'abonnés
                                </span>

                                <input
                                    id="listingSubscribers"
                                    name="subscribers_count"
                                    type="number"
                                    min="0"
                                    placeholder="Ex : 10000"
                                    required
                                >

                            </label>

                        </div>

                    </div>


                    <div class="form-section">

                        <div class="form-section-heading">

                            <span>
                                02
                            </span>

                            <div>

                                <h2>
                                    Prix de vente
                                </h2>

                                <p>
                                    Indique le prix auquel tu souhaites
                                    vendre ton canal.
                                </p>

                            </div>

                        </div>


                        <div class="form-grid">

                            <label class="form-field">

                                <span>
                                    Prix
                                </span>

                                <input
                                    id="listingPrice"
                                    name="price"
                                    type="number"
                                    min="1"
                                    step="1"
                                    placeholder="Ex : 50000"
                                    required
                                >

                            </label>


                            <label class="form-field">

                                <span>
                                    Devise
                                </span>

                                <select
                                    id="listingCurrency"
                                    name="currency"
                                >

                                    <option value="XAF">
                                        XAF
                                    </option>

                                    <option value="XOF">
                                        XOF
                                    </option>

                                    <option value="USD">
                                        USD
                                    </option>

                                    <option value="EUR">
                                        EUR
                                    </option>

                                </select>

                            </label>

                        </div>


                        <div class="fee-preview">

                            <div>

                                <span>
                                    Commission NexMarket
                                </span>

                                <strong>
                                    5%
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Tu recevras environ
                                </span>

                                <strong
                                    id="sellerNetPreview"
                                >
                                    —
                                </strong>

                            </div>

                        </div>

                    </div>


                    <div class="form-section">

                        <div class="form-section-heading">

                            <span>
                                03
                            </span>

                            <div>

                                <h2>
                                    Vérification Telegram
                                </h2>

                                <p>
                                    Le canal doit pouvoir être
                                    vérifié par NexMarket.
                                </p>

                            </div>

                        </div>


                        <div class="verification-requirements">

                            <div>

                                ${ICONS.check}

                                <span>
                                    Tu dois être propriétaire
                                    du canal.
                                </span>

                            </div>


                            <div>

                                ${ICONS.check}

                                <span>
                                    Le bot NexMarket doit être
                                    administrateur.
                                </span>

                            </div>


                            <div>

                                ${ICONS.check}

                                <span>
                                    Le canal sera vérifié avant
                                    publication.
                                </span>

                            </div>

                        </div>


                        <label class="form-field">

                            <span>
                                ID ou username du canal
                            </span>

                            <input
                                id="listingChannel"
                                name="channel"
                                type="text"
                                placeholder="@moncanal"
                                required
                            >

                        </label>

                    </div>


                    <button
                        type="submit"
                        class="primary-action full-width"
                    >

                        ${ICONS.sell}

                        Soumettre mon canal

                    </button>

                </form>


                ${
                    state.myListings.length
                        ? `
                            <div class="my-listings-section">

                                <div class="section-header">

                                    <div>

                                        <span class="section-kicker">
                                            MES ANNONCES
                                        </span>

                                        <h2>
                                            Mes canaux
                                        </h2>

                                    </div>

                                </div>


                                <div class="listing-feed">

                                    ${renderListingFeed(
                                        state.myListings
                                    )}

                                </div>

                            </div>
                        `
                        : ""
                }

            </section>
        `;


        bindSellActions();
    }

                            url
                    );

                } else {

                    window.open(
                        url,
                        "_blank"
                    );
                }

                return;
            }


            closeModal();


            showToast(
                "Dépôt créé",
                data?.message ||
                "Ton dépôt est en cours de traitement."
            );


            await loadWallet();


            if (
                state.currentPage ===
                "wallet"
            ) {

                await renderWallet();
            }

        } catch (error) {

            showToast(
                "Dépôt impossible",
                error.message ||
                "Impossible de créer le dépôt."
            );
        }
    }


    /* =====================================================
       WITHDRAW
    ===================================================== */

    function openWalletWithdraw() {

        openModal(`
            <div class="modal-header-content">

                <div>

                    <span class="section-kicker">
                        PORTEFEUILLE
                    </span>

                    <h2>
                        Retirer de l'argent
                    </h2>

                </div>

            </div>


            <form
                id="withdrawForm"
                class="modal-form"
            >

                <label>
                    Montant

                    <input
                        id="withdrawAmount"
                        type="number"
                        min="1"
                        step="1"
                        placeholder="Ex : 5000"
                        required
                    >

                </label>


                <label>
                    Pays

                    <input
                        id="withdrawCountry"
                        type="text"
                        placeholder="Ex : Congo"
                        required
                    >

                </label>


                <label>
                    Numéro Mobile Money

                    <input
                        id="withdrawPhone"
                        type="tel"
                        placeholder="Ex : 06 000 00 00"
                        required
                    >

                </label>


                <div class="payment-provider">

                    <span>
                        Moyen de paiement
                    </span>

                    <strong>
                        Money Fusion
                    </strong>

                    <small>
                        Le retrait sera traité de manière
                        sécurisée.
                    </small>

                </div>


                <button
                    type="submit"
                    class="primary-action full-width"
                >

                    ${ICONS.withdraw}

                    Confirmer le retrait

                </button>

            </form>
        `);


        document
            .getElementById(
                "withdrawForm"
            )
            ?.addEventListener(
                "submit",
                handleWithdrawSubmit
            );
    }


    async function handleWithdrawSubmit(
        event
    ) {

        event.preventDefault();


        const amountInput =
            document.getElementById(
                "withdrawAmount"
            );


        const countryInput =
            document.getElementById(
                "withdrawCountry"
            );


        const phoneInput =
            document.getElementById(
                "withdrawPhone"
            );


        const amount =
            Number(
                amountInput?.value
            );


        const country =
            countryInput?.value.trim();


        const phone =
            phoneInput?.value.trim();


        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            showToast(
                "Montant invalide",
                "Entre un montant supérieur à zéro."
            );

            return;
        }


        if (!country || !phone) {

            showToast(
                "Informations manquantes",
                "Indique ton pays et ton numéro Mobile Money."
            );

            return;
        }


        try {

            const data =
                await apiRequest(
                    "/wallet/withdraw",
                    {
                        method: "POST",

                        body:
                            JSON.stringify({
                                amount,

                                country,

                                phone,

                                currency:
                                    state.user?.currency ||
                                    "XAF"
                            })
                    }
                );


            closeModal();


            showToast(
                "Retrait demandé",
                data?.message ||
                "Ta demande de retrait est en cours de traitement."
            );


            await loadWallet();


            if (
                state.currentPage ===
                "wallet"
            ) {

                await renderWallet();
            }

        } catch (error) {

            showToast(
                "Retrait impossible",
                error.message ||
                "Impossible de demander le retrait."
            );
        }
    }


    /* =====================================================
       PROFILE PAGE
       ===================================================== */

    async function renderProfile() {

        state.currentPage =
            "profile";


        await loadCurrentUser();


        if (!DOM.pageContainer) {
            return;
        }


        const user =
            state.user || {};


        const firstName =
            user.first_name ||
            "Utilisateur";


        const lastName =
            user.last_name ||
            "";


        const username =
            user.username
                ? `@${String(
                    user.username
                ).replace(
                    /^@/,
                    ""
                )}`
                : "Telegram";


        const photo =
            user.photo_url ||
            "";


        DOM.pageContainer.innerHTML = `

            <section class="profile-page">

                <div class="profile-header">

                    <div class="profile-avatar-large">

                        ${
                            photo
                                ? `
                                    <img
                                        src="${escapeHTML(
                                            photo
                                        )}"
                                        alt="${escapeHTML(
                                            firstName
                                        )}"
                                    >
                                `
                                : `
                                    ${ICONS.user}
                                `
                        }

                    </div>


                    <div class="profile-identity">

                        <h1>
                            ${escapeHTML(
                                `${firstName} ${lastName}`.trim()
                            )}
                        </h1>

                        <p>
                            ${escapeHTML(
                                username
                            )}
                        </p>

                    </div>

                </div>


                <div class="profile-menu">

                    <button
                        type="button"
                        class="profile-menu-item"
                        data-action="my-listings"
                    >

                        ${ICONS.channel}

                        <span>
                            Mes annonces
                        </span>

                        ${ICONS.arrow}

                    </button>


                    <button
                        type="button"
                        class="profile-menu-item"
                        data-action="transactions"
                    >

                        ${ICONS.transaction}

                        <span>
                            Mes transactions
                        </span>

                        ${ICONS.arrow}

                    </button>


                    <button
                        type="button"
                        class="profile-menu-item"
                        data-action="favorites"
                    >

                        ${ICONS.heart}

                        <span>
                            Mes favoris
                        </span>

                        ${ICONS.arrow}

                    </button>


                    <button
                        type="button"
                        class="profile-menu-item"
                        data-action="support"
                    >

                        ${ICONS.help}

                        <span>
                            Support
                        </span>

                        ${ICONS.arrow}

                    </button>


                    <button
                        type="button"
                        class="profile-menu-item"
                        data-action="about"
                    >

                        ${ICONS.info}

                        <span>
                            À propos de NexMarket
                        </span>

                        ${ICONS.arrow}

                    </button>

                </div>

            </section>
        `;


        bindProfileActions();
    }
        try {

            showLoading(
                "Vérification du canal..."
            );


            const data =
                await apiRequest(
                    "/listings",
                    {
                        method: "POST",

                        body:
                            JSON.stringify({
                                username,

                                category,

                                country,

                                language,

                                price,

                                currency:
                                    state.user?.currency ||
                                    "XAF",

                                description
                            })
                    }
                );


            const listing =
                data?.listing ||
                data;


            showToast(
                "Annonce envoyée",
                "Ton canal a été envoyé pour vérification."
            );


            await loadMyListings();


            await renderSell();


        } catch (error) {

            await renderSell();


            showToast(
                "Vente impossible",
                error.message ||
                "Impossible de créer cette annonce."
            );
        }
    }


    /* =====================================================
       MY LISTING
    ===================================================== */

    function renderMyListing(
        listing
    ) {

        const status =
            listing.status ||
            "pending";


        const statusLabels = {

            pending:
                "En attente",

            approved:
                "Publiée",

            rejected:
                "Refusée",

            sold:
                "Vendue",

            cancelled:
                "Annulée"
        };


        const statusLabel =
            statusLabels[
                status
            ] ||
            status;


        return `

            <article
                class="channel-listing my-listing"
                data-listing-id="${escapeHTML(
                    listing.id
                )}"
            >

                <div class="listing-main">

                    <div class="listing-image">

                        ${
                            listing.photo_url
                                ? `
                                    <img
                                        src="${escapeHTML(
                                            listing.photo_url
                                        )}"
                                        alt="${escapeHTML(
                                            listing.title ||
                                            "Canal"
                                        )}"
                                        loading="lazy"
                                    >
                                `
                                : `
                                    <div class="listing-image-placeholder">
                                        ${ICONS.channel}
                                    </div>
                                `
                        }

                    </div>


                    <div class="listing-content">

                        <div class="listing-top">

                            <div>

                                <span class="listing-category">
                                    ${escapeHTML(
                                        listing.category ||
                                        "Other"
                                    )}
                                </span>


                                <h3>
                                    ${escapeHTML(
                                        listing.title ||
                                        listing.name ||
                                        "Canal Telegram"
                                    )}
                                </h3>


                                <span class="listing-username">
                                    ${
                                        listing.username
                                            ? `@${escapeHTML(
                                                String(
                                                    listing.username
                                                ).replace(
                                                    /^@/,
                                                    ""
                                                )
                                            )}`
                                            : ""
                                    }
                                </span>

                            </div>

                        </div>


                        <div class="listing-status ${escapeHTML(
                            status
                        )}">

                            ${escapeHTML(
                                statusLabel
                            )}

                        </div>


                        <div class="listing-bottom">

                            <strong class="listing-price">
                                ${formatMoney(
                                    listing.price || 0,
                                    listing.currency ||
                                    "XAF"
                                )}
                            </strong>


                            ${
                                status ===
                                "pending"
                                    ? `
                                        <button
                                            type="button"
                                            class="listing-view-button"
                                            data-action="listing-status"
                                            data-listing-id="${escapeHTML(
                                                listing.id
                                            )}"
                                        >
                                            Vérification
                                            ${ICONS.arrow}
                                        </button>
                                    `
                                    : ""
                            }

                        </div>

                    </div>

                </div>

            </article>

        `;
    }


    /* =====================================================
       MY LISTING ACTIONS
    ===================================================== */

    function bindMyListingActions() {

        document
            .querySelectorAll(
                '[data-action="listing-status"]'
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        async () => {

                            const id =
                                button.dataset
                                    .listingId;


                            if (!id) {
                                return;
                            }


                            try {

                                const data =
                                    await apiRequest(
                                        `/listings/${id}`
                                    );


                                const listing =
                                    normalizeListing(
                                        data?.listing ||
                                        data
                                    );


                                openModal(`

                                    <div class="listing-status-detail">

                                        <span class="section-kicker">
                                            VÉRIFICATION
                                        </span>

                                        <h2>
                                            ${
                                                escapeHTML(
                                                    listing.title ||
                                                    "Ton canal"
                                                )
                                            }
                                        </h2>


                                        <div class="status-detail-card">

                                            <span>
                                                Statut
                                            </span>

                                            <strong>
                                                ${
                                                    escapeHTML(
                                                        listing.status ||
                                                        "pending"
                                                    )
                                                }
                                            </strong>

                                        </div>


                                        <p>
                                            Ton annonce doit être
                                            validée par l'équipe
                                            NexMarket avant d'être
                                            visible sur le marketplace.
                                        </p>

                                    </div>

                                `);

                            } catch (error) {

                                showToast(
                                    "Erreur",
                                    error.message ||
                                    "Impossible de récupérer le statut."
                                );
                            }
                        }
                    );

                }
            );
    }


    /* =====================================================
       PROFILE ACTIONS
    ===================================================== */

    function bindProfileActions() {

        document
            .querySelectorAll(
                '[data-action="my-listings"]'
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            renderSell();

                        }
                    );
                }
            );


        document
            .querySelectorAll(
                '[data-action="transactions"]'
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            renderTransactions();

                        }
                    );
                }
            );


        document
            .querySelectorAll(
                '[data-action="favorites"]'
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            renderFavorites();

                        }
                    );
                }
            );


        document
            .querySelectorAll(
                '[data-action="support"]'
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        openSupport
                    );

                }
            );


        document
            .querySelectorAll(
                '[data-action="about"]'
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        openAbout
                    );

                }
            );
    }


    /* =====================================================
       TRANSACTIONS PAGE
    ===================================================== */

    async function renderTransactions() {

        state.currentPage =
            "transactions";


        showLoading(
            "Chargement des transactions..."
        );


        await loadTransactions();


        if (!DOM.pageContainer) {
            return;
        }


        DOM.pageContainer.innerHTML = `

            <section class="transactions-page">

                <div class="page-heading">

                    <span class="section-kicker">
                        ACTIVITÉ
                    </span>

                    <h1>
                        Mes transactions
                    </h1>

                    <p>
                        Suis tes achats, ventes et
                        mouvements de portefeuille.
                    </p>

                </div>


                <div class="transaction-list">

                    ${
                        state.transactions.length
                            ? state.transactions
                                .map(
                                    renderTransaction
                                )
                                .join("")
                            : showEmpty(
                                "Aucune transaction",
                                "Tes transactions apparaîtront ici.",
                                ICONS.transaction
                            )
                    }

                </div>

            </section>

        `;


        bindTransactionActions();
    }

                        <div class="transaction-summary">

                        <div>

                            <span>
                                Canal
                            </span>

                            <strong>
                                ${
                                    escapeHTML(
                                        transaction.listing_title ||
                                        "Canal Telegram"
                                    )
                                }
                            </strong>

                        </div>


                        <div>

                            <span>
                                Montant
                            </span>

                            <strong>
                                ${formatMoney(
                                    amount,
                                    currency
                                )}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Statut
                            </span>

                            <strong>
                                ${escapeHTML(
                                    status
                                )}
                            </strong>

                        </div>

                    </div>


                    <div class="transaction-timeline">

                        <div class="timeline-step active">

                            <span>
                                1
                            </span>

                            <div>

                                <strong>
                                    Transaction créée
                                </strong>

                                <p>
                                    La transaction a été enregistrée.
                                </p>

                            </div>

                        </div>


                        <div class="timeline-step ${
                            [
                                "payment_confirmed",
                                "waiting_admin",
                                "assigned",
                                "transfer_pending",
                                "completed"
                            ].includes(status)
                                ? "active"
                                : ""
                        }">

                            <span>
                                2
                            </span>

                            <div>

                                <strong>
                                    Paiement sécurisé
                                </strong>

                                <p>
                                    Les fonds sont réservés
                                    pour la transaction.
                                </p>

                            </div>

                        </div>


                        <div class="timeline-step ${
                            [
                                "assigned",
                                "transfer_pending",
                                "completed"
                            ].includes(status)
                                ? "active"
                                : ""
                        }">

                            <span>
                                3
                            </span>

                            <div>

                                <strong>
                                    Transfert du canal
                                </strong>

                                <p>
                                    Le transfert est géré
                                    avec protection NexMarket.
                                </p>

                            </div>

                        </div>


                        <div class="timeline-step ${
                            status ===
                            "completed"
                                ? "active"
                                : ""
                        }">

                            <span>
                                4
                            </span>

                            <div>

                                <strong>
                                    Transaction terminée
                                </strong>

                                <p>
                                    Les fonds sont libérés
                                    selon les conditions de la transaction.
                                </p>

                            </div>

                        </div>

                    </div>


                    <div class="transaction-actions">

                        <button
                            type="button"
                            class="secondary-action full-width"
                            data-action="transaction-messages"
                            data-transaction-id="${escapeHTML(
                                transaction.id
                            )}"
                        >

                            ${ICONS.message}

                            Ouvrir la discussion

                        </button>


                        ${
                            [
                                "pending_payment",
                                "payment_confirmed",
                                "waiting_admin",
                                "assigned",
                                "transfer_pending"
                            ].includes(status)
                                ? `
                                    <button
                                        type="button"
                                        class="primary-action full-width"
                                        data-action="refresh-transaction"
                                        data-transaction-id="${escapeHTML(
                                            transaction.id
                                        )}"
                                    >
                                        ${ICONS.refresh}

                                        Actualiser
                                    </button>
                                `
                                : ""
                        }

                    </div>

                </div>
            `);


            document
                .querySelector(
                    '[data-action="refresh-transaction"]'
                )
                ?.addEventListener(
                    "click",
                    async event => {

                        await openTransaction(
                            event.currentTarget
                                .dataset
                                .transactionId
                        );

                    }
                );


            document
                .querySelector(
                    '[data-action="transaction-messages"]'
                )
                ?.addEventListener(
                    "click",
                    event => {

                        const id =
                            event.currentTarget
                                .dataset
                                .transactionId;


                        closeModal();


                        renderMessages(
                            id
                        );
                    }
                );


        } catch (error) {

            showToast(
                "Erreur",
                error.message ||
                "Impossible de charger la transaction."
            );
        }
    }


    /* =====================================================
       TRANSACTION ACTIONS
    ===================================================== */

    function bindTransactionActions() {

        document
            .querySelectorAll(
                '[data-action="open-transaction"]'
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            openTransaction(
                                button.dataset
                                    .transactionId
                            );

                        }
                    );

                }
            );
    }


    /* =====================================================
       FAVORITES PAGE
    ===================================================== */

    async function renderFavorites() {

        state.currentPage =
            "favorites";


        showLoading(
            "Chargement des favoris..."
        );


        await loadFavorites();


        if (!DOM.pageContainer) {
            return;
        }


        const favoriteIds =
            state.favorites.map(
                favorite =>
                    Number(
                        favorite.listing_id
                    )
            );


        let listings = [];


        try {

            const data =
                await apiRequest(
                    "/listings"
                );


            const raw =
                Array.isArray(data)
                    ? data
                    : (
                        data.items ||
                        data.listings ||
                        []
                    );


            listings =
                raw
                    .map(
                        normalizeListing
                    )
                    .filter(
                        listing =>
                            favoriteIds.includes(
                                Number(
                                    listing.id
                                )
                            )
                    );

        } catch (error) {

            console.warn(
                "Favoris annonces:",
                error.message
            );

        }


        DOM.pageContainer.innerHTML = `

            <section class="favorites-page">

                <div class="page-heading">

                    <span class="section-kicker">
                        MES FAVORIS
                    </span>

                    <h1>
                        Favoris
                    </h1>

                    <p>
                        Retrouve les canaux que tu
                        souhaites garder sous la main.
                    </p>

                </div>


                <div class="listing-feed">

                    ${
                        listings.length
                            ? renderListingFeed(
                                listings
                            )
                            : showEmpty(
                                "Aucun favori",
                                "Ajoute des canaux à tes favoris pour les retrouver ici.",
                                ICONS.heart
                            )
                    }

                </div>

            </section>

        `;


        bindPageActions();
    }


    /* =====================================================
       SUPPORT
    ===================================================== */

    function openSupport() {

        openModal(`

            <div class="support-modal">

                <span class="section-kicker">
                    NEXMARKET
                </span>

                <h2>
                    Support
                </h2>

                <p>
                    Une question concernant un achat,
                    une vente ou une transaction ?
                </p>


                <div class="support-card">

                    ${ICONS.message}

                    <div>

                        <strong>
                            Besoin d'aide ?
                        </strong>

                        <span>
                            Contacte l'équipe NexMarket
                            pour obtenir de l'assistance.
                        </span>

                    </div>

                </div>


                <button
                    type="button"
                    class="primary-action full-width"
                    data-action="open-support-chat"
                >

                    ${ICONS.message}

                    Contacter le support

                </button>

            </div>

        `);


        document
            .querySelector(
                '[data-action="open-support-chat"]'
            )
            ?.addEventListener(
                "click",
                () => {

                    closeModal();


                    if (tg) {

                        tg.openTelegramLink(
                            "https://t.me/Nexa_CG"
                        );

                    } else {

                        window.open(
                            "https://t.me/Nexa_CG",
                            "_blank"
                        );

                    }

                }
            );
    }


    /* =====================================================
       ABOUT
    ===================================================== */

    function openAbout() {

        openModal(`

            <div class="about-modal">

                <div class="about-logo">
                    ${ICONS.logo}
                </div>


                <span class="section-kicker">
                    NEXMARKET
                </span>


                <h2>
                    NexMarket
                </h2>


                <p>
                    Marketplace sécurisé pour acheter
                    et vendre des canaux Telegram.
                </p>


                <div class="about-info">

                    <div>

                        <span>
                            Propriétaire
                        </span>

                        <strong>
                            NEXA
                        </strong>

                    </div>


                    <div>

                        <span>
                            Version
                        </span>

                        <strong>
                            1.0
                        </strong>

                    </div>

                </div>


                <p class="about-footer">
                    Propulsé par NEXA
                </p>

            </div>

        `);
    }

    function openSettings() {

        const user =
            state.user || {};


        openModal(`
            <div class="settings-modal">

                <div class="modal-header-content">

                    <div>

                        <span class="section-kicker">
                            NEXMARKET
                        </span>

                        <h2>
                            Paramètres
                        </h2>

                    </div>

                </div>


                <div class="settings-list">

                    <button
                        type="button"
                        class="settings-item"
                        data-action="settings-language"
                    >

                        ${ICONS.user}

                        <div>

                            <strong>
                                Langue
                            </strong>

                            <span>
                                ${
                                    user.language ||
                                    "Français"
                                }
                            </span>

                        </div>

                        ${ICONS.arrow}

                    </button>


                    <button
                        type="button"
                        class="settings-item"
                        data-action="settings-currency"
                    >

                        ${ICONS.wallet}

                        <div>

                            <strong>
                                Devise
                            </strong>

                            <span>
                                ${
                                    user.currency ||
                                    "XAF"
                                }
                            </span>

                        </div>

                        ${ICONS.arrow}

                    </button>


                    <button
                        type="button"
                        class="settings-item"
                        data-action="settings-theme"
                    >

                        ${ICONS.settings}

                        <div>

                            <strong>
                                Apparence
                            </strong>

                            <span>
                                Thème NexMarket
                            </span>

                        </div>

                        ${ICONS.arrow}

                    </button>


                    <button
                        type="button"
                        class="settings-item"
                        data-action="about"
                    >

                        ${ICONS.info}

                        <div>

                            <strong>
                                À propos
                            </strong>

                            <span>
                                NexMarket
                            </span>

                        </div>

                        ${ICONS.arrow}

                    </button>


                    <button
                        type="button"
                        class="settings-item"
                        data-action="support"
                    >

                        ${ICONS.message}

                        <div>

                            <strong>
                                Support
                            </strong>

                            <span>
                                Besoin d'aide ?
                            </span>

                        </div>

                        ${ICONS.arrow}

                    </button>

                </div>

            </div>
        `);


        document
            .querySelector(
                '[data-action="settings-language"]'
            )
            ?.addEventListener(
                "click",
                () => {

                    openLanguageSettings();

                }
            );


        document
            .querySelector(
                '[data-action="settings-currency"]'
            )
            ?.addEventListener(
                "click",
                () => {

                    openCurrencySettings();

                }
            );


        document
            .querySelector(
                '[data-action="settings-theme"]'
            )
            ?.addEventListener(
                "click",
                () => {

                    openThemeSettings();

                }
            );


        document
            .querySelector(
                '[data-action="about"]'
            )
            ?.addEventListener(
                "click",
                () => {

                    openAbout();

                }
            );


        document
            .querySelector(
                '[data-action="support"]'
            )
            ?.addEventListener(
                "click",
                () => {

                    openSupport();

                }
            );
    }


    /* =====================================================
       LANGUAGE SETTINGS
    ===================================================== */

    function openLanguageSettings() {

        openModal(`

            <div class="settings-modal">

                <div class="modal-header-content">

                    <div>

                        <span class="section-kicker">
                            PARAMÈTRES
                        </span>

                        <h2>
                            Langue
                        </h2>

                    </div>

                </div>


                <div class="settings-options">

                    <button
                        type="button"
                        class="settings-option"
                        data-language="fr"
                    >

                        Français

                    </button>


                    <button
                        type="button"
                        class="settings-option"
                        data-language="en"
                    >

                        English

                    </button>

                </div>

            </div>

        `);


        document
            .querySelectorAll(
                "[data-language]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            const language =
                                button.dataset
                                    .language;


                            if (state.user) {

                                state.user.language =
                                    language;
                            }


                            localStorage.setItem(
                                "nexmarket_language",
                                language
                            );


                            closeModal();


                            showToast(
                                "Langue enregistrée",
                                language === "fr"
                                    ? "Français sélectionné."
                                    : "English selected."
                            );

                        }
                    );

                }
            );
    }


    /* =====================================================
       CURRENCY SETTINGS
    ===================================================== */

    function openCurrencySettings() {

        openModal(`

            <div class="settings-modal">

                <div class="modal-header-content">

                    <div>

                        <span class="section-kicker">
                            PARAMÈTRES
                        </span>

                        <h2>
                            Devise
                        </h2>

                    </div>

                </div>


                <div class="settings-options">

                    <button
                        type="button"
                        class="settings-option"
                        data-currency="XAF"
                    >
                        XAF
                    </button>


                    <button
                        type="button"
                        class="settings-option"
                        data-currency="XOF"
                    >
                        XOF
                    </button>


                    <button
                        type="button"
                        class="settings-option"
                        data-currency="USD"
                    >
                        USD
                    </button>


                    <button
                        type="button"
                        class="settings-option"
                        data-currency="EUR"
                    >
                        EUR
                    </button>

                </div>

            </div>

        `);


        document
            .querySelectorAll(
                "[data-currency]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            const currency =
                                button.dataset
                                    .currency;


                            if (state.user) {

                                state.user.currency =
                                    currency;
                            }


                            localStorage.setItem(
                                "nexmarket_currency",
                                currency
                            );


                            closeModal();


                            showToast(
                                "Devise enregistrée",
                                `Devise sélectionnée : ${currency}`
                            );

                        }
                    );

                }
            );
    }


    /* =====================================================
       THEME SETTINGS
    ===================================================== */

    function openThemeSettings() {

        openModal(`

            <div class="settings-modal">

                <div class="modal-header-content">

                    <div>

                        <span class="section-kicker">
                            APPARENCE
                        </span>

                        <h2>
                            Thème
                        </h2>

                    </div>

                </div>


                <div class="settings-options">

                    <button
                        type="button"
                        class="settings-option"
                        data-theme="dark"
                    >
                        Sombre
                    </button>


                    <button
                        type="button"
                        class="settings-option"
                        data-theme="light"
                    >
                        Clair
                    </button>


                    <button
                        type="button"
                        class="settings-option"
                        data-theme="system"
                    >
                        Système
                    </button>

                </div>

            </div>

        `);


        document
            .querySelectorAll(
                "[data-theme]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            const theme =
                                button.dataset
                                    .theme;


                            applyTheme(
                                theme
                            );


                            localStorage.setItem(
                                "nexmarket_theme",
                                theme
                            );


                            closeModal();


                            showToast(
                                "Apparence enregistrée",
                                "Le thème NexMarket a été mis à jour."
                            );

                        }
                    );

                }
            );
    }


    /* =====================================================
       APPLY THEME
    ===================================================== */

    function applyTheme(
        theme
    ) {

        document.documentElement
            .dataset
            .theme =
            theme;


        if (
            theme === "dark"
        ) {

            document.body
                .classList
                .add(
                    "theme-dark"
                );

        } else {

            document.body
                .classList
                .remove(
                    "theme-dark"
                );
        }
    }

    function bindTransactionActions() {

        document
            .querySelectorAll(
                '[data-action="open-transaction"]'
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            openTransaction(
                                button.dataset
                                    .transactionId
                            );

                        }
                    );

                }
            );
    }


    /* =====================================================
       GLOBAL ACTION HANDLER
    ===================================================== */

    async function handleAction(
        event
    ) {

        const element =
            event.currentTarget;


        const action =
            element.dataset.action;


        switch (action) {

            case "home":

                await navigateTo(
                    "home"
                );

                break;


            case "buy":

                await navigateTo(
                    "buy"
                );

                break;


            case "sell":

                await navigateTo(
                    "sell"
                );

                break;


            case "wallet":

                await navigateTo(
                    "wallet"
                );

                break;


            case "profile":

                await navigateTo(
                    "profile"
                );

                break;


            case "messages":

                await navigateTo(
                    "messages"
                );

                break;


            case "transactions":

                await renderTransactions();

                break;


            case "favorites":

                await renderFavorites();

                break;


            case "settings":

                openSettings();

                break;


            case "about":

                openAbout();

                break;


            case "support":

                openSupport();

                break;


            case "deposit":

                openWalletDeposit();

                break;


            case "withdraw":

                openWalletWithdraw();

                break;


            case "filters":

                openFilters();

                break;


            case "view-listing":

                await openListing(
                    element.dataset
                        .listingId
                );

                break;


            case "favorite":

                await toggleFavorite(
                    element.dataset
                        .listingId
                );

                break;


            case "detail-favorite":

                await toggleFavorite(
                    element.dataset
                        .listingId
                );

                break;


            case "purchase":

                await purchaseListing(
                    element.dataset
                        .listingId
                );

                break;


            case "open-transaction":

                await openTransaction(
                    element.dataset
                        .transactionId
                );

                break;


            case "transaction-messages":

                await openMessages(
                    element.dataset
                        .transactionId
                );

                break;


            case "cancel-transaction":

                await cancelTransaction(
                    element.dataset
                        .transactionId
                );

                break;


            case "close-modal":

                closeModal();

                break;


            case "reset-filters":

                await resetFilters();

                break;


            case "apply-filters":

                await applyFilters();

                break;

        }
    }


    /* =====================================================
       TELEGRAM PROFILE
    ===================================================== */

    function updateTelegramProfile() {

        if (
            !state.user ||
            !tg
        ) {
            return;
        }


        try {

            if (
                tg.MainButton
            ) {

                tg.MainButton.hide();
            }


            if (
                state.user.first_name
            ) {

                document.body
                    .dataset
                    .userName =
                    state.user.first_name;
            }

        } catch (error) {

            console.warn(
                "Telegram profile:",
                error.message
            );
        }
    }


    /* =====================================================
       TELEGRAM INITIALIZATION
    ===================================================== */

    async function initializeTelegram() {

        if (!tg) {
            return;
        }


        try {

            tg.ready();

            tg.expand();


            if (
                tg.enableClosingConfirmation
            ) {

                tg.enableClosingConfirmation();
            }


            if (
                tg.setHeaderColor
            ) {

                tg.setHeaderColor(
                    "#0B0B0F"
                );
            }


            if (
                tg.setBackgroundColor
            ) {

                tg.setBackgroundColor(
                    "#0B0B0F"
                );
            }

        } catch (error) {

            console.warn(
                "Telegram initialization:",
                error.message
            );
        }
    }


    /* =====================================================
       APPLICATION INITIALIZATION
    ===================================================== */

    async function initApp() {

    /*
       Afficher immédiatement l'application.
       Aucun appel réseau ne doit empêcher
       la disparition du splash.
    */

    showApplication();
       
       setTimeout(() => {
       hideSplash();
       }, 2500);
       

    /*
       FAIL-SAFE SPLASH

       Le splash disparaîtra dans 2 secondes
       même si Render, Telegram ou l'API
       ne répondent pas.
    */

    setTimeout(() => {

        hideSplash();

    }, 2000);


    /*
       Initialisation de l'interface
    */

    try {

        initTelegram();

        setupHeader();

        setupBottomNavigation();

        setupModal();

    } catch (error) {

        console.error(
            "Erreur interface NexMarket:",
            error
        );

    }


    /*
       Charger l'utilisateur.

       Cette requête ne peut plus bloquer
       le splash.
    */

    try {

        await loadCurrentUser();

    } catch (error) {

        console.warn(
            "Utilisateur non chargé:",
            error
        );

    }


    /*
       Charger l'accueil.
    */

    try {

        await navigateTo("home");

    } catch (error) {

        console.error(
            "Erreur accueil NexMarket:",
            error
        );


        if (DOM.pageContainer) {

            DOM.pageContainer.innerHTML =
                showEmpty(
                    "NexMarket",
                    "Impossible de charger les annonces pour le moment.",
                    ICONS.help
                );

        }

    }

}


    /* =====================================================
       SPLASH SCREEN
    ===================================================== */

    function hideSplash() {

        const splash =
            document.getElementById(
                "splashScreen"
            );


        if (!splash) {
            return;
        }


        splash.classList.add(
            "hidden"
        );


        setTimeout(
            () => {

                splash.style.display =
                    "none";

            },
            500
        );
    }


    /* =====================================================
       BOTTOM NAVIGATION
    ===================================================== */

    function initializeBottomNavigation() {

        if (
            !DOM.bottomNavigation
        ) {
            return;
        }


        DOM.bottomNavigation
            .querySelectorAll(
                "[data-page]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        async () => {

                            const page =
                                button.dataset
                                    .page;


                            if (!page) {
                                return;
                            }


                            await navigateTo(
                                page
                            );

                        }
                    );

                }
            );
    }


    /* =====================================================
       FAQ BUTTON
    ===================================================== */

    function initializeFAQ() {

        if (
            !DOM.faqButton
        ) {
            return;
        }


        DOM.faqButton
            .addEventListener(
                "click",
                openFAQ
            );
    }


    /* =====================================================
       MODAL BACKDROP
    ===================================================== */

    if (
        DOM.modalBackdrop
    ) {

        DOM.modalBackdrop
            .addEventListener(
                "click",
                event => {

                    if (
                        event.target ===
                        DOM.modalBackdrop
                    ) {

                        closeModal();

                    }

                }
            );
    }


    /* =====================================================
       GLOBAL KEYBOARD
    ===================================================== */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                closeModal();

            }

        }
    );


    /* =====================================================
       START APP
    ===================================================== */

    initializeBottomNavigation();

    initializeFAQ();

    initializeApp();

})();


    
