import { Application } from "./Application";

const app = new Application();

app.start().catch((error) => {
  console.error("Failed to start OpenValidator backend", error);
  process.exit(1);
});