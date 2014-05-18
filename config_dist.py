# encoding: utf-8
import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

IMAGE_UPLOAD_PATH_BASE = os.path.join(BASE_DIR, 'webapp/static/img/tree')

SQLALCHEMY_DATABASE_URI = 'mysql://mysqluser:mysqlpassword@mysqlhost/mysqltable'
SQLALCHEMY_MIGRATE_REPO = os.path.join(BASE_DIR, 'database')

#Debugging?
DEBUG = True

SECRET_KEY = 'secret-key'

#Auto Generated Config Values
SQLALCHEMY_ECHO = False

BASIC_AUTH_USERNAME = 'admin-username'
BASIC_AUTH_PASSWORD = 'admin-password'
BASIC_AUTH_REALM = 'Bitte geben Sie Nutzername und Passwort fuer das Admin-Interface ein.'

GEOCODING_DEFAULT_CITY = 'Bochum'
GEOCODING_DEFAULT_COUNTRY = 'DE'
GEOCODING_FILTER_COUNTY = 'Bochum'

MAIL_SERVER = 'mail-server'
MAIL_PORT = 465
MAIL_USE_SSL = True
MAIL_USERNAME = 'mail-username'
MAIL_PASSWORD = 'mail-password'
MAIL_DEBUG = False

GIS_URL_COOKIE = 'http://gis.bochum.de/ASWeb/ASC_URL/GISConnectorRIA.do?VERSION=1.0&PROJECT=InternetPortal&APPLID=0&USER=baum&PWD=baum'
GIS_URL_DATA = 'https://gis.bochum.de/ASWeb/ASC_RIA/gpproxy.jsp?http://vb2k8gis02:8399/arcgis/rest/services/Baumfaellkataster/MapServer/0/query?where=OBJECTID+IS+NOT+NULL&returnGeometry=true&outFields=*&f=json'
