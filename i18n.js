/* NexMarket — traduction Français / English (v19)
   Le texte de l'application est écrit en français. Quand la langue « en »
   est choisie, chaque texte connu est remplacé par sa version anglaise
   (nœuds texte + placeholder/title/aria-label/alt). Les contenus saisis par
   les utilisateurs (noms de canaux, descriptions, messages) ne sont jamais
   modifiés. Repasser en français restaure les textes d'origine. */
(function () {
    "use strict";
    var STORE_KEY = "nexmarket_lang";
    var EN = {
"+ Ajouter des photos": "+ Add photos",
", indispensable pour retirer.": ", required to withdraw.",
": il te donne ton ID": ": it gives you your ID",
"ACTIVITÉ": "ACTIVITY",
"AIDE": "HELP",
"Abonnés": "Subscribers",
"Accueil": "Home",
"Accède au panneau de gestion sécurisé de NexMarket.": "Access the secure NexMarket management panel.",
"Accès refusé": "Access denied",
"Acheter": "Buy",
"Acheter un canal": "Buy a channel",
"Acheteur": "Buyer",
"Acheteur, vendeur et administrateur échangent ici. Tu reçois aussi les messages dans le bot.": "The buyer, seller and administrator talk here. You also receive the messages in the bot.",
"Achète et vends des canaux Telegram dans un espace pensé pour des transactions sécurisées.": "Buy and sell Telegram channels in a space built for secure transactions.",
"Actualiser la liste": "Refresh the list",
"Administration": "Administration",
"Afficher le solde": "Show balance",
"Affiner la recherche": "Refine search",
"Ajoute 1 à 4 captures : statistiques du canal (abonnés, vues) et preuve que tu en es le propriétaire. Elles sont envoyées à l'administrateur pour validation.": "Add 1 to 4 screenshots: channel statistics (subscribers, views) and proof that you own it. They are sent to the administrator for validation.",
"Ajoute au moins une capture des statistiques de ton canal.": "Add at least one screenshot of your channel statistics.",
"Ajoute des canaux à tes favoris depuis la marketplace.": "Add channels to your favorites from the marketplace.",
"Ajoute le bot NexMarket comme": "Add the NexMarket bot as",
"Ajoute le bot NexMarket comme administrateur : ton canal apparaît dans « Canaux détectés » (touche-le). Sinon colle ici l'ID du canal. Les acheteurs n'auront pas de lien public.": "Add the NexMarket bot as an administrator: your channel appears in “Detected channels” (tap it). Otherwise paste the channel ID here. Buyers will not have a public link.",
"Ajoute ton canal Telegram, vérifie-le puis propose ton prix.": "Add your Telegram channel, verify it, then set your price.",
"Ajouté aux favoris": "Added to favorites",
"Annonce annulée": "Listing cancelled",
"Annonce envoyée": "Listing submitted",
"Annonce modifiée": "Listing updated",
"Annuler": "Cancel",
"Annuler la transaction": "Cancel the transaction",
"Appliquer": "Apply",
"Après modification, l'annonce pourra repasser en validation avant sa publication.": "After editing, the listing may go back to review before it is published.",
"Aucun canal disponible": "No channel available",
"Aucun message pour le moment.": "No messages yet.",
"Aucune annonce": "No listings",
"Bienvenue": "Welcome",
"Bloqué": "Blocked",
"Business": "Business",
"CATÉGORIE": "CATEGORY",
"CATÉGORIES": "CATEGORIES",
"COMPTE VÉRIFIÉ": "VERIFIED ACCOUNT",
"Canal": "Channel",
"Canal privé": "Private channel",
"Canal public": "Public channel",
"Canal vérifié": "Verified channel",
"Canaux disponibles": "Available channels",
"Canaux détectés": "Detected channels",
"Catégorie": "Category",
"Catégorie requise": "Category required",
"Catégories de canaux": "Channel categories",
"Ce numéro JessiKaPay n'a pas été trouvé ou n'est pas disponible.": "This JessiKaPay number was not found or is not available.",
"Cette autorisation permet à NexMarket de vérifier le canal et de sécuriser les étapes nécessaires à la transaction.": "This permission lets NexMarket verify the channel and secure the steps needed for the transaction.",
"Cette photo ne peut pas être lue.": "This photo cannot be read.",
"Chargement de ton profil…": "Loading your profile…",
"Chargement des canaux…": "Loading channels…",
"Chargement des favoris...": "Loading favorites...",
"Chargement des transactions...": "Loading transactions...",
"Chargement du portefeuille...": "Loading wallet...",
"Chargement du profil...": "Loading profile...",
"Chargement…": "Loading…",
"Choisir une catégorie": "Choose a category",
"Choisis ton canal dans « Canaux détectés » ou entre son ID.": "Choose your channel in “Detected channels” or enter its ID.",
"Choisis une annonce, consulte ses informations puis lance la transaction depuis sa fiche.": "Pick a listing, check its details, then start the transaction from its page.",
"Choisis une catégorie.": "Choose a category.",
"Code administrateur": "Administrator code",
"Comment acheter un canal ?": "How do I buy a channel?",
"Comment vendre mon canal ?": "How do I sell my channel?",
"Commerce": "Commerce",
"Community": "Community",
"Configuration du serveur": "Server configuration",
"Confirmer l'achat de ce canal ?": "Confirm the purchase of this channel?",
"Confirmer la réception du canal ? Le vendeur sera payé.": "Confirm you received the channel? The seller will be paid.",
"Consulte tes achats et tes ventes.": "Check your purchases and sales.",
"Creation": "Creation",
"Création de la transaction...": "Creating the transaction...",
"Création du paiement...": "Creating the payment...",
"Des transactions réelles, protégées par séquestre.": "Real transactions, protected by escrow.",
"Description": "Description",
"Devise": "Currency",
"Discussion": "Discussion",
"Données invalides.": "Invalid data.",
"Démarrage…": "Starting…",
"Démarre d'abord le bot": "Start the bot first",
"Démarre le bot NexMarket": "Start the NexMarket bot",
"Déposer de l'argent": "Deposit money",
"Dépôt impossible": "Deposit failed",
"Dépôt reçu": "Deposit received",
"EN DIRECT": "LIVE",
"Education": "Education",
"Enregistrer": "Save",
"Entertainment": "Entertainment",
"Entre le @username ou le lien du canal.": "Enter the channel @username or link.",
"Entre le code administrateur pour continuer.": "Enter the administrator code to continue.",
"Entre ton numéro Mobile Money, sans l'indicatif du pays.": "Enter your Mobile Money number, without the country code.",
"Entre un montant supérieur à zéro.": "Enter an amount greater than zero.",
"Entre un prix supérieur à zéro.": "Enter a price greater than zero.",
"Entrer le code administrateur": "Enter the administrator code",
"Envoyer": "Send",
"Explique le problème (5 caractères minimum) :": "Describe the problem (5 characters minimum):",
"FILTRES": "FILTERS",
"Favori supprimé": "Favorite removed",
"Favoris": "Favorites",
"Fonds bloqués jusqu'à la livraison": "Funds held until delivery",
"Fonds réservés — en attente d'un administrateur": "Funds reserved — waiting for an administrator",
"Fonds sécurisés": "Secured funds",
"Games": "Games",
"Glisse pour voir plus": "Swipe to see more",
"Gère ton argent et tes transactions NexMarket.": "Manage your money and your NexMarket transactions.",
"ID du canal privé": "Private channel ID",
"Il n'a pas de lien public : l'accès te sera donné après l'achat.": "It has no public link: access will be given to you after the purchase.",
"Impossible d'annuler l'annonce.": "Unable to cancel the listing.",
"Impossible d'envoyer le message.": "Unable to send the message.",
"Impossible de charger cette annonce.": "Unable to load this listing.",
"Impossible de charger la discussion.": "Unable to load the discussion.",
"Impossible de charger la transaction.": "Unable to load the transaction.",
"Impossible de charger les annonces pour le moment.": "Unable to load listings right now.",
"Impossible de charger les canaux": "Unable to load channels",
"Impossible de créer la demande de retrait.": "Unable to create the withdrawal request.",
"Impossible de créer le paiement.": "Unable to create the payment.",
"Impossible de joindre le serveur NexMarket. Vérifie ta connexion et réessaie.": "Unable to reach the NexMarket server. Check your connection and try again.",
"Impossible de modifier l'annonce.": "Unable to edit the listing.",
"Impossible de modifier les favoris.": "Unable to update favorites.",
"Impossible de publier cette annonce.": "Unable to publish this listing.",
"Impossible de trouver cette annonce.": "Unable to find this listing.",
"Impossible de vérifier ce numéro.": "Unable to verify this number.",
"J'ai bien reçu le canal": "I received the channel",
"JessiKaPay n'a fourni aucun lien de paiement.": "JessiKaPay did not provide a payment link.",
"L'ID d'un canal ressemble à -1001234567890. Le plus simple : touche ton canal dans « Canaux détectés ».": "A channel ID looks like -1001234567890. The easiest way: tap your channel in “Detected channels”.",
"L'accès est réservé aux administrateurs NexMarket.": "Access is restricted to NexMarket administrators.",
"L'annonce a été ajoutée à tes favoris.": "The listing was added to your favorites.",
"L'annonce a été retirée de la marketplace.": "The listing was removed from the marketplace.",
"L'annonce a été retirée de tes favoris.": "The listing was removed from your favorites.",
"La commission NexMarket est de 5 % du prix de vente.": "The NexMarket commission is 5% of the sale price.",
"La demande de retrait a été enregistrée.": "The withdrawal request has been recorded.",
"La devise actuelle est XAF.": "The current currency is XAF.",
"La marketplace des canaux Telegram": "The Telegram channel marketplace",
"La modification a été enregistrée.": "The change has been saved.",
"La page JessiKaPay va s'ouvrir. Termine le paiement puis reviens dans NexMarket.": "The JessiKaPay page will open. Complete the payment, then come back to NexMarket.",
"La transaction n'a pas pu être créée.": "The transaction could not be created.",
"Langue": "Language",
"Le backend n'a pas fourni de jeton de session.": "The server did not provide a session token.",
"Le backend n'a pas retourné l'identifiant du canal.": "The server did not return the channel ID.",
"Le bot NexMarket doit pouvoir vérifier le canal avant que ton annonce soit publiée.": "The NexMarket bot must be able to verify the channel before your listing is published.",
"Le canal doit être accessible et tu dois en être administrateur.": "The channel must be accessible and you must be its administrator.",
"Le canal doit être public (avec un @username) et tu dois en être administrateur. Les visiteurs pourront ouvrir ton canal depuis l'annonce.": "The channel must be public (with a @username) and you must be its administrator. Visitors will be able to open your channel from the listing.",
"Le changement de langue sera disponible prochainement.": "Language switching will be available soon.",
"Le paiement est-il sécurisé ?": "Is the payment secure?",
"Le paiement intervient après les étapes prévues par la transaction et la période de protection.": "Payment is released after the steps of the transaction and the protection period.",
"Le serveur met trop de temps à répondre. Réessaie dans un instant.": "The server is taking too long to respond. Try again in a moment.",
"Le serveur n'est pas à jour ou l'adresse de l'API est incorrecte.": "The server is not up to date or the API address is incorrect.",
"Le serveur ne répond pas. Réessaie dans un instant.": "The server is not responding. Try again in a moment.",
"Le serveur se réveille, un instant…": "The server is waking up, one moment…",
"Le vendeur a été payé.": "The seller has been paid.",
"Le vendeur doit être le propriétaire réel du canal et fournir les informations nécessaires à la vérification.": "The seller must be the real owner of the channel and provide the information needed for verification.",
"Lecture de la photo impossible.": "Unable to read the photo.",
"Les fonds restent réservés pendant le traitement de la transaction.": "The funds stay reserved while the transaction is processed.",
"Les fonds réservés ont été libérés.": "The reserved funds have been released.",
"Les fonds seront envoyés vers le numéro indiqué ci-dessus.": "The funds will be sent to the number shown above.",
"Les fonds sont maintenant réservés. Un administrateur va prendre en charge la transaction.": "The funds are now reserved. An administrator will take over the transaction.",
"Les fonds utilisés pour un achat sont réservés jusqu'à la fin de la transaction.": "Funds used for a purchase are reserved until the transaction ends.",
"Les nouvelles annonces apparaîtront ici.": "New listings will appear here.",
"Les réponses aux questions les plus fréquentes.": "Answers to the most frequently asked questions.",
"Lien ou @username du canal": "Channel link or @username",
"Litiges arbitrés": "Disputes arbitrated",
"MA SÉLECTION": "MY SELECTION",
"MARKETPLACE": "MARKETPLACE",
"MES ANNONCES": "MY LISTINGS",
"MON ANNONCE": "MY LISTING",
"MON PORTEFEUILLE": "MY WALLET",
"MON PROFIL": "MY PROFILE",
"Marketplace Telegram": "Telegram Marketplace",
"Masquer le solde": "Hide balance",
"Mes annonces": "My listings",
"Mes favoris": "My favorites",
"Mes ventes": "My sales",
"Messages": "Messages",
"Mis en vente le": "Listed on",
"Modifier le prix": "Edit price",
"Montant": "Amount",
"Moyen de paiement": "Payment method",
"Music": "Music",
"NEXA": "NEXA",
"NEXA ID": "NEXA ID",
"NEXMARKET": "NEXMARKET",
"News": "News",
"NexMarket": "NexMarket",
"NexMarket doit être ouvert depuis Telegram.": "NexMarket must be opened from Telegram.",
"NexMarket en chiffres": "NexMarket in numbers",
"NexMarket est une marketplace permettant d'acheter et de vendre des canaux Telegram.": "NexMarket is a marketplace for buying and selling Telegram channels.",
"NexMarket permet aux utilisateurs d'acheter et de vendre des canaux Telegram dans un environnement structuré et sécurisé.": "NexMarket lets users buy and sell Telegram channels in a structured and secure environment.",
"NexMarket utilise un système de transaction avec blocage des fonds pendant le processus de transfert du canal.": "NexMarket uses a transaction system that holds the funds while the channel is being transferred.",
"NexMarket — La marketplace des canaux Telegram en Afrique.": "NexMarket — The Telegram channel marketplace in Africa.",
"Nom, @username, catégorie...": "Name, @username, category...",
"Nouveau prix": "New price",
"Numéro JessiKaPay": "JessiKaPay number",
"Numéro JessiKaPay invalide": "Invalid JessiKaPay number",
"Numéro Mobile Money": "Mobile Money number",
"Numéro introuvable": "Number not found",
"Numéro invalide": "Invalid number",
"Numéro non vérifié": "Number not verified",
"Other": "Other",
"Ouvrir le portefeuille": "Open wallet",
"Ouvrir un litige": "Open a dispute",
"PORTEFEUILLE": "WALLET",
"Paiement prêt": "Payment ready",
"Paiement sécurisé": "Secure payment",
"Paiements JessiKaPay sécurisés": "Secure JessiKaPay payments",
"Paiements sécurisés": "Secure payments",
"Paramètres": "Settings",
"Pas encore d'ID ? Démarre d'abord le bot": "No ID yet? Start the bot first",
"Pays d'origine": "Country",
"Photo de preuve requise": "Proof photo required",
"Photo ignorée": "Photo skipped",
"Photos de preuve": "Proof photos",
"Pour toute question concernant une annonce, une transaction ou ton portefeuille, utilise le support NexMarket.": "For any question about a listing, a transaction or your wallet, use NexMarket support.",
"Pour utiliser NexMarket, démarre le bot puis rejoins notre canal.": "To use NexMarket, start the bot then join our channel.",
"Pourquoi le bot NexMarket doit-il être administrateur ?": "Why must the NexMarket bot be an administrator?",
"Presque prêt…": "Almost ready…",
"Prix": "Price",
"Prix / 1 000 abonnés": "Price / 1,000 subscribers",
"Prix de vente": "Sale price",
"Prix du canal": "Channel price",
"Profil": "Profile",
"Propulsé par": "Powered by",
"Préparation de la vente...": "Preparing the sale...",
"Présente ton canal aux acheteurs...": "Introduce your channel to buyers...",
"Période de protection": "Protection period",
"Qu'est-ce que NexMarket ?": "What is NexMarket?",
"Quand le vendeur reçoit-il son argent ?": "When does the seller receive their money?",
"Que faire en cas de problème ?": "What should I do if there is a problem?",
"Quelle est la commission NexMarket ?": "What is the NexMarket commission?",
"Questions fréquentes": "Frequently asked questions",
"Qui peut vendre un canal ?": "Who can sell a channel?",
"Recharge ton portefeuille NexMarket de manière sécurisée.": "Top up your NexMarket wallet securely.",
"Recharge ton portefeuille avant de continuer.": "Top up your wallet before continuing.",
"Rejoins le canal NEXA": "Join the NEXA channel",
"Retire ton solde vers ton compte JessiKaPay.": "Withdraw your balance to your JessiKaPay account.",
"Retirer de l'argent": "Withdraw money",
"Retirer la photo": "Remove photo",
"Retour": "Back",
"Retrait créé": "Withdrawal created",
"Retrouve les canaux que tu souhaites garder sous la main.": "Find the channels you want to keep handy.",
"Revenus": "Earnings",
"Reviens ici et appuie sur « J'ai terminé »": "Come back here and tap “I'm done”",
"Réauthentification NexMarket:": "NexMarket re-authentication:",
"Réessaie plus tard.": "Try again later.",
"Réessayer": "Retry",
"Réinitialiser": "Reset",
"Réveil du serveur NexMarket… quelques secondes.": "Waking up the NexMarket server… a few seconds.",
"Service de retrait": "Withdrawal service",
"Solde disponible": "Available balance",
"Sport": "Sport",
"Support": "Support",
"Support NexMarket": "NexMarket Support",
"Sécurisé": "Secure",
"TRANSACTION": "TRANSACTION",
"Tech": "Tech",
"Tes annonces apparaîtront ici.": "Your listings will appear here.",
"Tes transactions apparaîtront ici.": "Your transactions will appear here.",
"Ton annonce est maintenant en attente de validation.": "Your listing is now awaiting review.",
"Ton identifiant n'est pas encore prêt.": "Your ID is not ready yet.",
"Ton numéro, sans l'indicatif": "Your number, without the country code",
"Ton solde a été mis à jour.": "Your balance has been updated.",
"Touche ton canal pour le sélectionner :": "Tap your channel to select it:",
"Toutes": "All",
"Transaction annulée": "Transaction cancelled",
"Transaction créée": "Transaction created",
"Transactions": "Transactions",
"Transfert du canal en cours": "Channel transfer in progress",
"Trouve ton prochain": "Find your next",
"Trouve un canal Telegram correspondant à tes critères.": "Find a Telegram channel that matches your criteria.",
"Tu seras redirigé vers la page de paiement sécurisée.": "You will be redirected to the secure payment page.",
"Un administrateur va examiner ta demande.": "An administrator will review your request.",
"Une erreur est survenue.": "An error occurred.",
"Utilise exactement le format JP-222222.": "Use exactly the format JP-222222.",
"Utilise le support NexMarket afin qu'un administrateur puisse examiner la situation.": "Use NexMarket support so that an administrator can review the situation.",
"VENDEUR": "SELLER",
"Va dans « Vendre », renseigne les informations de ton canal puis soumets ton annonce pour vérification.": "Go to “Sell”, fill in your channel details, then submit your listing for verification.",
"Vendeur": "Seller",
"Vendre": "Sell",
"Vendre mon canal": "Sell my channel",
"Vendre un canal": "Sell a channel",
"Ventes réalisées": "Completed sales",
"Veux-tu vraiment annuler cette annonce ?": "Do you really want to cancel this listing?",
"Voir le canal sur Telegram": "View the channel on Telegram",
"Vérification NexMarket": "NexMarket verification",
"Vérification de chaque canal": "Every channel verified",
"Vérification du canal...": "Verifying the channel...",
"Vérification du dépôt:": "Deposit check:",
"Vérification du numéro...": "Verifying the number...",
"Vérification impossible": "Verification failed",
"Vérification obligatoire": "Verification required",
"Vérifie d'abord le numéro JessiKaPay avant de confirmer le retrait.": "Verify the JessiKaPay number first before confirming the withdrawal.",
"Vérifier": "Verify",
"Vérifié": "Verified",
"Wallet": "Wallet",
"XAF échangés": "XAF traded",
"administrateur": "administrator",
"avec l'ID du canal": "with the channel ID",
"avec un @username": "with a @username",
"canal Telegram.": "Telegram channel.",
"de ton canal (droits : gérer le canal, inviter des utilisateurs). Il apparaîtra ici automatiquement, même pour un canal privé.": "of your channel (rights: manage the channel, invite users). It will appear here automatically, even for a private channel.",
"membres": "members",
"obligatoire": "required",
"À propos": "About",
"Écrire un message...": "Write a message...",
"à vous": "there",
"▶ Démarrer @JessiKaPayBot": "▶ Start @JessiKaPayBot",
"✅ J'ai terminé, réessayer": "✅ I'm done, try again",
"✔ Tous les droits sont accordés": "✔ All rights granted",
"✔ Vérifié": "✔ Verified",
"📢 Rejoindre le canal NEXA": "📢 Join the NEXA channel",
"🤖 Démarrer le bot": "🤖 Start the bot",
"Annulé": "Cancelled",
"Bénin": "Benin",
"Copié": "Copied",
"Erreur": "Error",
"Fermer": "Close",
"Oui": "Yes",
"Prix ↑": "Price ↑",
"Prix ↓": "Price ↓",
"Refusé": "Refused",
"Tchad": "Chad",
"Tous": "All",
"Trier": "Sort",
"Vendu": "Sold",
"Moi": "Me",
"Active": "Active",
"Achat impossible": "Purchase failed",
"Action impossible": "Action failed",
"Annonce introuvable": "Listing not found",
"Annulation impossible": "Cancellation failed",
"Aucun favori": "No favorites",
"Aucune transaction": "No transactions",
"Cameroun": "Cameroon",
"Canal requis": "Channel required",
"Centrafrique": "Central African Republic",
"Code incorrect": "Incorrect code",
"Code requis": "Code required",
"Compte introuvable": "Account not found",
"Confirmation impossible": "Confirmation failed",
"Connexion impossible": "Connection failed",
"Connexion requise": "Login required",
"Continuer": "Continue",
"Copie impossible": "Copy failed",
"Droit manquant": "Missing permission",
"English": "English",
"Français": "Français",
"Litige en cours": "Dispute in progress",
"Litige impossible": "Dispute failed",
"Litige ouvert": "Dispute opened",
"Message impossible": "Message failed",
"Modification impossible": "Edit failed",
"Montant invalide": "Invalid amount",
"Montant trop faible": "Amount too low",
"Nouveau vendeur": "New seller",
"Paiement en attente": "Payment pending",
"Prix invalide": "Invalid price",
"Publication impossible": "Publishing failed",
"Remboursée": "Refunded",
"Remonter en haut": "Back to top",
"Retrait impossible": "Withdrawal failed",
"Récents": "Recent",
"Réservé": "Reserved",
"Solde insuffisant": "Insufficient balance",
"Support administrateur": "Administrator support",
"Sénégal": "Senegal",
"Terminée": "Completed",
"Annulée": "Cancelled",
"Transactions en cours": "Transactions in progress",
"Type de canal": "Channel type",
"Utilisateur": "User",
"Côte d'Ivoire": "Ivory Coast",
"Congo Brazzaville": "Congo Brazzaville",
"Congo RDC": "DR Congo",
"Guinée-Conakry": "Guinea-Conakry",
"Guinée-Bissau": "Guinea-Bissau",
"Utilise exactement le format JP-222222": "Use exactly the format JP-222222",
"Modifier": "Edit",
"Voir": "View",
"Voir tout": "See all",
"Version": "Version",
"Copier": "Copy",
"Déposer": "Deposit",
"Retirer": "Withdraw",
"Filtres": "Filters",
"Acheter ce canal": "Buy this channel",
"Confirmer le retrait": "Confirm the withdrawal",
"Contacter le support": "Contact support",
"Ouvrir la discussion": "Open the discussion",
"Soumettre mon canal": "Submit my channel",
"Accéder au panneau": "Open the panel",
"abonnés": "subscribers",
"Devise d'affichage": "Display currency",
"Tes soldes, dépôts et retraits restent en XAF. Les autres devises sont affichées à titre indicatif.": "Your balances, deposits and withdrawals stay in XAF. Other currencies are shown for information only.",
"Le taux du dollar n'est pas disponible pour le moment.": "The dollar rate is not available right now.",
"Euro €": "Euro €",
"Dollar $": "US Dollar $",
"XAF. Tu es prévenu dans le bot dès que JessiKaPay confirme.": "XAF. You are notified in the bot as soon as JessiKaPay confirms.",
"1 annonce": "1 listing",
"Montant réel :": "Actual amount:",
"Les frais JessiKaPay sont déduits du montant déposé.": "JessiKaPay fees are deducted from the deposited amount.",
"Tu recevras sur ton solde": "You will receive in your balance",
"Tu paieras environ": "You will pay about",
"(frais Mobile Money inclus)": "(Mobile Money fees included)",
"Bonjour à vous": "Hello there"
};
    var PATTERNS = [["^Bonjour (.+)$", "Hello $1"], ["^(.+) est dans le presse-papiers\\.$", "$1 is in the clipboard."], ["^Le retrait minimum est de (.+) XAF\\.$", "The minimum withdrawal is $1 XAF."], ["^Retrait minimum : (.+) XAF\\.$", "Minimum withdrawal: $1 XAF."], ["^Active « (.+) » pour NexMarket dans les administrateurs du canal, puis actualise la liste\\.$", "Enable “$1” for NexMarket in the channel administrators, then refresh the list."], ["^Le serveur répond avec le code (\\d+)\\.$", "The server responded with code $1."], ["^Le serveur est indisponible \\(HTTP (\\d+)\\)\\.$", "The server is unavailable (HTTP $1)."], ["^Vérification du dépôt: (.+)$", "Deposit check: $1"], ["^(\\d+) annonces$", "$1 listings"], ["^· 1 vente$", "· 1 sale"], ["^· (\\d+) ventes$", "· $1 sales"], ["^(.+) abonnés$", "$1 subscribers"], ["^(.+) abonnés · (.+)$", "$1 subscribers · $2"], ["^Frais JessiKaPay \\((.+)\\)$", "JessiKaPay fee ($1)"]].map(function (p) { return [new RegExp(p[0]), p[1]]; });
    var lang = "fr";
    var records = new WeakMap();      // nœud texte -> {src, out}
    var attrRecords = new WeakMap();  // élément -> {attr: {src, out}}
    var ATTRS = ["placeholder", "title", "aria-label", "alt"];
    var busy = false;
    var observer = null;
    var pending = new Set();
    var scheduled = false;

    function norm(s) { return String(s).replace(/\u2019/g, "'").replace(/\s+/g, " ").trim(); }

    function translate(src) {
        var n = norm(src);
        if (!n) return null;
        if (Object.prototype.hasOwnProperty.call(EN, n)) return EN[n];
        for (var i = 0; i < PATTERNS.length; i++) {
            if (PATTERNS[i][0].test(n)) return n.replace(PATTERNS[i][0], PATTERNS[i][1]);
        }
        return null;
    }

    function t(text) {
        if (lang !== "en" || typeof text !== "string") return text;
        var out = translate(text);
        return out === null ? text : out;
    }

    function skip(node) {
        var p = node.parentNode;
        return !p || /^(SCRIPT|STYLE|TEXTAREA|CODE)$/.test(p.nodeName) ||
               (p.closest && p.closest("[data-no-i18n]"));
    }

    function doText(node) {
        if (skip(node)) return;
        var rec = records.get(node);
        var cur = node.nodeValue;
        if (lang === "en") {
            var src = rec && cur === rec.out ? rec.src : cur;
            var out = translate(src);
            if (out === null) { if (rec) records.delete(node); return; }
            var lead = (src.match(/^\s*/) || [""])[0], trail = (src.match(/\s*$/) || [""])[0];
            var val = lead + out + trail;
            if (val !== cur) node.nodeValue = val;
            records.set(node, { src: src, out: val });
        } else if (rec) {
            if (cur === rec.out) node.nodeValue = rec.src;
            records.delete(node);
        }
    }

    function doAttrs(el) {
        if (!el.getAttribute) return;
        var rec = attrRecords.get(el) || {};
        ATTRS.forEach(function (a) {
            if (!el.hasAttribute(a)) { delete rec[a]; return; }
            var cur = el.getAttribute(a), r = rec[a];
            if (lang === "en") {
                var src = r && cur === r.out ? r.src : cur;
                var out = translate(src);
                if (out === null) { delete rec[a]; return; }
                if (out !== cur) el.setAttribute(a, out);
                rec[a] = { src: src, out: out };
            } else if (r) {
                if (cur === r.out) el.setAttribute(a, r.src);
                delete rec[a];
            }
        });
        attrRecords.set(el, rec);
    }

    function walk(root) {
        if (!root) return;
        if (root.nodeType === 3) { doText(root); return; }
        if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
        if (root.nodeType === 1) doAttrs(root);
        var tw = document.createTreeWalker(root, 1 | 4, null);
        var n;
        while ((n = tw.nextNode())) {
            if (n.nodeType === 3) doText(n); else doAttrs(n);
        }
    }

    function flush() {
        scheduled = false;
        busy = true;
        try { pending.forEach(walk); } finally { pending.clear(); busy = false; }
        if (observer) observer.takeRecords();
    }
    function schedule(node) {
        pending.add(node);
        if (!scheduled) { scheduled = true; (window.requestAnimationFrame || setTimeout)(flush); }
    }

    function startObserver() {
        if (observer || !window.MutationObserver) return;
        observer = new MutationObserver(function (list) {
            if (busy) return;
            list.forEach(function (m) {
                if (m.type === "childList") m.addedNodes.forEach(schedule);
                else if (m.type === "characterData") schedule(m.target);
                else if (m.type === "attributes") schedule(m.target);
            });
        });
        observer.observe(document.documentElement, {
            childList: true, subtree: true, characterData: true,
            attributes: true, attributeFilter: ATTRS
        });
    }

    function setLang(next, opts) {
        next = next === "en" ? "en" : "fr";
        lang = next;
        try { if (!opts || opts.persist !== false) localStorage.setItem(STORE_KEY, next); } catch (e) {}
        document.documentElement.setAttribute("lang", next);
        busy = true;
        try { walk(document.body); } finally { busy = false; }
        if (observer) observer.takeRecords();
        try { document.dispatchEvent(new CustomEvent("nexlangchange", { detail: next })); } catch (e) {}
    }
    function getLang() { return lang; }
    function stored() { try { return localStorage.getItem(STORE_KEY); } catch (e) { return null; } }
    function locale() { return lang === "en" ? "en-US" : "fr-FR"; }

    // Boîtes de dialogue natives (confirm / prompt / alert)
    ["confirm", "prompt", "alert"].forEach(function (name) {
        var orig = window[name];
        if (typeof orig !== "function") return;
        window[name] = function (message) {
            var args = Array.prototype.slice.call(arguments);
            args[0] = t(message);
            return orig.apply(window, args);
        };
    });

    window.NexI18n = { setLang: setLang, getLang: getLang, t: t, locale: locale, stored: stored };

    function boot() {
        startObserver();
        var s = stored();
        if (s === "en" || s === "fr") setLang(s, { persist: false });
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
})();
