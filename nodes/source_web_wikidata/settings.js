

$('#source_web_wikidata_predefined').on('change', function() { 
   $('#source_web_wikidata_search_url').empty(); 
   $('#source_web_wikidata_search').empty(); 
   
   var a = $('<a>' + $('option:selected', $(this)).text() + '</a>');
   a.attr('href', $(this).val());
   a.attr('target', "_blank");
   $('#source_web_wikidata_search_url').append(a); 
    $('#source_web_wikidata_search').val($(this).val());
});


