# encoding: utf-8

import datetime
import calendar
import email.utils
import re
import urllib
import urllib2
import json
import bson
import math
from webapp import app

def rfc1123date(value):
  """
  Gibt ein Datum (datetime) im HTTP Head-tauglichen Format (RFC 1123) zurück
  """
  tpl = value.timetuple()
  stamp = calendar.timegm(tpl)
  return email.utils.formatdate(timeval=stamp, localtime=False, usegmt=True)

def expires_date(hours):
  """Date commonly used for Expires response header"""
  dt = datetime.datetime.now() + datetime.timedelta(hours=hours)
  return rfc1123date(dt)

def cache_max_age(hours):
  """String commonly used for Cache-Control response headers"""
  seconds = hours * 60 * 60
  return 'max-age=' + str(seconds)

def geocode(location_string):
  """
  Löst eine Straßen- und optional PLZ-Angabe zu einer Geo-Postion
  auf. Beispiel: "Straßenname (12345)"
  """
  postal = None
  street = location_string.encode('utf-8')
  postalre = re.compile(r'(.+)\s+\(([0-9]{5})\)')
  postal_matching = re.match(postalre, street)
  postal = None
  if postal_matching is not None:
    street = postal_matching.group(1)
    postal = postal_matching.group(2)
  url = 'http://open.mapquestapi.com/nominatim/v1/search.php'
  city = app.config['GEOCODING_DEFAULT_CITY']
  if type(city) == unicode:
    city = city.encode('utf8')
  params = {'format': 'json',  # json
            'q': ', '.join([street, city]),
            'addressdetails': 1,
            'accept-language': 'de_DE',
            'countrycodes': app.config['GEOCODING_DEFAULT_COUNTRY']}
  request = urllib2.urlopen(url + '?' + urllib.urlencode(params))
  response = request.read()
  addresses = json.loads(response)
  addresses_out = []
  print addresses
  for address in addresses:
    for key in address.keys():
      if key in ['address', 'boundingbox', 'lat', 'lon', 'osm_id']:
        continue
      del address[key]
    # skip if not in correct county
    if 'county' not in address['address']:
      continue
    if address['address']['county'] != app.config['GEOCODING_FILTER_COUNTY']:
      continue
    if postal is not None:
      if 'postcode' in address['address'] and address['address']['postcode'] != postal:
        continue
    addresses_out.append(address)
  return addresses_out

def distance_earth(lat1, long1, lat2, long2):
  degrees_to_radians = math.pi/180.0
  
  phi1 = (90.0 - float(lat1))*degrees_to_radians
  phi2 = (90.0 - float(lat2))*degrees_to_radians
  
  theta1 = float(long1)*degrees_to_radians
  theta2 = float(long2)*degrees_to_radians
  
  cos = (math.sin(phi1)*math.sin(phi2)*math.cos(theta1 - theta2) + math.cos(phi1)*math.cos(phi2))
  arc = math.acos( cos )
  
  return arc * 6373 * 1000
  
def obscuremail(mailaddress):
  return mailaddress.replace('@', '__AT__').replace('.', '__DOT__')
app.jinja_env.filters['obscuremail'] = obscuremail


class MyEncoder(json.JSONEncoder):
  def default(self, obj):
    return str(obj)
