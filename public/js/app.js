App = Ember.Application.create();

App.Router.map(function() {
    this.resource('user',function(){
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
            url: '/login',
            type: 'POST',
            dataType: 'json',
            data: {
                username: this.get('username'),
                password: this.get('password')
            }
        }).done(function(data){
            self.transitionToRoute('user.index',Em.Object.create(data));
        }).fail(function(jqxhr,status,message){
            alert('login failed!');
        });
    }
});

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
    }
});

App.UserController = Em.Controller.extend({
    errorMessage: null,
    github_repos: null
});