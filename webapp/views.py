# encoding: utf-8

from webapp import app
from flask import render_template, make_response, abort, request, Response
from models import *
import json
import util
import models
import time
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
      'status': tree.status
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
  response.headers['Expires'] = util.expires_date(hours=24)
  response.headers['Cache-Control'] = util.cache_max_age(hours=24)
  return(response)
  
@app.route("/tree-details")
def tree_details():
  start_time = time.time()
  try:
    tree_id = id=int(request.args.get('id'))
  except ValueError:
    abort(500)
  tree = Tree.query.filter_by(id=tree_id).first_or_404()
  result = {
    'id': tree.id,
    'street': tree.street,
    'postalcode': tree.postalcode,
    'city': tree.city,
    'descr': tree.descr,
    'picture': tree.picture,
    'lat': tree.lat,
    'lng': tree.lng,
    'status': tree.status
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
  response.headers['Expires'] = util.expires_date(hours=24)
  response.headers['Cache-Control'] = util.cache_max_age(hours=24)
  return(response)

@app.route("/new-tree")
def new_tree():
  return render_template('new-tree.html')

@app.route("/information")
def information():
  return render_template('information.html')

