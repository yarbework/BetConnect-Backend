import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true
    }, 
    email:{
        type: String,
        required: true,
        unique: true,
    },
    phone: {
        type: String,
        required: true,
        unique: true
    },
    personalAddress: {
        type: String
    },
    password: {
        type: String,
        required: true
    },

    role:{
        type: String,
        enum: ['user', 'agent', 'admin'],
        default: 'user'
    },
    status: {
        type: String,
        enum: ['approved', 'pending'],
        default: 'approved'
    }
}, {timestamps: true});


userSchema.pre('save', async function () {
    if(!this.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;