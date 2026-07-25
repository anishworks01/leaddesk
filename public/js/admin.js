// public/js/admin.js
// Handles the status dropdown on each row of the admin table. Deliberately
// calls the JSON endpoint (PATCH /admin/api/leads/:id/status) instead of a
// full form submit + page reload, so triaging a long list of leads doesn't
// mean losing your scroll position and search filter after every change.

(function () {
  document.querySelectorAll('[data-status-select]').forEach((select) => {
    select.addEventListener('change', async () => {
      const row = select.closest('tr');
      const leadId = row.dataset.leadId;
      const newStatus = select.value;
      const badge = row.querySelector('[data-status-badge]');
      const previousStatus = badge.textContent.trim();

      select.disabled = true;

      try {
        const response = await fetch(`/admin/api/leads/${leadId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) {
          throw new Error('Update failed');
        }

        const data = await response.json();

        // Swap the badge's text and colour class to match the new status,
        // without touching the rest of the row or reloading the page.
        badge.textContent = data.status;
        badge.className = `badge badge-${data.status}`;
      } catch (err) {
        // Roll the dropdown back to what it was, and tell the admin plainly
        // what happened - a silently-failed update is worse than a visible one.
        select.value = previousStatus;
        window.alert('Could not update status. Check your connection and try again.');
      } finally {
        select.disabled = false;
      }
    });
  });
})();
