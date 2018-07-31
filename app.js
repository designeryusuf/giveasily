const express = require ('express');
const path = require ('path');

//init app
const app = express();


//Home Route
app.get('/', function(req, res){
	res.send('Hello World');
});

//set public folder
app.use(express.static(path.join(_dirname, 'public')));

//start server
app.listen(3000, function(){
	console.log('server started on port 3000');
});