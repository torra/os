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
            controller.transitionToRoute('user',Em.Object.create(data));
        }).fail(function(jqxhr,status,message){
            alert('login failed!');
        });
    },
    logout: function() {

    },
    token: null,
    isAuthenticated: function(){
        return (typeof this.get('token')) === 'string';
    }.property('token')
});

App.AuthManager = AuthenticationManager.create();

App.Router.map(function() {
    this.resource('user',{path: 'user/:username'},function(){
        this.route('create');
    });
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
        App.AuthManager.logout();
    }
});

App.IndexController = Em.Controller.extend({
    createAccount: function() {
        this.transitionToRoute('user.create');
    }
});

//App.UserRoute = Em.Route.extend({
//    setupController: function(model,controller) {
//
//    }
//});

App.UserRoute = Em.Route.extend({
    setupController: function(controller,model) {
        $.getJSON('https://api.github.com/users/' + model.get('github_name') + '/repos')
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

App.UserCreateRoute = Em.Route.extend({

});

App.UserCreateController = Em.Controller.extend({
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
            if(data.status !== 0) {
                self.set('errorMessage',data.message);
            } else {
                self.transitionToRoute('user.index',Em.Object.create(data));
            }
        }).fail(function(jqxhr, status, errorMessage){
            self.set('errorMessage',errorMessage);
        });
    }
});

App.UserIndexController = Em.Controller.extend({
    errorMessage: null,
    github_repos: null
});