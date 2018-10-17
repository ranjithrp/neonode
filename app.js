var express = require('express');

var bodyParser = require('body-parser');

var app = express();
app.use(bodyParser.json()); 
require('./app/routes.js')(app);

app.listen(3000);