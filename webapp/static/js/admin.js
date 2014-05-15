
$(document).ready(function() {
  $('.action-publish').each(function(i, link) {
    $(this).on('click', function() {
      tree_id = $(this).attr('id').split('-')[1];
      $.getJSON('/admin-action?publish=' + tree_id, function(result) {
        if (result['result'] == 1) {
          $('#publish-' + result['tree_id']).text('depublizieren');
          $('#publish-' + result['tree_id']).off('click');
          $('#publish-' + result['tree_id']).attr({'id': 'depublish-' + result['tree_id']})
        }
      });
    });
  });
  $('.action-depublish').each(function(i, link) {
    $(this).on('click', function() {
      tree_id = $(this).attr('id').split('-')[1];
      $.getJSON('/admin-action?depublish=' + tree_id, function(result) {
        if (result['result'] == 1) {
          $('#depublish-' + result['tree_id']).text('publizieren');
          $('#depublish-' + result['tree_id']).off('click');
          $('#depublish-' + result['tree_id']).attr({'id': 'publish-' + result['tree_id']})
        }
      });
    });
  });
});