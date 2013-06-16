define(['models/user','pass'],
    function(User,pass){
        function authenticate(name, password, fn) {
            User.find({ name: name }, function(error,data){
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

        return {
            authenticate: authenticate,
            createUser: createUser
        }
    }
);