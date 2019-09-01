var express = require('express');
var app = express();
app.set('view engine', 'ejs');

app.listen(3030);

app.get('/', function(req, res) {
  res.render('home');
});

app.get('*', function(req, res) {
  res.render('error');
});
