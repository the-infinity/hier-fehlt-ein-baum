
var map;
var markers;

// Icons
var GreenIcon;
var greenIcon = null;
var RedIcon;
var redIcon = null;
var PinkIcon;
var pinkIcon = null;
var LightgreenIcon;
var lightgreenIcon = null;

var type_values = Array(
  'bitte auswählen',
  'Baum wurde gefällt und noch nicht wieder neu gepflanzt',
  'Baum gefällt und neu gepflanzt',
  'Vorschlag für einen neuen Baum',
  'Baum wurde gefällt, es ist nicht bekannt, ob Neupflanzung erfolgt ist',
  'Neupflanzung nicht möglich oder sinnvoll');
var current_tree_id = null;

$(document).ready(function() {
  if ($('#map').exists()) {
    var GreenIcon = L.Icon.Default.extend({ options: { iconUrl: '/static/js/images/marker-icon-green.png' } });
    greenIcon = new GreenIcon();
    var RedIcon = L.Icon.Default.extend({ options: { iconUrl: '/static/js/images/marker-icon-red.png' } });
    redIcon = new RedIcon();
    var PinkIcon = L.Icon.Default.extend({ options: { iconUrl: '/static/js/images/marker-icon-pink.png' } });
    pinkIcon = new PinkIcon();
    var LightgreenIcon = L.Icon.Default.extend({ options: { iconUrl: '/static/js/images/marker-icon-lightgreen.png' } });
    lightgreenIcon = new LightgreenIcon();
    
    map = new L.Map('map', {});
    var backgroundLayer = new L.TileLayer('http://otile1.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpg', {
      maxZoom: 18,
      minZoom: 4,
      attribution: 'Map Data &copy; <a href="http://www.openstreetmap.org">OpenStreetMap</a> contributors, Tiles courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a>.'
    });
    map.setView(new L.LatLng(51.481845, 7.216236), 13).addLayer(backgroundLayer);
    $.getJSON('/static/js/bochum.json', function(result) {
      route = L.geoJson(result, {
        style: {
          'color': "#000000",
          'weight': 2,
          'opacity': 0.65
        }
      }).addTo(map);
    });
    get_trees();
  }
});


function get_trees() {
  $.getJSON('/tree-list', function(result) {
    if (!markers) {
      markers = new L.LayerGroup();
      markers.addTo(map);
    }
    else
      markers.clearLayers();
    $.each(result['response'], function(key, tree) {
      if (tree['type'] == 1)
        marker = L.marker([tree['lat'], tree['lng']], {icon: redIcon, title: tree.id});
      else if (tree['type'] == 2)
        marker = L.marker([tree['lat'], tree['lng']], {icon: greenIcon, title: tree.id});
      else if (tree['type'] == 3)
        marker = L.marker([tree['lat'], tree['lng']], {title: tree.id});
      else if (tree['type'] == 4)
        marker = L.marker([tree['lat'], tree['lng']], {icon: pinkIcon, title: tree.id});
      else if (tree['type'] == 5)
        marker = L.marker([tree['lat'], tree['lng']], {icon: lightgreenIcon, title: tree.id});
      marker.on('click', function (current_marker) {
        if ($('#flashes').exists())
          $('#flashes').remove();
        current_marker_id = current_marker['target']['options']['title'];
        $.getJSON('/tree-details?id=' + current_marker_id, function(result) {
          $("#details").animate({width:"290px"});
          tree = result['response'];
          current_tree_id = tree['id'];
          var html = '<span id="close-sidebar" onclick="close_sidebar();">schließen</span>';
          html += '<h2>Details</h2>';
          html += '<h3>Status</h3><p>' + type_values[tree['type']] + '</p>'
          html += '<p id="report-change"><span>Änderung melden</span></p>';
          html += '<h3>Adresse</h3><p>' + tree['address'] + ', ' + tree['postalcode'] + ' ' + tree['city'] + '</p>';
          html += '<h3>Bild</h3>'
          if (tree['picture'] == 1)
            html += '<p><a href="/static/img/tree/' + tree['id'] + '.jpg" rel="lightbox"><img src="/static/img/tree/' + tree['id'] + '-small.jpg" alt="Bild des Baumes" /></a></p></p>';
          else
            html += '<p id="report-image"><span>Bild vorschlagen</span></p>';
          if (tree['chop_reason'])
            html += '<h3>Grund für die Fällung</h3><p>' + tree['chop_reason'] + '</p>';
          if (tree['tree_type_old'])
            html += '<h3>Gefällte Bäume</h3><p>' + tree['tree_type_old'] + '</p>';
          html += '<h3>Beschreibung</h3><p>' +  tree['descr'] + '</p>';
          html += '<h3>Datenquelle</h3><p>' + tree['source'] + '</p>';
          $('#details').html(html);
          $('#report-change span').click(function() {
            html = 'Der Status hat sich wie folgt geändert:<br/><form><select>';
            for (i=0; i < type_values.length; i++)
              html += '<option value="' + i + '">' + type_values[i] + '</option>';
            html += '</select><input type="submit" value="absenden" /></form>';
            $("#report-change").html(html);
            $('#report-change form').submit(function(event) {
              event.preventDefault();
              data = {
                'id': current_tree_id,
                'field': 'type',
                'value': $('#report-change select').val()
              }
              $.get('/tree-suggest', data, function() {
                $("#report-change").html('Status-Vorschlag erfolgreich gesendet. Danke für die Rückmeldung!');
              });
            });
          });
          $('#report-image span').click(function() {
            html = 'Ich schlage folgendes Bild vor:<br/><form enctype="multipart/form-data"><input type="file" name="picture" /><input type="submit" value="absenden" /></form>';
            $("#report-image").html(html);
            $('#report-image form').submit(function(event) {
              event.preventDefault();
              data = 
              $.ajax({
                url: '/tree-suggest?picture=1&field=picture&id=' + current_tree_id,
                type: 'POST',
                data: new FormData($('form')[0]),
                cache: false,
                contentType: false,
                processData: false,
                success: function() {
                  $("#report-image").html('Bild-Vorschlag erfolgreich gesendet. Danke für die Rückmeldung!');
                }
              });
            });
          });
        });
      });
      markers.addLayer(marker);
    });
  });
}

function close_sidebar() {
  $("#details").html('');
  $("#details").animate({width:"0px", 'padding-left': '0px', 'padding-right': '0px'});
}

function filterGeocodingChoices(results) {
  results = deepCopy(results);
  // Alle Einträge bekommen eigenen Qualitäts-Koeffizienten
  for (var n in results) {
    results[n].okquality = 1.0;
    // verdreifache wenn neighborhood gesetzt
    if (results[n].address.suburb != '') {
      results[n].okquality *= 3.0;
    }
    // verdopple wenn PLZ gesetzt
    if (results[n].address.postcode != '') {
      results[n].okquality *= 3.0;
    }
    // keine Straße gesetzt: Punktzahl durch 10
    if (typeof(results[n].address.road) === 'undefined') {
        results[n].okquality *= 0.1;
    }
  }
  // Sortieren nach 'okquality' abwärts
  results.sort(qualitySort);
  var resultByPostCode = {};
  var n;
  for (n in results) {
    if (typeof(resultByPostCode[results[n].address.postcode]) === 'undefined') {
      resultByPostCode[results[n].address.postcode] = results[n];
    }
  }
  ret = [];
  for (n in resultByPostCode) {
    ret.push(resultByPostCode[n]);
  }
  // Sortieren nach Längengrad
  ret.sort(longitudeSort);
  return ret;
}

function longitudeSort(a, b) {
  return parseFloat(a.lon) - parseFloat(b.lon)
}

function qualitySort(a, b) {
  return b.okquality - a.okquality
}

function deepCopy(obj) {
  if (typeof obj !== "object") return obj;
  if (obj.constructor === RegExp) return obj;
  
  var retVal = new obj.constructor();
  for (var key in obj) {
    if (!obj.hasOwnProperty(key)) continue;
    retVal[key] = deepCopy(obj[key]);
  }
  return retVal;
}

jQuery.fn.exists = function(){return this.length>0;}