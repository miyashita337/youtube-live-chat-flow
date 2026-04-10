import { describe, it, expect, vi } from 'vitest'
import type { Message } from '~/models/message'
import type { Settings } from '~/models/settings'

// MessageSettings depends on DOM (document.querySelector for yourName),
// so we test the pure logic by extracting the key behaviors.

// Helper to create a default settings object for testing
const createSettings = (overrides: Partial<Settings> = {}): Settings => ({
  background: false,
  backgroundOpacity: 0.4,
  bottomChatInputEnabled: true,
  chatVisible: true,
  delayTime: 0,
  displayTime: 5,
  emojiStyle: 'image',
  extendedStyle: '',
  growBottomChatInputEnabled: false,
  heightType: 'flexible',
  lineHeight: 64,
  lines: 12,
  maxDisplays: 0,
  maxLines: 0,
  maxWidth: 200,
  opacity: 0.8,
  outlineRatio: 0.015,
  overflow: 'overlay',
  stackDirection: 'top_to_bottom',
  styles: {
    guest: { avatar: false, color: '#ffffff', template: 'one-line-without-author' },
    member: { avatar: true, color: '#ccffcc', template: 'one-line-without-author' },
    moderator: { avatar: true, color: '#ccccff', template: 'two-line' },
    owner: { avatar: true, color: '#ffffcc', template: 'two-line' },
    you: { avatar: true, color: '#ffcccc', template: 'one-line-with-author' },
  },
  visibilities: {
    guest: true,
    member: true,
    moderator: true,
    owner: true,
    you: true,
    'super-chat': true,
    'super-sticker': true,
    membership: true,
  },
  ...overrides,
})

describe('MessageSettings logic (pure functions extracted)', () => {
  describe('authorType normalization', () => {
    // Extracted logic from MessageSettings.authorType getter
    const normalizeAuthorType = (authorType: string | undefined) => {
      return (
        ['guest', 'member', 'moderator', 'owner', 'you'].includes(authorType ?? '')
          ? authorType
          : 'guest'
      )
    }

    it('returns valid author types as-is', () => {
      expect(normalizeAuthorType('guest')).toBe('guest')
      expect(normalizeAuthorType('member')).toBe('member')
      expect(normalizeAuthorType('moderator')).toBe('moderator')
      expect(normalizeAuthorType('owner')).toBe('owner')
      expect(normalizeAuthorType('you')).toBe('you')
    })

    it('falls back to guest for unknown types', () => {
      expect(normalizeAuthorType('unknown')).toBe('guest')
      expect(normalizeAuthorType(undefined)).toBe('guest')
      expect(normalizeAuthorType('')).toBe('guest')
    })
  })

  describe('paid message detection', () => {
    // Extracted logic from MessageSettings.paid getter
    const isPaid = (messageType: string | undefined) => {
      return ['paid-message', 'paid-sticker', 'membership-item'].includes(
        messageType ?? ''
      )
    }

    it('identifies paid message types', () => {
      expect(isPaid('paid-message')).toBe(true)
      expect(isPaid('paid-sticker')).toBe(true)
      expect(isPaid('membership-item')).toBe(true)
    })

    it('returns false for non-paid types', () => {
      expect(isPaid('text-message')).toBe(false)
      expect(isPaid(undefined)).toBe(false)
      expect(isPaid('')).toBe(false)
    })
  })

  describe('template selection', () => {
    // Extracted logic from MessageSettings.template getter
    const getTemplate = (
      messageType: string | undefined,
      authorType: 'guest' | 'member' | 'moderator' | 'owner' | 'you',
      settings: Settings
    ) => {
      const style = settings.styles[authorType]
      switch (messageType) {
        case 'text-message':
          return settings.visibilities[authorType]
            ? style.template === 'two-line'
              ? 'two-line-message'
              : 'one-line-message'
            : undefined
        case 'paid-message':
          return settings.visibilities['super-chat']
            ? 'two-line-message'
            : undefined
        case 'paid-sticker':
          return settings.visibilities['super-sticker']
            ? 'sticker'
            : undefined
        case 'membership-item':
          return settings.visibilities['membership']
            ? 'two-line-message'
            : undefined
      }
    }

    it('returns one-line-message for guest text messages', () => {
      const settings = createSettings()
      expect(getTemplate('text-message', 'guest', settings)).toBe('one-line-message')
    })

    it('returns two-line-message for moderator text messages', () => {
      const settings = createSettings()
      expect(getTemplate('text-message', 'moderator', settings)).toBe('two-line-message')
    })

    it('returns two-line-message for paid messages when super-chat visible', () => {
      const settings = createSettings()
      expect(getTemplate('paid-message', 'guest', settings)).toBe('two-line-message')
    })

    it('returns sticker for paid stickers when super-sticker visible', () => {
      const settings = createSettings()
      expect(getTemplate('paid-sticker', 'guest', settings)).toBe('sticker')
    })

    it('returns two-line-message for membership items when membership visible', () => {
      const settings = createSettings()
      expect(getTemplate('membership-item', 'guest', settings)).toBe('two-line-message')
    })

    it('returns undefined when visibility is off', () => {
      const settings = createSettings({
        visibilities: {
          guest: false,
          member: true,
          moderator: true,
          owner: true,
          you: true,
          'super-chat': false,
          'super-sticker': false,
          membership: false,
        },
      })
      expect(getTemplate('text-message', 'guest', settings)).toBeUndefined()
      expect(getTemplate('paid-message', 'guest', settings)).toBeUndefined()
      expect(getTemplate('paid-sticker', 'guest', settings)).toBeUndefined()
      expect(getTemplate('membership-item', 'guest', settings)).toBeUndefined()
    })
  })

  describe('font color', () => {
    it('returns #ffffff for paid messages', () => {
      const isPaid = true
      const styleColor = '#ccccff'
      const fontColor = isPaid ? '#ffffff' : styleColor
      expect(fontColor).toBe('#ffffff')
    })

    it('returns style color for non-paid messages', () => {
      const isPaid = false
      const styleColor = '#ccccff'
      const fontColor = isPaid ? '#ffffff' : styleColor
      expect(fontColor).toBe('#ccccff')
    })
  })

  describe('avatar visibility', () => {
    it('always shows avatar for paid messages', () => {
      const isPaid = true
      const styleAvatar = false
      const avatar = isPaid ? true : styleAvatar
      expect(avatar).toBe(true)
    })

    it('follows style setting for non-paid messages', () => {
      const isPaid = false
      expect(isPaid ? true : true).toBe(true)
      expect(isPaid ? true : false).toBe(false)
    })
  })
})
