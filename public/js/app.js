App = Ember.Application.create();

//App.Auth = Ember.Auth.create({
//    signInEndPoint: '/sign-in',
//    signOutEndPoint: '/sign-out'
//});

AuthenticationManager = Em.Object.extend({
    login: function(username, password, controller) {
        var self = this;
        $.ajax({
            url: '/sign-in',
            type: 'POST',
            dataType: 'json',
            data: {
                username: username,
                password: password
            }
        }).done(function(data){
            self.set('token',data['token']);
            self.set('username',username);
            document.cookie = 'os_auth_token=' + data['token'];
            document.cookie = 'os_auth_user=' + username;
            controller.transitionToRoute('user',App.User.create(data));
        }).fail(function(jqxhr,status,message){
            alert('login failed!');
        });
    },
    logout: function(controller) {
        var self = this;
        $.ajax({
            url: '/sign-out',
            type: 'DELETE',
            dataType: 'json',
            data: {
                username: self.get('username')
            }
        }).done(function(data){
            self.set('token',null);
            self.set('username',null);
            document.cookie = 'os_auth_token=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            document.cookie = 'os_auth_user=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            controller.transitionToRoute('index');
        }).fail(function(jqxhr,status,message){
            alert('login failed!');
        });
    },
    username: null,
    token: null,
    isAuthenticated: function(){
        return (typeof this.get('token')) === 'string';
    }.property('token')
});

App.AuthManager = AuthenticationManager.create();

if(document.cookie) {
    var cookies = document.cookie.split(';');
    App.AuthManager.set('token',cookies[0].split('=')[1]);
    App.AuthManager.set('username',cookies[1].split('=')[1]);
}

App.Router.map(function() {
    this.resource('users',function(){
        this.route('create');
    });
    this.resource('user',{path: 'user/:username'});
});

//App.IndexRoute = Ember.Route.extend({
//  model: function() {
//
//  }
//});

App.ApplicationController = Em.Controller.extend({
    username: null,
    password: null,
    login: function() {
        App.AuthManager.login(this.get('username'),this.get('password'),this);
    },
    logout: function() {
        App.AuthManager.logout(this);
    }
});

App.IndexController = Em.Controller.extend({
    createAccount: function() {
        this.transitionToRoute('users.create');
    }
});

//App.UserRoute = Em.Route.extend({
//    setupController: function(model,controller) {
//
//    }
//});

//function getParameterByName(name) {
//    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
//    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
//        results = regex.exec(location.search);
//    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
//}

App.UserRoute = Em.Route.extend({
    model: function(params) {
        var user = Em.ObjectProxy.create({isLoaded: false}),
            self = this;
        $.ajax({
            url: 'user/' + params.username,
            type: 'GET',
            dataType: 'json',
            headers: {

                'Authorization': 'user=' + App.AuthManager.get('username') + ';token=' + App.AuthManager.get('token')
            }
        }).done(function(data){
                user.set('content',Em.Object.create(data));
                user.set('isLoaded',true);
            }).fail(function(jqxhr,status,message){
                if(jqxhr.status === 403) {
                    alert('please log in to view this page');
                    self.controllerFor('user').transitionToRoute('index');
                } else {
                    alert('uh oh');
                }
            });
        return user;
    },
    setupController: function(controller,model) {
        function getGithubStats() {
            $.getJSON('https://api.github.com/users/' + model.get('github_user') + '/repos')
                .done(function(data){
                    controller.set('github_repos',Em.A(data.map(function(object){
                        return Em.Object.create({
                            full_name: object.full_name,
                            forks_count: object.forks
                        });
                    })));
                }).fail(function(jqxhr, status, errorMessage){
                    controller.set('errorMessage','unable to find github repos for user ' + model.get('github_name'));
                });
        }
        if(model.get('isLoaded')) {
            getGithubStats();
        }
        else {
            model.addObserver('isLoaded',function onLoaded(){
                if(model.get('isLoaded')) {
                    controller.set('github_user',model.get('github_user'));
                    getGithubStats();
                    model.removeObserver('isLoaded',onLoaded);
                }
            });
        }
    },

    serialize: function(model) {
        return {username: model.get('username')};
    }
});

App.User = Em.Object.extend({
    username: null,

    find: function(username) {
        console.log(username);
    }
});

App.UsersCreateRoute = Em.Route.extend({

});

App.UsersCreateController = Em.Controller.extend({
    errorMessage: null,
    username: null,
    password1: null,
    password2: null,
    createAccount: function() {
        var self = this;
        $.ajax({
            url: '/createAccount',
            type: 'POST',
            dataType: 'json',
            data: {
                username: this.get('username'),
                password: this.get('password1'),
                passwordRepeat: this.get('password2')
            }
        }).done(function(data){
                App.AuthManager.login(self.get('username'),self.get('password1'),self);
        }).fail(function(jqxhr, status, errorMessage){
            self.set('errorMessage',errorMessage);
        });
    }
});

App.UserController = Em.Controller.extend({
    errorMessage: null,
    github_user: null,
    github_repos: null,
    authenticateGithub: function(){
        window.location = 'http://localhost:5000/user/' + App.AuthManager.get('username') + '/authenticateGithub';
    }
});