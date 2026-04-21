import type {
  FiscalPeriod,
  CostCenterActual,
  ProjectActual,
  InternalTransfer,
  ProfitabilitySegment,
  CostCenter,
  ProfitCenter,
  Project,
  CostElement,
  StandardCostAllocation,
  FilterParams,
  DashboardKpi,
} from '@/types'

import profitCentersData from './mock-data/profit-centers.json'
import costCentersData from './mock-data/cost-centers.json'
import projectsData from './mock-data/projects.json'
import costElementsData from './mock-data/cost-elements.json'
import costCenterActualData from './mock-data/cost-center-actual.json'
import projectActualData from './mock-data/project-actual.json'
import internalTransferData from './mock-data/internal-transfer.json'
import profitabilityData from './mock-data/profitability.json'

export interface SapConnector {
  getCostCenterActuals(params: FilterParams): Promise<CostCenterActual[]>
  getProjectActuals(params: FilterParams): Promise<ProjectActual[]>
  getInternalTransfers(params: FilterParams): Promise<InternalTransfer[]>
  getProfitabilitySegments(params: FilterParams): Promise<ProfitabilitySegment[]>
  getStandardCostAllocations(params: FilterParams): Promise<StandardCostAllocation[]>
  getDashboardKpi(params: FilterParams): Promise<DashboardKpi>
  triggerSync(): Promise<{ success: boolean; count: number }>
}

function getProfitCenter(id: string): ProfitCenter {
  const pc = (profitCentersData as ProfitCenter[]).find((p) => p.id === id)
  if (!pc) throw new Error(`ProfitCenter not found: ${id}`)
  return pc
}

function getCostCenterObj(id: string): CostCenter {
  const cc = costCentersData.find((c) => c.id === id)
  if (!cc) throw new Error(`CostCenter not found: ${id}`)
  return {
    ...cc,
    cost_center_type: cc.cost_center_type as CostCenter['cost_center_type'],
    profit_center: getProfitCenter(cc.profit_center_id),
  }
}

function getProject(id: string): Project {
  const pj = (projectsData as Project[]).find((p) => p.id === id)
  if (!pj) throw new Error(`Project not found: ${id}`)
  return {
    ...pj,
    profit_center: getProfitCenter(pj.profit_center_id ?? ''),
  }
}

function getCostElement(id: string): CostElement {
  const ce = (costElementsData as CostElement[]).find((e) => e.id === id)
  if (!ce) throw new Error(`CostElement not found: ${id}`)
  return ce
}

export class MockSapConnector implements SapConnector {
  async getCostCenterActuals(params: FilterParams): Promise<CostCenterActual[]> {
    const raw = costCenterActualData as {
      id: string
      cost_center_id: string
      cost_element_id: string
      fiscal_year: number
      fiscal_period: number
      actual_amount: number
      plan_amount: number
      headcount: number
      currency: string
      data_source: string
    }[]

    return raw
      .filter((r) => {
        if (params.fiscal_year && r.fiscal_year !== params.fiscal_year) return false
        if (params.fiscal_period && r.fiscal_period !== params.fiscal_period) return false
        if (params.cost_center_id && r.cost_center_id !== params.cost_center_id) return false
        if (params.profit_center_id) {
          const cc = costCentersData.find((c) => c.id === r.cost_center_id)
          if (cc?.profit_center_id !== params.profit_center_id) return false
        }
        return true
      })
      .map((r) => {
        const ce = getCostElement(r.cost_element_id)
        const variance = r.actual_amount - r.plan_amount
        const variance_rate = r.plan_amount !== 0 ? (variance / r.plan_amount) * 100 : 0
        return {
          id: r.id,
          cost_center: getCostCenterObj(r.cost_center_id),
          cost_element: ce,
          cost_element_name: ce.element_name,
          cost_element_category: ce.element_category,
          fiscal_year: r.fiscal_year,
          fiscal_period: r.fiscal_period,
          actual_amount: r.actual_amount,
          plan_amount: r.plan_amount,
          variance,
          variance_rate,
          headcount: r.headcount,
          currency: r.currency,
          data_source: r.data_source as CostCenterActual['data_source'],
        }
      })
  }

  async getProjectActuals(params: FilterParams): Promise<ProjectActual[]> {
    const raw = projectActualData as {
      id: string
      project_id: string
      cost_element_id: string
      cost_center_id: string
      fiscal_year: number
      fiscal_period: number
      actual_amount: number
      plan_amount: number
      currency: string
      data_source: string
    }[]

    return raw
      .filter((r) => {
        if (params.fiscal_year && r.fiscal_year !== params.fiscal_year) return false
        if (params.fiscal_period && r.fiscal_period !== params.fiscal_period) return false
        if (params.project_id && r.project_id !== params.project_id) return false
        if (params.profit_center_id) {
          const pj = projectsData.find((p) => p.id === r.project_id)
          if (pj?.profit_center_id !== params.profit_center_id) return false
        }
        return true
      })
      .map((r) => {
        const ce = getCostElement(r.cost_element_id)
        const cc = getCostCenterObj(r.cost_center_id)
        const variance = r.actual_amount - r.plan_amount
        return {
          id: r.id,
          project: getProject(r.project_id),
          cost_element: ce,
          cost_element_name: ce.element_name,
          cost_center: cc,
          cost_center_name: cc.cost_center_name,
          fiscal_year: r.fiscal_year,
          fiscal_period: r.fiscal_period,
          actual_amount: r.actual_amount,
          plan_amount: r.plan_amount,
          variance,
          currency: r.currency,
          data_source: r.data_source as ProjectActual['data_source'],
        }
      })
  }

  async getInternalTransfers(params: FilterParams): Promise<InternalTransfer[]> {
    const raw = internalTransferData as {
      id: string
      sender_cost_center_id: string
      receiver_cost_center_id: string | null
      receiver_project_id: string | null
      fiscal_year: number
      fiscal_period: number
      service_type: string
      quantity: number
      unit_price: number
      transfer_amount: number
      currency: string
      status: string
      data_source: string
    }[]

    return raw
      .filter((r) => {
        if (params.fiscal_year && r.fiscal_year !== params.fiscal_year) return false
        if (params.fiscal_period && r.fiscal_period !== params.fiscal_period) return false
        return true
      })
      .map((r) => ({
        id: r.id,
        sender_cost_center: getCostCenterObj(r.sender_cost_center_id),
        receiver_cost_center: r.receiver_cost_center_id ? getCostCenterObj(r.receiver_cost_center_id) : undefined,
        receiver_project: r.receiver_project_id ? getProject(r.receiver_project_id) : undefined,
        fiscal_year: r.fiscal_year,
        fiscal_period: r.fiscal_period,
        service_type: r.service_type,
        quantity: r.quantity,
        unit_price: r.unit_price,
        transfer_amount: r.transfer_amount,
        currency: r.currency,
        status: r.status as InternalTransfer['status'],
        data_source: r.data_source as InternalTransfer['data_source'],
      }))
  }

  async getProfitabilitySegments(params: FilterParams): Promise<ProfitabilitySegment[]> {
    const raw = profitabilityData as {
      id: string
      profit_center_id: string
      project_id: string | null
      fiscal_year: number
      fiscal_period: number
      revenue: number
      direct_cost: number
      overhead_cost: number
      gross_margin: number
      currency: string
      data_source: string
    }[]

    return raw
      .filter((r) => {
        if (params.fiscal_year && r.fiscal_year !== params.fiscal_year) return false
        if (params.fiscal_period && r.fiscal_period !== params.fiscal_period) return false
        if (params.profit_center_id && r.profit_center_id !== params.profit_center_id) return false
        return true
      })
      .map((r) => ({
        id: r.id,
        profit_center: getProfitCenter(r.profit_center_id),
        project: r.project_id ? getProject(r.project_id) : undefined,
        fiscal_year: r.fiscal_year,
        fiscal_period: r.fiscal_period,
        revenue: r.revenue,
        direct_cost: r.direct_cost,
        overhead_cost: r.overhead_cost,
        gross_profit: r.revenue - r.direct_cost - r.overhead_cost,
        gross_margin: r.gross_margin,
        currency: r.currency,
        data_source: r.data_source as ProfitabilitySegment['data_source'],
      }))
  }

  async getStandardCostAllocations(params: FilterParams): Promise<StandardCostAllocation[]> {
    // 표준원가 배분 Mock 데이터 생성
    const allocations: StandardCostAllocation[] = [
      {
        id: 'sca-001',
        from_cost_center: getCostCenterObj('cc-014'),
        to_cost_center: getCostCenterObj('cc-001'),
        fiscal_year: params.fiscal_year ?? 2025,
        fiscal_period: params.fiscal_period ?? 1,
        allocated_amount: 12000000,
        allocation_basis: 'HEADCOUNT',
        allocation_ratio: 0.25,
        currency: 'KRW',
      },
      {
        id: 'sca-002',
        from_cost_center: getCostCenterObj('cc-014'),
        to_cost_center: getCostCenterObj('cc-005'),
        fiscal_year: params.fiscal_year ?? 2025,
        fiscal_period: params.fiscal_period ?? 1,
        allocated_amount: 10000000,
        allocation_basis: 'HEADCOUNT',
        allocation_ratio: 0.20,
        currency: 'KRW',
      },
      {
        id: 'sca-003',
        from_cost_center: getCostCenterObj('cc-015'),
        to_cost_center: getCostCenterObj('cc-008'),
        fiscal_year: params.fiscal_year ?? 2025,
        fiscal_period: params.fiscal_period ?? 1,
        allocated_amount: 9000000,
        allocation_basis: 'REVENUE',
        allocation_ratio: 0.30,
        currency: 'KRW',
      },
      {
        id: 'sca-004',
        from_cost_center: getCostCenterObj('cc-017'),
        to_cost_center: getCostCenterObj('cc-001'),
        fiscal_year: params.fiscal_year ?? 2025,
        fiscal_period: params.fiscal_period ?? 1,
        allocated_amount: 8000000,
        allocation_basis: 'HOURS',
        allocation_ratio: 0.22,
        currency: 'KRW',
      },
      {
        id: 'sca-005',
        from_cost_center: getCostCenterObj('cc-016'),
        to_cost_center: getCostCenterObj('cc-011'),
        fiscal_year: params.fiscal_year ?? 2025,
        fiscal_period: params.fiscal_period ?? 1,
        allocated_amount: 7000000,
        allocation_basis: 'HEADCOUNT',
        allocation_ratio: 0.18,
        currency: 'KRW',
      },
    ]

    return allocations.filter((a) => {
      if (params.fiscal_year && a.fiscal_year !== params.fiscal_year) return false
      if (params.fiscal_period && a.fiscal_period !== params.fiscal_period) return false
      return true
    })
  }

  async getDashboardKpi(params: FilterParams): Promise<DashboardKpi> {
    const actuals = await this.getCostCenterActuals(params)

    const total_actual_cost = actuals.reduce((sum, r) => sum + r.actual_amount, 0)
    const total_plan_cost = actuals.reduce((sum, r) => sum + r.plan_amount, 0)
    const total_variance = total_actual_cost - total_plan_cost
    const variance_rate = total_plan_cost !== 0 ? (total_variance / total_plan_cost) * 100 : 0

    const active_project_count = (projectsData as Project[]).filter((p) => p.status === 'ACTIVE').length

    // 본부별 원가 집계
    const divisionMap = new Map<string, { profit_center_name: string; actual_amount: number; plan_amount: number }>()
    for (const r of actuals) {
      const key = r.cost_center.profit_center.id
      const existing = divisionMap.get(key)
      if (existing) {
        existing.actual_amount += r.actual_amount
        existing.plan_amount += r.plan_amount
      } else {
        divisionMap.set(key, {
          profit_center_name: r.cost_center.profit_center.profit_center_name,
          actual_amount: r.actual_amount,
          plan_amount: r.plan_amount,
        })
      }
    }

    // 월별 추이
    const periodMap = new Map<number, { actual_amount: number; plan_amount: number }>()
    const allActuals = await this.getCostCenterActuals({ fiscal_year: params.fiscal_year })
    for (const r of allActuals) {
      const existing = periodMap.get(r.fiscal_period)
      if (existing) {
        existing.actual_amount += r.actual_amount
        existing.plan_amount += r.plan_amount
      } else {
        periodMap.set(r.fiscal_period, { actual_amount: r.actual_amount, plan_amount: r.plan_amount })
      }
    }

    // 프로젝트별 집계
    const projectActuals = await this.getProjectActuals({ fiscal_year: params.fiscal_year })
    const projectMap = new Map<
      string,
      { project_code: string; project_name: string; actual_amount: number; budget_amount: number }
    >()
    for (const r of projectActuals) {
      const key = r.project.id
      const existing = projectMap.get(key)
      if (existing) {
        existing.actual_amount += r.actual_amount
      } else {
        projectMap.set(key, {
          project_code: r.project.project_code,
          project_name: r.project.project_name,
          actual_amount: r.actual_amount,
          budget_amount: r.project.budget_amount,
        })
      }
    }

    const top_projects = Array.from(projectMap.values())
      .sort((a, b) => b.actual_amount - a.actual_amount)
      .slice(0, 5)
      .map((p) => ({
        ...p,
        burn_rate: p.budget_amount > 0 ? (p.actual_amount / p.budget_amount) * 100 : 0,
      }))

    return {
      total_actual_cost,
      total_plan_cost,
      total_variance,
      variance_rate,
      active_project_count,
      cost_by_division: Array.from(divisionMap.values()),
      monthly_trend: Array.from(periodMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([fiscal_period, v]) => ({ fiscal_period, ...v })),
      top_projects,
    }
  }

  async triggerSync(): Promise<{ success: boolean; count: number }> {
    return { success: true, count: 0 }
  }
}

export const sapConnector: SapConnector = new MockSapConnector()
