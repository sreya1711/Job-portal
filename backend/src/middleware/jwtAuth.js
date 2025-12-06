// middleware/jwtAuth.js
import jwt from 'jsonwebtoken';

const jwtAuth = (req, res, next) => {
  // Authorization: Bearer <token>
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    // Replace 'your_jwt_secret' with your actual secret key from .env
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.user = decoded; // Attach decoded user info (e.g., email, id) to req.user
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export default jwtAuth;
