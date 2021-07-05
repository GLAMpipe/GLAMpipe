

$('#source_api_finna_search').on('keyup', function() { 
   $('#source_api_finna_search_url').empty(); 
   var a = $('<a>' + $(this).val() + '</a>');
   a.attr('href', $(this).val());
   $('#source_api_finna_search_url').append(a); 
});

$('#source_api_finna_hae').on('click', function() { 
  var params = {}; 
  params.url = 'https://api.finna.fi/v1/search?'; 
  var search = $('#source_api_finna_search').val(); 
  var license = $('#source_api_finna_license').val(); 
  var query = search.split('?'); 
  if(query.length == 2) { 
     params.query = query[1];
     console.log(params.url + params.search); 
     $.post('http://localhost:3000/proxy/', params, function(data) { 
  	   alert(data.resultCount);  
     }) 
   } else { 
     alert('The search string is corrupt! Did you copy the URL correctly?'); 
   } 
})
