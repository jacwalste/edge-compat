import Table from 'cli-table3';
import { blue, bold, cyan, gray, green, red, yellow } from 'kolorist';
import type { Finding } from '@edge-compat/rules';
import { RuleSeverity } from '@edge-compat/rules';
import type { Reporter, ReporterOptions, ScanResult } from './types.js';
import { relative } from 'pathe';

/**
 * Pretty TTY reporter with colors and tables
 */
export class PrettyReporter implements Reporter {
  report(result: ScanResult, options: ReporterOptions): void {
    const { findings, fileCount, duration } = result;

    console.log('\n' + bold(blue('🔍 Edge Compatibility Scan Results')));
    console.log(gray('─'.repeat(60)));

    if (findings.length === 0) {
      console.log(green('✓ No compatibility issues found!'));
      console.log(
        gray(`\nScanned ${fileCount} files in ${duration.toFixed(2)}ms`),
      );
      return;
    }

    // Group findings by severity
    const errors = findings.filter((f) => f.severity === RuleSeverity.ERROR);
    const warnings = findings.filter((f) => f.severity === RuleSeverity.WARNING);
    const info = findings.filter((f) => f.severity === RuleSeverity.INFO);

    // Print summary table
    const summaryTable = new Table({
      head: [bold('Severity'), bold('Count')],
      style: { head: [], border: [] },
    });

    if (errors.length > 0) {
      summaryTable.push([red('✖ Errors'), red(String(errors.length))]);
    }
    if (warnings.length > 0) {
      summaryTable.push([yellow('⚠ Warnings'), yellow(String(warnings.length))]);
    }
    if (info.length > 0) {
      summaryTable.push([blue('ℹ Info'), blue(String(info.length))]);
    }

    console.log('\n' + summaryTable.toString());

    // Print detailed findings
    console.log('\n' + bold('Findings:') + '\n');

    for (const finding of findings) {
      this.printFinding(finding, options);
    }

    // Print footer
    console.log(gray('─'.repeat(60)));
    console.log(
      gray(`Scanned ${fileCount} files in ${duration.toFixed(2)}ms`),
    );
    console.log();
  }

  private printFinding(finding: Finding, options: ReporterOptions): void {
    const severityIcon =
      finding.severity === RuleSeverity.ERROR
        ? red('✖')
        : finding.severity === RuleSeverity.WARNING
          ? yellow('⚠')
          : blue('ℹ');

    const relPath = relative(options.cwd, finding.location.file);
    const location = `${relPath}:${finding.location.line}:${finding.location.column}`;

    console.log(
      `${severityIcon} ${bold(finding.message)} ${gray(`[${finding.ruleId}]`)}`,
    );
    console.log(`  ${gray('at')} ${cyan(location)}`);

    // Print code frame if available
    if (finding.codeFrame) {
      console.log();
      console.log(finding.codeFrame.code);
      console.log();
    }

    // Print suggestions
    if (finding.suggestions && finding.suggestions.length > 0) {
      console.log(gray('  Suggestions:'));
      for (const suggestion of finding.suggestions) {
        console.log(`  ${gray('•')} ${suggestion.message}`);
        if (suggestion.importStatement) {
          console.log(`    ${gray('Import:')} ${green(suggestion.importStatement)}`);
        }
        if (suggestion.docsUrl) {
          console.log(`    ${gray('Docs:')} ${blue(suggestion.docsUrl)}`);
        }
      }
      console.log();
    }
  }
}

