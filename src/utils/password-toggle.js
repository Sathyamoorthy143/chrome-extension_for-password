/**
 * Password visibility toggle functionality
 */

// Initialize password toggle buttons
document.addEventListener('DOMContentLoaded', () => {
    const toggleButtons = document.querySelectorAll('.toggle-password');

    toggleButtons.forEach(button => {
        button.addEventListener('click', function () {
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);

            if (input) {
                // Toggle password visibility
                if (input.type === 'password') {
                    input.type = 'text';
                    this.textContent = '🙈'; // Closed eye
                    this.title = 'Hide password';
                } else {
                    input.type = 'password';
                    this.textContent = '👁️'; // Open eye
                    this.title = 'Show password';
                }
            }
        });
    });
});
