
var map;
var markers;
var GreenIcon;
var greenIcon = null;
var RedIcon;
var redIcon = null;
var PinkIcon;
var pinkIcon = null;

$(document).ready(function() {
  if ($('#map').exists()) {
    var GreenIcon = L.Icon.Default.extend({ options: { iconUrl: '/static/js/images/marker-icon-green.png' } });
    greenIcon = new GreenIcon();
    var RedIcon = L.Icon.Default.extend({ options: { iconUrl: '/static/js/images/marker-icon-red.png' } });
    redIcon = new RedIcon();
    var PinkIcon = L.Icon.Default.extend({ options: { iconUrl: '/static/js/images/marker-icon-pink.png' } });
    pinkIcon = new PinkIcon();
    map = new L.Map('map', {});
    var backgroundLayer = new L.TileLayer('http://otile1.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpg', {
      maxZoom: 18,
      minZoom: 4,
      attribution: 'Map Data &copy; <a href="http://www.openstreetmap.org">OpenStreetMap</a> contributors, Tiles courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a>.'
    });
    map.setView(new L.LatLng(51.481845, 7.216236), 13).addLayer(backgroundLayer);
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
      console.log(tree);
      if (tree['type'] == 1)
        marker = L.marker([tree['lat'], tree['lng']], {icon: redIcon, title: tree.id});
      else if (tree['type'] == 2)
        marker = L.marker([tree['lat'], tree['lng']], {icon: greenIcon, title: tree.id});
      else if (tree['type'] == 3) {
        marker = L.marker([tree['lat'], tree['lng']], {title: tree.id});
      }
      else if (tree['type'] == 4) {
        marker = L.marker([tree['lat'], tree['lng']], {icon: pinkIcon, title: tree.id});
      }
      marker.on('click', function (current_marker) {
        if ($('#flashes').exists())
          $('#flashes').remove();
        
        current_marker_id = current_marker['target']['options']['title'];
        $.getJSON('/tree-details?id=' + current_marker_id, function(result) {
          $("#details").animate({width:"290px", 'padding-left': '10px', 'padding-right': '10px'});
          tree = result['response'];
          status = '';
          if (tree['type'] == 1)
            status = 'Baum gefällt, noch nicht wieder neu gepflanzt';
          else if (tree['type'] == 2)
            status = 'Baum gefällt und neu gepflanzt';
          else if (tree['type'] == 3)
            status = 'Vorschlag für einen neuen Baum';
          else if (tree['type'] == 4)
            status = 'Baum gefällt, nicht bekannt ob Neupflanzung erfolgt ist';
          var html = '<span id="close-sidebar" onclick="close_sidebar();">schließen</span><h2>Details</h2><p>' + status + '</p><p>Adresse:<br />' + tree['address'] + ',<br />' + tree['postalcode'] + ' ' + tree['city'] + '</p>';
          if (tree['picture'] == 1)
            html += '<a href="/static/img/tree/' + tree['id'] + '.jpg" rel="lightbox"><img src="/static/img/tree/' + tree['id'] + '-small.jpg" alt="Bild des Baumes" /></a>';
          html += '<p>Beschreibung:<br />' +  tree['descr'] + '</p>'
          $("#details").html(html);
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