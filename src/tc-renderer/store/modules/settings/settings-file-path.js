import path from 'path'
import electron from 'electron'

console.log(
  path.resolve(electron.remote.app.getPath('userData'), 'settings.json')
)
export const settingsFilePath = path.resolve(
  electron.remote.app.getPath('userData'),
  'settings.json'
)
