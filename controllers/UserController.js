define(['models/UserModel','pass','crypto'],
    function(UserModel,pass,crypto){
        function authenticate(name, password, fn) {
            UserModel.find({ name: name }, function(error,data){
                //TODO: passing undefined name and password, no error... but it fails trying to read data[0] below and crashes...
                if(error)
                {
                    console.log(error);
                }
                else
                {
                    pass.hash(password, data[0].salt, function(err, hash){
                        if (err) fn(err);
                        else if (hash === data[0].password) {
                            var user = data[0];
                            user.token = crypto.createHash('md5').update(user.toString() + (new Date()).toString()).digest('hex');
                            user.save(function(error,savedUserWithToken){
                                if(error) fn(error);
                                else fn(null,savedUserWithToken);
                            });
                        }
                        else fn(new Error('invalid password'));
                    });
                }
            });
        }

        function createUser(userName, password, passwordRepeat, callback){
            if(password !== passwordRepeat) {
                callback({message: 'Passwords do not match'});
            } else {
                UserModel.find({ name: userName }, function(error,data){
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

                            var user = new UserModel({
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
            UserModel.findOne({ name: userName }, function(error,user){
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