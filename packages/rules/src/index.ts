// Types
export * from './types.js';

// Registry
export * from './registry.js';

// Utils
export * from './utils/codeframe.js';
export * from './utils/ast.js';

// Recipes
export * from './recipes/replacements.js';

// Rules - Node Core
export * from './rules/node-core-fs.js';
export * from './rules/node-core-common.js';
export * from './rules/node-core-caution.js';

// Rules - Edge Patterns
export * from './rules/edge-patterns.js';

// Rules - Dependencies
export * from './rules/deps-not-edge-safe.js';

// Register all rules
import { registry } from './registry.js';
import { nodeCoreFs } from './rules/node-core-fs.js';
import {
  nodeCoreNet,
  nodeCoreTls,
  nodeCoreChildProcess,
  nodeCoreCluster,
  nodeCoreWorkerThreads,
  nodeCoreDns,
  nodeCoreModule,
  nodeCoreVm,
  nodeCorePerfHooks,
  nodeCoreReadline,
  nodeCoreRepl,
  nodeCoreZlib,
} from './rules/node-core-common.js';
import {
  nodeCoreCrypto,
  nodeCoreBuffer,
  nodeCoreStreams,
} from './rules/node-core-caution.js';
import {
  edgePatternEval,
  edgePatternWasmSync,
  edgePatternLongTimers,
} from './rules/edge-patterns.js';
import { depsNotEdgeSafe } from './rules/deps-not-edge-safe.js';

// Auto-register all rules
const allRules = [
  // Node Core - Forbidden
  nodeCoreFs,
  nodeCoreNet,
  nodeCoreTls,
  nodeCoreChildProcess,
  nodeCoreCluster,
  nodeCoreWorkerThreads,
  nodeCoreDns,
  nodeCoreModule,
  nodeCoreVm,
  nodeCorePerfHooks,
  nodeCoreReadline,
  nodeCoreRepl,
  nodeCoreZlib,
  // Node Core - Caution
  nodeCoreCrypto,
  nodeCoreBuffer,
  nodeCoreStreams,
  // Edge Patterns
  edgePatternEval,
  edgePatternWasmSync,
  edgePatternLongTimers,
  // Dependencies
  depsNotEdgeSafe,
];

for (const rule of allRules) {
  registry.register(rule);
}
