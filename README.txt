NexMarket — frontend (corrigé)

Backend API : https://nexamarket-backend-ffea.onrender.com/api

Paiement : JessiKaPay uniquement (dépôts et retraits). Le prix d'un canal
est bloqué dans le portefeuille de l'acheteur, puis versé au vendeur
(moins la commission) à la fin de la période de protection.
Aucun secret n'est présent dans le frontend.

Dépôt : numéro Mobile Money avec indicatif international (+242...). Le pays
n'est plus demandé : il est déduit du numéro par JessiKaPay.
Retrait : le frontend envoie jp_number, amount et currency.

Structure :
- index.html, app.js, style.css       application Mini App
- admin/admin.html, admin.js, admin.css   console d'administration
- admin/index.html                    simple redirection vers admin.html
