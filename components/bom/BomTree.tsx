'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import StatusBadge from '@/components/common/StatusBadge'
import { fmtKRWFull } from '@/lib/utils/format'
import type { BomNode } from '@/types'

interface Props {
  nodes: BomNode[]
  rootMatnr: string
  rootName: string
  stdPrice: number
  matRate: number
}

interface TreeNode extends BomNode {
  childNodes: TreeNode[]
}

function buildTree(nodes: BomNode[], parentMatnr: string): TreeNode[] {
  return nodes
    .filter((n) => n.matnr_parent === parentMatnr)
    .map((n) => ({
      ...n,
      childNodes: buildTree(nodes, n.matnr_child),
    }))
}

function NodeRow({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const [open, setOpen] = useState(true)
  const hasChildren = node.childNodes.length > 0

  return (
    <>
      <tr className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
        <td className="px-4 py-2.5">
          <div className="flex items-center gap-1" style={{ paddingLeft: depth * 20 }}>
            {hasChildren ? (
              <button onClick={() => setOpen((o) => !o)} className="text-slate-400 hover:text-slate-600">
                {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
              <span className="w-[14px] text-slate-300 text-sm">└</span>
            )}
            <span className="font-mono text-xs text-blue-700 font-medium">{node.matnr_child}</span>
          </div>
        </td>
        <td className="px-4 py-2.5 text-slate-700">{node.child_name}</td>
        <td className="px-4 py-2.5 text-center">
          <StatusBadge type={node.child_type} />
        </td>
        <td className="px-4 py-2.5 text-right text-slate-600 text-sm">
          {node.quantity} {node.unit}
        </td>
        <td className="px-4 py-2.5 text-right text-slate-600 text-sm">
          {node.unit_price.toLocaleString('ko-KR')}원
        </td>
        <td className="px-4 py-2.5 text-right font-medium text-slate-800 text-sm">
          {node.level_cost.toLocaleString('ko-KR')}원
        </td>
      </tr>
      {open &&
        node.childNodes.map((child) => (
          <NodeRow key={child.id} node={child} depth={depth + 1} />
        ))}
    </>
  )
}

export default function BomTree({ nodes, rootMatnr, rootName, stdPrice, matRate }: Props) {
  const tree = buildTree(nodes, rootMatnr)
  const totalMaterialCost = nodes.reduce((s, n) => s + n.level_cost, 0)

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* 완제품 헤더 */}
      <div className="px-5 py-4 bg-[#e6f1fb] border-b border-[#b8d4f0]">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <StatusBadge type="FERT" />
              <span className="font-mono text-sm font-bold text-[#0c447c]">{rootMatnr}</span>
            </div>
            <p className="text-base font-semibold text-[#0c1e3c] mt-0.5">{rootName}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">표준단가</p>
            <p className="text-lg font-bold text-slate-800">{stdPrice.toLocaleString('ko-KR')}원</p>
            <p className="text-xs text-slate-500 mt-1">
              단위재료비 <span className="font-semibold text-slate-700">{fmtKRWFull(totalMaterialCost)}</span>
              <span className={`ml-2 font-bold ${matRate > 55 ? 'text-red-600' : 'text-green-600'}`}>
                ({matRate.toFixed(1)}%)
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* BOM 트리 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-2.5 text-xs text-slate-500 font-medium">자재코드</th>
              <th className="text-left px-4 py-2.5 text-xs text-slate-500 font-medium">자재명</th>
              <th className="text-center px-4 py-2.5 text-xs text-slate-500 font-medium">유형</th>
              <th className="text-right px-4 py-2.5 text-xs text-slate-500 font-medium">소요량</th>
              <th className="text-right px-4 py-2.5 text-xs text-slate-500 font-medium">단가</th>
              <th className="text-right px-4 py-2.5 text-xs text-slate-500 font-medium">레벨원가</th>
            </tr>
          </thead>
          <tbody>
            {tree.map((node) => (
              <NodeRow key={node.id} node={node} depth={0} />
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200 bg-slate-100">
              <td colSpan={5} className="px-4 py-2.5 text-sm font-semibold text-slate-700">단위 재료비 합계</td>
              <td className="px-4 py-2.5 text-right font-bold text-slate-800 text-sm">
                {totalMaterialCost.toLocaleString('ko-KR')}원
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
