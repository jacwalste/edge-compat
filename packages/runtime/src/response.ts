/**
 * Create a JSON response with proper headers
 * Helper for Edge Functions/Middleware
 */
export function jsonResponse<T = unknown>(
  data: T,
  init?: ResponseInit,
): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
}

/**
 * Create an error response with JSON body
 */
export function errorResponse(
  message: string,
  status = 500,
  init?: ResponseInit,
): Response {
  return jsonResponse(
    { error: message },
    {
      ...init,
      status,
    },
  );
}

/**
 * Create a redirect response
 */
export function redirectResponse(
  url: string,
  status: 301 | 302 | 303 | 307 | 308 = 302,
  init?: ResponseInit,
): Response {
  return new Response(null, {
    ...init,
    status,
    headers: {
      Location: url,
      ...init?.headers,
    },
  });
}

/**
 * Create a text response
 */
export function textResponse(
  text: string,
  init?: ResponseInit,
): Response {
  return new Response(text, {
    ...init,
    headers: {
      'Content-Type': 'text/plain',
      ...init?.headers,
    },
  });
}

/**
 * Create an HTML response
 */
export function htmlResponse(
  html: string,
  init?: ResponseInit,
): Response {
  return new Response(html, {
    ...init,
    headers: {
      'Content-Type': 'text/html',
      ...init?.headers,
    },
  });
}

