const express = require('express');
const session = require('express-session');
const Keycloak = require('keycloak-connect');

const config = require('./config.json');

const app = express();
const memoryStore = new session.MemoryStore();

const keycloak = new Keycloak({ store: memoryStore });

// configure express session
app.use(session({
  secret: config.secret,
  resave: false,
  saveUninitialized: true,
  store: memoryStore
}));

app.use(keycloak.middleware());

config.public.forEach((route) => {
  app.use(route.uri, express.static(route.static));
  console.log(`Serving public content ${route.uri} from ${route.static}`);
});
config.protected.forEach((route) => {
  app.use(route.uri, keycloak.protect(), express.static(route.static));
  console.log(`Serving protected content ${route.uri} from ${route.static}`);
});

// start server
app.listen(config.port, () => {
  console.log('Listening on port: ' + config.port);
});