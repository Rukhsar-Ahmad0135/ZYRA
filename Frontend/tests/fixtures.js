import { test as base, expect } from '@playwright/test'
import { APIRequestContext } from '@playwright/test'

interface TestFixtures {
  apiRequest: APIRequestContext
  authToken: string | null
  adminToken: string | null
}

export const test = base.extend<TestFixtures>({
  apiRequest: async ({ playwright }, use) => {
    const request = await playwright.request.newContext({
      baseURL: 'http://localhost:9000/api',
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
      },
    })
    await use(request)
    await request.dispose()
  },
  
  authToken: async ({ apiRequest }, use) => {
    // Try to login and get token
    let token = null
    try {
      const response = await apiRequest.post('/users/login', {
        data: { email: 'test@test.com', password: 'test123' }
      })
      if (response.ok()) {
        const data = await response.json()
        token = data.token
      }
    } catch {}
    await use(token)
  },

  adminToken: async ({ apiRequest }, use) => {
    let token = null
    try {
      const response = await apiRequest.post('/users/login', {
        data: { email: 'admin@example.com', password: 'admin123' }
      })
      if (response.ok()) {
        const data = await response.json()
        token = data.token
      }
    } catch {}
    await use(token)
  },
})

export { expect } from '@playwright/test'