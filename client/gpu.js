const EventEmitter = require('events')
class GPU extends EventEmitter {

}

// GPU进程
const gpu = new GPU()
module.exports = gpu
