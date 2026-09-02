/**
 * commitlint configuration
 * Enforces conventional commit message format
 * 
 * Types allowed:
 * feat: New feature
 * fix: Bug fix
 * docs: Documentation
 * style: Code style/formatting
 * refactor: Code restructuring
 * test: Testing
 * chore: Maintenance tasks
 * ci: CI/CD changes
 * perf: Performance improvements
 * build: Build system changes
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'test',
        'chore',
        'ci',
        'perf',
        'build',
        'revert',
      ],
    ],
    'subject-case': [2, 'always', 'sentence-case'],
    'subject-min-length': [2, 'always', 5],
    'header-max-length': [2, 'always', 100],
  },
};
