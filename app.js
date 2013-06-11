/**
 * Module dependencies.
 */

var express = require('express'),
	mongoose = require('mongoose'),
	hash = require('./pass').hash;

var app = module.exports = express();

// config

var port = process.env.PORT || 5000;
var mongo_url = process.env.MONGOLAB_URI || 
	process.env.MONGOHQ_URL || 
	'mongodb://localhost/HelloMongoose';

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// db

mongoose.connect(mongo_url);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  console.log('good!');
});

var User = mongoose.model('User',mongoose.Schema({
	name: { type: String, required: true, index: { unique: true } },
	password: { type: String, required: true },
	salt: {type: String}
}));

// middleware

app.use(express.bodyParser());
app.use(express.cookieParser('shhhh, very secret'));
app.use(express.session());

// Session-persisted message middleware

app.use(function(req, res, next){
  var err = req.session.error
    , msg = req.session.success;
  delete req.session.error;
  delete req.session.success;
  res.locals.message = '';
  if (err) res.locals.message = '<p class="msg error">' + err + '</p>';
  if (msg) res.locals.message = '<p class="msg success">' + msg + '</p>';
  next();
});

// when you create a user, generate a salt
// and hash the password ('foobar' is the pass here)

hash('foobar', function(err, salt, hash){
  if (err) throw err;
  // store the salt & hash in the "db"

	var dave = new User({
		name: 'dave',
		password: hash,
		salt: salt
	});
	dave.save(function (err, user) {
		if (err) 
		{
			console.log(err);
		}
	});
});


// Authenticate using our plain-object database of doom!

function authenticate(name, pass, fn) {
  if (!module.parent) console.log('authenticating %s:%s', name, pass);
	User.find({ name: name }, function(error,data){
		if(error)
		{
			console.log(error);
		}
		else
		{
			hash(pass, data[0].salt, function(err, hash){
		    	if (err) return fn(err);
		    	if (hash === data[0].password) return fn(null, data[0]);
		    	fn(new Error('invalid password'));
		  	});
		}
	});
  // query the db for the given username

  // apply the same algorithm to the POSTed password, applying
  // the hash against the pass / salt, if there is a match we
  // found the user
}

function restrict(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    req.session.error = 'Access denied!';
    res.redirect('/login');
  }
}

app.get('/', function(req, res){
  res.redirect('login');
});

app.get('/restricted', restrict, function(req, res){
  res.send('Wahoo! restricted area, click to <a href="/logout">logout</a>');
});

app.get('/logout', function(req, res){
  // destroy the user's session to log them out
  // will be re-created next request
  req.session.destroy(function(){
    res.redirect('/');
  });
});

app.get('/login', function(req, res){
  res.render('login');
});

app.post('/login', function(req, res){
  authenticate(req.body.username, req.body.password, function(err, user){
    if (user) {
      // Regenerate session when signing in
      // to prevent fixation 
      req.session.regenerate(function(){
        // Store the user's primary key 
        // in the session store to be retrieved,
        // or in this case the entire user object
        req.session.user = user;
        req.session.success = 'Authenticated as ' + user.name
          + ' click to <a href="/logout">logout</a>. '
          + ' You may now access <a href="/restricted">/restricted</a>.';
        res.redirect('back');
      });
    } else {
      req.session.error = 'Authentication failed, please check your '
        + ' username and password.'
        + ' (use "dave" and "foobar")';
      res.redirect('login');
    }
  });
});

if (!module.parent) {
  app.listen(port);
  console.log('Express started on port ' + port);
}