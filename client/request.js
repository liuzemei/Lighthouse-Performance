// 入口文件
const htmlparse2 = require('htmlparser2')
const css = require('css')
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
  const headers = response.headers
  const contentType = headers['content-type']
  if (contentType.includes('text/html')) {
    // 通过渲染进程把 html 字符串转成 DOM 树
    const document = { type: 'document', attributes: {}, children: [] }
    const tokenStack = [document]
    const cssRules = []
    const parser = new htmlparse2.Parser({
      onopentag(tagName, attributes) { // 遇到开始标签
        // 栈顶的就是父节点
        const parent = tokenStack[tokenStack.length - 1]
        const element = {
          type: 'element',
          tagName,
          attributes,
          children: []
        }
        parent.children.push(element)
        tokenStack.push(element)
      },
      ontext(text) {
        // 文本节点不需要入栈
        if (!/^[\r\n\s]*$/.test(text)) {
          const parent = tokenStack[tokenStack.length - 1]
          const element = {
            type: 'text',
            text,
            attributes: {},
            children: []
          }
          parent.children.push(element)
        }
      },
      onclosetag(tagName) {
        const el = tokenStack.pop()

        switch (tagName) {
          case 'style':
            const cssAST = css.parse(el.children[0].text)
            const rules = cssAST.stylesheet.rules
            cssRules.push(...rules)
        }

      }
    })

    // 持续接收响应体
    response.on('data', b => parser.write(b.toString()))
    response.on('end', () => {
      // 计算每个 DOM 节点的具体样式 继承 层叠
      // console.dir(document, { depth: null })
      recalculateStyle(cssRules, document)
      console.dir(document, { depth: null })
      main.emit('domContentLoaded')
      // CSS 和图片加载完成后
      main.emit('Load')
    })
  }
})

function recalculateStyle(cssRules, element, parentStyle = {}) {
  const attributes = element.attributes
  element.computedStyle = { color: parentStyle.color || 'black' }
  Object.entries(attributes).forEach(([key, value]) => {
    // 应用样式表
    cssRules.forEach(rule => {
      let selector = rule.selectors[0]
      if (key === 'id' && selector === ('#' + value)
        || key === 'class' && selector === ('.' + value)) {
        rule.declarations.forEach(({ property, value }) => {
          element.computedStyle[property] = value
        })
      }
    })
    // 行内样式
    if (key === 'style') {
      const attributes = value.split(';')
      attributes.forEach(attribute => {
        const [property, value] = attribute.split(/\s*:\s*/)
        if (property)
          element.computedStyle[property] = value
      })
    }
  })
  element.children.forEach(child => recalculateStyle(cssRules, child, element.computedStyle))
}

// 1. 由主进程接收用户输入的 URL 地址
main.emit('request', {
  host,
  port,
  path: '/index.html'
})
