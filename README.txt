Halloween: Aplicació d’escriptori amb Electron

Instruccions per executar:

1. Instal·la Node.js: https://nodejs.org/
2. Obre una terminal i ves a la carpeta del projecte:
   cd "ruta/a/PAC2-Halloween"
3. Instal·la les dependències:
   npm install
4. Arrenca l’aplicació:
   npm start

Notes:
- L’aplicació s’obrirà en pantalla completa (kiosk mode).
- Si vols fer debug, pots activar DevTools a main.js:
    mainWindow.webContents.openDevTools({ mode: 'detach' });

