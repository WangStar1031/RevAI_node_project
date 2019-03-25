
var express = require('express');
var fs = require("fs-extra");
var busboy = require("connect-busboy");
var path = require("path");
var formidable = require('formidable');


const curl = new (require('curl-request'))();

// require('revai-node-sdk');
// use 'RevAiApiClient';
import {RevAiApiClient} from 'revai-node-sdk';
// var RevAiApiClient = require('revai-node-sdk');
var accessToken = "02hlKKQfwLqTbHG51G3ADeaEsRBI3N5vvLytQc_5mRkHcf_wfpp_tGa_AIYNfl0WX3_M4Vu5hsw9SKn9AfahXEty-DN2U";
var client = new RevAiApiClient(accessToken);
// var client = new (require('revai-node-sdk'))();


var app = express();

var bodyParser = require('body-parser');
var multer  = require('multer');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(busboy());

// var upload = multer({ dest: '/uploades/'});

app.get('/', function (req, res) {
	res.sendFile( __dirname + "/" + "index.html" );
})
var $REV_ACCESS_TOKEN = '02hlKKQfwLqTbHG51G3ADeaEsRBI3N5vvLytQc_5mRkHcf_wfpp_tGa_AIYNfl0WX3_M4Vu5hsw9SKn9AfahXEty-DN2U';
//rev.ai access token
app.get('/jobId/:jobid', function(req, res){
	var jobid = req.params.jobid;
	var jobDetails = client.getJobDetails(jobid);
	jobDetails.then(function(details){
		if( details.status == 'transcribed'){
			// var transcriptText = client.getTranscriptText(details.id);
			// transcriptText.then(function(data){
			// 	console.log("transcriptText");
			// 	console.log(data);
			// 	res.send(data);
			// });

			var transcriptObj = client.getTranscriptObject(details.id);
			transcriptObj.then(function(data){
				// res.send(data);
				console.log("transcriptObj");
				console.log(data);
				for( var i = 0; i < data.monologues.length; i++){
					var curMono = data.monologues[i];
					var strText = "";
					for( var j = 0; j < curMono.elements.length; j++){
						var curEle = curMono.elements[j];
						strText += curEle.value;
					}
					res.write(strText);
					res.write('\n\n');
				}
				res.end();
			});
		} else{
			res.send(details.status);
		}
	});
	// res.send(req.params);
})
app.get('/allJobs', function(req, res){
	var jobs = client.getListOfJobs(undefined, undefined);
	jobs.then(function(data){
		// console.log(data);
		for( var i = 0; i < data.length; i++){
			var curData = data[i];
			console.log( curData.id);
			var strHtml = '<p><a target="_blank" href="/jobId/' + curData.id + '">' + curData.id + '</a>' + '<b>' + curData.media_url + '</b>' + curData.status + '</p>';
			res.write(strHtml);
			// res.write(curData.id + '\n');
		}
		res.end();
	});
});
app.get('/file_upload', function(req, res){
	var urlJob = client.submitJobUrl("https://www.rev.ai/FTC_Sample_1.mp3");
	console.log(urlJob);
	urlJob.then(function(result){
		console.log(urlJob);
		console.log(result.id);
		var interval = setInterval(function(){
			var jobDetails = client.getJobDetails(result.id);
			jobDetails.then(function(details){
				console.log(details.status);

				if( details.status.toLowerCase() == 'transcribed'){
					clearInterval(interval);
					// Get transcript as text
					var transcriptText = client.getTranscriptText(details.id);
					transcriptText.then(function(data){
						console.log("transcriptText");
						console.log(data);
						res.write(data);
						res.end();
						// res.redirect('back');
					});
					// Get transcript as object
					var transcriptObj = client.getTranscriptObject(details.id);
					transcriptObj.then(function(data){
						console.log("transcriptObj");
						console.log(data);
						// res.redirect('back');
					});
					// res.write(details);
					// res.end();
				} else{
				}
			})
		}, 5000);
		// var jobDetails = client.getJobDetails(result.id);
		// jobDetails.then(function(details){
		// 	console.log(details);
		// 	res.redirect('back');
		// })
	});
});
app.post('/file_upload', function (req, res) {
	/*
	var form  = new formidable.IncomingForm();
	form.parse(req, function(err, fields, files){
		var oldPath = files.file.path;
		var newPath = __dirname + '/uploades/' + files.file.name;
		fs.rename(oldPath, newPath, function(err){
			if( err) console.log(err);

			res.redirect('back');
			// res.end();
		})
	})
	*/
	console.log(__dirname + "/assets/sound/FTC Sample 1 - Single.mp3");
	var fileJob = client.submitJobLocalFile(__dirname + "/assets/sound/FTC Sample 1 - Single.mp3");
	console.log(fileJob);
	res.write(fileJob);

	// var fstream;
	// req.pipe(req.busboy);
	// req.busboy.on('file', function(fieldname, file, filename){
	// 	console.log("Uploading:" + filename);
	// 	fstream = fs.createWriteStream(__dirname + '/uploades/' + filename);
	// 	file.pipe(fstream);
	// 	fstream.on('close', function(){
	// 		console.log("Uploading finished.");
	// 		// var urlJob = await client.submit("https://www.rev.ai/FTC_Sample_1.mp3");
	// 		var fileJob = client.submitJobLocalFile("/uploades/" + filename);
	// 		console.log(fileJob);
	// 		res.redirect('back');
	// 	})
	// });
})

var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port
   
   console.log("Example app listening at http://%s:%s", host, port)
})

//curl -X POST "https://api.rev.ai/speechtotext/v1/jobs"
// -H "Authorization: Bearer $REV_ACCESS_TOKEN"
// -H "Content-Type: application/json" 
// -d "{\"media_url\":\"https://support.rev.com/hc/en-us/article_attachments/200043975/FTC_Sample_1_-_Single.mp3\",\"metadata\":\"This is a sample submit jobs option\"}"