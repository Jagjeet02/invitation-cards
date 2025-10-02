// Initialize Swiper
const swiper = new Swiper(".swiper", {
    loop: true,
    slidesPerView: 1,
    centeredSlides: true,
    allowTouchMove: false,
    pagination: {
        el: ".swiper-pagination",
        clickable: true,
    },
    navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
    },
});

// State management
let textElements = [];
let activeTextElement = null;
let isDragging = false;
let isResizing = false;
let dragOffset = { x: 0, y: 0 };
let resizeStart = { width: 0, height: 0, x: 0, y: 0 };

// DOM elements
const cards = [document.getElementById('card-1'), document.getElementById('card-2'), document.getElementById('card-3')];
const textInput = document.getElementById('text-input');
const addTextBtn = document.getElementById('add-text-btn');
const textElementsList = document.getElementById('text-elements-list');
const fontFamilySelect = document.getElementById('font-family');
const fontSizeSlider = document.getElementById('font-size');
const fontSizeValue = document.getElementById('font-size-value');
const fontStyleOptions = document.querySelectorAll('.font-option');
const textColorInput = document.getElementById('text-color');
const alignmentOptions = document.querySelectorAll('.alignment-option');
const lineHeightSlider = document.getElementById('line-height');
const lineHeightValue = document.getElementById('line-height-value');
const letterSpacingSlider = document.getElementById('letter-spacing');
const letterSpacingValue = document.getElementById('letter-spacing-value');
const uploadBgBtn = document.getElementById('upload-bg-btn');
const bgImageUpload = document.getElementById('bg-image-upload');
const resetBtn = document.getElementById('reset-btn');
const slideIndicator = document.getElementById('slide-indicator');

// Get current slide index - FIXED: Use realIndex instead of activeIndex
function getCurrentSlideIndex() {
    return swiper.realIndex;
}

// Update slide indicator
function updateSlideIndicator() {
    const currentIndex = getCurrentSlideIndex();
    slideIndicator.textContent = `Editing: Slide ${currentIndex + 1}`;
}

// Initialize default texts
function initializeDefaultTexts() {
    const defaultTexts = [
        "We invite you and your family's gracious presence and blessing",
        "Join us for the wedding celebration of Sarah & Michael",
        "Save the Date: 20th Oct 2025 | Grand Ballroom, The Ritz Hotel"
    ];

    defaultTexts.forEach((text, index) => {
        createTextElement(text, cards[index], {
            fontFamily: "'Playfair Display', serif",
            fontSize: '24px',
            color: '#000000',
            textAlign: 'center',
            left: '50%',
            top: `${40 + index * 15}%`,
            transform: 'translateX(-50%)'
        });
    });
}

// Create text element
function createTextElement(text, container, styles = {}) {
    const textElement = document.createElement('div');
    textElement.className = 'text-element';
    textElement.textContent = text;
    textElement.contentEditable = true;

    // Apply styles
    Object.assign(textElement.style, {
        fontFamily: styles.fontFamily || "'Open Sans', sans-serif",
        fontSize: styles.fontSize || '16px',
        color: styles.color || '#000000',
        textAlign: styles.textAlign || 'center',
        left: styles.left || '50%',
        top: styles.top || '50%',
        transform: styles.transform || 'translate(-50%, -50%)',
        fontWeight: styles.fontWeight || 'normal',
        fontStyle: styles.fontStyle || 'normal',
        lineHeight: styles.lineHeight || '1.5',
        letterSpacing: styles.letterSpacing || '0px',
        width: 'auto',
        height: 'auto'
    });

    // Add resize handle
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';
    textElement.appendChild(resizeHandle);

    container.appendChild(textElement);

    const elementData = {
        id: Date.now() + Math.random(),
        element: textElement,
        container: container
    };
    textElements.push(elementData);

    setupTextElementEvents(textElement, elementData);
    updateTextElementsList();

    return elementData;
}

// Setup text element events
function setupTextElementEvents(textElement, elementData) {
    // Click to select
    textElement.addEventListener('click', (e) => {
        if (e.target === textElement) {
            setActiveTextElement(elementData);
            // Enable editing on single click
            textElement.contentEditable = true;
            textElement.classList.add('editing');
            setTimeout(() => {
                textElement.focus();
            }, 100);
        }
    });

    // Blur to stop editing but keep selected
    textElement.addEventListener('blur', () => {
        textElement.classList.remove('editing');
        textElement.contentEditable = false;
    });

    // Mouse down for dragging (anywhere on text except resize handle)
    textElement.addEventListener('mousedown', (e) => {
        if (e.target === textElement) {
            e.preventDefault();
            setActiveTextElement(elementData);
            startDrag(e, textElement);
        }
    });

    // Resize handle events - ONLY for resizing
    const resizeHandle = textElement.querySelector('.resize-handle');
    resizeHandle.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        e.preventDefault();
        setActiveTextElement(elementData);
        startResize(e, textElement);
    });

    // Update controls when text changes
    textElement.addEventListener('input', () => {
        if (activeTextElement === elementData) {
            updateControls();
        }
    });
}

// Set active text element
function setActiveTextElement(elementData) {
    // Deactivate all
    textElements.forEach(item => {
        item.element.classList.remove('active');
        item.element.classList.remove('editing');
        item.element.contentEditable = false;
    });

    // Activate selected
    if (elementData) {
        elementData.element.classList.add('active');
        activeTextElement = elementData;
        updateControls();
    } else {
        activeTextElement = null;
    }
    updateTextElementsList();
}

// Update controls with active element properties
function updateControls() {
    if (!activeTextElement) return;

    const style = activeTextElement.element.style;
    textInput.value = activeTextElement.element.textContent;
    fontFamilySelect.value = style.fontFamily;

    const fontSize = parseInt(style.fontSize) || 24;
    fontSizeSlider.value = fontSize;
    fontSizeValue.textContent = `${fontSize}px`;

    // Fix color conversion - handle both rgb and hex
    let currentColor = style.color;
    if (currentColor && currentColor.startsWith('rgb')) {
        currentColor = rgbToHex(currentColor);
    }
    textColorInput.value = currentColor || '#000000';

    // Update font style
    const isBold = style.fontWeight === 'bold';
    const isItalic = style.fontStyle === 'italic';
    fontStyleOptions.forEach(opt => opt.classList.remove('active'));
    if (isBold && isItalic) {
        document.querySelector('[data-style="bold italic"]').classList.add('active');
    } else if (isBold) {
        document.querySelector('[data-style="bold"]').classList.add('active');
    } else if (isItalic) {
        document.querySelector('[data-style="italic"]').classList.add('active');
    } else {
        document.querySelector('[data-style="normal"]').classList.add('active');
    }

    // Update alignment
    alignmentOptions.forEach(opt => opt.classList.remove('active'));
    const currentAlign = style.textAlign || 'center';
    document.querySelector(`[data-align="${currentAlign}"]`).classList.add('active');

    const lineHeight = parseFloat(style.lineHeight) || 1.5;
    lineHeightSlider.value = lineHeight;
    lineHeightValue.textContent = lineHeight;

    const letterSpacing = parseInt(style.letterSpacing) || 0;
    letterSpacingSlider.value = letterSpacing;
    letterSpacingValue.textContent = `${letterSpacing}px`;
}

// Fixed RGB to Hex conversion
function rgbToHex(rgb) {
    if (!rgb) return '#000000';
    if (rgb.startsWith('#')) return rgb;

    const result = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*\d+\.?\d*)?\)$/.exec(rgb);
    if (!result) return '#000000';

    const r = parseInt(result[1]);
    const g = parseInt(result[2]);
    const b = parseInt(result[3]);

    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

// Update text elements list
function updateTextElementsList() {
    textElementsList.innerHTML = '';
    const currentCardIndex = getCurrentSlideIndex();
    const currentCard = cards[currentCardIndex];
    const cardElements = textElements.filter(item => item.container === currentCard);

    cardElements.forEach(item => {
        const listItem = document.createElement('div');
        listItem.className = `text-element-item ${item === activeTextElement ? 'active' : ''}`;

        const textPreview = document.createElement('span');
        textPreview.textContent = item.element.textContent.substring(0, 20) + (item.element.textContent.length > 20 ? '...' : '');

        const deleteBtn = document.createElement('span');
        deleteBtn.className = 'delete-text';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteTextElement(item);
        });

        listItem.appendChild(textPreview);
        listItem.appendChild(deleteBtn);

        listItem.addEventListener('click', () => setActiveTextElement(item));
        textElementsList.appendChild(listItem);
    });
}

// Delete text element
function deleteTextElement(elementData) {
    const index = textElements.indexOf(elementData);
    if (index > -1) {
        textElements.splice(index, 1);
        elementData.element.remove();
        if (activeTextElement === elementData) {
            setActiveTextElement(null);
        }
        updateTextElementsList();
    }
}

// Drag functionality
function startDrag(e, textElement) {
    isDragging = true;
    const rect = textElement.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;

    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
}

function drag(e) {
    if (!isDragging || !activeTextElement) return;

    const cardRect = activeTextElement.container.getBoundingClientRect();
    const newX = e.clientX - cardRect.left - dragOffset.x;
    const newY = e.clientY - cardRect.top - dragOffset.y;

    // Constrain within card
    const maxX = cardRect.width - activeTextElement.element.offsetWidth;
    const maxY = cardRect.height - activeTextElement.element.offsetHeight;

    activeTextElement.element.style.left = `${Math.max(0, Math.min(newX, maxX))}px`;
    activeTextElement.element.style.top = `${Math.max(0, Math.min(newY, maxY))}px`;
    activeTextElement.element.style.transform = 'none';
}

function stopDrag() {
    isDragging = false;
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', stopDrag);
}

// Resize functionality
function startResize(e, textElement) {
    isResizing = true;
    const rect = textElement.getBoundingClientRect();
    resizeStart.width = rect.width;
    resizeStart.height = rect.height;
    resizeStart.x = e.clientX;
    resizeStart.y = e.clientY;

    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResize);
}

function resize(e) {
    if (!isResizing || !activeTextElement) return;

    const newWidth = Math.max(60, resizeStart.width + (e.clientX - resizeStart.x));
    const newHeight = Math.max(30, resizeStart.height + (e.clientY - resizeStart.y));

    activeTextElement.element.style.width = `${newWidth}px`;
    activeTextElement.element.style.height = `${newHeight}px`;
}

function stopResize() {
    isResizing = false;
    document.removeEventListener('mousemove', resize);
    document.removeEventListener('mouseup', stopResize);
}

// Apply style to active text element
function applyStyleToActive(property, value) {
    if (activeTextElement) {
        activeTextElement.element.style[property] = value;
    }
}

// Event listeners for controls - UPDATED to work continuously
addTextBtn.addEventListener('click', () => {
    const text = textInput.value.trim() || 'Your text here';
    const currentCardIndex = getCurrentSlideIndex(); // FIXED: Use getCurrentSlideIndex
    const currentCard = cards[currentCardIndex];
    const newElement = createTextElement(text, currentCard);
    setActiveTextElement(newElement);
    textInput.value = '';
});

// Continuous functionality - no need to reselect
fontFamilySelect.addEventListener('change', () => {
    applyStyleToActive('fontFamily', fontFamilySelect.value);
});

fontSizeSlider.addEventListener('input', () => {
    const size = fontSizeSlider.value;
    fontSizeValue.textContent = `${size}px`;
    applyStyleToActive('fontSize', `${size}px`);
});

fontStyleOptions.forEach(option => {
    option.addEventListener('click', () => {
        if (!activeTextElement) return;
        fontStyleOptions.forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');

        const style = option.dataset.style;
        if (style === 'normal') {
            applyStyleToActive('fontStyle', 'normal');
            applyStyleToActive('fontWeight', 'normal');
        } else if (style === 'italic') {
            applyStyleToActive('fontStyle', 'italic');
            applyStyleToActive('fontWeight', 'normal');
        } else if (style === 'bold') {
            applyStyleToActive('fontStyle', 'normal');
            applyStyleToActive('fontWeight', 'bold');
        } else if (style === 'bold italic') {
            applyStyleToActive('fontStyle', 'italic');
            applyStyleToActive('fontWeight', 'bold');
        }
    });
});

textColorInput.addEventListener('input', () => {
    applyStyleToActive('color', textColorInput.value);
});

alignmentOptions.forEach(option => {
    option.addEventListener('click', () => {
        if (!activeTextElement) return;
        alignmentOptions.forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');
        applyStyleToActive('textAlign', option.dataset.align);
    });
});

lineHeightSlider.addEventListener('input', () => {
    const value = lineHeightSlider.value;
    lineHeightValue.textContent = value;
    applyStyleToActive('lineHeight', value);
});

letterSpacingSlider.addEventListener('input', () => {
    const value = letterSpacingSlider.value;
    letterSpacingValue.textContent = `${value}px`;
    applyStyleToActive('letterSpacing', `${value}px`);
});

// Background image upload - FIXED
uploadBgBtn.addEventListener('click', () => {
    bgImageUpload.click();
});

bgImageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            // Get the current active card - FIXED: Use getCurrentSlideIndex
            const currentCardIndex = getCurrentSlideIndex();
            const currentCard = cards[currentCardIndex];
            currentCard.style.backgroundImage = `url(${event.target.result})`;
            console.log('Image uploaded to card:', currentCardIndex + 1);
        };
        reader.readAsDataURL(file);
        // Reset the input to allow uploading same file again
        bgImageUpload.value = '';
    }
});

// Reset card - FIXED
resetBtn.addEventListener('click', () => {
    const currentCardIndex = getCurrentSlideIndex(); // FIXED: Use getCurrentSlideIndex
    const currentCard = cards[currentCardIndex];

    // Remove text elements from this card only
    const elementsToRemove = textElements.filter(item => item.container === currentCard);
    elementsToRemove.forEach(item => {
        const index = textElements.indexOf(item);
        if (index > -1) {
            textElements.splice(index, 1);
        }
        item.element.remove();
    });

    // Reset background
    currentCard.style.backgroundImage = '';

    // Reset active element
    setActiveTextElement(null);

    // Re-add default text
    const defaultTexts = [
        "We invite you and your family's gracious presence and blessing",
        "Join us for the wedding celebration of Sarah & Michael",
        "Save the Date: 20th Oct 2025 | Grand Ballroom, The Ritz Hotel"
    ];

    createTextElement(defaultTexts[currentCardIndex], currentCard, {
        fontFamily: "'Playfair Display', serif",
        fontSize: '24px',
        color: '#000000',
        textAlign: 'center',
        left: '50%',
        top: '40%',
        transform: 'translateX(-50%)'
    });
});

// Update on slide change
swiper.on('slideChange', () => {
    updateSlideIndicator();
    setActiveTextElement(null);
    updateTextElementsList();
});

// Click outside to deselect
document.addEventListener('click', (e) => {
    if (!e.target.closest('.text-element') && !e.target.closest('.resize-handle') && !e.target.closest('.aside-main-container')) {
        setActiveTextElement(null);
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeDefaultTexts();
    updateSlideIndicator();
    updateTextElementsList();
});