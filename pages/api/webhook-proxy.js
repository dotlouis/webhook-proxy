// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

const integromatEndpoint = process.env.FORWARDING_ENDPOINT;
const filterKey = process.env.PAYLOAD_FILTER_KEY;
const filterValues = JSON.parse(process.env.PAYLOAD_FILTER_VALUES);

export default async function handler(req, res) {
  let payload;
  if (req.method !== "GET" && req.method !== "HEAD") {
    payload = req.body;
    if (payload && filterValues.includes(payload[filterKey])) {
      console.log(
        `Filtering request with "${filterKey} = ${payload[filterKey]}"`
      );
      return res.status(200).setHeader("x-proxy", "filtered").send();
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

  const proxyRes = await fetch(integromatEndpoint, proxyReq);
  res
    .status(proxyRes.status)
    .setHeader("x-proxy", "proxied")
    .send(proxyRes.body);
}
