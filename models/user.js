define(['mongoose'],
    function(mongoose){
        var mongoose = require('mongoose');

        var UserSchema = mongoose.Schema({
            name: { type: String, required: true, index: { unique: true } },
            password: { type: String, required: true },
            salt: {type: String}
        });

        UserSchema.add({github_name: {type: String}});

        var User = mongoose.model('User', UserSchema);

        return User;
    }
);