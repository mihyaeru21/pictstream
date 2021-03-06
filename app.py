# -*- coding: utf-8 -*-
from threading import Thread

from flask import Flask, render_template, request
from flask.ext.socketio import SocketIO
import tweepy

from twitter_listener import TwitterListener

app = Flask(__name__, static_url_path='/static')
app.config.from_object('config.Config')
socketio = SocketIO(app)

_stream_thread = None
def public_stream_in_background():
    listner = TwitterListener(
        app.config['API_KEY'],
        app.config['API_SECRET'],
        app.config['ACCESS_KEY'],
        app.config['ACCESS_SECRET'],
        socketio)
    listner.run()

@app.route('/')
def index():
    return app.send_static_file('index.html')

@socketio.on('connect', namespace='/stream')
def test_connect():
    print 'connected!'
    global _stream_thread
    if _stream_thread is None:
        _stream_thread = Thread(target=public_stream_in_background)
        _stream_thread.start()

@socketio.on('disconnect', namespace='/stream')
def test_disconnect():
    print 'Client disconnected'


if __name__ == '__main__':
    socketio.run(app)

