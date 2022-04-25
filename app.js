var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const Cert = require('./cert')
const _ = require('lodash')


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://doadmin:526Cg4p819U0HylT@db-mongodb-fra1-72204-77b1e9b1.mongo.ondigitalocean.com/prod?authSource=admin&replicaSet=db-mongodb-fra1-72204&tls=true&tlsCAFile=./ca-certificate.crt', { useNewUrlParser: true, useUnifiedTopology: true }).then(
  () => {console.log('Database is connected') },
  err => { console.log('Can not connect to the database'+ err)}
);


var app = express();
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/gov', (req, res)=>{
  res.sendFile(path.join(__dirname, '/public/DCC Checker.html'));
});
app.get('/app', (req, res)=>{
  res.sendFile(path.join(__dirname, '/public/MUSSAIBEKOV_DOSE.html'));
});

app.get('/a-gov', (req, res)=>{
  res.sendFile(path.join(__dirname, '/public/Aiman/2022-01-02.html'));
});
app.get('/a-mar', (req, res)=>{
  res.sendFile(path.join(__dirname, '/public/Aiman/2022-02-03.html'));
});
app.get('/m-gov', (req, res)=>{
  res.sendFile(path.join(__dirname, '/public/Mariya/2022-01-02.html'));
});
app.get('/m-mar', (req, res)=>{
  res.sendFile(path.join(__dirname, '/public/Mariya/2022-02-03.html'));
});
app.get('/s-gov', (req, res)=>{
  res.sendFile(path.join(__dirname, '/public/Serdi/2022-01-02.html'));
});
app.get('/s-mar', (req, res)=>{
  res.sendFile(path.join(__dirname, '/public/Serdi/2022-02-03.html'));
});
app.get('/certificate', async (req, res)=>{
  const {data} = req.query
  console.log('req', data)

  const cert = await Cert.findOne({'certs.salt': data });
  console.log('cert', cert)
  if(!cert){
    res.status(500).send('Not found!');
  }
  const name = cert.lastName + ' ' + cert.firstName;
  const date = _.find(cert.certs, {salt: data});
  res.render(__dirname + "/public/template.html", {name:name, date: date.date});
});
app.get('/:link', async (req, res)=>{
  console.log('req', req);
  const {link} = req.params;
  console.log('link', link)
  const cert = await  Cert.findOne({'certs.link': link });
  if(!cert){
    res.status(500).send('Not found!');
  }
  const name = cert.lastName + ' ' + cert.firstName;
  const date = _.find(cert.certs, {link});
  res.render(__dirname + "/public/template.html", {name:name, date: date.date});
});
app.use('/users', usersRouter);

const PORT = process.env.PORT || 5000;
var server_host = process.env.HOST || '0.0.0.0';

app.listen(PORT,() => {
  console.info(`Server listening at http://${server_host}:${PORT} process.env.HOST ${process.env.HOST }` );
});
module.exports = app;
