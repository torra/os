define([],
    function(){
        function index(req, res){
            res.render('index', { title: 'Open Sourcerer' });
        }

        return {
            index: index
        };
    }
);