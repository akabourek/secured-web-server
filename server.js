const express = require('express');
const session = require('express-session');
const Keycloak = require('keycloak-connect');

const config = require('./config.json');

const app = express();
const memoryStore = new session.MemoryStore();

const keycloak = new Keycloak({store: memoryStore});

// configure express session
app.use(session({
  secret: config.secret,
  resave: false,
  saveUninitialized: true,
  store: memoryStore
}));

app.use(keycloak.middleware());

function checkRole(role) {
  return function (req, res, next) {
    const token = req.kauth.grant.access_token.content;
    if (!role) next();

    console.log(token.realm_access.roles);
    if (token.realm_access.roles.includes(role)){
      console.log('Approved');
      next();
    }else{
      console.log('Forbidden');
      res.status(403).send('Forbidden');
    }
  };
}

config.public.forEach((route) => {
  app.use(route.uri, express.static(route.static));
  console.log(`Serving public content ${route.uri} from ${route.static}`);
});
config.protected.forEach((route) => {
  app.use(route.uri, keycloak.protect(), checkRole(config?.realmRole ?? null), express.static(route.static));
  console.log(`Serving protected content ${route.uri} from ${route.static}`);
});

// start server
app.listen(config.port, () => {
  console.log('Listening on port: ' + config.port);
});