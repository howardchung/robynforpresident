const express = require("express");
const app = express();
const axios = require('axios');
const Cache = require("node-cache");
const memoryCache = new Cache();
const cors = require('cors');

app.use(cors());
app.get("/", async (req, res) => {
  if (memoryCache.has('/')) {
    res.status(200).send(memoryCache.get('/'));
  } else {
    const resp = await axios.get('https://googlesheet.howardzchung.workers.dev?url=https://https://sheets.googleapis.com/v4/spreadsheets/1Ctj7ntWMhiDUiGTaXKXJG7C7sbYnA-IjDhyvf8NCPxE/values/Form%20Responses%201');
    memoryCache.set('/', resp.data, 10);
    res.status(200).send(resp.data);
  }
});

console.log(process.env.PORT);
app.listen(process.env.PORT);
