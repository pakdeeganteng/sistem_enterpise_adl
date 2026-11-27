const cors = require('cors')
const express = require('express')
const { createProxyMiddleware } = require('http-proxy-middleware')

const app = express()
const port = Number(process.env.PORT || 8080)
const host = process.env.HOST || '127.0.0.1'
const PRODUCT_URL =
  process.env.PRODUCT_URL ||
  process.env.PRODUCT_SERVICE_URL ||
  'http://localhost:3000'
const CART_URL =
  process.env.CART_URL ||
  process.env.CART_SERVICE_URL ||
  'http://localhost:3001'
const REVIEW_URL =
  process.env.REVIEW_URL ||
  process.env.REVIEW_SERVICE_URL ||
  'http://localhost:3002'
const ORDER_URL = `${
  (process.env.ORDER_URL ||
    process.env.ORDER_SERVICE_URL ||
    'http://localhost:8000'
  ).replace(/\/+$/, '')
}/api/v1`

const routes = {
  '/products': PRODUCT_URL,
  '/carts': CART_URL,
  '/reviews': REVIEW_URL,
  '/orders': ORDER_URL,
}

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`Invalid PORT value: ${process.env.PORT}`)
}

app.use(cors())
app.use((req, res, next) => {
  const startedAt = process.hrtime.bigint()

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6
    console.info(
      `[gateway] ${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs.toFixed(1)}ms`,
    )
  })

  next()
})

app.get('/', (_req, res) => {
  res.json({
    service: 'AdulShop API Gateway',
    status: 'ok',
    routes: Object.keys(routes),
  })
})

app.get('/health', (_req, res) => {
  res.json({ service: 'api-gateway', status: 'ok' })
})

app.use(
  createProxyMiddleware({
    target: PRODUCT_URL,
    changeOrigin: true,
    pathFilter: '/catalog',
    pathRewrite: { '^/catalog': '/products' },
  }),
)

for (const [path, target] of Object.entries(routes)) {
  app.use(
    createProxyMiddleware({ target, changeOrigin: true, pathFilter: path }),
  )
}

app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    availableRoutes: Object.keys(routes),
  })
})

app.use((error, _req, res, next) => {
  console.error(`[gateway] request error: ${error.message}`)

  if (res.headersSent) {
    next(error)
    return
  }

  res.status(500).json({ error: 'Internal Server Error' })
})

const server = app.listen(port, host, () => {
  console.info(`[gateway] listening at http://localhost:${port}`)
  console.info(
    '[gateway] routes:',
    Object.entries(routes)
      .map(([path, target]) => `${path} -> ${target}`)
      .join(', '),
  )
})

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`[gateway] port ${port} is already in use.`)
  } else {
    console.error(`[gateway] failed to start: ${error.message}`)
  }

  process.exitCode = 1
})
