(function () {
    function getContainer() {
        let container = document.getElementById('notificationContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notificationContainer';
            container.className = 'fixed top-5 right-5 z-[100] w-[min(92vw,380px)] space-y-3';
            document.body.appendChild(container);
        }
        return container;
    }

    window.showNotification = function (message, type) {
        const colors = {
            success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
            error: 'border-rose-200 bg-rose-50 text-rose-800',
            warning: 'border-amber-200 bg-amber-50 text-amber-800',
            info: 'border-blue-200 bg-blue-50 text-blue-800'
        };
        const notification = document.createElement('div');
        notification.className = `flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg ${colors[type] || colors.info}`;
        notification.setAttribute('role', 'alert');
        notification.innerHTML = `<p class="flex-1 text-sm font-medium"></p><button type="button" class="text-lg leading-none opacity-60 hover:opacity-100" aria-label="Close notification">&times;</button>`;
        notification.querySelector('p').textContent = message;
        notification.querySelector('button').addEventListener('click', () => notification.remove());
        getContainer().appendChild(notification);
        window.setTimeout(() => notification.remove(), 5000);
    };

    window.alert = function (message) {
        window.showNotification(String(message), 'error');
    };
})();
