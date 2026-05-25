const MONITOR_TYPES_ENUM = {
    HTTP: 'HTTP',
    HTTPS: 'HTTPS',
    PING: 'PING',
    DNS: 'DNS',
    SSL: 'SSL',
    PORT: 'PORT',
    ALL: ['HTTP', 'HTTPS', 'PING', 'DNS', 'SSL', 'PORT']
}

const MONITOR_STATUSES_ENUM = {
    UP: 'UP',
    DOWN: 'DOWN',
    PAUSED: 'PAUSED',
    ALL: ['UP', 'DOWN', 'PAUSED']
}

const MONITOR_RESPONSE_STATUSES_ENUM = {
    UP: 'UP',
    DOWN: 'DOWN',
    TIMEOUT: 'TIMEOUT',
    ERROR: 'ERROR',
    ALL: ['UP', 'DOWN', 'TIMEOUT', 'ERROR']
}

module.exports = {
    MONITOR_TYPES_ENUM,
    MONITOR_STATUSES_ENUM,
    MONITOR_RESPONSE_STATUSES_ENUM
}