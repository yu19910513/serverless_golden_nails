export default {
  testEnvironment: 'node', // default; override via CLI for frontend
  transform: {
    '^.+\\.[t|j]sx?$': 'babel-jest',
  },
  collectCoverage: true,
  collectCoverageFrom: [
    'api/_utils/**/*.js',
    '!api/_utils/templates/**',
    // Frontend logic-only coverage (utils/services)
    'src/utils/**/*.js',
    'src/services/**/*.js',
    // Exclude test files from coverage collection
    '!src/**/__tests__/**',
  ],
  coverageReporters: ['text', 'text-summary', 'html', 'lcov'],
  coverageDirectory: 'coverage',
};
