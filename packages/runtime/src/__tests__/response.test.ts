import { describe, it, expect } from 'vitest';
import {
  jsonResponse,
  errorResponse,
  redirectResponse,
  textResponse,
  htmlResponse,
} from '../response.js';

describe('response helpers', () => {
  describe('jsonResponse', () => {
    it('should create JSON response', async () => {
      const response = jsonResponse({ message: 'Hello' });
      expect(response.headers.get('Content-Type')).toBe('application/json');
      const data = await response.json();
      expect(data).toEqual({ message: 'Hello' });
    });

    it('should accept custom init', () => {
      const response = jsonResponse({ test: true }, { status: 201 });
      expect(response.status).toBe(201);
    });

    it('should merge headers', () => {
      const response = jsonResponse(
        { test: true },
        { headers: { 'X-Custom': 'value' } },
      );
      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('X-Custom')).toBe('value');
    });
  });

  describe('errorResponse', () => {
    it('should create error response with default 500', async () => {
      const response = errorResponse('Something went wrong');
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: 'Something went wrong' });
    });

    it('should accept custom status', async () => {
      const response = errorResponse('Not found', 404);
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Not found');
    });
  });

  describe('redirectResponse', () => {
    it('should create redirect with default 302', () => {
      const response = redirectResponse('/new-path');
      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe('/new-path');
    });

    it('should accept custom status', () => {
      const response = redirectResponse('/permanent', 301);
      expect(response.status).toBe(301);
      expect(response.headers.get('Location')).toBe('/permanent');
    });
  });

  describe('textResponse', () => {
    it('should create text response', async () => {
      const response = textResponse('Hello, world!');
      expect(response.headers.get('Content-Type')).toBe('text/plain');
      const text = await response.text();
      expect(text).toBe('Hello, world!');
    });
  });

  describe('htmlResponse', () => {
    it('should create HTML response', async () => {
      const html = '<h1>Hello</h1>';
      const response = htmlResponse(html);
      expect(response.headers.get('Content-Type')).toBe('text/html');
      const text = await response.text();
      expect(text).toBe(html);
    });
  });
});

