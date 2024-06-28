//v7 imports



import user from "./api/controllers/user/routes";
import admin from "./api/controllers/admin/routes";


/**
 *
 *
 * @export
 * @param {any} app
 */

export default function routes(app) {
  app.use("/api/user", user);
  app.use("/api/admin", admin);
  
  return app;
}

