// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default async function handler(req, res) {
  const { url: forwardingUrl, filters: rawFilters = [] } = req.query;

  console.log("query param", req.query);
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
  if (req.method !== "GET" && req.method !== "HEAD") {
    payload = req.body;
    if (payload) {
      let filter;
      // get discriminant filter
      for (let f of filters) {
        if (payload[f[0]] == f[1]) {
          filter = { key: f[0], value: f[1] };
          break;
        }
      }
      // filters.reduce((acc, curr) => {
      //   const applyFilter = payload[curr[0]] == curr[1];
      //   return acc || applyFilter;
      // }, false);
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

  const proxyReq = {
    method: req.method,
    headers: {
      ...(req.headers["content-type"]
        ? { "content-type": req.headers["content-type"] }
        : {})
    },
    ...(payload ? { body: JSON.stringify(payload) } : {})
  };

  console.log("Proxying request", proxyReq);

  const proxyRes = await fetch(forwardingUrl, proxyReq);
  res
    .status(proxyRes.status)
    .setHeader("x-proxy", "proxied")
    .send(proxyRes.body);
}
