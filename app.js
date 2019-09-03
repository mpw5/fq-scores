const express = require('express');
const routes = require('./routes/index');
const app = express();

var moment = require('moment');
app.locals.moment = moment;

app.set('view engine','ejs');
app.use(express.static(__dirname + '/public'));
app.use('/', routes);

module.exports = app;

const server = app.listen(process.env.PORT || '3030', () => {
  console.log(`Express is running on port ${server.address().port}`);
});
