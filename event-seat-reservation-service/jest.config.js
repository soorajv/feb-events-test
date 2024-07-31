module.exports = {
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*.ts"],
  coveragePathIgnorePatterns: ["/node_modules/", "/dist/"],
  coverageReporters: ["lcov", "text"],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/?(*.)+(spec|test).[jt]s?(x)"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
};
