const { app, BrowserWindow, dialog } = require("electron");

// 保持对window对象的全局引用，如果不这么做的话，当JavaScript对象被
// 垃圾回收的时候，window对象将会自动的关闭
let win;

function createWindow() {
  // 创建浏览器窗口。
  win = new BrowserWindow({
    width: 860,
    height: 785,
    frame: true,
    autoHideMenuBar: true,
    icon: "/home/gitopen/Syncthing/Projects/WebProjects/webwechat/assets/img/appIcon/appicon.png",
  });
  let browserWindow = win;
  // TODO 打开调试工具
  // browserWindow.webContents.openDevTools();

  const store = new (require("electron-store"))();
  const sessionCookieStoreKey = "cookies.mainWindow";
  let promise = new Promise((resolve) => {
    let cookies = store.get(sessionCookieStoreKey) || [];
    let recoverTimes = cookies.length;
    if (recoverTimes <= 0) {
      //无cookie数据无需恢复现场
      resolve();
      return;
    }
    //恢复cookie现场
    cookies.forEach((cookiesItem) => {
      let { secure = false, domain = "", path = "" } = cookiesItem;

      browserWindow.webContents.session.cookies
        .set(
          Object.assign(cookiesItem, {
            url:
              (secure ? "https://" : "http://") +
              domain.replace(/^\./, "") +
              path,
          })
        )
        .then(() => {})
        .catch((e) => {
          console.error({
            message: "恢复cookie失败",
            cookie: cookiesItem,
            errorMessage: e.message,
          });
        })
        .finally(() => {
          recoverTimes--;
          if (recoverTimes <= 0) {
            resolve();
          }
        });
    });
  });

  promise.then(() => {
    //监听cookie变化保存cookie现场
    return new Promise((resolve) => {
      let isCookiesChanged = false;
      browserWindow.webContents.session.cookies.on("changed", () => {
        //检测cookies变动事件，标记cookies发生变化
        isCookiesChanged = true;
      });

      //每隔500毫秒检查是否有cookie变动，有变动则进行持久化
      setInterval(() => {
        if (!isCookiesChanged) {
          return;
        }
        browserWindow.webContents.session.cookies
          .get({})
          .then((cookies) => {
            store.set(sessionCookieStoreKey, cookies);
          })
          .catch((error) => {
            console.log({ error });
          })
          .finally(() => {
            isCookiesChanged = false;
          });
      }, 500);

      resolve();
    });
  });

  // 然后加载应用的 index.html。
  win.loadURL("https://wx2.qq.com");
  //   win.loadFile("index.html");

  // 打开开发者工具
  // win.webContents.openDevTools();

  // 当 window 被关闭，这个事件会被触发。
  // win.on("closed", () => {
  //     // 取消引用 window 对象，如果你的应用支持多窗口的话，
  //     // 通常会把多个 window 对象存放在一个数组里面，
  //     // 与此同时，你应该删除相应的元素。
  //     win = null;
  // });

  /***
   * 关闭窗口前提示确认信息
   */
  win.on("close", (e) => {
    e.preventDefault(); //阻止默认行为，一定要有
    dialog
      .showMessageBox({
        type: "info",
        title: "Information",
        cancelId: 2,
        defaultId: 0,
        message: "确定要关闭吗？",
        buttons: ["最小化", "直接退出"],
      })
      .then((result) => {
        if (result.response == 0) {
          e.preventDefault(); //阻止默认行为，一定要有
          win.minimize(); //调用 最小化实例方法
        } else if (result.response == 1) {
          win = null;
          //app.quit();	//不要用quit();试了会弹两次
          app.exit(); //exit()直接关闭客户端，不会执行quit();
        }
      })
      .catch((err) => {
        console.log(err);
      });
  });
}

// Electron 会在初始化后并准备
// 创建浏览器窗口时，调用这个函数。
// 部分 API 在 ready 事件触发后才能使用。
app.on("ready", createWindow);

// 当全部窗口关闭时退出。
app.on("window-all-closed", () => {
  // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
  // 否则绝大部分应用及其菜单栏会保持激活。
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // 在macOS上，当单击dock图标并且没有其他窗口打开时，
  // 通常在应用程序中重新创建一个窗口。
  if (win === null) {
    createWindow();
  }
});

// 在这个文件中，你可以续写应用剩下主进程代码。
// 也可以拆分成几个文件，然后用 require 导入。
