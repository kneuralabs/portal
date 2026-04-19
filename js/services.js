const serviceData = {
  assessment: {
    badge: 'Diagnostic',
    badgeClass: 'badge-pine',
    title: 'AI Risk Assessment',
    description: 'Map your AI models, dependencies, and risk exposure. We conduct a structured assessment scoped to your business context.',
    features: [
      'Model inventory & mapping',
      'Risk tiering & impact analysis',
      'Control gap identification',
      'Compliance readiness review',
    ],
    timeline: '3–5 weeks',
  },
  framework: {
    badge: 'Build',
    badgeClass: 'badge-fjord',
    title: 'Governance Framework',
    description: 'From assessment findings, we design and document a governance framework tailored to your team size and maturity.',
    features: [
      'Policy & procedure design',
      'Role & responsibility mapping',
      'Documentation templates',
      'Stakeholder alignment sessions',
    ],
    timeline: '4–8 weeks',
  },
  standards: {
    badge: 'Readiness',
    badgeClass: 'badge-ash',
    title: 'Standards Readiness',
    description: 'Prepare for NIST AI RMF, ISO/IEC 42001, or EU AI Act compliance with frameworks already aligned to your governance.',
    features: [
      'Standards gap analysis',
      'Mapping to existing controls',
      'Remediation roadmap',
      'Audit-ready documentation',
    ],
    timeline: '2–4 weeks',
  },
};

const overlay = document.getElementById('serviceOverlay');
const panelBadge = document.getElementById('panelBadge');
const panelTitle = document.getElementById('panelTitle');
const panelDesc = document.getElementById('panelDesc');
const panelFeatures = document.getElementById('panelFeatures');
const panelTimeline = document.getElementById('panelTimeline');

document.querySelectorAll('.service-card').forEach(card => {
  card.addEventListener('click', () => {
    const key = card.dataset.service;
    const data = serviceData[key];
    if (!data) return;

    panelBadge.textContent = data.badge;
    panelBadge.className = `badge ${data.badgeClass}`;
    panelTitle.textContent = data.title;
    panelDesc.textContent = data.description;
    panelFeatures.innerHTML = data.features
      .map(f => `<div class="spanel-feature">${f}</div>`)
      .join('');
    panelTimeline.textContent = `Timeline: ${data.timeline}`;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
});

document.getElementById('panelClose').addEventListener('click', closePanel);
overlay.addEventListener('click', e => {
  if (e.target === overlay) closePanel();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closePanel();
});

function closePanel() {
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}
