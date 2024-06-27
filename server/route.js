//v7 imports



import user from "./api/controllers/user/routes";


/**
 *
 *
 * @export
 * @param {any} app
 */

export default function routes(app) {
  app.use("/api/user", user);
  
  return app;
}

