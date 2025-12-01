export default defineAppConfig({
    pages: [
        'pages/index/index',
        'pages/compare/index',
        'pages/result/index'
    ],
    window: {
        backgroundTextStyle: 'light',
        navigationBarBackgroundColor: '#3b82f6',
        navigationBarTitleText: '数表通',
        navigationBarTextStyle: 'white',
        backgroundColor: '#f5f7fa'
    },
    // tabBar 暂时注释，需要时可以添加图标后启用
    // tabBar: {
    //   color: '#666',
    //   selectedColor: '#3b82f6',
    //   backgroundColor: '#ffffff',
    //   borderStyle: 'black',
    //   list: [
    //     {
    //       pagePath: 'pages/index/index',
    //       text: '首页'
    //     },
    //     {
    //       pagePath: 'pages/compare/index',
    //       text: '对比'
    //     }
    //   ]
    // },
    permission: {
        'scope.writePhotosAlbum': {
            desc: '需要保存导出的Excel文件到相册'
        }
    }
})
