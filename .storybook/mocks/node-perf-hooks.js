module.exports = {
  performance: {
    now: () => Date.now(),
    mark: () => {},
    measure: () => {},
    clearMarks: () => {},
    clearMeasures: () => {},
  },
  PerformanceObserver: class PerformanceObserver {
    constructor() {}
    observe() {}
    disconnect() {}
  },
};
