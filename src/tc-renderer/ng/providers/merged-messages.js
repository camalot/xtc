import angular from 'angular'
import channels from '../../lib/channels'
import messages from './messages'

angular.module('xtc').factory('merged-messages',
  ($rootScope, irc, highlights, session, settings) => {
    const merged = {}
    channels.channels.forEach((c) => {
      merged[c] = messages(c)
    })

    return merged
  })
