import pino from 'pino';
import client from 'prom-client';

// Configure Pino Logger with custom formatting rules:
// - Omit system details (pid and hostname)
// - Custom date/time format: dd-mm-yyyy, HH:MM:ss
export const logger = pino({
    base: undefined, // Removes system variables: pid and hostname from the json structure
}, pino.transport({
    target: 'pino-pretty',
    options: {
        colorize: true,
        translateTime: 'dd-mm-yyyy, HH:MM:ss',
        ignore: 'pid,hostname'
    }
}));

// Setup default Prometheus metrics collection
client.collectDefaultMetrics();

// Define custom metrics for background job orchestration
export const jobsProcessedTotal = new client.Counter({
    name: 'jobs_processed_total',
    help: 'Total number of processed jobs',
    labelNames: ['type', 'status'] // status: 'completed' | 'failed'
});

export const jobExecutionDurationSeconds = new client.Histogram({
    name: 'job_execution_duration_seconds',
    help: 'Execution duration of jobs in seconds',
    labelNames: ['type'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60] // custom latency buckets
});

export const register = client.register;
