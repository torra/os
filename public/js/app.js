App = Ember.Application.create();

App.Auth = Ember.Auth.create({
    signInEndPoint: '/sign-in',
    signOutEndPoint: '/sign-out'
});

App.Router.map(function() {
    this.resource('user',function(){
        this.route('create');
        this.route('index',{ path: '/:username' });
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
        var self = this;
        $.ajax({
            url: '/sign-in',
            type: 'POST',
            dataType: 'json',
            data: {
                username: this.get('username'),
                password: this.get('password')
            }
        }).done(function(data){
            if(data.status !== 0) {
                alert('login failed!');
            }
            else {
                self.transitionToRoute('user.index',Em.Object.create(data));
            }
        }).fail(function(jqxhr,status,message){
            alert('login failed!');
        });
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

App.UserIndexRoute = Em.Route.extend({
    setupController: function(model,controller) {
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

    authenticateGithub: function() {
        console.log('hi');
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