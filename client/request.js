// 入口文件
const http = require('http')
const main = require('./main')
const network = require('./network')
const render = require('./render')

const host = 'localhost'
const port = 80

// 浏览器住进程接收请求
main.on('request', options => {
  // 会把请求转发给网络进程
  network.emit('request', options)
})
// 主进程接收到消息后，通知渲染进程开始渲染
main.on('prepareRender', response => {
  // 主进程发送提交导航到消息给渲染进程
  render.emit('commitNavigation', response)
})

// ******************* 网络进程 *********************
network.on('request', options => {
  // 调用 http 模块发送请求给服务
  const request = http.request(options, response => {
    const header = response.headers
    // 告诉主进程请开始渲染页面
    main.emit('prepareRender', response)
  })
  request.end()
})

// ******************* 渲染进程 *********************
// 准备跳转页面里
render.on('commitNavigation', response => {
  const buffers = []
  // 持续接收响应体
  response.on('data', b => buffers.push(b))
  response.on('end', () => {
    const resultBuffer = Buffer.concat(buffers) // 二进制缓冲区
    const html = resultBuffer.toString() // 转成 html 字符串
    // DOM 解析完毕
    console.log(html)
    main.emit('domContentLoaded')
    // CSS 和图片加载完成后
    main.emit('Load')
  })
})

// 1. 由主进程接收用户输入的 URL 地址
main.emit('request', {
  host,
  port,
  path: '/index.html'
})
