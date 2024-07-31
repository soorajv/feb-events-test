import { app } from "./app";
import { setupRedis } from "./redis/setupRedis";

const start = async () => {
  const PORT = process.env.PORT || 3000;

  // Setup Redis subscription
  setupRedis();

  const server = app
    .listen(PORT, () => {
      console.log(`Server listening on port: ${PORT}`);
    })
    .on("error", (err) => {
      console.error("Failed to start server:", err);
      process.exit(1);
    });

  const gracefulShutdown = () => {
    console.log("Shutting down gracefully...");
    server.close(() => {
      console.log("Closed out remaining connections");
      process.exit(0);
    });

    setTimeout(() => {
      console.error(
        "Could not close connections in time, forcefully shutting down"
      );
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", gracefulShutdown);
  process.on("SIGINT", gracefulShutdown);
};

start();
