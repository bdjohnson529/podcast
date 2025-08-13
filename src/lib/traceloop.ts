import * as traceloop from "@traceloop/node-server-sdk";

// Initialize Traceloop once when this module is imported
traceloop.initialize({ disableBatch: true });

export { traceloop };