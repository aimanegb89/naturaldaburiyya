import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, User, Package, MapPin, Heart, LogOut, Plus, Trash2, Edit2, Check, X, Lock, Mail, KeyRound
} from 'lucide-react';
import { toast } from 'sonner';
import { products } from '@/data/products';
import { getProductName as getLocalizedName } from '@/lib/product-utils';

interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  phone: string;
  is_default: boolean;
}

interface OrderItem {
  product_name: string;
  quantity: number;
  size: string;
  price: number;
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  items: OrderItem[];
}

interface ProfileData {
  full_name: string;
  phone: string;
}

const Profile = () => {
  const { t, dir, language } = useLanguage();
  const { user, signOut, resetPassword, updatePassword, loading } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<ProfileData>({ full_name: '', phone: '' });
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: '', street: '', city: '', phone: '' });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .single();
    if (error) {
      toast.error(t('updateFailed'));
      return;
    }
    if (data) setProfile({ full_name: data.full_name || '', phone: data.phone || '' });
  }, [user, t]);

  const fetchAddresses = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false });
    if (error) return;
    if (data) setAddresses(data);
  }, [user]);

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    const { data: ordersData, error } = await supabase
      .from('orders')
      .select('*, order_items(product_name, quantity, size, price)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) return;
    if (ordersData) {
      setOrders(
        ordersData.map((order: any) => ({
          ...order,
          items: order.order_items || [],
        }))
      );
    }
  }, [user]);

  const fetchFavorites = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('favorites')
      .select('product_id')
      .eq('user_id', user.id);
    if (error) return;
    if (data) setFavorites(data.map(f => f.product_id));
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchAddresses();
      fetchOrders();
      fetchFavorites();
    }
  }, [user, fetchProfile, fetchAddresses, fetchOrders, fetchFavorites]);

  const updateProfile = async () => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: profile.full_name, phone: profile.phone })
      .eq('id', user.id);
    
    if (error) {
      toast.error(t('updateFailed'));
    } else {
      toast.success(t('profileUpdated'));
      setIsEditing(false);
    }
  };

  const addAddress = async () => {
    if (!user) return;
    const { error } = await supabase
      .from('addresses')
      .insert({
        user_id: user.id,
        label: newAddress.label,
        street: newAddress.street,
        city: newAddress.city,
        phone: newAddress.phone,
        is_default: addresses.length === 0
      });
    
    if (error) {
      toast.error(t('addFailed'));
    } else {
      toast.success(t('addressAdded'));
      setNewAddress({ label: '', street: '', city: '', phone: '' });
      setShowAddAddress(false);
      fetchAddresses();
    }
  };

  const deleteAddress = async (id: string) => {
    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', id);
    
    if (error) return;
    setAddresses(addresses.filter(a => a.id !== id));
    toast.success(t('addressDeleted'));
  };

  const removeFavorite = async (productId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId);
    
    if (error) return;
    setFavorites(favorites.filter(f => f !== productId));
    toast.success(t('removedFromFavorites'));
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleSendResetEmail = async () => {
    if (!user?.email) return;
    setIsSendingReset(true);
    try {
      const { error } = await resetPassword(user.email);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(t('passwordResetEmailSent'));
      }
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error(t('passwordTooShort'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('passwordsDoNotMatch'));
      return;
    }
    setIsChangingPassword(true);
    try {
      const { error } = await updatePassword(newPassword);
      if (error) {
        toast.error(t('passwordChangeFailed'));
      } else {
        toast.success(t('passwordChanged'));
        setNewPassword('');
        setConfirmPassword('');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getProductDisplayName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return productId;
    return getLocalizedName(product, language);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-primary bg-primary/10';
      case 'pending': return 'text-secondary bg-secondary/10';
      case 'cancelled': return 'text-destructive bg-destructive/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface" dir={dir}>
      {/* Header - Material App Bar */}
      <div className="bg-surface-container shadow-elevation-2 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/')} className="gap-[8px]">
            <ArrowLeft className="w-[18px] h-[18px]" />
            {t('backToHome')}
          </Button>
          <Button variant="ghost" onClick={handleLogout} className="gap-[8px] text-destructive">
            <LogOut className="w-[18px] h-[18px]" />
            {t('logout')}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="md-display-small text-foreground mb-8">{t('myProfile')}</h1>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8 bg-surface-container-high rounded-full p-[3px] h-auto">
            <TabsTrigger 
              value="profile" 
              className="gap-[6px] rounded-full py-[8px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-elevation-1"
            >
              <User className="w-[16px] h-[16px]" />
              <span className="hidden sm:inline md-label-large">{t('profile')}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="gap-[6px] rounded-full py-[8px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-elevation-1"
            >
              <Lock className="w-[16px] h-[16px]" />
              <span className="hidden sm:inline md-label-large">{t('security')}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="orders" 
              className="gap-[6px] rounded-full py-[8px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-elevation-1"
            >
              <Package className="w-[16px] h-[16px]" />
              <span className="hidden sm:inline md-label-large">{t('orders')}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="addresses" 
              className="gap-[6px] rounded-full py-[8px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-elevation-1"
            >
              <MapPin className="w-[16px] h-[16px]" />
              <span className="hidden sm:inline md-label-large">{t('addresses')}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="favorites" 
              className="gap-[6px] rounded-full py-[8px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-elevation-1"
            >
              <Heart className="w-[16px] h-[16px]" />
              <span className="hidden sm:inline md-label-large">{t('favorites')}</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>{t('personalInfo')}</CardTitle>
                <CardDescription>{t('manageYourInfo')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label className="md-label-large">{t('email')}</Label>
                  <Input value={user?.email || ''} disabled className="bg-surface-container-high" />
                </div>
                <div className="space-y-2">
                  <Label className="md-label-large">{t('fullName')}</Label>
                  <Input 
                    value={profile.full_name} 
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-surface-container-high' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="md-label-large">{t('phone')}</Label>
                  <Input 
                    value={profile.phone} 
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-surface-container-high' : ''}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  {isEditing ? (
                    <>
                      <Button onClick={updateProfile} className="gap-2">
                        <Check className="w-4 h-4" />
                        {t('save')}
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditing(false)} className="gap-2">
                        <X className="w-4 h-4" />
                        {t('cancel')}
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" onClick={() => setIsEditing(true)} className="gap-2">
                      <Edit2 className="w-4 h-4" />
                      {t('edit')}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>{t('security')}</CardTitle>
                <CardDescription>{t('securityDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Reset via email */}
                {user?.email && (
                  <div className="bg-surface-container rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-[8px]">
                      <Mail className="w-[18px] h-[18px] text-primary" />
                      <h4 className="md-title-small">{t('resetPassword')}</h4>
                    </div>
                    <p className="md-body-small text-muted-foreground">{user.email}</p>
                    <Button
                      variant="outline"
                      size="default"
                      onClick={handleSendResetEmail}
                      disabled={isSendingReset}
                      className="gap-[6px]"
                    >
                      <KeyRound className="w-[16px] h-[16px]" />
                      {isSendingReset ? '...' : t('sendResetLink')}
                    </Button>
                  </div>
                )}

                {/* Change password directly */}
                <div className="bg-surface-container rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-[8px]">
                    <Lock className="w-[18px] h-[18px] text-primary" />
                    <h4 className="md-title-small">{t('changePassword')}</h4>
                  </div>
                  <div className="space-y-[8px]">
                    <Label className="md-label-large">{t('newPassword')}</Label>
                    <Input
                      type="password"
                      placeholder={t('enterNewPassword')}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-[8px]">
                    <Label className="md-label-large">{t('confirmNewPassword')}</Label>
                    <Input
                      type="password"
                      placeholder={t('confirmNewPassword')}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleChangePassword}
                    disabled={isChangingPassword || !newPassword || !confirmPassword}
                    className="gap-[6px]"
                  >
                    <Check className="w-[16px] h-[16px]" />
                    {isChangingPassword ? '...' : t('changePassword')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>{t('orderHistory')}</CardTitle>
                <CardDescription>{t('viewPastOrders')}</CardDescription>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                    <p className="md-body-large text-muted-foreground">{t('noOrders')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="bg-surface-container rounded-xl p-4 shadow-elevation-1">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="md-title-small">#{order.id.slice(0, 8)}</p>
                            <p className="md-body-small text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full md-label-small ${getStatusColor(order.status)}`}>
                            {t(order.status as TranslationKey)}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {order.items.map((item, idx) => (
                            <p key={idx} className="md-body-medium text-muted-foreground">
                              {item.quantity}x {item.product_name} ({item.size})
                            </p>
                          ))}
                        </div>
                        <p className="md-title-medium text-primary mt-3">
                          {t('total')}: {t('currency')}{order.total_amount}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Addresses Tab */}
          <TabsContent value="addresses">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{t('savedAddresses')}</CardTitle>
                  <CardDescription>{t('manageAddresses')}</CardDescription>
                </div>
                <Button onClick={() => setShowAddAddress(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  {t('addAddress')}
                </Button>
              </CardHeader>
              <CardContent>
                {showAddAddress && (
                  <div className="bg-surface-container rounded-xl p-4 mb-4 space-y-4 shadow-elevation-1">
                    <Input 
                      placeholder={t('addressLabel')} 
                      value={newAddress.label}
                      onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                    />
                    <Input 
                      placeholder={t('street')} 
                      value={newAddress.street}
                      onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                    />
                    <Input 
                      placeholder={t('city')} 
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    />
                    <Input 
                      placeholder={t('phone')} 
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                    />
                    <div className="flex gap-3">
                      <Button onClick={addAddress}>{t('save')}</Button>
                      <Button variant="outline" onClick={() => setShowAddAddress(false)}>{t('cancel')}</Button>
                    </div>
                  </div>
                )}
                
                {addresses.length === 0 && !showAddAddress ? (
                  <div className="text-center py-12">
                    <MapPin className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                    <p className="md-body-large text-muted-foreground">{t('noAddresses')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {addresses.map((address) => (
                      <div key={address.id} className="bg-surface-container rounded-xl p-4 flex justify-between items-start shadow-elevation-1">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="md-title-small">{address.label}</p>
                            {address.is_default && (
                              <span className="px-2 py-0.5 bg-primary/10 text-primary md-label-small rounded-full">
                                {t('default')}
                              </span>
                            )}
                          </div>
                          <p className="md-body-medium text-muted-foreground">{address.street}</p>
                          <p className="md-body-medium text-muted-foreground">{address.city}</p>
                          <p className="md-body-medium text-muted-foreground">{address.phone}</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => deleteAddress(address.id)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="favorites">
            <Card>
              <CardHeader>
                <CardTitle>{t('myFavorites')}</CardTitle>
                <CardDescription>{t('savedProducts')}</CardDescription>
              </CardHeader>
              <CardContent>
                {favorites.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                    <p className="md-body-large text-muted-foreground">{t('noFavorites')}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {favorites.map((productId) => {
                      const product = products.find(p => p.id === productId);
                      if (!product) return null;
                      return (
                        <div key={productId} className="bg-surface-container rounded-xl p-3 flex items-center gap-4 shadow-elevation-1">
                          <img 
                            src={product.image} 
                            alt={getProductDisplayName(productId)} 
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <p className="md-title-small">{getProductDisplayName(productId)}</p>
                            <p className="md-title-small text-primary">
                              {t('currency')}{product.priceSmall}
                            </p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => removeFavorite(productId)}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
