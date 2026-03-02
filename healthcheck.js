// TCP health check for gRPC service (Dockerfile HEALTHCHECK)
const net = require('net');
const port = parseInt(process.env.PROFILE_SERVICE_PORT || '50051', 10);

const client = new net.Socket();

client.connect(port, '127.0.0.1', () => {
  client.destroy();
  process.exit(0);
});

client.on('error', () => {
  client.destroy();
  process.exit(1);
});

setTimeout(() => {
  client.destroy();
  process.exit(1);
}, 3000);
