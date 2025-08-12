import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
// NHẬP CÁC THƯ VIỆN CỦA FIREBASE
import { initializeApp } from "firebase/app";
import { 
    getFirestore, collection, onSnapshot, 
    addDoc, deleteDoc, doc, setDoc, updateDoc,
    query, orderBy
} from "firebase/firestore";

/**
 * BÁNH MÌ ÔNG KÒI – Ordering MVP (Grab-like UI)
 *
 * PHIÊN BẢN NÂNG CẤP (v13 - Business Operations):
 * - Thêm tính năng Tình trạng Cửa hàng (Mở cửa / Tạm đóng cửa) cho Admin.
 * - Thêm âm thanh thông báo "ting" tự động khi có đơn hàng mới.
 * - Tối ưu hóa toàn bộ luồng vận hành chuyên nghiệp.
 */

const BRAND_COLOR = "#fc6806";

// ========================================================================
// ===== CẤU HÌNH FIREBASE CỦA BẠN (ĐÃ HOÀN THÀNH!) =======================
// ========================================================================
const firebaseConfig = {
  apiKey: "AIzaSyApIFFzjvfyGusxNkwTapK6H7_uIILZa9g",
  authDomain: "banh-mi-ong-koi.firebaseapp.com",
  projectId: "banh-mi-ong-koi",
  storageBucket: "banh-mi-ong-koi.appspot.com",
  messagingSenderId: "539005874689",
  appId: "1:539005874689:web:e76150504cdd6023b78600"
};
// ========================================================================

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


// ===== Icon Components (SVG) =====
const ShoppingCartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.16"/></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
const SlidersHorizontalIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/></svg>;
const ChevronLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="m15 18-6-6 6-6"/></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>;
const MinusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><line x1="5" x2="19" y1="12" y2="12"/></svg>;
const Trash2Icon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>;
const PinIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1"><path d="M12 17v5"/><path d="M15 9.34V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12l3-3h5.34"/><path d="m15 9.34 5.5 5.5"/><path d="m20.5 14.84-5.5-5.5"/><path d="M18 22h4v-4"/></svg>;
const ArrowUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>;
const ArrowDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>;
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>;
const NoteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-1.5 text-gray-400"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>;

// ===== Custom UI Components =====
const Button = ({ children, className, variant = 'default', size = 'default', ...props }) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    default: `bg-[${BRAND_COLOR}] text-white hover:bg-[${BRAND_COLOR}]/90`,
    destructive: "bg-red-600 text-white hover:bg-red-600/90",
    outline: "border border-input bg-transparent hover:bg-neutral-100 hover:text-neutral-900",
    ghost: "hover:bg-neutral-100 hover:text-neutral-900",
  };
  const sizes = { default: "h-10 py-2 px-4", sm: "h-9 px-3 rounded-md", lg: "h-11 px-8 rounded-md", icon: "h-10 w-10" };
  return <button className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>{children}</button>;
};
const Card = ({ children, className, ...props }) => <div className={`rounded-2xl border bg-white text-neutral-950 shadow-sm ${className}`} {...props}>{children}</div>;
const CardContent = ({ children, className, ...props }) => <div className={`p-3 ${className}`} {...props}>{children}</div>;
const Input = ({ className, ...props }) => <input className={`flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} />;
const Textarea = ({ className, ...props }) => <textarea className={`flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} />;
const Select = ({ children, className, ...props }) => <select className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props}>{children}</select>;
const SelectItem = ({ children, ...props }) => <option {...props}>{children}</option>;

// ===== Custom Toast Notification =====
const ToastContext = React.createContext(null);
const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const toast = useCallback((message, type = 'success') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    }, []);
    toast.success = (message) => toast(message, 'success');
    toast.error = (message) => toast(message, 'error');
    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className="fixed top-5 right-5 z-[100] space-y-2">
                {toasts.map(t => (
                    <div key={t.id} className={`max-w-sm rounded-lg shadow-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden ${t.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                        <div className="p-4"><p className="text-sm font-medium">{t.message}</p></div>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
const useToast = () => React.useContext(ToastContext);

// ===== Types =====
type MenuItem = { id: string; name: string; price: number; compareAtPrice?: number; photo?: string; available: boolean; bestSeller?: boolean; category: string; isPromo?: boolean; order: number; };
type Category = { id: string; name: string; };
type StoreStatus = { isOpen: boolean; };
type CartItem = { id: string; name: string; price: number; qty: number; note?: string };
type OrderStatus = "pending" | "completed" | "canceled";
type PaymentMethod = "TIENMAT" | "CHUYENKHOAN";
type Order = { id: string; items: CartItem[]; total: number; contact: string; status: OrderStatus; payment: PaymentMethod; createdAt: number; };

// ===== Utils =====
const vnd = (n) => n.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

// ===== Audio Notification =====
const playNotificationSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.05);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5 note
    oscillator.start(audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.5);
    oscillator.stop(audioContext.currentTime + 0.5);
};

function OngKoiOrderingApp() {
  const toast = useToast();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [storeStatus, setStoreStatus] = useState<StoreStatus>({ isOpen: true });
  const [loading, setLoading] = useState(true);

  // Local state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [contact, setContact] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("TIENMAT");
  const [openCart, setOpenCart] = useState(false);
  const [tab, setTab] = useState("khach");
  const [adminTab, setAdminTab] = useState("orders");
  const [newItem, setNewItem] = useState({ name: "", price: "", compareAtPrice: "", photo: "", category: "" });
  const [newCategory, setNewCategory] = useState("");
  
  // Confirmation dialog states
  const [openConfirmClear, setOpenConfirmClear] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  // Ref to track initial order load for notification sound
  const isInitialOrderLoad = useRef(true);

  // Fetch data from Firebase in real-time
  useEffect(() => {
    setLoading(true);
    const unsubMenu = onSnapshot(query(collection(db, "menu"), orderBy("order", "asc")), (snapshot) => {
        setMenu(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MenuItem[]);
        setLoading(false);
    }, (error) => {
        console.error("Firebase Error:", error);
        toast.error("Không thể kết nối tới thực đơn.");
        setLoading(false);
    });

    const unsubCategories = onSnapshot(query(collection(db, "categories"), orderBy("name", "asc")), (snapshot) => {
        const catData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[];
        setCategories(catData);
        if (newItem.category === "") {
            setNewItem(prev => ({ ...prev, category: catData[0]?.name || "" }));
        }
    });

    const unsubOrders = onSnapshot(query(collection(db, "orders"), orderBy("createdAt", "desc")), (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
        if (isInitialOrderLoad.current) {
            isInitialOrderLoad.current = false;
        } else if (ordersData.length > orders.length) {
            playNotificationSound();
        }
        setOrders(ordersData);
    });

    const unsubStoreStatus = onSnapshot(doc(db, "settings", "storeStatus"), (doc) => {
        if (doc.exists()) {
            setStoreStatus(doc.data() as StoreStatus);
        } else {
            // If status doesn't exist, create it with default 'open' state
            setDoc(doc.ref, { isOpen: true });
        }
    });

    return () => {
        unsubMenu();
        unsubCategories();
        unsubOrders();
        unsubStoreStatus();
    };
  }, [orders.length]); // Re-run effect only when order count changes for sound logic

  const total = useMemo(() => cart.reduce((s, i) => s + i.qty * i.price, 0), [cart]);
  const pendingOrderCount = useMemo(() => orders.filter(o => o.status === 'pending').length, [orders]);

  const displayMenu = useMemo(() => {
    const promoItems = menu.filter(item => item.isPromo && item.available);
    const promoItemIds = new Set(promoItems.map(item => item.id));
    const categorizedItems = categories
      .map(cat => ({
        category: cat.name,
        items: menu.filter(item => 
          item.category === cat.name && !promoItemIds.has(item.id)
        )
      }))
      .filter(group => group.items.length > 0);
    return { promos: promoItems, categorized: categorizedItems };
  }, [menu, categories]);


  // Cart operations
  const increaseQty = (m: MenuItem) => {
    if (!storeStatus.isOpen) { toast.error("Cửa hàng đã tạm đóng cửa."); return; }
    if (!m.available) { toast.error("Món đã hết"); return; }
    const existingItem = cart.find(c => c.id === m.id);
    if (existingItem) {
        setCart(cart.map(c => c.id === m.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
        setCart([...cart, { id: m.id, name: m.name, price: m.price, qty: 1, note: '' }]);
    }
  };
  const decreaseQty = (id: string) => {
    const existingItem = cart.find(c => c.id === id);
    if (!existingItem) return;
    if (existingItem.qty === 1) {
        setCart(cart.filter(c => c.id !== id));
    } else {
        setCart(cart.map(c => c.id === id ? { ...c, qty: c.qty - 1 } : c));
    }
  };
  const updateCartItemNote = (id: string, note: string) => { setCart(cart.map(item => item.id === id ? { ...item, note } : item)); };
  const clearCart = () => { setCart([]); setOpenCart(false); setOpenConfirmClear(false); toast.success("Đã hủy giỏ hàng"); };
  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.replace(/\D/g, '');
      if (value.length <= 10) { setContact(value); }
  };

  // Firebase write operations
  const checkout = async () => {
    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(contact)) { return toast.error("Số điện thoại không hợp lệ."); }
    if (!cart.length) return toast.error("Giỏ hàng trống");
    
    const newOrder = { items: cart, total, contact: contact.trim(), status: "pending", payment: paymentMethod, createdAt: Date.now() };
    try {
        await addDoc(collection(db, "orders"), newOrder);
        toast.success("Đặt hàng thành công!");
        setCart([]); setOpenCart(false); setContact("");
    } catch (e) {
        console.error("Error adding document: ", e);
        toast.error("Có lỗi xảy ra, vui lòng thử lại.");
    }
  };
  
  const handleAddNewItem = async () => {
      if(!newItem.name.trim() || newItem.price === '' || !newItem.category) return toast.error('Vui lòng điền đủ thông tin.');
      const newItemData = { 
          name: newItem.name.trim(), 
          price: Number(newItem.price), 
          compareAtPrice: newItem.compareAtPrice === '' ? 0 : Number(newItem.compareAtPrice), 
          available: true, 
          category: newItem.category, 
          photo: newItem.photo || `https://placehold.co/500x400/cccccc/ffffff?text=No+Image`,
          isPromo: false,
          bestSeller: false,
          order: menu.length 
      };
      await addDoc(collection(db, "menu"), newItemData);
      setNewItem({ name: "", price: "", compareAtPrice: "", photo: "", category: newItem.category });
      toast.success('Đã thêm món');
  };

  const handleDeleteItem = async () => {
      if (!itemToDelete) return;
      await deleteDoc(doc(db, "menu", itemToDelete.id));
      toast.success(`Đã xóa món "${itemToDelete.name}"`);
      setItemToDelete(null);
  };
  
  const updateItem = async (id: string, data: Partial<MenuItem>) => {
      const itemRef = doc(db, "menu", id);
      await updateDoc(itemRef, data);
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { status });
      toast.success(`Đã cập nhật đơn hàng #${orderId.slice(-6)}`);
  };

  const handleAddCategory = async () => {
      if (!newCategory.trim() || categories.find(c => c.name === newCategory.trim())) { toast.error("Tên danh mục không hợp lệ hoặc đã tồn tại."); return; }
      await addDoc(collection(db, "categories"), { name: newCategory.trim() });
      setNewCategory("");
      toast.success("Đã thêm danh mục mới.");
  };

  const handleDeleteCategory = async () => {
      if (!categoryToDelete) return;
      await deleteDoc(doc(db, "categories", categoryToDelete.id));
      toast.success(`Đã xóa danh mục "${categoryToDelete.name}".`);
      setCategoryToDelete(null);
  };

  const moveItem = async (index: number, direction: 'up' | 'down') => {
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= menu.length) return;
      
      const newMenu = [...menu];
      [newMenu[index], newMenu[newIndex]] = [newMenu[newIndex], newMenu[index]];
      
      const updates = newMenu.map((item, idx) => 
          updateDoc(doc(db, "menu", item.id), { order: idx })
      );
      
      await Promise.all(updates);
      toast.success("Đã cập nhật thứ tự thực đơn.");
  };
  
  const toggleStoreStatus = async () => {
      const storeStatusRef = doc(db, "settings", "storeStatus");
      await updateDoc(storeStatusRef, { isOpen: !storeStatus.isOpen });
      toast.success(`Cửa hàng đã ${!storeStatus.isOpen ? 'Mở cửa' : 'Tạm đóng cửa'}`);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => { setNewItem({ ...newItem, photo: reader.result as string }); };
        reader.readAsDataURL(file);
    }
  };
  
  const getStatusChipClass = (status: OrderStatus) => {
      switch (status) {
          case 'pending': return 'bg-yellow-100 text-yellow-800';
          case 'completed': return 'bg-green-100 text-green-800';
          case 'canceled': return 'bg-red-100 text-red-800';
      }
  };

  if (loading) {
      return <div className="min-h-screen flex items-center justify-center">Đang tải dữ liệu từ server...</div>
  }

  return (
    <div className="min-h-screen bg-neutral-50" style={{ '--brand': BRAND_COLOR }}>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2"><Button size="icon" variant="ghost" className="rounded-full"><ChevronLeftIcon/></Button><div><div className="text-sm text-neutral-500">BÁNH MÌ ÔNG KÒI</div><div className="text-xs text-neutral-400">Giao hàng tận nơi</div></div></div>
          <div className="flex items-center gap-2"><Button size="icon" variant="ghost" className="rounded-full"><SlidersHorizontalIcon/></Button><Button size="icon" variant="ghost" className="rounded-full"><SearchIcon/></Button></div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pb-28">
        <div className="w-full grid grid-cols-2 rounded-2xl my-4 bg-neutral-200 p-1">
            <button onClick={() => setTab('khach')} className={`py-2 rounded-[14px] text-sm font-semibold ${tab === 'khach' ? 'bg-white shadow' : 'text-neutral-600'}`}>Khách hàng</button>
            <button onClick={() => setTab('admin')} className={`relative py-2 rounded-[14px] text-sm font-semibold ${tab === 'admin' ? 'bg-white shadow' : 'text-neutral-600'}`}>
                Admin
                {pendingOrderCount > 0 && <span className="absolute top-1 right-2 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{pendingOrderCount}</span>}
            </button>
        </div>

        {tab === 'khach' && (
          <div>
            {!storeStatus.isOpen && (
                <div className="p-4 mb-4 text-center bg-red-100 text-red-800 rounded-lg">
                    <p className="font-bold">Cửa hàng đang tạm đóng cửa!</p>
                    <p className="text-sm">Mong bạn quay lại sau. Cảm ơn bạn!</p>
                </div>
            )}
            {displayMenu.promos.length > 0 && (
                <section className="mt-2">
                    <h3 className="text-lg font-bold mb-2 text-yellow-500">🔥 Ưu đãi hôm nay</h3>
                    <div className="grid grid-cols-2 gap-4">{displayMenu.promos.map(m => { const cartItem = cart.find(c => c.id === m.id); const qty = cartItem ? cartItem.qty : 0; return (<Card key={m.id} className="overflow-hidden"><div className="relative"><img src={m.photo} alt={m.name} className="w-full h-36 object-cover" onError={(e) => { e.currentTarget.src = 'https://placehold.co/200x150/fef2f2/ef4444?text=Lỗi'; }}/></div><CardContent><div className="text-sm font-medium min-h-10">{m.name}</div><div className="flex items-center justify-between mt-1"><div><div className="font-semibold">{vnd(m.price)}</div>{m.compareAtPrice > 0 && <div className="text-xs text-neutral-400 line-through">{vnd(m.compareAtPrice)}</div>}</div>{qty > 0 ? (<div className="flex items-center gap-1"><Button size="icon" variant="outline" className="rounded-full w-7 h-7" onClick={() => decreaseQty(m.id)}><MinusIcon/></Button><span className="font-bold w-5 text-center">{qty}</span><Button size="icon" className="rounded-full w-7 h-7" onClick={() => increaseQty(m)}><PlusIcon/></Button></div>) : (<Button size="icon" className="rounded-full w-8 h-8" disabled={!m.available || !storeStatus.isOpen} onClick={() => increaseQty(m)}><PlusIcon/></Button>)}</div></CardContent></Card>);})}</div>
                </section>
            )}
            <div className="mt-5 space-y-6">{displayMenu.categorized.map(group => (<section key={group.category}><h3 className="text-lg font-bold mb-3">{group.category}</h3><div className="grid grid-cols-2 gap-4">{group.items.map(m => { const cartItem = cart.find(c => c.id === m.id); const qty = cartItem ? cartItem.qty : 0; return (<Card key={m.id} className="overflow-hidden"><div className="relative"><img src={m.photo} alt={m.name} className="w-full h-36 object-cover" onError={(e) => { e.currentTarget.src = 'https://placehold.co/200x150/fef2f2/ef4444?text=Lỗi'; } }/>{m.bestSeller && <span className="absolute top-2 left-2 text-xs px-2 py-1 rounded-full bg-emerald-500 text-white">Bán chạy</span>}{!m.available && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><span className="text-white font-semibold">Hết hàng</span></div>}</div><CardContent><div className="text-sm font-medium min-h-10">{m.name}</div><div className="flex items-center justify-between mt-1"><div><div className="font-semibold">{vnd(m.price)}</div>{m.compareAtPrice > 0 && <div className="text-xs text-neutral-400 line-through">{vnd(m.compareAtPrice)}</div>}</div>{qty > 0 ? (<div className="flex items-center gap-1"><Button size="icon" variant="outline" className="rounded-full w-7 h-7" onClick={() => decreaseQty(m.id)}><MinusIcon/></Button><span className="font-bold w-5 text-center">{qty}</span><Button size="icon" className="rounded-full w-7 h-7" onClick={() => increaseQty(m)}><PlusIcon/></Button></div>) : (<Button size="icon" className="rounded-full w-8 h-8" disabled={!m.available || !storeStatus.isOpen} onClick={() => increaseQty(m)}><PlusIcon/></Button>)}</div></CardContent></Card>)})}</div></section>))}</div>
          </div>
        )}

        {tab === 'admin' && (
          <div>
            <div className="grid grid-cols-2 gap-2 my-4 p-1 bg-neutral-200 rounded-lg">
                <button onClick={() => setAdminTab('orders')} className={`py-2 rounded-md text-sm font-semibold relative ${adminTab === 'orders' ? 'bg-white shadow' : ''}`}>
                    Đơn hàng
                    {pendingOrderCount > 0 && <span className="absolute top-1 right-2 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{pendingOrderCount}</span>}
                </button>
                <button onClick={() => setAdminTab('menu')} className={`py-2 rounded-md text-sm font-semibold ${adminTab === 'menu' ? 'bg-white shadow' : ''}`}>Thực đơn & Thống kê</button>
            </div>

            {adminTab === 'orders' && (
                <section>
                    <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">{orders.length === 0 && <p className="text-sm text-neutral-500 text-center py-10">Chưa có đơn hàng nào.</p>}{orders.map(order => (<Card key={order.id}><CardContent><div className="flex justify-between items-start"><div className="flex-1"><div className="font-bold">#{order.id.slice(-6)} - <span className="font-normal">{order.contact}</span></div><div className="text-xs text-neutral-500">{new Date(order.createdAt).toLocaleString('vi-VN')}</div></div><div className="text-right flex-shrink-0 ml-4"><div className="font-bold text-lg" style={{color: BRAND_COLOR}}>{vnd(order.total)}</div><div className={`text-xs font-semibold px-2 py-1 rounded-full mt-1 inline-block ${getStatusChipClass(order.status)}`}>{order.status === 'pending' ? 'Đang chờ' : order.status === 'completed' ? 'Hoàn thành' : 'Đã hủy'}</div></div></div><div className="text-xs mt-2">Thanh toán: <span className="font-semibold">{order.payment === 'TIENMAT' ? 'Tiền mặt' : 'Chuyển khoản'}</span></div><div className="border-t my-2"></div><ul className="text-sm space-y-2">{order.items.map(item => <li key={item.id} className="flex flex-col"><span className="font-medium">{item.qty} x {item.name}</span>{item.note && (<div className="flex items-center text-xs text-blue-600 pl-4"><NoteIcon /><span>{item.note}</span></div>)}</li>)}</ul>{order.status === 'pending' && (<div className="flex gap-2 mt-3"><Button size="sm" className="flex-1" onClick={() => updateOrderStatus(order.id, 'completed')}>Hoàn thành</Button><Button size="sm" variant="destructive" className="flex-1" onClick={() => updateOrderStatus(order.id, 'canceled')}>Hủy đơn</Button></div>)}</CardContent></Card>))}</div>
                </section>
            )}

            {adminTab === 'menu' && (
                <div className="space-y-8">
                    <section>
                        <h3 className="text-base font-semibold mb-3">Tình trạng Cửa hàng</h3>
                        <div className="flex items-center justify-between bg-white p-3 rounded-lg border">
                            <span className={`font-bold ${storeStatus.isOpen ? 'text-green-600' : 'text-red-600'}`}>
                                {storeStatus.isOpen ? 'ĐANG MỞ CỬA' : 'ĐANG TẠM ĐÓNG CỬA'}
                            </span>
                            <button onClick={toggleStoreStatus} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${storeStatus.isOpen ? 'bg-green-500' : 'bg-gray-300'}`}>
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${storeStatus.isOpen ? 'translate-x-6' : 'translate-x-1'}`}/>
                            </button>
                        </div>
                    </section>
                    <section>
                        <h3 className="text-base font-semibold mb-2">Thống kê nhanh</h3>
                        <div className="grid grid-cols-3 gap-3">
                            <Card><CardContent className="text-center"><div className="text-xs text-neutral-500">Doanh thu</div><div className="text-lg font-bold" style={{ color: BRAND_COLOR }}>{vnd(orders.filter(o=>o.status==='completed').reduce((s,o)=>s+o.total,0))}</div></CardContent></Card>
                            <Card><CardContent className="text-center"><div className="text-xs text-neutral-500">Số đơn</div><div className="text-lg font-bold">{orders.length}</div></CardContent></Card>
                            <Card><CardContent className="text-center"><div className="text-xs text-neutral-500">Đang chờ</div><div className="text-lg font-bold">{pendingOrderCount}</div></CardContent></Card>
                        </div>
                    </section>
                    <section>
                        <h3 className="text-base font-semibold mb-3">Thêm món mới</h3>
                        <div className="grid grid-cols-2 gap-3"><Input className="col-span-2" placeholder="Tên món" value={newItem.name} onChange={e=>setNewItem({...newItem, name: e.target.value})} /><Input placeholder="Giá bán (VND)" type="number" value={newItem.price} onChange={e=>setNewItem({...newItem, price: e.target.value})} /><Input placeholder="Giá gốc (để gạch)" type="number" value={newItem.compareAtPrice} onChange={e=>setNewItem({...newItem, compareAtPrice: e.target.value})} /><div className="col-span-2 flex items-center gap-3"><label className="flex-1 cursor-pointer"><div className="h-24 w-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-neutral-500 hover:bg-neutral-50 transition-colors"><UploadIcon /><span className="text-xs mt-1">Tải ảnh lên</span></div><input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} /></label>{newItem.photo && (<div className="w-24 h-24 rounded-lg overflow-hidden border flex-shrink-0"><img src={newItem.photo} alt="Xem trước" className="w-full h-full object-cover" /></div>)}</div><Select className="col-span-2" value={newItem.category} onChange={e=>setNewItem({...newItem, category: e.target.value})}><option value="" disabled>-- Chọn danh mục --</option>{categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</Select><Button className="rounded-xl col-span-2" onClick={handleAddNewItem}>Thêm món vào thực đơn</Button></div>
                    </section>
                    <section>
                        <h3 className="text-base font-semibold mb-3">Quản lý & Sắp xếp Thực đơn</h3>
                        <div className="space-y-3">{menu.map((m, index) => (<Card key={m.id}><CardContent className="flex flex-col gap-3"><div className="flex items-start gap-3"><div className="flex flex-col items-center gap-2 pt-1"><Button size="sm" variant="ghost" disabled={index === 0} onClick={() => moveItem(index, 'up')}><ArrowUpIcon /></Button><span className="font-bold text-lg">{index + 1}</span><Button size="sm" variant="ghost" disabled={index === menu.length - 1} onClick={() => moveItem(index, 'down')}><ArrowDownIcon /></Button></div><img src={m.photo} alt={m.name} className="w-20 h-20 object-cover rounded-xl" onError={(e) => { e.currentTarget.src = 'https://placehold.co/100/fef2f2/ef4444?text=Lỗi'; }}/><div className="flex-1"><div className="font-medium">{m.name}</div><div className="text-sm text-neutral-500">Danh mục: {m.category}</div><div className="text-sm">Giá: {vnd(m.price)} {m.compareAtPrice > 0 && <span className="text-neutral-400 line-through ml-1">{vnd(m.compareAtPrice)}</span>}</div></div></div><div className="grid grid-cols-3 gap-2"><Button size="sm" variant="outline" className="text-xs" onClick={()=> updateItem(m.id, { isPromo: !m.isPromo })}><PinIcon /> {m.isPromo ? 'Bỏ ghim' : 'Ghim ưu đãi'}</Button><Button size="sm" variant="outline" className="text-xs" onClick={()=> updateItem(m.id, { available: !m.available })}>{m.available? 'Tắt món':'Bật món'}</Button><Button size="sm" variant="destructive" className="text-xs" onClick={() => setItemToDelete(m)}><Trash2Icon /> Xóa món</Button></div></CardContent></Card>))}</div>
                    </section>
                    <section>
                        <h3 className="text-base font-semibold mb-3">Quản lý Danh mục</h3>
                        <div className="space-y-2">{categories.map(cat => (<div key={cat.id} className="flex items-center justify-between bg-white p-2 rounded-lg border"><span className="text-sm">{cat.name}</span><Button size="sm" variant="destructive" className="text-xs" onClick={() => setCategoryToDelete(cat)}>Xóa</Button></div>))}</div>
                        <div className="flex gap-2 mt-3"><Input placeholder="Tên danh mục mới" value={newCategory} onChange={e => setNewCategory(e.target.value)} /><Button onClick={handleAddCategory}>Thêm</Button></div>
                    </section>
                </div>
            )}
          </div>
        )}
      </main>

      {/* Popups & Modals */}
      {cart.length > 0 && tab === 'khach' && (<div className="fixed bottom-0 left-0 right-0 z-30"><div className="max-w-md mx-auto p-2"><Button className="w-full h-12 rounded-xl text-base" onClick={()=> setOpenCart(true)}><div className="flex items-center justify-between w-full"><span>{cart.reduce((s,i)=>s+i.qty,0)} món</span><span className="font-bold">{vnd(total)}</span></div></Button></div></div>)}
      {openCart && (<div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpenCart(false)}></div>
          <div className={`relative bg-white rounded-t-2xl shadow-xl flex flex-col max-h-[80vh] transition-transform duration-300 ${openCart ? 'translate-y-0' : 'translate-y-full'}`}>
              <div className="p-4 border-b flex-shrink-0"><h2 className="text-lg font-semibold text-center">Tóm tắt đơn hàng</h2></div>
              <div className="flex-1 p-4 space-y-3 overflow-y-auto">{cart.map(c => (<Card key={c.id}><CardContent><div className="flex-1"><div className="flex items-center justify-between"><div className="font-medium">{c.name}</div><div className="text-sm text-neutral-600">{vnd(c.price * c.qty)}</div></div><div className="mt-2 flex items-center gap-2"><Button size="icon" variant="outline" className="rounded-full w-8 h-8" onClick={()=>decreaseQty(c.id)}><MinusIcon/></Button><div className="w-10 text-center font-semibold">{c.qty}</div><Button size="icon" variant="outline" className="rounded-full w-8 h-8" onClick={()=>increaseQty(c)}><PlusIcon/></Button></div><Textarea className="mt-2 text-sm" placeholder="Ghi chú (ít ớt, không rau…)" value={c.note||""} onChange={e => updateCartItemNote(c.id, e.target.value)}/></div></CardContent></Card>))}</div>
              <div className="p-4 border-t bg-white space-y-3 flex-shrink-0">
                  <Input placeholder="SĐT/Zalo (10 số, bắt đầu bằng 0)" value={contact} onChange={handleContactChange} type="tel" maxLength={10} />
                  <div>
                      <div className="text-sm font-medium mb-2">Phương thức thanh toán</div>
                      <div className="grid grid-cols-2 gap-2">
                          <button onClick={() => setPaymentMethod('TIENMAT')} className={`p-3 rounded-lg border text-sm text-center ${paymentMethod === 'TIENMAT' ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-500' : 'bg-neutral-100'}`}>Tiền mặt</button>
                          <button onClick={() => setPaymentMethod('CHUYENKHOAN')} className={`p-3 rounded-lg border text-sm text-center ${paymentMethod === 'CHUYENKHOAN' ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-500' : 'bg-neutral-100'}`}>Chuyển khoản</button>
                      </div>
                  </div>
                  <div className="flex items-center justify-between font-semibold text-lg"><span>Tổng cộng</span><span style={{ color: BRAND_COLOR }}>{vnd(total)}</span></div>
                  <Button className="w-full h-12 rounded-xl text-base" onClick={checkout}>Đặt hàng</Button>
              </div>
          </div>
      </div>)}
      {openConfirmClear && (<div className="fixed inset-0 z-[60] flex items-center justify-center"><div className="absolute inset-0 bg-black/60" onClick={() => setOpenConfirmClear(false)}></div><div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm m-4"><h3 className="text-lg font-semibold">Hủy giỏ hàng?</h3><p className="text-sm text-neutral-500 mt-1">Hành động này sẽ xóa toàn bộ món đã chọn.</p><div className="flex justify-end gap-2 mt-4"><Button variant="outline" onClick={() => setOpenConfirmClear(false)}>Đóng</Button><Button variant="destructive" onClick={clearCart}>Xác nhận hủy</Button></div></div></div>)}
      {itemToDelete && (<div className="fixed inset-0 z-[60] flex items-center justify-center"><div className="absolute inset-0 bg-black/60" onClick={() => setItemToDelete(null)}></div><div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm m-4"><h3 className="text-lg font-semibold">Xác nhận xóa món?</h3><p className="text-sm text-neutral-500 mt-1">Bạn có chắc muốn xóa món <span className="font-bold">"{itemToDelete.name}"</span>?</p><div className="flex justify-end gap-2 mt-4"><Button variant="outline" onClick={() => setItemToDelete(null)}>Hủy</Button><Button variant="destructive" onClick={handleDeleteItem}>Xác nhận xóa</Button></div></div></div>)}
      {categoryToDelete && (<div className="fixed inset-0 z-[60] flex items-center justify-center"><div className="absolute inset-0 bg-black/60" onClick={() => setCategoryToDelete(null)}></div><div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm m-4"><h3 className="text-lg font-semibold">Xác nhận xóa danh mục?</h3><p className="text-sm text-neutral-500 mt-1">Bạn có chắc muốn xóa danh mục <span className="font-bold">"{categoryToDelete.name}"</span>?</p><div className="flex justify-end gap-2 mt-4"><Button variant="outline" onClick={() => setCategoryToDelete(null)}>Hủy</Button><Button variant="destructive" onClick={handleDeleteCategory}>Xác nhận xóa</Button></div></div></div>)}

      <footer className="py-8 text-center text-xs text-neutral-500">© {new Date().getFullYear()} Bánh Mì Ông Kòi</footer>
    </div>
  );
}

export default function App() {
    return (
        <ToastProvider>
            <OngKoiOrderingApp />
        </ToastProvider>
    )
}
