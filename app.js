var requirejs = require('requirejs');

requirejs.config({
    baseUrl: __dirname,

    nodeRequire: require
});

requirejs(['express','mongoose','pass','routes/index','models/user','controllers/user'],
    function(express,mongoose,pass,index,User,UserController){
        var app = express();
        var hash = pass.hash;
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

// middleware
        app.use(express.logger());
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

        function restrict(req, res, next) {
            if (req.session.user) {
                next();
            } else {
                req.session.error = 'Access denied!';
                res.redirect('/login');
            }
        }

        app.get('/',index.index);

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
            res.render('login',{title: 'Login'});
        });

        app.post('/login', function(req, res){
            UserController.authenticate(req.body.username, req.body.password, function(err, user){
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

        app.get('/createAccount', function(req, res){
            res.render('createAccount',{title: 'Create Account'});
        });

        app.post('/createAccount', function(req, res){
            UserController.createUser(req.body.username, req.body.password, req.body.passwordRepeat, function(error){
                if(error) {
                    req.session.error = error.message ? error.message : 'Failed to create account!';
                    res.redirect('createAccount');
                } else {
                    res.redirect('login');
                }
            });
        });

        app.get('/viewUser/:user', function(req, res){
            res.render('userDetails',{user: req.params.user,title: 'viewing a user'});
        });

        if (!module.parent) {
            app.listen(port);
            console.log('Express started on port ' + port);
        }
    }
);