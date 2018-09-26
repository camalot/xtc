import angular from 'angular'
import ngMaterial from 'angular-material'
import ngSanitize from 'angular-sanitize'
import mobxAngular from 'mobx-angularjs'
import 'angular-material/angular-material.css'

const app = angular.module('xtc', [ngMaterial, ngSanitize, mobxAngular])

// Set default controllerAs for components to 'vm' instead of '$ctrl'
const componentUsingVm = angular.module('xtc').component
angular.module('xtc').component = function component (name, options) {
  return componentUsingVm(name, angular.extend({controllerAs: 'vm'}, options))
}

app.controller('main', ($scope, session, irc, store) => {
  $scope.session = session
  $scope.store = store

  $scope.needLogin = () => {
    return !irc.credentialsValid() || irc.badLogin
  }

  $scope.expanded = () => {
    return !store.settings.state.appearance.sidebarCollapsed
  }

  $scope.showingThumbnail = () => {
    return $scope.expanded() && store.settings.state.appearance.thumbnail
  }
})

/** Eagerly load stuff */
app.run((messages, notifications) => {})

app.config(($compileProvider) => $compileProvider.debugInfoEnabled(false))
