import User from '../models/User.model.js';
import generateToken from '../utils/generateToken.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const register = asyncHandler(async (req, res) => {

        const {name, email, phone, password, role = 'user', personalAddress} = req.body;
        
        if(!name || !email || !phone || !password){
            return res.status(400).json({ message: "Please insert all the required fields" });
        }
        if (role === 'agent' && !personalAddress) {
            return res.status(400).json({ message: "Agents must provide a personal address" });
        }
        const userExists = await User.findOne({email}); 
        if(userExists){
            return res.status(400).json({message: 'User already exists'});
        }

    const userExists = await User.findOne({ email }); 
    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const assignedRole = role === 'agent' ? 'agent' : 'user';
    const assignedStatus = assignedRole === 'agent' ? 'pending' : 'approved';

    const user = await User.create({
        name,
        email,
        phone,
        password,
        role: assignedRole,
        status: assignedStatus,
        personalAddress: assignedRole === 'agent' ? personalAddress : undefined,
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name, 
            email: user.email,
            role: user.role,
            status: user.status,
            token: generateToken(user._id),
            message: "User registered successfully" 
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
});

export const login = asyncHandler(async (req, res) => {
    const {email, password} = req.body;
    
        const user = await User.findOne({email});
        if(user && (await user.matchPassword(password))){
            res.json({
                _id: user._id,
                name: user.name, 
                email: user.email,
                role: user.role,
                status: user.status,
                token: generateToken(user._id),
            });
        }else {
            res.status(401).json({message: 'Invalid email or Password'});
        }
    });