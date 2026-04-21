export type DataSource = 'MOCK' | 'SAP' | 'MANUAL'
export type ProjectStatus = 'ACTIVE' | 'CLOSED' | 'PLANNED'
export type TransferStatus = 'DRAFT' | 'CONFIRMED' | 'REVERSED'
export type CostCenterType = 'DIRECT' | 'INDIRECT' | 'ADMIN'
export type ElementCategory = 'LABOR' | 'MATERIAL' | 'OVERHEAD' | 'DEPRECIATION'
export type AllocationBasis = 'HEADCOUNT' | 'HOURS' | 'REVENUE' | 'DIRECT'

export interface FiscalPeriod {
  fiscal_year: number
  fiscal_period: number
}

export interface Company {
  id: string
  company_code: string
  company_name: string
  currency: string
}

export interface ProfitCenter {
  id: string
  profit_center_code: string
  profit_center_name: string
  company_id?: string
  manager?: string
  is_active?: boolean
}

export interface CostCenter {
  id: string
  cost_center_code: string
  cost_center_name: string
  profit_center: ProfitCenter
  profit_center_id?: string
  cost_center_type: CostCenterType
  is_active?: boolean
}

export interface Project {
  id: string
  project_code: string
  project_name: string
  profit_center: ProfitCenter
  profit_center_id?: string
  project_manager?: string
  start_date?: string
  end_date?: string
  status: ProjectStatus
  budget_amount: number
}

export interface CostElement {
  id: string
  element_code: string
  element_name: string
  element_category: ElementCategory
  is_active?: boolean
}

export interface CostCenterActual extends FiscalPeriod {
  id: string
  cost_center: CostCenter
  cost_element: CostElement
  cost_element_name: string
  cost_element_category: ElementCategory
  actual_amount: number
  plan_amount: number
  variance: number
  variance_rate: number
  headcount: number
  currency: string
  data_source: DataSource
}

export interface ProjectActual extends FiscalPeriod {
  id: string
  project: Project
  cost_element: CostElement
  cost_element_name: string
  cost_center: CostCenter
  cost_center_name: string
  actual_amount: number
  plan_amount: number
  variance: number
  currency: string
  data_source: DataSource
}

export interface InternalTransfer extends FiscalPeriod {
  id: string
  sender_cost_center: CostCenter
  receiver_cost_center?: CostCenter
  receiver_project?: Project
  service_type: string
  quantity: number
  unit_price: number
  transfer_amount: number
  currency: string
  status: TransferStatus
  data_source: DataSource
}

export interface StandardCost {
  id: string
  cost_center: CostCenter
  cost_element: CostElement
  fiscal_year: number
  standard_amount: number
  allocation_basis: AllocationBasis
}

export interface StandardCostAllocation extends FiscalPeriod {
  id: string
  from_cost_center: CostCenter
  to_cost_center?: CostCenter
  to_project?: Project
  allocated_amount: number
  allocation_basis: AllocationBasis
  allocation_ratio: number
  currency: string
}

export interface ProfitabilitySegment extends FiscalPeriod {
  id: string
  profit_center: ProfitCenter
  project?: Project
  revenue: number
  direct_cost: number
  overhead_cost: number
  gross_profit: number
  gross_margin: number
  currency: string
  data_source: DataSource
}

export interface DashboardKpi {
  total_actual_cost: number
  total_plan_cost: number
  total_variance: number
  variance_rate: number
  active_project_count: number
  cost_by_division: {
    profit_center_name: string
    actual_amount: number
    plan_amount: number
  }[]
  monthly_trend: {
    fiscal_period: number
    actual_amount: number
    plan_amount: number
  }[]
  top_projects: {
    project_code: string
    project_name: string
    actual_amount: number
    budget_amount: number
    burn_rate: number
  }[]
}

export interface FilterParams {
  fiscal_year?: number
  fiscal_period?: number
  profit_center_id?: string
  project_id?: string
  cost_center_id?: string
}
