import swaggerJSDoc from 'swagger-jsdoc';
import { env } from '../config/env';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Truetag API',
      version: '1.0.0',
      description: 'Truetag ecommerce aggregator API',
    },
    servers: [
      { url: `http://localhost:${env.port}/api/${env.apiVersion}` },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      { bearerAuth: [] },
    ],
  },
  apis: ['src/routes/**/*.ts'],
};

export const specs = swaggerJSDoc(options);
