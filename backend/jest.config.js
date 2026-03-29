module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/tests/**/*.test.ts', '**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/test-setup.ts'],
  moduleNameMapper: {
    '^uuid$': '<rootDir>/src/tests/support/uuid.ts',
  },
  clearMocks: true,
};
