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

            if (error instanceof TypeError && error.message === "Failed to fetch") {
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
                            ${ICONS.sell}
                            <span>
                                Vendre mon canal
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
                            Canaux disponibles
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
                        state.listings.slice(0, 8)
                    )}
                </div>

            </section>
        `;

        bindPageActions();
    }


    /* =====================================================
       LISTING FEED
    ===================================================== */

    function renderListingFeed(
        listings
    ) {

        if (
            !Array.isArray(listings) ||
            listings.length === 0
        ) {

            return showEmpty(
                "Aucun canal disponible",
                "Les nouvelles annonces apparaîtront ici.",
                ICONS.channel
            );
        }

        return listings
            .map(renderListing)
            .join("");
    }


    /* =====================================================
       LISTING
    ===================================================== */

    function renderListing(
        listing
    ) {

        const id =
            listing.id;

        const title =
            listing.title ||
            listing.name ||
            "Canal Telegram";

        const username =
            listing.username
                ? `@${String(
                    listing.username
                ).replace(/^@/, "")}`
                : "Canal Telegram";

        const description =
            listing.description ||
            "Canal Telegram disponible à la vente.";

        const category =
            listing.category ||
            "Other";

        const country =
            listing.country ||
            "—";

        const language =
            listing.language ||
            "—";

        const subscribers =
            listing.subscribers_count;

        const price =
            listing.price ??
            listing.locked_price ??
            0;

        const currency =
            listing.currency ||
            state.user?.currency ||
            "XAF";

        const photo =
            listing.photo_url ||
            listing.channel?.photo_url ||
            "";

        const isFavorite =
            state.favorites.some(
                favorite =>
                    Number(
                        favorite.listing_id
                    ) === Number(id)
            );

        return `
            <article
                class="channel-listing"
                data-listing-id="${escapeHTML(id)}"
            >

                <div class="listing-main">

                    <div class="listing-image">

                        ${
                            photo
                                ? `
                                    <img
                                        src="${escapeHTML(photo)}"
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

                            <div>

                                <span class="listing-category">
                                    ${escapeHTML(category)}
                                </span>

                                <h3>
                                    ${escapeHTML(title)}
                                </h3>

                                <span class="listing-username">
                                    ${escapeHTML(username)}
                                </span>

                            </div>


                            <button
                                class="favorite-button ${
                                    isFavorite
                                        ? "active"
                                        : ""
                                }"
                                type="button"
                                data-action="favorite"
                                data-listing-id="${escapeHTML(id)}"
                                aria-label="Favoris"
                            >
                                ${ICONS.heart}
                            </button>

                        </div>


                        <p class="listing-description">
                            ${escapeHTML(description)}
                        </p>


                        <div class="listing-meta">

                            <span>
                                ${ICONS.user}
                                ${
                                    subscribers !== null &&
                                    subscribers !== undefined
                                        ? formatNumber(
                                            subscribers
                                        )
                                        : "—"
                                }
                                abonnés
                            </span>

                            <span>
                                ${escapeHTML(country)}
                            </span>

                            <span>
                                ${escapeHTML(language)}
                            </span>

                        </div>


                        <div class="listing-bottom">

                            <strong class="listing-price">
                                ${formatMoney(
                                    price,
                                    currency
                                )}
                            </strong>

                            <button
                                class="listing-view-button"
                                type="button"
                                data-action="view-listing"
                                data-listing-id="${escapeHTML(id)}"
                            >
                                Voir
                                ${ICONS.arrow}
                            </button>

                        </div>

                    </div>

                </div>

            </article>
        `;
    }


    /* =====================================================
       PAGE BUY
    ===================================================== */

    async function renderBuy() {

        state.currentPage = "buy";

        showLoading(
            "Recherche des canaux..."
        );

        await Promise.all([
            loadListings(),
            loadFavorites()
        ]);

        if (!DOM.pageContainer) {
            return;
        }

        DOM.pageContainer.innerHTML = `
            <section class="buy-page">

                <div class="page-heading">

                    <span class="section-kicker">
                        MARKETPLACE
                    </span>

                    <h1>
                        Acheter
                    </h1>

                    <p>
                        Trouve un canal Telegram
                        correspondant à tes critères.
                    </p>

                </div>


                <div class="search-box">

                    <span class="search-icon">
                        ${ICONS.search}
                    </span>

                    <input
                        id="marketSearchInput"
                        type="search"
                        placeholder="Nom, @username, catégorie..."
                        value="${escapeHTML(
                            state.searchQuery
                        )}"
                        autocomplete="off"
                    >

                </div>


                <div class="filter-row">

                    <button
                        class="filter-button"
                        type="button"
                        data-action="filters"
                    >
                        ${ICONS.filter}
                        Filtres
                    </button>

                    <button
                        class="filter-chip ${
                            state.selectedCategory !== "all"
                                ? "active"
                                : ""
                        }"
                        type="button"
                        data-filter="category"
                    >
                        ${
                            state.selectedCategory === "all"
                                ? "Catégorie"
                                : escapeHTML(
                                    state.selectedCategory
                                )
                        }
                    </button>

                    <button
                        class="filter-chip ${
                            state.selectedCountry !== "all"
                                ? "active"
                                : ""
                        }"
                        type="button"
                        data-filter="country"
                    >
                        ${
                            state.selectedCountry === "all"
                                ? "Pays"
                                : escapeHTML(
                                    state.selectedCountry
                                )
                        }
                    </button>

                </div>


                <div class="listing-count">
                    ${
                        state.listings.length
                    }
                    annonce${
                        state.listings.length > 1
                            ? "s"
                            : ""
                    }
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

        bindBuyActions();
    }


    /* =====================================================
       SEARCH
    ===================================================== */

    function setupSearchInput() {

        const input =
            document.getElementById(
                "marketSearchInput"
            );

        if (!input) {
            return;
        }

        let timer = null;

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
                            state.selectedCountry === "all"
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
                            state.selectedLanguage === "all"
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

        state.selectedCategory = "all";
        state.selectedCountry = "all";
        state.selectedLanguage = "all";
        state.selectedSubscribers = "all";
        state.selectedPrice = "all";

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

                    currency: "XAF",

                    language: "fr"
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

            state.wallet = null;

            return null;
        }
    }


    /* =====================================================
       LOAD TRANSACTIONS
    ===================================================== */

    async function loadTransactions() {

        if (!state.user) {
            state.transactions = [];
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

            state.transactions = [];

            return [];
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
                "Favoris:",
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
                raw.map(
                    normalizeListing
                );

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

                <p>
                    ${escapeHTML(message)}
                </p>
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
                            <span>
                                canal Telegram.
                            </span>
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
                                Vendre mon canal
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
                            Canaux disponibles
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
                        state.listings.slice(
                            0,
                            8
                        )
                    )}
                </div>

            </section>
        `;

        bindPageActions();
    }


    /* =====================================================
       LISTING FEED
    ===================================================== */

    function renderListingFeed(
        listings
    ) {

        if (
            !Array.isArray(listings) ||
            listings.length === 0
        ) {

            return showEmpty(
                "Aucun canal disponible",
                "Les nouvelles annonces apparaîtront ici.",
                ICONS.channel
            );
        }

        return listings
            .map(renderListing)
            .join("");
    }


    /* =====================================================
       LISTING
    ===================================================== */

    function renderListing(
        listing
    ) {

        const id =
            listing.id;

        const title =
            listing.title ||
            listing.name ||
            "Canal Telegram";

        const username =
            listing.username
                ? `@${String(
                    listing.username
                ).replace(
                    /^@/,
                    ""
                )}`
                : "Canal Telegram";

        const description =
            listing.description ||
            "Canal Telegram disponible à la vente.";

        const category =
            listing.category ||
            "Other";

        const country =
            listing.country ||
            "—";

        const language =
            listing.language ||
            "—";

        const subscribers =
            listing.subscribers_count;

        const price =
            listing.price ??
            listing.locked_price ??
            0;

        const currency =
            listing.currency ||
            state.user?.currency ||
            "XAF";

        const photo =
            listing.photo_url ||
            listing.channel?.photo_url ||
            "";

        const isFavorite =
            state.favorites.some(
                favorite =>
                    Number(
                        favorite.listing_id
                    ) === Number(id)
            );

        return `
            <article
                class="channel-listing"
                data-listing-id="${escapeHTML(id)}"
            >

                <div class="listing-main">

                    <div class="listing-image">

                        ${
                            photo
                                ? `
                                    <img
                                        src="${escapeHTML(
                                            photo
                                        )}"
                                        alt="${escapeHTML(
                                            title
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
                                        category
                                    )}
                                </span>

                                <h3>
                                    ${escapeHTML(
                                        title
                                    )}
                                </h3>

                                <span class="listing-username">
                                    ${escapeHTML(
                                        username
                                    )}
                                </span>

                            </div>


                            <button
                                class="favorite-button ${
                                    isFavorite
                                        ? "active"
                                        : ""
                                }"
                                type="button"
                                data-action="favorite"
                                data-listing-id="${escapeHTML(
                                    id
                                )}"
                                aria-label="Favoris"
                            >
                                ${ICONS.heart}
                            </button>

                        </div>


                        <p class="listing-description">
                            ${escapeHTML(
                                description
                            )}
                        </p>


                        <div class="listing-meta">

                            <span>
                                ${ICONS.user}

                                ${
                                    subscribers !== null &&
                                    subscribers !== undefined
                                        ? formatNumber(
                                            subscribers
                                        )
                                        : "—"
                                }

                                abonnés
                            </span>


                            <span>
                                ${escapeHTML(
                                    country
                                )}
                            </span>


                            <span>
                                ${escapeHTML(
                                    language
                                )}
                            </span>

                        </div>


                        <div class="listing-bottom">

                            <strong class="listing-price">
                                ${formatMoney(
                                    price,
                                    currency
                                )}
                            </strong>


                            <button
                                class="listing-view-button"
                                type="button"
                                data-action="view-listing"
                                data-listing-id="${escapeHTML(
                                    id
                                )}"
                            >
                                Voir
                                ${ICONS.arrow}
                            </button>

                        </div>

                    </div>

                </div>

            </article>
        `;
    }


    /* =====================================================
       PAGE BUY
    ===================================================== */

    async function renderBuy() {

        state.currentPage = "buy";

        showLoading(
            "Recherche des canaux..."
        );

        await Promise.all([
            loadListings(),
            loadFavorites()
        ]);

        if (!DOM.pageContainer) {
            return;
        }

        DOM.pageContainer.innerHTML = `
            <section class="buy-page">

                <div class="page-heading">

                    <span class="section-kicker">
                        MARKETPLACE
                    </span>

                    <h1>
                        Acheter
                    </h1>

                    <p>
                        Trouve un canal Telegram
                        correspondant à tes critères.
                    </p>

                </div>


                <div class="search-box">

                    <span class="search-icon">
                        ${ICONS.search}
                    </span>

                    <input
                        id="marketSearchInput"
                        type="search"
                        placeholder="Nom, @username, catégorie..."
                        value="${escapeHTML(
                            state.searchQuery
                        )}"
                        autocomplete="off"
                    >

                </div>


                <div class="filter-row">

                    <button
                        class="filter-button"
                        type="button"
                        data-action="filters"
                    >
                        ${ICONS.filter}
                        Filtres
                    </button>


                    <button
                        class="filter-chip ${
                            state.selectedCategory !==
                            "all"
                                ? "active"
                                : ""
                        }"
                        type="button"
                        data-filter="category"
                    >
                        ${
                            state.selectedCategory ===
                            "all"
                                ? "Catégorie"
                                : escapeHTML(
                                    state.selectedCategory
                                )
                        }
                    </button>


                    <button
                        class="filter-chip ${
                            state.selectedCountry !==
                            "all"
                                ? "active"
                                : ""
                        }"
                        type="button"
                        data-filter="country"
                    >
                        ${
                            state.selectedCountry ===
                            "all"
                                ? "Pays"
                                : escapeHTML(
                                    state.selectedCountry
                                )
                        }
                    </button>

                </div>


                <div class="listing-count">

                    ${state.listings.length}

                    annonce${
                        state.listings.length >
                        1
                            ? "s"
                            : ""
                    }

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

        bindBuyActions();
    }

    /* =====================================================
       SEARCH
    ===================================================== */

    function setupSearchInput() {

        const input =
            document.getElementById(
                "marketSearchInput"
            );

        if (!input) {
            return;
        }

        let timer = null;

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
       LISTING DETAILS
    ===================================================== */

    async function openListing(
        listingId
    ) {

        if (!listingId) {
            return;
        }

        try {

            const data =
                await apiRequest(
                    `/listings/${listingId}`
                );

            const listing =
                normalizeListing(
                    data?.listing ||
                    data
                );

            await loadFavorites();

            const isFavorite =
                state.favorites.some(
                    favorite =>
                        Number(
                            favorite.listing_id
                        ) === Number(
                            listing.id
                        )
                );


            const title =
                listing.title ||
                "Canal Telegram";


            const username =
                listing.username
                    ? `@${String(
                        listing.username
                    ).replace(
                        /^@/,
                        ""
                    )}`
                    : "Canal Telegram";


            const photo =
                listing.photo_url ||
                "";


            const price =
                listing.price ??
                listing.locked_price ??
                0;


            const currency =
                listing.currency ||
                state.user?.currency ||
                "XAF";


            const sellerName =
                listing.seller?.first_name ||
                listing.seller_name ||
                "Vendeur";


            openModal(`
                <div class="listing-detail">

                    <div class="detail-image">

                        ${
                            photo
                                ? `
                                    <img
                                        src="${escapeHTML(
                                            photo
                                        )}"
                                        alt="${escapeHTML(
                                            title
                                        )}"
                                    >
                                `
                                : `
                                    <div class="detail-image-placeholder">
                                        ${ICONS.channel}
                                    </div>
                                `
                        }

                    </div>


                    <div class="detail-header">

                        <div>

                            <span class="listing-category">
                                ${escapeHTML(
                                    listing.category ||
                                    "Other"
                                )}
                            </span>

                            <h2>
                                ${escapeHTML(
                                    title
                                )}
                            </h2>

                            <p>
                                ${escapeHTML(
                                    username
                                )}
                            </p>

                        </div>


                        <button
                            class="favorite-button ${
                                isFavorite
                                    ? "active"
                                    : ""
                            }"
                            type="button"
                            data-action="detail-favorite"
                            data-listing-id="${escapeHTML(
                                listing.id
                            )}"
                        >
                            ${ICONS.heart}
                        </button>

                    </div>


                    <div class="detail-price">
                        ${formatMoney(
                            price,
                            currency
                        )}
                    </div>


                    <div class="detail-stats">

                        <div>

                            <strong>
                                ${
                                    listing.subscribers_count !==
                                    undefined
                                        ? formatNumber(
                                            listing.subscribers_count
                                        )
                                        : "—"
                                }
                            </strong>

                            <span>
                                Abonnés
                            </span>

                        </div>


                        <div>

                            <strong>
                                ${escapeHTML(
                                    listing.country ||
                                    "—"
                                )}
                            </strong>

                            <span>
                                Pays
                            </span>

                        </div>


                        <div>

                            <strong>
                                ${escapeHTML(
                                    listing.language ||
                                    "—"
                                )}
                            </strong>

                            <span>
                                Langue
                            </span>

                        </div>

                    </div>


                    <div class="detail-description">

                        <h3>
                            Description
                        </h3>

                        <p>
                            ${escapeHTML(
                                listing.description ||
                                "Aucune description fournie."
                            )}
                        </p>

                    </div>


                    <div class="verification-list">

                        <div>
                            ${ICONS.channel}

                            <span>
                                Canal vérifié
                            </span>

                            <strong>
                                ${
                                    listing.telegram_verified
                                        ? "Oui"
                                        : "En attente"
                                }
                            </strong>
                        </div>


                        <div>
                            ${ICONS.lock}

                            <span>
                                Vérification NexMarket
                            </span>

                            <strong>
                                ${
                                    listing.bot_is_admin
                                        ? "Active"
                                        : "En attente"
                                }
                            </strong>
                        </div>

                    </div>


                    <div class="seller-info">

                        <span>
                            Vendeur
                        </span>

                        <strong>
                            ${escapeHTML(
                                sellerName
                            )}
                        </strong>

                    </div>


                    <button
                        class="primary-action full-width"
                        type="button"
                        data-action="purchase"
                        data-listing-id="${escapeHTML(
                            listing.id
                        )}"
                    >
                        ${ICONS.cart}

                        Acheter ce canal
                    </button>

                </div>
            `);


            document
                .querySelector(
                    '[data-action="detail-favorite"]'
                )
                ?.addEventListener(
                    "click",
                    async event => {

                        await toggleFavorite(
                            event.currentTarget
                                .dataset
                                .listingId
                        );

                        closeModal();

                        await openListing(
                            listing.id
                        );
                    }
                );


            document
                .querySelector(
                    '[data-action="purchase"]'
                )
                ?.addEventListener(
                    "click",
                    () => {

                        purchaseListing(
                            listing.id
                        );

                    }
                );

        } catch (error) {

            showToast(
                "Erreur",
                error.message ||
                "Impossible de charger cette annonce."
            );
        }
    }


    /* =====================================================
       FAVORITES
    ===================================================== */

    async function toggleFavorite(
        listingId
    ) {

        if (!state.user) {

            showToast(
                "Connexion requise",
                "Ouvre NexMarket depuis Telegram."
            );

            return;
        }


        const exists =
            state.favorites.some(
                favorite =>
                    Number(
                        favorite.listing_id
                    ) === Number(
                        listingId
                    )
            );


        try {

            if (exists) {

                await apiRequest(
                    `/favorites/${listingId}`,
                    {
                        method: "DELETE"
                    }
                );

                state.favorites =
                    state.favorites.filter(
                        favorite =>
                            Number(
                                favorite.listing_id
                            ) !== Number(
                                listingId
                            )
                    );


                showToast(
                    "Favori supprimé",
                    "L'annonce a été retirée de tes favoris."
                );

            } else {

                const data =
                    await apiRequest(
                        `/favorites/${listingId}`,
                        {
                            method: "POST"
                        }
                    );


                state.favorites.push(
                    data
                );


                showToast(
                    "Ajouté aux favoris",
                    "L'annonce a été ajoutée à tes favoris."
                );
            }


            if (
                state.currentPage ===
                "buy"
            ) {

                await renderBuy();
            }

        } catch (error) {

            showToast(
                "Erreur",
                error.message ||
                "Impossible de modifier les favoris."
            );
        }
    }


    /* =====================================================
       PURCHASE
    ===================================================== */

    async function purchaseListing(
        listingId
    ) {

        if (!state.user) {

            showToast(
                "Connexion requise",
                "Ouvre NexMarket depuis Telegram."
            );

            return;
        }


        if (!listingId) {
            return;
        }


        try {

            const wallet =
                await loadWallet();


            const available =
                Number(
                    wallet?.available_balance ??
                    wallet?.balance ??
                    0
                );


            const listing =
                state.listings.find(
                    item =>
                        Number(item.id) ===
                        Number(listingId)
                );


            const price =
                Number(
                    listing?.price || 0
                );


            if (
                price > 0 &&
                available < price
            ) {

                openWalletDeposit(
                    price - available
                );

                showToast(
                    "Solde insuffisant",
                    "Recharge ton portefeuille avant de continuer."
                );

                return;
            }


            const confirmed =
                window.confirm(
                    "Confirmer l'achat de ce canal ?"
                );


            if (!confirmed) {
                return;
            }


            closeModal();


            showLoading(
                "Création de la transaction..."
            );


            const data =
                await apiRequest(
                    "/transactions",
                    {
                        method: "POST",

                        body:
                            JSON.stringify({
                                listing_id:
                                    Number(
                                        listingId
                                    )
                            })
                    }
                );


            const transaction =
                data?.transaction ||
                data;


            showToast(
                "Transaction créée",
                "Les fonds sont maintenant réservés. Un administrateur va prendre en charge la transaction."
            );


            await loadTransactions();


            await openTransaction(
                transaction.id
            );

        } catch (error) {

            await renderBuy();

            showToast(
                "Achat impossible",
                error.message ||
                "La transaction n'a pas pu être créée."
            );
        }
    }


    /* =====================================================
       WALLET PAGE
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

        const wallet =
            state.wallet || {};


        const available =
            wallet.available_balance ??
            wallet.balance ??
            0;


        const blocked =
            wallet.blocked_balance ??
            0;


        const revenue =
            wallet.total_revenue ??
            0;


        const currency =
            wallet.currency ||
            state.user?.currency ||
            "XAF";


        DOM.pageContainer.innerHTML = `
            <section class="wallet-page">

                <div class="page-heading">

                    <span class="section-kicker">
                        MON PORTEFEUILLE
                    </span>

                    <h1>
                        Wallet
                    </h1>

                    <p>
                        Gère ton argent et tes transactions
                        NexMarket.
                    </p>

                </div>


                <div class="wallet-balance-panel">

                    <span>
                        Solde disponible
                    </span>

                    <strong>
                        ${formatMoney(
                            available,
                            currency
                        )}
                    </strong>

                    <div class="wallet-id">

                        NEXA ID

                        <b>
                            ${
                                state.user?.nexa_id ||
                                "—"
                            }
                        </b>

                    </div>

                </div>


                <div class="wallet-actions">

                    <button
                        class="primary-action"
                        type="button"
                        data-action="deposit"
                    >
                        ${ICONS.deposit}

                        Déposer
                    </button>


                    <button
                        class="secondary-action"
                        type="button"
                        data-action="withdraw"
                    >
                        ${ICONS.withdraw}

                        Retirer
                    </button>

                </div>


                <div class="wallet-stats">

                    <div>

                        <span>
                            Bloqué
                        </span>

                        <strong>
                            ${formatMoney(
                                blocked,
                                currency
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Revenus
                        </span>

                        <strong>
                            ${formatMoney(
                                revenue,
                                currency
                            )}
                        </strong>

                    </div>

                </div>


                <div class="wallet-info">

                    ${ICONS.lock}

                    <div>

                        <strong>
                            Paiements sécurisés
                        </strong>

                        <p>
                            Les fonds utilisés pour un achat
                            sont réservés jusqu'à la fin
                            de la transaction.
                        </p>

                    </div>

                </div>

            </section>
        `;


        bindWalletActions();
    }


    /* =====================================================
       DEPOSIT
    ===================================================== */

    function openWalletDeposit(
        suggestedAmount = ""
    ) {

        openModal(`
            <div class="modal-header-content">

                <div>

                    <span class="section-kicker">
                        PORTEFEUILLE
                    </span>

                    <h2>
                        Déposer de l'argent
                    </h2>

                </div>

            </div>


            <form
                id="depositForm"
                class="modal-form"
            >

                <label>
                    Montant

                    <input
                        id="depositAmount"
                        type="number"
                        min="1"
                        step="1"
                        placeholder="Ex : 5000"
                        value="${
                            suggestedAmount ||
                            ""
                        }"
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
                        Le paiement sera effectué
                        sur la page sécurisée
                        Money Fusion.
                    </small>

                </div>


                <button
                    type="submit"
                    class="primary-action full-width"
                >
                    ${ICONS.deposit}

                    Continuer
                </button>

            </form>
        `);


        document
            .getElementById(
                "depositForm"
            )
            ?.addEventListener(
                "submit",
                handleDepositSubmit
            );
    }


    async function handleDepositSubmit(
        event
    ) {

        event.preventDefault();


        const input =
            document.getElementById(
                "depositAmount"
            );


        const amount =
            Number(
                input?.value
            );


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


        try {

            const data =
                await apiRequest(
                    "/wallet/deposit",
                    {
                        method: "POST",

                        body:
                            JSON.stringify({
                                amount,
                                currency:
                                    state.user?.currency ||
                                    "XAF"
                            })
                    }
                );


            const url =
                data?.url ||
                data?.payment_url ||
                data?.redirect_url;


            if (url) {

                closeModal();

                if (tg) {

                    tg.openLink(
                        url
                    );

                } else {

                    window.location.href =
                        url;
                }

                return;
            }


            showToast(
                "Dépôt créé",
                data?.message ||
                "Suis les instructions pour terminer le paiement."
            );


        } catch (error) {

            showToast(
                "Dépôt impossible",
                error.message ||
                "Impossible de créer le paiement."
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
                        value="CG"
                        placeholder="Ex : CG"
                        maxlength="2"
                        required
                    >

                </label>


                <label>
                    Numéro de téléphone

                    <input
                        id="withdrawPhone"
                        type="tel"
                        placeholder="Ex : 06XXXXXXXX"
                        autocomplete="tel"
                        required
                    >

                </label>


                <div class="payment-provider">

                    <span>
                        Service de retrait
                    </span>

                    <strong>
                        Money Fusion
                    </strong>

                    <small>
                        Vérifie ton numéro avant
                        de confirmer le retrait.
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
            countryInput?.value
                ?.trim()
                .toUpperCase();


        const phone =
            phoneInput?.value
                ?.trim();


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


        if (
            !country ||
            country.length !== 2
        ) {

            showToast(
                "Pays invalide",
                "Utilise le code pays à deux lettres."
            );

            return;
        }


        if (!phone) {

            showToast(
                "Numéro requis",
                "Entre le numéro qui recevra le retrait."
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

                                currency:
                                    state.user?.currency ||
                                    "XAF",

                                country,

                                phone_number:
                                    phone
                            })
                    }
                );


            closeModal();

            await loadWallet();


            showToast(
                "Retrait créé",
                data?.message ||
                "La demande de retrait a été enregistrée."
            );


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
                "Impossible de créer la demande de retrait."
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


        await loadMyListings();


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
                        Ajoute ton canal Telegram,
                        vérifie-le puis propose ton prix.
                    </p>

                </div>


                <div class="sell-notice">

                    ${ICONS.lock}

                    <div>

                        <strong>
                            Vérification obligatoire
                        </strong>

                        <p>
                            Le bot NexMarket doit pouvoir
                            vérifier le canal avant que
                            ton annonce soit publiée.
                        </p>

                    </div>

                </div>


                <form
                    id="sellForm"
                    class="sell-form"
                >

                    <label>

                        Lien ou @username du canal

                        <input
                            id="sellUsername"
                            type="text"
                            placeholder="@moncanal"
                            required
                        >

                        <small>
                            Le canal doit être accessible
                            et tu dois en être administrateur.
                        </small>

                    </label>


                    <label>

                        Catégorie

                        <div class="nexa-category-picker">

                            <input
                                type="hidden"
                                id="sellCategory"
                                value=""
                            >

                            <button
                                type="button"
                                class="category-trigger"
                                id="sellCategoryTrigger"
                                aria-haspopup="dialog"
                                aria-expanded="false"
                            >
                                <span id="sellCategoryText">
                                    Choisir une catégorie
                                </span>

                                <span class="category-trigger-arrow">
                                    ↓
                                </span>
                            </button>

                            <div
                                class="category-panel hidden"
                                id="sellCategoryPanel"
                                role="dialog"
                                aria-label="Choisir une catégorie"
                            >

                                <div class="category-panel-header">

                                    <div>
                                        <span>CATÉGORIE</span>
                                        <strong>Choisir une catégorie</strong>
                                    </div>

                                    <button
                                        type="button"
                                        class="category-close"
                                        id="sellCategoryClose"
                                        aria-label="Fermer"
                                    >
                                        ×
                                    </button>

                                </div>

                                <div class="category-options">

                                    <button type="button" data-category="News">News</button>
                                    <button type="button" data-category="Sport">Sport</button>
                                    <button type="button" data-category="Entertainment">Entertainment</button>
                                    <button type="button" data-category="Games">Games</button>
                                    <button type="button" data-category="Education">Education</button>
                                    <button type="button" data-category="Business">Business</button>
                                    <button type="button" data-category="Tech">Tech</button>
                                    <button type="button" data-category="Commerce">Commerce</button>
                                    <button type="button" data-category="Music">Music</button>
                                    <button type="button" data-category="Creation">Creation</button>
                                    <button type="button" data-category="Community">Community</button>
                                    <button type="button" data-category="Other">Other</button>

                                </div>

                            </div>

                        </div>

                    </label>


                    <label>

                        Pays

                        <input
                            id="sellCountry"
                            type="text"
                            placeholder="Ex : Congo"
                            required
                        >

                    </label>


                    <label>

                        Langue

                        <input
                            id="sellLanguage"
                            type="text"
                            placeholder="Ex : Français"
                            value="Français"
                            required
                        >

                    </label>


                    <label>

                        Prix de vente

                        <input
                            id="sellPrice"
                            type="number"
                            min="1"
                            step="1"
                            placeholder="Ex : 50000"
                            required
                        >

                    </label>


                    <label>

                        Description

                        <textarea
                            id="sellDescription"
                            rows="5"
                            maxlength="3000"
                            placeholder="Présente ton canal aux acheteurs..."
                        ></textarea>

                    </label>


                    <button
                        type="submit"
                        class="primary-action full-width"
                    >

                        ${ICONS.sell}

                        Soumettre mon canal

                    </button>

                </form>


                <div class="my-listings-section">

                    <div class="section-header">

                        <div>

                            <span class="section-kicker">
                                MES ANNONCES
                            </span>

                            <h2>
                                Mes ventes
                            </h2>

                        </div>

                    </div>


                    <div
                        class="listing-feed"
                        id="myListingsFeed"
                    >
                        ${
                            state.myListings.length
                                ? state.myListings
                                    .map(
                                        renderMyListing
                                    )
                                    .join("")
                                : showEmpty(
                                    "Aucune annonce",
                                    "Tes annonces apparaîtront ici."
                                )
                        }
                    </div>

                </div>

            </section>
        `;


        setupCategoryPicker();

        document
            .getElementById(
                "sellForm"
            )
            ?.addEventListener(
                "submit",
                handleSellSubmit
            );


        bindMyListingActions();
    }


    /* =====================================================
       NEXMARKET CATEGORY PICKER
    ===================================================== */

    function setupCategoryPicker() {

        const trigger =
            document.getElementById("sellCategoryTrigger");

        const panel =
            document.getElementById("sellCategoryPanel");

        const closeButton =
            document.getElementById("sellCategoryClose");

        const hiddenInput =
            document.getElementById("sellCategory");

        const categoryText =
            document.getElementById("sellCategoryText");

        if (!trigger || !panel || !hiddenInput || !categoryText) {
            return;
        }

        function closePicker() {
            panel.classList.add("hidden");
            trigger.setAttribute("aria-expanded", "false");
            document.body.classList.remove("category-picker-open");
        }

        function openPicker() {
            panel.classList.remove("hidden");
            trigger.setAttribute("aria-expanded", "true");
            document.body.classList.add("category-picker-open");
        }

        trigger.addEventListener("click", () => {
            if (panel.classList.contains("hidden")) {
                openPicker();
            } else {
                closePicker();
            }
        });

        closeButton?.addEventListener("click", closePicker);

        panel.querySelectorAll("[data-category]").forEach(option => {

            option.addEventListener("click", () => {

                const value = option.dataset.category;

                if (!value) {
                    return;
                }

                hiddenInput.value = value;
                categoryText.textContent = value;
                trigger.classList.add("selected");

                panel.querySelectorAll("[data-category]").forEach(item => {
                    item.classList.toggle(
                        "active",
                        item.dataset.category === value
                    );
                });

                closePicker();
            });

        });

        document.addEventListener("keydown", event => {
            if (
                event.key === "Escape" &&
                !panel.classList.contains("hidden")
            ) {
                closePicker();
            }
        });
    }


    /* =====================================================
       CREATE SELLING LISTING
    ===================================================== */

    async function handleSellSubmit(
        event
    ) {

        event.preventDefault();


        const usernameInput =
            document.getElementById(
                "sellUsername"
            );


        const categoryInput =
            document.getElementById(
                "sellCategory"
            );


        const countryInput =
            document.getElementById(
                "sellCountry"
            );


        const languageInput =
            document.getElementById(
                "sellLanguage"
            );


        const priceInput =
            document.getElementById(
                "sellPrice"
            );


        const descriptionInput =
            document.getElementById(
                "sellDescription"
            );


        const username =
            usernameInput?.value.trim();


        const category =
            categoryInput?.value;


        const country =
            countryInput?.value.trim();


        const language =
            languageInput?.value.trim();


        const price =
            Number(
                priceInput?.value
            );


        const description =
            descriptionInput?.value.trim() ||
            "";


        if (!username) {

            showToast(
                "Canal requis",
                "Entre le @username ou le lien du canal."
            );

            return;
        }


        if (!category) {

            showToast(
                "Catégorie requise",
                "Choisis une catégorie."
            );

            return;
        }


        if (!country) {

            showToast(
                "Pays requis",
                "Indique le pays du canal."
            );

            return;
        }


        if (!language) {

            showToast(
                "Langue requise",
                "Indique la langue principale."
            );

            return;
        }


        if (
            !Number.isFinite(price) ||
            price <= 0
        ) {

            showToast(
                "Prix invalide",
                "Entre un prix supérieur à zéro."
            );

            return;
        }


        try {

            showLoading(
                "Vérification du canal..."
            );


            /*
             * ÉTAPE 1
             * Création / vérification du canal.
             */

            const channelData =
                await apiRequest(
                    "/channels",
                    {
                        method: "POST",

                        body:
                            JSON.stringify({
                                username,

                                category,

                                country,

                                language,

                                description
                            })
                    }
                );


            const channel =
                channelData?.channel ||
                channelData;


            const channelId =
                channel?.id ||
                channelData?.channel_id;


            if (!channelId) {

                throw new Error(
                    "Le backend n'a pas retourné l'identifiant du canal."
                );
            }


            /*
             * ÉTAPE 2
             * Création de l'annonce.
             */

            const listingData =
                await apiRequest(
                    "/listings",
                    {
                        method: "POST",

                        body:
                            JSON.stringify({
                                channel_id:
                                    Number(
                                        channelId
                                    ),

                                price,

                                description
                            })
                    }
                );


            closeModal();


            await loadMyListings();


            showToast(
                "Annonce envoyée",
                listingData?.message ||
                "Ton annonce est maintenant en attente de validation."
            );


            await renderSell();


        } catch (error) {

            await renderSell();


            showToast(
                "Publication impossible",
                error.message ||
                "Impossible de publier cette annonce."
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

            available:
                "Disponible",

            reserved:
                "Réservé",

            sold:
                "Vendu",

            rejected:
                "Refusé",

            cancelled:
                "Annulé",

            archived:
                "Archivé"
        };


        const title =
            listing.title ||
            listing.name ||
            "Canal Telegram";


        const price =
            listing.price ??
            0;


        const currency =
            listing.currency ||
            state.user?.currency ||
            "XAF";


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
                                            title
                                        )}"
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
                                        statusLabels[
                                            status
                                        ] ||
                                        status
                                    )}
                                </span>

                                <h3>
                                    ${escapeHTML(
                                        title
                                    )}
                                </h3>

                            </div>

                        </div>


                        <div class="listing-bottom">

                            <strong class="listing-price">
                                ${formatMoney(
                                    price,
                                    currency
                                )}
                            </strong>


                            ${
                                status ===
                                "available"
                                    ? `
                                        <button
                                            class="listing-view-button"
                                            type="button"
                                            data-action="edit-listing"
                                            data-listing-id="${escapeHTML(
                                                listing.id
                                            )}"
                                        >
                                            Modifier
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
       EDIT LISTING
    ===================================================== */

    async function openEditListing(
        listingId
    ) {

        const listing =
            state.myListings.find(
                item =>
                    Number(item.id) ===
                    Number(listingId)
            );


        if (!listing) {

            showToast(
                "Annonce introuvable",
                "Impossible de trouver cette annonce."
            );

            return;
        }


        openModal(`
            <div class="modal-header-content">

                <div>

                    <span class="section-kicker">
                        MON ANNONCE
                    </span>

                    <h2>
                        Modifier le prix
                    </h2>

                </div>

            </div>


            <form
                id="editListingForm"
                class="modal-form"
            >

                <div class="form-static-value">

                    <span>
                        Canal
                    </span>

                    <strong>
                        ${escapeHTML(
                            listing.title ||
                            listing.name ||
                            "Canal Telegram"
                        )}
                    </strong>

                </div>


                <label>

                    Nouveau prix

                    <input
                        id="editListingPrice"
                        type="number"
                        min="1"
                        step="1"
                        value="${escapeHTML(
                            listing.price ||
                            ""
                        )}"
                        required
                    >

                </label>


                <label>

                    Description

                    <textarea
                        id="editListingDescription"
                        rows="5"
                        maxlength="3000"
                    >${escapeHTML(
                        listing.description ||
                        ""
                    )}</textarea>

                </label>


                <div class="edit-warning">

                    ${ICONS.lock}

                    <p>
                        Après modification, l'annonce
                        pourra repasser en validation
                        avant sa publication.
                    </p>

                </div>


                <div class="modal-actions">

                    <button
                        type="button"
                        class="secondary-action"
                        data-action="close-modal"
                    >
                        Annuler
                    </button>


                    <button
                        type="submit"
                        class="primary-action"
                    >
                        Enregistrer
                    </button>

                </div>

            </form>
        `);


        document
            .getElementById(
                "editListingForm"
            )
            ?.addEventListener(
                "submit",
                async event => {

                    event.preventDefault();


                    const price =
                        Number(
                            document
                                .getElementById(
                                    "editListingPrice"
                                )
                                ?.value
                        );


                    const description =
                        document
                            .getElementById(
                                "editListingDescription"
                            )
                            ?.value
                            ?.trim() ||
                        "";


                    if (
                        !Number.isFinite(price) ||
                        price <= 0
                    ) {

                        showToast(
                            "Prix invalide",
                            "Entre un prix supérieur à zéro."
                        );

                        return;
                    }


                    try {

                        await apiRequest(
                            `/listings/${listingId}`,
                            {
                                method: "PATCH",

                                body:
                                    JSON.stringify({
                                        price,
                                        description
                                    })
                            }
                        );


                        closeModal();

                        showToast(
                            "Annonce modifiée",
                            "La modification a été enregistrée."
                        );


                        await renderSell();


                    } catch (error) {

                        showToast(
                            "Modification impossible",
                            error.message ||
                            "Impossible de modifier l'annonce."
                        );
                    }
                }
            );
    }


    /* =====================================================
       CANCEL LISTING
    ===================================================== */

    async function cancelListing(
        listingId
    ) {

        const confirmed =
            window.confirm(
                "Veux-tu vraiment annuler cette annonce ?"
            );


        if (!confirmed) {
            return;
        }


        try {

            await apiRequest(
                `/listings/${listingId}/cancel`,
                {
                    method: "POST"
                }
            );


            showToast(
                "Annonce annulée",
                "L'annonce a été retirée de la marketplace."
            );


            await renderSell();


        } catch (error) {

            showToast(
                "Action impossible",
                error.message ||
                "Impossible d'annuler l'annonce."
            );
        }
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
                        Transactions
                    </h1>

                    <p>
                        Consulte tes achats et tes ventes.
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
                                ICONS.message
                            )
                    }

                </div>

            </section>
        `;


        bindTransactionActions();
    }


    /* =====================================================
       TRANSACTION ITEM
    ===================================================== */

    function renderTransaction(
        transaction
    ) {

        const status =
            transaction.status ||
            "pending_payment";


        const statusLabels = {

            pending_payment:
                "Paiement en attente",

            payment_confirmed:
                "Paiement confirmé",

            waiting_admin:
                "En attente d'un administrateur",

            assigned:
                "Administrateur assigné",

            transfer_pending:
                "Transfert en cours",

            completed:
                "Terminée",

            cancelled:
                "Annulée",

            disputed:
                "Litige",

            refunded:
                "Remboursée"
        };


        const amount =
            transaction.channel_price ??
            transaction.total_buyer_amount ??
            0;


        const currency =
            transaction.currency ||
            state.user?.currency ||
            "XAF";


        const reference =
            transaction.reference ||
            `TX-${transaction.id}`;


        return `
            <article
                class="transaction-item"
                data-transaction-id="${escapeHTML(
                    transaction.id
                )}"
            >

                <div class="transaction-icon">
                    ${ICONS.channel}
                </div>


                <div class="transaction-content">

                    <strong>
                        ${
                            transaction.listing_title ||
                            "Transaction NexMarket"
                        }
                    </strong>


                    <span>
                        ${escapeHTML(
                            reference
                        )}
                    </span>


                    <small>
                        ${escapeHTML(
                            statusLabels[
                                status
                            ] ||
                            status
                        )}
                    </small>

                </div>


                <div class="transaction-amount">

                    <strong>
                        ${formatMoney(
                            amount,
                            currency
                        )}
                    </strong>


                    <button
                        type="button"
                        class="text-button"
                        data-action="open-transaction"
                        data-transaction-id="${escapeHTML(
                            transaction.id
                        )}"
                    >
                        Voir
                        ${ICONS.arrow}
                    </button>

                </div>

            </article>
        `;
    }


    /* =====================================================
       OPEN TRANSACTION
    ===================================================== */

    async function openTransaction(
        transactionId
    ) {

        if (!transactionId) {
            return;
        }


        try {

            const data =
                await apiRequest(
                    `/transactions/${transactionId}`
                );


            const transaction =
                data?.transaction ||
                data;


            const status =
                transaction.status ||
                "pending_payment";


            const amount =
                transaction.channel_price ??
                transaction.total_buyer_amount ??
                0;


            const currency =
                transaction.currency ||
                state.user?.currency ||
                "XAF";


            openModal(`
                <div class="transaction-detail">

                    <div class="transaction-detail-header">

                        <span class="section-kicker">
                            TRANSACTION
                        </span>

                        <h2>
                            ${
                                transaction.reference ||
                                `TX-${transaction.id}`
                            }
                        </h2>

                    </div>


                    <div class="transaction-status">
                        ${escapeHTML(
                            status
                        )}
                    </div>


                    <div class="transaction-summary">

                        <div>

                            <span>
                                Prix du canal
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
                                Vendeur
                            </span>

                            <strong>
                                ${
                                    transaction.seller_name ||
                                    "Vendeur"
                                }
                            </strong>

                        </div>


                        <div>

                            <span>
                                Acheteur
                            </span>

                            <strong>
                                ${
                                    transaction.buyer_name ||
                                    "Acheteur"
                                }
                            </strong>

                        </div>

                    </div>


                    <div class="transaction-security">

                        ${ICONS.lock}

                        <div>

                            <strong>
                                Fonds sécurisés
                            </strong>

                            <p>
                                Les fonds restent réservés
                                pendant le traitement de la
                                transaction.
                            </p>

                        </div>

                    </div>


                    <button
                        class="primary-action full-width"
                        type="button"
                        data-action="transaction-messages"
                        data-transaction-id="${escapeHTML(
                            transaction.id
                        )}"
                    >
                        ${ICONS.message}

                        Ouvrir la discussion
                    </button>


                    ${
                        status !== "completed" &&
                        status !== "cancelled" &&
                        status !== "refunded"
                            ? `
                                <button
                                    class="secondary-action full-width"
                                    type="button"
                                    data-action="cancel-transaction"
                                    data-transaction-id="${escapeHTML(
                                        transaction.id
                                    )}"
                                >
                                    Annuler la transaction
                                </button>
                            `
                            : ""
                    }

                </div>
            `);


            document
                .querySelector(
                    '[data-action="transaction-messages"]'
                )
                ?.addEventListener(
                    "click",
                    () => {

                        openMessages(
                            transaction.id
                        );

                    }
                );


            document
                .querySelector(
                    '[data-action="cancel-transaction"]'
                )
                ?.addEventListener(
                    "click",
                    () => {

                        cancelTransaction(
                            transaction.id
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
       CANCEL TRANSACTION
    ===================================================== */

    async function cancelTransaction(
        transactionId
    ) {

        const confirmed =
            window.confirm(
                "Veux-tu vraiment annuler cette transaction ?"
            );


        if (!confirmed) {
            return;
        }


        try {

            await apiRequest(
                `/transactions/${transactionId}/cancel`,
                {
                    method: "POST"
                }
            );


            closeModal();


            showToast(
                "Transaction annulée",
                "Les fonds réservés ont été libérés."
            );


            await loadTransactions();


        } catch (error) {

            showToast(
                "Annulation impossible",
                error.message ||
                "Impossible d'annuler cette transaction."
            );
        }
    }


    /* =====================================================
       MESSAGES
    ===================================================== */

    async function openMessages(
        transactionId
    ) {

        if (!transactionId) {
            return;
        }


        try {

            const data =
                await apiRequest(
                    `/messages/transaction/${transactionId}`
                );


            const messages =
                Array.isArray(data)
                    ? data
                    : (
                        data.items ||
                        data.messages ||
                        []
                    );


            const messagesHTML =
                messages.length
                    ? messages
                        .map(
                            renderMessage
                        )
                        .join("")
                    : `
                        <div class="messages-empty">
                            ${ICONS.message}

                            <p>
                                Aucun message pour le moment.
                            </p>
                        </div>
                    `;


            openModal(`
                <div class="messages-modal">

                    <div class="modal-header-content">

                        <div>

                            <span class="section-kicker">
                                TRANSACTION
                            </span>

                            <h2>
                                Discussion
                            </h2>

                        </div>

                    </div>


                    <div
                        class="messages-list"
                        id="messagesList"
                    >
                        ${messagesHTML}
                    </div>


                    <form
                        id="messageForm"
                        class="message-form"
                    >

                        <input
                            id="messageInput"
                            type="text"
                            maxlength="5000"
                            placeholder="Écrire un message..."
                            autocomplete="off"
                            required
                        >


                        <button
                            type="submit"
                            class="primary-action"
                        >
                            Envoyer
                        </button>

                    </form>

                </div>
            `);


            document
                .getElementById(
                    "messageForm"
                )
                ?.addEventListener(
                    "submit",
                    event => {

                        sendTransactionMessage(
                            event,
                            transactionId
                        );

                    }
                );


            await markMessagesRead(
                transactionId
            );


        } catch (error) {

            showToast(
                "Erreur",
                error.message ||
                "Impossible de charger la discussion."
            );
        }
    }


    function renderMessage(
        message
    ) {

        const own =
            Number(
                message.sender_id
            ) ===
            Number(
                state.user?.id
            );


        return `
            <div
                class="message-bubble ${
                    own
                        ? "own"
                        : "other"
                }"
            >

                <p>
                    ${escapeHTML(
                        message.content ||
                        ""
                    )}
                </p>


                <small>
                    ${formatDate(
                        message.created_at
                    )}
                </small>

            </div>
        `;
    }


    async function sendTransactionMessage(
        event,
        transactionId
    ) {

        event.preventDefault();


        const input =
            document.getElementById(
                "messageInput"
            );


        const content =
            input?.value.trim();


        if (!content) {
            return;
        }


        try {

            await apiRequest(
                "/messages",
                {
                    method: "POST",

                    body:
                        JSON.stringify({
                            transaction_id:
                                Number(
                                    transactionId
                                ),

                            content,

                            message_type:
                                "text"
                        })
                }
            );


            input.value = "";


            await openMessages(
                transactionId
            );


        } catch (error) {

            showToast(
                "Message impossible",
                error.message ||
                "Impossible d'envoyer le message."
            );
        }
    }


    async function markMessagesRead(
        transactionId
    ) {

        try {

            await apiRequest(
                `/messages/transaction/${transactionId}/read`,
                {
                    method: "POST"
                }
            );

        } catch (error) {

            console.warn(
                "Lecture messages:",
                error.message
            );
        }
    }


    /* =====================================================
       PROFILE PAGE
    ===================================================== */

    async function renderProfile() {

        state.currentPage =
            "profile";


        showLoading(
            "Chargement du profil..."
        );


        await loadWallet();


        if (!DOM.pageContainer) {
            return;
        }


        const user =
            state.user ||
            getTelegramUser() ||
            {};


        const wallet =
            state.wallet ||
            {};


        const currency =
            wallet.currency ||
            user.currency ||
            "XAF";


        const available =
            wallet.available_balance ??
            wallet.balance ??
            0;


        DOM.pageContainer.innerHTML = `
            <section class="profile-page">

                <div class="profile-header">

                    <div class="profile-avatar-large">

                        ${
                            user.photo_url
                                ? `
                                    <img
                                        src="${escapeHTML(
                                            user.photo_url
                                        )}"
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


                    <div>

                        <span class="section-kicker">
                            MON PROFIL
                        </span>

                        <h1>
                            ${escapeHTML(
                                getDisplayName(
                                    user
                                )
                            )}
                        </h1>

                        ${
                            user.username
                                ? `
                                    <p>
                                        @${escapeHTML(
                                            user.username
                                        )}
                                    </p>
                                `
                                : ""
                        }

                    </div>

                </div>


                <div class="profile-wallet">

                    ${ICONS.wallet}

                    <div>

                        <span>
                            Solde disponible
                        </span>

                        <strong>
                            ${formatMoney(
                                available,
                                currency
                            )}
                        </strong>

                    </div>


                    <button
                        type="button"
                        class="text-button"
                        data-action="wallet"
                    >
                        Wallet
                        ${ICONS.arrow}
                    </button>

                </div>


                <div class="profile-menu">

                    <button
                        type="button"
                        data-action="transactions"
                    >
                        ${ICONS.message}

                        <span>
                            Transactions
                        </span>

                        ${ICONS.arrow}
                    </button>


                    <button
                        type="button"
                        data-action="sell"
                    >
                        ${ICONS.sell}

                        <span>
                            Mes annonces
                        </span>

                        ${ICONS.arrow}
                    </button>


                    <button
                        type="button"
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
                        data-action="settings"
                    >
                        ${ICONS.user}

                        <span>
                            Paramètres
                        </span>

                        ${ICONS.arrow}
                    </button>

                </div>


                <div
                    class="profile-version"
                    id="profileVersion"
                >
                    NexMarket v${CONFIG.APP_VERSION}
                </div>

            </section>
        `;


        bindProfileActions();

        setupAdminAccess();
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
            new Set(
                state.favorites.map(
                    favorite =>
                        Number(
                            favorite.listing_id
                        )
                )
            );


        await loadListings();


        const listings =
            state.listings.filter(
                listing =>
                    favoriteIds.has(
                        Number(
                            listing.id
                        )
                    )
            );


        DOM.pageContainer.innerHTML = `
            <section class="favorites-page">

                <div class="page-heading">

                    <span class="section-kicker">
                        MA SÉLECTION
                    </span>

                    <h1>
                        Favoris
                    </h1>

                    <p>
                        Retrouve les canaux que tu souhaites
                        garder sous la main.
                    </p>

                </div>


                <div class="listing-feed">

                    ${
                        listings.length
                            ? listings
                                .map(
                                    renderListing
                                )
                                .join("")
                            : showEmpty(
                                "Aucun favori",
                                "Ajoute des canaux à tes favoris depuis la marketplace.",
                                ICONS.heart
                            )
                    }

                </div>

            </section>
        `;


        bindPageActions();
    }


    /* =====================================================
       SETTINGS
    ===================================================== */

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
                        data-action="language"
                    >
                        ${ICONS.message}

                        <span>
                            Langue
                        </span>

                        <strong>
                            ${
                                user.language ===
                                "en"
                                    ? "English"
                                    : "Français"
                            }
                        </strong>
                    </button>


                    <button
                        type="button"
                        data-action="currency"
                    >
                        ${ICONS.wallet}

                        <span>
                            Devise
                        </span>

                        <strong>
                            ${
                                user.currency ||
                                "XAF"
                            }
                        </strong>
                    </button>


                    <button
                        type="button"
                        data-action="about"
                    >
                        ${ICONS.help}

                        <span>
                            À propos
                        </span>

                        ${ICONS.arrow}
                    </button>


                    <button
                        type="button"
                        data-action="support"
                    >
                        ${ICONS.message}

                        <span>
                            Support
                        </span>

                        ${ICONS.arrow}
                    </button>

                </div>

            </div>
        `);


        bindSettingsActions();
    }


    /* =====================================================
       ABOUT
    ===================================================== */

    function openAbout() {

        openModal(`
            <div class="about-modal">

                <div class="about-logo">
                    <img
                        src="logo.png"
                        alt="NexMarket"
                    >
                </div>


                <span class="section-kicker">
                    NEXMARKET
                </span>


                <h2>
                    La marketplace des canaux Telegram
                </h2>


                <p>
                    NexMarket permet aux utilisateurs
                    d'acheter et de vendre des canaux
                    Telegram dans un environnement
                    structuré et sécurisé.
                </p>


                <div class="about-company">

                    <span>
                        Propulsé par
                    </span>

                    <strong>
                        NEXA
                    </strong>

                </div>


                <div class="about-version">
                    Version ${CONFIG.APP_VERSION}
                </div>

            </div>
        `);
    }


    /* =====================================================
       SUPPORT
    ===================================================== */

    function openSupport() {

        openModal(`
            <div class="support-modal">

                <div class="modal-header-content">

                    <div>

                        <span class="section-kicker">
                            AIDE
                        </span>

                        <h2>
                            Support NexMarket
                        </h2>

                    </div>

                </div>


                <p>
                    Pour toute question concernant
                    une annonce, une transaction ou
                    ton portefeuille, utilise le support
                    NexMarket.
                </p>


                <button
                    type="button"
                    class="primary-action full-width"
                    data-action="telegram-support"
                >
                    ${ICONS.message}

                    Contacter le support
                </button>

            </div>
        `);


        document
            .querySelector(
                '[data-action="telegram-support"]'
            )
            ?.addEventListener(
                "click",
                () => {

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
       ADMIN ACCESS
    ===================================================== */

    function setupAdminAccess() {

        const version =
            document.getElementById(
                "profileVersion"
            );


        if (!version) {
            return;
        }


        version.addEventListener(
            "click",
            () => {

                state.adminTapCount++;


                clearTimeout(
                    state.adminTapTimer
                );


                state.adminTapTimer =
                    setTimeout(
                        () => {

                            state.adminTapCount =
                                0;

                        },
                        CONFIG.ADMIN_TAP_WINDOW
                    );


                if (
                    state.adminTapCount >=
                    CONFIG.ADMIN_TAP_COUNT
                ) {

                    state.adminTapCount =
                        0;

                    openAdminLogin();
                }
            }
        );
    }


    function openAdminLogin() {

        openModal(`
            <div class="admin-login">

                <div class="modal-header-content">

                    <div>

                        <span class="section-kicker">
                            NEXMARKET
                        </span>

                        <h2>
                            Administration
                        </h2>

                    </div>

                </div>


                <form
                    id="adminLoginForm"
                    class="modal-form"
                >

                    <label>

                        Code administrateur

                        <input
                            id="adminCode"
                            type="password"
                            autocomplete="off"
                            required
                        >

                    </label>


                    <button
                        type="submit"
                        class="primary-action full-width"
                    >
                        Accéder
                    </button>

                </form>

            </div>
        `);


        document
            .getElementById(
                "adminLoginForm"
            )
            ?.addEventListener(
                "submit",
                handleAdminLogin
            );
    }


    async function handleAdminLogin(
        event
    ) {

        event.preventDefault();


        const code =
            document
                .getElementById(
                    "adminCode"
                )
                ?.value;


        if (!code) {
            return;
        }


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
                    "Token administrateur absent."
                );
            }


            sessionStorage.setItem(
                "nexmarket_admin_token",
                data.token
            );


            closeModal();


            window.location.href =
                CONFIG.ADMIN_PATH;


        } catch (error) {

            showToast(
                "Accès refusé",
                error.message ||
                "Code administrateur incorrect."
            );
        }
    }


    /* =====================================================
       NAVIGATION
    ===================================================== */

    async function navigateTo(
        page
    ) {

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
                await renderTransactions();
                break;

            case "profile":
                await renderProfile();
                break;

            case "wallet":
                await renderWallet();
                break;

            case "favorites":
                await renderFavorites();
                break;

            case "transactions":
                await renderTransactions();
                break;

            default:
                await renderHome();
        }


        updateBottomNavigation(
            page
        );


        if (
            page ===
            "buy"
        ) {

            setupSearchInput();
        }
    }


    function updateBottomNavigation(
        page
    ) {

        if (!DOM.bottomNavigation) {
            return;
        }


        const buttons =
            DOM.bottomNavigation.querySelectorAll(
                "[data-page]"
            );


        buttons.forEach(
            button => {

                const active =
                    button.dataset.page ===
                    page;


                button.classList.toggle(
                    "active",
                    active
                );
            }
        );
    }


    /* =====================================================
       EVENT BINDING
    ===================================================== */

    function bindPageActions() {

        document
            .querySelectorAll(
                "[data-action]"
            )
            .forEach(
                button => {

                    if (
                        button.dataset.bound ===
                        "true"
                    ) {
                        return;
                    }


                    button.dataset.bound =
                        "true";


                    button.addEventListener(
                        "click",
                        handleAction
                    );
                }
            );
    }


    function bindBuyActions() {

        bindPageActions();

        setupSearchInput();


        document
            .querySelector(
                '[data-action="filters"]'
            )
            ?.addEventListener(
                "click",
                openFilters
            );
    }


    function bindWalletActions() {

        bindPageActions();
    }


    function bindProfileActions() {

        bindPageActions();
    }


    function bindSettingsActions() {

        document
            .querySelectorAll(
                "[data-action]"
            )
            .forEach(
                element => {

                    element.addEventListener(
                        "click",
                        event => {

                            const action =
                                event.currentTarget
                                    .dataset
                                    .action;


                            if (
                                action ===
                                "about"
                            ) {

                                openAbout();

                            } else if (
                                action ===
                                "support"
                            ) {

                                openSupport();

                            } else if (
                                action ===
                                "language"
                            ) {

                                showToast(
                                    "Langue",
                                    "Le changement de langue sera disponible prochainement."
                                );

                            } else if (
                                action ===
                                "currency"
                            ) {

                                showToast(
                                    "Devise",
                                    "La devise actuelle est XAF."
                                );

                            }
                        }
                    );
                }
            );
    }


    function bindMyListingActions() {

        document
            .querySelectorAll(
                "[data-action]"
            )
            .forEach(
                element => {

                    element.addEventListener(
                        "click",
                        event => {

                            const action =
                                event.currentTarget
                                    .dataset
                                    .action;


                            const id =
                                event.currentTarget
                                    .dataset
                                    .listingId;


                            if (
                                action ===
                                "edit-listing"
                            ) {

                                openEditListing(
                                    id
                                );
                            }


                            if (
                                action ===
                                "cancel-listing"
                            ) {

                                cancelListing(
                                    id
                                );
                            }
                        }
                    );
                }
            );
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


        const listingId =
            element.dataset.listingId;


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


            case "messages":
                await navigateTo(
                    "messages"
                );
                break;


            case "profile":
                await navigateTo(
                    "profile"
                );
                break;


            case "wallet":
                await navigateTo(
                    "wallet"
                );
                break;


            case "transactions":
                await navigateTo(
                    "transactions"
                );
                break;


            case "favorites":
                await navigateTo(
                    "favorites"
                );
                break;


            case "settings":
                openSettings();
                break;


            case "deposit":
                openWalletDeposit();
                break;


            case "withdraw":
                openWalletWithdraw();
                break;


            case "view-listing":
                await openListing(
                    listingId
                );
                break;


            case "favorite":
                await toggleFavorite(
                    listingId
                );
                break;


            case "purchase":
                await purchaseListing(
                    listingId
                );
                break;


            case "filters":
                openFilters();
                break;


            case "reset-filters":
                await resetFilters();
                break;


            case "apply-filters":
                await applyFilters();
                break;


            case "close-modal":
                closeModal();
                break;


            case "about":
                openAbout();
                break;


            case "support":
                openSupport();
                break;

            default:
                break;
        }
    }


    /* =====================================================
       BOTTOM NAVIGATION
    ===================================================== */

    function setupBottomNavigation() {

        if (!DOM.bottomNavigation) {
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

                            await navigateTo(
                                button.dataset.page
                            );

                        }
                    );
                }
            );
    }


    /* =====================================================
       HEADER
    ===================================================== */

    function setupHeader() {

        DOM.profileAvatarButton
            ?.addEventListener(
                "click",
                () => {

                    navigateTo(
                        "wallet"
                    );
                }
            );


        DOM.headerSearchButton
            ?.addEventListener(
                "click",
                () => {

                    navigateTo(
                        "buy"
                    );
                }
            );


        DOM.faqButton
            ?.addEventListener(
                "click",
                () => {

                    openSupport();
                }
            );
    }


    /* =====================================================
       MODAL EVENTS
    ===================================================== */

    function setupModal() {

        DOM.modalOverlay
            ?.addEventListener(
                "click",
                closeModal
            );


        DOM.modalClose
            ?.addEventListener(
                "click",
                closeModal
            );


        DOM.modalContent
            ?.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                }
            );


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
    }


    /* =====================================================
   SPLASH SCREEN
===================================================== */

function showApplication() {

    if (!DOM.app) {
        return;
    }

    DOM.app.classList.remove("hidden");

    DOM.app.style.display = "block";
    DOM.app.style.visibility = "visible";
    DOM.app.style.opacity = "1";
}


function hideSplash() {

    // L'application doit toujours être visible
    showApplication();

    if (!DOM.splash) {
        return;
    }

    DOM.splash.classList.add("hidden");
    DOM.splash.classList.add("hide");

    DOM.splash.style.opacity = "0";
    DOM.splash.style.visibility = "hidden";
    DOM.splash.style.pointerEvents = "none";

    setTimeout(() => {

        if (DOM.splash) {
            DOM.splash.style.display = "none";
        }

    }, 550);
}


/* =====================================================
   APP START
===================================================== */

async function initApp() {

    /*
       Afficher l'application AVANT les appels réseau.
       Render ne doit jamais pouvoir laisser l'écran noir.
    */

    showApplication();
    hideSplash();


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
       Charger l'utilisateur sans bloquer
       l'affichage de l'application.
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
       Charger la page d'accueil.
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
       DOM READY
    ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initApp,
            {
                once: true
            }
        );

    } else {

        initApp();
    }

})();