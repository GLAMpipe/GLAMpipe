
var dataDisplay = "#export_data_dspace_schema_add_field_display";
var fetchButton = "#export_data_dspace_schema_add_field_fetch";
var urlInput = "#export_data_dspace_schema_add_field_url";


// URL SELECTION
$("#export_data_dspace_schema_add_field_url_pre").change(function(e){
	var url = $('#export_data_dspace_schema_add_field_url_pre :selected').text();
	$(urlInput).val(url);
	
});





