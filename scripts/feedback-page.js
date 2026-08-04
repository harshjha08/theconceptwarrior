document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('feedbackForm');
  const list = document.getElementById('localFeedbackList');
  const status = document.getElementById('formStatus');
  const submitButton = form ? form.querySelector('button[type="submit"]') : null;

  if (!form || !list || !window.CWFeedbackUtils) return;

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Just now';
    return date.toLocaleString([], {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  function renderFeedbacks() {
    const items = window.CWFeedbackUtils.getActiveFeedbacks();
    if (!items.length) {
      list.innerHTML = '<div class="empty-state">No feedback saved on this device yet. Your latest feedback will appear here after you submit it.</div>';
      return;
    }

    list.innerHTML = items.map((item) => {
      const name = escapeHtml(item.name || 'Anonymous');
      const role = escapeHtml(item.role || 'Student');
      const rating = escapeHtml(item.rating || '★★★★★');
      const feedback = escapeHtml(item.feedback || '');
      const impact = escapeHtml(item.impact || '');
      const location = escapeHtml(item.location || '');
      const achievement = escapeHtml(item.achievement || '');
      const dateLabel = formatDate(item.timestamp);

      return `
        <article class="local-feedback-card">
          <div class="local-feedback-top">
            <div>
              <h3>${name}</h3>
              <p>${role}${location ? ` • ${location}` : ''}</p>
            </div>
            <span class="local-feedback-rating">${rating}</span>
          </div>
          <p class="local-feedback-quote">“${feedback}”</p>
          ${impact ? `<p class="local-feedback-impact"><strong>How we helped:</strong> ${impact}</p>` : ''}
          ${achievement ? `<p class="local-feedback-achievement"><strong>Achievement:</strong> ${achievement}</p>` : ''}
          <small>Saved on this device • ${dateLabel}</small>
        </article>
      `;
    }).join('');
  }

  function setStatus(message, type = 'success') {
    if (!status) return;
    status.textContent = message;
    status.className = `form-status ${type}`;
  }

  function validateFeedbackText(value) {
    const normalized = String(value || '').trim();
    const wordCount = normalized.split(/\s+/).filter(Boolean).length;
    const charCount = normalized.length;
    return wordCount >= 5 || charCount >= 100;
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    const feedbackText = String(formData.get('feedback') || '').trim();
    if (!validateFeedbackText(feedbackText)) {
      event.preventDefault();
      setStatus('Please write at least 50 words or 100 characters in your feedback before submitting.', 'error');
      return;
    }

    const payload = {
      name: String(formData.get('name') || '').trim(),
      role: String(formData.get('role') || '').trim(),
      className: String(formData.get('class') || '').trim(),
      location: String(formData.get('location') || '').trim(),
      achievement: String(formData.get('achievement') || '').trim(),
      rating: String(formData.get('rating') || '').trim(),
      impact: String(formData.get('impact') || '').trim(),
      feedback: feedbackText
    };

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    }

    window.CWFeedbackUtils.saveFeedbackLocally(payload);
    renderFeedbacks();
    setStatus('Thanks! Your feedback was saved on this device and sent to us as well.');

    fetch(form.action, {
      method: form.method || 'POST',
      mode: 'no-cors',
      keepalive: true,
      body: formData
    }).finally(() => {
      form.reset();
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Feedback';
      }
    });
  });

  renderFeedbacks();
});
