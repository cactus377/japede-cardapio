// This file defines the TypeScript types for the application.

export enum OrderStatus {
  PENDING = 'Pendente',
  PREPARING = 'Em Preparo',
  READY_FOR_PICKUP = 'Pronto para Retirada',
  OUT_FOR_DELIVERY = 'Saiu para Entrega',
  DELIVERED = 'Entregue',
  CANCELLED = 'Cancelado',
}

export enum OrderType {
  MESA = 'Mesa',
  DELIVERY = 'Delivery',
  BALCAO = 'Balcão',
}

export enum PaymentMethod {
  DINHEIRO = 'Dinheiro',
  CARTAO_DEBITO = 'Cartão de Débito',
  CARTAO_CREDITO = 'Cartão de Crédito',
  PIX = 'PIX',
  MULTIPLO = 'Múltiplo',
}

export enum CashRegisterSessionStatus {
  OPEN = 'aberto',
  CLOSED = 'fechado',
}

export interface CashRegisterSession {
  id: string; 
  opened_at: string | Date; 
  closed_at?: string | Date | null;
  opening_balance: number;
  calculated_sales?: number | null; 
  expected_in_cash?: number | null; 
  closing_balance_informed?: number | null; 
  difference?: number | null; 
  notes_opening?: string | null;
  notes_closing?: string | null;
  status: CashRegisterSessionStatus;
  user_id_opened?: string; // ID do usuário que abriu
  user_id_closed?: string; // ID do usuário que fechou
  created_at?: string | Date; 
  updated_at?: string | Date;
}

export enum CashAdjustmentType {
  ADD = 'adicionar',
  REMOVE = 'remover',
}

export interface CashAdjustment {
  id: string;
  session_id: string;
  user_id: string; // ID do usuário que fez o ajuste
  type: CashAdjustmentType;
  amount: number;
  reason: string;
  adjusted_at: string | Date;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface Category {
  id: string;
  name: string;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface PizzaCrust {
  id: string; 
  name: string;
  additionalPrice: number;
}

export interface PizzaSize {
  id: string; 
  name: string;
  price: number;
  crusts?: PizzaCrust[]; 
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  available: boolean;
  item_type?: 'standard' | 'pizza';
  send_to_kitchen?: boolean;
  sizes?: PizzaSize[]; 
  allow_half_and_half?: boolean;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface OrderItemFlavorDetails {
  menuItemId: string;
  name: string;
  priceForSize: number;
  imageUrl?: string;
}

export interface OrderItem {
  id?: string; 
  order_id?: string; 
  menu_item_id: string;
  quantity: number;
  name: string; 
  price: number; 
  selected_size_id?: string;
  selected_crust_id?: string;
  is_half_and_half?: boolean;
  first_half_flavor?: OrderItemFlavorDetails;
  second_half_flavor?: OrderItemFlavorDetails;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface Order {
  id: string;
  customer_id?: string | null;
  customer_name: string;
  customer_phone?: string;
  customer_address?: string;
  items: OrderItem[];
  total_amount: number;
  status: OrderStatus;
  order_time: string | Date;
  notes?: string;
  last_status_change_time: string | Date;
  next_auto_transition_time?: string | Date | null;
  auto_progress: boolean;
  current_progress_percent?: number;
  order_type?: OrderType;
  table_id?: string | null;
  payment_method?: PaymentMethod | null; 
  amount_paid?: number | null;
  change_due?: number | null;
  cash_register_session_id?: string | null;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface PaymentDetails {
    paymentMethod: PaymentMethod;
    amountPaid?: number;
}

export interface AlertInfo {
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  itemType?: 'standard' | 'pizza';
  selectedSize?: PizzaSize; 
  selectedCrust?: PizzaCrust; 
  isHalfAndHalf?: boolean;
  firstHalfFlavor?: OrderItemFlavorDetails;
  secondHalfFlavor?: OrderItemFlavorDetails;
}

export interface CustomerDetails {
  name: string;
  phone: string;
  address: string;
  addressReference?: string; 
  notes?: string;
}

export interface ManualOrderItem extends CartItem {}

export interface ManualOrderData {
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  addressReference?: string;
  notes?: string;
  items: ManualOrderItem[];
  orderType: OrderType;
  tableId?: string;
  paymentMethod?: PaymentMethod;
  amountPaid?: number;
}

export enum TableStatus {
  AVAILABLE = 'Disponível',
  OCCUPIED = 'Ocupada',
  RESERVED = 'Reservada',
  NEEDS_CLEANING = 'Limpeza Pendente',
}

export interface ReservationDetails { 
  customerName?: string;
  time?: string; // ISO string or formatted date string
  guestCount?: number;
  notes?: string;
}

export interface Table {
  id: string;
  name: string;
  capacity: number;
  status: TableStatus;
  current_order_id?: string | null;
  reservation_details?: ReservationDetails | null;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface OpeningHoursEntry {
    enabled: boolean;
    open: string; // HH:MM
    close: string; // HH:MM
}
export interface OpeningHours {
    monday: OpeningHoursEntry;
    tuesday: OpeningHoursEntry;
    wednesday: OpeningHoursEntry;
    thursday: OpeningHoursEntry;
    friday: OpeningHoursEntry;
    saturday: OpeningHoursEntry;
    sunday: OpeningHoursEntry;
}
export interface ParsedOpeningHoursEntry {
    enabled: boolean;
    openMinutes: number;
    closeMinutes: number;
}
export interface ParsedOpeningHours {
    monday: ParsedOpeningHoursEntry;
    tuesday: ParsedOpeningHoursEntry;
    wednesday: ParsedOpeningHoursEntry;
    thursday: ParsedOpeningHoursEntry;
    friday: ParsedOpeningHoursEntry;
    saturday: ParsedOpeningHoursEntry;
    sunday: ParsedOpeningHoursEntry;
}

export type DeliveryFeeType = 'fixed' | 'per_km' | 'free' | 'free_above_value';
export interface StoreSettings {
    store_name: string;
    logo_url: string;
    phone_number: string;
    address_street: string;
    address_number: string;
    address_complement?: string;
    address_neighborhood: string;
    address_city: string;
    address_postal_code: string;
    store_timezone: string;
    opening_hours: OpeningHours;
    delivery_fee: {
        type: DeliveryFeeType;
        fixed_amount?: number;
        amount_per_km?: number;
        min_order_for_free_delivery?: number;
    };
    min_order_value_delivery?: number;
}

export interface PaymentSettings {
    accept_cash: boolean;
    accept_credit_card: boolean;
    accept_debit_card: boolean;
    accept_pix: boolean;
    pix_key_type?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
    pix_key?: string;
}

export interface WhatsAppSettings {
    notifications_enabled: boolean;
    api_url?: string;
    api_token?: string;
}

export interface PredefinedSound {
  key: string;
  label: string;
  url: string;
}

export interface NotificationSettings {
  sound_alert_new_order_admin: boolean;
  sound_new_order_url: string;
  predefined_sound_key: string;
  email_admin_new_order?: string;
}

export type OrderFlowDurations = {
    [key in OrderType]?: {
        [key in OrderStatus]?: number; // Duration in milliseconds
    };
};

export interface AppSettings {
    id: string; 
    store: StoreSettings;
    payments: PaymentSettings;
    whatsapp: WhatsAppSettings;
    notifications: NotificationSettings;
    order_flow: OrderFlowDurations;
    n8n_api_key: string | null;
    parsedOpeningHours?: ParsedOpeningHours; // Client-side computed
    updated_at?: string | Date;
}

export const defaultAppSettings: AppSettings = {
  id: 'default_settings',
  store: {
    store_name: 'Minha Loja Online',
    logo_url: '',
    phone_number: '(XX) XXXXX-XXXX',
    address_street: 'Rua Exemplo',
    address_number: '123',
    address_neighborhood: 'Bairro Modelo',
    address_city: 'Cidade Exemplo',
    address_postal_code: 'XXXXX-XXX',
    address_complement: '',
    store_timezone: 'America/Sao_Paulo',
    opening_hours: {
      monday: { enabled: true, open: '09:00', close: '18:00' },
      tuesday: { enabled: true, open: '09:00', close: '18:00' },
      wednesday: { enabled: true, open: '09:00', close: '18:00' },
      thursday: { enabled: true, open: '09:00', close: '18:00' },
      friday: { enabled: true, open: '09:00', close: '20:00' },
      saturday: { enabled: true, open: '10:00', close: '22:00' },
      sunday: { enabled: false, open: '10:00', close: '16:00' },
    },
    delivery_fee: {
      type: 'fixed' as DeliveryFeeType,
      fixed_amount: 5.00,
      amount_per_km: 0,
      min_order_for_free_delivery: 50.00,
    },
    min_order_value_delivery: 15.00,
  },
  payments: {
    accept_cash: true,
    accept_credit_card: true,
    accept_debit_card: true,
    accept_pix: true,
    pix_key_type: 'random',
    pix_key: '',
  },
  whatsapp: {
    notifications_enabled: false,
    api_url: '',
    api_token: '',
  },
  notifications: {
    sound_alert_new_order_admin: true,
    sound_new_order_url: 'https://mdn.github.io/voice-change-o-matic/audio/triangle.mp3',
    predefined_sound_key: 'default_ifood_like',
    email_admin_new_order: '',
  },
  order_flow: {
    [OrderType.MESA]: {
        [OrderStatus.PENDING]: 5 * 60 * 1000,
        [OrderStatus.PREPARING]: 10 * 60 * 1000,
        [OrderStatus.READY_FOR_PICKUP]: 0,
    },
    [OrderType.DELIVERY]: {
        [OrderStatus.PENDING]: 3 * 60 * 1000,
        [OrderStatus.PREPARING]: 15 * 60 * 1000,
        [OrderStatus.READY_FOR_PICKUP]: 2 * 60 * 1000,
        [OrderStatus.OUT_FOR_DELIVERY]: 20 * 60 * 1000,
    },
    [OrderType.BALCAO]: {
        [OrderStatus.PENDING]: 3 * 60 * 1000,
        [OrderStatus.PREPARING]: 10 * 60 * 1000,
        [OrderStatus.READY_FOR_PICKUP]: 0,
    },
  },
  n8n_api_key: null,
};

// Custom Auth Types
export interface AuthenticatedUser {
  id: string; 
  email?: string;
  // Add other fields that your backend's /auth/status or /auth/sign-in might return for the user object.
  // This might include 'full_name' if the auth endpoint directly provides it.
}

export interface AuthSession { 
  token: string; 
  user: AuthenticatedUser; 
  profile?: Profile; // Optionally, the backend might return the full profile on sign-in
  expires_at?: number; 
}

// Profile (linked to AuthenticatedUser by id)
export interface Profile {
  id: string; // Should match AuthenticatedUser.id
  full_name?: string | null;
  phone?: string | null;
  email?: string | null; // Can be different from auth email if allowed
  is_admin?: boolean; // This is crucial for isDeveloperAdmin logic
  // Add other profile-specific fields
  created_at?: string | Date;
  updated_at?: string | Date;
  default_address?: string | null;
  default_address_reference?: string | null;
  notes?: string | null; // Admin notes on customer
}

// For Profile Forms (used by CustomerManagementPage, potentially User Settings)
export interface CustomerFormValues {
    name: string;
    phone: string;
    email?: string;
    address?: string;
    addressReference?: string;
    notes?: string;
    // If admin users can be created/edited through a similar form:
    is_admin?: boolean; 
}

// App State
export interface AppState {
  categories: Category[];
  menuItems: MenuItem[];
  orders: Order[];
  tables: Table[];
  profiles: Profile[]; // Holds all user profiles fetched (e.g., for CustomerManagementPage)
  cart: CartItem[];
  customerDetails: CustomerDetails | null;
  alert: AlertInfo | null;
  isLoading: boolean; // General data loading for non-auth related data
  isLoadingProfiles: boolean; // Specific loading for profiles list
  authLoading: boolean; // For auth operations like sign-in, sign-up, status check
  activeCashSession: CashRegisterSession | null;
  cashSessions: CashRegisterSession[];
  cashAdjustments: CashAdjustment[];
  currentUser: AuthenticatedUser | null; // Currently authenticated user (minimal info)
  currentProfile: Profile | null; // Full profile of the currentUser
  isDeveloperAdmin: boolean; // True if current user is a super admin (derived from currentProfile.is_admin)
  cashAdjustmentsTableMissing: boolean;
  settings: AppSettings | null;
  isLoadingSettings: boolean;
  settingsTableMissing: boolean;
  settingsError: string | null;
  prefilledCustomerForOrder: Profile | null;
  shouldOpenManualOrderModal: boolean;
  isStoreOpenNow: boolean;
  directOrderProfile: Profile | null; 
}

// Actions
export type Action =
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'ADD_CATEGORY_SUCCESS'; payload: Category }
  | { type: 'UPDATE_CATEGORY_SUCCESS'; payload: Category }
  | { type: 'DELETE_CATEGORY_SUCCESS'; payload: string } // id
  | { type: 'SET_MENU_ITEMS'; payload: MenuItem[] }
  | { type: 'ADD_MENU_ITEM_SUCCESS'; payload: MenuItem }
  | { type: 'UPDATE_MENU_ITEM_SUCCESS'; payload: MenuItem }
  | { type: 'DELETE_MENU_ITEM_SUCCESS'; payload: string } // id
  | { type: 'SET_ORDERS'; payload: Order[] }
  | { type: 'ADD_ORDER_SUCCESS'; payload: Order }
  | { type: 'UPDATE_ORDER_STATUS_SUCCESS'; payload: Order }
  | { type: 'SET_TABLES'; payload: Table[] }
  | { type: 'ADD_TABLE_SUCCESS'; payload: Table }
  | { type: 'UPDATE_TABLE_SUCCESS'; payload: Table }
  | { type: 'DELETE_TABLE_SUCCESS'; payload: string } // id
  | { type: 'SET_PROFILES'; payload: Profile[] }
  | { type: 'ADD_PROFILE_SUCCESS'; payload: Profile }
  | { type: 'UPDATE_PROFILE_SUCCESS'; payload: Profile }
  | { type: 'DELETE_PROFILE_SUCCESS'; payload: string } // id
  | { type: 'SET_LOADING_PROFILES'; payload: boolean }
  | { type: 'SET_CART'; payload: CartItem[] }
  | { type: 'ADD_TO_CART'; payload: CartItem } 
  | { type: 'ADD_RAW_CART_ITEM_SUCCESS'; payload: CartItem }
  | { type: 'REMOVE_FROM_CART'; payload: string } // cartItemId
  | { type: 'UPDATE_CART_QUANTITY'; payload: { cartItemId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_CUSTOMER_DETAILS'; payload: CustomerDetails | null }
  | { type: 'SET_ALERT'; payload: AlertInfo | null }
  | { type: 'SET_LOADING'; payload: boolean } // For general data
  | { type: 'SET_AUTH_LOADING'; payload: boolean } // For auth operations
  | { type: 'SET_ACTIVE_CASH_SESSION'; payload: CashRegisterSession | null }
  | { type: 'SET_CASH_SESSIONS'; payload: CashRegisterSession[] }
  | { type: 'ADD_CASH_SESSION_SUCCESS'; payload: CashRegisterSession }
  | { type: 'UPDATE_CASH_SESSION_SUCCESS'; payload: CashRegisterSession }
  | { type: 'SET_CASH_ADJUSTMENTS'; payload: CashAdjustment[] }
  | { type: 'ADD_CASH_ADJUSTMENT_SUCCESS'; payload: CashAdjustment }
  | { type: 'SET_CURRENT_USER'; payload: AuthenticatedUser | null } 
  | { type: 'SET_CURRENT_PROFILE'; payload: Profile | null }
  | { type: 'SET_IS_DEVELOPER_ADMIN'; payload: boolean }
  | { type: 'SET_CASH_ADJUSTMENTS_TABLE_MISSING'; payload: boolean } 
  | { type: 'FETCH_SETTINGS_START' }
  | { type: 'UPDATE_SETTINGS_START' }
  | { type: 'FETCH_SETTINGS_SUCCESS'; payload: AppSettings }
  | { type: 'UPDATE_SETTINGS_SUCCESS'; payload: AppSettings }
  | { type: 'FETCH_SETTINGS_FAILURE'; payload: string } 
  | { type: 'UPDATE_SETTINGS_FAILURE'; payload: string } 
  | { type: 'SET_SETTINGS_TABLE_MISSING'; payload: boolean } 
  | { type: 'SET_PREFILLED_CUSTOMER_FOR_ORDER'; payload: Profile | null }
  | { type: 'SET_SHOULD_OPEN_MANUAL_ORDER_MODAL'; payload: boolean }
  | { type: 'SET_IS_STORE_OPEN_NOW'; payload: boolean }
  | { type: 'SET_DIRECT_ORDER_PROFILE'; payload: Profile | null };
  // Password recovery actions can be added here if a session-like flow is needed client-side
  // e.g., | { type: 'SET_PASSWORD_RESET_TOKEN_VALID'; payload: boolean | null }
  //       | { type: 'CLEAR_PASSWORD_RESET_STATE' }