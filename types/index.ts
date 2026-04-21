// ─── 공통 ────────────────────────────────────────────────────
export type MaterialType = 'FERT' | 'HALB' | 'ROH'
export type ModelGroup = 'STON-S' | 'STON-CART' | 'STON-PLUS' | 'ALL'
export type DataSource = 'MOCK' | 'SAP'
export type SyncStatus = 'SUCCESS' | 'FAILED' | 'RUNNING' | 'PENDING'

// ─── 전역 필터 ────────────────────────────────────────────────
export interface GlobalFilter {
  year: number
  period: number   // 1~12, 0 = 누계
  model: string    // 'all' | 'ston-s' | 'ston-cart' | 'ston-plus'
  plant: string    // '4000'
}

// ─── 제품 마스터 ──────────────────────────────────────────────
export interface Product {
  matnr: string
  product_name: string
  model_group: ModelGroup
  material_type: MaterialType
  plant: string
  std_price: number
  currency: string
  unit: string
}

// ─── 수불부 (Inventory Stock) ─────────────────────────────────
export interface StockItem {
  matnr: string
  product_name: string
  model_group: string
  material_type: MaterialType
  plant: string
  fiscal_year: number
  fiscal_period: number
  // 기초재고
  opening_qty: number
  opening_amt: number
  // 입고
  receipt_qty: number
  receipt_amt: number
  // 출고
  issue_qty: number
  issue_amt: number
  // 기말재고
  closing_qty: number
  closing_amt: number
  // 단가
  avg_price: number
  std_price?: number
  // 이동유형별 (ROH/HALB 확장)
  gr_po_qty?: number      // 구매입고 (ROH)
  gr_prod_qty?: number    // 생산입고 (HALB)
  gi_prod_qty?: number    // 생산출고 (ROH→HALB)
  gi_sales_qty?: number   // 판매출고 (FERT)
  std_amt?: number        // 표준금액 (SAP 연동 후)
  diff_amt?: number       // 차이금액
  data_source: DataSource
}

export interface StockSummary {
  fert_closing_qty: number
  fert_closing_amt: number
  fert_avg_price: number
  halb_closing_qty: number
  halb_closing_amt: number
  roh_closing_qty: number
  roh_closing_amt: number
  po_receipt_amt: number
}

// ─── 생산금액 산출 ─────────────────────────────────────────────
export interface ProductionItem {
  matnr: string
  product_name: string
  model_group: string
  // 실적
  actual_qty: number
  actual_amount: number
  actual_mat_cost: number
  actual_mat_rate: number
  // 편성
  plan_qty: number
  plan_amount: number
  plan_mat_cost: number
  plan_mat_rate: number
  // 차이
  qty_variance: number
  amt_variance: number
  mat_rate_variance: number
  data_source: DataSource
}

export interface ProductionSummary {
  actual_qty: number
  actual_amt: number
  plan_qty: number
  plan_amt: number
  mat_cost: number
  mat_rate: number
  achievement_rate: number
}

// ─── BOM ──────────────────────────────────────────────────────
export interface BomNode {
  id: string
  matnr_parent: string
  matnr_child: string
  child_name: string
  child_type: MaterialType
  quantity: number
  unit: string
  bom_level: number
  unit_price: number
  level_cost: number
  children?: BomNode[]
}

export interface BomSummary {
  matnr: string
  product_name: string
  model_group: string
  unit_material_cost: number
  material_rate: number
  std_price: number
  bom_item_count: number
}

// ─── 대시보드 ─────────────────────────────────────────────────
export interface DashboardKpi {
  production_amount: { actual: number; plan: number }
  material_cost: { actual: number; rate: number }
  production_qty: { actual: number; plan: number }
  inventory_total: number
  inventory_prev_total?: number
}

export interface ChartDataItem {
  model_group: string
  actual_amount: number
  plan_amount: number
  actual_qty: number
  plan_qty: number
  mat_rate: number
}

export interface InventoryComposition {
  fert_amt: number
  halb_amt: number
  roh_amt: number
}

// ─── SAP 연동 ─────────────────────────────────────────────────
export interface RfcInfo {
  rfc_name: string
  transaction: string
  description: string
  schedule: string
  last_run: string | null
  last_count: number
  status: SyncStatus
}

export interface SyncLog {
  id: string
  rfc_name: string
  started_at: string
  finished_at: string | null
  synced_count: number
  status: SyncStatus
  error_message?: string
}
