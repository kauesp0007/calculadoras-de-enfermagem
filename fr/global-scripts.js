/**
 * =================================================================================
 * ENREGISTREMENT DU SERVICE WORKER
 * Ce code vérifie si le navigateur prend en charge les Service Workers et, si c'est le cas,
 * enregistre le fichier sw.js pour activer le cache hors ligne.
 * =================================================================================
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('Service Worker enregistré avec succès:', registration.scope);
    }, err => {
      console.log("Échec de l'enregistrement du Service Worker:", err);
    });
  });
}

/**
 * =================================================================================
 * FICHIER DE SCRIPTS GLOBAUX - VERSION CORRIGÉE ET UNIFIÉE
 * Ce fichier contient toute la logique JavaScript partagée par le site.
 * =================================================================================
 */

// Dépendance: Nécessite la bibliothèque jsPDF et html2canvas (chargées dans le HTML principal, si nécessaire)

function gerarPDFGlobal(options) {
    const {
        titulo = 'Rapport de la Calculatrice', // Titre par défaut pour le PDF
        subtitulo = 'Rapport de Calcul d\'Assistance', // Sous-titre par défaut pour le PDF
        nomeArquivo = 'rapport.pdf', // Nom de fichier par défaut
        seletorConteudo = '.main-content-wrapper' // Sélecteur CSS pour le contenu principal
    } = options;

    console.log(`Démarrage de la génération du PDF pour : ${titulo}`);
    const elementoParaImprimir = document.querySelector(seletorConteudo);

    if (!elementoParaImprimir) {
        alert("Erreur : Impossible de trouver le contenu principal.");
        return;
    }

    // Configuration pour html2canvas
    const config = {
        scale: 2, // Augmente la résolution pour une meilleure qualité d'image
        useCORS: true, // Active l'utilisation d'images provenant d'autres domaines (important pour les logos)
        allowTaint: true
    };

    // Génère le canvas à partir de l'élément HTML
    html2canvas(elementoParaImprimir, config).then(canvas => {
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const pdf = new jspdf.jsPDF('p', 'mm', 'a4'); // 'p' = portrait, 'mm' = millimètres, 'a4' = format

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;
        let position = 0;
        let heightLeft = imgHeight;

        // Ajoute l'en-tête avec le titre et le sous-titre
        pdf.setFontSize(16);
        pdf.setTextColor(26, 62, 116); // Couleur bleu foncé
        pdf.text(titulo, 15, 15);

        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100); // Couleur grise
        pdf.text(subtitulo, 15, 20);

        // Ajoute l'image au PDF
        position = 25; // Commence après l'en-tête
        heightLeft = imgHeight;

        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
        heightLeft -= (pdfHeight - position);

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight + 25; // Le 25 est la marge supérieure
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
            heightLeft -= (pdfHeight - 25);
        }

        // Sauvegarde le PDF
        pdf.save(nomeArquivo);
        console.log(`PDF ${nomeArquivo} généré avec succès.`);
    }).catch(error => {
        console.error("Erreur lors de la génération du PDF:", error);
        alert('Une erreur est survenue lors de la génération du PDF.');
    });
}


/**
 * =================================================================================
 * LOGIQUE DU MENU HORS-CANVAS ET NAVIGATION
 * Gère l'ouverture/fermeture du menu mobile et la navigation dans les sous-menus.
 * =================================================================================
 */
function initializeMenuLogic() {
    const hamburgerBtn = document.getElementById('hamburgerButton');
    const closeMenuBtn = document.getElementById('closeMenuButton');
    const offCanvasMenu = document.getElementById('offCanvasMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    const menuItemsWithSubmenu = document.querySelectorAll('#offCanvasMenu .has-submenu > button');

    // État du menu (ouvert/fermé)
    const isMenuOpen = () => offCanvasMenu.classList.contains('menu-open');

    // Basculer le menu hors-canvas
    const toggleMenu = (open) => {
        if (open === true || !isMenuOpen()) {
            offCanvasMenu.classList.add('menu-open');
            menuOverlay.classList.add('is-visible');
            hamburgerBtn.setAttribute('aria-expanded', 'true');
            // Concentre le bouton de fermeture pour une meilleure accessibilité
            closeMenuBtn.focus();
        } else {
            offCanvasMenu.classList.remove('menu-open');
            menuOverlay.classList.remove('is-visible');
            hamburgerBtn.setAttribute('aria-expanded', 'false');
            // Retourne le focus sur le bouton hamburger
            hamburgerBtn.focus();
        }
    };

    // Basculer les sous-menus sur mobile
    const toggleSubmenu = (button) => {
        const submenuId = button.getAttribute('data-submenu-toggle');
        const submenu = document.getElementById(`submenu-${submenuId}`);
        const icon = button.querySelector('i');

        if (submenu && icon) {
            const isSubmenuOpen = submenu.classList.contains('open');

            // Ferme tous les sous-menus ouverts (sauf celui cliqué)
            document.querySelectorAll('#offCanvasMenu .submenu.open').forEach(openSubmenu => {
                if (openSubmenu !== submenu) {
                    openSubmenu.classList.remove('open');
                    openSubmenu.previousElementSibling.querySelector('i').classList.remove('fa-chevron-up');
                    openSubmenu.previousElementSibling.querySelector('i').classList.add('fa-chevron-down');
                }
            });

            // Bascule le sous-menu cliqué
            if (isSubmenuOpen) {
                submenu.classList.remove('open');
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
            } else {
                submenu.classList.add('open');
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
            }
        }
    };

    // Écouteurs d'événements
    hamburgerBtn.addEventListener('click', () => toggleMenu(true));
    closeMenuBtn.addEventListener('click', () => toggleMenu(false));
    menuOverlay.addEventListener('click', () => toggleMenu(false)); // Fermer en cliquant sur l'overlay

    // Ajoute l'écouteur pour les boutons de sous-menu
    menuItemsWithSubmenu.forEach(button => {
        button.addEventListener('click', () => toggleSubmenu(button));
    });

    // Fermer le menu avec la touche ÉCHAP
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isMenuOpen()) {
            toggleMenu(false);
        }
    });

    // Met à jour l'état du menu pour l'accessibilité lorsque le focus est donné par le clavier
    document.addEventListener('focusin', (e) => {
        // Si le menu est ouvert et que le focus quitte le menu ou les boutons d'ouverture, fermer.
        if (isMenuOpen() && !offCanvasMenu.contains(e.target) && e.target !== hamburgerBtn) {
            // Remarque : Cette logique peut être complexe. Pour la simplicité, nous nous concentrons sur la fermeture uniquement avec ÉCHAP.
        }
    });

    console.log('Logique du menu mobile et des sous-menus initialisée.');
}

/**
 * =================================================================================
 * FONCTIONNALITÉ DE RECHERCHE
 * Permet de rechercher du texte sur la page principale (index.html).
 * =================================================================================
 */
function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchButton');
    const mainContent = document.querySelector('.main-content-wrapper');

    if (!searchInput || !searchBtn || !mainContent) {
        // Si l'élément n'existe pas, la page n'est pas index.html (ou équivalent), ignore la recherche
        return;
    }

    const searchFunction = () => {
        const searchTerm = searchInput.value.trim().toLowerCase();
        if (searchTerm) {
            // Utilise XPath pour rechercher du texte sur toute la page, sauf dans les éléments de script et de style
            const allElements = mainContent.querySelectorAll('p, h1, h2, h3, h4, li, a');
            let firstMatch = null;

            // Supprime les surlignages précédents
            document.querySelectorAll('.highlight').forEach(span => {
                span.outerHTML = span.innerHTML;
            });

            // Ière sur tous les éléments de texte
            allElements.forEach(element => {
                const innerHTML = element.innerHTML;
                const regex = new RegExp(`(${searchTerm})`, 'gi'); // 'gi' = global, insensible à la casse

                // Remplace la correspondance par une balise span de surlignage
                const newHTML = innerHTML.replace(regex, (match) => {
                    return `<span class="highlight bg-yellow-300 rounded-sm">${match}</span>`;
                });

                if (newHTML !== innerHTML) {
                    element.innerHTML = newHTML;
                    if (!firstMatch) {
                        firstMatch = element;
                    }
                }
            });

            // Fait défiler jusqu'au premier résultat trouvé
            if (firstMatch) {
                firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                alert('Aucun résultat trouvé.');
            }
        }
    };

    searchBtn.addEventListener('click', searchFunction);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchFunction();
        }
    });


    console.log('Fonctionnalité de recherche initialisée.');
}


/**
 * =================================================================================
 * FONCTIONNALITÉ DE TRADUCTION (Google Translate)
 * Intègre le widget Google Translate et les boutons de langue personnalisés.
 * =================================================================================
 */
function initializeTranslation() {
    // Initialise le widget Google Translate
    window.googleTranslateElementInit = function() {
        new google.translate.TranslateElement({
            pageLanguage: 'pt', // Langue de la page source (Portugais)
            includedLanguages: 'en,es,pt,fr', // Langues de traduction
            layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false
        }, 'google_translate_element'); // Cache le widget et utilise un élément factice
    };

    // Charge le script Google Translate
    const googleTranslateScript = document.createElement('script');
    googleTranslateScript.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    googleTranslateScript.async = true;
    document.body.appendChild(googleTranslateScript);

    // Fonction globale pour déclencher la traduction via les boutons de langue
    window.translatePage = function(language) {
        const googleTranslateElement = document.querySelector('.goog-te-combo');
        if (googleTranslateElement) {
            googleTranslateElement.value = language;
            // Déclenche l'événement 'change' pour lancer la traduction
            googleTranslateElement.dispatchEvent(new Event('change'));
        }
    };

    // Écouteur pour les boutons de langue
    document.querySelectorAll('.language-option').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const lang = item.getAttribute('data-lang');
            if (lang) {
                window.translatePage(lang);
            }
        });
    });

    console.log('Fonctionnalité de traduction initialisée.');
}

/**
 * =================================================================================
 * INITIALISATION GÉNÉRALE
 * =================================================================================
 */
document.addEventListener('DOMContentLoaded', () => {
    initializeMenuLogic();
    initializeSearch();
    initializeTranslation();
    console.log('Scripts globaux : initialisation complète.');
});
