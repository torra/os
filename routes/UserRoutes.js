
/*
 * GET users listing.
 */
define(['crypto','controllers/user','models/user'],
    function(crypto,UserController,UserModel) {

        function register(expressApp){
            expressApp.delete('/sign-out', function(req, res){
                // destroy the user's session to log them out
                // will be re-created next request
                req.session.destroy(function(){
                    res.redirect('/');
                });
            });

//            expressApp.get('/login', function(req, res){
//                res.render('login',{title: 'Login'});
//            });

            expressApp.post('/sign-in', function(req, res){
                UserController.authenticate(req.body.username, req.body.password, function(err, user){
                    if (user) {
                        // Regenerate session when signing in
                        // to prevent fixation
                        req.session.regenerate(function(){
                            // Store the user's primary key
                            // in the session store to be retrieved,
                            // or in this case the entire user object
                            req.session.user = user;

                            var token = crypto.createHash('md5').update(user.toString() + (new Date()).toString()).digest('hex');
                            res.json(200,{
                                username: user.name,
                                token: token,
                                github_name: user.github_name
                            });
                        });
                    } else {
//                        req.session.error = 'Authentication failed, please check your '
//                            + ' username and password.'
//                            + ' (use "dave" and "foobar")';
//                        res.redirect('login');
                        res.json(403,{
                            message: 'Bad user name or password'
                        });
                    }
                });
            });

            expressApp.get('/createAccount', function(req, res){
                res.render('createAccount',{title: 'Create Account'});
            });

            expressApp.post('/createAccount', function(req, res){
                UserController.createUser(req.body.username, req.body.password, req.body.passwordRepeat, function(error){
                    if(error) {
                        req.session.error = error.message ? error.message : 'Failed to create account!';
                        res.json({
                            status: 1,
                            message: req.session.error
                        });
                    } else {
                        UserController.authenticate(req.body.username, req.body.password, function(err, user){
                            if (user) {
                                // Regenerate session when signing in
                                // to prevent fixation
                                req.session.regenerate(function(){
                                    // Store the user's primary key
                                    // in the session store to be retrieved,
                                    // or in this case the entire user object
                                    req.session.user = user;
//                            req.session.success = 'Authenticated as ' + user.name
//                                + ' click to <a href="/logout">logout</a>. '
//                                + ' You may now access <a href="/profile">/profile</a>.';
//                            res.redirect('profile/' + user.name);
                                    res.json({
                                        status: 0,
                                        username: user.name,
                                        github_name: user.github_name
                                    });
                                });
                            } else {
//                        req.session.error = 'Authentication failed, please check your '
//                            + ' username and password.'
//                            + ' (use "dave" and "foobar")';
//                        res.redirect('login');
                                res.json({
                                    status: 1,
                                    message: 'Authentication failed'
                                });
                            }
                        });
                        res.json({
                            status: 0
                        });
                    }
                });
            });

            expressApp.get('/profile/:user', function(req, res){
                UserModel.find({name: req.params.user}, function(err, data){
                    if(err) {
                        //TODO
                    } else if(data.length !== 1) {
                        //TODO
                    } else {
                        res.render('profile',{user: data[0].name, github_user: data[0].github_name,title: 'viewing a user'});
                    }
                });
            });

            expressApp.put('/profile/:user', function(req, res){
                UserController.updateUserGithubAccount(req.params.user, req.body.github_user, function(error,user){
                    if(error) {
                        req.session.error = error.message ? error.message : 'Failed to update profile!';
                        res.redirect('profile/' + req.params.user);
                    } else {
                        res.json({user: user.name, github_user: user.github_name});
//                    res.render('profile',{user: req.params.user, github_user: req.body.github_user,title: 'viewing a user'});
                    }
                });
            });
        }

        return {
            register: register
        }
    }
);