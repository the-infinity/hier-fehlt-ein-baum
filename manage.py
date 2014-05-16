# encoding: utf-8

from flask.ext.script import Manager

from webapp import app
from webapp import util

manager = Manager(app)

@manager.command
def sync_gis():
  util.sync_gis()

if __name__ == "__main__":
  manager.run()