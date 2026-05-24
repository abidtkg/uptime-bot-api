const swaggerJsDoc = require('swagger-jsdoc');
// SWAGGER CONFIGARATION
const swaggerOptions = {
    swaggerDefinition: {
        info: {
            title: "Uptime Bot API",
            description: "This is Uptime Bot API documentation. Uptime Bot is a website monitoring platform.",
            termsOfService: "#",
            version: "1.0.0"
        },
        contact: {
            name: "API Support",
            url: "#",
            email: "abidtkg@gmail.com"
        },
        servers: [
            {
                "url": "http://locahost:3000",
                "description": "Development server"
            }
        ],
        basePath: '',
        securityDefinitions: {
            APIKeyHeader: {
                type: 'apiKey',
                in: 'header',
                name: 'token'
            },
        }
    },
    apis: ['routes/*.js']
}

const swaggerDocs = swaggerJsDoc(swaggerOptions);
module.exports = swaggerDocs;