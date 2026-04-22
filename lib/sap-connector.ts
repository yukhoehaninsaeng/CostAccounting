import type {
  StockItem,
  StockSummary,
  ProductionItem,
  ProductionSummary,
  BomNode,
  BomSummary,
  CompanySummary,
  DashboardKpi,
  ChartDataItem,
  InventoryComposition,
  RfcInfo,
  SyncLog,
  MaterialType,
} from '@/types'
import { COMPANY_LIST } from '@/lib/companies'

// ─── 인터페이스 ───────────────────────────────────────────────
export interface SapConnector {
  getInventory(params: InventoryParams): Promise<StockItem[]>
  getInventorySummary(params: BaseParams): Promise<StockSummary>
  getProduction(params: ProductionParams): Promise<ProductionItem[]>
  getProductionSummary(params: BaseParams): Promise<ProductionSummary>
  getCompanySummaries(params: BaseParams): Promise<CompanySummary[]>
  getBom(params: BomParams): Promise<BomNode[]>
  getBomSummary(plant: string): Promise<BomSummary[]>
  getDashboardKpi(params: BaseParams): Promise<DashboardKpi>
  getDashboardChartData(params: BaseParams): Promise<ChartDataItem[]>
  getInventoryComposition(params: BaseParams): Promise<InventoryComposition>
  getRfcStatus(): Promise<RfcInfo[]>
  getSyncLogs(page?: number): Promise<SyncLog[]>
  triggerSync(rfcName?: string): Promise<{ success: boolean; synced_count: number; error?: string }>
}

export interface BaseParams {
  year: number
  period: number
  plant?: string
  bukrs?: string   // 회사코드: 'all' | '1000' | '3000' | '4000'
  model?: string
}

export interface InventoryParams extends BaseParams {
  type: MaterialType
  matnr?: string
}

export interface ProductionParams extends BaseParams {
  matnr?: string
}

export interface BomParams {
  plant: string
  matnr: string
  levels?: '1' | '2' | 'all'
}

// ─── Mock 구현체 ──────────────────────────────────────────────
export class MockSapConnector implements SapConnector {
  private async loadJson<T>(name: string): Promise<T> {
    // Dynamic import for mock data
    const map: Record<string, () => Promise<{ default: unknown }>> = {
      products: () => import('./mock-data/products.json'),
      inventory_fert: () => import('./mock-data/inventory_fert.json'),
      inventory_halb: () => import('./mock-data/inventory_halb.json'),
      inventory_roh: () => import('./mock-data/inventory_roh.json'),
      production: () => import('./mock-data/production.json'),
      bom: () => import('./mock-data/bom.json'),
    }
    const loader = map[name]
    if (!loader) throw new Error(`Unknown mock data: ${name}`)
    const mod = await loader()
    return (mod.default ?? mod) as T
  }

  private filterByModel(items: { model_group?: string }[], model?: string) {
    if (!model || model === 'all') return items
    const map: Record<string, string> = {
      'ston-s': 'STON-S',
      'ston-cart': 'STON-CART',
      'ston-plus': 'STON-PLUS',
    }
    const group = map[model]
    return group ? items.filter((i) => i.model_group === group) : items
  }

  async getInventory({ type, model, matnr }: InventoryParams): Promise<StockItem[]> {
    const key = `inventory_${type.toLowerCase()}` as 'inventory_fert' | 'inventory_halb' | 'inventory_roh'
    const data = await this.loadJson<StockItem[]>(key)
    let result = this.filterByModel(data, model) as StockItem[]
    if (matnr) result = result.filter((r) => r.matnr === matnr)
    return result
  }

  async getInventorySummary({ model }: BaseParams): Promise<StockSummary> {
    const [fert, halb, roh] = await Promise.all([
      this.loadJson<StockItem[]>('inventory_fert'),
      this.loadJson<StockItem[]>('inventory_halb'),
      this.loadJson<StockItem[]>('inventory_roh'),
    ])
    const filteredFert = this.filterByModel(fert, model) as StockItem[]
    return {
      fert_closing_qty: filteredFert.reduce((s, r) => s + r.closing_qty, 0),
      fert_closing_amt: filteredFert.reduce((s, r) => s + r.closing_amt, 0),
      fert_avg_price: Math.round(
        filteredFert.reduce((s, r) => s + r.closing_amt, 0) /
          Math.max(1, filteredFert.reduce((s, r) => s + r.closing_qty, 0))
      ),
      halb_closing_qty: (halb as StockItem[]).reduce((s, r) => s + r.closing_qty, 0),
      halb_closing_amt: (halb as StockItem[]).reduce((s, r) => s + r.closing_amt, 0),
      roh_closing_qty: (roh as StockItem[]).reduce((s, r) => s + r.closing_qty, 0),
      roh_closing_amt: (roh as StockItem[]).reduce((s, r) => s + r.closing_amt, 0),
      po_receipt_amt: (roh as StockItem[]).reduce((s, r) => s + r.receipt_amt, 0),
    }
  }

  async getProduction({ model, bukrs, matnr }: ProductionParams): Promise<ProductionItem[]> {
    const data = await this.loadJson<ProductionItem[]>('production')
    let result = this.filterByModel(data, model) as ProductionItem[]
    if (bukrs && bukrs !== 'all') result = result.filter((r) => r.bukrs === bukrs)
    if (matnr) result = result.filter((r) => r.matnr === matnr)
    return result
  }

  async getProductionSummary(params: BaseParams): Promise<ProductionSummary> {
    const items = await this.getProduction(params)
    const actual_qty = items.reduce((s, r) => s + r.actual_qty, 0)
    const actual_amt = items.reduce((s, r) => s + r.actual_amount, 0)
    const mat_cost = items.reduce((s, r) => s + r.actual_mat_cost, 0)
    const plan_qty = items.reduce((s, r) => s + r.plan_qty, 0)
    const plan_amt = items.reduce((s, r) => s + r.plan_amount, 0)
    return {
      actual_qty,
      actual_amt,
      plan_qty,
      plan_amt,
      mat_cost,
      mat_rate: actual_amt > 0 ? (mat_cost / actual_amt) * 100 : 0,
      achievement_rate: plan_qty > 0 ? (actual_qty / plan_qty) * 100 : 0,
    }
  }

  async getCompanySummaries(params: BaseParams): Promise<CompanySummary[]> {
    const results: CompanySummary[] = []
    for (const co of COMPANY_LIST) {
      const items = await this.getProduction({ ...params, bukrs: co.bukrs })
      const actual_amt = items.reduce((s, r) => s + r.actual_amount, 0)
      const mat_cost = items.reduce((s, r) => s + r.actual_mat_cost, 0)
      results.push({
        bukrs: co.bukrs,
        prod_amt: actual_amt,
        mat_cost,
        mat_rate: actual_amt > 0 ? (mat_cost / actual_amt) * 100 : 0,
        stock_amt: 0,
        prod_qty: items.reduce((s, r) => s + r.actual_qty, 0),
        plan_qty: items.reduce((s, r) => s + r.plan_qty, 0),
        plan_amt: items.reduce((s, r) => s + r.plan_amount, 0),
      })
    }
    return results
  }


  async getBom({ matnr }: BomParams): Promise<BomNode[]> {
    const data = await this.loadJson<BomNode[]>('bom')
    // Return nodes related to the given FERT matnr
    const relatedNodes = this.collectBomNodes(data, matnr)
    return relatedNodes
  }

  private collectBomNodes(all: BomNode[], rootMatnr: string): BomNode[] {
    const result: BomNode[] = []
    const queue = [rootMatnr]
    const visited = new Set<string>()
    while (queue.length > 0) {
      const parent = queue.shift()!
      if (visited.has(parent)) continue
      visited.add(parent)
      const children = all.filter((n) => n.matnr_parent === parent)
      result.push(...children)
      queue.push(...children.map((c) => c.matnr_child))
    }
    return result
  }

  async getBomSummary(plant: string): Promise<BomSummary[]> {
    const prods = await this.loadJson<{ matnr: string; product_name: string; model_group: string; std_price: number }[]>('products')
    const bomData = await this.loadJson<BomNode[]>('bom')
    return prods.map((p) => {
      const nodes = this.collectBomNodes(bomData, p.matnr)
      const unitMat = nodes.reduce((s, n) => s + n.level_cost, 0)
      return {
        matnr: p.matnr,
        product_name: p.product_name,
        model_group: p.model_group,
        unit_material_cost: unitMat,
        material_rate: p.std_price > 0 ? (unitMat / p.std_price) * 100 : 0,
        std_price: p.std_price,
        bom_item_count: nodes.length,
      }
    }).filter((s) => s.bom_item_count > 0)
  }

  async getDashboardKpi(params: BaseParams): Promise<DashboardKpi> {
    const [summary, inv] = await Promise.all([
      this.getProductionSummary(params),
      this.getInventorySummary(params),
    ])
    return {
      production_amount: { actual: summary.actual_amt, plan: summary.plan_amt },
      material_cost: { actual: summary.mat_cost, rate: summary.mat_rate },
      production_qty: { actual: summary.actual_qty, plan: summary.plan_qty },
      inventory_total: inv.fert_closing_amt + inv.halb_closing_amt + inv.roh_closing_amt,
    }
  }

  async getDashboardChartData(params: BaseParams): Promise<ChartDataItem[]> {
    const groups = ['STON-S', 'STON-CART', 'STON-PLUS'] as const
    const modelMap: Record<string, string> = {
      'STON-S': 'ston-s',
      'STON-CART': 'ston-cart',
      'STON-PLUS': 'ston-plus',
    }
    const results: ChartDataItem[] = []
    for (const group of groups) {
      const items = await this.getProduction({ ...params, model: modelMap[group] })
      results.push({
        model_group: group,
        actual_amount: items.reduce((s, r) => s + r.actual_amount, 0),
        plan_amount: items.reduce((s, r) => s + r.plan_amount, 0),
        actual_qty: items.reduce((s, r) => s + r.actual_qty, 0),
        plan_qty: items.reduce((s, r) => s + r.plan_qty, 0),
        mat_rate:
          items.reduce((s, r) => s + r.actual_amount, 0) > 0
            ? (items.reduce((s, r) => s + r.actual_mat_cost, 0) /
                items.reduce((s, r) => s + r.actual_amount, 0)) *
              100
            : 0,
      })
    }
    return results
  }

  async getInventoryComposition(params: BaseParams): Promise<InventoryComposition> {
    const s = await this.getInventorySummary(params)
    return {
      fert_amt: s.fert_closing_amt,
      halb_amt: s.halb_closing_amt,
      roh_amt: s.roh_closing_amt,
    }
  }

  async getRfcStatus(): Promise<RfcInfo[]> {
    return [
      { rfc_name: 'ZCOR0110', transaction: 'MB52/MMBE', description: '수불부 재고 조회', schedule: '월 마감 후', last_run: '2025-12-31 23:45', last_count: 892, status: 'SUCCESS' },
      { rfc_name: 'ZPPR0500', transaction: 'CO03/KKB5N', description: '생산금액 산출', schedule: '월 마감 후', last_run: '2025-12-31 23:50', last_count: 156, status: 'SUCCESS' },
      { rfc_name: 'ZCS_BOM01', transaction: 'CS12/CS15', description: 'BOM 구조 조회', schedule: '주 1회', last_run: '2025-12-28 08:00', last_count: 342, status: 'SUCCESS' },
      { rfc_name: 'ZMATERIAL', transaction: 'MM03/MM60', description: '자재 마스터 동기화', schedule: '주 1회', last_run: '2025-12-28 08:05', last_count: 218, status: 'SUCCESS' },
    ]
  }

  async getSyncLogs(): Promise<SyncLog[]> {
    return [
      { id: 'log-001', rfc_name: 'ZCOR0110', started_at: '2025-12-31T23:45:00Z', finished_at: '2025-12-31T23:45:42Z', synced_count: 892, status: 'SUCCESS' },
      { id: 'log-002', rfc_name: 'ZPPR0500', started_at: '2025-12-31T23:50:00Z', finished_at: '2025-12-31T23:50:28Z', synced_count: 156, status: 'SUCCESS' },
      { id: 'log-003', rfc_name: 'ZCS_BOM01', started_at: '2025-12-28T08:00:00Z', finished_at: '2025-12-28T08:01:15Z', synced_count: 342, status: 'SUCCESS' },
      { id: 'log-004', rfc_name: 'ZMATERIAL', started_at: '2025-12-28T08:05:00Z', finished_at: '2025-12-28T08:05:33Z', synced_count: 218, status: 'SUCCESS' },
      { id: 'log-005', rfc_name: 'ZCOR0110', started_at: '2025-11-30T23:45:00Z', finished_at: '2025-11-30T23:46:05Z', synced_count: 876, status: 'SUCCESS' },
    ]
  }

  async triggerSync(rfcName?: string): Promise<{ success: boolean; synced_count: number }> {
    return { success: true, synced_count: rfcName ? 100 : 400 }
  }
}

export const sapConnector: SapConnector = new MockSapConnector()
