// ssl keys generation:
//   openssl req -nodes -new -x509 -days 3650 -keyout key.pem -out cert.pem
// tables creation:
//   CREATE TABLE `badge`.`records` ( `id` BIGINT NOT NULL AUTO_INCREMENT , `record` VARCHAR(30) NOT NULL , PRIMARY KEY (`id`), UNIQUE (`record`)) ENGINE = InnoDB;
//   CREATE TABLE `badge`.`badgereaders` ( `id` INT NOT NULL AUTO_INCREMENT , `name` VARCHAR(10) NOT NULL , `lastupdate` TIMESTAMP NOT NULL , PRIMARY KEY (`id`), UNIQUE (`name`)) ENGINE = InnoDB;

/* CONFIGURATION - BEGIN*/

const MYSQL_HOST = 'localhost';
const MYSQL_USERNAME = 'badge';
const MYSQL_PASSWORD = 'my_strong_db_password';
const MYSQL_DATABASE = MYSQL_USERNAME;
const ADMIN_PASSWORD = 'password';
const PORT = 10443;

/* CONFIGURATION - END*/

// other less important to configure variables
const MYSQL_RETRIES_ATTEMPTS = 3;
const LOGS_FILE = 'logs.log';

// libraries import
const mysql = require('mysql');
const express = require('express')
const https = require('https');
const fs = require('fs');
const basicAuth = require('express-basic-auth');

const app = express()
app.use(express.text());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

auth = basicAuth({
    users: { admin: ADMIN_PASSWORD },
    challenge: true
})

https.createServer(options, app).listen(PORT);

function logs_append(s) {
  try {
    fs.appendFileSync(LOGS_FILE, s);
  }
  catch(err) {
    console.error(err);
  }
}

function db_connect() {
  var db_connection = mysql.createConnection({
    host: MYSQL_HOST,
    user: MYSQL_USERNAME,
    password: MYSQL_PASSWORD,
    database: MYSQL_DATABASE
  });
  for(var i=0; i<MYSQL_RETRIES_ATTEMPTS; i++) {
    try {
      db_connection.connect();
      return db_connection;
    }
    catch(err) {
      console.error(err);
    }
  }
  return null;
}

function db_nonquery(query) {
  var db_connection = db_connect();
  if(db_connection == null) return false;
  //console.log(query);
  for(var i=0; i<MYSQL_RETRIES_ATTEMPTS; i++) {
    try {
      db_connection.query(query, function(error, results, fields) {
        if(error) return false; //throw error;
      });
      db_connection.end();
      return true;
    }
    catch(err) {
      console.error(err);
    }
  }
  return false;
}

function db_updatetime(obj) {
  var q = "INSERT INTO `badgereaders` (`id`, `name`, `lastupdate`) VALUES (NULL, '"+obj+"', CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE lastupdate=CURRENT_TIMESTAMP;";
  return db_nonquery(q);
}

function db_store(data) {
  var q = "INSERT INTO `records` (`id`, `record`) VALUES (NULL, '"+data+"');";
  return db_nonquery(q);
}

function convertrawdata(s) {
  s = s.substr(1);
  data_eu = s.substr(0, 1);
  data_unknown1 = s.substr(1, 1);
  data_day_of_week = s.substr(2, 1);
  data_badge_id = s.substr(3, 9);
  data_causale = s.substr(12, 4);
  data_hour = s.substr(16, 2);
  data_min = s.substr(18, 2);
  data_sec = s.substr(20, 2);
  data_day = s.substr(22, 2);
  data_month = s.substr(24, 2);
  data_year = s.substr(26, 2);
  data_unknown2 = s.substr(28, 2);
  data_reader = s.substr(30, 4);
  s = data_eu+","+data_badge_id+","+data_hour+":"+data_min+":"+data_sec+",20"+data_year+"-"+data_month+"-"+data_day+","+data_reader;
  return s;
}

app.get('/', auth, (req, res) => {
  var query = "SELECT * FROM `badgereaders` ORDER BY name ASC;";
  var db_connection = db_connect();
  console.log(db_connection);
  try {
    var r = db_connection.query(query, function(err, result, fields) {
      if(err) {
        console.log('error'); //throw err;
        res.send('error');
      } else {
        //console.log(result);
        var pars = {currentdatetime:new Date(), listResults:result};
        db_connection.end();
        res.render('index', pars);
      }
    });
  }
  catch(err) {
    console.error(err);
    res.send('error');
  }
})

app.post('/import/:terminal', (req, res) => {
  var r = ''
  var terminal = req.params.terminal;
  var body = req.body;
  //console.log(body);
  r += 'Received information:\n - terminal: '+req.params.terminal+'\n - body: '+body+'\nOutput:';
  if(db_updatetime(terminal)) r += '\n - updated time for "'+terminal+'"';
  else r += '\n - error on time update for "'+terminal+'"'
  body = body.split('\n');
  for(var i=0; i<body.length; i++) {
    var b = body[i];
    if(b != 'N') {
      if(db_store(convertrawdata(b))) r += '\n - stored "'+b+'"';
      else {
        r += '\n - error on "'+b+'"';
        logs_append(b);
      }
    }
  }
  console.log(r);
  res.send(r);
})
