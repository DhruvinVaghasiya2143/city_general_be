const express = require("express"); 

const app = express(); 

app.get("/", (request, response) => {
  response.send("Hello from Express!👋");
});

app.listen(8000, () => {
  console.info("Server started successfully🎉.");
});
