const Enum = require("../config/Enum");
const CustomError = require ("./Error");

class Response {
    constructor() { }

    static successResponse (data, code = 200 ) {  //code belirtilmediyse 44 gelir.
        return {
            code,
            data
        }
    }

    static errorResponse(error) {
        if(error instanceof CustomError) {
            return {
                code: error.code,
                error: {
                    message: error.message,
                    description: error.description
                }
            }

        }
        return {
            code: Enum.HTTP_CODES.INT_SERVER_ERROR,
            error: {
                message: "Unknown Error!",
                description: error.message
            }
        }

    }
}
module.exports = Response;

/* Başarılı ve başarısız yanıtları JSON formatında standart bir yapı ile döndürmeye yarar.*/