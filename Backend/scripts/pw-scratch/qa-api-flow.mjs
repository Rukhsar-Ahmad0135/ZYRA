// API-level QA for ZYRA Clerk integration flows (local-data mode).
// Exercises: guest cart -> legacy login -> merge cart -> checkout -> COD finalize.
// Also verifies admin auth guard. Browser automation is blocked by a stalled
// chromium-1200 download, so this exercises the same backend endpoints a real
// browser session would hit.
const BASE = "http://localhost:9000";
const log = (...a) => console.log("[QA]", ...a);
let results = { pass: 0, fail: 0 };

const check = (name, cond, detail = "") => {
  if (cond) { results.pass++; log("PASS", name, detail); }
  else { results.fail++; log("FAIL", name, detail); }
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const jreq = async (method, path, body, token, retries = 4) => {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(BASE + path, {
        method, headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(30000),
      });
      const data = await res.json().catch(() => ({}));
      return { status: res.status, data };
    } catch (e) {
      if (i === retries - 1) return { status: 0, data: { _err: e.message } };
      await sleep(1000 * (i + 1));
    }
  }
};

// 1) Get a product id for cart testing
let p = await jreq("GET", "/api/products?pageSize=2");
const product = p.data.products?.[0];
check("fetch products", p.status === 200 && !!product, `status=${p.status}`);

// 2) Legacy register a unique test customer (local mode)
const email = `qa_${Date.now()}@example.com`;
const reg = await jreq("POST", "/api/users/register", {
  name: "QA Tester", email, password: "QaPass1234!", role: "customer",
});
check("register customer", reg.status === 201, `status=${reg.status}`);

// 3) Legacy login -> gets a JWT we can use to test authenticated endpoints
const login = await jreq("POST", "/api/users/login", { email, password: "QaPass1234!" });
const token = login.data?.token;
check("login customer", login.status === 200 && !!token, `status=${login.status}`);

// 4) Profile (authenticated via legacy JWT)
if (token) {
  const prof = await jreq("GET", "/api/users/profile", null, token);
  check("GET /profile", prof.status === 200 && prof.data.email === email, `role=${prof.data?.role}`);
}

// 5) Guest cart add (no token, with guestId)
const guestId = `qa_guest_${Date.now()}`;
const gcart = await jreq("POST", "/api/cart", {
  productId: product._id, quantity: 2, size: "M", color: "Black", guestId,
});
check("guest add to cart", gcart.status === 201 && gcart.data?.guestId === guestId, `status=${gcart.status}`);

// 6) Merge guest cart -> user cart (authenticated)
let merge;
if (token) {
  merge = await jreq("POST", "/api/cart/merge", { guestId }, token);
  check("merge guest->user cart", merge.status === 200, `status=${merge.status} items=${merge.data?.products?.length}`);
}

// 7) Create COD checkout (authenticated)
let checkoutId;
if (token) {
  const co = await jreq("POST", "/api/checkout", {
    checkoutItems: [{
      productId: product._id, name: product.name, image: product.images?.[0]?.url || "",
      price: product.price, quantity: 2, size: "M", color: "Black",
    }],
    shippingAddress: {
      firstName: "QA", lastName: "Tester", phone: "0300-1234567",
      address: "Test Street 1", city: "Karachi", postalCode: "75000", country: "Pakistan",
    },
    paymentMethod: "Cash on Delivery",
    totalPrice: product.price * 2,
  }, token);
  checkoutId = co.data?._id;
  check("create COD checkout", co.status === 201 && !!checkoutId, `status=${co.status}`);
  check("shipping has name/phone", !!co.data?.shippingAddress?.firstName && !!co.data?.shippingAddress?.phone, "name/phone persisted");
}

// 8) Finalize COD checkout -> order created WITHOUT requiring payment (the fix)
if (token && checkoutId) {
  const fin = await jreq("POST", `/api/checkout/${checkoutId}/finalize`, {}, token);
  check("finalize COD checkout (no prior payment)", fin.status === 201 && !!fin.data?._id, `status=${fin.status} msg=${fin.data?.message || "ok"}`);
  check("order paymentStatus Pending for COD", fin.data?.paymentStatus === "Pending" || fin.data?.isPaid === false, `paymentStatus=${fin.data?.paymentStatus}`);
}

// 9) My orders (authenticated)
if (token) {
  const orders = await jreq("GET", "/api/orders/my-orders", null, token);
  check("GET /my-orders", orders.status === 200, `count=${orders.data?.length}`);
}

// 10) Admin guard: a plain customer must be forbidden from /api/admin/stats
if (token) {
  const admin = await jreq("GET", "/api/admin/stats", null, token);
  check("customer blocked from admin (403)", admin.status === 403, `status=${admin.status}`);
}

console.log("\n=====", "RESULTS", JSON.stringify(results, null, 2));

