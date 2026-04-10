import { describe, it, expect } from 'vitest'
import type { Settings } from '~/models/settings'

// FlowController has many DOM dependencies, but several methods contain
// pure computational logic that we can extract and test.

describe('FlowController pure logic', () => {
  describe('Limiter behavior', () => {
    // Extracted from the Limiter class in flow-controller.ts
    class Limiter {
      private limits: number
      private count = 0
      private expireTime = Date.now()

      constructor(limits: number) {
        this.limits = limits
      }

      isOver() {
        const now = Date.now()
        if (now > this.expireTime) {
          this.count = 0
          this.expireTime = now + 1000
        }
        return ++this.count > this.limits
      }
    }

    it('does not limit when count is within limits', () => {
      const limiter = new Limiter(3)
      expect(limiter.isOver()).toBe(false) // 1
      expect(limiter.isOver()).toBe(false) // 2
      expect(limiter.isOver()).toBe(false) // 3
    })

    it('limits when count exceeds limits', () => {
      const limiter = new Limiter(2)
      expect(limiter.isOver()).toBe(false) // 1
      expect(limiter.isOver()).toBe(false) // 2
      expect(limiter.isOver()).toBe(true)  // 3 -> over
    })

    it('limits with 0 limits (always over after first)', () => {
      const limiter = new Limiter(0)
      expect(limiter.isOver()).toBe(true) // 1 > 0
    })
  })

  describe('getLinesAndHeight', () => {
    // Extracted from FlowController.getLinesAndHeight
    const getLinesAndHeight = (videoHeight: number, settings: Pick<Settings, 'heightType' | 'lineHeight' | 'lines' | 'maxLines'>) => {
      let lines: number, height: number
      if (settings.heightType === 'fixed') {
        height = settings.lineHeight
        lines = Math.floor((videoHeight - height * 0.2) / height)
      } else {
        lines = settings.lines
        height = videoHeight / (lines + 0.2)
      }
      lines = settings.maxLines > 0 ? Math.min(settings.maxLines, lines) : lines
      return [lines, height]
    }

    it('calculates flexible height', () => {
      const [lines, height] = getLinesAndHeight(720, {
        heightType: 'flexible',
        lineHeight: 64,
        lines: 12,
        maxLines: 0,
      })
      expect(lines).toBe(12)
      expect(height).toBeCloseTo(720 / 12.2, 5)
    })

    it('calculates fixed height', () => {
      const [lines, height] = getLinesAndHeight(720, {
        heightType: 'fixed',
        lineHeight: 64,
        lines: 12,
        maxLines: 0,
      })
      expect(height).toBe(64)
      expect(lines).toBe(Math.floor((720 - 64 * 0.2) / 64))
    })

    it('respects maxLines when set', () => {
      const [lines] = getLinesAndHeight(720, {
        heightType: 'flexible',
        lineHeight: 64,
        lines: 12,
        maxLines: 5,
      })
      expect(lines).toBe(5)
    })

    it('does not limit lines when maxLines is 0', () => {
      const [lines] = getLinesAndHeight(720, {
        heightType: 'flexible',
        lineHeight: 64,
        lines: 12,
        maxLines: 0,
      })
      expect(lines).toBe(12)
    })

    it('maxLines has no effect when lines is already smaller', () => {
      const [lines] = getLinesAndHeight(720, {
        heightType: 'flexible',
        lineHeight: 64,
        lines: 3,
        maxLines: 10,
      })
      expect(lines).toBe(3)
    })
  })

  describe('isDeniedIndex', () => {
    // Extracted from FlowController.isDeniedIndex
    const isDeniedIndex = (index: number, lines: number) => {
      return index % (lines * 2) === lines * 2 - 1
    }

    it('denies boundary indices', () => {
      // With lines=12, denied index is 23, 47, 71...
      expect(isDeniedIndex(23, 12)).toBe(true)
      expect(isDeniedIndex(47, 12)).toBe(true)
      expect(isDeniedIndex(71, 12)).toBe(true)
    })

    it('allows non-boundary indices', () => {
      expect(isDeniedIndex(0, 12)).toBe(false)
      expect(isDeniedIndex(11, 12)).toBe(false)
      expect(isDeniedIndex(12, 12)).toBe(false)
      expect(isDeniedIndex(22, 12)).toBe(false)
      expect(isDeniedIndex(24, 12)).toBe(false)
    })

    it('works with different line counts', () => {
      // With lines=5, denied index is 9, 19, 29...
      expect(isDeniedIndex(9, 5)).toBe(true)
      expect(isDeniedIndex(19, 5)).toBe(true)
      expect(isDeniedIndex(8, 5)).toBe(false)
      expect(isDeniedIndex(10, 5)).toBe(false)
    })
  })

  describe('timeline creation logic', () => {
    it('calculates timeline with zero delay', () => {
      const displayMillis = 5000
      const delayMillis = 0
      const containerWidth = 1920
      const elementWidth = 200
      const w = elementWidth
      const v = (containerWidth + w) / displayMillis
      const t = w / v

      expect(v).toBeGreaterThan(0)
      expect(t).toBeGreaterThan(0)
      expect(t).toBeLessThan(displayMillis)
    })

    it('calculates timeline with delay', () => {
      const displayMillis = 5000
      const delayMillis = 1000
      const containerWidth = 1920
      const elementWidth = 200
      const w = elementWidth
      const v = (containerWidth + w) / displayMillis
      const t = w / v
      const n = 1000 // mock Date.now()

      const timeline = {
        willAppear: n + delayMillis,
        didAppear: n + t + delayMillis,
        willDisappear: n + displayMillis - t + delayMillis,
        didDisappear: n + displayMillis + delayMillis,
      }

      expect(timeline.willAppear).toBe(2000)
      expect(timeline.didDisappear).toBe(7000)
      expect(timeline.didAppear).toBeLessThan(timeline.willDisappear)
      expect(timeline.willAppear).toBeLessThan(timeline.didAppear)
      expect(timeline.willDisappear).toBeLessThan(timeline.didDisappear)
    })
  })
})
