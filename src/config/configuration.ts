export default () => ({
  grpc: {
    host: process.env.GRPC_HOST ?? '127.0.0.1',
    port: parseInt(process.env.PROFILE_SERVICE_PORT ?? '50052', 10),
  },
});
