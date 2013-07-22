define(['models/user','pass'],
    function(User,pass){
        function authenticate(name, password, fn) {
            User.find({ name: name }, function(error,data){
                //TODO: passing undefined name and password, no error... but it fails trying to read data[0] below and crashes...
                if(error)
                {
                    console.log(error);
                }
                else
                {
                    pass.hash(password, data[0].salt, function(err, hash){
                        if (err) return fn(err);
                        if (hash === data[0].password) return fn(null, data[0]);
                        fn(new Error('invalid password'));
                    });
                }
            });
        }

        function createUser(userName, password, passwordRepeat, callback){
            if(password !== passwordRepeat) {
                callback({message: 'Passwords do not match'});
            } else {
                User.find({ name: userName }, function(error,data){
                    if(error) {
                        callback(error);
                    } else if(data.length > 0){
                        callback({message: 'User name is taken'});
                    } else {
                        pass.hash(password, function(err, salt, hash){
                            if (err) {
                                console.log(err);
                                callback(err);
                            }

                            var user = new User({
                                name: userName,
                                password: hash,
                                salt: salt
                            });
                            user.save(function (err, user) {
                                if (err)
                                {
                                    console.log(err);
                                    callback(err);
                                }
                            });
                            callback();
                        });
                    }
                });
            }
        }

        function updateUserGithubAccount(userName, githubAccount, callback) {
            User.findOne({ name: userName }, function(error,user){
                if(error) {
                    callback(error);
                } else if(!user) {
                    callback({message: 'Error updating profile'});
                } else {
                    user.github_name = githubAccount;
                    user.save(function(err, saved) {
                        if(err) {
                            callback(err);
                        }
                        callback(null,saved);
                    });
                }
            });
        }

        return {
            authenticate: authenticate,
            createUser: createUser,
            updateUserGithubAccount: updateUserGithubAccount
        }
    }
);