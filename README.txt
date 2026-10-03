NexMarket — frontend corrigé


Backend API:
https://nexamarket-backend.onrender.com/api

Paiement:
JessiKaPay uniquement. Aucun secret JessiKaPay n'est inclus dans le frontend.
Les clés/API secrets doivent rester dans les variables d'environnement du backend Render.

Dépôt:
Le frontend accepte notamment payment_link / checkout_url renvoyé par le backend.

Retrait:
Le frontend envoie jp_number, amount et currency au backend.
Aucun numéro de téléphone Money Fusion n'est utilisé.

Structure:
- index.html
- app.js
- style.css
- admin/index.html
- admin/admin.js
- admin/admin.css

Le vrai logo.png doit être ajouté à la racine s'il n'est pas déjà disponible.
