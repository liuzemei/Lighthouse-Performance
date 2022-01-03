const EventEmitter = require('events')
class Network extends EventEmitter {

}

// 网络进程
const network = new Network()
module.exports = network
