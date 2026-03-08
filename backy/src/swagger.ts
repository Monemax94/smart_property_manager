import swaggerAutogen from 'swagger-autogen';

const doc = {
    info: {
        title: 'Smart Home API',
        description: 'Comprehensive API documentation for the Smart Home project, covering User Management, Properties, Payments, and more.',
        version: '1.0.0',
    },
    host: 'localhost:8080',
    basePath: '/',
    schemes: ['http', 'https'],
    consumes: ['application/json'],
    produces: ['application/json'],
    tags: [
        { name: 'Auth', description: 'Authentication and Registration' },
        { name: 'User', description: 'User Profile and Management' },
        { name: 'Property', description: 'Estate and Property Management' },
        { name: 'Payment', description: 'Stripe and Paystack Payments' },
        { name: 'Wishlist', description: 'User Wishlists' },
        { name: 'ActivityLog', description: 'System Activity Logs' },
        { name: 'Address', description: 'User Address Management' },
        { name: 'Carousel', description: 'Homepage Carousel Items' },
        { name: 'Currency', description: 'Currency and Exchange Rates' }
    ],
    securityDefinitions: {
        bearerAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'Authorization',
            description: 'Please enter JWT with Bearer prefix'
        }
    }
};

const outputFile = './src/openapi.json';
const endpointsFiles = ['./src/app.ts'];

/* Execute the swagger-autogen */
swaggerAutogen({ openapi: '3.0.0' })(outputFile, endpointsFiles, doc).then(() => {
    console.log('Swagger documentation generated successfully');
});
