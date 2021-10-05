// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default async function handler(req, res) {
  const { url: forwardingUrl, filters: rawFilters = [] } = req.query;

  const filters = JSON.parse(rawFilters);

  if (!forwardingUrl) {
    return res
      .status(400)
      .setHeader("x-proxy", "error")
      .send(
        `You need to specify the "url" query param to proxy your request to`
      );
  }

  let payload;
  // There are no payload in GET and HEAD requests
  if (req.method !== "GET" && req.method !== "HEAD") {
    payload = req.body;
    if (payload) {
      // get discriminant filter (the first we find)
      let filter;
      for (let f of filters) {
        if (payload[f[0]] == f[1]) {
          filter = { key: f[0], value: f[1] };
          break;
        }
      }

      if (filter) {
        console.log(`Filtering request with "${filter.key} = ${filter.value}"`);
        return res
          .status(200)
          .setHeader("x-proxy", "filtered")
          .setHeader("x-proxy-filter-key", filter.key)
          .setHeader("x-proxy-filter-value", filter.value)
          .send();
      }
    }
  }

  // otherwise forward the method, the content-type and the payload
  const proxyReq = {
    method: req.method,
    headers: {
      ...(req.headers["content-type"]
        ? { "content-type": req.headers["content-type"] }
        : {})
    },
    ...(payload ? { body: JSON.stringify(payload) } : {})
  };

  const proxyRes = await fetch(forwardingUrl, proxyReq);
  res
    .status(proxyRes.status)
    .setHeader("x-proxy", "proxied")
    .send(proxyRes.body);
}
