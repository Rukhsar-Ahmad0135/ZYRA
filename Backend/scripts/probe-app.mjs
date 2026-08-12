async function probe(url) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    const text = await res.text();
    console.log(`=== ${url} => ${res.status} (${res.headers.get("content-type")})`);
    console.log(text.slice(0, 400));
    console.log("---");
    return text;
  } catch (e) {
    console.log(`=== ${url} => DOWN (${e.name}: ${e.message})`);
    console.log("---");
    return null;
  }
}

await probe("http://localhost:9000/");
const front = await probe("http://localhost:5173/");
if (front) {
  console.log("frontend includes #root:", front.includes("root"));
  console.log("frontend references clerk:", /clerk/i.test(front));
}
await probe("http://localhost:5173/login");

