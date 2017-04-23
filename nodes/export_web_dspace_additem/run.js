
var response = context.data;

if(response) {
	out.setter = {"item_upload_handle": response.handle, "item_upload_uuid": response.uuid};
}


