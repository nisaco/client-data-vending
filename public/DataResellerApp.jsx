import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { LogOut, Sun, Moon, Home, BarChart3, Wallet, Send, Settings, UserPlus, Zap, Bell, CheckCircle, XCircle, AlertTriangle, Loader2, CreditCard, ChevronDown, Phone, Mail } from 'lucide-react';

const PaystackPop = window.PaystackPop;

// --- CONFIG & CONSTANTS ---
const PAYSTACK_PUBLIC_KEY = 'pk_live_3be2ebebc6edd6fa9f5f9a7303c80a55ee9e0be1'; 
const MIN_TOPUP_GHS = 6.00;
const TOPUP_FEE_RATE = 0.02;

// Hardcoded Plan Structure (Must match backend structure)
const allPlans = {
    "MTN": [
        { id: '1', name: '1GB', price: 480 }, { id: '2', name: '2GB', price: 960 }, { id: '3', name: '3GB', price: 1420 }, 
        { id: '4', name: '4GB', price: 2000 }, { id: '5', name: '5GB', price: 2400 }, { id: '10', name: '10GB', price: 4400 }
    ],
    "AirtelTigo": [
        { id: '1', name: '1GB', price: 400 }, { id: '2', name: '2GB', price: 800 }, { id: '5', name: '5GB', price: 2000 }, 
        { id: '10', name: '10GB', price: 4200 }, { id: '20', name: '20GB', price: 8210 }
    ],
    "Telecel": [
        { id: '5', name: '5GB', price: 2300 }, { id: '10', name: '10GB', price: 4300 }, { id: '20', name: '20GB', price: 8300 }, 
        { id: '50', name: '50GB', price: 19500 }
    ]
};

// --- HELPER FUNCTIONS ---

const formatCurrency = (pesewas) => {
    if (typeof pesewas !== 'number') return 'GHS 0.00';
    return `GHS ${(pesewas / 100).toFixed(2)}`;
};

const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    try {
        return new Date(isoString).toLocaleString('en-GB', { 
            year: 'numeric', month: 'short', day: 'numeric', 
            hour: '2-digit', minute: '2-digit' 
        });
    } catch (e) {
        return 'Invalid Date';
    }
};

const getStatusColor = (status) => {
    switch (status) {
        case 'data_sent':
        case 'topup_successful':
            return 'bg-emerald-500';
        case 'pending_review':
            return 'bg-amber-500';
        case 'data_failed':
            return 'bg-red-500';
        default:
            return 'bg-gray-400';
    }
};

const getStatusText = (status) => status.replace(/_/g, ' ').toUpperCase();

// --- FEE CALCULATION (Must match backend) ---
const calculateFinalPaystackCharge = (netDepositGHS) => {
    const netDepositPesewas = Math.round(netDepositGHS * 100);
    const feeAmount = netDepositPesewas * TOPUP_FEE_RATE;
    const finalCharge = netDepositPesewas + feeAmount;
    return Math.ceil(finalCharge); 
};

// --- COMPONENTS ---

// 1. Notification Component
const Notification = ({ message, type, onClose }) => {
    const Icon = useMemo(() => {
        switch (type) {
            case 'success': return CheckCircle;
            case 'error': return XCircle;
            case 'warning': return AlertTriangle;
            default: return Bell;
        }
    }, [type]);

    const colorClasses = useMemo(() => {
        switch (type) {
            case 'success': return 'bg-emerald-100 text-emerald-800 border-emerald-500';
            case 'error': return 'bg-red-100 text-red-800 border-red-500';
            case 'warning': return 'bg-amber-100 text-amber-800 border-amber-500';
            default: return 'bg-blue-100 text-blue-800 border-blue-500';
        }
    }, [type]);

    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 6000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`p-4 border-l-4 rounded-lg shadow-md flex items-center justify-between transition-opacity duration-500 ${colorClasses}`}>
            <div className="flex items-center">
                <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                <p className="text-sm font-medium">{message}</p>
            </div>
            <button onClick={onClose} className="p-1 -mr-1 rounded-full hover:bg-opacity-50 transition">
                <XCircle className="w-4 h-4 opacity-50 hover:opacity-100" />
            </button>
        </div>
    );
};


// 2. Navigation Bar
const NavBar = ({ userInfo, onNavigate, onLogout }) => {
    const [isDark, setIsDark] = useState(localStorage.getItem('theme') === 'dark');

    const toggleTheme = () => {
        const newTheme = isDark ? 'light' : 'dark';
        document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', newTheme);
        setIsDark(!isDark);
    };
    
    // Theme initialization based on storage/system preference
    useEffect(() => {
        const storedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialDark = storedTheme === 'dark' || (!storedTheme && prefersDark);
        setIsDark(initialDark);
        if (initialDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const NavButton = ({ page, Icon, label }) => (
        <button 
            onClick={() => onNavigate(page)} 
            className={`p-2 rounded-full transition duration-150 flex items-center space-x-2 
                ${page === userInfo?.currentPage ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
        >
            <Icon className="w-5 h-5" />
            <span className="hidden sm:inline">{label}</span>
        </button>
    );

    return (
        <nav className="bg-white dark:bg-gray-900 shadow-xl sticky top-0 z-10 border-b border-gray-100 dark:border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <Zap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xl font-extrabold text-gray-900 dark:text-white tracking-wider">
                        DATALINK
                    </span>
                </div>
                <div className="flex items-center space-x-3 sm:space-x-4">
                    
                    <NavButton page="dashboard" Icon={Home} label="Home" />
                    <NavButton page="purchase" Icon={Send} label="Purchase" />

                    {/* Wallet Display */}
                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-full shadow-inner hidden sm:flex items-center">
                        <Wallet className="w-4 h-4 mr-2 text-indigo-500" />
                        Balance: <span className="text-indigo-600 dark:text-indigo-400 font-bold ml-1">
                            {formatCurrency(userInfo?.walletBalance)}
                        </span>
                    </div>

                    {/* Theme Toggle */}
                    <button onClick={toggleTheme} className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                    
                    {/* Logout */}
                    <button onClick={onLogout} className="p-2 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900 transition">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </nav>
    );
};

// 3. Purchase Component
const PurchasePage = ({ userInfo, onPurchaseSuccess, onShowNotification }) => {
    const [network, setNetwork] = useState('MTN');
    const [plans, setPlans] = useState([]);
    const [formData, setFormData] = useState({
        capacity: '',
        phoneNumber: '',
        email: userInfo?.email || '',
        paymentMethod: 'wallet',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);

    // Get plans based on the current network
    useEffect(() => {
        const networkPlans = allPlans[network] || [];
        setPlans(networkPlans);

        if (networkPlans.length > 0) {
            const defaultPlan = networkPlans[0];
            setFormData(prev => ({ ...prev, capacity: defaultPlan.id }));
            setSelectedPlan(defaultPlan);
        } else {
            setFormData(prev => ({ ...prev, capacity: '' }));
            setSelectedPlan(null);
        }
    }, [network]);


    // Handle form changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'capacity') {
            const plan = plans.find(p => p.id === value);
            setSelectedPlan(plan);
        }
    };

    // Calculate final price including fee for Paystack
    const calculateFinalPriceWithFee = () => {
        if (!selectedPlan) return 0;
        const netPriceGHS = selectedPlan.price / 100;
        return calculateFinalPaystackCharge(netPriceGHS) ;
    };

    const priceInPesewas = selectedPlan?.price || 0;
    const finalPrice = formData.paymentMethod === 'wallet' 
        ? priceInPesewas 
        : calculateFinalPriceWithFee(); // Returns pesewas
    const finalPriceGHS = (finalPrice / 100).toFixed(2);
    
    // Determine button state and text
    const buttonDisabled = isLoading || !selectedPlan || formData.phoneNumber.length !== 10 || 
                         (formData.paymentMethod === 'wallet' && priceInPesewas > userInfo?.walletBalance);
    
    const buttonText = isLoading 
        ? 'Processing...'
        : (formData.paymentMethod === 'wallet' && priceInPesewas > userInfo?.walletBalance
            ? 'Insufficient Wallet Balance'
            : `Pay GHS ${finalPriceGHS} via ${formData.paymentMethod === 'wallet' ? 'Wallet' : 'Paystack'}`);

    // Paystack initiation for direct purchase
    const handlePaystackPurchase = () => {
        setIsLoading(true);

        PaystackPop.setup({
            key: PAYSTACK_PUBLIC_KEY, 
            email: formData.email || userInfo.email, 
            amount: finalPrice, 
            currency: 'GHS',
            ref: 'DL-PURCHASE-' + crypto.randomBytes(16).toString('hex'),
            metadata: { 
                phone_number: formData.phoneNumber, 
                network: network, 
                data_plan: formData.capacity,
            },
            callback: function(response) {
                onShowNotification("Verifying payment...", 'warning');
                
                fetch('/paystack/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reference: response.reference }),
                })
                .then(res => res.json())
                .then(data => {
                    onShowNotification(data.message, data.status === 'success' || data.status === 'pending' ? 'success' : 'error');
                    if (data.status === 'success') {
                        onPurchaseSuccess(); 
                    }
                })
                .catch(() => onShowNotification("Verification failed due to network error.", 'error'))
                .finally(() => setIsLoading(false));
            },
            onClose: () => {
                onShowNotification("Transaction cancelled.", 'error');
                setIsLoading(false);
            }
        }).openIframe();
    };

    // Wallet purchase submission
    const handleWalletPurchase = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/wallet-purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    network,
                    dataPlan: formData.capacity,
                    phone_number: formData.phoneNumber,
                    amountInPesewas: priceInPesewas 
                })
            });

            const data = await response.json();
            onShowNotification(data.message, data.status === 'success' || data.status === 'pending' ? 'success' : 'error');
            if (data.status === 'success') {
                onPurchaseSuccess();
            }
        } catch (error) {
            onShowNotification("An unknown error occurred during wallet transaction.", 'error');
        } finally {
            setIsLoading(false);
        }
    };


    const handleSubmit = (e) => {
        e.preventDefault();
        if (buttonDisabled) return;

        if (formData.paymentMethod === 'paystack') {
            handlePaystackPurchase();
        } else {
            handleWalletPurchase();
        }
    };
    
    return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-2xl space-y-6">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white border-b border-indigo-100 dark:border-gray-700 pb-3">
                <Zap className="w-6 h-6 inline mr-2 text-indigo-500" />
                Buy Data Packages
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Network Selection Tabs */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Network</label>
                    <div className="grid grid-cols-3 gap-3">
                        {['MTN', 'AirtelTigo', 'Telecel'].map((net) => (
                            <button
                                type="button"
                                key={net}
                                onClick={() => setNetwork(net)}
                                className={`p-4 rounded-xl font-semibold text-center transition shadow-md border-2 ${
                                    network === net 
                                    ? 'bg-indigo-600 text-white shadow-indigo-500/50 scale-[1.02] border-indigo-700' 
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-700/70 border-gray-200 dark:border-gray-600'
                                }`}
                            >
                                {net}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Plan Selection Dropdown */}
                <div className="relative">
                    <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Data Plan ({network})</label>
                    <select
                        id="capacity"
                        name="capacity"
                        value={formData.capacity}
                        onChange={handleChange}
                        disabled={plans.length === 0}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg appearance-none bg-white dark:bg-gray-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition"
                    >
                        {plans.length === 0 && <option value="">No plans available</option>}
                        {plans.map(p => (
                            <option key={p.id} value={p.id}>
                                {`${p.name} - ${formatCurrency(p.price)}`}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 mt-0.5 text-gray-500 dark:text-gray-400 pointer-events-none" />
                </div>

                {/* Recipient Details */}
                <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recipient Phone Number (e.g., 0501234567)</label>
                    <input
                        type="tel"
                        id="phoneNumber"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        pattern="0[0-9]{9}"
                        maxLength="10"
                        required
                        placeholder="05x XXX XXXX"
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition"
                    />
                </div>
                
                {/* Payment Method Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Method</label>
                    <div className="grid grid-cols-2 gap-4">
                        {['wallet', 'paystack'].map((method) => (
                            <button
                                type="button"
                                key={method}
                                onClick={() => setFormData(prev => ({ ...prev, paymentMethod: method }))}
                                className={`p-4 rounded-xl shadow-lg border-2 transition ${
                                    formData.paymentMethod === method
                                    ? 'bg-indigo-50 dark:bg-indigo-900/50 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                    : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'
                                }`}
                            >
                                <p className="font-bold text-lg flex items-center justify-center">
                                    {method === 'wallet' ? <Wallet className="w-5 h-5 mr-1" /> : <CreditCard className="w-5 h-5 mr-1" />}
                                    {method === 'wallet' ? 'Wallet Balance' : 'Card/Mobile Money'}
                                </p>
                                <p className="text-xs mt-1">
                                    {method === 'wallet' ? 'Instant. No Fees.' : `Total Charge: GHS ${finalPriceGHS}`}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={buttonDisabled}
                    className="w-full py-4 bg-indigo-600 text-white text-xl font-bold rounded-lg shadow-xl hover:bg-indigo-700 transition duration-150 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {isLoading && <Loader2 className="animate-spin w-5 h-5 mr-3" />}
                    {buttonText}
                </button>
            </form>
        </div>
    );
};

// 4. Dashboard Component
const DashboardPage = ({ orders, onOpenTopupModal }) => {

    const pendingCount = orders.filter(o => o.status === 'pending_review' || o.status === 'processing').length;
    const successfulCount = orders.filter(o => o.status === 'data_sent' || o.status === 'topup_successful').length;

    return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-2xl space-y-8">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white border-b border-indigo-100 dark:border-gray-700 pb-3">
                <BarChart3 className="w-6 h-6 inline mr-2 text-indigo-500" />
                Dashboard Overview
            </h2>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <MetricCard 
                    title="Total Transactions" 
                    value={orders.length} 
                    icon={Zap} 
                    color="text-indigo-500" 
                    bg="bg-indigo-50 dark:bg-indigo-900/30"
                />
                <MetricCard 
                    title="Orders Processing" 
                    value={pendingCount} 
                    icon={AlertTriangle} 
                    color="text-amber-500" 
                    bg="bg-amber-50 dark:bg-amber-900/30"
                />
                <MetricCard 
                    title="Successfully Delivered" 
                    value={successfulCount} 
                    icon={CheckCircle} 
                    color="text-emerald-500" 
                    bg="bg-emerald-50 dark:bg-emerald-900/30"
                />
            </div>
            
            {/* Top-Up Button Section */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg flex justify-between items-center shadow-inner">
                <p className="font-semibold text-gray-700 dark:text-gray-200">Need to reload your balance?</p>
                <button 
                    onClick={onOpenTopupModal} 
                    className="px-4 py-2 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition shadow-md"
                >
                    <Wallet className="w-4 h-4 inline mr-2" />
                    Top Up Wallet
                </button>
            </div>

            {/* Order History Table */}
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">Recent Activity</h3>
            <OrderTable orders={orders} />
        </div>
    );
};

const MetricCard = ({ title, value, icon: Icon, color, bg }) => (
    <div className={`p-5 rounded-xl ${bg} shadow-lg flex items-center justify-between`}>
        <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{value}</p>
        </div>
        <Icon className={`w-8 h-8 ${color} opacity-70`} />
    </div>
);

const OrderTable = ({ orders }) => (
    <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                    {['Date', 'Type', 'Network', 'Details', 'Amount (GHS)', 'Status'].map(header => (
                        <th key={header} className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                            {header}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                {orders.length === 0 ? (
                    <tr>
                        <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                            No recent transactions found.
                        </td>
                    </tr>
                ) : (
                    orders.slice(0, 10).map((order) => (
                        <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition duration-150">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{formatDate(order.createdAt)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-500">{order.dataPlan === 'WALLET TOP-UP' ? 'TOP-UP' : 'PURCHASE'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{order.network}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {order.dataPlan === 'WALLET TOP-UP' ? 'Wallet Deposit' : `${order.dataPlan} to ${order.phoneNumber}`}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${order.dataPlan === 'WALLET TOP-UP' ? 'text-emerald-600' : 'text-red-500'}`}>
                                {order.dataPlan === 'WALLET TOP-UP' ? '+' : '-'} GHS {order.amount.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-3 py-1 text-white text-xs font-bold rounded-full ${getStatusColor(order.status)}`}>
                                    {getStatusText(order.status)}
                                </span>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    </div>
);

// 5. Modal Component
const TopUpModal = ({ isOpen, onClose, onShowNotification, onTopupSuccess, userEmail }) => {
    const [amountGHS, setAmountGHS] = useState(MIN_TOPUP_GHS);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Calculate final price and display fee
    const chargedPesewas = calculateFinalPaystackCharge(amountGHS);
    const feeGHS = ((chargedPesewas - (amountGHS * 100)) / 100).toFixed(2);
    const totalChargeGHS = (chargedPesewas / 100).toFixed(2);

    const handlePay = () => {
        if (isProcessing) return;
        const amount = parseFloat(amountGHS);
        if (isNaN(amount) || amount < MIN_TOPUP_GHS) {
            onShowNotification(`Please enter a valid amount (Min GHS ${MIN_TOPUP_GHS.toFixed(2)}).`, 'error');
            return;
        }
        
        setIsProcessing(true);

        const paymentCallback = (response) => {
            onShowNotification("Verifying top-up...", 'warning');
            
            fetch('/api/topup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    reference: response.reference, 
                    amount: amount, // Send the NET DEPOSIT amount (GHS)
                }),
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    onShowNotification(`Deposit successful! GHS ${amount.toFixed(2)} credited.`, 'success');
                    onTopupSuccess(data.newBalance); // Update parent state
                    onClose();
                } else {
                    onShowNotification(data.message, 'error');
                }
            })
            .catch(() => onShowNotification("Verification failed due to network error.", 'error'))
            .finally(() => setIsProcessing(false));
        };
        
        PaystackPop.setup({
            key: PAYSTACK_PUBLIC_KEY, 
            email: userEmail, 
            amount: chargedPesewas, // Send fee-inclusive amount (in pesewas)
            currency: 'GHS',
            ref: 'DL-TOPUP-' + crypto.randomBytes(16).toString('hex'),
            callback: paymentCallback,
            onClose: () => {
                onShowNotification("Top-up cancelled.", 'error');
                setIsProcessing(false);
            }
        }).openIframe();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 transition-opacity">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-sm transform scale-100 transition-all duration-300">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 border-b pb-2">Deposit to Wallet</h3>
                
                <label htmlFor="modal-topup-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Net Deposit Amount (GHS)
                </label>
                <input 
                    type="number" 
                    id="modal-topup-amount" 
                    min={MIN_TOPUP_GHS.toFixed(2)} 
                    step="0.50" 
                    value={amountGHS} 
                    onChange={(e) => setAmountGHS(parseFloat(e.target.value) || MIN_TOPUP_GHS)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition"
                />

                <div className="mt-4 text-sm space-y-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="flex justify-between font-medium text-gray-700 dark:text-gray-300">
                        <span>Fee ({TOPUP_FEE_RATE * 100}%)</span>
                        <span className="text-red-500">GHS {feeGHS}</span>
                    </p>
                    <p className="flex justify-between text-lg font-bold text-gray-900 dark:text-white border-t pt-2 border-gray-200 dark:border-gray-600">
                        <span>Total Charged</span>
                        <span>GHS {totalChargeGHS}</span>
                    </p>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                    <button 
                        id="modal-cancel" 
                        onClick={onClose} 
                        type="button" 
                        className="py-2 px-4 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition font-medium"
                    >
                        Cancel
                    </button>
                    <button 
                        id="modal-pay" 
                        onClick={handlePay} 
                        type="button" 
                        disabled={isProcessing}
                        className="py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-bold disabled:bg-indigo-400 flex items-center"
                    >
                         {isProcessing && <Loader2 className="animate-spin w-4 h-4 mr-2" />}
                        {isProcessing ? 'Paying...' : `Pay GHS ${totalChargeGHS}`}
                    </button>
                </div>
            </div>
        </div>
    );
};


// 6. Main App Component
const App = () => {
    const [userInfo, setUserInfo] = useState(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [currentPage, setCurrentPage] = useState('purchase');
    const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);

    // Theme initialization
    useEffect(() => {
        const storedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialDark = storedTheme === 'dark' || (!storedTheme && prefersDark);
        if (initialDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);


    // Notification handlers
    const addNotification = useCallback((message, type) => {
        setNotifications(prev => [...prev, { id: Date.now(), message, type }]);
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    // API Callbacks
    const fetchUserInfo = useCallback(async () => {
        try {
            const response = await fetch('/api/user-info');
            if (response.ok) {
                const data = await response.json();
                setUserInfo(data);
                return data;
            } else {
                setUserInfo(null);
            }
        } catch (error) {
            console.error('Failed to fetch user info:', error);
            setUserInfo(null);
        } finally {
            setIsAuthLoading(false);
        }
    }, []);

    const fetchOrders = useCallback(async () => {
        if (!userInfo) return;
        try {
            const response = await fetch('/api/my-orders');
            if (response.ok) {
                const data = await response.json();
                setOrders(data.orders || []);
            }
        } catch (error) {
            console.error('Failed to fetch orders:', error);
            addNotification('Failed to load transaction history.', 'error');
        }
    }, [userInfo, addNotification]);

    const handleLogout = async () => {
        await fetch('/api/logout');
        window.location.href = '/login.html'; // Redirect to login page
    };

    const handleSuccessfulTransaction = useCallback(() => {
        fetchUserInfo();
        fetchOrders();
    }, [fetchUserInfo, fetchOrders]);

    // Initial load and auto-refresh
    useEffect(() => {
        fetchUserInfo();
    }, [fetchUserInfo]);

    useEffect(() => {
        if (userInfo) {
            fetchOrders();
        }
    }, [userInfo, fetchOrders]);
    
    const handleTopupSuccess = useCallback((newBalance) => {
        setUserInfo(prev => ({ ...prev, walletBalance: newBalance }));
        fetchOrders();
    }, [fetchOrders]);
    
    // Auth Guard
    if (isAuthLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
                <Loader2 className="animate-spin w-8 h-8 text-indigo-600" />
            </div>
        );
    }

    if (!userInfo) {
        window.location.href = '/login.html';
        return null;
    }

    // Dynamic Content Rendering
    let Content;
    switch (currentPage) {
        case 'purchase':
            Content = (
                <PurchasePage 
                    userInfo={userInfo} 
                    onPurchaseSuccess={handleSuccessfulTransaction} 
                    onShowNotification={addNotification} 
                />
            );
            break;
        case 'dashboard':
            Content = (
                <DashboardPage 
                    orders={orders} 
                    onOpenTopupModal={() => setIsTopupModalOpen(true)}
                />
            );
            break;
        default:
            setCurrentPage('purchase');
            Content = <PurchasePage userInfo={userInfo} onPurchaseSuccess={handleSuccessfulTransaction} onShowNotification={addNotification} />;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <NavBar 
                userInfo={userInfo} 
                onNavigate={setCurrentPage} 
                onLogout={handleLogout} 
            />
            
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                {/* Notification Stack */}
                <div className="fixed bottom-4 right-4 w-full max-w-sm space-y-2 z-50">
                    {notifications.map((n) => (
                        <Notification 
                            key={n.id} 
                            message={n.message} 
                            type={n.type} 
                            onClose={() => removeNotification(n.id)} 
                        />
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="max-w-4xl mx-auto">
                    {Content}
                </div>
            </div>
            
            <TopUpModal
                isOpen={isTopupModalOpen}
                onClose={() => setIsTopupModalOpen(false)}
                onShowNotification={addNotification}
                onTopupSuccess={handleTopupSuccess}
                userEmail={userInfo.email}
            />
        </div>
    );
};

export default App;