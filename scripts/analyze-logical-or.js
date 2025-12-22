#!/usr/bin/env node

/**
 * Analyzes TypeScript files for || and ?? patterns that weren't in the original JavaScript
 * Compares current TS/TSX files against their original JS/JSX counterparts from master branch
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get all renamed/mapped files from git
function getMigratedFiles() {
  try {
    const output = execSync('git diff --name-status master...HEAD -- frontend/src', {
      encoding: 'utf-8',
      cwd: process.cwd()
    });

    const files = [];
    const lines = output.trim().split('\n').filter(Boolean);

    for (const line of lines) {
      const parts = line.split('\t');
      const status = parts[0];

      if (status.startsWith('R')) {
        // Renamed: R100	old/path.js	new/path.ts
        const oldPath = parts[1];
        const newPath = parts[2];
        if (newPath.match(/\.(ts|tsx)$/) && oldPath.match(/\.(js|jsx)$/)) {
          files.push({ current: newPath, original: oldPath });
        }
      } else if (status === 'M' || status === 'A') {
        // Modified or Added - check if there's a JS equivalent
        const filePath = parts[1];
        if (filePath.match(/\.(ts|tsx)$/)) {
          const jsPath = filePath.replace(/\.tsx?$/, (m) => m === '.ts' ? '.js' : '.jsx');
          files.push({ current: filePath, original: jsPath });
        }
      }
    }

    return files;
  } catch (e) {
    console.error('Error getting migrated files:', e.message);
    return [];
  }
}

function getOriginalContent(filePath) {
  try {
    return execSync(`git show master:${filePath}`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd()
    });
  } catch (e) {
    return null;
  }
}

function getCurrentContent(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (e) {
    return null;
  }
}

// Extract all || and ?? patterns with their surrounding context
function extractPatterns(content) {
  const patterns = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Find || patterns
    const orMatches = [...line.matchAll(/(\w+(?:\.\w+)*(?:\?\.\w+)*)\s*\|\|\s*(['"`\[\{]|false|true|null|0|''|""|``|\d+)/g)];
    for (const match of orMatches) {
      patterns.push({
        type: '||',
        line: i + 1,
        variable: match[1],
        defaultValue: match[2],
        context: line.trim().substring(0, 80)
      });
    }

    // Find ?? patterns
    const nullishMatches = [...line.matchAll(/(\w+(?:\.\w+)*(?:\?\.\w+)*)\s*\?\?\s*(['"`\[\{]|false|true|null|0|''|""|``|\d+)/g)];
    for (const match of nullishMatches) {
      patterns.push({
        type: '??',
        line: i + 1,
        variable: match[1],
        defaultValue: match[2],
        context: line.trim().substring(0, 80)
      });
    }
  }

  return patterns;
}

// Check if a pattern exists in the original content
function patternExistsInOriginal(pattern, originalContent) {
  // Look for similar patterns in original
  const varName = pattern.variable.replace(/\?/g, '').split('.').pop(); // Get last part of variable
  const escapedVar = varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Check if original has this variable with || or ??
  const regex = new RegExp(`${escapedVar}\\s*(\\|\\||\\?\\?)\\s*`, 'g');
  return regex.test(originalContent);
}

// Categorize severity
function categorizeSeverity(pattern) {
  const { variable, defaultValue } = pattern;

  // Critical: Boolean defaults that change behavior
  if (defaultValue === 'false' || defaultValue === 'true') {
    return 'critical';
  }

  // Critical: Array/object defaults
  if (defaultValue === '[' || defaultValue === '{') {
    return 'critical';
  }

  // High: Null defaults
  if (defaultValue === 'null' || defaultValue === '0') {
    return 'high';
  }

  // Medium: String defaults
  if (defaultValue.match(/^['"`]/)) {
    return 'medium';
  }

  return 'low';
}

function main() {
  console.log('Analyzing TypeScript migration for added || and ?? patterns...\n');

  const files = getMigratedFiles();
  console.log(`Found ${files.length} migrated files to analyze.\n`);

  const issues = [];
  let filesAnalyzed = 0;
  let filesWithIssues = 0;

  for (const file of files) {
    // Skip test files for now
    if (file.current.includes('__tests__') || file.current.includes('.test.')) {
      continue;
    }

    const originalContent = getOriginalContent(file.original);
    const currentContent = getCurrentContent(file.current);

    if (!originalContent || !currentContent) {
      continue;
    }

    filesAnalyzed++;

    const currentPatterns = extractPatterns(currentContent);
    const originalPatterns = extractPatterns(originalContent);

    // Find patterns in current that don't exist in original
    const newPatterns = currentPatterns.filter(pattern => {
      // Check if this specific pattern existed in original
      return !patternExistsInOriginal(pattern, originalContent);
    });

    if (newPatterns.length > 0) {
      filesWithIssues++;
      for (const pattern of newPatterns) {
        issues.push({
          file: file.current,
          original: file.original,
          ...pattern,
          severity: categorizeSeverity(pattern)
        });
      }
    }
  }

  // Group by severity
  const bySeverity = {
    critical: issues.filter(i => i.severity === 'critical'),
    high: issues.filter(i => i.severity === 'high'),
    medium: issues.filter(i => i.severity === 'medium'),
    low: issues.filter(i => i.severity === 'low')
  };

  // Group by file
  const byFile = {};
  for (const issue of issues) {
    if (!byFile[issue.file]) {
      byFile[issue.file] = [];
    }
    byFile[issue.file].push(issue);
  }

  console.log('='.repeat(80));
  console.log('ANALYSIS RESULTS');
  console.log('='.repeat(80));
  console.log(`\nFiles analyzed: ${filesAnalyzed}`);
  console.log(`Files with potential issues: ${filesWithIssues}`);
  console.log(`\nIssues by severity:`);
  console.log(`  Critical: ${bySeverity.critical.length}`);
  console.log(`  High: ${bySeverity.high.length}`);
  console.log(`  Medium: ${bySeverity.medium.length}`);
  console.log(`  Low: ${bySeverity.low.length}`);
  console.log(`  Total: ${issues.length}`);

  // Show critical and high issues by file
  console.log('\n' + '='.repeat(80));
  console.log('CRITICAL & HIGH PRIORITY ISSUES BY FILE');
  console.log('='.repeat(80));

  const criticalHighFiles = Object.keys(byFile)
    .filter(f => byFile[f].some(i => i.severity === 'critical' || i.severity === 'high'))
    .sort((a, b) => {
      const aCount = byFile[a].filter(i => i.severity === 'critical' || i.severity === 'high').length;
      const bCount = byFile[b].filter(i => i.severity === 'critical' || i.severity === 'high').length;
      return bCount - aCount;
    });

  for (const file of criticalHighFiles) {
    const fileIssues = byFile[file].filter(i => i.severity === 'critical' || i.severity === 'high');
    const critCount = fileIssues.filter(i => i.severity === 'critical').length;
    const highCount = fileIssues.filter(i => i.severity === 'high').length;

    console.log(`\n${file}`);
    console.log(`  (${critCount} critical, ${highCount} high)`);

    for (const issue of fileIssues.slice(0, 5)) {
      console.log(`  L${issue.line}: ${issue.variable} ${issue.type} ${issue.defaultValue}`);
      console.log(`         ${issue.context.substring(0, 60)}...`);
    }
    if (fileIssues.length > 5) {
      console.log(`  ... and ${fileIssues.length - 5} more`);
    }
  }

  // Write detailed report
  const report = {
    summary: {
      filesAnalyzed,
      filesWithIssues,
      totalIssues: issues.length,
      bySeverity: {
        critical: bySeverity.critical.length,
        high: bySeverity.high.length,
        medium: bySeverity.medium.length,
        low: bySeverity.low.length
      }
    },
    issuesByFile: byFile,
    issues: issues
  };

  fs.writeFileSync(
    path.join(process.cwd(), 'logical-or-analysis.json'),
    JSON.stringify(report, null, 2)
  );

  console.log('\n' + '='.repeat(80));
  console.log('Detailed report written to: logical-or-analysis.json');
  console.log('='.repeat(80));
}

main();

