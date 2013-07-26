
/*
 * GET users listing.
 */
define(['request','controllers/UserController','models/UserModel'],
    function(RequestModule,UserController,UserModel) {

        function restrict(req, res, next) {
            var username,
                token;
            if(req.headers.authorization) {
                var credentials = req.headers.authorization.split(';');
                username = credentials[0].split('=')[1];
                token = credentials[1].split('=')[1];
            } else {
                username = req.cookies['os_auth_user'];
                token = req.cookies['os_auth_token'];
            }
            UserController.checkToken(username, token, function(err){
                if(err) {
                    res.json(403,{
                        message: 'Access denied'
                    });
                } else {
                    next();
                }
            });
        }

        function register(expressApp){
            expressApp.delete('/sign-out', function(req, res){
                // destroy the user's session to log them out
                // will be re-created next request
//                req.session.destroy(function(){
//                    res.redirect('/');
//                });
                UserController.deleteToken(req.body.username,function(error){
                    if(error) {
                        res.json(500,{
                            message: 'There was a problem signing out'
                        });
                    } else {
                        res.json(200);
                    }
                });
            });

            expressApp.post('/sign-in', function(req, res){
                if(req.body.username && req.body.password) {
                    UserController.authenticate(req.body.username, req.body.password, function(err, user){
                        if (user) {
                            // Regenerate session when signing in
                            // to prevent fixation
                            req.session.regenerate(function(){
                                // Store the user's primary key
                                // in the session store to be retrieved,
                                // or in this case the entire user object
                                req.session.user = user;

                                res.json(200,{
                                    username: user.name,
                                    token: user.token,
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
                } else {
                    //TODO better error code
                    res.json(403,{
                        message: 'Please supply a user name and password'
                    });
                }
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

            expressApp.get('/user/:user', restrict, function(req, res){
                UserModel.find({name: req.params.user}, function(err, data){
                    if(err) {
                        res.json(500);
                    } else if(data.length !== 1) {
                        res.json(404,{
                            message: 'User not found'
                        });
                    } else {
                        res.json(200,{user: data[0].name, github_user: data[0].github_name});
                    }
                });
            });

            expressApp.put('/user/:user', restrict, function(req, res){
                UserController.updateUserGithubAccount(req.params.user, req.body.github_user, function(error,user){
                    if(error) {
                        req.session.error = error.message ? error.message : 'Failed to update profile!';
                        res.redirect('profile/' + req.params.user);
                    } else {
                        res.json({user: user.name, github_user: user.github_name});
                    }
                });
            });

            expressApp.get('/user/:user/authenticateGithub', restrict, function(req, res){
                //TODO: use github `state` in the redirect!
                res.redirect(302,'https://github.com/login/oauth/authorize?client_id=15b1f1adfd2012c0ebe0&redirect_uri='
                    + encodeURIComponent(req.headers.referer + 'user/' + req.params.user + '/confirmGithub'));
            });

            expressApp.get('/user/:user/confirmGithub', restrict, function(req, res){
                RequestModule.post('https://github.com/login/oauth/access_token',
                    {form: {client_id: '15b1f1adfd2012c0ebe0', client_secret: '6808cd2405c5dc8d9b9508a0699c67f627f45647', code: req.query.code}},
                    function(error, response, body){
                        if(!error && response.statusCode === 200) {
                            var token = body.split('&')[0].split('=')[1];
                            RequestModule.get('https://api.github.com/user?access_token=' + token,function(error, response, body){
                                if(!error && response.statusCode === 200) {
                                    var responseJson = JSON.parse(body);
                                    console.log(responseJson);
                                    UserController.updateUserGithubAccount(req.params.user,responseJson.login,function(error, user){
                                        res.redirect(302,'/#/user/' + req.params.user);
                                    });
                                }
                            });
                        }
                    });
            });
        }

        return {
            register: register
        }
    }
);