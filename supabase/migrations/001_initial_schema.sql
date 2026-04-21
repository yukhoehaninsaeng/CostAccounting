-- ============================================================
-- 원가/관리회계 시스템 초기 스키마
-- SAP CO 모듈 기반
-- ============================================================

-- 회사코드
CREATE TABLE company (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_code VARCHAR(4) NOT NULL UNIQUE,
  company_name VARCHAR(100) NOT NULL,
  currency VARCHAR(3) DEFAULT 'KRW',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 이익센터 (EC-PCA) = 본부/사업부
CREATE TABLE profit_center (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profit_center_code VARCHAR(10) NOT NULL UNIQUE,
  profit_center_name VARCHAR(100) NOT NULL,
  company_id UUID REFERENCES company(id),
  manager VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 원가센터 (CO-OM-CCA)
CREATE TABLE cost_center (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cost_center_code VARCHAR(10) NOT NULL UNIQUE,
  cost_center_name VARCHAR(100) NOT NULL,
  profit_center_id UUID REFERENCES profit_center(id),
  cost_center_type VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 프로젝트 (PS/CO-PC)
CREATE TABLE project (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_code VARCHAR(20) NOT NULL UNIQUE,
  project_name VARCHAR(200) NOT NULL,
  profit_center_id UUID REFERENCES profit_center(id),
  project_manager VARCHAR(50),
  start_date DATE,
  end_date DATE,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  budget_amount NUMERIC(18,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 계정 (원가요소, CO-OM)
CREATE TABLE cost_element (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  element_code VARCHAR(10) NOT NULL UNIQUE,
  element_name VARCHAR(100) NOT NULL,
  element_category VARCHAR(30),
  is_active BOOLEAN DEFAULT TRUE
);

-- 원가센터 실적 집계 (월 마감 기준, CO-OM-CCA)
CREATE TABLE cost_center_actual (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cost_center_id UUID REFERENCES cost_center(id),
  cost_element_id UUID REFERENCES cost_element(id),
  fiscal_year INT NOT NULL,
  fiscal_period INT NOT NULL,
  actual_amount NUMERIC(18,2) DEFAULT 0,
  plan_amount NUMERIC(18,2) DEFAULT 0,
  headcount NUMERIC(6,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'KRW',
  data_source VARCHAR(20) DEFAULT 'MOCK',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (cost_center_id, cost_element_id, fiscal_year, fiscal_period)
);

-- 프로젝트 실적 집계 (CO-PC)
CREATE TABLE project_actual (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES project(id),
  cost_element_id UUID REFERENCES cost_element(id),
  cost_center_id UUID REFERENCES cost_center(id),
  fiscal_year INT NOT NULL,
  fiscal_period INT NOT NULL,
  actual_amount NUMERIC(18,2) DEFAULT 0,
  plan_amount NUMERIC(18,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'KRW',
  data_source VARCHAR(20) DEFAULT 'MOCK',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (project_id, cost_element_id, cost_center_id, fiscal_year, fiscal_period)
);

-- 내부대체가액 (CO-OM-CEL)
CREATE TABLE internal_transfer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_cost_center_id UUID REFERENCES cost_center(id),
  receiver_cost_center_id UUID REFERENCES cost_center(id),
  receiver_project_id UUID REFERENCES project(id),
  fiscal_year INT NOT NULL,
  fiscal_period INT NOT NULL,
  service_type VARCHAR(50),
  quantity NUMERIC(12,3) DEFAULT 0,
  unit_price NUMERIC(18,4) DEFAULT 0,
  transfer_amount NUMERIC(18,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'KRW',
  status VARCHAR(20) DEFAULT 'DRAFT',
  data_source VARCHAR(20) DEFAULT 'MOCK',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 표준원가 (CO-PC-PCP)
CREATE TABLE standard_cost (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cost_center_id UUID REFERENCES cost_center(id),
  cost_element_id UUID REFERENCES cost_element(id),
  fiscal_year INT NOT NULL,
  standard_amount NUMERIC(18,2) DEFAULT 0,
  allocation_basis VARCHAR(30),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (cost_center_id, cost_element_id, fiscal_year)
);

-- 표준원가 배분 결과
CREATE TABLE standard_cost_allocation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_cost_center_id UUID REFERENCES cost_center(id),
  to_cost_center_id UUID REFERENCES cost_center(id),
  to_project_id UUID REFERENCES project(id),
  fiscal_year INT NOT NULL,
  fiscal_period INT NOT NULL,
  allocated_amount NUMERIC(18,2) DEFAULT 0,
  allocation_basis VARCHAR(30),
  allocation_ratio NUMERIC(8,6),
  currency VARCHAR(3) DEFAULT 'KRW',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CO-PA 수익성 분석 집계
CREATE TABLE profitability_segment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profit_center_id UUID REFERENCES profit_center(id),
  project_id UUID REFERENCES project(id),
  fiscal_year INT NOT NULL,
  fiscal_period INT NOT NULL,
  revenue NUMERIC(18,2) DEFAULT 0,
  direct_cost NUMERIC(18,2) DEFAULT 0,
  overhead_cost NUMERIC(18,2) DEFAULT 0,
  gross_profit NUMERIC(18,2) GENERATED ALWAYS AS (revenue - direct_cost - overhead_cost) STORED,
  gross_margin NUMERIC(8,4),
  currency VARCHAR(3) DEFAULT 'KRW',
  data_source VARCHAR(20) DEFAULT 'MOCK',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (profit_center_id, project_id, fiscal_year, fiscal_period)
);

-- 인덱스
CREATE INDEX idx_cca_year_period ON cost_center_actual(fiscal_year, fiscal_period);
CREATE INDEX idx_project_actual_year ON project_actual(fiscal_year, fiscal_period);
CREATE INDEX idx_pa_year_period ON profitability_segment(fiscal_year, fiscal_period);
CREATE INDEX idx_transfer_year ON internal_transfer(fiscal_year, fiscal_period);
CREATE INDEX idx_cost_center_profit_center ON cost_center(profit_center_id);
CREATE INDEX idx_project_profit_center ON project(profit_center_id);

-- RLS 설정 (필요 시 활성화)
-- ALTER TABLE company ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE profit_center ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE cost_center ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE project ENABLE ROW LEVEL SECURITY;
