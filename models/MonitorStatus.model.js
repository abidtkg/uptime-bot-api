const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ENUM_CONFIG = require('../configs/enums.config');


const MonitorStatusSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    monitor: {
        type: Schema.Types.ObjectId,
        ref: 'monitor',
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: ENUM_CONFIG.MONITOR_RESPONSE_STATUSES_ENUM.ALL
    },
    message: {
        type: String,
        required: true
    },
    metadata: {
        type: Object,
        required: false
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

const MonitorStatusModel = mongoose.model('monitor_status', MonitorStatusSchema);
module.exports = MonitorStatusModel;