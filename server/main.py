import tornado.ioloop
import tornado.web
import pymongo
import uuid

class BaseHandler(tornado.web.RequestHandler):

    def initialize(self):
        db = self.application.settings['db']
        self.user_db = db['dev']['users']

    def get_current_user(self):
        """ If the cookie is set, look up the user.  Otherwise create anon """
        cookie = self.get_secure_cookie("user")

        if cookie is None:
            uid = str(uuid.uuid4())
            user = dict(uid=uid, anonymous=True)
            self.user_db.insert(user)

            self.set_secure_cookie('user', uid)

        else:
            user = self.user_db.find_one(dict(uid=cookie))

        return user

class MainHandler(BaseHandler):
    def get(self):
        # TODO: create index page
        name = tornado.escape.xhtml_escape(self.current_user['uid'])
        self.write("<h1>Hi</h1><a href='/notebook/new'>New notebook</a>")



class NewNotebookHandler(BaseHandler):

    def get(self):
        self.write('<html><body><form action="/notebook/new" method="post">'
                   'Name: <input type="text" name="name">'
                   '<input type="submit" value="Create">'
                   '</form></body></html>')

    def post(self):
        self.write('creating notebook ' + self.get_argument('name'))




class LoginHandler(BaseHandler):
    def get(self):
        # TODO: add password
        self.write('<html><body><form action="/login" method="post">'
                   'Name: <input type="text" name="name">'
                   '<input type="submit" value="Sign in">'
                   '</form></body></html>')

    def post(self):
        self.set_secure_cookie("user", self.get_argument("name"))
        self.redirect("/")

# TODO sign up handler

application = tornado.web.Application([
        (r"/", MainHandler),
        (r"/notebook/new", NewNotebookHandler),
        (r'/login', LoginHandler)
    ],
    # TODO: config file
    cookie_secret="61oETzKXQAGaYdkL5gEmGeJJFuYh7EQnp2XdTP1o/Vo=",
    debug=True,
    db = pymongo.Connection('mongodb://test:test@localhost/')
)

if __name__ == "__main__":
    application.listen(8888)
    tornado.ioloop.IOLoop.instance().start()



