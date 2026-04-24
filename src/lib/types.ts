export type UserRole = 'property_manager' | 'inspector' | 'contractor'

export interface Profile {
  id: string
  full_name: string
  email: string
  role: UserRole
  phone?: string
  /** Present for contractors */
  trade_type?: TradeType
  /** Present for contractors */
  company_name?: string
  /** Present for inspectors/contractors */
  is_active?: boolean
  created_at: string
}

/** Row from public.inspectors table */
export interface Inspector {
  id: string
  full_name: string
  email?: string
  phone?: string
  is_active: boolean
  auth_user_id?: string
  created_by?: string
  created_at: string
}

/** Row from public.contractors table */
export interface Contractor {
  id: string
  full_name: string
  company_name?: string
  trade_type?: TradeType
  email?: string
  phone?: string
  is_active: boolean
  auth_user_id?: string
  created_by?: string
  created_at: string
}

export interface Property {
  id: string
  lot_number: string
  homeowner_name: string
  homeowner_email?: string
  homeowner_phone?: string
  address: string
  community_name?: string
  builder_name?: string
  last_walkthrough?: string
  next_walkthrough?: string
  created_by: string
  created_at: string
}

export type InspectionType =
  | 'Pre-Drywall'
  | 'Home Demo'
  | '30-Day'
  | 'Interim'
  | '1-Year'

export const INSPECTION_TYPE_OPTIONS: InspectionType[] = [
  'Pre-Drywall',
  'Home Demo',
  '30-Day',
  'Interim',
  '1-Year',
]

export type PLOStatus =
  | 'Scheduled'
  | 'In Progress'
  | 'Under Review'
  | 'Closed'

export interface PLO {
  id: string
  plo_id: string
  property_id: string
  inspection_type: InspectionType
  assigned_inspector_id?: string
  scheduled_date?: string
  scheduled_time?: string
  status: PLOStatus
  notes?: string
  homeowner_signature?: string
  inspector_signature?: string
  /** Room name → inspector marked complete (see migration `rooms_completed`). */
  rooms_completed?: Record<string, boolean>
  created_at: string
  property?: Property
  inspector?: Inspector
}

export type Room =
  | 'Kitchen'
  | 'Living Room'
  | 'Master Bedroom'
  | 'Bedroom 2'
  | 'Bedroom 3'
  | 'Bathroom'
  | 'Master Bath'
  | 'Laundry'
  | 'Garage'
  | 'Basement'
  | 'Exterior'
  | 'Roof'
  | 'Other'

/** Room tiles on the inspection screen (order matches walkthrough flow). */
export const INSPECTION_ROOMS: Room[] = [
  'Kitchen',
  'Living Room',
  'Master Bedroom',
  'Bedroom 2',
  'Bedroom 3',
  'Bathroom',
  'Master Bath',
  'Laundry',
  'Garage',
  'Basement',
  'Exterior',
  'Roof',
  'Other',
]

export type TradeType =
  | 'Painter'
  | 'Plumber'
  | 'Electrician'
  | 'Carpenter'
  | 'Hardware'
  | 'HVAC'
  | 'Roofer'
  | 'General'

export const TRADE_TYPE_OPTIONS: TradeType[] = [
  'Painter',
  'Plumber',
  'Electrician',
  'Carpenter',
  'Hardware',
  'HVAC',
  'Roofer',
  'General',
]

export type Severity = 'Low' | 'Medium' | 'Urgent'
export type ItemStatus = 'Open' | 'In Progress' | 'Resolved'

export interface InspectionItem {
  id: string
  plo_id: string
  room: Room
  description: string
  photo_url?: string
  trade_type?: TradeType
  severity: Severity
  is_hazard: boolean
  item_status: ItemStatus
  /** Sort order within a room (see migration `line_order`). */
  line_order?: number
  created_at: string
}

export interface WorkOrder {
  id: string
  work_order_id: string
  plo_id: string
  assigned_contractor_id?: string
  status: 'Open' | 'In Progress' | 'Closed'
  created_at: string
  plo?: PLO
}
