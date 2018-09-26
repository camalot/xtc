import angular from 'angular'
import electron from 'electron'

angular.module('xtc').factory('openExternal', () => {
  return (link) => electron.shell.openExternal(link)
})
