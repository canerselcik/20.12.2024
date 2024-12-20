const express = require("express");
const bcrypt = require('bcrypt');
const Response = require ('../lib/Response');
const CustomError = require('../lib/Error');
const Enum = require("../config/Enum");
const Admin = require("../db/models/Admin");
const router = express.Router();


router.get("/", async (req, res)=>{

    try {
        let admin= await Admin.find({});

        res.json(Response.errorResponse(admin));
        
    } catch (error) {

        let errorResponse= Response.errorResponse(error);

        res.status(errorResponse.code).json(Response.errorResponse(error));

    }
});

router.post("/add", async (req,res)=> {
    let body= req.body;

    try {

        if(!body.email) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,"Doğrulama Hatasi...","Boş Alanlari doldurunuz..");
        
        if(!body.sifre) throw new CustomError (Enum.HTTP_CODES.BAD_REQUEST,"Doğrulama Hatasi", "Sifre alani girilmemiş.");

        if(body.sifre.length < Enum.PASS_LENGTH) {
          throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,"Doğrulama Hatasi"+Enum.PASS_LENGTH,"Şifre uzunluğu büyük olmamalidir.") // ???
        } 
    
        let sifre = bcrypt.hashSync(body.sifre, bcrypt.genSaltSync(8),null); 
        //Bu tür bir şifreleme, kullanıcı şifrelerinin güvenliğini sağlamak için yaygın olarak kullanılır. Şifrelerin düz metin olarak saklanmaması, olası bir veri sızıntısı durumunda kullanıcıların şifrelerinin ele geçirilmesini zorlaştırır.


        let admin = new Admin({
            email:body.email,
            sifre
        });

        await admin.save();

        res.json(Response.successResponse({success: true}));

    } catch (error) {
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
    }
});

router.post("/update",async(req,res)=>{
    let body=req.body;
    try {
        let updates = {};

        if(!body._id) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,"Doğrulama Hatasi","Kullanici bulunamadi.");

        if(body.sifre && body.sifre.length < Enum.PASS_LENGTH) {
            updates.sifre=bcrypt.hashSync(body.sifre, bcrypt.genSaltSync(8),null);
        }

        if(body.email) updates.email = body.email;

        await Admin.updateOne({_id: body._id},updates);

        res.json(Response.successResponse({ success:true}));

    } catch (error) {
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
    }
});

router.post("/delete", async (req, res)=> {
    let body= req.body;

    try {
        if(!body._id) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,"Doğrulama Hatasi","Gerekli alanlari doğru doldurunuz.");
        
        await Admin.deleteOne({_id: body._id});

        res.json(Response.successResponse({success: true}));

    } catch (error) {
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
    }
});

router.post('/login',async (req, res)=>{

    let body=req.body;

try {
    
    if(!body.email) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,"Doğrulama Hatasi","Email alanini doldurunuz.");

    if(!body.sifre) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,"Doğrulama Hatasi","Şifre alanini doldurunuz.");

    let admin= await Admin.findOne({email: body.email});

    if(!admin) {
        throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,"Doğrulama Hatasi","Kullanici bulunamadi.");

    }

    const sifresorgu = await bcrypt.compare(body.sifre, admin.sifre);
    if(!sifresorgu) {
        throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,"Doğrulama Hatasi","Şifre Hatali.");
    }

    /*res.json(Response.successResponse({success: true})); */

    res.status(200).json({ success: true, message: "Giriş Başarili.!" }); 

} catch (error) {
    
    let errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
}
});


module.exports =  router;