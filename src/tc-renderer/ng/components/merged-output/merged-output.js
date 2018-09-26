import 'nprogress/nprogress.css'
import './merged-output.styl'
import './bttv-seasonal-emotes.styl'
import 'frostyjs/dist/css/frosty.min.css'
import 'frostyjs/dist/js/frosty.min.js'
import NProgress from 'nprogress'
import $ from 'jquery'
import angular from 'angular'
import colors from '../../../lib/colors'
import template from './merged-output.pug'
import {getModBadge} from '../../../lib/emotes/ffz'
import {sleep} from '../../../lib/util'
import {badges} from '../../../lib/api'

angular.module('xtc').component('mergedOutput', {
  template,
  controller
})

// eslint-disable-next-line
function controller($scope, $element, $sce, $timeout, mergedMessages, session, irc, openExternal, settings) {
  $element = $($element[0])

  const e = $element[0]
  const vm = this
  let fetchingBacklog = false

  // ===============================================================
  // Setup
  // ===============================================================
  vm.$onInit = () => {
    vm.settings = settings
    vm.badges = null
    vm.messages = mergedMessages
    console.log(mergedMessages)
    vm.autoScroll = () => session.autoScroll
    session.autoScroll = true

    watchUserScrolling()
    scrollWhenTogglingSidebar()
    handleNewMessages()
    scrollOnWindowResize()
    fetchBadges()
    handleAnchorClicks()
    handleEmoteHover()
    handleBadgeHover()
    setupNprogress()
    window.requestAnimationFrame(scrollDown)
    delayedScroll() // Need to rescroll once emotes and badges are loaded
  }

  vm.$onDestroy = () => {
    $element.off()
    window.removeEventListener('resize', scrollIfEnabled)
  }

  // ===============================================================
  // Directive methods
  // ===============================================================
  vm.irc = irc
  vm.selectUsername = selectUsername
  vm.isBroadcaster = isBroadcaster
  vm.trusted = html => $sce.trustAsHtml(html)
  vm.calculateColor = calculateColor
  vm.scrollDown = scrollDown
  vm.badgeBg = badgeBg
  vm.badgeTitle = badgeTitle
  vm.isOdd = isOdd
  vm.messageClassesAsString = messageClassesAsString
  vm.messageInlineStyles = messageInlineStyles
  vm.displayNameIsDifferent = displayNameIsDifferent
  vm.timeout = timeout
  vm.ban = ban
  vm.canModHere = canModHere
  vm.isModableMessage = isModableMessage
  vm.isPurgeVisible = isPurgeVisible
  vm.isTimeoutVisible = isTimeoutVisible
  vm.isBanVisible = isBanVisible

  // ===============================================================
  // Functions
  // ===============================================================
  function setupNprogress () {
    NProgress.configure({
      trickleRate: 0.18,
      trickleSpeed: 80
    })
  }

  function isOdd (m) {
    this.odd = this.odd || false
    if (!m.user) {
      this.lastUsername = null
      this.odd = !this.odd
    } else {
      if (this.lastUsername !== m.user.username) this.odd = !this.odd
      this.lastUsername = m.user.username
    }
    return this.odd
  }

  function badgeBg (name, version) {
    const url = getBadgeUrl(name, version)
    if (!url) return undefined
    return {'background-image': `url(${url})`}
  }

  function badgeTitle (name, version) {
    const badge = getBadge(name, version)
    if (!badge) return undefined
    return badge.title
  }

  function getBadgeUrl (name, version) {
    if (name === 'moderator' && version === '1') {
      const ffzModBadgeUrl = getModBadge(vm.channel)
      if (ffzModBadgeUrl) return ffzModBadgeUrl
    }
    const badge = getBadge(name, version)
    if (!badge) return undefined
    return badge.image_url_1x
  }

  function isBanVisible (m) {
    return !m.deleted && vm.settings.chat.modactions.ban.visible
  }

  function isPurgeVisible (m) {
    return !m.deleted && vm.settings.chat.modactions.purge.visible
  }

  function isTimeoutVisible (m) {
    return !m.deleted && vm.settings.chat.modactions.timeout.visible
  }

  function timeout (m, seconds) {
    if (!m.user) return
    irc.say(`#${vm.channel}`, `.timeout ${m.user.username} ${seconds}`)
  }

  function ban (m) {
    if (!m.user) return
    irc.say(`#${vm.channel}`, `.ban ${m.user.username}`)
  }

  function canModHere () {
    const channel = settings.channels[settings.selectedTabIndex]
    const myUsername = settings.identity.username
    return isBroadcaster(myUsername) || irc.isMod(`#${channel}`, myUsername)
  }

  function isModableMessage (m) {
    return settings.chat.modactions &&
      m.user &&
      !m.user.mod &&
      !isBroadcaster(m.user.username) &&
      (m.type === 'chat' || m.type === 'action')
  }

  function getBadge (name, version) {
    const b = vm.badges
    if (b && b[name] && b[name].versions && b[name].versions[version]) {
      return b[name].versions[version]
    }
  }

  function selectUsername (username) {
    session.selectedUser = username
    session.selectedUserChannel = vm.channel
  }

  function isBroadcaster (username) {
    return username.toLowerCase() === vm.channel.toLowerCase()
  }

  function delayedScroll () {
    setTimeout(scrollIfEnabled, 300)
    setTimeout(scrollIfEnabled, 600)
    setTimeout(scrollIfEnabled, 1200)
    setTimeout(scrollIfEnabled, 2400)
  }

  function handleEmoteHover () {
    $element.on('mouseenter', '.emoticon', e => {
      const emoticon = $(e.target)
      let tooltip = emoticon.data('emote-name')
      const description = emoticon.data('emote-description')

      if (description) tooltip += '<br>' + description
      showTooltip(emoticon, tooltip)
    })
  }

  function handleBadgeHover () {
    $element.on('mouseenter', '.badge', e => {
      const badge = $(e.target)
      const title = badge.data('title')
      showTooltip(badge, title)
    })
  }

  function showTooltip (el, content) {
    el.frosty({html: true, content})
    el.frosty('show')
    el.one('mouseleave', kill)
    setTimeout(kill, 3000)

    function kill () {
      el.frosty('hide')
      el.off()
    }
  }

  function scrollOnWindowResize () {
    window.addEventListener('resize', scrollIfEnabled)
  }

  /**
 * Turns autoscroll on and off based on user scrolling,
 * resets the max lines when autoscroll is turned back on,
 * shows all lines when scrolling up to the top (infinite scroll)
 */
  function watchUserScrolling () {
    $element.on('wheel', handler)

    function handler () {
      if (fetchingBacklog) return
      const before = session.autoScroll
      session.autoScroll = distanceFromBottom() === 0
      setTimeout(() => {
        session.autoScroll = distanceFromBottom() === 0
        if (before !== session.autoScroll) $scope.$apply()
        if (!session.autoScroll && distanceFromTop() === 0) getMoreBacklog()
      }, 250) // Wait until the scroll has actually happened
    }
  }

  /**
 * Causes ng-repeat to load all chat lines.
 * Makes sure the scrollbar doesn't jump to the
 * top when the new lines are added.
 */
  async function getMoreBacklog () {
    if (fetchingBacklog) return
    NProgress.start()
    fetchingBacklog = true
    const old = distanceFromBottom()
    await messages.getMoreBacklog(vm.channel)
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        scrollIfEnabled()
        NProgress.done()
        setTimeout(delayedScroll, 101)
        setTimeout(() => fetchingBacklog = false, 40) // Cooldown period
        e.scrollTop += distanceFromBottom() - old
      })
    })
  }

  function scrollIfEnabled () {
    if (session.autoScroll) scrollDown()
  }

  function scrollDown () {
    session.autoScroll = true
    e.scrollTop = e.scrollHeight
    setTimeout(() => e.scrollTop = e.scrollHeight, 0)
  }

  function scrollWhenTogglingSidebar () {
    $scope.$watch(
      () => settings.appearance.sidebarCollapsed,
      (a, b) => { if (a !== b) $timeout(scrollIfEnabled, 260) } // :(
    )
  }

  function handleNewMessages () {
    $scope.$watchCollection(
      () => vm.messages,
      () => {
        if (settings.appearance.split) addZebraStripingPropertyToMessages()
        setTimeout(scrollIfEnabled, 150)
        scrollIfEnabled()
      }
    )
  }

  function addZebraStripingPropertyToMessages () {
    const msgs = vm.messages
    for (let i = 0; i < msgs.length; i++) {
      if (msgs[i]._isOdd === undefined) {
        const current = msgs[i]
        if (i === 0) {
          current._isOdd = !current.fromBacklog
        } else {
          const previous = msgs[i - 1]
          current._isOdd = !previous._isOdd
          if (current.user && previous.user) {
            if (current.user.username === previous.user.username) {
              current._isOdd = previous._isOdd
            }
          }
        }
      }
    }
  }

  function distanceFromTop () {
    return Math.floor(e.scrollTop)
  }

  function distanceFromBottom () {
    const distance = e.scrollHeight - e.scrollTop - e.offsetHeight
    return Math.floor(Math.abs(distance))
  }

  function handleAnchorClicks () {
    $element.on('click', 'a', (event) => {
      event.preventDefault()
      event.stopPropagation()
      openExternal(event.target.getAttribute('href'))
      return false
    })
  }

  async function fetchBadges (attempt) {
    if (attempt) await sleep(2000)
    try {
      vm.badges = await badges(vm.channel)
    } catch (e) {
      if (attempt < 5) fetchBadges(attempt + 1)
    }
    $scope.$apply()
  }

  function calculateColor (color) {
    let lightness
    let colorRegex = /^#[0-9a-f]+$/i
    if (colorRegex.test(color)) {
      while ((
        (
          colors.calculateColorBackground(color) === 'light' &&
          settings.theme.dark
        ) || (
          colors.calculateColorBackground(color) === 'dark' &&
          !settings.theme.dark
        ))) {
        lightness = colors.calculateColorBackground(color)
        color = colors.calculateColorReplacement(color, lightness)
      }
    }
    return color
  }

  function messageClassesAsString (m) {
    const classPresence = {
      'from-backlog': m.fromBacklog,
      highlighted: m.highlighted,
      whisper: m.type === 'whisper',
      notification: m.type === 'notification',
      golden: m.golden,
      odd: m._isOdd
    }

    return Object.keys(classPresence)
      .filter(key => classPresence[key])
      .join(' ')
  }

  function messageInlineStyles (m) {
    return m.type === 'action'
      ? {'color': calculateColor(m.user.color)}
      : {}
  }

  function displayNameIsDifferent (m) {
    return m.user['display-name'].toLowerCase() !== m.user['username']
  }
}
