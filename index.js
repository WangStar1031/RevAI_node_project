
var express = require('express');
var bodyParser = require('body-parser');
// var multer  = require('multer');
var formidable = require('formidable');
var fs = require('fs');

import {RevAiApiClient} from 'revai-node-sdk';

var accessToken = "02hlKKQfwLqTbHG51G3ADeaEsRBI3N5vvLytQc_5mRkHcf_wfpp_tGa_AIYNfl0WX3_M4Vu5hsw9SKn9AfahXEty-DN2U";
var client = new RevAiApiClient(accessToken);




// var upload = multer({ dest: 'uploads/'});

var app = express();

app.get('/', function (req, res) {
	res.sendFile( __dirname + "/" + "index.html" );
})

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
app.post('/file_upload', function(req, res) {
	var form = new formidable.IncomingForm();
	form.parse(req, function(err, fields, files){
		var oldPath = files.file.path;
		// var newPath = "c://uploads/" + files.file.name;
		var newPath = __dirname + "/uploads/" + files.file.name;
		fs.copyFile(oldPath, newPath, (err) => {
			if( err){
				console.log(err);
				res.send("Error occured");
			} else{
				fs.unlink(oldPath);
				var localJob = client.submitJobLocalFile(newPath);
				localJob.then(function(result){
					var interval = setInterval(function(){
						var jobDetails = client.getJobDetails(result.id);
						jobDetails.then(function(details){
							if( details.status.toLowerCase() == 'transcribed'){
								clearInterval(interval);
								var transcriptObj = client.getTranscriptObject(details.id);
								transcriptObj.then( function(data){
									for( var i = 0; i < data.monologues.length; i++){
										var curMono = data.monologues[i];
										var strText = "";
										for( var j = 0; j < curMono.elements.length; j++){
											var curEle = curMono.elements[j];
											strText += curEle.value;
										}
										res.write(strText + "\n\n");
									}
									res.end();
								});
							}
						})
					})
				});
				res.write("File Uploaded\n");
				// res.end();
			}
		})

	});
})

var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port
   
   console.log("Example app listening at http://%s:%s", host, port)
})
