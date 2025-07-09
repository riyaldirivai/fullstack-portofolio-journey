/* =========================================
   MODERN JAVASCRIPT - PERSONAL BRAND LANDING
   Author: Riyaldi Rivai | Day 2 Project
   Features: Navigation, Animations, Form Handling
   ========================================= */

// ===== MODERN JAVASCRIPT FEATURES =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Personal Brand Landing - Day 2 Project Loaded!');
    
    // Initialize all features
    initNavigation();
    initScrollAnimations();
    initFormHandling();
    initSkillBars();
    initSmoothScrolling();
    
    console.log('✅ All JavaScript features initialized successfully!');
});

// ===== NAVIGATION FUNCTIONALITY =====
function initNavigation() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.querySelector('.nav__menu');
    const navLinks = document.querySelectorAll('.nav__link');
    const header = document.querySelector('.header');
    
    // Mobile menu toggle
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('nav__menu--active');
            navToggle.classList.toggle('nav__toggle--active');
        });
    }
    
    // Close mobile menu when clicking on links
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu?.classList.remove('nav__menu--active');
            navToggle?.classList.remove('nav__toggle--active');
        });
    });
    
    // Header scroll effect
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        
        if (header) {
            if (currentScrollY > 100) {
                header.style.background = 'rgba(255, 255, 255, 0.98)';
                header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
            } else {
                header.style.background = 'rgba(255, 255, 255, 0.95)';
                header.style.boxShadow = 'none';
            }
            
            // Hide/show header on scroll
            if (currentScrollY > lastScrollY && currentScrollY > 500) {
                header.style.transform = 'translateY(-100%)';
            } else {
                header.style.transform = 'translateY(0)';
            }
        }
        
        lastScrollY = currentScrollY;
    });
    
    console.log('✅ Navigation functionality initialized');
}

// ===== SCROLL ANIMATIONS =====
function initScrollAnimations() {
    // Create intersection observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                
                // Special handling for skill bars
                if (entry.target.classList.contains('skill-category')) {
                    animateSkillBars(entry.target);
                }
                
                // Special handling for stats
                if (entry.target.classList.contains('stat')) {
                    animateStats(entry.target);
                }
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animatedElements = document.querySelectorAll(`
        .hero__content,
        .hero__visual,
        .section__header,
        .about__content,
        .skill-category,
        .project-card,
        .stat,
        .contact__info,
        .contact__form
    `);
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });
    
    console.log('✅ Scroll animations initialized');
}

// ===== SKILL BARS ANIMATION =====
function initSkillBars() {
    const skillBars = document.querySelectorAll('.skill__progress');
    
    skillBars.forEach(bar => {
        // Reset width initially
        bar.style.width = '0%';
    });
    
    console.log('✅ Skill bars initialized');
}

function animateSkillBars(container) {
    const skillBars = container.querySelectorAll('.skill__progress');
    
    skillBars.forEach((bar, index) => {
        const targetWidth = bar.style.getPropertyValue('--progress') || '0%';
        
        setTimeout(() => {
            bar.style.width = targetWidth;
        }, index * 200); // Stagger animation
    });
    
    console.log('✅ Skill bars animated');
}

// ===== STATS ANIMATION =====
function animateStats(statElement) {
    const numberElement = statElement.querySelector('.stat__number');
    if (!numberElement) return;
    
    const finalNumber = parseInt(numberElement.textContent);
    const duration = 2000; // 2 seconds
    const steps = 60;
    const increment = finalNumber / steps;
    let current = 0;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= finalNumber) {
            current = finalNumber;
            clearInterval(timer);
        }
        
        // Handle special formatting
        if (numberElement.textContent.includes('+')) {
            numberElement.textContent = Math.floor(current) + '+';
        } else {
            numberElement.textContent = Math.floor(current);
        }
    }, duration / steps);
    
    console.log('✅ Stats animation started');
}

// ===== SMOOTH SCROLLING =====
function initSmoothScrolling() {
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const headerHeight = document.querySelector('.header')?.offsetHeight || 80;
                const targetPosition = targetElement.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    console.log('✅ Smooth scrolling initialized');
}

// ===== FORM HANDLING =====
function initFormHandling() {
    const contactForm = document.querySelector('.contact__form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            const formObj = Object.fromEntries(formData);
            
            console.log('📧 Form submission:', formObj);
            
            // Show success message (for demo purposes)
            showNotification('Message sent successfully! 🚀', 'success');
            
            // Reset form
            this.reset();
        });
        
        // Real-time form validation
        const inputs = contactForm.querySelectorAll('.form__input, .form__textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', validateInput);
            input.addEventListener('input', clearValidation);
        });
    }
    
    console.log('✅ Form handling initialized');
}

// ===== FORM VALIDATION =====
function validateInput(e) {
    const input = e.target;
    const value = input.value.trim();
    
    // Remove existing validation
    clearValidation({ target: input });
    
    // Email validation
    if (input.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            showInputError(input, 'Please enter a valid email address');
            return;
        }
    }
    
    // Required field validation
    if (input.hasAttribute('required') && !value) {
        showInputError(input, 'This field is required');
        return;
    }
    
    // Show success state
    showInputSuccess(input);
}

function clearValidation(e) {
    const input = e.target;
    input.style.borderColor = '';
    
    // Remove error/success messages
    const existingMessage = input.parentElement.querySelector('.validation-message');
    if (existingMessage) {
        existingMessage.remove();
    }
}

function showInputError(input, message) {
    input.style.borderColor = '#ef4444';
    
    const errorElement = document.createElement('div');
    errorElement.className = 'validation-message error';
    errorElement.textContent = message;
    errorElement.style.cssText = `
        color: #ef4444;
        font-size: 0.875rem;
        margin-top: 0.25rem;
    `;
    
    input.parentElement.appendChild(errorElement);
}

function showInputSuccess(input) {
    input.style.borderColor = '#10b981';
}

// ===== NOTIFICATION SYSTEM =====
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.textContent = message;
    
    // Styling
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 2rem;
        background-color: ${type === 'success' ? '#10b981' : '#3b82f6'};
        color: white;
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease-in-out;
        font-weight: 500;
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// ===== UTILITY FUNCTIONS =====
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// ===== PERFORMANCE MONITORING =====
window.addEventListener('load', function() {
    // Performance metrics
    if ('performance' in window) {
        const perfData = performance.getEntriesByType('navigation')[0];
        const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
        
        console.log(`🚀 Page Load Performance:
            - Load Time: ${loadTime}ms
            - DOM Content Loaded: ${perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart}ms
            - Total Page Load: ${perfData.loadEventEnd - perfData.fetchStart}ms
        `);
        
        // Show performance notification if load time is good
        if (loadTime < 1000) {
            setTimeout(() => {
                showNotification('⚡ Page loaded in under 1 second! Excellent performance!', 'success');
            }, 2000);
        }
    }
});

// ===== ERROR HANDLING =====
window.addEventListener('error', function(e) {
    console.error('JavaScript Error:', e.error);
    // In production, you might want to send this to an error tracking service
});

// ===== CONSOLE BRANDING =====
console.log(`
🚀 PERSONAL BRAND LANDING PAGE
👨‍💻 Developer: Riyaldi Rivai
📅 Project: Day 2 - Full-Stack Journey
🛠️ Tech Stack: HTML5, CSS3, Vanilla JavaScript
⭐ Features: Responsive Design, Animations, Form Validation

💡 This project demonstrates modern web development fundamentals!
`);