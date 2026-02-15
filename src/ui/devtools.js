/**
 * Developer Tools UI
 * Provides in-browser logging and LLM debugging.
 */
import { subscribeLog } from '../utils/logger.js';
import { llmService } from '../llm/llm.service.js';

export class DevTools {
    constructor() {
        this.isOpen = false;
        this.activeTab = 'logs'; // 'logs' | 'llm'
        this.logs = [];
        this.llmEvents = [];

        this.render();
        this.bindEvents();
        this.setupSubscriptions();
    }

    render() {
        // Create container
        const container = document.createElement('div');
        container.id = 'devtools-container';
        container.classList.add('hidden');

        container.innerHTML = `
            <div class="dt-header">
                <div class="dt-tabs">
                    <button class="dt-tab active" data-tab="logs">Logs</button>
                    <button class="dt-tab" data-tab="llm">LLM Debug</button>
                    <button class="dt-tab" data-tab="str">Storage</button>
                </div>
                <button class="dt-close">✕</button>
            </div>
            <div class="dt-content" id="dt-logs">
                <div class="dt-log-list"></div>
            </div>
            <div class="dt-content hidden" id="dt-llm">
                <div class="dt-llm-list"></div>
            </div>
             <div class="dt-content hidden" id="dt-str">
                <div class="dt-str-list">Feature coming soon...</div>
            </div>
        `;
        document.body.appendChild(container);

        // Create Toggle Button
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'devtools-toggle';
        toggleBtn.innerText = '🛠️';
        toggleBtn.title = 'Open DevTools';
        document.body.appendChild(toggleBtn);

        this.containerInfo = container;
        this.logList = container.querySelector('#dt-logs .dt-log-list');
        this.llmList = container.querySelector('#dt-llm .dt-llm-list');
    }

    bindEvents() {
        document.getElementById('devtools-toggle').addEventListener('click', () => this.toggle());
        this.containerInfo.querySelector('.dt-close').addEventListener('click', () => this.toggle());

        const tabs = this.containerInfo.querySelectorAll('.dt-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
    }

    setupSubscriptions() {
        // Log Subscription
        subscribeLog((logEntry) => {
            this.addLogEntry(logEntry);
        });

        // LLM Subscriptions
        llmService.on('generation_start', (data) => {
            this.addLLMEntry('start', data);
        });

        llmService.on('generation_end', (data) => {
            this.addLLMEntry('end', data);
        });

        llmService.on('generation_error', (data) => {
            this.addLLMEntry('error', data);
        });
    }

    toggle() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.containerInfo.classList.remove('hidden');
        } else {
            this.containerInfo.classList.add('hidden');
        }
    }

    switchTab(tabName) {
        this.activeTab = tabName;

        // Update Tab UI
        this.containerInfo.querySelectorAll('.dt-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tabName);
        });

        // Update Content UI
        this.containerInfo.querySelectorAll('.dt-content').forEach(c => {
            c.classList.add('hidden');
        });
        this.containerInfo.querySelector(`#dt-${tabName}`).classList.remove('hidden');
    }

    addLogEntry(entry) {
        const div = document.createElement('div');
        div.className = `dt-log-line ${entry.type}`;
        div.innerHTML = `<span class="dt-time">[${entry.time}]</span> <span class="dt-msg">${entry.msg}</span>`;
        if (this.logList) {
            this.logList.appendChild(div);
            // Auto scroll if near bottom
            this.logList.scrollTop = this.logList.scrollHeight;
        }
    }

    addLLMEntry(type, data) {
        const div = document.createElement('div');
        div.className = `dt-llm-item ${type}`;
        const time = new Date().toLocaleTimeString();

        if (type === 'start') {
            const preview = data.messages[data.messages.length - 1].content.substring(0, 50) + '...';
            div.innerHTML = `
                <div class="dt-llm-header">
                    <span class="dt-time">[${time}]</span> 📤 Request (${data.messages.length} msgs)
                </div>
                <div class="dt-llm-detail">Last: "${preview}"</div>
                <div class="dt-payload hidden"><pre>${JSON.stringify(data.messages, null, 2)}</pre></div>
            `;
            // Click to toggle payload
            div.addEventListener('click', () => {
                div.querySelector('.dt-payload').classList.toggle('hidden');
            });
        } else if (type === 'end') {
            const tokens = data.tokenUsage;
            div.innerHTML = `
                <div class="dt-llm-header">
                     <span class="dt-time">[${time}]</span> 📥 Response (${data.duration}ms)
                </div>
                <div class="dt-llm-detail">Tokens: In ~${tokens.input} / Out ~${tokens.output}</div>
                <div class="dt-payload hidden"><pre>${data.response}</pre></div>
            `;
            div.addEventListener('click', () => {
                div.querySelector('.dt-payload').classList.toggle('hidden');
            });
        } else if (type === 'error') {
            div.innerHTML = `
                <div class="dt-llm-header error">
                     <span class="dt-time">[${time}]</span> ❌ Error
                </div>
                <div class="dt-llm-detail">${data.error.message || data.error}</div>
            `;
        }

        if (this.llmList) {
            this.llmList.appendChild(div);
            this.llmList.scrollTop = this.llmList.scrollHeight;
        }
    }
}
