define([],
    function(){
        function index(req, res){
            res.render('index', { title: 'Open Sourcer' });
        }

        return {
            index: index
        };
    }
);