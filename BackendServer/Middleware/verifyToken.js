import jwt from "jsonwebtoken";


const verifyToken = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) return res.sendStatus(401);

  const token = auth.split(" ")[1];

  jwt.verify(token, "ACCESS_TOKEN", (err, user) => {
    if (err) return res.sendStatus(403);
  
    req.user = user;
    next();
  });
};

export default verifyToken;