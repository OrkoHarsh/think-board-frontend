/**
 * Token-native confirm / alert dialogs (replaces SweetAlert chrome).
 * Returns a Promise — confirm resolves true/false; alert resolves void.
 */

function getTheme() {
    const isDark = document.documentElement.classList.contains('dark');
    return {
        isDark,
        surface: isDark ? '#14181c' : '#ffffff',
        ink: isDark ? '#f3f5f7' : '#0c0f12',
        muted: isDark ? '#a8b0ba' : '#5c6570',
        hairline: isDark ? '#2a3138' : '#e2e6eb',
        paper: isDark ? '#0c0f12' : 'rgba(12,15,18,0.45)',
        accent: isDark ? '#2a9e9e' : '#0f7a7a',
        danger: isDark ? '#e05555' : '#c23b3b',
        raised: isDark ? '#1a1f24' : '#eef1f4',
        onAccent: '#ffffff',
        inkSolid: isDark ? '#f3f5f7' : '#0c0f12',
        onInk: isDark ? '#0c0f12' : '#ffffff',
    };
}

function mountOverlay({ title, bodyHtml, confirmText, cancelText, danger, showCancel }) {
    const t = getTheme();

    return new Promise((resolve) => {
        const root = document.createElement('div');
        root.setAttribute('role', 'presentation');
        root.style.cssText = `
            position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;
            padding:16px;background:${t.paper};font-family:inherit;
        `;

        const panel = document.createElement('div');
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-modal', 'true');
        panel.setAttribute('aria-labelledby', 'nimbus-dialog-title');
        panel.style.cssText = `
            width:100%;max-width:400px;background:${t.surface};color:${t.ink};
            border:1px solid ${t.hairline};border-radius:10px;padding:20px 20px 16px;
            box-shadow:0 16px 48px rgba(12,15,18,0.12);
        `;

        const titleEl = document.createElement('h2');
        titleEl.id = 'nimbus-dialog-title';
        titleEl.textContent = title;
        titleEl.style.cssText = 'margin:0 0 8px;font-size:17px;font-weight:600;letter-spacing:-0.02em;';

        const body = document.createElement('div');
        body.style.cssText = `font-size:14px;line-height:1.5;color:${t.muted};margin-bottom:20px;`;
        body.innerHTML = bodyHtml;

        const actions = document.createElement('div');
        actions.style.cssText = 'display:flex;justify-content:flex-end;gap:8px;';

        const finish = (value) => {
            document.removeEventListener('keydown', onKey);
            root.remove();
            resolve(value);
        };

        const onKey = (e) => {
            if (e.key === 'Escape') finish(showCancel ? false : undefined);
        };
        document.addEventListener('keydown', onKey);

        if (showCancel) {
            const cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.textContent = cancelText || 'Cancel';
            cancelBtn.style.cssText = `
                height:36px;padding:0 14px;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;
                border:1px solid ${t.hairline};background:transparent;color:${t.muted};
            `;
            cancelBtn.onmouseenter = () => {
                cancelBtn.style.background = t.raised;
            };
            cancelBtn.onmouseleave = () => {
                cancelBtn.style.background = 'transparent';
            };
            cancelBtn.onclick = () => finish(false);
            actions.appendChild(cancelBtn);
        }

        const confirmBtn = document.createElement('button');
        confirmBtn.type = 'button';
        confirmBtn.textContent = confirmText || 'OK';
        const bg = danger ? t.danger : t.inkSolid;
        const fg = danger ? t.onAccent : t.onInk;
        confirmBtn.style.cssText = `
            height:36px;padding:0 14px;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;
            border:none;background:${bg};color:${fg};
        `;
        confirmBtn.onclick = () => finish(showCancel ? true : undefined);
        actions.appendChild(confirmBtn);

        panel.appendChild(titleEl);
        panel.appendChild(body);
        panel.appendChild(actions);
        root.appendChild(panel);
        root.addEventListener('click', (e) => {
            if (e.target === root && showCancel) finish(false);
        });
        document.body.appendChild(root);
        confirmBtn.focus();
    });
}

export function nimbusAlert({ title = 'Something went wrong', message = '' } = {}) {
    return mountOverlay({
        title,
        bodyHtml: `<p style="margin:0">${escapeHtml(message)}</p>`,
        confirmText: 'OK',
        showCancel: false,
        danger: false,
    });
}

export function nimbusConfirm({
    title = 'Are you sure?',
    message = '',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    danger = false,
} = {}) {
    return mountOverlay({
        title,
        bodyHtml: `<p style="margin:0">${escapeHtml(message)}</p>`,
        confirmText,
        cancelText,
        showCancel: true,
        danger,
    });
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
