const express = require('express');
const app = express();
const mongoose = require('mongoose');
require('dotenv').config();
const SwaggerUIExpress = require('swagger-ui-express');
const swaggerDocument = require('./configs/swagger.config');

// JSON ONLY
app.use(express.json());

// IMPORT ROUTES
const homeRoutes = require('./routes/home.routes');
const authRoutes = require('./routes/auth.routes');
const groupRoutes = require('./routes/group.routes');

// USE ROUTES
app.use('/', homeRoutes);
app.use('/doc', SwaggerUIExpress.serve, SwaggerUIExpress.setup(swaggerDocument));
app.use('/auth', authRoutes);
app.use('/group', groupRoutes);

// DATABASE CONNECTION
mongoose.connect(process.env.MONGODB_URI);
mongoose.connection
    .once('open', () => console.log("MongoDB Connected"))
    .on('error', (error) =>{console.log("Error", error);
});

// START SERVER
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server Running: http://localhost:${port}`);
});