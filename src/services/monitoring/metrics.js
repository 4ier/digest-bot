const client = require('prom-client');

class Metrics {
  constructor() {
    // Collect default metrics like process_cpu_user_seconds_total
    client.collectDefaultMetrics();

    this.summarySuccess = new client.Counter({
      name: 'summary_success_total',
      help: 'Total number of successful summary generations',
    });

    this.summaryFailure = new client.Counter({
      name: 'summary_failure_total',
      help: 'Total number of failed summary generations',
    });

    this.summaryDuration = new client.Histogram({
      name: 'summary_duration_seconds',
      help: 'Time taken for summary generation in seconds',
      buckets: [0.1, 0.5, 1, 2, 5, 10],
    });
  }

  get contentType() {
    return client.register.contentType;
  }

  async getMetrics() {
    return client.register.metrics();
  }

  reset() {
    client.register.resetMetrics();
  }
}

module.exports = new Metrics();
