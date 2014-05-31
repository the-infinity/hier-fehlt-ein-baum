var result_state = {
  'update': {
    'public': {
      1: {
        'value': 0,
        'text': 'depublizieren',
      },
      0: {
        'value': 1,
        'text': 'publizieren',
      }
    }
  }
};

function update_value(link, data) {
  if (data['type'] == 'update') {
    $.getJSON('/admin-action', data, function(result) {
      if (data['type'] == 'delete' || data['tree_suggest_id'])
        link.parent().parent().remove()
      else {
        link.attr('onclick', 'update_value($(this), {\'type\': \'update\', \'tree_id\': ' + String(data['tree_id']) + ', \'field\': \'' + data['field'] + '\', \'value\': \'' + result_state[data['type']][data['field']][data['value']]['value'] + '\'});');
        link.html(result_state[data['type']][data['field']][data['value']]['text']);
      }
    });
  }
}