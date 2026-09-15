import { useState } from 'react'
import { Table, Td, Th } from '../ui'

export type HourPoint = { hour: Date; clickCount: number }

const hourLabel = (hour: Date) =>
  hour.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

const fullLabel = (hour: Date) =>
  `${hour.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${hourLabel(hour)}`

/**
 * Game launches per hour — a single series, so there is no legend (the title
 * names it) and no value printed on every bar. The peak is labelled directly;
 * everything else is carried by the axis, the hover tooltip and the data table.
 *
 * One hue, flat fill, no gradient. Bars are capped in width rather than filling
 * their slot, and separated by a surface gap rather than a stroke.
 */
export function HourlyClicksChart({ points }: { points: HourPoint[] }) {
  const [hovered, setHovered] = useState<HourPoint | null>(null)
  const [showTable, setShowTable] = useState(false)

  const max = Math.max(1, ...points.map((point) => point.clickCount))
  const peakIndex = points.reduce(
    (best, point, index) => (point.clickCount > (points[best]?.clickCount ?? 0) ? index : best),
    0,
  )
  const total = points.reduce((sum, point) => sum + point.clickCount, 0)

  /* Four recessive hairlines; the top one doubles as the max reference. */
  const gridValues = [1, 0.75, 0.5, 0.25].map((fraction) => Math.round(max * fraction))

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <div className="flex gap-3">
          {/* y-axis */}
          <div className="flex h-56 w-10 shrink-0 flex-col justify-between py-0 text-right">
            {gridValues.map((value) => (
              <span key={value} className="text-[11px] text-muted-foreground tabular-nums">
                {value}
              </span>
            ))}
            <span className="text-[11px] text-muted-foreground tabular-nums">0</span>
          </div>

          <div className="min-w-0 flex-1 overflow-x-auto">
            {/* Height accounts for the plot and the x-axis band, so the card
                never grows an inner scrollbar. */}
            <div className="min-w-[640px]">
              <div
                className="relative h-56"
                role="img"
                aria-label={`Game launches per hour over the last ${points.length} hours. ${total} launches in total, peaking at ${points[peakIndex]?.clickCount ?? 0}.`}
              >
                {/* Gridlines: solid hairlines one step off the surface. */}
                {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
                  <div
                    key={fraction}
                    className="absolute inset-x-0 border-t border-border"
                    style={{ top: `${fraction * 100}%` }}
                  />
                ))}

                <div className="absolute inset-0 flex items-end gap-[2px]">
                  {points.map((point, index) => {
                    const heightPercent = (point.clickCount / max) * 100
                    const isPeak = index === peakIndex && point.clickCount > 0
                    return (
                      <div
                        key={point.hour.toISOString()}
                        className="flex h-full flex-1 items-end justify-center"
                        onMouseEnter={() => setHovered(point)}
                        onMouseLeave={() => setHovered(null)}
                      >
                        <div
                          className="w-full max-w-[18px] rounded-t bg-primary transition-opacity duration-200"
                          style={{
                            height: `${Math.max(heightPercent, point.clickCount > 0 ? 2 : 0)}%`,
                            opacity: hovered && hovered !== point ? 0.55 : 1,
                          }}
                        />
                        {isPeak && (
                          <span
                            className="absolute text-[11px] font-medium text-foreground tabular-nums"
                            style={{ bottom: `calc(${heightPercent}% + 4px)` }}
                          >
                            {point.clickCount}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* x-axis: every sixth hour, so labels never collide. */}
              <div className="mt-2 flex gap-[2px]">
                {points.map((point, index) => (
                  <div key={point.hour.toISOString()} className="flex-1 text-center">
                    {index % 6 === 0 && (
                      <span className="text-[11px] whitespace-nowrap text-muted-foreground tabular-nums">
                        {hourLabel(point.hour)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {hovered && (
          <div
            aria-live="polite"
            className="pointer-events-none absolute top-0 right-0 rounded-md border border-border bg-card px-3 py-2 text-xs"
          >
            <p className="font-medium text-foreground">{fullLabel(hovered.hour)}</p>
            <p className="text-muted-foreground tabular-nums">
              {hovered.clickCount} {hovered.clickCount === 1 ? 'launch' : 'launches'}
            </p>
          </div>
        )}
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowTable((open) => !open)}
          aria-expanded={showTable}
          className="cursor-pointer text-xs font-medium text-primary underline underline-offset-4 transition-colors duration-200 hover:text-primary-hover"
        >
          {showTable ? 'Hide data table' : 'Show data table'}
        </button>
      </div>

      {showTable && (
        <Table>
          <caption className="sr-only">Game launches per hour</caption>
          <thead>
            <tr>
              <Th>Hour</Th>
              <Th className="text-right">Launches</Th>
            </tr>
          </thead>
          <tbody>
            {points
              .filter((point) => point.clickCount > 0)
              .map((point) => (
                <tr key={point.hour.toISOString()}>
                  <Td>{fullLabel(point.hour)}</Td>
                  <Td className="text-right tabular-nums">{point.clickCount}</Td>
                </tr>
              ))}
          </tbody>
        </Table>
      )}
    </div>
  )
}
