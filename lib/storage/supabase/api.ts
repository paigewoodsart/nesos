// The website talks to the database only through its own server routes
// (/api/db/*), which check who is signed in. It used to fall back to reading
// and writing the tables straight from the browser; that route is closed.

/** Calls one of our API routes, retrying once if the network or server hiccups. */
export async function api(path: string, init?: RequestInit): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(path, init);
      if (res.ok) return res;
      lastError = new Error(`${res.status} ${await res.text()}`);
      // A 4xx (signed out, bad request) won't improve on a second try.
      if (res.status < 500) break;
    } catch (err) {
      lastError = err;
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw lastError instanceof Error ? lastError : new Error("Request failed");
}
