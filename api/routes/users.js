var express = require('express');
const bcrypt = require('bcrypt');  //şifre güvenliği --npm install bcrypt
const is = require("is_js");  //Kontrol Fonksiyonları: E-posta, URL, telefon numarası gibi özel formatların doğrulanması.
var router = express.Router();
const config = require('../config');
const Users = require('../db/models/Users');
const Response = require ('../lib/Response'); //Başarılı ve başarısız yanıtları JSON formatında standart bir yapı ile döndürmeye yarar.
const CustomError = require('../lib/Error') // Özel hata mesajları ve yapıları oluşturmak. 
const Enum = require("../config/Enum"); //herkesin anlayabileceği http codeleri tutat
const Feedback = require('../db/models/Feedback'); // feedback ankete verilen cevapları dahil ettik.
const excelExport = new (require("../lib/Export"))();
const fs = require ("fs")  // bu 2 modül excel çıktısı için.
const multer = require("multer"); // excel yüklemek için req ile atılan dosyayı yükelyebiliyoruz.
const path = require('path');
const Import = new(require("../lib/Import")) ();


let multerStorage = multer.diskStorage({

  destination: (req, file, next) => {
    next(null,config.FILE_UPLOAD_PATH)
  },
    filename:(req, file , next) => {
      next(null,file.fieldname + "_" + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({storage: multerStorage}).single("dinamikanket_file"); //excel çıktısı yüklemek için.



router.post('/register', async(req, res, ) => {
  let body = req.body; // bize gönderilen body'i aldık
  try {
      // E-posta veya okul numarası ile kullanıcıyı kontrol et
      let user = await Users.findOne({ 
          $or: [
              { email: body.email }, 
              { okul_no: body.okul_no }
          ]
      });
  
      if (user) {
          // Kullanıcı zaten mevcutsa, hangi alana göre mevcut olduğunu belirtin
          if (user.email === body.email) {
              return res.status(Enum.HTTP_CODES.CONFLICT).json({ message: "Bu e-posta adresi ile zaten kayıtlı bir kullanıcı bulunmaktadır." });
          }
          if (user.okul_no === body.okul_no) {
              return res.status(Enum.HTTP_CODES.CONFLICT).json({ message: "Bu okul numarası ile zaten kayıtlı bir kullanıcı bulunmaktadır." });
          }
      }
    

    if(!body.email) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Doğrulama Hatasi", "Email Alani girilmemiş.");
    
    if(is.not.email(body.email)) throw new CustomError (Enum.HTTP_CODES.BAD_REQUEST, "Doğrulama Hatasi", "Email formati yanliş girilmiş.");

    if(!body.sifre) throw new CustomError (Enum.HTTP_CODES.BAD_REQUEST,"Doğrulama Hatasi", "Sifre alani girilmemiş.");

    if(body.sifre.length < Enum.PASS_LENGTH) {
      throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,"Şifre uzunluğu 8'den büyük olmalidir.") // ???
    } 

    let sifre = bcrypt.hashSync(body.sifre, bcrypt.genSaltSync(8),null); 
    //Bu tür bir şifreleme, kullanıcı şifrelerinin güvenliğini sağlamak için yaygın olarak kullanılır. Şifrelerin düz metin olarak saklanmaması, olası bir veri sızıntısı durumunda kullanıcıların şifrelerinin ele geçirilmesini zorlaştırır.


    let createdUser = await Users.create({ 
      isim:body.isim,
      soyisim:body.soyisim,
      email:body.email,
      okul_no: body.okul_no,
      sifre
    });
    
    /*res.status(Enum.HTTP_CODES.CREATED).json(Response.successResponse({success: true}, Enum.HTTP_CODES.CREATED)); 
    code 200 dönmesine rağmen frontendde buna karşılık gelmiyor hata alıyoruz.
    */

    res.status(200).json({ success: true, message: "Kayit başarılı!" }); 


  } catch (error) {
    let errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
    
  }

});

/* GET users listing. */
router.get('/', async(req, res, next) => {

  try {
    let users = await Users.find({});

    res.json(Response.successResponse(users));

  }catch (err){
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(Response.errorResponse(err));

  }

});

router.post('/add', async(req, res, ) => {
  let body = req.body; //bize gönderilen bodyi aldık
  try {
    
    if (!body.okul_no) throw new CustomError (Enum.HTTP_CODES.BAD_REQUEST,"Doğrulama Hatasi!", "okul_no alani doldurulmalidir.");
    
    let users = new Users({
      isim: body.isim,
      soyisim: body.soyisim,
      email: body.email,
      okul_no: body.okul_no,
      sifre: body.sifre
    });

    await users.save();

    res.json(Response.successResponse({success: true}));

  } catch (error) {
   let errorResponse = Response.errorResponse(error);
   res.status(errorResponse.code).json(errorResponse);
  }

});


router.post('/update', async(req, res, ) => {
  let body = req.body; //bize gönderilen bodyi aldık
  try {
    let updates = {};

    if(!body._id) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,"Doğrulama Hatasi","Ortak alanlari doldurunuz.");

    if(body.sifre && body.sifre.length < Enum.PASS_LENGTH) {
      updates.sifre=bcrypt.hashSync(body.sifre, bcrypt.genSaltSync(8),null);
    }

    if(body.isim) updates.isim = body.isim;
    if(body.soyisim) updates.soyisim = body.soyisim;
    if(body.email) updates.email = body.email;
    if(body.okul_no) updates.okul_no = body.okul_no;

    await Users.updateOne({_id: body._id},updates);

    res.json(Response.successResponse({ success: true}));

  } catch (error) {
   let errorResponse = Response.errorResponse(error);
   res.status(errorResponse.code).json(errorResponse);
  }

}); 

router.post('/delete', async (req, res) => {
  let body = req.body;

  try {
    
    if(!body._id) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,"Doğrulama Hatasi","Ortak alanlari doldurunuz.");

    await Users.deleteOne({_id: body._id});

    res.json(Response.successResponse({success: true}));

  } catch (error) {
    let errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
    
  }
});

router.post('/feedback', async (req, res) => {
  const feedbackList = req.body; // Geri bildirim formundan gelen veriler
  try {
    for (const feedback of feedbackList) {
      const { okul_no, soru, feedback: userFeedback } = feedback;

      // Kullanıcının okul_no bilgisini kontrol et
      if (!okul_no) {
        throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Doğrulama Hatası", "Okul numarası girilmemiş.");
      }

      // Kullanıcıyı okul_no ile bul
      const user = await Users.findOne({ okul_no });
      if (!user) {
        throw new CustomError(Enum.HTTP_CODES.NOT_FOUND, "Kullanıcı Bulunamadı", "Bu okul numarasına sahip bir kullanıcı bulunamadı.");
      }

      // Feedback oluştur
      const feedbackEntry = new Feedback({
        okul_no: user.okul_no,
        soru,        // Kullanıcının girdiği soru metni
        feedback: userFeedback  // Kullanıcının girdiği geri bildirim
      });

      // Feedback veritabanına kaydet
      await feedbackEntry.save();
    }

    // Başarılı yanıt gönder
     /*res.status(Enum.HTTP_CODES.CREATED).json(Response.successResponse({ success: true }, Enum.HTTP_CODES.CREATED)); */

     res.status(200).json({ success: true, message: "Feecback başarılı!" }); 
    
  } catch (error) {
    const errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

// Geri bildirim istatistiklerini alma
router.get('/feedback/stats', async (req, res) => {
  try {
    // Sorulara göre geri bildirimleri gruplama
    const feedbackStats = await Feedback.aggregate([
      {
        $group: {
          _id: {
            soru: "$soru",
            feedback: "$feedback" // Her bir geri bildirimi kategorize et
          },
          count: { $sum: 1 } // Her bir kategorinin sayısını tut
        }
      },
      {
        $group: {
          _id: "$_id.soru", // Sorulara göre gruplama
          feedbackCounts: {
            $push: {
              feedback: "$_id.feedback",
              count: "$count"
            }
          }
        }
      }
    ]);

    // İstatistik verilerini dön
    const stats = feedbackStats.map(stat => ({
      soru: stat._id,
      feedback: stat.feedbackCounts
    }));

    // Başarılı yanıt döndür
    res.status(200).json({
      success: true,
      message: "İstatistikler başarıyla alındı!",
      data: stats // İstatistik verilerini ekliyoruz
    });
  } catch (error) {
    const errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});


router.post('/login', async (req, res)=>{

  let body=req.body;

try {

    if(!body.email) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,"Doğrulama Hatasi","Email alanini doldurunuz.");

    if(!body.sifre) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,"Doğrulama Hatasi","Şifre alanini doldurunuz.");

    let user = await Users.findOne({email: body.email});
    
    if(!user) {
      throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,"Doğrulama Hatasi.","Kullanici Bulunamadi.");
    }

    const sifresorgu = await bcrypt.compare(body.sifre, user.sifre);
    if(!sifresorgu) {
      throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,"Doğrulama Hatasi","Şifre yanliş.")
    }
    
    /*res.json(Response.successResponse({success: true})); 
    bu şekilde geri dönüş alınca login sayfasından home sayfasına atmıyor.
    response içerisinde success code 200 ????*/

     // Giriş başarılı: İsim, soyisim ve okul_no bilgilerini yanıt olarak döndürün
     res.status(200).json({
      success: true,
      message: "Giriş başarili!",
      userData: {
        isim: user.isim,
        soyisim: user.soyisim,
        okul_no: user.okul_no,
      }
    });

    
} catch (error) {

  let errorResponse = Response.errorResponse(error);
  res.status(errorResponse.code).json(errorResponse);

}

});

router.post('/export', async (req, res)=>{
  try {
    let feedbacks = await Feedback.find({});

    let excel = excelExport.toExcel(
      ["OKUL_NO","SORU","FEEDBACK"],
      ["okul_no","soru","feedback"],
      feedbacks
    )

    let filePath= __dirname+"/../tmp/feedback_excel_"+Date.now()+".xlsx";

    fs.writeFileSync(filePath, excel, "UTF-8");

    res.download(filePath);

    // fs.unlinkSync(filePath);

  }catch (err){
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(Response.errorResponse(err));

  }

});

router.post('/import', upload, async(req, res)=> {

  try {

    let file = req.file;
    let body= req.body;

     let rows = Import.fromExcel(file.path);

     for(let i=1;i<rows.length;i++) {
          let[isim, soyisim, email, okul_no, sifre] = rows[i];

          if(email) {
          await Users.create({
            isim,
            soyisim,
            email,
            okul_no,
            sifre
          });
        }
     }

     res.status(Enum.HTTP_CODES.CREATED).json(Response.successResponse(req.body, Enum.HTTP_CODES.CREATED));

  } catch (error) {

    let errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(Response.errorResponse(error));

  }

});

router.post('/change-password', async (req, res) => {
  let body = req.body; // Bize gönderilen body'yi aldık
  try {
    // Gerekli alanların eksik olup olmadığını kontrol et
    if (!body.email) {
      return res.status(Enum.HTTP_CODES.BAD_REQUEST).json({
        success: false,
        message: "Email alanını doldurunuz."
      });
    }
    if (!body.oldPassword) {
      return res.status(Enum.HTTP_CODES.BAD_REQUEST).json({
        success: false,
        message: "Eski şifre alanını doldurunuz."
      });
    }
    if (!body.newPassword) {
      return res.status(Enum.HTTP_CODES.BAD_REQUEST).json({
        success: false,
        message: "Yeni şifre alanını doldurunuz."
      });
    }
    if (!body.confirmNewPassword) {
      return res.status(Enum.HTTP_CODES.BAD_REQUEST).json({
        success: false,
        message: "Yeni şifrenin teyit alanını doldurunuz."
      });
    }

    // Yeni şifre uzunluğunu kontrol et
    if (body.newPassword.length < Enum.PASS_LENGTH) {
      return res.status(Enum.HTTP_CODES.BAD_REQUEST).json({
        success: false,
        message: `Şifre en az ${Enum.PASS_LENGTH} karakter uzunluğunda olmalıdır.`
      });
    }

    // Yeni şifre ile tekrarı aynı mı kontrol et
    if (body.newPassword !== body.confirmNewPassword) {
      return res.status(Enum.HTTP_CODES.BAD_REQUEST).json({
        success: false,
        message: "Yeni şifreler birbiriyle uyuşmuyor."
      });
    }

    // Kullanıcıyı email ile bul
    let user = await Users.findOne({ email: body.email });
    if (!user) {
      return res.status(Enum.HTTP_CODES.NOT_FOUND).json({
        success: false,
        message: "Belirtilen email adresine ait kullanıcı bulunamadı."
      });
    }

    // Eski şifre doğru mu kontrol et
    const isMatch = bcrypt.compareSync(body.oldPassword, user.sifre);
    if (!isMatch) {
      return res.status(Enum.HTTP_CODES.BAD_REQUEST).json({
        success: false,
        message: "Eski şifre yanlış."
      });
    }

    // Şifreyi güncelle
    let hashedPassword = bcrypt.hashSync(body.newPassword, bcrypt.genSaltSync(8));
    user.sifre = hashedPassword;
    await user.save();

    // Başarı durumunda yanıt
    res.status(Enum.HTTP_CODES.OK).json({
      success: true,
      message: "Şifre başarıyla değiştirildi."
    });

  } catch (error) {
    // Hata durumunda yanıt
    console.error(error);
    res.status(Enum.HTTP_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Bir hata oluştu. Lütfen tekrar deneyin."
    });
  }
});
//sadece isim soyisim okulno
router.get('/get', async (req, res) => {
  try {
    const users = await Users.find({}, 'isim soyisim email okul_no');
    res.json({ success: true, data: users });
  } catch (err) {
    console.error(err); // Hata detaylarını konsola yaz
    res.status(500).json({ success: false, message: "Veritabanı hatası" });
  }
});


module.exports = router; 