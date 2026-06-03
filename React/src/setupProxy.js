const { createProxyMiddleware } = require('http-proxy-middleware')

module.exports = function (app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://datawiz-website-dpc8.vercel.app',
      changeOrigin: true,
    })
  )
}
