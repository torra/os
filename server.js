var requirejs = require('requirejs');

requirejs.config({
    baseUrl: __dirname,
    nodeRequire: require
});

requirejs(['express','mongoose','less-middleware','routes/index','routes/UserRoutes'],
    function(express,mongoose,less_middleware,index,UserRoutes){
        var app = express();
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
            console.log('connected to database at: ' + mongo_url);
        });

// middleware
        app.use(express.logger());
        app.use(express.bodyParser());
        app.use(express.cookieParser('shhhh, very secret'));
        app.use(express.session());
        app.use(less_middleware({ src: __dirname + '/public', compress: true }));
        app.use(express.static(__dirname + '/public'));

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

        //set up routes

        app.get('/',index.index);

        app.get('/restricted', restrict, function(req, res){
            res.send('Wahoo! restricted area, click to <a href="/logout">logout</a>');
        });

        UserRoutes.register(app);

        app.listen(port);
        console.log('server started on port: ' + port);
    }
);