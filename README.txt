NexMarket — frontend

API : https://nexamarket-backend-ffea.onrender.com/api
(modifiable avec window.NEXMARKET_API_URL avant app.js / panel.js)

Structure
- index.html, app.js, style.css       Mini App
- admin/index.html, panel.css, panel.js   Console d'administration
  (design de la maquette : menu latéral, tableaux, cartes)
- admin/admin.html                     redirection vers admin/index.html

Dépôt : choisir le pays d'origine (liste MoneyFusion) puis saisir son numéro
Mobile Money SANS l'indicatif.
Vente : canal public (@username) ou privé (ID du canal), 1 à 4 photos de preuve
obligatoires (envoyées à l'administrateur).

v18 — Paramètres : langue et devise d'affichage
- Langue Français / English (fichier i18n.js, à garder à côté de app.js).
- Devise d'affichage FCFA / Euro / Dollar : affichage indicatif seulement,
  les soldes, dépôts et retraits restent en XAF.
- « Contacter le support » ouvre le groupe Telegram du support.
- Nécessite le backend v19 (route GET /api/rates).

v24 — moins de répétitions
- Achat direct : le pays du compte n'est plus redemandé (lien « Changer » si besoin).
- Dépôt / retrait : quand le pays du compte est connu, l'étape « Pays » disparaît
  de la barre de progression (4 étapes au lieu de 5).

v25 — plus de wallet visible
- Plus de page Wallet, de solde, de boutons Déposer / Retirer dans la mini-app.
- L'icône du profil (en-tête) ouvre le profil ; le solde a été retiré du profil.
- L'achat se fait uniquement par MoneyFusion (ou GRAM) ; le vendeur est payé sur son Mobile Money.
- Le code du dépôt/retrait reste dans app.js mais n'est plus accessible.

v26
- Canal PUBLIC : aucune photo demandée (ni preuve ni aperçu). Canal privé : inchangé.
- Le nom « MoneyFusion » n'apparaît plus dans la mini-app.

v27 — nouveau design : theme-v2.css (chargé après style.css). Supprime sa ligne <link> dans index.html pour revenir à l'ancien look.

v28 — thème v2 étendu à toute la mini-app et à la console admin (admin/theme-v2.css).

v29
- Canal public : correctif CSS ([hidden]) -> plus aucune photo affichée.
- Splash redessiné ; création de compte : recherche de pays, nouveau style.
- Inscription ouverte à tous les pays SAUF Russie (RU) et Inde (IN) (aussi refusé côté serveur).

v30
- Barre de navigation : l'onglet s'allume immédiatement (même si la page plante ou charge lentement).
- Vente : le vendeur saisit son numéro JessiKaPay (JP), vérifié en direct (nom du titulaire).
- Admin : bouton « Portefeuille » (créditer / retirer) sur chaque utilisateur.

v32 — inscription en UN seul écran (pays, téléphone, conditions) ; « numéro de téléphone » au lieu de « Mobile Money ».

v35 — GRAM au cours : prix saisi en FCFA, montant GRAM recalculé toutes les 10 min (compte à rebours dans le formulaire de vente et pastille « 1 GRAM ≈ … FCFA »).

v36 — annonces GRAM : le vendeur choisit la devise de son prix (toutes les devises du taux de change), conversion en GRAM en direct.

v37 — pastille « 1 GRAM = … » dans n'importe quelle devise (touche pour changer), mise à jour en direct toutes les 10 min.
