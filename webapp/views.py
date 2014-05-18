# encoding: utf-8

from webapp import app, basic_auth, mail
from flask import render_template, make_response, abort, request, Response, redirect, flash
from flask.ext.mail import Message
from models import *
from forms import *
import models, util
import json, time, os, datetime
from subprocess import call
from sqlalchemy import or_


@app.route('/')
def index():
  return render_template('index.html')

@app.route("/tree-list")
def tree_list():
  start_time = time.time()
  trees = Tree.query.filter_by(public=1).all()
  result = []
  for tree in trees:
    result.append({
      'id': tree.id,
      'lat': tree.lat,
      'lng': tree.lng,
      'type': tree.type
    })
  ret = {
    'status': 0,
    'duration': round((time.time() - start_time) * 1000),
    'request': {},
    'response': result
  }
  json_output = json.dumps(ret, cls=util.MyEncoder, sort_keys=True)
  response = make_response(json_output, 200)
  response.mimetype = 'application/json'
  response.headers['Pragma'] = 'no-cache'
  response.headers['Expires'] = -1
  response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0'
  return(response)
  
@app.route("/tree-details")
def tree_details():
  start_time = time.time()
  try:
    tree_id = int(request.args.get('id'))
  except ValueError:
    abort(500)
  tree = Tree.query.filter_by(id=tree_id).first_or_404()
  result = {
    'id': tree.id,
    'address': tree.address,
    'postalcode': tree.postalcode,
    'city': tree.city,
    'descr': tree.descr,
    'picture': tree.picture,
    'lat': tree.lat,
    'lng': tree.lng,
    'chop_reason': tree.chop_reason,
    'type': tree.type,
    'source': tree.source,
    'tree_type_old': tree.tree_type_old
  }
  ret = {
    'status': 0,
    'duration': round((time.time() - start_time) * 1000),
    'request': {},
    'response': result
  }
  json_output = json.dumps(ret, cls=util.MyEncoder, sort_keys=True)
  response = make_response(json_output, 200)
  response.mimetype = 'application/json'
  response.headers['Pragma'] = 'no-cache'
  response.headers['Expires'] = -1
  response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0'
  return(response)

@app.route("/new-tree", methods=['GET', 'POST'])
def new_tree():
  tree = Tree()
  tree_form = NewTree(request.form, tree)
  if request.method == 'POST' and tree_form.validate():
    tree_form.populate_obj(tree)
    tree.city = 'Bochum'
    tree.public = 0
    tree.source = 'Nutzer'
    tree.created_at = datetime.datetime.now()
    tree.modified_at = datetime.datetime.now()
    db.session.add(tree)
    db.session.commit()
    msg = Message(recipients=["mail@ernestoruge.de"],
      sender="mail@ernestoruge.de",
      body=u"Freischalten nötig.",
      subject=u"Neuer Baum wurde eingereicht")
    mail.send(msg)
    if request.files['picture'].filename:
      image_data = request.files['picture'].read()
      # write new image data
      open(os.path.join(app.config['IMAGE_UPLOAD_PATH_BASE'], str(tree.id) + '.jpg'), 'w').write(image_data)
      call(['/usr/bin/convert', '-resize', '270x270', os.path.join(app.config['IMAGE_UPLOAD_PATH_BASE'], str(tree.id) + '.jpg'), os.path.join(app.config['IMAGE_UPLOAD_PATH_BASE'], str(tree.id) + '-small.jpg')])
      tree.picture = 1
      db.session.add(tree)
      db.session.commit()
    flash(u'Eintrag wurde gespeichert und wird nun geprüft. Danke fürs Mitwirken!')
    return redirect("/")
  return render_template('new-tree.html', tree_form=tree_form)

@app.route('/tree-suggest', methods=['GET', 'POST'])
def tree_suggest():
  start_time = time.time()
  tree_suggest = TreeSuggest()
  try:
    tree_suggest.tree_id = int(request.args.get('id'))
    tree_suggest.field = request.args.get('field')
    if tree_suggest.field == 'picture':
      tree_suggest.value = 0
    else:
      tree_suggest.value = request.args.get('value')
    tree_suggest.created_at = datetime.datetime.now()
  except ValueError, TypeError:
    abort(500)
  db.session.add(tree_suggest)
  db.session.commit()
  if tree_suggest.field == 'picture' and request.files['picture'].filename:
    image_data = request.files['picture'].read()
    # write new image data
    open(os.path.join(app.config['SUGGEST_IMAGE_UPLOAD_PATH_BASE'], str(tree_suggest.tree_id) + '.jpg'), 'w').write(image_data)
    call(['/usr/bin/convert', '-resize', '270x270', os.path.join(app.config['SUGGEST_IMAGE_UPLOAD_PATH_BASE'], str(tree_suggest.tree_id) + '.jpg'), os.path.join(app.config['SUGGEST_IMAGE_UPLOAD_PATH_BASE'], str(tree_suggest.tree_id) + '-small.jpg')])
    tree_suggest.value = 1
    db.session.add(tree_suggest)
    db.session.commit()
  ret = {
    'status': 0,
    'duration': round((time.time() - start_time) * 1000),
    'request': {},
    'response': True
  }
  json_output = json.dumps(ret, cls=util.MyEncoder, sort_keys=True)
  response = make_response(json_output, 200)
  response.mimetype = 'application/json'
  response.headers['Pragma'] = 'no-cache'
  response.headers['Expires'] = -1
  response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0'
  return(response)


@app.route("/information")
def information():
  return render_template('information.html')

@app.route("/impressum")
def impressum():
  return render_template('impressum.html')

@app.route("/api")
def api():
  return render_template('api.html')

@app.route("/anleitung")
def anleitung():
  return render_template('anleitung.html')

@app.route("/admin")
@basic_auth.required
def admin():
  trees = Tree.query.all()
  return render_template('admin.html', trees=trees)

@app.route("/admin-action")
@basic_auth.required
def admin_action():
  start = time.time()
  jsonp_callback = request.args.get('callback', None)
  publish = int(request.args.get('publish', 0))
  status = 0
  tree_id = 0
  if publish:
    tree = Tree.query.filter_by(id=publish).first_or_404()
    tree.public = 1
    db.session.add(tree)
    db.session.commit()
    tree_id = publish
    status = 1
  depublish = int(request.args.get('depublish', 0))
  if depublish:
    tree = Tree.query.filter_by(id=depublish).first_or_404()
    tree.public = 0
    db.session.add(tree)
    db.session.commit()
    tree_id = depublish
    status = 1
  delete = int(request.args.get('delete', 0))
  if delete:
    tree = Tree.query.filter_by(id=tree_id).first_or_404()
    #tree.public = 1
    #db.session.add(tree)
    #db.session.commit()
    tree_id = delete
    status = 1
  obj = {
    'result': status,
    'tree_id': tree_id
  }
  obj['duration'] = int((time.time() - start) * 1000)
  json_output = json.dumps(obj, sort_keys=True)
  if jsonp_callback is not None:
      json_output = jsonp_callback + '(' + json_output + ')'
  response = make_response(json_output, 200)
  response.mimetype = 'application/json'
  response.headers['Pragma'] = 'no-cache'
  response.headers['Expires'] = -1
  response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0'
  return response
  
@app.route("/geocode")
def geocode():
  start = time.time()
  jsonp_callback = request.args.get('callback', None)
  address = request.args.get('address', '')
  if address == '':
    abort(400)
  obj = {
    'result': util.geocode(address)
  }
  obj['duration'] = int((time.time() - start) * 1000)
  json_output = json.dumps(obj, sort_keys=True)
  if jsonp_callback is not None:
    json_output = jsonp_callback + '(' + json_output + ')'
  response = make_response(json_output, 200)
  response.mimetype = 'application/json'
  response.headers['Pragma'] = 'no-cache'
  response.headers['Expires'] = -1
  response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0'
  return response

