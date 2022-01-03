## chrome 进程
- 浏览器住进程 负责界面显示 用户交互 子进程管理
- 渲染进程 排版 JSV8 都在这层，负责把 html 和 css 和 js 转变成网页
- 网络进程 加载网络资源
- GPU进程 加速页面生成



## 1. 主进程： 加载 HTML
1. 主进程接收用户输入的 URL
2. 主进程把该 URL 转发给网络进程
3. 在网络进程中发起 URL 请求
4. 网络进程接收响应头数据并转发给主进程
5. 主进程发送提交导航消息到渲染进程
6. 渲染进程开始从网络进程接收 HTML 数据
7. HTML接收完毕后通知主进程确认导航
8. 渲染进程开始 HTML 解析和加载子资源
9. HTML 解析完毕和加载子资源页面加载完成后会通知主进程页面加载完成

具体实现在 [client/request.js](client/request.js)

