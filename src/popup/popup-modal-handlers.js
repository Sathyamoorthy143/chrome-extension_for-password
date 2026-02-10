/**
 * Open add password modal
 */
function openAddPasswordModal() {
    addPasswordModal.classList.remove('hidden');
    manualWebsite.focus();
    // Clear previous values
    addPasswordForm.reset();
    addPasswordError.classList.add('hidden');
}

/**
 * Close add password modal
 */
function closeAddPasswordModal() {
    addPasswordModal.classList.add('hidden');
    addPasswordForm.reset();
    addPasswordError.classList.add('hidden');
}

/**
 * Handle add password form submission
 */
async function handleAddPassword(e) {
    e.preventDefault();

    const website = manualWebsite.value.trim();
    const username = manualUsername.value.trim();
    const password = manualPassword.value;
    const notes = manualNotes.value.trim();

    if (!website || !username || !password) {
        addPasswordError.textContent = 'Please fill in all required fields';
        addPasswordError.classList.remove('hidden');
        return;
    }

    try {
        const { addPassword } = await import('../crypto/vault.js');

        await addPassword({
            url: website,
            username: username,
            password: password,
            notes: notes || ''
        });

        closeAddPasswordModal();
        await loadPasswords();
        showToast('✅ Password added successfully!');
    } catch (error) {
        console.error('Add password error:', error);
        addPasswordError.textContent = 'Failed to add password. Please try again.';
        addPasswordError.classList.remove('hidden');
    }
}
