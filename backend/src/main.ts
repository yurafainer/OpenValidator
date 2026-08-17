import express from "express";

import { configuration, createApp } from "./createApp";

const app = createApp(express());

app.listen(configuration.port, () => {
  console.log(
    `${configuration.applicationName} backend is running on port ${configuration.port}`,
  );
});
