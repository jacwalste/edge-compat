import { describe, it, expect } from 'vitest';
import { depsNotEdgeSafe } from '../deps-not-edge-safe.js';
import { EdgeTarget } from '../../types.js';

describe('depsNotEdgeSafe rule', () => {
  const createContext = (fileContent: string) => ({
    filePath: 'test.ts',
    fileContent,
    edgeTarget: EdgeTarget.AUTO,
    strict: false,
  });

  it('should detect jsonwebtoken import', () => {
    const result = depsNotEdgeSafe.detect(
      createContext(`import jwt from 'jsonwebtoken';`),
    );
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]?.message).toContain('jsonwebtoken');
    expect(result.findings[0]?.suggestions?.[0]?.package).toBe('jose');
  });

  it('should detect axios import', () => {
    const result = depsNotEdgeSafe.detect(createContext(`import axios from 'axios';`));
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]?.message).toContain('axios');
  });

  it('should detect pg import', () => {
    const result = depsNotEdgeSafe.detect(
      createContext(`import { Client } from 'pg';`),
    );
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]?.message).toContain('pg');
    expect(result.findings[0]?.suggestions?.[0]?.package).toContain('neon');
  });

  it('should detect ws import', () => {
    const result = depsNotEdgeSafe.detect(
      createContext(`import WebSocket from 'ws';`),
    );
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]?.message).toContain('ws');
  });

  it('should detect require() syntax', () => {
    const result = depsNotEdgeSafe.detect(
      createContext(`const jwt = require('jsonwebtoken');`),
    );
    expect(result.findings).toHaveLength(1);
  });

  it('should handle scoped packages', () => {
    const result = depsNotEdgeSafe.detect(
      createContext(`import { neon } from '@neondatabase/serverless';`),
    );
    // @neondatabase/serverless is actually Edge-safe, shouldn't detect
    expect(result.findings).toHaveLength(0);
  });

  it('should not detect safe packages', () => {
    const result = depsNotEdgeSafe.detect(
      createContext(`import { z } from 'zod';\nimport React from 'react';`),
    );
    expect(result.findings).toHaveLength(0);
  });

  it('should provide migration notes', () => {
    const result = depsNotEdgeSafe.detect(
      createContext(`import jwt from 'jsonwebtoken';`),
    );
    expect(result.findings[0]?.suggestions?.length).toBeGreaterThan(1);
    const migrationSuggestion = result.findings[0]?.suggestions?.find(s => 
      s.message.includes('Migration')
    );
    expect(migrationSuggestion).toBeDefined();
  });
});

