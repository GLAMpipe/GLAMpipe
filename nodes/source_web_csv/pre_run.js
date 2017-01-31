// Node create an array of download objects {url:, filename:}

// TODO: not very smart if input has multiple urls in array

var download = {};
out.urls = [];

// auth
if(context.node.settings.username != "") {
	download.auth = {
		'user': context.node.settings.username,
		'pass': context.node.settings.password,
		'sendImmediately': true
	}
}

// create filename
var date = new Date(Date.now());
var y =  date.getUTCFullYear();
var m =  date.getMonth() + 1;
var d =  date.getDate();
var h =  date.getHours();
var mm =  date.getMinutes();
var s =  date.getSeconds();
var ss =  date.getMilliseconds();
download.filename= y + "-" + m + "-" + d + " " + h + ":" + mm + ":" + s + "-" + ss + ".csv";

download.url = context.node.params.file_url;
out.urls.push(download);


