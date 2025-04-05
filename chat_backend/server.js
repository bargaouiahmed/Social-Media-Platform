const express = require('express');
const cors = require('cors');
const app = express();



const allowedOrigins = [
  'http://localhost:5173',
  'https://tempo.bahwebdev.com',
  'http://127.0.0.1:5173', // Add this for alternative localhost
  undefined // Allow server-to-server calls
];

const corsOptions = {
  origin: function (origin, callback) {
    console.log('Incoming Origin:', origin); // Add this line

    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

const port = 5000;

app.get('/get', (req, res) => res.send('Hello World!'));
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
