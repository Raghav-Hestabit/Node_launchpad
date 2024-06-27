import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import * as http from "http";
import * as path from "path";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
import apiErrorHandler from '../helper/apiErrorHandler';
const app = new express();
const server = http.createServer(app);
const root = path.normalize(`${__dirname}/../..`);


class ExpressServer {
    constructor() {


      app.use(express.json({ limit: '1000mb' }));
  
      app.use(express.urlencoded({ extended: true, limit: '1000mb' }))
  
      app.use(morgan('dev'))
  
      app.use(
        cors({
          allowedHeaders: ["Content-Type", "token", "authorization"],
          exposedHeaders: ["token", "authorization"],
          origin: "*",
          methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
          preflightContinue: false,
        })
      );
    }
    router(routes) {
      routes(app);
      return this;
    }
  
    configureSwagger(swaggerDefinition) {
      const options = {
        swaggerDefinition,
        apis: [
          path.resolve(`${root}/server/api/controllers/**/*.js`),
          path.resolve(`${root}/api.yaml`),
        ],
      };
  
      app.use(
        "/api-docs",
        swaggerUi.serve,
        swaggerUi.setup(swaggerJSDoc(options))
      );
      return this;
    }
  
    handleError() {
      app.use(apiErrorHandler);
  
      return this;
    }
  
    async configureDb(dbUrl) {
      try {
        mongoose.connect(dbUrl, {});
        
        console.log('Mongodb connection established');
        return this;
      } catch (err) {
        console.error(`Error in mongodb connection ${err.message}`);
        throw err; 
      }
    }
  
    // })
    async intailizeScheduler(){
      // let shedule = new scheduler()

    }
  
    listen(port) {
      server.listen(port, () => {
        console.log(`secure app is listening @port ${port}`, new Date().toLocaleString());
      });
      this.intailizeScheduler()
      return app;
    }
  }
  

  export default ExpressServer;