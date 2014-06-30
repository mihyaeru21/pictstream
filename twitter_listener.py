# -*- coding: utf-8 -*-
import re
import sys
import os.path
import glob
import urllib2
import time
import datetime
from threading import Thread
from xml.sax.saxutils import unescape

import tweepy

_remove_th = 60
_cleanup_thread = None
_image_dir = os.path.join('static', 'img')

class TwitterListener(tweepy.streaming.StreamListener):
    def __init__(self, api_key, api_secret, access_key, access_secret, socketio):
        super(TwitterListener, self).__init__()
        auth = tweepy.OAuthHandler(api_key, api_secret)
        auth.set_access_token(access_key, access_secret)
        self.api = tweepy.API(auth_handler = auth, api_root = '/1.1', secure = True)
        self.socketio = socketio

    def on_status(self, tweet):
        lang = getattr(tweet, 'lang', u'')
        if lang != u'ja':
            return
        text = unescape(tweet.text)
        for message in _messages_from_tweet(tweet):
            if message['image_url'] is not None:
                self.socketio.emit('my response', message, namespace='/stream')

    def run(self):
        global _cleanup_thread
        if _cleanup_thread is None:
            _cleanup_thread = Thread(target=cleanup_image_dir)
            _cleanup_thread.start()
        # twitter
        stream = tweepy.Stream(self.api.auth, listener = self, retry_count = 10, retry_time = 60.0)
        stream.sample()

def _messages_from_tweet(tweet):
    screen_name = tweet.author.name
    entities = tweet.entities.get('media', []);
    return [_image_tweet_url(tweet, entity) for entity in entities if entity['type'] == 'photo']

def _image_tweet_url(tweet, entity):
    saved_image_path = _save_image(entity['media_url'] + ':thumb')
    return {
        'image_url': saved_image_path,
        'tweet_url': 'http://twitter.com/%s/statuses/%s' % (tweet.author.screen_name, tweet.id_str),
    }

def _save_image(image_url):
    """画像をDLして、自鯖に置いたファイルのパスを返す"""
    save_path = _get_filepath(image_url)
    if os.path.exists(save_path):
        return save_path
    try:
        image_fp = urllib2.urlopen(image_url)
        with open(save_path, 'wb') as fp:
            fp.write(image_fp.read())
    except:
        print 'error: ', sys.exc_info()[0]
        return None
    return save_path

r = re.compile(':(thumb|large|orig)')
def _get_filepath(image_url):
    name_with_size = os.path.basename(image_url)
    name = r.sub('', name_with_size)
    return os.path.join(_image_dir, name)


def cleanup_image_dir():
    while (True):
        time.sleep(_remove_th)
        _remove_old_images()

def _remove_old_images():
    path = os.path.join(_image_dir, '*')
    files = glob.glob(path)
    for filename in files:
        if time.time() - os.path.getctime(filename) > _remove_th:
            os.remove(filename)
            print 'removed:', filename

