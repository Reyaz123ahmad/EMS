/**
 * Lightweight Prometheus-compatible Metrics Exporter
 */

let requestCounter = 0;
let requestErrors = 0;
let routeStats = {};

export function metricsMiddleware(req, res, next) {
  const start = Date.now();
  requestCounter++;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const route = req.baseUrl || req.path || 'unknown';
    const status = res.statusCode;

    if (status >= 400) {
      requestErrors++;
    }

    if (!routeStats[route]) {
      routeStats[route] = { count: 0, totalDuration: 0, errors: 0 };
    }
    routeStats[route].count++;
    routeStats[route].totalDuration += duration;
    if (status >= 400) {
      routeStats[route].errors++;
    }
  });

  next();
}

export function getPrometheusMetrics(req, res) {
  const memory = process.memoryUsage();
  const uptime = process.uptime();

  let metrics = `# HELP ems_http_requests_total Total number of HTTP requests
# TYPE ems_http_requests_total counter
ems_http_requests_total ${requestCounter}

# HELP ems_http_request_errors_total Total number of HTTP errors (status >= 400)
# TYPE ems_http_request_errors_total counter
ems_http_request_errors_total ${requestErrors}

# HELP ems_process_uptime_seconds Process uptime in seconds
# TYPE ems_process_uptime_seconds gauge
ems_process_uptime_seconds ${uptime.toFixed(2)}

# HELP ems_process_heap_bytes Process heap memory usage in bytes
# TYPE ems_process_heap_bytes gauge
ems_process_heap_bytes ${memory.heapUsed}

# HELP ems_process_rss_bytes Process resident set size in bytes
# TYPE ems_process_rss_bytes gauge
ems_process_rss_bytes ${memory.rss}
`;

  for (const [route, stats] of Object.entries(routeStats)) {
    const avgDuration = stats.count > 0 ? (stats.totalDuration / stats.count).toFixed(2) : 0;
    metrics += `\nems_http_route_requests_total{route="${route}"} ${stats.count}`;
    metrics += `\nems_http_route_duration_avg_ms{route="${route}"} ${avgDuration}`;
    metrics += `\nems_http_route_errors_total{route="${route}"} ${stats.errors}`;
  }

  res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.status(200).send(metrics);
}

export default {
  metricsMiddleware,
  getPrometheusMetrics,
};
