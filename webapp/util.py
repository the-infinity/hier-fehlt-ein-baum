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

def geocode(address = "", postalcode = "", city = "", searchstring = ""):
  """
  Löst eine Straßen-, PLZ und Stadt-Angabe zu einer Geo-Postion
  """
  address = address.encode('utf-8')
  postalcode = postalcode.encode('utf-8')
  city = city.encode('utf-8')
  searchstring = searchstring.encode('utf-8')
  url = 'http://open.mapquestapi.com/nominatim/v1/search.php'
  if not searchstring:
    searchstring = address + ' ' + city
  params = {'format': 'json',  # json
    'q': searchstring,
    'addressdetails': 1,
    'accept-language': 'de_DE',
    'countrycodes': 'de'}
  request = urllib2.urlopen(url + '?' + urllib.urlencode(params))
  response = request.read()
  addresses = json.loads(response)
  addresses_out = []
  for n in range(len(addresses)):
    for key in addresses[n].keys():
      if key in ['address', 'boundingbox', 'lat', 'lon', 'osm_id']:
        continue
      del addresses[n][key]
    # skip if no road contained
    #if 'road' not in addresses[n]['address']:
    #  continue
    # skip if not in correct county
    #if 'county' not in addresses[n]['address']:
    #  continue
    #if addresses[n]['addåress']['county'] != city and city:
    #  continue
    #if 'postcode' in addresses[n]['address'] and addresses[n]['address']['postcode'] == postalcode:
    addresses_out.append(addresses[n])
  print addresses_out
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
