import angular from 'angular'
import store from '../../store'

angular.module('xtc').constant('settings', store.settings.state)
