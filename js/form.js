const form = document.getElementById('contactForm');

form.addEventListener('submit', e => {
  e.preventDefault();

  const btn = form.querySelector('.form-submit');
  btn.textContent = 'Sending…';
  btn.disabled = true;

  // Simulate form submission
  setTimeout(() => {
    btn.textContent = 'Inquiry Sent ✓';
    btn.style.background = 'var(--kn-pine)';
    form.reset();

    setTimeout(() => {
      btn.textContent = 'Send Inquiry';
      btn.style.background = '';
      btn.disabled = false;
    }, 3000);
  }, 1200);
});
