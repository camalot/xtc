import angular from 'angular'
import channels from '../../lib/channels'

angular.module('xtc').factory('mergedMessages',
  ($rootScope, irc, highlights, session, messages, settings) => {
    let result = []
    channels.channels.forEach((c) => {
      let m = messages(c).messages
      console.log(m)
      result = result.concat(m)
    })
    console.log(result)
    return result
  })
