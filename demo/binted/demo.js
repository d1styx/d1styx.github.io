/*
 * Version de démonstration statique de BINTED pour le portfolio.
 * Sur le site d'origine, le panier, les commandes et les dons passent par PHP (sessions).
 * Ici, la même logique est rejouée dans le navigateur : rien n'est envoyé ni enregistré.
 * Les pages ont été générées depuis les fichiers PHP avec des valeurs repères (__PRENOM__, 9091…)
 * que ce script remplace par ce que le visiteur a saisi.
 */
(function () {
  var KEY = 'binted-demo';
  var memoire = {};
  // Valeurs repères écrites au moment de la génération des pages
  var REP = { article: '__ITEM__', prixArticle: '9091', montantDon: '9092', numCommande: '1600', refDon: 'D-26111', date: '28/10/2026 17:13' };

  function lire() {
    try { return JSON.parse(sessionStorage.getItem(KEY)) || {}; } catch (e) { return memoire; }
  }
  function ecrire(etat) {
    memoire = etat;
    try { sessionStorage.setItem(KEY, JSON.stringify(etat)); } catch (e) {}
  }
  function aller(page) { window.location.href = page; }
  function maintenant() {
    var d = new Date();
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
  function hasard(min, max) { return Math.floor(min + Math.random() * (max - min + 1)); }
  function totalDe(panier) { return panier.reduce(function (s, a) { return s + Number(a.prix); }, 0); }
  function valeur(form, nom) {
    var el = form.elements[nom];
    return el ? String(el.value || '').trim() : '';
  }

  // Remplace des textes repères dans toutes les zones de texte de la page
  function remplacer(paires) {
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    var n;
    while ((n = w.nextNode())) {
      var t = n.nodeValue, avant = t;
      paires.forEach(function (p) { t = t.split(p[0]).join(p[1]); });
      if (t !== avant) n.nodeValue = t;
    }
  }

  // Une ligne modèle (générée avec l'article repère) est dupliquée pour chaque article du panier
  function lignes(modele, panier, suffixePrix) {
    if (!modele) return;
    var parent = modele.parentNode;
    panier.forEach(function (a) {
      var l = modele.cloneNode(true);
      var cellules = l.children;
      cellules[0].textContent = a.nom;
      cellules[cellules.length - 1].textContent = a.prix + suffixePrix;
      parent.insertBefore(l, modele);
    });
    parent.removeChild(modele);
  }

  var page = (window.location.pathname.split('/').pop() || 'index.html');
  var etat = lire();
  var panier = etat.panier || [];

  // Formulaires : on rejoue ce que faisaient panier.php et traitement_*.php
  document.addEventListener('submit', function (e) {
    var form = e.target;
    var action = form.getAttribute('action') || '';
    if (!/\.php$/.test(action)) return;
    e.preventDefault();
    etat = lire();
    if (action === 'panier.php') {
      etat.panier = (etat.panier || []).concat([{ nom: valeur(form, 'nom'), prix: Number(valeur(form, 'prix')) }]);
      ecrire(etat);
      aller('shop.html');
    } else if (action === 'traitement_don.php') {
      var libre = parseInt(valeur(form, 'montant_libre'), 10);
      var coche = form.querySelector('input[name="choix_montant"]:checked');
      var montant = libre > 0 ? libre : (coche ? parseInt(coche.value, 10) : 0);
      if (!(montant > 0)) { alert('Choisissez un montant de don.'); return; }
      etat.don = {
        montant: montant, statut: valeur(form, 'statut'),
        prenom: valeur(form, 'prenom'), nom: valeur(form, 'nom'), email: valeur(form, 'email'),
        numero: 'D-' + hasard(10000, 99999), date: maintenant()
      };
      ecrire(etat);
      aller('merci_don.html');
    } else if (action === 'traitement_contact.php') {
      aller('contact.html?success=1');
    } else if (action === 'traitement_commande.php') {
      var articles = etat.panier || [];
      if (!articles.length) { aller('shop.html'); return; }
      etat.commande = {
        prenom: valeur(form, 'prenom'), nom: valeur(form, 'nom'), email: valeur(form, 'email'),
        adresse: valeur(form, 'adresse'), articles: articles, total: totalDe(articles),
        numero: String(hasard(1000, 9999)), date: maintenant()
      };
      etat.panier = [];
      ecrire(etat);
      aller('confirmation.html');
    }
  });

  // Lien « Vider » du panier
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="panier.php?action=vider"]');
    if (!a) return;
    e.preventDefault();
    etat = lire();
    etat.panier = [];
    ecrire(etat);
    aller('shop.html');
  });

  if (page === 'shop.html') {
    var total = totalDe(panier);
    var badge = document.querySelector('.cart-badge');
    if (badge) badge.textContent = panier.length;
    var barre = document.querySelector('.filters-bar .flex-between');
    if (barre) {
      var totalBarre = barre.querySelector('strong');
      if (totalBarre) totalBarre.textContent = total + '€';
      var droite = barre.children[barre.children.length - 1];
      if (droite && panier.length) {
        droite.innerHTML = '<a href="panier.php?action=vider" class="text-muted" style="font-size: 0.9rem; text-decoration: underline; margin-right: 10px;">Vider</a>' +
          '<a href="checkout.html" class="btn-don" style="background-color: var(--text-main);">Commander <i class="fas fa-arrow-right"></i></a>';
      }
    }
    var liste = document.querySelector('.cart-items-container');
    if (liste && panier.length) {
      liste.innerHTML = '';
      panier.forEach(function (a) {
        var l = document.createElement('div');
        l.className = 'cart-row';
        var nom = document.createElement('span'); nom.textContent = a.nom;
        var prix = document.createElement('strong'); prix.textContent = a.prix + '€';
        l.appendChild(nom); l.appendChild(prix);
        liste.appendChild(l);
      });
    }
    var totalModale = document.querySelector('.cart-total strong');
    if (totalModale) totalModale.textContent = total + ' €';
  }

  if (page === 'checkout.html') {
    if (!panier.length) { window.location.replace('shop.html'); return; }
    lignes(document.querySelector('.order-list .order-item'), panier, '€');
    remplacer([[REP.prixArticle, String(totalDe(panier))]]);
  }

  if (page === 'confirmation.html') {
    var c = etat.commande;
    if (!c) { window.location.replace('shop.html'); return; }
    lignes(document.querySelector('table tbody tr'), c.articles, ' €');
    remplacer([
      ['__PRENOM__', c.prenom], ['__NOM__', c.nom], ['__EMAIL__', c.email], ['__ADRESSE__', c.adresse],
      [REP.prixArticle, String(c.total)], ['N° ' + REP.numCommande, 'N° ' + c.numero], [REP.date, c.date]
    ]);
  }

  if (page === 'merci_don.html') {
    var d = etat.don;
    if (!d) { window.location.replace('don.html'); return; }
    var statuts = { particulier: 'Particulier', entreprise: 'Entreprise', association: 'Association', autre: 'Autre' };
    remplacer([
      ['__PRENOM__', d.prenom], ['__NOM__', d.nom], ['__EMAIL__', d.email],
      ['__STATUT__', statuts[d.statut] || d.statut], [REP.montantDon, String(d.montant)],
      [REP.refDon, d.numero], [REP.date, d.date]
    ]);
  }
})();
