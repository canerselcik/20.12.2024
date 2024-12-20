const xlsx = require("node-xlsx");


class Export {


        constructor() {

        }


        /**
         * 
         * @param {Array} titles  Excel tablosunun başlıkları.                          ["İsim-Soyisim","Okul No","Soru"] 
         * @param {Array} columns  Excel tablosuna yazılacak verilerin isimleri.         ["isim-soyisim","okul No","soru"] 
         * @param {Array} data Excel tablosuna yazılacak veriler
         */
        toExcel(titles, columns, data= []) {

            let rows =[];
            
            /* 
            [
            ["İsim-Soyisim","Okul No","Soru"] 
            ["DATA CEVAP"]
            ]
            */
            rows.push(titles)

            for (let i = 0; i<data.length; i++) {
                let item  = data[i];
                let cols= [];


                for(let j = 0; j < columns.length; j++) {
                    cols.push(item[columns[j]])

                }

                rows.push(cols);

            }

           return xlsx.build([{name: "Sheet", data:rows}]);

        }
}

module.exports= Export;