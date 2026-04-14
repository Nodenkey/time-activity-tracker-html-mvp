(function () {
  'use strict';

  const API_BASE_URL = window.API_BASE_URL || 'http://localhost:8000/api';

  const selectors = {
    form: document.getElementById('entry-form'),
    entryId: document.getElementById('entry-id'),
    date: document.getElementById('date'),
    person: document.getElementById('person'),
    team: document.getElementById('team'),
    activity: document.getElementById('activity'),
    category: document.getElementById('category'),
    duration: document.getElementById('duration'),
    notes: document.getElementById('notes'),
    saveButton: document.getElementById('save-button'),
    resetButton: document.getElementById('reset-button'),
    cancelEditButton: document.getElementById('cancel-edit-button'),
    formModeLabel: document.getElementById('form-mode-label'),
    globalMessage: document.getElementById('global-message'),
    entriesBody: document.getElementById('entries-body'),
    filterDate: document.getElementById('filter-date'),
    filterPerson: document.getElementById('filter-person'),
    filterTeam: document.getElementById('filter-team'),
    applyFilters: document.getElementById('apply-filters'),
    clearFilters: document.getElementById('clear-filters'),
  };

  let isSubmitting = false;

  function setGlobalMessage(message, type) {
    const el = selectors.globalMessage;
    el.textContent = message || '';
    el.className = 'global-message';
    if (!message) return;
    if (type === 'error') {
      el.classList.add('global-message--error');
    } else if (type === 'success') {
      el.classList.add('global-message--success');
    } else if (type === 'info') {
      el.classList.add('global-message--info');
    }
  }

  function setSubmittingState(submitting) {
    isSubmitting = submitting;
    selectors.saveButton.disabled = submitting;
    selectors.resetButton.disabled = submitting;
    selectors.cancelEditButton.disabled = submitting;
  }

  function clearFieldErrors() {
    const errorEls = document.querySelectorAll('.field-error');
    errorEls.forEach((el) => {
      el.textContent = '';
    });

    [
      selectors.date,
      selectors.person,
      selectors.team,
      selectors.activity,
      selectors.category,
      selectors.duration,
      selectors.notes,
    ].forEach((input) => {
      if (input) {
        input.removeAttribute('aria-invalid');
      }
    });
  }

  function setFieldError(fieldName, message) {
    const errorEl = document.querySelector(
      `.field-error[data-error-for="${fieldName}"]`
    );
    const inputEl = selectors[fieldName];
    if (errorEl) {
      errorEl.textContent = message || '';
    }
    if (inputEl && message) {
      inputEl.setAttribute('aria-invalid', 'true');
    }
  }

  function validateForm() {
    clearFieldErrors();
    let isValid = true;

    const requiredTextFields = ['date', 'person', 'team', 'activity', 'category'];
    requiredTextFields.forEach((name) => {
      const value = (selectors[name].value || '').trim();
      if (!value) {
        isValid = false;
        setFieldError(name, 'This field is required.');
      }
    });

    const durationValue = selectors.duration.value;
    if (!durationValue || Number.isNaN(Number(durationValue))) {
      isValid = false;
      setFieldError('duration', 'Duration is required.');
    } else if (Number(durationValue) <= 0) {
      isValid = false;
      setFieldError('duration', 'Duration must be greater than 0.');
    }

    return isValid;
  }

  async function apiRequest(path, options) {
    const url = `${API_BASE_URL}${path}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });

    let data = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await response.json();
    }

    if (!response.ok) {
      const error = new Error(
        (data && (data.message || data.detail?.message)) ||
          `Request failed with status ${response.status}`
      );
      error.status = response.status;
      error.payload = data;
      throw error;
    }

    return data;
  }

  async function loadEntries() {
    selectors.entriesBody.innerHTML =
      '<tr><td colspan="8" class="placeholder">Loading entries…</td></tr>';

    const params = new URLSearchParams();
    const date = selectors.filterDate.value;
    const person = selectors.filterPerson.value.trim();
    const team = selectors.filterTeam.value.trim();

    if (date) params.append('date', date);
    if (person) params.append('person', person);
    if (team) params.append('team', team);

    const query = params.toString();
    const path = query ? `/entries?${query}` : '/entries';

    try {
      const entries = await apiRequest(path, { method: 'GET' });
      renderEntries(entries || []);
      if (!entries || entries.length === 0) {
        selectors.entriesBody.innerHTML =
          '<tr><td colspan="8" class="placeholder">No entries found.</td></tr>';
      }
    } catch (error) {
      console.error('Failed to load entries', error);
      selectors.entriesBody.innerHTML =
        '<tr><td colspan="8" class="placeholder">Failed to load entries.</td></tr>';
      setGlobalMessage('Failed to load entries. Please try again.', 'error');
    }
  }

  function renderEntries(entries) {
    if (!Array.isArray(entries) || entries.length === 0) {
      return;
    }

    const rows = entries
      .map((entry) => {
        const safe = (value) =>
          value == null ? '' : String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;');

        return `
          <tr data-entry-id="${entry.id}">
            <td>${safe(entry.date)}</td>
            <td>${safe(entry.person)}</td>
            <td>${safe(entry.team)}</td>
            <td>${safe(entry.activity)}</td>
            <td>${safe(entry.category)}</td>
            <td>${entry.duration_minutes != null ? Number(entry.duration_minutes) : ''}</td>
            <td>${safe(entry.notes)}</td>
            <td class="col-actions">
              <div class="entry-actions">
                <button type="button" class="btn secondary btn-edit">Edit</button>
                <button type="button" class="btn link btn-delete">Delete</button>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');

    selectors.entriesBody.innerHTML = rows;
  }

  function resetForm() {
    selectors.form.reset();
    selectors.entryId.value = '';
    selectors.formModeLabel.textContent = 'Create new entry';
    selectors.cancelEditButton.hidden = true;
    clearFieldErrors();
  }

  function enterEditMode(entry) {
    selectors.entryId.value = entry.id;
    selectors.date.value = entry.date || '';
    selectors.person.value = entry.person || '';
    selectors.team.value = entry.team || '';
    selectors.activity.value = entry.activity || '';
    selectors.category.value = entry.category || '';
    selectors.duration.value = entry.duration_minutes != null ? entry.duration_minutes : '';
    selectors.notes.value = entry.notes || '';

    selectors.formModeLabel.textContent = 'Editing entry';
    selectors.cancelEditButton.hidden = false;
    clearFieldErrors();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;

    setGlobalMessage('', 'info');

    const isValid = validateForm();
    if (!isValid) {
      setGlobalMessage('Please fix the highlighted fields.', 'error');
      return;
    }

    const payload = {
      date: selectors.date.value,
      person: selectors.person.value.trim(),
      team: selectors.team.value.trim(),
      activity: selectors.activity.value.trim(),
      category: selectors.category.value,
      duration_minutes: Number(selectors.duration.value),
      notes: selectors.notes.value.trim() || null,
    };

    const isEdit = Boolean(selectors.entryId.value);
    const path = isEdit ? `/entries/${selectors.entryId.value}` : '/entries';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      setSubmittingState(true);
      await apiRequest(path, {
        method,
        body: JSON.stringify(payload),
      });

      resetForm();
      await loadEntries();
      setGlobalMessage(
        isEdit ? 'Entry updated successfully.' : 'Entry created successfully.',
        'success'
      );
    } catch (error) {
      console.error('Failed to submit entry', error);
      if (error.status === 422 && error.payload && error.payload.detail) {
        setGlobalMessage('Validation failed. Please review your input.', 'error');
      } else {
        setGlobalMessage('Failed to save entry. Please try again.', 'error');
      }
    } finally {
      setSubmittingState(false);
    }
  }

  async function handleDelete(entryId) {
    if (!entryId) return;
    const confirmed = window.confirm('Delete this entry? This cannot be undone.');
    if (!confirmed) return;

    try {
      setGlobalMessage('Deleting entry…', 'info');
      await apiRequest(`/entries/${entryId}`, { method: 'DELETE' });
      await loadEntries();
      setGlobalMessage('Entry deleted.', 'success');
    } catch (error) {
      console.error('Failed to delete entry', error);
      if (error.status === 404) {
        setGlobalMessage('Entry not found. It may have already been deleted.', 'error');
      } else {
        setGlobalMessage('Failed to delete entry. Please try again.', 'error');
      }
    }
  }

  function handleTableClick(event) {
    const editButton = event.target.closest('.btn-edit');
    const deleteButton = event.target.closest('.btn-delete');
    if (!editButton && !deleteButton) return;

    const row = event.target.closest('tr[data-entry-id]');
    if (!row) return;
    const entryId = row.getAttribute('data-entry-id');

    if (editButton) {
      const cells = row.querySelectorAll('td');
      const entry = {
        id: entryId,
        date: cells[0].textContent.trim(),
        person: cells[1].textContent.trim(),
        team: cells[2].textContent.trim(),
        activity: cells[3].textContent.trim(),
        category: cells[4].textContent.trim(),
        duration_minutes: Number(cells[5].textContent.trim()),
        notes: cells[6].textContent.trim(),
      };
      enterEditMode(entry);
    } else if (deleteButton) {
      handleDelete(entryId);
    }
  }

  function handleApplyFilters() {
    loadEntries();
  }

  function handleClearFilters() {
    selectors.filterDate.value = '';
    selectors.filterPerson.value = '';
    selectors.filterTeam.value = '';
    loadEntries();
  }

  function init() {
    if (!selectors.form) return;

    selectors.form.addEventListener('submit', handleSubmit);
    selectors.resetButton.addEventListener('click', function () {
      resetForm();
      setGlobalMessage('', 'info');
    });
    selectors.cancelEditButton.addEventListener('click', function () {
      resetForm();
      setGlobalMessage('Edit cancelled.', 'info');
    });

    selectors.entriesBody.addEventListener('click', handleTableClick);
    selectors.applyFilters.addEventListener('click', handleApplyFilters);
    selectors.clearFilters.addEventListener('click', handleClearFilters);

    const today = new Date().toISOString().slice(0, 10);
    selectors.date.value = today;

    loadEntries();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
