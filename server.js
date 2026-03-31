import * as serverBuild from 'virtual:react-router/server-build';
import {createRequestHandler} from '@shopify/hydrogen';

/**
 * Vercel-compatible server handler
 */
export default async function handler(req, res) {
  try {
    const handleRequest = createRequestHandler({
      build: serverBuild,
      mode: process.env.NODE_ENV,
      getLoadContext: () => ({}),
    });

    const request = new Request(`https://${req.headers.host}${req.url}`, {
      method: req.method,
      headers: req.headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? req : null,
    });

    const response = await handleRequest(request);

    // Convert Response → Node response
    res.statusCode = response.status;

    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const body = await response.text();
    res.end(body);

  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
}