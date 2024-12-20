const xlsx = require ("node-xlsx");
const CustomError = require ("./Error");
const { HTTP_CODES } = require("../config/Enum");

class Import {

    constructor() {

    }
    fromExcel(filePath) {
        
        let workSheets = xlsx.parse(filePath);

        if(!workSheets || workSheets.length ==0) throw new CustomError (HTTP_CODES.BAD_REQUEST,"Geçersiz Excel Formati.","Geçersiz.");

        let rows = workSheets[0].data;

        if(rows?.length == 0)   throw new CustomError (HTTP_CODES.NOT_ACCEPTABLE,"Dosya Boş.","Excel dosyasi boş.");

        return rows;
    }
}
module.exports = Import;