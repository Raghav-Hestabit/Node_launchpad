import config from 'config';
import routes from './route';
import Server from './common/server';

const dbUrl = `mongodb+srv://${process.env.ATLAS_CONFIG_DATABASE_USER}:${process.env.ATLAS_CONFIG_DATABASE_PASS}@${process.env.ATLAS_CONFIG_CLUSTER_HOST}/${process.env.ATLAS_CONFIG_DATABASE_NAME}?retryWrites=true&w=majority`;



const server = new Server()
  .router(routes)
  .configureSwagger(config.get('swaggerDefinition'))
  .handleError()
  .configureDb(dbUrl)
  .then((_server) => _server.listen(config.get('port')));


export default server;