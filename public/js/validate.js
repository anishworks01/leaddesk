// public/js/validate.js
// Client-side validation for the lead intake form. This is a UX layer only
// - it stops obviously-bad submissions before a round trip, but it is never
// trusted on its own. The exact same rules are re-checked server-side in
// routes/leads.js because anyone can bypass JS entirely with a direct POST.

(function () {
  const form = document.querySelector('.entry-card form');
  if (!form) return; // this script also loads on pages without the form; no-op there

  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const rules = {
    name: (value) => (value.trim().length > 0 ? '' : 'Name is required'),
    email: (value) => {
      if (!value.trim()) return 'Email is required';
      if (!EMAIL_PATTERN.test(value.trim())) return 'Enter a valid email address';
      return '';
    },
    budgetRange: (value) => (value ? '' : 'Choose a budget range'),
    message: (value) => (value.trim().length > 0 ? '' : 'Message is required'),
  };

  function fieldWrapper(input) {
    return input.closest('.field');
  }

  function setError(input, message) {
    const wrapper = fieldWrapper(input);
    if (!wrapper) return;

    wrapper.classList.toggle('has-error', Boolean(message));

    let errorEl = wrapper.querySelector('.field-error');
    if (message) {
      if (!errorEl) {
        errorEl = document.createElement('div');
        errorEl.className = 'field-error';
        wrapper.appendChild(errorEl);
      }
      errorEl.textContent = message;
    } else if (errorEl) {
      errorEl.remove();
    }
  }

  function validateField(input) {
    const rule = rules[input.name];
    if (!rule) return true;
    const message = rule(input.value);
    setError(input, message);
    return !message;
  }

  // Validate a field as soon as the visitor leaves it, not on every
  // keystroke - correcting a half-typed email shouldn't flash an error.
  Object.keys(rules).forEach((name) => {
    const input = form.elements[name];
    if (input) {
      input.addEventListener('blur', () => validateField(input));
    }
  });

  form.addEventListener('submit', (event) => {
    let isValid = true;
    Object.keys(rules).forEach((name) => {
      const input = form.elements[name];
      if (input && !validateField(input)) {
        isValid = false;
      }
    });

    if (!isValid) {
      event.preventDefault();
      const firstError = form.querySelector('.has-error input, .has-error select, .has-error textarea');
      if (firstError) firstError.focus();
    }
  });
})();
