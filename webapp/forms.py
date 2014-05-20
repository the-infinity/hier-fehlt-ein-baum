# encoding: utf-8

from flask.ext.wtf import Form
from wtforms import validators
from models import *
from wtforms import SubmitField, TextField, SelectField, FileField, TextAreaField, HiddenField, BooleanField
from webapp import app, db
import util

class NewTree(Form):
  author = TextField(
    label='Ihr Name',
    validators=[validators.Required(), validators.Length(min=6, max=255)],
    description=u'Wird nicht veröffentlicht oder weitergegeben. Wird für eventuelle Rückfragen benötigt.')
  email = TextField(
    label='Ihre E-Mail Adresse',
    validators=[validators.Required(), validators.Length(max=255),validators.Email()],
    description=u'Wird nicht veröffentlicht oder weitergegeben. Wird für eventuelle Rückfragen benötigt.')
  type = SelectField(
    label=u'Art der Meldung',
    choices=[
      ('0', u'bitte auswählen'),
      ('1', u'Baum gefällt, noch nicht wieder neu gepflanzt'),
      ('2', u'Baum gefällt und neu gepflanzt'),
      ('3', u'Vorschlag für einen neuen Baum')],
    validators = [validators.Required()],
    description='')
  address = TextField(
    label=u'Straße und Hausnummer',
    validators=[validators.Required(), validators.Length(max=255)],
    description=u'Straße und Hausnummer in Bochum zur Lokalisierung')
  descr = TextAreaField(
    label=u'Zusatzinformationen',
    validators=[validators.Required(), validators.Length(max=32000)],
    description='')
  picture = FileField(
    label = 'Bild',
    description='JPG-Datei. Zeigen Sie mit einem Bild welchen Ort genau Sie meinen.')
  lat = HiddenField(
    validators=[validators.Required()],
  )
  lng = HiddenField(
    validators=[validators.Required()],
  )
  postalcode = HiddenField(
    validators=[validators.Required()],
  )
  submit = SubmitField(
    label=u'Daten speichern')
  

  