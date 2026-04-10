import { describe, it, expect } from 'vitest'
import type {
  AuthorType,
  MessageType,
  Settings,
  Style,
  Styles,
  Visibilities,
  Template,
  EmojiStyle,
  HeightType,
  StackDirection,
  Overflow,
} from '~/models/settings'
import type { Message } from '~/models/message'

describe('models/settings types', () => {
  it('AuthorType accepts valid values', () => {
    const types: AuthorType[] = ['guest', 'member', 'moderator', 'owner', 'you']
    expect(types).toHaveLength(5)
  })

  it('MessageType accepts valid values', () => {
    const types: MessageType[] = ['super-chat', 'super-sticker', 'membership']
    expect(types).toHaveLength(3)
  })

  it('Template accepts valid values', () => {
    const templates: Template[] = [
      'one-line-without-author',
      'one-line-with-author',
      'two-line',
    ]
    expect(templates).toHaveLength(3)
  })

  it('EmojiStyle accepts valid values', () => {
    const styles: EmojiStyle[] = ['image', 'text', 'none']
    expect(styles).toHaveLength(3)
  })

  it('Style has correct shape', () => {
    const style: Style = {
      avatar: true,
      color: '#ffffff',
      template: 'one-line-without-author',
    }
    expect(style.avatar).toBe(true)
    expect(style.color).toBe('#ffffff')
    expect(style.template).toBe('one-line-without-author')
  })

  it('Settings has correct default structure', () => {
    const settings: Settings = {
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
    }
    expect(settings.displayTime).toBe(5)
    expect(settings.lines).toBe(12)
    expect(settings.styles.guest.avatar).toBe(false)
    expect(settings.visibilities['super-chat']).toBe(true)
  })
})

describe('models/message types', () => {
  it('Message has correct shape', () => {
    const message: Message = {
      author: 'TestUser',
      authorType: 'guest',
      message: 'Hello',
      messageType: 'text-message',
      html: '<span>Hello</span>',
      avatarUrl: 'https://example.com/avatar.jpg',
    }
    expect(message.author).toBe('TestUser')
    expect(message.messageType).toBe('text-message')
  })

  it('Message allows optional fields', () => {
    const message: Message = {}
    expect(message.author).toBeUndefined()
    expect(message.stickerUrl).toBeUndefined()
  })
})
