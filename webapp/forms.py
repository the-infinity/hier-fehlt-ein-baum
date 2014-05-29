# encoding: utf-8

from flask.ext.wtf import Form
from wtforms import validators
from models import *
from wtforms import SubmitField, TextField, SelectField, FileField, TextAreaField, HiddenField, BooleanField
from wtforms.widgets import FileInput
from webapp import app, db
import util

class ImageFileInput(FileInput):
  def __init__(self):
    super(ImageFileInput, self).__init__()

  def __call__(self, field, **kwargs):
    kwargs['accept'] = 'image/*'
    kwargs['capture'] = ''
    return super(ImageFileInput, self).__call__(field, **kwargs)
  
class NewTree(Form):
  author = TextField(
    label='Ihr Name',
    validators=[
      validators.Required(message=u'Ihr Name wird für eventuelle Rückfragen benötigt.'),
      validators.Length(min=6, max=255, message='Ihr Name ist zu kurz (Minimum 6 Zeichen).')
    ],
    description=u'Wird nicht veröffentlicht oder weitergegeben. Wird für eventuelle Rückfragen benötigt.')
  email = TextField(
    label='Ihre E-Mail Adresse',
    validators=[
      validators.Required(message=u'Ihre Mailadresse wird für eventuelle Rückfragen benötigt.'),
      validators.Length(max=255),
      validators.Email('Bitte geben Sie eine korrekte Mailadresse an.')
    ],
    description=u'Wird nicht veröffentlicht oder weitergegeben. Wird für eventuelle Rückfragen benötigt.')
  type = SelectField(
    label=u'Art der Meldung',
    choices=[
      ('0', u'bitte auswählen'),
      ('1', u'Baum gefällt, noch nicht wieder neu gepflanzt'),
      ('2', u'Baum gefällt und neu gepflanzt'),
      ('3', u'Vorschlag für einen neuen Baum')],
    validators = [
      validators.Required(message=u'Bitte geben Sie an welchen Vorschlag Sie machen möchten.')
    ],
    description='')
  address = TextField(
    label=u'Straße und Hausnummer',
    validators=[
      validators.Required(message=u'Eine Adresse wird benötigt.'),
      validators.Length(max=255)
    ],
    description=u'Straße und Hausnummer in Bochum zur Lokalisierung')
  descr = TextAreaField(
    label=u'Zusatzinformationen',
    validators=[validators.Length(max=32000)],
    description='')
  picture = FileField(
    label = 'Bild',
    description=u'JPG-Datei. Zeigen Sie mit einem Bild welchen Ort genau Sie meinen. Mit dem Upload bestätigen Sie, dass das Bild von dieser Website verwendet werden kann (<a href="/impressum#datenverwendung">Hintergründe / AGB</a>).',
    widget = ImageFileInput())
  lat = HiddenField(
    validators=[
      validators.Required(message='Leider ist die Geolokalisierung fehlgeschlagen. Bitte setzen Sie den Marker auf der Karte.')
    ],
  )
  lng = HiddenField(
    validators=[validators.Required(message='')],
  )
  postalcode = HiddenField(
    validators=[validators.Required(message='')],
  )
  submit = SubmitField(
    label=u'Daten speichern')
  