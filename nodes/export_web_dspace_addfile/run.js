
var response = context.response;

if(response.statusCode == 200) {
	context.success_counter++;
	//out.setter = {"item_upload_handle": response.handle, "item_upload_uuid": response.uuid};
}
out.value = response.statusCode;


