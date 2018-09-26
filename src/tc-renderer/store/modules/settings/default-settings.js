export default {
  identity: {
    username: '',
    password: ''
  },
  chat: {
    timestamps: false,
    modactions: {
      enabled: true,
      purge: {
        value: 3,
        visible: true
      },
      timeout: {
        value: 600,
        visible: true
      },
      ban: {
        visible: true
      }
    },

    ignored: []
  },
  notifications: {
    onConnect: false,
    onMention: true,
    onWhisper: true,
    soundOnMention: true
  },
  theme: {
    dark: false
  },
  appearance: {
    split: false,
    thumbnail: true,
    hideTimeouts: false,
    simpleViewerCount: false,
    sidebarCollapsed: false,
    variableLineHeight: false,
    chatters: true,
    zoom: 100,
    alwaysOnTop: false
  },
  behavior: {
    autoStart: false
  },
  shortcuts: {},
  selectedTabIndex: 0,
  channels: [],
  highlights: [],
  highlightMe: true
}
