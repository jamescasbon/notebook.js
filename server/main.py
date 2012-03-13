import tornado.ioloop
import tornado.web
import pymongo
import uuid

def make_uuid():
    return str(uuid.uuid4())


class BaseHandler(tornado.web.RequestHandler):

    def initialize(self):
        db = self.application.settings['db']
        self.user_db = db[self.application.settings['db_name']]['users']
        self.nb_db = db[self.application.settings['db_name']]['notebooks']
        self.cells_db = db[self.application.settings['db_name']]['cells']

    def get_current_user(self):
        """ If the cookie is set, look up the user.  Otherwise create anon """
        cookie = self.get_secure_cookie("user")

        if cookie is None:
            uid = make_uuid()
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



class NotebookHandler(BaseHandler):

    def get(self, uid, nbid):
        self.write('<h1>Notebook</h1>%s,%s' % (uid, nbid))


class NewNotebookHandler(BaseHandler):

    def get(self):
        self.write('<html><body><h1>New notebook</h1>'

                    '<form action="/notebook/new" method="post">'
                   'Name: <input type="text" name="name">'
                   '<input type="submit" value="Create">'
                   '</form></body></html>')

    def post(self):
        self.write('creating notebook ' + self.get_argument('name'))
        notebook = dict(
            user = self.get_current_user()['uid'],
            uid = make_uuid(),
            name = self.get_argument('name')
        )
        self.nb_db.insert(notebook)
        self.redirect('/nb/%(user)s/%(uid)s/' % notebook)




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
        (r"/nb/(.*)/(.*)/", NotebookHandler),
        (r'/login', LoginHandler)
    ],
    # TODO: config file
    cookie_secret="61oETzKXQAGaYdkL5gEmGeJJFuYh7EQnp2XdTP1o/Vo=",
    debug=True,
    db = pymongo.Connection('mongodb://test:test@localhost/dev'),
    db_name = 'dev'
)

if __name__ == "__main__":
    application.listen(8888)
    tornado.ioloop.IOLoop.instance().start()



