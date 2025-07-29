

import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback, useRef, useMemo } from 'react';
import { apiClient, handleApiError, setAuthToken, getAuthToken } from '@/services/apiClient'; 
import { 
    Category, MenuItem, Order, OrderStatus, AlertInfo, CartItem, CustomerDetails, 
    OrderItem, ManualOrderData, OrderType, PaymentMethod, Table, TableStatus, ReservationDetails,
    CashRegisterSession, CashRegisterSessionStatus, PaymentDetails,
    CashAdjustment, CashAdjustmentType, 
    AppSettings, defaultAppSettings,
    Profile, // Added Profile
    AuthenticatedUser, // Added AuthenticatedUser
    Action, AppState, AuthSession, // Added Action, AppState, AuthSession
    PizzaSize, PizzaCrust // Added PizzaSize and PizzaCrust
} from '../types';
import { parseOpeningHours, isStoreOpen as checkIsStoreOpen } from '@/utils/timeUtils'; // Added parseOpeningHours
import { GEMINI_API_ENDPOINT, generateId } from '../constants'; // For AI features if used by context and generateId

// Helper to play sound - can be moved to a utils file
const playSound = (url: string) => {
    try {
      const audio = new Audio(url);
      audio.play().catch(e => console.warn("Audio play failed:", e));
    } catch (e) {
      console.error("Failed to play sound:", e);
    }
};


const initialState: AppState = {
  categories: [],
  menuItems: [],
  orders: [],
  tables: [],
  profiles: [], // Initialize profiles
  cart: [],
  customerDetails: null,
  alert: null,
  isLoading: true, // Start with loading true
  isLoadingProfiles: true, // Specific loading for profiles
  authLoading: true, // For auth operations like sign-in, sign-up, status check
  activeCashSession: null,
  cashSessions: [],
  cashAdjustments: [],
  currentUser: null,
  currentProfile: null,
  isDeveloperAdmin: false,
  cashAdjustmentsTableMissing: false, // Assuming this might be checked
  settings: null, // Start with null, fetch from backend
  isLoadingSettings: true,
  settingsTableMissing: false, // Assuming this might be checked
  settingsError: null,
  prefilledCustomerForOrder: null,
  shouldOpenManualOrderModal: false,
  isStoreOpenNow: false,
  directOrderProfile: null,
};

const AppContextReducer = (state: AppState, action: Action): AppState => {
  console.log(`[AppContextReducer] Action: ${action.type}`, 'payload' in action && action.payload !== undefined ? `Payload: ${JSON.stringify(action.payload).substring(0,200)}...` : "(No payload)");
  switch (action.type) {
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'ADD_CATEGORY_SUCCESS':
      return { ...state, categories: [...state.categories, action.payload] };
    case 'UPDATE_CATEGORY_SUCCESS':
      return { ...state, categories: state.categories.map(c => c.id === action.payload.id ? action.payload : c) };
    case 'DELETE_CATEGORY_SUCCESS':
      return { ...state, categories: state.categories.filter(c => c.id !== action.payload) };
    
    case 'SET_MENU_ITEMS':
      return { ...state, menuItems: action.payload };
    case 'ADD_MENU_ITEM_SUCCESS':
      return { ...state, menuItems: [...state.menuItems, action.payload] };
    case 'UPDATE_MENU_ITEM_SUCCESS':
      return { ...state, menuItems: state.menuItems.map(item => item.id === action.payload.id ? action.payload : item) };
    case 'DELETE_MENU_ITEM_SUCCESS':
      return { ...state, menuItems: state.menuItems.filter(item => item.id !== action.payload) };

    case 'SET_ORDERS':
      return { ...state, orders: action.payload };
    case 'ADD_ORDER_SUCCESS': {
      const newOrder = action.payload;
      // Play sound if admin and new order sound is enabled in settings
      if (state.currentUser && state.settings?.notifications?.sound_alert_new_order_admin && state.settings?.notifications?.sound_new_order_url) {
        console.log("[AppContext] Playing new order sound for admin.");
        playSound(state.settings.notifications.sound_new_order_url);
      }
      return { ...state, orders: [newOrder, ...state.orders.filter(o => o.id !== newOrder.id)] };
    }
    case 'UPDATE_ORDER_STATUS_SUCCESS':
      return { ...state, orders: state.orders.map(o => o.id === action.payload.id ? action.payload : o) };

    case 'SET_TABLES':
      return { ...state, tables: action.payload };
    case 'ADD_TABLE_SUCCESS':
      return { ...state, tables: [...state.tables, action.payload] };
    case 'UPDATE_TABLE_SUCCESS':
      return { ...state, tables: state.tables.map(t => t.id === action.payload.id ? action.payload : t) };
    case 'DELETE_TABLE_SUCCESS':
      return { ...state, tables: state.tables.filter(t => t.id !== action.payload) };
    
    case 'SET_PROFILES':
      return { ...state, profiles: action.payload };
    case 'ADD_PROFILE_SUCCESS':
      return { ...state, profiles: [...state.profiles, action.payload] };
    case 'UPDATE_PROFILE_SUCCESS':
      return { ...state, profiles: state.profiles.map(p => p.id === action.payload.id ? action.payload : p) };
    case 'DELETE_PROFILE_SUCCESS':
      return { ...state, profiles: state.profiles.filter(p => p.id !== action.payload) };
    case 'SET_LOADING_PROFILES':
      return { ...state, isLoadingProfiles: action.payload };

    case 'SET_CART':
      return { ...state, cart: action.payload };
    case 'ADD_TO_CART': {
      // Logic to add or update quantity in cart
      const existingItemIndex = state.cart.findIndex(cartItem => 
          cartItem.menuItemId === action.payload.menuItemId &&
          // For pizzas, size and crust must also match if they exist
          (action.payload.itemType !== 'pizza' || 
            (cartItem.selectedSize?.id === action.payload.selectedSize?.id && 
             cartItem.selectedCrust?.id === action.payload.selectedCrust?.id &&
             cartItem.isHalfAndHalf === action.payload.isHalfAndHalf &&
             cartItem.firstHalfFlavor?.menuItemId === action.payload.firstHalfFlavor?.menuItemId &&
             cartItem.secondHalfFlavor?.menuItemId === action.payload.secondHalfFlavor?.menuItemId
            )
          )
      );
      let newCart;
      if (existingItemIndex > -1) {
        newCart = state.cart.map((cartItem, index) => 
          index === existingItemIndex ? { ...cartItem, quantity: cartItem.quantity + action.payload.quantity } : cartItem
        );
      } else {
        newCart = [...state.cart, action.payload];
      }
      return { ...state, cart: newCart };
    }
    case 'ADD_RAW_CART_ITEM_SUCCESS': // Used by PizzaCustomizationModal or ManualOrder for complex items
        return { ...state, cart: [...state.cart, action.payload] };
    case 'REMOVE_FROM_CART':
      return { ...state, cart: state.cart.filter(item => item.id !== action.payload) };
    case 'UPDATE_CART_QUANTITY':
      return { 
        ...state, 
        cart: state.cart.map(item => item.id === action.payload.cartItemId ? { ...item, quantity: action.payload.quantity } : item) 
      };
    case 'CLEAR_CART':
      return { ...state, cart: [] };

    case 'SET_CUSTOMER_DETAILS':
      return { ...state, customerDetails: action.payload };
    case 'SET_ALERT':
      return { ...state, alert: action.payload };
    
    // Loading states
    case 'SET_LOADING': // General data loading
      return { ...state, isLoading: action.payload };
    case 'SET_AUTH_LOADING': // Auth specific loading
      return { ...state, authLoading: action.payload };
    
    // Cash Register
    case 'SET_ACTIVE_CASH_SESSION':
      return { ...state, activeCashSession: action.payload };
    case 'SET_CASH_SESSIONS':
      return { ...state, cashSessions: action.payload };
    case 'ADD_CASH_SESSION_SUCCESS':
      return { ...state, cashSessions: [...state.cashSessions, action.payload], activeCashSession: action.payload };
    case 'UPDATE_CASH_SESSION_SUCCESS':
      const updatedSessions = state.cashSessions.map(cs => cs.id === action.payload.id ? action.payload : cs);
      const newActiveSession = action.payload.status === CashRegisterSessionStatus.OPEN ? action.payload : null;
      return { ...state, cashSessions: updatedSessions, activeCashSession: newActiveSession };

    case 'SET_CASH_ADJUSTMENTS':
      return { ...state, cashAdjustments: action.payload };
    case 'ADD_CASH_ADJUSTMENT_SUCCESS':
      return { ...state, cashAdjustments: [...state.cashAdjustments, action.payload] };
    
    // Auth
    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload };
    case 'SET_CURRENT_PROFILE':
      return { ...state, currentProfile: action.payload };
    case 'SET_IS_DEVELOPER_ADMIN':
      return { ...state, isDeveloperAdmin: action.payload };

    // Settings specific actions
    case 'FETCH_SETTINGS_START':
    case 'UPDATE_SETTINGS_START':
        return { ...state, isLoadingSettings: true, settingsError: null };
    case 'FETCH_SETTINGS_SUCCESS':
    case 'UPDATE_SETTINGS_SUCCESS': {
        const parsedHours = parseOpeningHours(action.payload.store.opening_hours);
        const storeIsOpen = checkIsStoreOpen(parsedHours, action.payload.store.store_timezone);
        return { 
            ...state, 
            settings: action.payload, 
            isLoadingSettings: false, 
            settingsError: null,
            isStoreOpenNow: storeIsOpen,
            settingsTableMissing: false // Reset on successful fetch/update
        };
    }
    case 'FETCH_SETTINGS_FAILURE':
    case 'UPDATE_SETTINGS_FAILURE':
        return { ...state, isLoadingSettings: false, settingsError: action.payload };
    case 'SET_SETTINGS_TABLE_MISSING':
        return { ...state, settingsTableMissing: action.payload, isLoadingSettings: false };

    case 'SET_PREFILLED_CUSTOMER_FOR_ORDER':
        return { ...state, prefilledCustomerForOrder: action.payload };
    case 'SET_SHOULD_OPEN_MANUAL_ORDER_MODAL':
        return { ...state, shouldOpenManualOrderModal: action.payload };
    case 'SET_IS_STORE_OPEN_NOW': // Can be set by polling or settings update
        return { ...state, isStoreOpenNow: action.payload };
    case 'SET_DIRECT_ORDER_PROFILE':
        return { ...state, directOrderProfile: action.payload };

    default:
      return state;
  }
};

// Context Props Type
interface AppContextProps extends AppState {
  dispatch: React.Dispatch<Action>;
  addCategory: (name: string) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addMenuItem: (itemData: Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateMenuItem: (itemData: MenuItem) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;
  placeOrder: () => Promise<Order | null>;
  updateOrderStatus: (id: string, status: OrderStatus, manual?: boolean) => Promise<void>;
  createManualOrder: (orderData: ManualOrderData) => Promise<Order | null>;
  addTable: (tableData: Omit<Table, 'id' | 'status' | 'current_order_id' | 'reservation_details'>) => Promise<void>;
  updateTable: (tableData: Partial<Table> & {id: string}) => Promise<void>;
  deleteTable: (id: string) => Promise<void>;
  addProfile: (profileData: Omit<Profile, 'id' | 'created_at' | 'updated_at'>) => Promise<Profile | null>;
  updateProfile: (id: string, profileData: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>) => Promise<Profile | null>;
  deleteProfile: (id: string) => Promise<void>;
  setAlert: (alertInfo: AlertInfo | null) => void;
  addToCart: (item: MenuItem, quantity?: number, selectedSize?: PizzaSize, selectedCrust?: PizzaCrust) => void;
  addRawCartItem: (cartItem: CartItem) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  setCustomerDetails: (details: CustomerDetails | null) => void;
  openCashRegister: (openingBalance: number, notes?: string) => Promise<void>;
  closeCashRegister: (sessionId: string, closingBalanceInformed: number, notes?: string) => Promise<void>;
  addCashAdjustment: (sessionId: string, type: CashAdjustmentType, amount: number, reason: string) => Promise<boolean>;
  forceCheckOrderTransitions: () => void;
  toggleOrderAutoProgress: (orderId: string) => void;
  updateSettings: (newSettings: AppSettings) => Promise<void>;
  initiateOrderForCustomer: (profile: Profile) => void;
  clearPrefilledCustomerForOrder: () => void;
  setDirectOrderProfileById: (profileId: string) => Promise<void>;
  fetchOrderWithItems: (orderId: string) => Promise<Order | null>;
  addItemsToOrder: (orderId: string, itemsToAdd: CartItem[]) => Promise<Order | null>;
  closeTableAccount: (orderId: string, paymentDetails: PaymentDetails) => Promise<Order | null>;
  
  // Auth methods
  checkAuthStatus: () => Promise<void>;
  signIn: (email: string, pass: string) => Promise<AuthenticatedUser | null>;
  signUp: (email: string, pass: string, fullName: string, phone?: string) => Promise<AuthenticatedUser | null>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<boolean>; // Returns true on success
  updateUserPassword: (token: string, newPass: string) => Promise<boolean>; // Returns true on success
  signInWithGoogle: () => Promise<void>; // Placeholder
}


const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [state, dispatch] = useReducer(AppContextReducer, initialState);
  const orderTimers = useRef<{[key: string]: number}>({});
  
  const setAlert = useCallback((alertInfo: AlertInfo | null) => {
    dispatch({ type: 'SET_ALERT', payload: alertInfo });
  }, []);


  // AUTHENTICATION METHODS
  const checkAuthStatusCb = useCallback(async () => {
    console.log("[AppContext] checkAuthStatusCb called");
    dispatch({ type: 'SET_AUTH_LOADING', payload: true });
    try {
      const token = getAuthToken();
      if (!token) {
        console.log("[AppContext] No token found in storage.");
        dispatch({ type: 'SET_CURRENT_USER', payload: null });
        dispatch({ type: 'SET_CURRENT_PROFILE', payload: null });
        dispatch({ type: 'SET_IS_DEVELOPER_ADMIN', payload: false });
        return;
      }
      // If a token exists, validate it with the backend
      const { user, profile } = await apiClient.get<{ user: AuthenticatedUser, profile: Profile }>('/auth/status');
      if (user && profile) {
        console.log("[AppContext] Auth status successful:", user, profile);
        setAuthToken(token); // Refresh token if backend sends a new one, or keep old one
        dispatch({ type: 'SET_CURRENT_USER', payload: user });
        dispatch({ type: 'SET_CURRENT_PROFILE', payload: profile });
        dispatch({ type: 'SET_IS_DEVELOPER_ADMIN', payload: !!profile.is_admin });
      } else {
        console.log("[AppContext] Auth status failed or no user/profile returned.");
        setAuthToken(null);
        dispatch({ type: 'SET_CURRENT_USER', payload: null });
        dispatch({ type: 'SET_CURRENT_PROFILE', payload: null });
        dispatch({ type: 'SET_IS_DEVELOPER_ADMIN', payload: false });
      }
    } catch (error) {
      console.error("[AppContext] Error checking auth status:", error);
      setAuthToken(null);
      dispatch({ type: 'SET_CURRENT_USER', payload: null });
      dispatch({ type: 'SET_CURRENT_PROFILE', payload: null });
      dispatch({ type: 'SET_IS_DEVELOPER_ADMIN', payload: false });
    } finally {
      dispatch({ type: 'SET_AUTH_LOADING', payload: false });
    }
  }, []);

  const signInCb = useCallback(async (email: string, pass: string): Promise<AuthenticatedUser | null> => {
    console.log(`[AppContext] signInCb called for email: ${email}`);
    dispatch({ type: 'SET_AUTH_LOADING', payload: true });
    try {
      const response = await apiClient.post<AuthSession>('/auth/sign-in', { email, password: pass });
      const { token, user, profile } = response;
      if (token && user && profile) {
        setAuthToken(token);
        dispatch({ type: 'SET_CURRENT_USER', payload: user });
        dispatch({ type: 'SET_CURRENT_PROFILE', payload: profile });
        dispatch({ type: 'SET_IS_DEVELOPER_ADMIN', payload: !!profile.is_admin });
        setAlert({ message: 'Login bem-sucedido!', type: 'success' });
        return user;
      }
      throw new Error("Resposta de login inválida do servidor.");
    } catch (error) {
      handleApiError(error, setAlert, "Falha no login.");
      return null;
    } finally {
        dispatch({ type: 'SET_AUTH_LOADING', payload: false });
    }
  }, [setAlert]);

  const signUpCb = useCallback(async (email: string, pass: string, fullName: string, phone?: string): Promise<AuthenticatedUser | null> => {
    console.log(`[AppContext] signUpCb called for email: ${email}`);
    dispatch({ type: 'SET_AUTH_LOADING', payload: true });
    try {
      // The backend should automatically make the first user an admin.
      const response = await apiClient.post<AuthSession>('/auth/sign-up', { email, password: pass, fullName, phone });
      const { token, user, profile } = response;

      if (token && user && profile) {
        setAuthToken(token);
        dispatch({ type: 'SET_CURRENT_USER', payload: user });
        dispatch({ type: 'SET_CURRENT_PROFILE', payload: profile });
        dispatch({ type: 'SET_IS_DEVELOPER_ADMIN', payload: !!profile.is_admin });
        
        // Add the new profile to the local state to avoid a full reload
        dispatch({ type: 'ADD_PROFILE_SUCCESS', payload: profile });

        setAlert({ message: 'Cadastro realizado com sucesso!', type: 'success' });
        return user;
      }
      throw new Error("Resposta de cadastro inválida do servidor.");
    } catch (error) {
      handleApiError(error, setAlert, "Falha no cadastro.");
      return null;
    } finally {
        dispatch({ type: 'SET_AUTH_LOADING', payload: false });
    }
  }, [setAlert]);
  
  const signOutCb = useCallback(async () => {
    console.log("[AppContext] signOutCb called");
    dispatch({ type: 'SET_AUTH_LOADING', payload: true });
    try {
      await apiClient.post('/auth/sign-out', {}); 
    } catch (error) {
      console.warn("[AppContext] Error signing out on backend (clearing local state anyway):", error);
    } finally {
      setAuthToken(null);
      dispatch({ type: 'SET_CURRENT_USER', payload: null });
      dispatch({ type: 'SET_CURRENT_PROFILE', payload: null });
      dispatch({ type: 'SET_IS_DEVELOPER_ADMIN', payload: false });
      dispatch({ type: 'CLEAR_CART' });
      dispatch({ type: 'SET_CUSTOMER_DETAILS', payload: null });
      setAlert({ message: 'Você foi desconectado.', type: 'info' });
      dispatch({ type: 'SET_AUTH_LOADING', payload: false });
    }
  }, [setAlert]);

  const requestPasswordResetCb = useCallback(async (email: string): Promise<boolean> => {
    console.log(`[AppContext] requestPasswordResetCb called for email: ${email}`);
    dispatch({ type: 'SET_AUTH_LOADING', payload: true });
    try {
      await apiClient.post('/auth/request-password-reset', { email });
      setAlert({ message: 'Se o email estiver cadastrado, um link de recuperação foi enviado.', type: 'success' });
      dispatch({ type: 'SET_AUTH_LOADING', payload: false });
      return true;
    } catch (error) {
      handleApiError(error, setAlert, "Falha ao solicitar recuperação de senha.");
      dispatch({ type: 'SET_AUTH_LOADING', payload: false });
      return false;
    }
  }, [setAlert]);
  
  const updateUserPasswordCb = useCallback(async (token: string, newPass: string): Promise<boolean> => {
    console.log("[AppContext] updateUserPasswordCb called");
    dispatch({ type: 'SET_AUTH_LOADING', payload: true });
    try {
      await apiClient.post('/auth/update-password', { token, newPassword: newPass });
      setAlert({ message: 'Senha atualizada com sucesso! Faça login com sua nova senha.', type: 'success' });
      dispatch({ type: 'SET_AUTH_LOADING', payload: false });
      return true;
    } catch (error) {
      handleApiError(error, setAlert, "Falha ao atualizar senha.");
      dispatch({ type: 'SET_AUTH_LOADING', payload: false });
      return false;
    }
  }, [setAlert]);

  const signInWithGoogleCb = useCallback(async () => {
    setAlert({ message: "Login com Google ainda não implementado neste protótipo.", type: "info" });
  }, [setAlert]);

  // SINGLE, ROBUST INITIALIZATION EFFECT
  useEffect(() => {
    const initializeApp = async () => {
      console.log('[AppContext] >>> Initializing App...');
      let authUser: AuthenticatedUser | null = null;
      let userProfile: Profile | null = null;
      let currentUser: AuthenticatedUser | null = null;

      try {
        // Step 1: Check authentication status.
        const token = getAuthToken();
        if (token) {
            try {
                const { user, profile } = await apiClient.get<{ user: AuthenticatedUser; profile: Profile }>('/auth/status');
                if (user && profile) {
                    authUser = user;
                    userProfile = profile;
                    setAuthToken(token);
                }
            } catch (authError) {
                console.warn('[AppContext] Auth token found but validation failed. Clearing token.', authError);
                setAuthToken(null);
            }
        }
        
        dispatch({ type: 'SET_CURRENT_USER', payload: authUser });
        dispatch({ type: 'SET_CURRENT_PROFILE', payload: userProfile });
        dispatch({ type: 'SET_IS_DEVELOPER_ADMIN', payload: !!userProfile?.is_admin });
        dispatch({ type: 'SET_AUTH_LOADING', payload: false });
        currentUser = authUser; // Store for use in Step 3

        // Step 2: Fetch critical data (settings, profiles) needed for all views.
        const [settingsData, profilesData] = await Promise.all([
            apiClient.get<AppSettings>('/settings/default_settings').catch(() => ({ ...defaultAppSettings })),
            apiClient.get<Profile[]>('/profiles').catch(() => [])
        ]);

        dispatch({ type: 'FETCH_SETTINGS_SUCCESS', payload: settingsData });
        dispatch({ type: 'SET_PROFILES', payload: profilesData });
        dispatch({ type: 'SET_LOADING_PROFILES', payload: false }); // Unblock LoginPage

        // Step 3: Fetch remaining data based on auth status.
        let dataPromises;
        if (currentUser) {
            dataPromises = [
                apiClient.get<Category[]>('/categories'),
                apiClient.get<MenuItem[]>('/menu_items'),
                apiClient.get<Order[]>('/orders'),
                apiClient.get<Table[]>('/tables'),
                apiClient.get<CashRegisterSession[]>('/cash_register_sessions'),
                apiClient.get<CashAdjustment[]>('/cash_adjustments').catch(() => [])
            ] as const;
            const [categories, menuItems, orders, tables, cashSessions, cashAdjustments] = await Promise.all(dataPromises);
            dispatch({ type: 'SET_CATEGORIES', payload: categories });
            dispatch({ type: 'SET_MENU_ITEMS', payload: menuItems });
            dispatch({ type: 'SET_ORDERS', payload: orders });
            dispatch({ type: 'SET_TABLES', payload: tables });
            dispatch({ type: 'SET_CASH_SESSIONS', payload: cashSessions });
            dispatch({ type: 'SET_ACTIVE_CASH_SESSION', payload: cashSessions.find(cs => cs.status === 'aberto') || null });
            dispatch({ type: 'SET_CASH_ADJUSTMENTS', payload: cashAdjustments });
        } else {
            dataPromises = [
                apiClient.get<Category[]>('/categories'),
                apiClient.get<MenuItem[]>('/menu_items'),
            ] as const;
            const [categories, menuItems] = await Promise.all(dataPromises);
            dispatch({ type: 'SET_CATEGORIES', payload: categories });
            dispatch({ type: 'SET_MENU_ITEMS', payload: menuItems });
        }
      } catch (error) {
        handleApiError(error, setAlert, 'Falha crítica ao inicializar a aplicação.');
        if (state.authLoading) dispatch({ type: 'SET_AUTH_LOADING', payload: false });
        if (state.isLoadingProfiles) dispatch({ type: 'SET_LOADING_PROFILES', payload: false });
        if (state.isLoadingSettings) dispatch({ type: 'FETCH_SETTINGS_FAILURE', payload: (error as Error).message });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
        console.log('[AppContext] <<< App Initialization Finished.');
      }
    };
  
    initializeApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount.


  // CRUD Operations for Categories
  const addCategory = useCallback(async (name: string) => {
    try {
      const newCategory = await apiClient.post<Category>('/categories', { name });
      dispatch({ type: 'ADD_CATEGORY_SUCCESS', payload: newCategory });
      setAlert({ message: 'Categoria adicionada!', type: 'success' });
    } catch (error) {
      handleApiError(error, setAlert, 'Falha ao adicionar categoria.');
    }
  }, [setAlert]);

  const updateCategory = useCallback(async (category: Category) => {
    try {
      const updatedCategory = await apiClient.put<Category>(`/categories/${category.id}`, category);
      dispatch({ type: 'UPDATE_CATEGORY_SUCCESS', payload: updatedCategory });
      setAlert({ message: 'Categoria atualizada!', type: 'success' });
    } catch (error) {
      handleApiError(error, setAlert, 'Falha ao atualizar categoria.');
    }
  }, [setAlert]);

  const deleteCategory = useCallback(async (id: string) => {
    try {
      await apiClient.delete(`/categories/${id}`);
      dispatch({ type: 'DELETE_CATEGORY_SUCCESS', payload: id });
      setAlert({ message: 'Categoria excluída!', type: 'success' });
    } catch (error) {
      handleApiError(error, setAlert, 'Falha ao excluir categoria.');
    }
  }, [setAlert]);
  
  // CRUD for MenuItems
  const addMenuItem = useCallback(async (itemData: Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newItem = await apiClient.post<MenuItem>('/menu_items', itemData);
      dispatch({ type: 'ADD_MENU_ITEM_SUCCESS', payload: newItem });
      setAlert({ message: 'Item do cardápio adicionado!', type: 'success' });
    } catch (error) {
      handleApiError(error, setAlert, 'Falha ao adicionar item.');
    }
  }, [setAlert]);

  const updateMenuItem = useCallback(async (itemData: MenuItem) => {
    try {
      const updatedItem = await apiClient.put<MenuItem>(`/menu_items/${itemData.id}`, itemData);
      dispatch({ type: 'UPDATE_MENU_ITEM_SUCCESS', payload: updatedItem });
      setAlert({ message: 'Item do cardápio atualizado!', type: 'success' });
    } catch (error) {
      handleApiError(error, setAlert, 'Falha ao atualizar item.');
    }
  }, [setAlert]);

  const deleteMenuItem = useCallback(async (id: string) => {
    try {
      await apiClient.delete(`/menu_items/${id}`);
      dispatch({ type: 'DELETE_MENU_ITEM_SUCCESS', payload: id });
      setAlert({ message: 'Item do cardápio excluído!', type: 'success' });
    } catch (error) {
      handleApiError(error, setAlert, 'Falha ao excluir item.');
    }
  }, [setAlert]);

  // CRUD for Tables
  const addTable = useCallback(async (tableData: Omit<Table, 'id' | 'status' | 'current_order_id' | 'reservation_details' | 'created_at' | 'updated_at'>) => {
    try {
        const newTable = await apiClient.post<Table>('/tables', tableData);
        dispatch({ type: 'ADD_TABLE_SUCCESS', payload: newTable });
        setAlert({ message: 'Mesa adicionada!', type: 'success' });
    } catch (error) { handleApiError(error, setAlert, 'Falha ao adicionar mesa.'); }
  }, [setAlert]);

  const updateTable = useCallback(async (tableData: Partial<Table> & {id: string}) => {
    try {
        // If trying to clear a table that has an active (non-delivered/non-cancelled) order, prevent it or warn.
        if (tableData.status === TableStatus.NEEDS_CLEANING && tableData.id) {
            const currentTableState = state.tables.find(t => t.id === tableData.id);
            if (currentTableState?.current_order_id) {
                const order = state.orders.find(o => o.id === currentTableState.current_order_id);
                if (order && order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELLED) {
                    setAlert({ message: `Não é possível liberar a mesa ${currentTableState.name}. O pedido ${order.id.substring(0,6)} ainda está ${order.status}. Finalize o pedido primeiro.`, type: 'error'});
                    return; // Prevent update
                }
            }
        }
        const updatedTable = await apiClient.patch<Table>(`/tables/${tableData.id}`, tableData); // Use PATCH for partial updates
        dispatch({ type: 'UPDATE_TABLE_SUCCESS', payload: updatedTable });
        setAlert({ message: `Mesa ${updatedTable.name} atualizada!`, type: 'success' });
    } catch (error) { handleApiError(error, setAlert, 'Falha ao atualizar mesa.'); }
  }, [setAlert, state.tables, state.orders]);

  const deleteTable = useCallback(async (id: string) => {
    try {
        await apiClient.delete(`/tables/${id}`);
        dispatch({ type: 'DELETE_TABLE_SUCCESS', payload: id });
        setAlert({ message: 'Mesa excluída!', type: 'success' });
    } catch (error) { handleApiError(error, setAlert, 'Falha ao excluir mesa.'); }
  }, [setAlert]);


  // PROFILES (Customers / Users)
  const addProfile = useCallback(async (profileData: Omit<Profile, 'id' | 'created_at' | 'updated_at' | 'is_admin'>): Promise<Profile | null> => {
    dispatch({ type: 'SET_LOADING_PROFILES', payload: true });
    try {
      const newProfile = await apiClient.post<Profile>('/profiles', profileData);
      dispatch({ type: 'ADD_PROFILE_SUCCESS', payload: newProfile });
      setAlert({ message: 'Perfil de cliente adicionado!', type: 'success' });
      dispatch({ type: 'SET_LOADING_PROFILES', payload: false });
      return newProfile;
    } catch (error) {
      handleApiError(error, setAlert, 'Falha ao adicionar perfil.');
      dispatch({ type: 'SET_LOADING_PROFILES', payload: false });
      return null;
    }
  }, [setAlert]);

  const updateProfile = useCallback(async (id: string, profileData: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>): Promise<Profile | null> => {
    dispatch({ type: 'SET_LOADING_PROFILES', payload: true });
    try {
      const updatedProfile = await apiClient.patch<Profile>(`/profiles/${id}`, profileData);
      dispatch({ type: 'UPDATE_PROFILE_SUCCESS', payload: updatedProfile });
      setAlert({ message: 'Perfil atualizado!', type: 'success' });
      dispatch({ type: 'SET_LOADING_PROFILES', payload: false });
      return updatedProfile;
    } catch (error) {
      handleApiError(error, setAlert, 'Falha ao atualizar perfil.');
      dispatch({ type: 'SET_LOADING_PROFILES', payload: false });
      return null;
    }
  }, [setAlert]);

  const deleteProfile = useCallback(async (id: string) => {
    dispatch({ type: 'SET_LOADING_PROFILES', payload: true });
    try {
      await apiClient.delete(`/profiles/${id}`);
      dispatch({ type: 'DELETE_PROFILE_SUCCESS', payload: id });
      setAlert({ message: 'Perfil excluído!', type: 'success' });
    } catch (error) {
      handleApiError(error, setAlert, 'Falha ao excluir perfil.');
    } finally {
        dispatch({ type: 'SET_LOADING_PROFILES', payload: false });
    }
  }, [setAlert]);

  // Cart Management
  const addToCart = useCallback((item: MenuItem, quantity: number = 1, selectedSize?: PizzaSize, selectedCrust?: PizzaCrust) => {
    if (!item.available) {
      setAlert({ message: `${item.name} está indisponível.`, type: 'info'});
      return;
    }

    let cartItemName = item.name;
    let price = item.price;

    if (item.item_type === 'pizza') {
        if (!selectedSize) { // This should not happen if UI forces size selection
            setAlert({message: "Tamanho da pizza não selecionado.", type: "error"});
            return;
        }
        cartItemName += ` (${selectedSize.name})`;
        price = selectedSize.price;
        if (selectedCrust) {
            cartItemName += ` - Borda ${selectedCrust.name}`;
            price += selectedCrust.additionalPrice;
        }
    }

    const cartItem: CartItem = { 
        id: generateId(), // Unique ID for the cart item instance
        menuItemId: item.id, 
        name: cartItemName, 
        price: price, 
        quantity, 
        imageUrl: item.image_url,
        itemType: item.item_type,
        selectedSize: selectedSize,
        selectedCrust: selectedCrust,
        // Half-and-half details would be set here if standard add to cart supported it directly
    };
    dispatch({ type: 'ADD_TO_CART', payload: cartItem });
  }, [setAlert]);

  const addRawCartItem = useCallback((cartItem: CartItem) => {
    if (!state.settings?.store?.store_name && !checkIsStoreOpen(state.settings?.parsedOpeningHours, state.settings?.store.store_timezone)){
      setAlert({ message: "A loja está fechada. Não é possível adicionar itens.", type: 'info' });
      return;
    }
    dispatch({ type: 'ADD_RAW_CART_ITEM_SUCCESS', payload: cartItem });
  }, [setAlert, state.isStoreOpenNow, state.settings]);


  const removeFromCart = useCallback((cartItemId: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: cartItemId });
  }, []);

  const updateCartQuantity = useCallback((cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      dispatch({ type: 'REMOVE_FROM_CART', payload: cartItemId });
    } else {
      dispatch({ type: 'UPDATE_CART_QUANTITY', payload: { cartItemId, quantity } });
    }
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, []);

  const setCustomerDetails = useCallback((details: CustomerDetails | null) => {
    dispatch({ type: 'SET_CUSTOMER_DETAILS', payload: details });
  }, []);

  // Order Placement
  const placeOrder = useCallback(async (): Promise<Order | null> => {
    if (!state.customerDetails || state.cart.length === 0) {
      setAlert({ message: 'Detalhes do cliente ou carrinho vazio.', type: 'error' });
      return null;
    }
    const orderData: Omit<Order, 'id'|'order_time'|'last_status_change_time'|'status'|'total_amount'|'current_progress_percent'|'next_auto_transition_time'> & {items: Omit<OrderItem, 'id'|'order_id'>[]} = {
      customer_name: state.customerDetails.name,
      customer_phone: state.customerDetails.phone,
      customer_address: state.customerDetails.address,
      notes: state.customerDetails.notes,
      auto_progress: true, // Default to true for new customer orders
      order_type: OrderType.DELIVERY, // Default, could be made configurable
      items: state.cart.map(ci => ({
        menu_item_id: ci.menuItemId,
        quantity: ci.quantity,
        name: ci.name, // Name as constructed in cart (e.g. with size/crust)
        price: ci.price, // Price as calculated in cart
        selected_size_id: ci.selectedSize?.id,
        selected_crust_id: ci.selectedCrust?.id,
        is_half_and_half: ci.isHalfAndHalf,
        first_half_flavor: ci.firstHalfFlavor,
        second_half_flavor: ci.secondHalfFlavor,
      })),
    };

    try {
      const newOrder = await apiClient.post<Order>('/orders', orderData);
      dispatch({ type: 'ADD_ORDER_SUCCESS', payload: newOrder });
      dispatch({ type: 'CLEAR_CART' });
      dispatch({ type: 'SET_CUSTOMER_DETAILS', payload: null }); // Clear details after order
      setAlert({ message: `Pedido #${newOrder.id.substring(0,6)} realizado com sucesso!`, type: 'success' });
      return newOrder;
    } catch (error) {
      handleApiError(error, setAlert, 'Falha ao realizar pedido.');
      return null;
    }
  }, [state.cart, state.customerDetails, setAlert]);

  const updateOrderStatus = useCallback(async (id: string, status: OrderStatus, manual: boolean = false) => {
    try {
      const updatedOrder = await apiClient.patch<Order>(`/orders/${id}/status`, { status, manual_update: manual });
      dispatch({ type: 'UPDATE_ORDER_STATUS_SUCCESS', payload: updatedOrder });
    } catch (error) {
      handleApiError(error, setAlert, 'Falha ao atualizar status do pedido.');
    }
  }, [setAlert]);

  const createManualOrder = useCallback(async (orderData: ManualOrderData): Promise<Order | null> => {
    console.log("[AppContext] createManualOrder called with data:", orderData);
    try {
        const newOrderPayload = {
            customer_name: orderData.customerName,
            customer_phone: orderData.customerPhone,
            customer_address: orderData.customerAddress,
            notes: orderData.notes,
            items: orderData.items.map(item => ({
                menu_item_id: item.menuItemId,
                quantity: item.quantity,
                name: item.name,
                price: item.price,
                selected_size_id: item.selectedSize?.id,
                selected_crust_id: item.selectedCrust?.id,
                is_half_and_half: item.isHalfAndHalf,
                first_half_flavor: item.firstHalfFlavor,
                second_half_flavor: item.secondHalfFlavor,
            })),
            order_type: orderData.orderType,
            table_id: orderData.tableId,
            payment_method: orderData.paymentMethod,
            amount_paid: orderData.amountPaid,
            auto_progress: true, // Manual orders usually start auto progress
        };
        console.log("[AppContext] createManualOrder sending payload to API:", newOrderPayload);
        const newOrder = await apiClient.post<Order>('/orders/manual', newOrderPayload);
        dispatch({ type: 'ADD_ORDER_SUCCESS', payload: newOrder });
        
        if (newOrder.order_type === OrderType.MESA && newOrder.table_id) {
            const tableToUpdate = state.tables.find(t => t.id === newOrder.table_id);
            if (tableToUpdate) {
                await updateTable({ id: newOrder.table_id, status: TableStatus.OCCUPIED, current_order_id: newOrder.id, reservation_details: null });
            }
        }
        setAlert({ message: `Pedido manual #${newOrder.id.substring(0,6)} criado!`, type: 'success' });
        return newOrder;
    } catch (error) {
        handleApiError(error, setAlert, 'Falha ao criar pedido manual.');
        return null;
    }
  }, [setAlert, state.tables, updateTable]);


  // CASH REGISTER MANAGEMENT
  const openCashRegister = useCallback(async (openingBalance: number, notes?: string) => {
    if (state.activeCashSession) {
        setAlert({ message: "Já existe um caixa aberto.", type: "error" });
        return;
    }
    try {
        const payload = { opening_balance: openingBalance, notes_opening: notes, user_id_opened: state.currentUser?.id };
        const newSession = await apiClient.post<CashRegisterSession>('/cash_register_sessions/open', payload);
        dispatch({ type: 'ADD_CASH_SESSION_SUCCESS', payload: newSession });
        setAlert({ message: `Caixa aberto com R$ ${openingBalance.toFixed(2)}!`, type: 'success' });
    } catch (error) {
        handleApiError(error, setAlert, 'Falha ao abrir caixa.');
    }
  }, [setAlert, state.activeCashSession, state.currentUser]);

  const closeCashRegister = useCallback(async (sessionId: string, closingBalanceInformed: number, notes?: string) => {
    if (!state.activeCashSession || state.activeCashSession.id !== sessionId) {
        setAlert({ message: "Nenhuma sessão ativa correspondente para fechar ou ID inválido.", type: "error" });
        return;
    }
    try {
        const payload = { closing_balance_informed: closingBalanceInformed, notes_closing: notes, user_id_closed: state.currentUser?.id };
        const closedSession = await apiClient.post<CashRegisterSession>(`/cash_register_sessions/${sessionId}/close`, payload);
        dispatch({ type: 'UPDATE_CASH_SESSION_SUCCESS', payload: closedSession });
        setAlert({ message: "Caixa fechado com sucesso!", type: 'success' });
    } catch (error) {
        handleApiError(error, setAlert, 'Falha ao fechar caixa.');
    }
  }, [setAlert, state.activeCashSession, state.currentUser]);

  const addCashAdjustment = useCallback(async (sessionId: string, type: CashAdjustmentType, amount: number, reason: string): Promise<boolean> => {
    try {
        const payload = { session_id: sessionId, type, amount, reason, user_id: state.currentUser?.id };
        const newAdjustment = await apiClient.post<CashAdjustment>('/cash_adjustments', payload);
        dispatch({ type: 'ADD_CASH_ADJUSTMENT_SUCCESS', payload: newAdjustment });
        setAlert({ message: `Ajuste de R$ ${amount.toFixed(2)} (${type === CashAdjustmentType.ADD ? 'entrada' : 'saída'}) registrado!`, type: 'success' });
        return true;
    } catch (error) {
        handleApiError(error, setAlert, 'Falha ao registrar ajuste de caixa.');
        return false;
    }
  }, [setAlert, state.currentUser]);
  
  // ORDER FLOW & AUTO PROGRESSION
  const forceCheckOrderTransitions = useCallback(async () => {
    console.log('[AppContext] Forcing check for order transitions...');
    try {
        const updatedOrders = await apiClient.post<Order[]>('/orders/check_transitions', {});
        dispatch({ type: 'SET_ORDERS', payload: updatedOrders }); // Assuming backend returns all orders or relevant updated ones
        setAlert({ message: "Verificação de fluxo de pedidos forçada.", type: "info" });
    } catch (error) {
        handleApiError(error, setAlert, "Falha ao forçar verificação de transições.");
    }
  }, [setAlert]);

  const toggleOrderAutoProgress = useCallback(async (orderId: string) => {
    try {
        const order = state.orders.find(o => o.id === orderId);
        if (!order) {
            setAlert({message: "Pedido não encontrado para alternar progresso.", type: "error"});
            return;
        }
        const updatedOrder = await apiClient.patch<Order>(`/orders/${orderId}/toggle_auto_progress`, { auto_progress: !order.auto_progress });
        dispatch({ type: 'UPDATE_ORDER_STATUS_SUCCESS', payload: updatedOrder }); // Re-use this action type if payload is just the Order
    } catch (error) {
        handleApiError(error, setAlert, "Falha ao alternar progresso automático do pedido.");
    }
  }, [state.orders, setAlert]);

  // Order Auto-Progression Logic (Client-Side Fallback/Enhancement)
  useEffect(() => {
    state.orders.forEach(order => {
      if (order.auto_progress && order.next_auto_transition_time && !orderTimers.current[order.id]) {
        const delay = new Date(order.next_auto_transition_time).getTime() - Date.now();
        if (delay > 0) {
          orderTimers.current[order.id] = window.setTimeout(() => {
            console.log(`[AppContext] Client-side timer expired for order ${order.id}. Forcing check.`);
            forceCheckOrderTransitions(); 
            delete orderTimers.current[order.id];
          }, delay);
        } else if (delay <=0 && order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELLED) {
             console.log(`[AppContext] Order ${order.id} next transition time already passed. Forcing check.`);
             forceCheckOrderTransitions();
        }
      } else if ((!order.auto_progress || !order.next_auto_transition_time || order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) && orderTimers.current[order.id]) {
        clearTimeout(orderTimers.current[order.id]);
        delete orderTimers.current[order.id];
      }
    });
    return () => {
      Object.values(orderTimers.current).forEach(clearTimeout);
      orderTimers.current = {};
    };
  }, [state.orders, forceCheckOrderTransitions]);


  const updateSettings = useCallback(async (newSettings: AppSettings) => {
    dispatch({ type: 'UPDATE_SETTINGS_START' });
    try {
      const savedSettings = await apiClient.put<AppSettings>('/settings/default_settings', newSettings);
      dispatch({ type: 'UPDATE_SETTINGS_SUCCESS', payload: savedSettings });
      setAlert({ message: 'Configurações salvas com sucesso!', type: 'success' });
    } catch (error) {
      handleApiError(error, setAlert, 'Falha ao salvar configurações.');
      dispatch({ type: 'UPDATE_SETTINGS_FAILURE', payload: (error as Error).message });
    }
  }, [setAlert]);
  
  const initiateOrderForCustomer = useCallback((profile: Profile) => {
    dispatch({ type: 'SET_PREFILLED_CUSTOMER_FOR_ORDER', payload: profile });
    dispatch({ type: 'SET_SHOULD_OPEN_MANUAL_ORDER_MODAL', payload: true });
  }, []);

  const clearPrefilledCustomerForOrder = useCallback(() => {
    dispatch({ type: 'SET_PREFILLED_CUSTOMER_FOR_ORDER', payload: null });
  }, []);

  const setDirectOrderProfileById = useCallback(async (profileId: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
        const profile = await apiClient.get<Profile>(`/profiles/${profileId}`);
        if (profile) {
            dispatch({ type: 'SET_DIRECT_ORDER_PROFILE', payload: profile });
            dispatch({ type: 'SET_CUSTOMER_DETAILS', payload: {
                name: profile.full_name || '',
                phone: profile.phone || '',
                address: profile.default_address || '',
                addressReference: profile.default_address_reference || '',
                notes: ''
            }});
        } else {
             setAlert({message: `Perfil com ID ${profileId} não encontrado.`, type: "error"});
        }
    } catch (error) {
        handleApiError(error, setAlert, `Falha ao buscar perfil ${profileId}.`);
    } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [setAlert]);

   const fetchOrderWithItems = useCallback(async (orderId: string): Promise<Order | null> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
        const order = await apiClient.get<Order>(`/orders/${orderId}?embed=items`);
        if (order) {
            return order;
        }
        setAlert({message: `Pedido ${orderId} não encontrado.`, type: 'error'});
        return null;
    } catch (error) {
        handleApiError(error, setAlert, 'Falha ao buscar detalhes do pedido.');
        return null;
    } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [setAlert]);
  
  const addItemsToOrder = useCallback(async (orderId: string, itemsToAdd: CartItem[]): Promise<Order | null> => {
    if (itemsToAdd.length === 0) {
        setAlert({message: "Nenhum item selecionado para adicionar.", type: "info"});
        return state.orders.find(o => o.id === orderId) || null;
    }
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
        const orderItemsPayload: Omit<OrderItem, 'id' | 'order_id'>[] = itemsToAdd.map(ci => ({
            menu_item_id: ci.menuItemId,
            quantity: ci.quantity,
            name: ci.name,
            price: ci.price,
            selected_size_id: ci.selectedSize?.id,
            selected_crust_id: ci.selectedCrust?.id,
            is_half_and_half: ci.isHalfAndHalf,
            first_half_flavor: ci.firstHalfFlavor,
            second_half_flavor: ci.secondHalfFlavor,
        }));

        const updatedOrder = await apiClient.post<Order>(`/orders/${orderId}/add_items`, { items: orderItemsPayload });
        dispatch({ type: 'UPDATE_ORDER_STATUS_SUCCESS', payload: updatedOrder });
        setAlert({message: `${itemsToAdd.length} item(s) adicionados ao pedido #${orderId.substring(0,6)}!`, type: "success"});
        return updatedOrder;
    } catch (error) {
        handleApiError(error, setAlert, 'Falha ao adicionar itens ao pedido.');
        return null;
    } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [setAlert, state.orders]);

  const closeTableAccount = useCallback(async (orderId: string, paymentDetails: PaymentDetails): Promise<Order | null> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
        const closedOrder = await apiClient.post<Order>(`/orders/${orderId}/close_table_account`, paymentDetails);
        dispatch({ type: 'UPDATE_ORDER_STATUS_SUCCESS', payload: closedOrder });
        if (closedOrder.table_id && closedOrder.status === OrderStatus.DELIVERED) {
             await updateTable({ id: closedOrder.table_id, status: TableStatus.NEEDS_CLEANING, current_order_id: null });
        }
        setAlert({message: `Conta do pedido #${orderId.substring(0,6)} fechada.`, type: "success"});
        return closedOrder;
    } catch (error) {
        handleApiError(error, setAlert, 'Falha ao fechar conta da mesa.');
        return null;
    } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [setAlert, updateTable]);


  const contextValue = useMemo(() => ({
    ...state,
    dispatch,
    addCategory, updateCategory, deleteCategory,
    addMenuItem, updateMenuItem, deleteMenuItem,
    placeOrder, updateOrderStatus, createManualOrder,
    addTable, updateTable, deleteTable,
    addProfile, updateProfile, deleteProfile,
    setAlert,
    addToCart, addRawCartItem, removeFromCart, updateCartQuantity, clearCart, setCustomerDetails,
    openCashRegister, closeCashRegister, addCashAdjustment,
    forceCheckOrderTransitions, toggleOrderAutoProgress,
    updateSettings,
    initiateOrderForCustomer, clearPrefilledCustomerForOrder, setDirectOrderProfileById,
    fetchOrderWithItems, addItemsToOrder, closeTableAccount,
    // Auth methods
    checkAuthStatus: checkAuthStatusCb, 
    signIn: signInCb, 
    signUp: signUpCb, 
    signOut: signOutCb,
    requestPasswordReset: requestPasswordResetCb,
    updateUserPassword: updateUserPasswordCb,
    signInWithGoogle: signInWithGoogleCb,
  }), [
      state, dispatch, addCategory, updateCategory, deleteCategory, addMenuItem, updateMenuItem, deleteMenuItem,
      placeOrder, updateOrderStatus, createManualOrder, addTable, updateTable, deleteTable, addProfile, updateProfile, deleteProfile,
      setAlert, addToCart, addRawCartItem, removeFromCart, updateCartQuantity, clearCart, setCustomerDetails,
      openCashRegister, closeCashRegister, addCashAdjustment, forceCheckOrderTransitions, toggleOrderAutoProgress,
      updateSettings, initiateOrderForCustomer, clearPrefilledCustomerForOrder, setDirectOrderProfileById,
      fetchOrderWithItems, addItemsToOrder, closeTableAccount,
      checkAuthStatusCb, signInCb, signUpCb, signOutCb, requestPasswordResetCb, updateUserPasswordCb, signInWithGoogleCb
  ]);


  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextProps => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
