(function () {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const formBody = document.getElementById('formBody');
  const formSuccess = document.getElementById('formSuccess');
  const submitBtn = form.querySelector('[type="submit"]');

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!submitBtn) return;

    submitBtn.innerHTML = '<span class="btn-spinner" aria-hidden="true"></span> Sending…';
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.82';

    setTimeout(() => {
      form.reset();
      if (formBody) formBody.setAttribute('hidden', '');
      if (formSuccess) formSuccess.removeAttribute('hidden');
    }, 1100);
  });
})();
