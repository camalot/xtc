import angular from 'angular'

angular.module('xtc').factory('manifest', function () {
  return require('../../../package.json')
})
