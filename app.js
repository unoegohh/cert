var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/1', (req, res)=>{
  console.log('123')
  res.sendFile(path.join(__dirname, '/public/DCC Checker.html'));
});
app.use('/users', usersRouter);

const PORT = process.env.PORT || 5000;
var server_host = process.env.HOST || '0.0.0.0';

app.listen(PORT,() => {
  console.info(`Server listening at http://${server_host}:${PORT} process.env.HOST ${process.env.HOST }` );
});
module.exports = app;
