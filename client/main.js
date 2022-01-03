const EventEmitter = require('events')
class Main extends EventEmitter {

}

// 主进程
const main = new Main()
module.exports = main
