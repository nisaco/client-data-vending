const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');

// Use environment variable for MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
    .then(() => console.log('MongoDB connection successful.'))
    .catch(err => {
        console.error('MongoDB connection error:', err.message);
    });

// --- SCHEMA DEFINITIONS ---

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    walletBalance: { type: Number, default: 0 }, // Stored in Pesewas
    role: { type: String, enum: ['Client', 'Agent', 'Admin', 'Agent_Pending'], default: 'Client' },
    resetToken: String,
    resetTokenExpires: Date,
}, { timestamps: true });

// Order Schema
const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reference: { type: String, required: true, unique: true },
    phoneNumber: { type: String },
    network: { type: String, required: true },
    dataPlan: { type: String, required: true },
    amount: { type: Number, required: true }, // Stored in GHS (e.g., 10.00)
    status: { 
        type: String, 
        enum: ['payment_success', 'topup_successful', 'data_sent', 'processing', 'pending_review', 'data_failed'], 
        default: 'payment_success' 
    },
    paymentMethod: { type: String, enum: ['wallet', 'paystack'], required: true },
    // Optional field for CKAPI specific reference if needed later
    externalRef: { type: String } 
}, { timestamps: true });

// --- MODELS ---
const User = mongoose.model('User', userSchema);
const Order = mongoose.model('Order', orderSchema);

module.exports = { User, Order, mongoose };