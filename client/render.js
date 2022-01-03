const EventEmitter = require('events')
class Render extends EventEmitter {

}

// 渲染进程
const render = new Render()
module.exports = render
