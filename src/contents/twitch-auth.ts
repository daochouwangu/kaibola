// 注入到 twitch.tv 页面获取认证信息
export function injectTwitchAuth() {
  const script = document.createElement("script")
  script.textContent = `
    // 获取本地存储的认证信息
    const authToken = localStorage.getItem('auth-token') 
    // 发送消息给扩展
    window.postMessage({
      type: 'TWITCH_AUTH',
      data: {
        authToken,
        clientId: /* 从页面获取 client id */
      }
    }, '*')
  `
  document.head.appendChild(script)
}
