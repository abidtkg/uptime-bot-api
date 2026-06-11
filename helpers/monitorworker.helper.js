const https = require('https');
const Monitor = require('../models/Monitor.model');
const MonitorStatus = require('../models/MonitorStatus.model');
const ENUM_CONFIG = require('../configs/enums.config');

const TICK_INTERVAL_MS = 5000; // poll every 5 seconds to find monitors due for a check

function checkHttps(endpoint) {
    return new Promise((resolve) => {
        const start = Date.now();
        const TIMEOUT_MS = 10000;

        let url;
        try {
            url = new URL(endpoint);
        } catch {
            return resolve({ status: ENUM_CONFIG.MONITOR_RESPONSE_STATUSES_ENUM.ERROR, message: 'Invalid URL' });
        }

        const req = https.request(
            { hostname: url.hostname, port: url.port || 443, path: url.pathname + url.search, method: 'GET', timeout: TIMEOUT_MS },
            (res) => {
                const responseTime = Date.now() - start;
                const isUp = res.statusCode >= 200 && res.statusCode < 400;
                res.resume(); // drain the response so the socket can be reused
                resolve({
                    status: isUp ? ENUM_CONFIG.MONITOR_RESPONSE_STATUSES_ENUM.UP : ENUM_CONFIG.MONITOR_RESPONSE_STATUSES_ENUM.DOWN,
                    message: `HTTP ${res.statusCode}`,
                    metadata: { statusCode: res.statusCode, responseTimeMs: responseTime },
                });
            }
        );

        req.on('timeout', () => {
            req.destroy();
            resolve({ status: ENUM_CONFIG.MONITOR_RESPONSE_STATUSES_ENUM.TIMEOUT, message: 'Request timed out', metadata: { responseTimeMs: TIMEOUT_MS } });
        });

        req.on('error', (err) => {
            resolve({ status: ENUM_CONFIG.MONITOR_RESPONSE_STATUSES_ENUM.ERROR, message: err.message, metadata: { responseTimeMs: Date.now() - start } });
        });

        req.end();
    });
}

async function tick() {
    const now = new Date();

    // Fetch all active HTTPS monitors
    const monitors = await Monitor.find({
        type: ENUM_CONFIG.MONITOR_TYPES_ENUM.HTTPS,
        active: true,
        isPaused: false,
        maintenanceMode: false,
    });

    // Filter to only those due for a check based on their own intervalSeconds
    const due = monitors.filter((m) => {
        if (!m.last_checked_at) return true;
        return now - m.last_checked_at >= m.intervalSeconds * 1000;
    });

    if (due.length === 0) return;

    console.log(`[MonitorWorker] Checking ${due.length} monitor(s)`);

    await Promise.all(
        due.map(async (monitor) => {
            try {
                const result = await checkHttps(monitor.endpoint);
                const isUp = result.status === ENUM_CONFIG.MONITOR_RESPONSE_STATUSES_ENUM.UP;

                await MonitorStatus.create({
                    user: monitor.user,
                    monitor: monitor._id,
                    status: result.status,
                    message: result.message,
                    metadata: result.metadata,
                });

                const update = {
                    $set: {
                        last_checked_at: now,
                        status: isUp ? ENUM_CONFIG.MONITOR_STATUSES_ENUM.UP : ENUM_CONFIG.MONITOR_STATUSES_ENUM.DOWN,
                        ...(isUp ? { last_up_at: now } : { last_down_at: now }),
                    },
                    ...(!isUp && { $inc: { total_downtimes: 1 } }),
                };

                await Monitor.findByIdAndUpdate(monitor._id, update);

                console.log(`[MonitorWorker] ${monitor.name} (${monitor.endpoint}): ${result.status} — ${result.message}`);
            } catch (err) {
                console.error(`[MonitorWorker] Error checking "${monitor.name}":`, err.message);
            }
        })
    );
}

function startMonitorWorker() {
    console.log('[MonitorWorker] Started');
    tick(); // run immediately on startup
    setInterval(tick, TICK_INTERVAL_MS);
}

module.exports = { startMonitorWorker };
