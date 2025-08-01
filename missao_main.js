// missao_main.js

// --- Accessibility Features ---
const body = document.body;
const fontSizeText = document.getElementById('fontSizeText');
const lineHeightText = document.getElementById('lineHeightText');
const letterSpacingText = document.getElementById('letterSpacingText');
const readingSpeedText = document.getElementById('readingSpeedText');
const toggleLeituraBtn = document.getElementById('toggleLeituraBtn');
let currentFontSize = 1; // 1 = normal, 2 = médio, 3 = grande
let currentLineHeight = 1; // 1 = médio, 2 = grande, 3 = extra grande
let currentLetterSpacing = 1; // 1 = normal, 2 = médio, 3 = grande
let currentReadingSpeed = 1; // 1 = normal, 2 = lento, 3 = rápido
let speechSynthesizer = window.speechSynthesis;
let utterance = null;
let isReading = false;
let currentFocusColor = localStorage.getItem('focusColor') || 'yellow';

/**
 * Applies saved accessibility settings from localStorage on page load.
 */
function applySavedSettings() {
    // Apply font size
    const savedFontSize = localStorage.getItem('fontSize');
    if (savedFontSize) {
        currentFontSize = parseInt(savedFontSize);
        updateFontSize();
    }

    // Apply line height
    const savedLineHeight = localStorage.getItem('lineHeight');
    if (savedLineHeight) {
        currentLineHeight = parseInt(savedLineHeight);
        updateLineHeight();
    }

    // Apply letter spacing
    const savedLetterSpacing = localStorage.getItem('letterSpacing');
    if (savedLetterSpacing) {
        currentLetterSpacing = parseInt(savedLetterSpacing);
        updateLetterSpacing();
    }

    // Apply reading speed
    const savedReadingSpeed = localStorage.getItem('readingSpeed');
    if (savedReadingSpeed) {
        currentReadingSpeed = parseInt(savedReadingSpeed);
        updateReadingSpeed();
    }

    // Apply contrast mode
    if (localStorage.getItem('contrasteAlto') === 'true') {
        body.classList.add('contraste-alto');
    }

    // Apply dark mode
    if (localStorage.getItem('darkMode') === 'true') {
        body.classList.add('dark-mode');
    }

    // Apply dyslexia font
    if (localStorage.getItem('fonteDislexia') === 'true') {
        body.classList.add('fonte-dislexia');
    }

    // Apply focus color
    const savedFocusColor = localStorage.getItem('focusColor');
    if (savedFocusColor) {
        currentFocusColor = savedFocusColor;
        document.documentElement.style.setProperty('--cor-foco-acessibilidade', currentFocusColor);
        updateFocusColorButtons(currentFocusColor);
    }
}

/**
 * Updates the font size of the body and saves the setting.
 */
function updateFontSize() {
    switch (currentFontSize) {
        case 1:
            body.style.fontSize = '1em';
            if (fontSizeText) fontSizeText.textContent = 'Normal';
            break;
        case 2:
            body.style.fontSize = '1.15em';
            if (fontSizeText) fontSizeText.textContent = 'Médio';
            break;
        case 3:
            body.style.fontSize = '1.3em';
            if (fontSizeText) fontSizeText.textContent = 'Grande';
            break;
    }
    localStorage.setItem('fontSize', currentFontSize);
}

/**
 * Toggles between different font sizes.
 */
window.alternarTamanhoFonte = function() {
    currentFontSize = (currentFontSize % 3) + 1;
    updateFontSize();
};

/**
 * Updates the line height of the body and saves the setting.
 */
function updateLineHeight() {
    switch (currentLineHeight) {
        case 1:
            document.documentElement.style.setProperty('--espacamento-linha', '1.5');
            if (lineHeightText) lineHeightText.textContent = 'Médio';
            break;
        case 2:
            document.documentElement.style.setProperty('--espacamento-linha', '1.8');
            if (lineHeightText) lineHeightText.textContent = 'Grande';
            break;
        case 3:
            document.documentElement.style.setProperty('--espacamento-linha', '2.0');
            if (lineHeightText) lineHeightText.textContent = 'Extra Grande';
            break;
    }
    localStorage.setItem('lineHeight', currentLineHeight);
}

/**
 * Toggles between different line heights.
 */
window.alternarEspacamentoLinha = function() {
    currentLineHeight = (currentLineHeight % 3) + 1;
    updateLineHeight();
};

/**
 * Updates the letter spacing of the body and saves the setting.
 */
function updateLetterSpacing() {
    switch (currentLetterSpacing) {
        case 1:
            document.documentElement.style.setProperty('--espacamento-letra', '0em');
            if (letterSpacingText) letterSpacingText.textContent = 'Normal';
            break;
        case 2:
            document.documentElement.style.setProperty('--espacamento-letra', '0.05em');
            if (letterSpacingText) letterSpacingText.textContent = 'Médio';
            break;
        case 3:
            document.documentElement.style.setProperty('--espacamento-letra', '0.1em');
            if (letterSpacingText) letterSpacingText.textContent = 'Grande';
            break;
    }
    localStorage.setItem('letterSpacing', currentLetterSpacing);
}

/**
 * Toggles between different letter spacings.
 */
window.alternarEspacamentoLetra = function() {
    currentLetterSpacing = (currentLetterSpacing % 3) + 1;
    updateLetterSpacing();
};

/**
 * Updates the reading speed and saves the setting.
 */
function updateReadingSpeed() {
    let rate = 1;
    switch (currentReadingSpeed) {
        case 1:
            rate = 1;
            if (readingSpeedText) readingSpeedText.textContent = 'Normal';
            break;
        case 2:
            rate = 0.75;
            if (readingSpeedText) readingSpeedText.textContent = 'Lento';
            break;
        case 3:
            rate = 1.25;
            if (readingSpeedText) readingSpeedText.textContent = 'Rápido';
            break;
    }
    if (utterance) {
        utterance.rate = rate;
    }
    localStorage.setItem('readingSpeed', currentReadingSpeed);
}

/**
 * Toggles between different reading speeds.
 */
window.alternarVelocidadeLeitura = function() {
    currentReadingSpeed = (currentReadingSpeed % 3) + 1;
    updateReadingSpeed();
    // If reading, restart with new speed
    if (isReading) {
        reiniciarLeitura();
    }
};

/**
 * Toggles text-to-speech reading of main content.
 */
window.toggleLeitura = function() {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    if (isReading) {
        speechSynthesizer.pause();
        isReading = false;
        if (toggleLeituraBtn) {
            toggleLeituraBtn.innerHTML = '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-play"><polygon points="5 3 19 12 5 21 5 3"/></svg><span class="sr-only" id="toggleLeituraText">Reproduzir Leitura</span>';
        }
    } else {
        if (speechSynthesizer.paused && utterance) {
            speechSynthesizer.resume();
        } else {
            const textToRead = mainContent.innerText;
            utterance = new SpeechSynthesisUtterance(textToRead);
            utterance.lang = 'pt-BR';
            utterance.rate = currentReadingSpeed === 1 ? 1 : (currentReadingSpeed === 2 ? 0.75 : 1.25); // Apply saved speed
            utterance.onend = () => {
                isReading = false;
                if (toggleLeituraBtn) {
                    toggleLeituraBtn.innerHTML = '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-play"><polygon points="5 3 19 12 5 21 5 3"/></svg><span class="sr-only" id="toggleLeituraText">Reproduzir Leitura</span>';
                }
            };
            speechSynthesizer.speak(utterance);
        }
        isReading = true;
        if (toggleLeituraBtn) {
            toggleLeituraBtn.innerHTML = '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pause"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg><span class="sr-only" id="toggleLeituraText">Pausar Leitura</span>';
        }
    }
};

/**
 * Restarts text-to-speech reading from the beginning.
 */
window.reiniciarLeitura = function() {
    if (speechSynthesizer.speaking) {
        speechSynthesizer.cancel();
    }
    isReading = false;
    toggleLeitura(); // Start reading from the beginning
};

/**
 * Toggles high contrast mode.
 */
window.alternarContraste = function() {
    body.classList.toggle('contraste-alto');
    localStorage.setItem('contrasteAlto', body.classList.contains('contraste-alto'));
};

/**
 * Toggles dark mode.
 */
window.alternarModoEscuro = function() {
    body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', body.classList.contains('dark-mode'));
};

/**
 * Toggles OpenDyslexic font.
 */
window.alternarFonteDislexia = function() {
    body.classList.toggle('fonte-dislexia');
    localStorage.setItem('fonteDislexia', body.classList.contains('fonte-dislexia'));
};

/**
 * Sets the accessibility focus color.
 * @param {string} color - The color to set (e.g., 'yellow', 'lime').
 */
window.definirCorFoco = function(color) {
    currentFocusColor = color;
    document.documentElement.style.setProperty('--cor-foco-acessibilidade', color);
    localStorage.setItem('focusColor', color);
    updateFocusColorButtons(currentFocusColor);
};

/**
 * Updates the visual state of the focus color selection buttons.
 * @param {string} selectedColor - The currently selected color.
 */
function updateFocusColorButtons(selectedColor) {
    document.querySelectorAll('#barraAcessibilidade .color-option').forEach(button => {
        if (button.style.backgroundColor === selectedColor) {
            button.classList.add('selected');
        } else {
            button.classList.remove('selected');
        }
    });
}

/**
 * Resets all accessibility settings to default.
 */
window.resetarAcessibilidade = function() {
    // Reset font size
    currentFontSize = 1;
    updateFontSize();
    body.style.fontSize = ''; // Remove inline style

    // Reset line height
    currentLineHeight = 1;
    updateLineHeight();
    document.documentElement.style.setProperty('--espacamento-linha', '1.5');

    // Reset letter spacing
    currentLetterSpacing = 1;
    updateLetterSpacing();
    document.documentElement.style.setProperty('--espacamento-letra', '0em');

    // Reset reading speed
    currentReadingSpeed = 1;
    updateReadingSpeed();
    if (speechSynthesizer.speaking) {
        speechSynthesizer.cancel();
        isReading = false;
        if (toggleLeituraBtn) {
            toggleLeituraBtn.innerHTML = '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-play"><polygon points="5 3 19 12 5 21 5 3"/></svg><span class="sr-only" id="toggleLeituraText">Reproduzir Leitura</span>';
        }
    }

    // Remove contrast, dark mode, and dyslexia font classes
    body.classList.remove('contraste-alto', 'dark-mode', 'fonte-dislexia');

    // Reset focus color
    definirCorFoco('yellow'); // Set default focus color

    // Clear all accessibility related localStorage items
    localStorage.removeItem('fontSize');
    localStorage.removeItem('lineHeight');
    localStorage.removeItem('letterSpacing');
    localStorage.removeItem('readingSpeed');
    localStorage.removeItem('contrasteAlto');
    localStorage.removeItem('darkMode');
    localStorage.removeItem('fonteDislexia');
    localStorage.removeItem('focusColor');
};

// Apply saved settings on page load
document.addEventListener('DOMContentLoaded', applySavedSettings);

// --- Back to Top Button ---
const backToTopBtn = document.getElementById('backToTopBtn');

/**
 * Checks the scroll position and shows/hides the "Back to Top" button.
 */
function checkScrollPosition() {
    if (backToTopBtn) {
        if (window.scrollY > 200) { // Show button after scrolling 200px
            backToTopBtn.style.display = 'block';
        } else {
            backToTopBtn.style.display = 'none';
        }
    }
}

/**
 * Scrolls the page to the top smoothly.
 */
window.scrollToTop = function() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
};

// Add scroll listener for the "Back to Top" button
window.addEventListener('scroll', checkScrollPosition);
// Initial check on load
document.addEventListener('DOMContentLoaded', checkScrollPosition);

// --- Quick Access Nursing Assistant Button (Draggable) ---
const quickAccessNursingAssistantBtn = document.getElementById('quickAccessNursingAssistantBtn');
let isDragging = false;
let offsetX, offsetY;

if (quickAccessNursingAssistantBtn) {
    quickAccessNursingAssistantBtn.addEventListener('mousedown', (e) => {
        isDragging = true;
        // Calculate offset from mouse position to button's top-left corner
        offsetX = e.clientX - quickAccessNursingAssistantBtn.getBoundingClientRect().left;
        offsetY = e.clientY - quickAccessNursingAssistantBtn.getBoundingClientRect().top;
        quickAccessNursingAssistantBtn.style.cursor = 'grabbing';
        quickAccessNursingAssistantBtn.style.transition = 'none'; // Disable transition during drag
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        // Calculate new position
        let newX = e.clientX - offsetX;
        let newY = e.clientY - offsetY;

        // Get viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Get button dimensions
        const buttonWidth = quickAccessNursingAssistantBtn.offsetWidth;
        const buttonHeight = quickAccessNursingAssistantBtn.offsetHeight;

        // Clamp newX and newY to stay within viewport bounds
        newX = Math.max(0, Math.min(newX, viewportWidth - buttonWidth));
        newY = Math.max(0, Math.min(newY, viewportHeight - buttonHeight));

        // Apply new position using 'left' and 'top'
        quickAccessNursingAssistantBtn.style.left = `${newX}px`;
        quickAccessNursingAssistantBtn.style.top = `${newY}px`;
        quickAccessNursingAssistantBtn.style.right = 'auto'; // Disable 'right' when dragging
        quickAccessNursingAssistantBtn.style.bottom = 'auto'; // Disable 'bottom' when dragging
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            quickAccessNursingAssistantBtn.style.cursor = 'grab';
            quickAccessNursingAssistantBtn.style.transition = 'bottom 0.3s ease, right 0.3s ease'; // Re-enable transition
            // Save the new position to local storage if desired, or reset to original fixed position
            // For now, it will stay where it was dropped until page refresh.
            // If you want it to snap back to the original fixed position, remove the left/top styles here.
        }
    });

    // Touch events for mobile dragging
    quickAccessNursingAssistantBtn.addEventListener('touchstart', (e) => {
        isDragging = true;
        const touch = e.touches[0];
        offsetX = touch.clientX - quickAccessNursingAssistantBtn.getBoundingClientRect().left;
        offsetY = touch.clientY - quickAccessNursingAssistantBtn.getBoundingClientRect().top;
        quickAccessNursingAssistantBtn.style.cursor = 'grabbing';
        quickAccessNursingAssistantBtn.style.transition = 'none';
        e.preventDefault(); // Prevent scrolling while dragging
    });

    document.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const touch = e.touches[0];

        let newX = touch.clientX - offsetX;
        let newY = touch.clientY - offsetY;

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const buttonWidth = quickAccessNursingAssistantBtn.offsetWidth;
        const buttonHeight = quickAccessNursingAssistantBtn.offsetHeight;

        newX = Math.max(0, Math.min(newX, viewportWidth - buttonWidth));
        newY = Math.max(0, Math.min(newY, viewportHeight - buttonHeight));

        quickAccessNursingAssistantBtn.style.left = `${newX}px`;
        quickAccessNursingAssistantBtn.style.top = `${newY}px`;
        quickAccessNursingAssistantBtn.style.right = 'auto';
        quickAccessNursingAssistantBtn.style.bottom = 'auto';
        e.preventDefault(); // Prevent scrolling while dragging
    });

    document.addEventListener('touchend', () => {
        if (isDragging) {
            isDragging = false;
            quickAccessNursingAssistantBtn.style.cursor = 'grab';
            quickAccessNursingAssistantBtn.style.transition = 'bottom 0.3s ease, right 0.3s ease';
        }
    });
}

/**
 * Placeholder function for the Nursing Assistant quick access.
 * Replace with actual functionality.
 */
window.quickAccessNursingAssistant = function() {
    showCustomModal('Olá! Eu sou seu Assistente de Enfermagem. Como posso ajudar hoje?');
    // Implement actual AI assistant logic here
};

// --- Custom Modal Logic ---
const customModal = document.getElementById('customModal');
const modalMessage = document.getElementById('modalMessage');
const modalCloseButton = document.getElementById('modalCloseButton');

/**
 * Displays a custom modal with a given message.
 * @param {string} message - The message to display in the modal.
 */
window.showCustomModal = function(message) {
    if (customModal && modalMessage) {
        modalMessage.textContent = message;
        customModal.classList.remove('hidden');
        customModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden'; // Prevent scrolling behind modal
        modalCloseButton.focus(); // Focus the close button for accessibility
    }
};

/**
 * Hides the custom modal.
 */
window.hideCustomModal = function() {
    if (customModal) {
        customModal.classList.add('hidden');
        customModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = ''; // Restore body scrolling
    }
};

if (modalCloseButton) {
    modalCloseButton.addEventListener('click', hideCustomModal);
}

// Close modal if escape key is pressed
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !customModal.classList.contains('hidden')) {
        hideCustomModal();
    }
    // Removed video tutorial modal close on escape key as the modal is removed
});

// --- Newsletter Subscription Logic ---
const newsletterEmail = document.getElementById('newsletterEmail');
const newsletterConsent = document.getElementById('newsletterConsent');
const subscribeNewsletterBtn = document.getElementById('subscribeNewsletterBtn');
const newsletterError = document.getElementById('newsletterError');

/**
 * Validates the email format.
 * @param {string} email - The email address to validate.
 * @returns {boolean} True if the email is valid, false otherwise.
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Updates the state of the subscribe button based on input validity and consent.
 */
function updateSubscribeButtonState() {
    const emailValid = isValidEmail(newsletterEmail.value);
    const consentChecked = newsletterConsent.checked;
    subscribeNewsletterBtn.disabled = !(emailValid && consentChecked);
}

/**
 * Handles the newsletter subscription process.
 */
function subscribeNewsletter() {
    const email = newsletterEmail.value;
    if (!isValidEmail(email)) {
        newsletterError.textContent = 'Por favor, insira um e-mail válido.';
        newsletterError.style.display = 'block';
        return;
    }

    if (!newsletterConsent.checked) {
        newsletterError.textContent = 'Você deve aceitar os termos para se inscrever.';
        newsletterError.style.display = 'block';
        return;
    }

    newsletterError.style.display = 'none'; // Hide previous errors

    // Simulate API call for newsletter subscription
    console.log(`Email ${email} subscribed!`);
    showCustomModal('Obrigado por se inscrever na nossa newsletter!');

    // Clear form
    newsletterEmail.value = '';
    newsletterConsent.checked = false;
    updateSubscribeButtonState();
}

// Add event listeners for newsletter form
if (newsletterEmail) {
    newsletterEmail.addEventListener('input', updateSubscribeButtonState);
}
if (newsletterConsent) {
    newsletterConsent.addEventListener('change', updateSubscribeButtonState);
}
if (subscribeNewsletterBtn) {
    subscribeNewsletterBtn.addEventListener('click', subscribeNewsletter);
}

// Initial state update for newsletter button
document.addEventListener('DOMContentLoaded', updateSubscribeButtonState);

// --- Accessibility Toggle Button (PWA/Mobile) ---
const accessibilityToggleButton = document.getElementById('accessibilityToggleButton');
const pwaAcessibilidadeBar = document.getElementById('pwaAcessibilidadeBar'); // Assuming this element exists in your HTML

if (accessibilityToggleButton) {
    accessibilityToggleButton.addEventListener('click', () => {
        if (pwaAcessibilidadeBar) {
            pwaAcessibilidadeBar.classList.toggle('is-open');
            const isOpen = pwaAcessibilidadeBar.classList.contains('is-open');
            accessibilityToggleButton.setAttribute('aria-expanded', isOpen);
            // Optional: Add overlay to block interaction with main content
            // if (isOpen) {
            //     // Create and append overlay
            // } else {
            //     // Remove overlay
            // }
        }
    });
}
