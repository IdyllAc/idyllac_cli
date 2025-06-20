// middleware/jwtMiddleware.js
const jwt = require('jsonwebtoken');

// Middleware to protect routes
module.exports = function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']; // Get token from headers (Bearer <token>)

    if (!authHeader || !authHeader.startsWith('Bearer')) {   // Check if the authorization header is present and starts with 'Bearer'
        return res.status(401).json({ message: 'Authorization header missing or malformed' });
      }

      const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401). json({ message: 'No token is found: Access token is missing'});
    }

    // Verify token
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token or expired'}); 
        }

        req.user = user; // Attach decoded user to request
        next();
    });
};


