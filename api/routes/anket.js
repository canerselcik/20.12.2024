const express = require("express");
const Response = require('../lib/Response');
const CustomError = require ('../lib/Error');
const Enum = require ("../config/Enum");
const Anket = require("../db/models/Anket");
const router = express.Router();

router.get("/", async (req, res )=> {
    
    try {
        let anket= await Anket.find({});

        res.json(Response.successResponse(anket));

    } catch (error) {

        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(Response.errorResponse(error));
        
    }
    
});

router.post('/add',async(req, res)=>{
    let body = req.body;
    try {
        if(!body.soru) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,"Doğrulama Hatasi...","Soru girilmemiş.");

        if (!Array.isArray(body.cevap) || body.cevap.length === 0) {
            throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Doğrulama Hatasi...", "Cevaplar girilmemiş veya geçersiz.");
        }
        // Cevapların dizi olup olmadığını kontrol edin ^^^

        /*if(!body.cevap) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,"Doğrulama Hatasi...","Cevap girilmemiş.");
         eğer ki dizi şeklinde tanımlanmamış olsaydı bu kontrol yeterliydi.*/
        let anket = new Anket({
            soru: body.soru,
            cevap: body.cevap

        });
        
        await anket.save();

        res.json(Response.successResponse({success: true}));

    } catch (error) {
        
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
    }
});

router.post('/delete', async(req, res)=> {
    let body = req.body;

    try {
        
        if(!body._id) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,"Doğrulama Hatasi","Ortak alanlari doldurunuz.");

        await Anket.deleteOne({_id: body._id});

        res.json(Response.successResponse({success: true}));

    } catch (error) {

        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);  

    }
});

router.post('/update', async(req, res)=> {
    let body=req.body;

    try {
        let updates = {};
        
        if(!body._id) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,"Doğrulama Hatasi","Ortak alanlari doldurunuz.");

        if(body.soru) updates.soru = body.soru;
        if(body.cevap) updates.cevap = body.cevap;

        await Anket.updateOne({_id: body._id},updates);

        res.json(Response.successResponse({ success: true}));

    } catch (error) {
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
        
    }
});


module.exports = router;