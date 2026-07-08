'use client'

import { useEffect, useRef } from 'react'
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Legend,
  Tooltip,
} from 'chart.js'

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Legend, Tooltip)

const verticalLinesPlugin = {
  id: 'verticalLines',
  afterDraw: (chart) => {
    const { currentPriceIndex, baseline } = chart.$marketingMeta || {}
    if (currentPriceIndex === undefined) return

    const ctx = chart.ctx
    const xAxis = chart.scales.x
    const yAxis = chart.scales.y

    const currentX = xAxis.getPixelForTick(currentPriceIndex)
    ctx.save()
    ctx.beginPath()
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)'
    ctx.lineWidth = 1.5
    ctx.moveTo(currentX, yAxis.top)
    ctx.lineTo(currentX, yAxis.bottom)
    ctx.stroke()
    ctx.restore()

    if (!baseline) return

    const { index, grossProfit } = baseline
    if (index >= 0 && index <= 8) {
      const xFloor = xAxis.getPixelForTick(Math.floor(index))
      const xCeil = xAxis.getPixelForTick(Math.min(8, Math.ceil(index)))
      const x = xFloor + (xCeil - xFloor) * (index - Math.floor(index))

      ctx.save()
      ctx.beginPath()
      ctx.strokeStyle = '#f59e0b'
      ctx.lineWidth = 1.5
      ctx.setLineDash([4, 4])
      ctx.moveTo(x, yAxis.top)
      ctx.lineTo(x, yAxis.bottom)
      ctx.stroke()

      ctx.fillStyle = '#d97706'
      ctx.font = 'bold 10px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Baseline', x, yAxis.top - 4)
      ctx.restore()

      const yVal = yAxis.getPixelForValue(grossProfit)
      ctx.save()
      ctx.beginPath()
      ctx.arc(x, yVal, 6, 0, 2 * Math.PI)
      ctx.fillStyle = '#f59e0b'
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.fill()
      ctx.stroke()
      ctx.restore()
    }
  },
}

export default function SweetSpotChart({ pricePoints, profitPoints, baseProfitPoints, isBaselineLocked, baselineMeta }) {
  const canvasRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    const datasets = [
      {
        label: 'Profit Skenario Aktif',
        data: profitPoints,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.06)',
        fill: true,
        tension: 0.2,
        pointRadius: profitPoints.map((_, i) => (i === 4 ? 6 : 3)),
        pointBackgroundColor: profitPoints.map((_, i) => (i === 4 ? '#2563eb' : '#3b82f6')),
      },
    ]

    if (isBaselineLocked) {
      datasets.push({
        label: 'Profit Baseline Terkunci',
        data: baseProfitPoints,
        borderColor: '#94a3b8',
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.2,
        pointRadius: 0,
        borderDash: [5, 5],
      })
    }

    if (!chartRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      chartRef.current = new Chart(ctx, {
        type: 'line',
        data: { labels: pricePoints, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: isBaselineLocked } },
          scales: {
            y: { ticks: { callback: (v) => 'Rp ' + v.toLocaleString('id-ID') }, grid: { color: 'rgba(0,0,0,0.03)' } },
            x: { grid: { display: false } },
          },
        },
        plugins: [verticalLinesPlugin],
      })
    } else {
      chartRef.current.data.labels = pricePoints
      chartRef.current.data.datasets = datasets
      chartRef.current.options.plugins.legend.display = isBaselineLocked
    }

    chartRef.current.$marketingMeta = {
      currentPriceIndex: 4,
      baseline: baselineMeta,
    }
    chartRef.current.update('none')
  }, [pricePoints, profitPoints, baseProfitPoints, isBaselineLocked, baselineMeta])

  useEffect(() => () => {
    if (chartRef.current) {
      chartRef.current.destroy()
      chartRef.current = null
    }
  }, [])

  return (
    <div className="relative" style={{ height: 380 }}>
      <canvas ref={canvasRef} />
    </div>
  )
}
