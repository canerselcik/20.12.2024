const mongoose = require ("mongoose"); 

const schema = mongoose.Schema({
    isim: {type:String, required:true},
    soyisim: {type:String, required:true},
    email: {type:String, required:true, unique: true},
    okul_no: {type:String, required:true, unique: true},
    sifre: {type:String, required:true}
},
{
    versionKey: false, // -v key kısmı gelmesin diye
    timestamps: {

        createdAt:"created_at",
        updatedAt:"updated_at"
    }
});

class Users extends mongoose.Model {

    validPassword(sifre) {
        return bcrypt.compareSync(sifre, this.sifre)

    }

    static validateFieldsBeforeAuth(email, sifre) {
        if (typeof sifre !== "string" || sifre.length < PASS_LENGTH || is.not.email(email))
            throw new CustomError(HTTP_CODES.UNAUTHORIZED,"Validation Error", "Eposta veya şifre hatali.");  

        return null;
    
        /*bu sınıf kullanıcı doğrulama süreçlerinde özellikle giriş işlemleri sırasında şifrenin ve e-postanın doğruluğunu kontrol etmek ve hataları yönetmek için  */
    }       

}

schema.loadClass(Users);
module.exports = mongoose.model("users",schema)