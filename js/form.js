(function () {
  /* ── Config ── */
  var SUPA_URL = 'https://brysartqcjylgqwmnjkk.supabase.co';
  var SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeXNhcnRxY2p5bGdxd21uamtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzMjgyNzMsImV4cCI6MjA5MTkwNDI3M30.CanSxg9nrotjPuoFnGUaU6WMOxLovAtzNONS_JJ1WVY';

  var form = document.getElementById('contactForm');
  if (!form) return;

  /* Pre-fill interest from URL (e.g. contact.html?interest=s1) */
  var interest = new URLSearchParams(window.location.search).get('interest');
  if (interest) {
    var select = form.querySelector('[name="interest"]');
    if (select) select.value = interest;
  }

  var formBody    = document.getElementById('formBody');
  var formSuccess = document.getElementById('formSuccess');
  var submitBtn   = form.querySelector('[type="submit"]');

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!submitBtn) return;

    submitBtn.disabled = true;
    submitBtn.classList.add('btn-loading');
    submitBtn.innerHTML = '<span class="btn-spinner" aria-hidden="true"></span> Sending…';

    var data = new FormData(form);
    var payload = {
      full_name:  (data.get('fullName')  || '').trim(),
      company:    (data.get('company')   || '').trim(),
      work_email: (data.get('workEmail') || '').trim(),
      interest:   (data.get('interest')  || '').trim(),
      message:    (data.get('message')   || '').trim(),
    };

    var submitted = false;
    try {
      var res = await fetch(SUPA_URL + '/rest/v1/contact_submissions', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey':        SUPA_KEY,
          'Authorization': 'Bearer ' + SUPA_KEY,
          'Prefer':        'return=minimal',
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) submitted = true;
    } catch (_) { /* fall through to mailto fallback */ }

    if (!submitted) {
      /* Graceful fallback: open mail client so the inquiry is never lost */
      var body = [
        'Name: '    + payload.full_name,
        'Company: ' + payload.company,
        'Email: '   + payload.work_email,
        payload.interest ? 'Interest: ' + payload.interest : '',
        payload.message  ? '\nMessage:\n' + payload.message : '',
      ].filter(Boolean).join('\n');
      var a  = document.createElement('a');
      a.href = 'mailto:hello@kneuralabs.com'
             + '?subject=' + encodeURIComponent('Enquiry — ' + payload.full_name + ' (' + payload.company + ')')
             + '&body='    + encodeURIComponent(body);
      a.click();
    }

    form.reset();
    if (formBody)    formBody.setAttribute('hidden', '');
    if (formSuccess) formSuccess.removeAttribute('hidden');
    submitBtn.disabled = false;
    submitBtn.classList.remove('btn-loading');
    submitBtn.textContent = 'Send';
  });
})();
