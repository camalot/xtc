import electron from 'electron'

export default () => {
  if (process.platform !== 'darwin') return
  let Menu = electron.remote.Menu

  let template = [
    {
      label: 'xTc',
      submenu: [
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: function () {
            electron.remote.app.quit()
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          role: 'undo'
        },
        {
          label: 'Redo',
          accelerator: 'Shift+CmdOrCtrl+Z',
          role: 'redo'
        },
        {
          type: 'separator'
        },
        {
          label: 'Cut',
          accelerator: 'CmdOrCtrl+X',
          role: 'cut'
        },
        {
          label: 'Copy',
          accelerator: 'CmdOrCtrl+C',
          role: 'copy'
        },
        {
          label: 'Paste',
          accelerator: 'CmdOrCtrl+V',
          role: 'paste'
        },
        {
          label: 'Select All',
          accelerator: 'CmdOrCtrl+A',
          role: 'selectall'
        }
      ]
    }
  ]

  let menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}
