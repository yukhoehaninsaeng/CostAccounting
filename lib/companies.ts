export interface Company {
  bukrs: string
  name: string
  plant: string
  color: string
  bgColor: string
  textColor: string
}

export const COMPANIES: Record<string, Company> = {
  '1000': {
    bukrs: '1000',
    name: '범진(주) 본사',
    plant: '1000',
    color: '#185fa5',
    bgColor: '#e6f1fb',
    textColor: '#0c447c',
  },
  '3000': {
    bukrs: '3000',
    name: 'BJC Vietnam',
    plant: '3000',
    color: '#0f6e56',
    bgColor: '#e1f5ee',
    textColor: '#085041',
  },
  '4000': {
    bukrs: '4000',
    name: 'BJC E-Health',
    plant: '4000',
    color: '#854f0b',
    bgColor: '#faeeda',
    textColor: '#633806',
  },
}

export const COMPANY_LIST = Object.values(COMPANIES)
