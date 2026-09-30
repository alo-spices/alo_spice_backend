const jwt = require("jsonwebtoken");

const authMiddleware = async (req, res, next) => {

    try {

        console.log("=================================");
        console.log("AUTH MIDDLEWARE HIT");
        console.log("URL:", req.originalUrl);
        console.log("METHOD:", req.method);
        console.log(
            "AUTHORIZATION:",
            req.headers.authorization
        );
        console.log("=================================");


        const authHeader =
            req.headers.authorization;


        if (!authHeader) {

            console.log("❌ NO AUTHORIZATION HEADER");

            return res.status(401).json({

                success: false,

                message:
                    "Authorization token is required."

            });

        }


        if (!authHeader.startsWith("Bearer ")) {

            console.log(
                "❌ INVALID AUTH FORMAT:",
                authHeader
            );

            return res.status(401).json({

                success: false,

                message:
                    "Invalid authorization format."

            });

        }


        const token =
            authHeader.split(" ")[1];


        if (!token) {

            console.log("❌ TOKEN NOT FOUND");

            return res.status(401).json({

                success: false,

                message:
                    "Token not found."

            });

        }


        console.log(
            "TOKEN RECEIVED:",
            token.substring(0, 20) + "..."
        );


        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );


        console.log("✅ TOKEN DECODED:");
        console.log(decoded);


        req.user = {

            id: decoded.id,

            role: decoded.role,

            warehouseId:
                decoded.warehouseId || null,

            areaId:
                decoded.areaId || null

        };


        console.log("✅ REQ.USER:");
        console.log(req.user);


        next();

    }

    catch (error) {

        console.log(
            "❌ AUTH MIDDLEWARE ERROR:",
            error
        );


        if (
            error.name ===
            "TokenExpiredError"
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Token has expired. Please login again."

            });

        }


        return res.status(401).json({

            success: false,

            message:
                "Invalid authentication token."

        });

    }

};

module.exports = authMiddleware;