import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'ar' | 'he' | 'en';

const LANGUAGE_STORAGE_KEY = 'natural-language';

const translations = {
  // Navigation
  home: { ar: 'الرئيسية', he: 'בית', en: 'Home' },
  menu: { ar: 'القائمة', he: 'תפריט', en: 'Menu' },
  cart: { ar: 'السلة', he: 'עגלה', en: 'Cart' },
  contact: { ar: 'اتصل بنا', he: 'צור קשר', en: 'Contact' },
  
  // Hero
  heroTitle: { ar: 'Natural\nطبيعي 100%', he: 'Natural\n100% טבעי', en: 'Natural\n100% Natural' },
  heroSubtitle: { ar: 'عصائر طازجة • سموذي • مكملات طبيعية', he: 'מיצים טריים • שייקים • תוספי תזונה טבעיים', en: 'Fresh Juices • Smoothies • Natural Supplements' },
  heroDescription: { ar: 'اكتشف مذاق الطبيعة الأصيل في كل رشفة. نستخدم أجود الفواكه والخضروات الطازجة لتحضير مشروباتك المفضلة.', he: 'גלה את הטעם האותנטי של הטבע בכל לגימה. אנו משתמשים בפירות וירקות הטריים והאיכותיים ביותר להכנת המשקאות האהובים עליך.', en: 'Discover the authentic taste of nature in every sip. We use the finest fresh fruits and vegetables to prepare your favorite drinks.' },
  orderNow: { ar: 'اطلب الآن', he: 'הזמן עכשיו', en: 'Order Now' },
  viewMenu: { ar: 'عرض القائمة', he: 'צפה בתפריט', en: 'View Menu' },
  
  // Categories
  allProducts: { ar: 'جميع المنتجات', he: 'כל המוצרים', en: 'All Products' },
  freshJuices: { ar: 'عصائر طازجة', he: 'מיצים טריים', en: 'Fresh Juices' },
  smoothies: { ar: 'سموذي وكوكتيل', he: 'שייקים וקוקטיילים', en: 'Smoothies & Cocktails' },
  supplements: { ar: 'مكملات طبيعية', he: 'תוספי תזונה', en: 'Supplements' },
  bubbleTea: { ar: 'بابلز', he: 'באבלס', en: 'Bubble Tea' },
  yogurt: { ar: 'يوجورت', he: 'יוגורט', en: 'Yogurt' },
  proteins: { ar: 'بروتينات', he: 'חלבונים', en: 'Proteins' },
  
  // Product sizes
  small: { ar: '350 مل', he: '350 מ"ל', en: '350ml' },
  large: { ar: '500 مل', he: '500 מ"ל', en: '500ml' },
  selectSize: { ar: 'اختر الحجم', he: 'בחר גודל', en: 'Select Size' },
  
  // Cart
  addToCart: { ar: 'أضف للسلة', he: 'הוסף לעגלה', en: 'Add to Cart' },
  yourCart: { ar: 'سلتك', he: 'העגלה שלך', en: 'Your Cart' },
  emptyCart: { ar: 'السلة فارغة', he: 'העגלה ריקה', en: 'Cart is empty' },
  total: { ar: 'المجموع', he: 'סה"כ', en: 'Total' },
  checkout: { ar: 'إتمام الطلب', he: 'לתשלום', en: 'Checkout' },
  remove: { ar: 'حذف', he: 'הסר', en: 'Remove' },
  emptyCartButton: { ar: 'إفراغ السلة', he: 'רוקן עגלה', en: 'Empty Cart' },
  confirmDelete: { ar: 'تأكيد الحذف', he: 'אשר מחיקה', en: 'Confirm Delete' },
  confirmDeleteMessage: { ar: 'هل أنت متأكد من حذف هذا المنتج من السلة؟', he: 'האם אתה בטוח שברצונך להסיר פריט זה מהעגלה?', en: 'Are you sure you want to remove this item from the cart?' },
  confirmEmptyCart: { ar: 'هل أنت متأكد من إفراغ السلة بالكامل؟', he: 'האם אתה בטוח שברצונך לרוקן את העגלה?', en: 'Are you sure you want to empty the entire cart?' },
  cancel: { ar: 'إلغاء', he: 'ביטול', en: 'Cancel' },
  confirm: { ar: 'تأكيد', he: 'אישור', en: 'Confirm' },
  contactWhatsApp: { ar: 'تواصل عبر واتساب', he: 'צור קשר בוואטסאפ', en: 'Contact via WhatsApp' },
  
  // Contact & Location
  location: { ar: 'الموقع', he: 'מיקום', en: 'Location' },
  address: { ar: 'شارع السعدية، دبورية', he: 'רחוב א-סעדייה, דבוריה', en: 'Al-Saadiya Street, Daburiyya' },
  
  // Search
  searchProducts: { ar: 'ابحث عن منتج...', he: 'חפש מוצר...', en: 'Search products...' },
  
  // Product Detail Modal
  nutritionInfo: { ar: 'معلومات غذائية', he: 'מידע תזונתי', en: 'Nutrition Info' },
  calories: { ar: 'سعرات', he: 'קלוריות', en: 'Calories' },
  protein: { ar: 'بروتين', he: 'חלבון', en: 'Protein' },
  sugar: { ar: 'سكر', he: 'סוכר', en: 'Sugar' },
  fiber: { ar: 'ألياف', he: 'סיבים', en: 'Fiber' },
  vitamins: { ar: 'فيتامينات', he: 'ויטמינים', en: 'Vitamins' },
  calcium: { ar: 'كالسيوم', he: 'סידן', en: 'Calcium' },
  carbs: { ar: 'كربوهيدرات', he: 'פחמימות', en: 'Carbs' },
  servingSize: { ar: 'حجم الحصة', he: 'גודל מנה', en: 'Serving Size' },
  dailyValue: { ar: 'القيمة اليومية', he: 'ערך יומי', en: 'Daily Value' },
  bcaa: { ar: 'أحماض أمينية', he: 'חומצות אמינו', en: 'BCAA' },
  servings: { ar: 'حصص', he: 'מנות', en: 'Servings' },
  popular: { ar: 'مميز', he: 'פופולרי', en: 'Popular' },
  phone: { ar: 'الهاتف', he: 'טלפון', en: 'Phone' },
  openHours: { ar: 'ساعات العمل', he: 'שעות פתיחה', en: 'Opening Hours' },
  openDaily: { ar: 'يومياً: 17:00 - 00:00', he: 'יומי: 17:00 - 00:00', en: 'Daily: 5:00 PM - 12:00 AM' },
  
  // Order form
  orderDetails: { ar: 'تفاصيل الطلب', he: 'פרטי הזמנה', en: 'Order Details' },
  name: { ar: 'الاسم', he: 'שם', en: 'Name' },
  phoneNumber: { ar: 'رقم الهاتف', he: 'מספר טלפון', en: 'Phone Number' },
  notes: { ar: 'ملاحظات', he: 'הערות', en: 'Notes' },
  placeOrder: { ar: 'تأكيد الطلب', he: 'אשר הזמנה', en: 'Place Order' },
  orderSuccess: { ar: 'تم إرسال طلبك بنجاح!', he: 'ההזמנה נשלחה בהצלחה!', en: 'Order placed successfully!' },
  
  // Currency
  currency: { ar: '₪', he: '₪', en: '₪' },
  
  // Footer
  followUs: { ar: 'تابعونا', he: 'עקבו אחרינו', en: 'Follow Us' },
  allRights: { ar: 'جميع الحقوق محفوظة', he: 'כל הזכויות שמורות', en: 'All Rights Reserved' },
  
  // No products
  noProducts: { ar: 'لم يتم العثور على منتجات', he: 'לא נמצאו מוצרים', en: 'No products found' },

  // Auth
  login: { ar: 'تسجيل الدخول', he: 'התחברות', en: 'Login' },
  signup: { ar: 'إنشاء حساب', he: 'הרשמה', en: 'Sign Up' },
  logout: { ar: 'تسجيل الخروج', he: 'התנתק', en: 'Logout' },
  email: { ar: 'البريد الإلكتروني', he: 'אימייל', en: 'Email' },
  password: { ar: 'كلمة المرور', he: 'סיסמה', en: 'Password' },
  fullName: { ar: 'الاسم الكامل', he: 'שם מלא', en: 'Full Name' },
  enterEmail: { ar: 'أدخل بريدك الإلكتروني', he: 'הזן אימייל', en: 'Enter your email' },
  enterPassword: { ar: 'أدخل كلمة المرور', he: 'הזן סיסמה', en: 'Enter password' },
  enterFullName: { ar: 'أدخل اسمك الكامل', he: 'הזן שם מלא', en: 'Enter your full name' },
  welcomeBack: { ar: 'مرحباً بعودتك', he: 'ברוך שובך', en: 'Welcome Back' },
  createAccount: { ar: 'إنشاء حساب جديد', he: 'יצירת חשבון חדש', en: 'Create New Account' },
  noAccountSignup: { ar: 'ليس لديك حساب؟ سجل الآن', he: 'אין לך חשבון? הירשם עכשיו', en: "Don't have an account? Sign up" },
  hasAccountLogin: { ar: 'لديك حساب؟ سجل الدخول', he: 'יש לך חשבון? התחבר', en: 'Already have an account? Login' },
  invalidEmail: { ar: 'البريد الإلكتروني غير صالح', he: 'אימייל לא תקין', en: 'Invalid email address' },
  passwordTooShort: { ar: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', he: 'הסיסמה חייבת להכיל לפחות 6 תווים', en: 'Password must be at least 6 characters' },
  invalidCredentials: { ar: 'بيانات الدخول غير صحيحة', he: 'פרטי התחברות שגויים', en: 'Invalid login credentials' },
  emailAlreadyUsed: { ar: 'البريد الإلكتروني مستخدم بالفعل', he: 'האימייל כבר בשימוש', en: 'Email already registered' },
  loginSuccess: { ar: 'تم تسجيل الدخول بنجاح', he: 'התחברת בהצלחה', en: 'Logged in successfully' },
  signupSuccess: { ar: 'تم إنشاء الحساب بنجاح', he: 'החשבון נוצר בהצלחה', en: 'Account created successfully' },
  backToHome: { ar: 'العودة للرئيسية', he: 'חזרה לדף הבית', en: 'Back to Home' },

  // Profile
  myProfile: { ar: 'حسابي', he: 'החשבון שלי', en: 'My Profile' },
  profile: { ar: 'الملف الشخصي', he: 'פרופיל', en: 'Profile' },
  orders: { ar: 'الطلبات', he: 'הזמנות', en: 'Orders' },
  addresses: { ar: 'العناوين', he: 'כתובות', en: 'Addresses' },
  favorites: { ar: 'المفضلة', he: 'מועדפים', en: 'Favorites' },
  personalInfo: { ar: 'المعلومات الشخصية', he: 'מידע אישי', en: 'Personal Information' },
  manageYourInfo: { ar: 'إدارة معلوماتك الشخصية', he: 'נהל את המידע האישי שלך', en: 'Manage your personal information' },
  edit: { ar: 'تعديل', he: 'עריכה', en: 'Edit' },
  save: { ar: 'حفظ', he: 'שמור', en: 'Save' },
  updateFailed: { ar: 'فشل التحديث', he: 'העדכון נכשל', en: 'Update failed' },
  profileUpdated: { ar: 'تم تحديث الملف الشخصي', he: 'הפרופיל עודכן', en: 'Profile updated' },
  orderHistory: { ar: 'سجل الطلبات', he: 'היסטוריית הזמנות', en: 'Order History' },
  viewPastOrders: { ar: 'عرض طلباتك السابقة', he: 'צפה בהזמנות קודמות', en: 'View your past orders' },
  noOrders: { ar: 'لا توجد طلبات', he: 'אין הזמנות', en: 'No orders yet' },
  pending: { ar: 'قيد الانتظار', he: 'בהמתנה', en: 'Pending' },
  completed: { ar: 'مكتمل', he: 'הושלם', en: 'Completed' },
  cancelled: { ar: 'ملغي', he: 'בוטל', en: 'Cancelled' },
  savedAddresses: { ar: 'العناوين المحفوظة', he: 'כתובות שמורות', en: 'Saved Addresses' },
  manageAddresses: { ar: 'إدارة عناوين التوصيل', he: 'נהל כתובות למשלוח', en: 'Manage your delivery addresses' },
  addAddress: { ar: 'إضافة عنوان', he: 'הוסף כתובת', en: 'Add Address' },
  addressLabel: { ar: 'اسم العنوان (مثال: المنزل)', he: 'שם הכתובת (לדוגמה: בית)', en: 'Address label (e.g., Home)' },
  street: { ar: 'الشارع', he: 'רחוב', en: 'Street' },
  city: { ar: 'المدينة', he: 'עיר', en: 'City' },
  noAddresses: { ar: 'لا توجد عناوين محفوظة', he: 'אין כתובות שמורות', en: 'No saved addresses' },
  default: { ar: 'افتراضي', he: 'ברירת מחדל', en: 'Default' },
  addressAdded: { ar: 'تمت إضافة العنوان', he: 'הכתובת נוספה', en: 'Address added' },
  addressDeleted: { ar: 'تم حذف العنوان', he: 'הכתובת נמחקה', en: 'Address deleted' },
  addFailed: { ar: 'فشلت الإضافة', he: 'ההוספה נכשלה', en: 'Failed to add' },
  myFavorites: { ar: 'منتجاتي المفضلة', he: 'המועדפים שלי', en: 'My Favorites' },
  savedProducts: { ar: 'المنتجات التي أعجبتك', he: 'מוצרים שאהבת', en: 'Products you liked' },
  noFavorites: { ar: 'لا توجد منتجات مفضلة', he: 'אין מועדפים', en: 'No favorites yet' },
  removedFromFavorites: { ar: 'تمت الإزالة من المفضلة', he: 'הוסר מהמועדפים', en: 'Removed from favorites' },
  addedToFavorites: { ar: 'تمت الإضافة للمفضلة', he: 'נוסף למועדפים', en: 'Added to favorites' },

  // Phone auth
  loginWithPhone: { ar: 'الدخول برقم الهاتف', he: 'התחברות עם טלפון', en: 'Login with Phone' },
  loginWithEmail: { ar: 'الدخول بالبريد الإلكتروني', he: 'התחברות עם אימייל', en: 'Login with Email' },
  enterPhone: { ar: 'أدخل رقم الهاتف', he: 'הזן מספר טלפון', en: 'Enter phone number' },
  sendOtp: { ar: 'إرسال رمز التحقق', he: 'שלח קוד אימות', en: 'Send Verification Code' },
  otpSent: { ar: 'تم إرسال رمز التحقق', he: 'קוד האימות נשלח', en: 'Verification code sent' },
  otpCode: { ar: 'رمز التحقق', he: 'קוד אימות', en: 'Verification Code' },
  enterOtp: { ar: 'أدخل رمز التحقق', he: 'הזן קוד אימות', en: 'Enter verification code' },
  verifyOtp: { ar: 'تحقق', he: 'אמת', en: 'Verify' },
  invalidPhone: { ar: 'رقم الهاتف غير صالح', he: 'מספר טלפון לא תקין', en: 'Invalid phone number' },
  invalidOtp: { ar: 'رمز التحقق غير صحيح', he: 'קוד אימות שגוי', en: 'Invalid verification code' },

  // Password reset
  resetPassword: { ar: 'إعادة تعيين كلمة المرور', he: 'איפוס סיסמה', en: 'Reset Password' },
  changePassword: { ar: 'تغيير كلمة المرور', he: 'שנה סיסמה', en: 'Change Password' },
  newPassword: { ar: 'كلمة المرور الجديدة', he: 'סיסמה חדשה', en: 'New Password' },
  confirmNewPassword: { ar: 'تأكيد كلمة المرور الجديدة', he: 'אשר סיסמה חדשה', en: 'Confirm New Password' },
  enterNewPassword: { ar: 'أدخل كلمة المرور الجديدة', he: 'הזן סיסמה חדשה', en: 'Enter new password' },
  passwordsDoNotMatch: { ar: 'كلمات المرور غير متطابقة', he: 'הסיסמאות לא תואמות', en: 'Passwords do not match' },
  passwordResetEmailSent: { ar: 'تم إرسال رابط إعادة التعيين لبريدك', he: 'קישור לאיפוס נשלח לאימייל שלך', en: 'Password reset link sent to your email' },
  passwordChanged: { ar: 'تم تغيير كلمة المرور بنجاح', he: 'הסיסמה שונתה בהצלחה', en: 'Password changed successfully' },
  passwordChangeFailed: { ar: 'فشل تغيير كلمة المرور', he: 'שינוי הסיסמה נכשל', en: 'Password change failed' },
  sendResetLink: { ar: 'إرسال رابط إعادة التعيين', he: 'שלח קישור איפוס', en: 'Send Reset Link' },
  security: { ar: 'الأمان', he: 'אבטחה', en: 'Security' },
  securityDesc: { ar: 'إدارة كلمة المرور والأمان', he: 'ניהול סיסמה ואבטחה', en: 'Manage your password and security' },
} as const;

export type TranslationKey = keyof typeof translations;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  dir: 'rtl' | 'ltr';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getStoredLanguage(): Language {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === 'ar' || stored === 'he' || stored === 'en') return stored;
  } catch {
    // localStorage unavailable
  }
  return 'ar';
}

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(getStoredLanguage);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // localStorage unavailable
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'en' ? 'ltr' : 'rtl';
  }, [language]);

  const t = (key: TranslationKey): string => {
    return translations[key]?.[language] || key;
  };

  const dir = language === 'en' ? 'ltr' : 'rtl';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
