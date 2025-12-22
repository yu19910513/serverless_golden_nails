export default {
  testEnvironment: 'node', // or 'jsdom' if you need browser APIs
  transform: {
    '^.+\\.[t|j]sx?$': 'babel-jest',
  },
  collectCoverage: true,
  collectCoverageFrom: [
    'api/_utils/**/*.js',
    '!api/_utils/templates/**',
  ],
  coverageReporters: ['text', 'text-summary', 'html', 'lcov'],
  coverageDirectory: 'coverage',
};
