export default {
  testEnvironment: 'node', // or 'jsdom' if you need browser APIs
  transform: {
    '^.+\\.[t|j]sx?$': 'babel-jest',
  },
};
