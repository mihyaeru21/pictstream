# -*- coding: utf-8 -*-
from xml.sax.saxutils import unescape

import tweepy

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
            self.socketio.emit('my response', message, namespace='/stream')

    def run(self):
        stream = tweepy.Stream(self.api.auth, listener = self, retry_count = 10, retry_time = 60.0)
        stream.sample()

def _messages_from_tweet(tweet):
    screen_name = tweet.author.name
    entities = tweet.entities.get('media', []);
    return [_image_tweet_url(tweet, entity) for entity in entities if entity['type'] == 'photo']

def _image_tweet_url(tweet, entity):
    return {
        'image_url': entity['media_url'] + ':orig',
        'tweet_url': 'http://twitter.com/%s/statuses/%s' % (tweet.author.screen_name, tweet.id_str),
    }

