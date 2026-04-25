(function () {
  const form = document.getElementById('contactForm');
  if (!form) return;

  // Pre-fill interest dropdown from URL search params (e.g. contact.html?interest=s1)
  const interest = new URLSearchParams(window.location.search).get('interest');
  if (interest) {
    const select = form.querySelector('[name="interest"]');
    if (select) select.value = interest;
  }

  const formBody = document.getElementById('formBody');
  const formSuccess = document.getElementById('formSuccess');
  const submitBtn = form.querySelector('[type="submit"]');

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!submitBtn) return;

    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.82';
    submitBtn.innerHTML = '<span class="btn-spinner" aria-hidden="true"></span> Sending…';

    const data = new FormData(form);
    const name = data.get('fullName') || '';
    const company = data.get('company') || '';
    const email = data.get('workEmail') || '';
    const service = data.get('interest') || '';
    const message = data.get('message') || '';

    const body = [
      `Name: ${name}`,
      `Company: ${company}`,
      `Email: ${email}`,
      service ? `Interest: ${service}` : '',
      message ? `\nMessage:\n${message}` : '',
    ].filter(Boolean).join('\n');

    const mailto = `mailto:hello@kneuralabs.com`
      + `?subject=${encodeURIComponent(`Enquiry — ${name} (${company})`)}`
      + `&body=${encodeURIComponent(body)}`;

    // Open the user's mail client with form data pre-filled
    const a = document.createElement('a');
    a.href = mailto;
    a.click();

    form.reset();
    if (formBody) formBody.setAttribute('hidden', '');
    if (formSuccess) formSuccess.removeAttribute('hidden');
  });
})();
