
var map;
var marker = null;

$(document).ready(function() {
  if ($('#new-tree-map').exists()) {
    map = new L.Map('new-tree-map', {});
    var backgroundLayer = new L.TileLayer('http://otile1.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpg', {
      maxZoom: 18,
      minZoom: 4,
      attribution: 'Map Data &copy; <a href="http://www.openstreetmap.org">OpenStreetMap</a> contributors, Tiles courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a>.'
    });
    map.setView(new L.LatLng(51.481845, 7.216236), 13).addLayer(backgroundLayer);
    
    marker = L.marker([51.481845, 7.216236], {draggable: true}).addTo(map);
    marker.on('dragend', function() {
      $('#lat').val(marker.getLatLng()['lat']);
      $('#lng').val(marker.getLatLng()['lng']);
    });
    
    $('#address').on('change', function() {
      if ($('#address').val()) {
        data = {
          'address': $('#address').val()
        }
        $.getJSON('/geocode', data, function(result) {
          result = filterGeocodingChoices(result['result']);
          if (result.length >= 1) {
            result = result[0];
            $('#lat').val(result['lat']);
            $('#lng').val(result['lon']);
            $('#postalcode').val(result['address']['postcode']);
            marker.setLatLng([result['lat'], result['lon']]);
            map.setView([result['lat'], result['lon']]);
            map.setZoom(17);
          }
          if (result.length > 1)
            console.log('Mehrere Ergebnisse gefunden!')
          if (result.length == 0)
            console.log('Auf Karte nicht gefunden!');
        });
      }
      else {
        $('#lat').val('');
        $('#lng').val('');
        $('#postalcode').val('');
        marker.setLatLng([51.481845, 7.216236]);
        map.setView([51.481845, 7.216236]);
        map.setZoom(13);
      }
    })
  }
});


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