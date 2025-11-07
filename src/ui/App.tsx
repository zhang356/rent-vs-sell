import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { I18N, t, type Lang } from './i18n'
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend } from 'chart.js'

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend)

type Row = { year: number; sell: number; holdProperty: number; holdCash: number; holdNet: number; delta: number }
type State = {
  years: number
  stockReturn: number
  saleProceeds: number
  propValue: number
  propAppreciation: number
  reinvestRate: number
  annualRent: number
  maintenance: number
  hoa: number
  otherCosts: number
  lang: Lang
}

const defaultState: State = {
  years: 15,
  stockReturn: 7,
  saleProceeds: 300000,
  propValue: 800000,
  propAppreciation: 3,
  reinvestRate: 7,
  annualRent: 42000,
  maintenance: 2500,
  hoa: 3600,
  otherCosts: 0,
  lang: 'en'
}

const fmt = (n: number, d = 0) => new Intl.NumberFormat(undefined, { maximumFractionDigits: d, minimumFractionDigits: d }).format(n)
const fmtMoney = (n: number) => (n < 0 ? '-' : '') + '$' + fmt(Math.abs(n), 0)

function rowsFromState(s: State): Row[] {
  const years = s.years
  const rStock = s.stockReturn / 100
  const proceeds = s.saleProceeds

  let propVal = s.propValue
  const rProp = s.propAppreciation / 100
  const rReinv = s.reinvestRate / 100

  const annualNet = s.annualRent - s.maintenance - s.hoa - s.otherCosts

  let sell = proceeds
  let cashPot = 0

  const rows: Row[] = []
  for (let y = 1; y <= years; y++) {
    sell = sell * (1 + rStock)
    propVal = propVal * (1 + rProp)
    cashPot = cashPot * (1 + rReinv) + annualNet

    const holdNet = propVal + cashPot
    const delta = holdNet - sell
    rows.push({ year: y, sell: round2(sell), holdProperty: round2(propVal), holdCash: round2(cashPot), holdNet: round2(holdNet), delta: round2(delta) })
  }
  return rows
}

const round2 = (n: number) => Math.round(n * 100) / 100

function useHashState(initial: State) {
  const [state, setState] = useState<State>(() => {
    const params = new URLSearchParams(location.hash.slice(1))
    const s = { ...initial }
    const lang = params.get('lang')
    if (lang === 'en' || lang === 'zh') s.lang = lang
    for (const key of Object.keys(s) as (keyof State)[]) {
      if (key === 'lang') continue
      const v = params.get(String(key))
      if (v != null) {
        const num = key === 'years' ? parseInt(v) : parseFloat(v)
        if (!Number.isNaN(num)) (s as any)[key] = num
      }
    }
    return s
  })

  useEffect(() => {
    const params = new URLSearchParams()
    (Object.keys(state) as (keyof State)[]).forEach((k) => params.set(String(k), String((state as any)[k])))
    history.replaceState(null, '', '#' + params.toString())
  }, [state])

  return [state, setState] as const
}

export function App() {
  const [state, setState] = useHashState(defaultState)
  const lang = state.lang
  const dict = I18N[lang]

  const rows = useMemo(() => rowsFromState(state), [state])
  const last = rows[rows.length - 1]
  const best = last ? (last.holdNet > last.sell ? 'hold' : last.holdNet < last.sell ? 'sell' : 'tie') : 'tie'

  return (
    <>
      <header>
        <h1>{dict.title}</h1>
        <p dangerouslySetInnerHTML={{ __html: dict.subtitle }} />
      </header>

      <div class="container">
        <div class="grid">
          <aside class="card">
            <h2>{dict.inputsHeading}</h2>

            <div class="section">
              <h3>{dict.languageHeading}</h3>
              <label>{dict.languageLabel}</label>
              <select
                value={lang}
                onInput={(e: any) => setState((s) => ({ ...s, lang: (e.currentTarget.value as Lang) }))}
              >
                <option value="en">English</option>
                <option value="zh">中文</option>
              </select>
              <div class="hint">{dict.languageHint}</div>
            </div>

            <div class="section">
              <h3>{dict.globalHeading}</h3>
              <NumberField label={dict.yearsLabel} hint={dict.yearsHint} min={1} max={60} step={1}
                value={state.years} onChange={(v) => setState((s) => ({ ...s, years: v }))} />
              <NumberField label={dict.stockReturnLabel} hint={dict.stockReturnHint} step={0.1}
                value={state.stockReturn} onChange={(v) => setState((s) => ({ ...s, stockReturn: v }))} />
            </div>

            <div class="section">
              <h3>{dict.sellHeading}</h3>
              <NumberField label={dict.saleProceedsLabel} hint={stripHtml(dict.saleProceedsHint)} step={1000}
                value={state.saleProceeds} onChange={(v) => setState((s) => ({ ...s, saleProceeds: v }))} />
            </div>

            <div class="section">
              <h3>{dict.holdHeading}</h3>
              <NumberField label={dict.propValueLabel} step={1000}
                value={state.propValue} onChange={(v) => setState((s) => ({ ...s, propValue: v }))} />
              <div class="row">
                <NumberField label={dict.propAppLabel} step={0.1}
                  value={state.propAppreciation} onChange={(v) => setState((s) => ({ ...s, propAppreciation: v }))} />
                <NumberField label={dict.reinvestLabel} step={0.1}
                  value={state.reinvestRate} onChange={(v) => setState((s) => ({ ...s, reinvestRate: v }))} />
              </div>
              <NumberField label={dict.annualRentLabel} step={500}
                value={state.annualRent} onChange={(v) => setState((s) => ({ ...s, annualRent: v }))} />
              <div class="row">
                <NumberField label={dict.maintenanceLabel} step={100}
                  value={state.maintenance} onChange={(v) => setState((s) => ({ ...s, maintenance: v }))} />
                <NumberField label={dict.hoaLabel} step={100}
                  value={state.hoa} onChange={(v) => setState((s) => ({ ...s, hoa: v }))} />
              </div>
              <NumberField label={dict.otherCostsLabel} hint={dict.otherCostsHint} step={100}
                value={state.otherCosts} onChange={(v) => setState((s) => ({ ...s, otherCosts: v }))} />
            </div>

            <div class="controls">
              <button onClick={() => setState({ ...defaultState, lang })}>{dict.resetBtn}</button>
              <button onClick={async () => {
                try {
                  await navigator.clipboard.writeText(location.href)
                  flashPill(dict.copyOk)
                } catch {
                  flashPill(dict.copyFail)
                }
              }}>{dict.shareBtn}</button>
              <button onClick={() => exportCSV(rows, dict)}>{dict.csvBtn}</button>
            </div>

            <p class="small">{dict.disclaimer}</p>
          </aside>

          <main class="card">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:10px;">
              <h2 style="margin:0;">{dict.projectionHeading}</h2>
              <div class="pill" style={{ background: best === 'hold' ? 'var(--accent)' : best === 'sell' ? 'var(--accent2)' : 'linear-gradient(90deg, var(--accent), var(--accent2))' }}>
                {best === 'tie' ? dict.bestTie : best === 'hold' ? dict.bestHold : dict.bestSell}
              </div>
            </div>

            <ProjectionChart lang={lang} rows={rows} />

            <div class="card" style="margin-top:16px; background:#0d1326;">
              <h2 style="font-size:16px; margin-bottom:8px;">{dict.tableHeading}</h2>
              <YearTable lang={lang} rows={rows} />
            </div>
          </main>
        </div>
      </div>

      <footer>{dict.footerNote}</footer>
    </>
  )
}

function NumberField(props: { label: string; value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number; hint?: string }) {
  const { label, value, onChange, step, min, max, hint } = props
  return (
    <div>
      <label>{label}</label>
      <input
        type="number"
        value={value}
        step={step ?? 1}
        min={min}
        max={max}
        onInput={(e: any) => onChange(Number(e.currentTarget.value))}
      />
      {hint && <div class="hint" dangerouslySetInnerHTML={{ __html: hint }} />}
    </div>
  )
}

function ProjectionChart({ lang, rows }: { lang: Lang; rows: Row[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    chartRef.current?.destroy()
    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels: rows.map(r => 'Y' + r.year),
        datasets: [
          {
            label: I18N[lang].chart.sell,
            data: rows.map((r) => r.sell),
            tension: 0.25,
            borderWidth: 2,
            borderColor: '#60a5fa',
            backgroundColor: 'rgba(96,165,250,0.15)',
            pointBackgroundColor: '#60a5fa',
            pointBorderColor: '#60a5fa'
          },
          {
            label: I18N[lang].chart.hold,
            data: rows.map((r) => r.holdNet),
            tension: 0.25,
            borderWidth: 2,
            borderColor: '#6ee7b7',
            backgroundColor: 'rgba(110,231,183,0.15)',
            pointBackgroundColor: '#6ee7b7',
            pointBorderColor: '#6ee7b7'
          }
        ]
      },
      options: {
        responsive: true,
        interaction: { mode: 'index' as const, intersect: false },
        plugins: {
          legend: { labels: { color: '#e6ebf2' } },
          tooltip: {
            callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${fmtMoney(ctx.parsed.y)}` }
          }
        },
        scales: {
          x: { ticks: { color: '#9aa3b2' }, grid: { color: '#1b2344' } },
          y: { ticks: { color: '#9aa3b2', callback: (v: number) => '$' + fmt(v) }, grid: { color: '#1b2344' } }
        }
      }
    })
    return () => chartRef.current?.destroy()
  }, [lang, rows])

  return <canvas ref={canvasRef} height={120} />
}

function YearTable({ lang, rows }: { lang: Lang; rows: Row[] }) {
  const dict = I18N[lang]
  return (
    <div>
      <table>
        <thead>
          <tr>
            <th class="label">{dict.table.year}</th>
            <th>{dict.table.sell}</th>
            <th>{dict.table.holdProp}</th>
            <th>{dict.table.holdCash}</th>
            <th>{dict.table.holdNet}</th>
            <th>{dict.table.delta}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr>
              <td class="label">{dict.table.year} {r.year}</td>
              <td>{fmtMoney(r.sell)}</td>
              <td>{fmtMoney(r.holdProperty)}</td>
              <td>{fmtMoney(r.holdCash)}</td>
              <td>{fmtMoney(r.holdNet)}</td>
              <td class={r.delta >= 0 ? 'delta-pos' : 'delta-neg'}>{fmtMoney(r.delta)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function exportCSV(rows: Row[], dict: any) {
  let csv = `${dict.table.year},${dict.table.sell},${dict.table.holdProp} Property Value,${dict.table.holdCash},${dict.table.holdNet},${dict.table.delta}\n`
  rows.forEach(r => {
    csv += [r.year, r.sell, r.holdProperty, r.holdCash, r.holdNet, r.delta].join(',') + '\n'
  })
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'rent-vs-sell.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function flashPill(text: string) {
  // simple alert alternative for now
  // You can enhance with a toast system later
  console.log(text)
}

function stripHtml(html: string) {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}
