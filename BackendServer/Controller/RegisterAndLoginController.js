import Users from "../Model/Users.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { use } from "react";

const RegisterAndLoginController = {

  register: async (req, res) => {
    const { name, email, password, checked  , role} = req.body;

    try {
      const check = await Users.findOne({ email });

      if (check) {
        return res.status(400).json({
          info: "Already Registered",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const register = await Users.create({
        name,
        email,
        password: hashedPassword,
        role , 
        checked,
      });

      return res.status(201).json({
        message: "Register Successfully",
        user: register,
      });

    } catch (err) {
      return res.status(500).json({
        error: err.message,
      });
    }
  },

 login: async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await Users.findOne({ email });

    if (!user) {
      return res.status(400).json({
        info: "User not registered",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        error: "Invalid password",
      });
    }

    const accessToken = jwt.sign(
      {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      "ACCESS_TOKEN",
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      "REFRESH_TOKEN",
      { expiresIn: "7d" }
    );

    // Access Token Cookie
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 15 * 60 * 1000,
    });


    // Refresh Token Cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });


    return res.status(200).json({
      ok: true,
      message: "Login successful",
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (err) {
    return res.status(500).json({
      error: err.message,
    });
  }
},

 refreshToken: (req, res) => {
  try {

    const token = req.cookies?.refreshToken;


    if (!token) {

      return res.status(401).json({
        ok: false,
        error: "No refresh token",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.REFRESH_TOKEN_SECRET || "REFRESH_TOKEN"
    );


    const newAccessToken = jwt.sign(
      {
        id: decoded.id,
        name: decoded.name,
        email: decoded.email,
        role: decoded.role,
      },
      process.env.ACCESS_TOKEN_SECRET || "ACCESS_TOKEN",
      { expiresIn: "15m" }
    );

    return res.status(200).json({
      ok: true,
      newAccessToken,
    });

  } catch (err) {

    return res.status(403).json({
      ok: false,
      error: err.message,
    });
  }
}


};

export default RegisterAndLoginController;