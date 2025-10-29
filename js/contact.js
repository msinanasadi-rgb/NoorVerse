// No-op placeholder. Email functionality removed.
// This file intentionally left minimal to avoid breaking any script references.
(function(){
  // If a form exists, prevent submission and show a polite message.
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const status = document.getElementById('form-status');
      if (status) {
        status.textContent = 'Contact form is currently unavailable.';
        status.className = 'form-status info';
      }
    });
  }
})();
