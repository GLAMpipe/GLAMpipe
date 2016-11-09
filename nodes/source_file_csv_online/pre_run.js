// Node create an array of download objects {url:, filename:}

// TODO: not very smart if input has multiple urls in array

var download = {};
out.urls = [];


download.filename = "hutuntuttu.csv";
download.url = context.node.params.file_url;

out.console.log(download);

out.urls.push(download);


