NexMarket — frontend

API : https://nexamarket-backend-ffea.onrender.com/api
(modifiable avec window.NEXMARKET_API_URL avant app.js / panel.js)

Structure
- index.html, app.js, style.css       Mini App
- admin/index.html, panel.css, panel.js   Console d'administration
  (design de la maquette : menu latéral, tableaux, cartes)
- admin/admin.html                     redirection vers admin/index.html

Dépôt : choisir le pays d'origine (JessiKaPay l'exige) puis saisir son numéro
Mobile Money SANS l'indicatif.
Vente : canal public (@username) ou privé (ID du canal), 1 à 4 photos de preuve
obligatoires (envoyées à l'administrateur).

v18 — Paramètres : langue et devise d'affichage
- Langue Français / English (fichier i18n.js, à garder à côté de app.js).
- Devise d'affichage FCFA / Euro / Dollar : affichage indicatif seulement,
  les soldes, dépôts et retraits restent en XAF.
- « Contacter le support » ouvre le groupe Telegram du support.
- Nécessite le backend v19 (route GET /api/rates).
