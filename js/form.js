(function () {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const formBody = document.getElementById('formBody');
  const formSuccess = document.getElementById('formSuccess');
  const submitBtn = form.querySelector('[type="submit"]');

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!submitBtn) return;

    submitBtn.textContent = 'Sending…';
    submitBtn.disabled = true;

    setTimeout(() => {
      form.reset();
      if (formBody) formBody.setAttribute('hidden', '');
      if (formSuccess) formSuccess.removeAttribute('hidden');
    }, 900);
  });
})();
