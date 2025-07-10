const client = require('prom-client');

class Metrics {
  constructor() {
    // Collect default metrics like process_cpu_user_seconds_total
    client.collectDefaultMetrics();

    // Summary metrics
    this.summarySuccess = new client.Counter({
      name: 'summary_success_total',
      help: 'Total number of successful summary generations',
      labelNames: ['ai_service', 'tenant_id'],
    });

    this.summaryFailure = new client.Counter({
      name: 'summary_failure_total',
      help: 'Total number of failed summary generations',
      labelNames: ['ai_service', 'tenant_id', 'error_type'],
    });

    this.summaryDuration = new client.Histogram({
      name: 'summary_duration_seconds',
      help: 'Time taken for summary generation in seconds',
      labelNames: ['ai_service'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
    });

    // HTTP metrics
    this.httpRequests = new client.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'status_code', 'path'],
    });

    this.httpDuration = new client.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'path'],
      buckets: [0.1, 0.5, 1, 2, 5],
    });

    // Message processing metrics
    this.messageProcessing = new client.Counter({
      name: 'message_processing_total',
      help: 'Total number of messages processed',
      labelNames: ['status', 'tenant_id', 'message_type'],
    });

    // Digest metrics
    this.digestDelivery = new client.Counter({
      name: 'digest_delivery_total',
      help: 'Total number of digests delivered',
      labelNames: ['status', 'tenant_id'],
    });

    // Active gauges
    this.activeTenants = new client.Gauge({
      name: 'active_tenants_total',
      help: 'Number of active tenants',
    });

    this.activeLinks = new client.Gauge({
      name: 'active_links_total',
      help: 'Number of active links being tracked',
      labelNames: ['tenant_id'],
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

  // HTTP metrics
  recordHttpRequest(method, statusCode, path, duration) {
    this.httpRequests.inc({ method, status_code: statusCode, path });
    if (duration !== undefined) {
      this.httpDuration.observe({ method, path }, duration);
    }
  }

  // Summary metrics
  recordSummarySuccess(aiService, tenantId) {
    this.summarySuccess.inc({ ai_service: aiService, tenant_id: tenantId });
  }

  recordSummaryFailure(aiService, tenantId, errorType) {
    this.summaryFailure.inc({ 
      ai_service: aiService, 
      tenant_id: tenantId, 
      error_type: errorType 
    });
  }

  recordSummaryDuration(aiService, duration) {
    this.summaryDuration.observe({ ai_service: aiService }, duration);
  }

  // Message processing metrics
  recordMessageProcessed(status, tenantId, messageType = 'text') {
    this.messageProcessing.inc({ 
      status, 
      tenant_id: tenantId, 
      message_type: messageType 
    });
  }

  // Digest metrics
  recordDigestDelivery(status, tenantId) {
    this.digestDelivery.inc({ status, tenant_id: tenantId });
  }

  // Gauge updates
  setActiveTenants(count) {
    this.activeTenants.set(count);
  }

  setActiveLinks(tenantId, count) {
    this.activeLinks.set({ tenant_id: tenantId }, count);
  }

  // Health metrics
  getHealthMetrics() {
    return {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = new Metrics();
