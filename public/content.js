// Content script for FocusGuard
console.log('FocusGuard Content Script injected.');

// Listen for messages from background script to show/hide overlay
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'BLOCK_SITE') {
        showBlockingOverlay(message.reason);
    }
});

function showBlockingOverlay(reason) {
    if (document.getElementById('focusguard-blocking-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'focusguard-blocking-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.98);
        backdrop-filter: blur(20px);
        color: white;
        z-index: 2147483647;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        text-align: center;
        padding: 40px;
    `;

    overlay.innerHTML = `
        <div style="max-width: 600px; width: 100%; animation: fadeIn 0.5s ease-out;">
            <div style="margin-bottom: 40px; position: relative; display: inline-block;">
                <div style="position: absolute; inset: -20px; background: #6366f1; filter: blur(40px); opacity: 0.2; border-radius: 50%;"></div>
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position: relative; animation: pulse 2s infinite;"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 6v6l4 2"/></svg>
            </div>
            
            <h1 style="font-size: 48px; font-weight: 900; margin-bottom: 10px; letter-spacing: -0.02em; color: white; text-transform: uppercase;">Focus Guard Active</h1>
            <p style="font-size: 18px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 40px;">${reason}</p>
            
            <div style="background: rgba(255,255,255,0.03); padding: 40px; border-radius: 40px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
                <p style="margin-bottom: 20px; font-size: 11px; font-weight: 900; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.1em;">Consciousness Verification</p>
                <p style="margin-bottom: 25px; font-size: 20px; font-weight: 600; color: #f8fafc; line-height: 1.5;" id="target-sentence">"I am choosing to focus on my goal right now."</p>
                <input type="text" id="focus-input" placeholder="Type exactly as shown..." 
                    style="width: 100%; padding: 20px; border-radius: 20px; border: 2px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.4); color: white; outline: none; font-size: 18px; text-align: center; transition: all 0.3s;" autofocus>
            </div>
            
            <button id="unlock-btn" style="margin-top: 40px; width: 100%; padding: 24px; border-radius: 100px; border: none; background: #6366f1; color: white; font-weight: 900; font-size: 18px; cursor: not-allowed; opacity: 0.5; transition: all 0.3s; box-shadow: 0 20px 40px -10px rgba(99, 102, 241, 0.4);" disabled>UNLOCK SESSION</button>
            <p style="margin-top: 20px; font-size: 12px; color: #475569; font-weight: 600; cursor: pointer; text-decoration: underline;" id="emergency-override">Emergency Override</p>
        </div>
        <style>
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
            #focus-input:focus { border-color: #6366f1; box-shadow: 0 0 0 4px rgba(99,102,241,0.1); }
        </style>
    `;

    document.body.appendChild(overlay);

    const input = overlay.querySelector('#focus-input');
    const btn = overlay.querySelector('#unlock-btn');
    const override = overlay.querySelector('#emergency-override');
    const target = "I am choosing to focus on my goal right now.";

    input.addEventListener('input', (e) => {
        if (e.target.value === target) {
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
            btn.disabled = false;
            btn.style.transform = 'scale(1.02)';
        } else {
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
            btn.disabled = true;
            btn.style.transform = 'scale(1)';
        }
    });

    btn.addEventListener('click', () => {
        overlay.remove();
    });

    override.addEventListener('click', () => {
        overlay.remove();
    });
}
