
var map;
var marker = null;
var address_auto_set = false;
var lat_lng_auto_set = false;


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
    
    // Anzeigen der Stadtgrenzen
    $.getJSON('/static/js/bochum.json', function(result) {
      route = L.geoJson(result, {
        style: {
          'color': "#000000",
          'weight': 2,
          'opacity': 0.65
        }
      }).addTo(map);
    });
    
    // Übernehmen von gespeicherter GPS Position
    if ($('#lat').val() && $('#lng').val()) {
      marker.setLatLng([$('#lat').val(), $('#lng').val()]);
      map.setView([$('#lat').val(), $('#lng').val()]);
      map.setZoom(17);
    }
    
    // Wenn Mobilbrowser: GPS Position nutzen + Deaktivieren der Photo-Funktion ermöglichen
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 1) {
      $('<p id="picture-cam-toggle" onclick="picture_cam_toggle();">Kamera-Funktion deaktivieren</p>').insertAfter($('#picture').parent().children('input'));
      $('#picture').parent().children('p').children('span').click(function() {
        console.log('meeeeh');
      });
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
          if (position.coords.latitude && position.coords.longitude) {
            marker.setLatLng([position.coords.latitude, position.coords.longitude]);
            map.setView([position.coords.latitude, position.coords.longitude]);
            map.setZoom(17);
            data = {
              'lat': position.coords.latitude,
              'lng': position.coords.longitude
            }
            $.getJSON('/geocode', data, function(result) {
              result = filterGeocodingChoices(result['result']);
              if (result.length >= 1) {
                result = result[0];
                $('#postalcode').val(result['address']['postcode']);
                $('#address').val(result['address']['road']);
                address_auto_set = true;
              }
            });
          }
        });
      }
    }
    
    // Verschieben des Markers
    marker.on('dragend', function() {
      $('#lat').val(marker.getLatLng()['lat']);
      $('#lng').val(marker.getLatLng()['lng']);
      // Straße herausfinden wenn Straße noch nicht gesetzt
      if (!$('#address').val() || address_auto_set) {
        data = {
          'lat': marker.getLatLng()['lat'],
          'lng': marker.getLatLng()['lng']
        }
        $.getJSON('/geocode', data, function(result) {
          result = filterGeocodingChoices(result['result']);
          if (result.length >= 1) {
            result = result[0];
            $('#postalcode').val(result['address']['postcode']);
            $('#address').val(result['address']['road']);
            address_auto_set = true;
          }
        });
      }
    });
    
    // Eintragen einer Straße
    $('#address').on('change', function() {
      address_auto_set = false;
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
            lat_lng_auto_set = true;
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

function picture_cam_toggle() {
  if ($('#picture').attr('capture') !== undefined) {
    $('#picture').removeAttr('capture');
    $('#picture-cam-toggle').text('Kamera-Funktion aktivieren');
  }
  else {
    $('#picture').attr({'capture': ''});
    $('#picture-cam-toggle').text('Kamera-Funktion deaktivieren');
  }
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