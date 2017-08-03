

$('#download_file_name_type').change(function() {
	switch (this.value) {
		case "record":
			$("#download_file_has_filename").show();
			$("#download_file_create_filename").hide();
			break;
		case "own":
			$("#download_file_create_filename").show();
			$("#download_file_has_filename").hide();
			break;
		default:
			$("#download_file_has_filename").hide();
			$("#download_file_create_filename").hide();
	}
});
