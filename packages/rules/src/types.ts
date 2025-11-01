import { z } from 'zod';

/**
 * Severity levels for rule violations
 */
export enum RuleSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

/**
 * Edge runtime targets
 */
export enum EdgeTarget {
  NEXTJS = 'next',
  VERCEL = 'vercel',
  CLOUDFLARE = 'cloudflare',
  DENO = 'deno',
  AUTO = 'auto',
}

/**
 * Location information for a finding
 */
export interface SourceLocation {
  file: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
}

/**
 * A code frame snippet showing the problematic code
 */
export interface CodeFrame {
  code: string;
  location: SourceLocation;
}

/**
 * Suggested fix for a finding
 */
export interface Suggestion {
  message: string;
  replacement?: string;
  package?: string;
  importStatement?: string;
  docsUrl?: string;
}

/**
 * A finding/violation detected by a rule
 */
export interface Finding {
  ruleId: string;
  severity: RuleSeverity;
  message: string;
  location: SourceLocation;
  codeFrame?: CodeFrame;
  suggestions?: Suggestion[];
}

/**
 * AST context (optional, provided when AST parsing is available)
 */
export interface ASTContext {
  sourceFile: any; // ts-morph SourceFile
  filePath: string;
  fileContent: string;
}

/**
 * Context passed to rule detectors
 */
export interface RuleContext {
  filePath: string;
  fileContent: string;
  edgeTarget: EdgeTarget;
  strict: boolean;
  ast?: ASTContext | null; // Optional AST context from ts-morph
}

/**
 * Result from a rule detector
 */
export interface RuleResult {
  findings: Finding[];
}

/**
 * Rule definition
 */
export interface Rule {
  id: string;
  name: string;
  description: string;
  category: 'node-core' | 'edge-pattern' | 'dependency' | 'bundle';
  severity: RuleSeverity;
  enabled: boolean;
  detect: (context: RuleContext) => Promise<RuleResult> | RuleResult;
  fix?: (context: RuleContext, finding: Finding) => Promise<string> | string;
}

/**
 * Rule registry
 */
export interface RuleRegistry {
  rules: Map<string, Rule>;
  register(rule: Rule): void;
  get(id: string): Rule | undefined;
  getAll(): Rule[];
  getEnabled(): Rule[];
}

/**
 * Configuration schema
 */
export const ConfigSchema = z.object({
  edgeTarget: z.nativeEnum(EdgeTarget).default(EdgeTarget.AUTO),
  strict: z.boolean().default(false),
  rules: z
    .record(
      z.union([
        z.literal('off'),
        z.literal('warn'),
        z.literal('error'),
        z.object({
          severity: z.enum(['off', 'warn', 'error']),
          ignore: z.array(z.string()).optional(),
        }),
      ]),
    )
    .optional(),
  exclude: z.array(z.string()).optional(),
  include: z.array(z.string()).optional(),
});

export type Config = z.infer<typeof ConfigSchema>;

