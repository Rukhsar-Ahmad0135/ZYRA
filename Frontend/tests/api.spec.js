import { test, expect } from '@playwright/test'

const API_BASE = 'http://127.0.0.1:9000/api'

test.describe('Backend API - Public Endpoints', () => {
  test('GET /products returns paginated products', async ({ request }) => {
    const response = await request.get(`${API_BASE}/products`)
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data).toHaveProperty('products')
    expect(Array.isArray(data.products)).toBeTruthy()
    expect(data).toHaveProperty('page')
    expect(data).toHaveProperty('pages')
  })

  test('GET /products with query params', async ({ request }) => {
    const response = await request.get(`${API_BASE}/products?gender=Women&category=Top Wear&limit=8`)
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(Array.isArray(data.products) || Array.isArray(data)).toBeTruthy()
  })

  test('GET /products/new-arrivals', async ({ request }) => {
    const response = await request.get(`${API_BASE}/products/new-arrivals`)
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(Array.isArray(data)).toBeTruthy()
  })

  test('GET /products/best-seller', async ({ request }) => {
    const response = await request.get(`${API_BASE}/products/best-seller`)
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data).toHaveProperty('_id')
  })

  test('GET /products/:id - existing product', async ({ request }) => {
    const listResponse = await request.get(`${API_BASE}/products`)
    const listData = await listResponse.json()
    const firstProduct = listData.products?.[0] || listData[0]
    
    if (firstProduct) {
      const response = await request.get(`${API_BASE}/products/${firstProduct._id}`)
      expect(response.ok()).toBeTruthy()
      const data = await response.json()
      expect(data._id).toBe(firstProduct._id)
    }
  })

  test('GET /products/similar/:id', async ({ request }) => {
    const listResponse = await request.get(`${API_BASE}/products`)
    const listData = await listResponse.json()
    const firstProduct = listData.products?.[0] || listData[0]
    
    if (firstProduct) {
      const response = await request.get(`${API_BASE}/products/similar/${firstProduct._id}`)
      expect(response.ok()).toBeTruthy()
      const data = await response.json()
      expect(Array.isArray(data)).toBeTruthy()
    }
  })
})

test.describe('Backend API - Auth Endpoints', () => {
  test('POST /users/register - invalid data', async ({ request }) => {
    const response = await request.post(`${API_BASE}/users/register`, {
      data: { email: 'invalid', password: '123' }
    })
    expect([400, 409, 422]).toContain(response.status())
  })

  test('POST /users/login - invalid credentials', async ({ request }) => {
    const response = await request.post(`${API_BASE}/users/login`, {
      data: { email: 'wrong@test.com', password: 'wrongpassword' }
    })
    expect(response.status()).toBe(401)
  })

  test('GET /users/profile - unauthorized', async ({ request }) => {
    const response = await request.get(`${API_BASE}/users/profile`)
    expect([401, 403]).toContain(response.status())
  })
})

test.describe('Backend API - Cart Endpoints', () => {
  test('GET /cart - no cart', async ({ request }) => {
    const response = await request.get(`${API_BASE}/cart`)
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data).toHaveProperty('products')
    expect(Array.isArray(data.products)).toBeTruthy()
  })

  test('POST /cart/merge - unauthorized', async ({ request }) => {
    const response = await request.post(`${API_BASE}/cart/merge`, {
      data: { guestId: 'test-guest' }
    })
    expect([401, 403]).toContain(response.status())
  })
})

test.describe('Backend API - Admin Endpoints (Protected)', () => {
  test('GET /admin/users - unauthorized', async ({ request }) => {
    const response = await request.get(`${API_BASE}/admin/users`)
    expect([401, 403]).toContain(response.status())
  })

  test('GET /admin/orders - unauthorized', async ({ request }) => {
    const response = await request.get(`${API_BASE}/admin/orders`)
    expect([401, 403]).toContain(response.status())
  })

  test('GET /admin/products - unauthorized', async ({ request }) => {
    const response = await request.get(`${API_BASE}/admin/products`)
    expect([401, 403]).toContain(response.status())
  })

  test('GET /admin/stats - unauthorized', async ({ request }) => {
    const response = await request.get(`${API_BASE}/admin/stats`)
    expect([401, 403]).toContain(response.status())
  })
})

test.describe('Backend API - Orders Endpoints', () => {
  test('GET /orders/my-orders - unauthorized', async ({ request }) => {
    const response = await request.get(`${API_BASE}/orders/my-orders`)
    expect([401, 403]).toContain(response.status())
  })
})

test.describe('Backend API - Subscribers', () => {
  test('POST /subscribers - invalid email', async ({ request }) => {
    const response = await request.post(`${API_BASE}/subscribers`, {
      data: { email: 'invalid-email' }
    })
    expect([400, 422]).toContain(response.status())
  })
})