import type { Rule, RuleRegistry } from './types.js';

/**
 * Default rule registry implementation
 */
export class DefaultRuleRegistry implements RuleRegistry {
  rules = new Map<string, Rule>();

  register(rule: Rule): void {
    if (this.rules.has(rule.id)) {
      throw new Error(`Rule with id "${rule.id}" is already registered`);
    }
    this.rules.set(rule.id, rule);
  }

  get(id: string): Rule | undefined {
    return this.rules.get(id);
  }

  getAll(): Rule[] {
    return Array.from(this.rules.values());
  }

  getEnabled(): Rule[] {
    return this.getAll().filter((rule) => rule.enabled);
  }
}

/**
 * Global rule registry instance
 */
export const registry = new DefaultRuleRegistry();

