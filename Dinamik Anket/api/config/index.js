module.exports = {
        "PORT": process.env.PORT || "5000",
        "LOG_LEVEL": process.env.LOG_LEVEL || "debug",
        "CONNECTION_STRING": process.env.CONNECTION_STRING || "mongodb://localhost:27017/dinamik_anket",
        "FILE_UPLOAD_PATH": process.env.FILE_UPLOAD_PATH //excel yüklemek için.
}
