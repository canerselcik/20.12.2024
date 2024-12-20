var express = require('express');
var router = express.Router();

const fs = require("fs");

let routes = fs.readdirSync(__dirname);

for (let route of routes) {
  if (route.includes(".js") && route != "index.js") {
    router.use("/"+route.replace(".js", ""), require('./'+route));
  }
}


module.exports = router;
 /*
 Bu yapı, manuel olarak her bir rotayı eklemek zorunda kalmadan, dizindeki rota dosyalarını otomatik olarak yükleyip uygulamaya dahil etmenizi sağlar. Özellikle büyük projelerde, bu yöntemle rotaları modüler ve düzenli bir şekilde yönetebilirsiniz.
 */